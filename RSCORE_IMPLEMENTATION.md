# R-Score & Reviews System Implementation

## Overview
Complete implementation of R-Score (Reliability Score) and Reviews & Ratings system integrated with the MicroLease platform's item return, dispute, and lease flow.

---

## 🎯 Features Implemented

### 1️⃣ R-Score (Reliability Score)

#### Backend Changes

**User Model (`backend/models/user.js`)**
- Added R-Score fields to User model:
  - `onTimeReturns`: INTEGER (default: 0)
  - `lateReturns`: INTEGER (default: 0)
  - `goodConditionReturns`: INTEGER (default: 0)
  - `damageReports`: INTEGER (default: 0)
  - `lostItems`: INTEGER (default: 0)
  - `disputesWon`: INTEGER (default: 0)
  - `disputesLost`: INTEGER (default: 0)
  - `ratingImpactSum`: FLOAT (default: 0)
  - `completedLeases`: INTEGER (default: 0)
  - `rscore`: FLOAT (default: 80)

**Lease Model (`backend/models/lease.js`)**
- Added return tracking fields:
  - `returned`: BOOLEAN (default: false)
  - `returnedAt`: DATE
  - `returnCondition`: ENUM('good', 'damaged', 'lost')
  - `returnedOnTime`: BOOLEAN

---

### 2️⃣ RScore Calculation Function

**File: `backend/lib/rscore.js`**

Implements `calculateRScore(userStats)` with the following rules:
- ✅ On-time return → **+5 points**
- ✅ Item in good condition → **+3 points**
- ✅ Rating impact → **(rating - 3) × 2.5 points**
- ✅ Every 5 successful leases → **+10 points**
- ✅ Dispute won → **+10 points**
- ❌ Late return → **-10 points**
- ❌ Damage → **-15 points**
- ❌ Item lost → **-40 points**
- ❌ Dispute lost → **-20 points**

Score is **capped between 0 and 100**.

Also includes `levelFromScore(score)` to map scores to levels:
- **90-100**: A - Excellent
- **75-89**: B - Good
- **50-74**: C - Fair
- **0-49**: D - Poor

---

### 3️⃣ Backend API Endpoints

#### Review System

**Model: `backend/models/review.js`**
- Fields: `id`, `LeaseId`, `reviewerId`, `reviewedUserId`, `rating`, `comment`

**Controller: `backend/controllers/reviewController.js`**
- Handles review submission
- Updates `ratingImpactSum` for reviewed user
- Recalculates R-Score after review

**Routes: `backend/routes/reviews.js`**
- `POST /api/reviews/:leaseId` - Submit a review
  - Body: `{ rating: 1-5, comment: string, reviewedUserId: number }`
- `GET /api/reviews/user/:userId` - Get reviews for a user
- `GET /api/reviews/lease/:leaseId` - Get reviews for a lease

#### R-Score System

**Controller: `backend/controllers/rscoreController.js`**
- Returns user's current R-Score and level

**Routes: `backend/routes/rscore.js`**
- `GET /api/rscore/:userId` - Get R-Score and level for a user
  - Returns: `{ rscore: number, level: string }`

#### Lease Completion

**Enhanced Route: `backend/routes/leases.js`**
- `PUT /api/leases/complete/:leaseId` - Complete a lease
  - Body: `{ condition: 'good'|'damaged'|'lost', returnedAt: ISO date }`
  - Updates:
    - Marks lease as returned
    - Records return condition and timeliness
    - Updates borrower stats (`onTimeReturns`, `lateReturns`, etc.)
    - Recalculates borrower's R-Score
    - Makes item available again

**Server Registration (`backend/server.js`)**
- Registered review and rscore routes

---

### 4️⃣ Frontend Integration

#### Component: ReviewModal

**File: `frontend/src/components/ReviewModal.tsx`**
- Beautiful Shadcn UI modal
- Interactive 1-5 star rating system
- Optional comment text area
- Submits review via API

