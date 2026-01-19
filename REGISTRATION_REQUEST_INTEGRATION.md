# Registration Request Feature - Integration Instructions

## Step 1: Update Login Page

Update your login page to show the registration request option.

### File: `frontend/src/pages/LoginPage.jsx`

Add this code to show registration options:

```jsx
{
  /* Registration Options */
}
;<div className="mt-6 pt-6 border-t border-gray-300">
  <p className="text-center text-gray-600 mb-4">New to Kanz ul Huda?</p>
  <button
    onClick={() => onSwitchToRegister()}
    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors mb-3"
  >
    Create Account
  </button>
  <button
    onClick={() => onSwitchToRegistrationRequest()}
    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
  >
    Submit Registration Request
  </button>
</div>
```

## Step 2: Update Register Page

Add a note about the new registration requirement.

### File: `frontend/src/pages/RegisterPage.jsx`

Add this note at the top of the form:

```jsx
{
  /* New Registration System Note */
}
;<div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <p className="text-sm text-blue-800">
    <strong>Note:</strong> Your email must be approved by admin before you can complete
    registration. If you haven't submitted a registration request yet, please{' '}
    <a href="#" className="underline font-semibold">
      submit one here
    </a>
    .
  </p>
</div>
```

## Step 3: Update Admin Dashboard

Add registration requests management to your admin panel.

### File: `frontend/src/pages/AdminSettingsPage.jsx` (or equivalent)

Import and add the component:

```jsx
import RegistrationRequestsPanel from '../components/RegistrationRequestsPanel'

// In your admin component, add a new section:
{
  activeTab === 'registration-requests' && <RegistrationRequestsPanel />
}

// Add to navigation:
;<button
  onClick={() => setActiveTab('registration-requests')}
  className={`px-4 py-2 ${activeTab === 'registration-requests' ? 'bg-blue-600 text-white' : 'bg-gray-200'} rounded`}
>
  Registration Requests
</button>
```

## Step 4: Update App Router

Make sure your app routing includes the new page.

### File: `frontend/src/App.jsx`

Add this route:

```jsx
import RegistrationRequestPage from './pages/RegistrationRequestPage'

// In your route configuration:
{
  path: '/registration-request',
  element: <RegistrationRequestPage
    onSuccess={() => {
      // Redirect to login or show success message
      navigate('/login')
    }}
  />,
}
```

## Step 5: Update Navigation

Add links to the new registration request form.

### File: `frontend/src/components/Navbar.jsx` (or equivalent)

Add this for unauthenticated users:

```jsx
{
  !isLoggedIn && (
    <>
      <a href="/login" className="text-primary-600">
        Login
      </a>
      <a href="/register" className="text-primary-600">
        Register
      </a>
      <a href="/registration-request" className="text-primary-600">
        Submit Request
      </a>
    </>
  )
}
```

## Testing the Complete Flow

### 1. User Registration Request Submission

```bash
curl -X POST http://localhost:5000/api/registration-requests/submit \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe"
  }'
```

Expected response:

```json
{
  "success": true,
  "message": "Registration request submitted successfully",
  "data": {
    "request": {
      "_id": "...",
      "email": "user@example.com",
      "name": "John Doe",
      "status": "pending",
      "createdAt": "2026-01-19T..."
    }
  }
}
```

### 2. Check Email Approval Status

```bash
curl http://localhost:5000/api/registration-requests/check/user@example.com
```

Expected response:

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

### 3. Admin Get All Requests

```bash
curl http://localhost:5000/api/registration-requests \
  -H "Authorization: Bearer [admin-token]"
```

### 4. Admin Approve Request

```bash
curl -X PUT http://localhost:5000/api/registration-requests/[request-id]/approve \
  -H "Authorization: Bearer [admin-token]" \
  -H "Content-Type: application/json"
```

### 5. Try Registration After Approval

User can now use the regular registration flow with the registration code.

### 6. Admin Reject Request

```bash
curl -X PUT http://localhost:5000/api/registration-requests/[request-id]/reject \
  -H "Authorization: Bearer [admin-token]" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionReason": "Email domain not verified"
  }'
```

## Database Verification

You can verify the data in MongoDB:

```javascript
// Check registration requests
db.registrationrequests.find()

// Check statistics
db.registrationrequests.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])

// Find specific request
db.registrationrequests.findOne({ email: 'user@example.com' })
```

## Email Configuration

Make sure your email service is properly configured:

In `.env`:

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

Users should receive:

1. Confirmation email when they submit request
2. Approval email (if approved)
3. Rejection email with reason (if rejected)

## Common Issues & Solutions

### Issue: Email not sending

- Check `.env` configuration
- Verify Gmail app password (not regular password)
- Enable "Less secure app access" if using Gmail
- Check email logs with: `tail -f backend/logs/combined.log`

### Issue: User can't register even after approval

- Verify request status is "approved" in database
- Check if user is using correct email
- Ensure registration code is still valid

### Issue: Admin can't see requests

- Verify user has `role: 'admin'` in database
- Check JWT token is valid
- Ensure `Authorization` header is sent correctly

### Issue: Duplicate email error

- Check database for existing requests
- User can't submit request twice with same email
- Admin needs to reject old request first

## Security Best Practices

1. **Rate Limiting**: Already applied to public endpoints
2. **Email Verification**: OTP still required after approval
3. **Admin Protection**: Approval/rejection requires authentication
4. **Audit Trail**: All approvals/rejections logged with admin ID
5. **Email Validation**: Both frontend and backend validation

## Performance Optimization

The feature includes:

- Database indexes on `email` and `status` fields
- Pagination for admin list views
- Search and filter functionality
- Stats aggregation pipeline

## Monitoring

Monitor these metrics:

- Number of pending requests
- Approval rate (approved vs rejected)
- Time to approval
- Email delivery success rate

Add to your monitoring dashboard:

```javascript
GET / api / registration - requests / stats / summary
```

## Support

For issues or questions, refer to:

- `REGISTRATION_REQUEST_FEATURE.md` - Technical details
- `REGISTRATION_REQUEST_QUICKSTART.md` - Feature overview
