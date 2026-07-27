import app from './app.js';
import connectDB from './config/db.js';
import { setupEmailWorker } from './queues/email.worker.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server is running on port ${PORT}`);

  // Start BullMQ Email Worker if REDIS_URL is set
  if (process.env.REDIS_URL) {
    try {
      setupEmailWorker();
      console.log('⚡ BullMQ Email Worker started');
    } catch (err) {
      console.error('❌ Failed to start Email Worker:', err.message);
    }
  } else {
    console.warn('⚠️ REDIS_URL not provided. BullMQ Email Worker skipped.');
  }
});
