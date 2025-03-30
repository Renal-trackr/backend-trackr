import { Router } from 'express';
import doctorController from '../controllers/doctor.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const DoctorRouter = Router();

// Create doctor - admin only
DoctorRouter.post('/', authMiddleware.verifyToken, doctorController.createDoctor);

// Get all doctors
DoctorRouter.get('/', authMiddleware.verifyToken, doctorController.getAllDoctors);

// Get doctor by ID
DoctorRouter.get('/:id', authMiddleware.verifyToken, doctorController.getDoctor);

export default DoctorRouter;
