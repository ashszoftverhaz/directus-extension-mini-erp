import { Permissions } from '../types';

export const FOLDERS_GENERAL_ACCESS: Permissions = [  
  { collection: 'directus_folders', action: 'read' },
  { collection: 'directus_folders', action: 'create' },
];