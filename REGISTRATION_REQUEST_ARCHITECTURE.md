# Registration Request Feature - Architecture & Database Schema

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         KANZ UL HUDA                            │
│                    TWO-LAYER REGISTRATION SYSTEM                │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND LAYER                                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────┐      ┌──────────────────────┐              │
│  │  LoginPage            │      │  RegistrationRequest │              │
│  │  ├─ Login Button      │      │  Page               │              │
│  │  ├─ Register Button   │─────→│  ├─ Email Input    │              │
│  │  └─ Request Reg Btn   │───┐  │  ├─ Name Input     │              │
│  └────────────────────────┘   │  │  ├─ Submit         │              │
│                                │  │  └─ Success Msg   │              │
│                                │  └──────────────────────┘              │
│                                │         │                            │
│  ┌──────────────────────┐      │         │                            │
│  │  RegisterPage        │◄─────┘         │                            │
│  │  ├─ Username        │                 │                            │
│  │  ├─ Password        │     (Only if approved)                       │
│  │  ├─ Email           │                 │                            │
│  │  ├─ Reg Code        │◄────────────────┘                            │
│  │  └─ Submit          │                                              │
│  └──────────────────────┘                                              │
│                                                                          │
│  ┌──────────────────────────────────────┐                              │
│  │  AdminDashboard / RegistrationPanel  │                              │
│  │  ├─ Request List                      │                              │
│  │  ├─ Filter/Search                     │                              │
│  │  ├─ Approve Button                    │                              │
│  │  ├─ Reject Modal                      │                              │
│  │  └─ Statistics Cards                  │                              │
│  └──────────────────────────────────────┘                              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ REST API Calls
                                    │
┌──────────────────────────────────────────────────────────────────────────┐
│                          BACKEND API LAYER                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  RegistrationRequest Routes:                                           │
│  ├─ POST /api/registration-requests/submit (Public)                   │
│  ├─ GET /api/registration-requests/check/:email (Public)             │
│  ├─ GET /api/registration-requests (Admin)                           │
│  ├─ GET /api/registration-requests/:id (Admin)                       │
│  ├─ PUT /api/registration-requests/:id/approve (Admin)               │
│  ├─ PUT /api/registration-requests/:id/reject (Admin)                │
│  └─ GET /api/registration-requests/stats/summary (Admin)             │
│                                                                          │
│  Modified Auth Routes:                                                  │
│  └─ POST /api/auth/request-otp (Checks approval)                     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Database Operations
                                    │
┌──────────────────────────────────────────────────────────────────────────┐
│                          DATABASE LAYER                                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  RegistrationRequest Collection:                                        │
│  ├─ _id: ObjectId                                                       │
│  ├─ email: String (unique) ─→ Indexed                                  │
│  ├─ name: String                                                        │
│  ├─ status: String (pending/approved/rejected) ─→ Indexed              │
│  ├─ rejectionReason: String                                            │
│  ├─ approvedAt: Date                                                    │
│  ├─ approvedBy: ObjectId (ref: User)                                  │
│  ├─ createdAt: Date                                                     │
│  └─ updatedAt: Date                                                     │
│                                                                          │
│  User Collection (existing):                                            │
│  ├─ _id: ObjectId                                                       │
│  ├─ username: String                                                    │
│  ├─ email: String (unique)                                             │
│  ├─ password: String (hashed)                                          │
│  ├─ role: String (admin/collector)                                     │
│  └─ ... (other fields)                                                 │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Email Service
                                    │
┌──────────────────────────────────────────────────────────────────────────┐
│                        EMAIL SERVICE LAYER                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ├─ sendRegistrationRequestConfirmationEmail                           │
│  │  └─ Sent to user when submitting request                           │
│  │                                                                      │
│  ├─ sendRegistrationApprovedEmail                                      │
│  │  └─ Sent to user when admin approves                              │
│  │                                                                      │
│  └─ sendRegistrationRejectedEmail                                      │
│     └─ Sent to user when admin rejects with reason                   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION REQUEST FLOW                        │
└─────────────────────────────────────────────────────────────────────────┘

