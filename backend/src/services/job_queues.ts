import { PrismaClient } from '@prisma/client';
import Queue from 'bull';
import { createApp, indexChannels, joinChannels } from 'integrations/slack';
import { logger } from 'logging';
import { makeClient } from './prisma';

// TODO(richardwu): hide behind worker feature flag
// NB: data we pass into queues must be serializable
// (e.g., PrismaClient will not work: cause job to never be scheduled).
const slackMessageQueue = new Queue<null>('slack messages batch index');
const queues = [slackMessageQueue];

slackMessageQueue.process(async (job, done) => {
  const prisma = makeClient();
  try {
    const app = await createApp(prisma);
    if (!app) {
      logger.warn(
        'Slack has no global credentials, skipping batch message indexing.'
      );
      done();
      return;
    }
    job.progress(10);

    logger.info('Joining outstanding Slack channels...');
    await joinChannels(app);
    job.progress(20);

    logger.info('Indexing Slack messages in all channels since last fetch...');
    await indexChannels(prisma, app);
    job.progress(100);

    logger.info('Done Slack message indexing.');
    done();
  } finally {
    await prisma.$disconnect();
  }
});

export const scheduleBatchJobs = async (prisma: PrismaClient) => {
  // Remove previously scheduled jobs (in case parameters changed).
  for (const queue of queues) {
    for (const job of await queue.getRepeatableJobs()) {
      await queue.removeRepeatableByKey(job.key);
    }
  }

  const jobs = [
    // Every 2 hour batch fetch all Slack messages.
    slackMessageQueue.add(null, { repeat: { every: 2 * 60 * 1000 * 1000 } }),
  ];

  logger.info('Scheduling %d batch jobs...', jobs.length);
  const ret = await Promise.allSettled(jobs);
  logger.info(
    'Scheduled %d batch jobs!',
    ret.filter((r) => r.status !== 'fulfilled').length
  );
  for (const queue of queues) {
    logger.info('%s # jobs: %s', queue.name, await queue.getRepeatableCount());
  }
  return ret;
};
