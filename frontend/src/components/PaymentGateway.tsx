import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PaymentGatewayProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  purpose: string;
  onSuccess: (transactionId: string) => void;
  onError?: (error: string) => void;
}

const PaymentGateway = ({ open, onClose, amount, purpose, onSuccess, onError }: PaymentGatewayProps) => {
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    // Validation
    if (!cardNumber || cardNumber.length !== 16) {
      toast.error("Please enter a valid 16-digit card number");
      return;
    }
    if (!cardHolder.trim()) {
      toast.error("Please enter card holder name");
      return;
    }
    if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
      toast.error("Please enter expiry date in MM/YY format");
      return;
    }
    if (!cvv || cvv.length !== 3) {
      toast.error("Please enter a valid 3-digit CVV");
      return;
    }

    setProcessing(true);

    // Simulate payment processing delay
    setTimeout(() => {
      // Mock payment success (90% success rate for realism)
      const success = Math.random() > 0.1;
      
      if (success) {
        const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
        toast.success("Payment successful!");
        onSuccess(transactionId);
        handleClose();
      } else {
        const error = "Payment failed. Please try again.";
        toast.error(error);
        if (onError) onError(error);
        setProcessing(false);
      }
    }, 2000);
  };

  const handleClose = () => {
    if (!processing) {
      setCardNumber("");
      setCardHolder("");
      setExpiryDate("");
      setCvv("");
      onClose();
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned.slice(0, 16);
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const formatCVV = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 3);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Gateway
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">{purpose}</p>
            <p className="text-2xl font-bold">₹{amount.toLocaleString()}</p>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={16}
                disabled={processing}
              />
            </div>

            <div>
              <Label htmlFor="cardHolder">Card Holder Name</Label>
              <Input
                id="cardHolder"
                placeholder="John Doe"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                disabled={processing}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                  maxLength={5}
                  disabled={processing}
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  type="password"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(formatCVV(e.target.value))}
                  maxLength={3}
                  disabled={processing}
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              🔒 This is a mock payment gateway. Use any test card number (16 digits) for simulation.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={processing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={processing}
              className="flex-1"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ₹${amount.toLocaleString()}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentGateway;
