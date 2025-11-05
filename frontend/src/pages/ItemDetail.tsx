import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProductCard from "@/components/ProductCard";
import { MapPin, Shield, Calendar, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";
import LeaseModal from "@/components/LeaseModal";

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLeasing, setIsLeasing] = useState(false);
  const [leaseModalOpen, setLeaseModalOpen] = useState(false);

  // Fetch item details
  const { data: item, isLoading, isError, error } = useQuery({
    queryKey: ["item", id],
    queryFn: async () => {
      const res = await api.get(`/items/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Determine current user id from token (best-effort). Used to show owner-specific actions.
  const getCurrentUserId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // common claim names
      return payload.id || payload.userId || payload.sub || null;
    } catch (e) {
      return null;
    }
  };
  const currentUserId = getCurrentUserId();
  const isOwner = !!(currentUserId && item?.owner && currentUserId === item.owner.id);

  // Fetch all items for related items
  const { data: allItems } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const res = await api.get("/items");
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  // Get related items (same category, excluding current item)
  const relatedItems = (allItems || [])
    .filter((it: any) => it.id !== parseInt(id || "0") && it.category === item?.category)
    .slice(0, 3)
    .map((it: any) => {
      const raw = it.imageUrl || "";
      let imageSrc = "/placeholder.svg";

      if (raw && typeof raw === "string") {
        const trimmed = raw.trim();
        if (trimmed.startsWith("data:")) {
          imageSrc = trimmed;
        } else if (trimmed.startsWith("http") || trimmed.startsWith("/")) {
          imageSrc = trimmed;
        } else {
          const base64pattern = /^[A-Za-z0-9+/=\n\r]+$/;
          const onlyBase64 = base64pattern.test(trimmed.replace(/\s/g, ""));
          if (onlyBase64) {
            imageSrc = `data:image/jpeg;base64,${trimmed}`;
          } else if (trimmed.length > 0) {
            imageSrc = trimmed;
          }
        }
      }

      return {
        id: String(it.id),
        name: it.title || it.name || "Untitled",
        image: imageSrc,
        pricePerDay: it.pricePerDay || it.price || 0,
        category: it.category || "Other",
      };
    });

  // Handle image URL normalization
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

  // submit lease with chosen dates
  const handleLeaseSubmit = async (startDate: string, endDate: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to lease this item");
      navigate("/login");
      return;
    }

    // Prevent owner from leasing their own item on client side as well
    if (item?.owner && currentUserId && item.owner.id === currentUserId) {
      toast.error("Owners cannot lease their own items");
      return;
    }

    setIsLeasing(true);
    try {
      await api.post("/leases", {
        ItemId: parseInt(id || "0"),
        startDate,
        endDate,
      });

      toast.success("Lease request created successfully!");
      setLeaseModalOpen(false);
      navigate("/my-leases");
    } catch (error: any) {
      console.error("Lease error:", error);
      toast.error(error.response?.data?.message || "Failed to create lease request");
    } finally {
      setIsLeasing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-muted-foreground">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-red-500">{(error as any)?.message || "Failed to load item details"}</p>
          <Link to="/browse">
            <Button className="mt-4">Back to Browse</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/browse" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Browse
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Image Section */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-secondary shadow-lg">
              <img
                src={getImageSrc(item.imageUrl)}
                alt={item.title || item.name || "Item"}
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              {item.category && <Badge className="mb-3">{item.category}</Badge>}
              <h1 className="text-4xl font-bold text-foreground mb-4">{item.title || item.name}</h1>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold text-primary">₹{item.pricePerDay}</span>
                <span className="text-xl text-muted-foreground">/day</span>
              </div>
            </div>

            <div className="flex items-center gap-6 py-4 border-y border-border">
              {item.condition && (
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{item.condition}</span>
                </div>
              )}
              {item.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{item.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">
                  {item.availability ? "Available Now" : "Currently Leased"}
                </span>
              </div>
            </div>

            {item.description && (
              <Card className="p-6 bg-secondary/50 border-border">
                <h3 className="font-semibold mb-3">About this item</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </Card>
            )}

            {item.owner && (
              <div>
                <h3 className="font-semibold mb-3">Owner</h3>
                <p className="text-muted-foreground">{item.owner.name || item.owner.email}</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              {!isOwner ? (
                <Button
                  size="lg"
                  className="flex-1 text-lg py-6"
                  onClick={() => setLeaseModalOpen(true)}
                  disabled={isLeasing || !item.availability}
                >
                  {isLeasing ? "Processing..." : item.availability ? "Lease Now" : "Not Available"}
                </Button>
              ) : (
                <div className="flex-1 flex gap-3">
                  <Link to={`/add-item?id=${item.id}`} className="w-1/2">
                    <Button size="lg" className="w-full">Edit</Button>
                  </Link>
                  <Button
                    size="lg"
                    variant="destructive"
                    className="w-1/2"
                    onClick={async () => {
                      if (!confirm('Are you sure you want to delete this item?')) return;
                      try {
                        await api.delete(`/items/${item.id}`);
                        toast.success('Item deleted');
                        navigate('/my-leases');
                      } catch (err: any) {
                        console.error('Delete item error:', err);
                        toast.error(err?.response?.data?.message || 'Failed to delete item');
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              )}

              <Button size="lg" variant="outline" className="flex-1 text-lg py-6">
                Contact Owner
              </Button>
            </div>
          </div>
          {/* Lease modal */}
          <LeaseModal
            open={leaseModalOpen}
            initialStart={new Date().toISOString().split('T')[0]}
            initialEnd={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            title={`Lease ${item.title || 'Item'}`}
            onClose={() => setLeaseModalOpen(false)}
            onSubmit={handleLeaseSubmit}
          />
        </div>

        {/* Related Items */}
        {relatedItems.length > 0 && (
          <div className="border-t border-border pt-16">
            <h2 className="text-3xl font-bold text-foreground mb-8">Similar Items</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedItems.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemDetail;
