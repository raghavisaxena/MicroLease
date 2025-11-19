# Admin Dashboard System - Quick Reference

## 🚀 Quick Start

### 1. Setup Backend
```bash
cd backend
npm install
node scripts/seedAdmin.js  # Create admin user
node server.js             # Port 3000
```

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev               # Port 5173
```

### 3. Login
- URL: `http://localhost:5173/admin/login`
- Email: `admin@microlease.com`
- Password: `Admin@123`

---

## 📁 File Structure

### Backend Files Created
```
backend/
├── models/
│   ├── dispute.js          # Dispute tracking with evidence
│   └── transaction.js      # Wallet transaction logs
├── middleware/
│   └── adminMiddleware.js  # Role verification (403 if not admin)
├── routes/admin/
│   ├── users.js           # GET /admin/users, PUT /admin/users/:id/ban
│   ├── items.js           # GET /admin/items, PUT /admin/items/:id/approve
│   ├── disputes.js        # GET /admin/disputes, POST /admin/disputes/:id/resolve
│   ├── transactions.js    # GET /admin/transactions, GET /admin/transactions/stats
│   └── dashboard.js       # GET /admin/dashboard/stats
└── scripts/
    └── seedAdmin.js       # Creates default admin user
```

### Backend Files Modified
```
backend/
├── models/
│   ├── user.js           # + banned: BOOLEAN
│   ├── item.js           # + approved: BOOLEAN
│   └── index.js          # + Dispute & Transaction models registered
├── routes/
│   └── auth.js           # + Banned user check on login
└── server.js             # + 5 admin routes registered
```

### Frontend Files Created
```
frontend/src/
├── components/
│   ├── AdminRoute.tsx     # JWT role verification wrapper
│   └── AdminLayout.tsx    # Sidebar layout for admin pages
└── pages/admin/
    ├── AdminLogin.tsx     # Admin authentication
    ├── Dashboard.tsx      # Stats overview
    ├── Users.tsx          # User management (ban/unban)
    ├── Items.tsx          # Item approval/rejection
    ├── Disputes.tsx       # Dispute resolution
    └── Transactions.tsx   # Transaction viewing
```

### Frontend Files Modified
```
frontend/src/
├── App.tsx               # + 6 admin routes registered
└── pages/
    └── Browse.tsx        # + Filter approved items only
```

---

## 🔑 API Endpoints

### Authentication
```http
POST /api/auth/login
Body: { email, password }
Returns: { token, user: { role } }
```

### Dashboard Stats
```http
GET /api/admin/dashboard/stats
Auth: Bearer <token>
Returns: { users, items, disputes, transactions, leases }
```

### User Management
```http
GET /api/admin/users
Auth: Bearer <token>
Returns: [{ id, name, email, role, banned, rscore, ... }]

PUT /api/admin/users/:id/ban
Auth: Bearer <token>
Body: { ban: true/false }
Returns: { message, user }
```

### Item Management
```http
GET /api/admin/items
Auth: Bearer <token>
Returns: [{ id, title, approved, availability, Owner, ... }]

PUT /api/admin/items/:id/approve
Auth: Bearer <token>
Body: { approved: true/false }
Returns: { message, item }

DELETE /api/admin/items/:id
Auth: Bearer <token>
Returns: { message }
```

### Dispute Management
```http
GET /api/admin/disputes
Auth: Bearer <token>
Returns: [{ id, status, resolution, Item, Renter, Owner, ... }]

POST /api/admin/disputes/:id/resolve
Auth: Bearer <token>
Body: { resolution: "refund_to_renter" | "refund_to_owner" }
Returns: { message, dispute }
Logic:
  1. Find/create wallets for both parties
  2. Refund deposit to winner
  3. Create transaction record
  4. Update R-Score (disputesWon/Lost)
  5. Recalculate R-Score for both users
  6. Update dispute status to "resolved"
```

### Transaction Tracking
```http
GET /api/admin/transactions?page=1&limit=20&type=credit&userId=5
Auth: Bearer <token>
Returns: [{ id, UserId, amount, type, description, createdAt, User }]

GET /api/admin/transactions/stats
Auth: Bearer <token>
Returns: { totalTransactions, totalCredits, totalDebits, creditSum, debitSum, netFlow }
```

---

## 🎨 Frontend Routes

| Route | Component | Protection | Description |
|-------|-----------|------------|-------------|
| `/admin/login` | AdminLogin | Public | Admin authentication |
| `/admin/dashboard` | Dashboard | AdminRoute | Stats overview |
| `/admin/users` | Users | AdminRoute | Ban/unban users |
| `/admin/items` | Items | AdminRoute | Approve/reject items |
| `/admin/disputes` | Disputes | AdminRoute | Resolve disputes |
| `/admin/transactions` | Transactions | AdminRoute | View transactions |

**AdminRoute Protection**: Checks JWT token exists and `role === 'admin'`

---

## 🔒 Security Features

### Backend Middleware Chain
```javascript
router.use(auth);              // Verify JWT token
router.use(adminMiddleware);   // Verify role === 'admin'
```

### Frontend Route Protection
```typescript
<AdminRoute>
  <Dashboard />  // Only accessible if JWT role === 'admin'
</AdminRoute>
```

