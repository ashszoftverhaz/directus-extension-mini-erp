export const ERP_ROOT_FOLDER = 'ERP root';
export const CONTRACTS_FOLDER = 'Contracts';
export const CONTRACTS_COLLECTION = 'contracts';
export const CONTRACT_FILE_FIELDS = ['upload_contract'] as const;
export const FRANCHISE_FOLDER_SUFFIX = ' Franchise';

export const INVOICES_FOLDER = 'Invoices';
export const EXPENSES_COLLECTION = 'expenses';

type FileReference = string | { id?: string | null } | null | undefined;

export function extractFileIds(
  source: Record<string, unknown> | null | undefined,
  fields: readonly string[],
): string[] {
  return fields
    .map((field) => source?.[field] as FileReference)
    .map((value) => {
      if (!value) return null;
      if (typeof value === 'string') return value;
      if (typeof value === 'object' && value && 'id' in value) return value.id ?? null;
      return null;
    })
    .filter((id): id is string => Boolean(id));
}
