import { Router } from 'express';
import workflowController from '../controllers/workflow.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const WorkflowRouter = Router();

// Create workflow (supports both standard and simplified formats)
WorkflowRouter.post('/', authMiddleware.verifyToken, workflowController.createWorkflow);

// Submit test results for a workflow step
WorkflowRouter.post('/test-results', authMiddleware.verifyToken, workflowController.submitTestResults);

// Get my workflows (for current logged-in user)
WorkflowRouter.get('/', authMiddleware.verifyToken, workflowController.getMyWorkflows);

// Get workflows by doctor ID (specific doctor)
WorkflowRouter.get('/doctor/:doctorId', authMiddleware.verifyToken, workflowController.getWorkflowsByDoctor);

// Get workflows by patient
WorkflowRouter.get('/patient/:patientId', authMiddleware.verifyToken, workflowController.getWorkflowsByPatient);

// Get workflow by ID
WorkflowRouter.get('/:id', authMiddleware.verifyToken, workflowController.getWorkflow);

// Update workflow
WorkflowRouter.put('/:id', authMiddleware.verifyToken, workflowController.updateWorkflow);

// Update workflow status
WorkflowRouter.patch('/:id/status', authMiddleware.verifyToken, workflowController.updateWorkflowStatus);

// Apply template to patients
WorkflowRouter.post('/apply-template', authMiddleware.verifyToken, workflowController.applyWorkflowTemplate);

// Delete workflow
WorkflowRouter.delete('/:id', authMiddleware.verifyToken, workflowController.deleteWorkflow);

export default WorkflowRouter;
