import workflowService from '../services/workflow.service.js';
import actionHistoryService from '../services/actionHistory.service.js';
import WorkflowStep from '../models/workflowStep.model.js';

class WorkflowController {
  /**
   * Create a new workflow (supports both regular and simplified test-based formats)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createWorkflow(req, res) {
    try {
      // Check if it's a simplified test-based workflow
      const isTestBasedWorkflow = req.body.test && req.body.alert_condition;
      
      if (isTestBasedWorkflow) {
        // Handle simplified test-based workflow
        const workflowData = {
          name: req.body.name,
          doctor_id: req.body.doctor_id || req.user._id,
          patients_ids: req.body.patients_ids || (req.body.patient_id ? [req.body.patient_id] : []),
          test: req.body.test,
          alert_condition: req.body.alert_condition,
          urgent_action: req.body.urgent_action || {}
        };
        
        // Validate required fields
        const requiredFields = ['name', 'patients_ids', 'test', 'alert_condition'];
        for (const field of requiredFields) {
          if (!workflowData[field] || (Array.isArray(workflowData[field]) && workflowData[field].length === 0)) {
            return res.status(400).json({
              success: false,
              message: `${field} is required`
            });
          }
        }
        
        // Validate test data
        if (!workflowData.test.type) {
          return res.status(400).json({
            success: false,
            message: 'Test type is required'
          });
        }
        
        // Validate alert condition
        const alertCondition = workflowData.alert_condition;
        if (!alertCondition.parameter || !alertCondition.operator || alertCondition.threshold === undefined) {
          return res.status(400).json({
            success: false,
            message: 'Alert condition must include parameter, operator, and threshold'
          });
        }
        
        // Create simplified workflow
        const workflow = await workflowService.createTestBasedWorkflow(workflowData);
        actionHistoryService.recordAction({
          user_id: req.user._id,
          action_type: 'CREATE_MEDICAL_WORKFLOW',
          description: `Created workflow: ${workflow.name} for ${workflow.patients_ids.length} patients`
        });
        
        return res.status(201).json({
          success: true,
          message: 'Workflow created successfully',
          data: workflow
        });
      } else {
        // Handle standard workflow creation
        const workflowData = {
          name: req.body.name,
          description: req.body.description,
          doctor_id: req.body.doctor_id || req.user._id,
          status: req.body.status || 'active',
          stepsData: req.body.stepsData || []
        };
        
        // Handle patient IDs
        workflowData.patients_ids = req.body.patients_ids || req.body.patient_ids || [];
        if (req.body.patient_id && !workflowData.patients_ids.includes(req.body.patient_id)) {
          workflowData.patients_ids.push(req.body.patient_id);
        }
        
        // Check if this is a template
        if (req.body.is_template) {
          workflowData.is_template = true;
        } else if (!workflowData.patients_ids || workflowData.patients_ids.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'At least one patient ID is required'
          });
        }
        
        // Validate required fields
        const requiredFields = ['name', 'description'];
        for (const field of requiredFields) {
          if (!workflowData[field]) {
            return res.status(400).json({
              success: false,
              message: `${field} is required`
            });
          }
        }
        
        // Validate steps
        if (!Array.isArray(workflowData.stepsData) || workflowData.stepsData.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Workflow must have at least one step'
          });
        }
        
        // Create workflow
        const workflow = await workflowService.createWorkflow(workflowData);
        
        // Record action in history
        actionHistoryService.recordAction({
          user_id: req.user._id,
          action_type: 'CREATE_WORKFLOW',
          description: `Created workflow: ${workflow.name} for ${workflow.patients_ids?.length || 0} patients`
        });
        
        return res.status(201).json({
          success: true,
          message: 'Workflow created successfully',
          data: workflow
        });
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create workflow'
      });
    }
  }

  /**
   * Get workflow by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getWorkflow(req, res) {
    try {
      const workflowId = req.params.id;
      const workflow = await workflowService.getWorkflowById(workflowId);
      
      return res.status(200).json({
        success: true,
        data: workflow
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get workflows by doctor
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getWorkflowsByDoctor(req, res) {
    try {
      const doctorId = req.params.doctorId || req.user._id;
      const workflows = await workflowService.getWorkflowsByDoctor(doctorId);
      
      return res.status(200).json({
        success: true,
        count: workflows.length,
        data: workflows
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving workflows'
      });
    }
  }

  /**
   * Get workflows by patient
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getWorkflowsByPatient(req, res) {
    try {
      const patientId = req.params.patientId;
      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID is required'
        });
      }
      
      const workflows = await workflowService.getWorkflowsByPatient(patientId);
      
      return res.status(200).json({
        success: true,
        count: workflows.length,
        data: workflows
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving workflows'
      });
    }
  }

  /**
   * Get workflows for current user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getMyWorkflows(req, res) {
    try {
      const userId = req.user._id;
      console.log(`Fetching workflows for user: ${userId}`);
      
      const workflows = await workflowService.getWorkflowsByUser(userId);
      
      return res.status(200).json({
        success: true,
        count: workflows.length,
        data: workflows
      });
    } catch (error) {
      console.error('Error retrieving workflows:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving workflows'
      });
    }
  }

  /**
   * Update workflow
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateWorkflow(req, res) {
    try {
      const workflowId = req.params.id;
      const updateData = req.body;
      
      // Remove fields that shouldn't be updated directly
      delete updateData._id;
      delete updateData.created_at;
      
      const workflow = await workflowService.updateWorkflow(workflowId, updateData);
      
      // Record action
      actionHistoryService.recordAction({
        user_id: req.user._id,
        action_type: 'UPDATE_WORKFLOW',
        description: `Updated workflow: ${workflow.name}`
      });
      
      return res.status(200).json({
        success: true,
        message: 'Workflow updated successfully',
        data: workflow
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Delete workflow
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteWorkflow(req, res) {
    try {
      const workflowId = req.params.id;
      const deleted = await workflowService.deleteWorkflow(workflowId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Workflow not found'
        });
      }
      
      // Record action
      actionHistoryService.recordAction({
        user_id: req.user._id,
        action_type: 'DELETE_WORKFLOW',
        description: `Deleted workflow ID: ${workflowId}`
      });
      
      return res.status(200).json({
        success: true,
        message: 'Workflow deleted successfully'
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Update workflow status (pause, resume, complete)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateWorkflowStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || !['active', 'paused', 'completed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Valid status (active, paused, completed) is required'
        });
      }
      
      const workflow = await workflowService.updateWorkflow(id, { status });
      
      // Record action
      actionHistoryService.recordAction({
        user_id: req.user._id,
        action_type: 'UPDATE_WORKFLOW_STATUS',
        description: `Updated workflow status to ${status} for workflow: ${workflow.name}`
      });
      
      return res.status(200).json({
        success: true,
        message: `Workflow status updated to ${status}`,
        data: workflow
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Submit test results for processing in a workflow
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async submitTestResults(req, res) {
    try {
      const { workflowId, stepId, testType, results, patientId } = req.body;
      
      if (!workflowId || !stepId || !testType || !results || !patientId) {
        return res.status(400).json({
          success: false,
          message: 'Required fields missing: workflowId, stepId, testType, patientId, and results are required'
        });
      }
      
      // Process the test results
      const outcome = await workflowService.processTestResults({
        workflowId,
        stepId,
        patientId,
        testType,
        results
      });
      
      // Record action in history
      actionHistoryService.recordAction({
        user_id: req.user._id,
        action_type: 'TEST_RESULTS_SUBMITTED',
        description: `Submitted ${testType} test results for workflow ID: ${workflowId}`
      });
      
      return res.status(200).json({
        success: true,
        message: 'Test results processed successfully',
        data: outcome
      });
    } catch (error) {
      console.error('Error processing test results:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to process test results'
      });
    }
  }

  /**
   * Apply a workflow template to patients
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async applyWorkflowTemplate(req, res) {
    try {
      const { templateId, patientIds } = req.body;
      
      if (!templateId || !patientIds || !Array.isArray(patientIds) || patientIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Template ID and at least one patient ID are required'
        });
      }
      
      // Get the template workflow
      const template = await workflowService.getWorkflowById(templateId);
      
      if (!template.is_template) {
        return res.status(400).json({
          success: false,
          message: 'Workflow is not a template'
        });
      }
      
      // Prepare workflow data from template
      const workflowData = {
        name: template.name,
        description: template.description,
        doctor_id: template.doctor_id,
        status: 'active',
        stepsData: []
      };
      
      // Get steps from template
      const templateSteps = await WorkflowStep.find({ workflow_id: template._id })
        .sort({ order: 1 })
        .lean();
        
      // Copy steps to workflowData
      workflowData.stepsData = templateSteps.map(step => {
        const { _id, workflow_id, created_at, updated_at, ...stepData } = step;
        return stepData;
      });
      
      // Create workflows for patients
      const workflows = await workflowService.createWorkflowsForMultiplePatients(
        workflowData,
        patientIds
      );
      
      // Record action
      actionHistoryService.recordAction({
        user_id: req.user._id,
        action_type: 'APPLY_WORKFLOW_TEMPLATE',
        description: `Applied workflow template "${template.name}" to ${patientIds.length} patients`
      });
      
      return res.status(201).json({
        success: true,
        message: `Template applied to ${workflows.length} patients successfully`,
        data: {
          count: workflows.length,
          workflows
        }
      });
    } catch (error) {
      console.error('Error applying workflow template:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to apply workflow template'
      });
    }
  }
}

export default new WorkflowController();
