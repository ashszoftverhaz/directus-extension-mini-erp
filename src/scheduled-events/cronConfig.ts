/**
 * Cron schedule configuration for all ERP scheduled jobs
 * Format: standard cron (minute hour day-of-month month day-of-week)
 */

/** License expiration notification – emails employees when driving licenses expire in 14 or 30 days */
export const CRON_LICENSE_EXPIRATION_NOTIFICATION = '0 3 * * *'; // 03:00 daily

/** Contract expiration notification – emails franchise admins for contracts expiring soon */
export const CRON_CONTRACT_EXPIRATION_NOTIFICATION = '0 10 * * *'; // 10:00 daily

/** Contract status sync – updates contract statuses (Draft, Active, Expired) based on dates */
export const CRON_CONTRACT_STATUS_SYNC = '10 0 * * *'; // 00:10 daily
