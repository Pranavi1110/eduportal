// SendGrid Setup Helper Script
// This script helps you test SendGrid configuration

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSendGrid() {
  console.log('🔧 Testing SendGrid Configuration...\n');
  
  // Check environment variables
  const requiredVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    console.log('\n📝 Please add these to your .env file:');
    console.log('SMTP_HOST=smtp.sendgrid.net');
    console.log('SMTP_PORT=587');
    console.log('SMTP_SECURE=false');
    console.log('SMTP_USER=apikey');
    console.log('SMTP_PASS=your-sendgrid-api-key');
    return;
  }

  // Validate SendGrid-specific settings
  if (process.env.SMTP_HOST !== 'smtp.sendgrid.net') {
    console.warn('⚠️  SMTP_HOST should be "smtp.sendgrid.net" for SendGrid');
  }
  
  if (process.env.SMTP_USER !== 'apikey') {
    console.warn('⚠️  SMTP_USER should be "apikey" for SendGrid');
  }
  
  if (!process.env.SMTP_PASS.startsWith('SG.')) {
    console.warn('⚠️  SMTP_PASS should start with "SG." for SendGrid API key');
  }

  console.log('✅ Environment variables configured');
  console.log('📧 SMTP Host:', process.env.SMTP_HOST);
  console.log('👤 SMTP User:', process.env.SMTP_USER);
  console.log('🔑 API Key:', process.env.SMTP_PASS.substring(0, 10) + '...');

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
    console.log('\n🔍 Verifying SendGrid connection...');
    await transporter.verify();
    console.log('✅ SendGrid connection verified successfully!');

    console.log('\n📧 Sending test email...');
    const info = await transporter.sendMail({
      from: `"Hubinity Support" <support@hubinity.in>`,
      to: process.env.TEST_EMAIL || 'your-email@example.com', // Change this to your email
      subject: 'Hubinity SendGrid Test Email',
      text: 'This is a test email from Hubinity using SendGrid. Your email configuration is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🚀 Hubinity SendGrid Test</h2>
          <p>This is a test email from Hubinity using SendGrid.</p>
          <p>If you receive this, your email configuration is working correctly!</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            <strong>Service:</strong> SendGrid<br>
            <strong>From:</strong> support@hubinity.in<br>
            <strong>Sent:</strong> ${new Date().toLocaleString()}
          </p>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('📨 Message ID:', info.messageId);
    console.log('📬 Check your inbox for the test email.');
    
    console.log('\n🎉 SendGrid setup is complete!');
    console.log('💡 Next steps:');
    console.log('   1. Verify support@hubinity.in in SendGrid dashboard');
    console.log('   2. Set up domain authentication for better deliverability');
    console.log('   3. Monitor your email statistics in SendGrid dashboard');

  } catch (error) {
    console.error('\n❌ SendGrid test failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('   1. Your SendGrid API key is correct');
      console.log('   2. API key has "Mail Send" permissions');
      console.log('   3. You\'ve verified support@hubinity.in in SendGrid');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection failed. Please check:');
      console.log('   1. Your internet connection');
      console.log('   2. Firewall settings');
      console.log('   3. SMTP_HOST is set to "smtp.sendgrid.net"');
    }
    
    console.log('\n📚 Need help? Check the SendGrid documentation:');
    console.log('   https://docs.sendgrid.com/for-developers/sending-email/getting-started-smtp');
  }
}

// Run the test
testSendGrid().catch(console.error);
