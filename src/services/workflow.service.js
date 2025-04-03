import Workflow from '../models/workflow.model.js';
import WorkflowStep from '../models/workflowStep.model.js';
import Patient from '../models/patients.model.js';
import ActionService from './step.service.js';
import mongoose from 'mongoose';
import Doctor from '../models/doctor.model.js';
import actionHistoryService from "./actionHistory.service.js";

class WorkflowService {
  /**
   * Create a new workflow with steps
   * @param {Object} workflowData - Workflow data
   * @returns {Promise<Object>} Created workflow
   */
  async createWorkflow(workflowData) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction({
        readConcern: { level: 'majority' },
        writeConcern: { w: 'majority' },
        maxTimeMS: 30000
      });
      const doctor = await Doctor.findById(workflowData.doctor_id).session(session);
      if (!doctor) throw new Error('Doctor not found');

      const patientCount = await Patient.countDocuments({
        _id: { $in: workflowData.patients_ids }
      }).session(session);

      if (patientCount !== workflowData.patients_ids.length) {
        throw new Error('One or more patients not found');
      }

      const workflow = new Workflow({
        ...workflowData,
        steps: [],
        status: "inactive",
        current_step_index: 0
      });

      await workflow.save({session});

      const stepCreationPromises = workflowData.steps?.map((stepData, index) => {
        const step = new WorkflowStep({
          ...stepData,
          workflow_id: workflow._id,
          order: stepData.order || index + 1,
          status: "pending"
        });
        return step.save({ session });
      }) || [];
      const steps = await Promise.all(stepCreationPromises);
      workflow.steps = steps.map(step => step._id);
      await workflow.save({session});

      await session.commitTransaction();
      actionHistoryService.recordAction({
        user_id: workflowData.user_id,
        action_type: 'CREATE_WORKFLOW',
        description: `Created workflow: ${workflow.name}`,
        metadata: {
          workflow_id: workflow._id,
          patient_ids: workflowData.patients_ids
        }
      });
      return await Workflow.findById(workflow._id).populate('steps')
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async startWorkflow(workflowId, patientId, doctorId) {
    if (!mongoose.Types.ObjectId.isValid(workflowId) ||
        !mongoose.Types.ObjectId.isValid(patientId) ||
        !mongoose.Types.ObjectId.isValid(doctorId)) {
      throw new Error("Invalid ID format");
    }

    const [workflow, patient, doctor] = await Promise.all([
      Workflow.findById(workflowId),
      Patient.findById(patientId),
      Doctor.findById(doctorId)
    ]);

    if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);
    if (!patient) throw new Error(`Patient not found: ${patientId}`);
    if (!doctor) throw new Error(`Doctor not found: ${doctorId}`);

    if (!workflow.patients_ids.includes(patientId)) {
      throw new Error(`Patient ${patientId} not associated with workflow ${workflowId}`);
    }

    const steps = await WorkflowStep.find({
      workflow_id: workflowId
    }).sort({ order: 1 });

    if (!steps.length) {
      throw new Error("Workflow has no steps to execute");
    }

    workflow.status = "active";
    await workflow.save();

    actionHistoryService.recordAction({
      user_id: doctorId,
      action_type: 'START_WORKFLOW',
      description: `Started workflow "${workflow.name}" for patient ${patient.firstname} ${patient.lastname}`,
      metadata: {
        workflow_id: workflow._id,
        patient_id: patientId,
        initial_step: steps[0]._id
      }
    });
    await ActionService.executeStep(steps[0], patientId, doctorId, workflow);
    return {
      message: `Workflow "${workflow.name}" started successfully for patient ${patient.firstname} ${patient.lastname}`,
      workflow: workflow,
      first_step: steps[0]
    };
  }
}


export default new WorkflowService()