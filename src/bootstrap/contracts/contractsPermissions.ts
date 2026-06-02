import { Permissions } from '../types';

export const CONTRACTS_FULL_ACCESS: Permissions = [
  { collection: 'contracts', action: 'read' },
  { collection: 'contracts', action: 'create' },
  { collection: 'contracts', action: 'update' },
  { collection: 'contracts_contracts', action: 'read' },
  { collection: 'contracts_contracts', action: 'create' },
  { collection: 'contracts_contracts', action: 'update' },
];

export const CONTRACTS_FRANCHISE_ADMIN_ACCESS: Permissions = [
  {
    collection: 'contracts',
    action: 'read',
    permissions: {
      _or: [
        { franchise: { _null: true } },
        { franchise: { _in: ['$CURRENT_USER.franchise.franchise_id'] } },
      ],
    },
  },
  {
    collection: 'contracts',
    action: 'create',
    validation: {
      _or: [
        { franchise: { _null: true } },
        { franchise: { _in: ['$CURRENT_USER.franchise.franchise_id'] } },
      ],
    },
  },
  {
    collection: 'contracts',
    action: 'update',
    validation: {
      _or: [
        { franchise: { _null: true } },
        { franchise: { _in: ['$CURRENT_USER.franchise.franchise_id'] } },
      ],
    },
  },
  {
    collection: 'franchise',
    action: 'read',
    permissions: { id: { _in: ['$CURRENT_USER.franchise.franchise_id'] } }
  },
  { collection: 'contracts_contracts', action: 'read' },
  { collection: 'contracts_contracts', action: 'create' },
  { collection: 'contracts_contracts', action: 'update' },
];

export const CONTRACTS_SUPERVISOR_ACCESS: Permissions = [
  {
    collection: 'contracts',
    action: 'read',
    permissions: {
      _or: [
        { franchise: { _null: true } },
        { franchise: { washing_locations: { supervisor: { id: { _in: ['$CURRENT_USER.id'] } } } } },
      ],
    },
  },
  {
    collection: 'contracts',
    action: 'create',
    validation: {
      _or: [
        { franchise: { _null: true } },
        { franchise: { washing_locations: { supervisor: { id: { _in: ['$CURRENT_USER.id'] } } } } },
      ],
    },
  },
  {
    collection: 'contracts',
    action: 'update',
    validation: {
      _or: [
        { franchise: { _null: true } },
        { franchise: { washing_locations: { supervisor: { id: { _in: ['$CURRENT_USER.id'] } } } } },
      ],
    },
  },
  {
    collection: 'franchise',
    action: 'read',
    permissions: { id: { _in: ['$CURRENT_USER.franchise.franchise_id'] } }
  },
  { collection: 'contracts_contracts', action: 'read' },
  { collection: 'contracts_contracts', action: 'create' },
  { collection: 'contracts_contracts', action: 'update' },
];