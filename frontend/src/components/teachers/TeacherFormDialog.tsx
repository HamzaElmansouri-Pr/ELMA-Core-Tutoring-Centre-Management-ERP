import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { type Teacher, createTeacher, updateTeacher } from "@/api/teachers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const teacherSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").or(z.literal("")).transform(e => e === "" ? null : e).nullable(),
  commission_percentage: z.number().min(0).max(100),
  is_active: z.boolean(),
});

type TeacherFormValues = z.infer<typeof teacherSchema>;

interface TeacherFormDialogProps {
  teacher: Teacher | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TeacherFormDialog({
  teacher,
  isOpen,
  onClose,
  onSuccess,
}: TeacherFormDialogProps) {
  const { t } = useTranslation("common");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      name: teacher?.name || "",
      email: teacher?.email || "",
      commission_percentage: teacher?.commission_percentage || 0,
      is_active: teacher?.is_active ?? true,
    },
  });

  const onSubmit = async (data: TeacherFormValues) => {
    try {
      if (teacher) {
        await updateTeacher(teacher.id, data as any);
      } else {
        await createTeacher(data as any);
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
            {teacher ? t("edit_teacher") : t("add_teacher")}
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
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input type="email" {...register("email")} />
            {errors.email && (
              <span className="text-sm text-red-500">{errors.email.message}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("commission")}
            </label>
            <Input
              type="number"
              step="0.01"
              {...register("commission_percentage", { valueAsNumber: true })}
            />
            {errors.commission_percentage && (
              <span className="text-sm text-red-500">
                {errors.commission_percentage.message}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" {...register("is_active")} />
            <label htmlFor="is_active" className="text-sm font-medium">
              {t("active")}
            </label>
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
