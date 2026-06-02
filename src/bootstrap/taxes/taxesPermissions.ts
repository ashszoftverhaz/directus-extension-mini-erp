import { Permissions } from '../types';

export const TAXES_GENERAL_ACCESS: Permissions = [
  { collection: 'taxes', action: 'read' },
  { collection: 'taxes', action: 'create' },
  { collection: 'taxes', action: 'update' },
];