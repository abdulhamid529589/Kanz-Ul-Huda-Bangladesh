# Registration Request Feature - API Testing Guide

## Postman Collection / cURL Examples

### Prerequisites

- Backend server running on `http://localhost:5000`
- MongoDB connected
- Email service configured in `.env`

---

## 1. Submit Registration Request (Public)

### Using cURL

```bash
curl -X POST http://localhost:5000/api/registration-requests/submit \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmed.hassan@example.com",
    "name": "Ahmed Hassan"
  }'
```

### Expected Success Response (201)

```json
{
  "success": true,
  "message": "Registration request submitted successfully. Please wait for admin approval.",
  "data": {
    "request": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "ahmed.hassan@example.com",
      "name": "Ahmed Hassan",
      "status": "pending",
      "createdAt": "2026-01-19T10:00:00.000Z"
    }
  }
}
```

### Error Response - Invalid Email

```json
{
  "success": false,
  "message": "Please enter a valid email"
}
```

### Error Response - Duplicate Request

```json
{
  "success": false,
  "message": "A registration request with this email is already pending"
}
```

### Error Response - Already Registered

```json
{
  "success": false,
  "message": "This email is already registered"
}
```

---

## 2. Check Email Approval Status (Public)

### Using cURL

```bash
curl http://localhost:5000/api/registration-requests/check/ahmed.hassan@example.com
```

### Response - Pending

```json
{
  "success": true,
  "message": "Email status retrieved",
  "data": {
    "approved": false,
    "status": "pending"
  }
}
```

### Response - Approved

```json
{
  "success": true,
  "message": "Email status retrieved",
  "data": {
    "approved": true,
    "status": "approved"
  }
}
```

### Response - Rejected

```json
{
  "success": true,
  "message": "Email status retrieved",
  "data": {
    "approved": false,
    "status": "rejected"
  }
}
```

### Response - Not Found

```json
{
  "success": true,
  "message": "Email not found in requests",
  "data": {
    "approved": false,
    "status": null
  }
}
```

---

## 3. Get All Registration Requests (Admin Only)

### Using cURL

```bash
# Basic request
curl http://localhost:5000/api/registration-requests \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# With filters
curl "http://localhost:5000/api/registration-requests?status=pending&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# With search
curl "http://localhost:5000/api/registration-requests?search=ahmed&page=1" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Combined filters
curl "http://localhost:5000/api/registration-requests?status=pending&search=ahmed&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Success Response

```json
{
  "success": true,
  "message": "Registration requests retrieved successfully",
  "data": {
    "requests": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "email": "ahmed.hassan@example.com",
        "name": "Ahmed Hassan",
        "status": "pending",
        "rejectionReason": null,
        "approvedAt": null,
        "approvedBy": null,
        "createdAt": "2026-01-19T10:00:00.000Z",
        "updatedAt": "2026-01-19T10:00:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "email": "fatima.khan@example.com",
        "name": "Fatima Khan",
        "status": "pending",
        "rejectionReason": null,
        "approvedAt": null,
        "approvedBy": null,
        "createdAt": "2026-01-19T09:30:00.000Z",
        "updatedAt": "2026-01-19T09:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "total": 15,
      "limit": 10
    }
  }
}
```

### Query Parameters

- `status` - Filter by status: `all`, `pending`, `approved`, `rejected`
- `search` - Search by email or name (substring match)
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10)

---

## 4. Get Single Request Details (Admin Only)

### Using cURL

```bash
curl http://localhost:5000/api/registration-requests/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Success Response

```json
{
  "success": true,
  "message": "Registration request retrieved successfully",
  "data": {
    "request": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "ahmed.hassan@example.com",
      "name": "Ahmed Hassan",
      "status": "pending",
      "rejectionReason": null,
      "approvedAt": null,
      "approvedBy": null,
      "createdAt": "2026-01-19T10:00:00.000Z",
      "updatedAt": "2026-01-19T10:00:00.000Z"
    }
  }
}
```

