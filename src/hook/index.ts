import { defineHook } from '@directus/extensions-sdk';
import { runErpBootstrap } from '../bootstrap/bootstrapRunner';
import { ERP_POLICY_NAME } from '../bootstrap/policies/names';
import type { BootstrapContext } from '../bootstrap/types';
import { SCHEDULED_JOBS } from '../scheduled-events/registry';
import { runScheduledJob } from '../scheduled-events/runner';
import { createFolder } from '../bootstrap/helpers/folderCreationHelper';
import { contractCreatingHandler } from '../flows/contracts/create';
import { contractUpdatingHandler } from '../flows/contracts/update';
import { validateContractTypeDeletion } from '../flows/contract_types/validateDeletion';
import { materialCreatingHandler } from '../flows/materials/create';
import { generateAssetCode } from '../flows/assets/assetCodeGenerator';
import { ASSETS_COLLECTION } from '../bootstrap/assets/assetsSchema';
import { computeContractStatus } from '../shared/contracts/contractStatus';
import {
  ERP_ROOT_FOLDER,
  CONTRACTS_COLLECTION,
  extractFileIds,
  FRANCHISE_FOLDER_SUFFIX,
} from '../shared/contracts/constants';
import { CONTRACT_TYPES_COLLECTION } from '../bootstrap/contract_types/contractTypesSchema';

const DRIVERS_LICENCES_FOLDER = 'Licenses';
const DRIVERSLICENCES_COLLECTION = 'driverslicences';
const DRIVER_FILE_FIELDS = ['front_of_licence_image', 'back_of_licence_image'] as const;

function stripErpModuleFromSettings(settings: any) {
  if (!settings || !Array.isArray(settings.module_bar)) return settings;

  return {
    ...settings,
    module_bar: settings.module_bar.filter((item: any) => {
      if (typeof item === 'string') return item !== 'erp';
      if (item && typeof item === 'object') return item.id !== 'erp';
      return true;
    }),
  };
}

function stripErpModule(payload: any) {
  if (Array.isArray(payload)) {
    return payload.map((settings) => stripErpModuleFromSettings(settings));
  }
  return stripErpModuleFromSettings(payload);
}

