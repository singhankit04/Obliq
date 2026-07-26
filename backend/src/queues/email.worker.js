import { Worker } from 'bullmq';
import { sendEmail } from '../utils/mailer.js';
import { renderWelcomeEmail } from '../templates/index.js';

const connectionOptions = {
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  maxRetriesPerRequest: null,
};

/**
 * Initializes and returns the BullMQ worker that processes email jobs.
 */
export const setupEmailWorker = () => {
  const emailWorker = new Worker(
    'emailQueue',
    async (job) => {
      console.log(`📩 [EmailWorker] Processing job #${job.id} - (${job.name})`);

      if (job.name === 'sendWelcomeEmail') {
        const { email, name } = job.data;
        const brand = process.env.NAME || 'Obliq';

        await sendEmail({
          to: email,
          subject: `Welcome to ${brand}! 🎉`,
          html: renderWelcomeEmail({ name }),
        });

        console.log(`✅ [EmailWorker] Welcome email sent to ${email}`);
      }
    },
    { connection: connectionOptions }
  );

  // Worker Event Listeners
  emailWorker.on('completed', (job) => {
    console.log(`🎉 [EmailWorker] Job #${job.id} completed successfully`);
  });

  emailWorker.on('failed', (job, err) => {
    console.error(`❌ [EmailWorker] Job #${job?.id} failed with error: ${err.message}`);
  });

  return emailWorker;
};
