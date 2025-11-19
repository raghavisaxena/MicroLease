import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";
import { Shield } from "lucide-react";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const { user, token } = response.data;

      if (user.role !== "admin") {
        toast.error("Access denied. Admin privileges required.");
        setIsLoading(false);
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      toast.success("Welcome Admin!");
      navigate("/admin/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-gray-800 border-gray-700">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-primary/10 rounded-full mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white">Admin Login</h1>
          <p className="text-gray-400 mt-2">MicroLease Administration</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-200">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@microlease.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-200">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          Authorized personnel only
        </p>
      </Card>
    </div>
  );
};

export default AdminLogin;