export default defineHook(({ init, schedule, filter, action }, context: any) => {
  init('app.after', async () => {
    const bootstrapContext: BootstrapContext = {
      services: context.services,
      logger: context.logger,
      database: context.database,
      accountability: context.accountability,
      getSchema: context.getSchema,
    };

    await runErpBootstrap(bootstrapContext);
  });

  // Schedule all ERP scheduled jobs
  SCHEDULED_JOBS.forEach((job) => {
    schedule(job.cron, async () => {
      await runScheduledJob(job, context);
    });
  });

  // - On create: always compute contract status from signed_at + expiry_date
  filter('items.create', (payload: any, meta: any) => {
    if (meta?.collection !== CONTRACTS_COLLECTION) return payload;
    const nextPayload = { ...(payload ?? {}) };
    nextPayload.status = computeContractStatus({
      signedAt: nextPayload.signed_at,
      expiryDate: nextPayload.expiry_date,
    });
    return nextPayload;
  });

  // - On create: always generate asset code for new assets
  filter('items.create', async (payload: any, meta: any) => {
    if (meta?.collection !== ASSETS_COLLECTION) return payload;

    const nextPayload = { ...(payload ?? {}) };

    const bootstrapContext: BootstrapContext = {
      services: context.services,
      logger: context.logger,
      database: context.database,
      accountability: context.accountability,
      getSchema: context.getSchema,
    };

    const assetCategoryId = nextPayload.asset_category ?? null;

    try {
      const generatedCode = await generateAssetCode(assetCategoryId, bootstrapContext);
      nextPayload.code = generatedCode;
      context.logger?.info?.(
        `Generated asset code: ${generatedCode} for new asset (category: ${assetCategoryId})`,
      );
    } catch (error) {
      context.logger?.error?.(
        `Error generating asset code for new asset (category: ${assetCategoryId}): ${error}`,
      );
      // If code generation fails, leave payload as-is so validation can surface an error
    }

    return nextPayload;
  });

  // - On update: if user tries to patch the status or changes date fields, recompute and override
  // - Also prevent contract_id modifications
  filter('items.update', async (payload: any, meta: any) => {
    if (meta?.collection !== CONTRACTS_COLLECTION) return payload;

    const patch = { ...(payload ?? {}) } as any;

    // Prevent contract_id modifications (but allow initial setting when null)
    if (Object.prototype.hasOwnProperty.call(patch, 'contract_id')) {
      const id = meta?.key ?? (Array.isArray(meta?.keys) ? meta.keys[0] : null);

      if (id) {
        const schema = await context.getSchema({ database: context.database });
        const { ItemsService } = context.services;
        const contractsService = new ItemsService(CONTRACTS_COLLECTION, {
          accountability: { admin: true },
          schema,
        });

        try {
          const current = (await contractsService.readOne(id, {
            fields: ['contract_id'],
          })) as any;

          const currentContractId = current?.contract_id;
          const attemptedContractId = patch.contract_id;

          if (
            currentContractId !== null &&
            currentContractId !== undefined &&
            currentContractId !== attemptedContractId
          ) {
            context.logger?.warn(
              `Contract ID modification attempt blocked for contract ${id}: ` +
                `attempted to change from "${currentContractId}" to "${attemptedContractId}". ` +
                `This field is read-only.`,
            );

            delete patch.contract_id;
          }
        } catch (error) {
          context.logger?.error(`Error checking contract_id for contract ${id}: ${error}`);
        }
      } else {
        // If we can't determine the ID, allow the update (might be initial generation)
      }
    }

    const hasRelevant =
      Object.prototype.hasOwnProperty.call(patch, 'status') ||
      Object.prototype.hasOwnProperty.call(patch, 'signed_at') ||
      Object.prototype.hasOwnProperty.call(patch, 'expiry_date');

    if (!hasRelevant) return patch;

    const id = meta?.key ?? (Array.isArray(meta?.keys) ? meta.keys[0] : null);
    if (!id) {
      delete patch.status;
      return patch;
    }

    const schema = await context.getSchema({ database: context.database });
    const { ItemsService } = context.services;
    const contractsService = new ItemsService(CONTRACTS_COLLECTION, {
      accountability: { admin: true },
      schema,
    });

    const current = (await contractsService.readOne(id, {
      fields: ['signed_at', 'expiry_date'],
    })) as any;

    const signedAt = Object.prototype.hasOwnProperty.call(patch, 'signed_at')
      ? patch.signed_at
      : current?.signed_at;
    const expiryDate = Object.prototype.hasOwnProperty.call(patch, 'expiry_date')
      ? patch.expiry_date
      : current?.expiry_date;

    patch.status = computeContractStatus({ signedAt, expiryDate });
    return patch;
  });

  // - On update: if asset category changes, regenerate asset code based on the new category
  filter('items.update', async (payload: any, meta: any) => {
    if (meta?.collection !== ASSETS_COLLECTION) return payload;

    const patch = { ...(payload ?? {}) } as any;

    const id = meta?.key ?? (Array.isArray(meta?.keys) ? meta.keys?.[0] : null);
    if (!id) {
      // Without a specific asset ID we can't reliably compare categories, so leave payload as-is.
      return patch;
    }

    const schema = await context.getSchema({ database: context.database });
    const { ItemsService } = context.services;

    const assetsService = new ItemsService(ASSETS_COLLECTION, {
      accountability: { admin: true },
      schema,
    });

    let currentCategoryId: string | null = null;

    try {
      const current = (await assetsService.readOne(id, {
        fields: ['asset_category'],
      })) as any;
      currentCategoryId =
        typeof current?.asset_category === 'object' && current.asset_category !== null
          ? String((current.asset_category as any)?.id ?? '')
          : current?.asset_category != null
            ? String(current.asset_category)
            : null;
    } catch (error) {
      context.logger?.warn?.(
        `Failed to read current asset category for asset ${id} during code regeneration: ${error}`,
      );
    }

    const hasAssetCategoryInPatch = Object.prototype.hasOwnProperty.call(patch, 'asset_category');

    if (!hasAssetCategoryInPatch) {
      // Category not being changed; keep existing code.
      return patch;
    }

    const nextCategoryRaw = patch.asset_category;
    const nextCategoryId =
      typeof nextCategoryRaw === 'object' && nextCategoryRaw !== null
        ? String((nextCategoryRaw as any)?.id ?? '')
        : nextCategoryRaw != null
          ? String(nextCategoryRaw)
          : null;

    if (nextCategoryId === currentCategoryId || !nextCategoryId) {
      return patch;
    }

    const bootstrapContext: BootstrapContext = {
      services: context.services,
      logger: context.logger,
      database: context.database,
      accountability: context.accountability,
      getSchema: context.getSchema,
    };

    try {
      const generatedCode = await generateAssetCode(nextCategoryId, bootstrapContext);
      patch.code = generatedCode;
      context.logger?.info?.(
        `Regenerated asset code for asset ${id}: ${generatedCode} (category changed from ${currentCategoryId} to ${nextCategoryId})`,
      );
    } catch (error) {
      context.logger?.error?.(
        `Error regenerating asset code for asset ${id} (new category: ${nextCategoryId}): ${error}`,
      );
      // If code regeneration fails, keep existing code unchanged.
    }

    return patch;
  });

  action('items.create', async (meta, hookContext) => {
    if (meta.collection === CONTRACTS_COLLECTION) {
      await contractCreatingHandler(meta, context);
    }

    if (meta.collection === 'materials') {
      await materialCreatingHandler(meta, context);
    }

    if (meta.collection !== DRIVERSLICENCES_COLLECTION) return;

    const accountability =
      meta?.accountability ?? hookContext?.accountability ?? context.accountability;

    const schema = await context.getSchema({ database: context.database });
    const { ItemsService } = context.services;
    const driversLicencesService = new ItemsService(DRIVERSLICENCES_COLLECTION, {
      accountability: { ...accountability, admin: true },
      schema,
    });

    const employeeId =
      meta?.payload?.employee ??
      (await driversLicencesService.readOne(meta.key, { fields: ['employee'] }))?.employee;

    if (!employeeId) return;
    
    const employeesService = new ItemsService('directus_users', {
      accountability: { ...accountability, admin: true },
      schema,
    });

    const employee = await employeesService.readOne(employeeId, {
      fields: ['first_name', 'last_name', 'franchise.franchise_id.name'],
    });

    const folderContext: BootstrapContext = {
      services: context.services,
      logger: context.logger,
      database: context.database,
      accountability,
      getSchema: context.getSchema,
    };

    // making sure they exist... if the bootstrapping would fail this creates them regardles.
    const erpRootFolder = await createFolder(folderContext, ERP_ROOT_FOLDER);
    if (!erpRootFolder?.id) return;

    let nextFolderId = erpRootFolder.id;
    if ((employee?.franchise?.[0] as {franchise_id: {name: string}})?.franchise_id?.name) {
      const franchiseFolder = await createFolder(folderContext, `${(employee.franchise[0] as {franchise_id: {name: string}}).franchise_id.name}${FRANCHISE_FOLDER_SUFFIX}`, {
        parentId: erpRootFolder.id,
      });
      nextFolderId = franchiseFolder?.id ?? nextFolderId;    
    }
    

    const driversLicencesFolder = await createFolder(folderContext, DRIVERS_LICENCES_FOLDER, {
      parentId: nextFolderId,
    });
    if (!driversLicencesFolder?.id) return;

    const userFolderName = `${employee?.first_name ?? 'Unknown'} ${employee?.last_name ?? 'User'}`;
    const userFolder = await createFolder(folderContext, userFolderName, {
      parentId: driversLicencesFolder.id,
    });
    if (!userFolder?.id) return;

    let fileIds = extractFileIds(meta?.payload, DRIVER_FILE_FIELDS);

    if (fileIds.length === 0) {
      const created = await driversLicencesService.readOne(meta.key, {
        fields: [...DRIVER_FILE_FIELDS],
      });
      fileIds = extractFileIds(created as Record<string, unknown> | null, DRIVER_FILE_FIELDS);
    }

    if (fileIds.length === 0) return;

    const filesService = new ItemsService('directus_files', {
      accountability: { ...accountability, admin: true },
      schema,
    });

    for (const fileId of fileIds) {
      await filesService.updateOne(fileId, { folder: userFolder.id });
    }
  });

  action('items.update', async (meta) => {
    if (meta.collection === CONTRACTS_COLLECTION) {
      await contractUpdatingHandler(meta, context);
    }
  });

  // CONTRACT TYPES
  // Prevent deletion of contract types if they are referenced by contracts
  filter('items.delete', async (keys: string | string[], meta: any) => {
    if (meta?.collection !== CONTRACT_TYPES_COLLECTION) return keys;

    const bootstrapContext: BootstrapContext = {
      services: context.services,
      logger: context.logger,
      database: context.database,
      accountability: context.accountability,
      getSchema: context.getSchema,
    };

    await validateContractTypeDeletion(keys, bootstrapContext);
    return keys;
  });

  filter('settings.read', async (payload, meta, hookContext) => {
    const accountability = meta?.accountability ?? hookContext?.accountability;

    if (!accountability) return stripErpModule(payload);
    if (accountability.admin) return payload;

    const userId = accountability.user;
    if (!userId) return stripErpModule(payload);

    const schema = await context.getSchema({ database: context.database });
    const { PoliciesService, AccessService } = context.services;

    const policyService = new PoliciesService({
      accountability: { ...accountability, admin: true },
      schema,
    });
    const accessService = new AccessService({
      accountability: { ...accountability, admin: true },
      schema,
    });

    const existingPolicies = await policyService.readByQuery({
      filter: { name: { _eq: ERP_POLICY_NAME } },
      limit: 1,
    });
    const policy = Array.isArray(existingPolicies) ? existingPolicies[0] : null;
    if (!policy) return stripErpModule(payload);

    const roles = Array.isArray(accountability.roles) ? accountability.roles : [];
    const accessFilter: any = {
      policy: { _eq: policy.id },
      _or: [{ user: { _eq: userId } }],
    };
    if (roles.length > 0) accessFilter._or.push({ role: { _in: roles } });

    const accessRecords = await accessService.readByQuery({
      filter: accessFilter,
      limit: 1,
    });
    const hasAccess = Array.isArray(accessRecords) && accessRecords.length > 0;

    return hasAccess ? payload : stripErpModule(payload);
  });

  action('assets.items.create', async (meta) => {
    const schema = await context.getSchema({ database: context.database });
    const { ItemsService } = context.services;
    const expenseService = new ItemsService(
      'expenses',
      {
        accountability: { admin: true },
        schema,
      }
    );

    const expensesAssetsService = new ItemsService(
      'expenses_assets',
      {
        accountability: { admin: true },
        schema,
      }
    );

    const newItem = await expenseService.createOne({
      name: `Asset Procurement: ${meta?.payload?.code ?? 'Unnamed'}`,
      expense_type: 'asset',
      payment_due_date: meta?.payload?.payment_due_date ?? new Date().toISOString(),
      amount: meta?.payload?.purchase_amount ?? 0,
      currency: meta?.payload?.purchase_currency ?? 'EUR',
      location: meta?.payload?.location ?? null,
    });

    await expensesAssetsService.createOne({
      expenses_id: newItem,
      assets_id: meta.key,
    });
  });

  action('inventory_changes.items.create', async (meta) => {
    const schema = await context.getSchema({ database: context.database });
    const { ItemsService } = context.services;
    const expenseService = new ItemsService(
      'expenses',
      {
        accountability: { admin: true },
        schema,
      }
    );

    const expensesInventoryChangesService = new ItemsService(
      'expenses_inventory_changes',
      {
        accountability: { admin: true },
        schema,
      }
    );

    const currencyService = new ItemsService(
      'currencies',
      {
        accountability: { admin: true },
        schema,
      }
    );

    const eurCurrency = await currencyService.readByQuery({
      filter: { short_name: { _eq: 'EUR' } },
      limit: 1,
    });

    const currencyId = Array.isArray(eurCurrency) && eurCurrency.length > 0 ? eurCurrency[0].id : null;

    const newItem = await expenseService.createOne({
      name: `Inventory Procurement`,
      expense_type: 'inventory_change',
      payment_due_date: new Date().toISOString(),
      amount: 0, 
      currency: currencyId,
      location: meta?.payload?.source_location ?? null,
    });
    
    await expensesInventoryChangesService.createOne({
      expenses_id: newItem,
      inventory_changes_id: meta.key,
    });
  });
});
