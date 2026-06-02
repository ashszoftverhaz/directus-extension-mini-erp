<template>
    <VDrawer v-model="openModel" direction="right" @cancel="close">
        <template #title>
            <div class="header">
                <div class="header-title">
                    <h1 class="type-title">Select driving licenses to employee</h1>
                </div>
            </div>
        </template>
        <template #actions>
            <div class="search-input" role="search">
                <v-icon class="icon-search" name="search" @click="focusSearch" />
                <input ref="searchInput" v-model="search" type="search"
                    :placeholder="searchFocused ? 'Search licences...' : ''" spellcheck="false" autocapitalize="off"
                    autocorrect="off" autocomplete="off" @focus="searchFocused = true" @blur="searchFocused = false" />
                <div class="spacer" />
                <VIcon class="icon-filter" name="filter_list" />
            </div>

            <VButton icon rounded @click="save">
                <VIcon name="check" />
            </VButton>

        </template>
        <VCard class="drawer-card">
            <VCardText class="drawer-card-text">
                <VProgressLinear v-if="loading" indeterminate />
                <VNotice v-else-if="error" type="danger">Failed to load driving licences.</VNotice>
                <div v-else-if="rows.length === 0" class="drawer-state drawer-state-empty">
                    <EmptyState
                        title="No driving licences unassigned to employees"
                        icon="group" />
                </div>
                <table v-else class="licences-table">
                    <thead>
                        <tr>
                            <th class="col-drag">
                                <VButton :class="sortAsc ? 'sort-button' : 'sort-button-flipped'" :icon="true"
                                    @click="toggleSort">
                                    <VIcon :small="true" name="sort" color="black" />
                                </VButton>
                            </th>
                            <th class="col-check">
                                <VCheckbox :model-value="allSelected" @update:model-value="toggleAll" />
                            </th>
                            <th>
                                <div class="header-cell">
                                    <span>Category</span>
                                </div>
                            </th>
                            <th>Valid until</th>
                            <th>Issuer Country</th>
                            <th class="col-international">International?</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in sortedRows" :key="row.id" :class="{ 'row-selected': row.selected }"
                            draggable="true" class="licence-row">
                            <td class="col-drag">
                            </td>
                            <td class="col-check">
                                <VCheckbox :model-value="row.selected" @click.stop
                                    @update:model-value="() => toggleRow(row.id)" />
                            </td>
                            <td>{{ row.category }}</td>
                            <td>{{ row.validity ? new
                                Date(row.validity).toLocaleDateString(undefined,
                                    { year: 'numeric', month: 'long', day: 'numeric' }) : '-' }}</td>
                            <td>{{ row.issuerCountry }}</td>
                            <td class="col-international">
                                <VIcon v-if="row.international" name="check" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </VCardText>
        </VCard>
    </VDrawer>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import EmptyState from './EmptyState.vue';

type LicenceRow = {
    id: string;
    category: string;
    validity: Date | null;
    issuerCountry: string;
    international: boolean;
    selected: boolean;
};

const props = withDefaults(
    defineProps<{
        open: boolean;
        accountId: string;
    }>(),
    {}
);


const api = useApi();
const rows = ref<LicenceRow[]>([]);
const loading = ref(true);
const error = ref(false);
const sortAsc = ref(true);
const search = ref('');
const searchFocused = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void;
    (e: 'save', value: any): void;
}>();

const openModel = computed<boolean>({
    get() {
        return props.open;
    },
    set(val: boolean) {
        emit('update:open', val);
    },
});

function close() {
    openModel.value = false;
}

function save() {
    const selectedLicenses = rows.value.filter((row) => row.selected);
    emit('save', selectedLicenses);
    openModel.value = false;
}

