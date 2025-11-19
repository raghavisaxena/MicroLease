# R-Score & Reviews - Quick Reference Card

## 🎯 Quick Commands

### Start Backend
```powershell
cd "c:\Users\hp\OneDrive\Desktop\dbms pbl\MicroLease\backend"
node server.js
```

### Frontend Already Running
No action needed - components auto-load

---

## 📡 API Endpoints

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/reviews/:leaseId` | `{ rating, comment, reviewedUserId }` | `{ review }` |
| GET | `/api/reviews/user/:userId` | - | `[reviews]` |
| GET | `/api/reviews/lease/:leaseId` | - | `[reviews]` |
| GET | `/api/rscore/:userId` | - | `{ rscore, level }` |
| PUT | `/api/leases/complete/:leaseId` | `{ condition, returnedAt }` | `{ lease, message }` |

---

## 🔢 R-Score Formula

```
Base Score = 80

Additions (+):
  onTimeReturns × 5
  goodConditionReturns × 3
  ratingImpactSum  [from reviews: (rating-3) × 2.5]
  disputesWon × 10
  (completedLeases / 5) × 10  [floor division]

Deductions (−):
  lateReturns × 10
  damageReports × 15
  lostItems × 40
  disputesLost × 20

Final = clamp(result, 0, 100)
```

---

## 🏆 Level Mapping

| Score | Level | Color | Badge |
|-------|-------|-------|-------|
| 90-100 | A - Excellent | Green | default |
| 75-89 | B - Good | Blue | secondary |
| 50-74 | C - Fair | Yellow | outline |
| 0-49 | D - Poor | Red | destructive |

---

## 📊 Database Fields

### Users (New Fields)
- `onTimeReturns` INT(0)
- `lateReturns` INT(0)
- `goodConditionReturns` INT(0)
- `damageReports` INT(0)
- `lostItems` INT(0)
- `disputesWon` INT(0)
- `disputesLost` INT(0)
- `ratingImpactSum` FLOAT(0)
- `completedLeases` INT(0)
- `rscore` FLOAT(80)

### Leases (New Fields)
- `returned` BOOLEAN(false)
- `returnedAt` DATE
- `returnCondition` ENUM('good','damaged','lost')
- `returnedOnTime` BOOLEAN

### Reviews (New Table)
- `id` INT PK
- `LeaseId` INT FK
- `reviewerId` INT FK
- `reviewedUserId` INT FK
- `rating` INT (1-5)
- `comment` TEXT
- `createdAt`, `updatedAt`

---

## 🎨 Frontend Components

### ReviewModal
```tsx
<ReviewModal
  open={bool}
  onClose={() => {}}
  onSubmit={(rating, comment) => {}}
  leaseId={number}
  reviewedUserId={number}
  reviewedUserName={string}
/>
```

### Routes
- `/rscore` - Current user's score
- `/rscore/:id` - View another user's score

---

## 🔧 Key Functions

### Backend
```javascript
// Calculate R-Score
const { calculateRScore } = require('./lib/rscore');
const newScore = calculateRScore(userStats);

// Get level
const { levelFromScore } = require('./lib/rscore');
const level = levelFromScore(score);
```

### Frontend
```typescript
// Complete lease
await api.put(`/leases/complete/${leaseId}`, {
  condition: 'good',
  returnedAt: new Date().toISOString()
});

// Submit review
await api.post(`/reviews/${leaseId}`, {
  rating: 5,
  comment: 'Great!',
  reviewedUserId: 123
});

// Get R-Score
const { data } = await api.get(`/rscore/${userId}`);
// data: { rscore: 85, level: 'B - Good' }
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Port 5000 busy → kill process or use different port |
| Models not syncing | Check `{ alter: true }` in server.js |
| R-Score not updating | Check backend logs for errors in calculateRScore |
| Review modal not opening | Check browser console for API errors |
| Reviews not showing | Verify Review model associations in models/index.js |

---

## ✅ Quick Test

1. Complete lease → Stats update ✓
2. Review modal opens ✓
3. Submit review → Owner's score updates ✓
4. Visit `/rscore` → See updated score ✓

---

## 📞 Files to Check

- Backend: `backend/models/`, `backend/routes/`, `backend/lib/rscore.js`
- Frontend: `src/pages/RScore.tsx`, `src/pages/MyLeases.tsx`, `src/components/ReviewModal.tsx`
- Docs: `RSCORE_IMPLEMENTATION.md`, `QUICK_START.md`, `TESTING_SCENARIOS.md`

---

## 💡 Common Patterns

### Update Stats Pattern
```javascript
user.statField = (user.statField || 0) + 1;
user.rscore = calculateRScore({
  onTimeReturns: user.onTimeReturns,
  lateReturns: user.lateReturns,
  // ... all stats
});
await user.save();
```

### Review Submission Pattern
```javascript
const review = await Review.create({ LeaseId, reviewerId, reviewedUserId, rating, comment });
const impact = (rating - 3) * 2.5;
reviewedUser.ratingImpactSum += impact;
reviewedUser.rscore = calculateRScore(reviewedUser);
await reviewedUser.save();
```

---

## 🎯 Integration Points

**MyLeases → Complete Lease:**
1. User clicks "Complete & Return"
2. Frontend calls PUT `/leases/complete/:id`
3. Backend updates lease + borrower stats
4. Frontend opens ReviewModal

**ReviewModal → Submit:**
1. User clicks "Submit Review"
2. Frontend calls POST `/reviews/:leaseId`
3. Backend saves review + updates owner stats
4. Frontend shows success toast

**RScore Page:**
1. Component mounts
2. Fetches rscore, user data, reviews
3. Displays all in cards

---

## 📦 Dependencies

All dependencies already in project:
- Backend: Sequelize, Express, JWT auth
- Frontend: React Query, Shadcn UI, Axios

---

**Keep this card handy while developing! 📌**
