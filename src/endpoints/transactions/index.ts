import { defineEndpoint } from '@directus/extensions-sdk';
import { Accountability } from '@directus/types/dist/accountability';
import { Knex } from 'knex';

const incomeFields = [
  'incomes.id as id',
  'incomes.name as name',
  'incomes.amount as amount',
  'incomes.payment_due_date as payment_due_date',
  'incomes.payment_date as paid_at',
  'currencies.short_name',
  'incomes.income_type as type',
  'accounts.account_name',
];

const expenseFields = [
  'expenses.id as id',
  'expenses.name as name',
  'expenses.amount as amount',
  'expenses.payment_due_date as payment_due_date',
  'expenses.payment_date as paid_at',
  'currencies.short_name',
  'expenses.expense_type as type',
  'accounts.account_name',
];

const franchiseAdminRoleName = 'Franchise admin';
const supervisorRoleName = 'Supervisor';
const washingLocationsCollection = 'washing_location';

export default defineEndpoint({
  id: 'erp',
  handler: (router, context) => {
    const { services, getSchema, database } = context;
    router.get('/transactions', async (_req, res) => {
      try {
        const accountability: Accountability | null =
          'accountability' in _req ? (_req.accountability as Accountability) : null;

        if (!accountability?.user || !accountability?.role) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const schema = await getSchema();
        const roleName = await getRoleName(services, schema, accountability);
        if (
          !roleName ||
          (roleName !== franchiseAdminRoleName &&
            roleName !== supervisorRoleName &&
            !accountability.admin)
        ) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const filter = _req.query.filter;
        const locationId = await getFilterLocationId(filter);
        if (!locationId) {
          return res.status(400).json({ error: 'Invalid location filter' });
        }

        const hasAccessToLocation =
          await checkUserRelationToLocation(
            accountability.user,
            locationId,
            roleName,
            services,
            schema,
            accountability,
          ) || accountability.admin;

        if (!hasAccessToLocation) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        // limit and offset
        const limit =
          _req.query.limit && typeof _req.query.limit === 'string'
            ? parseInt(_req.query.limit)
            : -1;
        const offset =
          _req.query.offset && typeof _req.query.offset === 'string'
            ? parseInt(_req.query.offset)
            : 0;

        const incomeQuery = database('incomes')
          .leftJoin('currencies', 'incomes.currency', '=', 'currencies.id')
          .leftJoin('accounts', 'incomes.account', '=', 'accounts.id')
          .select(incomeFields)
          .select(database.raw(`'incomes' as source`));

        const expenseQuery = database('expenses')
          .leftJoin('currencies', 'expenses.currency', '=', 'currencies.id')
          .leftJoin('accounts', 'expenses.account', '=', 'accounts.id')
          .select(expenseFields)
          .select(database.raw(`'expenses' as source`));

        for (const [field, condition] of Object.entries(filter!)) {
          if (
            condition &&
            typeof condition === 'object' &&
            '_eq' in condition &&
            condition._eq !== undefined
          ) {
            incomeQuery.where(field, String(condition._eq));
            expenseQuery.where(field, String(condition._eq));
          }
        }

        // search
        if (_req.query.search) {
          incomeQuery.where('incomes.name', 'ilike', `%${_req.query.search}%`);
          expenseQuery.where('expenses.name', 'ilike', `%${_req.query.search}%`);
        }

        // sort
        const sort =
          _req.query.sort && typeof _req.query.sort === 'string'
            ? _req.query.sort
            : 'payment_due_date';
        const direction = sort.startsWith('-') ? 'desc' : 'asc';
        const field = sort.replace('-', '');

        const transactionsQuery = database
          .unionAll([incomeQuery, expenseQuery], true)
          .orderBy(field, direction)
          .offset(offset);

        if (limit !== -1) {
          transactionsQuery.limit(limit);
        }

        const data = await transactionsQuery;

        // meta
        const countResult = await database
          .count<{ total: string | number }[]>('* as total')
          .from(function (this: Knex.QueryBuilder) {
            this.unionAll([incomeQuery.clone(), expenseQuery.clone()]).as('combined');
          })
          .first();

        const totalCount = Number(countResult?.total ?? 0);

        res.json({
          data,
          total: totalCount,
        });
      } catch (error) {
        console.error('Failed to fetch transactions', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
      }
    });
  },
});

async function getRoleName(
  services: any,
  schema: any,
  accountability: any,
): Promise<string | null> {
  try {
    const rolesService = new services.RolesService({
      schema,
      accountability,
    });

    const role = await rolesService.readOne(accountability.role);

    return role ? role.name : null;
  } catch (error) {
    console.error(`Failed to fetch role with ID ${accountability.role}:`, error);
    return null;
  }
}

async function getFilterLocationId(filter: any): Promise<string | null> {
  if (!filter || typeof filter !== 'object' || !('location' in filter)) {
    console.warn('Failed to fetch transactions: location filter is required');
    return null;
  }

  const locationFilter = filter.location;
  if (typeof locationFilter !== 'object' || !('_eq' in locationFilter)) {
    console.warn('Failed to fetch transactions: invalid location filter');
    return null;
  }

  return String(locationFilter._eq);
}

async function checkUserRelationToLocation(
  userId: string | null,
  locationId: string,
  roleName: string,
  service: any,
  schema: any,
  accountability: any,
): Promise<boolean> {
  if (!userId) {
    return false;
  }

  const usersFranchises = await getUserFranchises(userId, service, schema, accountability);
  const washingLocation = await getWashingLocation(locationId, service, schema, accountability);
  if (!washingLocation || !usersFranchises) {
    return false;
  }

  if (roleName === franchiseAdminRoleName) {
    return washingLocation.franchise && usersFranchises.length > 0
      ? usersFranchises.includes(washingLocation.franchise)
      : false;
  } else if (roleName === supervisorRoleName) {
    return washingLocation.supervisor ? washingLocation.supervisor === locationId : false;
  }

  return false;
}

async function getWashingLocation(
  locationId: string,
  services: any,
  schema: any,
  accountability: any,
): Promise<{ franchise: string | null; supervisor: string | null } | null> {
  try {
    const { ItemsService } = services;
    const washingLocationsService = new ItemsService(washingLocationsCollection, {
      schema: schema,
      accountability: accountability,
    });

    const location = await washingLocationsService.readOne(locationId, {
      fields: ['franchise', 'supervisor'],
    });
    return location ?? null;
  } catch (error) {
    console.error(`Failed to fetch washing location with ID ${locationId}:`, error);
    return null;
  }
}

async function getUserFranchises(
  userId: string,
  services: any,
  schema: any,
  accountability: any,
): Promise<string[] | null> {
  try {
    const usersService = new services.UsersService({
      schema,
      accountability,
    });

    const user = await usersService.readOne(userId, {
      fields: ['franchise.franchise_id'],
    });

    const franchises = user?.franchise?.map((f: any) => f.franchise_id) ?? [];

    return franchises.length > 0 ? franchises : null;
  } catch (error) {
    console.error(`Failed to fetch user with ID ${userId}:`, error);
    return null;
  }
}
