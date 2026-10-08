import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { getStudent } from "@/api/students";
import { endEnrollment, deleteEnrollment } from "@/api/enrollments";
import { EnrollmentWizard } from "@/components/enrollments/EnrollmentWizard";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, StopCircle, ArrowLeft } from "lucide-react";
import { formatDH } from "@/utils/currency";

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation("common");
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const { data: student, refetch, isLoading } = useQuery({
    queryKey: ["student", id],
    queryFn: () => getStudent(Number(id)),
  });

  const handleEndEnrollment = async (enrollmentId: number) => {
    if (confirm("End this enrollment?")) {
      await endEnrollment(enrollmentId);
      refetch();
    }
  };

  const handleDeleteEnrollment = async (enrollmentId: number) => {
    if (confirm("Soft delete this enrollment? This is for admin mistakes only.")) {
      await deleteEnrollment(enrollmentId);
      refetch();
    }
  };

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!student) return <div className="p-6">Student not found.</div>;

  const initials = student ? `${student.first_name.charAt(0)}${student.last_name.charAt(0)}`.toUpperCase() : "?";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors rounded-full shrink-0" asChild>
            <Link to="/students"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg tracking-wider border border-primary/20 shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {student.first_name} {student.last_name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Manage student details and class enrollments.</p>
            </div>
          </div>
        </div>
        <Button onClick={() => setIsWizardOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-medium shadow-sm transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          {t("enroll_student", "Enroll in Class")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card p-6 border border-border rounded-2xl shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Student Info</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">Date of Birth:</span>
              <span className="text-foreground font-semibold">{student.date_of_birth}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">Parent Phone:</span>
              <span className="text-foreground font-semibold">{student.parent_phone}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/20">
          <h2 className="text-lg font-semibold text-foreground">Enrollments</h2>
        </div>
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="h-12 font-semibold text-muted-foreground">Class</TableHead>
              <TableHead className="h-12 font-semibold text-muted-foreground">Subject</TableHead>
              <TableHead className="h-12 font-semibold text-muted-foreground">Teacher</TableHead>
              <TableHead className="h-12 font-semibold text-muted-foreground text-right">Price</TableHead>
              <TableHead className="h-12 font-semibold text-muted-foreground">Status</TableHead>
              <TableHead className="h-12 font-semibold text-muted-foreground text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(student.active_enrollments || []).map((enrollment: any) => (
              <TableRow key={enrollment.id} className="hover:bg-muted/30 transition-colors border-border group">
                <TableCell className="font-medium text-foreground">{enrollment.school_class?.name}</TableCell>
                <TableCell className="text-muted-foreground">{enrollment.school_class?.subject?.name}</TableCell>
                <TableCell className="text-muted-foreground">{enrollment.school_class?.teacher?.name}</TableCell>
                <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">{formatDH(enrollment.school_class?.subject?.default_price_centimes || 0)}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Active</span>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="sm" className="hover:bg-orange-100 hover:text-orange-600 text-muted-foreground transition-colors" title="End Enrollment" onClick={() => handleEndEnrollment(enrollment.id)}>
                      <StopCircle className="w-4 h-4 mr-2 text-orange-500" /> End
                    </Button>
                    <Button variant="ghost" size="sm" className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors" title="Delete Enrollment (Mistake)" onClick={() => handleDeleteEnrollment(enrollment.id)}>
                      <Trash2 className="w-4 h-4 mr-2 text-destructive" /> Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(student.ended_enrollments || []).map((enrollment: any) => (
              <TableRow key={enrollment.id} className="hover:bg-muted/30 transition-colors border-border group opacity-60">
                <TableCell className="font-medium text-foreground">{enrollment.school_class?.name}</TableCell>
                <TableCell className="text-muted-foreground">{enrollment.school_class?.subject?.name}</TableCell>
                <TableCell className="text-muted-foreground">{enrollment.school_class?.teacher?.name}</TableCell>
                <TableCell className="text-right font-medium text-muted-foreground">{formatDH(enrollment.school_class?.subject?.default_price_centimes || 0)}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Ended</span>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="sm" className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors" title="Delete Enrollment (Mistake)" onClick={() => handleDeleteEnrollment(enrollment.id)}>
                      <Trash2 className="w-4 h-4 mr-2 text-destructive" /> Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!(student.active_enrollments?.length) && !(student.ended_enrollments?.length) && (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <StopCircle className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-lg font-semibold text-foreground">No enrollments found.</p>
                    <p className="text-sm mt-1">Enroll the student in a class to get started.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {isWizardOpen && (
        <EnrollmentWizard
          studentId={Number(id)}
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onSuccess={() => {
            setIsWizardOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
