# Registration System - Complete Fixes & Verification

## Issues Fixed

### 1. **IPv6 Rate Limiting Error (ERR_ERL_KEY_GEN_IPV6)**

**Problem**: The rate limiters were failing on Render because they couldn't properly handle IPv6 addresses.

**Files Fixed**:

- `backend/server.js` - Added custom `getClientIP()` function to all general rate limiters
- `backend/routes/authRoutes.js` - Added IPv6-safe key generators to `loginLimiter` and `registerLimiter`

**Solution**:

```javascript
const getClientIP = (req) => {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return req.ip || 'unknown'
}

// Used in rate limiters
keyGenerator: getClientIP,
```

---

### 2. **Duplicate Mongoose Schema Indexes**

**Problem**: Models had both `index: { expires: 0 }` in field definition AND `.index()` method calls, causing warnings and potential conflicts.

**Files Fixed**:

- `backend/models/LoginOTP.js`
- `backend/models/OTPVerification.js`

**Solution**: Removed the inline `index: { expires: 0 }` and kept only the TTL index method call.

---

### 3. **Missing 2FA Login Routes**

**Problem**: The controllers had `loginRequestOTP`, `loginVerifyOTP`, and `loginResendOTP` functions but they weren't exposed in the routes.

**Files Fixed**:

- `backend/routes/authRoutes.js`

**New Routes Added**:

- `POST /api/auth/login-request-otp` - Request OTP for 2FA login
- `POST /api/auth/login-verify-otp` - Verify OTP and complete login
- `POST /api/auth/login-resend-otp` - Resend OTP for login

---

### 4. **Missing Validation Rules**

**Problem**: Routes lacked proper validation for all endpoints, especially password confirmation and username validation.

**Files Fixed**:

- `backend/middleware/validator.js`
- `backend/routes/authRoutes.js`

**New Validators Added**:

- `validateLoginOTPVerification` - Validates username + OTP for login
- `validateLoginResendOTP` - Validates username for resending OTP
- `validateResetPassword` - Validates email, token, password confirmation, and new password

**Applied To**:

- `POST /api/auth/login-verify-otp` - Now validates username & OTP
- `POST /api/auth/login-resend-otp` - Now validates username
- `POST /api/auth/reset-password` - Now validates confirmPassword

---

### 5. **Incomplete Environment Configuration**

**Problem**: `.env.example` was missing critical environment variables.

**Files Fixed**:

- `backend/.env.example`

**Added Variables**:

```
# JWT Configuration
JWT_REFRESH_SECRET=...
JWT_REFRESH_EXPIRE=7d

# Email Configuration
EMAIL_USER=...
EMAIL_PASSWORD=...
EMAIL_HOST=...
EMAIL_PORT=...

# Additional Settings
MAIN_ADMIN_EMAIL=...
FRONTEND_URL=...
```

---

## Registration System Flow

### 1. **Step 1: Submit Registration Request** (Public)

```
POST /api/registration-requests/submit
{
  email: "user@example.com",
  name: "User Name"
}
→ Creates pending registration request
→ Sends confirmation email to user
```

### 2. **Step 2: Admin Approves Request** (Admin Only)

```
PUT /api/registration-requests/:id/approve
→ Updates status to "approved"
→ Sends approval email to user
```

### 3. **Step 3: User Requests OTP** (Public - After Approval)

```
POST /api/auth/request-otp
{
  username: "username",
  password: "Password123",
  fullName: "User Full Name",
  email: "user@example.com",
  registrationCode: "KANZULHUDA2026"
}
→ Validates registration code
→ Checks if email is approved
→ Generates and sends OTP (valid 10 minutes)
```

### 4. **Step 4: User Verifies OTP** (Public)

```
POST /api/auth/verify-otp
{
  email: "user@example.com",
  otp: "123456"
}
→ Verifies OTP
→ Creates user account
→ Sends welcome email
→ Returns auth token
```

### 5. **Step 5: User Can Login with 2FA** (Public)

```
POST /api/auth/login-request-otp
{
  username: "username",
  password: "Password123"
}
→ Validates credentials
→ Generates and sends login OTP

POST /api/auth/login-verify-otp
{
  username: "username",
  otp: "123456"
}
→ Completes 2FA login
→ Returns auth token
```

---

## Complete Rate Limiting Setup

| Endpoint                      | Method | Limit       | Window |
| ----------------------------- | ------ | ----------- | ------ |
| `/api/auth/request-otp`       | POST   | 5 per email | 15 min |
| `/api/auth/resend-otp`        | POST   | 5 per email | 15 min |
| `/api/auth/verify-otp`        | POST   | Unlimited\* | -      |
| `/api/auth/login`             | POST   | 100 per IP  | 15 min |
| `/api/auth/login-request-otp` | POST   | 100 per IP  | 15 min |
| `/api/auth/login-verify-otp`  | POST   | Unlimited\* | -      |
| `/api/auth/register`          | POST   | 50 per IP   | 1 hour |
| `/api/auth/forgot-password`   | POST   | 3 per email | 15 min |

