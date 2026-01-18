# 🚀 Complete Deployment Guide - Kanz ul Huda

This guide covers deploying your backend to Render/Vercel and frontend to Netlify.

---

## 📋 Prerequisites

- GitHub account (for connecting repos)
- MongoDB Atlas account (for cloud database)
- Render.com or Vercel account (for backend)
- Netlify account (for frontend)

---

## 🗄️ Part 1: MongoDB Atlas Setup (Required for Both)

### 1. Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or login
3. Create a new project
4. Create a cluster (free tier M0 is fine)
5. Click "Connect" → "Drivers" → Copy connection string

### 2. Update Connection String

Replace `<password>` with your database password:

```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/kanz-ul-huda?retryWrites=true&w=majority
```

---

## 🔧 Part 2: Backend Deployment (Render.com - Recommended)

### Step 1: Prepare Your Backend

1. Create/Update `.env` file in backend folder:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/kanz-ul-huda
CORS_ORIGIN=https://your-frontend-domain.netlify.app
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRE=7d
WEEK_START_DAY=4
```

2. Create `.gitignore` in backend (if not exists):

```
node_modules/
.env
.env.local
logs/
*.log
.DS_Store
```

3. Push backend code to GitHub

### Step 2: Deploy on Render

1. Go to [Render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Select the backend folder:
   - **Name**: `kanz-ul-huda-backend`
   - **Root Directory**: `backend` (or path to your backend)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

6. Add Environment Variables:
   - Click "Advanced" → "Add Environment Variable"
   - Add all variables from your `.env`:
     ```
     NODE_ENV = production
     MONGODB_URI = mongodb+srv://username:password@...
     CORS_ORIGIN = https://your-frontend.netlify.app
     JWT_SECRET = your-secret-key
     JWT_EXPIRE = 7d
     WEEK_START_DAY = 4
     ```

7. Click "Create Web Service"
8. Wait for deployment (5-10 minutes)
9. Get your backend URL: `https://kanz-ul-huda-backend.onrender.com`

---

## 🎨 Part 3: Frontend Deployment (Netlify)

### Step 1: Prepare Your Frontend

1. Create `.env.production` in frontend folder:

```env
VITE_API_URL=https://kanz-ul-huda-backend.onrender.com/api
```

2. Create `.gitignore` in frontend (if not exists):

```
node_modules/
dist/
.env.local
.DS_Store
*.log
```

3. Update [frontend/vite.config.js](frontend/vite.config.js) to remove the proxy (only needed for development):

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons: ['lucide-react'],
        },
      },
    },
  },
})
```

4. Push frontend code to GitHub

### Step 2: Deploy on Netlify

1. Go to [Netlify](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub and authorize
4. Select your repository
5. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

6. Click "Show advanced" → "New variable":
   - **Key**: `VITE_API_URL`
   - **Value**: `https://kanz-ul-huda-backend.onrender.com/api`

7. Click "Deploy site"
8. Wait for build to complete
9. Your frontend URL: `https://your-site-name.netlify.app`

---

## 🔄 Part 4: Update CORS Configuration

After deployment, update your backend `.env` on Render:

1. Go to Render Dashboard
2. Select your backend service
3. Go to "Environment"
4. Update `CORS_ORIGIN` with your Netlify domain:

   ```
   CORS_ORIGIN=https://your-site-name.netlify.app
   ```

5. Save and redeploy

---

## ✅ Testing Your Deployment

1. Visit your frontend: `https://your-site-name.netlify.app`
2. Try to login - it should connect to your backend
3. Check browser console (F12) for any errors
4. Test backend directly: `https://kanz-ul-huda-backend.onrender.com/api/health`

---

## 🐛 Troubleshooting

### CORS Error

- Check `CORS_ORIGIN` in backend `.env`
- Ensure it matches your frontend domain exactly
- Redeploy backend after changing

### API Not Found

- Check `VITE_API_URL` in `.env.production`
- Verify backend URL is correct
- Redeploy frontend after changes

### Database Connection Error

- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas whitelist includes Render's IP (set to 0.0.0.0/0)
- Test connection string locally first

### Build Fails on Netlify

- Check build logs in Netlify dashboard
- Ensure `npm run build` works locally
- Verify all dependencies are in `package.json`

---

## 📝 Alternative: Vercel for Backend

If you prefer Vercel instead of Render:

1. Create `vercel.json` in backend:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

2. Push to GitHub
3. Go to Vercel.com → Import Project
4. Select your repo
5. Add environment variables
6. Deploy

**Note**: Vercel's free tier has limitations for long-running servers. Render is recommended for Node.js backends.

---

## 🔒 Security Checklist

- [ ] JWT_SECRET is strong and random
- [ ] MongoDB password is secure
- [ ] CORS_ORIGIN is set correctly (no wildcards in production)
- [ ] API keys are in environment variables (not hardcoded)
- [ ] `.env` file is in `.gitignore`
- [ ] Remove `console.log` statements before deployment
- [ ] Test error handling in production

---

## 📦 Updating Your Deployment

### Backend Updates

1. Push changes to GitHub
2. Render auto-deploys on push (if enabled)
3. Monitor deployment in Render dashboard

### Frontend Updates

1. Push changes to GitHub
2. Netlify auto-deploys on push
3. Check build status in Netlify dashboard

---

## 🚀 Environment Variables Summary

### Backend (.env on Render)

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
CORS_ORIGIN=https://your-frontend.netlify.app
JWT_SECRET=your-secure-key
JWT_EXPIRE=7d
WEEK_START_DAY=4
```

### Frontend (.env.production)

```
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## 💡 Tips

- Use separate MongoDB clusters for dev and production
- Monitor logs regularly on both platforms
- Set up error tracking (Sentry, etc.) for production
- Use HTTPS everywhere
- Keep dependencies updated
- Regular backups of MongoDB data

---

**Happy Deploying! 🎉**
