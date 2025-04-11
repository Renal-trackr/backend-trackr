import { Router } from 'express';
import patientController from '../controllers/patient.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const PatientRouter = Router();


PatientRouter.post('/', authMiddleware.verifyToken, patientController.registerPatient);


PatientRouter.get('/:id', authMiddleware.verifyToken, patientController.getPatient);


PatientRouter.get('/', authMiddleware.verifyToken, patientController.getAllPatients);


PatientRouter.get('/doctor/:doctorId', authMiddleware.verifyToken, patientController.getPatientsByDoctor);


PatientRouter.put('/:id', authMiddleware.verifyToken, patientController.updatePatient);


PatientRouter.post('/:id/treatments', authMiddleware.verifyToken, patientController.addTreatment);

PatientRouter.post('/:id/medical-history', authMiddleware.verifyToken, patientController.addMedicalHistory);

PatientRouter.post('/:id/antecedents', authMiddleware.verifyToken, patientController.addAntecedent);

export default PatientRouter;
