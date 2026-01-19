# Email Verification - Setup & Testing Guide

## Quick Setup

### 1. Backend Setup

**Step 1**: Verify models are imported in adminUserController.js
```javascript
import AdminUserEmailVerification from '../models/AdminUserEmailVerification.js'
import crypto from 'crypto'
```

**Step 2**: Verify routes are added to server.js
```javascript
import adminUserRoutes from './routes/adminUserRoutes.js'
app.use('/api/admin/users', adminUserRoutes)
```

**Step 3**: Restart backend server
```bash
cd backend
npm start  # or npm run dev
```

### 2. Frontend Setup

**Step 1**: Add routes to your app router (App.jsx or equivalent)
```javascript
import VerifyEmailPage from './pages/VerifyEmailPage'
import ResendVerificationPage from './pages/ResendVerificationPage'

// In your router config
{
  path: '/verify-email/:token',
  element: <VerifyEmailPage />
}
{
  path: '/resend-verification',
  element: <ResendVerificationPage />
}
```

**Step 2**: Update FRONTEND_URL in backend .env
```bash
# .env
FRONTEND_URL=http://localhost:3000  # Development
# or
FRONTEND_URL=https://yourapp.com    # Production
```

**Step 3**: Restart frontend dev server
```bash
cd frontend
npm run dev
```

---

## Testing Scenarios

### Test 1: Create User and Verify Email ✅

#### Prerequisites
- Backend running
- Email service configured (Gmail SMTP in .env)
- Frontend running

#### Steps
1. Login as admin user
2. Go to "Admin: Users" page
3. Click "Add New User" button
4. Fill form:
   - Username: `test_user_001`
   - Full Name: `Test User`
   - Email: `your-test-email@gmail.com` (must be real!)
   - Password: `TestPass@123`
   - Role: `Collector`
5. Click "Create User"

#### Expected Results
- ✅ See success message: "User created successfully. Verification email sent."
- ✅ See message: "User must verify their email within 7 days"
- ✅ User appears in list with "⏳ Pending Verification" status
- ✅ Check your email inbox within 1-5 minutes
- ✅ Find email with subject: "[Test User], please verify your email for Kanz-Ul-Huda"

#### Verification Steps
1. Open email
2. Click "Verify Email Address" button
3. Should redirect to verification success page
4. See message: "Email verified successfully! Your account is now active."
5. Auto-redirect to login after 3 seconds (or click "Go to Login Now")
6. Go back to user list - user now shows ✅ status

---

### Test 2: Invalid Email Rejection ✅

#### Steps
1. Click "Add New User"
2. Try email: `not-an-email`
3. Click "Create User"

#### Expected Result
❌ Error: "Please provide a valid email address"

---

### Test 3: Email Send Failure Rollback ✅

**Note**: This requires temporarily breaking email config

#### Steps
1. Modify backend .env - set invalid EMAIL_USER
2. Restart backend
3. Try to create user
4. Observe in logs

#### Expected Results
- ❌ Error: "Failed to send verification email. User creation cancelled."
- ✅ User NOT created in database (rollback successful)
- ✅ Check backend logs for error details

#### Cleanup
- Fix EMAIL_USER in .env
- Restart backend

---

### Test 4: Resend Verification Email ✅

#### Steps
1. Go to `/resend-verification` page
2. Enter email of user who needs to reverify
3. Click "Resend Verification Email"

#### Expected Results
- ✅ Success message: "Verification email sent!"
- ✅ New email sent with new token
- ✅ Verification attempts counter incremented
- ✅ 7-day expiry reset

---

### Test 5: Expired Token Handling ✅

**Note**: This requires database manipulation

