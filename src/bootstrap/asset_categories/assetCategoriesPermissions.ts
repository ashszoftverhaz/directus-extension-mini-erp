import { Permissions } from '../types';
import { BASE_VEHICLE_CATEGORY_SHORT_NAME } from './assetCategoriesSeed';

export const ASSET_CATEGORIES_GENERAL_ACCESS: Permissions = [
  { collection: 'asset_categories', action: 'read' },
  { collection: 'asset_categories', action: 'create' },
  { collection: 'asset_categories', action: 'update' },
  {
      collection: 'asset_categories',
      action: 'delete',
      permissions: {
        _or: [
          { short_name: { _neq: BASE_VEHICLE_CATEGORY_SHORT_NAME } },
          { asset_category_name: { _neq: 'Vehicle' } },
        ],
      },
    }
];