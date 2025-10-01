// AWS SES Setup Helper Script
// This script helps you test AWS SES configuration

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testAWSSES() {
  console.log('🔧 Testing AWS SES Configuration...\n');
  
  // Check environment variables
  const requiredVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    console.log('\n📝 Please add these to your .env file:');
    console.log('SMTP_HOST=email-smtp.us-east-1.amazonaws.com');
    console.log('SMTP_PORT=587');
    console.log('SMTP_SECURE=false');
    console.log('SMTP_USER=your-ses-smtp-username');
    console.log('SMTP_PASS=your-ses-smtp-password');
    return;
  }

  // Validate AWS SES-specific settings
  if (!process.env.SMTP_HOST.includes('amazonaws.com')) {
    console.warn('⚠️  SMTP_HOST should be an AWS SES endpoint (e.g., email-smtp.us-east-1.amazonaws.com)');
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
    console.log('\n🔍 Verifying AWS SES connection...');
    await transporter.verify();
    console.log('✅ AWS SES connection verified successfully!');

    console.log('\n📧 Sending test email...');
    const info = await transporter.sendMail({
      from: `"Hubinity Support" <support@hubinity.in>`,
      to: process.env.TEST_EMAIL || 'your-email@example.com', // Change this to your email
      subject: 'Hubinity AWS SES Test Email',
      text: 'This is a test email from Hubinity using AWS SES. Your email configuration is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff9900;">☁️ Hubinity AWS SES Test</h2>
          <p>This is a test email from Hubinity using AWS SES.</p>
          <p>If you receive this, your email configuration is working correctly!</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            <strong>Service:</strong> AWS SES<br>
            <strong>From:</strong> support@hubinity.in<br>
            <strong>Sent:</strong> ${new Date().toLocaleString()}
          </p>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('📨 Message ID:', info.messageId);
    console.log('📬 Check your inbox for the test email.');
    
    console.log('\n🎉 AWS SES setup is complete!');
    console.log('💡 Next steps:');
    console.log('   1. Verify support@hubinity.in in AWS SES console');
    console.log('   2. Request production access to remove sandbox mode');
    console.log('   3. Set up domain authentication (SPF, DKIM, DMARC)');
    console.log('   4. Monitor your sending statistics in CloudWatch');

  } catch (error) {
    console.error('\n❌ AWS SES test failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('   1. Your AWS SES SMTP credentials are correct');
      console.log('   2. You\'ve verified support@hubinity.in in AWS SES');
      console.log('   3. Your AWS region is correct in the SMTP_HOST');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection failed. Please check:');
      console.log('   1. Your internet connection');
      console.log('   2. Firewall settings');
      console.log('   3. SMTP_HOST is set to correct AWS SES endpoint');
    } else if (error.message.includes('MessageRejected')) {
      console.log('\n💡 Message rejected. Please check:');
      console.log('   1. You\'re in sandbox mode - verify recipient email addresses');
      console.log('   2. Request production access in AWS SES console');
      console.log('   3. Check your sending limits and quotas');
    }
    
    console.log('\n📚 Need help? Check the AWS SES documentation:');
    console.log('   https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html');
  }
}

// Run the test
testAWSSES().catch(console.error);
