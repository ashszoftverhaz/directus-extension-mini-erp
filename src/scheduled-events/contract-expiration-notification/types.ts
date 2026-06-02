import type { JobContext } from '../shared/types';

export type HookContext = JobContext;

export type Contract = {
  id: string;
  contract_id: string | null;
  expiry_date: string | Date | null;
  status: string | null;
  other_party_type?: string | null; // 'partner' or 'employee'
  partner?: string | { id?: string; name?: string } | null;
  employee?: string | { id?: string; account?: { first_name?: string; last_name?: string } } | null;
  franchise?: string | { id?: string } | null; // Optional franchise field (may or may not exist in schema)
  email_notification?: unknown;
};

export type Language = {
  code: string;
  id: string;
};

export type FranchiseAdminInfo = {
  email: string;
  language: string | null;
};
