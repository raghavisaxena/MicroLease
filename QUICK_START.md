# Quick Start Guide - R-Score & Reviews System

## ⚡ Quick Setup (3 Steps)

### Step 1: Restart Backend
The backend needs to restart to sync the new database models (User fields, Lease fields, Review table).

```powershell
# Stop the current backend (Ctrl+C in the terminal where it's running)
# Then restart:
cd "c:\Users\hp\OneDrive\Desktop\dbms pbl\MicroLease\backend"
node server.js
```

**Expected output:**
```
DB connected
Executing (default): CREATE TABLE IF NOT EXISTS `reviews` ...
Models synced
Server running on 5000
```

### Step 2: Frontend is Already Running
No changes needed - the frontend will automatically pick up the new components.

### Step 3: Test the Flow

#### 🧪 Test Complete Lease → Review Flow

1. **Login** as a user who has an active borrowed lease
2. Go to **My Leases** page
3. Click **Borrowed** tab
4. For an active lease:
   - Select condition from dropdown: **Good** / Damaged / Lost
   - Click **"Complete & Return"** button
   - ✅ Toast: "Lease completed! Stats updated."
   - ✅ Review modal opens automatically
5. In the **Review Modal**:
   - Click stars to rate (1-5)
   - Add comment (optional)
   - Click **"Submit Review"**
   - ✅ Toast: "Review submitted!"
6. Navigate to **`/rscore`** (or add a link in Navbar)
   - ✅ See your R-Score, level, and statistics

---

## 🔗 New Routes Available

### Frontend Pages
- `/rscore` - View your R-Score
- `/rscore/:userId` - View someone else's R-Score

### Backend API
- `GET /api/rscore/:userId` - Get R-Score and level
- `POST /api/reviews/:leaseId` - Submit a review
- `GET /api/reviews/user/:userId` - Get reviews for a user
- `GET /api/reviews/lease/:leaseId` - Get reviews for a lease
- `PUT /api/leases/complete/:leaseId` - Complete lease with condition

---

## 📊 What Gets Updated

When you complete a lease:
1. ✅ Lease marked as `completed` and `returned`
2. ✅ Return timeliness recorded (on-time or late)
3. ✅ Item condition recorded (good/damaged/lost)
4. ✅ Borrower stats updated:
   - `onTimeReturns` or `lateReturns` +1
   - `goodConditionReturns`, `damageReports`, or `lostItems` +1
   - `completedLeases` +1
5. ✅ Borrower's **R-Score recalculated**
6. ✅ Item becomes available again

When you submit a review:
1. ✅ Review saved to database
2. ✅ Owner's `ratingImpactSum` updated: `+= (rating - 3) × 2.5`
3. ✅ Owner's **R-Score recalculated**

---

## 🎨 UI Features

### MyLeases Page (Enhanced)
- Condition selector dropdown
- "Complete & Return" button
- Review modal auto-opens after completion

### RScore Page (New)
- Large score display with color coding
- Level badge (A/B/C/D)
- Detailed statistics grid
- Reviews received
- How it works section

### ItemDetail Page (Enhanced)
- Owner reviews displayed
- Star ratings visible
- Scrollable review section

---

## 🐛 Common Issues

### Issue: Backend doesn't start
**Solution:** Check if port 5000 is already in use. Stop the existing process first.

### Issue: Review modal doesn't open
**Solution:** Check browser console for errors. Verify API call succeeded.

### Issue: R-Score doesn't update
**Solution:** Check backend console logs. Verify `calculateRScore` is being called.

### Issue: Database sync errors
**Solution:** 
```powershell
# Drop and recreate tables (CAUTION: deletes data)
cd backend
# Edit server.js temporarily: change { alter: true } to { force: true }
# Run once, then change back to { alter: true }
```

---

## ✅ Quick Verification Checklist

After restarting backend:
- [ ] Backend console shows "Models synced"
- [ ] Navigate to `/rscore` - page loads
- [ ] Complete a lease - modal appears
- [ ] Submit review - success toast
- [ ] Check R-Score page - stats updated
- [ ] Check ItemDetail - owner reviews visible

---

## 📝 Next: Add RScore Link to Navbar

To make R-Score easily accessible, add this to your Navbar component:

```tsx
<Link to="/rscore">
  <Button variant="ghost">My R-Score</Button>
</Link>
```

---

**Ready to test! 🚀**

See `RSCORE_IMPLEMENTATION.md` for full technical details.
