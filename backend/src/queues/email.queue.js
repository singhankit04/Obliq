import { Queue } from 'bullmq';

const connectionOptions = {
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  maxRetriesPerRequest: null,
};

/**
 * BullMQ Queue Producer for managing email jobs.
 */
export const emailQueue = new Queue('emailQueue', {
  connection: connectionOptions,
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times on failure
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s initial retry delay (5s, 10s, 20s...)
    },
    removeOnComplete: 100, // Keep latest 100 completed jobs in Redis
    removeOnFail: 500,     // Keep latest 500 failed jobs for debugging
  },
});

/**
 * Producer helper function to add a welcome email job to the queue.
 * @param {Object} payload
 * @param {string} payload.email - Recipient email
 * @param {string} payload.name - Recipient name
 */
export const addWelcomeEmailJob = async ({ email, name }) => {
  await emailQueue.add('sendWelcomeEmail', { email, name });
};

export const addMentionEmailJob = async ({ email, name, authorName, taskTitle, commentContent }) => {
  await emailQueue.add('sendMentionEmail', { email, name, authorName, taskTitle, commentContent });
};

