import User from '../models/user.model.js';
import Role from '../models/role.model.js';
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
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    
    // Generate JWT token with 1-hour expiration
    const token = jwt.sign(
      { userId: user._id, role: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Calculate expiration time (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    // Create session in database
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
   * Verify if a session is valid
   * @param {String} token - JWT token
   * @returns {Promise<Object>} Session data if valid
   */
  async verifySession(token) {
    // First decode the token to make sure it's valid
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if session exists and is active
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
    
    // Find admin role
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
      // Verify the current session
      const { session, decoded } = await this.verifySession(token);
      
      // Generate a new token
      const newToken = jwt.sign(
        { userId: decoded.userId, role: decoded.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      // Calculate new expiration time
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      
      // Deactivate the current session
      await Session.updateOne(
        { _id: session._id },
        { is_active: false }
      );
      
      // Create a new session
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
