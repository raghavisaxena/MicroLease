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
import { CheckCircle, XCircle, Search, Eye, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Item {
  id: number;
  title: string;
  description: string;
  category: string;
  pricePerDay: number;
  availability: boolean;
  approved: boolean;
  imageUrl: string;
  location: string;
  condition: string;
  createdAt: string;
  Owner?: {
    id: number;
    name: string;
    email: string;
  };
}

const Items = () => {
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [deleteItem, setDeleteItem] = useState<Item | null>(null);
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery<Item[]>({
    queryKey: ["adminItems"],
    queryFn: async () => {
      const res = await api.get("/admin/items");
      return res.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ itemId, approved }: { itemId: number; approved: boolean }) => {
      const res = await api.put(`/admin/items/${itemId}/approve`, { approved });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminItems"] });
      toast.success("Item status updated");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update item");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await api.delete(`/admin/items/${itemId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminItems"] });
      toast.success("Item deleted successfully");
      setDeleteItem(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete item");
    },
  });

  const filteredItems = items?.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleApprovalToggle = (item: Item) => {
    approveMutation.mutate({ itemId: item.id, approved: !item.approved });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading items...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Items Management</h1>
            <p className="text-muted-foreground">Approve or reject item listings</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Items ({filteredItems?.length || 0})</CardTitle>
            <div className="flex items-center space-x-2 mt-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or category..."
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
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Price/Day</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                    </TableCell>
                    <TableCell>{item.Owner?.name || "N/A"}</TableCell>
                    <TableCell>₹{item.pricePerDay}</TableCell>
                    <TableCell>
                      {item.availability ? (
                        <Badge variant="default">Available</Badge>
                      ) : (
                        <Badge variant="secondary">Unavailable</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.approved ? (
                        <Badge variant="default">Approved</Badge>
                      ) : (
                        <Badge variant="destructive">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedItem(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={item.approved ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handleApprovalToggle(item)}
                          disabled={approveMutation.isPending}
                        >
                          {item.approved ? (
                            <XCircle className="h-4 w-4 mr-1" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          {item.approved ? "Reject" : "Approve"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteItem(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Item Details Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Item Details</DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                {selectedItem.imageUrl && (
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Title</p>
                    <p className="font-medium">{selectedItem.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <Badge>{selectedItem.category}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Price per Day</p>
                    <p className="font-medium">₹{selectedItem.pricePerDay}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Condition</p>
                    <p className="font-medium">{selectedItem.condition}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{selectedItem.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Owner</p>
                    <p className="font-medium">{selectedItem.Owner?.name || "N/A"}</p>
                    <p className="text-xs text-muted-foreground">{selectedItem.Owner?.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-sm">{selectedItem.description}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{deleteItem?.title}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default Items;
