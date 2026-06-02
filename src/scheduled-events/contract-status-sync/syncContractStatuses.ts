import { computeContractStatus } from '../../shared/contracts/contractStatus';
import type { JobContext } from '../shared/types';

type ContractRow = {
  id: string;
  status: string | null;
  signed_at: string | Date | null;
  expiry_date: string | Date | null;
};

export async function syncContractStatuses(context: JobContext): Promise<void> {
  const { logger } = context;
  logger.info('[ERP contract status sync] started.');

  try {
    const schema = await context.getSchema({ database: context.database });
    const { ItemsService } = context.services;

    const contractsService = new ItemsService('contracts', {
      accountability: { admin: true },
      schema,
    });

    const contracts = (await contractsService.readByQuery({
      fields: ['id', 'status', 'signed_at', 'expiry_date'],
      limit: -1,
    })) as ContractRow[] | null;

    const rows = Array.isArray(contracts) ? contracts : [];
    let updated = 0;

    for (const row of rows) {
      const next = computeContractStatus({
        signedAt: row.signed_at,
        expiryDate: row.expiry_date,
      });

      if ((row.status ?? null) === next) continue;

      await contractsService.updateOne(row.id, { status: next });
      updated += 1;
    }

    logger.info(`[ERP contract status sync] finished. Updated ${updated} contract(s).`);
  } catch (error) {
    context.logger.error('[ERP contract status sync] failed.', error);
  }
}