#### Page: RScore

**File: `frontend/src/pages/RScore.tsx`**
- Displays user's R-Score with color-coded badge
- Shows detailed statistics:
  - On-time returns, late returns
  - Good condition returns, damage reports
  - Lost items, completed leases
  - Disputes won/lost
- Lists reviews received by user
- Explains how R-Score calculation works
- Beautiful card-based layout using Shadcn UI

#### Enhanced: MyLeases

**File: `frontend/src/pages/MyLeases.tsx`**

Added functionality:
1. **Complete Lease Flow**:
   - Dropdown to select return condition (Good/Damaged/Lost)
   - "Complete & Return" button
   - Calls `/api/leases/complete/:leaseId`
   - Automatically triggers Review Modal after completion

2. **Review Modal Integration**:
   - Opens automatically after completing a lease
   - Allows borrower to rate the owner
   - Submits review to `/api/reviews/:leaseId`

3. **Imports**:
   - Added `ReviewModal` component
   - Added `Select` components from Shadcn UI

#### Enhanced: ItemDetail

**File: `frontend/src/pages/ItemDetail.tsx`**

Added features:
- Fetches and displays owner's reviews
- Shows up to 3 recent reviews in owner card
- Star rating display
- Scrollable review section

---

## 📁 File Structure

```
backend/
  ├── models/
  │   ├── user.js (✏️ modified - added R-Score fields)
  │   ├── lease.js (✏️ modified - added return tracking)
  │   ├── review.js (✨ new)
  │   └── index.js (✏️ modified - registered Review model)
  ├── controllers/
  │   ├── reviewController.js (✨ new)
  │   └── rscoreController.js (✨ new)
  ├── routes/
  │   ├── leases.js (✏️ modified - added complete endpoint)
  │   ├── reviews.js (✨ new)
  │   └── rscore.js (✨ new)
  ├── lib/
  │   └── rscore.js (✨ new - calculation logic)
  └── server.js (✏️ modified - registered new routes)

frontend/
  ├── src/
  │   ├── components/
  │   │   └── ReviewModal.tsx (✨ new)
  │   ├── pages/
  │   │   ├── RScore.tsx (✏️ modified - full implementation)
  │   │   ├── MyLeases.tsx (✏️ modified - added complete & review flow)
  │   │   └── ItemDetail.tsx (✏️ modified - show owner reviews)
  │   └── lib/
  │       └── api.ts (✅ already exists - axios wrapper)
```

---

## 🔄 Integration Flow

### Complete Lease → Review Flow

1. **User goes to "My Leases" page** (borrowed items)
2. **Selects return condition** from dropdown (Good/Damaged/Lost)
3. **Clicks "Complete & Return"**
   - Frontend calls: `PUT /api/leases/complete/:leaseId`
   - Backend:
     - Marks lease as returned with timestamp
     - Determines if return was on-time or late
     - Updates borrower's stats (onTimeReturns, damageReports, etc.)
     - Recalculates borrower's R-Score
     - Makes item available again
4. **Review Modal automatically opens**
   - Pre-filled with owner's details
   - User selects 1-5 star rating
   - User adds optional comment
5. **User submits review**
   - Frontend calls: `POST /api/reviews/:leaseId`
   - Backend:
     - Saves review to database
     - Calculates rating impact: `(rating - 3) × 2.5`
     - Updates owner's `ratingImpactSum`
     - Recalculates owner's R-Score
6. **Success toast appears**
7. **Leases list refreshes**

---

## 🎨 UI Components Used

All components from Shadcn UI:
- `Dialog` - Review modal
- `Card` - Score cards, stat cards
- `Badge` - Status badges, level badges
- `Button` - Actions
- `Progress` - Score visualization
- `Select` - Condition dropdown
- `Textarea` - Review comments
- `Tabs` - MyLeases sections

---

## 🚀 How to Test

### 1. Restart Backend
The backend server needs to restart to sync new models:
```powershell
cd "c:\Users\hp\OneDrive\Desktop\dbms pbl\MicroLease\backend"
node server.js
```

