import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { type Student, createStudent, updateStudent } from "@/api/students";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const studentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  parent_phone: z.string().or(z.literal("")).transform(e => e === "" ? null : e).nullable(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormDialogProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StudentFormDialog({
  student,
  isOpen,
  onClose,
  onSuccess,
}: StudentFormDialogProps) {
  const { t } = useTranslation("common");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: student?.name || "",
      parent_phone: student?.parent_phone || "",
    },
  });

  const onSubmit = async (data: StudentFormValues) => {
    try {
      if (student) {
        await updateStudent(student.id, data as any);
      } else {
        await createStudent(data as any);
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {student ? t("edit_student") : t("add_student")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("name")}</label>
            <Input {...register("name")} />
            {errors.name && (
              <span className="text-sm text-red-500">{errors.name.message}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("parent_phone")}</label>
            <Input type="tel" {...register("parent_phone")} />
            {errors.parent_phone && (
              <span className="text-sm text-red-500">{errors.parent_phone.message}</span>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
