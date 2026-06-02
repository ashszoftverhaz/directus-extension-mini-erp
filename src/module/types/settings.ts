export type SettingDto = {
  id: string | number;
  key: string;
  settings_name: string;
  value: string | null;
  notes: string | null;
};

export type SettingListItem = SettingDto;

import type { ListFetchOptions, ListFetchResult } from './list';

export type GetSettingsOptions = ListFetchOptions;
export type GetSettingsResult = ListFetchResult<SettingListItem>;
