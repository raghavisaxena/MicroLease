import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Menu, X, Settings, LogOut, User2, Gauge, UserCircle, UserCircle2, Wallet, Shield } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { decodeToken } from "@/pages/Profile";

interface User {
  id?: number;
  email?: string;
  role?: string;
  name?: string;
}

const Navbar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isActive = (path: string) => location.pathname === path;
  const isAuthenticated = !!localStorage.getItem('token');

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      return;
    }

    const payload = decodeToken(token);
    if (!payload) {
      setUser(null);
      return;
    }

    // Immediately set user from token to show admin button quickly
    setUser({ 
      id: payload?.id, 
      email: payload?.email, 
      role: payload?.role, 
      name: payload?.name 
    });

    // Then try to fetch full user info from backend if route exists
    const userId = payload?.id;
    if (userId) {
      (async () => {
        try {
          const res = await api.get(`/users/${userId}`);
          setUser(res.data.user || res.data);
          console.log(res.data.user || res.data);
        } catch (err) {
          // Keep the token data if backend fetch fails
          console.log("Using token data for user info");
        }
      })();
    }
  }, [location.pathname]);

  // Fetch wallet balance
  const { data: walletData } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await api.get("/wallet");
      return res.data;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const walletBalance = walletData?.wallet?.balance || 0;

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/browse", label: "Browse" },
    { path: "/add-item", label: "List Item" },
    { path: "/my-leases", label: "My Leases" },
    { path: "/wallet", label: "Wallet" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-teal rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              MicroLease
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.path) ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/wallet">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <span className="font-semibold">₹{walletBalance.toFixed(2)}</span>
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <UserCircle2 className="h-7 w-7" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User2 className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/wallet")}>
                      <Wallet className="mr-2 h-4 w-4" />
                      Wallet
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/my-details")}>
                      <User2 className="mr-2 h-4 w-4" />
                      My Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/rscore")}>
                      <Gauge className="mr-2 h-4 w-4" />
                      RScore
                    </DropdownMenuItem>
                    {user?.role === "admin" && (
                      <DropdownMenuItem onClick={() => navigate("/admin/dashboard")}>
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        // simple logout: clear token and redirect to home
                        localStorage.removeItem("token");
                        navigate("/");
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            {isAuthenticated && (
              <Link to="/wallet" onClick={() => setIsMenuOpen(false)}>
                <div className="bg-secondary/50 rounded-lg p-3 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    <span className="text-sm font-medium">Wallet Balance</span>
                  </div>
                  <span className="text-lg font-bold">₹{walletBalance.toFixed(2)}</span>
                </div>
              </Link>
            )}
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block py-2 text-sm font-medium ${
                  isActive(link.path) ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col space-y-2 pt-4 border-t border-border">
              {isAuthenticated ? (
                <>
                  <Link to="/rscore" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full">
                      RScore
                    </Button>
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        aria-label="Settings"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate("/profile");
                        }}
                      >
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate("/wallet");
                        }}
                      >
                        Wallet
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate("/my-details");
                        }}
                      >
                        My Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate("/rscore");
                        }}
                      >
                        RScore
                      </DropdownMenuItem>
                      {user?.role === "admin" && (
                        <DropdownMenuItem
                          onClick={() => {
                            setIsMenuOpen(false);
                            navigate("/admin/dashboard");
                          }}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          setIsMenuOpen(false);
                          toggleTheme();
                        }}
                      >
                        Appearance
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate("/my-leases");
                        }}
                      >
                        MyLease
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setIsMenuOpen(false);
                          localStorage.removeItem("token");
                          navigate("/");
                        }}
                      >
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button size="sm" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
