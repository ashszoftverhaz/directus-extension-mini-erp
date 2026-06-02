import { Permissions } from '../types';

export const TRAININGS_GENERAL_ACCESS: Permissions = [
  { collection: 'trainings', action: 'read' },
  { collection: 'trainings', action: 'create' },
  { collection: 'trainings', action: 'update' },
];