import { Permissions } from '../types';

export const MATERIALS_GENERAL_ACCESS: Permissions = [
  { collection: 'materials', action: 'read' },
  { collection: 'materials', action: 'create' },
  { collection: 'materials', action: 'update' },
];