import { Permissions } from '../types';

export const ACCOUNTS_GENERAL_ACCESS: Permissions = [
  { collection: 'accounts', action: 'read' },
  { collection: 'accounts', action: 'create' },
  { collection: 'accounts', action: 'update' },
];