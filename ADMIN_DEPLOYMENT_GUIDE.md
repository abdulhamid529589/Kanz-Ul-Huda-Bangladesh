# Admin Features - Deployment Guide

## Pre-Deployment Checklist

### Code Review

- [x] All backend controllers implement proper error handling
- [x] All frontend components use proper state management
- [x] All API calls include authorization checks
- [x] All forms have validation
- [x] All user inputs are sanitized

### Security Review

- [x] Admin endpoints protected with `authorize('admin')` middleware
- [x] Passwords hashed with bcrypt
- [x] Rate limiting configured (1000 req/15 min)
- [x] CORS settings appropriate for production
- [x] No sensitive data logged
- [x] Audit trail logging implemented

### Testing Review

- [x] User management endpoints tested
- [x] Member management endpoints tested
- [x] Settings management endpoints tested
- [x] Frontend pages tested
- [x] Admin-only access verified
- [x] Role safeguards tested

## Deployment Steps

### Step 1: Backend Deployment

#### 1.1 Update Environment Variables

```bash
# .env file should include:
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_jwt_secret
NODE_ENV=production
PORT=5000
```

#### 1.2 Verify Database Connection

```bash
npm test  # Run test suite if available
```

#### 1.3 Run Database Migrations (if needed)

```bash
# Reset default settings
node backend/utils/seed.js --init-settings
```

#### 1.4 Deploy Backend

```bash
# Option 1: Vercel
vercel deploy

# Option 2: Traditional server
npm install
npm start

# Option 3: Docker
docker build -t kanz-backend .
docker run -e MONGODB_URI=... -p 5000:5000 kanz-backend
```

### Step 2: Frontend Deployment

#### 2.1 Update API Endpoints

Update `frontend/src/utils/api.js`:

```javascript
const BASE_URL = process.env.REACT_APP_API_URL || 'https://api.example.com'
```

#### 2.2 Build Frontend

```bash
cd frontend
npm install
npm run build
```

#### 2.3 Deploy Frontend

```bash
# Option 1: Vercel
vercel deploy

# Option 2: Netlify
netlify deploy --prod --dir=dist

# Option 3: Traditional server
npm run build
# Copy dist/ to web server
```

### Step 3: Post-Deployment

#### 3.1 Initialize Default Settings

```bash
# Call reset endpoint to initialize settings
curl -X POST https://api.example.com/api/admin/settings/reset/defaults \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

#### 3.2 Verify Admin Users Exist

```bash
# Check that at least one admin user exists
curl https://api.example.com/api/admin/users?role=admin \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

#### 3.3 Create Initial Admin if Needed

```bash
# Use direct database operation or:
# Create via user registration, then manually promote to admin
```

#### 3.4 Verify Admin Pages Load

1. Open frontend URL
2. Login as admin user
3. Check sidebar shows admin menu items
4. Click each admin page to verify load

#### 3.5 Test Key Functions

1. Create a test collector user
2. Promote to admin and back
3. Create test member
4. Bulk import test members
5. Update settings
6. Reset settings to defaults

## Rollback Plan

### If Backend Issues

```bash
# Revert to previous version
git revert HEAD
npm install
npm start
```

### If Frontend Issues

```bash
# Redeploy previous version
vercel deploy --prod --ref previous-tag
```

### If Database Issues

```bash
# Restore from backup
mongorestore --uri $MONGODB_URI --archive < backup.archive
```

## Monitoring Post-Deployment

### Server Health Checks

```bash
# Monitor error logs
tail -f backend/logs/error.log

# Monitor admin actions
grep "admin" backend/logs/combined.log
```

### Database Monitoring

1. Monitor MongoDB connection pool
2. Check for slow queries on admin endpoints
3. Monitor Settings collection size

### Frontend Monitoring

1. Check browser console for errors
2. Monitor network requests to admin endpoints
3. Check for failed API calls

## Performance Optimization

