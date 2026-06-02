import { Permissions } from '../types';

export const ASSETS_FULL_ACCESS: Permissions = [
  { collection: 'assets', action: 'read' },
  { collection: 'assets', action: 'create' },
  { collection: 'assets', action: 'update' },
  { collection: 'assets_contracts', action: 'read' },
  { collection: 'assets_contracts', action: 'create' },
  { collection: 'assets_contracts', action: 'update' },
];

export const ASSETS_FRANCHISE_ADMIN_ACCESS: Permissions = [
  {
    collection: 'assets',
    action: 'read',
    permissions: {
      franchise: { id: { _in: ['$CURRENT_USER.franchise.franchise_id'] } },
    },
  },
  {
    collection: 'assets',
    action: 'create',
    permissions: {
      franchise: { id: { _in: ['$CURRENT_USER.franchise.franchise_id'] } },
    },
  },
  {
    collection: 'assets',
    action: 'update',
    permissions: {
      franchise: { id: { _in: ['$CURRENT_USER.franchise.franchise_id'] } },
    },
  },
  { collection: 'assets_contracts', action: 'read' },
  { collection: 'assets_contracts', action: 'create' },
  { collection: 'assets_contracts', action: 'update' },
];

export const ASSETS_SUPERVISOR_ACCESS: Permissions = [
  {
    collection: 'assets',
    action: 'read',
    permissions: { location: { supervisor: { id: { _in: ['$CURRENT_USER.id'] } } } },
  },
  {
    collection: 'assets',
    action: 'create',
    permissions: { location: { supervisor: { id: { _in: ['$CURRENT_USER.id'] } } } },
  },
  {
    collection: 'assets',
    action: 'update',
    permissions: { location: { supervisor: { id: { _in: ['$CURRENT_USER.id'] } } } },
  },
  { collection: 'assets_contracts', action: 'read' },
  { collection: 'assets_contracts', action: 'create' },
  { collection: 'assets_contracts', action: 'update' },
];
