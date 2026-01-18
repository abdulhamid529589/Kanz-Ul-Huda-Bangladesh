# Kanz Ul Huda - Durood Collection System

**Version:** 1.0.0
**Last Updated:** January 17, 2026

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Installation & Setup](#installation--setup)
5. [Environment Configuration](#environment-configuration)
6. [Database Models](#database-models)
7. [API Endpoints](#api-endpoints)
8. [Frontend Components](#frontend-components)
9. [Features](#features)
10. [Development Guide](#development-guide)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Kanz Ul Huda** is a comprehensive Durood (Islamic recitation) collection and tracking system designed for Islamic organizations and communities. It enables members to submit weekly Durood counts, track progress, and provides administrators with powerful analytics and reporting tools.

### Key Objectives

- Track Durood submissions from community members
- Generate detailed statistics and reports
- Manage member information and submissions
- Provide role-based access control (Admin & Collector)
- Enable progress monitoring and analytics

---

## Tech Stack

### Backend

- **Runtime:** Node.js
- **Framework:** Express.js 5.2.1
- **Database:** MongoDB with Mongoose 9.1.4
- **Authentication:** JWT (JSON Web Tokens) with bcryptjs
- **Security:** Helmet, CORS, Rate Limiting
- **Additional:**
  - Morgan (HTTP logging)
  - Compression (Response compression)
  - Express Validator (Input validation)
  - JSON2CSV & PDFKit (Report generation)
  - CSV Parser (Data import)

### Frontend

- **Framework:** React 19.2.0
- **Build Tool:** Vite 7.2.4
- **Styling:** Tailwind CSS 4.1.18
- **UI Icons:** Lucide React 0.562.0
- **State Management:** React Context API

### Development Tools

- **Backend:** Nodemon, ESLint
- **Frontend:** ESLint, Vite
- **Version Control:** Git

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (React)                        │
│  Dashboard | Members | Submissions | Reports | Profile  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/HTTPS
┌──────────────────────▼──────────────────────────────────┐
│               API Gateway (Express.js)                   │
│  - Authentication Middleware                             │
│  - Rate Limiting                                         │
│  - CORS & Security Headers                              │
└──────┬──────────────┬──────────────┬──────────────┬─────┘
       │              │              │              │
    Auth         Members      Submissions        Reports
   Routes       Routes         Routes            Routes
       │              │              │              │
┌──────▼──────────────▼──────────────▼──────────────▼─────┐
│           Controllers (Business Logic)                   │
│  - authController    - memberController                 │
│  - submissionController - statsController               │
└──────┬──────────────┬──────────────┬──────────────┬─────┘
       │              │              │              │
┌──────▼──────────────▼──────────────▼──────────────▼─────┐
│            Data Models (Mongoose)                       │
│  - User Model      - Member Model                       │
│  - Submission Model                                     │
└──────┬──────────────┬──────────────┬──────────────┬─────┘
       │              │              │              │
└──────▼──────────────▼──────────────▼──────────────▼─────┐
│                  MongoDB Database                       │
│  - users collection                                     │
│  - members collection                                   │
│  - submissions collection                               │
└─────────────────────────────────────────────────────────┘
```

### Folder Structure

```
project/
├── backend/
│   ├── models/           # Mongoose schemas
│   │   ├── User.js       # User model (admin/collector)
│   │   ├── Member.js     # Member model
│   │   └── Submission.js # Submission model
│   ├── controllers/      # Business logic
│   │   ├── authController.js
│   │   ├── memberController.js
│   │   ├── submissionController.js
│   │   └── statsController.js
│   ├── routes/          # API routes
│   │   ├── authRoutes.js
│   │   ├── memberRoutes.js
│   │   ├── submissionRoutes.js
│   │   ├── statsRoutes.js
│   │   └── reportRoutes.js
│   ├── middleware/      # Custom middleware
│   │   └── auth.js      # JWT authentication
│   ├── utils/           # Utility functions
│   │   ├── seed.js      # Database seeding
│   │   └── weekHelper.js # Week calculation logic
│   ├── server.js        # Express app setup
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   │   └── Layout.jsx
│   │   ├── pages/       # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── MembersPage.jsx
│   │   ├── context/     # Context API
│   │   │   └── AuthContext.jsx
│   │   ├── utils/       # Utility functions
│   │   │   └── api.js
│   │   ├── App.jsx      # Root component
│   │   ├── main.jsx     # Entry point
│   │   ├── App.css
│   │   └── index.css
│   ├── public/          # Static assets
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── DOCUMENTATION.md     # This file
└── .env.example        # Environment variables template
```

---

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or cloud)
- Git

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure environment variables (see next section)
# Edit .env with your settings

# Seed database (optional)
npm run seed

# Start development server
npm run dev

# Build for production
npm start
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Environment Configuration

### Backend .env

```
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/kanz-ul-huda

# Authentication
JWT_SECRET=your_jwt_secret_key_change_this
JWT_EXPIRE=7d
REGISTRATION_CODE=KANZULHUDA2026

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Week Configuration
WEEK_START_DAY=4  # 0=Sunday, 1=Monday, ..., 4=Thursday, 5=Friday, 6=Saturday
```

### Frontend Environment Variables

Vite automatically loads variables from `.env` files:

```
VITE_API_URL=http://localhost:5000/api
```

---

## Database Models

### User Model

```javascript
{
  username: String (unique, required),
  password: String (hashed, min 8 chars),
  fullName: String (required),
  email: String (unique, required),
  role: Enum ['admin', 'collector'] (default: 'collector'),
  status: Enum ['active', 'inactive'] (default: 'active'),
  lastLogin: Date,
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

**Roles:**

- **admin**: Full access to all features, can create users
- **collector**: Can create members and submissions, limited admin features

### Member Model

```javascript
{
  fullName: String (required),
  phoneNumber: String (unique, required, E.164 format),
  email: String (optional),
  country: String (required),
  city: String (optional),
  status: Enum ['active', 'inactive'] (default: 'active'),
  memberSince: Date (default: now),
  lastSubmissionDate: Date,
  totalLifetimeDurood: Number (default: 0),
  notes: String (optional),
  createdBy: ObjectId (ref: User, required),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- Text index on fullName, phoneNumber (for search)
- Index on status, country
- Index on lastSubmissionDate

### Submission Model

```javascript
{
  member: ObjectId (ref: Member, required),
  weekStartDate: Date (required),
  weekEndDate: Date (required),
  duroodCount: Number (required, min: 1, must be integer),
  submittedBy: ObjectId (ref: User, required),
  submissionDateTime: Date (default: now),
  notes: String (optional),
  lastModifiedBy: ObjectId (ref: User),
  lastModifiedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- Unique compound index on (member, weekStartDate) - prevents duplicate submissions
- Indexes on weekStartDate, submittedBy, submissionDateTime

---

## API Endpoints

### Authentication Endpoints

```
POST   /api/auth/register       - Register new user
POST   /api/auth/login          - User login
GET    /api/auth/me             - Get current user (protected)
POST   /api/auth/logout         - User logout (protected)
PUT    /api/auth/change-password- Change password (protected)
```

### Member Endpoints

```
GET    /api/members             - Get all members (protected)
GET    /api/members/:id         - Get member by ID (protected)
POST   /api/members             - Create new member (protected)
PUT    /api/members/:id         - Update member (protected)
DELETE /api/members/:id         - Delete member (protected - admin only)
GET    /api/members/search      - Search members (protected)
```

### Submission Endpoints

```
GET    /api/submissions         - Get submissions with filters (protected)
GET    /api/submissions/:id     - Get submission by ID (protected)
POST   /api/submissions         - Create new submission (protected)
PUT    /api/submissions/:id     - Update submission (protected)
DELETE /api/submissions/:id     - Delete submission (protected)
GET    /api/submissions/recent  - Get recent submissions (protected)
GET    /api/submissions/pending - Get pending members (protected)
```

### Stats Endpoints

```
GET    /api/stats/dashboard     - Get dashboard statistics (protected)
GET    /api/stats/leaderboard   - Get leaderboard data (protected)
GET    /api/stats/member/:id    - Get member statistics (protected)
GET    /api/stats/weekly        - Get weekly statistics (protected)
GET    /api/stats/monthly       - Get monthly statistics (protected)
```

### Report Endpoints

```
GET    /api/reports/export-csv  - Export data as CSV (protected)
GET    /api/reports/export-pdf  - Export data as PDF (protected)
POST   /api/reports/custom      - Generate custom report (protected)
```

### Health Check

```
GET    /api/health              - API health status (public)
```

---

## Frontend Components

### Page Components

#### Dashboard.jsx

- **Path:** `src/pages/Dashboard.jsx`
- **Purpose:** Main dashboard with statistics and overview
- **Features:**
  - Current week summary
  - Recent submissions list
  - Pending members list
  - Statistics cards
  - Progress indicators

#### LoginPage.jsx

- **Path:** `src/pages/LoginPage.jsx`
- **Purpose:** User authentication
- **Features:**
  - Username/password login
  - Form validation
  - Error handling
  - Auto-redirect on successful login

#### RegisterPage.jsx

- **Path:** `src/pages/RegisterPage.jsx`
- **Purpose:** New user registration
- **Features:**
  - User registration form
  - Password validation
  - Registration code verification
  - Auto-role assignment (first user = admin)

#### MembersPage.jsx

- **Path:** `src/pages/MembersPage.jsx`
- **Purpose:** Member management
- **Features:**
  - Member list with search and filters
  - Add new member form
  - Member details view
  - Member status management

### Context & State Management

#### AuthContext.jsx

- **Purpose:** Global authentication state
- **Provides:**
  - `user` - Current logged-in user
  - `token` - JWT authentication token
  - `loading` - Auth loading state
  - Methods: `login()`, `register()`, `logout()`

### Utility Functions

#### api.js

- **Purpose:** API communication wrapper
- **Functions:**
  - `apiCall()` - Generic API request handler
  - `formatNumber()` - Number formatting
  - `formatTimeAgo()` - Relative time display

---

## Features

### Current Features (v1.0.0)

1. **User Management**

   - User registration and login
   - Role-based access control (Admin/Collector)
   - Password change functionality
   - User session management

2. **Member Management**

   - Create, read, update, delete members
   - Search members by name or phone
   - Filter by status and country
   - Track member since date
   - View lifetime Durood total

3. **Submission Management**

   - Create weekly submissions
   - Update existing submissions
   - Delete submissions
   - View recent submissions
   - Prevent duplicate submissions per week

4. **Statistics & Analytics**

   - Dashboard overview
   - Weekly statistics
   - Monthly and yearly totals
   - Member-specific statistics
   - Progress percentage calculation

5. **Reports**

   - Export data to CSV
   - Export data to PDF
   - Custom report generation
   - Data aggregation

6. **Security**
   - JWT authentication
   - Password hashing with bcrypt
   - Rate limiting
   - CORS protection
   - Security headers (Helmet)
   - Input validation

### Planned Features

- Leaderboards
- Achievement badges
- Streak tracking
- Email notifications
- SMS notifications
- Advanced filters and sorting
- Member profile customization
- Dark/Light theme (IMPLEMENTING)
- Multi-language support
- Mobile app
- Offline submission capability

---

## Development Guide

### Running the Application

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
# Client runs on http://localhost:3000 (Vite default)
```

### Creating a New API Endpoint

1. **Create Controller Method** (`backend/controllers/`)

```javascript
export const newFeature = async (req, res) => {
  try {
    // Your logic here
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
```

2. **Create Route** (`backend/routes/`)

```javascript
import { protect } from '../middleware/auth.js'
import { newFeature } from '../controllers/controller.js'

router.get('/endpoint', protect, newFeature)
```

3. **Register Route** in `server.js`

```javascript
app.use('/api/route', routeFile)
```

4. **Use in Frontend**

```javascript
const response = await apiCall('/endpoint', {}, token)
```

### Database Migrations

Use the seed file to populate initial data:

```bash
npm run seed
```

### Testing API Endpoints

Use tools like:

- **Postman** - GUI API testing
- **curl** - Command line testing
- **Insomnia** - Modern API client

Example curl request:

```bash
curl -X GET http://localhost:5000/api/health
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'
```

---

## Deployment

### Backend Deployment (Node.js)

#### Option 1: Heroku

```bash
# Install Heroku CLI
heroku login
heroku create app-name
git push heroku main
```

#### Option 2: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

#### Option 3: VPS (DigitalOcean, AWS, Linode)

1. SSH into server
2. Install Node.js and MongoDB
3. Clone repository
4. Install dependencies
5. Configure environment variables
6. Use PM2 for process management:

```bash
npm install -g pm2
pm2 start server.js --name "kanz-api"
pm2 save
pm2 startup
```

### Frontend Deployment

#### Option 1: Vercel

```bash
npm install -g vercel
vercel --prod
```

#### Option 2: Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

#### Option 3: Docker + Nginx

```dockerfile
# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Troubleshooting

### Backend Issues

**MongoDB Connection Error**

```
Solution: Check MONGODB_URI in .env
- Local: mongodb://localhost:27017/kanz-ul-huda
- Atlas: mongodb+srv://user:pass@cluster.mongodb.net/dbname
```

**Port Already in Use**

```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9
# Or change PORT in .env
```

**JWT Token Expired**

```
Solution: User needs to login again
- Clear localStorage: localStorage.clear()
- Implement token refresh mechanism
```

### Frontend Issues

**CORS Error**

```
Solution: Check CORS_ORIGIN in backend .env
- Should match frontend URL
- For development: http://localhost:3000
```

**Components Not Rendering**

```
Solution:
- Clear node_modules: rm -rf node_modules && npm install
- Clear Vite cache: rm -rf .vite
- Restart dev server
```

**API Calls Failing**

```
Solution:
- Check backend is running on http://localhost:5000
- Verify API_URL in frontend environment
- Check network tab in DevTools
```

### Database Issues

**Duplicate Key Error**

```
Solution: Drop and recreate collection
db.users.drop()
npm run seed
```

**Data Not Persisting**

```
Solution:
- Verify MongoDB is running: mongod
- Check connection string
- Ensure write permissions
```

---

## Additional Resources

- **Express.js Documentation:** https://expressjs.com/
- **MongoDB Documentation:** https://docs.mongodb.com/
- **React Documentation:** https://react.dev/
- **Tailwind CSS:** https://tailwindcss.com/
- **JWT Authentication:** https://jwt.io/

---

## Support & Contact

For issues, questions, or feature requests, please contact the development team.

**Last Updated:** January 17, 2026
**Maintained By:** Development Team
