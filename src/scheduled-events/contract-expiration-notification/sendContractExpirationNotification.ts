import { sendEmailFromContent } from '../../services/emailService';
import { defaultContractExpirationEmailNotification } from './constants';
import { CONTRACTS_COLLECTION } from '../../shared/contracts/constants';
import { getContractExpirationNotificationRecipient } from './getContractExpirationNotificationRecipient';
import type { HookContext, Contract, Language } from './types';

/**
 * Gets contracts that might need notifications (expiry date today or later)
 *
 * @param context - Hook context
 * @returns Array of candidate contracts
 */
async function getExpiringContracts(context: HookContext): Promise<Contract[]> {
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];

  const schema = await context.getSchema({ database: context.database });
  const { ItemsService } = context.services;

  const contractsService = new ItemsService(CONTRACTS_COLLECTION, {
    accountability: { admin: true },
    schema,
  });

  const schemaForFields = await context.getSchema({ database: context.database });
  const hasFranchiseField = Object.prototype.hasOwnProperty.call(
    schemaForFields?.collections?.contracts?.fields ?? {},
    'franchise',
  );

  const fields = [
    'id',
    'contract_id',
    'expiry_date',
    'status',
    'other_party_type',
    'partner',
    'partner.name',
    'employee',
    'employee.account.first_name',
    'employee.account.last_name',
    'email_notification',
    ...(hasFranchiseField ? ['franchise'] : []),
  ];

  const contracts = (await contractsService.readByQuery({
    fields,
    filter: {
      expiry_date: {
        _gte: todayString,
      },
    },
    limit: -1,
  })) as Contract[] | null;

  const result: Contract[] = [];
  const contractsArray = Array.isArray(contracts) ? contracts : [];

  for (const contract of contractsArray) {
    const partnerData = contract.partner as any;
    const employeeData = contract.employee as any;
    const franchiseData = contract.franchise as any;
    result.push({
      id: contract.id,
      contract_id: contract.contract_id || null,
      expiry_date: contract.expiry_date || null,
      status: contract.status || null,
      other_party_type: contract.other_party_type || null,
      partner: partnerData ?? null,
      employee: employeeData ?? null,
      franchise:
        typeof franchiseData === 'string'
          ? franchiseData
          : franchiseData?.id
            ? { id: franchiseData.id }
            : null,
      email_notification: contract.email_notification,
    });
  }

  return result;
}

/**
 * Returns true if this contract should receive a notification email today,
 * based on expiry_date and email_notification (days in advance)
 */
function shouldNotifyToday(contract: Contract): boolean {
  let differenceDays: number | null = null;
  if (contract.expiry_date) {
    const today = new Date();
    const expiry = new Date(contract.expiry_date);
    const msDiff = expiry.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);
    differenceDays = Math.floor(msDiff / (1000 * 60 * 60 * 24));
  }

  if (differenceDays === null) return false;
  if (differenceDays === 0) return true;
  if (differenceDays > 0) {
    const rawNotificationConfig = contract.email_notification;
    const notificationDaysConfig: number[] = Array.isArray(rawNotificationConfig)
      ? rawNotificationConfig
          .map((rawValue) => {
            const parsedDays = typeof rawValue === 'number' ? rawValue : Number(rawValue);
            return Number.isFinite(parsedDays) ? parsedDays : null;
          })
          .filter((daysValue): daysValue is number => daysValue !== null && daysValue > 0)
      : [];

    return notificationDaysConfig.includes(differenceDays);
  }

  return false;
}

/**
 * Gets available languages
 */
async function getLanguages(context: HookContext): Promise<Language[]> {
  const schema = await context.getSchema({ database: context.database });
  const { ItemsService } = context.services;

  const languagesService = new ItemsService('languages', {
    accountability: { admin: true },
    schema,
  });

  const languages = (await languagesService.readByQuery({
    fields: ['code', 'id'],
    limit: -1,
  })) as Language[] | null;

  return Array.isArray(languages) ? languages : [];
}

