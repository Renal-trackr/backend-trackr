import User from '../models/user.model.js';
import authService from '../services/auth.service.js';

class AuthMiddleware {
  /**
   * Verify JWT token and session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async verifyToken(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: 'No token provided' 
        });
      }
      
      // Verify token and session
      const { session, decoded } = await authService.verifySession(token);
      
      // Find user by id
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token - user not found' 
        });
      }
      
      // Add user and session to request object
      req.user = user;
      req.session = session;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired',
          expired: true
        });
      }
      
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid session' 
      });
    }
  }

  /**
   * Check if user has specific role
   * @param {Array} roles - Allowed roles
   * @returns {Function} - Middleware function
   */
  hasRole(roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }

      if (!roles.includes(req.user.role_id)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions' 
        });
      }

      next();
    };
  }
}

export default new AuthMiddleware();
