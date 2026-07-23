import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInvoices, generateInvoices } from "@/api/finance";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDH } from "@/utils/currency";
import { FileText, PlusCircle, AlertTriangle } from "lucide-react";

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

  const unpaidInvoices = data?.data || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">{t('billing_center', 'Billing Center')}</h1>
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
              {unpaidInvoices.map((inv) => (
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
              {unpaidInvoices.length === 0 && (
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