### Error Response - Not Found

```json
{
  "success": false,
  "message": "Registration request not found"
}
```

---

## 5. Approve Registration Request (Admin Only)

### Using cURL

```bash
curl -X PUT http://localhost:5000/api/registration-requests/507f1f77bcf86cd799439011/approve \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Success Response

```json
{
  "success": true,
  "message": "Registration request approved successfully",
  "data": {
    "request": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "ahmed.hassan@example.com",
      "name": "Ahmed Hassan",
      "status": "approved",
      "rejectionReason": null,
      "approvedAt": "2026-01-19T11:30:00.000Z",
      "approvedBy": "507f1f77bcf86cd799439099",
      "createdAt": "2026-01-19T10:00:00.000Z",
      "updatedAt": "2026-01-19T11:30:00.000Z"
    }
  }
}
```

### Error Response - Not Found

```json
{
  "success": false,
  "message": "Registration request not found"
}
```

### Error Response - Already Approved

```json
{
  "success": false,
  "message": "Cannot approve a approved request"
}
```

---

## 6. Reject Registration Request (Admin Only)

### Using cURL

```bash
curl -X PUT http://localhost:5000/api/registration-requests/507f1f77bcf86cd799439011/reject \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionReason": "Email domain verification failed"
  }'
```

### Success Response

```json
{
  "success": true,
  "message": "Registration request rejected successfully",
  "data": {
    "request": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "ahmed.hassan@example.com",
      "name": "Ahmed Hassan",
      "status": "rejected",
      "rejectionReason": "Email domain verification failed",
      "approvedAt": null,
      "approvedBy": "507f1f77bcf86cd799439099",
      "createdAt": "2026-01-19T10:00:00.000Z",
      "updatedAt": "2026-01-19T11:35:00.000Z"
    }
  }
}
```

### Error Response - Missing Reason

```json
{
  "success": false,
  "message": "Rejection reason is required"
}
```

### Error Response - Already Rejected

```json
{
  "success": false,
  "message": "Cannot reject a rejected request"
}
```

---

## 7. Get Registration Request Statistics (Admin Only)

### Using cURL

```bash
curl http://localhost:5000/api/registration-requests/stats/summary \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Success Response

```json
{
  "success": true,
  "message": "Registration request statistics retrieved",
  "data": {
    "stats": {
      "total": 25,
      "pending": 8,
      "approved": 14,
      "rejected": 3
    }
  }
}
```

---

## Complete Workflow Example

### Step 1: User Submits Request

```bash
curl -X POST http://localhost:5000/api/registration-requests/submit \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "name": "New User"
  }'

# Response: request._id = "REQUEST_ID_123"
```

### Step 2: User Checks Status

```bash
curl http://localhost:5000/api/registration-requests/check/newuser@example.com
# Response: { "approved": false, "status": "pending" }
```

### Step 3: Admin Views Requests

```bash
curl http://localhost:5000/api/registration-requests \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Step 4: Admin Approves Request

```bash
curl -X PUT http://localhost:5000/api/registration-requests/REQUEST_ID_123/approve \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Step 5: User Checks Status Again

```bash
curl http://localhost:5000/api/registration-requests/check/newuser@example.com
# Response: { "approved": true, "status": "approved" }
```

### Step 6: User Proceeds with Registration

```bash
curl -X POST http://localhost:5000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "SecurePass123",
    "fullName": "New User",
    "email": "newuser@example.com",
    "registrationCode": "KANZULHUDA2026"
  }'

# This will now succeed because email is approved!
```

---

## Error Handling Test Cases

### Test 1: Missing Required Fields

```bash
curl -X POST http://localhost:5000/api/registration-requests/submit \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Expected: 400 Bad Request
# Message: "Name is required"
```

### Test 2: Invalid Email Format