### Backend Optimization

1. Add database indexes:

```javascript
// User model indexes
db.users.createIndex({ role: 1, status: 1 })
db.users.createIndex({ username: 1 })
db.users.createIndex({ email: 1 })

// Member model indexes
db.members.createIndex({ name: 1 })
db.members.createIndex({ memberNo: 1 })

// Settings model indexes
db.settings.createIndex({ key: 1 })
db.settings.createIndex({ category: 1 })
```

2. Enable caching for settings:

```javascript
// Cache frequently accessed settings in memory
const settingsCache = {}
```

3. Paginate all list endpoints (already done)

### Frontend Optimization

1. Lazy load admin pages
2. Implement infinite scroll for large lists (optional)
3. Cache API responses client-side (optional)

## Security Checklist

- [x] All admin endpoints require authentication
- [x] All admin endpoints require admin role
- [x] Passwords are hashed before storage
- [x] API rate limiting enabled
- [x] CORS configured for production domain
- [x] No sensitive data in logs
- [x] No sensitive data in error messages
- [x] All inputs validated and sanitized
- [x] SQL injection prevention (using Mongoose)
- [x] XSS prevention (React escaping)

## Documentation Deployment

1. Update API documentation with admin endpoints
2. Add admin user guide to user documentation
3. Add admin features to feature list
4. Update README with admin capabilities

## Support & Training

### Admin User Training

Provide admins with:

1. [ADMIN_FEATURES_IMPLEMENTATION.md](./ADMIN_FEATURES_IMPLEMENTATION.md) - Feature overview
2. [ADMIN_TESTING_GUIDE.md](./ADMIN_TESTING_GUIDE.md) - How to use features
3. Video tutorials (optional)

### Support Resources

- [x] Admin features documentation
- [x] Testing guide for validation
- [x] API documentation
- [x] Troubleshooting guide

## Version Management

### Current Version

- Version: 1.0.0
- Date: 2024
- Status: Initial Production Release

### Future Updates

- Track changes in CHANGELOG.md
- Use semantic versioning
- Plan maintenance windows

## Disaster Recovery

### Backup Strategy

1. Daily MongoDB backups
2. Daily code repository backups
3. Keep 30-day backup history

### Recovery Procedures

1. Database recovery: `mongorestore`
2. Code recovery: `git revert`
3. Full stack recovery: Redeploy all services

## Sign-Off Checklist

Before declaring deployment complete:

- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] Admin users can login
- [ ] Admin menu visible to admins only
- [ ] All admin pages load
- [ ] Create user works
- [ ] Promote/demote users works
- [ ] Create/edit/delete members works
- [ ] Bulk import members works
- [ ] Edit settings works
- [ ] All API endpoints respond correctly
- [ ] Error handling works properly
- [ ] No console errors on frontend
- [ ] Rate limiting working
- [ ] Logs being written correctly
- [ ] Database operations fast (<500ms)
- [ ] Admin action audit trail working
- [ ] Backup and recovery tested

## Ongoing Maintenance

### Daily

- Monitor error logs
- Check admin action logs
- Verify admin pages accessible

### Weekly

- Review admin activities
- Check database performance
- Verify settings are being used correctly

### Monthly

- Update dependencies (if needed)
- Review and rotate logs
- Performance analysis
- Security audit

### Quarterly

- Full regression testing
- Performance optimization
- Security vulnerability scan
- User feedback collection

---

## Contact & Support

### Deployment Support

- Issue: File a GitHub issue with deployment tag
- Documentation: See related guides in this folder
- Questions: Check testing guide and implementation guide

### Emergency Contacts

- Database Issues: MongoDB support
- Backend Issues: Node.js/Express support
- Frontend Issues: React support
- Deployment Issues: Vercel/Netlify support

---

**Deployment Date**: [Today's Date]
**Deployed By**: [Your Name]
**Status**: ✅ Ready for Production
