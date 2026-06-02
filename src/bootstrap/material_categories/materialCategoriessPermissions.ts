import { Permissions } from '../types';

export const MATERIAL_CATEGORIES_GENERAL_ACCESS: Permissions = [
  { collection: 'material_categories', action: 'read' },
  { collection: 'material_categories', action: 'create' },
  { collection: 'material_categories', action: 'update' },
];