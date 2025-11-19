# Admin Dashboard System - Testing Guide

## Overview
This guide provides comprehensive testing steps for the complete Admin Dashboard System integrated into MicroLease.

## Prerequisites

### 1. Database Setup
Ensure your MySQL database is running and configured in `backend/config/db.js`.

### 2. Backend Setup
```bash
cd backend
npm install
node scripts/seedAdmin.js  # Creates default admin user
node server.js             # Start backend server on port 3000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev               # Start frontend on port 5173
```

## Default Admin Credentials
- **Email**: admin@microlease.com
- **Password**: Admin@123

---

## Testing Checklist

### Part 1: Admin Authentication

#### Test 1.1: Admin Login
- [ ] Navigate to `http://localhost:5173/admin/login`
- [ ] Login with admin credentials
- [ ] Verify redirect to `/admin/dashboard`
- [ ] Verify JWT token saved in localStorage

#### Test 1.2: Non-Admin User Block
- [ ] Create a regular user account (lessor/lessee)
- [ ] Try logging in at `/admin/login` with regular user credentials
- [ ] Verify error: "Only admin users can access this page"

#### Test 1.3: Protected Routes
- [ ] Without logging in, try accessing `/admin/dashboard`
- [ ] Verify redirect to `/admin/login`
- [ ] After login as admin, verify access to all admin pages

---

### Part 2: Dashboard Statistics

#### Test 2.1: Dashboard Overview
- [ ] Navigate to `/admin/dashboard`
- [ ] Verify all stat cards display:
  - Total Users (with breakdown: lessors, lessees, banned)
  - Total Items (with breakdown: approved, pending, available)
  - Disputes (pending vs resolved)
  - Transactions (total amount, credits, debits)
- [ ] Verify Leases Overview section displays:
  - Total, Active, Completed, Cancelled counts

---

### Part 3: User Management

#### Test 3.1: View All Users
- [ ] Navigate to `/admin/users`
- [ ] Verify user table displays all users with:
  - Name, Email, Role, R-Score, Leases count, Status
- [ ] Test search functionality by name/email

#### Test 3.2: Ban User
- [ ] Click "Ban" button on a non-admin user
- [ ] Verify success toast
- [ ] Verify user status changes to "Banned"
- [ ] **Critical**: Test banned user cannot login
  - Logout from admin
  - Try logging in as banned user at `/login`
  - Verify error: "Your account has been banned"

#### Test 3.3: Unban User
- [ ] Click "Unban" on a banned user
- [ ] Verify status changes to "Active"
- [ ] Test user can now login successfully

#### Test 3.4: View User Details
- [ ] Click "Eye" icon on any user
- [ ] Verify modal shows:
  - Full user details (name, email, role, R-Score)
  - Listed items count
  - Total leases count

#### Test 3.5: Admin Protection
- [ ] Try to ban an admin user
- [ ] Verify error: "Cannot ban admin users"

---

### Part 4: Item Management

#### Test 4.1: View All Items
- [ ] Navigate to `/admin/items`
- [ ] Verify item table displays:
  - Title, Category, Owner, Price/Day, Status, Approval
- [ ] Test search by title/category

#### Test 4.2: Approve Item
- [ ] Create a new item as a regular user (not admin)
- [ ] As admin, find the item (should show "Pending")
- [ ] Click "Approve" button
- [ ] Verify status changes to "Approved"
- [ ] **Critical**: Test item visibility
  - Logout and browse `/browse` page
  - Verify approved item is visible

#### Test 4.3: Reject Item
- [ ] Click "Reject" on an approved item
- [ ] Verify status changes to "Pending"
- [ ] Verify item disappears from `/browse` page

#### Test 4.4: View Item Details
- [ ] Click "Eye" icon on any item
- [ ] Verify modal shows:
  - Image, title, category, price, condition
  - Location, owner details, description

#### Test 4.5: Delete Item
- [ ] Click "Trash" icon on an item
- [ ] Confirm deletion in dialog
- [ ] Verify item is removed from table
- [ ] Verify item no longer exists in database

---

### Part 5: Dispute Resolution

#### Test 5.1: Create Test Dispute
First, create a dispute scenario:
- [ ] As Renter: Create a lease for an item
- [ ] As Owner: Accept the lease
- [ ] As Renter: Submit a dispute with photos/description
- [ ] As Owner: Respond to dispute with photos