\*OTP verification endpoints don't have rate limits to prevent legitimate users being locked out during verification attempts.

---

## Email Templates Included

1. **OTP Email** - 6-digit code, valid 10 minutes
2. **Welcome Email** - Sent after successful registration
3. **Password Reset Email** - Reset link valid 30 minutes
4. **Registration Request Confirmation** - Confirmation to user
5. **Registration Approval Email** - Approval notification
6. **Registration Rejection Email** - Rejection with reason

---

## Database Models

### User Model

- username (unique, lowercase)
- password (hashed with bcrypt)
- email (unique, lowercase)
- fullName
- role (admin/collector)
- status (active/inactive)
- registrationCodeVersion
- isMainAdmin (based on MAIN_ADMIN_EMAIL)
- lastLogin
- refreshToken
- createdAt, updatedAt

### OTPVerification Model

- email (unique per registration attempt)
- username
- otp (6 digits)
- expiresAt (10 minutes TTL)
- verified (boolean)
- registrationData (password, fullName, code, version)
- attempts (max 5)

### LoginOTP Model

- userId (reference to User)
- username
- email
- otp (6 digits)
- expiresAt (10 minutes TTL)
- verified (boolean)
- attempts (max 5)

### RegistrationRequest Model

- email (unique)
- name
- status (pending/approved/rejected)
- approvedAt
- approvedBy (admin ID)
- rejectedAt
- rejectionReason

### PasswordReset Model

- email
- resetToken
- resetTokenHash (SHA256)
- expiresAt (30 minutes)
- isUsed
- usedAt
- attempts (max 5)

---

## Security Features

✅ **Password Hashing** - bcryptjs with salt rounds 10
✅ **JWT Authentication** - Access tokens (1h) + Refresh tokens (7d)
✅ **Rate Limiting** - Prevents brute force attacks
✅ **OTP Validation** - 6-digit codes with 5 attempt limit
✅ **IPv6 Support** - Proper header handling on Render
✅ **Email Verification** - Ensures valid email ownership
✅ **Registration Approval** - Admin approval before registration
✅ **2FA Login** - Optional OTP-based login
✅ **Token Expiry** - Automatic cleanup of expired tokens
✅ **CORS Security** - Restricted to frontend domain

---

## Deployment Checklist

Before deploying to Render:

- [ ] Set `NODE_ENV=production`
- [ ] Set `MONGODB_URI` to production database
- [ ] Set `JWT_SECRET` to strong random value
- [ ] Set `JWT_REFRESH_SECRET` to strong random value
- [ ] Set `EMAIL_USER` and `EMAIL_PASSWORD` (Gmail app password)
- [ ] Set `MAIN_ADMIN_EMAIL` to admin email
- [ ] Set `CORS_ORIGIN` to frontend URL
- [ ] Set `FRONTEND_URL` to frontend domain
- [ ] Set `REGISTRATION_CODE` to secure code
- [ ] Set `WEEK_START_DAY` (0-6, where 6 = Saturday)

---

## Testing Endpoints

### 1. Health Check

```bash
curl https://your-backend.onrender.com/api/health
```

### 2. Submit Registration Request

```bash
curl -X POST https://your-backend.onrender.com/api/registration-requests/submit \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "name": "New User"
  }'
```

### 3. Request OTP

```bash
curl -X POST https://your-backend.onrender.com/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "Password123",
    "fullName": "New User",
    "email": "newuser@example.com",
    "registrationCode": "KANZULHUDA2026"
  }'
```

### 4. Verify OTP

```bash
curl -X POST https://your-backend.onrender.com/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "otp": "123456"
  }'
```

---

## Common Issues & Solutions

### Issue: "OTP has expired"

- Solution: OTP valid for 10 minutes. User needs to request new OTP using resend endpoint.

### Issue: "Too many OTP requests"

- Solution: Limit is 5 requests per 15 minutes per email. Wait 15 minutes and try again.

### Issue: "Email not approved for registration"

- Solution: Admin needs to approve the registration request first.

### Issue: "Invalid registration code"

- Solution: Check that `REGISTRATION_CODE` environment variable is set correctly and matches frontend.

### Issue: "IPv6" errors

- Solution: Already fixed. Make sure you're using the latest version with `getClientIP()` function.

---

## Files Modified

1. ✅ `backend/server.js` - Added IPv6-safe rate limiting
2. ✅ `backend/models/LoginOTP.js` - Removed duplicate index
3. ✅ `backend/models/OTPVerification.js` - Removed duplicate index
4. ✅ `backend/routes/authRoutes.js` - Added 2FA login routes, validators, IPv6 support
5. ✅ `backend/middleware/validator.js` - Added new validators
6. ✅ `backend/.env.example` - Complete environment configuration

---

## Next Steps

1. ✅ Push changes to GitHub
2. ✅ Redeploy backend to Render
3. ✅ Test registration flow end-to-end
4. ✅ Monitor Render logs for any errors
5. ✅ Update frontend API calls if needed
6. ✅ Test 2FA login flow

---

**Last Updated**: January 19, 2026
**Status**: ✅ All Critical Issues Fixed
