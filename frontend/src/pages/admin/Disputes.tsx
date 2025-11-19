import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Dispute {
  id: number;
  description: string;
  renterPhotos: string[];
  ownerPhotos: string[];
  depositAmount: number;
  status: "pending" | "resolved" | "open" | "in_progress" | "closed";
  resolution: "refund_to_owner" | "refund_to_renter" | "no_action" | null;
  type?: "complaint" | "feedback" | "dispute";
  againstUser?: string;
  reportedBy?: number;
  reporter?: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
  Item: {
    id: number;
    title: string;
  };
  Lease: {
    id: number;
    startDate: string;
    endDate: string;
  };
  Renter?: {
    id: number;
    name: string;
    email: string;
  };
  Owner?: {
    id: number;
    name: string;
    email: string;
  };
}

const Disputes = () => {
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: disputes, isLoading } = useQuery<Dispute[]>({
    queryKey: ["adminDisputes"],
    queryFn: async () => {
      const res = await api.get("/admin/disputes");
      return res.data;
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ disputeId, resolution }: { disputeId: number; resolution: string }) => {
      const res = await api.post(`/admin/disputes/${disputeId}/resolve`, { resolution });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDisputes"] });
      toast.success("Dispute resolved successfully");
      setSelectedDispute(null);
      setResolution("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to resolve dispute");
    },
  });

  const closeMutation = useMutation({
    mutationFn: async (disputeId: number) => {
      const res = await api.post(`/admin/disputes/${disputeId}/close`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDisputes"] });
      toast.success("Dispute closed successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to close dispute");
    },
  });

  const handleClose = (disputeId: number) => {
    if (window.confirm("Are you sure you want to close this dispute as resolved?")) {
      closeMutation.mutate(disputeId);
    }
  };

  const handleResolve = () => {
    if (!selectedDispute || !resolution) {
      toast.error("Please select a resolution");
      return;
    }
    resolveMutation.mutate({ disputeId: selectedDispute.id, resolution });
  };

  const pendingDisputes = disputes?.filter((d) => d.status === "pending" || d.status === "open" || d.status === "in_progress") || [];
  const resolvedDisputes = disputes?.filter((d) => d.status === "resolved" || d.status === "closed") || [];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading disputes...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Disputes Management</h1>
            <p className="text-muted-foreground">Resolve rental disputes</p>
          </div>
        </div>

        {/* Pending Disputes */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Disputes ({pendingDisputes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Renter</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Deposit</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingDisputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell className="font-medium">
                      {dispute.Item?.title || dispute.type === 'feedback' ? 'General Feedback' : 'General Complaint'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{dispute.Renter?.name || dispute.reporter?.name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{dispute.Renter?.email || dispute.reporter?.email || 'N/A'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{dispute.Owner?.name || dispute.againstUser || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{dispute.Owner?.email || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>₹{dispute.depositAmount || 0}</TableCell>
                    <TableCell>{new Date(dispute.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedDispute(dispute);
                            setResolution("");
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleClose(dispute.id)}
                          disabled={closeMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Close
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {pendingDisputes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No pending disputes
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Resolved Disputes */}
        <Card>
          <CardHeader>
            <CardTitle>Resolved Disputes ({resolvedDisputes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Renter</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Resolution</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resolvedDisputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell className="font-medium">
                      {dispute.Item?.title || dispute.type === 'feedback' ? 'General Feedback' : 'General Complaint'}
                    </TableCell>
                    <TableCell>{dispute.Renter?.name || dispute.reporter?.name || 'N/A'}</TableCell>
                    <TableCell>{dispute.Owner?.name || dispute.againstUser || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={dispute.resolution === "refund_to_renter" ? "default" : "secondary"}>
                        {dispute.resolution === "refund_to_renter" ? "Refund to Renter" : dispute.resolution === "refund_to_owner" ? "Refund to Owner" : "No Action"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(dispute.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {resolvedDisputes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No resolved disputes yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dispute Details & Resolution Dialog */}
        <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Dispute Details</DialogTitle>
            </DialogHeader>
            {selectedDispute && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {selectedDispute.Item ? 'Item' : 'Type'}
                    </p>
                    <p className="font-medium">
                      {selectedDispute.Item?.title || (selectedDispute.type === 'feedback' ? 'General Feedback' : 'General Complaint')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Deposit Amount</p>
                    <p className="font-medium">₹{selectedDispute.depositAmount || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {selectedDispute.Renter ? 'Renter' : 'Reported By'}
                    </p>
                    <p className="font-medium">{selectedDispute.Renter?.name || selectedDispute.reporter?.name || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">{selectedDispute.Renter?.email || selectedDispute.reporter?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {selectedDispute.Owner ? 'Owner' : 'Complaint Against'}
                    </p>
                    <p className="font-medium">{selectedDispute.Owner?.name || selectedDispute.againstUser || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">{selectedDispute.Owner?.email || '-'}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedDispute.description}</p>
                </div>

                {/* Renter's Evidence */}
                {selectedDispute.renterPhotos && selectedDispute.renterPhotos.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Renter's Evidence ({selectedDispute.renterPhotos.length} photos)
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedDispute.renterPhotos.map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo}
                          alt={`Renter evidence ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Owner's Evidence */}
                {selectedDispute.ownerPhotos && selectedDispute.ownerPhotos.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Owner's Evidence ({selectedDispute.ownerPhotos.length} photos)
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedDispute.ownerPhotos.map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo}
                          alt={`Owner evidence ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution Section */}
                {selectedDispute.status === "pending" && (
                  <div className="space-y-4 border-t pt-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Select Resolution</p>
                      <Select value={resolution} onValueChange={setResolution}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose who gets the refund" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="refund_to_renter">
                            Refund to Renter (Renter wins)
                          </SelectItem>
                          <SelectItem value="refund_to_owner">
                            Refund to Owner (Owner wins)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2">
                        The selected party will receive ₹{selectedDispute.depositAmount} in their wallet.
                        R-Scores will be updated accordingly.
                      </p>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setSelectedDispute(null)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleResolve}
                        disabled={!resolution || resolveMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve Dispute
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Disputes;
