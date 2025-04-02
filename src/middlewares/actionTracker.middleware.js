import actionHistoryService from '../services/actionHistory.service.js';

/**
 * Map routes to action types automatically
 */
const ROUTE_ACTION_MAP = {
  'POST:/api/patients': { type: 'CREATE_PATIENT', description: 'Created a new patient' },
  'PUT:/api/patients/:id': { type: 'UPDATE_PATIENT', description: 'Updated patient information' },
  'POST:/api/patients/:id/treatments': { type: 'ADD_TREATMENT', description: 'Added new treatment for patient' },
  'POST:/api/patients/:id/medical-history': { type: 'ADD_MEDICAL_HISTORY', description: 'Added medical history for patient' },
  'POST:/api/patients/:id/antecedents': { type: 'ADD_ANTECEDENT', description: 'Added antecedent for patient' },
  'POST:/api/doctors': { type: 'CREATE_DOCTOR', description: 'Created a new doctor account' },
  // Add more mappings as needed
};

/**
 * Middleware to track actions automatically based on route patterns
 */
export const trackAction = (req, res, next) => {
  // Store the original end function
  const originalEnd = res.end;
  
  // Override the end function
  res.end = function(...args) {
    // Call the original end function first so response isn't delayed
    originalEnd.apply(res, args);
    
    try {
      // Only track successful requests (status 2xx)
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const route = `${req.method}:${req.baseUrl}${req.route?.path || ''}`;
        
        // Check if this route should be tracked
        const actionInfo = ROUTE_ACTION_MAP[route];
        if (actionInfo) {
          // Extract resource ID from parameters if present
          let resourceId = '';
          if (req.params.id) {
            resourceId = ` ID: ${req.params.id}`;
          } else if (req.params.doctorId) {
            resourceId = ` Doctor ID: ${req.params.doctorId}`;
          }
          
          // Record the action
          actionHistoryService.recordAction({
            user_id: req.user._id,
            action_type: actionInfo.type,
            description: `${actionInfo.description}${resourceId}`
          });
        }
      }
    } catch (error) {
      // Just log - never interfere with the response
      console.error('Error in action tracking middleware:', error);
    }
  };
  
  next();
};

export default { trackAction };
