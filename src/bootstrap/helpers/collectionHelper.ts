import type { Field, Relation, Type, RawCollection } from '@directus/types';
import { BootstrapContext, CollectionGroupType } from '../types';

export interface CollectionData {
  collection: RawCollection;
  fields: Array<Partial<Field> & { field: string; type: Type | null }>;
  relations?: Array<Partial<Relation>>;
}

export interface JunctionData {
  collection: string;
  group?: string;
  idType: Type;
  virtualFieldName: string;
  relatedCollection: string;
  relatedIdType: Type;
  relatedVirtualFieldName?: string;
  template?: string;
  relatedOptions?: { template: string; enableCreate?: boolean, enableSelect?: boolean };
  junctionName?: string;
  extraFields?: any[];
  enableCreate?: boolean;
  virtualFieldSort?: number;
  virtualFieldWidth?:'half' | 'full';
}

export interface PresetData {
  collection: string;
  fields: string[];
  widths?: Record<string, number>;
  icon?: string;
}

export async function createCollection(context: any, collectionData: CollectionData) {
  const { services, accountability, getSchema, logger } = context;
  const { CollectionsService, FieldsService, RelationsService } = services;

  // Remove undefined / franchise related fields and relations
  const cleanedCollectionData: CollectionData = {
    collection: {
      ...collectionData.collection,
      fields: collectionData.collection.fields?.filter((f) => f !== undefined),
    },
    fields: (collectionData.fields || []).filter((f) => f !== undefined),
    relations: collectionData.relations
      ? collectionData.relations.filter((r) => r !== undefined)
      : undefined,
  };

  const collectionService = new CollectionsService({
    accountability: { ...accountability, admin: true },
    schema: await getSchema(),
  });
  await createTable(await getSchema(), collectionService, cleanedCollectionData, logger);

  const fieldService = new FieldsService({
    accountability: { ...accountability, admin: true },
    schema: await getSchema(),
  });
  await createFields(await getSchema(), fieldService, cleanedCollectionData, logger);

  const relationService = new RelationsService({
    accountability: { ...accountability, admin: true },
    schema: await getSchema(),
  });
  await createRelations(await getSchema(), relationService, cleanedCollectionData, logger);
}

