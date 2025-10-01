// Email Testing Script
// Run this with: node test-email.js

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('Testing email configuration...');
  console.log('SMTP Host:', process.env.SMTP_HOST);
  console.log('SMTP User:', process.env.SMTP_USER);
  console.log('SMTP Port:', process.env.SMTP_PORT);
  
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ Missing SMTP configuration in .env file');
    console.log('Please check your .env file and ensure all SMTP variables are set');
    return;
  }

  // Create transporter
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    // Verify connection
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');

    // Send test email
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: `"Hubinity Support" <support@hubinity.in>`,
      to: process.env.SMTP_USER, // Send to yourself for testing
      subject: 'Hubinity Email Test',
      text: 'This is a test email from Hubinity. If you receive this, your email configuration is working correctly!',
      html: `
        <h2>Hubinity Email Test</h2>
        <p>This is a test email from Hubinity.</p>
        <p>If you receive this, your email configuration is working correctly!</p>
        <hr>
        <p><small>Sent from Hubinity Application</small></p>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Check your inbox for the test email.');

  } catch (error) {
    console.error('❌ Email test failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('1. Your SMTP_USER and SMTP_PASS are correct');
      console.log('2. If using Gmail, make sure you\'re using an App Password');
      console.log('3. 2-Factor Authentication is enabled on your Gmail account');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection failed. Please check:');
      console.log('1. Your SMTP_HOST and SMTP_PORT are correct');
      console.log('2. Your internet connection');
      console.log('3. Firewall settings');
    }
  }
}

// Run the test
testEmail().catch(console.error);
