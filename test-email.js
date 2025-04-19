require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Email Test Script');
console.log('-----------------');
console.log('Testing email functionality with the following configuration:');
console.log(`- Email: ${process.env.EMAIL_USER}`);
console.log(`- Using Gmail service`);

async function testEmail() {
  try {
    // Create a transporter using Gmail service
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
      debug: true,
      logger: true
    });

    console.log('Attempting to connect to email service...');
    
    // Verify connection
    const connectionResult = await transporter.verify();
    console.log('Connection verified successfully:', connectionResult);

    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `Text the Answer <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'Test Email from Text the Answer',
      text: 'This is a test email from the Text the Answer application.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4CAF50;">Test Email</h2>
          <p>This is a test email from the Text the Answer application.</p>
          <p>If you're seeing this, email functionality is working correctly!</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `
    });

    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    
    return true;
  } catch (error) {
    console.error('Error in email test:', error);
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Please check your email credentials in .env file.');
    }
    return false;
  }
}

// Run the test
testEmail()
  .then(result => {
    console.log(result ? 'Email test completed successfully!' : 'Email test failed.');
    process.exit(result ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error in test:', err);
    process.exit(1);
  }); 