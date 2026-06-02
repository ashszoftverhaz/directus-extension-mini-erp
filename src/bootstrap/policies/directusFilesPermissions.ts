import { Permissions } from '../types';

export const DIRECTUS_FILES_FRANCHISE_ADMIN_ACCESS: Permissions = [
  {
    collection: 'directus_files',
    action: 'read',
  },
  {
    collection: 'directus_files',
    action: 'create',
  },
  {
    collection: 'directus_files',
    action: 'update',
  },
];

export const DIRECTUS_FILES_SUPERVISOR_ACCESS: Permissions = [
  {
    collection: 'directus_files',
    action: 'read',
  },
  {
    collection: 'directus_files',
    action: 'create',
  },
  {
    collection: 'directus_files',
    action: 'update',
  },
];
