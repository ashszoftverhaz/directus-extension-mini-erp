<template>
  <VDrawer
    v-model="openModel"
    direction="right"
    @cancel="close"
  >
    <template #title>
      <div class="header">
        <div class="header-title">
          <h1 class="type-title">{{ drawerTitle }}</h1>
        </div>
      </div>
    </template>

    <template #actions>
      <VButton
        icon
        rounded
        :loading="isSaving"
        :disabled="!canSave || isSaving"
        @click="save"
      >
        <VIcon name="check" />
      </VButton>
    </template>

    <div class="drawer-batch-content">
      <div class="v-form grid">
        <VNotice v-if="validationNotice" type="warning">
          {{ validationNotice }}
        </VNotice>

        <VNotice v-if="keys.length === 0" type="info">
          Select at least one item to batch edit.
        </VNotice>

        <VNotice v-else-if="editableFields.length === 0" type="warning">
          No editable fields were found for this collection.
        </VNotice>

        <template v-else>
          <div v-for="field in editableFields" :key="field.field" class="field full bulk-field">
            <div class="bulk-field-header">
              <VCheckbox
                :model-value="!!enabled[field.field]"
                @update:model-value="(val: boolean) => setEnabled(String(field.field), val)"
              />

              <div class="field-label type-label bulk-field-labels">
                <div class="field-label-content bulk-field-label">
                  {{ fieldLabel(field) }}
                  <div v-if="isRequired(field)" class="required v-text-overflow">*</div>
                </div>
              </div>
            </div>

            <div class="bulk-field-body" :class="{ disabled: !enabled[String(field.field)] }">
              <VForm v-model="formData" :fields="[field]" />
            </div>

            <small v-if="enabled[String(field.field)] && validationErrors[String(field.field)]" class="type-note bulk-field-error">
              <p>{{ validationErrors[String(field.field)] }}</p>
            </small>
          </div>

          <VNotice v-if="hasError" type="danger" class="error">
            {{ errorMessage }}
          </VNotice>
        </template>
      </div>
    </div>
  </VDrawer>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, toRef, watch } from 'vue';
import { useBulkEditFields } from '../../composables/useBulkEditFields';
import { useBulkUpdate } from '../../composables/useBulkUpdate';

const props = withDefaults(
  defineProps<{
    open: boolean;
    collection: string;
    keys: Array<string | number>;
    excludeFields?: string[];
  }>(),
  {
    excludeFields: () => [],
  }
);

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'saved'): void;
}>();

const collection = toRef(props, 'collection');
const keys = toRef(props, 'keys');

const { editableFields } = useBulkEditFields(collection, {
  exclude: props.excludeFields,
});

const { bulkUpdateItems, isSaving, hasError, errorMessage, resetError } = useBulkUpdate();

const enabled = reactive<Record<string, boolean>>({});
const formData = ref<Record<string, any>>({});

const validationErrors = reactive<Record<string, string>>({});
const validationNotice = ref<string>('');

const enabledFieldNames = computed(() => editableFields.value.map((f: any) => String(f.field)).filter((n) => enabled[n] === true));

const drawerTitle = computed(() => {
  const count = props.keys.length;
  const noun = count === 1 ? 'Item' : 'Items';
  return `Batch Editing ${count} ${noun}`;
});

const openModel = computed<boolean>({
  get() {
    return props.open;
  },
  set(val: boolean) {
    emit('update:open', val);
  },
});

const canSave = computed(() => {
  return props.keys.length > 0 && enabledFieldNames.value.length > 0;
});

function fieldLabel(field: any): string {
  const label = field?.meta?.label;
  if (typeof label === 'string' && label.trim()) return label;

  const fieldKey = String(field?.field ?? '').trim();
  if (!fieldKey) return 'Field';

  return formatFieldName(fieldKey);
}

function formatFieldName(fieldKey: string): string {
  const withSpaces = fieldKey
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim();

  return withSpaces.replace(/\b\w/g, (c) => c.toUpperCase());
}

function setEnabled(fieldName: string, on: boolean) {
  enabled[fieldName] = on;
  if (!on) {
    const next = { ...(formData.value ?? {}) };
    delete next[fieldName];
    formData.value = next;
  }
  if (!on) delete validationErrors[fieldName];
}

function resetFormState() {
  for (const k of Object.keys(enabled)) delete enabled[k];
  formData.value = {};
  for (const k of Object.keys(validationErrors)) delete validationErrors[k];
  validationNotice.value = '';
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) resetFormState();
  }
);

watch(
  () => props.collection,
  () => {
    resetFormState();
  }
);

function close() {
  resetError();
  validationNotice.value = '';
  openModel.value = false;
}

function buildPatchObject(): Record<string, any> {
  const patch: Record<string, any> = {};

  for (const fieldName of enabledFieldNames.value) {
    patch[fieldName] = (formData.value ?? {})[fieldName];
  }

  return patch;
}

async function save() {
  if (!canSave.value) return;
  const patch = buildPatchObject();

  if (Object.keys(patch).length === 0) {
    validationNotice.value = 'Select at least one field to apply.';
    return;
  }

  for (const k of Object.keys(validationErrors)) delete validationErrors[k];
  validationNotice.value = '';

  const errors = validatePatchAgainstFields(patch);
  for (const [fieldName, message] of Object.entries(errors)) {
    validationErrors[fieldName] = message;
  }

  if (Object.keys(errors).length > 0) {
    validationNotice.value = 'Please fix the highlighted fields before saving.';
    return;
  }

  await bulkUpdateItems(props.collection, props.keys, patch);

  emit('saved');
  close();
}


// Field helpers
function isRequired(field: any): boolean {
  return Boolean(field?.meta?.required);
}

function isEmptyValue(value: any): boolean {
  if (value === false) return false;
  if (value === 0) return false;
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function validatePatchAgainstFields(patch: Record<string, any>): Record<string, string> {
  const errors: Record<string, string> = {};

  const fieldByName = new Map<string, any>(editableFields.value.map((f: any) => [String(f.field), f]));

  for (const [fieldName, nextValue] of Object.entries(patch)) {
    const field = fieldByName.get(fieldName);
    if (!field) continue;

    if (isRequired(field) && isEmptyValue(nextValue)) {
      errors[fieldName] = 'This field is required.';
      continue;
    }
  }

  return errors;
}
</script>

<style scoped>
.drawer-batch-content {
  padding: var(--content-padding);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.v-form {
  display: grid;
  grid-template-columns: [start] minmax(0, 1fr) [half] minmax(0, 1fr) [full];
  gap: var(--theme--form--row-gap) var(--theme--form--column-gap);
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.header-title-icon {
  color: var(--theme--foreground-subdued);
}

@media (min-width: 960px) {
    .v-form .full {
        grid-column: start / full;
    }
}

.bulk-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bulk-field-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bulk-field-labels {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bulk-field-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.bulk-field-body.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.bulk-field-body :deep(.field) {
  grid-column: start / full;
}

.bulk-field-body :deep(.field-label) {
  display: none;
}

.bulk-field-error {
  color: var(--theme--danger);
}

.required {
  color: var(--theme--primary);
}

.error {
  margin-top: 8px;
}
</style>

