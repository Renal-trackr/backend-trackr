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
      let adminRole = await Role.findOne({ name: 'ADMIN' });

      if (!adminRole) {
        adminRole = new Role({
          name: 'ADMIN'
        });
        await adminRole.save();
        console.log('Admin role created successfully');
      }
      

      const adminExists = await User.findOne({ role_id: adminRole._id });
      
      if (!adminExists) {

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        
        if (!adminEmail || !adminPassword) {
          console.error('Admin credentials not found in environment variables');
          return;
        }
        

        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        

        const adminUser = new User({
          firstname: 'HOUNDJI',
          lastName: 'Ratheil',
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

      const doctorRoleExists = await Role.findOne({ name: 'MEDECIN' });
      

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
