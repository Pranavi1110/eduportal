# Professional Email Service Setup Guide

This guide covers setting up professional email services for `support@hubinity.in` with better deliverability and features.

## 🚀 Option A: SendGrid (Recommended for Beginners)

### Step 1: Create SendGrid Account
1. Go to [SendGrid.com](https://sendgrid.com)
2. Sign up for a free account (100 emails/day free)
3. Verify your email address

### Step 2: Create API Key
1. Go to Settings → API Keys
2. Click "Create API Key"
3. Choose "Restricted Access"
4. Give it a name like "Hubinity App"
5. Grant permissions for "Mail Send"
6. Copy the generated API key (starts with `SG.`)

### Step 3: Verify Sender Identity
1. Go to Settings → Sender Authentication
2. Choose "Single Sender Verification"
3. Add `support@hubinity.in` as a verified sender
4. Check your email and click the verification link

### Step 4: Configure .env
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key-here
```

---

## 📧 Option B: Mailgun (Great for Developers)

### Step 1: Create Mailgun Account
1. Go to [Mailgun.com](https://mailgun.com)
2. Sign up for a free account (5,000 emails/month free)
3. Verify your email address

### Step 2: Add Domain
1. Go to Domains in your dashboard
2. Click "Add New Domain"
3. Enter `hubinity.in` (or use sandbox domain for testing)
4. Follow DNS setup instructions

### Step 3: Get SMTP Credentials
1. Go to Domains → Your Domain → SMTP
2. Copy the SMTP credentials

### Step 4: Configure .env
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@mg.hubinity.in
SMTP_PASS=your-mailgun-smtp-password
```

---

## ☁️ Option C: AWS SES (Most Scalable)

### Step 1: Create AWS Account
1. Go to [AWS Console](https://console.aws.amazon.com)
2. Sign up for AWS account
3. Navigate to Amazon SES service

### Step 2: Verify Email Address
1. In SES console, go to "Verified identities"
2. Click "Create identity"
3. Choose "Email address"
4. Enter `support@hubinity.in`
5. Check email and click verification link

### Step 3: Create SMTP Credentials
1. Go to "SMTP settings"
2. Click "Create SMTP credentials"
3. Enter IAM user name: `hubinity-smtp-user`
4. Download credentials or copy them

### Step 4: Configure .env
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

---

## 🔧 Advanced Configuration

### Custom Domain Setup (All Services)
For better deliverability, set up your custom domain:

1. **SPF Record**: Add to your DNS
   ```
   v=spf1 include:_spf.sendgrid.net ~all
   ```

2. **DKIM Record**: Add the provided DKIM record to your DNS

3. **DMARC Record**: Add for email authentication
   ```
   v=DMARC1; p=quarantine; rua=mailto:dmarc@hubinity.in
   ```

### Rate Limiting & Monitoring
All services provide:
- Email delivery statistics
- Bounce and complaint tracking
- Rate limiting controls
- Webhook notifications

---

## 💰 Pricing Comparison

| Service | Free Tier | Paid Plans |
|---------|-----------|------------|
| SendGrid | 100 emails/day | $19.95/month for 50K emails |
| Mailgun | 5,000 emails/month | $35/month for 50K emails |
| AWS SES | 200 emails/day | $0.10 per 1,000 emails |

---

## 🧪 Testing Your Setup

Use the provided `test-email.js` script to verify your configuration:

```bash
cd server
node test-email.js
```

Expected output:
```
✅ SMTP connection verified successfully!
✅ Test email sent successfully!
```

---

## 🚨 Production Considerations

1. **Warm-up Process**: Start with low volume and gradually increase
2. **Bounce Handling**: Implement bounce and complaint handling
3. **Monitoring**: Set up alerts for delivery issues
4. **Compliance**: Ensure GDPR/email compliance
5. **Backup**: Consider having a backup email service
