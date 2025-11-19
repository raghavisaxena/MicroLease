# Lease Acceptance & Digital Agreement System

## Overview
Implemented a complete lease acceptance workflow where owners can set security deposits when accepting lease requests, and digital rental agreements are automatically generated and downloaded.

## Features Implemented



### 1. Security Deposit Handling
- **Extend Lease**: Security deposit field is now hidden when extending existing leases (owners already have deposit on file)
- **New Lease Acceptance**: Owners must set security deposit amount when accepting new lease requests
- **Modal Dialog**: Clean UI for inputting security deposit with:
  - Item and lessee details display
  - Suggested amount (item's daily price)
  - Validation and error handling

### 2. Digital Agreement Generation
- **Auto-download**: Rental agreement automatically downloads as .txt file when lease is approved
- **Agreement Contents**:
  - Lease ID and date
  - Owner and lessee details
  - Item information
  - Lease duration and dates
  - Rental cost breakdown
  - Security deposit amount
  - Terms and conditions
  - Signature placeholders for both parties
- **File Naming**: `Rental_Agreement_{leaseId}_{timestamp}.txt`

### 3. Backend Changes
- **Lease Model**: Added `securityDeposit` field (FLOAT, default 0)
- **Decision Endpoint**: Modified `/leases/:id/decision` to accept and store `securityDeposit`
- **Database Migration**: Added column to leases table with migration script

## Files Modified

### Frontend
1. **src/pages/MyLeases.tsx**
   - Added accept modal state management
   - Created `generateAgreement()` function
   - Created `handleAcceptWithDeposit()` function
   - Added Dialog component for security deposit input
   - Modified accept button to open modal instead of direct API call

2. **src/components/LeaseModal.tsx**
   - Added `hideSecurityDeposit` prop
   - Conditional rendering of security deposit section
   - Adjusted cost calculation when deposit is hidden

### Backend
1. **models/lease.js**
   - Added `securityDeposit: { type: DataTypes.FLOAT, defaultValue: 0 }`

2. **routes/leases.js**
   - Modified decision endpoint to accept `securityDeposit` parameter
   - Store security deposit when approving lease

3. **scripts/add_security_deposit_column.js**
   - Migration script to add column to existing database

## How It Works

### Extend Lease Flow (Lessee)
1. Lessee clicks "Extend" on active lease
2. Modal opens with dates only (no security deposit field)
3. Security deposit is excluded from cost calculation
4. Submits extension request

### Accept Lease Flow (Owner)
1. Owner receives lease request in "New Requests" tab
2. Clicks accept (checkmark icon)
3. Modal opens asking for security deposit amount
4. Shows item details, lessee name, and duration
5. Owner enters deposit amount (suggested: daily price)
6. Clicks "Approve Lease"
7. Backend:
   - Updates lease status to 'approved'
   - Stores security deposit amount
   - Creates payment record
   - Marks item as unavailable
8. Frontend:
   - Generates digital agreement with all details
   - Auto-downloads agreement as .txt file
   - Shows success message
   - Refreshes lease lists

## Agreement Format
```
RENTAL AGREEMENT

Lease ID: [ID]
Date: [Date]

PARTIES:
Owner: [Owner Name]
Lessee: [Lessee Name]

ITEM DETAILS:
Item: [Item Name]
Description: [Item Description]

LEASE PERIOD:
Start Date: [Start Date]
End Date: [End Date]

FINANCIAL TERMS:
Rental Amount: ₹[Amount]
Security Deposit: ₹[Deposit]
Total: ₹[Total]

TERMS & CONDITIONS:
1. The lessee agrees to use the item with reasonable care
2. The lessee is responsible for any damage beyond normal wear and tear
3. The security deposit will be refunded upon successful return of the item in good condition
4. Late returns may incur additional charges
5. The item must be returned on or before the end date

SIGNATURES:
Owner: _____________________ Date: _______
Lessee: _____________________ Date: _______
```

## Testing Checklist
- [ ] Extend lease modal hides security deposit field
- [ ] Accept button opens security deposit modal
- [ ] Security deposit is stored in database
- [ ] Agreement downloads successfully
- [ ] Agreement contains correct information
- [ ] Lease status updates to 'approved'
- [ ] Item availability updates to false
- [ ] Payment record is created
- [ ] Both lease lists refresh after approval

## Future Enhancements
- Send agreement via email to both parties
- Allow digital signatures
- Store agreements in database
- PDF generation instead of .txt
- Lessee can download agreement from their lease view
- Agreement preview before download
