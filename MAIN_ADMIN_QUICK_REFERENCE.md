# Main Admin Hierarchy - Quick Reference

## 🚀 Quick Start (5 minutes)

### 1. Deploy & Migrate (Backend)

```bash
cd backend
npm run set-main-admin
```

✅ Output should show:

```
✅ Connected to MongoDB
✅ Successfully set abdulhamid529589@gmail.com as main admin
User details:
  - Username: abdulhamid
  - Full Name: Abdul Hamid
  - Email: abdulhamid529589@gmail.com
  - Role: admin
  - Is Main Admin: true
```

### 2. Test & Verify

- Login as main admin
- Go to Admin → User Management
- ✅ See 👑 badge on your name
- ✅ See dropdown for other users
- ✅ Can change their roles

---

## 👥 User Roles

### Main Admin 👑

- **Can:** Change any user role
- **Can't:** Be demoted
- **See:** 👑 Badge (non-editable)
- **Count:** 1 per system

### Regular Admin

- **Can:** Do admin tasks
- **Can't:** Change user roles
- **See:** Disabled dropdowns
- **Count:** Unlimited

### Collector

- **Can:** Submit & view data
- **Can't:** Manage users
- **See:** No admin access
- **Count:** Unlimited

---

## 🎮 Role Change (Main Admin)

```
User Management → Find User → Role Dropdown
                                    ↓
                            [Collector]
                            [Admin   ]  ← Select
                                    ↓
                          ✅ Role Updated
```

---

## 🔒 Role Change (Regular Admin)

```
User Management → Find User → Role Dropdown
                                    ↓
                        [Disabled] (grayed out)
                        Tooltip: "Only main admin
                                  can change roles"
```

---

## 📊 What Changed

| File         | Change                                | Impact                        |
| ------------ | ------------------------------------- | ----------------------------- |
| User.js      | Added `isMainAdmin` field             | Tracks main admin             |
| Controller   | Added role check                      | Prevents unauthorized changes |
| Frontend     | Added Crown badge & disabled dropdown | UI feedback                   |
| Auth Context | Added `isMainAdmin` property          | Component access              |
| Package.json | Added migration script                | Easy setup                    |

---

## 🔐 Security

- ✅ Backend validates main admin status
- ✅ Frontend disables dropdowns for non-main-admin
- ✅ Main admin role immutable
- ✅ Clear error messages
- ✅ Proper HTTP 403 errors

---

## 📋 Checklist

- [ ] Run `npm run set-main-admin`
- [ ] Login as main admin
- [ ] See 👑 badge on your profile
- [ ] Verify dropdown works for other users
- [ ] Test changing a user's role
- [ ] Login as regular admin
- [ ] Verify dropdowns are disabled
- [ ] Try to change role (should fail or be disabled)

---

## 🐛 Common Issues & Fixes

| Issue                    | Fix                                                   |
| ------------------------ | ----------------------------------------------------- |
| "User not found" error   | Create main admin user first, then run script         |
| Can't see dropdown       | Clear cache & login again                             |
| Wrong user is main admin | Update `MAIN_ADMIN_EMAIL` in `.env`, run script again |
| Multiple main admins     | Run script again - fixes automatically                |

---

## 🎯 Environment Setup

### `.env` File

```
MAIN_ADMIN_EMAIL=abdulhamid529589@gmail.com
```

### To Change Main Admin

1. Update email in `.env`
2. Run `npm run set-main-admin`
3. Done! ✅

---

## 📱 UI Examples

### Main Admin Screen

```
┌─────────────────────────────────────────┐
│ User Management                         │
├─────────────────────────────────────────┤
│ Username   │ Role                       │
│─────────────────────────────────────────│
│ abdulhamid │ [👑 Admin]                 │ ← Can't change
│ user2      │ [Dropdown ▼] Admin/Collect │ ← Can change
│ user3      │ [Dropdown ▼] Admin/Collect │ ← Can change
└─────────────────────────────────────────┘
```

### Regular Admin Screen

```
┌─────────────────────────────────────────┐
│ User Management                         │
├─────────────────────────────────────────┤
│ Username   │ Role                       │
│─────────────────────────────────────────│
│ abdulhamid │ [👑 Admin]                 │ ← Info only
│ user2      │ [Disabled Dropdown]        │ ← Can't change
│ user3      │ [Disabled Dropdown]        │ ← Can't change
└─────────────────────────────────────────┘
Hint: Only main admin can change roles
```

---

## 🔗 Related Files

- **Implementation Guide:** `MAIN_ADMIN_HIERARCHY_GUIDE.md`
- **Full Summary:** `MAIN_ADMIN_HIERARCHY_SUMMARY.md`
- **Migration Script:** `backend/scripts/setMainAdmin.js`

---

## 💡 Key Points to Remember

1. **One main admin** - Only one user can be main admin
2. **Main admin cannot be demoted** - Protected role
3. **Only main admin changes roles** - Regular admins cannot
4. **Clear visual feedback** - 👑 badge shows main admin status
5. **Simple to deploy** - Run one migration script
6. **Secure by default** - Backend validates all role changes

---

## 🚀 Command Reference

```bash
# Set main admin (run once after deployment)
npm run set-main-admin

# Start backend
npm start

# Start development
npm run dev

# Seed initial data (if needed)
npm run seed
```

---

## 📞 Support

**If role changes don't work:**

1. Check user has `isMainAdmin: true` in database
2. Run `npm run set-main-admin` again
3. Clear browser cache & logout/login

**To verify main admin setup:**

```bash
# In MongoDB
db.users.findOne({ email: "abdulhamid529589@gmail.com" })
# Should show: { isMainAdmin: true, role: "admin", ... }
```

---

**Status: ✅ READY FOR PRODUCTION**

All security measures implemented.
No additional configuration needed beyond running the migration script.
