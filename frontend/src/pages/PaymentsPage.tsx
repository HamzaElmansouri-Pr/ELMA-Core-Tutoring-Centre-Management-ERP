import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getPayments, downloadReceipt, type PaymentRecord } from "@/api/payments";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PaymentWizardDialog } from "@/components/payments/PaymentWizardDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Download, FileText, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDH } from "@/utils/currency";
import { Link } from "react-router-dom";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export function PaymentsPage() {
  const { t } = useTranslation("common");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
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

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["payments", page, perPage, debouncedSearch],
    queryFn: () => getPayments({ page, per_page: perPage, search: debouncedSearch }),
    placeholderData: keepPreviousData,
  });

  const payments = data?.data || [];
  const meta = data?.meta || null;

  const handleDownload = async (id: number) => {
    try {
      setDownloadingId(id);
      await downloadReceipt(id);
    } catch (err) {
      console.error("Failed to download receipt", err);
      alert("Error downloading receipt.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("sidebar_payments", "Payments Management")}</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage tuition payments, partial balances, discounts, and receipts.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search receipt #, student, class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 w-full bg-background border-border focus-visible:ring-primary rounded-full shadow-sm"
            />
          </div>
          <Button onClick={() => setIsWizardOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 h-10 rounded-full px-5 shadow-sm font-medium transition-colors">
            <CreditCard className="w-4 h-4 me-2" />
            Add Payment
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2 bg-muted/20">
          <FileText className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Recent Transactions</h2>
        </div>

        {isLoading ? (
          <div className="p-4">
            <TableSkeleton columns={8} rows={8} headers={["Receipt #", "Date", "Student", "Invoice Period", "Classes Included", "Method", "Amount Paid", "Action"]} />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="h-12 font-semibold text-muted-foreground">Receipt #</TableHead>
                  <TableHead className="h-12 font-semibold text-muted-foreground">Date</TableHead>
                  <TableHead className="h-12 font-semibold text-muted-foreground">Student</TableHead>
                  <TableHead className="h-12 font-semibold text-muted-foreground">Invoice Period</TableHead>
                  <TableHead className="h-12 font-semibold text-muted-foreground">Classes Included</TableHead>
                  <TableHead className="h-12 font-semibold text-muted-foreground">Method</TableHead>
                  <TableHead className="h-12 font-semibold text-muted-foreground text-right">Amount Paid</TableHead>
                  <TableHead className="h-12 font-semibold text-muted-foreground text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment: PaymentRecord) => {
                  const student = payment.invoice?.student;
                  const studentName = student ? `${student.first_name} ${student.last_name}` : "Unknown Student";
                  const initials = student ? `${student.first_name.charAt(0)}${student.last_name.charAt(0)}`.toUpperCase() : "?";
                  const classes = payment.invoice?.items
                    ?.map((item) => item.school_class?.name || item.school_class?.subject?.name || "Class")
                    .join(", ") || "-";
                  const dateFormatted = new Date(payment.created_at).toLocaleDateString();

                  return (
                    <TableRow key={payment.id} className="hover:bg-muted/30 transition-colors border-border group">
                      <TableCell className="font-mono font-medium text-muted-foreground">#{payment.id}</TableCell>
                      <TableCell className="text-muted-foreground">{dateFormatted}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs tracking-wider border border-primary/20 shrink-0">
                            {initials}
                          </div>
                          {student ? (
                            <Link to={`/students/${student.id}`} className="font-semibold text-foreground hover:text-primary transition-colors truncate max-w-[120px]" title={studentName}>
                              {studentName}
                            </Link>
                          ) : (
                            <span className="font-semibold text-muted-foreground">{studentName}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
                          {payment.invoice ? `${payment.invoice.month}/${payment.invoice.year}` : "-"}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-muted-foreground" title={classes}>
                        {classes}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 uppercase">
                          {payment.payment_method}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400 text-base">
                        {formatDH(payment.amount_centimes)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
                          onClick={() => handleDownload(payment.id)}
                          disabled={downloadingId === payment.id}
                        >
                          {downloadingId === payment.id ? (
                            <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"/> Downloading</span>
                          ) : (
                            <><Download className="w-4 h-4 mr-2" /> Receipt</>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                          <CreditCard className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-lg font-semibold text-foreground">{t("no_data_found", "No data found")}</p>
                        <p className="text-sm mt-1 mb-4">No payment transactions recorded yet.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full px-6"
                          onClick={() => setIsWizardOpen(true)}
                        >
                          Record First Payment
                        </Button>
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

      {isWizardOpen && (
        <PaymentWizardDialog
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}
