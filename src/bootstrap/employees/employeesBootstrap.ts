import { createCollection, createJunction } from '../helpers/collectionHelper';
import { getEmployeesSchema } from './employeesSchema';
import type { BootstrapContext } from '../types';
import { ERP_COLLECTION_GROUP_NAMES } from '../collection_groups/collectionGroupsData';

type EmployeesContext = Pick<BootstrapContext, 'services' | 'logger' | 'database' | 'getSchema'>;

export async function bootstrapEmployees(context: EmployeesContext): Promise<void> {
  const { logger } = context;

  logger.info('[ERP bootstrap] Employees bootstrap started.');

  await createCollection(context, getEmployeesSchema(context.database));
  await createJunction(context, {
    collection: 'employees',
    relatedCollection: 'taxes',
    idType: 'uuid',
    relatedIdType: 'uuid',
    virtualFieldName: 'salary_taxes_applied',
    template: '{{taxes_id.name}} ({{taxes_id.tax_type}}: {{taxes_id.tax_value}})',
    junctionName: 'employees_salary_taxes',
    group: ERP_COLLECTION_GROUP_NAMES.Employees,
  });
  await createJunction(context, {
    collection: 'employees',
    relatedCollection: 'taxes',
    idType: 'uuid',
    relatedIdType: 'uuid',
    virtualFieldName: 'commission_taxes_applied',
    template: '{{taxes_id.name}} ({{taxes_id.tax_type}}: {{taxes_id.tax_value}})',
    junctionName: 'employees_commission_taxes',
    group: ERP_COLLECTION_GROUP_NAMES.Employees,
  });
  await addEmployeesPreset(context as BootstrapContext);

  logger.info('[ERP bootstrap] Employees bootstrap finished.');
}

async function addEmployeesPreset(context: BootstrapContext): Promise<void> {
  const schema = await context.getSchema({ database: context.database });
  const { PresetsService } = context.services;
  const presetService = new PresetsService({
    accountability: context.accountability,
    schema,
  });

  try {
    const existingPresets = await presetService.readByQuery({
      filter: { collection: { _eq: 'employees' } },
    });

    if (existingPresets.length === 0) {
      const id = await presetService.createOne({
        collection: 'employees',
        layout_query: {
          tabular: {
            fields: ['account.first_name', 'account.last_name', 'position', 'seniority', 'employment_start_date'],
          },
        },
        layout_options: {
          tabular: {
            widths: {
              'account.first_name': 200,
              'account.last_name': 200,
              position: 160,
              seniority: 120,
              employment_start_date: 140,
          },
        },
        icon: 'person_play',
      }});
      context.logger.info(`[ERP bootstrap] Created preset for employees with id: ${id}`);
    } else {
      context.logger.info(
        '[ERP bootstrap] Preset for employees already exists, skipping creation.',
      );
    }
  } catch (error) {
    context.logger.error(`[ERP bootstrap] Error creating employees preset: ${error}`);
  }
}
