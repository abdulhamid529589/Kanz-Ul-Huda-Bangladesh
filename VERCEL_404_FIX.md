# 🔧 Fix: 404 NOT_FOUND Errors on Vercel Deployment

## Problem

Getting `404: NOT_FOUND` errors intermittently on Vercel, even though the website is running.

## Root Cause

The `VITE_API_URL` environment variable is not being set on Vercel during build time, causing the frontend to use the fallback localhost URL instead of the Render backend URL.

## Solution

### Step 1: Set Environment Variables on Vercel Dashboard

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your project (Kanz-Ul-Huda-Bangladesh)
3. Go to **Settings** → **Environment Variables**
4. Add this variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://kanz-ul-huda-bangladesh-backend.onrender.com/api`
   - **Environments**: Select **Production** (and **Preview** if desired)
5. Click **Save**

### Step 2: Redeploy Your Project

After setting the environment variable:

```bash
# Option A: Force redeploy from Vercel Dashboard
# Go to Deployments → Select latest → Click "Redeploy"

# Option B: Push a commit to trigger redeploy
git add .
git commit -m "🔧 Add Vercel environment configuration"
git push origin main
```

### Step 3: Verify Environment Variables

After redeployment, check that the API URL is correct:

1. Open browser DevTools (F12)
2. Go to **Console**
3. You should see logs showing the correct API URL being used

## Files Updated

1. ✅ **vercel.json** - Added Vercel build configuration
2. ✅ **.env.production** - Already has correct Render URL

## Why This Happens

Vercel needs environment variables to be explicitly set during the build process. The `.env.production` file works locally but Vercel uses its own environment variable system for security.

## Expected Result

After setting the environment variable and redeploying:

- ✅ No more 404 errors
- ✅ Consistent API connectivity
- ✅ All features working smoothly

## Additional Notes

If you still see 404 errors after these steps:

1. Check that the Render backend is running (check Render dashboard)
2. Verify the Render URL is correct
3. Check browser console for any CORS errors
4. Clear browser cache (Ctrl+Shift+Delete)

---

**Time to Fix**: ~5 minutes
**Difficulty**: Easy
**Impact**: Eliminates intermittent 404 errors ✅
