# Main Admin Role Change Feature

## Overview

The main admin can now directly change the role of any existing user from **Collector** to **Admin** (and vice versa) using a dropdown selector in the User Management page.

## How It Works

### Main Admin Configuration

The main admin is identified by a fixed email address:

- **Default Email**: `abdulhamid529589@gmail.com`
- **Environment Variable**: `MAIN_ADMIN_EMAIL` (can override in `.env`)

To set a custom main admin email, add to your `.env` file:

```
MAIN_ADMIN_EMAIL=abdulhamid529589@gmail.com
```

### User Interface Changes

The User Management page now displays:

- **Role Column**: Shows a **dropdown selector** instead of a static badge
- Each user's role can be changed directly by:
  1. Clicking on the role dropdown
  2. Selecting a new role (Admin or Collector)
  3. Changes are saved immediately

### Updated Actions

**Old System:**

- Promote button (Collector → Admin)
- Demote button (Admin → Collector)

**New System:**

- Direct dropdown selector
- Admin/Collector roles selectable instantly
- Simplified interface with fewer clicks

## Backend Changes

### Constants (`backend/constants.js`)

```javascript
export const MAIN_ADMIN_EMAIL = process.env.MAIN_ADMIN_EMAIL || 'abdulhamid529589@gmail.com'
```

### Controller (`backend/controllers/adminUserController.js`)

- Main admin email imported and logged for audit trail
- `updateUser` endpoint now accepts `role` parameter
- Direct role changes supported

### Routes

- Uses existing `PUT /api/admin/users/:id` endpoint
- Accepts `role` parameter to change user role

## Frontend Changes

### AdminUserManagementPage.jsx

**New Handler:**

```javascript
const handleChangeRole = async (userId, newRole) => {
  // Changes user role via API
  // Shows success/error message
  // Refreshes user list
}
```

**Updated UI:**

- Role field changed from badge to dropdown
- Dropdown shows: Collector, Admin
- Actions buttons simplified (removed promote/demote)

## API Endpoint

### Change User Role

```
PUT /api/admin/users/:id
Body: {
  "role": "admin" | "collector"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "_id": "...",
      "email": "...",
      "role": "admin",
      "status": "active",
      ...
    }
  }
}
```

## Usage Example

### In User Management Page:

1. Go to **Admin: Users**
2. Find the user you want to change
3. Click on their **Role** dropdown
4. Select **Admin** or **Collector**
5. Role changes immediately
6. Success message appears

### Via API:

```bash
curl -X PUT http://localhost:5000/api/admin/users/USER_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

## Key Features

✅ **Instant Role Changes** - No need to promote then demote
✅ **Main Admin Control** - Main admin email is fixed and identifiable
✅ **Audit Trail** - All role changes are logged
✅ **Cleaner UI** - Single dropdown instead of multiple buttons
✅ **Flexible** - Main admin email can be configured via environment variable

## Security

- **Admin-only access** - Only admins can change user roles
- **Audit logging** - All changes logged with admin ID
- **Email validation** - Main admin identified by email
- **API validation** - Role must be 'admin' or 'collector'

## Configuration

### Set Main Admin Email

**Option 1: Environment Variable**

```bash
export MAIN_ADMIN_EMAIL=your-email@example.com
```

**Option 2: .env File**

```
MAIN_ADMIN_EMAIL=your-email@example.com
```

**Option 3: Default**
If not set, defaults to: `admin@kanzhuda.com`

## Logging

When role is changed, the following is logged:

```javascript
{
  action: "User updated",
  updatedBy: "ADMIN_ID",
  userId: "USER_ID",
  changes: {
    role: "admin|collector",
    status: "active|inactive"
  }
}
```

## Backward Compatibility

The old promote/demote endpoints still work:

- `PUT /api/admin/users/:id/promote-to-admin`
- `PUT /api/admin/users/:id/demote-to-collector`

But the frontend now uses the direct role change method for a cleaner experience.

## Testing

### Test Scenario 1: Change Collector to Admin

1. Login as main admin
2. Go to Admin: Users
3. Find a collector user
4. Click role dropdown
5. Select "Admin"
6. Verify role changes to Admin

### Test Scenario 2: Change Admin to Collector

1. Find an admin user (not the main admin)
2. Click role dropdown
3. Select "Collector"
4. Verify role changes to Collector

### Test Scenario 3: Verify Audit Trail

1. Check backend logs
2. Verify role change logged with admin ID

## Notes

- Main admin is identified by email, not by highest role
- Role changes are immediate, no confirmation dialogs
- All changes go through the same API endpoint
- Works with the existing permission system
