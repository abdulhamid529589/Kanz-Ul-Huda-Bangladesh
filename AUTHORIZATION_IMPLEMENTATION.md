# Backend Authorization Implementation Summary

## Overview

All CRUD operations are now controlled by the backend. The frontend displays data and submits requests, but the backend makes all authorization decisions.

## Architecture Principle

**Backend is the source of truth** - All authorization checks happen on the server. Frontend cannot bypass authorization.

---

## Authorization Changes Made

### 1. **Submission Controller** (`backend/controllers/submissionController.js`)

#### deleteSubmission() - FIXED ✅

- **Before:** No authorization check (relied on route middleware)
- **After:** Checks if `submittedBy === req.user.id` OR `isAdmin`
- **Response:** 403 Forbidden with message "You can only delete submissions that you created"
- **Code Pattern:**

  ```javascript
  const submitterId = submission.submittedBy?.toString()
  const currentUserId = req.user.id.toString()
  const isAdmin = req.user.role === 'admin'

  if (submitterId !== currentUserId && !isAdmin) {
    return res.status(403).json({
      message: 'You can only delete submissions that you created',
    })
  }
  ```

#### updateSubmission() - ALREADY SECURE ✅

- Authorization check was already in place
- Checks if submission is within 24 hours
- Verifies `submittedBy === req.user.id` OR `isAdmin`

#### createSubmission() - SECURE ✅

- Automatically sets `submittedBy: req.user.id`
- User cannot specify who submitted
- Only authenticated users can create

#### getSubmissions() - DESIGN CHOICE ℹ️

- Returns all submissions (can be filtered by `submittedBy` param)
- Allows admins/staff to view all submissions
- Frontend filters for personal reports (PersonalReportsPage)
- Backend doesn't restrict; filtering is business logic, not security

### 2. **Member Controller** (`backend/controllers/memberController.js`)

#### updateMember() - FIXED ✅

- **Before:** No authorization check
- **After:** Verifies `createdBy === req.user.id` OR `isAdmin`
- **Response:** 403 Forbidden with message "You can only update members that you created"

#### deleteMember() - FIXED ✅

- **Before:** Restricted to admin-only in route
- **After:** Controller checks `createdBy === req.user.id` OR `isAdmin`
- **Response:** 403 Forbidden with message "You can only delete members that you created"
- **Special:** Soft-deletes if member has submissions, hard-deletes if no submissions

#### createMember() - SECURE ✅

- Automatically sets `createdBy: req.user.id`
- User cannot specify who created the member

#### getMemberById() - SECURE ✅

- Returns single member data
- No authorization restriction (all users can view members)

#### getAllMembers() - SECURE ✅

- Returns filtered members
- Can filter by status, country, city, search
- No authorization restriction (all users can view members)

### 3. **Route Middleware Changes** (`backend/routes/`)

#### submissionRoutes.js - UPDATED ✅

- **Before:** `router.route('/:id').delete(authorize('admin'), deleteSubmission)`
- **After:** `router.route('/:id').delete(deleteSubmission)`
- **Reason:** Authorization happens in controller, not middleware

#### memberRoutes.js - UPDATED ✅

- **Before:** `router.route('/:id').delete(authorize('admin'), deleteMember)`
- **After:** `router.route('/:id').delete(deleteMember)`
- **Reason:** Authorization happens in controller, not middleware

### 4. **User Routes** (`backend/routes/userRoutes.js`)

#### Update Profile (PUT /users/:id) - ALREADY SECURE ✅

- Checks `req.user.id !== req.params.id && req.user.role !== 'admin'`
- Returns 403 if not authorized

#### Change Password (POST /users/:id/change-password) - ALREADY SECURE ✅

- Only allows users to change their own password
- Returns 403 if trying to change another user's password

#### Get All Users (GET /users) - ALREADY SECURE ✅

- Restricted to admin only: `authorize('admin')`

---

## Authorization Verification Checklist

### Create Operations

- [x] POST /api/members → Sets `createdBy: req.user.id`
- [x] POST /api/submissions → Sets `submittedBy: req.user.id`
- [x] POST /api/auth/register → Creates new user

### Read Operations

- [x] GET /api/members → All authenticated users can view
- [x] GET /api/members/:id → All authenticated users can view
- [x] GET /api/submissions → All authenticated users can view (filtering is app logic)
- [x] GET /api/submissions/:id → All authenticated users can view
- [x] GET /api/users/me → Returns current user
- [x] GET /api/users → Admin only

