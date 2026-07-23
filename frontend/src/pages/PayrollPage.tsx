import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPayrollSummaries, calculatePayroll, markPayrollPaid } from "@/api/payroll";
import type { TeacherPayrollSummary, PayrollBreakdownItem } from "@/api/payroll";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDH } from "@/utils/currency";
import { Calculator, Lock, Eye, AlertTriangle } from "lucide-react";
import { PayrollBreakdownDialog } from "@/components/finance/PayrollBreakdownDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export function PayrollPage() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [breakdownData, setBreakdownData] = useState<{ open: boolean; breakdown: PayrollBreakdownItem[]; teacherName: string }>({
    open: false, breakdown: [], teacherName: ""
  });

  const [lockConfirmData, setLockConfirmData] = useState<{ open: boolean; recordId: number | null }>({
    open: false, recordId: null
  });

  const { data: summaries = [], isLoading } = useQuery({
    queryKey: ["payroll", month, year],
    queryFn: () => getPayrollSummaries(month, year),
  });

  const calcMutation = useMutation({
    mutationFn: (teacher_id: number) => calculatePayroll(teacher_id, month, year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", month, year] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Failed to calculate payroll.");
    }
  });

  const lockMutation = useMutation({
    mutationFn: (record_id: number) => markPayrollPaid(record_id),
    onSuccess: () => {
      setLockConfirmData({ open: false, recordId: null });
      queryClient.invalidateQueries({ queryKey: ["payroll", month, year] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Failed to lock payroll.");
      setLockConfirmData({ open: false, recordId: null });
    }
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Teacher Payroll</h1>
        <div className="flex gap-4">
          <div>
            <label className="text-sm font-medium me-2">Month:</label>
            <input type="number" min={1} max={12} className="border rounded px-2 py-1 w-20" value={month} onChange={(e) => setMonth(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-sm font-medium me-2">Year:</label>
            <input type="number" min={2000} className="border rounded px-2 py-1 w-24" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 border rounded-md shadow-sm dark:bg-slate-900">
        <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Payroll is calculated on a pure <b>Cash-basis</b>. It aggregates all physical payments (and refunds) collected during {month}/{year}.
        </p>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Commission %</TableHead>
                <TableHead>Gross Collected</TableHead>
                <TableHead>Final Payout</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((summary) => (
                <TableRow key={summary.teacher_id}>
                  <TableCell className="font-medium">{summary.teacher_name}</TableCell>
                  <TableCell>{summary.commission_percentage}%</TableCell>
                  <TableCell>{formatDH(summary.gross_collected_centimes)}</TableCell>
                  <TableCell className="font-bold text-green-600">
                    {formatDH(summary.payout_amount_centimes)}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      summary.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                      summary.status === 'calculated' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {summary.status.toUpperCase().replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {summary.status !== 'paid' && (
                        <Button 
                          variant="outline" size="sm" 
                          onClick={() => calcMutation.mutate(summary.teacher_id)}
                          disabled={calcMutation.isPending}
                        >
                          <Calculator className="w-4 h-4 me-2" />
                          {summary.status === 'calculated' ? 'Recalculate' : 'Calculate'}
                        </Button>
                      )}
                      
                      {summary.record && (
                        <>
                          <Button 
                            variant="secondary" size="sm"
                            onClick={() => setBreakdownData({ open: true, breakdown: summary.record!.breakdown, teacherName: summary.teacher_name })}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {summary.status !== 'paid' && (
                            <Button 
                              variant="default" size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => setLockConfirmData({ open: true, recordId: summary.record!.id })}
                            >
                              <Lock className="w-4 h-4 me-2" /> Lock & Pay
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {summaries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">No teachers found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <PayrollBreakdownDialog
        open={breakdownData.open}
        onOpenChange={(open) => setBreakdownData(prev => ({ ...prev, open }))}
        breakdown={breakdownData.breakdown}
        teacherName={breakdownData.teacherName}
        month={month}
        year={year}
      />

      <Dialog open={lockConfirmData.open} onOpenChange={(open) => setLockConfirmData(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Irreversible Action
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-medium">Are you absolutely sure you want to mark this payroll as PAID?</p>
            <p className="text-sm text-gray-500 mt-2">
              Once locked, this payroll record becomes immutable. You will NOT be able to recalculate it even if past invoices change. This step indicates that the physical cash has been handed to the teacher.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLockConfirmData({ open: false, recordId: null })}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => lockConfirmData.recordId && lockMutation.mutate(lockConfirmData.recordId)}
              disabled={lockMutation.isPending}
            >
              {lockMutation.isPending ? "Locking..." : "Yes, Mark as Paid & Lock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
