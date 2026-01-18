# Main Admin Hierarchy Implementation Guide

## Overview

The system now implements a three-tier user hierarchy:

1. **Main Admin** - Single user with super powers
   - Can change any user's role (Admin ↔ Collector)
   - Cannot have their own role changed
   - Always displayed with a 👑 Crown badge
   - Default email: `abdulhamid529589@gmail.com` (configurable via `MAIN_ADMIN_EMAIL` env var)

2. **Regular Admin** - Multiple admins
   - Can perform admin tasks
   - Cannot change other users' roles (only Main Admin can)
   - Cannot be demoted by other admins

3. **Collector** - Multiple users
   - Can submit data and view reports
   - Can be promoted to Admin (by Main Admin only)

---

## Setup Instructions

### Step 1: Update Environment Variables

Ensure your `.env` file has the main admin email configured:

```env
MAIN_ADMIN_EMAIL=abdulhamid529589@gmail.com
```

### Step 2: Run Migration Script

After deploying the changes, run the script to designate the main admin:

```bash
cd backend
npm run set-main-admin
```

**Output:**

```
✅ Connected to MongoDB
Setting main admin for email: abdulhamid529589@gmail.com
✅ Successfully set abdulhamid529589@gmail.com as main admin
User details:
  - Username: abdulhamid
  - Full Name: Abdul Hamid
  - Email: abdulhamid529589@gmail.com
  - Role: admin
  - Is Main Admin: true
```

---

## Database Changes

### User Schema Update

Added new field to `User` model:

```javascript
isMainAdmin: {
  type: Boolean,
  default: false,
}
```

**Migration Notes:**

- All existing admins will have `isMainAdmin: false`
- Only the main admin email will have `isMainAdmin: true`
- The migration script (`setMainAdmin.js`) handles this automatically

---

## Backend Changes

### Controller Update: `adminUserController.js`

**Updated `updateUser()` function:**

```javascript
// Only admin can change role and status
if (req.user.role === 'admin') {
  // Only main admin can change roles
  if (!req.user.isMainAdmin) {
    throw new AppError('Only the main admin can change user roles', 403)
  }

  // Cannot change main admin's role
  if (user.isMainAdmin && role && role !== user.role) {
    throw new AppError('Cannot change the main admin role', 403)
  }

  if (role && ['admin', 'collector'].includes(role)) {
    user.role = role
  }
  if (status && ['active', 'inactive'].includes(status)) {
    user.status = status
  }
}
```

**Features:**

- ✅ Checks if the current user is the main admin before allowing role changes
- ✅ Prevents changing the main admin's own role
- ✅ Regular admins cannot change any user roles
- ✅ Clear error messages for unauthorized attempts

---

## Frontend Changes

### AuthContext Update: `AuthContext.jsx`

Added new property to context value:

```javascript
isMainAdmin: user?.isMainAdmin || false,
```

**Usage:**

```javascript
const { token, isMainAdmin, user } = useAuth()
```

### AdminUserManagementPage Update

**Changes:**

1. **Import Crown icon:**

   ```javascript
   import { Crown } from 'lucide-react'
   ```

2. **Get main admin status:**

   ```javascript
   const { token, isMainAdmin, user: currentUser } = useAuth()
   ```

3. **Role change validation:**

   ```javascript
   const handleChangeRole = async (userId, newRole) => {
     if (!isMainAdmin) {
       showError('Only the main admin can change user roles')
       return
     }
     // ... rest of function
   }
   ```

4. **Role column UI:**
   - **For Main Admin user:** Shows a purple badge with 👑 crown icon and role name
   - **For other users (when logged in as Main Admin):** Shows enabled dropdown
   - **For other users (when logged in as Regular Admin):** Shows disabled dropdown with opacity

**Visual Example:**

```
Main Admin row:
  [👑 Admin]  <- Purple badge, non-interactive

Other user row (as Main Admin):
  [Dropdown: Collector/Admin]  <- Enabled

Other user row (as Regular Admin):
  [Dropdown: Collector/Admin]  <- Disabled (grayed out)
```

---

## API Endpoints

### Role Change Endpoint

**Endpoint:**

```
PUT /api/admin/users/:id
```

**Request Body:**

```json
{
  "role": "admin" | "collector"
}
```

**Possible Responses:**

