import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDH } from "@/utils/currency";
import type { PayrollBreakdownItem } from "@/api/payroll";

interface PayrollBreakdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  breakdown: PayrollBreakdownItem[];
  teacherName: string;
  month: number;
  year: number;
}

export function PayrollBreakdownDialog({ open, onOpenChange, breakdown, teacherName, month, year }: PayrollBreakdownDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Payroll Breakdown - {teacherName} <span className="text-muted-foreground font-medium">({month}/{year})</span>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-3 rounded-lg border border-border">
            Showing all precise cash transactions (payments & refunds) recorded in this month that contributed to this payroll.
          </p>
          <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="h-11 font-semibold text-muted-foreground">Date</TableHead>
                  <TableHead className="h-11 font-semibold text-muted-foreground">Student</TableHead>
                  <TableHead className="h-11 font-semibold text-muted-foreground">Subject / Class</TableHead>
                  <TableHead className="h-11 font-semibold text-muted-foreground">Type</TableHead>
                  <TableHead className="h-11 font-semibold text-muted-foreground text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breakdown.map((item) => (
                  <TableRow key={item.allocation_id} className="hover:bg-muted/30 transition-colors border-border group">
                    <TableCell className="text-muted-foreground">{new Date(item.date).toLocaleString()}</TableCell>
                    <TableCell className="font-medium text-foreground">{item.student_name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.subject_name} / {item.class_name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold uppercase ${item.type === 'refund' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                        {item.type}
                      </span>
                    </TableCell>
                    <TableCell className={`text-right font-bold ${item.amount_centimes < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {formatDH(item.amount_centimes)}
                    </TableCell>
                  </TableRow>
                ))}
                {breakdown.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No transactions found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
