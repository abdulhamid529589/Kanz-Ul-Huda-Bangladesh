# Registration Request Feature - Implementation Guide

## Overview

This document describes the two-layer registration system that requires users to submit a registration request first, which must be approved by the main admin before they can proceed with account registration.

## Flow Diagram

```
1. User submits Registration Request (email + name)
                ↓
2. Request stored as "pending"
                ↓
3. Main Admin reviews requests
                ├→ Approves: Request status = "approved", user receives approval email
                └→ Rejects: Request status = "rejected", user receives rejection email with reason
                ↓ (Only if approved)
4. User can now use the existing registration flow with registration code
                ↓
5. User creates account and gains access
```

## Backend Components

### 1. Model: RegistrationRequest

**File:** `backend/models/RegistrationRequest.js`

```javascript
{
  email: String (unique, required),
  name: String (required),
  status: 'pending' | 'approved' | 'rejected' (default: 'pending'),
  rejectionReason: String | null,
  approvedAt: Date | null,
  approvedBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Controller: Registration Request Controller

**File:** `backend/controllers/registrationRequestController.js`

#### Endpoints:

**POST /api/registration-requests/submit** (Public)

- Submit a new registration request
- Request: `{ email, name }`
- Returns: Request object with status "pending"

**GET /api/registration-requests/check/:email** (Public)

- Check if email is approved for registration
- Returns: `{ approved: boolean, status: string }`

**GET /api/registration-requests** (Admin)

- Get all registration requests with pagination and filters
- Query params: `status`, `search`, `page`, `limit`
- Returns: Array of requests with pagination info

**GET /api/registration-requests/:id** (Admin)

- Get a specific registration request
- Returns: Request object with populated approvedBy info

**PUT /api/registration-requests/:id/approve** (Admin)

- Approve a registration request
- Returns: Updated request object
- Side effect: Sends approval email to user

**PUT /api/registration-requests/:id/reject** (Admin)

- Reject a registration request
- Request: `{ rejectionReason }`
- Returns: Updated request object
- Side effect: Sends rejection email with reason

**GET /api/registration-requests/stats/summary** (Admin)

- Get statistics about registration requests
- Returns: `{ total, pending, approved, rejected }`

### 3. Routes

**File:** `backend/routes/registrationRequestRoutes.js`

### 4. Email Service Updates

**File:** `backend/utils/emailService.js`

Three new email functions added:

1. **sendRegistrationRequestConfirmationEmail(email, name)**
   - Sent when user submits request
   - Confirms request received and is pending admin review

2. **sendRegistrationApprovedEmail(email, name)**
   - Sent when admin approves request
   - Instructs user to proceed with registration using registration code

3. **sendRegistrationRejectedEmail(email, name, reason)**
   - Sent when admin rejects request
   - Includes the rejection reason

### 5. Auth Controller Updates

**File:** `backend/controllers/authController.js`

Modified `requestOTP` function to:

1. Check if email is approved in RegistrationRequest collection
2. If not approved or not found: Reject with error message "Your email is not approved for registration. Please submit a registration request first."
3. Only proceed with OTP if email is approved

## Frontend Components

### 1. Registration Request Form

**File:** `frontend/src/pages/RegistrationRequestPage.jsx`

Features:

- Simple form with email and name fields
- Form validation
- Success/error messages
- Displays user-friendly instructions
- Submits to `/api/registration-requests/submit`

### 2. Admin Panel: Registration Requests

**File:** `frontend/src/components/RegistrationRequestsPanel.jsx`

Features:

- Statistics cards (Total, Pending, Approved, Rejected)
- Search and filter functionality
- Table view of all requests with:
  - Name, Email, Status, Submit Date
  - Approve/Reject buttons for pending requests
- Rejection modal for entering rejection reason
- Real-time updates after approval/rejection
- Pagination support

## Integration Steps

### Backend:

1. ✅ Created RegistrationRequest model
2. ✅ Created registrationRequestController with all functions
3. ✅ Created registrationRequestRoutes
4. ✅ Added new email templates to emailService
5. ✅ Updated authController to check approved requests
6. ✅ Added routes to server.js

### Frontend:

1. Create RegistrationRequestPage component (user submission)
2. Create RegistrationRequestsPanel component (admin management)
3. Update LoginPage to add link to registration request form
4. Update RegisterPage to show message about approval requirement
5. Add admin panel route to admin dashboard

## Usage Instructions

### For Regular Users:

1. Instead of registering directly, users click "Submit Registration Request"
2. Users fill in email and full name
3. Main admin receives the request and reviews it
4. User receives email confirmation that request is received
5. If approved:
   - User receives approval email
   - User can proceed with traditional registration (username, password, registration code)
6. If rejected:
   - User receives rejection email with reason
   - User cannot register with that email

### For Admin:

1. Navigate to Admin Dashboard → Registration Requests
2. View all pending, approved, and rejected requests
3. Use filters to find specific requests
4. Click "Approve" to approve a request
   - User immediately receives approval email
   - User can now proceed with registration
5. Click "Reject" to reject a request
   - Enter rejection reason in modal
   - User receives rejection email with reason

## Environment Variables

No new environment variables are needed. Uses existing:

- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `EMAIL_HOST`
- `EMAIL_PORT`

## API Response Format

All endpoints return standardized responses:

**Success Response:**

```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "..."
}
```

## Security Notes

1. **Rate Limiting:** General rate limiter applied to all routes
2. **Email Uniqueness:** Email must be unique in RegistrationRequest collection
3. **Status Transitions:** Only pending requests can be approved/rejected
4. **Admin Only:** Approval/rejection endpoints are protected with `authorize('admin')` middleware
5. **Email Verification:** New users still go through OTP verification

## Testing Checklist

- [ ] User submits registration request
- [ ] Admin receives request and can view it
- [ ] Admin can approve request
- [ ] User receives approval email
- [ ] User can proceed with registration using registration code
- [ ] Admin can reject request with reason
- [ ] User receives rejection email with reason
- [ ] User cannot register if request not approved
- [ ] Email uniqueness is enforced
- [ ] Stats dashboard shows correct counts
- [ ] Pagination works correctly
- [ ] Search/filter functionality works
- [ ] User cannot re-request with same email if pending
