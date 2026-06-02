/**
 * Helpers for encoding/decoding setting values into a single string.
 */

export function slugifyLabel(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatLocationSettingValue(
  collection: string,
  id: string,
  name: string | null | undefined,
): string {
  const slug = slugifyLabel(name);
  return `${collection}:${id}:${slug}`;
}

export type ParsedLocationSettingValue = {
  collection: string;
  id: string;
  nameSlug: string | null;
};

export function parseLocationSettingValue(
  value: string | null | undefined,
): ParsedLocationSettingValue | null {
  if (!value || typeof value !== 'string') return null;

  const parts = value.split(':');
  if (parts.length < 2) return null;

  const [collection, id, ...rest] = parts;
  if (!collection || !id) return null;

  const nameSlug = rest.length > 0 ? rest.join(':') || null : null;

  return { collection, id, nameSlug };
}
