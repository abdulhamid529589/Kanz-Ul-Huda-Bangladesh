# Reports System - Quick Reference Guide

## For Developers

### General Reports API

**Base URL**: `/api/reports`

- **Protected**: Yes (requires Bearer token)
- **Rate Limited**: Yes (1000 req/15 min)

```javascript
// Get all submissions
GET /api/reports/submissions?startDate=2024-01-01&endDate=2024-01-31&limit=500

// Get member rankings
GET /api/reports/member-stats?startDate=2024-01-01&endDate=2024-01-31

// Get dashboard overview
GET /api/reports/overview

// Get high-level summary
GET /api/reports/summary

// Export data
GET /api/reports/export?format=csv
GET /api/reports/export?format=json
```

### Personal Reports API

**Base URL**: `/api/personal-reports`

- **Protected**: Yes (requires Bearer token)
- **Rate Limited**: Yes (1000 req/15 min)
- **Scope**: Current user's data only

```javascript
// Get current week's report (current user)
GET /api/personal-reports/weekly?startDate=2024-01-15

// Get monthly report (current user)
GET /api/personal-reports/monthly?month=1&year=2024

// Get user's summary statistics
GET /api/personal-reports/summary?startDate=2024-01-01&endDate=2024-01-31

// Export personal report
GET /api/personal-reports/export?format=csv&reportType=weekly&startDate=2024-01-15
GET /api/personal-reports/export?format=json&reportType=monthly&month=1&year=2024
```

---

## Data Structure Reference

### General Reports - Overview Response

```json
{
  "success": true,
  "message": "Overview statistics retrieved successfully",
  "data": {
    "currentWeek": {
      "total": 1500,
      "submissions": 12,
      "startDate": "2024-01-13T00:00:00.000Z",
      "endDate": "2024-01-19T23:59:59.999Z"
    },
    "previousWeek": {
      "total": 1200,
      "submissions": 10
    },
    "month": {
      "total": 5000,
      "submissions": 42
    },
    "members": {
      "total": 50,
      "submitted": 12,
      "pending": 38,
      "progressPercentage": "24.0"
    },
    "growth": 25.0
  }
}
```

### General Reports - Member Stats Response

```json
{
  "success": true,
  "message": "Member statistics retrieved successfully",
  "data": {
    "stats": [
      {
        "rank": 1,
        "name": "Ahmed Hassan",
        "email": "ahmed@example.com",
        "phoneNumber": "+20123456789",
        "country": "Egypt",
        "totalDurood": 250,
        "submissionCount": 5
      }
    ],
    "total": 50
  }
}
```

### Personal Reports - Weekly Response

```json
{
  "success": true,
  "message": "Weekly report retrieved successfully",
  "data": {
    "report": {
      "type": "Weekly",
      "period": "1/13/2024 (Sat) - 1/19/2024 (Fri)",
      "startDate": "2024-01-13T00:00:00.000Z",
      "endDate": "2024-01-19T23:59:59.999Z",
      "totalDurood": 500,
      "submissions": 5,
      "uniqueMembers": 3,
      "avgPerSubmission": "100",
      "details": [
        {
          "id": "submissionId",
          "memberName": "Member Name",
          "email": "member@example.com",
          "phoneNumber": "+20123456789",
          "country": "Egypt",
          "duroodCount": 100,
          "date": "2024-01-15T10:30:00.000Z",
          "notes": "Submission notes"
        }
      ]
    }
  }
}
```

---

## Frontend Integration

### Using General Reports API

```javascript
import { apiCall } from '../utils/api'

// In component:
const [stats, setStats] = useState(null)

const fetchData = async () => {
  const res = await apiCall('/reports/overview', {}, token)
  if (res.ok) {
    setStats(res.data.data)
  }
}

// Access data:
stats.members.total
stats.currentWeek.total
stats.previousWeek.total
```

### Using Personal Reports API

```javascript
import { apiCall } from '../utils/api'

// Weekly report:
const res = await apiCall(`/personal-reports/weekly?startDate=2024-01-15`, {}, token)
const report = res.data.data.report

// Access data:
report.totalDurood
report.submissions
report.details.map((d) => d.memberName)
```

---

## Common Errors & Fixes

### Error: "Unauthorized"

**Cause**: Missing or invalid token
**Fix**: Ensure Bearer token is included in Authorization header

### Error: "No data found"

**Cause**: No submissions in date range or no members created by user
**Fix**: Check date range, verify member creation by current user

### Error: "Invalid date format"

**Cause**: Date not in ISO format (YYYY-MM-DD)
**Fix**: Use `new Date().toISOString().split('T')[0]` for current date

### Error: CSV/JSON download fails

**Cause**: Missing format parameter or invalid format
**Fix**: Use `format=csv` or `format=json`, check URL encoding

---

## Database Models Used

### Submission

```javascript
{
  _id: ObjectId,
  member: { ref: 'Member' },
  duroodCount: Number,
  weekStartDate: Date,
  weekEndDate: Date,
  createdBy: { ref: 'User' },
  notes: String,
  createdAt: Date
}
```

### Member

```javascript
{
  _id: ObjectId,
  fullName: String,
  email: String,
  phoneNumber: String,
  country: String,
  createdBy: { ref: 'User' },
  status: String,
  createdAt: Date
}
```

### User

```javascript
{
  _id: ObjectId,
  fullName: String,
  email: String,
  role: String,
  createdAt: Date
}
```

---

## Debugging Tips

### To debug backend reports:

1. Add console logs in reportController.js
2. Check MongoDB queries in Atlas
3. Verify member relationships in database
4. Test endpoints directly via Postman
5. Check server logs for errors

### To debug frontend reports:

1. Open browser DevTools → Network
2. Check API response in Network tab
3. Inspect reportData state in React DevTools
4. Check formatNumber utility for display issues
5. Verify dark mode CSS is applied

### Performance optimization:

- Add database indexes on frequently queried fields
- Use pagination for large result sets (limit parameter)
- Consider caching summary statistics
- Monitor API response times

---

## Maintenance Notes

### Weekly Tasks

- Monitor API response times
- Check error logs for issues
- Verify data accuracy in reports

### Monthly Tasks

- Review member rankings for data integrity
- Check export file generation
- Update statistics calculations if needed

### When Adding Features

- Update response structure documentation
- Add tests for new endpoints
- Update this reference guide
- Test with dark mode enabled

---

## File Locations

### Backend

- Report controllers: `/backend/controllers/reportController.js`, `personalReportController.js`
- Report routes: `/backend/routes/reportRoutes.js`, `personalReportRoutes.js`
- Utilities: `/backend/utils/errorHandler.js`, `weekHelper.js`, `logger.js`

### Frontend

- Reports page: `/frontend/src/pages/ReportsPage.jsx`
- Personal reports page: `/frontend/src/pages/PersonalReportsPage.jsx`
- API utilities: `/frontend/src/utils/api.js`
- Context: `/frontend/src/context/AuthContext.jsx`

### Documentation

- General reports: `/REPORT_PAGE_FIX_SUMMARY.md`
- Personal reports: `/PERSONAL_REPORTS_FIX_SUMMARY.md`
- Complete fix: `/COMPLETE_REPORTS_FIX_SUMMARY.md`
- This guide: `/REPORTS_QUICK_REFERENCE.md`

---

## Support & Issues

If you encounter issues:

1. Check this quick reference guide
2. Review detailed documentation in fix summary files
3. Check browser console for frontend errors
4. Check server logs for backend errors
5. Run database validation queries

For questions or contributions, refer to main documentation files.
