import Doctor from '../models/doctor.model.js';
import User from '../models/user.model.js';
import Role from '../models/role.model.js';
import bcrypt from 'bcryptjs';
import emailService from './email.service.js';
import mongoose from 'mongoose';

class DoctorService {
  /**
   * Create doctor and user account
   * @param {Object} doctorData - Doctor data
   * @returns {Promise<Object>} Created doctor
   */
  async createDoctor(doctorData) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Generate password using the email service
      const tempPassword = emailService.generatePassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      // Find doctor role
      const doctorRole = await Role.findOne({ name: 'MEDECIN' });
      if (!doctorRole) {
        throw new Error('Doctor role not found');
      }
      
      // Create user account for doctor
      const user = new User({
        firstname: doctorData.firstname,
        lastName: doctorData.lastname,
        email: doctorData.email,
        password: hashedPassword,
        role_id: doctorRole._id
      });
      
      await user.save({ session });
      
      // Create doctor profile
      const doctor = new Doctor({
        firstname: doctorData.firstname,
        lastname: doctorData.lastname,
        speciality: doctorData.speciality,
        email: doctorData.email,
        phoneNumber: doctorData.phoneNumber,
        user_id: user._id
      });
      
      await doctor.save({ session });
      
      // Send welcome email
      await emailService.sendDoctorWelcomeEmail(doctor, tempPassword);
      
      await session.commitTransaction();
      session.endSession();
      
      return doctor;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      
      if (error.code === 11000) {
        throw new Error('Email already exists');
      }
      
      throw error;
    }
  }
  
  /**
   * Get all doctors
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Array>} List of doctors
   */
  async getAllDoctors(filter = {}) {
    return Doctor.find(filter);
  }
  
  /**
   * Get doctor by ID
   * @param {String} id - Doctor ID
   * @returns {Promise<Object>} Doctor
   */
  async getDoctorById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid doctor ID');
    }
    
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      throw new Error('Doctor not found');
    }
    
    return doctor;
  }
}

export default new DoctorService();
