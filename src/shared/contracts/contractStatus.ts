export type ContractStatus = 'draft' | 'active' | 'expired';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Returns a local-time YYYY-MM-DD string
 */
export function toLocalDateYMD(date: Date): string {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
}

/**
 * Normalizes Directus date values to YYYY-MM-DD
 */
export function normalizeToYMD(input: unknown): string | null {
  if (!input) return null;

  if (typeof input === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) return null;
    return toLocalDateYMD(parsed);
  }

  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return null;
    return toLocalDateYMD(input);
  }

  return null;
}

export function computeContractStatus(args: {
  signedAt: unknown;
  expiryDate: unknown;
  now?: Date;
}): ContractStatus {
  const today = toLocalDateYMD(args.now ?? new Date());
  const signedAt = normalizeToYMD(args.signedAt);
  const expiryDate = normalizeToYMD(args.expiryDate);

  if (!signedAt || !expiryDate) return 'draft';
  if (today >= signedAt && today <= expiryDate) return 'active';
  if (today > expiryDate) return 'expired';

  return 'draft';
}