#### Steps
1. Create a user (don't verify)
2. In database, set verification record `expiresAt` to past date
3. Use verification link from original email
4. OR try to manually call endpoint with old token

#### Expected Results
- ❌ Error: "Invalid or expired verification token"
- 💡 Suggestion: "Please request a new one"

---

### Test 6: Max Resend Attempts ✅

#### Steps
1. Create user
2. Go to resend page
3. Click "Resend" 5 times
4. Try resend 6th time

#### Expected Results
- ✅ First 5: Success
- ❌ 6th: Error: "Maximum resend attempts exceeded. Please contact administrator."

---

### Test 7: Already Verified User ✅

#### Steps
1. Create user
2. Complete verification (email verified = true)
3. Try resend verification

#### Expected Results
- ❌ Error: "Email already verified"

---

## Database Testing

### Check Verification Records
```javascript
// In MongoDB

// View all pending verifications
db.adminuseremailverifications.find({ isVerified: false })

// View specific user's verification
db.adminuseremailverifications.findOne({ userId: ObjectId("...") })

// Check expiry dates
db.adminuseremailverifications.find({ expiresAt: { $lt: new Date() } })
```

### Check User Records
```javascript
// View user with verification status
db.users.findOne({ username: "test_user_001" }, { 
  emailVerified: 1, 
  createdByAdmin: 1, 
  email: 1 
})

// Find all unverified admin-created users
db.users.find({ 
  createdByAdmin: true, 
  emailVerified: false 
})
```

---

## Email Testing

### Gmail Configuration (Recommended for Testing)

1. Create test Gmail account: `testadmin@gmail.com`
2. Enable 2FA in Gmail
3. Generate App Password: https://myaccount.google.com/apppasswords
4. Add to backend .env:
```bash
EMAIL_USER=testadmin@gmail.com
EMAIL_PASSWORD=your-app-password-here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### Test Email Receive
1. Create user with your personal email
2. Check spam folder if not in inbox
3. Verify email format (should be professional looking)
4. Check link is clickable and formatted correctly

---

## Logs to Check

### Backend Logs
```javascript
// When user created
[INFO] User created by admin with email verification required {
  adminId: "...",
  newUserId: "...",
  role: "collector",
  email: "test@example.com"
}

// When email sent
[INFO] Admin-created user verification email sent {
  email: "test@example.com",
  messageId: "..."
}

// When verified
[INFO] Email verified for admin-created user {
  userId: "...",
  email: "test@example.com"
}

// Errors
[ERROR] Failed to send admin-created user verification email {
  email: "test@example.com",
  error: "SMTP connection failed"
}
```

### Frontend Logs
Open browser console (F12) and look for:
- Network requests to `/admin/users/verify-email/:token`
- Network requests to `/admin/users/resend-verification-email`
- API responses with success/error messages

---

## Troubleshooting

### Issue: "Failed to send verification email"

**Causes**:
1. Email not configured in .env
2. SMTP credentials invalid
3. Network/firewall blocking SMTP
4. Email account locked/2FA issues

**Solution**:
```bash
# Test email connection
node -e "
const nodemailer = require('nodemailer');
const t = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: { user: 'YOUR_EMAIL@gmail.com', pass: 'YOUR_APP_PASSWORD' }
});
t.verify((e,ok) => console.log(e || 'Email configured!'));
"
```

### Issue: Verification link not working

**Causes**:
1. Token expired (7+ days)
2. Token doesn't match database
3. User already verified

**Solution**:
1. Check `expiresAt` in database
2. Verify token matches verification record
3. Use resend functionality to get new token

### Issue: User not appearing in list after creation

**Causes**:
1. Email send failed (user creation rolled back)
2. Network error
3. Browser cache

**Solution**:
1. Check console for error message
2. Verify user in database: `db.users.findOne({ username: "test_user_001" })`
3. Clear browser cache (Ctrl+Shift+Delete)
4. Refresh page

### Issue: Email never arrives

**Causes**:
1. Spam filter blocked it
2. Invalid email address
3. Email send actually failed (check logs)

**Solution**:
1. Check spam/junk folder
2. Use resend function to test again
3. Check backend logs for errors
4. Verify email is correct: `db.users.findOne({}, { email: 1 })`

---

## Performance Testing

### Load Test: Create 100 Users
```bash
# Backend test - create users rapidly
for i in {1..100}; do
  curl -X POST http://localhost:5000/api/admin/users \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"user$i\",\"email\":\"user$i@test.com\",\"fullName\":\"User $i\",\"password\":\"Pass@123\"}"
done
```

**Expected**: No performance degradation, emails send in background

### Database Cleanup Test
```javascript
// Check TTL index works after 7 days
// Run this after 7+ days:
db.adminuseremailverifications.find({}).count()
// Should see expired records auto-deleted
```

---

## Checklist Before Production

- [ ] Email service configured and tested
- [ ] FRONTEND_URL correct in .env
- [ ] Routes added to frontend app
- [ ] Test email created and verified successfully
- [ ] Error messages clear and helpful
- [ ] Backend logs show verification events
- [ ] Database models created
- [ ] Admin UI displays verification status
- [ ] Users receive emails within 5 minutes
- [ ] Verification link works and redirects correctly
- [ ] Resend function works (max 5 attempts)
- [ ] TTL index auto-cleanup confirmed
- [ ] All tests pass locally
- [ ] Code pushed to GitHub
- [ ] Documentation reviewed

---

## Questions?

For issues, check:
1. Backend logs: `npm run dev` console
2. Frontend logs: Browser DevTools (F12)
3. Database records: MongoDB
4. Email configuration: `.env` file
5. Documentation: `EMAIL_VERIFICATION_SECURITY.md`
