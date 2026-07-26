import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInvoices, generateInvoices } from "@/api/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDH } from "@/utils/currency";
import { FileText, PlusCircle, AlertTriangle, Search } from "lucide-react";

export function BillingCenterPage() {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generateMonth, setGenerateMonth] = useState(new Date().getMonth() + 1);
  const [generateYear, setGenerateYear] = useState(new Date().getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ["unpaidInvoices"],
    queryFn: () => getInvoices({ status: 'unpaid' }),
  });

  const generateMutation = useMutation({
    mutationFn: () => generateInvoices(generateMonth, generateYear),
    onSuccess: (data) => {
      alert(`Generated ${data.generated} invoices.`);
      setIsGenerateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["unpaidInvoices"] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Error generating invoices");
    }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const unpaidInvoices = data?.data || [];

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return unpaidInvoices;
    const q = searchQuery.toLowerCase().trim();
    return unpaidInvoices.filter((inv: any) => {
      const studentName = `${inv.student?.first_name || ""} ${inv.student?.last_name || ""}`.toLowerCase();
      const idStr = `#${inv.id}`;
      const periodStr = `${inv.month}/${inv.year}`;
      return idStr.includes(q) || studentName.includes(q) || periodStr.includes(q) || String(inv.id).includes(q);
    });
  }, [unpaidInvoices, searchQuery]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">{t('billing_center', 'Billing Center')}</h1>
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64 sm:flex-initial">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search invoice #, student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full bg-white dark:bg-slate-900"
            />
          </div>
          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <Link to="/invoices">{t('view_all_invoices', 'View All Invoices')}</Link>
            </Button>
            <Button onClick={() => setIsGenerateOpen(true)}>
              <PlusCircle className="w-4 h-4 me-2" />
              {t('generate_invoices', 'Generate Invoices')}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 border rounded-md shadow-sm dark:bg-slate-900">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          Unpaid Invoices
        </h2>

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
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>#{inv.id}</TableCell>
                  <TableCell>{inv.student?.first_name} {inv.student?.last_name}</TableCell>
                  <TableCell>{inv.month}/{inv.year}</TableCell>
                  <TableCell>{formatDH(inv.total_amount_centimes)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/invoices/${inv.id}`}>
                        <FileText className="w-4 h-4 me-2" /> View & Pay
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">No unpaid invoices found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Monthly Invoices</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-500">
              This will generate invoices for all active enrollments for the selected month and year. It is safe to run multiple times (idempotent).
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Month</label>
                <input
                  type="number"
                  min={1} max={12}
                  className="w-full border rounded p-2"
                  value={generateMonth}
                  onChange={(e) => setGenerateMonth(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Year</label>
                <input
                  type="number"
                  min={2000}
                  className="w-full border rounded p-2"
                  value={generateYear}
                  onChange={(e) => setGenerateYear(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>Cancel</Button>
            <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
