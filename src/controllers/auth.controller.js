import authService from '../services/auth.service.js';

class AuthController {
  /**
   * Login user with session creation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }
      

      const metadata = {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      };
      
  
      const loginData = await authService.login({ email, password }, metadata);
      
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: loginData
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Invalid credentials'
      });
    }
  }
  
  /**
   * Login doctor with session creation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async doctorLogin(req, res) {
    try {
      const { email, password } = req.body;
      

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }
      

      const metadata = {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      };
      
 
      const loginData = await authService.doctorLogin({ email, password }, metadata);
      
      return res.status(200).json({
        success: true,
        message: 'Doctor login successful',
        data: loginData
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Invalid credentials'
      });
    }
  }
  
  /**
   * Logout user by invalidating session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async logout(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'No token provided'
        });
      }
      
      const success = await authService.logout(token);
      
      return res.status(200).json({
        success: true,
        message: success ? 'Logout successful' : 'Session not found'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Logout failed'
      });
    }
  }
  
  /**
   * Refresh session token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async refreshToken(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'No token provided'
        });
      }
      
      const refreshedSession = await authService.refreshSession(token);
      
      return res.status(200).json({
        success: true,
        message: 'Token refreshed',
        data: refreshedSession
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Failed to refresh token'
      });
    }
  }
}

export default new AuthController();
