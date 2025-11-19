# Testing Scenarios - R-Score & Reviews System

## 🧪 Complete Testing Guide

### Prerequisites
- Backend server running on port 5000
- Frontend running on port 5173 (or your port)
- At least 2 users registered
- At least 1 item listed by User A
- At least 1 active lease (User B borrowing from User A)

---

## Test Scenario 1: Complete Lease (On-Time, Good Condition)

### Setup
- User B has borrowed an item from User A
- Lease end date is in the future or today

### Steps
1. **Login as User B** (borrower)
2. Navigate to **My Leases** page
3. Click **Borrowed** tab
4. Find the active lease
5. Select **"Good"** from condition dropdown
6. Click **"Complete & Return"** button

### Expected Results
✅ Toast appears: "Lease completed! Stats updated."  
✅ Review modal opens automatically  
✅ Backend updates:
   - `Lease.returned = true`
   - `Lease.returnedOnTime = true` (if before/on end date)
   - `Lease.returnCondition = 'good'`
   - `User B.onTimeReturns += 1`
   - `User B.goodConditionReturns += 1`
   - `User B.completedLeases += 1`
   - `User B.rscore` recalculated (should increase)
✅ Item becomes available again

### Verify in Database
```sql
-- Check lease
SELECT * FROM leases WHERE id = <leaseId>;
-- Should show: returned=1, returnCondition='good', returnedOnTime=1

-- Check User B's stats
SELECT name, rscore, onTimeReturns, goodConditionReturns, completedLeases 
FROM users WHERE id = <userBId>;
-- Should show incremented values
```

---

## Test Scenario 2: Submit Review (5 Stars)

### Setup
- Continuing from Scenario 1, review modal is open

### Steps
1. Click **5th star** to rate 5/5
2. Type comment: "Excellent experience! Highly recommended."
3. Click **"Submit Review"** button

### Expected Results
✅ Toast appears: "Review submitted!"  
✅ Modal closes  
✅ Backend creates Review record  
✅ Backend updates User A (owner):
   - `ratingImpactSum += (5-3) × 2.5 = +5.0`
   - `rscore` recalculated (should increase)

### Verify in Database
```sql
-- Check review
SELECT * FROM reviews WHERE LeaseId = <leaseId>;
-- Should show: rating=5, comment='Excellent...'

-- Check User A's stats
SELECT name, rscore, ratingImpactSum FROM users WHERE id = <userAId>;
-- ratingImpactSum should have increased by 5.0
```

---

## Test Scenario 3: View R-Score Page

### Steps
1. Still logged in as User B
2. Navigate to **`/rscore`** (or click link if added to Navbar)

### Expected Results
✅ Page loads successfully  
✅ Displays User B's R-Score (should be > 80 if first lease)  
✅ Shows level badge (likely "B - Good" or "A - Excellent")  
✅ Statistics show:
   - On-Time Returns: 1
   - Good Condition Returns: 1
   - Completed Leases: 1
   - All other stats: 0
