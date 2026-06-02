import type { Knex } from 'knex';

/** Email content variant for cache */
export type CachedEmailContentVariant = {
  language: string | null;
  subject: string;
  value: string;
};

/** Cached language record */
export type CachedLanguage = { id: string; code: string };

export type HookContext = {
  services: any;
  logger: any;
  database: Knex;
  getSchema: (options?: { database?: any }) => Promise<any>;
  emailContentCache?: Map<string, CachedEmailContentVariant[]>;
  languagesCache?: CachedLanguage[] | null;
};

export type EmailContent = {
  id: string;
  key: string;
  language: string | null;
  subject: string;
  value: string;
};

export type EmailOptions = {
  to: string;
  subject: string;
  html: string;
};

export type Language = {
  code: string;
  id: string;
};
