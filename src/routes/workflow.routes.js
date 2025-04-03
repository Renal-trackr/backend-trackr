import { Router } from 'express';
import workflowController from '../controllers/workflow.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const WorkflowRouter = Router();


WorkflowRouter.post('/', authMiddleware.verifyToken, workflowController.createWorkflow);


WorkflowRouter.post('/test-results', authMiddleware.verifyToken, workflowController.submitTestResults);


WorkflowRouter.get('/', authMiddleware.verifyToken, workflowController.getMyWorkflows);


WorkflowRouter.get('/doctor/:doctorId', authMiddleware.verifyToken, workflowController.getWorkflowsByDoctor);


WorkflowRouter.get('/patient/:patientId', authMiddleware.verifyToken, workflowController.getWorkflowsByPatient);


WorkflowRouter.get('/:id', authMiddleware.verifyToken, workflowController.getWorkflow);


WorkflowRouter.put('/:id', authMiddleware.verifyToken, workflowController.updateWorkflow);


WorkflowRouter.patch('/:id/status', authMiddleware.verifyToken, workflowController.updateWorkflowStatus);

WorkflowRouter.post('/apply-template', authMiddleware.verifyToken, workflowController.applyWorkflowTemplate);

WorkflowRouter.delete('/:id', authMiddleware.verifyToken, workflowController.deleteWorkflow);

export default WorkflowRouter;
