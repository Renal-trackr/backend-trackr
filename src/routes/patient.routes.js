import { Router } from 'express';
import patientController from '../controllers/patient.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const PatientRouter = Router();

// Register a new patient
PatientRouter.post('/', authMiddleware.verifyToken, patientController.registerPatient);

// Get patient by ID
PatientRouter.get('/:id', authMiddleware.verifyToken, patientController.getPatient);

// Get all patients
PatientRouter.get('/', authMiddleware.verifyToken, patientController.getAllPatients);

// Get patients by doctor
PatientRouter.get('/doctor/:doctorId', authMiddleware.verifyToken, patientController.getPatientsByDoctor);

// Update patient
PatientRouter.put('/:id', authMiddleware.verifyToken, patientController.updatePatient);

// Add treatment to patient
PatientRouter.post('/:id/treatments', authMiddleware.verifyToken, patientController.addTreatment);

// Add medical history to patient
PatientRouter.post('/:id/medical-history', authMiddleware.verifyToken, patientController.addMedicalHistory);

// Add antecedent to patient
PatientRouter.post('/:id/antecedents', authMiddleware.verifyToken, patientController.addAntecedent);

export default PatientRouter;
