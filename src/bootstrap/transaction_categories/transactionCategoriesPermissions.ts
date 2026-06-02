import { Permissions } from '../types';

export const TRANSACTION_CATEGORIES_GENERAL_ACCESS: Permissions = [
  { collection: 'transaction_categories', action: 'read' },
  { collection: 'transaction_categories', action: 'create' },
  { collection: 'transaction_categories', action: 'update' },
];