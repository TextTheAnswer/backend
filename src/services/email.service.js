// This is a placeholder email service
// In a production environment, you would integrate with an actual email service like SendGrid, Mailgun, etc.

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
    
    // In a real implementation, you would send an actual email here
    console.log(`MOCK EMAIL SERVICE: Sending verification email to ${email}`);
    console.log(`Subject: Verify your student account for Text the Answer`);
    console.log(`To: ${name} <${email}>`);
    console.log(`Body: Please verify your student account by clicking the following link: ${verificationLink}`);
    
    // Store the token in a database or cache for verification (not implemented in this example)
    
    return true;
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
    console.log(`MOCK EMAIL SERVICE: Sending verification success email to ${email}`);
    console.log(`Subject: Your student account has been verified`);
    console.log(`To: ${name} <${email}>`);
    console.log(`Body: Your student account has been successfully verified. You now have access to education tier benefits.`);
    
    return true;
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
    console.log(`MOCK EMAIL SERVICE: Sending password reset OTP to ${email}`);
    console.log(`Subject: Password Reset OTP for Text the Answer`);
    console.log(`Body: Your OTP for password reset is: ${otp}. It is valid for 15 minutes.`);
    console.log(`Note: If you did not request this password reset, please ignore this email or contact support.`);
    
    return true;
  } catch (error) {
    console.error('Error sending password reset OTP:', error);
    return false;
  }
}; 