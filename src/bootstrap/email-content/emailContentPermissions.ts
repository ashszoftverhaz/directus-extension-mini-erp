import { Permissions } from '../types';

export const EMAIL_CONTENT_GENERAL_ACCESS: Permissions = [
  { collection: 'email_content', action: 'read' },
  { collection: 'email_content', action: 'create' },
  { collection: 'email_content', action: 'update' },
];