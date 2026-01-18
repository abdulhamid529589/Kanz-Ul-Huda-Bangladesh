# 🚀 Complete Deployment Guide - Kanz ul Huda

**Backend**: Render.com | **Frontend**: Vercel | **Database**: MongoDB Atlas

This guide provides step-by-step instructions for deploying your application with best practices for production.

---

## 📋 Prerequisites

- GitHub account (with your repository)
- MongoDB Atlas account (free tier available)
- Render.com account (free tier available)
- Vercel account (free tier available)
- Node.js 16+ installed locally (for testing)

---

## 🗄️ Step 1: MongoDB Atlas Setup (Database)

### Create & Configure MongoDB Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or login with GitHub
3. Create a new project (e.g., "Kanz-ul-Huda")
4. Create a cluster:
   - Choose **M0 Free** tier
   - Select your region (closest to your users)
   - Cluster name: `kanz-ul-huda`
5. Create a database user:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Username: `kanz_admin`
   - Password: Generate secure password (save it!)
   - Built-in Role: `Atlas admin`
6. Whitelist IP addresses:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0) for development
   - For production: Add specific IPs only
7. Get connection string:
   - Click "Connect" → "Drivers"
   - Copy MongoDB URI
   - Replace `<password>` with your password

**Connection String Format**:

```
mongodb+srv://kanz_admin:your-password@cluster0.xxxxx.mongodb.net/kanz-ul-huda?retryWrites=true&w=majority
```

---

## 🔧 Step 2: Backend Deployment (Render.com)

### 2.1: Prepare Backend for Deployment

1. **Create `.env` in backend folder**:

```env
# Production Environment
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://kanz_admin:your-password@cluster0.xxxxx.mongodb.net/kanz-ul-huda?retryWrites=true&w=majority

# API Configuration
CORS_ORIGIN=https://your-vercel-app.vercel.app
JWT_SECRET=your-super-secure-random-key-min-32-characters-long
JWT_EXPIRE=7d

# Application
WEEK_START_DAY=6
```

2. **Verify `.gitignore` in backend**:

```
node_modules/
.env
.env.local
.env.*.local
logs/
*.log
.DS_Store
dist/
build/
```

3. **Check `package.json` has correct start script**:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

4. **Push code to GitHub**:

```bash
cd backend
git add .
git commit -m "Prepare backend for Render deployment"
git push origin main
```

### 2.2: Deploy to Render

