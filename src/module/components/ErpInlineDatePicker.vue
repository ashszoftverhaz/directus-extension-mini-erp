<template>
  <div ref="root" class="erp-inline-date-picker">
    <VInput
      class="erp-inline-date-input"
      :model-value="inputValue"
      :readonly="true"
      @click="open = true">
      <template #append>
        <VIcon name="event" class="erp-inline-date-icon" />
      </template>
    </VInput>

    <div v-if="open" class="erp-inline-date-panel">
      <header class="calendar-header">
        <button type="button" class="calendar-nav-button" @click.stop="prevMonth">
          <VIcon name="chevron_left" class="icon" />
        </button>

        <div class="calendar-heading">
          <select v-model.number="currentMonth" class="calendar-month-select">
            <option v-for="option in monthOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <input
            v-model.number="currentYear"
            class="calendar-year-input"
            type="number"
            min="1900"
            max="2100" />
        </div>

        <button type="button" class="calendar-nav-button" @click.stop="nextMonth">
          <VIcon name="chevron_right" class="icon" />
        </button>
      </header>

      <div class="calendar-wrapper" @mousedown.stop>
        <div class="calendar-grid-head calendar-grid-row">
          <div v-for="d in weekDayLabels" :key="d" class="calendar-head-cell">
            {{ d }}
          </div>
        </div>

        <div class="calendar-grid-body">
          <div v-for="(week, wIndex) in weeks" :key="wIndex" class="calendar-grid-row">
            <button
              v-for="day in week"
              :key="day.key"
              class="calendar-cell-trigger"
              :data-outside-view="day.isOutside || undefined"
              :data-today="day.isToday || undefined"
              :data-selected="day.isSelected || undefined"
              type="button"
              @click.stop="selectDay(day)">
              {{ day.label }}
            </button>
          </div>
        </div>

        <footer class="calendar-footer">
          <button type="button" class="calendar-today-button" @click.stop="setToToday">
            Set to Now
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps<{
  modelValue: string | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
}>();

const root = ref<HTMLElement | null>(null);
const open = ref(false);

function handleClickOutside(event: MouseEvent): void {
  const el = root.value;
  if (!el) return;
  if (el.contains(event.target as Node)) return;
  open.value = false;
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});

const selectedDate = computed<Date | null>({
  get() {
    if (!props.modelValue) return null;
    const d = new Date(props.modelValue);
    return Number.isNaN(d.getTime()) ? null : d;
  },
  set(value) {
    if (!value) {
      emit('update:modelValue', null);
      return;
    }
    const iso = value.toISOString().slice(0, 10);
    emit('update:modelValue', iso);
  },
});

const inputValue = ref('');

if (selectedDate.value) {
  inputValue.value = selectedDate.value.toISOString().slice(0, 10);
}

function syncInputFromSelected(): void {
  inputValue.value = selectedDate.value ? selectedDate.value.toISOString().slice(0, 10) : '';
}

const today = new Date();
const currentYear = ref(selectedDate.value?.getUTCFullYear() ?? today.getUTCFullYear());
const currentMonth = ref(selectedDate.value?.getUTCMonth() ?? today.getUTCMonth());

const monthFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'long',
  timeZone: 'UTC',
});

const monthOptions = Array.from({ length: 12 }, (_, index) => {
  const sample = new Date(Date.UTC(2026, index, 1));
  return { value: index, label: monthFormatter.format(sample) };
});

const weekDayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type DayCell = {
  key: string;
  label: number | '';
  date: Date | null;
  isOutside: boolean;
  isToday: boolean;
  isSelected: boolean;
};

const weeks = computed<DayCell[][]>(() => {
  const firstOfMonth = new Date(Date.UTC(currentYear.value, currentMonth.value, 1));
  const startWeekDay = firstOfMonth.getUTCDay();
  const daysInMonth = new Date(Date.UTC(currentYear.value, currentMonth.value + 1, 0)).getUTCDate();

  const result: DayCell[][] = [];
  let currentDay = 1 - startWeekDay;

  for (let w = 0; w < 6; w += 1) {
    const week: DayCell[] = [];

    for (let d = 0; d < 7; d += 1) {
      const isInMonth = currentDay >= 1 && currentDay <= daysInMonth;
      const cellDate = isInMonth
        ? new Date(Date.UTC(currentYear.value, currentMonth.value, currentDay))
        : null;

      const isToday =
        !!cellDate &&
        cellDate.getUTCFullYear() === today.getUTCFullYear() &&
        cellDate.getUTCMonth() === today.getUTCMonth() &&
        cellDate.getUTCDate() === today.getUTCDate();

      const isSelected =
        !!cellDate &&
        !!selectedDate.value &&
        cellDate.toISOString().slice(0, 10) === selectedDate.value.toISOString().slice(0, 10);

      week.push({
        key: `${w}-${d}`,
        label: isInMonth ? currentDay : '',
        date: cellDate,
        isOutside: !isInMonth,
        isToday,
        isSelected,
      });

      currentDay += 1;
    }

    result.push(week);
  }

  return result;
});

