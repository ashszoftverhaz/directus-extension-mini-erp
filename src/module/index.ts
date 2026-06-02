import { defineModule } from '@directus/extensions-sdk';
import './styles/erp-typography.css';
import ModuleComponent from './module.vue';
import OverviewPage from './pages/OverviewPage.vue';
import ContractsPage from './pages/contracts/ContractsPage.vue';
import ContractAddPage from './pages/contracts/ContractAddPage.vue';
import ContractEditPage from './pages/contracts/ContractEditPage.vue';
import ContractTypesPage from './pages/contract-types/ContractTypesPage.vue';
import ContractTypesAddPage from './pages/contract-types/ContractTypesAddPage.vue';
import ContractTypesEditPage from './pages/contract-types/ContractTypesEditPage.vue';
import CurrenciesPage from './pages/currencies/CurrenciesPage.vue';
import CurrenciesAddPage from './pages/currencies/CurrenciesAddPage.vue';
import CurrenciesEditPage from './pages/currencies/CurrenciesEditPage.vue';
import TaxesPage from './pages/taxes/TaxesPage.vue';
import TaxesAddPage from './pages/taxes/TaxesAddPage.vue';
import TaxesEditPage from './pages/taxes/TaxesEditPage.vue';
import DrivingLicencesPage from './pages/driving-licences/DrivingLicencesPage.vue';
import DrivingLicencesAddPage from './pages/driving-licences/DrivingLicencesAddPage.vue';
import DrivingLicencesEditPage from './pages/driving-licences/DrivingLicencesEditPage.vue';
import EmployeesPage from './pages/employees/EmployeesPage.vue';
import EmployeesAddPage from './pages/employees/EmployeesAddPage.vue';
import EmployeeEditPage from './pages/employees/EmployeeEditPage.vue';
import PartnersPage from './pages/partners/PartnersPage.vue';
import PartnersAddPage from './pages/partners/PartnersAddPage.vue';
import PartnersEditPage from './pages/partners/PartnersEditPage.vue';
import PartnerBillingPage from './pages/partner-billing/PartnerBillingPage.vue';
import PartnerBillingAddPage from './pages/partner-billing/PartnerBillingAddPage.vue';
import PartnerBillingEditPage from './pages/partner-billing/PartnerBillingEditPage.vue';
import MaterialsPage from './pages/materials/MaterialsPage.vue';
import InventoryPage from './pages/inventory/InventoryPage.vue';
import InventoryChangesPage from './pages/inventory/InventoryChangesPage.vue';
import InventoryChangeDetailsPage from './pages/inventory/InventoryChangeDetails.vue';
import InventoryProcurementPage from './pages/inventory/InventoryProcurementPage.vue';
import InventoryUsagePage from './pages/inventory/InventoryUsagePage.vue';
import InventoryCorrectionPage from './pages/inventory/InventoryCorrectionPage.vue';
import InventoryHandoverPage from './pages/inventory/InventoryHandoverPage.vue';
import InventoryStatisticsPage from './pages/inventory/InventoryStatisticsPage.vue';
import AssetsPage from './pages/assets/AssetsPage.vue';
import AssetEditPage from './pages/assets/AssetEditPage.vue';
import AssetProcurementPage from './pages/assets/AssetProcurementPage.vue';
import AssetSalePage from './pages/assets/AssetSalePage.vue';
import MaterialsAddPage from './pages/materials/MaterialsAddPage.vue';
import MaterialsEditPage from './pages/materials/MaterialsEditPage.vue';
import MaterialCategoriesAddPage from './pages/material-categories/MaterialCategoriesAddPage.vue';
import MaterialCategoriesEditPage from './pages/material-categories/MaterialCategoriesEditPage.vue';
import TrainingsPage from './pages/trainings/TrainingsPage.vue';
import TrainingsAddPage from './pages/trainings/TrainingsAddPage.vue';
import TrainingsEditPage from './pages/trainings/TrainingsEditPage.vue';
import MaterialCategoriesPage from './pages/material-categories/MaterialCategoriesPage.vue';
import AssetCategoriesPage from './pages/asset-categories/AssetCategoriesPage.vue';
import AssetCategoriesAddPage from './pages/asset-categories/AssetCategoriesAddPage.vue';
import AssetCategoriesEditPage from './pages/asset-categories/AssetCategoriesEditPage.vue';
import TransactionCategoriesPage from './pages/transaction-categories/TransactionCategoriesPage.vue';
import TransactionCategoriesEditPage from './pages/transaction-categories/TransactionCategroriesEditPage.vue';
import TransactionCategoriesAddPage from './pages/transaction-categories/TransactionCategoriesAddPage.vue';
import IncomesPage from './pages/incomes/IncomesPage.vue';
import IncomesAddPage from './pages/incomes/IncomesAddPage.vue';
import IncomesEditPage from './pages/incomes/IncomesEditPage.vue';
import ExpensesPage from './pages/expenses/ExpensesPage.vue';
import ExpenseAddPage from './pages/expenses/ExpenseAddPage.vue';
import ExpenseEditPage from './pages/expenses/ExpenseEditPage.vue';
import DefaultSettingsPage from './pages/settings/DefaultSettingsPage.vue';
import SettingsEditPage from './pages/settings/SettingsEditPage.vue';
import AccountsPage from './pages/accounts/AccountsPage.vue';
import AccountsEditPage from './pages/accounts/AccountsEditPage.vue';
import AccountsAddPage from './pages/accounts/AccountsAddPage.vue';
import TransactionsPage from './pages/transactions/TransactionsPage.vue';
import PnlViewPage from './pages/finance/PnlViewPage.vue';
import LocationsPage from './pages/locations/LocationsPage.vue';
import LocationsAddPage from './pages/locations/LocationsAddPage.vue';
import LocationsEditPage from './pages/locations/LocationsEditPage.vue';

