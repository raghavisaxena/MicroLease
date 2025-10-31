import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type User = {
  id?: number | string;
  name?: string;
  email?: string;
  role?: string;
};

function decodeToken(token: string): any | null {
  try {
    const payload = token.split(".")[1];
    // base64url -> base64
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      toast.error("Not authenticated. Please login.");
      return;
    }

    const payload = decodeToken(token);
    const userId = payload?.id;

    // Try to fetch full user info from backend if route exists
    (async () => {
      try {
        if (userId) {
          const res = await api.get(`/users/${userId}`);
          setUser(res.data.user || res.data);
        } else {
          // fallback to token data
          setUser({ id: payload?.id, email: payload?.email, role: payload?.role, name: payload?.name });
        }
      } catch (err) {
        // If backend doesn't expose /users/:id, fall back to token payload
        setUser({ id: payload?.id, email: payload?.email, role: payload?.role, name: payload?.name });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-muted-foreground">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-2xl font-semibold mb-4">Not signed in</h1>
          <p className="text-muted-foreground mb-6">Please sign in to view your profile.</p>
          <div className="flex gap-2">
            <Button asChild>
              <a href="/login">Sign In</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl bg-card p-6 rounded-lg border border-border">
          <h1 className="text-3xl font-bold mb-4">Profile</h1>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="text-lg font-medium">{user.name || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-lg font-medium">{user.email || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="text-lg font-medium">{user.role || "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
