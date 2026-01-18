# Kanz ul Huda - Durood Collection System

A comprehensive digital platform for Islamic organizations to track community Durood (Islamic recitations) submissions, manage members, and generate detailed analytics and reports.

**Version:** 1.0.0
**Last Updated:** January 17, 2026

---

## 🌟 Features

### Core Features

- ✅ **User Authentication** - Secure login with JWT tokens
- ✅ **Role-Based Access** - Admin and Collector roles
- ✅ **Member Management** - Add, edit, search, and filter members
- ✅ **Weekly Submissions** - Track Durood counts per week
- ✅ **Statistics Dashboard** - Real-time analytics and insights
- ✅ **Reports & Export** - CSV and PDF data export
- ✅ **Dark/Light Theme** - System preference detection + manual toggle
- ✅ **Responsive Design** - Works on desktop, tablet, mobile

### Coming Soon

- 🔄 Leaderboards and rankings
- 🎯 Achievement badges and streaks
- 📧 Email notifications
- 📱 Mobile app support
- 🌍 Multi-language support

---

## 🚀 Quick Start

### Prerequisites

- Node.js v16+
- npm or yarn
- MongoDB (local or Atlas)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run dev
```

Backend runs on: `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173` (Vite default)

---

## 📚 Documentation

### Complete Documentation

- **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Full project reference
  - Architecture overview
  - API endpoints
  - Database models
  - Deployment guides
  - Troubleshooting

### Theme Feature Guide

- **[THEME_GUIDE.md](./THEME_GUIDE.md)** - Dark/Light theme implementation
  - How the system works
  - Integration points
  - Usage examples
  - Best practices

### Quick Reference

- **[THEME_QUICKSTART.md](./THEME_QUICKSTART.md)** - Quick theme reference
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Summary of recent updates

---

## 🎨 Dark/Light Theme

The application supports automatic dark/light mode switching:

### How to Use

1. Click the **sun/moon icon** in the top-right header
2. Theme switches instantly
3. Your preference is automatically saved

### For Developers

Add dark mode classes using Tailwind:

```jsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Content</div>
```

See [THEME_QUICKSTART.md](./THEME_QUICKSTART.md) for more examples.

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**

- React 19.2.0
- Vite 7.2.4
- Tailwind CSS 4.1.18
- Lucide React Icons

**Backend:**

- Node.js + Express.js 5.2.1
- MongoDB + Mongoose 9.1.4
- JWT Authentication
- Security: Helmet, CORS, Rate Limiting

### API Structure

```
/api/auth/          - Authentication
/api/users/         - User management
/api/members/       - Member management
/api/submissions/   - Durood submissions
/api/stats/         - Statistics & analytics
/api/reports/       - Report generation
```

See [DOCUMENTATION.md](./DOCUMENTATION.md) for complete API reference.

---

## 📦 Project Structure

```
Kanz-Ul-Huda-Website/version2/
├── backend/
│   ├── models/          (Database schemas)
│   ├── controllers/      (Business logic)
│   ├── routes/          (API endpoints)
│   ├── middleware/      (Auth & validation)
│   ├── utils/           (Helper functions)
│   └── server.js        (App entry point)
│
├── frontend/
│   ├── src/
│   │   ├── components/  (React components)
│   │   ├── pages/       (Page components)
│   │   ├── context/     (State management)
│   │   └── utils/       (Helper functions)
│   ├── public/          (Static assets)
│   └── vite.config.js
│
├── DOCUMENTATION.md     (Complete reference)
├── THEME_GUIDE.md      (Theme implementation)
└── README.md           (This file)
```

---

## 🔐 Environment Variables

### Backend (.env)

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/kanz-ul-huda
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
REGISTRATION_CODE=KANZULHUDA2026
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
WEEK_START_DAY=6
```

