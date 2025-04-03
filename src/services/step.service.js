import WorkflowStep from "../models/workflowStep.model.js";
import { v4 as uuidv4} from "uuid"
import {queues } from "../queues/workflow.queue.js";
import WorkersUtils from "../utils/workers.utils.js";

class ActionService {
    async executeStep(step, patientId, doctorId, workflow) {
        console.log("Calling execute step");
        try {
            if (step.dependencies && step.dependencies.length > 0) {
                const dependentSteps = await WorkflowStep.find({
                    _id: { $in: step.dependencies }
                });

                const incompleteDeps = dependentSteps.filter(s =>
                    s.status !== "completed"
                );

                if (incompleteDeps.length > 0) {
                    step.status = "waiting_condition";
                    await step.save();
                    return;
                }
            }

            const jobData = {
                step_id: step._id,
                patient_id: patientId,
                doctor_id: doctorId,
                workflow_id: workflow._id,
                execution_id: uuidv4(),
                step_type: step.type
            };

            const jobOptions = {
                jobId: `${step._id}-${patientId}-${Date.now()}`,
                removeOnComplete: true,
                removeOnFail: false
            };
            console.log("Step Data", {jobData, step})
            if (step.schedule && step.schedule.type) {
                await this.scheduleStep(step, patientId, doctorId, workflow);
            } else if (step.type === 'alert') {
                console.log("Priority step", {jobData, step})
                await queues.workflowPriority.add('alert_step', jobData, {
                    ...jobOptions,
                    priority: 1,
                    attempts: 5,
                    backoff: { type: 'fixed', delay: 3000 }
                });
            } else {
                console.log("Simple step", {jobData, step})
                await queues.workflow.add('workflow_step', jobData, {
                    ...jobOptions,
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5000 }
                });
            }

            step.status = "pending";
            step.execution_logs.push({
                timestamp: new Date(),
                status: "queued",
                message: "Step added to execution queue",
            });
            await step.save();
        } catch (error) {
            console.error(`Error executing step ${step._id}:`, error);

            step.status = "failed";
            step.execution_logs.push({
                timestamp: new Date(),
                status: "error",
                message: "Failed to queue step for execution",
                details: error.message
            });
            await step.save();

            throw error;
        }
    }

    async scheduleStep(step, patientId, doctorId, workflow) {
        try {
            if (!step.schedule) {
                throw new Error('Step has no schedule configuration');
            }

            const jobData = {
                step_id: step._id,
                patient_id: patientId,
                doctor_id: doctorId,
                workflow_id: workflow._id,
                execution_id: uuidv4(),
                is_scheduled: true,
                step_type: step.type
            };
            console.log("Programming scheduled step", {
                step, patientId, doctorId, workflow, jobData
            })
            const jobOptions = {
                jobId: `scheduled-${step._id}-${patientId}`,
                removeOnComplete: true,
                removeOnFail: true
            };

            switch (step.schedule.type) {
                case 'once':
                    jobOptions.delay = new Date(step.schedule.start_date) - Date.now();
                    break;

                case 'daily':
                    jobOptions.repeat = {
                        pattern: `0 9 */${step.schedule.interval || 1} * *`,
                        startDate: step.schedule.start_date,
                        endDate: step.schedule.end_date
                    };
                    break;

                case 'weekly':
                    jobOptions.repeat = {
                        pattern: '0 9 * * 1', // Every monday at 9 AM
                        startDate: step.schedule.start_date,
                        endDate: step.schedule.end_date
                    };
                    break;

                case 'monthly':
                    const dayOfMonth = new Date(step.schedule.start_date).getDate() || 1;
                    jobOptions.repeat = {
                        pattern: `0 9 ${dayOfMonth} * *`,
                        startDate: step.schedule.start_date,
                        endDate: step.schedule.end_date
                    };
                    break;

                case 'custom':
                    jobOptions.repeat = {
                        pattern: step.schedule.cron_expression,
                        startDate: step.schedule.start_date,
                        endDate: step.schedule.end_date
                    };
                    break;

                default:
                    throw new Error(`Unsupported schedule type: ${step.schedule.type}`);
            }

            await queues.workflowScheduled.add('scheduled_step', jobData, jobOptions);
            step.execution_logs.push({
                timestamp: new Date(),
                status: "scheduled",
                message: `Step scheduled with type: ${step.schedule.type}`,
                next_execution: WorkersUtils.getNextExecutionDate(step.schedule)
            });
            console.log("Execution logs")
            await step.save();
        } catch (error) {
            console.error(`Error executing step ${step._id}:`, error);

            step.status = "failed";
            step.execution_logs.push({
                timestamp: new Date(),
                status: "error",
                message: "Failed to queue step for execution",
                details: error.message
            });
            await step.save();
            throw error;
        }

    }
}

export default new ActionService()