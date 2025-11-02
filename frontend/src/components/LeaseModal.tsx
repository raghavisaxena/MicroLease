import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface LeaseModalProps {
  open: boolean;
  initialStart?: string; // YYYY-MM-DD
  initialEnd?: string; // YYYY-MM-DD
  title?: string;
  onClose: () => void;
  onSubmit: (startDate: string, endDate: string) => Promise<void> | void;
}

const LeaseModal = ({ open, initialStart, initialEnd, title = 'Lease', onClose, onSubmit }: LeaseModalProps) => {
  const today = new Date().toISOString().split('T')[0];
  const defaultStart = initialStart || today;
  const defaultEnd = initialEnd || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setStartDate(initialStart || defaultStart);
      setEndDate(initialEnd || defaultEnd);
      setSubmitting(false);
    }
  }, [open, initialStart, initialEnd]);

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
      await onSubmit(startDate, endDate);
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
