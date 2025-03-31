import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    // Gmail configuration
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  
  /**
   * Generate random password
   * @returns {String} Generated password
   */
  generatePassword() {
    return crypto.randomBytes(8).toString('hex');
  }
  
  /**
   * Send doctor welcome email with credentials
   * @param {Object} doctor - Doctor data
   * @param {String} password - Generated password
   * @returns {Promise<Object>} Email info
   */
  async sendDoctorWelcomeEmail(doctor, password) {
    const { email, firstname, lastname } = doctor;
    
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Welcome to RenalTrackr - Your Account Details',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to RenalTrackr, Dr. ${firstname} ${lastname}!</h2>
          <p>Your account has been created. Here are your login details:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${password}</p>
          </div>
          <p>For security reasons, please change your password after your first login.</p>
          <p>If you have any questions, please contact the administrator.</p>
          <p>Thank you for joining RenalTrackr!</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px;">IMPORTANT: These credentials are strictly confidential. Do not share them with anyone.</p>
          </div>
        </div>
      `
    };
    
    try {
      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }
}

export default new EmailService();
