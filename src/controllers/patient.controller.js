import patientService from '../services/patient.service.js';
import actionHistoryService from '../services/actionHistory.service.js';

class PatientController {
  /**
   * Register a new patient
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async registerPatient(req, res) {
    try {
      // Extract patient data from request body
      const patientData = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        birth_date: req.body.birth_date,
        gender: req.body.gender,
        phoneNumber: req.body.phoneNumber,
        email: req.body.email,
        address: req.body.address,
        blood_group: req.body.blood_group,
        mrc_status: req.body.mrc_status,
        current_treatments: req.body.current_treatments || [],
        medical_history: req.body.medical_history || [],
        antecedents: req.body.antecedents || [],
        doctor_ref: req.body.doctor_ref
      };

      // Validate required fields
      const requiredFields = ['firstname', 'lastname', 'birth_date', 'gender', 
                             'phoneNumber', 'email', 'address', 
                             'blood_group', 'mrc_status', 'doctor_ref'];
      
      for (const field of requiredFields) {
        if (!patientData[field]) {
          return res.status(400).json({ 
            success: false, 
            message: `${field} is required` 
          });
        }
      }

      // Create patient
      const newPatient = await patientService.createPatient(patientData);
      
      // Record action in history
      actionHistoryService.recordAction({
        user_id: req.user._id,
        action_type: 'REGISTER_PATIENT',
        description: `Registered new patient: ${newPatient.firstname} ${newPatient.lastname} (ID: ${newPatient._id})`
      });
      
      return res.status(201).json({
        success: true,
        message: 'Patient registered successfully',
        data: newPatient
      });
    } catch (error) {
      console.error('Error registering patient:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to register patient' 
      });
    }
  }

  /**
   * Get a patient by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPatient(req, res) {
    try {
      const patientId = req.params.id;
      const patient = await patientService.getPatientById(patientId);
      
      return res.status(200).json({
        success: true,
        data: patient
      });
    } catch (error) {
      return res.status(404).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  /**
   * Get all patients
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllPatients(req, res) {
    try {
      const patients = await patientService.getAllPatients();
      
      return res.status(200).json({
        success: true,
        count: patients.length,
        data: patients
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error retrieving patients' 
      });
    }
  }

  /**
   * Get patients by doctor
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPatientsByDoctor(req, res) {
    try {
      const doctorId = req.params.doctorId;
      const patients = await patientService.getPatientsByDoctor(doctorId);
      
      return res.status(200).json({
        success: true,
        count: patients.length,
        data: patients
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Error retrieving patients' 
      });
    }
  }

  /**
   * Update a patient
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updatePatient(req, res) {
    try {
      const patientId = req.params.id;
      const updateData = req.body;
      
      const updatedPatient = await patientService.updatePatient(patientId, updateData);
      
      // Record the action with specific details
      actionHistoryService.recordAction({
        user_id: req.user._id,
        action_type: 'UPDATE_PATIENT',
        description: `Updated patient information for ${updatedPatient.firstname} ${updatedPatient.lastname} (ID: ${patientId})`
      });
      
      return res.status(200).json({
        success: true,
        message: 'Patient updated successfully',
        data: updatedPatient
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Add treatment to a patient
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async addTreatment(req, res) {
    try {
      const patientId = req.params.id;
      const { treatment } = req.body;
      
      if (!treatment) {
        return res.status(400).json({
          success: false,
          message: 'Treatment is required'
        });
      }
      
      const updatedPatient = await patientService.addTreatment(patientId, treatment);
      
      // Record action with specific treatment details
      actionHistoryService.recordAction({
        user_id: req.user._id,
        action_type: 'ADD_TREATMENT',
        description: `Added treatment "${treatment}" for patient ${updatedPatient.firstname} ${updatedPatient.lastname} (ID: ${patientId})`
      });
      
      return res.status(200).json({
        success: true,
        message: 'Treatment added successfully',
        data: updatedPatient
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Add medical history to a patient
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async addMedicalHistory(req, res) {
    try {
      const patientId = req.params.id;
      const historyEntry = req.body;
      
      const updatedPatient = await patientService.addMedicalHistory(patientId, historyEntry);
      
      // Record the action asynchronously
      actionHistoryService.recordAction({
        user_id: req.user._id,
        action_type: 'ADD_MEDICAL_HISTORY',
        description: `Added medical history entry for patient ID: ${patientId}`
      });
      
      return res.status(200).json({
        success: true,
        message: 'Medical history added successfully',
        data: updatedPatient
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Add antecedent to a patient
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async addAntecedent(req, res) {
    try {
      const patientId = req.params.id;
      const antecedent = req.body;
      
      const updatedPatient = await patientService.addAntecedent(patientId, antecedent);
      
      // Record the action asynchronously
      actionHistoryService.recordAction({
        user_id: req.user._id,
        action_type: 'ADD_ANTECEDENT',
        description: `Added antecedent for patient ID: ${patientId}`
      });
      
      return res.status(200).json({
        success: true,
        message: 'Antecedent added successfully',
        data: updatedPatient
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new PatientController();
