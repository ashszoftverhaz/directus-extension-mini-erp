export type VersionStatus = {
  checkedAt: number;
  latestVersion: string;
  updateAvailable: boolean;
};

export type VersionCheckDto = {
  id: number;
  last_version_check_time: number | null;
  latest_version: string | null;
}
