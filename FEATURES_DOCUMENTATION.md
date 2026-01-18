# Kanz ul Huda - Durood Collection System

## Complete Features Documentation

**Version:** 1.0.0
**Date:** January 17, 2026
**Last Updated:** January 17, 2026

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Core Features](#core-features)
3. [User Authentication](#user-authentication)
4. [Member Management](#member-management)
5. [Submissions System](#submissions-system)
6. [Dashboard & Analytics](#dashboard--analytics)
7. [Reports & Export](#reports--export)
8. [Leaderboard & Rankings](#leaderboard--rankings)
9. [Member Profiles](#member-profiles)
10. [User Interface Features](#user-interface-features)
11. [Technical Architecture](#technical-architecture)
12. [API Endpoints](#api-endpoints)
13. [Personal Reports Feature](#personal-reports-feature)

---

## Project Overview

The **Kanz ul Huda Durood Collection System** is a comprehensive digital platform designed to track and manage Durood (Islamic prayer phrase) recitation within a Dawah (Islamic outreach) team. The system provides:

- **Centralized Member Management** - Track all team members and their participation
- **Submission Tracking** - Record Durood counts for team members by week
- **Analytics & Reporting** - Comprehensive statistics and exportable reports
- **Gamification** - Rankings, achievements, and leaderboards to motivate participation
- **Team Accountability** - Track which team member created each member record

**Primary Focus:** Bangladesh and South Asia region

---

## Core Features

### 1. Multi-User Support with Role-Based Access

- **Admin Role** - Full system access, user management
- **Collector Role** - Can create/manage members and submissions
- **User Accounts** - Each Dawah team member has individual login
- **Creator Tracking** - Every member record shows which user created it

### 2. Dark/Light Theme System

- **Automatic Detection** - Respects system preference (prefers-color-scheme)
- **Manual Toggle** - Users can switch themes with button in header
- **Persistent Storage** - Theme preference saved in localStorage
- **Full Coverage** - Dark mode applied to all pages and components
- **Smooth Transitions** - Animated theme switching with framer-motion

### 3. Responsive Design

- **Mobile-First** - Optimized for smartphones, tablets, and desktops
- **Sidebar Navigation** - Collapsible on mobile, sticky on desktop
- **Adaptive Layouts** - Cards and tables adjust to screen size
- **Touch-Friendly** - Buttons and inputs sized for touch interaction

---

## User Authentication

### Registration

- **Self-Registration** - Users can create new accounts
- **Required Fields:**
  - Username (unique)
  - Email (unique)
  - Full Name
  - Password (minimum requirements enforced)
  - Role selection

### Login

- **Email/Username Login** - Accept either credential
- **JWT Tokens** - Secure token-based authentication
- **Remember Me** - Optional persistent login
- **Rate Limiting** - 10 login attempts per 15 minutes (prevents brute force)
- **Error Handling** - Clear error messages for failed attempts

### Security Features

- **Password Hashing** - bcrypt encryption
- **JWT Expiration** - Tokens expire after set period
- **Protected Routes** - All API endpoints require authentication
- **CORS Protection** - Cross-origin requests validated
- **Helmet Middleware** - Security headers protection

### Password Management

- **Change Password** - Users can update passwords
- **Validation** - Old password verification required
- **Secure Storage** - Passwords never stored in plain text

---

## Member Management

### Create Members

- **Modal-Based Interface** - Clean form for adding new members
- **Required Information:**
  - Full Name
  - Phone Number (flexible format support)
  - Country (Bangladesh prioritized)
  - Status (Active/Inactive)
- **Optional Information:**
  - Email
  - City
  - Additional notes

### View & Edit Members

- **View Modal** - Read-only member details
- **Edit Modal** - Update member information
- **Creator Info** - Shows which user created the member
- **Timestamp** - Track when member was added

### Member Search & Filter

- **Search by Name** - Real-time name search
- **Search by Phone** - Find members by phone number
- **Filter by Status** - Active/Inactive members
- **Filter by Country** - Multi-country support
- **Pagination** - Handle large member lists

### Member Status Tracking

- **Active** - Member can receive submissions
- **Inactive** - Member excluded from weekly targets
- **Lifetime Statistics** - Total Durood count per member
- **Last Submission** - Track member activity

### Bulk Operations

- **Delete Member** - Confirmation dialog before deletion
- **Soft Delete** - Option to deactivate instead of delete

---

## Submissions System

### Create Submission

- **Quick Entry** - Form for recording Durood counts
- **Member Selection** - Dropdown of available members
- **Durood Count** - Numeric input for count
- **Notes** - Optional additional information
- **Weekly Auto-Assignment** - Submissions automatically assigned to current week

### Edit Submission

- **Update Counts** - Modify Durood numbers
- **Edit Notes** - Update submission notes
- **Version Tracking** - Track who modified the record

### Delete Submission

- **Confirmation Required** - Prevent accidental deletion
- **Timestamp Retained** - Keep historical record

### Submission Filtering

- **By Member** - View submissions for specific member
- **By Week** - Filter by week range
- **By Status** - Submitted/Pending
- **Search Functionality** - Full-text search

### Weekly System

- **Automatic Week Detection** - System calculates current week
- **Duplicate Prevention** - One submission per member per week
- **Week Display** - Shows week date range (e.g., Jan 15 - 21, 2026)
- **Customizable Week Start** - Configurable week start day (default: Thursday for Islamic calendar)

---

## Dashboard & Analytics

### Current Week Summary

- **Week Display** - Shows current week date range
- **Total Durood** - Sum of all submissions this week
- **Submission Count** - How many members submitted
- **Pending Count** - How many members haven't submitted
- **Progress Bar** - Visual representation of completion percentage
- **Animated Cards** - Smooth entrance animations on load

### Quick Statistics Cards

- **This Month Total** - Cumulative Durood for current month
- **This Year Total** - Cumulative Durood for current year
- **All Time Total** - Lifetime total across system
- **Icons & Colors** - Visual differentiation with color coding
- **Interactive** - Hover effects for engagement

### Pending Members Section

- **Active Only** - Shows only active members without submissions
- **Member Details** - Name and phone number
- **Contact Button** - Quick action to reach out
- **Empty State** - Celebratory message when all submitted
- **Max Display** - Shows top 10 pending members

### Recent Submissions

- **Live Updates** - Shows latest submissions first
- **Member Info** - Submitter name and submission time
- **Durood Count** - Highlighted count for each submission
- **Time Ago** - Relative time display (e.g., "7 hours ago")
- **Max Display** - Shows 10 most recent submissions

### Visual Features

- **Gradient Header** - Eye-catching primary color gradient
- **Backdrop Blur** - Modern glassmorphism design
- **Dark Mode Support** - Proper contrast in dark mode
- **Responsive Layout** - Adapts to all screen sizes

---

## Reports & Export

### Team Reports (Global Analytics)

#### 1. Overview Report

- **Key Metrics:**
  - Total members in system
  - Active vs. Inactive members
  - Total submissions recorded
  - All-time Durood total
  - Average per submission
- **Time Period Statistics:**
  - Weekly breakdown
  - Monthly summary
  - Yearly totals

#### 2. Members Report (Leaderboard)

- **Ranking Table:**
  - Rank position
  - Member name
  - Country
  - Total Durood count
  - Submission count
  - Average per submission
- **Sorting** - By durood count, submissions, or name
- **Visual Indicators** - Color-coded performance levels

#### 3. Detailed Submissions Report

- **Complete Data:**
  - Member name
  - Durood count
  - Week submitted
  - Submitter (who recorded it)
  - Submission date
  - Additional notes
- **Full Transparency** - Audit trail of all submissions

### Personal Reports (Individual User Reports)

#### Weekly Reports

- **Period:** Monday to Sunday of selected week
- **Summary Data:**
  - Total Durood collected by user
  - Number of submission entries
  - Number of unique members
  - Average Durood per submission
- **Detailed Table:** All submissions with member names, counts, dates, notes
- **Export Options:** CSV and JSON formats

#### Monthly Reports

- **Period:** All days in selected month
- **Summary Data:**
  - Total Durood collected by user
  - Number of submission entries
  - Number of unique members
  - Average Durood per submission
- **Detailed Table:** All submissions with member names, counts, dates, notes
- **Export Options:** CSV and JSON formats

#### Personal Report Features

- **Date Selection:** Choose any week or month to generate report
- **Summary Cards:** 4 animated cards showing key metrics
- **Detailed Table:** Complete submission breakdown
- **Statistics Section:** Summary of report metrics
- **User-Specific:** Only shows submissions made by logged-in user
- **Printable Format:** Easy to print or save

### Export Functionality

#### CSV Export

- **Format:** Comma-separated values
- **Compatible:** Excel, Google Sheets, etc.
- **All Data:** Includes all report rows
- **Headers:** Clear column names
- **Quoted Fields:** Handles special characters
- **Metadata:** Report type, period, generated by, date
- **Summary Section:** Totals and averages at bottom

#### JSON Export

- **Structured Format** - Organized data structure
- **Metadata:** Includes export timestamp, report type, generated by user
- **Complete Data:** All submission details with member info
- **API Compatible** - Can be used programmatically
- **Nested Objects** - Member data included inline
- **Summary Statistics:** Totals and calculated metrics

### Time Period Selection

- **Daily** - Current day submission
- **Weekly** - Current week data
- **Monthly** - Current month data
- **Yearly** - Current year data
- **Custom Range** - User-defined date ranges (future enhancement)

---

## Leaderboard & Rankings

### Timeframe Selection

- **This Month** - Current month rankings
- **This Quarter** - 3-month period rankings
- **This Year** - Calendar year rankings
- **All Time** - Lifetime rankings
- **Dynamic Filtering** - Recalculates based on selected timeframe

### Top 3 Featured Members

- **Visual Cards** - Large, prominent display
- **Medal Icons** - 🥇 🥈 🥉 medals
- **Gradient Backgrounds** - Gold, silver, bronze colors
- **Statistics Display:**
  - Member name
  - Country
  - Total Durood count
  - Submission count
- **Dark Mode** - Gradient variants for dark theme

### Full Rankings Table

- **Complete Leaderboard:**
  - Rank number (1-N)
  - Member name
  - Country
  - Total Durood
  - Submission count
  - Average per submission
- **Sorting** - By any column
- **Scrollable** - Handle large lists

### Achievement System

#### Badges Awarded

1. **🎖️ Durood Master** - 1000+ Durood total
2. **🏆 Dedicated Contributor** - 50+ submissions
3. **⭐ Top Performer** - Ranked in top 3
4. **🌟 Consistent Participant** - Submitted every week
5. **🚀 Rising Star** - Most improvement this month
6. **💎 Elite Member** - 5000+ Durood lifetime

#### Automatic Calculation

- **Real-Time Updates** - Badges update with new submissions
- **Visual Display** - Badges shown on member cards
- **Tooltip Info** - Hover to see badge criteria
- **Permanent Records** - Achievements never removed

---

## Member Profiles

### Profile Layout

- **Two-Column Design:**
  - Left: Members list with search/sort
  - Right: Selected member's detailed profile
- **Responsive** - Single column on mobile

### Members List

- **Search Functionality:**
  - Search by name (real-time)
  - Filter by status
  - Filter by country
- **Sorting Options:**
  - By total Durood (highest first)
  - By submission count
  - By name (alphabetical)
- **Click to Select** - Highlight profile in right column

### Profile Details

- **Header Card:**
  - Member name
  - Country
  - Status badge (Active/Inactive)
  - Total lifetime Durood
  - Member since date
- **Contact Information:**
  - Phone number
  - Email
  - City/Location
  - Created by (Dawah team member)
- **Statistics Section:**
  - Total Durood count
  - Submission count
  - Average per submission
  - Last submission date
- **Recent Submissions:**
  - Last 5 submissions
  - Durood count per submission
  - Submission dates
  - Week information

### Visual Features

- **Color Coding** - Status indicators
- **Icons** - Visual differentiation
- **Dark Mode** - Full support
- **Responsive Cards** - Adapts to screen size

---

## User Interface Features

### Navigation

- **Sidebar Menu:**
  - Dashboard
  - Members
  - Submissions
  - Reports
  - Leaderboard
  - Member Profiles
- **Active Indicator** - Current page highlighted
- **Mobile Collapsible** - Hidden on small screens
- **Smooth Animations** - Animated entrance/exit

### Header

- **Logo & Branding** - Mosque emoji (🕌) + title
- **User Info** - Current logged-in user name and role
- **Theme Toggle** - Sun/Moon icon for dark/light mode
- **Logout Button** - Red button for exit
- **Sticky Position** - Always visible when scrolling

### Animations

- **Entrance Animations** - Staggered card animations
- **Hover Effects** - Scale and color changes
- **Tab Transitions** - Smooth page switches
- **Icon Animations** - Rotating mosque emoji
- **Menu Animations** - Sliding sidebar on mobile
- **Button Feedback** - Press animations

### Color Scheme

- **Primary Color** - Blue (#0070e6)
- **Secondary Color** - Orange/Amber (#f59e0b)
- **Success** - Green (#22c55e)
- **Danger** - Red (#ef4444)
- **Dark Mode** - Gray scale (#1f2937 - #111827)

### Typography

- **Font:** Inter (system fallback)
- **Weights:** 300, 400, 500, 600, 700, 800, 900
- **Sizes:** Responsive scaling

### Icons

- **Lucide React** - Main icon library
- **React Icons** - Additional icon sets
- **Custom Emojis** - For achievements/badges

---

## Technical Architecture

### Frontend Stack

- **Framework:** React 19.2.0
- **State Management:** Context API (useAuth, useTheme)
- **Styling:** Tailwind CSS 4.1.18 with dark mode
- **Animations:** Framer Motion 11.x
- **Icons:** Lucide React + React Icons
- **Build Tool:** Vite 7.2.4
- **API Client:** Fetch API with custom apiCall utility

### Backend Stack

- **Runtime:** Node.js
- **Framework:** Express.js 5.2.1
- **Database:** MongoDB with Mongoose 9.1.4
- **Authentication:** JWT (jsonwebtoken)
- **Security:** Helmet, CORS, Rate Limiting
- **Middleware:** Compression, Morgan logging

### Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.jsx (Navigation & structure)
│   │   └── ThemeToggle.jsx (Dark/Light mode)
│   ├── context/
│   │   ├── AuthContext.jsx (Authentication state)
│   │   └── ThemeContext.jsx (Theme state)
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Members.jsx
│   │   ├── Submissions.jsx
│   │   ├── Reports.jsx
│   │   ├── Leaderboard.jsx
│   │   └── MemberProfiles.jsx
│   ├── utils/
│   │   └── api.js (API utility functions)
│   └── index.css (Tailwind + custom styles)

backend/
├── controllers/ (Business logic)
├── models/ (Database schemas)
├── routes/ (API endpoints)
├── middleware/ (Auth, validation)
└── utils/ (Helper functions)
```

---

## API Endpoints

### Authentication Routes

```
POST   /api/auth/register      - Create new user account
POST   /api/auth/login         - Login with email/username
GET    /api/auth/me            - Get current user info (Protected)
POST   /api/auth/logout        - Logout (Protected)
PUT    /api/auth/change-password - Change password (Protected)
```

### Members Routes

```
GET    /api/members            - List all members (with filters)
GET    /api/members/:id        - Get single member details
POST   /api/members            - Create new member (Protected)
PUT    /api/members/:id        - Update member (Protected)
DELETE /api/members/:id        - Delete member (Protected)
```

### Submissions Routes

```
GET    /api/submissions        - List submissions (with filters)
GET    /api/submissions/:id    - Get single submission
POST   /api/submissions        - Create new submission (Protected)
PUT    /api/submissions/:id    - Update submission (Protected)
DELETE /api/submissions/:id    - Delete submission (Protected)
```

### Statistics Routes

```
GET    /api/stats/dashboard    - Dashboard statistics
GET    /api/stats/leaderboard  - Rankings data
GET    /api/stats/summary      - Quick summary stats
```

### Reports Routes

```
GET    /api/reports/overview   - Overview report
GET    /api/reports/members    - Members report
GET    /api/reports/submissions - Detailed submissions
```

### Rate Limiting

- **Auth Endpoints:** 10 attempts per 15 minutes
- **Other Endpoints:** 300 requests per 15 minutes
- **Skip Successful:** Login doesn't count after success

---

## Browser Support

- **Modern Browsers:** Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Browsers:** iOS Safari, Chrome Android
- **Minimum:** ES6+ JavaScript support required

---

## Performance Features

- **Code Splitting:** Route-based splitting via Vite
- **Image Optimization:** Lazy loading for images
- **Compression:** Gzip compression enabled
- **Caching:** Browser caching headers
- **Debouncing:** Search input debounced (300ms)
- **Pagination:** Large lists paginated

---

## Security Features

- **HTTPS Required** - In production
- **CORS Validation** - Whitelist origin domains
- **JWT Tokens** - Secure token-based auth
- **Rate Limiting** - DDoS protection
- **Helmet Headers** - Security headers
- **Input Validation** - Client-side and server-side
- **SQL Injection Protection** - Mongoose parameterized queries
- **XSS Protection** - React auto-escaping

---

## Future Enhancement Ideas

1. **Email Notifications** - Reminder emails for pending submissions
2. **Advanced Search** - Filter by date ranges, durood count ranges
3. **Team Management** - Create sub-teams/groups
4. **Motivational Messages** - Automated encouragement messages
5. **Mobile App** - Native iOS/Android app
6. **Batch Import** - CSV import for members
7. **Scheduled Reports** - Auto-generated weekly reports
8. **Webhooks** - Integration with external systems
9. **API Keys** - For third-party integrations
10. **Audit Logs** - Track all system changes

---

## Support & Maintenance

### Default Credentials (for testing)

- Use registration form to create test accounts
- Admin account can be created first during setup

### Common Issues

**Q: Why am I getting a 429 error when logging in?**
A: Rate limiting is active. Wait 15 minutes before retrying, or check your internet connection.

**Q: Dark mode not working?**
A: Clear browser cache and localStorage. Check if "dark" class is applied to HTML element.

**Q: Member not showing in submissions?**
A: Member must have status "Active" to receive submissions.

---

## Personal Reports Feature

### Overview

Each user (Durood collector) can generate their own personal weekly and monthly reports to track their individual progress and contributions. This provides individual team members with insights into their personal Durood collection activities.

### Key Capabilities

#### Report Generation

- **Weekly Reports:** Summarizes submissions for a specific week (Monday-Sunday)
- **Monthly Reports:** Summarizes submissions for a specific month
- **Date Selection:** Choose any week or month to view historical data
- **Automatic Calculation:** System automatically calculates period date ranges

#### Report Contents

- **Period Information:** Clear display of report time period
- **Total Durood:** Sum of all Durood recitations recorded during period
- **Submissions Count:** Number of submission entries made
- **Members Count:** Number of unique members who received Durood
- **Average Per Submission:** Calculated metric for performance tracking

#### Detailed Submission Table

- Complete list of all submissions during period
- Member name for each submission
- Durood count values
- Submission date
- Notes/comments field
- Responsive table with hover effects

#### Summary Statistics

- 4-card layout with key metrics
- Formatted numbers with thousand separators
- Color-coded cards for visual distinction
- Animated entrance effects

#### Export Options

Users can export reports in two formats:

**CSV Format:**

- Compatible with Excel, Google Sheets
- Includes metadata header (report type, period, generated by, date)
- All submission details in rows
- Summary statistics section at bottom
- Filename: `Weekly-Report-YYYY-MM-DD.csv` or `Monthly-Report-YYYY-MM-DD.csv`

**JSON Format:**

- Structured data format with proper organization
- Includes metadata and summary statistics
- Useful for programmatic processing
- Filename: `Weekly-Report-YYYY-MM-DD.json` or `Monthly-Report-YYYY-MM-DD.json`

### User Interface

**Report Generator Card:**

- Report type selector (Weekly/Monthly)
- Date input field
- Generate Report button
- Clear, intuitive layout

**Results Display:**

- 4 summary cards with key metrics
- Export buttons (CSV and JSON)
- Detailed submissions table
- Summary statistics section
- Animation transitions between states

### Features & Characteristics

#### Data Filtering

- Reports filter submissions based on:
  - User who is logged in (personal reports only)
  - Selected week or month
  - Members that have submissions

#### Date Range Calculation

- **Weekly:** Finds Monday of selected week, ends on following Sunday
- **Monthly:** Includes all days in selected month (1st to last day)

#### Empty States

- Graceful handling when no submissions exist for period
- Clear message: "No submissions found for this period"
- Encourages user to check different time period

#### Responsive Design

- Works on desktop and mobile
- Adapts table layout for smaller screens
- Touch-friendly buttons and inputs
- Readable on all device sizes

#### Dark Mode Support

- Complete dark mode styling
- All components include dark variant classes
- Proper contrast for readability
- Consistent with application theme

### Technical Details

#### Data Sources

- Fetches from `/api/members` endpoint (all members)
- Fetches from `/api/submissions` endpoint (all submissions)
- Filters data client-side for instant generation
- Uses parallel API calls for performance

#### Rendering

- Uses React hooks (useState, useEffect, useCallback)
- Framer Motion animations for visual polish
- Responsive grid layouts (Tailwind CSS)
- Optimized re-renders with useCallback

#### File Generation

- CSV/JSON generation happens in browser (client-side)
- Uses Blob API for efficient file creation
- Automatic file download
- No server-side processing required

### Navigation

**Access:**

- Click "My Reports" in the main navigation sidebar
- Located between "Reports" and "Leaderboard" items
- Available only to authenticated users

**Return:**

- Use sidebar to navigate to other pages
- Report state is cleared when navigating away
- Generate new report on return

### Use Cases

**Individual Tracking:**

- Monitor personal Durood collection progress
- Identify peak weeks/months
- Track contributions to team

**Record Keeping:**

- Export reports for personal records
- Archive individual reports
- Maintain documentation trail

**Accountability:**

- Detailed submission records
- Timestamped entries
- Notes for context

**Team Leaders:**

- Review individual team member reports
- Understand workload distribution
- Identify high performers

### Animations & Polish

**Page Animations:**

- Header fade in + slide down
- Report generator card fade in + slide up
- Summary cards staggered slide in from left
- Export card fade in + slide up
- Submission table fade in + slide up
- Summary stats fade in + slide up

**Interactive Elements:**

- Hover effects on buttons (scale 1.05)
- Tap effects on buttons (scale 0.95)
- Smooth transitions between states
- Icon animations with color coding

### Future Enhancement Ideas

1. **Custom Date Ranges**
   - Allow selection of any arbitrary date range
   - "Last 30 days", "Last quarter" presets
   - Year-to-date option

2. **Comparison Reports**
   - Compare multiple weeks/months side-by-side
   - Trend analysis and visualization
   - Period-over-period growth metrics

3. **Charts & Visualizations**
   - Line charts showing trends
   - Bar charts for period comparisons
   - Pie charts for member distribution

4. **Scheduled Reports**
   - Automatic weekly/monthly generation
   - Email delivery of reports
   - Scheduled exports

5. **Filtering Options**
   - Filter submissions by member
   - Filter by notes keywords
   - Member category filtering

6. **Team Member Comparison**
   - Admin ability to view other users' reports
   - Comparative analysis across team
   - Performance benchmarking

7. **Report Templates**
   - Different report formats
   - Branded headers/footers
   - Custom field selection

### Browser Support

- **Chrome/Edge:** Full support, all features
- **Firefox:** Full support, all features
- **Safari:** Full support, all features
- **Mobile Browsers:** Responsive, full support

### Performance

- **Loading:** Spinner while fetching data
- **Generation:** Instant report generation (client-side)
- **Export:** Efficient file creation and download
- **Animations:** GPU-accelerated for smooth performance

### Related Pages

- **Reports Page:** Team-wide analytics and reports
- **Dashboard:** Overview of team statistics
- **Submissions Page:** Record Durood submissions
- **Member Profiles:** View individual member profiles

---

## Contact & Questions

For questions about this project or feature requests, contact the development team.

---

## Version History

| Version | Date         | Changes                                |
| ------- | ------------ | -------------------------------------- |
| 1.0.0   | Jan 17, 2026 | Initial release with all core features |

---

**Last Updated:** January 17, 2026
**Maintained By:** Kanz ul Huda Development Team
