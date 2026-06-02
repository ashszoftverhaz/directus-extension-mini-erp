import type { HookContext } from './types';
import type { FranchiseAdminInfo } from './types';

// DEV-ONLY for testing: When non-null, all contract expiration notifications will go to this address
const DEV_TEST_RECIPIENT_EMAIL: string | null = null;

/**
 * Checks if the contracts collection has a franchise field in the schema
 */
async function contractsHaveFranchiseField(context: HookContext): Promise<boolean> {
  const schema = await context.getSchema({ database: context.database });
  const contractsCollection = schema?.collections?.contracts;
  if (!contractsCollection?.fields) return false;
  return Object.prototype.hasOwnProperty.call(contractsCollection.fields, 'franchise');
}

/**
 * Finds the notification recipient for a contract
 * - Dev override: if DEV_TEST_RECIPIENT_EMAIL is set, always use it
 * - Franchise path: if contracts have franchise field and contract has franchise, find franchise admin
 * - Fallback: super admin email
 *
 * @param context - Hook context
 * @param contract - Contract with optional franchise
 * @returns Object with email and language, or null if not found
 */
export async function getContractExpirationNotificationRecipient(
  context: HookContext,
  contract: {
    franchise?: string | { id?: string } | null;
  },
): Promise<FranchiseAdminInfo | null> {
  if (DEV_TEST_RECIPIENT_EMAIL) {
    context.logger?.info(
      `[Contract Expiration] DEV: Using override email ${DEV_TEST_RECIPIENT_EMAIL}`,
    );
    return { email: DEV_TEST_RECIPIENT_EMAIL, language: null };
  }
  const hasFranchiseField = await contractsHaveFranchiseField(context);

  if (hasFranchiseField && contract.franchise) {
    const franchiseId =
      typeof contract.franchise === 'string'
        ? contract.franchise
        : (contract.franchise?.id ?? null);

    if (franchiseId) {
      const franchiseAdmin = await findFranchiseAdminByFranchiseId(context, franchiseId);
      if (franchiseAdmin) return franchiseAdmin;
    }
  }

  // Fallback: super admin
  return getSuperAdminEmail(context);
}

async function findFranchiseAdminByFranchiseId(
  context: HookContext,
  franchiseId: string,
): Promise<FranchiseAdminInfo | null> {
  const database = context.database;
  const franchiseAdmin = await database('franchise_directus_users')
    .leftJoin('directus_users', 'franchise_directus_users.directus_users_id', 'directus_users.id')
    .where('franchise_directus_users.franchise_id', franchiseId)
    .whereNotNull('directus_users.email')
    .select('directus_users.email', 'directus_users.language')
    .first();

  if (franchiseAdmin?.email) {
    return {
      email: franchiseAdmin.email,
      language: franchiseAdmin.language || null,
    };
  }

  return null;
}

async function getSuperAdminEmail(context: HookContext): Promise<FranchiseAdminInfo | null> {
  const database = context.database;

  // Find Administrator role by name
  const adminRole = await database('directus_roles')
    .where('name', 'Administrator')
    .select('id')
    .first();

  if (!adminRole?.id) {
    return null;
  }

  const adminRoleId = adminRole.id;
  const superAdmin = await database('directus_users')
    .where('role', adminRoleId)
    .whereNotNull('email')
    .select('email', 'language')
    .orderBy('id')
    .first();

  if (superAdmin?.email) {
    return {
      email: superAdmin.email,
      language: superAdmin.language || null,
    };
  }

  return null;
}
