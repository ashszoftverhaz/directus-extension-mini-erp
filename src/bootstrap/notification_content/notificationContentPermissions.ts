import { Permissions } from '../types';

export const NOTIFICATION_CONTENT_GENERAL_ACCESS: Permissions = [
  { collection: 'notification_content', action: 'read' },
  { collection: 'notification_content', action: 'create' },
  { collection: 'notification_content', action: 'update' },
];