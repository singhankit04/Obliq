import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { initSocket } from './config/socket.js';
import { setupEmailWorker } from './queues/email.worker.js';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, async () => {
  await connectDB();
  console.log(`Server is running on port ${PORT}`);

  // Start BullMQ Email Worker asynchronously
  try {   
    await setupEmailWorker();
    console.log('⚡ BullMQ Email Worker started');
  } catch (err) {
    console.error('❌ BullMQ Email Worker failed to start:', err.message);
  }
});
