import { Permissions } from '../types';

export const LANGUAGES_GENERAL_ACCESS: Permissions = [
  { collection: 'languages', action: 'read' },
  { collection: 'languages', action: 'create' },
  { collection: 'languages', action: 'update' },
];