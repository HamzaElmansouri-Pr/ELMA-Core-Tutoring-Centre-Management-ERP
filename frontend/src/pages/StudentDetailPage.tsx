import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation("common");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">
        {t("student_details", "Student Details")} - ID: {id}
      </h1>
      <div className="bg-white p-6 border rounded-md">
        <p className="text-gray-500">
          This is a placeholder for the student's 360-degree view (Enrollments, Invoices, Payments).
        </p>
      </div>
    </div>
  );
}
