import app from './app.js';
// import * as dns from "node:dns/promises";

// dns.setServers(["1.1.1.1", "8.8.8.8"]);

import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  await connectDB()
  console.log(`Server is running on port ${PORT}`);
});
