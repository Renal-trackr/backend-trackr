import Patient from '../models/patients.model.js';
import mongoose from 'mongoose';

class PatientService {
  /**
   * Create a new patient
   * @param {Object} patientData - The patient data
   * @returns {Promise<Object>} The created patient
   */
  async createPatient(patientData) {
    try {
      // Validate doctor reference
      if (!mongoose.Types.ObjectId.isValid(patientData.doctor_ref)) {
        throw new Error('Invalid doctor reference');
      }
      
      // Create and save the new patient
      const newPatient = new Patient(patientData);
      await newPatient.save();
      
      return newPatient;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  /**
   * Get a patient by ID
   * @param {String} id - The patient ID
   * @returns {Promise<Object>} The patient
   */
  async getPatientById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid patient ID');
    }
    
    const patient = await Patient.findById(id);
    if (!patient) {
      throw new Error('Patient not found');
    }
    
    return patient;
  }

  /**
   * Get all patients
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Array>} List of patients
   */
  async getAllPatients(filter = {}) {
    return Patient.find(filter);
  }

  /**
   * Get patients by doctor
   * @param {String} doctorId - The doctor's ID
   * @returns {Promise<Array>} List of patients
   */
  async getPatientsByDoctor(doctorId) {
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw new Error('Invalid doctor ID');
    }
    
    return Patient.find({ doctor_ref: doctorId });
  }
}

export default new PatientService();
