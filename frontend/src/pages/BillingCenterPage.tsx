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
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('billing_center', 'Billing Center')}</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate and monitor monthly student invoices.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64 sm:flex-initial group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search invoice #, student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 w-full bg-background border-border focus-visible:ring-primary rounded-full shadow-sm"
            />
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="h-10 rounded-full px-5 shadow-sm font-medium transition-colors border-border hover:bg-muted" asChild>
              <Link to="/invoices">{t('view_all_invoices', 'View All Invoices')}</Link>
            </Button>
            <Button onClick={() => setIsGenerateOpen(true)} className="h-10 rounded-full px-5 shadow-sm font-medium transition-colors">
              <PlusCircle className="w-4 h-4 mr-2" />
              {t('generate_invoices', 'Generate Invoices')}
            </Button>
          </div>
        </div>
      </div>

      <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2 bg-destructive/10">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <h2 className="text-lg font-semibold text-destructive">Unpaid Invoices</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading unpaid invoices...</div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="h-12 font-semibold text-muted-foreground">Invoice ID</TableHead>
                <TableHead className="h-12 font-semibold text-muted-foreground">Student</TableHead>
                <TableHead className="h-12 font-semibold text-muted-foreground">Period</TableHead>
                <TableHead className="h-12 font-semibold text-muted-foreground">Total Due</TableHead>
                <TableHead className="h-12 font-semibold text-muted-foreground text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((inv) => {
                const studentName = inv.student ? `${inv.student.first_name} ${inv.student.last_name}` : "Unknown";
                const initials = inv.student ? `${inv.student.first_name.charAt(0)}${inv.student.last_name.charAt(0)}`.toUpperCase() : "?";

                return (
                  <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors border-border group">
                    <TableCell className="font-mono font-medium text-muted-foreground">#{inv.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs tracking-wider border border-primary/20 shrink-0">
                          {initials}
                        </div>
                        <Link to={`/students/${inv.student_id}`} className="font-semibold text-foreground hover:text-primary transition-colors truncate max-w-[150px]" title={studentName}>
                          {studentName}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
                        {inv.month}/{inv.year}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-destructive text-base">
                      {formatDH(inv.total_amount_centimes)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground font-medium" asChild>
                        <Link to={`/invoices/${inv.id}`}>
                          <FileText className="w-4 h-4 mr-2" /> View & Pay
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <div className="w-16 h-16 rounded-full bg-emerald-100/50 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-emerald-500/50" />
                      </div>
                      <p className="text-lg font-semibold text-foreground">All clear!</p>
                      <p className="text-sm mt-1">No unpaid invoices found for your search criteria.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Generate Monthly Invoices</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-3 rounded-lg border border-border">
              This will generate invoices for all active enrollments for the selected month and year. It is safe to run multiple times (idempotent).
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Month</label>
                <input
                  type="number"
                  min={1} max={12}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={generateMonth}
                  onChange={(e) => setGenerateMonth(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Year</label>
                <input
                  type="number"
                  min={2000}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={generateYear}
                  onChange={(e) => setGenerateYear(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-full" onClick={() => setIsGenerateOpen(false)}>Cancel</Button>
            <Button className="rounded-full" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? "Generating..." : "Generate Invoices"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
