import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAttendance, saveAttendance } from "@/api/timetable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from "react-i18next";

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: number | null;
  className: string;
  sessionDate: string; // YYYY-MM-DD
}

export function AttendanceDialog({ open, onOpenChange, classId, className, sessionDate }: AttendanceDialogProps) {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const [localRecords, setLocalRecords] = useState<Record<number, string>>({});

  const { data: roster, isLoading } = useQuery({
    queryKey: ["attendance", classId, sessionDate],
    queryFn: () => getAttendance(classId!, sessionDate),
    enabled: !!classId && open,
  });

  useEffect(() => {
    if (roster) {
      const initial: Record<number, string> = {};
      roster.forEach(r => {
        if (r.status) initial[r.enrollment_id] = r.status;
      });
      setLocalRecords(initial);
    }
  }, [roster]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        class_id: classId!,
        session_date: sessionDate,
        records: Object.keys(localRecords).map(id => ({
          enrollment_id: Number(id),
          status: localRecords[Number(id)],
        })),
      };
      return saveAttendance(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", classId, sessionDate] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Failed to save attendance");
    }
  });

  const handleStatusChange = (enrollmentId: number, status: string) => {
    setLocalRecords(prev => ({ ...prev, [enrollmentId]: status }));
  };

  const markAll = (status: string) => {
    if (roster) {
      const updated: Record<number, string> = {};
      roster.forEach(r => { updated[r.enrollment_id] = status; });
      setLocalRecords(updated);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {t('attendance_for', 'Attendance for')} {className} <span className="text-muted-foreground font-medium">- {sessionDate}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => markAll('present')}>{t('mark_all_present', 'Mark All Present')}</Button>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => markAll('absent')}>{t('mark_all_absent', 'Mark All Absent')}</Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-32 text-muted-foreground">Loading roster...</div>
          ) : (
            <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="h-11 font-semibold text-muted-foreground">{t('student', 'Student')}</TableHead>
                    <TableHead className="h-11 font-semibold text-muted-foreground text-center">{t('present', 'Present')}</TableHead>
                    <TableHead className="h-11 font-semibold text-muted-foreground text-center">{t('absent', 'Absent')}</TableHead>
                    <TableHead className="h-11 font-semibold text-muted-foreground text-center">{t('late', 'Late')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(roster || []).map((student) => (
                    <TableRow key={student.enrollment_id} className="hover:bg-muted/30 transition-colors border-border group">
                      <TableCell className="font-medium text-foreground">{student.student_name}</TableCell>
                      <TableCell className="text-center">
                        <input 
                          type="radio" 
                          name={`status-${student.enrollment_id}`} 
                          checked={localRecords[student.enrollment_id] === 'present'}
                          onChange={() => handleStatusChange(student.enrollment_id, 'present')}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-slate-700 bg-transparent"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <input 
                          type="radio" 
                          name={`status-${student.enrollment_id}`} 
                          checked={localRecords[student.enrollment_id] === 'absent'}
                          onChange={() => handleStatusChange(student.enrollment_id, 'absent')}
                          className="w-4 h-4 text-destructive focus:ring-destructive border-gray-300 dark:border-slate-700 bg-transparent"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <input 
                          type="radio" 
                          name={`status-${student.enrollment_id}`} 
                          checked={localRecords[student.enrollment_id] === 'late'}
                          onChange={() => handleStatusChange(student.enrollment_id, 'late')}
                          className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300 dark:border-slate-700 bg-transparent"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {roster?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground py-4">No active enrollments found for this class.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>{t('cancel', 'Cancel')}</Button>
          <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || Object.keys(localRecords).length === 0}>
            {saveMutation.isPending ? t('saving', 'Saving...') : t('save_attendance', 'Save Attendance')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
