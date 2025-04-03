import parser from "cron-parser";
import actionHistoryService from "../services/actionHistory.service.js";
import WorkflowStep from "../models/workflowStep.model.js";
import ActionService from "../services/step.service.js"

class WorkersUtils {
    async evaluateCondition(condition, patient, stepResult) {
        switch (condition.type) {
            case "time_based":
                if (condition.time_condition.after_previous_step) {
                    const hoursToWait = condition.time_condition.after_previous_step;

                    return false;
                }
                if (condition.time_condition.specific_time) {
                    const now = new Date();
                    const execTime = new Date(condition.time_condition.specific_time);
                    return now >= execTime;
                }
                break;

            case "parameter_based":
                if (!condition.parameters || !stepResult) return true;

                const paramValue = stepResult[condition.parameters.parameter_name];
                if (paramValue === undefined) return false;

                switch (condition.parameters.operator) {
                    case ">": return paramValue > condition.parameters.threshold_value;
                    case "<": return paramValue < condition.parameters.threshold_value;
                    case "==": return paramValue === condition.parameters.threshold_value;
                    case ">=": return paramValue >= condition.parameters.threshold_value;
                    case "<=": return paramValue <= condition.parameters.threshold_value;
                    case "!=": return paramValue !== condition.parameters.threshold_value;
                    default: return true;
                }

            case "event_based":
                // Cas des events externes comme la reception des analyses etc
                return true;

            case "none":
            default:
                return true;
        }
    }

    getNextExecutionDate(schedule) {
        if (!schedule || !schedule.type) return null;

        try {
            switch (schedule.type) {
                case 'once':
                    return new Date(schedule.start_date);
                case 'daily':
                case 'weekly':
                case 'monthly':
                case 'custom':
                    if (schedule.cron_expression) {
                        const interval = parser.parse(schedule.cron_expression);
                        return interval.next().toDate();
                    }
                    return null;
                default:
                    return null;
            }
        } catch (error) {
            console.error('Error calculating next execution date:', error);
            return null;
        }
    }

    async determineNextStep(completedStep, patient, doctor, workflow) {
        console.log("Determine next step")
        try {
            const allSteps = await WorkflowStep.find({
                workflow_id: workflow._id
            }).sort({ order: 1 });

            const currentIndex = allSteps.findIndex(s => s._id.equals(completedStep._id));
            if (currentIndex === -1) return;

            if (currentIndex === allSteps.length - 1) {
                workflow.status = "completed";
                await workflow.save();

                actionHistoryService.recordAction({
                    user_id: doctor._id,
                    action_type: 'WORKFLOW_COMPLETED',
                    description: `Workflow "${workflow.name}" completed for patient ${patient.firstname} ${patient.lastname}`,
                    metadata: {
                        workflow_id: workflow._id,
                        patient_id: patient._id
                    }
                });
                return;
            }

            const nextStep = allSteps[currentIndex + 1];

            if (completedStep.condition && completedStep.condition.type !== "none") {
                const conditionMet = await this.evaluateCondition(
                    completedStep.condition,
                    patient,
                    completedStep.result
                );

                if (conditionMet && completedStep.condition.next_steps.on_success) {
                    const nextStepId = completedStep.condition.next_steps.on_success;
                    const conditionalNextStep = allSteps.find(s => s._id.equals(nextStepId));
                    if (conditionalNextStep) {
                        await ActionService.executeStep(conditionalNextStep, patient._id, doctor._id, workflow);
                        return;
                    }
                } else if (!conditionMet && completedStep.condition.next_steps.on_failure) {
                    const nextStepId = completedStep.condition.next_steps.on_failure;
                    const conditionalNextStep = allSteps.find(s => s._id.equals(nextStepId));
                    if (conditionalNextStep) {
                        await ActionService.executeStep(conditionalNextStep, patient._id, doctor._id, workflow);
                        return;
                    }
                }
            }

            await ActionService.executeStep(nextStep, patient._id, doctor._id, workflow);
            console.log("Determine next step completed !")
        } catch (error) {
            console.error('Error determining next step:', error);
            throw error;
        }
    }
}

export default new WorkersUtils();