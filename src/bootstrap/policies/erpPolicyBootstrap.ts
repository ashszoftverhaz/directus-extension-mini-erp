import type { BootstrapContext } from '../types';
import {
  addAccessPolicyToRole,
  addPermissionsToPolicy,
  createPolicyIfNotExists,
  getRoleIdByName,
} from '../helpers/permissionHelper';

import {
  ERP_FRANCHISE_ADMIN_POLICY_DESCRIPTION,
  ERP_FRANCHISE_ADMIN_POLICY_ICON,
  ERP_FRANCHISE_ADMIN_POLICY_NAME,
  ERP_POLICY_DESCRIPTION,
  ERP_POLICY_ICON,
  ERP_POLICY_NAME,
  ERP_SUPERVISOR_POLICY_DESCRIPTION,
  ERP_SUPERVISOR_POLICY_ICON,
  ERP_SUPERVISOR_POLICY_NAME,
  FRANCHISE_ADMIN_ROLE_NAME,
  SUPERVISOR_ROLE_NAME,
} from './names';
import {
  franchisePermissions,
  fullAccessPermissions,
  generalPermissions,
  supervisorPermissions,
} from './permissons';

type PolicyContext = Pick<
  BootstrapContext,
  'services' | 'logger' | 'database' | 'accountability' | 'getSchema'
>;

export async function bootstrapErpPolicy(
  context: PolicyContext,
  franchiseCollectionExists: boolean,
  washingLocationExists: boolean,
): Promise<void> {
  const { services, logger, accountability, getSchema } = context;
  const { PoliciesService, PermissionsService, AccessService, RolesService } = services;

  const schema = await getSchema();
  const policyService = new PoliciesService({
    accountability: { ...accountability, admin: true },
    schema,
  });
  const permissionsService = new PermissionsService({
    accountability: { ...accountability, admin: true },
    schema,
  });
  const accessService = new AccessService({
    accountability: { ...accountability, admin: true },
    schema,
  });
  const roleService = new RolesService({
    accountability: { ...accountability, admin: true },
    schema,
  });

  logger.info('[ERP bootstrap] Policy bootstrap started.');

  const erpPolicyId = await createPolicyIfNotExists({
    policyName: ERP_POLICY_NAME,
    policyIcon: ERP_POLICY_ICON,
    policyDescription: ERP_POLICY_DESCRIPTION,
    policyService,
    logger,
  });

  if (!franchiseCollectionExists && !washingLocationExists) {
    await addPermissionsToPolicy(permissionsService, erpPolicyId, fullAccessPermissions);
    return;
  }
  
  await addPermissionsToPolicy(permissionsService, erpPolicyId, generalPermissions);

  const erpFranchisePolicyId = await createPolicyIfNotExists({
    policyName: ERP_FRANCHISE_ADMIN_POLICY_NAME,
    policyIcon: ERP_FRANCHISE_ADMIN_POLICY_ICON,
    policyDescription: ERP_FRANCHISE_ADMIN_POLICY_DESCRIPTION,
    policyService,
    logger,
  });
  await addPermissionsToPolicy(permissionsService, erpFranchisePolicyId, franchisePermissions);

  const erpSupervisorPolicyId = await createPolicyIfNotExists({
    policyName: ERP_SUPERVISOR_POLICY_NAME,
    policyIcon: ERP_SUPERVISOR_POLICY_ICON,
    policyDescription: ERP_SUPERVISOR_POLICY_DESCRIPTION,
    policyService,
    logger,
  });
  await addPermissionsToPolicy(permissionsService, erpSupervisorPolicyId, supervisorPermissions);

  const franchiseAdminRoleId = await getRoleIdByName(roleService, FRANCHISE_ADMIN_ROLE_NAME);
  await addAccessPolicyToRole(accessService, erpFranchisePolicyId, franchiseAdminRoleId);

  const supervisorRoleId = await getRoleIdByName(roleService, SUPERVISOR_ROLE_NAME);
  await addAccessPolicyToRole(accessService, erpSupervisorPolicyId, supervisorRoleId);

  await addAccessPolicyToRole(accessService, erpPolicyId, franchiseAdminRoleId);
  await addAccessPolicyToRole(accessService, erpPolicyId, supervisorRoleId);

  logger.info('[ERP bootstrap] Policy bootstrap finished.');
}