function prevMonth(): void {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value -= 1;
  } else {
    currentMonth.value -= 1;
  }
}

function nextMonth(): void {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value += 1;
  } else {
    currentMonth.value += 1;
  }
}

function selectDay(day: DayCell): void {
  if (!day.date) return;
  selectedDate.value = day.date;
  syncInputFromSelected();
  open.value = false;
}

function setToToday(): void {
  const now = new Date();
  currentYear.value = now.getUTCFullYear();
  currentMonth.value = now.getUTCMonth();
  selectedDate.value = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  syncInputFromSelected();
  open.value = false;
}
</script>

<style scoped>
.erp-inline-date-picker {
  position: relative;
  display: inline-block;
  width: 100%;
}

.erp-inline-date-input {
  width: 100%;
}

.erp-inline-date-icon {
  color: var(--theme--foreground-accent);
}

.erp-inline-date-panel {
  position: absolute;
  inset-inline-start: 0;
  margin-top: 4px;
  z-index: 20;
  inline-size: 426px;
  border: 1px solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
  background: var(--theme--background);
  box-shadow: var(--theme--shadow-menu);
  overflow: hidden;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--theme--foreground);
  background: var(--theme--background-normal);
  padding: 6px 8px;
  border-bottom: 1px solid var(--theme--border-color-subdued);
}

.calendar-nav-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  inline-size: 36px;
  block-size: 36px;
  color: var(--theme--foreground);
  background-color: transparent;
  cursor: pointer;
  border: none;
  border-radius: 50%;
}

.calendar-nav-button:hover {
  background: var(--theme--background-subdued);
}

.calendar-heading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.calendar-month-select {
  border: none;
  background: transparent;
  color: var(--theme--foreground);
  font-size: 15px;
  font-weight: 600;
  outline: none;
  padding: 4px 2px;
}

.calendar-year-input {
  border: 1px solid var(--theme--border-color-subdued);
  background: var(--theme--background);
  color: var(--theme--foreground);
  border-radius: 6px;
  inline-size: 80px;
  padding: 4px 8px;
  font-size: 14px;
  font-weight: 600;
}

.calendar-year-input:focus {
  outline: 2px solid color-mix(in srgb, var(--theme--primary) 40%, transparent);
  outline-offset: 0;
}

.calendar-wrapper {
  display: flex;
  flex-direction: column;
  background: var(--theme--background);
}

.calendar-grid-head {
  background: var(--theme--background-normal);
  border-bottom: 1px solid var(--theme--border-color-subdued);
}

.calendar-grid-row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  inline-size: 100%;
}

.calendar-head-cell {
  padding: 8px 0;
  text-align: center;
  font-size: 12px;
  line-height: 1;
  color: var(--theme--foreground-subdued);
  font-weight: 600;
  text-transform: uppercase;
}

.calendar-grid-body {
  padding: 8px;
}

.calendar-cell-trigger {
  margin: 0;
  border-width: 1px;
  border-style: solid;
  border-color: transparent;
  border-radius: 999px;
  background-color: transparent;
  font-size: 14px;
  line-height: 1;
  font-weight: 500;
  color: var(--theme--foreground);
  cursor: pointer;
  block-size: 46px;
  inline-size: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.calendar-cell-trigger[data-outside-view] {
  color: var(--theme--foreground-subdued);
}

.calendar-cell-trigger[data-today] {
  border-color: var(--theme--primary);
}

.calendar-cell-trigger[data-selected] {
  background-color: var(--theme--primary);
  color: var(--theme--primary-background);
  border-color: var(--theme--primary);
}

.calendar-cell-trigger:hover {
  background-color: var(--theme--background-subdued);
  border-color: var(--theme--border-color-subdued);
}

.calendar-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.375rem;
}

.calendar-today-button {
  background: transparent;
  border: 1px solid var(--theme--border-color-subdued);
  border-radius: 8px;
  inline-size: 100%;
  cursor: pointer;
  color: var(--theme--foreground);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 10px;
}

.calendar-today-button:hover {
  background: var(--theme--background-subdued);
}
</style>
