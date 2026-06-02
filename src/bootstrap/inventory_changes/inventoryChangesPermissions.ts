import { Permissions } from '../types';

export const INVENTORY_CHANGES_FULL_ACCESS: Permissions = [
  { collection: 'inventory_changes', action: 'read' },
  { collection: 'inventory_changes', action: 'create' },
  { collection: 'inventory_changes', action: 'update' },
  { collection: 'inventory_changes_added_materials', action: 'read' },
  { collection: 'inventory_changes_added_materials', action: 'create' },
  { collection: 'inventory_changes_added_materials', action: 'update' },
  { collection: 'inventory_changes_removed_materials', action: 'read' },
  { collection: 'inventory_changes_removed_materials', action: 'create' },
  { collection: 'inventory_changes_removed_materials', action: 'update' },
];

export const INVENTORY_CHANGES_FRANCHISE_ADMIN_ACCESS: Permissions = [
  {
    collection: 'inventory_changes',
    action: 'read',
    permissions: {
      source_location: { franchise: { id: { _in: ['$CURRENT_USER.franchise.franchise_id'] } } },
    },
  },
  {
    collection: 'inventory_changes',
    action: 'create',
    permissions: {
      source_location: { franchise: { id: { _in: ['$CURRENT_USER.franchise.franchise_id'] } } },
    },
  },
  {
    collection: 'inventory_changes',
    action: 'update',
    permissions: {
      source_location: { franchise: { id: { _in: ['$CURRENT_USER.franchise.franchise_id'] } } },
    },
  },
  { collection: 'inventory_changes_added_materials', action: 'read' },
  { collection: 'inventory_changes_added_materials', action: 'create' },
  { collection: 'inventory_changes_added_materials', action: 'update' },
  { collection: 'inventory_changes_removed_materials', action: 'read' },
  { collection: 'inventory_changes_removed_materials', action: 'create' },
  { collection: 'inventory_changes_removed_materials', action: 'update' },
];

export const INVENTORY_CHANGES_SUPERVISOR_ACCESS: Permissions = [
  {
    collection: 'inventory_changes',
    action: 'read',
    permissions: { source_location: { supervisor: { id: { _in: ['$CURRENT_USER.id'] } } } },
  },
  {
    collection: 'inventory_changes',
    action: 'create',
    permissions: { source_location: { supervisor: { id: { _in: ['$CURRENT_USER.id'] } } } },
  },
  {
    collection: 'inventory_changes',
    action: 'update',
    permissions: { source_location: { supervisor: { id: { _in: ['$CURRENT_USER.id'] } } } },
  },
  { collection: 'inventory_changes_added_materials', action: 'read' },
  { collection: 'inventory_changes_added_materials', action: 'create' },
  { collection: 'inventory_changes_added_materials', action: 'update' },
  { collection: 'inventory_changes_removed_materials', action: 'read' },
  { collection: 'inventory_changes_removed_materials', action: 'create' },
  { collection: 'inventory_changes_removed_materials', action: 'update' },
];
