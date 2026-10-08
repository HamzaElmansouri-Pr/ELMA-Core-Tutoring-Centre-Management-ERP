import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { getPayrollSummariesPaginated, calculatePayroll, markPayrollPaid } from "@/api/payroll";
import type { TeacherPayrollSummary, PayrollBreakdownItem } from "@/api/payroll";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDH } from "@/utils/currency";
import { Calculator, Lock, Eye, AlertTriangle, Search } from "lucide-react";
import { PayrollBreakdownDialog } from "@/components/finance/PayrollBreakdownDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TableSkeleton } from "@/components/ui/table-skeleton";

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

  const { data: response, isLoading } = useQuery({
    queryKey: ["payroll", month, year, page, perPage, debouncedSearch],
    queryFn: () => getPayrollSummariesPaginated(month, year, { page, per_page: perPage, search: debouncedSearch }),
    placeholderData: keepPreviousData,
  });

  const summaries: TeacherPayrollSummary[] = response?.data || [];
  const meta = response?.meta || null;

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
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Teacher Payroll</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and calculate teacher payments based on cash collected.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64 sm:flex-initial group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search teacher, status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 w-full bg-background border-border focus-visible:ring-primary rounded-full shadow-sm"
            />
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-muted-foreground">Month:</label>
              <input type="number" min={1} max={12} className="border border-border rounded-full px-3 h-10 w-20 bg-background text-sm focus-visible:ring-2 focus-visible:ring-primary outline-none transition-shadow" value={month} onChange={(e) => setMonth(Number(e.target.value))} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-muted-foreground">Year:</label>
              <input type="number" min={2000} className="border border-border rounded-full px-3 h-10 w-24 bg-background text-sm focus-visible:ring-2 focus-visible:ring-primary outline-none transition-shadow" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/20">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Payroll is calculated on a pure <b>Cash-basis</b>. It aggregates all physical payments (and refunds) collected during {month}/{year}.
          </p>
        </div>
        {isLoading ? (
          <div className="p-4">
            <TableSkeleton columns={6} rows={6} headers={["Teacher", "Commission %", "Gross Collected", "Final Payout", "Status", "Actions"]} />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="h-12 font-semibold text-muted-foreground">Teacher</TableHead>
                <TableHead className="h-12 font-semibold text-muted-foreground">Commission %</TableHead>
                <TableHead className="h-12 font-semibold text-muted-foreground">Gross Collected</TableHead>
                <TableHead className="h-12 font-semibold text-muted-foreground">Final Payout</TableHead>
                <TableHead className="h-12 font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="h-12 font-semibold text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((summary) => {
                const parts = summary.teacher_name.split(' ');
                const initials = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
                return (
                  <TableRow key={summary.teacher_id} className="hover:bg-muted/30 transition-colors border-border group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs tracking-wider shadow-sm border border-primary/20 shrink-0">
                          {initials.toUpperCase() || 'T'}
                        </div>
                        <div className="font-semibold text-foreground">
                          {summary.teacher_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-muted-foreground">{summary.commission_percentage}%</TableCell>
                    <TableCell className="text-muted-foreground">{formatDH(summary.gross_collected_centimes)}</TableCell>
                    <TableCell className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                      {formatDH(summary.payout_amount_centimes)}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        summary.status === 'paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        summary.status === 'calculated' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {summary.status.toUpperCase().replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {summary.status !== 'paid' && (
                          <Button 
                            variant="ghost" size="sm" 
                            className="hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
                            onClick={() => calcMutation.mutate(summary.teacher_id)}
                            disabled={calcMutation.isPending}
                          >
                            <Calculator className="w-4 h-4 mr-2" />
                            {summary.status === 'calculated' ? 'Recalculate' : 'Calculate'}
                          </Button>
                        )}
                        
                        {summary.record && (
                          <>
                            <Button 
                              variant="ghost" size="icon"
                              className="hover:bg-blue-100 hover:text-blue-600 transition-colors text-muted-foreground"
                              onClick={() => setBreakdownData({ open: true, breakdown: summary.record!.breakdown, teacherName: summary.teacher_name })}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            {summary.status !== 'paid' && (
                              <Button 
                                variant="ghost" size="sm"
                                className="hover:bg-destructive/10 hover:text-destructive text-destructive transition-colors font-medium"
                                onClick={() => setLockConfirmData({ open: true, recordId: summary.record!.id })}
                              >
                                <Lock className="w-4 h-4 mr-2" /> Lock
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {summaries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Calculator className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-lg font-semibold text-foreground">No teachers found.</p>
                      <p className="text-sm mt-1">Check your search query or adjust the date.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2 text-xl">
              <AlertTriangle className="w-6 h-6" /> Irreversible Action
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-base font-semibold text-foreground">Are you absolutely sure you want to mark this payroll as PAID?</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Once locked, this payroll record becomes immutable. You will NOT be able to recalculate it even if past invoices change. This step indicates that the physical cash has been handed to the teacher.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-full" onClick={() => setLockConfirmData({ open: false, recordId: null })}>Cancel</Button>
            <Button 
              variant="destructive" 
              className="rounded-full"
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
