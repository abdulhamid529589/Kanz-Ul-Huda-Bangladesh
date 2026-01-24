# Feature Access Guide

## 🔗 Direct Navigation URLs

### Advanced Search

```
Local: http://localhost:5173/advanced-search
Production: https://kanzulhuda.com/advanced-search
```

### Advanced Admin Analytics

```
Local: http://localhost:5173/admin-analytics
Production: https://kanzulhuda.com/admin-analytics
Note: Admin role required
```

---

## 📍 Navigation Menu Paths

### For All Authenticated Users

```
Sidebar Menu
├─ Dashboard           → /dashboard
├─ Members            → /members
├─ Submissions        → /submissions
├─ Reports            → /reports
├─ My Reports         → /personal-reports
├─ Leaderboard        → /leaderboard
├─ Member Profiles    → /profiles
├─ Advanced Search    → /advanced-search    ⭐ NEW
├─ Messages           → /messaging
├─ Settings           → /settings
│
└─ [Admin Section - if admin user]
   ├─ Admin Dashboard  → /admin-dashboard
   ├─ Admin: Analytics → /admin-analytics   ⭐ NEW
   ├─ Admin: Users     → /admin-users
   ├─ Admin: Members   → /admin-members
   └─ Admin: Settings  → /admin-settings
```

---

## 🎯 How to Access Features

### Method 1: Sidebar Navigation

1. Log in to the application
2. Look for "Advanced Search" in the main sidebar menu
3. Click to navigate to the search page
4. (For Analytics) Click "Admin: Analytics" in the Admin section if you're an admin

### Method 2: Direct URL

1. Copy the URL from above
2. Paste into browser address bar
3. Press Enter to navigate

### Method 3: React Router Navigation

```javascript
// From any component using useNavigate
import { useNavigate } from 'react-router-dom'

const navigate = useNavigate()
navigate('/advanced-search')
navigate('/admin-analytics')
```

---

## 🔐 Access Requirements

### Advanced Search

- ✅ **Requirement**: Active user authentication
- ✅ **Role**: Any authenticated user
- ✅ **Admin**: Can access (inherited)
- ❌ **Anonymous**: Cannot access (redirected to login)

### Advanced Admin Analytics

- ✅ **Requirement**: Active user authentication + Admin role
- ✅ **Role**: Admin only
- ❌ **Regular User**: Cannot access (redirected to dashboard)
- ❌ **Anonymous**: Cannot access (redirected to login)

---

## 🧭 Navigation Icons

### Advanced Search Icon

```
Icon: Search (from Lucide React)
Display Name: "Advanced Search"
Appears: In common navigation for all users
Position: Below "Member Profiles", above "Messages"
```

### Analytics Icon

```
Icon: TrendingUp (from Lucide React)
Display Name: "Admin: Analytics"
Appears: In admin navigation section
Position: Below "Admin Dashboard", above "Admin: Users"
```

---

## 📱 Mobile Navigation

### Hamburger Menu (Mobile View)

1. Tap the hamburger menu (≡) in top-left
2. Scroll through navigation items
3. Tap "Advanced Search" or "Admin: Analytics"
4. Menu automatically closes

### Desktop Navigation

- Sidebar always visible (unless in ultra-small viewport)
- Direct click on navigation item
- Instant navigation without page refresh

---

## 🔄 Route Configuration

### App.jsx Route Definitions

```jsx
// Advanced Search - Public Route (for authenticated users)
<Route
  path="/advanced-search"
  element={<AdvancedSearchPage />}
/>

// Advanced Analytics - Protected Route (admin only)
<Route
  path="/admin-analytics"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminAnalyticsPage />
    </ProtectedRoute>
  }
/>
```

### Layout.jsx Navigation Configuration

```jsx
// Common navigation (all authenticated users)
const commonNavigation = [
  // ... other items ...
  {
    id: 'advanced-search',
    path: '/advanced-search',
    name: 'Advanced Search',
    icon: Search,
  },
  // ... other items ...
]

// Admin navigation (admin users)
const adminNavigation = [
  // ... other items ...
  {
    id: 'admin-analytics',
    path: '/admin-analytics',
    name: 'Admin: Analytics',
    icon: TrendingUp,
  },
  // ... other items ...
]
```

---

## 🚦 Navigation Flow

### Advanced Search Access Flow

```
User clicks "Advanced Search"
    ↓
Check authentication token
    ↓
Token valid → Navigate to /advanced-search
    ↓
AdvancedSearchPage component loads
    ↓
User sees search interface
    ├─ Search type selector
    ├─ Query input
    ├─ Advanced filters
    └─ Results display
```

### Admin Analytics Access Flow

```
Admin clicks "Admin: Analytics"
    ↓
Check authentication token
    ↓
Check user.role === 'admin'
    ↓
Both valid → Navigate to /admin-analytics
    ↓
AdminAnalyticsPage component loads
    ↓
Fetch submissions from API
    ↓
Generate analytics data
    ↓
Render charts and metrics
    ├─ Key metrics cards
    ├─ Trend chart
    ├─ Activity chart
    └─ Top contributors table
```

