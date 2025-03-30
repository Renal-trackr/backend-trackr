import doctorService from '../services/doctor.service.js';
import authService from '../services/auth.service.js';

class DoctorController {
  /**
   * Create a new doctor
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createDoctor(req, res) {
    try {
      // Check if user is admin
      const isAdmin = await authService.isAdmin(req.user._id);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can create doctors'
        });
      }
      
      // Extract doctor data from request body
      const doctorData = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        speciality: req.body.speciality,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber
      };
      
      // Validate required fields
      const requiredFields = ['firstname', 'lastname', 'speciality', 'email', 'phoneNumber'];
      for (const field of requiredFields) {
        if (!doctorData[field]) {
          return res.status(400).json({
            success: false,
            message: `${field} is required`
          });
        }
      }
      
      // Create doctor
      const newDoctor = await doctorService.createDoctor(doctorData);
      
      return res.status(201).json({
        success: true,
        message: 'Doctor created successfully. Login credentials sent via email.',
        data: {
          id: newDoctor._id,
          firstname: newDoctor.firstname,
          lastname: newDoctor.lastname,
          email: newDoctor.email,
          speciality: newDoctor.speciality
        }
      });
    } catch (error) {
      console.error('Error creating doctor:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create doctor'
      });
    }
  }
  
  /**
   * Get all doctors
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllDoctors(req, res) {
    try {
      const doctors = await doctorService.getAllDoctors();
      
      return res.status(200).json({
        success: true,
        count: doctors.length,
        data: doctors
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving doctors'
      });
    }
  }
  
  /**
   * Get doctor by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getDoctor(req, res) {
    try {
      const doctorId = req.params.id;
      const doctor = await doctorService.getDoctorById(doctorId);
      
      return res.status(200).json({
        success: true,
        data: doctor
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new DoctorController();
