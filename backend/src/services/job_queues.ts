import { Prisma, PrismaClient } from '@prisma/client';
import Queue, { JobOptions } from 'bull';
import { getAllContent } from 'integrations/confluence_cloud';
import { createApp, indexChannels, joinChannels } from 'integrations/slack';
import { logger } from 'logging';
import { makeClient } from './prisma';

// TODO(richardwu): hide behind worker feature flag
// NB: data we pass into queues must be serializable
// (e.g., PrismaClient will not work: cause job to never be scheduled).
const slackMessageQueue = new Queue<null>('slack messages batch index');
const confCloudFullBatchQueue = new Queue<null>(
  'confluence cloud full batch index'
);
// TODO: make these configurable settings.
const repeatableQueues: Array<{
  queue: Queue.Queue;
  jobArgs: JobOptions;
}> = [
  {
    queue: slackMessageQueue,
    jobArgs: { repeat: { every: 2 * 60 * 1000 * 1000 } },
  },
  {
    queue: confCloudFullBatchQueue,
    // jobArgs: { repeat: { every: 6 * 60 * 1000 * 1000 } },
    jobArgs: { repeat: { every: 10 * 1000 } },
  },
];

slackMessageQueue.process(async (job, done) => {
  let prisma: PrismaClient | null = null;
  try {
    prisma = makeClient();
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
  } catch (err) {
    logger.error('Error while indexing Slack messages: %s', err);
  } finally {
    await prisma?.$disconnect();
  }
});

confCloudFullBatchQueue.process(async (job, done) => {
  let prisma: PrismaClient | null = null;
  try {
    prisma = makeClient();
    logger.info('Fetching Confluence Cloud all content...');
    const resp = await getAllContent(prisma);
    logger.info(resp);
    done();
  } catch (err) {
    logger.error('Error while indexing Confluence Cloud: %s', err);
  } finally {
    await prisma?.$disconnect();
  }
});

export const scheduleBatchJobs = async (prisma: PrismaClient) => {
  // Remove previously scheduled jobs (in case parameters changed).
  for (const { queue } of repeatableQueues) {
    for (const job of await queue.getRepeatableJobs()) {
      await queue.removeRepeatableByKey(job.key);
    }
  }

  logger.info('Scheduling %d batch jobs...', repeatableQueues.length);
  const ret = await Promise.allSettled(
    repeatableQueues.map(({ queue, jobArgs: repeatArgs }) =>
      queue.add(null, repeatArgs)
    )
  );
  logger.info(
    'Scheduled %d batch jobs!',
    ret.filter((r) => r.status !== 'fulfilled').length
  );
  for (const { queue } of repeatableQueues) {
    logger.info('%s # jobs: %s', queue.name, await queue.getRepeatableCount());
  }
  return ret;
};
