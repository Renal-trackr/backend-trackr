import { Router } from 'express';
import actionHistoryController from '../controllers/actionHistory.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const ActionHistoryRouter = Router();

// Get all actions (admin only)
ActionHistoryRouter.get('/', authMiddleware.verifyToken, actionHistoryController.getAllActions);

// Get actions for a specific user
ActionHistoryRouter.get('/user/:userId', authMiddleware.verifyToken, actionHistoryController.getUserActions);

export default ActionHistoryRouter;
