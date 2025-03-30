import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
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
      from: `"RenalTrackr" <${process.env.EMAIL_USER}>`,
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
        </div>
      `
    };
    
    return this.transporter.sendMail(mailOptions);
  }
}

export default new EmailService();
