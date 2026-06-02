import { BootstrapContext } from '../../bootstrap/types';

/**
 * Normalizes a category name or short name to 3 characters for SKU generation
 * Takes first 3 characters, uppercased, removing special characters
 * Examples: "Insect Spray" -> "INS", "Distilled Water" -> "DIS", "INS" -> "INS"
 */
export function normalizeCategoryNameForSku(categoryName: string): string {
  if (!categoryName || typeof categoryName !== 'string') {
    return 'UNK';
  }

  const cleaned = categoryName
    .trim()
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toUpperCase();

  return cleaned.substring(0, 3).padEnd(3, 'X');
}

/**
 * Gets the next sequence number for materials in a given category
 */
async function getNextSequenceNumber(
  categoryPrefix: string,
  context: BootstrapContext,
): Promise<number> {
  const schema = await context.getSchema({ database: context.database });
  const { ItemsService } = context.services;

  const materialsService = new ItemsService('materials', {
    accountability: { ...context.accountability, admin: true },
    schema,
  });

  const allMaterials = await materialsService.readByQuery({
    filter: {
      sku: {
        _nnull: true,
      },
    },
    fields: ['sku'],
    limit: -1,
  });

  if (!allMaterials || allMaterials.length === 0) {
    return 1;
  }

  // Pattern: {CATEGORY_PREFIX}-{SEQUENCE}-{PACKAGE_SIZE}
  // Example: "INS-001-300" = INS (category) + 001 (sequence) + 300 (package size)
  const sequences = allMaterials
    .map((material: any) => {
      const sku = material.sku;
      if (!sku || typeof sku !== 'string') return null;

      const prefixWithDash = `${categoryPrefix}-`;
      if (!sku.startsWith(prefixWithDash)) return null;

      const afterPrefix = sku.substring(prefixWithDash.length);
      const dashIndex = afterPrefix.indexOf('-');
      if (dashIndex === -1) return null;

      const sequencePart = afterPrefix.substring(0, dashIndex);
      const sequence = parseInt(sequencePart, 10);
      return isNaN(sequence) ? null : sequence;
    })
    .filter((seq: number | null): seq is number => seq !== null);

  if (sequences.length === 0) {
    return 1;
  }

  const maxSequence = Math.max(...sequences);
  return maxSequence + 1;
}

/**
 * Formats a sequence number as a zero-padded string (e.g., 1 -> "001", 42 -> "042")
 */
function formatSequenceNumber(sequence: number): string {
  return sequence.toString().padStart(3, '0');
}

/**
 * Formats package size as a string (e.g., 300 -> "300", 5.5 -> "55")
 */
function formatPackageSize(packageSize: number | string | null | undefined): string {
  if (packageSize === null || packageSize === undefined) {
    return '';
  }
  const numValue = typeof packageSize === 'string' ? parseFloat(packageSize) : packageSize;
  if (isNaN(numValue)) {
    return '';
  }
  const formatted = numValue.toFixed(2);

  return formatted.replace(/\.?0+$/, '');
}

/**
 * Generates a SKU for a material based on category, sequence number, and package size
 * Format: {CategoryPrefix}-{SequenceNumber}-{PackageSize}
 * Examples: "INS-001-300" (category: INS, sequence: 001, package: 300), "DIS-001-5" (category: DIS, sequence: 001, package: 5)
 */
export async function generateSku(
  categoryId: string | null | undefined,
  packageSize: number | null | undefined,
  context: BootstrapContext,
): Promise<string> {
  if (!categoryId) {
    context.logger?.warn('No category ID provided for SKU generation, using fallback');
    const categoryPrefix = 'UNK';
    const sequenceNumber = await getNextSequenceNumber(categoryPrefix, context);
    const formattedSequence = formatSequenceNumber(sequenceNumber);
    const packageSizeStr = formatPackageSize(packageSize);
    return `${categoryPrefix}-${formattedSequence}-${packageSizeStr}`;
  }

  const schema = await context.getSchema({ database: context.database });
  const { ItemsService } = context.services;

  const categoriesService = new ItemsService('material_categories', {
    accountability: { ...context.accountability, admin: true },
    schema,
  });

  let categoryName: string | null = null;
  let shortName: string | null = null;

  try {
    const category = await categoriesService.readOne(categoryId, {
      fields: ['material_category_name', 'short_name'],
    });

    if (category?.short_name) {
      shortName = category.short_name;
      context.logger?.debug(`Category short_name fetched for SKU generation: ${shortName}`);
    }

    if (category?.material_category_name) {
      categoryName = category.material_category_name;
      context.logger?.debug(`Category name fetched for SKU generation: ${categoryName}`);
    } else if (!shortName) {
      context.logger?.warn(
        `Category ${categoryId} found but missing material_category_name and short_name fields`,
      );
    }
  } catch (error) {
    context.logger?.warn(`Failed to fetch category data for SKU generation: ${error}`);
  }

  if (!shortName && !categoryName) {
    categoryName = 'UNKNOWN';
    context.logger?.warn(`Using fallback category name: ${categoryName}`);
  }

  const sourceForPrefix = shortName ?? categoryName ?? 'UNKNOWN';
  const categoryPrefix = normalizeCategoryNameForSku(sourceForPrefix);
  const sequenceNumber = await getNextSequenceNumber(categoryPrefix, context);
  const formattedSequence = formatSequenceNumber(sequenceNumber);
  const packageSizeStr = formatPackageSize(packageSize);

  const sku = `${categoryPrefix}-${formattedSequence}-${packageSizeStr}`;

  context.logger?.debug(
    `Generated SKU: ${sku} (category: ${categoryName} -> ${categoryPrefix}, sequence: ${sequenceNumber}, package size: ${packageSize})`,
  );

  return sku;
}
