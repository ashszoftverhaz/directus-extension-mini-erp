import { Permissions } from '../types';

export const DIRECTUS_USERS_FRANCHISE_ADMIN_ACCESS: Permissions = [
  {
    collection: 'directus_users',
    action: 'read',
  },
  {
    collection: 'directus_users',
    action: 'create',
  },
  {
    collection: 'directus_users',
    action: 'update',
  },
];

export const DIRECTUS_USERS_SUPERVISOR_ACCESS: Permissions = [
  {
    collection: 'directus_users',
    action: 'read',
  },
  {
    collection: 'directus_users',
    action: 'create',
  },
  {
    collection: 'directus_users',
    action: 'update',
  },
];
