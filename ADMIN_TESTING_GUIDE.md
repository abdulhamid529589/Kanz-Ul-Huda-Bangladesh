# Admin Features Testing Guide

## Quick Start

### 1. Ensure Backend is Running

```bash
cd backend
npm install
npm start
```

### 2. Ensure Frontend is Running

```bash
cd frontend
npm install
npm run dev
```

## Test Cases

### User Management Tests

#### Test 1: Create New Collector User

1. Login as admin user
2. Go to **Admin: Users** page
3. Click **Add New User** button
4. Fill in:
   - Username: `john_collector`
   - Full Name: `John Collector`
   - Email: `john@example.com`
   - Password: `TestPass123`
   - Role: `Collector`
5. Click **Create User**
6. Expected: Success toast, user appears in list with collector role

#### Test 2: Create New Admin User

1. Go to **Admin: Users** page
2. Click **Add New User** button
3. Fill in:
   - Username: `admin2`
   - Full Name: `Admin User Two`
   - Email: `admin2@example.com`
   - Password: `AdminPass123`
   - Role: `Admin`
4. Click **Create User**
5. Expected: Success toast, user appears with admin role badge

#### Test 3: Promote Collector to Admin

1. Go to **Admin: Users** page
2. Find a user with **Collector** role
3. Click the **ChevronUp** (promote) button
4. Expected: Success toast, user role changes to **Admin**

#### Test 4: Demote Admin to Collector

1. Go to **Admin: Users** page
2. Find a user with **Admin** role (not the main admin)
3. Click the **Shield** (demote) button
4. Expected: Success toast, user role changes to **Collector**

#### Test 5: Deactivate User

1. Go to **Admin: Users** page
2. Find any active user (status = green badge)
3. Click the **Edit** (middle) button in actions
4. Expected: Status changes to **Inactive** (red badge)

#### Test 6: Activate User

1. Go to **Admin: Users** page
2. Find an inactive user
3. Click the **Edit** button
4. Expected: Status changes back to **Active**

#### Test 7: Delete User

