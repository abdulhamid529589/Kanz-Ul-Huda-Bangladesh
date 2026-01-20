# Render OTP 500 Error - Troubleshooting Guide

## Issue

Getting 500 (Internal Server Error) when requesting OTP on Render deployment, but it works locally.

## Most Common Causes

### 1. **Missing or Invalid Email Environment Variables** ⚠️ (MOST LIKELY)

Check your Render environment variables:

- `EMAIL_USER` - Your Gmail/email address
- `EMAIL_PASSWORD` - Your app-specific password (NOT your regular Gmail password)
- `EMAIL_HOST` - Should be `smtp.gmail.com`
- `EMAIL_PORT` - Should be `587`

**To fix:**

1. Go to Render dashboard → Your backend service
2. Click "Environment"
3. Verify all email variables are set correctly
4. For Gmail: Use [App Passwords](https://myaccount.google.com/apppasswords) instead of regular password
5. Redeploy the service

### 2. **MongoDB Connection Issues**

The error might occur during database operations.

**Check:**

- Is `MONGODB_URI` set in Render environment variables?
- Can Render reach your MongoDB cluster?
- Are network access rules allowing Render's IP?

**MongoDB Atlas fix:**

1. Go to MongoDB Atlas dashboard
2. Network Access → IP Whitelist
3. Add Render's IP or use `0.0.0.0/0` (less secure but works)
4. Or add Render IP range dynamically

### 3. **Registration Request Not Found**

The code checks if email has an approved registration request.

**Check:**

- Do you have any registration requests in your database?
- Is the email marked as "approved"?
- Test with an email that has an approved request

## How to Debug on Render

### Option 1: Check Render Logs

1. Go to Render dashboard → Your backend service
2. Click "Logs" tab
3. Look for error messages (now with enhanced logging)
4. Share the detailed error here

### Option 2: Enable Debug Mode

Add this to your backend environment variables on Render:

```
NODE_ENV=development
```

### Option 3: Test with cURL

```bash
curl -X POST https://kanz-ul-huda-bangladesh-backend.onrender.com/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "fullName": "Test User",
    "password": "Password123",
    "registrationCode": "KANZULHUDA2026"
  }'
```

## Recent Improvements Made

I've added enhanced logging to help identify the exact error:

**In `requestOTP` controller:**

- Logs each database operation separately
- Logs email service initialization check
- Logs email sending attempts with detailed error info

**In `sendOTPEmail` function:**

- Checks if email service is initialized
- Uses retry mechanism for email sending
- Logs full error stack trace

## Step-by-Step Fix Instructions

1. **Verify email credentials on Render:**

   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-specific-password (NOT regular password)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   ```

2. **Verify MongoDB connection:**
   - Test that Render can access MongoDB
   - Check IP whitelist in MongoDB Atlas

3. **Verify registration data:**
   - Ensure test email has an approved registration request
   - Check Settings collection has proper values

4. **Redeploy:**
   - Push changes to GitHub
   - Redeploy on Render (automatic or manual)
   - Wait for build to complete

5. **Test:**
   - Try requesting OTP again
   - Check Render logs for detailed error messages

## If Still Not Working

1. Check the Render logs with the new detailed error messages
2. Share the exact error from logs
3. Verify all 4 email environment variables are set
4. Try a different email account (optional)
5. Check MongoDB Atlas IP whitelist

## Email Service Configuration Reference

For Gmail:

- Host: `smtp.gmail.com`
- Port: `587`
- Secure: `false` (port 587 is TLS)
- Password: App-specific password from [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

For Other Providers:

- Ask your email provider for SMTP settings
- Common ports: 25, 465 (SSL), 587 (TLS), 2525

## Testing Email Service Locally

Before deploying, test locally with `.env`:

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

Then test OTP request:

```bash
npm run dev
# In another terminal:
curl -X POST http://localhost:5000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{...}'
```
