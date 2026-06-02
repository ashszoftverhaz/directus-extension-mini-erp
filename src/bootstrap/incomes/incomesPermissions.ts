import { Permissions } from '../types';

export const INCOMES_FULL_ACCESS: Permissions = [
  { collection: 'incomes', action: 'read' },
  { collection: 'incomes', action: 'create' },
  { collection: 'incomes', action: 'update' },

  { collection: 'incomes_assets', action: 'read' },
  { collection: 'incomes_assets', action: 'create' },
  { collection: 'incomes_assets', action: 'update' },

  { collection: 'incomes_directus_files', action: 'read' },
  { collection: 'incomes_directus_files', action: 'create' },
  { collection: 'incomes_directus_files', action: 'update' },

  { collection: 'incomes_employees', action: 'read' },
  { collection: 'incomes_employees', action: 'create' },
  { collection: 'incomes_employees', action: 'update' },
  
  { collection: 'incomes_inventory_changes', action: 'read' },
  { collection: 'incomes_inventory_changes', action: 'create' },
  { collection: 'incomes_inventory_changes', action: 'update' },
];

export const INCOMES_FRANCHISE_ADMIN_ACCESS: Permissions = [
  {
    collection: 'incomes',
    action: 'read',
    permissions: {
      location: { franchise: { id: { _in: ['$CURRENT_USER.franchise.franchise_id'] } } },
    },
  },
  {
    collection: 'incomes',
    action: 'create',
    permissions: {
      location: { franchise: { id: { _in: ['$CURRENT_USER.franchise.franchise_id'] } } },
    },
  },
  {
    collection: 'incomes',
    action: 'update',
    permissions: {
      location: { franchise: { id: { _in: ['$CURRENT_USER.franchise.franchise_id'] } } },
    },
  },
  { collection: 'incomes_assets', action: 'read' },
  { collection: 'incomes_assets', action: 'create' },
  { collection: 'incomes_assets', action: 'update' },
  { collection: 'incomes_directus_files', action: 'read' },
  { collection: 'incomes_directus_files', action: 'create' },
  { collection: 'incomes_directus_files', action: 'update' },
  { collection: 'incomes_employees', action: 'read' },
  { collection: 'incomes_employees', action: 'create' },
  { collection: 'incomes_employees', action: 'update' },
  { collection: 'incomes_inventory_changes', action: 'read' },
  { collection: 'incomes_inventory_changes', action: 'create' },
  { collection: 'incomes_inventory_changes', action: 'update' },
];

export const INCOMES_SUPERVISOR_ACCESS: Permissions = [
  {
    collection: 'incomes',
    action: 'read',
    permissions: { location: { supervisor: { id: { _in: ['$CURRENT_USER.id'] } } } },
  },
  {
    collection: 'incomes',
    action: 'create',
    permissions: { location: { supervisor: { id: { _in: ['$CURRENT_USER.id'] } } } },
  },
  {
    collection: 'incomes',
    action: 'update',
    permissions: { location: { supervisor: { id: { _in: ['$CURRENT_USER.id'] } } } },
  },
  { collection: 'incomes_assets', action: 'read' },
  { collection: 'incomes_assets', action: 'create' },
  { collection: 'incomes_assets', action: 'update' },
  { collection: 'incomes_directus_files', action: 'read' },
  { collection: 'incomes_directus_files', action: 'create' },
  { collection: 'incomes_directus_files', action: 'update' },
  { collection: 'incomes_employees', action: 'read' },
  { collection: 'incomes_employees', action: 'create' },
  { collection: 'incomes_employees', action: 'update' },
  { collection: 'incomes_inventory_changes', action: 'read' },
  { collection: 'incomes_inventory_changes', action: 'create' },
  { collection: 'incomes_inventory_changes', action: 'update' },
];
