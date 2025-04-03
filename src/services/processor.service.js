import WorkflowStep from "../models/workflowStep.model.js";
import Patient from "../models/patients.model.js";
import Doctor from "../models/doctor.model.js";
import Workflow from "../models/workflow.model.js";
import actionHistoryService from "./actionHistory.service.js";
import WorkersUtils from "../utils/workers.utils.js";

class ProcessorService {
    async processWorkflowStep(jobData) {
        console.log("Processing worflow step", { data: jobData })
        const { step_id, patient_id, doctor_id, workflow_id } = jobData;
        const [step, patient, doctor, workflow] = await Promise.all([
            WorkflowStep.findById(step_id),
            Patient.findById(patient_id),
            Doctor.findById(doctor_id),
            Workflow.findById(workflow_id)
        ]);
        if (!step || !patient || !doctor || !workflow) {
            throw new Error('Required data not found for step execution');
        }
        actionHistoryService.recordAction({
            user_id: doctor_id,
            action_type: 'WORKFLOW_STEP_EXECUTION',
            description: `Executing ${step.type} step "${step.name}" for patient ${patient.firstname} ${patient.lastname}`,
            metadata: {
                workflow_id: workflow._id,
                step_id: step._id,
                patient_id: patient._id,
                queue_type: jobData.queue
            }
        });
        try {
            let result;
            switch (step.type) {
                case 'reminder':
                    result = await this.reminderStep(step, patient, doctor);
                    break;
                case 'task':
                    result = await this.taskStep(step, patient, doctor);
                    break;
                case 'alert':
                    result = await this.alertStep(step, patient, doctor);
                    break;
                case 'appointment':
                    result = await this.appointmentStep(step, patient, doctor);
                    break;
                case 'analysis_test':
                    result = await this.analysisStep(step, patient, doctor);
                    break;
                default:
                    throw new Error(`Unknown step type: ${step.type}`);
            }

            step.status = "completed";
            step.result = result;
            step.execution_logs.push({
                timestamp: new Date(),
                status: "completed",
                message: "Step executed successfully",
                details: result
            });
            await step.save();

            await WorkersUtils.determineNextStep(step, patient, doctor, workflow);

            return result;
        } catch (error) {
            console.error(`Error processing step ${step._id}:`, error);

            step.status = "failed";
            step.execution_logs.push({
                timestamp: new Date(),
                status: "failed",
                message: "Step execution failed",
                details: error.message
            });
            await step.save();

            throw error;
        }
    }
    async reminderStep(step, patient, doctor) {
        // TODO: Reminder step action
        console.log("Reminder step action", {
            step, patient, doctor
        })
        return { sent: true, to: patient.email };
    }

    async taskStep(step, patient, doctor) {
        // TODO: Task step action
        console.log("Task step action")
        return { completed: true };
    }

    async alertStep(step, patient, doctor) {
        // TODO: Alert step action
        console.log("Alert step action", {
            step, patient, doctor
        })
        return { alert_sent: true, to: doctor.email };
    }

    async appointmentStep(step, patient, doctor) {
        /// TODO: Appointment step action
        console.log("Appointment step action", {
            step, patient, doctor
        })
        return { appointment_created: true };
    }

    async analysisStep(step, patient, doctor) {
        // TODO: Appointment step action
        console.log("Appointment step action", {
            step, patient, doctor
        })
        return { analysis_processed: true };
    }
}
export default new ProcessorService()