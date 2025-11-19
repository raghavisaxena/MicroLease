import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Archive, Inbox, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  CheckCircle,
  Delete,
  Edit,
  MapPin,
  Trash2,
  User2,
  X,
  HelpCircle,
  Send,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import LeaseModal from "@/components/LeaseModal";
import ReviewModal from "@/components/ReviewModal";
import PaymentGateway from "@/components/PaymentGateway";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const MyLeases = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("token");
  const queryClient = useQueryClient();
  const [extendingId, setExtendingId] = useState<number | null>(null);
  const [leaseModalOpen, setLeaseModalOpen] = useState(false);
  const [modalLeaseId, setModalLeaseId] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<"extend" | "return" | null>(null);
  const [modalInitialStart, setModalInitialStart] = useState<
    string | undefined
  >(undefined);
  const [modalInitialEnd, setModalInitialEnd] = useState<string | undefined>(
    undefined
  );
  // Lessee details UI state (maps keyed by lease id)
  const [detailsOpenMap, setDetailsOpenMap] = useState<Record<number, boolean>>(
    {}
  );
  const [lesseeDetailsMap, setLesseeDetailsMap] = useState<Record<number, any>>(
    {}
  );
  const [loadingLesseeMap, setLoadingLesseeMap] = useState<
    Record<number, boolean>
  >({});
  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewLeaseId, setReviewLeaseId] = useState<number | null>(null);
  const [reviewedUserId, setReviewedUserId] = useState<number | null>(null);
  const [reviewedUserName, setReviewedUserName] = useState<string | null>(null);
  // Complete lease state
  const [completingLeaseId, setCompletingLeaseId] = useState<number | null>(null);
  const [returnCondition, setReturnCondition] = useState<string>("good");
  // Accept lease state
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [acceptingLease, setAcceptingLease] = useState<any>(null);
  const [securityDepositAmount, setSecurityDepositAmount] = useState<number>(0);
  // Help Centre state
  const [helpCentreOpen, setHelpCentreOpen] = useState(false);
  const [complaintType, setComplaintType] = useState<string>("complaint");
  const [complaintAgainst, setComplaintAgainst] = useState<string>("");
  const [disputeContent, setDisputeContent] = useState<string>("");
  const [relatedLeaseId, setRelatedLeaseId] = useState<number | null>(null);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  // Payment Gateway state
  const [paymentGatewayOpen, setPaymentGatewayOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentPurpose, setPaymentPurpose] = useState<string>("");
  const [paymentLeaseId, setPaymentLeaseId] = useState<number | null>(null);
  const [paymentType, setPaymentType] = useState<"security_deposit" | "full_payment">("security_deposit");

  // Fetch borrowed leases
  const { data: borrowedLeases, isLoading: isLoadingBorrowed } = useQuery({
    queryKey: ["leases", "borrowed"],
    queryFn: async () => {
      const res = await api.get("/leases/borrowed");
      return Array.isArray(res.data) ? res.data : [];
    },
    retry: false,
  });

  // Fetch owned leases (leases for items owned by user)
  const { data: ownedLeases, isLoading: isLoadingOwned } = useQuery({
    queryKey: ["leases", "owned"],
    queryFn: async () => {
      const res = await api.get("/leases/owned");
      return Array.isArray(res.data) ? res.data : [];
    },
    retry: false,
  });

  // Fetch items owned by current user (all items they've listed)
  const {
    data: myItems,
    isLoading: isLoadingMyItems,
    isError: isErrorMyItems,
    error: errorMyItems,
    refetch: refetchMyItems,
  } = useQuery({
    queryKey: ["items", "my"],
    queryFn: async () => {
      try {
        const res = await api.get("/items/my");
        console.log("Fetched my items:", res.data);
        return Array.isArray(res.data) ? res.data : [];
      } catch (error: any) {
        console.error("Error fetching my items:", error);
        // If unauthorized, user might not be logged in
        if (error.response?.status === 401) {
          console.warn("User not authenticated");
        }
        throw error;
      }
    },
    retry: false,
    enabled: !!localStorage.getItem("token"), // Only fetch if user is logged in
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Helper to normalize image URL
  const getImageSrc = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return "/placeholder.svg";
    const raw = String(imageUrl).trim();
    if (
      raw.startsWith("data:") ||
      raw.startsWith("http") ||
      raw.startsWith("/")
    ) {
      return raw;
    }
    const base64pattern = /^[A-Za-z0-9+/=\n\r]+$/;
    const onlyBase64 = base64pattern.test(raw.replace(/\s/g, ""));
    return onlyBase64
      ? `data:image/jpeg;base64,${raw}`
      : raw || "/placeholder.svg";
  };

  // Categorize borrowed leases
  const activeBorrowed = (borrowedLeases || []).filter(
    (lease: any) => lease.status === "active" || lease.status === "approved"
  );
  const pastBorrowed = (borrowedLeases || []).filter(
    (lease: any) => lease.status === "completed" || lease.status === "cancelled"
  );

  // Calculate new requests count from owned leases
  const newRequests = (ownedLeases || []).filter(
    (lease: any) => lease.status === "pending" || lease.status === "approved" || lease.status === "active"
  );

  // Calculate sent requests (lease requests made by current user as lessee)
  const sentRequests = (borrowedLeases || []).filter(
    (lease: any) => lease.status === "pending"
  ); 

  // Handle extend lease
  // Open extend modal
  const openExtendModal = (
    leaseId: number,
    currentStart: string,
    currentEnd: string
  ) => {
    setModalLeaseId(leaseId);
    setModalMode("extend");
    setModalInitialStart(currentStart);
    setModalInitialEnd(currentEnd);
    setLeaseModalOpen(true);
  };

  const handleExtendLease = async (leaseId: number, newEndDate: string) => {
    setExtendingId(leaseId);
    try {
      await api.put(`/leases/${leaseId}`, { endDate: newEndDate });
      toast.success("Lease extended successfully!");
      queryClient.invalidateQueries({ queryKey: ["leases"] });
    } catch (error: any) {
      console.error("Extend lease error:", error);
      toast.error(error.response?.data?.message || "Failed to extend lease");
    } finally {
      setExtendingId(null);
    }
  };

  // Handle return early
  const openReturnModal = (
    leaseId: number,
    currentStart: string,
    currentEnd: string
  ) => {
    setModalLeaseId(leaseId);
    setModalMode("return");
    setModalInitialStart(currentStart);
    setModalInitialEnd(currentEnd);
    setLeaseModalOpen(true);
  };

  // Generate digital agreement
  const generateAgreement = (lease: any, ownerName: string, lesseeName: string, securityDeposit: number) => {
    // Get item details from either Item or item property
    const item = lease.Item || lease.item || {};
    const lessee = lease.Lessee || lease.lessee || {};
    
    // Calculate rental details
    const startDate = new Date(lease.startDate);
    const endDate = new Date(lease.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const pricePerDay = item.pricePerDay || 0;
    const totalRentalCost = days * pricePerDay;
    const totalAmount = totalRentalCost + securityDeposit;
    
    const agreementText = `
╔═══════════════════════════════════════════════════════════════════════════╗
║                           RENTAL AGREEMENT                                ║
╚═══════════════════════════════════════════════════════════════════════════╝

Agreement Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
Agreement ID: LEASE-${lease.id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PARTIES TO THE AGREEMENT:

Owner (Lessor):
  Name: ${ownerName}
  
Lessee (Renter):
  Name: ${lesseeName}
  Email: ${lessee.email || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ITEM DETAILS:

Item Name: ${item.name || item.title || 'N/A'}
Description: ${item.description || 'N/A'}
Category: ${item.category || 'N/A'}
Condition: ${item.condition || 'Good'}
Location: ${item.location || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RENTAL PERIOD:

Start Date: ${startDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
End Date: ${endDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
Total Duration: ${days} ${days === 1 ? 'Day' : 'Days'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FINANCIAL TERMS:

Daily Rental Rate:           ₹${pricePerDay}
Number of Days:              ${days}
Total Rental Cost:           ₹${totalRentalCost}
Security Deposit (15%):      ₹${securityDeposit}
                             ─────────
TOTAL AMOUNT:                ₹${totalAmount}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TERMS AND CONDITIONS:

1. USAGE: The Lessee agrees to use the item with reasonable care and for its
   intended purpose only.

2. SECURITY DEPOSIT: A security deposit of ₹${securityDeposit} (15% of rental cost)
   will be held during the rental period. This deposit will be refunded within
   24 hours of returning the item in good condition.

3. DAMAGE LIABILITY: The Lessee is responsible for any damage beyond normal
   wear and tear. Repair costs will be deducted from the security deposit.

4. RETURN: The item must be returned on or before ${endDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}.
   Late returns may incur additional charges at the daily rate.

5. MAINTENANCE: The Lessee must maintain the item in good condition during the
   rental period.

6. LIABILITY: The Lessee assumes all liability for loss, theft, or damage to
   the item during the rental period.

7. CANCELLATION: Any cancellation must be communicated through the platform.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SIGNATURES:

Owner (Lessor):
Name: ${ownerName}
Signature: _____________________
Date: _________________________


Lessee (Renter):
Name: ${lesseeName}
Signature: _____________________
Date: _________________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated via MicroLease Platform
Generated on: ${new Date().toLocaleString('en-IN')}
    `.trim();

    const blob = new Blob([agreementText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rental_Agreement_${lease.id}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAcceptWithDeposit = async () => {
    if (!acceptingLease) return;
    
    try {
      // Approve the lease with security deposit
      await api.post(`/leases/${acceptingLease.id}/decision`, {
        action: "approve",
        securityDeposit: securityDepositAmount,
      });

      toast.success("Lease approved successfully! Lessee will be notified to complete payment.");

      // Fetch owner and lessee names for agreement
      const ownerName = acceptingLease.Item?.Owner?.name || "Owner";
      const lesseeName = acceptingLease.Lessee?.name || "Lessee";

      // Generate and download agreement
      generateAgreement(acceptingLease, ownerName, lesseeName, securityDepositAmount);

      // Close modal and refresh
      setAcceptModalOpen(false);
      setAcceptingLease(null);
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });

      // Lessee will need to pay from their borrowed leases section
    } catch (err: any) {
      console.error("Approve error", err);
      toast.error(err?.response?.data?.message || "Failed to approve lease");
    }
  };

  const processLeasePayment = async (lease: any) => {
    try {
      const rentalCost = lease.amount || 0;
      const securityDeposit = lease.securityDepositAmount || 0;
      const totalAmount = rentalCost + securityDeposit;

      // Check wallet balance first
      const walletResponse = await api.get('/wallet');
      const currentBalance = walletResponse.data.wallet?.balance || 0;

      if (currentBalance < totalAmount) {
        const shortfall = totalAmount - currentBalance;
        toast.error(`Insufficient wallet balance. You need ₹${shortfall.toFixed(2)} more.`);
        toast.info('Redirecting to wallet to add funds...');
        setTimeout(() => {
          navigate('/wallet');
        }, 2000);
        return;
      }

      // Process the payment
      const ownerId = lease.Item?.OwnerId || lease.Item?.owner?.id;
      const response = await api.post('/wallet/process-lease-payment', {
        leaseId: lease.id,
        rentalCost,
        securityDeposit,
        ownerId
      });

      toast.success(`Payment successful! ₹${rentalCost} paid to owner, ₹${securityDeposit} held as security deposit.`);
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    } catch (err: any) {
      console.error("Payment error", err);
      if (err.response?.status === 400 && err.response?.data?.message === 'Insufficient wallet balance') {
        const shortfall = err.response?.data?.shortfall || 0;
        toast.error(`Insufficient wallet balance. You need ₹${shortfall.toFixed(2)} more.`);
        toast.info('Redirecting to wallet to add funds...');
        setTimeout(() => {
          navigate('/wallet');
        }, 2000);
      } else {
        toast.error(err?.response?.data?.message || "Payment failed");
      }
    }
  };

  const handlePaymentSuccess = async (transactionId: string) => {
    try {
      if (paymentType === "security_deposit" && paymentLeaseId) {
        await api.post("/payments/security-deposit", {
          leaseId: paymentLeaseId,
          transactionId,
          amount: paymentAmount
        });
        toast.success("Security deposit payment successful!");
      } else if (paymentType === "full_payment" && paymentLeaseId) {
        await api.post("/payments/final-payment", {
          leaseId: paymentLeaseId,
          transactionId
        });
        toast.success("Full payment completed! Amount credited to owner's wallet.");
      }

      queryClient.invalidateQueries({ queryKey: ["leases"] });
      setPaymentGatewayOpen(false);
    } catch (err: any) {
      console.error("Payment processing error", err);
      toast.error(err?.response?.data?.message || "Payment processing failed");
    }
  };

  const initiateSecurityDepositPayment = (lease: any) => {
    setPaymentLeaseId(lease.id);
    setPaymentAmount(lease.securityDepositAmount || 0);
    setPaymentPurpose(`Security Deposit for ${lease.Item?.title || "Item"}`);
    setPaymentType("security_deposit");
    setPaymentGatewayOpen(true);
  };

  const initiateFinalPayment = (lease: any) => {
    const totalAmount = (lease.amount || 0) + (lease.securityDepositAmount || 0);
    setPaymentLeaseId(lease.id);
    setPaymentAmount(totalAmount);
    setPaymentPurpose(`Final Payment for ${lease.Item?.title || "Item"} (Rental + Security Deposit)`);
    setPaymentType("full_payment");
    setPaymentGatewayOpen(true);
  };

  const handleReturnEarly = async (leaseId: number, returnDate?: string) => {
    try {
      const body: any = {};
      if (returnDate) {
        body.endDate = returnDate;
      }
      body.status = "completed";

      await api.put(`/leases/${leaseId}`, body);

      toast.success("Item returned successfully!");
      queryClient.invalidateQueries({ queryKey: ["leases"] });
    } catch (error: any) {
      console.error("Return early error:", error);
      toast.error(error.response?.data?.message || "Failed to return item");
    }
  };

  // Complete lease (mark returned with condition)
  const handleCompleteLease = async (leaseId: number, condition: string, ownerUserId: number, ownerName: string) => {
    setCompletingLeaseId(leaseId);
    try {
      await api.put(`/leases/complete/${leaseId}`, {
        condition,
        returnedAt: new Date().toISOString(),
      });
      toast.success("Lease completed! Stats updated.");
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      // Prompt to leave review
      setReviewLeaseId(leaseId);
      setReviewedUserId(ownerUserId);
      setReviewedUserName(ownerName);
      setReviewModalOpen(true);
    } catch (error: any) {
      console.error("Complete lease error:", error);
      toast.error(error.response?.data?.message || "Failed to complete lease");
    } finally {
      setCompletingLeaseId(null);
    }
  };

  // Submit complaint/remark
  const handleSubmitComplaint = async () => {
    if (!disputeContent.trim()) {
      toast.error("Please describe your issue");
      return;
    }

    setSubmittingComplaint(true);
    try {
      const formData = new FormData();
      formData.append("type", complaintType);
      formData.append("description", disputeContent);
      if (complaintAgainst) formData.append("againstUser", complaintAgainst);
      if (relatedLeaseId) formData.append("LeaseId", relatedLeaseId.toString());

      await api.post("/disputes", formData);
      
      toast.success(complaintType === "complaint" ? "Complaint filed successfully!" : "Feedback submitted successfully!");
      setHelpCentreOpen(false);
      setComplaintType("complaint");
      setComplaintAgainst("");
      setDisputeContent("");
      setRelatedLeaseId(null);
    } catch (error: any) {
      console.error("Submit complaint error:", error);
      toast.error(error.response?.data?.message || "Failed to submit");
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // Submit review
  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!reviewLeaseId || !reviewedUserId) return;
    try {
      await api.post(`/reviews/${reviewLeaseId}`, {
        rating,
        comment,
        reviewedUserId,
      });
      toast.success("Review submitted!");
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    } catch (error: any) {
      console.error("Submit review error:", error);
      toast.error(error.response?.data?.message || "Failed to submit review");
    }
  };

  // Delete an item owned by the current user
  const handleDeleteItem = async (itemId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this item? This action cannot be undone."
      )
    )
      return;
    try {
      await api.delete(`/items/${itemId}`);
      toast.success("Item deleted");
      queryClient.invalidateQueries({ queryKey: ["items", "my"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      // Refetch my items
      refetchMyItems();
    } catch (err: any) {
      console.error("Delete item error:", err);
      toast.error(err?.response?.data?.message || "Failed to delete item");
    }
  };

  const renderBorrowedLeaseCard = (lease: any) => {
    const item = lease.item || {};
    const status = lease.status || "pending";
    const isActive = status === "active" || status === "approved";

    return (
      <Card
        key={lease.id}
        className="p-6 border border-border hover:shadow-md transition-shadow"
      >
        <div className="flex gap-6">
          <div className="w-32 h-32 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
            <img
              src={getImageSrc(item.imageUrl)}
              alt={item.title || "Item"}
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  <Link to={`/item/${item.id}`} className="hover:text-primary">
                    {item.title || item.name || "Unknown Item"}
                  </Link>
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {item.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{item.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(lease.startDate).toLocaleDateString()} -{" "}
                      {new Date(lease.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <Badge
                variant={
                  status === "active" || status === "approved"
                    ? "default"
                    : status === "completed"
                    ? "secondary"
                    : "outline"
                }
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-primary">
                  ₹{item.pricePerDay || 0}
                </span>
                <span className="text-sm text-muted-foreground ml-1">/day</span>
                <div className="text-sm text-muted-foreground mt-1">
                  Total: ₹{lease.amount || 0}
                  {lease.securityDepositAmount > 0 && (
                    <span className="ml-2">+ ₹{lease.securityDepositAmount} (Security Deposit)</span>
                  )}
                </div>
              </div>
              {isActive && (
                <div className="flex gap-3 items-center">
                  <Button
                    variant="outline"
                    onClick={() =>
                      openExtendModal(lease.id, lease.startDate, lease.endDate)
                    }
                    disabled={extendingId === lease.id}
                  >
                    {extendingId === lease.id ? "Extending..." : "Extend Lease"}
                  </Button>
                  <Select value={returnCondition} onValueChange={setReturnCondition}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="damaged">Damaged</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => handleCompleteLease(lease.id, returnCondition, item.OwnerId || item.owner?.id, item.owner?.name || "Owner")}
                    disabled={completingLeaseId === lease.id}
                  >
                    {completingLeaseId === lease.id ? "Completing..." : "Complete & Return"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const renderOwnedLeaseCard = (lease: any) => {
    const item = lease.item || {};
    const lessee = lease.lessee || {};
    const status = lease.status || "pending";

    const detailsOpen = !!detailsOpenMap[lease.id];
    const lesseeDetails = lesseeDetailsMap[lease.id] || null;
    const loadingLessee = !!loadingLesseeMap[lease.id];

    const fetchLesseeDetails = async () => {
      if (!lessee.id) return;
      setLoadingLesseeMap((m) => ({ ...m, [lease.id]: true }));
      try {
        const res = await api.get(`/users/${lessee.id}`);
        setLesseeDetailsMap((m) => ({ ...m, [lease.id]: res.data }));
      } catch (err) {
        console.error("Failed to fetch lessee details", err);
      } finally {
        setLoadingLesseeMap((m) => ({ ...m, [lease.id]: false }));
      }
    };

    return (
      <Card
        key={lease.id}
        className="p-6 border border-border hover:shadow-md transition-shadow"
      >
        <div className="flex gap-6">
          <div className="w-32 h-32 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
            <img
              src={getImageSrc(item.imageUrl)}
              alt={item.title || "Item"}
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  <Link to={`/item/${item.id}`} className="hover:text-primary">
                    {item.title || item.name || "Unknown Item"}
                  </Link>
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    Leased by: {lessee.name || lessee.email || "Unknown"}
                  </span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(lease.startDate).toLocaleDateString()} -{" "}
                      {new Date(lease.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <Badge
                variant={
                  status === "active" || status === "approved"
                    ? "default"
                    : status === "completed"
                    ? "secondary"
                    : "outline"
                }
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-primary">
                  ₹{item.pricePerDay || 0}
                </span>
                <span className="text-sm text-muted-foreground ml-1">/day</span>
                <div className="text-sm text-muted-foreground mt-1">
                  Total: ₹{lease.amount || 0}
                </div>
              </div>
              <div className="flex gap-3 items-center">
                {/* Show details toggle */}
                <Button
                  variant="outline"
                  onClick={async () => {
                    const willOpen = !detailsOpen;
                    setDetailsOpenMap((m) => ({ ...m, [lease.id]: willOpen }));
                    if (willOpen && !lesseeDetails) await fetchLesseeDetails();
                  }}
                >
                  <User2 className="h-4 2-4" />
                  View
                </Button>

                {/* Accept / Decline for pending requests */}
                {status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      onClick={() => {
                        setAcceptingLease(lease);
                        // Calculate 15% of total rental cost as security deposit
                        const item = lease.item || lease.Item || {};
                        const days = Math.ceil((new Date(lease.endDate).getTime() - new Date(lease.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
                        const totalRentalCost = days * (item.pricePerDay || 0);
                        const calculatedDeposit = Math.round(totalRentalCost * 0.15);
                        setSecurityDepositAmount(calculatedDeposit);
                        setAcceptModalOpen(true);
                      }}
                    >
                      <CheckCircle className="h-4 2-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={async () => {
                        try {
                          await api.post(`/leases/${lease.id}/decision`, {
                            action: "reject",
                          });
                          toast.success("Lease rejected");
                          queryClient.invalidateQueries({
                            queryKey: ["leases"],
                          });
                        } catch (err: any) {
                          console.error("Reject error", err);
                          toast.error(
                            err?.response?.data?.message || "Failed to reject"
                          );
                        }
                      }}
                    >
                      <X className="h-4 2-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            {/* Lessee details panel */}
            {detailsOpen && (
              <div className="mt-4 p-4 bg-muted/5 rounded border border-border">
                {loadingLessee ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : lesseeDetails ? (
                  <div className="text-sm text-muted-foreground">
                    <div>
                      <strong>Name:</strong> {lesseeDetails.name}
                    </div>
                    <div>
                      <strong>Email:</strong> {lesseeDetails.email}
                    </div>
                    <div>
                      <strong>Location:</strong>{" "}
                      {lesseeDetails.location || "Not available"}
                    </div>
                    <div>
                      <strong>RScore:</strong>{" "}
                      {lesseeDetails.rscore !== null
                        ? `${lesseeDetails.rscore}%`
                        : "No data"}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No details available
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderMyItemCard = (item: any) => {
    const hasActiveLease = ownedLeases?.some(
      (lease: any) =>
        lease.item?.id === item.id &&
        (lease.status === "active" ||
          lease.status === "approved" ||
          lease.status === "pending")
    );

    return (
      <Card
        key={item.id}
        className="h-full p-6 border border-border hover:shadow-md transition-shadow"
      >
        <div className="flex gap-6">
          <div className="w-32 h-32 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
            <img
              src={getImageSrc(item.imageUrl)}
              alt={item.title || "Item"}
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  <Link to={`/item/${item.id}`} className="hover:text-primary">
                    {item.title || item.name || "Unknown Item"}
                  </Link>
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {item.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{item.location}</span>
                    </div>
                  )}
                  {item.category && (
                    <Badge variant="outline">{item.category}</Badge>
                  )}
                </div>
              </div>
              <Badge variant={item.availability ? "default" : "secondary"}>
                {item.availability ? "Available" : "Leased"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-primary">
                  ₹{item.pricePerDay || 0}
                </span>
                <span className="text-sm text-muted-foreground ml-1">/day</span>
              </div>
              <div className="flex gap-3">
                <Link to={`/item/${item.id}`}>
                  <Button variant="outline">Details</Button>
                </Link>
                <Link to={`/add-item?id=${item.id}`}>
                  <Button size="icon" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              My Leases
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your active and past leases
            </p>
          </div>
          <Button
            onClick={() => setHelpCentreOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <HelpCircle className="h-5 w-5" />
            Help Centre
          </Button>
        </div>

        <Tabs defaultValue="borrowed" className="w-full">
          <TabsList className="flex items-center justify-start w-max gap-1 mb-8">
            <TabsTrigger value="borrowed" className="px-4">
              <Package className="w-4 h-4 mr-2" />
              Borrowed ({activeBorrowed.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="px-4">
              <Send className="w-4 h-4 mr-2" />
              Outgoing ({sentRequests?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="owned" className="px-4">
              <Archive className="w-4 h-4 mr-2" />
              Items ({myItems?.length})
            </TabsTrigger>
            <TabsTrigger value="request" className="px-4">
              <Inbox className="w-4 h-4 mr-2" />
              Inbox ({newRequests?.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="px-4">
              <History className="w-4 h-4 mr-2" />
              History ({pastBorrowed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="borrowed" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Active Leases</h2>
              {isLoadingBorrowed ? (
                <p className="text-muted-foreground">Loading leases...</p>
              ) : activeBorrowed.length > 0 ? (
                activeBorrowed.map(renderBorrowedLeaseCard)
              ) : (
                <Card className="p-12 text-center border border-border">
                  <p className="text-muted-foreground text-lg">
                    You don't have any active leases
                  </p>
                  <Link to="/browse">
                    <Button className="mt-6">Browse Items</Button>
                  </Link>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sent" className="space-y-6">
            {/* Show lease requests sent by the user */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                Lease Requests Sent
              </h2>
              {isLoadingBorrowed ? (
                <p className="text-muted-foreground">Loading requests...</p>
              ) : sentRequests.length > 0 ? (
                <div className="space-y-6">
                  {sentRequests.map(renderBorrowedLeaseCard)}
                </div>
              ) : (
                <Card className="p-12 text-center border border-border">
                  <p className="text-muted-foreground text-lg">
                    You haven't sent any lease requests
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Browse items and send a lease request to get started
                  </p>
                  <Link to="/browse">
                    <Button className="mt-6">Browse Items</Button>
                  </Link>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="owned" className="space-y-6">
            {/* Show all items owned by user */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">
                  All My Listings ({myItems?.length || 0})
                </h2>
                <Button
                  variant="outline"
                  onClick={() => refetchMyItems()}
                  disabled={isLoadingMyItems}
                  className="text-sm"
                >
                  {isLoadingMyItems ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
              {isLoadingMyItems ? (
                <p className="text-muted-foreground">Loading items...</p>
              ) : isErrorMyItems ? (
                <Card className="p-12 text-center border border-border">
                  <p className="text-red-500 text-lg mb-2">
                    {(() => {
                      const error = errorMyItems as any;
                      if (error?.response?.status === 401) {
                        return "Please login to view your listings";
                      }
                      if (error?.response?.status === 404) {
                        return "Endpoint not found. Please check if the backend route exists.";
                      }
                      if (error?.response?.data?.message) {
                        return error.response.data.message;
                      }
                      if (error?.message) {
                        return error.message;
                      }
                      return "Error loading your listings. Please check the console for details.";
                    })()}
                  </p>
                  {errorMyItems && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Status:{" "}
                      {(errorMyItems as any)?.response?.status || "Unknown"} |
                      URL: {(errorMyItems as any)?.config?.url || "Unknown"}
                    </p>
                  )}
                  <Button onClick={() => refetchMyItems()} variant="outline">
                    Retry
                  </Button>
                </Card>
              ) : (myItems?.length || 0) > 0 ? (
                <div className="items-stretch grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {myItems?.map(renderMyItemCard)}
                </div>
              ) : (
                <Card className="p-12 text-center border border-border">
                  <p className="text-muted-foreground text-lg">
                    You haven't listed any items yet
                  </p>
                  <Link to="/add-item">
                    <Button className="mt-6">List an Item</Button>
                  </Link>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="request" className="space-y-6">
            {/* Show active leases for owned items */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                Active Lease Requests
              </h2>
              {isLoadingOwned ? (
                <p className="text-muted-foreground">Loading requests...</p>
              ) : ownedLeases && ownedLeases.length > 0 ? (
                (() => {
                  const activeRequests = ownedLeases.filter(
                    (lease: any) =>
                      lease.status === "pending" ||
                      lease.status === "approved" ||
                      lease.status === "active"
                  );

                  return activeRequests.length > 0 ? (
                    <div className="space-y-6 mb-8">
                      {activeRequests.map(renderOwnedLeaseCard)}
                    </div>
                  ) : (
                    <Card className="p-12 text-center border border-border">
                      <p className="text-muted-foreground text-lg">
                        No active lease requests for your items
                      </p>
                      <Link to="/add-item">
                        <Button className="mt-6">List New Item</Button>
                      </Link>
                    </Card>
                  );
                })()
              ) : (
                <Card className="p-12 text-center border border-border">
                  <p className="text-muted-foreground text-lg">
                    No lease requests yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    List items to start receiving lease requests
                  </p>
                  <Link to="/add-item">
                    <Button className="mt-6">List New Item</Button>
                  </Link>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4 mt-8">Past Leases</h2>
              {isLoadingBorrowed ? (
                <p className="text-muted-foreground">Loading leases...</p>
              ) : pastBorrowed.length > 0 ? (
                pastBorrowed.map(renderBorrowedLeaseCard)
              ) : (
                <Card className="p-12 text-center border border-border">
                  <p className="text-muted-foreground text-lg">
                    No past leases yet
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <LeaseModal
        open={leaseModalOpen}
        initialStart={modalInitialStart}
        initialEnd={modalInitialEnd}
        title={
          modalMode === "extend"
            ? "Extend Lease"
            : modalMode === "return"
            ? "Return Early"
            : "Lease"
        }
        hideSecurityDeposit={modalMode === "extend"} // Hide security deposit for extend requests
        onClose={() => {
          setLeaseModalOpen(false);
          setModalLeaseId(null);
          setModalMode(null);
        }}
        onSubmit={async (startDate: string, endDate: string) => {
          if (!modalLeaseId || !modalMode) return;
          if (modalMode === "extend") {
            await handleExtendLease(modalLeaseId, endDate);
          } else if (modalMode === "return") {
            await handleReturnEarly(modalLeaseId, endDate);
          }
          setLeaseModalOpen(false);
          setModalLeaseId(null);
          setModalMode(null);
          queryClient.invalidateQueries({ queryKey: ["leases"] });
          queryClient.invalidateQueries({ queryKey: ["items"] });
        }}
      />
      <ReviewModal
        open={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setReviewLeaseId(null);
          setReviewedUserId(null);
          setReviewedUserName(null);
        }}
        onSubmit={handleSubmitReview}
        leaseId={reviewLeaseId || 0}
        reviewedUserId={reviewedUserId || 0}
        reviewedUserName={reviewedUserName || undefined}
      />

      {/* Accept Lease Billing Summary Modal */}
      <Dialog open={acceptModalOpen} onOpenChange={setAcceptModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lease Billing Summary</DialogTitle>
            <DialogDescription>
              Review billing details before approving
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {acceptingLease &&
              (() => {
                const item = acceptingLease.Item || acceptingLease.item || {};
                const lessee =
                  acceptingLease.Lessee || acceptingLease.lessee || {};
                const days =
                  Math.ceil(
                    (new Date(acceptingLease.endDate).getTime() -
                      new Date(acceptingLease.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) + 1;
                const pricePerDay = item.pricePerDay || 0;
                const rentalCost = days * pricePerDay;
                const totalAmount = rentalCost + securityDepositAmount;

                return (
                  <>
                    {/* Item & Lessee Info Combined */}
                    <div className="border border-border rounded-lg p-3 space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-muted-foreground text-xs">Item</p>
                          <p className="font-medium">
                            {item.name || item.title || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Category
                          </p>
                          <p className="font-medium">
                            {item.category || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Lessee
                          </p>
                          <p className="font-medium">{lessee.name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Email</p>
                          <p className="font-medium text-xs">
                            {lessee.email || "N/A"}
                          </p>
                        </div>
                      </div>
                      {item.description && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-muted-foreground text-xs">
                            Description
                          </p>
                          <p className="text-xs">{item.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Lease Period */}
                    <div className="border border-border rounded-lg p-3">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Start</p>
                          <p className="font-medium text-xs">
                            {new Date(
                              acceptingLease.startDate
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">End</p>
                          <p className="font-medium text-xs">
                            {new Date(
                              acceptingLease.endDate
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Duration
                          </p>
                          <p className="font-medium text-xs">
                            {days} {days === 1 ? "Day" : "Days"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Billing Breakdown */}
                    <div className="border border-border rounded-lg p-3 space-y-2 bg-muted/30">
                      <h3 className="font-semibold text-sm">
                        Billing Breakdown
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center py-1">
                          <div>
                            <p className="font-medium">Rental Cost</p>
                            <p className="text-xs text-muted-foreground">
                              {days} {days === 1 ? "day" : "days"} × ₹
                              {pricePerDay}/day
                            </p>
                          </div>
                          <p className="font-semibold">₹{rentalCost}</p>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t border-border pt-2">
                          <div>
                            <p className="font-medium">Security Deposit</p>
                            <p className="text-xs text-muted-foreground">
                              15% of rental (Refundable)
                            </p>
                          </div>
                          <p className="font-semibold text-primary">
                            ₹{securityDepositAmount}
                          </p>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-border">
                          <p className="font-bold">Total Amount</p>
                          <p className="font-bold text-xl text-primary">
                            ₹{totalAmount}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-800">
                      <p className="font-medium">
                        ℹ️ Note: Security deposit refunded within 24h after
                        successful return.
                      </p>
                    </div>
                  </>
                );
              })()}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAcceptModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAcceptWithDeposit}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve Lease
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help Centre Modal */}
      <Dialog open={helpCentreOpen} onOpenChange={setHelpCentreOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Help Centre</DialogTitle>
                <DialogDescription>
                  File a complaint or share your feedback
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Issue Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                What can we help you with?
              </Label>
              <RadioGroup
                value={complaintType}
                onValueChange={setComplaintType}
              >
                <div className="flex items-center space-x-3 border border-border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="complaint" id="complaint" />
                  <Label htmlFor="complaint" className="flex-1 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-semibold">File a Complaint</p>
                        <p className="text-sm text-muted-foreground">
                          Report an issue with a lease, item, or user
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 border border-border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="feedback" id="feedback" />
                  <Label htmlFor="feedback" className="flex-1 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-semibold">Share Feedback</p>
                        <p className="text-sm text-muted-foreground">
                          Suggestions or general remarks about the platform
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Complaint Against (only for complaints) */}
            {complaintType === "complaint" && (
              <div className="space-y-2">
                <Label
                  htmlFor="complaint-against"
                  className="text-base font-semibold"
                >
                  Complaint Against <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="complaint-against"
                  placeholder="Enter name or user ID"
                  value={complaintAgainst}
                  onChange={(e) => setComplaintAgainst(e.target.value)}
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Specify the person or entity your complaint is about
                </p>
              </div>
            )}

            {/* Related Lease (optional) */}
            <div className="space-y-2">
              <Label htmlFor="lease-id" className="text-base font-semibold">
                Related Lease ID{" "}
                <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Select
                value={relatedLeaseId?.toString() || "none"}
                onValueChange={(val) =>
                  setRelatedLeaseId(val === "none" ? null : parseInt(val))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a lease" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    None / Not related to a lease
                  </SelectItem>
                  {borrowedLeases &&
                    borrowedLeases.map((lease: any) => (
                      <SelectItem key={lease.id} value={lease.id.toString()}>
                        Lease #{lease.id} -{" "}
                        {lease.item?.title ||
                          lease.item?.name ||
                          "Unknown Item"}
                      </SelectItem>
                    ))}
                  {ownedLeases &&
                    ownedLeases.map((lease: any) => (
                      <SelectItem
                        key={`owned-${lease.id}`}
                        value={lease.id.toString()}
                      >
                        Lease #{lease.id} -{" "}
                        {lease.item?.title ||
                          lease.item?.name ||
                          "Unknown Item"}{" "}
                        (Your listing)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Link this issue to a specific lease for faster resolution
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="dispute-content"
                className="text-base font-semibold"
              >
                {complaintType === "complaint"
                  ? "Describe Your Issue"
                  : "Your Feedback"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="dispute-content"
                placeholder={
                  complaintType === "complaint"
                    ? "Please provide detailed information about your complaint..."
                    : "Share your thoughts, suggestions, or feedback..."
                }
                value={disputeContent}
                onChange={(e) => setDisputeContent(e.target.value)}
                rows={6}
                className="text-base resize-none"
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Be as specific as possible to help us assist you better
                </p>
                <p className="text-xs text-muted-foreground">
                  {disputeContent.length} / 1000
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-blue-900">
                📋 What happens next?
              </p>
              <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                <li>Your {complaintType} will be reviewed by our admin team</li>
                <li>You'll receive updates via email within 24-48 hours</li>
                <li>
                  For urgent issues, you can track status in Admin Dashboard
                </li>
                {complaintType === "complaint" && (
                  <li>
                    All parties involved will be notified for fair resolution
                  </li>
                )}
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setHelpCentreOpen(false);
                setComplaintType("complaint");
                setComplaintAgainst("");
                setDisputeContent("");
                setRelatedLeaseId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitComplaint}
              disabled={
                submittingComplaint ||
                !disputeContent.trim() ||
                (complaintType === "complaint" && !complaintAgainst.trim())
              }
              className="bg-primary hover:bg-primary/90"
            >
              {submittingComplaint ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit{" "}
                  {complaintType === "complaint" ? "Complaint" : "Feedback"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Gateway */}
      <PaymentGateway
        open={paymentGatewayOpen}
        onClose={() => setPaymentGatewayOpen(false)}
        amount={paymentAmount}
        purpose={paymentPurpose}
        onSuccess={handlePaymentSuccess}
        onError={(error) => console.error("Payment error:", error)}
      />
    </div>
  );
};


export default MyLeases;