See [DOCUMENTATION.md](./DOCUMENTATION.md#environment-configuration) for details.

---

## 🧪 Testing

### Manual Testing

```bash
# Test backend health
curl http://localhost:5000/api/health

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

### Testing the Theme Feature

1. Click sun/moon icon in header
2. Verify theme changes instantly
3. Refresh page - theme should persist
4. Check browser DevTools: `localStorage.getItem('theme')`

---

## 📈 Statistics & Analytics

### Dashboard Includes

- Current week summary with progress
- Monthly and yearly totals
- Pending members list
- Recent submissions feed
- Key performance indicators

### Data Export

- CSV export for spreadsheet analysis
- PDF export for reports
- Custom report generation

---

## 🚢 Deployment

### Frontend (Vercel/Netlify)

```bash
npm run build  # Creates optimized build
# Deploy the `dist` folder
```

### Backend (Heroku/Docker)

```bash
heroku create app-name
git push heroku main
```

See [DOCUMENTATION.md#deployment](./DOCUMENTATION.md#deployment) for detailed options.

---

## 🐛 Troubleshooting

### API Connection Issues

```
Error: Cannot connect to backend
→ Check backend is running on http://localhost:5000
→ Verify CORS_ORIGIN in backend .env
```

### MongoDB Connection

```
Error: MongoDB Connection Error
→ Ensure MongoDB is running
→ Verify MONGODB_URI in .env
```

### Theme Not Working

```
Issue: Dark mode classes not applying
→ Check Tailwind CSS is compiled (npm run dev)
→ Verify tailwind.config.js has darkMode: 'class'
→ Clear browser cache and reload
```

See [DOCUMENTATION.md#troubleshooting](./DOCUMENTATION.md#troubleshooting) for more.

---

## 🤝 Contributing

### Development Workflow

1. Create a new branch: `git checkout -b feature/feature-name`
2. Make changes and test both light and dark modes
3. Add dark mode support to new components
4. Commit with clear messages
5. Push and create a pull request

### Code Standards

- Use Tailwind CSS for styling
- Add dark mode classes with `dark:` prefix
- Keep components small and reusable
- Comment complex logic
- Test responsive design

---

## 📝 Recent Updates (January 2026)

### New Documentation

- ✅ Comprehensive project documentation ([DOCUMENTATION.md](./DOCUMENTATION.md))
- ✅ Theme implementation guide ([THEME_GUIDE.md](./THEME_GUIDE.md))
- ✅ Quick reference guides

### Dark/Light Theme Feature

- ✅ System preference detection
- ✅ Manual theme toggle button
- ✅ localStorage persistence
- ✅ Smooth transitions
- ✅ Full Tailwind CSS integration

### Files Added/Modified

- Added: `frontend/src/context/ThemeContext.jsx`
- Added: `frontend/src/components/ThemeToggle.jsx`
- Modified: `frontend/src/main.jsx`
- Modified: `frontend/src/components/Layout.jsx`
- Modified: `frontend/tailwind.config.js`

---

## 🔗 Resources

- **React Documentation:** https://react.dev/
- **Tailwind CSS:** https://tailwindcss.com/
- **Express.js:** https://expressjs.com/
- **MongoDB:** https://docs.mongodb.com/
- **Lucide Icons:** https://lucide.dev/

---

## 📄 License

This project is proprietary software for Kanz ul Huda organization.

---

## 👥 Support

For issues, questions, or feature requests:

1. Check [DOCUMENTATION.md](./DOCUMENTATION.md) for answers
2. Review [THEME_GUIDE.md](./THEME_GUIDE.md) for theme questions
3. Check troubleshooting sections
4. Contact development team

---

## ✨ Getting Started Checklist

- [ ] Clone repository
- [ ] Setup backend (`npm install`, configure .env, `npm run dev`)
- [ ] Setup frontend (`npm install`, `npm run dev`)
- [ ] Create first admin user (register with REGISTRATION_CODE)
- [ ] Add members
- [ ] Create submissions
- [ ] Test theme toggle (sun/moon icon)
- [ ] Explore dashboard and reports

---

**Ready to use! Start the application and begin tracking Durood submissions.** 🎉
