# 🚀 Deployment Environment Setup Guide

## **Problem:** Emails & Messages Not Working on Deployed Version

When running locally: ✅ Everything works
When deployed (Render + Vercel): ❌ No emails, no UI messages

---

## **Root Causes**

1. **Missing Email Credentials on Render** - `EMAIL_USER` and `EMAIL_PASSWORD` not set
2. **Wrong API URL on Vercel** - Frontend pointing to placeholder URL, not actual Render backend
3. **CORS Not Configured** - Backend blocking requests from Vercel frontend domain
4. **Environment Variables Not Synced** - Local `.env` not uploaded to deployed services

---

## **✅ Fix Checklist**

### **PART 1: Verify Your URLs**

First, find your actual URLs:

**Render Backend URL:**

- Go to https://dashboard.render.com
- Find your backend service
- Copy the URL (looks like: `https://kanz-backend-xxxxx.onrender.com`)

**Vercel Frontend URL:**

- Go to https://vercel.com/dashboard
- Find your frontend project
- Copy the URL (looks like: `https://kanz-ul-huda.vercel.app`)

---

### **PART 2: Configure Vercel (Frontend)**

**Step 1:** Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Step 2:** Add this variable:

```
Name: VITE_API_URL
Value: https://YOUR-RENDER-URL.onrender.com/api
```

Replace `YOUR-RENDER-URL` with your actual Render service name.

**Example:**

```
VITE_API_URL=https://kanz-backend-12345.onrender.com/api
```

**Step 3:** Redeploy on Vercel

- Go to Deployments tab
- Click "Redeploy" on latest deployment
- OR: Push a commit to trigger auto-deployment

---

### **PART 3: Configure Render Backend**

**Step 1:** Go to https://dashboard.render.com → Your Backend Service

**Step 2:** Go to **Environment** tab

**Step 3:** Add these environment variables:

#### **Email Configuration (REQUIRED for emails to work)**

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

**⚠️ IMPORTANT - Get Gmail App Password:**

- Go to https://myaccount.google.com/security
- Enable 2-Step Verification if not already enabled
- Search for "App passwords"
- Select "Mail" and "Windows Computer"
- Generate app password (16 characters)
- Copy that password as `EMAIL_PASSWORD`

#### **CORS Configuration (so backend accepts frontend requests)**

```
CORS_ORIGIN=https://YOUR-VERCEL-URL.vercel.app
FRONTEND_URL=https://YOUR-VERCEL-URL.vercel.app
```

**Example:**

```
CORS_ORIGIN=https://kanz-ul-huda.vercel.app
FRONTEND_URL=https://kanz-ul-huda.vercel.app
```

#### **Required Backend Settings**

```
NODE_ENV=production
PORT=5000

MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-32-character-random-secret-key
JWT_REFRESH_SECRET=your-32-character-random-secret-key
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

REGISTRATION_CODE=KANZULHUDA2026
MAIN_ADMIN_EMAIL=your-admin-email@example.com
WEEK_START_DAY=6
```

**Step 4:** After adding all variables, click "Save"

**Step 5:** Render will automatically restart the service

---

### **PART 4: Update Frontend .env.production**

Edit [frontend/.env.production](frontend/.env.production):

```
VITE_API_URL=https://YOUR-RENDER-URL.onrender.com/api
```

Then commit and push:

```bash
git add frontend/.env.production
git commit -m "Update API URL for production deployment"
git push origin main
```

---

## **🧪 Testing the Fix**

### **Test 1: Check if Frontend Can Reach Backend**

1. Open your Vercel frontend
2. Open DevTools (F12) → Console tab
3. Run:

```javascript
fetch('https://YOUR-RENDER-URL.onrender.com/api/health')
  .then((r) => r.json())
  .then((d) => console.log(d))
```

**Expected Result:**

```json
{ "status": "OK", "message": "Kanz ul Huda Durood System API", ... }
```

