import { Router } from 'express';
import patientController from '../controllers/patient.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const PatientRouter = Router();

// Register a new patient - requires authentication
PatientRouter.post('/', authMiddleware.verifyToken, patientController.registerPatient);

// Get patient by ID
PatientRouter.get('/:id', authMiddleware.verifyToken, patientController.getPatient);

// Get all patients
PatientRouter.get('/', authMiddleware.verifyToken, patientController.getAllPatients);

// Get patients by doctor
PatientRouter.get('/doctor/:doctorId', authMiddleware.verifyToken, patientController.getPatientsByDoctor);

export default PatientRouter;
