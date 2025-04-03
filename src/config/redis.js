import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

export const options = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || "",
    retryStrategy: (times) => Math.min(times * 100, 3000),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    ...(process.env.REDIS_USE_TLS === 'true' && {
        tls: {
            rejectUnauthorized: false,
        }
    })
};

export const redis = new Redis(options);

redis.on('connect', () => console.log('Connected to Redis'));
redis.on('error', (err) => console.log('Redis connexion error ', { error: err.message }));