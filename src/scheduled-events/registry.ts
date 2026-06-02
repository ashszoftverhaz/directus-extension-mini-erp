import {
  CRON_LICENSE_EXPIRATION_NOTIFICATION,
  CRON_CONTRACT_STATUS_SYNC,
  CRON_CONTRACT_EXPIRATION_NOTIFICATION,
} from './cronConfig';
import type { JobContext } from './shared/types';
import { sendLicenseExpirationNotification } from './license-expiration-notification/sendLicenseExpirationNotification';
import { syncContractStatuses } from './contract-status-sync/syncContractStatuses';
import { sendContractExpirationNotification } from './contract-expiration-notification/sendContractExpirationNotification';

export type ScheduledJob = {
  id: string;
  cron: string;
  handler: (context: JobContext) => Promise<void>;
};

export const SCHEDULED_JOBS: ScheduledJob[] = [
  {
    id: 'license-expiration-notification',
    cron: CRON_LICENSE_EXPIRATION_NOTIFICATION,
    handler: sendLicenseExpirationNotification,
  },
  {
    id: 'contract-expiration-notification',
    cron: CRON_CONTRACT_EXPIRATION_NOTIFICATION,
    handler: sendContractExpirationNotification,
  },
  {
    id: 'contract-status-sync',
    cron: CRON_CONTRACT_STATUS_SYNC,
    handler: syncContractStatuses,
  },
];
