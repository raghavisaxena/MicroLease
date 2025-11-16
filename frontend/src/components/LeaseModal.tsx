import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface LeaseModalProps {
  open: boolean;
  initialStart?: string; // YYYY-MM-DD
  initialEnd?: string; // YYYY-MM-DD
  title?: string;
  itemPrice?: number; // Price per day
  onClose: () => void;
  onSubmit: (startDate: string, endDate: string, securityDeposit: number) => Promise<void> | void;
}

const LeaseModal = ({ open, initialStart, initialEnd, title = 'Lease', itemPrice = 0, onClose, onSubmit }: LeaseModalProps) => {
  const today = new Date().toISOString().split('T')[0];
  const defaultStart = initialStart || today;
  const defaultEnd = initialEnd || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);
  const [securityDeposit, setSecurityDeposit] = useState<number>(itemPrice);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setStartDate(initialStart || defaultStart);
      setEndDate(initialEnd || defaultEnd);
      setSecurityDeposit(itemPrice);
      setSubmitting(false);
    }
  }, [open, initialStart, initialEnd, itemPrice]);

  // Calculate rental days and total
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const days = calculateDays();
  const rentalCost = days * itemPrice;
  const totalCost = rentalCost + securityDeposit;

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!startDate || !endDate) return;
    if (new Date(endDate) < new Date(startDate)) {
      alert('End date must be same or after start date');
      return;
    }
    if (securityDeposit < itemPrice) {
      alert(`Security deposit must be at least ₹${itemPrice}`);
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit(startDate, endDate, securityDeposit);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Start date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 border rounded" required />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">End date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 border rounded" required />
          </div>
          
          {/* Security Deposit Section */}
          <div className="border-t border-border pt-4">
            <label className="block text-sm font-semibold mb-3">Security Deposit</label>
            <p className="text-xs text-muted-foreground mb-2">
              This amount will be held during the rental period and refunded within 24 hours of returning the item (if no damage is claimed).
            </p>
            <div className="flex gap-2">
              <span className="text-sm">₹</span>
              <input 
                type="number" 
                value={securityDeposit} 
                onChange={(e) => setSecurityDeposit(Math.max(itemPrice, parseFloat(e.target.value) || 0))}
                min={itemPrice}
                step="100"
                className="w-full p-2 border rounded" 
              />
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-secondary/50 rounded p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Rental ({days} day{days !== 1 ? 's' : ''})</span>
              <span>₹{rentalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Security Deposit</span>
              <span>₹{securityDeposit.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-semibold">
              <span>Total Amount</span>
              <span>₹{totalCost.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Processing...' : 'Confirm'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaseModal;
