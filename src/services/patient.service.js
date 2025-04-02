import Patient from '../models/patients.model.js';
import mongoose from 'mongoose';
import actionHistoryService from './actionHistory.service.js';

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

  /**
   * Update a patient's information
   * @param {String} id - The patient ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} The updated patient
   */
  async updatePatient(id, updateData) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid patient ID');
    }
    
    // Check if the patient exists
    const patient = await Patient.findById(id);
    if (!patient) {
      throw new Error('Patient not found');
    }
    
    // Prevent updating certain fields directly
    const safeUpdateData = { ...updateData };
    delete safeUpdateData._id;
    delete safeUpdateData.created_at;
    delete safeUpdateData.updated_at;
    
    // Update the patient
    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      { $set: safeUpdateData },
      { new: true, runValidators: true }
    );
    
    return updatedPatient;
  }

  /**
   * Add a treatment to a patient
   * @param {String} id - The patient ID
   * @param {String} treatment - The treatment to add
   * @returns {Promise<Object>} The updated patient
   */
  async addTreatment(id, treatment) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid patient ID');
    }
    
    if (!treatment || treatment.trim() === '') {
      throw new Error('Treatment cannot be empty');
    }
    
    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      { $push: { current_treatments: treatment } },
      { new: true, runValidators: true }
    );
    
    if (!updatedPatient) {
      throw new Error('Patient not found');
    }
    
    return updatedPatient;
  }

  /**
   * Add medical history entry to a patient
   * @param {String} id - The patient ID
   * @param {Object} historyEntry - The medical history entry
   * @returns {Promise<Object>} The updated patient
   */
  async addMedicalHistory(id, historyEntry) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid patient ID');
    }
    
    if (!historyEntry || typeof historyEntry !== 'object') {
      throw new Error('Invalid medical history entry');
    }
    
    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      { $push: { medical_history: historyEntry } },
      { new: true, runValidators: true }
    );
    
    if (!updatedPatient) {
      throw new Error('Patient not found');
    }
    
    return updatedPatient;
  }

  /**
   * Add antecedent to a patient
   * @param {String} id - The patient ID
   * @param {Object} antecedent - The antecedent to add
   * @returns {Promise<Object>} The updated patient
   */
  async addAntecedent(id, antecedent) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid patient ID');
    }
    
    if (!antecedent || typeof antecedent !== 'object') {
      throw new Error('Invalid antecedent');
    }
    
    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      { $push: { antecedents: antecedent } },
      { new: true, runValidators: true }
    );
    
    if (!updatedPatient) {
      throw new Error('Patient not found');
    }
    
    return updatedPatient;
  }
}

export default new PatientService();
