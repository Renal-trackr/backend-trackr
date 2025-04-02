import actionHistoryService from '../services/actionHistory.service.js';
import authService from '../services/auth.service.js';

class ActionHistoryController {
  /**
   * Get all action history (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllActions(req, res) {
    try {
      // Check if user is admin
      const isAdmin = await authService.isAdmin(req.user._id);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can access all action history'
        });
      }
      
      const actions = await actionHistoryService.getAllActions();
      
      return res.status(200).json({
        success: true,
        count: actions.length,
        data: actions
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving action history'
      });
    }
  }
  
  /**
   * Get action history for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserActions(req, res) {
    try {
      const userId = req.params.userId;
      
      // If not admin and not requesting own actions, deny access
      const isAdmin = await authService.isAdmin(req.user._id);
      if (!isAdmin && req.user._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only access your own action history'
        });
      }
      
      const actions = await actionHistoryService.getActionsByUser(userId);
      
      return res.status(200).json({
        success: true,
        count: actions.length,
        data: actions
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving user action history'
      });
    }
  }
}

export default new ActionHistoryController();
