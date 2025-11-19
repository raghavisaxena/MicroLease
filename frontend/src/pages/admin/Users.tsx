import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Ban, CheckCircle, Search, Eye } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  rscore: number;
  completedLeases: number;
  createdAt: string;
  Items?: any[];
  Leases?: any[];
}

const Users = () => {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const res = await api.get("/admin/users");
      return res.data;
    },
  });

  const banMutation = useMutation({
    mutationFn: async ({ userId, ban }: { userId: number; ban: boolean }) => {
      const res = await api.put(`/admin/users/${userId}/ban`, { ban });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("User status updated");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update user");
    },
  });

  const filteredUsers = users?.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleBanToggle = (user: User) => {
    banMutation.mutate({ userId: user.id, ban: !user.banned });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Users Management</h1>
            <p className="text-muted-foreground">Manage all platform users</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users ({filteredUsers?.length || 0})</CardTitle>
            <div className="flex items-center space-x-2 mt-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>R-Score</TableHead>
                  <TableHead>Leases</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.rscore || 0}</Badge>
                    </TableCell>
                    <TableCell>{user.completedLeases || 0}</TableCell>
                    <TableCell>
                      {user.banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {user.role !== "admin" && (
                          <Button
                            variant={user.banned ? "default" : "destructive"}
                            size="sm"
                            onClick={() => handleBanToggle(user)}
                            disabled={banMutation.isPending}
                          >
                            {user.banned ? (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            ) : (
                              <Ban className="h-4 w-4 mr-1" />
                            )}
                            {user.banned ? "Unban" : "Ban"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* User Details Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedUser.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <Badge>{selectedUser.role}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={selectedUser.banned ? "destructive" : "default"}>
                      {selectedUser.banned ? "Banned" : "Active"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">R-Score</p>
                    <p className="font-medium">{selectedUser.rscore || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completed Leases</p>
                    <p className="font-medium">{selectedUser.completedLeases || 0}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Listed Items</p>
                  <p className="font-medium">{selectedUser.Items?.length || 0} items</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Total Leases</p>
                  <p className="font-medium">{selectedUser.Leases?.length || 0} leases</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Users;
