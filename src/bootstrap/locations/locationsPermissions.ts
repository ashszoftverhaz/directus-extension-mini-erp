import { Permissions } from '../types';

export const LOCATIONS_GENERAL_ACCESS: Permissions = [
  { collection: 'erp_locations', action: 'read' },
  { collection: 'erp_locations', action: 'create' },
  { collection: 'erp_locations', action: 'update' },
];