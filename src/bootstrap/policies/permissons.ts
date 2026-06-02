import { ACCOUNTS_GENERAL_ACCESS } from "../accounts/accountsPermissions";
import { ASSET_CATEGORIES_GENERAL_ACCESS } from "../asset_categories/assetCategoriesPermissions";
import { ASSETS_FRANCHISE_ADMIN_ACCESS, ASSETS_FULL_ACCESS, ASSETS_SUPERVISOR_ACCESS } from "../assets/assetsPermissions";
import { BASE_SETTINGS_GENERAL_ACCESS } from "../base_settings/baseSettingsPermissions";
import { CONTRACT_TYPES_GENERAL_ACCESS } from "../contract_types/constractTypesPermissions";
import { CONTRACTS_FRANCHISE_ADMIN_ACCESS, CONTRACTS_FULL_ACCESS, CONTRACTS_SUPERVISOR_ACCESS } from "../contracts/contractsPermissions";
import { COUNTRIES_GENERAL_ACCESS } from "../countries/countriesPermissions";
import { CURRENCIES_GENERAL_ACCESS } from "../currencies/currenciesPermissions";
import { DRIVERSLICENCES_GENERAL_ACCESS } from "../driverslicences/driverslicencesPermissions";
import { EMAIL_CONTENT_GENERAL_ACCESS } from "../email-content/emailContentPermissions";
import { EMPLOYEES_GENERAL_ACCESS } from "../employees/employeesPermissions";
import { EXPENSES_FRANCHISE_ADMIN_ACCESS, EXPENSES_FULL_ACCESS, EXPENSES_SUPERVISOR_ACCESS } from "../expenses/expensesPermissions";
import { FOLDERS_GENERAL_ACCESS } from "../folders/foldersPermissions";
import { INCOMES_FRANCHISE_ADMIN_ACCESS, INCOMES_FULL_ACCESS, INCOMES_SUPERVISOR_ACCESS } from "../incomes/incomesPermissions";
import { INVENTORY_CHANGES_FRANCHISE_ADMIN_ACCESS, INVENTORY_CHANGES_FULL_ACCESS, INVENTORY_CHANGES_SUPERVISOR_ACCESS } from "../inventory_changes/inventoryChangesPermissions";
import { LANGUAGES_GENERAL_ACCESS } from "../languages/languagesPermissions";
import { MATERIAL_CATEGORIES_GENERAL_ACCESS } from "../material_categories/materialCategoriessPermissions";
import { MATERIALS_GENERAL_ACCESS } from "../materials/materialsPermissions";
import { NOTIFICATION_CONTENT_GENERAL_ACCESS } from "../notification_content/notificationContentPermissions";
import { PARTNERS_GENERAL_ACCESS } from "../partners/partnersPermissions";
import { TAXES_GENERAL_ACCESS } from "../taxes/taxesPermissions";
import { TRAININGS_GENERAL_ACCESS } from "../trainings/trainingsPermissions";
import { TRANSACTION_CATEGORIES_GENERAL_ACCESS } from "../transaction_categories/transactionCategoriesPermissions";
import { DIRECTUS_FILES_FRANCHISE_ADMIN_ACCESS, DIRECTUS_FILES_SUPERVISOR_ACCESS } from "./directusFilesPermissions";
import { DIRECTUS_USERS_FRANCHISE_ADMIN_ACCESS, DIRECTUS_USERS_SUPERVISOR_ACCESS } from "./directusUsersPermissions";
import { LOCATIONS_GENERAL_ACCESS } from "../locations/locationsPermissions";

export const generalPermissions = [
    ...ACCOUNTS_GENERAL_ACCESS,
    ...ASSET_CATEGORIES_GENERAL_ACCESS,
    ...BASE_SETTINGS_GENERAL_ACCESS,
    ...CONTRACT_TYPES_GENERAL_ACCESS,
    ...COUNTRIES_GENERAL_ACCESS,
    ...CURRENCIES_GENERAL_ACCESS,
    ...DRIVERSLICENCES_GENERAL_ACCESS,
    ...EMAIL_CONTENT_GENERAL_ACCESS,
    ...EMPLOYEES_GENERAL_ACCESS,
    ...FOLDERS_GENERAL_ACCESS,
    ...LANGUAGES_GENERAL_ACCESS,
    ...LOCATIONS_GENERAL_ACCESS,
    ...MATERIAL_CATEGORIES_GENERAL_ACCESS,
    ...MATERIALS_GENERAL_ACCESS,
    ...NOTIFICATION_CONTENT_GENERAL_ACCESS,
    ...PARTNERS_GENERAL_ACCESS,
    ...TAXES_GENERAL_ACCESS,
    ...TRAININGS_GENERAL_ACCESS,
    ...TRANSACTION_CATEGORIES_GENERAL_ACCESS
];

export const fullAccessPermissions = [
    ...generalPermissions,
    ...ASSETS_FULL_ACCESS,
    ...CONTRACTS_FULL_ACCESS,
    ...DIRECTUS_FILES_FRANCHISE_ADMIN_ACCESS,
    ...DIRECTUS_USERS_FRANCHISE_ADMIN_ACCESS,
    ...EXPENSES_FULL_ACCESS,
    ...INCOMES_FULL_ACCESS,
    ...INVENTORY_CHANGES_FULL_ACCESS
];

export const franchisePermissions = [
    ...ASSETS_FRANCHISE_ADMIN_ACCESS,
    ...CONTRACTS_FRANCHISE_ADMIN_ACCESS,
    ...DIRECTUS_FILES_FRANCHISE_ADMIN_ACCESS,
    ...DIRECTUS_USERS_FRANCHISE_ADMIN_ACCESS,
    ...EXPENSES_FRANCHISE_ADMIN_ACCESS,
    ...INCOMES_FRANCHISE_ADMIN_ACCESS,
    ...INVENTORY_CHANGES_FRANCHISE_ADMIN_ACCESS
];

export const supervisorPermissions = [
    ...ASSETS_SUPERVISOR_ACCESS,
    ...CONTRACTS_SUPERVISOR_ACCESS,
    ...DIRECTUS_FILES_SUPERVISOR_ACCESS,
    ...DIRECTUS_USERS_SUPERVISOR_ACCESS,
    ...EXPENSES_SUPERVISOR_ACCESS,
    ...INCOMES_SUPERVISOR_ACCESS,
    ...INVENTORY_CHANGES_SUPERVISOR_ACCESS
];
  
  