/**
 * Sends expiration notification emails for expiring contracts
 */
async function sendExpirationEmails(
  context: HookContext,
  contracts: Contract[],
  languages: Language[],
): Promise<void> {
  for (const contract of contracts) {
    const adminInfo = await getContractExpirationNotificationRecipient(context, contract);
    if (!adminInfo || !adminInfo.email) {
      context.logger?.warn(
        `[Contract Expiration] No recipient found for contract ${contract.id}, skipping.`,
      );
      continue;
    }

    let languageId: string | null = null;
    if (adminInfo.language) {
      const foundLanguage = languages.find((language) => language.code === adminInfo.language);
      languageId = foundLanguage?.id || null;
    }
    if (!languageId) {
      const englishLanguage = languages.find((language) => language.code === 'en-US');
      languageId = englishLanguage?.id || null;
    }

    let expiryDateStr: string = 'N/A';
    if (contract.expiry_date) {
      const date = new Date(contract.expiry_date);
      const dateParts = date.toISOString().split('T');
      expiryDateStr = dateParts[0] || 'N/A';
    }
    const contractId: string = contract.contract_id || contract.id;

    let otherPartyName: string = 'Unknown';
    if (contract.other_party_type === 'employee') {
      const employeeData = contract.employee as any;
      if (employeeData && typeof employeeData === 'object' && employeeData.account) {
        const firstName = employeeData.account.first_name || '';
        const lastName = employeeData.account.last_name || '';
        otherPartyName = `${firstName} ${lastName}`.trim() || 'Employee';
      } else {
        otherPartyName = 'Employee';
      }
    } else if (contract.other_party_type === 'partner') {
      const partnerData = contract.partner as any;
      otherPartyName =
        typeof partnerData === 'object' && partnerData?.name ? partnerData.name : 'Partner';
    } else {
      const partnerData = contract.partner as any;
      otherPartyName =
        typeof partnerData === 'object' && partnerData?.name ? partnerData.name : 'Unknown';
    }

    const replacements = new Map<string, string>();
    replacements.set('${CONTRACT_ID}', contractId);
    replacements.set('${EXPIRATION_DATE}', expiryDateStr);
    replacements.set('${PARTNER_NAME}', otherPartyName);

    try {
      await sendEmailFromContent(
        context,
        'contract_expiration_notification',
        adminInfo.email,
        languageId,
        replacements,
        defaultContractExpirationEmailNotification,
      );
      context.logger?.info(
        `[Contract Expiration] Notification sent to ${adminInfo.email} for contract ${contractId}.`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      context.logger?.error(
        `[Contract Expiration] Failed to send email for contract ${contract.id}: ${errorMessage}${errorStack ? `\n${errorStack}` : ''}`,
      );
    }
  }
}

/**
 * Main function for contract expiration notification scheduled event
 * Scheduled to run daily at 10:00 AM
 */
export async function sendContractExpirationNotification(context: HookContext): Promise<void> {
  const { logger } = context;
  logger.info('[Contract Expiration Notification] Started.');

  try {
    const candidateContracts = await getExpiringContracts(context);
    const contractsToNotify = candidateContracts.filter(shouldNotifyToday);

    if (contractsToNotify.length === 0) {
      logger.info('[Contract Expiration Notification] No contracts requiring notification today.');
      return;
    }

    logger.info(
      `[Contract Expiration Notification] Found ${contractsToNotify.length} contract(s) to notify today.`,
    );

    const languages = await getLanguages(context);
    context.languagesCache = languages;
    await sendExpirationEmails(context, contractsToNotify, languages);

    logger.info('[Contract Expiration Notification] Finished successfully.');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error(
      `[Contract Expiration Notification] Failed: ${errorMessage}${errorStack ? `\n${errorStack}` : ''}`,
    );
    throw error;
  } finally {
    logger.info('[Contract Expiration Notification] Completed.');
  }
}
