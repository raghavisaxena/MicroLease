import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Clock, AlertCircle, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const WalletPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [claimingDeposit, setClaimingDeposit] = useState<number | null>(null);
  const [damageDescription, setDamageDescription] = useState("");
  const [damageAmount, setDamageAmount] = useState(0);

  // Fetch wallet and deposits
  const { data: walletData, isLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await api.get("/wallet");
      return res.data;
    },
  });

  const wallet = walletData?.wallet;
  const deposits = walletData?.deposits || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "held":
        return "bg-yellow-100 text-yellow-800";
      case "refunded":
        return "bg-green-100 text-green-800";
      case "claimed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "held":
        return <Clock className="h-4 w-4" />;
      case "refunded":
        return <CheckCircle className="h-4 w-4" />;
      case "claimed":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleRefund = async (depositId: number) => {
    try {
      const response = await api.post("/wallet/refund", {
        securityDepositId: depositId,
      });
      toast.success("Refund processed successfully!");
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to process refund");
    }
  };

  const handleClaimDamage = async (depositId: number) => {
    if (!damageDescription || damageAmount <= 0) {
      toast.error("Please provide damage description and amount");
      return;
    }

    const deposit = deposits.find((d) => d.id === depositId);
    if (damageAmount > deposit.amount) {
      toast.error(`Damage amount cannot exceed deposit amount (₹${deposit.amount})`);
      return;
    }

    try {
      const response = await api.post("/wallet/claim-damage", {
        securityDepositId: depositId,
        damageDescription,
        damageAmount,
      });
      toast.success("Damage claim processed successfully!");
      setClaimingDeposit(null);
      setDamageDescription("");
      setDamageAmount(0);
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to claim damage");
    }
  };

  const handleReturnItem = async (depositId: number) => {
    try {
      const deposit = deposits.find((d) => d.id === depositId);
      if (!deposit?.lease?.id) return;

      await api.post("/wallet/return-item", {
        leaseId: deposit.lease.id,
      });
      toast.success("Item marked as returned. Refund will be available in 24 hours.");
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to mark item as returned");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-muted-foreground">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">My Wallet</h1>
          <p className="text-muted-foreground">Manage your security deposits and rental finances</p>
        </div>

        {/* Wallet Balance Card */}
        {wallet && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6 border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                  <p className="text-3xl font-bold text-primary">₹{wallet.balance.toFixed(2)}</p>
                </div>
                <Wallet className="h-8 w-8 text-primary opacity-50" />
              </div>
            </Card>

            <Card className="p-6 border-border">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Deposited</p>
                <p className="text-2xl font-semibold">₹{wallet.totalDeposited.toFixed(2)}</p>
              </div>
            </Card>

            <Card className="p-6 border-border">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Refunded</p>
                <p className="text-2xl font-semibold text-green-600">₹{wallet.totalRefunded.toFixed(2)}</p>
              </div>
            </Card>

            <Card className="p-6 border-border">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Claimed</p>
                <p className="text-2xl font-semibold text-red-600">₹{wallet.totalClaimed.toFixed(2)}</p>
              </div>
            </Card>
          </div>
        )}

        {/* Security Deposits Section */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Security Deposits</h2>

          {deposits.length === 0 ? (
            <Card className="p-12 text-center border-border">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-6">No security deposits yet</p>
              <Button onClick={() => navigate("/browse")}>Browse Items to Rent</Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {deposits.map((deposit) => (
                <Card key={deposit.id} className="p-6 border-border">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Side - Deposit Info */}
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {deposit.lease?.item?.title || "Item"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Deposit ID: #{deposit.id}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(deposit.status)} flex items-center gap-2`}>
                          {getStatusIcon(deposit.status)}
                          {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Deposit Amount:</span>
                          <span className="font-semibold">₹{deposit.amount.toFixed(2)}</span>
                        </div>

                        {deposit.lease?.startDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Lease Period:</span>
                            <span>
                              {new Date(deposit.lease.startDate).toLocaleDateString()} to{" "}
                              {new Date(deposit.lease.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        {deposit.damageClaimed && (
                          <div className="mt-4 p-3 bg-red-50 rounded">
                            <p className="text-sm font-semibold text-red-800 mb-1">Damage Claim</p>
                            <p className="text-sm text-red-700">{deposit.damageDescription}</p>
                            <p className="text-sm text-red-700 mt-1">
                              Claimed Amount: ₹{deposit.damageAmount?.toFixed(2) || "0"}
                            </p>
                          </div>
                        )}

                        {deposit.returnedAt && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Returned:</span>
                            <span>{new Date(deposit.returnedAt).toLocaleString()}</span>
                          </div>
                        )}

                        {deposit.refundDueAt && !deposit.returnedAt && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Refund Due:</span>
                            <span>{new Date(deposit.refundDueAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Side - Actions */}
                    <div className="flex flex-col justify-between">
                      <div className="space-y-2">
                        {deposit.status === "held" && !deposit.returnedAt && (
                          <Button
                            onClick={() => handleReturnItem(deposit.id)}
                            className="w-full"
                            variant="outline"
                          >
                            Mark Item as Returned
                          </Button>
                        )}

                        {deposit.status === "held" && deposit.returnedAt && (
                          <div className="text-sm text-muted-foreground">
                            Waiting for 24-hour grace period before refund...
                          </div>
                        )}

                        {deposit.status === "held" && (
                          <Button
                            onClick={() => setClaimingDeposit(deposit.id)}
                            className="w-full"
                            variant="destructive"
                          >
                            Claim Damage (Owner Only)
                          </Button>
                        )}

                        {deposit.status === "refunded" && (
                          <div className="p-3 bg-green-50 rounded text-center">
                            <p className="text-sm font-semibold text-green-800">Refunded</p>
                            <p className="text-xs text-green-700 mt-1">
                              {new Date(deposit.refundedAt).toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        {deposit.status === "claimed" && (
                          <div className="p-3 bg-red-50 rounded text-center">
                            <p className="text-sm font-semibold text-red-800">Damage Claimed</p>
                            <p className="text-xs text-red-700 mt-1">
                              ₹{deposit.damageAmount?.toFixed(2)} deducted
                            </p>
                          </div>
                        )}
                      </div>

                      {deposit.status === "held" && deposit.returnedAt && (
                        <Button
                          onClick={() => handleRefund(deposit.id)}
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={
                            deposit.refundDueAt &&
                            new Date() < new Date(deposit.refundDueAt)
                          }
                        >
                          {deposit.refundDueAt &&
                          new Date() < new Date(deposit.refundDueAt)
                            ? `Available in ${Math.ceil(
                                (new Date(deposit.refundDueAt).getTime() - new Date().getTime()) /
                                  (1000 * 60 * 60)
                              )}h`
                            : "Refund Now"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Claim Damage Form */}
                  {claimingDeposit === deposit.id && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h4 className="font-semibold mb-4">Claim Damage</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Damage Description
                          </label>
                          <textarea
                            value={damageDescription}
                            onChange={(e) => setDamageDescription(e.target.value)}
                            placeholder="Describe the damage..."
                            className="w-full p-2 border border-border rounded text-sm"
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Damage Amount (₹)
                          </label>
                          <input
                            type="number"
                            value={damageAmount}
                            onChange={(e) => setDamageAmount(parseFloat(e.target.value) || 0)}
                            max={deposit.amount}
                            step="100"
                            className="w-full p-2 border border-border rounded text-sm"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Max: ₹{deposit.amount.toFixed(2)}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleClaimDamage(deposit.id)}
                            className="flex-1"
                            variant="destructive"
                          >
                            Confirm Claim
                          </Button>
                          <Button
                            onClick={() => {
                              setClaimingDeposit(null);
                              setDamageDescription("");
                              setDamageAmount(0);
                            }}
                            className="flex-1"
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