STEP 1: USER SUBMITS REQUEST
┌──────────────────────┐
│ User fills form:     │
│ - Email             │
│ - Full Name         │
│ Clicks "Submit"     │
└──────────────────────┘
           │
           ↓
┌──────────────────────────────────────────────┐
│ POST /api/registration-requests/submit       │
│ Request Body:                                │
│ {                                            │
│   "email": "user@example.com",              │
│   "name": "Ahmed Hassan"                    │
│ }                                            │
└──────────────────────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────────┐
│ Backend Validation:                          │
│ ✓ Email format valid                         │
│ ✓ Email not already registered              │
│ ✓ No pending request for this email         │
└──────────────────────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────────┐
│ Create RegistrationRequest:                  │
│ {                                            │
│   email: "user@example.com",                │
│   name: "Ahmed Hassan",                     │
│   status: "pending",                        │
│   createdAt: Date.now()                     │
│ }                                            │
└──────────────────────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────────┐
│ Send Confirmation Email to User:             │
│ Subject: Request Received                    │
│ Body: Your request is pending review...      │
└──────────────────────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────────┐
│ Return 201 Success Response                  │
│ "Registration request submitted"             │
└──────────────────────────────────────────────┘


STEP 2: ADMIN REVIEWS REQUEST
┌──────────────────────────────────────────────┐
│ Admin views requests:                        │
│ GET /api/registration-requests               │
│ ├─ Sees pending requests                    │
│ ├─ Searches by name/email                   │
│ └─ Filters by status                        │
└──────────────────────────────────────────────┘
           │
           ├─────────────────────────────┐
           │                             │
           ↓                             ↓
    ┌──────────────────┐    ┌──────────────────────┐
    │ APPROVE REQUEST  │    │  REJECT REQUEST      │
    └──────────────────┘    └──────────────────────┘
           │                             │
           ↓                             ↓
    ┌──────────────────────────────────────────────┐
    │ Update RegistrationRequest:                  │
    │ {                                            │
    │   status: "approved",                       │
    │   approvedAt: Date.now(),                   │
    │   approvedBy: admin._id                     │
    │ }                                            │
    └──────────────────────────────────────────────┘
           │                             │
           ↓                             ↓
    ┌──────────────────────────────────────────────┐
    │ Send Approval Email            Send Rejection Email │
    │ "Your request approved!"       "Request Rejected"  │
    │ "Proceed with registration"    "Reason: ..."       │
    └──────────────────────────────────────────────┘


STEP 3: USER REGISTERS (ONLY IF APPROVED)
┌──────────────────────────────────────────────┐
│ User goes to Register Page                   │
│ Fills form:                                  │
│ - Username                                   │
│ - Password                                   │
│ - Email (must be approved)                   │
│ - Registration Code                          │
└──────────────────────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────────┐
│ POST /api/auth/request-otp                   │
│                                              │
│ Validation:                                  │
│ 1. Registration code is valid               │
│ 2. Email not already registered             │
│ 3. Email has APPROVED request ← NEW!       │
│ 4. Email not in pending requests            │
└──────────────────────────────────────────────┘
           │
           ↓
    ┌─────────────────┐
    │ ✓ All Checks OK │
    └─────────────────┘
           │
           ↓
┌──────────────────────────────────────────────┐
│ Generate OTP & Send to Email                │
│ OTP valid for 10 minutes                    │
└──────────────────────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────────┐
│ User verifies OTP                            │
│ POST /api/auth/verify-otp                    │
│                                              │
│ Account Created ✓                            │
│ User assigned role (admin or collector)      │
└──────────────────────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────────┐
│ Send Welcome Email                           │
│ User can now login                           │
└──────────────────────────────────────────────┘
```

## Database Schema

### RegistrationRequest Collection

```javascript
db.registrationrequests.createIndex({ email: 1 }, { unique: true })
db.registrationrequests.createIndex({ status: 1 })

