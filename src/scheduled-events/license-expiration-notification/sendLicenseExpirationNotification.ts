import { sendEmailFromContent } from "../../services/emailService";
import { defaultLicenseExpirationEmailNotification, defaultLicenseExpirationPushNotification } from "./constants";
import type { JobContext } from "../shared/types";

type DrivingLicense = {
    category: string;
    validity: Date;
    first_name: string;
    last_name: string;
    email: string | null;
    language: string | null;
    id: string;
}

type Language = {
    code: string;
    id: string;
}

export async function sendLicenseExpirationNotification(context: JobContext): Promise<void> {
    const { logger } = context;
    logger.info('[ERP licence expiration notification scheduled event] License Expiration Notification started.');

    try {
        const { database } = context;
        const expiringLicenses: Array<DrivingLicense> = await database("driverslicences")
            .leftJoin("directus_users", "driverslicences.employee", "directus_users.id")
            .where("validity", "=", database.raw("CURRENT_DATE + INTERVAL '30 days'"))
            .orWhere("validity", "=", database.raw("CURRENT_DATE + INTERVAL '14 days'"))
            .select(
                "category",
                "validity",
                "directus_users.first_name",
                "directus_users.last_name",
                "directus_users.email",
                "directus_users.language",
                "directus_users.id"
            );

        const languages = await database("languages").select("code", "id") as Array<Language>;
        context.languagesCache = languages;

        await sendEmployeeEmails(context, expiringLicenses, languages);

        await pushEmployeeNotifications(context, expiringLicenses, languages);
    } catch (error) {
        logger.error('[ERP licence expiration notification scheduled event] License Expiration Notification failed.', error);
    } finally {
        logger.info('[ERP licence expiration notification scheduled event] License Expiration Notification finished.');
    }
}

const sendEmployeeEmails = async (context: JobContext, expiringLicenses: Array<DrivingLicense>, languages: Array<Language>) => {
    const licensesWithEmail = expiringLicenses.filter((license) => license.email !== null);

    for (const license of licensesWithEmail) {
        const emailLanguageId =
            license.language === null
                ? languages.find((lang) => lang.code === "en-US")?.id
                : languages.find((lang) => lang.code === license.language)?.id;

        const replacements = new Map<string, string>();
        replacements.set("${FIRST_NAME}", license.first_name);
        replacements.set("${LAST_NAME}", license.last_name);
        const expiryDateStr = license.validity.toISOString().split("T")[0] ?? "N/A";
        replacements.set("${EXPIRATION_DATE}", expiryDateStr);
        replacements.set("${CATEGORY}", license.category);

        try {
            await sendEmailFromContent(
                context,
                "license_expiration_notification",
                license.email!,
                emailLanguageId ?? null,
                replacements,
                defaultLicenseExpirationEmailNotification,
            );
            context.logger.info(
                `[ERP licence expiration notification scheduled event] License expiration notification email sent to ${license.email}.`,
            );
        } catch (error) {
            context.logger.error(
                `[ERP licence expiration notification scheduled event] Failed to send email to ${license.email}:`,
                error,
            );
        }
    }
}

const pushEmployeeNotifications = async (context: JobContext, expiringLicenses: Array<DrivingLicense>, languages: Array<Language>) => {
    const notificationContents = await context.database("notification_content")
        .where({ key: "license_expiration_notification" });

    const pushNotificationContentsToEmployees = expiringLicenses
        .filter(license => license.id !== null)
        .map(license => {
            const notificationLanguageId = license.language === null ? languages.find(l => l.code === 'en-US')?.id : languages.find(l => l.code === license.language)?.id;
            const dbContent = notificationContents.find(ec => ec.language === notificationLanguageId);
            const content = (dbContent && dbContent !== -1) ? dbContent : defaultLicenseExpirationPushNotification;
            return {
                userId: license.id,
                title: content.title,
                body: content.body,
            }
        });

    const baseUrl = context.env?.PUBLIC_URL;
    if (!baseUrl) {
        context.logger.warn(
            "[ERP licence expiration notification scheduled event] DIRECTUS_PUBLIC_URL is not defined in environment variables.",
        );
        return;
    }
    const url = `${baseUrl}/notification/send`;

    const payloads = pushNotificationContentsToEmployees.map(license => {
        return {
            userId: license.userId,
            title: license.title,
            body: license.body,
            data: null,
            type: "employment"
        }
    });

    await Promise.all(
        payloads.map(body => {
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            context.logger.info(`[ERP licence expiration notification scheduled event] Push notification sent to user ID ${body.userId}.`);
        })
    );
}