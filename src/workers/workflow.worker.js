import { Worker } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import workflowService from '../services/workflow.service.js';
import Workflow from '../models/workflow.model.js';
import WorkflowStep from '../models/workflowStep.model.js';
import Patient from '../models/patients.model.js';
import actionHistoryService from '../services/actionHistory.service.js';

dotenv.config();

// Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
});

// Worker for workflow tasks
const workflowWorker = new Worker('workflow-tasks', async job => {
  try {
    const { workflowId, stepId, patientId, doctorId } = job.data;
    
    console.log(`Processing workflow task: ${job.id}`);
    console.log(`Workflow: ${workflowId}, Step: ${stepId}, Patient: ${patientId}`);
    
    // Get workflow, step and patient information
    const workflow = await Workflow.findById(workflowId);
    const step = await WorkflowStep.findById(stepId);
    const patient = await Patient.findById(patientId);
    
    if (!workflow || !step || !patient) {
      throw new Error('Workflow, step or patient not found');
    }
    
    if (workflow.status !== 'active') {
      return {
        status: 'skipped',
        message: `Workflow is ${workflow.status}, not processing steps`
      };
    }
    
    // Record action in history with the correct patient reference
    actionHistoryService.recordAction({
      user_id: doctorId,
      action_type: 'WORKFLOW_STEP_EXECUTION',
      description: `Executing workflow step "${step.name}" for patient ${patient.firstname} ${patient.lastname}`
    });
    
    // Process the step
    const result = await workflowService.processWorkflowStep(job.data);
    
    return {
      status: 'completed',
      message: `Executed workflow step: ${step.name}`,
      result
    };
  } catch (error) {
    console.error('Error processing workflow task:', error);
    throw error;
  }
}, { connection });

// Alert worker
const alertWorker = new Worker('alerts', async job => {
  try {
    const alertData = job.data;
    console.log('Creating alert:', alertData);
    
    // Create alert in database
    // This would typically integrate with the alert model
    // For demonstration, we'll just log it
    
    return {
      status: 'completed',
      message: `Alert created: ${alertData.message}`
    };
  } catch (error) {
    console.error('Error creating alert:', error);
    throw error;
  }
}, { connection });

// Appointment worker
const appointmentWorker = new Worker('appointments', async job => {
  try {
    const appointmentData = job.data;
    console.log('Scheduling appointment:', appointmentData);
    
    // Create appointment in database
    // This would typically integrate with the appointment model
    // For demonstration, we'll just log it
    
    return {
      status: 'completed',
      message: `Appointment scheduled for ${new Date(appointmentData.appointment_date).toISOString()}`
    };
  } catch (error) {
    console.error('Error scheduling appointment:', error);
    throw error;
  }
}, { connection });

// Event handlers
workflowWorker.on('completed', job => {
  console.log(`Workflow job ${job.id} completed`);
});

workflowWorker.on('failed', (job, err) => {
  console.error(`Workflow job ${job?.id} failed with error: ${err.message}`);
});

alertWorker.on('completed', job => {
  console.log(`Alert job ${job.id} completed`);
});

appointmentWorker.on('completed', job => {
  console.log(`Appointment job ${job.id} completed`);
});

export { workflowWorker, alertWorker, appointmentWorker };
