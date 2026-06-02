import { Permissions } from '../types';

export const CURRENCIES_GENERAL_ACCESS: Permissions = [
  { collection: 'currencies', action: 'read' },
  { collection: 'currencies', action: 'create' },
  { collection: 'currencies', action: 'update' },
];