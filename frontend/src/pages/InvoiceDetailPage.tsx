import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInvoiceDetails, recordPayment, recordRefund } from "@/api/finance";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDH, toCentimes, fromCentimes } from "@/utils/currency";
import { ArrowLeft, CheckCircle, Undo2, Printer } from "lucide-react";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { ReceiptTemplate } from "@/components/finance/ReceiptTemplate";
import { getSettings } from "@/api/settings";

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [paymentInput, setPaymentInput] = useState<number | "">("");
  const [refundReason, setRefundReason] = useState("");

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => getInvoiceDetails(Number(id)),
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt_${invoice?.id}`,
  });

  const paymentMutation = useMutation({
    mutationFn: (args: { amount: number; type: 'payment' | 'refund'; reason?: string }) => 
      args.type === 'refund'
        ? recordRefund(Number(id), args.amount, args.reason ?? '')
        : recordPayment(Number(id), args.amount),
    onSuccess: () => {
      setIsPaymentOpen(false);
      setIsRefundOpen(false);
      setRefundReason("");
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "An error occurred");
    }
  });

  const openPaymentDialog = () => {
    if (invoice) {
      setPaymentInput(fromCentimes(invoice.balance_due_centimes));
      setIsPaymentOpen(true);
    }
  };

  const handlePay = () => {
    if (typeof paymentInput === 'number' && paymentInput > 0) {
      paymentMutation.mutate({ amount: toCentimes(paymentInput), type: 'payment' });
    }
  };

  const handleRefund = () => {
    if (typeof paymentInput === 'number' && paymentInput > 0 && refundReason) {
      paymentMutation.mutate({ amount: toCentimes(paymentInput), type: 'refund', reason: refundReason });
    }
  };

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!invoice) return <div className="p-6">Invoice not found.</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors rounded-full" asChild>
            <Link to="/invoices"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
              Invoice #{invoice.id} - {invoice.month}/{invoice.year}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${
                invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                invoice.status === 'partial' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                'bg-destructive/10 text-destructive dark:bg-destructive/20'
              }`}>
                {invoice.status.toUpperCase()}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage invoice details, payments, and refunds.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {invoice.paid_amount_centimes > 0 && (
            <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-full font-medium" onClick={() => {
              setPaymentInput(fromCentimes(invoice.paid_amount_centimes));
              setIsRefundOpen(true);
            }}>
              <Undo2 className="w-4 h-4 mr-2" /> Issue Refund
            </Button>
          )}

          <Button variant="outline" className="rounded-full font-medium" onClick={() => handlePrint()}>
            <Printer className="w-4 h-4 mr-2" /> Print Receipt
          </Button>
          
          {invoice.status !== 'paid' && (
            <Button onClick={openPaymentDialog} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-medium shadow-sm transition-colors">
              <CheckCircle className="w-4 h-4 mr-2" /> Mark as Paid
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-6 border border-border rounded-2xl shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20 shrink-0">
            {invoice.student?.first_name.charAt(0)}{invoice.student?.last_name.charAt(0)}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Student Info</h2>
            <Link to={`/students/${invoice.student?.id}`} className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
              {invoice.student?.first_name} {invoice.student?.last_name}
            </Link>
          </div>
        </div>
        
        <div className="bg-card p-6 border border-border rounded-2xl shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Summary</h2>
          <div className="flex justify-between items-center text-sm font-medium text-foreground">
            <span className="text-muted-foreground">Total:</span>
            <span>{formatDH(invoice.total_amount_centimes)}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <span>Paid:</span>
            <span>{formatDH(invoice.paid_amount_centimes)}</span>
          </div>
          <div className="flex justify-between items-center font-bold text-destructive mt-3 pt-3 border-t border-border text-lg">
            <span>Balance Due:</span>
            <span>{formatDH(invoice.balance_due_centimes)}</span>
          </div>
        </div>
      </div>

      <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/20">
          <h2 className="text-lg font-semibold text-foreground">Line Items</h2>
        </div>
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="h-12 font-semibold text-muted-foreground">Class</TableHead>
              <TableHead className="h-12 font-semibold text-muted-foreground">Subject</TableHead>
              <TableHead className="h-12 font-semibold text-muted-foreground">Teacher</TableHead>
              <TableHead className="h-12 font-semibold text-muted-foreground text-right">Amount</TableHead>
              <TableHead className="h-12 font-semibold text-muted-foreground text-right">Paid Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(invoice.items || []).map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-border group">
                <TableCell className="font-medium text-foreground">{item.school_class?.name}</TableCell>
                <TableCell className="text-muted-foreground">{item.school_class?.subject?.name}</TableCell>
                <TableCell className="text-muted-foreground">{item.school_class?.teacher?.name}</TableCell>
                <TableCell className="text-right font-medium text-muted-foreground">{formatDH(item.amount_centimes)}</TableCell>
                <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">{formatDH(item.paid_amount_centimes)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/20">
          <h2 className="text-lg font-semibold text-foreground">Payment History</h2>
        </div>
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="h-12 font-semibold text-muted-foreground">Date</TableHead>
              <TableHead className="h-12 font-semibold text-muted-foreground">Type</TableHead>
              <TableHead className="h-12 font-semibold text-muted-foreground text-right">Amount</TableHead>
              <TableHead className="h-12 font-semibold text-muted-foreground">Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(invoice.payments || []).map((payment) => (
              <TableRow key={payment.id} className="hover:bg-muted/30 transition-colors border-border group">
                <TableCell className="text-muted-foreground">{new Date(payment.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold uppercase ${payment.type === 'refund' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                    {payment.type}
                  </span>
                </TableCell>
                <TableCell className="text-right font-bold text-foreground">{formatDH(payment.amount_centimes)}</TableCell>
                <TableCell className="text-muted-foreground">{payment.reason || '-'}</TableCell>
              </TableRow>
            ))}
            {!(invoice.payments?.length) && (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No payments recorded.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-3 rounded-lg border border-border">
              Record a full or partial payment. The amount will be distributed proportionally across the line items.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Amount (DH)</label>
              <input
                type="number"
                min={0}
                max={fromCentimes(invoice.balance_due_centimes)}
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-lg font-semibold ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={paymentInput}
                onChange={(e) => setPaymentInput(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground font-medium">Balance Due: {formatDH(invoice.balance_due_centimes)}</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-full" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
            <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handlePay} disabled={paymentMutation.isPending || !paymentInput}>
              {paymentMutation.isPending ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={isRefundOpen} onOpenChange={setIsRefundOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Issue Refund / Withdrawal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-3 rounded-lg border border-border">
              Record a refund given back to the student. This will decrease the paid amount proportionally across line items.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Amount (DH)</label>
              <input
                type="number"
                min={0}
                max={fromCentimes(invoice.paid_amount_centimes)}
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-lg font-semibold ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={paymentInput}
                onChange={(e) => setPaymentInput(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground font-medium">Max Refundable: {formatDH(invoice.paid_amount_centimes)}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Reason</label>
              <textarea
                required
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Student withdrew from classes due to..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-full" onClick={() => setIsRefundOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="rounded-full" onClick={handleRefund} disabled={paymentMutation.isPending || !paymentInput || !refundReason}>
              {paymentMutation.isPending ? "Processing..." : "Confirm Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Hidden Receipt Template for Printing */}
      <div className="hidden">
        <ReceiptTemplate ref={receiptRef} invoice={invoice} settings={settings} />
      </div>
    </div>
  );
}
