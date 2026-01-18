# Forgot Password Feature - Implementation Guide

## Overview

The Forgot Password feature allows users to reset their password if they forget it. It's a secure, email-based password recovery system with token validation and time-based expiration.

## Features

### 1. **Forgot Password Request**

- Users can click "Forgot Password?" link on the login page
- A modal form appears asking for their email address
- An email is sent with a password reset link (valid for 30 minutes)
- Rate limited to prevent abuse (max 3 requests per 15 minutes per email)

### 2. **Password Reset Link**

- Email contains a secure reset link with token and email parameters
- Link directs to: `/reset-password?email=...&token=...`
- Token is cryptographically secure and hashed in the database

### 3. **Token Verification**

- Reset page verifies the token before allowing password change
- Invalid or expired tokens show appropriate error messages
- Tokens expire after 30 minutes

### 4. **Password Reset**

- Users enter and confirm their new password
- Password strength requirements:
  - Minimum 8 characters
  - Must contain uppercase letter
  - Must contain lowercase letter
  - Must contain number
- Real-time validation indicator
- Password visibility toggle

### 5. **Security Features**

- Tokens are hashed before storage
- Rate limiting on password reset attempts
- Maximum 5 failed verification attempts per token
- Email-only recovery (enhances security)
- Secure password requirements

## File Structure

### Backend Files Created/Modified

**New Model:**

- `backend/models/PasswordReset.js` - Stores password reset tokens

**Modified Files:**

- `backend/controllers/authController.js` - Added forgot/reset password logic
- `backend/routes/authRoutes.js` - Added new routes
- `backend/utils/emailService.js` - Added password reset email function

**New Routes:**

```
POST /api/auth/forgot-password       - Request password reset
POST /api/auth/verify-reset-token   - Verify reset token validity
POST /api/auth/reset-password       - Complete password reset
```

### Frontend Files Created/Modified

**New Components:**

- `frontend/src/components/ForgotPasswordModal.jsx` - Modal for email entry
- `frontend/src/pages/ResetPasswordPage.jsx` - Password reset form page

**Modified Files:**

- `frontend/src/pages/LoginPage.jsx` - Added "Forgot Password?" link
- `frontend/src/App.jsx` - Added reset password page routing

## User Flow

### Step 1: Request Password Reset

```
User clicks "Forgot Password?" on login page
                    ↓
ForgotPasswordModal opens
                    ↓
User enters email and clicks "Send Reset Link"
                    ↓
Frontend calls POST /api/auth/forgot-password
                    ↓
Backend generates secure token
                    ↓
Email sent with reset link
                    ↓
Success message shown
```

### Step 2: Reset Password

```
User clicks reset link in email
                    ↓
Redirected to /reset-password?email=...&token=...
                    ↓
ResetPasswordPage verifies token with backend
                    ↓
If valid: password reset form displayed
If invalid: error message shown
                    ↓
User enters new password (with strength validation)
                    ↓
Frontend calls POST /api/auth/reset-password
                    ↓
Backend updates user password
                    ↓
Success message shown, redirected to login
```

## API Endpoints

### 1. Forgot Password Request

**Endpoint:** `POST /api/auth/forgot-password`

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "If an account exists with this email, you will receive a password reset link."
}
```

**Response (Rate Limited):**

```json
{
  "success": false,
  "message": "Too many password reset requests, please try again later."
}
```

### 2. Verify Reset Token

**Endpoint:** `POST /api/auth/verify-reset-token`

**Request:**

```json
{
  "email": "user@example.com",
  "token": "token_string_here"
}
```

**Response (Valid):**

```json
{
  "success": true,
  "message": "Reset token is valid. You can now reset your password.",
  "data": {
    "email": "user@example.com"
  }
}
```

**Response (Invalid/Expired):**

```json
{
  "success": false,
  "message": "Invalid or expired reset token"
}
```

### 3. Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Request:**

```json
{
  "email": "user@example.com",
  "token": "token_string_here",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Your password has been reset successfully. You can now login with your new password."
}
```

**Response (Error):**

```json
{
  "success": false,
  "message": "Passwords do not match" // or other validation error
}
```

## Environment Variables

No new environment variables are required. The feature uses existing:

- `FRONTEND_URL` - For constructing reset links (defaults to `http://localhost:5173`)
- `EMAIL_USER` - For sending reset emails
- `EMAIL_PASSWORD` - Email service authentication

## Database Schema

### PasswordReset Collection

```javascript
{
  _id: ObjectId,
  email: String (required, lowercase),
  resetToken: String (required, unique),
  resetTokenHash: String (required),
  expiresAt: Date (required),
  isUsed: Boolean (default: false),
  usedAt: Date,
  attempts: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

## Testing the Feature

### Test Case 1: Happy Path

1. Click "Forgot Password?" on login page
2. Enter registered email
3. Check email for reset link
4. Click link
5. Enter new password meeting requirements
6. Click "Reset Password"
7. Verify success message
8. Login with new password

### Test Case 2: Invalid Token

1. Manually modify token in URL
2. Should show "Invalid or expired reset link"

### Test Case 3: Expired Token

1. Wait 30+ minutes after requesting reset
2. Click reset link
3. Should show "Reset token has expired"

### Test Case 4: Rate Limiting

1. Request password reset for same email 3+ times in 15 minutes
2. 4th attempt should be rate limited

### Test Case 5: Password Requirements

1. Try password with less than 8 characters - should fail
2. Try password without uppercase - should fail
3. Try password without lowercase - should fail
4. Try password without number - should fail
5. Try valid password - should succeed

## Security Considerations

1. **Email Enumeration Protection:** Feature returns same success message for both existing and non-existing emails to prevent user enumeration attacks

2. **Token Security:**
   - Tokens are randomly generated using `crypto.randomBytes(32)`
   - Tokens are hashed before storage using SHA256
   - Tokens are compared with hashed version from database

3. **Rate Limiting:**
   - Password reset requests: 3 per 15 minutes
   - Verification attempts: 5 per token
   - Rate limit by email address to prevent targeting

4. **Expiration:**
   - Reset tokens expire after 30 minutes
   - After expiration, token is deleted from database

5. **One-Time Use:**
   - Each token can only be used once
   - After successful reset, token is marked as used

## Troubleshooting

### Email Not Received

- Check email service configuration in `.env`
- Verify sender email credentials
- Check spam/junk folders
- Ensure `FRONTEND_URL` is set correctly

### Invalid Token Error

- Token may have expired (30 minute limit)
- Token may have been used already
- Request a new password reset

### Password Doesn't Meet Requirements

- Check that password has:
  - At least 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number

### Still Can't Login

- Verify password was saved (success message shown)
- Try resetting password again
- Contact administrator if issue persists

## Future Enhancements

1. **Two-Factor Authentication for Password Reset:**
   - Send OTP to email along with reset link
   - User must enter OTP before resetting password

2. **SMS Password Reset:**
   - Send reset link via SMS for phone-based recovery

3. **Security Questions:**
   - Add optional security questions for verification

4. **Email Verification History:**
   - Track all password reset attempts for security auditing

5. **Password Reset Notifications:**
   - Send notification when password is changed
   - Allow user to revert if unauthorized

## Support

For issues or questions about the forgot password feature, please:

1. Check this documentation
2. Review the code comments in source files
3. Check error logs in `backend/logs/`
4. Contact the development team
