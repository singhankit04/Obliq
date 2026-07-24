import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

redis.on("connect", async () => {
  console.log("✅ Redis Connected");
});

redis.on("error", (err) => {
  console.error(err);
});

export default redis;