import Workflow from '../models/workflow.model.js';
import WorkflowStep from '../models/workflowStep.model.js';
import Patient from '../models/patients.model.js';
import queueService from './queue.service.js';
import mongoose from 'mongoose';
import parser from 'cron-parser';
import MedicalAnalysis from '../models/analyse.model.js';
import Doctor from '../models/doctor.model.js';

class WorkflowService {
  /**
   * Create a new workflow with steps
   * @param {Object} workflowData - Workflow data
   * @returns {Promise<Object>} Created workflow
   */
  async createWorkflow(workflowData) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {

      if (!mongoose.Types.ObjectId.isValid(workflowData.doctor_id)) {
        throw new Error('Invalid doctor reference');
      }
      

      if (!workflowData.patients_ids) {
        workflowData.patients_ids = [];
      } else if (!Array.isArray(workflowData.patients_ids)) {

        workflowData.patients_ids = [workflowData.patients_ids];
      }
      

      delete workflowData.patient_id;
      

      for (const patientId of workflowData.patients_ids) {
        if (!mongoose.Types.ObjectId.isValid(patientId)) {
          throw new Error(`Invalid patient ID: ${patientId}`);
        }
      }
      

      const stepsData = workflowData.stepsData || [];
      delete workflowData.stepsData;
      

      const workflow = new Workflow({
        ...workflowData,
        steps: []
      });
      
      await workflow.save({ session });
      

      const stepIds = [];
      
      for (let i = 0; i < stepsData.length; i++) {
        const stepData = stepsData[i];
        
        const step = new WorkflowStep({
          workflow_id: workflow._id,
          name: stepData.name,
          description: stepData.description || '',
          order: stepData.order || i + 1,
          type: stepData.type,
          condition: stepData.condition || {},
          action: stepData.action || {}
        });
        
        await step.save({ session });
        stepIds.push(step._id);
      }
      

      workflow.steps = stepIds;
      await workflow.save({ session });
      

      if (workflow.status === 'active' && stepIds.length > 0) {
        const firstStep = await WorkflowStep.findById(stepIds[0]);
        await this.scheduleWorkflowStep(workflow, firstStep);
      }
      
      await session.commitTransaction();
      

      const createdWorkflow = await Workflow.findById(workflow._id)
        .populate('steps')
        .exec();
        
      return createdWorkflow;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Create workflows for multiple patients
   * This method is now simplified since we support multiple patients directly
   * @param {Object} workflowData - Base workflow data
   * @param {Array} patientIds - Array of patient IDs
   * @returns {Promise<Object>} Created workflow
   */
  async createWorkflowsForMultiplePatients(workflowData, patientIds) {

    workflowData.patients_ids = patientIds;
    

    return this.createWorkflow(workflowData);
  }

  /**
   * Create a template workflow (without assigning to a patient)
   * @param {Object} workflowData - Template workflow data
   * @returns {Promise<Object>} Created template workflow
   */
  async createWorkflowTemplate(workflowData) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {

      if (!mongoose.Types.ObjectId.isValid(workflowData.doctor_id)) {
        throw new Error('Invalid doctor reference');
      }
      

      const templateData = {
        ...workflowData,
        is_template: true
      };
      delete templateData.patient_id;
      

      const stepsData = templateData.stepsData || [];
      delete templateData.stepsData;
      

      const workflow = new Workflow({
        ...templateData,
        steps: []
      });
      
      await workflow.save({ session });
      

      const stepIds = [];
      
      for (let i = 0; i < stepsData.length; i++) {
        const stepData = stepsData[i];
        
        const step = new WorkflowStep({
          workflow_id: workflow._id,
          name: stepData.name,
          description: stepData.description || '',
          order: stepData.order || i + 1,
          type: stepData.type,
          condition: stepData.condition || {},
          action: stepData.action || {}
        });
        
        await step.save({ session });
        stepIds.push(step._id);
      }
      

      workflow.steps = stepIds;
      await workflow.save({ session });
      
      await session.commitTransaction();
      

      const templateWorkflow = await Workflow.findById(workflow._id)
        .populate('steps')
        .exec();
        
      return templateWorkflow;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Create a simplified test-based workflow
   * @param {Object} workflowData - Simplified workflow data
   * @returns {Promise<Object>} Created workflow
   */
  async createTestBasedWorkflow(workflowData) {
    const { name, patients_ids, doctor_id, test, alert_condition, urgent_action } = workflowData;
    

    const patientsList = Array.isArray(patients_ids) ? patients_ids : [patients_ids];
    

    const delayDays = test.delay_days || 7;
    

    const fullWorkflowData = {
      name,
      description: `Automated workflow: ${name}`,
      doctor_id,
      patients_ids: patientsList,
      status: 'active',
      stepsData: [

        {
          name: `Reminder: ${test.type} test`,
          description: test.description || `Reminder to schedule ${test.type} test`,
          order: 1,
          type: 'reminder',
          condition: {
            timing: {
              type: 'delay',
              value: `${delayDays}d`
            }
          },
          action: {
            message: `Please schedule a ${test.type} test for your patient`,
            target: 'doctor'
          }
        },

        {
          name: `Patient notification: ${test.type} test`,
          description: `Notify patient about upcoming ${test.type} test`,
          order: 2,
          type: 'reminder',
          condition: {
            timing: {
              type: 'delay',
              value: `${delayDays - 1}d` 
            }
          },
          action: {
            message: `You have an upcoming ${test.type} test. Please visit the clinic.`,
            target: 'patient'
          }
        },

        {
          name: `Evaluate ${test.type} results`,
          description: `Check if ${test.type} results trigger an alert`,
          order: 3,
          type: 'task',
          condition: {
            parameter: alert_condition.parameter,
            operator: alert_condition.operator,
            value: alert_condition.threshold
          },
          action: {
            type: 'evaluate_test',
            test_type: test.type,
            parameter: alert_condition.parameter,
            threshold: alert_condition.threshold,
            operator: alert_condition.operator,
            unit: alert_condition.unit || ''
          }
        }
      ]
    };
    

    if (urgent_action && urgent_action.schedule_appointment) {
      fullWorkflowData.stepsData.push({
        name: 'Schedule urgent appointment',
        description: urgent_action.message || 'Urgent appointment required based on test results',
        order: 4,
        type: 'alert',
        condition: {

          dependsOn: 3,
          outcome: 'alert_triggered'
        },
        action: {
          type: 'schedule_appointment',
          alertType: 'urgent',
          urgency_level: urgent_action.urgency_level || 'high',
          message: urgent_action.message,
          timing: { days: 2 } 
        }
      });
    }
    

    return this.createWorkflow(fullWorkflowData);
  }

  /**
   * Get workflow by ID with populated steps
   * @param {String} id - Workflow ID
   * @returns {Promise<Object>} Workflow
   */
  async getWorkflowById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid workflow ID');
    }
    
    const workflow = await Workflow.findById(id)
      .populate('steps')
      .exec();
      
    if (!workflow) {
      throw new Error('Workflow not found');
    }
    
    return workflow;
  }

