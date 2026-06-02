export const ERP_COLLECTIONS = [
  'accounts',
  'asset_categories',
  'assets_contracts',
  'assets',
  'contract_types',
  'contracts',
  'contracts_contracts',
  'countries',
  'currencies',
  'directus_folders',
  'driverslicences',
  'email_content',
  'employees',
  'employees_trainings',
  'erp_locations',
  'expenses',
  'expenses_assets',
  'expenses_directus_files',
  'expenses_employees',
  'expenses_inventory_changes',
  'franchise',
  'incomes',
  'incomes_assets',
  'incomes_directus_files',
  'incomes_employees',
  'incomes_inventory_changes',
  'inventory_changes',
  'inventory_changes_added_materials',
  'inventory_changes_removed_materials',
  'languages',
  'material_categories',
  'materials',
  'notification_content',
  'partners',
  'partner_billing_information',
  'partners_directus_users',
  'taxes',
  'trainings',
  'transaction_categories',
] as const;

export type BootstrapContext = {
  services: any;
  logger: any;
  database: any;
  accountability?: any;
  getSchema: (options?: { database?: any }) => Promise<any>;
};

export type ActionType = 'read' | 'create' | 'update' | 'delete';

export type PermissionEntry = {
  collection: (typeof ERP_COLLECTIONS | 'directus_users')[number];
  action: ActionType;
  permissions?: any;
  validation?: any;
  presets?: any;
  fields?: Array<string>;
};

export type Permissions = Array<PermissionEntry>;

export type CollectionGroupType = {
  name: string;
  icon: string;
  hidden?: boolean;
};
