import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';
import { createCollection, createJunction } from '../helpers/collectionHelper';
import { BootstrapContext } from '../types';
import { getTrainingsSchema } from './trainingsSchema';

export async function bootstrapTrainings(
  context: Omit<BootstrapContext, 'accountability'>,
): Promise<void> {
  const { logger } = context;

  logger.info('[ERP bootstrap] Trainings bootstrap started.');

  await createCollection(context, getTrainingsSchema(context.database));
  await createJunction(context, {
    collection: 'employees',
    group: ERP_COLLECTION_GROUP_NAMES.Employees,
    relatedCollection: 'trainings',
    idType: 'uuid',
    relatedIdType: 'uuid',
    virtualFieldName: 'participated_in',
    template: '{{trainings_id.name}}',
  });

  await addTrainingsPreset(context as BootstrapContext);

  logger.info('[ERP bootstrap] Trainings bootstrap finished.');
}

async function addTrainingsPreset(context: BootstrapContext): Promise<void> {
  const schema = await context.getSchema({ database: context.database });
  const { PresetsService } = context.services;
  const presetService = new PresetsService({
    accountability: context.accountability,
    schema,
  });

  try {
    const existingPresets = await presetService.readByQuery({
      filter: { collection: { _eq: 'trainings' } },
    });

    if (existingPresets.length === 0) {
      const id = await presetService.createOne({
        collection: 'trainings',
        layout_query: {
          tabular: {
            fields: ['name', 'description'],
          },
        },
        layout_options: {
          tabular: {
            widths: {
              name: 200,
              description: 600,
          },
        },
        icon: 'school',
      }});
      context.logger.info(`[ERP bootstrap] Created preset for trainings with id: ${id}`);
    } else {
      context.logger.info(
        '[ERP bootstrap] Preset for trainings already exists, skipping creation.',
      );
    }
  } catch (error) {
    context.logger.error(`[ERP bootstrap] Error creating trainings preset: ${error}`);
  }
}
