import workflowService from '../services/workflow.service.js';
import actionHistoryService from '../services/actionHistory.service.js';
import WorkflowStep from '../models/workflowStep.model.js';

import WorkflowService from "../services/workflow.service.js";

class WorkflowController {
  /**
   * Create a new workflow (supports both regular and simplified test-based formats)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createWorkflow(req, res) {
    try {
      const workflowData = req.body;
      workflowData.user_id = req.user._id;

      const workflow = await WorkflowService.createWorkflow(workflowData);

      return res.status(201).json({
        success: true,
        message: "Workflow created successfully!",
        workflow
      });
    } catch (error) {
      console.error('Error creating workflow:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create workflow'
      });
    }
  }

  async startWorkflowForPatient (req, res){
    try {
      console.log("Request received to start workflow:", req.body);
      const { workflowId, patientId, doctorId } = req.body;
      await workflowService.startWorkflow(workflowId, patientId, doctorId);
      console.log("Workflow successfully started");
      res.status(200).json({ message: "Workflow started" });
    } catch (err) {
      console.error("Error starting workflow:", err);
      res.status(500).json({ error: err.message });
    }
  };


}

export default new WorkflowController();