✅ **200 OK** - Role changed successfully

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      /* updated user */
    }
  }
}
```

❌ **403 Forbidden** - Not authorized (Regular Admin trying to change role)

```json
{
  "success": false,
  "message": "Only the main admin can change user roles"
}
```

❌ **403 Forbidden** - Trying to change Main Admin's role

```json
{
  "success": false,
  "message": "Cannot change the main admin role"
}
```

---

## User Workflows

### Main Admin Changing a User's Role

1. Login as main admin
2. Go to **Admin** → **User Management**
3. Find the user to modify
4. Click the **Role dropdown** (enabled)
5. Select new role: **Admin** or **Collector**
6. Confirm the change

**Result:** User's role updated successfully ✅

### Regular Admin Trying to Change Role

1. Login as regular admin
2. Go to **Admin** → **User Management**
3. Find another user
4. Try to click role dropdown → **Disabled** (grayed out)
5. Tooltip shows: "Only main admin can change roles"

**Result:** Cannot change user roles ❌

### Main Admin Cannot Be Demoted

1. Go to **Admin** → **User Management**
2. Find the main admin user (with 👑 Crown badge)
3. Role displays as: **[👑 Admin]** (static badge, not a dropdown)
4. Cannot be modified

**Result:** Main admin status is protected ❌

---

## Error Handling

### Backend Errors

All errors are caught and logged:

1. **User trying to change role without being admin:**

   ```
   Error: You can only update your own profile
   Status: 403
   ```

2. **Regular admin trying to change user roles:**

   ```
   Error: Only the main admin can change user roles
   Status: 403
   ```

3. **Attempting to change main admin's role:**
   ```
   Error: Cannot change the main admin role
   Status: 403
   ```

### Frontend Error Display

Users see toast notifications:

- ✅ **Success:** "User role changed to admin"
- ❌ **Error:** "Only the main admin can change user roles"

---

## Security Features

✅ **Backend Validation:**

- Role changes only allowed by main admin
- Main admin cannot be demoted
- Proper authorization checks

✅ **Frontend Protection:**

- Role dropdown disabled for non-main-admin users
- Visual indication (👑 badge) for main admin
- Tooltip hints for disabled controls

✅ **Database Level:**

- `isMainAdmin` field immutable after initial setup
- Migration script ensures only one main admin

---

## Testing Checklist

- [ ] Main admin can see all users in User Management
- [ ] Main admin role dropdown is enabled for other users
- [ ] Main admin appears with 👑 Crown badge
- [ ] Main admin role cannot be changed (shows badge, not dropdown)
- [ ] Regular admin sees disabled role dropdowns
- [ ] Regular admin cannot change any user's role
- [ ] Changing role as main admin updates immediately
- [ ] Error message shows when regular admin tries to change role
- [ ] API returns 403 error for unauthorized role changes
- [ ] Database `isMainAdmin` field is properly set

---

## Troubleshooting

### Main admin cannot change roles after deployment

**Solution:**
Run the migration script:

```bash
cd backend
npm run set-main-admin
```

### Wrong user is set as main admin

**Solution:**

1. Update `MAIN_ADMIN_EMAIL` in `.env`
2. Run the script again:
   ```bash
   npm run set-main-admin
   ```

### Role dropdown still enabled for regular admin

**Solution:**

1. Clear browser cache
2. Logout and login again
3. Verify `isMainAdmin` is set correctly:
   ```javascript
   // In browser console
   console.log(JSON.parse(localStorage.getItem('user')))
   // Check: isMainAdmin should be true/false
   ```

### Migration script shows "User not found"

**Solution:**

1. Create the main admin user first via the register/admin interface
2. Ensure email matches `MAIN_ADMIN_EMAIL` in `.env`
3. Run script again

---

## Files Modified

### Backend

- ✅ `models/User.js` - Added `isMainAdmin` field
- ✅ `controllers/adminUserController.js` - Updated role change logic
- ✅ `package.json` - Added migration script command
- ✅ `scripts/setMainAdmin.js` - New migration script

### Frontend

- ✅ `context/AuthContext.jsx` - Added `isMainAdmin` property
- ✅ `pages/AdminUserManagementPage.jsx` - Updated UI and handlers

---

## Deployment Notes

1. **Database Migration:** Run `npm run set-main-admin` after deploying backend changes
2. **Frontend Build:** Rebuild frontend with updated components
3. **Environment:** Ensure `MAIN_ADMIN_EMAIL` is set in production `.env`
4. **Cache:** Clear browser cache if seeing old UI

---

## Future Enhancements

- [ ] Admin audit log for who changed which user's role
- [ ] Main admin change log to track promotions/demotions
- [ ] Bulk role change operations
- [ ] Scheduled role expiration
- [ ] Additional permission levels (Viewer, Editor, Moderator)
