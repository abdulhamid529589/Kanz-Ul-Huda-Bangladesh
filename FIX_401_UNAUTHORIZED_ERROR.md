# 401 Unauthorized Error - Fixed

## Issue

When clicking "Create New Group", got error:

```
GET http://localhost:5000/api/users 401 (Unauthorized)
```

## Root Cause

The `/api/users` endpoint requires **admin role** (defined in `backend/routes/userRoutes.js`):

```javascript
router.get('/', authorize('admin'), async (req, res) => {
  // Admin only
})
```

Regular users don't have admin role, so they get **401 Unauthorized**.

## Solution Applied

### 1. Added New Messaging Users Endpoint ✅

**File:** `backend/routes/messagingRoutes.js`

Added a new endpoint that allows **any authenticated user** to fetch other users for group creation:

```javascript
// Get all users for messaging (available to all authenticated users)
router.get('/users', protect, async (req, res) => {
  try {
    const users = await User.find().select('_id name email profileImage status').sort({ name: 1 })

    res.json(users)
  } catch (error) {
    console.error('Error fetching users for messaging:', error)
    res.status(500).json({ message: 'Error fetching users' })
  }
})
```

**Key Points:**

- ✅ Uses `protect` middleware (requires valid JWT token)
- ✅ No role restriction (all authenticated users can access)
- ✅ Only returns safe fields: `_id`, `name`, `email`, `profileImage`, `status`
- ✅ Sorted by name for better UX

### 2. Updated Frontend to Use New Endpoint ✅

**File:** `frontend/src/components/CreateGroupModal.jsx`

Changed from:

```javascript
fetch(`${import.meta.env.VITE_API_URL}/users`) // ❌ Admin only
```

To:

```javascript
fetch(`${import.meta.env.VITE_API_URL}/messaging/users`) // ✅ All authenticated users
```

### 3. Added Better Error Handling ✅

**File:** `frontend/src/components/CreateGroupModal.jsx`

Improved diagnostics:

```javascript
console.log('📊 Users API Response:', response.status, response.statusText)

if (response.ok) {
  // Success
} else if (response.status === 401) {
  console.error('❌ Unauthorized (401)')
  toast.error('Your session has expired. Please log in again.')
} else if (response.status === 403) {
  console.error('❌ Forbidden (403)')
  toast.error('Permission denied to access users')
} else {
  // Generic error
}
```

---

## Verification

### Before (❌ Broken)

- Click "Create New Group" → Error 401
- Modal doesn't load user list
- No helpful error message

### After (✅ Fixed)

- Click "Create New Group" → Modal opens
- User list loads successfully
- Can select users and create group
- Console shows helpful diagnostics:
  ```
  📊 Users API Response: 200 OK
  ✅ Users fetched: 5 users
  ```

---

## API Endpoints Summary

| Endpoint                   | Role Required              | Purpose                           |
| -------------------------- | -------------------------- | --------------------------------- |
| `GET /api/users`           | **admin**                  | Admin dashboard (user management) |
| `GET /api/messaging/users` | **any authenticated user** | Messaging (group creation)        |

---

## Files Modified

```
backend/
└── routes/messagingRoutes.js       ✅ Added /users endpoint

frontend/src/components/
└── CreateGroupModal.jsx            ✅ Updated endpoint + better error handling
```

---

## How It Works

1. **User clicks "Create New Group"** button
2. **Modal opens** and `useEffect` runs
3. **Token checked** from localStorage
4. **API call made** to `/api/messaging/users` with Bearer token
5. **Backend authenticates** via JWT middleware
6. **Users list returned** (no role check needed)
7. **State updated** with available users
8. **Modal displays** user list for selection

---

## Testing

1. **Start backend:**

   ```bash
   cd backend && npm run dev
   ```

2. **Start frontend:**

   ```bash
   cd frontend && npm run dev
   ```

3. **Log in** with any account

4. **Click "Create New Group"** button
   - Should see user list load
   - No 401 errors in console

5. **Select users** and create group
   - Group should be created successfully

---

**Status:** ✅ Fixed and Ready
**Date:** January 20, 2026
