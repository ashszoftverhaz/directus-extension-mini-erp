import type { Knex } from 'knex';
import type { CachedEmailContentVariant, CachedLanguage } from '../../services/types';

export type { CachedEmailContentVariant, CachedLanguage };

/**
 * Context passed to all scheduled job handlers
 */
export type JobContext = {
  services: any;
  logger: any;
  database: Knex;
  getSchema: (options?: { database?: any }) => Promise<any>;
  env?: Record<string, any>;
  emailContentCache?: Map<string, CachedEmailContentVariant[]>;
  languagesCache?: CachedLanguage[] | null;
};