If you get **CORS error**, your `CORS_ORIGIN` is not set correctly on Render.

---

### **Test 2: Test Registration Request Email**

1. Go to Registration Request page on Vercel frontend
2. Fill in: Name and Email
3. Click "Submit"

**Expected:**

- ✅ Green success toast message appears
- ✅ Email received in your inbox within 1 minute
- ✅ No errors in browser console (F12)

**If email not received:**

- Check Render logs: Dashboard → Service → Logs
- Look for error messages about email service
- Check `EMAIL_USER` and `EMAIL_PASSWORD` are correct
- Check Gmail app password is correct (not your regular password)

---

### **Test 3: Test OTP Verification**

1. Go to Login page
2. Fill in email and password (non-existent account)
3. Should get OTP email

**Expected:**

- ✅ Email received with OTP code
- ✅ Can enter OTP to verify

---

## **🔍 Debugging - Check Render Logs**

If emails still not working:

1. Go to https://dashboard.render.com → Your Backend Service
2. Click **Logs** tab
3. Look for messages like:
   - `"Registration request confirmation email sent"` ✅
   - `"Failed to send email"` ❌

**Common errors:**

- `Invalid login` → Wrong EMAIL_USER or EMAIL_PASSWORD
- `CORS not allowed` → Wrong CORS_ORIGIN domain
- `Cannot find module` → Missing dependencies (rebuild)

---

## **📋 Complete Environment Variable Template**

Save this and fill in your actual values:

### **VERCEL ENVIRONMENT**

```env
VITE_API_URL=https://YOUR-RENDER-BACKEND-URL.onrender.com/api
```

### **RENDER ENVIRONMENT**

```env
# Production
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kanz-ul-huda

# JWT
JWT_SECRET=your-random-32-char-secret-key-here-1234567890
JWT_REFRESH_SECRET=your-random-32-char-refresh-secret-1234567890
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password

# CORS
CORS_ORIGIN=https://your-vercel-domain.vercel.app
FRONTEND_URL=https://your-vercel-domain.vercel.app

# App Settings
REGISTRATION_CODE=KANZULHUDA2026
MAIN_ADMIN_EMAIL=admin@example.com
WEEK_START_DAY=6
```

---

## **✅ Final Checklist**

- [ ] Render backend URL copied
- [ ] Vercel frontend URL copied
- [ ] Vercel `VITE_API_URL` environment variable set
- [ ] Vercel redeployed (or new deployment triggered)
- [ ] Render `CORS_ORIGIN` environment variable set
- [ ] Render `EMAIL_USER` environment variable set
- [ ] Render `EMAIL_PASSWORD` environment variable set (Gmail app password)
- [ ] Render backend restarted (auto-restart after env change)
- [ ] Frontend `.env.production` updated with Render URL
- [ ] Changes committed and pushed to git
- [ ] Test 1 passed (frontend can reach backend)
- [ ] Test 2 passed (email received for registration)
- [ ] Test 3 passed (OTP email works)

---

## **Still Having Issues?**

### **Render Logs Show Error:**

```
Check these in order:
1. EMAIL_HOST, EMAIL_PORT (should be smtp.gmail.com, 587)
2. EMAIL_USER correct? (should be full email address)
3. EMAIL_PASSWORD is Gmail app password? (not your regular password)
4. Gmail account has 2FA enabled? (required for app passwords)
```

### **UI Shows No Success Message:**

```
Check:
1. Is CORS_ORIGIN exactly matching your Vercel URL?
2. Do you see any errors in Render logs?
3. Is the backend receiving the request? (check Render logs)
4. Did you redeploy Vercel after setting VITE_API_URL?
```

### **Email Not Received:**

```
Check:
1. Render logs show "email sent" message?
2. Check spam/promotions folder
3. Is EMAIL_PASSWORD the Gmail app password (16 chars)?
4. Does Gmail account have 2FA enabled?
```

---

**Last Updated:** January 20, 2026
**Status:** Production Deployment Guide
