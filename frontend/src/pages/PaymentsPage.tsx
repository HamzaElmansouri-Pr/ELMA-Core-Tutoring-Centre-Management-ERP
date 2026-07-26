import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { getPayments, downloadReceipt, type PaymentRecord } from "@/api/payments";
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

export function PaymentsPage() {
  const { t } = useTranslation("common");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["payments"],
    queryFn: getPayments,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const payments = data?.data || [];

  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return payments;
    const q = searchQuery.toLowerCase().trim();
    return payments.filter((payment: PaymentRecord) => {
      const student = payment.invoice?.student;
      const studentName = student ? `${student.first_name} ${student.last_name}`.toLowerCase() : "";
      const classes = payment.invoice?.items
        ?.map((item) => item.school_class?.name || item.school_class?.subject?.name || "")
        .join(" ").toLowerCase() || "";
      const idStr = `#${payment.id}`;
      const methodStr = payment.payment_method?.toLowerCase() || "";
      return idStr.includes(q) || studentName.includes(q) || classes.includes(q) || methodStr.includes(q) || String(payment.id).includes(q);
    });
  }, [payments, searchQuery]);

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
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("sidebar_payments", "Payments")}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage tuition payments, partial balances, discounts, and receipts.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search receipt #, student, class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full bg-white dark:bg-slate-900"
            />
          </div>
          <Button onClick={() => setIsWizardOpen(true)} className="bg-green-600 hover:bg-green-700 text-white shrink-0">
            <CreditCard className="w-4 h-4 me-2" />
            Add Payment
          </Button>
        </div>
      </div>

      <div className="bg-white p-6 border rounded-md shadow-sm dark:bg-slate-900">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-gray-500" />
          Recent Transactions
        </h2>

        {isLoading ? (
          <div className="py-10 text-center text-gray-500">Loading payments...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Invoice Period</TableHead>
                <TableHead>Classes Included</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount Paid</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment: PaymentRecord) => {
                const student = payment.invoice?.student;
                const studentName = student ? `${student.first_name} ${student.last_name}` : "Unknown Student";
                const classes = payment.invoice?.items
                  ?.map((item) => item.school_class?.name || item.school_class?.subject?.name || "Class")
                  .join(", ") || "-";
                const dateFormatted = new Date(payment.created_at).toLocaleDateString();

                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono font-medium">#{payment.id}</TableCell>
                    <TableCell>{dateFormatted}</TableCell>
                    <TableCell>
                      {student ? (
                        <Link to={`/students/${student.id}`} className="text-blue-600 hover:underline">
                          {studentName}
                        </Link>
                      ) : (
                        studentName
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.invoice ? `${payment.invoice.month}/${payment.invoice.year}` : "-"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-gray-600 dark:text-gray-400">
                      {classes}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 uppercase">
                        {payment.payment_method}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatDH(payment.amount_centimes)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(payment.id)}
                        disabled={downloadingId === payment.id}
                      >
                        <Download className="w-4 h-4 me-1" />
                        {downloadingId === payment.id ? "Downloading..." : "Receipt"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-lg font-medium">{t("no_data_found")}</p>
                      <p className="text-sm mt-1">No payment transactions recorded yet.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
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
