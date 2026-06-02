<template>
  <VList class="erp-nav" :nav="true" dense>
    <VListGroup :open="isRootItemActive()">
      <template v-slot:activator>
        <VListItem to="/erp" :active="isRootItemActive()">
          <VListItemIcon>
            <VIcon name="home" />
          </VListItemIcon>
          <VListItemContent>
            <VTextOverflow text="ERP Home" />
          </VListItemContent>
        </VListItem>
      </template>
    </VListGroup>
    <VListGroup v-for="group in accessableMenuGroups" :key="group.id" :open="isGroupOpen(group)">
      <template v-slot:activator>
        <VListItem>
          <VListItemIcon>
            <VIcon :name="group.icon" />
          </VListItemIcon>
          <VListItemTitle>{{ group.title }}</VListItemTitle>
        </VListItem>
      </template>
      <VListItem v-for="navItem in group.items" :key="navItem.to" :active="isNavItemActive(navItem.to)"
        :class="{ 'erp-nav-item--active': isNavItemActive(navItem.to) }" :to="navItem.to">
        <VListItemIcon>
          <VIcon :name="navItem.icon" />
        </VListItemIcon>
        <VListItemContent>
          <VTextOverflow :text="navItem.label" />
        </VListItemContent>
      </VListItem>
    </VListGroup>
  </VList>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useStores } from '@directus/extensions-sdk';

interface NavItem {
  label: string;
  to: string;
  icon: string;
  collection: string;
}

interface MenuGroup {
  id: number;
  title: string;
  icon: string;
  items: NavItem[];
}

const route = useRoute();
const { useCollectionsStore, usePermissionsStore } = useStores();
const collectionsStore = useCollectionsStore();
const permissionsStore = usePermissionsStore();

function isNavItemActive(itemTo: string) {
  return route.path.startsWith(itemTo);
}

function isRootItemActive() {
  return route.path === '/erp';
}

function isGroupOpen(group: MenuGroup) {
  return group.items.some((item) => isNavItemActive(item.to));
}

function hasPermission(navItem: NavItem) {
  return permissionsStore.hasPermission(navItem.collection, 'read');
}

function doesCollectionExist(navItem: NavItem) {
  if (navItem.collection !== 'erp_locations') {
    return true;
  }

  return collectionsStore.collections.some(
    (collection: any) => collection.collection === navItem.collection,
  );
}

const accessableMenuGroups = computed(() => {
  return menuGroups.value.map((group) => ({
    ...group,
    items: group.items.filter((item) => doesCollectionExist(item) && hasPermission(item)),
  })).filter(group => group.items.length > 0);
});

const contractsGroup: NavItem[] = [
  {
    label: 'Contracts',
    to: '/erp/contracts',
    icon: 'contract',
    collection: 'contracts',
  },
  {
    label: 'Contract Types',
    to: '/erp/contract-types',
    icon: 'contract',
    collection: 'contract_types',
  },
];

const employeesGroup: NavItem[] = [
  {
    label: 'Employees',
    to: '/erp/employees',
    icon: 'badge',
    collection: 'employees',
  },
  {
    label: 'Driving licences',
    to: '/erp/driving-licences',
    icon: 'description',
    collection: 'driverslicences',
  },
  {
    label: 'Trainings',
    to: '/erp/trainings',
    icon: 'school',
    collection: 'trainings',
  },
];

const assetsGroup: NavItem[] = [
  {
    label: 'Assets',
    to: '/erp/assets',
    icon: 'service_toolbox',
    collection: 'assets',
  },
  {
    label: 'Asset Categories',
    to: '/erp/asset-categories',
    icon: 'category',
    collection: 'asset_categories',
  },
];

const financesGroup: NavItem[] = [
  {
    label: 'Accounts',
    to: '/erp/accounts',
    icon: 'account_box',
    collection: 'accounts',
  },
  {
    label: 'Transactions',
    to: '/erp/transactions',
    icon: 'payments',
    collection: 'transactions',
  },
  {
    label: 'P&L View',
    to: '/erp/pnl-view',
    icon: 'insights',
    collection: 'incomes',
  },
  {
    label: 'Expenses',
    to: '/erp/expenses',
    icon: 'output_circle',
    collection: 'expenses',
  },
  {
    label: 'Incomes',
    to: '/erp/incomes',
    icon: 'input_circle',
    collection: 'incomes',
  },
  {
    label: 'Transaction Categories',
    to: '/erp/transaction-categories',
    icon: 'category',
    collection: 'transaction_categories',
  },
  {
    label: 'Taxes',
    to: '/erp/taxes',
    icon: 'send_money',
    collection: 'taxes',
  },
  {
    label: 'Currencies',
    to: '/erp/currencies',
    icon: 'attach_money',
    collection: 'currencies',
  },
];

const partnersGroup: NavItem[] = [
  {
    label: 'Partners',
    to: '/erp/partners',
    icon: 'people',
    collection: 'partners',
  },
  {
    label: 'Partner Billing Informations',
    to: '/erp/partner-billing-informations',
    icon: 'receipt_long',
    collection: 'partner_billing_information',
  },
];

const inventoryGroup: NavItem[] = [
  {
    label: 'Materials',
    to: '/erp/materials',
    icon: 'labs',
    collection: 'materials',
  },
  {
    label: 'Material Categories',
    to: '/erp/material-categories',
    icon: 'lab_research',
    collection: 'material_categories',
  },
  {
    label: 'Inventory',
    to: '/erp/inventories',
    icon: 'inventory',
    collection: 'materials',
  },
  {
    label: 'Inventory Changes',
    to: '/erp/inventory-changes',
    icon: 'inventory',
    collection: 'inventory_changes',
  },
  {
    label: 'Statistics',
    to: '/erp/inventory/statistics',
    icon: 'insights',
    collection: 'materials',
  },
];

const settingsGroup: NavItem[] = [
  {
    label: 'Default Settings',
    to: '/erp/settings',
    icon: 'settings',
    collection: 'erp_settings',
  },
  {
    label: 'Locations',
    to: '/erp/locations',
    icon: 'place',
    collection: 'erp_locations',
  },
];

const menuGroups = ref<MenuGroup[]>([
  { id: 1, title: 'Contracts', icon: 'contract', items: contractsGroup },
  { id: 2, title: 'Employees', icon: 'public', items: employeesGroup },
  { id: 3, title: 'Assets', icon: 'service_toolbox', items: assetsGroup },
  { id: 4, title: 'Finance', icon: 'attach_money', items: financesGroup },
  { id: 5, title: 'Partners', icon: 'people', items: partnersGroup },
  { id: 6, title: 'Inventory', icon: 'inventory', items: inventoryGroup },
  { id: 7, title: 'Settings', icon: 'settings', items: settingsGroup },
]);

</script>

<style scoped>
:global(.erp-nav .erp-nav-item--active) {
  background-color: var(--theme--background-subdued) !important;
}
</style>