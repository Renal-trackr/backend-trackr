import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const AuthRouter = Router();

// Login route
AuthRouter.post('/login', authController.login);

// Logout route - requires authentication
AuthRouter.post('/logout', authMiddleware.verifyToken, authController.logout);

// Refresh token route
AuthRouter.post('/refresh', authController.refreshToken);

export default AuthRouter;