async function hasErpLocationsCollection() {
  try {
    const response = await fetch('/items/erp_locations?limit=1&fields=id', {
      credentials: 'same-origin',
    });

    if (!(response.status === 200 || response.status === 304)) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to verify erp_locations collection existence.', error);
    return false;
  }
}

async function requireErpLocationsCollection() {
  return (await hasErpLocationsCollection()) || '/erp';
}

export default defineModule({
  id: 'erp',
  name: 'ERP',
  icon: 'warehouse',
  routes: [
    {
      path: '',
      component: ModuleComponent,
      children: [
        {
          path: '',
          component: OverviewPage,
        },
        {
          path: 'contracts',
          component: ContractsPage,
        },
        {
          path: 'contracts/add',
          component: ContractAddPage,
        },
        {
          path: 'contracts/:id',
          component: ContractEditPage,
        },
        {
          path: 'contract-types',
          component: ContractTypesPage,
        },
        {
          path: 'contract-types/add',
          component: ContractTypesAddPage,
        },
        {
          path: 'contract-types/:id',
          component: ContractTypesEditPage,
        },
        {
          path: 'currencies',
          component: CurrenciesPage,
        },
        {
          path: 'currencies/add',
          component: CurrenciesAddPage,
        },
        {
          path: 'currencies/:id',
          component: CurrenciesEditPage,
        },
        {
          path: 'taxes',
          component: TaxesPage,
        },
        {
          path: 'taxes/add',
          component: TaxesAddPage,
        },
        {
          path: 'taxes/:id',
          component: TaxesEditPage,
        },
        {
          path: 'employees',
          component: EmployeesPage,
        },
        {
          path: 'employees/add',
          component: EmployeesAddPage,
        },
        {
          path: 'employees/:id',
          component: EmployeeEditPage,
        },
        {
          path: 'driving-licences',
          component: DrivingLicencesPage,
        },
        {
          path: 'driving-licences/add',
          component: DrivingLicencesAddPage,
        },
        {
          path: 'driving-licences/:id',
          component: DrivingLicencesEditPage,
        },
        {
          path: 'trainings',
          component: TrainingsPage,
        },
        {
          path: 'trainings/add',
          component: TrainingsAddPage,
        },
        {
          path: 'trainings/:id',
          component: TrainingsEditPage,
        },
        {
          path: 'partners',
          component: PartnersPage,
        },
        {
          path: 'partners/add',
          component: PartnersAddPage,
        },
        {
          path: 'partners/:id',
          component: PartnersEditPage,
        },
        {
          path: 'partner-billing-informations',
          component: PartnerBillingPage,
        },
        {
          path: 'partner-billing-informations/add',
          component: PartnerBillingAddPage,
        },
        {
          path: 'partner-billing-informations/:id',
          component: PartnerBillingEditPage,
        },
        {
          path: 'materials',
          component: MaterialsPage,
        },
        {
          path: 'materials/add',
          component: MaterialsAddPage,
        },
        {
          path: 'materials/:id',
          component: MaterialsEditPage,
        },
        {
          path: 'material-categories',
          component: MaterialCategoriesPage,
        },
        {
          path: 'material-categories/add',
          component: MaterialCategoriesAddPage,
        },
        {
          path: 'material-categories/:id',
          component: MaterialCategoriesEditPage,
        },
        {
          path: 'inventories',
          component: InventoryPage,
        },
        {
          path: 'inventory/statistics',
          component: InventoryStatisticsPage,
        },
        {
          path: 'inventories/procurement',
          component: InventoryProcurementPage,
        },
        {
          path: 'inventories/usage',
          component: InventoryUsagePage,
        },
        {
          path: 'inventories/correction',
          component: InventoryCorrectionPage,
        },
        {
          path: 'inventories/handover',
          component: InventoryHandoverPage,
        },
        {
          path: 'inventory-changes',
          component: InventoryChangesPage,
        },
        {
          path: 'inventory-changes/:id',
          component: InventoryChangeDetailsPage,
        },
        {
          path: 'assets',
          component: AssetsPage,
        },
        {
          path: 'assets/:id',
          component: AssetEditPage,
        },
        {
          path: 'assets/add/:id',
          component: AssetProcurementPage,
        },
        {
          path: 'assets/sale/:id',
          component: AssetSalePage,
        },
        {
          path: 'asset-categories',
          component: AssetCategoriesPage,
        },
        {
          path: 'asset-categories/add',
          component: AssetCategoriesAddPage,
        },
        {
          path: 'asset-categories/:id',
          component: AssetCategoriesEditPage,
        },
        {
          path: 'transaction-categories',
          component: TransactionCategoriesPage,
        },
        {
          path: 'transaction-categories/:id',
          component: TransactionCategoriesEditPage,
        },
        {
          path: 'transaction-categories/add',
          component: TransactionCategoriesAddPage,
        },
        {
          path: 'incomes',
          component: IncomesPage,
        },
        {
          path: 'incomes/add',
          component: IncomesAddPage,
        },
        {
          path: 'incomes/:id',
          component: IncomesEditPage,
        },
        {
          path: 'expenses',
          component: ExpensesPage,
        },
        {
          path: 'expenses/add/:id',
          component: ExpenseAddPage,
        },
        {
          path: 'expenses/:id',
          component: ExpenseEditPage,
        },

        {
          path: 'settings',
          component: DefaultSettingsPage,
        },
        {
          path: 'settings/:id',
          component: SettingsEditPage,
        },

        {
          path: 'accounts',
          component: AccountsPage,
        },
        {
          path: 'accounts/:id',
          component: AccountsEditPage,
        },
        {
          path: 'accounts/add',
          component: AccountsAddPage,
        },
        {
          path: 'transactions',
          component: TransactionsPage,
        },
        {
          path: 'pnl-view',
          component: PnlViewPage,
        },
        {
          path: 'locations',
          component: LocationsPage,
          beforeEnter: requireErpLocationsCollection,
        },
        {
          path: 'locations/add',
          component: LocationsAddPage,
          beforeEnter: requireErpLocationsCollection,
        },
        {
          path: 'locations/:id',
          component: LocationsEditPage,
          beforeEnter: requireErpLocationsCollection,
        },
      ],
    },
  ],
});
