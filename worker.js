import connectDb from "./src/config/database.js";
import {redis} from "./src/config/redis.js";
import {initWorkers} from "./src/workers/workflow.worker.js";

const start = async () => {
    try {
        await connectDb();
        console.log('✅ Connected to MongoDB');

        await redis.ping();
        console.log('✅ Connected to Redis');

        const workers = initWorkers();
        console.log('🚀 All workers started');


        const shutdown = async () => {
            console.log('🛑 Stopping workers...');
            await Promise.all(Object.values(workers).map(w => w.close()));
            process.exit(0);
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

    } catch (error) {
        console.error('❌ Failed to start workers:', error);
        process.exit(1);
    }
};

start();