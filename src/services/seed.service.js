import User from '../models/user.model.js';
import Role from '../models/role.model.js';
import bcrypt from 'bcryptjs';

class SeedService {
  /**
   * Initialize admin user from environment variables
   * @returns {Promise<void>}
   */
  async initializeAdmin() {
    try {
      // Check if admin role exists
      let adminRole = await Role.findOne({ name: 'ADMIN' });
      
      // Create admin role if it doesn't exist
      if (!adminRole) {
        adminRole = new Role({
          name: 'ADMIN'
        });
        await adminRole.save();
        console.log('Admin role created successfully');
      }
      
      // Check if an admin user already exists
      const adminExists = await User.findOne({ role_id: adminRole._id });
      
      if (!adminExists) {
        // Get admin credentials from environment variables
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        
        if (!adminEmail || !adminPassword) {
          console.error('Admin credentials not found in environment variables');
          return;
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        // Create the admin user
        const adminUser = new User({
          firstname: 'Admin',
          lastName: 'User',
          email: adminEmail,
          password: hashedPassword,
          role_id: adminRole._id
        });
        
        await adminUser.save();
        console.log('Admin user initialized successfully');
      } else {
        console.log('Admin user already exists');
      }
    } catch (error) {
      console.error('Error initializing admin user:', error);
    }
  }
  
  /**
   * Initialize doctor role if it doesn't exist
   * @returns {Promise<void>}
   */
  async initializeRoles() {
    try {
      // Check if doctor role exists
      const doctorRoleExists = await Role.findOne({ name: 'MEDECIN' });
      
      // Create doctor role if it doesn't exist
      if (!doctorRoleExists) {
        const doctorRole = new Role({
          name: 'MEDECIN'
        });
        await doctorRole.save();
        console.log('Doctor role created successfully');
      }
    } catch (error) {
      console.error('Error initializing roles:', error);
    }
  }
  
  /**
   * Run all database initialization tasks
   * @returns {Promise<void>}
   */
  async initialize() {
    await this.initializeRoles();
    await this.initializeAdmin();
    console.log('Database initialization completed');
  }
}

export default new SeedService();
