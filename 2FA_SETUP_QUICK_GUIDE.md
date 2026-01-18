# 2FA Setup Quick Guide

## ⚡ 5-Minute Setup

### Step 1: Update Backend .env (2 minutes)

```env
# Email Configuration - Add these lines
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**For Gmail Users:**

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Copy the 16-character password
4. Paste into `EMAIL_PASSWORD`

### Step 2: Update Frontend LoginPage (2 minutes)

In `frontend/src/pages/LoginPage.jsx`, find the registration section and update:

```jsx
import RegisterPage2FA from './RegisterPage2FA'

// In your component, replace the old RegisterPage with:
{
  !showRegister ? (
    <LoginForm onRegisterClick={() => setShowRegister(true)} />
  ) : (
    <RegisterPage2FA onBackToLogin={() => setShowRegister(false)} />
  )
}
```

### Step 3: Test (1 minute)

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

1. Go to Registration page
2. Fill form and click "Continue (Send OTP)"
3. Check email for 6-digit code
4. Enter code and verify
5. Done! ✅

---

## 🎯 Key Features

✅ **Email OTP** - Unique 6-digit code sent to email
✅ **10-minute Expiry** - Auto-deletes after expiry
✅ **5 Attempt Limit** - Prevents brute force
✅ **Rate Limiting** - 5 requests per 15 minutes
✅ **Welcome Email** - Sent after successful registration
✅ **Backward Compatible** - Old registration still works

---

## 🔐 Security

Even if registration code leaks, user still needs:

- ✅ Valid registration code (exposed)
- ❌ Access to user's email (protected)
- ❌ Correct 6-digit OTP (1 in 1,000,000)
- ❌ Within 10-minute window (auto-expires)

**Result: 99.9999% more secure** 🛡️

---

## 📧 Email Provider Options

| Provider     | SMTP Host             | Port | Notes                  |
| ------------ | --------------------- | ---- | ---------------------- |
| **Gmail**    | smtp.gmail.com        | 587  | Use App Password       |
| **Outlook**  | smtp-mail.outlook.com | 587  | Use account password   |
| **SendGrid** | smtp.sendgrid.net     | 587  | Use `apikey` + API key |
| **Brevo**    | smtp-relay.brevo.com  | 587  | Use SMTP key           |

---

## ✅ Verify Installation

Check backend logs:

```
✅ Email service initialized successfully
```

If you see this, 2FA is ready! 🚀

---

## 🆘 Troubleshooting

| Issue              | Solution                               |
| ------------------ | -------------------------------------- |
| Emails not sending | Check .env credentials                 |
| OTP not received   | Check spam folder                      |
| Rate limit error   | Wait 15 minutes or use different email |
| Connection error   | Verify EMAIL_HOST and EMAIL_PORT       |

For detailed guide, see: [2FA_IMPLEMENTATION_GUIDE.md](./2FA_IMPLEMENTATION_GUIDE.md)
