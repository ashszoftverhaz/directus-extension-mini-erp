<template>
  <VDrawer v-model="openModel" direction="right" @cancel="close">
       <template #title>
      <div class="header">
        <div class="header-title">
          <h1 class="type-title">Update driving license to employee</h1>
        </div>
      </div>
    </template>

    <template #actions>
      <VButton
        icon
        rounded
        :disabled="!canSubmit || saving"
        @click="save"
      >
        <VIcon name="check" />
      </VButton>
    </template>

    <div class="erp-upload-form">
      <v-notice v-if="!hasPermission" type="danger" icon="warning">
        You do not have permissions to update driverslicences.
      </v-notice>
      <v-notice v-else-if="errorMessage" type="danger">
        {{ errorMessage }}
      </v-notice>
      <v-notice v-else-if="successMessage" type="success">
        {{ successMessage }}
      </v-notice>

      <v-form v-if="hasPermission" v-model="formData" :fields="fieldData" />
      
    </div>
  </VDrawer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useCollection, useStores } from '@directus/extensions-sdk';

const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();
const collection = 'driverslicences';
const { fields } = useCollection(collection);

const formData = ref<Record<string, unknown>>({});
const saving = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const hasPermission = computed(() => permissionsStore.hasPermission(collection, 'update'));
const fieldData = computed(() => (fields.value ?? []).filter((field: any) => field.field !== 'employee'));
const canSubmit = computed(() => formData.value['category'] !== undefined);

const props = withDefaults(
  defineProps<{
    open: boolean;
    drivingLicense: any;
  }>(),
  {}
);

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
  formData.value = {};
  errorMessage.value = '';
  successMessage.value = '';
}

const save = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (!hasPermission.value) {
    errorMessage.value = 'You do not have permissions to update driverslicences.';
    return;
  }

  if (!canSubmit.value) {
    errorMessage.value = 'Please fill in the required fields.';
    return;
  }

  saving.value = true;

  try {
    emit('save', {...formData.value});
  } catch (saveError: any) {
    errorMessage.value = saveError?.response?.data?.errors?.[0]?.message ?? 'Update failed.';
  } finally {
    saving.value = false;
  }
};

watch(
  () => props.open,
  (val) => {
    if (val && props.drivingLicense) {
      const { employee, ...rest } = props.drivingLicense;
      formData.value = { ...rest };
    }
  }
);
</script>

<style scoped>
.erp-upload-form {
  border: 1px solid var(--theme--border-color-subdued);
  border-radius: 12px;
  background: var(--theme--background);
  padding: 20px;
}

.form-title {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 600;
}
</style>
