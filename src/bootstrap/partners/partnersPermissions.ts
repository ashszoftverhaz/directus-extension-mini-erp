import { Permissions } from '../types';

export const PARTNERS_GENERAL_ACCESS: Permissions = [
  { collection: 'partners', action: 'read' },
  { collection: 'partners', action: 'create' },
  { collection: 'partners', action: 'update' },
  { collection: 'partner_billing_information', action: 'read' },
  { collection: 'partner_billing_information', action: 'create' },
  { collection: 'partner_billing_information', action: 'update' },
  { collection: 'partners_directus_users', action: 'read' },
  { collection: 'partners_directus_users', action: 'create' },
  { collection: 'partners_directus_users', action: 'update' },
];

