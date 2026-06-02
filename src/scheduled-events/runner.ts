import type { JobContext } from './shared/types';
import type { ScheduledJob } from './registry';

/**
 * Runs a scheduled job with error handling and logging
 */
export async function runScheduledJob(job: ScheduledJob, context: JobContext): Promise<void> {
  const { id, handler } = job;
  const { logger } = context;

  context.emailContentCache = new Map();
  context.languagesCache = undefined;

  try {
    await handler(context);
  } catch (error) {
    logger.error(`[ERP scheduled job: ${id}] Failed:`, error);
    throw error;
  }
}
