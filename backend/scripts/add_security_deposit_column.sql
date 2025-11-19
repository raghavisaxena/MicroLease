-- Add securityDepositAmount column to leases table
ALTER TABLE leases ADD COLUMN securityDepositAmount FLOAT DEFAULT 0 AFTER amount;
