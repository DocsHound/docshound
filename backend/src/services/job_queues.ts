import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import Queue, { DoneCallback, JobOptions } from 'bull';
import { indexContent } from 'integrations/confluence_cloud';
import { createApp, indexChannels, joinChannels } from 'integrations/slack';
import { logger } from 'logging';
import { timedeltaMS } from 'shared/libs/time';
import { Logger } from 'winston';
import { makeClient } from './prisma';

// TODO(richardwu): hide behind worker feature flag
// NB: data we pass into queues must be serializable
// (e.g., PrismaClient will not work: cause job to never be scheduled).
const slackMessageIncrQueue = new Queue<null>(
  'slack-messages-incremental-index'
);
const confCloudFullQueue = new Queue<null>('confluence-cloud-full-index');
const confCloudIncrQueue = new Queue<null>(
  'confluence-cloud-incremental-index'
);
// TODO: make these configurable settings.
const repeatableQueues: Array<{
  queue: Queue.Queue;
  jobArgs: JobOptions;
}> = [
  {
    queue: slackMessageIncrQueue,
    jobArgs: { repeat: { every: timedeltaMS({ hours: 2 }) } },
  },
  {
    queue: confCloudIncrQueue,
    jobArgs: { repeat: { every: timedeltaMS({ hours: 2 }) } },
    // jobArgs: { repeat: { every: timedeltaMS({ seconds: 10 }) } },
  },
  {
    queue: confCloudFullQueue,
    jobArgs: { repeat: { every: timedeltaMS({ hours: 6 }) } },
    // jobArgs: { repeat: { every: timedeltaMS({ seconds: 10 }) } },
  },
];

slackMessageIncrQueue.process(async (job, done) => {
  const curLogger = logger.child({ subservice: 'slack-message-incr-queue' });
  let prisma: PrismaClient | null = null;
  try {
    prisma = makeClient();
    const app = await createApp(prisma);
    if (!app) {
      curLogger.warn('no global credentials, skipping batch message indexing');
      done();
      return;
    }
    job.progress(10);

    curLogger.info('joining outstanding channels...');
    await joinChannels(app);
    job.progress(20);

    curLogger.info('indexing messages in all channels since last fetch...');
    await indexChannels(prisma, app);
    job.progress(100);

    curLogger.info('done indexing');
    done();
  } catch (err) {
    curLogger.error('failed indexing: %s', err);
    done(err as Error);
  } finally {
    await prisma?.$disconnect();
  }
});

const indexConfCloud = async (
  curLogger: Logger,
  fullIndex: boolean,
  done: DoneCallback
) => {
  let prisma: PrismaClient | null = null;
  try {
    prisma = makeClient();
    curLogger.info(
      'indexing %s content...',
      fullIndex ? 'full historical' : 'incremental'
    );
    await indexContent(prisma, { fullIndex });
    curLogger.info('done indexing');
    done();
  } catch (err) {
    if (axios.isAxiosError(err)) {
      curLogger.error(
        'failed indexing: %s\n%s\nRequest: %s\nResponse: %s',
        err.message,
        err.stack,
        err.request,
        err.response?.data
      );
    } else {
      curLogger.error('failed indexing: %s', err);
    }
    done(err as Error);
  } finally {
    await prisma?.$disconnect();
  }
};

confCloudIncrQueue.process(async (_job, done) => {
  const curLogger = logger.child({ subservice: 'conf-cloud-incr-queue' });
  await indexConfCloud(curLogger, false, done);
});

confCloudFullQueue.process(async (_job, done) => {
  const curLogger = logger.child({ subservice: 'conf-cloud-full-queue' });
  await indexConfCloud(curLogger, true, done);
});

export const scheduleBatchJobs = async () => {
  const curLogger = logger.child({ subservice: 'schedule-job-queue' });

  // Remove previously scheduled jobs (in case parameters changed).
  for (const { queue } of repeatableQueues) {
    for (const job of await queue.getRepeatableJobs()) {
      await queue.removeRepeatableByKey(job.key);
    }
  }

  curLogger.info('scheduling %d batch jobs...', repeatableQueues.length);
  const ret = await Promise.allSettled(
    repeatableQueues.map(({ queue, jobArgs: repeatArgs }) =>
      queue.add(null, repeatArgs)
    )
  );
  for (const { queue } of repeatableQueues) {
    curLogger.info(
      '%s # jobs: %s',
      queue.name,
      await queue.getRepeatableCount()
    );
  }
  return ret;
};