1. Go to **Admin: Users** page
2. Find a user to delete (don't delete the main admin)
3. Click the **Trash** button
4. Confirm deletion in alert
5. Expected: User removed from list, success toast

#### Test 8: Search Users

1. Go to **Admin: Users** page
2. Type in search box: part of username, email, or name
3. Expected: List filters in real-time

#### Test 9: Filter by Role

1. Go to **Admin: Users** page
2. Select from role dropdown: "Admin"
3. Expected: Only admin users show

#### Test 10: Filter by Status

1. Go to **Admin: Users** page
2. Select from status dropdown: "Inactive"
3. Expected: Only inactive users show

### Member Management Tests

#### Test 11: Create New Member

1. Go to **Admin: Members** page
2. Click **Add Member** button
3. Fill in:
   - Member Name: `Ahmed Ali`
   - Member Number: `M001`
   - Status: `Active`
4. Click **Add Member**
5. Expected: Success toast, member appears in list

#### Test 12: Edit Member

1. Go to **Admin: Members** page
2. Find a member and click **Edit** button
3. Change name: `Ahmed Ali Updated`
4. Click **Update Member**
5. Expected: Member name updated in list

#### Test 13: Deactivate Member

1. Go to **Admin: Members** page
2. Find an active member
3. Click the **Edit** (status toggle) button
4. Expected: Status changes to **Inactive**

#### Test 14: Delete Member

1. Go to **Admin: Members** page
2. Find a member to delete
3. Click **Trash** button
4. Confirm deletion
5. Expected: Member removed from list

#### Test 15: Bulk Import Members

1. Go to **Admin: Members** page
2. Click **Bulk Import** button
3. Paste member data (tab-separated):
   ```
   Fatima Hassan	M002
   Ali Mohammed	M003
   Sara Khan	M004
   ```
4. Click **Import**
5. Expected: Success message showing "3/3 members imported"

#### Test 16: Search Members

1. Go to **Admin: Members** page
2. Type in search box: member name or number
3. Expected: List filters in real-time

#### Test 17: Filter Members by Status

1. Go to **Admin: Members** page
2. Select from status dropdown: "Active"
3. Expected: Only active members show

#### Test 18: View Member Stats

The stats are shown automatically:

- **Submissions count** shows how many submissions each member has
- **Total Durood** shows total Durood submissions

#### Test 19: Pagination

1. Go to **Admin: Members** page
2. With 20+ members, page numbers appear at bottom
3. Click page 2
4. Expected: Next page of members loads

### Settings Management Tests

#### Test 20: View All Settings

1. Go to **Admin: Settings** page
2. Expected: Grid of all settings with current values displayed

#### Test 21: Filter Settings by Category

1. Go to **Admin: Settings** page
2. Select from Category dropdown: "durood"
3. Expected: Only durood-related settings show
4. Try other categories: "general", "member", "week", "notification"

#### Test 22: Edit Boolean Setting

1. Go to **Admin: Settings** page
2. Find `enable_leaderboard` setting
3. Change value: `Disabled`
4. Expected: "Modified" indicator appears

#### Test 23: Edit Number Setting

1. Go to **Admin: Settings** page
2. Find `max_members_per_collector` setting
3. Change value: `150`
4. Expected: "Modified" indicator appears

#### Test 24: Save Settings

1. Go to **Admin: Settings** page
2. Make any change to a setting
3. Click **Save Changes** button
4. Expected: Success toast, "Modified" indicator disappears

#### Test 25: Reset to Defaults

1. Go to **Admin: Settings** page
2. Make several changes
3. Click **Reset to Defaults** button
4. Confirm in alert
5. Expected: All settings reset to default values, success toast

#### Test 26: Unsaved Changes Warning

1. Go to **Admin: Settings** page
2. Change a setting
3. Expected: Yellow notification box appears at bottom right
4. Click **Save Now** button in notification
5. Expected: Settings saved, notification disappears

### Navigation Tests

#### Test 27: Admin Menu Visibility

1. Login as admin user
2. Go to sidebar
3. Expected: After main menu items, see "Admin Panel" section with:
   - Admin: Users
   - Admin: Members
   - Admin: Settings

#### Test 28: Non-Admin Cannot Access Admin Pages

1. Logout
2. Login as collector user
3. Go to sidebar
4. Expected: Admin menu items NOT visible

#### Test 29: Admin Page Access Control

1. Login as collector
2. Try to access admin URL directly: `/admin-users`
3. Expected: Page either doesn't load or shows error

### Security Tests

#### Test 30: Cannot Delete Last Admin

1. Go to **Admin: Users** page
2. Find the main admin user
3. Try to click **Delete** button
4. Expected: Alert warns "Cannot delete last admin" or similar

#### Test 31: Cannot Demote All Admins

1. Go to **Admin: Users** page
2. If you have only 1 admin, try to demote
3. Expected: Error message about minimum admin requirement

### API Response Tests

#### Test 32: Check Response Format

Open browser DevTools → Network tab

1. Create a user, check response JSON
2. Expected format:
   ```json
   {
     "success": true,
     "message": "User created successfully",
     "data": {
       "user": { ... }
     }
   }
   ```

#### Test 33: Check Error Responses

1. Try creating user with missing fields
2. Check network response
3. Expected format:
   ```json
   {
     "success": false,
     "message": "Please fill in all required fields"
   }
   ```

## Bulk Import Format

For bulk member import, use tab-separated values:

```
Name[TAB]Member Number
Ahmed Ali[TAB]001
Fatima Hassan[TAB]002
Sara Khan[TAB]003
```

**Or copy directly from Excel:**

- Column A: Name
- Column B: Member Number
- Copy both columns and paste in modal

## Common Issues & Solutions

### Issue: "Unauthorized" when accessing admin pages

- **Solution**: Ensure you're logged in as an admin user (role must be "admin")

### Issue: Settings changes not saving

- **Solution**: Click "Save Changes" button - it only saves when you explicitly click it

### Issue: Bulk import fails entirely

- **Solution**: Check format is exactly: `Name\tMember Number` (tab-separated), one per line

### Issue: Cannot demote/promote users

- **Solution**: Check that operation would not leave system with 0 admins

### Issue: Deleted members still appear

- **Solution**: Refresh page (F5) - deletion is confirmed but UI may not update immediately

## Performance Testing

### Test with Large Datasets

1. Bulk import 100+ members
2. Create 50+ users
3. Add 100+ settings
4. Verify pages still load quickly
5. Check pagination works smoothly

### Test Search Performance

1. With 1000+ members
2. Search should complete in <1 second

## Browser Testing

Test on:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

## Regression Tests

After any changes, verify:

- [ ] User creation still works
- [ ] Member import still works
- [ ] Settings save still works
- [ ] Admin menu visibility correct
- [ ] Non-admin cannot access admin pages
- [ ] Role safeguards still work
- [ ] All filters/search still work

---

**Note**: All tests assume backend and frontend are running locally at:

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

Adjust URLs if your servers run on different ports.
