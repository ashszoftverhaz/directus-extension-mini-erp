import { getSettings } from '../api/settingsApi';
import type { SettingListItem } from '../types/settings';
import { usePaginatedList } from './usePaginatedList';

export function useSettings() {
  const { items: settings, ...rest } = usePaginatedList<SettingListItem>(getSettings, {
    defaultSort: 'settings_name',
    label: 'Default settings',
  });

  return { settings, ...rest };
}
