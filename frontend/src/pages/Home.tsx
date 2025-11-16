import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/hero-image.jpg";
import { ArrowRight, Shield, Clock, Sparkles, Wallet, AlertCircle, CheckCircle } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const Home = () => {
  const [backendStatus, setBackendStatus] = useState("Connecting...");

  // Fetch items for featured section
  const { data: itemsData, isLoading: isLoadingItems } = useQuery<any[]>({
    queryKey: ["items"],
    queryFn: async () => {
      const res = await api.get("/items");
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 1000 * 30, // 30s
  });

  // Fetch wallet data for logged in user
  const { data: walletData } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) return null;
      try {
        const res = await api.get("/wallet");
        return res.data;
      } catch {
        return null;
      }
    },
  });

  useEffect(() => {
    api.get("/test")
      .then((res) => {
        setBackendStatus(res.data.message || "Backend connected!");
      })
      .catch(() => {
        setBackendStatus("⚠️ Unable to connect to backend");
      });
  }, []);

  // Get featured items (first 3 available items)
  const featuredItems = useMemo(() => {
    if (!itemsData) return [];
    
    return itemsData
      .filter((item: any) => item.availability !== false)
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
          price: it.pricePerDay || it.price || 0,
        };
      });
  }, [itemsData]);
  
  const features = [
    {
      icon: Shield,
      title: "Verified Equipment",
      description: "All items are quality-checked and insured for your peace of mind",
    },
    {
      icon: Clock,
      title: "Flexible Duration",
      description: "Lease for a day, week, or month. Cancel anytime with ease",
    },
    {
      icon: Sparkles,
      title: "Latest Tech",
      description: "Access cutting-edge gadgets without the commitment",
    },
  ];


  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-7xl font-bold text-foreground leading-tight">
                Lease Smarter,
                <span className="block text-primary mt-2">Live Lighter</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Access premium items without the commitment. Browse, lease, and return with ease.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/browse">
                  <Button size="lg" className="text-lg px-8 py-6 shadow-lg">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/add-item">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                    List Your Item
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img
                  src={heroImage}
                  alt="Tech gadgets"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Why Choose MicroLease?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The smartest way to access technology
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-8 border border-border hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Deposit Feature Section */}
      {walletData && (
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm font-semibold">Security Deposit System</span>
                </div>
                <h2 className="text-4xl font-bold text-foreground mb-6">Your Wallet & Security Deposits</h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Secure your rentals with our transparent security deposit system. When you rent an item, a security deposit is held to protect both you and the item owner.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Deposit Held During Rental</h3>
                      <p className="text-muted-foreground text-sm">
                        Your security deposit is held safely while you enjoy the rented item.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">24-Hour Refund Window</h3>
                      <p className="text-muted-foreground text-sm">
                        After returning the item, you have 24 hours to get your full deposit back if there's no damage claim.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Damage Protection</h3>
                      <p className="text-muted-foreground text-sm">
                        If the item is damaged, the owner can claim from the deposit. Otherwise, you get it all back.
                      </p>
                    </div>
                  </div>
                </div>

                <Link to="/wallet">
                  <Button size="lg" className="w-full sm:w-auto">
                    View My Wallet
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>

              <div className="bg-card border border-border rounded-2xl p-8">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Current Balance</span>
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-4xl font-bold text-primary">
                      ₹{walletData.wallet?.balance?.toFixed(2) || "0.00"}
                    </p>
                  </div>

                  <div className="border-t border-border pt-6 space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Deposited</p>
                      <p className="text-2xl font-semibold">₹{walletData.wallet?.totalDeposited?.toFixed(2) || "0.00"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Refunded</p>
                      <p className="text-2xl font-semibold text-green-600">₹{walletData.wallet?.totalRefunded?.toFixed(2) || "0.00"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Claimed</p>
                      <p className="text-2xl font-semibold text-red-600">₹{walletData.wallet?.totalClaimed?.toFixed(2) || "0.00"}</p>
                    </div>
                  </div>

                  {walletData.deposits && walletData.deposits.length > 0 && (
                    <div className="border-t border-border pt-6">
                      <p className="text-sm font-semibold mb-3">Active Deposits</p>
                      <div className="space-y-2">
                        {walletData.deposits.slice(0, 3).map((deposit: any) => (
                          <div key={deposit.id} className="flex items-start gap-2 text-sm">
                            <div className="flex-shrink-0 mt-1">
                              {deposit.status === "held" && <Clock className="h-4 w-4 text-yellow-600" />}
                              {deposit.status === "refunded" && <CheckCircle className="h-4 w-4 text-green-600" />}
                              {deposit.status === "claimed" && <AlertCircle className="h-4 w-4 text-red-600" />}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {deposit.lease?.item?.title || "Item"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ₹{deposit.amount.toFixed(2)} - {deposit.status}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Items */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Popular Leases</h2>
            <p className="text-lg text-muted-foreground">Start with these trending items</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {isLoadingItems ? (
              <p className="text-muted-foreground">Loading featured items...</p>
            ) : featuredItems.length > 0 ? (
              featuredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all"
                >
                  <div className="aspect-square bg-secondary">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-2xl font-bold text-primary">₹{item.price}</span>
                      <span className="text-sm text-muted-foreground">/day</span>
                    </div>
                    <Link to={`/item/${item.id}`}>
                      <Button className="w-full" size="lg">View Details</Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No featured items available</p>
            )}
          </div>
          <div className="text-center mt-12">
            <Link to="/browse">
              <Button size="lg" variant="outline">
                Browse All Items
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-teal">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands who are already leasing smarter with MicroLease
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