#### Test 5.2: View Pending Disputes
- [ ] Navigate to `/admin/disputes`
- [ ] Verify dispute appears in "Pending Disputes" table
- [ ] Verify details shown: Item, Renter, Owner, Deposit, Date

#### Test 5.3: Review Dispute
- [ ] Click "Review" button
- [ ] Verify modal shows:
  - Item and deposit details
  - Renter and Owner information
  - Dispute description
  - Renter's evidence photos
  - Owner's evidence photos

#### Test 5.4: Resolve Dispute - Refund to Renter
- [ ] Select "Refund to Renter" resolution
- [ ] Click "Resolve Dispute"
- [ ] **Critical Validations**:
  - [ ] Verify dispute moves to "Resolved Disputes" table
  - [ ] Check Renter's wallet - deposit should be added
  - [ ] Check Owner's wallet - no change
  - [ ] Check Renter's R-Score - `disputesWon` incremented
  - [ ] Check Owner's R-Score - `disputesLost` incremented
  - [ ] Verify transaction created in transactions table
  - [ ] Transaction description: "Dispute refund for lease #[LeaseId]"

#### Test 5.5: Resolve Dispute - Refund to Owner
- [ ] Create another dispute
- [ ] Select "Refund to Owner" resolution
- [ ] Click "Resolve Dispute"
- [ ] **Critical Validations**:
  - [ ] Verify Owner's wallet receives deposit
  - [ ] Owner's `disputesWon` incremented
  - [ ] Renter's `disputesLost` incremented
  - [ ] Transaction logged correctly

#### Test 5.6: R-Score Recalculation
After resolving disputes:
- [ ] Navigate to user's profile
- [ ] Verify R-Score updated automatically
- [ ] Check `/rscore` page shows updated stats

---

### Part 6: Transaction Tracking

#### Test 6.1: View All Transactions
- [ ] Navigate to `/admin/transactions`
- [ ] Verify stat cards show:
  - Total transactions count
  - Total credits sum (green)
  - Total debits sum (red)
  - Net flow (positive/negative indicator)

#### Test 6.2: Transaction Table
- [ ] Verify table displays:
  - Date/Time, User, Type (Credit/Debit), Amount, Description
- [ ] Test search by user name or description

#### Test 6.3: Filter Transactions
- [ ] Use "Filter by type" dropdown
- [ ] Select "Credits Only" - verify only credit transactions shown
- [ ] Select "Debits Only" - verify only debit transactions shown
- [ ] Select "All Types" - verify all transactions shown

#### Test 6.4: Pagination
- [ ] If more than 20 transactions exist:
  - [ ] Click "Next" button
  - [ ] Verify page number increments
  - [ ] Click "Previous" button
  - [ ] Verify returns to previous page

#### Test 6.5: Transaction Creation Verification
- [ ] Perform actions that create transactions:
  - Resolve a dispute (creates refund transaction)
  - Add money to wallet (creates credit)
  - Make a payment (creates debit)
- [ ] Verify each transaction appears in admin panel
- [ ] Verify amounts are correct
- [ ] Verify descriptions are descriptive

---

### Part 7: End-to-End Workflow Tests

#### Test 7.1: Complete Item Approval Flow
1. [ ] Regular user creates item at `/add-item`
2. [ ] Item appears in `/admin/items` with "Pending" status
3. [ ] Item NOT visible on `/browse` page
4. [ ] Admin approves item
5. [ ] Item NOW visible on `/browse` page
6. [ ] Regular users can create leases for the item

#### Test 7.2: Complete Ban Flow
1. [ ] Admin bans a user from `/admin/users`
2. [ ] User is logged out (if active)
3. [ ] User tries to login at `/login`
4. [ ] Login fails with "Your account has been banned"
5. [ ] User cannot access any protected routes
6. [ ] Admin unbans user
7. [ ] User can now login successfully

#### Test 7.3: Complete Dispute Resolution Flow
1. [ ] Renter creates lease
2. [ ] Owner accepts
3. [ ] Renter pays security deposit
4. [ ] Lease completes
5. [ ] Owner claims damage, initiates dispute
6. [ ] Renter responds with counter-evidence
7. [ ] Admin reviews at `/admin/disputes`
8. [ ] Admin resolves (choose winner)
9. [ ] Winner's wallet receives deposit
10. [ ] Both parties' R-Scores updated
11. [ ] Transaction logged
12. [ ] Dispute marked resolved

