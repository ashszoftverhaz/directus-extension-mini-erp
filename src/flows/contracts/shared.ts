import { createFolder } from "../../bootstrap/helpers/folderCreationHelper";
import { BootstrapContext } from "../../bootstrap/types";
import { CONTRACT_FILE_FIELDS, CONTRACTS_FOLDER, ERP_ROOT_FOLDER, extractFileIds, FRANCHISE_FOLDER_SUFFIX } from "../../shared/contracts/constants";

export async function addReverseRelatedContracts(meta: Record<string, any>, context: BootstrapContext): Promise<void> {
    const relatedContractIds = getConnectedContractIds(meta);
    if (relatedContractIds.length === 0) return;

    const { ItemsService } = context.services;
    const contractsContractsService = new ItemsService('contracts_contracts', {
        accountability: { ...context.accountability, admin: true },
        schema: await context.getSchema({ database: context.database }),
    });

    const contractsId = meta?.key ?? meta.payload.related_contracts.create[0].contracts_id;
    if (!contractsId) return;

    await contractsContractsService.createMany(relatedContractIds.map((relatedContractId) => ({
        contracts_id: relatedContractId,
        related_contracts_id: contractsId,
    })));
}

function getConnectedContractIds(meta: Record<string, any>): string[] {
    if (meta?.payload?.related_contracts &&
        meta.payload.related_contracts.create &&
        meta.payload.related_contracts.create.length > 0) {

        return meta.payload.related_contracts.create.map((item: any) => item.related_contracts_id.id);
    };
    return [];
}

export async function removeReverseRelatedContracts(meta: Record<string, any>, context: BootstrapContext): Promise<void> {
    const isRelatedContractsRemoved = meta?.payload?.related_contracts &&
        meta.payload.related_contracts.delete &&
        meta.payload.related_contracts.delete.length > 0;
        
    if (!isRelatedContractsRemoved) return;
    const contractsConstractsIds = meta.payload.related_contracts.delete.map((item: any) => item);
    if (!contractsConstractsIds || contractsConstractsIds.length === 0) return; 
    if (!meta?.keys[0]) return; 
    const contractId = meta.keys[0]; 
    
    const contractsContractsService = new context.services.ItemsService('contracts_contracts', {
        accountability: { ...context.accountability, admin: true },
        schema: await context.getSchema({ database: context.database }),
    });

    const relatedContractsId = await contractsContractsService.readByQuery({
        filter: {
            id: { _in: contractsConstractsIds },
        },
        fields: ['related_contracts_id'],
    }); 
    
    if (!relatedContractsId || relatedContractsId.length === 0) return;

    const itemsToDelete = await contractsContractsService.readByQuery({
        filter: {
            _and: [
                { related_contracts_id: { _eq: contractId } },
                { contracts_id: { _in: relatedContractsId.map((item: any) => item.related_contracts_id) } },
            ],
        },
    }); 

    await contractsContractsService.deleteMany(itemsToDelete.map((item: any) => item.id));
}

export async function moveFileToContractsFolder(
  meta: Record<string, any>,
  context: BootstrapContext,
  contractsService: any,
  schema: any,
  contractId: string,
): Promise<void> {
  const filesService = new context.services.ItemsService('directus_files', {
    accountability: { ...context.accountability, admin: true },
    schema,
  });

  const folderStructure: string[] = await createFolderStructureForContract(
    context,
    contractId,
    contractsService,
  );
  if (folderStructure.length === 0) {
    context.logger?.warn(`No folder structure created for contract ${contractId}`);
    return;
  }

  const folderId = await ensureFolders(folderStructure, context);

  const fileIds = await getFileIds(meta, contractsService);

  for (const fileId of fileIds) {
    await filesService.updateOne(fileId, { folder: folderId });
  }
}

async function getFileIds(meta: Record<string, any>, contractsService: any): Promise<string[]> {
  let fileIds = extractFileIds(meta?.payload, CONTRACT_FILE_FIELDS);

  if (fileIds.length === 0) {
    const created = await contractsService.readOne(meta.key, {
      fields: [...CONTRACT_FILE_FIELDS],
    });
    fileIds = extractFileIds(created as Record<string, unknown> | null, CONTRACT_FILE_FIELDS);
  }

  if (fileIds.length === 0) return [];
  return fileIds;
}

async function ensureFolders(
  folderStructure: string[],
  context: BootstrapContext,
): Promise<string> {
  let folderId = await createFolder(context, ERP_ROOT_FOLDER);

  while (folderId && folderStructure.length > 0) {
    const folderName = folderStructure.pop()!;
    folderId = await createFolder(context, folderName, { parentId: folderId.id });
  }

  if (!folderId) {
    throw new Error(`Failed to create folder structure: ${folderStructure.join(' > ')}`);
  }

  return folderId.id;
}

async function createFolderStructureForContract(
  context: BootstrapContext,
  contractId: string,
  contractsService: any,
): Promise<string[]> {
  const contract = await contractsService.readByQuery({
    filter: { contract_id: { _eq: contractId } },
    fields: [
      'other_party_type',
      'employee.account.first_name',
      'employee.account.last_name',
      'partner.name',
      'franchise.name',
    ],
  });

  if (!contract || (!Array.isArray(contract) && contract.length === 0)) {
    context.logger?.error(`Contract with ID ${contractId} not found for folder structure creation`);
    return [];
  }

  const folderStructure: string[] = [];
  if (
    contract[0].other_party_type &&
    contract[0].other_party_type === 'employee' &&
    contract[0].employee !== null
  ) {
    folderStructure.push(`${contract[0].employee.account.first_name} ${contract[0].employee.account.last_name}`);
  }

  if (
    contract[0].other_party_type &&
    contract[0].other_party_type === 'partner' &&
    contract[0].partner !== null
  ) {
    folderStructure.push(contract[0].partner.name);
  }

  folderStructure.push(CONTRACTS_FOLDER);

  if (contract[0].franchise && contract[0].franchise.name) {
    folderStructure.push(`${contract[0].franchise.name}${FRANCHISE_FOLDER_SUFFIX}`);
  }

  return folderStructure;
}
