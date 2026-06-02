import { createCollection, createJunction } from '../helpers/collectionHelper';
import { getPartnersBaseSchema } from './partnersBaseSchema';
import { getBillingInformationSchema } from './partnerBillingInformationSchema';
import type { BootstrapContext } from '../types';
import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';


type PartnersContext = Pick<
  BootstrapContext,
  'services' | 'logger' | 'database' | 'getSchema'
>;

export async function bootstrapPartners(context: PartnersContext): Promise<void> {
  const { logger } = context;

  logger.info('[ERP bootstrap] Partners bootstrap started.');

  await createCollection(context, getBillingInformationSchema(context.database));
  await createCollection(context, getPartnersBaseSchema(context.database));
  await createJunction(context, {
    collection: 'partners',
    group: ERP_COLLECTION_GROUP_NAMES.Partners,
    relatedCollection: 'directus_users',
    idType: 'uuid',
    relatedIdType: 'uuid',
    virtualFieldName: 'contacts',
    template: '{{directus_users_id.first_name}} {{directus_users_id.last_name}}',
  });

  logger.info('[ERP bootstrap] Partners bootstrap finished.');
}
