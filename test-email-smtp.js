require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Email Test: Starting with', process.env.EMAIL_USER);

async function testEmail() {
  try {
    // Create a transporter using direct SMTP settings
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 465,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
      debug: false,
      logger: false
    });

    console.log('Email Test: Connecting to SMTP server...');
    
    // Verify connection
    const connectionResult = await transporter.verify();
    console.log('Email Test: Connection successful');

    // Send test email
    console.log('Email Test: Sending test message...');
    const info = await transporter.sendMail({
      from: `Text the Answer <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'SMTP Test Email from Text the Answer',
      text: 'This is a test email from the Text the Answer application using direct SMTP settings.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4CAF50;">SMTP Test Email</h2>
          <p>This is a test email from the Text the Answer application using direct SMTP settings.</p>
          <p>If you're seeing this, email functionality is working correctly!</p>
          <p>Configuration used:</p>
          <ul>
            <li>Host: ${process.env.EMAIL_HOST || 'smtp.gmail.com'}</li>
            <li>Port: ${process.env.EMAIL_PORT || 465}</li>
            <li>Secure: ${process.env.EMAIL_SECURE === 'true'}</li>
          </ul>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `
    });

    console.log('Email Test: Message sent successfully');
    
    return true;
  } catch (error) {
    console.error('Email Test: Failed -', error.message);
    return false;
  }
}

// Run the test
testEmail()
  .then(result => {
    console.log(result ? 'Email Test: Completed successfully!' : 'Email Test: Failed');
    process.exit(result ? 0 : 1);
  })
  .catch(err => {
    console.error('Email Test: Unexpected error -', err.message);
    process.exit(1);
  }); 