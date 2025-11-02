import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import LeaseModal from "@/components/LeaseModal";

const MyLeases = () => {
  const queryClient = useQueryClient();
  const [extendingId, setExtendingId] = useState<number | null>(null);
  const [leaseModalOpen, setLeaseModalOpen] = useState(false);
  const [modalLeaseId, setModalLeaseId] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<'extend' | 'return' | null>(null);
  const [modalInitialStart, setModalInitialStart] = useState<string | undefined>(undefined);
  const [modalInitialEnd, setModalInitialEnd] = useState<string | undefined>(undefined);
  // Lessee details UI state (maps keyed by lease id)
  const [detailsOpenMap, setDetailsOpenMap] = useState<Record<number, boolean>>({});
  const [lesseeDetailsMap, setLesseeDetailsMap] = useState<Record<number, any>>({});
  const [loadingLesseeMap, setLoadingLesseeMap] = useState<Record<number, boolean>>({});

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
  const { data: myItems, isLoading: isLoadingMyItems, isError: isErrorMyItems, error: errorMyItems, refetch: refetchMyItems } = useQuery({
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
    if (raw.startsWith("data:") || raw.startsWith("http") || raw.startsWith("/")) {
      return raw;
    }
    const base64pattern = /^[A-Za-z0-9+/=\n\r]+$/;
    const onlyBase64 = base64pattern.test(raw.replace(/\s/g, ""));
    return onlyBase64 ? `data:image/jpeg;base64,${raw}` : raw || "/placeholder.svg";
  };

  // Categorize borrowed leases
  const activeBorrowed = (borrowedLeases || []).filter(
    (lease: any) => lease.status === "active" || lease.status === "approved"
  );
  const pastBorrowed = (borrowedLeases || []).filter(
    (lease: any) => lease.status === "completed" || lease.status === "cancelled"
  );

  // Handle extend lease
  // Open extend modal
  const openExtendModal = (leaseId: number, currentStart: string, currentEnd: string) => {
    setModalLeaseId(leaseId);
    setModalMode('extend');
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
  const openReturnModal = (leaseId: number, currentStart: string, currentEnd: string) => {
    setModalLeaseId(leaseId);
    setModalMode('return');
    setModalInitialStart(currentStart);
    setModalInitialEnd(currentEnd);
    setLeaseModalOpen(true);
  };

  const handleReturnEarly = async (leaseId: number, returnDate?: string) => {
    try {
      const body: any = {};
      if (returnDate) {
        body.endDate = returnDate;
      }
      body.status = 'completed';

      await api.put(`/leases/${leaseId}`, body);

      toast.success("Item returned successfully!");
      queryClient.invalidateQueries({ queryKey: ["leases"] });
    } catch (error: any) {
      console.error("Return early error:", error);
      toast.error(error.response?.data?.message || "Failed to return item");
    }
  };

  // Delete an item owned by the current user
  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;
    try {
      await api.delete(`/items/${itemId}`);
      toast.success('Item deleted');
      queryClient.invalidateQueries({ queryKey: ['items', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      // Refetch my items
      refetchMyItems();
    } catch (err: any) {
      console.error('Delete item error:', err);
      toast.error(err?.response?.data?.message || 'Failed to delete item');
    }
  };

  const renderBorrowedLeaseCard = (lease: any) => {
    const item = lease.item || {};
    const status = lease.status || "pending";
    const isActive = status === "active" || status === "approved";

    return (
      <Card key={lease.id} className="p-6 border border-border hover:shadow-md transition-shadow">
        <div className="flex gap-6">
          <div className="w-32 h-32 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
            <img
              src={getImageSrc(item.imageUrl)}
              alt={item.title || "Item"}
              className="w-full h-full object-cover"
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
                <span className="text-2xl font-bold text-primary">₹{item.pricePerDay || 0}</span>
                <span className="text-sm text-muted-foreground ml-1">/day</span>
                <div className="text-sm text-muted-foreground mt-1">
                  Total: ₹{lease.amount || 0}
                </div>
              </div>
              {isActive && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => openExtendModal(lease.id, lease.startDate, lease.endDate)}
                    disabled={extendingId === lease.id}
                  >
                    {extendingId === lease.id ? "Extending..." : "Extend Lease"}
                  </Button>
                  <Button variant="outline" onClick={() => openReturnModal(lease.id, lease.startDate, lease.endDate)}>
                    Return Early
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
        console.error('Failed to fetch lessee details', err);
      } finally {
        setLoadingLesseeMap((m) => ({ ...m, [lease.id]: false }));
      }
    };

    return (
      <Card key={lease.id} className="p-6 border border-border hover:shadow-md transition-shadow">
        <div className="flex gap-6">
          <div className="w-32 h-32 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
            <img
              src={getImageSrc(item.imageUrl)}
              alt={item.title || "Item"}
              className="w-full h-full object-cover"
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
                  <span>Leased by: {lessee.name || lessee.email || "Unknown"}</span>
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
                <span className="text-2xl font-bold text-primary">₹{item.pricePerDay || 0}</span>
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
                  {detailsOpen ? 'Hide Details' : 'View Lessee'}
                </Button>

                {/* Accept / Decline for pending requests */}
                {status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        try {
                          await api.post(`/leases/${lease.id}/decision`, { action: 'approve' });
                          toast.success('Lease approved');
                          queryClient.invalidateQueries({ queryKey: ['leases'] });
                          queryClient.invalidateQueries({ queryKey: ['items'] });
                        } catch (err: any) {
                          console.error('Approve error', err);
                          toast.error(err?.response?.data?.message || 'Failed to approve');
                        }
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          await api.post(`/leases/${lease.id}/decision`, { action: 'reject' });
                          toast.success('Lease rejected');
                          queryClient.invalidateQueries({ queryKey: ['leases'] });
                        } catch (err: any) {
                          console.error('Reject error', err);
                          toast.error(err?.response?.data?.message || 'Failed to reject');
                        }
                      }}
                    >
                      Decline
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
                    <div><strong>Name:</strong> {lesseeDetails.name}</div>
                    <div><strong>Email:</strong> {lesseeDetails.email}</div>
                    <div><strong>Location:</strong> {lesseeDetails.location || 'Not available'}</div>
                    <div><strong>RScore:</strong> {lesseeDetails.rscore !== null ? `${lesseeDetails.rscore}%` : 'No data'}</div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No details available</p>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderMyItemCard = (item: any) => {
    const hasActiveLease = ownedLeases?.some((lease: any) => 
      lease.item?.id === item.id && 
      (lease.status === "active" || lease.status === "approved" || lease.status === "pending")
    );

    return (
      <Card key={item.id} className="p-6 border border-border hover:shadow-md transition-shadow">
        <div className="flex gap-6">
          <div className="w-32 h-32 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
            <img
              src={getImageSrc(item.imageUrl)}
              alt={item.title || "Item"}
              className="w-full h-full object-cover"
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
                <span className="text-2xl font-bold text-primary">₹{item.pricePerDay || 0}</span>
                <span className="text-sm text-muted-foreground ml-1">/day</span>
              </div>
              <div className="flex gap-3">
                {hasActiveLease && (
                  <Badge variant="outline" className="mr-2">
                    Has Active Lease
                  </Badge>
                )}
                <Link to={`/item/${item.id}`}>
                  <Button variant="outline">View Details</Button>
                </Link>
                <Link to={`/add-item?id=${item.id}`}>
                  <Button variant="outline">Edit</Button>
                </Link>
                <Button variant="destructive" onClick={() => handleDeleteItem(item.id)}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">My Leases</h1>
          <p className="text-lg text-muted-foreground">
            Manage your active and past leases
          </p>
        </div>

        <Tabs defaultValue="borrowed" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="borrowed" className="px-8">
              Borrowed ({activeBorrowed.length + pastBorrowed.length})
            </TabsTrigger>
            <TabsTrigger value="owned" className="px-8">
              My Listings ({myItems?.length || 0})
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
                  <p className="text-muted-foreground text-lg">You don't have any active leases</p>
                  <Link to="/browse">
                    <Button className="mt-6">Browse Items</Button>
                  </Link>
                </Card>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-4 mt-8">Past Leases</h2>
              {isLoadingBorrowed ? (
                <p className="text-muted-foreground">Loading leases...</p>
              ) : pastBorrowed.length > 0 ? (
                pastBorrowed.map(renderBorrowedLeaseCard)
              ) : (
                <Card className="p-12 text-center border border-border">
                  <p className="text-muted-foreground text-lg">No past leases yet</p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="owned" className="space-y-6">
            {/* Show active leases for owned items */}
            {ownedLeases && ownedLeases.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Active Lease Requests</h2>
                <div className="space-y-6 mb-8">
                  {ownedLeases
                    .filter((lease: any) => 
                      lease.status === "pending" || 
                      lease.status === "approved" || 
                      lease.status === "active"
                    )
                    .map(renderOwnedLeaseCard)}
                </div>
              </div>
            )}

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
                      Status: {(errorMyItems as any)?.response?.status || "Unknown"} | 
                      URL: {(errorMyItems as any)?.config?.url || "Unknown"}
                    </p>
                  )}
                  <Button onClick={() => refetchMyItems()} variant="outline">
                    Retry
                  </Button>
                </Card>
              ) : (myItems?.length || 0) > 0 ? (
                <div className="space-y-6">
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
        </Tabs>
      </div>
      <LeaseModal
        open={leaseModalOpen}
        initialStart={modalInitialStart}
        initialEnd={modalInitialEnd}
        title={modalMode === 'extend' ? 'Extend Lease' : modalMode === 'return' ? 'Return Early' : 'Lease'}
        onClose={() => {
          setLeaseModalOpen(false);
          setModalLeaseId(null);
          setModalMode(null);
        }}
        onSubmit={async (startDate: string, endDate: string) => {
          if (!modalLeaseId || !modalMode) return;
          if (modalMode === 'extend') {
            await handleExtendLease(modalLeaseId, endDate);
          } else if (modalMode === 'return') {
            await handleReturnEarly(modalLeaseId, endDate);
          }
          setLeaseModalOpen(false);
          setModalLeaseId(null);
          setModalMode(null);
          queryClient.invalidateQueries({ queryKey: ['leases'] });
          queryClient.invalidateQueries({ queryKey: ['items'] });
        }}
      />
    </div>
  );
};

export default MyLeases;