### 2. Frontend is Already Running
The frontend should pick up the new components automatically.

### 3. Test Flow

#### A. Complete a Lease
1. Login as a borrower
2. Go to "My Leases" → "Borrowed" tab
3. Find an active lease
4. Select condition from dropdown
5. Click "Complete & Return"
6. ✅ Verify toast: "Lease completed! Stats updated."
7. ✅ Review modal should open automatically

#### B. Submit a Review
1. In the review modal:
   - Click stars to rate (1-5)
   - Add optional comment
   - Click "Submit Review"
2. ✅ Verify toast: "Review submitted!"

#### C. View R-Score
1. Navigate to `/rscore` (add link in Navbar if needed)
2. ✅ See score, level, statistics
3. ✅ See reviews received

#### D. View Owner Reviews on Item Detail
1. Go to any item detail page
2. ✅ Owner card shows reviews with star ratings

---

## 🔧 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reviews/:leaseId` | Submit review for a lease |
| GET | `/api/reviews/user/:userId` | Get reviews for a user |
| GET | `/api/reviews/lease/:leaseId` | Get reviews for a lease |
| GET | `/api/rscore/:userId` | Get R-Score and level |
| PUT | `/api/leases/complete/:leaseId` | Complete lease, update stats |

---

## 📊 Database Schema Changes

### Users Table
- Added columns: `onTimeReturns`, `lateReturns`, `goodConditionReturns`, `damageReports`, `lostItems`, `disputesWon`, `disputesLost`, `ratingImpactSum`, `completedLeases`, `rscore`

### Leases Table
- Added columns: `returned`, `returnedAt`, `returnCondition`, `returnedOnTime`

### Reviews Table (NEW)
- Columns: `id`, `LeaseId`, `reviewerId`, `reviewedUserId`, `rating`, `comment`, `createdAt`, `updatedAt`

Sequelize will automatically sync these with `{ alter: true }` mode.

---

## ✅ Completion Checklist

- ✅ User model extended with R-Score fields
- ✅ Lease model extended with return tracking
- ✅ Review model created
- ✅ R-Score calculation function implemented
- ✅ Review controller and routes created
- ✅ R-Score controller and routes created
- ✅ Lease completion endpoint added
- ✅ ReviewModal component created
- ✅ RScore page implemented
- ✅ MyLeases enhanced with complete & review flow
- ✅ ItemDetail enhanced with owner reviews
- ✅ All routes registered in server.js

---

## 🎯 Next Steps (Optional Enhancements)

1. **Add R-Score to Navbar** - Link to `/rscore` page
2. **Show R-Score Badge on Profile** - Display user's score prominently
3. **Add Dispute Resolution UI** - Allow users to create/resolve disputes
4. **Add Review Editing** - Let users edit their reviews
5. **Add Review Replies** - Allow owners to reply to reviews
6. **Email Notifications** - Send email when R-Score changes significantly
7. **Leaderboard** - Show top-rated users

---

## 📝 Notes

- Default R-Score for new users is **80**
- Scores are recalculated immediately after:
  - Lease completion
  - Review submission
  - Dispute resolution
- Frontend uses token-based auth (JWT)
- All API calls require authentication (`auth` middleware)

---

## 🐛 Troubleshooting

### Backend Not Reflecting Changes
- Restart backend server
- Check console for errors
- Verify Sequelize sync is running with `{ alter: true }`

### Frontend Not Showing New Components
- Check browser console for errors
- Verify imports are correct
- Clear cache and hard reload (Ctrl+Shift+R)

### R-Score Not Updating
- Check backend logs for calculation errors
- Verify user stats are being updated
- Check if `calculateRScore` is called after stat updates

---

## 📞 Support

For issues or questions, check:
- Backend console logs
- Browser console logs
- Network tab in DevTools
- Database records (use a DB client)

---

**Implementation Complete! 🎉**
