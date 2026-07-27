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
      } else if (job.name === 'sendMentionEmail') {
        const { email, name, authorName, taskTitle, commentContent } = job.data;
        const brand = process.env.NAME || 'Obliq';

        await sendEmail({
          to: email,
          subject: `${authorName} mentioned you in task: "${taskTitle}"`,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Hi ${name},</h2>
            <p><strong>${authorName}</strong> mentioned you in a comment on task <strong>${taskTitle}</strong>:</p>
            <blockquote style="background: #f4f4f5; padding: 12px; border-left: 4px solid #6366f1; margin: 16px 0;">
              ${commentContent}
            </blockquote>
            <p>Log in to ${brand} to view and respond.</p>
          </div>`,
        });

        console.log(`✅ [EmailWorker] Mention email sent to ${email}`);
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
