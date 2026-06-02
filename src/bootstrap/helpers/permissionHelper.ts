import { PermissionEntry, Permissions } from '../types';

export interface PolicyParameters {
  policyName: string;
  policyIcon: string;
  policyDescription: string;
  policyService: any;
  logger: any;
}

export async function createPermissionIfNotExists(
  permissionsService: any,
  policyId: string,
  entry: PermissionEntry,
): Promise<void> {
  const existingPermissions = await permissionsService.readByQuery({
    filter: {
      policy: { _eq: policyId },
      collection: { _eq: entry.collection },
      action: { _eq: entry.action },
    },
    limit: 1,
  });

  const alreadyExists = Array.isArray(existingPermissions) && existingPermissions.length > 0;
  if (alreadyExists) return;

  await permissionsService.createOne({
    policy: policyId,
    collection: entry.collection,
    action: entry.action,
    fields: entry.fields ?? ['*'],
    permissions: entry.permissions ?? null,
    validation: entry.validation ?? null,
    presets: entry.presets ?? null,
  });
}

export async function addPermissionsToPolicy(
  permissionsService: any,
  policyId: string,
  permissions: Permissions,
): Promise<void> {
  for (const entry of permissions) {
    await createPermissionIfNotExists(permissionsService, policyId, entry);
  }
}

export async function addAccessPolicyToRole(
  accessService: any,
  policyId: string,
  roleId: string,
): Promise<void> {
  const existingAccess = await accessService.readByQuery({
    filter: {
      policy: { _eq: policyId },
      role: { _eq: roleId },
    },
    limit: 1,
  });
  const alreadyExists = Array.isArray(existingAccess) && existingAccess.length > 0;
  if (alreadyExists) return;

  await accessService.createOne({ role: roleId, policy: policyId });
}

export async function getRoleIdByName(roleService: any, roleName: string): Promise<string> {
  const existingRoles = await roleService.readByQuery({
    filter: { name: { _eq: roleName } },
    limit: 1,
  });

  if (Array.isArray(existingRoles) && existingRoles.length > 0) {
    return existingRoles[0].id;
  }

  const newRole = await roleService.createOne({ name: roleName });
    return newRole.id;
}

export async function createPolicyIfNotExists(params: PolicyParameters): Promise<string> {
    const { policyName, policyIcon, policyDescription, policyService, logger } = params;
    const existingErpPolicies = await policyService.readByQuery({
      filter: { name: { _eq: policyName } },
      limit: 1,
    });
    const existingErpPolicy = Array.isArray(existingErpPolicies) ? existingErpPolicies[0] : null;
  
    let policyId: string;
    if (existingErpPolicy) {
      logger.info(`${policyName} policy already exists!`);
      policyId = existingErpPolicy.id;
    } else {
      policyId =
        existingErpPolicy?.id ??
        (await policyService.createOne({
          name: policyName,
          icon: policyIcon,
          description: policyDescription,
          admin_access: false,
          app_access: true,
        }));
      logger.info(`${policyName} policy created!`);
    }
    return policyId;
}
