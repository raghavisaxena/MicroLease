import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

interface LeaseModalProps {
  open: boolean;
  initialStart?: string; // YYYY-MM-DD
  initialEnd?: string; // YYYY-MM-DD
  title?: string;
  itemPrice?: number; // Price per day
  onClose: () => void;
  onSubmit: (startDate: string, endDate: string, securityDeposit: number) => Promise<void> | void;
  hideSecurityDeposit?: boolean; // New prop to hide security deposit for extend requests
}

const LeaseModal = ({ open, initialStart, initialEnd, title = 'Lease', itemPrice = 0, onClose, onSubmit, hideSecurityDeposit = false }: LeaseModalProps) => {
  const today = new Date().toISOString().split('T')[0];
  const defaultStart = initialStart || today;
  const defaultEnd = initialEnd || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  // Calculate rental days and total
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const days = calculateDays();
  const rentalCost = days * itemPrice;
  // Security deposit is 15% of total rental cost
  const securityDeposit = Math.round(rentalCost * 0.15);
  const totalCost = rentalCost + securityDeposit;

  useEffect(() => {
    if (open) {
      setStartDate(initialStart || defaultStart);
      setEndDate(initialEnd || defaultEnd);
      setSubmitting(false);
    }
  }, [open, initialStart, initialEnd, itemPrice]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!startDate || !endDate) return;
    if (new Date(endDate) < new Date(startDate)) {
      alert('End date must be same or after start date');
      return;
    }

    try {
      setSubmitting(true);

      // Check wallet balance before sending request
      const walletResponse = await api.get('/wallet');
      const currentBalance = walletResponse.data.wallet?.balance || 0;

      if (currentBalance < totalCost) {
        const shortfall = totalCost - currentBalance;
        toast.error(`Insufficient wallet balance. You need ₹${shortfall.toFixed(2)} more.`);
        toast.info('Redirecting to wallet to add funds...');
        setSubmitting(false);
        setTimeout(() => {
          navigate('/wallet');
          onClose();
        }, 1500);
        return;
      }

      // Submit the lease request (payment will be processed when owner approves)
      await onSubmit(startDate, endDate, securityDeposit);
    } catch (error: any) {
      console.error('Error in lease submission:', error);
      toast.error(error.response?.data?.message || 'Failed to submit lease request');
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
          
          {/* Security Deposit Section - Hidden for extend requests */}
          {!hideSecurityDeposit && (
            <div className="border-t border-border pt-4">
              <label className="block text-sm font-semibold mb-3">Security Deposit (15% of rental cost)</label>
              <p className="text-xs text-muted-foreground mb-2">
                Security deposit is automatically calculated as 15% of the total rental cost. This amount will be refunded within 24 hours of returning the item (if no damage is claimed).
              </p>
              <div className="bg-muted/50 p-3 rounded-lg">
                <span className="text-lg font-semibold">₹{securityDeposit}</span>
              </div>
            </div>
          )}

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