const fetchLicences = async () => {
    loading.value = true;
    error.value = false;

    try {
        const response = await api.get('/items/driverslicences', {
            params: {
                fields: [
                    'id',
                    'category',
                    'validity',
                    'issuer_country',
                    'isinternational',
                    'employee',
                ],
                sort: ['category'],
                filter: {
                    employee: { _null: true },
                },
            },
        });

        const data = response?.data?.data ?? [];
        rows.value = data.map((row: any) => {
            const employeeName = [row.employee?.first_name, row.employee?.last_name]
                .filter(Boolean)
                .join(' ');
            return {
                id: row.id,
                category: row.category ?? '',
                validity: row.validity ? new Date(row.validity) : null,
                issuerCountry: row.issuer_country ?? '',
                international: Boolean(row.isinternational),
                employee: employeeName || row.employee?.email || '',
                selected: false,
            };
        });
    } catch (fetchError) {
        console.error('Failed to load driving licences', fetchError);
        error.value = true;
    } finally {
        loading.value = false;
    }
};

const sortedRows = computed(() => {
    const query = search.value.trim().toLowerCase();
    const copy = rows.value.filter((row) => {
        if (!query) return true;
        return [
            row.category,
            row.validity,
            row.issuerCountry,
        ]
            .join(' ')
            .toLowerCase()
            .includes(query);
    });
    copy.sort((a, b) => {
        const result = a.category.localeCompare(b.category);
        return sortAsc.value ? result : -result;
    });
    return copy;
});

const allSelected = computed(() => rows.value.length > 0 && rows.value.every((row) => row.selected));

const toggleAll = (value: boolean) => {
    rows.value = rows.value.map((row) => ({ ...row, selected: value }));
};

const toggleRow = (id: string) => {
    rows.value = rows.value.map((row) =>
        row.id === id ? { ...row, selected: !row.selected } : row
    );
};

const toggleSort = () => {
    sortAsc.value = !sortAsc.value;
};

const focusSearch = () => {
    searchInput.value?.focus();
};

onMounted(fetchLicences);
</script>

<style scoped>
.drawer-card {
    max-inline-size: none;
    block-size: 100%;
}

.drawer-card-text {
    block-size: 100%;
}

.drawer-state {
    block-size: 100%;
}

.drawer-state-empty {
    display: flex;
    align-items: center;
    justify-content: center;
}

.licences-table {
    width: 100%;
    border-collapse: collapse;
    background-color: #ffffff;
}

.licences-table th,
.licences-table td {
    padding: 12px 10px;
    text-align: left;
    border-bottom: 1px solid var(--theme--border-color);
    vertical-align: middle;
}

.licences-table thead th {
    color: var(--theme--foreground);
    font-weight: 600;
}

.header-cell {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.sort-button {
    display: block !important;
}

.sort-button :deep(.button) {
    background: transparent !important;
    padding: 0 !important;
    box-shadow: none;
    border: none !important;
    inline-size: unset;
    block-size: unset;
}

.sort-button-flipped :deep(.button) {
    background: transparent !important;
    padding: 0 !important;
    box-shadow: none;
    border: none !important;
    inline-size: unset;
    block-size: unset;
}

.sort-button-flipped {
    transform: scaleY(-1);
}

.col-drag {
    width: 36px;
}

.col-check {
    width: 46px;
}

.col-international {
    text-align: center;
}

.drag-handle {
    cursor: grab;
    color: var(--theme--foreground-subdued);
}

.row-selected {
    background-color: var(--theme--background-subdued);
}

.search-input {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 999px;
    width: 85px;
    background-color: var(--theme--background-subdued);
    border: 1px solid var(--theme--border-color);
    transition: width 160ms ease, min-width 160ms ease;
}

.search-input:focus-within {
    width: 260px;
    min-width: 260px;
}

.search-input input {
    border: 0;
    background: transparent;
    outline: none;
    color: var(--theme--foreground);
    width: 100%;
    min-width: 0;
}

.search-input.spacer {
    flex: 1;
}

.icon-search,
.icon-filter {
    color: var(--theme--foreground-subdued);
}

.icon-search {
    cursor: pointer;
}
</style>
