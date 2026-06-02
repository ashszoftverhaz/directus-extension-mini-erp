import { Permissions } from '../types';
import { BASE_SETTINGS_COLLECTION } from './baseSettingsSchema';

export const BASE_SETTINGS_GENERAL_ACCESS: Permissions = [
  { collection: BASE_SETTINGS_COLLECTION, action: 'read' },  
];