  /**
   * Get workflows by doctor
   * @param {String} doctorId - Doctor ID
   * @returns {Promise<Array>} List of workflows
   */
  async getWorkflowsByDoctor(doctorId) {
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw new Error('Invalid doctor ID');
    }
    
    return Workflow.find({ doctor_id: doctorId })
      .populate('steps')
      .exec();
  }

  /**
   * Get workflows by patient
   * @param {String} patientId - Patient ID
   * @returns {Promise<Array>} List of workflows
   */
  async getWorkflowsByPatient(patientId) {
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      throw new Error('Invalid patient ID');
    }
    
    return Workflow.find({ patients_ids: patientId })
      .populate('steps')
      .exec();
  }

  /**
   * Get workflows by user
   * @param {String} userId - User ID
   * @returns {Promise<Array>} List of workflows
   */
  async getWorkflowsByUser(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const doctor = await Doctor.findOne({ user_id: userId });
    if (!doctor) {

      return [];
    }
    

    return Workflow.find({ doctor_id: doctor._id })
      .populate('steps')
      .exec();
  }

  /**
   * Update workflow
   * @param {String} id - Workflow ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated workflow
   */
  async updateWorkflow(id, updateData) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid workflow ID');
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {

      const stepsData = updateData.stepsData || [];
      delete updateData.stepsData;
      

      const workflow = await Workflow.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true, session }
      );
      
      if (!workflow) {
        throw new Error('Workflow not found');
      }
      

      if (stepsData.length > 0) {

        for (const stepData of stepsData) {
          if (stepData._id) {

            await WorkflowStep.findByIdAndUpdate(
              stepData._id,
              { $set: stepData },
              { runValidators: true, session }
            );
          } else {

            const step = new WorkflowStep({
              workflow_id: workflow._id,
              name: stepData.name,
              description: stepData.description || '',
              order: stepData.order,
              type: stepData.type,
              condition: stepData.condition || {},
              action: stepData.action || {}
            });
            
            await step.save({ session });
            
            workflow.steps.push(step._id);
          }
        }
        

        await workflow.save({ session });
      }
      
      await session.commitTransaction();
      

      const updatedWorkflow = await Workflow.findById(id)
        .populate('steps')
        .exec();
        
      return updatedWorkflow;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Delete workflow and all associated steps
   * @param {String} id - Workflow ID
   * @returns {Promise<Boolean>} Success status
   */
  async deleteWorkflow(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid workflow ID');
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {

      await WorkflowStep.deleteMany({ workflow_id: id }, { session });
      

      const result = await Workflow.deleteOne({ _id: id }, { session });
      
      await session.commitTransaction();
      
      return result.deletedCount === 1;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Schedule workflow step
   * @param {Object} workflow - Workflow
   * @param {Object} step - Step to schedule
   * @returns {Promise<Object>} Scheduled job
   */
  async scheduleWorkflowStep(workflow, step) {
    try {

      const delay = await this.calculateStepDelay(step, workflow);
      

      const jobs = [];
      for (const patientId of workflow.patients_ids) {

        const job = await queueService.addWorkflowTask(
          {
            workflowId: workflow._id,
            stepId: step._id,
            patientId: patientId,
            doctorId: workflow.doctor_id
          },
          {
            delay,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000
            }
          }
        );
        jobs.push(job);
      }
      
      return jobs;
    } catch (error) {
      console.error('Error scheduling workflow step:', error);

      return { error: error.message };
    }
  }

  /**
   * Calculate delay for step execution
   * @param {Object} step - Workflow steptiming) {
   * @param {Object} workflow - Workflow 
   * @returns {Promise<Number>} Delay in milliseconds
   */
  async calculateStepDelay(step, workflow) {

    if (!step.condition || !step.condition.timing) {
      return 0;
    }
    
    const timing = step.condition.timing;
    const now = Date.now();
    let scheduleTime = now;
    
    switch (timing.type) {
      case 'delay':
        scheduleTime = now + this.parseDuration(timing.value);
        break;
        
      case 'fixed_time':
        scheduleTime = new Date(timing.date).getTime();
        break;
        
      case 'cron':
        try {
          const interval = parser.parseExpression(timing.expression);
          scheduleTime = interval.next().getTime();
        } catch (err) {
          console.error('Invalid cron expression:', err);
        }
        break;
    }
    

    return Math.max(scheduleTime - now, 1000);
  }

  /**
   * Process a workflow step
   * @param {Object} data - Step data
   * @returns {Promise<Object>} Step result
   */
  async processWorkflowStep(data) {
    const { workflowId, stepId, patientId } = data;
    

    const workflow = await Workflow.findById(workflowId);
    const step = await WorkflowStep.findById(stepId);
    const patient = await Patient.findById(patientId);
    
    if (!workflow || !step || !patient) {
      throw new Error('Workflow, step or patient not found');
    }
    
    try {

      let result = null;
      
      switch (step.type) {
        case 'reminder':
          result = await this.executeReminderStep(step, workflow, patient);
          break;
          
        case 'task':
          result = await this.executeTaskStep(step, workflow, patient);
          break;
          
        case 'alert':
          result = await this.executeAlertStep(step, workflow, patient);
          break;
      }
      

      step.status = 'completed';
      await step.save();
      

      await this.scheduleNextStep(workflow);
      
      return result;
    } catch (error) {

      step.status = 'failed';
      await step.save();
      
      throw error;
    }
  }

  /**
   * Schedule the next step in the workflow
   * @param {Object} workflow - Workflow
   * @returns {Promise<Object|null>} Next step or null if completed
   */
  async scheduleNextStep(workflow) {

    const steps = await WorkflowStep.find({ workflow_id: workflow._id })
      .sort({ order: 1 })
      .exec();
    

    let completedAll = true;
    let nextStep = null;
    
    for (const step of steps) {
      if (step.status === 'pending') {
        completedAll = false;
        nextStep = step;
        break;
      }
    }
    

    if (completedAll) {
      workflow.status = 'completed';
      await workflow.save();
      return null;
    }
    

    if (nextStep) {
      return this.scheduleWorkflowStep(workflow, nextStep);
    }
    
    return null;
  }

  /**
   * Execute a reminder step
   * @param {Object} step - Workflow step
   * @param {Object} workflow - Workflow
   * @param {Object} patient - Patient
   * @returns {Promise<Object>} Result
   */
  async executeReminderStep(step, workflow, patient) {

    
    console.log(`Executing reminder step: ${step.name} for patient ${patient.firstname} ${patient.lastname}`);
    

    return {
      type: 'reminder',
      message: step.action.message || `Reminder: ${step.name}`,
      target: step.action.target || 'patient'
    };
  }

  /**
   * Execute a task step
   * @param {Object} step - Workflow step
   * @param {Object} workflow - Workflow
   * @param {Object} patient - Patient
   * @returns {Promise<Object>} Result
   */
  async executeTaskStep(step, workflow, patient) {

    console.log(`Executing task step: ${step.name} for patient ${patient.firstname} ${patient.lastname}`);
    
    if (step.action.type === 'schedule_appointment') {

      return queueService.scheduleAppointment({
        patient_id: patient._id,
        doctor_id: workflow.doctor_id,
        appointment_date: this.calculateAppointmentDate(step.action.timing || { days: 1 }),
        motif: step.action.reason || step.name,
        status: 'À venir'
      });
    }
    
    return {
      type: 'task',
      message: `Executed task: ${step.name}`,
      result: 'completed'
    };
  }

  /**
   * Execute an alert step
   * @param {Object} step - Workflow step
   * @param {Object} workflow - Workflow
   * @param {Object} patient - Patient
   * @returns {Promise<Object>} Result
   */
  async executeAlertStep(step, workflow, patient) {

    
    console.log(`Executing alert step: ${step.name} for patient ${patient.firstname} ${patient.lastname}`);
    
    return queueService.addAlert({
      patient_id: patient._id,
      alert_type: step.action.alertType || 'workflow',
      message: step.action.message || step.name,
      status: 'Nouveau'
    });
  }

  /**
   * Process test results and determine next workflow steps
   * @param {Object} data - Test result data
   * @returns {Promise<Object>} Processing outcome
   */
  async processTestResults(data) {
    const { workflowId, stepId, patientId, testType, results } = data;
    
    if (!workflowId || !stepId || !patientId || !testType || !results) {
      throw new Error('Missing required test result data');
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {

      const workflow = await Workflow.findById(workflowId);
      const step = await WorkflowStep.findById(stepId);
      
      if (!workflow || !step) {
        throw new Error('Workflow or step not found');
      }
      
      if (step.type !== 'analysis_test') {
        throw new Error('Step is not an analysis test');
      }
      

      const analysis = new MedicalAnalysis({
        patient_id: patientId,
        doctor_id: workflow.doctor_id,
        analysis_date: new Date(),
        results: {
          type: testType,
          ...results
        },
        interpretation: results.interpretation || 'Automatically processed'
      });
      
      await analysis.save({ session });

      step.result = results;
      step.status = 'completed';
      await step.save({ session });
      

      let nextStepId = null;
      let alertCreated = false;
      

      if (step.condition && typeof step.condition === 'object') {
        const { parameter, operator, value, next_steps } = step.condition;
        

        if (parameter && operator && value !== undefined && results[parameter] !== undefined) {
          const testValue = results[parameter];
          let conditionMet = false;

          switch (operator) {
            case '=':
            case 'eq':
              conditionMet = testValue == value;
              break;
            case '>':
            case 'gt':
              conditionMet = testValue > value;
              break;
            case '>=':
            case 'gte':
              conditionMet = testValue >= value;
              break;
            case '<':
            case 'lt':
              conditionMet = testValue < value;
              break;
            case '<=':
            case 'lte':
              conditionMet = testValue <= value;
              break;
          }
          

          if (conditionMet && step.action && step.action.type) {
            if (step.action.type === 'create_alert') {

              const alert = {
                patient_id: patientId,
                alert_type: step.action.alert_type || 'test_result',
                message: step.action.message || `Abnormal test result for ${testType}`,
                analysis_id: analysis._id
              };
              
              await queueService.addAlert(alert);
              alertCreated = true;
            }
            
            if (step.action.type === 'schedule_appointment') {

              const appointmentData = {
                patient_id: patientId,
                doctor_id: workflow.doctor_id,
                appointment_date: this.calculateAppointmentDate(step.action.timing || { days: 2 }),
                motif: step.action.reason || `Follow-up for ${testType} results`,
                status: 'À venir',
                notes: `Scheduled automatically due to test results: ${JSON.stringify(results)}`
              };
              
              await queueService.scheduleAppointment(appointmentData);
            }
          }
          

          if (next_steps) {
            nextStepId = conditionMet ? 
              next_steps.abnormal || next_steps.true : 
              next_steps.normal || next_steps.false;
          }
        }
      }
      

      if (!nextStepId) {
        const steps = await WorkflowStep.find({ workflow_id: workflowId })
          .sort({ order: 1 })
          .exec();
        

        const currentIndex = steps.findIndex(s => s._id.toString() === stepId);
        

        if (currentIndex >= 0 && currentIndex < steps.length - 1) {
          nextStepId = steps[currentIndex + 1]._id;
        }
      }
      

      let nextStep = null;
      if (nextStepId) {
        nextStep = await WorkflowStep.findById(nextStepId);
        if (nextStep) {
          await this.scheduleWorkflowStep(workflow, nextStep);
        }
      } else {

        const pendingSteps = await WorkflowStep.countDocuments({
          workflow_id: workflowId,
          status: 'pending'
        });
        
        if (pendingSteps === 0) {
          workflow.status = 'completed';
          await workflow.save({ session });
        }
      }
      
      await session.commitTransaction();
      
      return {
        workflow_id: workflowId,
        test_recorded: true,
        alert_created: alertCreated,
        next_step: nextStep ? {
          id: nextStep._id,
          name: nextStep.name,
          type: nextStep.type
        } : null,
        analysis_id: analysis._id
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Parse duration string to milliseconds
   * @param {String} duration - Duration string (e.g., "7d", "24h")
   * @returns {Number} Milliseconds
   */
  parseDuration(duration) {
    if (!duration) return 0;
    
    const unit = duration.slice(-1);
    const value = parseInt(duration.slice(0, -1), 10);
    
    switch (unit) {
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'm': return value * 60 * 1000;
      case 's': return value * 1000;
      default: return 0;
    }
  }

  /**
   * Calculate appointment date based on timing
   * @param {Object} timing - Timing object
   * @returns {Date} Appointment date
   */
  calculateAppointmentDate(timing) {
    const now = new Date();
    
    if (timing.date) {
      return new Date(timing.date);
    }
    
    if (timing.days) {
      now.setDate(now.getDate() + timing.days);
    }
    
    if (timing.hours) {
      now.setHours(now.getHours() + timing.hours);
    }
    
    return now;
  }
}

export default new WorkflowService();