### Non-Admin User Tries to Access Analytics

```
Non-admin user navigates to /admin-analytics
    ↓
ProtectedRoute checks role
    ↓
user.role !== 'admin' → Redirect to /dashboard
    ↓
User sees dashboard instead
```

---

## 🔗 Related Component Links

### Advanced Search Component

**File**: `/frontend/src/pages/AdvancedSearchPage.jsx`

**Props**: None (uses hooks for state management)

**Dependencies**:

- useAuth() - from AuthContext
- apiCall() - from utils/api
- useState, useEffect, useCallback - from React

**Exports**:

```javascript
export default AdvancedSearchPage
```

### Admin Analytics Component

**File**: `/frontend/src/pages/AdminAnalyticsPage.jsx`

**Props**: None (uses hooks for state management)

**Dependencies**:

- useAuth() - from AuthContext
- apiCall() - from utils/api
- Recharts components
- useState, useEffect - from React

**Exports**:

```javascript
export default AdminAnalyticsPage
```

---

## 🎨 Component Structure

### AdvancedSearchPage Layout

```
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  <div className="max-w-7xl mx-auto">

    {/* Header */}
    <div className="header">
      <h1>Advanced Search</h1>
    </div>

    {/* Main Content */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Left Column - Search Controls */}
      <div className="col-span-2">
        <SearchTypeSelector />
        <SearchInput />
        <AdvancedFilters />
        <ResultsDisplay />
      </div>

      {/* Right Column - Sidebar */}
      <div>
        <SavedSearchesList />
      </div>

    </div>

  </div>
</div>
```

### AdminAnalyticsPage Layout

```
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  <div className="max-w-7xl mx-auto p-6">

    {/* Header */}
    <div className="header">
      <h1>Advanced Analytics</h1>
      <DateRangeSelector />
      <ExportButton />
    </div>

    {/* Metrics Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard />
      <MetricCard />
      <MetricCard />
      <MetricCard />
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TrendChart />
      <ActivityChart />
    </div>

    {/* Top Contributors */}
    <div className="mt-6">
      <TopContributorsTable />
    </div>

  </div>
</div>
```

---

## 🔍 Debugging Navigation Issues

### Issue: Advanced Search Link Not Appearing

**Solution**:

1. Verify user is logged in (check token)
2. Check browser console for JS errors
3. Verify Layout.jsx has the navigation item
4. Hard refresh browser (Ctrl+F5)

### Issue: Cannot Access Admin Analytics

**Solution**:

1. Verify user has admin role
2. Check backend API returns user with `role: 'admin'`
3. Verify ProtectedRoute is in App.jsx
4. Check user token is valid
5. Try logging out and back in

### Issue: Analytics Page Shows No Data

**Solution**:

1. Check backend API returns submissions data
2. Verify `/submissions` endpoint works
3. Check browser Network tab for API errors
4. Ensure database has submission data
5. Check Recharts library loaded correctly

---

## 📊 Data Flow Diagram

### Advanced Search Data Flow

```
User Input
    ↓
handleSearch()
    ↓
Build query parameters
    ↓
Call API endpoint (dynamic based on search type)
    ↓
API Response
    ↓
Update results[] state
    ↓
Re-render results table
    ↓
User sees results
```

### Analytics Data Flow

```
Component Mount
    ↓
fetchAnalytics()
    ↓
Call /submissions API
    ↓
Receive submissions array
    ↓
Process data:
  ├─ generateTrendData() → trend chart data
  ├─ generateUserActivity() → hourly activity
  └─ generateTopMembers() → top 10 list
    ↓
Calculate metrics:
  ├─ totalSubmissions = count
  ├─ totalDuroods = sum
  ├─ activeUsers = unique count
  └─ averageDuroods = total/count
    ↓
Update state with all data
    ↓
Render components with data
    ↓
User sees complete dashboard
```

---

## 🎯 Quick Navigation Reference

| Feature         | URL              | Route Name      | Access        |
| --------------- | ---------------- | --------------- | ------------- |
| Advanced Search | /advanced-search | advanced-search | Authenticated |
| Admin Analytics | /admin-analytics | admin-analytics | Admin Only    |

---

## 📚 Additional Resources

- [Implementation Summary](./ADVANCED_FEATURES_IMPLEMENTATION_SUMMARY.md)
- [Quick Reference Guide](./ADVANCED_FEATURES_QUICK_REFERENCE.md)
- [Verification Checklist](./ADVANCED_FEATURES_VERIFICATION.md)
- [Source: AdvancedSearchPage](../frontend/src/pages/AdvancedSearchPage.jsx)
- [Source: AdminAnalyticsPage](../frontend/src/pages/AdminAnalyticsPage.jsx)

---

**Last Updated**: 2024
**Status**: ✅ Complete
**Ready for**: Production Use