✅ Reviews section shows "No reviews yet" (User B hasn't received reviews)

---

## Test Scenario 4: View Owner's R-Score

### Steps
1. Still logged in as User B
2. Navigate to **`/rscore/<userAId>`** (replace with User A's ID)

### Expected Results
✅ Page loads showing User A's stats  
✅ Reviews section shows the 5-star review from User B  
✅ Review displays:
   - Reviewer name: User B's name
   - Rating: ★★★★★
   - Comment: "Excellent experience..."

---

## Test Scenario 5: View Reviews on Item Detail

### Steps
1. Navigate to **Browse** page
2. Click on User A's item (the one that was leased)
3. Scroll to **Owner** section

### Expected Results
✅ Owner card shows User A's name  
✅ Reviews section displays (1 review)  
✅ Shows the 5-star review with comment  
✅ Scrollable if more than 3 reviews

---

## Test Scenario 6: Complete Lease (Late, Damaged)

### Setup
- User B has another active lease from User A
- End date is in the past (overdue)

### Steps
1. Login as User B
2. Go to My Leases → Borrowed
3. Select **"Damaged"** from dropdown
4. Click **"Complete & Return"**

### Expected Results
✅ Backend updates:
   - `Lease.returnedOnTime = false` (past end date)
   - `Lease.returnCondition = 'damaged'`
   - `User B.lateReturns += 1`
   - `User B.damageReports += 1`
   - `User B.completedLeases += 1`
   - `User B.rscore` recalculated (should **decrease**)

### Verify R-Score Calculation
```
Initial: 80
+ onTimeReturns (1) × 5 = +5
+ goodConditionReturns (1) × 3 = +3
- lateReturns (1) × 10 = -10
- damageReports (1) × 15 = -15
+ completedLeases (2) / 5 × 10 = 0 (not yet 5)
= 80 + 5 + 3 - 10 - 15 = 63
```

Expected new rscore: **~63**

---

## Test Scenario 7: Complete Lease (Lost Item)

### Setup
- User C has borrowed from User A
- Item was lost during lease

### Steps
1. Login as User C
2. Complete lease with condition **"Lost"**

### Expected Results
✅ `User C.lostItems += 1`  
✅ `User C.rscore` drops significantly (−40 points)  
✅ R-Score level changes to "D - Poor" or "C - Fair"

---

## Test Scenario 8: Submit Negative Review (1 Star)

### Steps
1. After completing a lease, review modal opens
2. Click **1st star** only
3. Comment: "Poor experience, item was not as described."
4. Submit

### Expected Results
✅ Backend updates owner:
   - `ratingImpactSum += (1-3) × 2.5 = −5.0`
   - `rscore` **decreases**

---

## Test Scenario 9: Every 5 Leases Bonus

### Setup
- User D has completed 4 leases already

### Steps
1. Complete 5th lease

### Expected Results
✅ `completedLeases = 5`  
✅ Bonus: `Math.floor(5/5) × 10 = +10 points`  
✅ R-Score increases by bonus amount

---

## Test Scenario 10: Score Cap (Max 100)

### Setup
- User E has very high stats

### Steps
1. Complete multiple leases with good conditions
2. Check R-Score

### Expected Results
✅ R-Score never exceeds **100**  
✅ Calculation clamped: `Math.min(score, 100)`

---

## Test Scenario 11: Score Floor (Min 0)

### Setup
- User F has many penalties (lost items, late returns)

### Steps
1. Accumulate penalties
2. Check R-Score

### Expected Results
✅ R-Score never goes below **0**  
✅ Calculation clamped: `Math.max(score, 0)`

---

## 🔍 API Testing with Thunder Client / Postman

### Get R-Score
```
GET http://localhost:5000/api/rscore/:userId
Authorization: Bearer <token>

Expected Response:
{
  "rscore": 87.5,
  "level": "B - Good"
}
```

### Submit Review
```
POST http://localhost:5000/api/reviews/:leaseId
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "rating": 5,
  "comment": "Great experience!",
  "reviewedUserId": 2
}

Expected Response:
{
  "review": {
    "id": 1,
    "LeaseId": 1,
    "reviewerId": 3,
    "reviewedUserId": 2,
    "rating": 5,
    "comment": "Great experience!",
    "createdAt": "2025-11-17T10:00:00Z",
    "updatedAt": "2025-11-17T10:00:00Z"
  }
}
```

### Complete Lease
```
PUT http://localhost:5000/api/leases/complete/:leaseId
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "condition": "good",
  "returnedAt": "2025-11-17T10:00:00Z"
}

Expected Response:
{
  "lease": { ...updated lease... },
  "message": "Lease completed and stats updated"
}
```

### Get User Reviews
```
GET http://localhost:5000/api/reviews/user/:userId
Authorization: Bearer <token>

Expected Response:
[
  {
    "id": 1,
    "rating": 5,
    "comment": "Great!",
    "reviewer": { "id": 3, "name": "John Doe" },
    "lease": { ...lease data... }
  }
]
```

---

## 🐛 Error Case Testing

### Test 1: Invalid Rating
```
POST /api/reviews/:leaseId
Body: { "rating": 6, "reviewedUserId": 2 }

Expected: 400 Bad Request
Message: "Invalid rating"
```

### Test 2: Unauthorized Review
```
POST /api/reviews/:leaseId (different user, not in lease)

Expected: 403 Forbidden
Message: "You are not part of this lease"
```

### Test 3: Complete Non-Existent Lease
```
PUT /api/leases/complete/99999

Expected: 404 Not Found
Message: "Lease not found"
```

### Test 4: Get R-Score Without Auth
```
GET /api/rscore/:userId
(no Authorization header)

Expected: 401 Unauthorized
```

---

## ✅ Acceptance Criteria

All these should pass:

- [ ] Complete lease updates borrower stats correctly
- [ ] R-Score recalculates on lease completion
- [ ] Review modal opens after completion
- [ ] Review submission updates owner stats
- [ ] R-Score recalculates on review submission
- [ ] R-Score page displays correctly
- [ ] Reviews show on item detail page
- [ ] Score is capped between 0 and 100
- [ ] All API endpoints return expected responses
- [ ] Database records are created/updated correctly
- [ ] UI shows loading states and error messages
- [ ] Toast notifications appear at right times

---

## 📊 Performance Testing

### Load Test: Multiple Reviews
1. Submit 10 reviews rapidly
2. Check if all are saved
3. Verify R-Score updates correctly

### Load Test: Concurrent Completions
1. Complete multiple leases simultaneously
2. Check for race conditions
3. Verify stats are accurate

---

## 🎯 Edge Cases

### Edge Case 1: Lease completed exactly on end date
- Should count as `returnedOnTime = true`

### Edge Case 2: Review with empty comment
- Should be allowed (comment is optional)

### Edge Case 3: User reviews themselves
- Should be blocked by backend validation

### Edge Case 4: Multiple reviews for same lease
- Current implementation: allowed
- Consider: add unique constraint or allow only one review per user per lease

---

## 📝 Test Report Template

After testing, fill out:

```
Test Date: _____________
Tester: ________________

Scenario 1 (Complete Good): ✅ / ❌
Scenario 2 (Submit Review): ✅ / ❌
Scenario 3 (View R-Score): ✅ / ❌
Scenario 4 (View Owner Score): ✅ / ❌
Scenario 5 (Item Reviews): ✅ / ❌
Scenario 6 (Late/Damaged): ✅ / ❌
Scenario 7 (Lost Item): ✅ / ❌
Scenario 8 (Negative Review): ✅ / ❌
Scenario 9 (5 Lease Bonus): ✅ / ❌
Scenario 10 (Max Cap): ✅ / ❌
Scenario 11 (Min Floor): ✅ / ❌

Issues Found:
1. _________________________
2. _________________________

Notes:
_____________________________
```

---

**Ready to test! 🚀**

Follow scenarios in order for comprehensive coverage.