// Sample Document:
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "email": "user@example.com",
  "name": "Ahmed Hassan",
  "status": "pending",                    // pending, approved, rejected
  "rejectionReason": null,
  "approvedAt": null,
  "approvedBy": null,
  "createdAt": ISODate("2026-01-19T10:00:00.000Z"),
  "updatedAt": ISODate("2026-01-19T10:00:00.000Z")
}

// After Approval:
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "email": "user@example.com",
  "name": "Ahmed Hassan",
  "status": "approved",
  "rejectionReason": null,
  "approvedAt": ISODate("2026-01-19T11:30:00.000Z"),
  "approvedBy": ObjectId("507f1f77bcf86cd799439012"),  // Admin User ID
  "createdAt": ISODate("2026-01-19T10:00:00.000Z"),
  "updatedAt": ISODate("2026-01-19T11:30:00.000Z")
}

// After Rejection:
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "email": "user@example.com",
  "name": "Ahmed Hassan",
  "status": "rejected",
  "rejectionReason": "Domain not verified",
  "approvedAt": null,
  "approvedBy": ObjectId("507f1f77bcf86cd799439012"),  // Admin User ID
  "createdAt": ISODate("2026-01-19T10:00:00.000Z"),
  "updatedAt": ISODate("2026-01-19T11:30:00.000Z")
}
```

## API Response Examples

### Submit Registration Request

```json
POST /api/registration-requests/submit
Status: 201 Created

{
  "success": true,
  "message": "Registration request submitted successfully. Please wait for admin approval.",
  "data": {
    "request": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "Ahmed Hassan",
      "status": "pending",
      "createdAt": "2026-01-19T10:00:00.000Z"
    }
  }
}
```

### Check Email Approval

```json
GET /api/registration-requests/check/user@example.com
Status: 200 OK

{
  "success": true,
  "message": "Email status retrieved",
  "data": {
    "approved": false,
    "status": "pending"
  }
}
```

### Get All Requests (Admin)

```json
GET /api/registration-requests?status=pending&page=1&limit=10
Status: 200 OK

{
  "success": true,
  "message": "Registration requests retrieved successfully",
  "data": {
    "requests": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "email": "user1@example.com",
        "name": "Ahmed Hassan",
        "status": "pending",
        "createdAt": "2026-01-19T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "total": 1,
      "limit": 10
    }
  }
}
```

### Approve Request (Admin)

```json
PUT /api/registration-requests/507f1f77bcf86cd799439011/approve
Status: 200 OK

{
  "success": true,
  "message": "Registration request approved successfully",
  "data": {
    "request": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "Ahmed Hassan",
      "status": "approved",
      "approvedAt": "2026-01-19T11:30:00.000Z",
      "approvedBy": {
        "_id": "507f1f77bcf86cd799439012",
        "username": "admin",
        "email": "admin@example.com",
        "fullName": "Admin User"
      }
    }
  }
}
```

### Reject Request (Admin)

```json
PUT /api/registration-requests/507f1f77bcf86cd799439011/reject
Status: 200 OK

{
  "success": true,
  "message": "Registration request rejected successfully",
  "data": {
    "request": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "Ahmed Hassan",
      "status": "rejected",
      "rejectionReason": "Email domain not verified"
    }
  }
}
```

## Statistics Query Examples

### Get Request Statistics

```javascript
// API Response
GET /api/registration-requests/stats/summary

{
  "success": true,
  "message": "Registration request statistics retrieved",
  "data": {
    "stats": {
      "total": 15,
      "pending": 5,
      "approved": 8,
      "rejected": 2
    }
  }
}

// MongoDB Query
db.registrationrequests.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 }
    }
  }
])

// Result:
[
  { _id: "pending", count: 5 },
  { _id: "approved", count: 8 },
  { _id: "rejected", count: 2 }
]
```

## State Transitions

```
States: pending → (approved OR rejected)

Valid Transitions:
pending  ──Approve──→  approved  (✓ Can register)
pending  ──Reject───→  rejected  (✗ Cannot register)

Invalid Transitions:
approved ──Approve──→  (Not allowed)
approved ──Reject───→  (Not allowed)
rejected ──Approve──→  (Not allowed)
rejected ──Reject───→  (Not allowed)
```
