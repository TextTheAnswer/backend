const nodemailer = require('nodemailer');
require('dotenv').config();

// Log email configuration (without sensitive info)
console.log('Email Configuration:');
console.log(`- Host: ${process.env.EMAIL_HOST || 'smtp.gmail.com'}`);
console.log(`- Port: ${process.env.EMAIL_PORT || 587}`);
console.log(`- Secure: ${process.env.EMAIL_SECURE === 'true'}`);
console.log(`- User: ${process.env.EMAIL_USER}`);

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
  debug: process.env.NODE_ENV === 'development', // Enable debugging in development
  logger: process.env.NODE_ENV === 'development', // Enable logging in development
});

// Verify the connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('Email service connection error:', error);
  } else {
    console.log('Email service is ready to send messages');
  }
});

/**
 * Sends an email using Nodemailer
 * @param {Object} mailOptions - Email options
 * @returns {Promise<boolean>} - Success status
 */
const sendEmail = async (mailOptions) => {
  try {
    // Set default from address if not provided
    if (!mailOptions.from) {
      mailOptions.from = `Text the Answer <${process.env.EMAIL_USER}>`;
    }

    console.log(`Sending email to: ${mailOptions.to}`);
    console.log(`Subject: ${mailOptions.subject}`);
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    
    // Only log preview URL when using Ethereal email service
    if (info.messageId && process.env.EMAIL_HOST === 'smtp.ethereal.email') {
      console.log(`Email preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', JSON.stringify(error));
    return false;
  }
};

/**
 * Sends a verification email to a student
 * @param {string} email - Student's email address
 * @param {string} name - Student's name
 * @param {string} userId - User ID for verification token
 * @returns {Promise<boolean>} - Success status
 */
exports.sendStudentVerificationEmail = async (email, name, userId) => {
  try {
    // Generate a verification token (in production, use a secure method with expiration)
    const verificationToken = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Verification link
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/auth/verify-student/${verificationToken}`;
    
    // Email content
    const mailOptions = {
      to: `${name} <${email}>`,
      subject: 'Verify your student account for Text the Answer',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Student Account</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering for the education tier at Text the Answer. To verify your student status, please click the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify My Account</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p><a href="${verificationLink}">${verificationLink}</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
          <p>Best regards,<br>The Text the Answer Team</p>
        </div>
      `,
      text: `Hello ${name},\n\nThank you for registering for the education tier at Text the Answer. To verify your student status, please click the following link: ${verificationLink}\n\nThis link will expire in 24 hours.\n\nIf you didn't request this verification, please ignore this email.\n\nBest regards,\nThe Text the Answer Team`
    };
    
    return await sendEmail(mailOptions);
  } catch (error) {
    console.error('Error sending student verification email:', error);
    return false;
  }
};

/**
 * Sends a confirmation email after successful verification
 * @param {string} email - Student's email address
 * @param {string} name - Student's name
 * @returns {Promise<boolean>} - Success status
 */
exports.sendVerificationSuccessEmail = async (email, name) => {
  try {
    const mailOptions = {
      to: `${name} <${email}>`,
      subject: 'Your student account has been verified',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Account Verification Successful</h2>
          <p>Hello ${name},</p>
          <p>Congratulations! Your student account has been successfully verified. You now have access to all education tier benefits including:</p>
          <ul>
            <li>Advanced study materials</li>
            <li>Enhanced analytics</li>
            <li>Multiplayer game creation</li>
            <li>And more!</li>
          </ul>
          <p>To start enjoying these benefits, <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">log in to your account</a>.</p>
          <p>Best regards,<br>The Text the Answer Team</p>
        </div>
      `,
      text: `Hello ${name},\n\nCongratulations! Your student account has been successfully verified. You now have access to all education tier benefits including:\n\n- Advanced study materials\n- Enhanced analytics\n- Multiplayer game creation\n- And more!\n\nTo start enjoying these benefits, log in to your account at ${process.env.FRONTEND_URL || 'http://localhost:3000'}.\n\nBest regards,\nThe Text the Answer Team`
    };

    return await sendEmail(mailOptions);
  } catch (error) {
    console.error('Error sending verification success email:', error);
    return false;
  }
};

/**
 * Sends a password reset OTP to the user
 * @param {string} email - User's email address
 * @param {string} otp - One-time password for reset
 * @returns {Promise<boolean>} - Success status
 */
exports.sendPasswordResetOTP = async (email, otp) => {
  try {
    const mailOptions = {
      to: email,
      subject: 'Password Reset OTP for Text the Answer',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password for your Text the Answer account.</p>
          <p>Your one-time password (OTP) for password reset is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f0f0f0; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 4px;">${otp}</div>
          </div>
          <p>This OTP is valid for 15 minutes. If you did not request this password reset, please ignore this email or contact our support team.</p>
          <p>Best regards,<br>The Text the Answer Team</p>
        </div>
      `,
      text: `We received a request to reset your password for your Text the Answer account.\n\nYour one-time password (OTP) for password reset is: ${otp}\n\nThis OTP is valid for 15 minutes. If you did not request this password reset, please ignore this email or contact our support team.\n\nBest regards,\nThe Text the Answer Team`
    };

    return await sendEmail(mailOptions);
  } catch (error) {
    console.error('Error sending password reset OTP:', error);
    return false;
  }
}; 