---

### Part 8: Security & Edge Cases

#### Test 8.1: JWT Expiration
- [ ] Login as admin
- [ ] Wait for JWT to expire (or manually delete token)
- [ ] Try accessing admin route
- [ ] Verify redirect to `/admin/login`

#### Test 8.2: Direct URL Access
- [ ] Without login, try accessing:
  - [ ] `/admin/dashboard`
  - [ ] `/admin/users`
  - [ ] `/admin/items`
  - [ ] `/admin/disputes`
  - [ ] `/admin/transactions`
- [ ] Verify all redirect to `/admin/login`

#### Test 8.3: Non-Admin JWT
- [ ] Login as regular user at `/login`
- [ ] Get JWT token from localStorage
- [ ] Try accessing admin routes
- [ ] Verify redirect to `/login` (not admin login)
- [ ] Verify error message about admin access

#### Test 8.4: Concurrent Admin Actions
- [ ] Open two admin sessions (two browser tabs)
- [ ] In tab 1: Start banning a user
- [ ] In tab 2: Simultaneously try to view same user
- [ ] Verify data consistency

#### Test 8.5: Invalid Data Handling
- [ ] Try resolving a dispute without selecting resolution
- [ ] Verify error: "Please select a resolution"
- [ ] Try empty search queries
- [ ] Try filtering with no results
- [ ] Verify graceful "No data found" messages

---

### Part 9: UI/UX Validation

#### Test 9.1: Sidebar Navigation
- [ ] Verify sidebar shows all 5 menu items
- [ ] Click each menu item
- [ ] Verify correct page loads
- [ ] Verify active state highlights current page

#### Test 9.2: Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768px)
- [ ] Test on mobile (375px)
- [ ] Verify tables scroll horizontally on small screens
- [ ] Verify cards stack vertically on mobile

#### Test 9.3: Loading States
- [ ] On slow network, verify loading messages:
  - "Loading users..."
  - "Loading items..."
  - "Loading disputes..."
  - "Loading transactions..."

#### Test 9.4: Toast Notifications
- [ ] Verify success toasts show:
  - "User status updated"
  - "Item status updated"
  - "Dispute resolved successfully"
- [ ] Verify error toasts show on failures

#### Test 9.5: Logout Functionality
- [ ] Click "Logout" in sidebar
- [ ] Verify token removed from localStorage
- [ ] Verify redirect to `/admin/login`
- [ ] Verify cannot access admin routes after logout

---

### Part 10: Database Validation

#### Test 10.1: User Model Changes
```sql
-- Run in MySQL
SELECT id, name, email, role, banned, rscore FROM Users;
```
- [ ] Verify `banned` field exists (BOOLEAN)
- [ ] Verify admin user has `role = 'admin'`

#### Test 10.2: Item Model Changes
```sql
SELECT id, title, approved, availability FROM Items;
```
- [ ] Verify `approved` field exists (BOOLEAN)
- [ ] Verify unapproved items have `approved = 0`

#### Test 10.3: Dispute Model
```sql
SELECT * FROM Disputes;
```
- [ ] Verify Dispute table exists
- [ ] Verify columns: LeaseId, ItemId, RenterId, OwnerId, description, renterPhotos, ownerPhotos, depositAmount, status, resolution

#### Test 10.4: Transaction Model
```sql
SELECT * FROM Transactions;
```
- [ ] Verify Transaction table exists
- [ ] Verify columns: UserId, amount, type, description, createdAt
- [ ] Verify transactions created by dispute resolutions

#### Test 10.5: Associations
- [ ] Verify foreign keys work:
  - Dispute belongsTo Lease
  - Dispute belongsTo Item
  - Transaction belongsTo User
- [ ] Test cascade deletes (if applicable)

---

## API Endpoint Testing (Postman/Thunder Client)

### Admin Authentication
```
POST http://localhost:3000/api/auth/login
Body: { "email": "admin@microlease.com", "password": "Admin@123" }
Expected: 200 OK with JWT token and user object with role="admin"
```

### Get Dashboard Stats
```
GET http://localhost:3000/api/admin/dashboard/stats
Headers: Authorization: Bearer <token>
Expected: 200 OK with stats object
```