### Ban Logic
```javascript
// In auth.js login route:
if (user.banned && user.role !== 'admin') {
  return res.status(403).json({ error: 'Your account has been banned' });
}
```

### Item Approval Logic
```javascript
// In Browse.tsx:
const approvedItems = itemsData.filter(item => 
  item.approved === true || item.approved === undefined
);
```

---

## 📊 Database Schema Changes

### User Model
```javascript
banned: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
}
```

### Item Model
```javascript
approved: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
}
```

### Dispute Model (New)
```javascript
{
  LeaseId: INTEGER,
  ItemId: INTEGER,
  RenterId: INTEGER,
  OwnerId: INTEGER,
  description: TEXT,
  renterPhotos: JSON,      // Array of URLs
  ownerPhotos: JSON,       // Array of URLs
  depositAmount: DECIMAL,
  status: ENUM('pending', 'resolved'),
  resolution: ENUM('refund_to_owner', 'refund_to_renter'),
}
```

### Transaction Model (New)
```javascript
{
  UserId: INTEGER,
  amount: DECIMAL,
  type: ENUM('credit', 'debit'),
  description: STRING,
  createdAt: DATE,
}
```

---

## 🛠️ Common Operations

### Create Admin User
```bash
cd backend
node scripts/seedAdmin.js
```

### Check Admin Exists
```sql
SELECT * FROM Users WHERE email = 'admin@microlease.com';
```

### Manually Set User as Admin
```sql
UPDATE Users SET role = 'admin' WHERE email = 'youremail@example.com';
```

### View All Banned Users
```sql
SELECT id, name, email, banned FROM Users WHERE banned = 1;
```

### View Unapproved Items
```sql
SELECT id, title, approved FROM Items WHERE approved = 0;
```

### View Pending Disputes
```sql
SELECT * FROM Disputes WHERE status = 'pending';
```

### View Recent Transactions
```sql
SELECT * FROM Transactions ORDER BY createdAt DESC LIMIT 10;
```

---

## 🐛 Troubleshooting

### Issue: Admin Cannot Login
```bash
# Re-run seed script
node scripts/seedAdmin.js

# Check database
SELECT * FROM Users WHERE role = 'admin';
```

### Issue: "Not authorized" Error
```javascript
// Check JWT token
const token = localStorage.getItem('token');
console.log(token);

// Decode token
import jwt_decode from 'jwt-decode';
const decoded = jwt_decode(token);
console.log(decoded.role);  // Should be 'admin'
```

### Issue: Items Not Showing on Browse
```sql
-- Check approved status
SELECT id, title, approved FROM Items;

-- Manually approve all items
UPDATE Items SET approved = 1;
```

### Issue: Dispute Resolution Fails
```javascript
// Check wallet creation
SELECT * FROM Wallets WHERE UserId IN (renterId, ownerId);

// Check security deposit
SELECT depositAmount FROM Disputes WHERE id = disputeId;
```

---

## 📝 Workflow Examples

### Example 1: Ban a User
1. Login as admin at `/admin/login`
2. Navigate to `/admin/users`
3. Find user in table
4. Click "Ban" button
5. User status changes to "Banned"
6. User cannot login until unbanned

### Example 2: Approve an Item
1. Regular user creates item at `/add-item`
2. Item saved with `approved = false`
3. Admin navigates to `/admin/items`
4. Finds item with "Pending" status
5. Clicks "Approve" button
6. Item appears on `/browse` page

### Example 3: Resolve a Dispute
1. Dispute created by renter/owner
2. Admin navigates to `/admin/disputes`
3. Clicks "Review" on pending dispute
4. Reviews description and evidence photos
5. Selects resolution (refund_to_renter or refund_to_owner)
6. Clicks "Resolve Dispute"
7. Backend:
   - Finds/creates wallets
   - Refunds deposit to winner
   - Logs transaction
   - Updates R-Score stats (disputesWon/Lost)
   - Recalculates R-Score for both parties
   - Updates dispute status to "resolved"
8. Dispute moves to "Resolved" section

---

## 🎯 Key Features

### ✅ Role-Based Access Control
- Admin role in User model
- JWT includes role claim
- Backend middleware checks role
- Frontend route protection

### ✅ User Management
- View all users with search
- Ban/unban functionality
- Banned users cannot login (except admins)
- View user details (items, leases, R-Score)

### ✅ Item Approval System
- Items default to unapproved
- Only approved items show on Browse
- Admins can approve/reject/delete
- View full item details

### ✅ Dispute Resolution
- View all disputes (pending/resolved)
- Review evidence from both parties
- Select winner (renter or owner)
- Automatic wallet refund
- Automatic R-Score update
- Transaction logging

### ✅ Transaction Tracking
- All wallet activities logged
- View by type (credit/debit)
- Search by user or description
- Statistics dashboard
- Pagination support

### ✅ Dashboard Statistics
- Real-time platform overview
- User breakdown by role
- Item approval status
- Dispute status
- Transaction summary
- Lease status breakdown

---

## 📧 Support

If you encounter issues:
1. Check console for errors (F12)
2. Check backend logs in terminal
3. Verify database tables exist
4. Check JWT token in localStorage
5. Refer to ADMIN_TESTING_GUIDE.md

---

**Last Updated**: January 2025
**Version**: 1.0.0
