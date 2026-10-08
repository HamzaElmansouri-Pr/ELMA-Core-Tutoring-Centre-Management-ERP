import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getInvoices } from "@/api/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { formatDH } from "@/utils/currency";
import { ArrowLeft, FileText, Search } from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";
export function InvoicesListPage() {
  const { t } = useTranslation("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading } = useQuery({
    queryKey: ["invoices", page, perPage, debouncedSearch],
    queryFn: () => getInvoices({ page, per_page: perPage, search: debouncedSearch }),
    placeholderData: keepPreviousData,
  });

  const invoices = data?.data || [];
  const meta = data?.meta || null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors rounded-full" asChild>
            <Link to="/finance"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("sidebar_invoices", "Invoices Management")}</h1>
            <p className="text-sm text-muted-foreground mt-1">Track and manage all student billing records</p>
          </div>
        </div>
        <div className="relative w-full sm:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search invoice #, student, period..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 w-full bg-background border-border focus-visible:ring-primary rounded-full shadow-sm"
          />
        </div>
      </div>

      <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <TableSkeleton columns={8} rows={8} headers={["Invoice ID", "Student", "Month/Year", "Total", "Paid", "Balance Due", "Status", "Action"]} />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="h-12 font-semibold text-muted-foreground">Invoice ID</TableHead>
                  <TableHead className="h-12 font-semibold text-muted-foreground">Student</TableHead>
                  <TableHead className="h-12 font-semibold text-muted-foreground">Period</TableHead>
                  <TableHead className="h-12 font-semibold text-muted-foreground">Total</TableHead>
                  <TableHead className="h-12 font-semibold text-muted-foreground">Paid</TableHead>
                  <TableHead className="h-12 font-semibold text-muted-foreground">Balance Due</TableHead>
                  <TableHead className="h-12 font-semibold text-muted-foreground">Status</TableHead>
                  <TableHead className="h-12 font-semibold text-muted-foreground text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => {
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
                      <TableCell className="font-medium text-muted-foreground">{formatDH(inv.total_amount_centimes)}</TableCell>
                      <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">{formatDH(inv.paid_amount_centimes)}</TableCell>
                      <TableCell className={`font-bold ${inv.balance_due_centimes > 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatDH(inv.balance_due_centimes)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          inv.status === 'partial' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-destructive/10 text-destructive dark:bg-destructive/20'
                        }`}>
                          {inv.status.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground" asChild>
                          <Link to={`/invoices/${inv.id}`}>
                             <FileText className="w-4 h-4 mr-2" /> {t("view")}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {invoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                          <FileText className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-lg font-semibold text-foreground">{t("no_data_found", "No data found")}</p>
                        <p className="text-sm mt-1">{t("no_invoices_yet", "No invoices generated yet.")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            
            <div className="border-t border-border bg-muted/20 px-4 py-3">
              <PaginationControls
                meta={meta}
                onPageChange={(newPage) => setPage(newPage)}
                onPerPageChange={(newPerPage) => {
                  setPerPage(newPerPage);
                  setPage(1);
                }}
                isLoading={isLoading}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
