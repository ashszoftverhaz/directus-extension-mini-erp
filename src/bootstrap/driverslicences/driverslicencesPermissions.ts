import { Permissions } from '../types';

export const DRIVERSLICENCES_GENERAL_ACCESS: Permissions = [
  { collection: 'driverslicences', action: 'read' },
  { collection: 'driverslicences', action: 'create' },
  { collection: 'driverslicences', action: 'update' },
];