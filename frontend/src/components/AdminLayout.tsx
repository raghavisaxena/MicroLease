import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  AlertTriangle, 
  DollarSign,
  LogOut 
} from "lucide-react";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/users", label: "Users", icon: Users },
    { path: "/admin/items", label: "Items", icon: Package },
    { path: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
    { path: "/admin/transactions", label: "Transactions", icon: DollarSign },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/admin/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-primary">MicroLease</h1>
          <p className="text-sm text-muted-foreground">Admin Panel</p>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className="w-full justify-start"
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Button>
              </Link>
            );
          })}

          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
