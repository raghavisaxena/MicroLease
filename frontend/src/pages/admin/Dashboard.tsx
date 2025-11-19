import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, AlertTriangle, DollarSign, CheckCircle, XCircle } from "lucide-react";
import api from "@/lib/api";

interface DashboardStats {
  users: {
    total: number;
    lessors: number;
    lessees: number;
    admins: number;
    banned: number;
  };
  items: {
    total: number;
    available: number;
    approved: number;
    pending: number;
  };
  disputes: {
    total: number;
    pending: number;
    resolved: number;
  };
  transactions: {
    total: number;
    credits: number;
    debits: number;
    totalAmount: number;
  };
  leases: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
  };
}

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const res = await api.get("/admin/dashboard/stats");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading statistics...</p>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats?.users.total || 0,
      icon: Users,
      details: [
        { label: "Lessors", value: stats?.users.lessors || 0 },
        { label: "Lessees", value: stats?.users.lessees || 0 },
        { label: "Banned", value: stats?.users.banned || 0 },
      ],
    },
    {
      title: "Total Items",
      value: stats?.items.total || 0,
      icon: Package,
      details: [
        { label: "Approved", value: stats?.items.approved || 0 },
        { label: "Pending", value: stats?.items.pending || 0 },
        { label: "Available", value: stats?.items.available || 0 },
      ],
    },
    {
      title: "Disputes",
      value: stats?.disputes.total || 0,
      icon: AlertTriangle,
      details: [
        { label: "Pending", value: stats?.disputes.pending || 0 },
        { label: "Resolved", value: stats?.disputes.resolved || 0 },
      ],
    },
    {
      title: "Transactions",
      value: stats?.transactions.total || 0,
      icon: DollarSign,
      details: [
        { label: "Total Amount", value: `₹${stats?.transactions.totalAmount || 0}` },
        { label: "Credits", value: stats?.transactions.credits || 0 },
        { label: "Debits", value: stats?.transactions.debits || 0 },
      ],
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of platform statistics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <div className="mt-4 space-y-1">
                    {card.details.map((detail) => (
                      <div key={detail.label} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{detail.label}</span>
                        <span className="font-medium">{detail.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Leases Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Leases Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Leases</p>
                  <p className="text-2xl font-bold">{stats?.leases.total || 0}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats?.leases.active || 0}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats?.leases.completed || 0}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cancelled</p>
                  <p className="text-2xl font-bold">{stats?.leases.cancelled || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
