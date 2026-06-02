import { BootstrapContext } from '../../bootstrap/types';
import {
  CONTRACTS_COLLECTION,
} from '../../shared/contracts/constants';
import { addReverseRelatedContracts, moveFileToContractsFolder } from './shared';
import { generateContractId } from './contractIdGenerator';

export async function contractCreatingHandler(
  meta: Record<string, any>,
  context: BootstrapContext,
): Promise<void> {
  const accountability = meta?.accountability ?? context?.accountability ?? context.accountability;

  const schema = await context.getSchema({ database: context.database });
  const { ItemsService } = context.services;
  const contractsService = new ItemsService(CONTRACTS_COLLECTION, {
    accountability: { ...accountability, admin: true },
    schema,
  });

  const contractKey = meta?.key;
  if (!contractKey) {
    context.logger?.error('Contract creation handler called without contract key');
    return;
  }

  try {
    const createdContract = await contractsService.readOne(contractKey, {
      fields: ['other_party_type', 'employee', 'partner'],
    });

    const contractMeta = {
      ...meta,
      payload: {
        ...meta?.payload,
        other_party_type: createdContract?.other_party_type ?? meta?.payload?.other_party_type,
        employee: createdContract?.employee ?? meta?.payload?.employee,
        partner: createdContract?.partner ?? meta?.payload?.partner,
      },
    };

    const generatedContractId = await generateContractId(contractMeta, context);

    context.logger?.info(
      `Generated contract ID: ${generatedContractId} for contract ${contractKey}`,
    );

    await contractsService.updateOne(contractKey, {
      contract_id: generatedContractId,
    });

    await addReverseRelatedContracts(meta, context);
    await moveFileToContractsFolder(meta, context, contractsService, schema, generatedContractId);
  } catch (error) {
    context.logger?.error(
      `Error in contract creation handler for contract ${contractKey}: ${error}`,
    );
    throw error;
  }
}
