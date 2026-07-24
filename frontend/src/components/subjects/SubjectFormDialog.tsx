import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { type Subject, createSubject, updateSubject } from "@/api/subjects";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toCentimes, fromCentimes } from "@/utils/currency";

const subjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().or(z.literal("")).transform(e => e === "" ? null : e).nullable(),
  price_dh: z.number().min(0, "Price must be positive"),
});

type SubjectFormValues = z.infer<typeof subjectSchema>;

interface SubjectFormDialogProps {
  subject: Subject | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SubjectFormDialog({
  subject,
  isOpen,
  onClose,
  onSuccess,
}: SubjectFormDialogProps) {
  const { t } = useTranslation("common");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: subject?.name || "",
      description: subject?.description || "",
      price_dh: subject ? fromCentimes(subject.default_price_centimes) : 0,
    },
  });

  const onSubmit = async (data: SubjectFormValues) => {
    try {
      const payload = {
        name: data.name,
        description: data.description,
        default_price_centimes: toCentimes(data.price_dh),
      };

      if (subject) {
        await updateSubject(subject.id, payload as any);
      } else {
        await createSubject(payload as any);
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
            {subject ? t("edit_subject") : t("add_subject")}
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
            <label className="block text-sm font-medium mb-1">{t("description")}</label>
            <Input {...register("description")} />
            {errors.description && (
              <span className="text-sm text-red-500">{errors.description.message}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("default_price")} (DH)</label>
            <Input
              type="number"
              step="0.01"
              {...register("price_dh", { valueAsNumber: true })}
            />
            {errors.price_dh && (
              <span className="text-sm text-red-500">
                {errors.price_dh.message}
              </span>
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
