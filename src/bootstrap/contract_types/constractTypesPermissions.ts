import { Permissions } from '../types';

export const CONTRACT_TYPES_GENERAL_ACCESS: Permissions = [
  { collection: 'contract_types', action: 'read' },
  { collection: 'contract_types', action: 'create' },
  { collection: 'contract_types', action: 'update' },
];