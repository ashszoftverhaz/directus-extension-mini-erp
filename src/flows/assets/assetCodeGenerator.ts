import { BootstrapContext } from '../../bootstrap/types';

/**
 * Normalizes a category name or short name to 3 characters for asset code generation
 * Takes first 3 alphanumeric characters, uppercased, removing special characters
 * Examples: "Vehicle" -> "VEH", "Power Tool" -> "POW", "IT Equipment" -> "ITE"
 */
export function normalizeCategoryNameForAssetCode(categoryName: string): string {
  if (!categoryName || typeof categoryName !== 'string') {
    return 'AST';
  }

  const cleaned = categoryName
    .trim()
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toUpperCase();

  return cleaned.substring(0, 3).padEnd(3, 'X');
}

/**
 * Gets the next sequence number for assets in a given category prefix
 * Code pattern: {CATEGORY_PREFIX}-{SEQUENCE}
 * Example: "VEH-001", "VEH-002", "TOO-001"
 */
async function getNextAssetSequenceNumber(
  categoryPrefix: string,
  context: BootstrapContext,
): Promise<number> {
  const schema = await context.getSchema({ database: context.database });
  const { ItemsService } = context.services;

  const assetsService = new ItemsService('assets', {
    accountability: { ...context.accountability, admin: true },
    schema,
  });

  const allAssets = await assetsService.readByQuery({
    filter: {
      code: {
        _nnull: true,
      },
    },
    fields: ['code'],
    limit: -1,
  });

  if (!allAssets || allAssets.length === 0) {
    return 1;
  }

  const prefixWithDash = `${categoryPrefix}-`;

  const sequences = allAssets
    .map((asset: any) => {
      const code = asset.code;
      if (!code || typeof code !== 'string') return null;

      if (!code.startsWith(prefixWithDash)) return null;

      const afterPrefix = code.substring(prefixWithDash.length);
      const dashIndex = afterPrefix.indexOf('-');
      const sequencePart = dashIndex === -1 ? afterPrefix : afterPrefix.substring(0, dashIndex);

      const sequence = parseInt(sequencePart, 10);
      return Number.isNaN(sequence) ? null : sequence;
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
function formatAssetSequenceNumber(sequence: number): string {
  return sequence.toString().padStart(3, '0');
}

/**
 * Generates an asset code based on asset category and sequence number
 * Format: {CategoryPrefix}-{SequenceNumber}
 * Examples: "VEH-001" (Vehicle), "TL-001" (Tool), "IT-002" (IT equipment)
 */
export async function generateAssetCode(
  assetCategoryId: string | null | undefined,
  context: BootstrapContext,
): Promise<string> {
  const schema = await context.getSchema({ database: context.database });
  const { ItemsService } = context.services;

  const categoriesService = new ItemsService('asset_categories', {
    accountability: { ...context.accountability, admin: true },
    schema,
  });

  let categoryName: string | null = null;
  let shortName: string | null = null;

  if (assetCategoryId) {
    try {
      const category = await categoriesService.readOne(assetCategoryId, {
        fields: ['asset_category_name', 'short_name'],
      });

      if (category?.short_name) {
        shortName = category.short_name;
        context.logger?.debug(
          `Asset category short_name fetched for code generation: ${shortName}`,
        );
      }

      if (category?.asset_category_name) {
        categoryName = category.asset_category_name;
        context.logger?.debug(`Asset category name fetched for code generation: ${categoryName}`);
      } else if (!shortName) {
        context.logger?.warn(
          `Asset category ${assetCategoryId} found but missing asset_category_name and short_name fields`,
        );
      }
    } catch (error) {
      context.logger?.warn(`Failed to fetch asset category data for code generation: ${error}`);
    }
  } else {
    context.logger?.warn('No asset category ID provided for code generation, using fallback.');
  }

  if (!shortName && !categoryName) {
    categoryName = 'ASSET';
    context.logger?.warn(`Using fallback asset category name for code generation: ${categoryName}`);
  }

  const sourceForPrefix = shortName ?? categoryName ?? 'ASSET';
  const categoryPrefix = normalizeCategoryNameForAssetCode(sourceForPrefix);
  const sequenceNumber = await getNextAssetSequenceNumber(categoryPrefix, context);
  const formattedSequence = formatAssetSequenceNumber(sequenceNumber);

  const code = `${categoryPrefix}-${formattedSequence}`;

  context.logger?.debug(
    `Generated asset code: ${code} (category: ${categoryName} -> ${categoryPrefix}, sequence: ${sequenceNumber})`,
  );

  return code;
}