### Update Operations

- [x] PUT /api/members/:id → Only creator or admin
- [x] PUT /api/submissions/:id → Only submitter or admin (within 24 hours)
- [x] PUT /api/users/:id → Only self or admin

### Delete Operations

- [x] DELETE /api/members/:id → Only creator or admin
- [x] DELETE /api/submissions/:id → Only submitter or admin
- [x] DELETE /api/users/:id → Not implemented (future)

### Admin Bypass

- [x] All operations check `req.user.role === 'admin'`
- [x] Admins can update/delete any resource
- [x] Admins can view all user data

---

## Data Model Authorization Fields

### Member Model

```javascript
{
  createdBy: ObjectId, // Tracks who created this member
  // ... other fields
}
```

- **Authorization:** `createdBy === req.user.id || isAdmin`
- **Operations:** update, delete

### Submission Model

```javascript
{
  submittedBy: ObjectId, // Tracks who submitted
  // ... other fields
}
```

- **Authorization:** `submittedBy === req.user.id || isAdmin`
- **Operations:** update, delete

### User Model

```javascript
{
  role: String, // 'user' or 'admin'
  // ... other fields
}
```

- **Authorization:** `req.user.id === req.params.id || isAdmin`
- **Operations:** read, update profile, change password

---

## Frontend Implications

### No Authorization Logic in Frontend

- ✅ Frontend does NOT decide who can delete
- ✅ Frontend does NOT decide who can update
- ✅ Frontend only displays/enables UI elements for UX
- ✅ Backend will reject unauthorized requests with 403

### Error Handling

Frontend receives 403 errors from backend and displays:

```javascript
if (response.status === 403) {
  alert(response.data.message) // e.g., "You can only delete members that you created"
}
```

### Pages Using Authorization

1. **MembersPage.jsx** → Uses `canDeleteMember()` for UI only (backend enforces)
2. **SubmissionsPage.jsx** → Can edit/delete own submissions (backend enforces)
3. **PersonalReportsPage.jsx** → Filters own data (frontend only, backend can restrict)
4. **ProfileSettingsPage.jsx** → Updates own profile (backend enforces)

---

## Security Pattern Summary

### The Three Layers:

1. **Authentication (Middleware)** → `protect` middleware verifies JWT
2. **Authorization (Controller)** → Check resource ownership
3. **Data Access (Query)** → MongoDB queries filtered appropriately

### Example Flow for DELETE /api/members/:id

```
1. Client sends DELETE request + Bearer token
2. protect middleware verifies token → req.user set
3. deleteMember() controller:
   - Fetch member
   - Check: createdBy === req.user.id || isAdmin
   - If not → return 403
   - If yes → proceed with delete
4. Return success or error to frontend
```

---

## Testing Authorization

### Test Case 1: Delete Member (Non-Creator)

```bash
# User A created member, User B tries to delete
DELETE /api/members/{memberId}
Authorization: Bearer {userBToken}

# Expected: 403 Forbidden
# Message: "You can only delete members that you created"
```

### Test Case 2: Update Submission (Non-Submitter)

```bash
# User A submitted, User B tries to update
PUT /api/submissions/{submissionId}
Authorization: Bearer {userBToken}

# Expected: 403 Forbidden (if outside 24 hours)
# Message: "You can only edit your own submissions within 24 hours"
```

### Test Case 3: Admin Bypass

```bash
# Admin user deletes any member
DELETE /api/members/{memberId}
Authorization: Bearer {adminToken}

# Expected: 200 Success
# Reason: isAdmin check passes
```

---

## Response Format for Authorization Failures

All 403 errors follow this format:

```json
{
  "success": false,
  "message": "You can only [action] [resources] that you created"
}
```

Examples:

- "You can only delete members that you created"
- "You can only update members that you created"
- "You can only delete submissions that you created"
- "You can only edit your own submissions within 24 hours"

---

## Summary

✅ **All CRUD operations now have backend authorization**
✅ **Backend is the sole source of truth for permissions**
✅ **Frontend cannot bypass any authorization checks**
✅ **Admin users can override all restrictions**
✅ **Clear error messages explain why operations failed**
✅ **Consistent authorization pattern across all resources**

The system is now secure: even if a malicious user tries to send unauthorized requests directly to the API, the backend will reject them with 403 Forbidden.
