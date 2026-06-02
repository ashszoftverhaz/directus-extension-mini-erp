import { createCollection, JunctionData } from '../helpers/collectionHelper';
import { BootstrapContext } from '../types';
import { getContractsSchema } from './contractsSchema';
import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';

export async function bootstrapContracts(
  context: BootstrapContext,
  franchiseCollectionExists: boolean,
): Promise<void> {
  const { logger } = context;

  logger.info('[ERP bootstrap] Contracts bootstrap started.');

  await createCollection(context, getContractsSchema(context.database, franchiseCollectionExists));
  await createSelfReferencingJunction(context, {
    collection: 'contracts',
    idType: 'uuid',
    virtualFieldName: 'related_contracts',
    group: ERP_COLLECTION_GROUP_NAMES.Contracts,
  });
  await addPreset(context);

  logger.info('[ERP bootstrap] Contracts bootstrap finished.');
}

export async function createSelfReferencingJunction(
  context: any,
  junctionData: Omit<JunctionData, 'relatedCollection' | 'relatedIdType' | 'template'>,
) {
  const junctionName = `${junctionData.collection}_${junctionData.collection}`;

  const collectionData: any = {
    collection: {
      collection: junctionName,
      meta: { hidden: true, icon: 'import_export', group: junctionData.group },
      schema: { name: junctionName },
      fields: [
        {
          field: 'id',
          type: 'integer',
          schema: { has_auto_increment: true },
          meta: { hidden: true },
        },
      ],
    },
    fields: [
      {
        collection: junctionData.collection,
        field: junctionData.virtualFieldName,
        type: 'alias',
        meta: {
          interface: 'list-m2m',
          special: ['m2m'],
          options: { template: '{{related_contracts_id.contract_id}}' },
        },
      },
      {
        collection: junctionName,
        field: `${junctionData.collection}_id`,
        type: junctionData.idType,
        meta: { hidden: true },
      },
      {
        collection: junctionName,
        field: `related_${junctionData.collection}_id`,
        type: junctionData.idType,
        meta: { hidden: true },
      },
    ],
    relations: [
      {
        collection: junctionName,
        field: `related_${junctionData.collection}_id`,
        related_collection: junctionData.collection,
        meta: {
          one_field: junctionData.relatedVirtualFieldName ?? null,
          sort_field: null,
          one_deselect_action: 'nullify',
          junction_field: `${junctionData.collection}_id`,
        },
        schema: { on_delete: 'CASCADE' },
      },
      {
        collection: junctionName,
        field: `${junctionData.collection}_id`,
        related_collection: junctionData.collection,
        meta: {
          one_field: junctionData.virtualFieldName,
          sort_field: null,
          one_deselect_action: 'nullify',
          junction_field: `related_${junctionData.collection}_id`,
        },
        schema: { on_delete: 'CASCADE' },
      },
    ],
  };

  await createCollection(context, collectionData);
}

async function addPreset(context: any) {
  const schema = await context.getSchema({ database: context.database });
  const { PresetsService } = context.services;
  const presetService = new PresetsService({ accountability: context.accountability, schema });

  try {
    const existingPresets = await presetService.readByQuery({
      filter: {
        collection: { _eq: 'contracts' },
      },
    });

    if (existingPresets.length === 0) {
      const id = await presetService.createOne({
        collection: 'contracts',
        layout_query: {
          tabular: {
            fields: ['contract_id', 'status', 'contract_type.contract_type', 'signed_at'],
          },
        },
        layout_options: {
          tabular: {
            widths: {
              contract_id: 160,
              status: 160,
              'contract_type.contract_type': 160,
              signed_at: 160,
            },
          },
        },
        icon: 'bookmark',
      });
      context.logger.info(`[ERP bootstrap] Created preset for contracts with id: ${id}`);
    } else {
      context.logger.info(
        '[ERP bootstrap] Preset for contracts already exists, skipping creation.',
      );
    }
  } catch (error) {
    context.logger.error(`[ERP bootstrap] Error creating preset: ${error}`);
  }
}