### List All Users
```
GET http://localhost:3000/api/admin/users
Headers: Authorization: Bearer <token>
Expected: 200 OK with array of users
```

### Ban User
```
PUT http://localhost:3000/api/admin/users/2/ban
Headers: Authorization: Bearer <token>
Body: { "ban": true }
Expected: 200 OK with updated user
```

### List All Items
```
GET http://localhost:3000/api/admin/items
Headers: Authorization: Bearer <token>
Expected: 200 OK with array of items
```

### Approve Item
```
PUT http://localhost:3000/api/admin/items/1/approve
Headers: Authorization: Bearer <token>
Body: { "approved": true }
Expected: 200 OK with updated item
```

### List Disputes
```
GET http://localhost:3000/api/admin/disputes
Headers: Authorization: Bearer <token>
Expected: 200 OK with array of disputes
```

### Resolve Dispute
```
POST http://localhost:3000/api/admin/disputes/1/resolve
Headers: Authorization: Bearer <token>
Body: { "resolution": "refund_to_renter" }
Expected: 200 OK with message and updated dispute
```

### List Transactions
```
GET http://localhost:3000/api/admin/transactions?page=1&limit=20&type=credit
Headers: Authorization: Bearer <token>
Expected: 200 OK with array of transactions
```

### Transaction Stats
```
GET http://localhost:3000/api/admin/transactions/stats
Headers: Authorization: Bearer <token>
Expected: 200 OK with stats object
```

---

## Common Issues & Troubleshooting

### Issue 1: Admin Cannot Login
- Check default admin exists: `SELECT * FROM Users WHERE email='admin@microlease.com'`
- Re-run seed script: `node scripts/seedAdmin.js`
- Verify password hash is correct

### Issue 2: Items Not Showing on Browse
- Check item `approved` field is `true`
- Verify Browse page filter is working
- Check console for API errors

### Issue 3: Dispute Resolution Fails
- Verify wallet exists for both parties
- Check security deposit amount is correct
- Verify lease ID and item ID associations

### Issue 4: Transactions Not Appearing
- Check transaction creation in dispute resolve route
- Verify Transaction model is properly imported
- Check for transaction creation errors in backend logs

### Issue 5: JWT Decode Error
- Verify `jwt-decode` package is installed: `npm install jwt-decode`
- Check token format in localStorage
- Verify token expiration settings

---

## Performance Testing

### Load Test Dashboard Stats
- [ ] Simulate 1000+ users
- [ ] Verify dashboard loads within 2 seconds
- [ ] Check for N+1 query issues

### Load Test Transactions
- [ ] Create 10,000+ transactions
- [ ] Test pagination performance
- [ ] Verify filtering doesn't timeout

### Load Test Search
- [ ] Test search with 1000+ users/items
- [ ] Verify results within 1 second
- [ ] Check for query optimization

---

## Final Validation Checklist

- [ ] All 10 parts of requirements implemented
- [ ] Backend: 5 admin route groups working
- [ ] Frontend: 6 admin pages functional
- [ ] Database: All model changes applied
- [ ] Security: JWT and role checks working
- [ ] UI: Responsive and accessible
- [ ] Documentation: Complete and accurate
- [ ] No console errors on any page
- [ ] All API endpoints return correct status codes
- [ ] All user flows work end-to-end

---

## Deployment Checklist

Before deploying to production:
- [ ] Change default admin password
- [ ] Enable HTTPS for admin routes
- [ ] Add rate limiting to admin endpoints
- [ ] Set up admin activity logging
- [ ] Configure CORS properly
- [ ] Add database backups before admin actions
- [ ] Set up monitoring for admin activities
- [ ] Add email notifications for critical admin actions

---

## Success Criteria

The admin dashboard system is considered complete and functional when:

1. ✅ Admin can login with dedicated login page
2. ✅ Dashboard displays accurate real-time statistics
3. ✅ Users can be banned/unbanned with immediate effect
4. ✅ Items require approval before appearing to users
5. ✅ Disputes can be resolved with automatic wallet refunds
6. ✅ R-Scores update automatically on dispute resolution
7. ✅ All transactions are tracked and viewable
8. ✅ Non-admin users cannot access admin routes
9. ✅ UI is responsive and user-friendly
10. ✅ All API endpoints are secure and functional

---

**Testing Status**: ⏳ Pending
**Last Updated**: [Current Date]
**Tested By**: [Tester Name]