export async function createJunction(context: any, junctionData: JunctionData) {
  const junctionName = junctionData.junctionName ?? `${junctionData.collection}_${junctionData.relatedCollection}`;

  const collectionData: any = {
    collection: {
      collection: junctionName,
      meta: { hidden: true, icon: 'import_export', group: junctionData.group ?? undefined },
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
      ...(junctionData.extraFields || []),
      {
        collection: junctionData.collection,
        field: junctionData.virtualFieldName,
        type: 'alias',
        meta: {
          interface: 'list-m2m',
          special: ['m2m'],
          ...(junctionData.template ? { options: { template: junctionData.template, enableCreate: junctionData.enableCreate ?? true } } : undefined),
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
        field: `${junctionData.relatedCollection}_id`,
        type: junctionData.relatedIdType,
        meta: { hidden: true },
      },
    ],
    relations: [
      {
        collection: junctionName,
        field: `${junctionData.relatedCollection}_id`,
        related_collection: junctionData.relatedCollection,
        meta: {
          one_field: junctionData.relatedVirtualFieldName ?? null,
          sort_field: null,
          one_deselect_action: 'nullify',
          junction_field: `${junctionData.collection}_id`,
        },
        schema: { on_delete: 'SET NULL' },
      },
      {
        collection: junctionName,
        field: `${junctionData.collection}_id`,
        related_collection: junctionData.collection,
        meta: {
          one_field: junctionData.virtualFieldName,
          sort_field: null,
          one_deselect_action: 'nullify',
          junction_field: `${junctionData.relatedCollection}_id`,
        },
        schema: { on_delete: 'SET NULL' },
      },
    ],
  };

  if (junctionData.relatedVirtualFieldName) {
    collectionData.fields.push({
      collection: junctionData.relatedCollection,
      field: junctionData.relatedVirtualFieldName,
      type: 'alias',
      meta: {
        interface: 'list-m2m',
        special: ['m2m'],
        ...(junctionData.relatedOptions
          ? { options: junctionData.relatedOptions }
          : undefined),
      },
    });
  }

  await createCollection(context, collectionData);
}

export async function createJunctionToFiles(context: any, junctionData: JunctionData) {
  const junctionName = junctionData.junctionName ?? `${junctionData.collection}_${junctionData.relatedCollection}`;

  const collectionData: any = {
    collection: {
      collection: junctionName,
      meta: { hidden: true, icon: 'import_export', group: junctionData.group ?? undefined },
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
      ...(junctionData.extraFields || []),
      {
        collection: junctionData.collection,
        field: junctionData.virtualFieldName,
        type: 'alias',
        meta: {
          interface: 'files',
          special: ['files'],
          options: { enableSelect: false },          
          sort: junctionData.virtualFieldSort ?? 0,
          width: junctionData.virtualFieldWidth ?? 'full',
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
        field: `${junctionData.relatedCollection}_id`,
        type: junctionData.relatedIdType,
        meta: { hidden: true },
      },
    ],
    relations: [
      {
        collection: junctionName,
        field: `${junctionData.relatedCollection}_id`,
        related_collection: junctionData.relatedCollection,
        meta: {
          one_field: junctionData.relatedVirtualFieldName ?? null,
          sort_field: null,
          one_deselect_action: 'nullify',
          junction_field: `${junctionData.collection}_id`,
        },
        schema: { on_delete: 'SET NULL' },
      },
      {
        collection: junctionName,
        field: `${junctionData.collection}_id`,
        related_collection: junctionData.collection,
        meta: {
          one_field: junctionData.virtualFieldName,
          sort_field: null,
          one_deselect_action: 'nullify',
          junction_field: `${junctionData.relatedCollection}_id`,
        },
        schema: { on_delete: 'SET NULL' },
      },
    ],
  };

  await createCollection(context, collectionData);
}

export async function addPreset(context: any, presetData: PresetData) {
  const schema = await context.getSchema({ database: context.database });
  const { PresetsService } = context.services;
  const presetService = new PresetsService({ accountability: context.accountability, schema });

  try {
    const existingPresets = await presetService.readByQuery({
      filter: {
        collection: { _eq: presetData.collection },
      },
    });

    if (existingPresets.length === 0) {
      const id = await presetService.createOne({
        collection: presetData.collection,
        layout_query: {
          tabular: {
            fields: presetData.fields,
          },
        },
        layout_options: {
          tabular: {
            widths: presetData.widths ?? {},

          },
        },
        icon: presetData.icon ?? 'bookmark',
      });
      context.logger.info(`[ERP bootstrap] Created preset for ${presetData.collection} with id: ${id}`);
    } else {
      context.logger.info(
        `[ERP bootstrap] Preset for ${presetData.collection} already exists, skipping creation.`,
      );
    }
  } catch (error) {
    context.logger.error(`[ERP bootstrap] Error creating preset: ${error}`);
  }
}

async function createTable(
  schema: any,
  collectionService: any,
  collectionData: CollectionData,
  logger?: any,
) {
  const collectionExists = schema.collections?.[collectionData.collection.collection];

  if (!collectionExists || collectionExists.length === 0) {
    try {
      await collectionService.createOne(collectionData.collection);
    } catch (error) {
      if (logger) {
        logger.error(
          `Failed to create collection ${collectionData.collection.collection}: ${error}`,
        );
      }
    }
  }
}

async function createFields(
  schema: any,
  fieldService: any,
  collectionData: CollectionData,
  logger?: any,
) {
  for (const field of collectionData.fields) {
    const fieldExists =
      schema.collections?.[field.collection ?? collectionData.collection.collection]?.fields?.[
        field.field
      ];

    if (!fieldExists) {
      try {
        await fieldService.createField(
          field.collection ?? collectionData.collection.collection,
          field,
        );
      } catch (error) {
        if (logger) {
          logger.error(
            `Failed to create field: ${field.field} in collection: ${field.collection ?? collectionData.collection.collection}`,
            error,
          );
        }
      }
    } else if (field.meta?.options?.template || field.meta?.display) {
      const existingTemplate = fieldExists.meta?.options?.template;
      const desiredTemplate = field.meta?.options?.template;
      const existingDisplay = fieldExists.meta?.display;
      const desiredDisplay = field.meta?.display;
      const shouldUpdateTemplate =
        desiredTemplate !== undefined && existingTemplate !== desiredTemplate;
      const shouldUpdateDisplay =
        desiredDisplay !== undefined && existingDisplay !== desiredDisplay;

      if (shouldUpdateTemplate || shouldUpdateDisplay) {
        try {
          await fieldService.updateField(
            field.collection ?? collectionData.collection.collection,
            field.field,
            {
              meta: {
                ...(fieldExists.meta ?? {}),
                ...(shouldUpdateDisplay ? { display: desiredDisplay } : undefined),
                options: {
                  ...(fieldExists.meta?.options ?? {}),
                  ...(shouldUpdateTemplate ? { template: desiredTemplate } : undefined),
                },
              },
            },
          );
        } catch (error) {
          if (logger) {
            logger.error(
              `Failed to update field template: ${field.field} in collection: ${field.collection ?? collectionData.collection.collection}`,
              error,
            );
          }
        }
      }
    }
  }
}

async function createRelations(
  schema: any,
  relationService: any,
  collectionData: CollectionData,
  logger?: any,
) {
  if (!collectionData.relations) return;
  for (const relation of collectionData.relations) {
    const relationExists = schema.relations?.find(
      (rel: any) => rel.collection === relation.collection && rel.field === relation.field,
    );

    if (!relationExists || relationExists.length === 0) {
      try {
        await relationService.createOne(relation);
      } catch (error) {
        if (logger) {
          logger.error(
            `Failed to create relation for collection: ${relation.collection}, field: ${relation.field}, error: ${error}`
          );
        }
      }
    }
  }
}

export async function createCollectionGroupIfNotExists(
  context: BootstrapContext,
  collectionGroup: CollectionGroupType,
) {
  const { logger, services, getSchema, accountability } = context;

  const schema = await getSchema({ database: context.database });
  const { CollectionsService } = services;
  const collectionService = new CollectionsService({
    accountability: { ...accountability, admin: true },
    schema,
  });

  const groupExists = schema.collections?.[collectionGroup.name];
  if (!groupExists) {
    try {
      await collectionService.createOne({
        collection: collectionGroup.name,
        meta: {
          icon: collectionGroup.icon,
          singleton: true,
          hidden: collectionGroup.hidden ?? true,
          collapse: 'closed',
          accountability: 'all',
          archive_app_filter: true,
          sort: null,
        },
        schema: null,
      });
      logger.info(`[ERP bootstrap] Created ${collectionGroup.name} navigation group.`);
    } catch (error: any) {
      if (!error?.message?.includes('already exists')) {
        logger.warn(`[ERP bootstrap] Could not create ${collectionGroup.name} group: ${error?.message}`);
      }
    }
  }

}