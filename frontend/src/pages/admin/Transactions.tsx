import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, TrendingUp, TrendingDown } from "lucide-react";
import api from "@/lib/api";

interface Transaction {
  id: number;
  amount: number;
  type: "credit" | "debit";
  description: string;
  createdAt: string;
  User: {
    id: number;
    name: string;
    email: string;
  };
}

interface TransactionStats {
  totalTransactions: number;
  totalCredits: number;
  totalDebits: number;
  creditSum: number;
  debitSum: number;
  netFlow: number;
}

const Transactions = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["adminTransactions", page, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (typeFilter !== "all") {
        params.append("type", typeFilter);
      }
      const res = await api.get(`/admin/transactions?${params.toString()}`);
      return res.data;
    },
  });

  const { data: stats } = useQuery<TransactionStats>({
    queryKey: ["transactionStats"],
    queryFn: async () => {
      const res = await api.get("/admin/transactions/stats");
      return res.data;
    },
  });

  const filteredTransactions = transactions?.filter(
    (txn) =>
      txn.User.name.toLowerCase().includes(search.toLowerCase()) ||
      txn.description.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">View all wallet transactions</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalTransactions || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₹{stats?.creditSum?.toFixed(2) || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.totalCredits || 0} transactions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ₹{stats?.debitSum?.toFixed(2) || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.totalDebits || 0} transactions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(stats?.netFlow || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                ₹{stats?.netFlow?.toFixed(2) || 0}
              </div>
              <div className="flex items-center text-xs mt-1">
                {(stats?.netFlow || 0) >= 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                    <span className="text-green-600">Positive</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                    <span className="text-red-600">Negative</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Transactions ({filteredTransactions?.length || 0})</CardTitle>
            <div className="flex items-center space-x-4 mt-4">
              <div className="flex items-center space-x-2 flex-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="credit">Credits Only</SelectItem>
                  <SelectItem value="debit">Debits Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions?.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>
                      {new Date(txn.createdAt).toLocaleDateString()}{" "}
                      {new Date(txn.createdAt).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{txn.User.name}</p>
                        <p className="text-xs text-muted-foreground">{txn.User.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={txn.type === "credit" ? "default" : "destructive"}>
                        {txn.type === "credit" ? "Credit" : "Debit"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={txn.type === "credit" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {txn.type === "credit" ? "+" : "-"}₹{Math.abs(txn.amount).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>{txn.description}</TableCell>
                  </TableRow>
                ))}
                {(!filteredTransactions || filteredTransactions.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={(transactions?.length || 0) < limit}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Transactions;
