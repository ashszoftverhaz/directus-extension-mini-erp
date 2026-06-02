import { bootstrapContracts } from './contracts/contractsBootstrap';
import { bootstrapCountries } from './countries/countriesBootstrap';
import { bootstrapCurrencies } from './currencies/currenciesBootstrap';
import { bootstrapDriverslicences } from './driverslicences/driverslicencesBootstrap';
import { bootstrapEmailContent } from './email-content/emailContentBootstrap';
import { bootstrapEmployees } from './employees/employeesBootstrap';
import { bootstrapLanguages } from './languages/languagesBootstrap';
import { bootstrapNotificationContent } from './notification_content/notificationContentBootstrap';
import { bootstrapPartners } from './partners/partnersBootstrap';
import { bootstrapErpPolicy } from './policies/erpPolicyBootstrap';
import { bootstrapFolders } from './folders/foldersBootstrap';
import { bootstrapTaxes } from './taxes/taxesBootstrap';
import type { BootstrapContext } from './types';
import { bootstrapContractTypes } from './contract_types/contractTypesBootstrap';
import { checkFranchiseCollection } from './helpers/franchiseHelper';
import { bootstrapMaterialCategories } from './material_categories/materialCategoriesBootstrap';
import { bootstrapInventoryChanges } from './inventory_changes/inventoryChangesBootstrap';
import { bootstrapMaterials } from './materials/materialsBootstrap';
import { checkWashingRelatedCollection } from './helpers/washingRelatedHelper';
import { bootstrapLocations } from './locations/locationsBootstrap';
import { bootstrapTrainings } from './trainings/trainingsBootstrap';
import { bootstrapAssetCategories } from './asset_categories/assetCategoriesBootstrap';
import { bootstrapAssets } from './assets/assetsBootstrap';
import { bootstrapTransactionCategories } from './transaction_categories/transactionCategoriesBootstrap';
import { bootstrapIncomes } from './incomes/incomesBootstrap';
import { bootstrapExpenses } from './expenses/expensesBootstrap';
import { bootstrapBaseSettings } from './base_settings/baseSettingsBootstrap';
import { bootstrapAccounts } from './accounts/accountsBootstrap';
import { bootstrapCollectionGroups } from './collection_groups/collectionGroupsBootstrap';

let runningBootstrap: Promise<void> | null = null;

/**
 * Orchestrates all ERP bootstraps.
 */
export async function runErpBootstrap(context: BootstrapContext): Promise<void> {
  if (runningBootstrap) return runningBootstrap;

  const { logger } = context;

  runningBootstrap = (async () => {
    logger.info('[ERP bootstrap] Runner started.');

    const franchiseCollectionExists = await checkFranchiseCollection(context);
    const washingLocationExists = await checkWashingRelatedCollection(context, 'washing_location');
    const washingUnitExists = await checkWashingRelatedCollection(context, 'washing_unit');
    const washingRelatedCollectionsExists = washingLocationExists && washingUnitExists;
    const locationsCollectionExists = await checkWashingRelatedCollection(
      context,
      'erp_locations',
    );

    await bootstrapCollectionGroups(context);
    await bootstrapFolders(context);

    await bootstrapCurrencies(context);
    await bootstrapCountries(context);
    await bootstrapTaxes(context);
    await bootstrapDriverslicences(context);
    await bootstrapEmployees(context);
    await bootstrapPartners(context);
    await bootstrapLanguages(context);
    await bootstrapEmailContent(context);
    await bootstrapNotificationContent(context);
    await bootstrapContractTypes(context);
    await bootstrapMaterialCategories(context);
    await bootstrapMaterials(context);
    await bootstrapAssetCategories(context);
    await bootstrapContracts(context, franchiseCollectionExists);
    await bootstrapTrainings(context);

    // Create a simple fallback locations collection only when:
    // - there is no washing_location collection, and
    // - there is no existing fallback locations collection with the expected name
    const shouldCreateLocations =
      !washingLocationExists && !locationsCollectionExists;
    await bootstrapLocations(context, shouldCreateLocations);

    const locationsExistOrCreated =
      locationsCollectionExists || shouldCreateLocations;

    await bootstrapInventoryChanges(
      context,
      washingRelatedCollectionsExists,
      locationsExistOrCreated,
    );

    await bootstrapAssets(
      context,
      washingRelatedCollectionsExists,
      locationsExistOrCreated,
      franchiseCollectionExists,
    );

    await bootstrapTransactionCategories(context);
    await bootstrapAccounts(context);

    await bootstrapIncomes(
      context,
      washingRelatedCollectionsExists,
      locationsExistOrCreated,
    );
    await bootstrapExpenses(
      context,
      washingRelatedCollectionsExists,
      locationsExistOrCreated,
    );

    await bootstrapBaseSettings(context);

    await bootstrapErpPolicy(context, franchiseCollectionExists, washingLocationExists);

    logger.info('[ERP bootstrap] Runner finished.');
  })()
    .catch((error) => {
      logger?.error?.(error, '[ERP bootstrap] Runner failed.');
      throw error;
    })
    .finally(() => {
      runningBootstrap = null;
    });

  return runningBootstrap;
}
