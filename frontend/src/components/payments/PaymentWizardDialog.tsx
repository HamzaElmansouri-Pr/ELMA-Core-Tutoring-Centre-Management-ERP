import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Loader2, Download, CheckCircle2 } from "lucide-react";

import { type Student, getStudents } from "@/api/students";
import { getStudentInvoices, processPayments, downloadReceipt } from "@/api/payments";
import { formatDH } from "@/utils/currency";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PaymentWizardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentWizardDialog({ isOpen, onClose, onSuccess }: PaymentWizardDialogProps) {
  const queryClient = useQueryClient();

  // Wizard State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Payment State
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<number[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  
  // Completed state
  const [completedPaymentId, setCompletedPaymentId] = useState<number | null>(null);

  // Reset wizard on close
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSearchQuery("");
      setSelectedStudent(null);
      setSelectedInvoiceIds([]);
      setGlobalDiscount(0);
      setDiscountReason("");
      setPaymentAmount(0);
      setCompletedPaymentId(null);
    }
  }, [isOpen]);

  // Queries
  const { data: allStudents = [], isLoading: isSearching } = useQuery({
    queryKey: ["students"],
    queryFn: getStudents,
  });

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return allStudents.slice(0, 10);
    }
    const q = searchQuery.toLowerCase().trim();
    return allStudents.filter(s => 
      s.first_name?.toLowerCase().includes(q) ||
      s.last_name?.toLowerCase().includes(q) ||
      s.parent_phone?.toLowerCase().includes(q) ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      `${s.last_name} ${s.first_name}`.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [allStudents, searchQuery]);

  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["invoices", "student", selectedStudent?.id],
    queryFn: () => getStudentInvoices(selectedStudent!.id),
    enabled: !!selectedStudent,
  });

  // Mutations
  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStudent || selectedInvoiceIds.length === 0) return;

      // Distribute payment amount and discount. For simplicity, apply discount to the first selected invoice,
      // and distribute payment across selected. But backend API accepts per-invoice arrays.
      // We will map this:
      const totalAmountCentimes = Math.round(paymentAmount * 100);
      const totalDiscountCentimes = Math.round(globalDiscount * 100);
      
      const payloadInvoices = selectedInvoiceIds.map((id, index) => {
          return {
              invoice_id: id,
              // Apply full payment and discount to the first invoice, backend handles exact math,
              // or distribute proportionally. Actually, the backend RecordPaymentAction handles multiple invoices
              // if we send them. Wait, PaymentController loops through each invoice and expects exact amounts per invoice.
              // Let's divide it proportionally or just put all payment on the first one?
              // To make it simple: we distribute the payment amount sequentially.
              amount_centimes: 0,
              discount_centimes: 0,
              discount_reason: index === 0 ? discountReason : undefined,
          };
      });

      // Distribute discount sequentially
      let remainingDiscount = totalDiscountCentimes;
      for (const inv of payloadInvoices) {
          const originalInv = (Array.isArray(invoices) ? invoices : []).find(i => i.id === inv.invoice_id);
          if (!originalInv) continue;
          const balance = originalInv.total_amount_centimes - originalInv.paid_amount_centimes;
          const toApply = Math.min(balance, remainingDiscount);
          inv.discount_centimes = toApply;
          remainingDiscount -= toApply;
          if (remainingDiscount <= 0) break;
      }

      // Distribute payment sequentially
      let remainingPayment = totalAmountCentimes;
      for (const inv of payloadInvoices) {
          const originalInv = (Array.isArray(invoices) ? invoices : []).find(i => i.id === inv.invoice_id);
          if (!originalInv) continue;
          const balance = originalInv.total_amount_centimes - originalInv.paid_amount_centimes - (inv.discount_centimes || 0);
          if (balance > 0) {
              const toApply = Math.min(balance, remainingPayment);
              inv.amount_centimes = toApply;
              remainingPayment -= toApply;
          }
      }

      return await processPayments({
        student_id: selectedStudent.id,
        payment_method: 'cash',
        invoices: payloadInvoices
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      if (data?.primary_payment_id) {
          setCompletedPaymentId(data.primary_payment_id);
      }
      setStep(3);
      onSuccess();
    },
    onError: (error: any) => {
      console.error(error);
      alert(error.response?.data?.message || "An error occurred during payment processing.");
    },
  });

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setStep(2);
  };

  const toggleInvoice = (invoiceId: number) => {
    setSelectedInvoiceIds(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const calculateSelectedTotal = () => {
      if (!Array.isArray(invoices)) return 0;
      let total = 0;
      selectedInvoiceIds.forEach(id => {
          const inv = invoices.find(i => i.id === id);
          if (inv) {
              total += (inv.total_amount_centimes - inv.paid_amount_centimes);
          }
      });
      return total / 100;
  };

  const selectedTotalDH = calculateSelectedTotal();
  const finalTotalDH = Math.max(0, selectedTotalDH - globalDiscount);

  // Auto-set payment amount when changing selection or discount
  useEffect(() => {
      setPaymentAmount(finalTotalDH);
  }, [finalTotalDH]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Step 1: Find Student"}
            {step === 2 && "Step 2: Apply Payment & Discounts"}
            {step === 3 && "Step 3: Receipt"}
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1: SEARCH */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search student by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="border rounded-md max-h-64 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading students...
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {searchResults.map((student) => (
                    <li 
                      key={student.id} 
                      className="p-3 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center"
                      onClick={() => handleSelectStudent(student)}
                    >
                      <div>
                        <p className="font-medium">{`${student.first_name} ${student.last_name}`}</p>
                        <p className="text-sm text-gray-500">{student.parent_phone}</p>
                      </div>
                      <Button variant="ghost" size="sm">Select</Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  {searchQuery ? `No students matching "${searchQuery}"` : "No students in the database yet."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: INVOICES & PAYMENT */}
        {step === 2 && (
          <div className="space-y-6">
              <div>
                  <h3 className="font-medium text-lg mb-2">Unpaid Classes for {selectedStudent?.first_name} {selectedStudent?.last_name}</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {isLoadingInvoices ? (
                        <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                    ) : !Array.isArray(invoices) || invoices.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 border rounded-lg bg-gray-50 dark:bg-slate-900">
                            No unpaid classes found for this student.
                        </div>
                    ) : (
                        invoices.map((inv) => (
                            <label 
                            key={inv.id} 
                            className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${selectedInvoiceIds.includes(inv.id) ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                            >
                            <input
                                type="checkbox"
                                className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={selectedInvoiceIds.includes(inv.id)}
                                onChange={() => toggleInvoice(inv.id)}
                            />
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <p className="font-medium">
                                        Month: {inv.month}/{inv.year}
                                    </p>
                                    <p className="font-bold">{formatDH(inv.total_amount_centimes - inv.paid_amount_centimes)}</p>
                                </div>
                                <ul className="mt-2 space-y-1">
                                    {inv.items?.map((item: any) => (
                                        <li key={item.id} className="text-sm text-gray-600 dark:text-gray-400 flex justify-between">
                                            <span>{item.school_class?.name}</span>
                                            <span>{formatDH(item.amount_centimes)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            </label>
                        ))
                    )}
                  </div>
              </div>

              {selectedInvoiceIds.length > 0 && (
                  <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium mb-1">Apply Discount (DA)</label>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01"
                                value={globalDiscount || ''} 
                                onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium mb-1">Discount Reason (Optional)</label>
                              <Input 
                                placeholder="e.g. Sibling discount"
                                value={discountReason} 
                                onChange={(e) => setDiscountReason(e.target.value)}
                              />
                          </div>
                      </div>

                      <div className="flex justify-between items-end border-t pt-4">
                          <div>
                              <label className="block text-sm font-medium mb-1 text-blue-600">Amount to Pay Now (DA)</label>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01"
                                className="text-lg font-bold border-blue-300 w-48"
                                value={paymentAmount || ''} 
                                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                              />
                              <p className="text-xs text-gray-500 mt-1">Leave less than {formatDH(finalTotalDH * 100)} for a partial payment</p>
                          </div>
                          <div className="text-right">
                              <p className="text-sm text-gray-500 mb-1">Total Balance Due</p>
                              <p className="text-2xl font-bold">{formatDH(finalTotalDH * 100)}</p>
                          </div>
                      </div>
                  </div>
              )}

            <div className="flex justify-between pt-2">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button 
                onClick={() => paymentMutation.mutate()} 
                disabled={paymentMutation.isPending || selectedInvoiceIds.length === 0 || paymentAmount <= 0}
              >
                {paymentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Process Payment
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS & RECEIPT */}
        {step === 3 && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold mb-2">Payment Successful!</h3>
                    <p className="text-gray-500">The payment has been recorded for {selectedStudent?.first_name} {selectedStudent?.last_name}.</p>
                </div>

                <div className="flex gap-4 pt-4">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    {completedPaymentId && (
                        <Button 
                            className="gap-2 bg-blue-600 hover:bg-blue-700" 
                            onClick={() => downloadReceipt(completedPaymentId)}
                        >
                            <Download className="w-4 h-4" /> Download PDF Receipt
                        </Button>
                    )}
                </div>
            </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
