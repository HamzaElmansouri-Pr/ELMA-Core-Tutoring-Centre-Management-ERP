import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInvoiceDetails, recordPayment } from "@/api/finance";
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
      recordPayment(Number(id), args.amount, args.type, 'cash', args.reason),
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/invoices"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="text-2xl font-semibold">
            Invoice #{invoice.id} - {invoice.month}/{invoice.year}
          </h1>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
            invoice.status === 'partial' ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}>
            {invoice.status.toUpperCase()}
          </span>
        </div>
        
        <div className="flex gap-2">
          {invoice.paid_amount_centimes > 0 && (
            <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => {
              setPaymentInput(fromCentimes(invoice.paid_amount_centimes));
              setIsRefundOpen(true);
            }}>
              <Undo2 className="w-4 h-4 me-2" /> Issue Refund
            </Button>
          )}

          <Button variant="outline" onClick={() => handlePrint()}>
            <Printer className="w-4 h-4 me-2" /> Print Receipt
          </Button>
          
          {invoice.status !== 'paid' && (
            <Button onClick={openPaymentDialog} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 me-2" /> Mark as Paid
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 border rounded-md dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Student Info</h2>
          <p className="text-lg font-medium">{invoice.student?.first_name} {invoice.student?.last_name}</p>
        </div>
        <div className="bg-white p-4 border rounded-md dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Summary</h2>
          <div className="flex justify-between">
            <span>Total:</span>
            <span>{formatDH(invoice.total_amount_centimes)}</span>
          </div>
          <div className="flex justify-between">
            <span>Paid:</span>
            <span>{formatDH(invoice.paid_amount_centimes)}</span>
          </div>
          <div className="flex justify-between font-bold text-red-600 mt-2 border-t pt-2">
            <span>Balance Due:</span>
            <span>{formatDH(invoice.balance_due_centimes)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 border rounded-md shadow-sm dark:bg-slate-900">
        <h2 className="text-lg font-semibold mb-4">Line Items</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Paid Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(invoice.items || []).map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.school_class?.name}</TableCell>
                <TableCell>{item.school_class?.subject?.name}</TableCell>
                <TableCell>{item.school_class?.teacher?.name}</TableCell>
                <TableCell>{formatDH(item.amount_centimes)}</TableCell>
                <TableCell>{formatDH(item.paid_amount_centimes)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="bg-white p-6 border rounded-md shadow-sm dark:bg-slate-900">
        <h2 className="text-lg font-semibold mb-4">Payment History</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(invoice.payments || []).map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{new Date(payment.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs ${payment.type === 'refund' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                    {payment.type.toUpperCase()}
                  </span>
                </TableCell>
                <TableCell>{formatDH(payment.amount_centimes)}</TableCell>
                <TableCell>{payment.reason || '-'}</TableCell>
              </TableRow>
            ))}
            {!(invoice.payments?.length) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-gray-500">No payments recorded.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-500">Record a full or partial payment. The amount will be distributed proportionally across the line items.</p>
            <div>
              <label className="block text-sm font-medium mb-1">Amount (DH)</label>
              <input
                type="number"
                min={0}
                max={fromCentimes(invoice.balance_due_centimes)}
                className="w-full border rounded p-2 text-lg font-semibold"
                value={paymentInput}
                onChange={(e) => setPaymentInput(Number(e.target.value))}
              />
              <p className="text-xs text-gray-500 mt-1">Balance Due: {formatDH(invoice.balance_due_centimes)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
            <Button onClick={handlePay} disabled={paymentMutation.isPending || !paymentInput}>
              {paymentMutation.isPending ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={isRefundOpen} onOpenChange={setIsRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Refund / Withdrawal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-500">Record a refund given back to the student. This will decrease the paid amount proportionally across line items.</p>
            <div>
              <label className="block text-sm font-medium mb-1">Amount (DH)</label>
              <input
                type="number"
                min={0}
                max={fromCentimes(invoice.paid_amount_centimes)}
                className="w-full border rounded p-2 text-lg font-semibold"
                value={paymentInput}
                onChange={(e) => setPaymentInput(Number(e.target.value))}
              />
              <p className="text-xs text-gray-500 mt-1">Max Refundable: {formatDH(invoice.paid_amount_centimes)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reason</label>
              <textarea
                required
                className="w-full border rounded p-2 text-sm"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Student withdrew from classes due to..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRefund} disabled={paymentMutation.isPending || !paymentInput || !refundReason}>
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
