import type {
  HookContext,
  EmailContent,
  EmailOptions,
  CachedEmailContentVariant,
  CachedLanguage,
} from './types';

/**
 * Resolves email content from pre-fetched variants using fallback chain
 */
function resolveFromVariants(
  variants: CachedEmailContentVariant[],
  languageId: string | null | undefined,
  englishLanguageId: string | null,
): CachedEmailContentVariant | null {
  if (languageId) {
    const match = variants.find((variant) => variant.language === languageId);
    if (match) return match;
  }
  if (englishLanguageId) {
    const match = variants.find((variant) => variant.language === englishLanguageId);
    if (match) return match;
  }
  const nullMatch = variants.find((variant) => variant.language === null);
  if (nullMatch) return nullMatch;
  return null;
}

/**
 * Retrieves email content from the email_content collection by key and language
 * Falls back to default language (English) if specific language not found
 *
 * @param context - Hook context with services access
 * @param key - The email content key (e.g., 'contract_expiration_notification')
 * @param languageId - The language ID to retrieve content for (optional, defaults to English)
 * @param defaultContent - Default content to use if not found in database
 * @returns Email content with subject and body
 */
export async function getEmailContent(
  context: HookContext,
  key: string,
  languageId?: string | null,
  defaultContent?: { subject: string; value: string },
): Promise<{ subject: string; body: string }> {
  const schema = await context.getSchema({ database: context.database });
  const { ItemsService } = context.services;

  const cache = context.emailContentCache ?? new Map<string, CachedEmailContentVariant[]>();

  if (!cache.has(key)) {
    const emailContentService = new ItemsService('email_content', {
      accountability: { admin: true },
      schema,
    });
    const allVariants = (await emailContentService.readByQuery({
      fields: ['language', 'subject', 'value'],
      filter: { key: { _eq: key } },
      limit: -1,
    })) as EmailContent[] | null;
    const variants: CachedEmailContentVariant[] = Array.isArray(allVariants)
      ? allVariants.map((row) => ({
          language: row.language,
          subject: row.subject,
          value: row.value,
        }))
      : [];
    cache.set(key, variants);
    if (context.emailContentCache === undefined) {
      context.emailContentCache = cache;
    }
  }

  const variants = cache.get(key)!;
  let englishLanguageId: string | null = null;

  if (variants.length > 0) {
    let languages = context.languagesCache;
    if (languages === undefined) {
      const languagesService = new ItemsService('languages', {
        accountability: { admin: true },
        schema,
      });
      languages = (await languagesService.readByQuery({
        fields: ['id', 'code'],
        limit: -1,
      })) as CachedLanguage[] | null;
      context.languagesCache = languages ?? null;
    }
    englishLanguageId =
      Array.isArray(languages) && languages.length > 0
        ? (languages.find((lang) => lang.code === 'en-US')?.id ?? null)
        : null;

    const resolved = resolveFromVariants(variants, languageId ?? null, englishLanguageId);
    if (resolved) {
      return { subject: resolved.subject, body: resolved.value };
    }
  }

  if (defaultContent) {
    context.logger?.warn(
      `[EmailService] Email content not found for key "${key}" and language "${languageId}", using default content.`,
    );
    return {
      subject: defaultContent.subject,
      body: defaultContent.value,
    };
  }

  throw new Error(
    `Email content not found for key "${key}" and language "${languageId}" and no default content provided.`,
  );
}

/**
 * Replaces placeholders in email body text
 *
 * @param text - The email body text with placeholders
 * @param replacements - Map of placeholder keys to replacement values
 * @returns Text with placeholders replaced
 */
export function replacePlaceholders(text: string, replacements: Map<string, string>): string {
  let result = text;
  replacements.forEach((value, key) => {
    result = result.split(key).join(value);
  });
  return result;
}

/**
 * Sends an email using Directus MailService
 *
 * @param context - Hook context with services access
 * @param options - Email options (to, subject, html)
 * @returns Promise that resolves when email is sent
 */
export async function sendEmail(context: HookContext, options: EmailOptions): Promise<void> {
  try {
    const schema = await context.getSchema();
    const { MailService } = context.services;
    const mailService = new MailService({
      schema,
      accountability: null,
    });

    await mailService.send({
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    context.logger?.info(`[EmailService] Email sent successfully to ${options.to}`);
  } catch (error) {
    context.logger?.error(`[EmailService] Error sending email to ${options.to}:`, error);
    throw error;
  }
}

/**
 * Sends an email with content from email_content collection
 *
 * @param context - Hook context
 * @param key - The email content key
 * @param to - Recipient email address
 * @param languageId - The language ID (optional, defaults to English)
 * @param replacements - Placeholder replacements for email body
 * @param defaultContent - Default content if not found in database
 * @returns Promise that resolves when email is sent
 */
export async function sendEmailFromContent(
  context: HookContext,
  key: string,
  to: string,
  languageId?: string | null,
  replacements?: Map<string, string>,
  defaultContent?: { subject: string; value: string },
): Promise<void> {
  const content = await getEmailContent(context, key, languageId, defaultContent);
  let body = content.body;

  if (replacements && replacements.size > 0) {
    body = replacePlaceholders(body, replacements);
  }

  await sendEmail(context, {
    to,
    subject: content.subject,
    html: body,
  });
}
