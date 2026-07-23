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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/students"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="text-2xl font-semibold">
            {student.first_name} {student.last_name}
          </h1>
        </div>
        <Button onClick={() => setIsWizardOpen(true)}>
          <Plus className="w-4 h-4 me-2" />
          {t("enroll_student", "Enroll in Class")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 border rounded-md dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Student Info</h2>
          <p><strong>DOB:</strong> {student.date_of_birth}</p>
          <p><strong>Parent Phone:</strong> {student.parent_phone}</p>
        </div>
      </div>

      <div className="bg-white p-6 border rounded-md dark:bg-slate-900">
        <h2 className="text-lg font-semibold mb-4">Enrollments</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(student.active_enrollments || []).map((enrollment: any) => (
              <TableRow key={enrollment.id}>
                <TableCell>{enrollment.school_class?.name}</TableCell>
                <TableCell>{enrollment.school_class?.subject?.name}</TableCell>
                <TableCell>{enrollment.school_class?.teacher?.name}</TableCell>
                <TableCell>{formatDH(enrollment.school_class?.subject?.default_price_centimes || 0)}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" title="End Enrollment" onClick={() => handleEndEnrollment(enrollment.id)}>
                      <StopCircle className="w-4 h-4 text-orange-500" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Delete Enrollment (Mistake)" onClick={() => handleDeleteEnrollment(enrollment.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(student.ended_enrollments || []).map((enrollment: any) => (
              <TableRow key={enrollment.id} className="opacity-60">
                <TableCell>{enrollment.school_class?.name}</TableCell>
                <TableCell>{enrollment.school_class?.subject?.name}</TableCell>
                <TableCell>{enrollment.school_class?.teacher?.name}</TableCell>
                <TableCell>{formatDH(enrollment.school_class?.subject?.default_price_centimes || 0)}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Ended</span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" title="Delete Enrollment (Mistake)" onClick={() => handleDeleteEnrollment(enrollment.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!(student.active_enrollments?.length) && !(student.ended_enrollments?.length) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">No enrollments found.</TableCell>
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
