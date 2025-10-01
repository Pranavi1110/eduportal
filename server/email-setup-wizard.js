// Email Setup Wizard
// Interactive script to help you choose and configure your email service

const readline = require('readline');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🚀 Hubinity Email Setup Wizard\n');
  console.log('This wizard will help you set up professional email services for support@hubinity.in\n');

  // Choose email service
  console.log('📧 Choose your email service:');
  console.log('1. SendGrid (Recommended for beginners)');
  console.log('2. Mailgun (Great for developers)');
  console.log('3. AWS SES (Most scalable)');
  console.log('4. Gmail (Simple setup)');
  console.log('5. Exit\n');

  const choice = await question('Enter your choice (1-5): ');

  switch (choice) {
    case '1':
      await setupSendGrid();
      break;
    case '2':
      await setupMailgun();
      break;
    case '3':
      await setupAWSSES();
      break;
    case '4':
      await setupGmail();
      break;
    case '5':
      console.log('👋 Goodbye!');
      rl.close();
      return;
    default:
      console.log('❌ Invalid choice. Please run the script again.');
      rl.close();
      return;
  }

  rl.close();
}

async function setupSendGrid() {
  console.log('\n🔧 Setting up SendGrid...\n');
  
  console.log('📋 Prerequisites:');
  console.log('1. Create a SendGrid account at https://sendgrid.com');
  console.log('2. Verify your email address');
  console.log('3. Create an API key with "Mail Send" permissions');
  console.log('4. Verify support@hubinity.in as a sender\n');

  const apiKey = await question('Enter your SendGrid API key (starts with SG.): ');
  
  if (!apiKey.startsWith('SG.')) {
    console.log('❌ Invalid API key format. Please try again.');
    return;
  }

  const testEmail = await question('Enter your test email address: ');

  // Create .env configuration
  const envConfig = `
# SendGrid Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=${apiKey}
TEST_EMAIL=${testEmail}
`;

  await saveEnvConfig(envConfig);
  await runTest('setup-sendgrid.js');
}

async function setupMailgun() {
  console.log('\n🔧 Setting up Mailgun...\n');
  
  console.log('📋 Prerequisites:');
  console.log('1. Create a Mailgun account at https://mailgun.com');
  console.log('2. Add your domain (hubinity.in) or use sandbox domain');
  console.log('3. Get your SMTP credentials from the dashboard\n');

  const smtpUser = await question('Enter your Mailgun SMTP username (e.g., postmaster@mg.hubinity.in): ');
  const smtpPass = await question('Enter your Mailgun SMTP password: ');
  const testEmail = await question('Enter your test email address: ');

  const envConfig = `
# Mailgun Configuration
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=${smtpUser}
SMTP_PASS=${smtpPass}
TEST_EMAIL=${testEmail}
`;

  await saveEnvConfig(envConfig);
  await runTest('setup-mailgun.js');
}

async function setupAWSSES() {
  console.log('\n🔧 Setting up AWS SES...\n');
  
  console.log('📋 Prerequisites:');
  console.log('1. Create an AWS account');
  console.log('2. Navigate to Amazon SES service');
  console.log('3. Verify support@hubinity.in as a sender');
  console.log('4. Create SMTP credentials\n');

  const region = await question('Enter your AWS region (e.g., us-east-1): ');
  const smtpUser = await question('Enter your AWS SES SMTP username: ');
  const smtpPass = await question('Enter your AWS SES SMTP password: ');
  const testEmail = await question('Enter your test email address: ');

  const envConfig = `
# AWS SES Configuration
SMTP_HOST=email-smtp.${region}.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=${smtpUser}
SMTP_PASS=${smtpPass}
TEST_EMAIL=${testEmail}
`;

  await saveEnvConfig(envConfig);
  await runTest('setup-aws-ses.js');
}

async function setupGmail() {
  console.log('\n🔧 Setting up Gmail...\n');
  
  console.log('📋 Prerequisites:');
  console.log('1. Create a Gmail account: support@hubinity.in');
  console.log('2. Enable 2-Factor Authentication');
  console.log('3. Generate an App Password\n');

  const appPassword = await question('Enter your Gmail App Password (16 characters): ');
  const testEmail = await question('Enter your test email address: ');

  const envConfig = `
# Gmail Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=support@hubinity.in
SMTP_PASS=${appPassword}
TEST_EMAIL=${testEmail}
`;

  await saveEnvConfig(envConfig);
  await runTest('test-email.js');
}

async function saveEnvConfig(config) {
  const envPath = path.join(__dirname, '.env');
  
  try {
    // Read existing .env file
    let existingContent = '';
    if (fs.existsSync(envPath)) {
      existingContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Remove existing SMTP configuration
    const lines = existingContent.split('\n');
    const filteredLines = lines.filter(line => 
      !line.startsWith('SMTP_') && 
      !line.startsWith('TEST_EMAIL') &&
      line.trim() !== ''
    );
    
    // Add new configuration
    const newContent = filteredLines.join('\n') + config;
    
    fs.writeFileSync(envPath, newContent);
    console.log('✅ Configuration saved to .env file');
  } catch (error) {
    console.error('❌ Error saving configuration:', error.message);
  }
}

async function runTest(testScript) {
  const runTest = await question('\n🧪 Run email test now? (y/n): ');
  
  if (runTest.toLowerCase() === 'y') {
    try {
      console.log('\n🔄 Running email test...');
      execSync(`node ${testScript}`, { stdio: 'inherit' });
    } catch (error) {
      console.log('\n❌ Test failed. Please check your configuration.');
    }
  }
  
  console.log('\n🎉 Setup complete!');
  console.log('💡 Next steps:');
  console.log('   1. Start your server: npm start');
  console.log('   2. Test user registration to verify welcome emails');
  console.log('   3. Check your email service dashboard for statistics');
}

// Run the wizard
main().catch(console.error);
