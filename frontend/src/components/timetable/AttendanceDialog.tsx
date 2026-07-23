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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('attendance_for', 'Attendance for')} {className} - {sessionDate}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={() => markAll('present')}>{t('mark_all_present', 'Mark All Present')}</Button>
            <Button variant="outline" size="sm" onClick={() => markAll('absent')}>{t('mark_all_absent', 'Mark All Absent')}</Button>
          </div>

          {isLoading ? (
            <div>Loading roster...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('student', 'Student')}</TableHead>
                  <TableHead className="text-center">{t('present', 'Present')}</TableHead>
                  <TableHead className="text-center">{t('absent', 'Absent')}</TableHead>
                  <TableHead className="text-center">{t('late', 'Late')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(roster || []).map((student) => (
                  <TableRow key={student.enrollment_id}>
                    <TableCell className="font-medium">{student.student_name}</TableCell>
                    <TableCell className="text-center">
                      <input 
                        type="radio" 
                        name={`status-${student.enrollment_id}`} 
                        checked={localRecords[student.enrollment_id] === 'present'}
                        onChange={() => handleStatusChange(student.enrollment_id, 'present')}
                        className="w-4 h-4 text-green-600"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <input 
                        type="radio" 
                        name={`status-${student.enrollment_id}`} 
                        checked={localRecords[student.enrollment_id] === 'absent'}
                        onChange={() => handleStatusChange(student.enrollment_id, 'absent')}
                        className="w-4 h-4 text-red-600"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <input 
                        type="radio" 
                        name={`status-${student.enrollment_id}`} 
                        checked={localRecords[student.enrollment_id] === 'late'}
                        onChange={() => handleStatusChange(student.enrollment_id, 'late')}
                        className="w-4 h-4 text-orange-600"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {roster?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-4">No active enrollments found for this class.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel', 'Cancel')}</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || Object.keys(localRecords).length === 0}>
            {saveMutation.isPending ? t('saving', 'Saving...') : t('save_attendance', 'Save Attendance')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