1. Go to [Render.com](https://render.com) and sign in with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. **Configure the service**:
   - **Name**: `kanz-ul-huda-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free tier (good for testing)

5. **Add Environment Variables** (click "Advanced"):
   - Click **"Add Environment Variable"** for each:

   | Key              | Value                                |
   | ---------------- | ------------------------------------ |
   | `NODE_ENV`       | `production`                         |
   | `MONGODB_URI`    | `mongodb+srv://kanz_admin:...`       |
   | `CORS_ORIGIN`    | `https://your-vercel-app.vercel.app` |
   | `JWT_SECRET`     | Your secure random key               |
   | `JWT_EXPIRE`     | `7d`                                 |
   | `WEEK_START_DAY` | `6`                                  |

6. Click **"Create Web Service"**
7. Wait for deployment (5-10 minutes)
8. **Copy your backend URL**: `https://kanz-ul-huda-backend.onrender.com`

### 2.3: Monitor Render Deployment

- Watch logs in Render dashboard for any errors
- Test backend: `https://kanz-ul-huda-backend.onrender.com/api/health`
- Should return: `{"status":"ok"}`

---

## 🎨 Step 3: Frontend Deployment (Vercel)

### 3.1: Prepare Frontend for Deployment

1. **Create `.env.production` in frontend folder**:

```env
VITE_API_URL=https://kanz-ul-huda-backend.onrender.com/api
```

2. **Verify `.gitignore` in frontend**:

```
node_modules/
dist/
.env.local
.env.*.local
.DS_Store
*.log
*.pem
```

3. **Verify `vite.config.js`** (should not have API proxy for production):

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
```

4. **Test locally**:

```bash
cd frontend
npm run build
npm run preview
```

5. **Push to GitHub**:

```bash
git add .
git commit -m "Prepare frontend for Vercel deployment"
git push origin main
```

### 3.2: Deploy to Vercel

1. Go to [Vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. **Import your repository**:
   - Select your GitHub repository
   - Click "Import"

4. **Configure project**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add:
     - **Name**: `VITE_API_URL`
     - **Value**: `https://kanz-ul-huda-backend.onrender.com/api`
   - Select scope: `Production`, `Preview`, `Development`

6. Click **"Deploy"**
7. Wait for build to complete (~2-3 minutes)
8. **Copy your frontend URL**: `https://your-project-name.vercel.app`

### 3.3: Configure Vercel Domain (Optional)

1. Go to Vercel project settings
2. Go to "Domains"
3. Add custom domain or use default `*.vercel.app`
4. Update backend `CORS_ORIGIN` with this URL

---

## 🔗 Step 4: Connect Backend & Frontend

### 4.1: Update Backend CORS

1. Go to Render dashboard
2. Select your backend service
3. Go to **"Environment"** tab
4. Update `CORS_ORIGIN`:
   ```
   https://your-project-name.vercel.app
   ```
5. Click **"Save"** - backend will auto-redeploy

### 4.2: Verify API Connection

1. Open your frontend: `https://your-project-name.vercel.app`
2. Open DevTools (F12) → **Console** tab
3. Try logging in
4. Check for CORS errors or connection issues
5. If errors, check:
   - Backend URL is correct
   - Backend is running
   - CORS_ORIGIN matches exactly

---

## ✅ Testing Your Deployment

### Backend Tests

```bash
# Test API is running
curl https://kanz-ul-huda-backend.onrender.com/api/health

# Test database connection
curl https://kanz-ul-huda-backend.onrender.com/api/stats/weekly

# Test authentication
curl -X POST https://kanz-ul-huda-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

### Frontend Tests

1. Visit frontend URL
2. Try to login with test credentials
3. Navigate through different pages
4. Check network tab (DevTools) for API calls
5. Verify no 404 or CORS errors

---

## 🐛 Troubleshooting

### Issue: CORS Error in Browser

**Error**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution**:

1. Check `CORS_ORIGIN` in Render environment variables
2. Must match frontend URL exactly (including protocol)
3. Redeploy backend after changing
4. Clear browser cache and reload

### Issue: 502 Bad Gateway on Render

**Solution**:

1. Check Render logs for errors
2. Verify `npm start` command is correct
3. Check all environment variables are set
4. Restart service in Render dashboard

### Issue: Build Fails on Vercel

**Solution**:

1. Check build logs in Vercel dashboard
2. Run `npm run build` locally to reproduce
3. Verify all dependencies in `package.json`
4. Check for hardcoded paths or environment variables

### Issue: Cannot Connect to MongoDB

**Solution**:

1. Verify connection string is correct
2. Check MongoDB password doesn't have special characters (or URL encode them)
3. Whitelist Render IP in MongoDB Atlas (0.0.0.0/0 for testing)
4. Test connection string locally first

### Issue: Environment Variables Not Loaded

**Solution**:

1. Redeploy service after adding variables
2. For Vercel: Variables take effect after redeploy
3. For Render: Redeploy service manually
4. Check variable names match exactly (case-sensitive)

---

## 🔄 Updating Your Deployment

### Push Updates to Backend

```bash
cd backend
# Make changes
git add .
git commit -m "Fix: update API logic"
git push origin main
# Render auto-deploys (if enabled)
```

### Push Updates to Frontend

```bash
cd frontend
# Make changes
git add .
git commit -m "Fix: update UI"
git push origin main
# Vercel auto-deploys
```

---

## 🔐 Production Security Checklist

- [ ] **JWT_SECRET** is long (32+ characters) and random
- [ ] **MongoDB password** is strong (no simple passwords)
- [ ] **CORS_ORIGIN** is set to exact domain (no wildcards)
- [ ] **No hardcoded secrets** in code or config files
- [ ] **.env file is in .gitignore** (never commit secrets)
- [ ] **Removed console.log statements** before deployment
- [ ] **API error messages don't expose internal details**
- [ ] **Database user has minimal permissions** (not admin in production)
- [ ] **HTTPS enabled** on both Render and Vercel (automatic)
- [ ] **Monitor logs regularly** for errors and anomalies

---

## 📊 Environment Variables Summary

### Backend (Render)

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://kanz_admin:password@cluster0.xxxxx.mongodb.net/kanz-ul-huda
CORS_ORIGIN=https://your-vercel-app.vercel.app
JWT_SECRET=your-random-32-character-minimum-key
JWT_EXPIRE=7d
WEEK_START_DAY=6
```

### Frontend (Vercel)

```env
VITE_API_URL=https://kanz-ul-huda-backend.onrender.com/api
```

---

## 💡 Pro Tips for Production

1. **Use separate MongoDB clusters** for development and production
2. **Enable Render's auto-deploy** from GitHub (in service settings)
3. **Monitor memory usage** on Render free tier (auto-suspends after 15 mins of inactivity)
4. **Use Vercel analytics** to track frontend performance
5. **Set up error tracking** with Sentry or similar
6. **Enable HTTPS redirects** (Vercel does this by default)
7. **Keep dependencies updated** regularly
8. **Test staging before production** (use preview branches)
9. **Monitor API response times** and database queries
10. **Regular MongoDB backups** (enable in Atlas settings)

---

## 🆘 Getting Help

- **Render Issues**: [Render Documentation](https://render.com/docs)
- **Vercel Issues**: [Vercel Documentation](https://vercel.com/docs)
- **MongoDB Issues**: [MongoDB Documentation](https://docs.mongodb.com)
- **CORS Errors**: Check [CORS guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

**Your app is now live! 🎉**
