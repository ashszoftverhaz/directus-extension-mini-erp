import { BootstrapContext } from '../../bootstrap/types';
import { MATERIALS_COLLECTION } from '../../bootstrap/materials/materialsSchema';
import { generateSku } from './skuGenerator';

export async function materialCreatingHandler(
  meta: Record<string, any>,
  context: BootstrapContext,
): Promise<void> {
  const accountability = meta?.accountability ?? context?.accountability ?? context.accountability;

  const schema = await context.getSchema({ database: context.database });
  const { ItemsService } = context.services;
  const materialsService = new ItemsService(MATERIALS_COLLECTION, {
    accountability: { ...accountability, admin: true },
    schema,
  });

  const materialKey = meta?.key;
  if (!materialKey) {
    context.logger?.error('Material creation handler called without material key');
    return;
  }

  try {
    const createdMaterial = await materialsService.readOne(materialKey, {
      fields: ['material_category', 'package_size'],
    });

    const categoryId = createdMaterial?.material_category ?? meta?.payload?.material_category;
    const packageSize = createdMaterial?.package_size ?? meta?.payload?.package_size;

    const generatedSku = await generateSku(categoryId, packageSize, context);

    context.logger?.info(`Generated SKU: ${generatedSku} for material ${materialKey}`);

    await materialsService.updateOne(materialKey, {
      sku: generatedSku,
    });
  } catch (error) {
    context.logger?.error(
      `Error in material creation handler for material ${materialKey}: ${error}`,
    );
    throw error;
  }
}
