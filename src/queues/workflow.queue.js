import { Queue, Worker } from 'bullmq';
import {options } from '../config/redis.js';
import ProcessorService from '../services/processor.service.js';

export const queues = {
    workflow: new Queue('workflow', {
        connection: options,
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 }
        }
    }),

    workflowPriority: new Queue('workflow_priority', {
        connection: options,
        defaultJobOptions: {
            attempts: 5,
            priority: 1,
            backoff: { type: 'fixed', delay: 3000 }
        }
    }),

    workflowScheduled: new Queue('workflow_scheduled', {
        connection: options,
        defaultJobOptions: {
            attempts: 3,
            removeOnComplete: false
        }
    })
};
