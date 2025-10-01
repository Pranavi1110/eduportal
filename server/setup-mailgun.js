// Mailgun Setup Helper Script
// This script helps you test Mailgun configuration

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testMailgun() {
  console.log('🔧 Testing Mailgun Configuration...\n');
  
  // Check environment variables
  const requiredVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    console.log('\n📝 Please add these to your .env file:');
    console.log('SMTP_HOST=smtp.mailgun.org');
    console.log('SMTP_PORT=587');
    console.log('SMTP_SECURE=false');
    console.log('SMTP_USER=postmaster@mg.hubinity.in');
    console.log('SMTP_PASS=your-mailgun-smtp-password');
    return;
  }

  // Validate Mailgun-specific settings
  if (process.env.SMTP_HOST !== 'smtp.mailgun.org') {
    console.warn('⚠️  SMTP_HOST should be "smtp.mailgun.org" for Mailgun');
  }
  
  if (!process.env.SMTP_USER.includes('@mg.')) {
    console.warn('⚠️  SMTP_USER should be in format "postmaster@mg.yourdomain.com" for Mailgun');
  }

  console.log('✅ Environment variables configured');
  console.log('📧 SMTP Host:', process.env.SMTP_HOST);
  console.log('👤 SMTP User:', process.env.SMTP_USER);
  console.log('🔑 Password:', process.env.SMTP_PASS.substring(0, 8) + '...');

  // Create transporter
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    console.log('\n🔍 Verifying Mailgun connection...');
    await transporter.verify();
    console.log('✅ Mailgun connection verified successfully!');

    console.log('\n📧 Sending test email...');
    const info = await transporter.sendMail({
      from: `"Hubinity Support" <support@hubinity.in>`,
      to: process.env.TEST_EMAIL || 'your-email@example.com', // Change this to your email
      subject: 'Hubinity Mailgun Test Email',
      text: 'This is a test email from Hubinity using Mailgun. Your email configuration is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">📧 Hubinity Mailgun Test</h2>
          <p>This is a test email from Hubinity using Mailgun.</p>
          <p>If you receive this, your email configuration is working correctly!</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            <strong>Service:</strong> Mailgun<br>
            <strong>From:</strong> support@hubinity.in<br>
            <strong>Sent:</strong> ${new Date().toLocaleString()}
          </p>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('📨 Message ID:', info.messageId);
    console.log('📬 Check your inbox for the test email.');
    
    console.log('\n🎉 Mailgun setup is complete!');
    console.log('💡 Next steps:');
    console.log('   1. Verify your domain in Mailgun dashboard');
    console.log('   2. Set up DNS records (SPF, DKIM, DMARC)');
    console.log('   3. Monitor your email statistics in Mailgun dashboard');

  } catch (error) {
    console.error('\n❌ Mailgun test failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('   1. Your Mailgun SMTP credentials are correct');
      console.log('   2. Your domain is properly configured in Mailgun');
      console.log('   3. You\'re using the correct SMTP username format');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection failed. Please check:');
      console.log('   1. Your internet connection');
      console.log('   2. Firewall settings');
      console.log('   3. SMTP_HOST is set to "smtp.mailgun.org"');
    }
    
    console.log('\n📚 Need help? Check the Mailgun documentation:');
    console.log('   https://documentation.mailgun.com/en/latest/quickstart-sending.html');
  }
}

// Run the test
testMailgun().catch(console.error);
