import { useApi } from '@directus/extensions-sdk';
import { VersionStatus, VersionCheckDto } from '../module/types/versionStatus';
import pkg from '../../package.json';

const cacheDuration = 24 * 60 * 60 * 1000;

type ApiClient = ReturnType<typeof useApi>;
type VersionSettings = {
  lastChecked: number | null;
  latestVersion: string | null;
};

export async function getVersionStatus(api: ApiClient): Promise<VersionStatus> {
  const currentVersion = pkg.version;
  const now = Date.now();

  const { lastChecked, latestVersion } = await getSettings(api);

  if (lastChecked !== null && lastChecked !== 0 && now - lastChecked < cacheDuration) {
    const latest = latestVersion ? latestVersion : currentVersion;

    return {
      checkedAt: lastChecked,
      latestVersion: latest,
      updateAvailable: latest !== currentVersion,
    };
  }

  try {
    const latestVersion = await getLatestVersionFromNpm();

    if (latestVersion) {
      await api.patch('/items/erp_version_status', {
        last_version_check_time: now,
        latest_version: latestVersion,
      });

      return {
        checkedAt: now,
        latestVersion: latestVersion ?? currentVersion,
        updateAvailable: latestVersion ? latestVersion !== currentVersion : false,
      };
    }
  } catch (error) {
    console.error('Error fetching latest bundle version:', error);
  }

  return {
    checkedAt: now,
    latestVersion: currentVersion,
    updateAvailable: false,
  };
}

async function getSettings(api: ApiClient): Promise<VersionSettings> {
  const response = await api.get<{ data: VersionCheckDto}>('/items/erp_version_status');

  const { last_version_check_time, latest_version } = response.data.data;

  return {
    lastChecked: last_version_check_time,
    latestVersion: latest_version,
  };
}

async function getLatestVersionFromNpm(): Promise<string | null> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${pkg.name}/latest`);
    if (response.ok) {
      const versionData = await response.json();
      return versionData.version;
    }
  } catch (error) {
    console.error('Error fetching latest bundle version:', error);
  }
  return null;
}
