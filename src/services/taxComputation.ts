export type TaxType = 'percentage_based' | 'fixed_amount';

export type TaxInput = {
  id?: string;
  tax_type?: TaxType | null;
  tax_value?: number | string | null;
};

type TaxLookup = Record<string, TaxInput>;
type RelationChangeset = {
  create?: unknown[];
  update?: unknown[];
  delete?: unknown[];
};

function asNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeTaxType(value: unknown): TaxType | null {
  if (value === 'percentage_based' || value === 'fixed_amount') return value;
  return null;
}

function extractTaxId(item: unknown): string | null {
  if (typeof item === 'string' || typeof item === 'number') return String(item);
  if (!item || typeof item !== 'object') return null;

  const candidate = item as any;
  const taxesId = candidate.taxes_id;
  if (typeof taxesId === 'string' || typeof taxesId === 'number') return String(taxesId);
  if (taxesId && typeof taxesId === 'object') {
    if (typeof taxesId.id === 'string' || typeof taxesId.id === 'number') return String(taxesId.id);
  }

  if (typeof candidate.id === 'string' || typeof candidate.id === 'number') {
    return String(candidate.id);
  }

  return null;
}

function isLikelyUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function extractCandidateTaxIds(item: unknown): string[] {
  if (!item || typeof item !== 'object') {
    const primitiveId = extractTaxId(item);
    return primitiveId && isLikelyUuid(primitiveId) ? [primitiveId] : [];
  }

  const candidate = item as any;
  const candidates = new Set<string>();

  const directId = extractTaxId(candidate);
  if (directId && isLikelyUuid(directId)) candidates.add(directId);

  const explicitKeys = ['taxes_id', 'tax_id', 'tax', 'value'];
  for (const key of explicitKeys) {
    const value = candidate[key];
    const id = extractTaxId(value);
    if (id && isLikelyUuid(id)) candidates.add(id);
  }

  for (const [key, value] of Object.entries(candidate)) {
    if (key === 'employees_id') continue;
    if (typeof value !== 'object' && typeof value !== 'string' && typeof value !== 'number')
      continue;
    const id = extractTaxId(value);
    if (id && isLikelyUuid(id)) candidates.add(id);
  }

  return Array.from(candidates);
}

function normalizeRelationItems(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];

  const maybeChangeset = value as RelationChangeset;
  const createItems = Array.isArray(maybeChangeset.create) ? maybeChangeset.create : [];
  const updateItems = Array.isArray(maybeChangeset.update) ? maybeChangeset.update : [];

  return [...createItems, ...updateItems];
}

function normalizeTax(item: any, taxById?: TaxLookup): TaxInput | null {
  if (item == null) return null;

  if (typeof item === 'string' || typeof item === 'number') {
    const key = String(item);
    const resolved = taxById?.[key];
    if (!resolved) return { id: key };
    return {
      id: resolved.id ?? key,
      tax_type: normalizeTaxType(resolved.tax_type) ?? null,
      tax_value: asNumber(resolved.tax_value),
    };
  }

  if (typeof item !== 'object') return null;

  const directType = normalizeTaxType(item.tax_type);
  if (directType) {
    return {
      id: typeof item.id === 'string' ? item.id : undefined,
      tax_type: directType,
      tax_value: asNumber(item.tax_value),
    };
  }

  const nestedTax =
    (item.taxes_id && typeof item.taxes_id === 'object' ? item.taxes_id : null) ??
    (item.tax && typeof item.tax === 'object' ? item.tax : null);

  if (!nestedTax) {
    const unresolvedId = extractTaxId(item);
    if (!unresolvedId) return null;
    const resolved = taxById?.[unresolvedId];
    if (!resolved) return { id: unresolvedId };
    return {
      id: resolved.id ?? unresolvedId,
      tax_type: normalizeTaxType(resolved.tax_type) ?? null,
      tax_value: asNumber(resolved.tax_value),
    };
  }

  const nestedType = normalizeTaxType(nestedTax.tax_type);
  if (!nestedType) {
    const nestedId =
      typeof nestedTax.id === 'string' || typeof nestedTax.id === 'number'
        ? String(nestedTax.id)
        : null;
    if (!nestedId) return null;

    const resolved = taxById?.[nestedId];
    if (!resolved) return { id: nestedId };

    return {
      id: resolved.id ?? nestedId,
      tax_type: normalizeTaxType(resolved.tax_type) ?? null,
      tax_value: asNumber(resolved.tax_value),
    };
  }

  return {
    id: typeof nestedTax.id === 'string' ? nestedTax.id : undefined,
    tax_type: nestedType,
    tax_value: asNumber(nestedTax.tax_value),
  };
}

export function normalizeTaxesFromRelationValue(
  value: unknown,
  options?: { taxById?: TaxLookup },
): TaxInput[] {
  const relationItems = normalizeRelationItems(value);
  if (relationItems.length === 0) return [];

  const normalized: TaxInput[] = [];
  for (const item of relationItems) {
    const tax = normalizeTax(item, options?.taxById);
    if (tax) normalized.push(tax);
  }

  return normalized;
}

export function extractTaxIdsFromRelationValue(value: unknown): string[] {
  const relationItems = normalizeRelationItems(value);
  if (relationItems.length === 0) return [];

  const uniqueIds = new Set<string>();
  for (const item of relationItems) {
    for (const id of extractCandidateTaxIds(item)) {
      uniqueIds.add(id);
    }
  }

  return Array.from(uniqueIds);
}

export function calculateGrossSalaryFromNetAndTaxes(
  netSalaryInput: number | string | null | undefined,
  taxesInput: TaxInput[],
): number | null {
  const netSalary = asNumber(netSalaryInput);
  if (!Number.isFinite(netSalary) || netSalary <= 0) return null;

  let totalPercentage = 0;
  let totalFixedAmount = 0;

  for (const tax of taxesInput) {
    const taxType = normalizeTaxType(tax?.tax_type);
    const taxValue = asNumber(tax?.tax_value);

    if (taxType === 'percentage_based') {
      totalPercentage += taxValue / 100;
      continue;
    }

    if (taxType === 'fixed_amount') {
      totalFixedAmount += taxValue;
    }
  }

  if (totalPercentage >= 1) return null;

  const grossBase = netSalary * (1 + totalPercentage);
  const grossSalary = grossBase + totalFixedAmount;

  return roundCurrency(grossSalary);
}
