import User from '../models/user.model.js';
import Role from '../models/role.model.js';
import Doctor from '../models/doctor.model.js';
import Session from '../models/session.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

class AuthService {
  /**
   * Login user and create session
   * @param {Object} credentials - User credentials
   * @param {Object} metadata - Session metadata (user agent, IP)
   * @returns {Promise<Object>} Login data with token
   */
  async login(credentials, metadata = {}) {
    const { email, password } = credentials;
    

    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    

    const token = jwt.sign(
      { userId: user._id, role: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    

    const session = new Session({
      user_id: user._id,
      token,
      expires_at: expiresAt,
      user_agent: metadata.userAgent,
      ip_address: metadata.ipAddress,
      is_active: true
    });
    
    await session.save();
    
    return {
      userId: user._id,
      role: user.role_id,
      firstname: user.firstname,
      lastName: user.lastName,
      token,
      expiresAt
    };
  }

  /**
   * Doctor login with session creation and doctor profile retrieval
   * @param {Object} credentials - User credentials
   * @param {Object} metadata - Session metadata (user agent, IP)
   * @returns {Promise<Object>} Login data with token and doctor profile
   */
  async doctorLogin(credentials, metadata = {}) {
    const { email, password } = credentials;
    

    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }
    

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    

    const doctorRole = await Role.findOne({ name: 'MEDECIN' });
    if (!doctorRole || user.role_id !== doctorRole._id) {
      throw new Error('Access denied. Not a doctor account.');
    }

    const doctorProfile = await Doctor.findOne({ user_id: user._id });
    if (!doctorProfile) {
      throw new Error('Doctor profile not found');
    }
    

    const token = jwt.sign(
      { userId: user._id, role: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    

    const session = new Session({
      user_id: user._id,
      token,
      expires_at: expiresAt,
      user_agent: metadata.userAgent,
      ip_address: metadata.ipAddress,
      is_active: true
    });
    
    await session.save();
    
    return {
      userId: user._id,
      role: user.role_id,
      token,
      expiresAt,
      doctor: {
        id: doctorProfile._id,
        firstname: doctorProfile.firstname,
        lastname: doctorProfile.lastname,
        speciality: doctorProfile.speciality,
        email: doctorProfile.email,
        phoneNumber: doctorProfile.phoneNumber
      }
    };
  }

  /**
   * Verify if a session is valid
   * @param {String} token - JWT token
   * @returns {Promise<Object>} Session data if valid
   */
  async verifySession(token) {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const session = await Session.findOne({ 
      token, 
      is_active: true,
      expires_at: { $gt: new Date() }
    });
    
    if (!session) {
      throw new Error('Session not found or expired');
    }
    
    return {
      session,
      decoded
    };
  }

  /**
   * Logout user by invalidating session
   * @param {String} token - JWT token
   * @returns {Promise<Boolean>} Success status
   */
  async logout(token) {
    const result = await Session.updateOne(
      { token },
      { is_active: false }
    );
    
    return result.modifiedCount > 0;
  }

  /**
   * Check if user is admin
   * @param {String} userId - User ID
   * @returns {Promise<Boolean>} Is admin
   */
  async isAdmin(userId) {
    const user = await User.findById(userId);
    if (!user) {
      return false;
    }
    

    const adminRole = await Role.findOne({ name: 'ADMIN' });
    if (!adminRole) {
      return false;
    }
    
    return user.role_id === adminRole._id;
  }
  
  /**
   * Refresh session token
   * @param {String} token - Current token
   * @returns {Promise<Object>} New session data
   */
  async refreshSession(token) {
    try {

      const { session, decoded } = await this.verifySession(token);
      

      const newToken = jwt.sign(
        { userId: decoded.userId, role: decoded.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
 
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      

      await Session.updateOne(
        { _id: session._id },
        { is_active: false }
      );
      

      const newSession = new Session({
        user_id: decoded.userId,
        token: newToken,
        expires_at: expiresAt,
        user_agent: session.user_agent,
        ip_address: session.ip_address,
        is_active: true
      });
      
      await newSession.save();
      
      return {
        token: newToken,
        expiresAt
      };
    } catch (error) {
      throw new Error('Unable to refresh session: ' + error.message);
    }
  }
}

export default new AuthService();
