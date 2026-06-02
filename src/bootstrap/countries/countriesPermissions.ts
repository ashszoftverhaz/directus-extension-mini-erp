import { Permissions } from '../types';

export const COUNTRIES_GENERAL_ACCESS: Permissions = [
  { collection: 'countries', action: 'read' },
  { collection: 'countries', action: 'create' },
  { collection: 'countries', action: 'update' },
];