```bash
curl -X POST http://localhost:5000/api/registration-requests/submit \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email", "name": "Test"}'

# Expected: 400 Bad Request
# Message: "Please enter a valid email"
```

### Test 3: Duplicate Email

```bash
# First request succeeds
curl -X POST http://localhost:5000/api/registration-requests/submit \
  -d '{"email": "dup@example.com", "name": "Test"}'

# Second request with same email
curl -X POST http://localhost:5000/api/registration-requests/submit \
  -d '{"email": "dup@example.com", "name": "Test2"}'

# Expected: 400 Bad Request
# Message: "A registration request with this email is already pending"
```

### Test 4: Unauthorized Admin Access

```bash
curl http://localhost:5000/api/registration-requests \
  -H "Authorization: Bearer INVALID_TOKEN"

# Expected: 401 Unauthorized
```

### Test 5: Collector User Trying to Approve

```bash
curl -X PUT http://localhost:5000/api/registration-requests/REQUEST_ID/approve \
  -H "Authorization: Bearer COLLECTOR_TOKEN"

# Expected: 403 Forbidden
# Message: "You are not authorized to access this resource"
```

---

## Performance Testing

### Test Large Pagination

```bash
# Get page 100 with 50 results per page
curl "http://localhost:5000/api/registration-requests?page=100&limit=50" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Test Complex Search

```bash
# Search with filters
curl "http://localhost:5000/api/registration-requests?status=pending&search=ahmed&page=1&limit=100" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Test Statistics Calculation

```bash
# Get stats (should be fast even with 10,000+ requests)
curl http://localhost:5000/api/registration-requests/stats/summary \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Environment Variables for Testing

```bash
# Create a .env.test file
export NODE_ENV=test
export MONGODB_URI=mongodb://localhost:27017/kanzulhuda_test
export EMAIL_USER=test@gmail.com
export EMAIL_PASSWORD=test_password
export JWT_SECRET=test_secret
export CORS_ORIGIN=http://localhost:3000
```

---

## MongoDB Verification Queries

### Check Collections

```javascript
db.registrationrequests.countDocuments()
// Should return: number of requests

db.registrationrequests.find({ status: 'pending' }).count()
// Should return: number of pending requests
```

### Export Data

```javascript
db.registrationrequests.aggregate([
  {
    $group: {
      _id: '$status',
      count: { $sum: 1 },
    },
  },
  { $sort: { _id: 1 } },
])
```

### Find Specific Request

```javascript
db.registrationrequests.findOne({ email: 'ahmed.hassan@example.com' })
```

### Find All Pending from Last 24 Hours

```javascript
db.registrationrequests.find({
  status: 'pending',
  createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
})
```

---

## Rate Limiting Test

### Submit Multiple Requests Quickly

```bash
for i in {1..100}; do
  curl -X POST http://localhost:5000/api/registration-requests/submit \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"user$i@example.com\",\"name\":\"User $i\"}" &
done
wait

# After ~300 requests in 15 minutes:
# Expected: 429 Too Many Requests
```

---

## Response Time Benchmarks

Typical response times (measured in production):

- POST /submit: 100-200ms
- GET /check: 50-100ms
- GET /requests (with 1000 docs): 200-300ms
- PUT /approve: 150-250ms
- GET /stats: 300-400ms (aggregation)

---

## Headers Required

### For Public Endpoints

```
Content-Type: application/json
```

### For Admin Endpoints

```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

---

## Testing Checklist

- [ ] Submit registration request
- [ ] Validate confirmation email sent
- [ ] Check email approval status
- [ ] List all pending requests
- [ ] Filter by status
- [ ] Search by email/name
- [ ] Approve request
- [ ] Validate approval email sent
- [ ] Reject request with reason
- [ ] Validate rejection email sent
- [ ] Get statistics
- [ ] Test error scenarios
- [ ] Test rate limiting
- [ ] Test unauthorized access
- [ ] Test pagination
- [ ] Performance test
