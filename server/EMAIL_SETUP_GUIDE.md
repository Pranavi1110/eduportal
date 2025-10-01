# Email Setup Guide for support@hubinity.in

This guide will help you set up `support@hubinity.in` as the actual sender email for your Hubinity application.

## Option 1: Using Gmail with support@hubinity.in (Recommended)

### Step 1: Set up support@hubinity.in as a Gmail account
1. Create a Gmail account with the email `support@hubinity.in`
2. Enable 2-Factor Authentication on this account
3. Generate an App Password for this account

### Step 2: Configure your .env file
Create or update your `.env` file in the server directory with these settings:

```env
# SMTP Configuration for support@hubinity.in
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=support@hubinity.in
SMTP_PASS=your-app-password-here
```

### Step 3: Generate Gmail App Password
1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification
3. Scroll down to "App passwords"
4. Generate a new app password for "Mail"
5. Use this 16-character password as your `SMTP_PASS`

## Option 2: Using Custom Email Provider

### For providers like SendGrid, Mailgun, or AWS SES:

```env
# Example for SendGrid
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key

# Example for Mailgun
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

## Option 3: Using Domain Email Provider

If you have a custom domain and email hosting:

```env
# Example for cPanel/WHM email
SMTP_HOST=mail.hubinity.in
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=support@hubinity.in
SMTP_PASS=your-email-password
```

## Testing Your Configuration

1. Start your server
2. Check the console for: "SMTP server is ready to take our messages"
3. Try registering a new user to test the welcome email
4. Check the server logs for any errors

## Troubleshooting

### Common Issues:

1. **Authentication Error**: Make sure your SMTP credentials are correct
2. **Connection Timeout**: Check your firewall and network settings
3. **Gmail "Less Secure Apps"**: Use App Passwords instead of regular passwords
4. **Domain Authentication**: Some providers require domain verification

### Error Messages:
- `535-5.7.8 Username and Password not accepted`: Invalid credentials
- `Connection timeout`: Network/firewall issues
- `550-5.1.1 The email account does not exist`: Invalid sender email

## Security Best Practices

1. Never commit your `.env` file to version control
2. Use App Passwords instead of regular passwords
3. Regularly rotate your email credentials
4. Monitor email sending logs for suspicious activity

## Production Considerations

For production deployment:
1. Use a dedicated email service (SendGrid, Mailgun, AWS SES)
2. Set up proper SPF, DKIM, and DMARC records
3. Monitor email deliverability rates
4. Implement rate limiting for email sending
