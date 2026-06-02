import { CollectionGroupType } from '../types';

export const ERP_COLLECTION_GROUP_NAMES = {
  Assets: 'Assets',
  InventoryManagement: 'Inventory_management',
  Contracts: 'Contracts',
  Finance: 'Finance',
  Employees: 'Employees',
  Partners: 'Partners',
  Settings: 'ERP_settings',
} as const;

export type ErpCollectionGroupName = (typeof ERP_COLLECTION_GROUP_NAMES)[keyof typeof ERP_COLLECTION_GROUP_NAMES];

export const ERP_COLLECTION_GROUPS: CollectionGroupType[] = [
  {
    name: ERP_COLLECTION_GROUP_NAMES.Assets,
    icon: 'service_toolbox',
  },
  {
    name: ERP_COLLECTION_GROUP_NAMES.InventoryManagement,
    icon: 'folder',
  },
  {
    name: ERP_COLLECTION_GROUP_NAMES.Contracts,
    icon: 'contract',
  },
  {
    name: ERP_COLLECTION_GROUP_NAMES.Finance,
    icon: 'folder',
  },
  {
    name: ERP_COLLECTION_GROUP_NAMES.Employees,
    icon: 'people',
  },
  {
    name: ERP_COLLECTION_GROUP_NAMES.Partners,
    icon: 'partner_exchange',
  },
  {
    name: ERP_COLLECTION_GROUP_NAMES.Settings,
    icon: 'settings',
    hidden: false,
  },
];
