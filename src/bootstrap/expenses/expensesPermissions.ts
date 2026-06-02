import { Permissions } from '../types';

export const EXPENSES_FULL_ACCESS: Permissions = [
  { collection: 'expenses', action: 'read' },
  { collection: 'expenses', action: 'create' },
  { collection: 'expenses', action: 'update' },
  
  { collection: 'expenses_assets', action: 'read' },
  { collection: 'expenses_assets', action: 'create' },
  { collection: 'expenses_assets', action: 'update' },

  { collection: 'expenses_directus_files', action: 'read' },
  { collection: 'expenses_directus_files', action: 'create' },
  { collection: 'expenses_directus_files', action: 'update' },

  { collection: 'expenses_employees', action: 'read' },
  { collection: 'expenses_employees', action: 'create' },
  { collection: 'expenses_employees', action: 'update' },

  { collection: 'expenses_inventory_changes', action: 'read' },
  { collection: 'expenses_inventory_changes', action: 'create' },
  { collection: 'expenses_inventory_changes', action: 'update' },
  
  { collection: 'expenses_files', action: 'read' },
  { collection: 'expenses_files', action: 'create' },
  { collection: 'expenses_files', action: 'update' },
];

export const EXPENSES_FRANCHISE_ADMIN_ACCESS: Permissions = [
  {
    collection: 'expenses',
    action: 'read',
    permissions: {
      location: { franchise: { id: { _in: ['$CURRENT_USER.franchise.franchise_id'] } } },
    },
  },
  {
    collection: 'expenses',
    action: 'create',
    permissions: {
      location: { franchise: { id: { _in: ['$CURRENT_USER.franchise.franchise_id'] } } },
    },
  },
  {
    collection: 'expenses',
    action: 'update',
    permissions: {
      location: { franchise: { id: { _in: ['$CURRENT_USER.franchise.franchise_id'] } } },
    },
  },
  { collection: 'expenses_assets', action: 'read' },
  { collection: 'expenses_assets', action: 'create' },
  { collection: 'expenses_assets', action: 'update' },

  { collection: 'expenses_directus_files', action: 'read' },
  { collection: 'expenses_directus_files', action: 'create' },
  { collection: 'expenses_directus_files', action: 'update' },

  { collection: 'expenses_employees', action: 'read' },
  { collection: 'expenses_employees', action: 'create' },
  { collection: 'expenses_employees', action: 'update' },

  { collection: 'expenses_inventory_changes', action: 'read' },
  { collection: 'expenses_inventory_changes', action: 'create' },
  { collection: 'expenses_inventory_changes', action: 'update' },
  
  { collection: 'expenses_files', action: 'read' },
  { collection: 'expenses_files', action: 'create' },
  { collection: 'expenses_files', action: 'update' },
];

export const EXPENSES_SUPERVISOR_ACCESS: Permissions = [
  {
    collection: 'expenses',
    action: 'read',
    permissions: { location: { supervisor: { id: { _in: ['$CURRENT_USER.id'] } } } },
  },
  {
    collection: 'expenses',
    action: 'create',
    permissions: { location: { supervisor: { id: { _in: ['$CURRENT_USER.id'] } } } },
  },
  {
    collection: 'expenses',
    action: 'update',
    permissions: { location: { supervisor: { id: { _in: ['$CURRENT_USER.id'] } } } },
  },
  { collection: 'expenses_assets', action: 'read' },
  { collection: 'expenses_assets', action: 'create' },
  { collection: 'expenses_assets', action: 'update' },
  
  { collection: 'expenses_directus_files', action: 'read' },
  { collection: 'expenses_directus_files', action: 'create' },
  { collection: 'expenses_directus_files', action: 'update' },

  { collection: 'expenses_employees', action: 'read' },
  { collection: 'expenses_employees', action: 'create' },
  { collection: 'expenses_employees', action: 'update' },

  { collection: 'expenses_inventory_changes', action: 'read' },
  { collection: 'expenses_inventory_changes', action: 'create' },
  { collection: 'expenses_inventory_changes', action: 'update' },
  
  { collection: 'expenses_files', action: 'read' },
  { collection: 'expenses_files', action: 'create' },
  { collection: 'expenses_files', action: 'update' },
];
