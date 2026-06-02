import { BootstrapContext } from '../../bootstrap/types';
import { CONTRACTS_COLLECTION } from '../../shared/contracts/constants';
import {
  addReverseRelatedContracts,
  moveFileToContractsFolder,
  removeReverseRelatedContracts,
} from './shared';

export async function contractUpdatingHandler(
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
  await addReverseRelatedContracts(meta, context);
  await removeReverseRelatedContracts(meta, context);

  const contract = await contractsService.readByQuery({
    filter: { id: { _eq: meta?.key } },
    fields: [
      'contract_id',
    ],
  });

  const generatedContractId = contract?.[0]?.contract_id ?? '';
  await moveFileToContractsFolder(meta, context, contractsService, schema, generatedContractId);
}
