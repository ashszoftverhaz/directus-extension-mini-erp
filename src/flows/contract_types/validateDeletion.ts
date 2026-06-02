import type { BootstrapContext } from '../../bootstrap/types';
import { CONTRACTS_COLLECTION } from '../../shared/contracts/constants';

/**
 * Validates that a contract type can be deleted by checking if any contracts reference it
 * Throws an error if contracts exist that reference the contract type(s) being deleted
 */
export async function validateContractTypeDeletion(
  keys: string | string[],
  context: BootstrapContext,
): Promise<void> {
  const contractTypeIds = Array.isArray(keys) ? keys : [keys];

  if (contractTypeIds.length === 0) return;

  const schema = await context.getSchema({ database: context.database });
  const { ItemsService } = context.services;

  const contractsService = new ItemsService(CONTRACTS_COLLECTION, {
    accountability: { admin: true },
    schema,
  });

  const contracts = await contractsService.readByQuery({
    filter: {
      contract_type: {
        _in: contractTypeIds,
      },
    },
    limit: 1,
    fields: ['id'],
  });

  if (contracts && Array.isArray(contracts) && contracts.length > 0) {
    throw new Error('The contract type cannot be deleted because active contracts are using it.');
  }
}
