import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getInvoices } from "@/api/finance";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDH } from "@/utils/currency";
import { ArrowLeft, FileText } from "lucide-react";

export function InvoicesListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => getInvoices(),
  });

  const invoices = data?.data || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/finance"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <h1 className="text-2xl font-semibold">All Invoices</h1>
      </div>

      <div className="bg-white p-6 border rounded-md shadow-sm dark:bg-slate-900">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Month/Year</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>#{inv.id}</TableCell>
                  <TableCell>{inv.student?.first_name} {inv.student?.last_name}</TableCell>
                  <TableCell>{inv.month}/{inv.year}</TableCell>
                  <TableCell>{formatDH(inv.total_amount_centimes)}</TableCell>
                  <TableCell>{formatDH(inv.paid_amount_centimes)}</TableCell>
                  <TableCell className="font-semibold text-red-600">
                    {formatDH(inv.balance_due_centimes)}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                      inv.status === 'partial' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {inv.status.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/invoices/${inv.id}`}>
                        <FileText className="w-4 h-4 me-2" /> View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">No invoices found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
