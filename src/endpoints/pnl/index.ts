import { defineEndpoint } from '@directus/extensions-sdk';
import { getIncomeStatementView } from './pnlService';
import type { PeriodGrouping } from './pnlTypes';
import { Accountability } from '@directus/types';

const franchiseAdminRoleName = 'Franchise admin';
const supervisorRoleName = 'Supervisor';

/** Type guard for the `periodGrouping` query param */
function isPeriodGrouping(value: unknown): value is PeriodGrouping {
  return value === 'monthly' || value === 'quarterly' || value === 'yearly';
}

/** Parses a date query param into a Date (or returns null) */
function parseDateParam(value: unknown): Date | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default defineEndpoint({
  id: 'erp-pnl',
  handler: (router, context) => {
    const { services, getSchema } = context;
    router.get('/income-statement', async (req: any, res: any) => {
      try {
        const accountability: Accountability | null =
          'accountability' in req ? (req.accountability as Accountability) : null;

        if (!accountability?.user || !accountability?.role) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const { RolesService } = services;
        const schema = await getSchema();
        const rolesService = new RolesService({
          schema,
          accountability,
        });
        const role = await rolesService.readOne(accountability.role);

        if (
          !role ||
          (role.name !== franchiseAdminRoleName &&
            role.name !== supervisorRoleName &&
            !accountability.admin)
        ) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const startingDate = parseDateParam(req.query.startingPeriod);
        const periodGroupingRaw = req.query.periodGrouping;

        if (!startingDate) {
          return res.status(400).json({ error: 'Missing or invalid startingPeriod' });
        }

        if (!isPeriodGrouping(periodGroupingRaw)) {
          return res.status(400).json({ error: 'Missing or invalid periodGrouping' });
        }

        const result = await getIncomeStatementView({
          services,
          schema,
          accountability,
          startingDate,
          periodGrouping: periodGroupingRaw,
        });

        return res.json(result);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[erp-pnl] Failed to compute income statement', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });
  },
});
