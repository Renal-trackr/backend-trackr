import Redis from "ioredis";

const redis = new Redis("redis://localhost:6379", {
  maxRetriesPerRequest: null,
});


export default redis;