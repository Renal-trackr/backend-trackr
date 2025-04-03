import {Worker} from 'bullmq';
import dotenv from 'dotenv';
import WorkflowStep from '../models/workflowStep.model.js';
import ProcessorService from "../services/processor.service.js";
import {options} from "../config/redis.js";

dotenv.config();

export const initWorkers = () => {
    const workers = {
        workflow: new Worker('workflow', async job => {
            return await ProcessorService.processWorkflowStep(job.data);
        }, {
            connection: options,
            concurrency: 20
        }),

        workflowPriority: new Worker('workflow_priority', async job => {
            return await ProcessorService.processWorkflowStep(job.data);
        }, {
            connection: options,
            concurrency: 10
        }),

        workflowScheduled: new Worker('workflow_scheduled', async job => {
            const result = await ProcessorService.processWorkflowStep(job.data);
            await WorkflowStep.updateOne(
                {_id: job.data.step_id},
                {'schedule.last_executed': new Date()}
            );
            return result;
        }, {
            connection: options,
            concurrency: 5
        })
    };

    Object.values(workers).forEach(worker => {
        worker.on('failed', (job, err) => {
            console.error(`Job ${job.id} failed:`, err);
        });

        worker.on('ready', () => {
            console.log('Worker is ready to process jobs');
        })
    });

    return workers;
};
