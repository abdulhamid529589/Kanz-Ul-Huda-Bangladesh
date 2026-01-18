# 🕌 Kanz ul Huda - Frontend

React + Vite + Tailwind CSS frontend for the Durood Collection System.

## 📁 Project Structure

```
frontend/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   └── Layout.jsx          # Main layout component
│   ├── context/
│   │   └── AuthContext.jsx     # Authentication context
│   ├── pages/
│   │   ├── LoginPage.jsx       # Login page
│   │   ├── Dashboard.jsx       # Dashboard page
│   │   └── MembersPage.jsx     # Members management
│   ├── utils/
│   │   └── api.js              # API utilities
│   ├── App.jsx                 # Main app component
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles
├── index.html                  # HTML template
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind configuration
├── postcss.config.js           # PostCSS configuration
├── package.json                # Dependencies
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- Backend server running on port 5000

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 🎨 Technologies

- **React 18** - UI library
- **Vite 5** - Build tool (⚡ lightning fast)
- **Tailwind CSS 4** - Utility-first CSS framework
- **Lucide React** - Icon library
- **ES6 Modules** - Modern JavaScript

## 📦 Available Scripts

| Command           | Description                           |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Start development server on port 3000 |
| `npm run build`   | Create production build in `dist/`    |
| `npm run preview` | Preview production build locally      |
| `npm run lint`    | Run ESLint                            |

## 🎨 Tailwind Custom Classes

### Buttons

```jsx
<button className="btn-primary">Primary</button>
<button className="btn-secondary">Secondary</button>
<button className="btn-danger">Danger</button>
<button className="btn-outline">Outline</button>
```

### Inputs

```jsx
<input className="input-field" />
<input className="input-field input-error" /> // With error
```

### Cards

```jsx
<div className="card">
  <div className="card-header">
    <h3>Title</h3>
  </div>
  <p>Content</p>
</div>
```

### Badges

```jsx
<span className="badge-success">Active</span>
<span className="badge-warning">Pending</span>
<span className="badge-danger">Inactive</span>
<span className="badge-info">Info</span>
```

### Alerts

```jsx
<div className="alert-success">Success message</div>
<div className="alert-error">Error message</div>
<div className="alert-warning">Warning message</div>
<div className="alert-info">Info message</div>
```

## 🔧 Configuration

### API URL

Change the API URL in `src/context/AuthContext.jsx` and `src/utils/api.js`:

```javascript
const API_URL = 'http://localhost:5000/api'
```

Or use environment variables (`.env` file):

```env
VITE_API_URL=http://localhost:5000/api
```

Then access with:

```javascript
const API_URL = import.meta.env.VITE_API_URL
```

### Proxy Configuration

API proxy is configured in `vite.config.js`:

```javascript
server: {
  proxy: {
    '/api': 'http://localhost:5000'
  }
}
```

## 📱 Pages

### 1. Login Page

- Username/password authentication
- JWT token storage
- Error handling
- Loading states

### 2. Dashboard

- Current week statistics
- Quick stats (month, year, all-time)
- Pending members list
- Recent submissions feed

### 3. Members Management

- View all members
- Search by name/phone
- Filter by status/country
- Add/Edit/Delete members (TODO)

### 4. Submissions (Coming Soon)

- Enter weekly submissions
- View submission history
- Quick entry mode

### 5. Reports (Coming Soon)

- Generate weekly reports
- Export to PDF/Excel
- Social media templates

## 🔐 Authentication

The app uses JWT token authentication:

1. User logs in → Token stored in localStorage
2. Token sent with every API request
3. Token validated on each request
4. Auto-logout on token expiry

## 🎯 Features

- ✅ Fast development with HMR (< 100ms)
- ✅ Responsive design (mobile-first)
- ✅ Custom Tailwind theme
- ✅ Loading states
- ✅ Error handling
- ✅ API utilities
- ✅ Context-based state management
- ✅ Clean component structure

## 🐛 Troubleshooting

### Port already in use

```bash
# Change port in vite.config.js
server: {
  port: 3001  // or any available port
}
```

### Tailwind not working

1. Check `index.css` has Tailwind directives
2. Verify `main.jsx` imports `index.css`
3. Restart dev server

### API calls failing

1. Ensure backend is running on port 5000
2. Check proxy configuration in `vite.config.js`
3. Verify CORS settings on backend

### Build fails

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📝 Development Guidelines

### Component Structure

```jsx
// 1. Imports
import { useState } from 'react'
import { Icon } from 'lucide-react'

// 2. Component
const MyComponent = () => {
  // 3. State
  const [data, setData] = useState(null)

  // 4. Effects
  useEffect(() => {
    fetchData()
  }, [])

  // 5. Functions
  const fetchData = async () => {
    // ...
  }

  // 6. Render
  return <div className="card">{/* ... */}</div>
}

// 7. Export
export default MyComponent
```

### Naming Conventions

- Components: PascalCase (e.g., `LoginPage.jsx`)
- Functions: camelCase (e.g., `fetchData`)
- Constants: UPPER_CASE (e.g., `API_URL`)
- CSS classes: kebab-case (Tailwind)

### Best Practices

1. Use functional components with hooks
2. Keep components small and focused
3. Extract reusable logic to custom hooks
4. Use TypeScript for better type safety (optional)
5. Write meaningful commit messages
6. Test on mobile devices

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

### Manual

```bash
npm run build
# Upload dist/ folder to your hosting
```

## 📊 Performance

### Build Size

- Vendor chunk: ~150 KB (React, React-DOM)
- Icons chunk: ~20 KB (Lucide React)
- App chunk: ~30 KB (Your code)
- CSS: ~5 KB (Tailwind purged)

### Load Time

- First Load: < 1 second
- Subsequent loads: < 100ms (cached)

### Optimization Tips

1. Use lazy loading for routes
2. Optimize images (WebP format)
3. Enable gzip compression
4. Use CDN for static assets
5. Implement code splitting

## 🔄 Updates

### Update Dependencies

```bash
npm update
```

### Major Updates

```bash
npm install react@latest react-dom@latest
npm install -D vite@latest
npm install -D tailwindcss@latest
```

## 📞 Support

- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:3000
- **Documentation**: See main project README

## 📄 License

MIT License - Free to use and modify

---

**Built with ❤️ for Kanz ul Huda Digital Dawah Team**
