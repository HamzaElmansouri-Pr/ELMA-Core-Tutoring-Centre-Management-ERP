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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Payroll Breakdown - {teacherName} ({month}/{year})
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-500 mb-4">
            Showing all precise cash transactions (payments & refunds) recorded in this month that contributed to this payroll.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Subject / Class</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {breakdown.map((item) => (
                <TableRow key={item.allocation_id}>
                  <TableCell>{new Date(item.date).toLocaleString()}</TableCell>
                  <TableCell>{item.student_name}</TableCell>
                  <TableCell>{item.subject_name} / {item.class_name}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${item.type === 'refund' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                      {item.type.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className={`text-right ${item.amount_centimes < 0 ? 'text-red-600' : ''}`}>
                    {formatDH(item.amount_centimes)}
                  </TableCell>
                </TableRow>
              ))}
              {breakdown.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-gray-500">No transactions found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
