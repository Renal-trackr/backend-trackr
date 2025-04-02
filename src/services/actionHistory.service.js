import ActionHistory from '../models/actionHistory.model.js';
import User from '../models/user.model.js';
import Doctor from '../models/doctor.model.js';
import Role from '../models/role.model.js';

class ActionHistoryService {
  /**
   * Create action history entry in a completely non-blocking way
   * @param {Object} actionData - Action data
   */
  recordAction(actionData) {
    // Create action history without async/await to avoid any blocking
    setImmediate(() => {
      try {
        const actionHistory = new ActionHistory({
          user_id: actionData.user_id,
          action_type: actionData.action_type,
          description: actionData.description,
          timestamp: new Date()
        });
        
        // Fire and forget - no await
        actionHistory.save()
          .catch(error => {
            console.error('Error recording action history:', error);
          });
      } catch (error) {
        console.error('Error preparing action history:', error);
      }
    });
    
    // Return immediately - true non-blocking
    return true;
  }
  
  /**
   * Get action history by user with user details
   * @param {String} userId - User ID
   * @returns {Promise<Array>} Action history entries with user details
   */
  async getActionsByUser(userId) {
    const actions = await ActionHistory.find({ user_id: userId }).sort({ timestamp: -1 });
    return this.enrichActionsWithUserInfo(actions);
  }
  
  /**
   * Get all action history with user details
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Array>} Action history entries with user details
   */
  async getAllActions(filter = {}) {
    const actions = await ActionHistory.find(filter).sort({ timestamp: -1 });
    return this.enrichActionsWithUserInfo(actions);
  }
  
  /**
   * Enrich action history with user information
   * @param {Array} actions - Action history entries
   * @returns {Promise<Array>} Enriched action history
   */
  async enrichActionsWithUserInfo(actions) {
    // Get unique user IDs from actions
    const userIds = [...new Set(actions.map(action => action.user_id))];
    
    // Fetch all users at once
    const users = await User.find({ _id: { $in: userIds } });
    
    // Find the doctor role
    const doctorRole = await Role.findOne({ name: 'MEDECIN' });
    
    // Get all doctor users
    const doctorUserIds = users
      .filter(user => user.role_id === doctorRole?._id)
      .map(user => user._id);
    
    // Fetch doctor profiles
    const doctors = await Doctor.find({ user_id: { $in: doctorUserIds } });
    
    // Create maps for faster lookups
    const userMap = new Map(users.map(user => [user._id.toString(), user]));
    const doctorMap = new Map(doctors.map(doctor => [doctor.user_id.toString(), doctor]));
    
    // Enrich actions with user info
    return actions.map(action => {
      const actionObj = action.toObject();
      const userId = action.user_id.toString();
      const user = userMap.get(userId);
      
      if (user) {
        actionObj.user = {
          id: user._id,
          firstname: user.firstname,
          lastName: user.lastName,
          email: user.email,
          role_id: user.role_id
        };
        
        // If user is a doctor, add doctor info
        if (user.role_id === doctorRole?._id) {
          const doctor = doctorMap.get(userId);
          if (doctor) {
            actionObj.doctor = {
              id: doctor._id,
              firstname: doctor.firstname,
              lastname: doctor.lastname,
              speciality: doctor.speciality
            };
          }
        }
      }
      
      return actionObj;
    });
  }
}

export default new ActionHistoryService();
