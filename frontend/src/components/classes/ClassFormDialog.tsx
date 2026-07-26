import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { type SchoolClass, createClass, updateClass } from "@/api/classes";
import { getSubjectsAll } from "@/api/subjects";
import { getTeachersAll } from "@/api/teachers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const classSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subject_id: z.number().min(1, "Subject is required"),
  teacher_id: z.number().min(1, "Teacher is required"),
  price_dh: z.number().min(0, "Price must be positive"),
});

type ClassFormValues = z.infer<typeof classSchema>;

interface ClassFormDialogProps {
  schoolClass: SchoolClass | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ClassFormDialog({
  schoolClass,
  isOpen,
  onClose,
  onSuccess,
}: ClassFormDialogProps) {
  const { t } = useTranslation("common");

  const { data: subjects = [] } = useQuery({ queryKey: ["subjectsAll"], queryFn: getSubjectsAll });
  const { data: teachers = [] } = useQuery({ queryKey: ["teachersAll"], queryFn: getTeachersAll });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: schoolClass?.name || "",
      subject_id: schoolClass?.subject_id || 0,
      teacher_id: schoolClass?.teacher_id || 0,
      price_dh: schoolClass ? schoolClass.price_centimes / 100 : 0,
    },
  });

  const onSubmit = async (data: ClassFormValues) => {
    try {
      const payload = {
        name: data.name,
        subject_id: data.subject_id,
        teacher_id: data.teacher_id,
        price_centimes: Math.round(data.price_dh * 100),
      };

      if (schoolClass) {
        await updateClass(schoolClass.id, payload as any);
      } else {
        await createClass(payload as any);
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {schoolClass ? t("edit_class", "Edit Class") : t("add_class", "Add Class")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("name")}</label>
              <Input {...register("name")} />
              {errors.name && <span className="text-sm text-red-500">{errors.name.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t("default_price")} (DA)</label>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("sidebar_subjects", "Subjects")}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between",
                      !watch("subject_id") && "text-muted-foreground"
                    )}
                  >
                    {watch("subject_id")
                      ? subjects.find((s) => s.id === watch("subject_id"))?.name
                      : "Select subject"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search subject..." />
                    <CommandEmpty>No subject found.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {subjects.map((subject) => (
                          <CommandItem
                            value={subject.name}
                            key={subject.id}
                            onSelect={() => setValue("subject_id", subject.id, { shouldValidate: true })}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                subject.id === watch("subject_id") ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {subject.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.subject_id && <span className="text-sm text-red-500">{errors.subject_id.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t("sidebar_teachers", "Teachers")}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between",
                      !watch("teacher_id") && "text-muted-foreground"
                    )}
                  >
                    {watch("teacher_id")
                      ? teachers.find((t) => t.id === watch("teacher_id"))?.name
                      : "Select teacher"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search teacher..." />
                    <CommandEmpty>No teacher found.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {teachers.map((teacher) => (
                          <CommandItem
                            value={teacher.name}
                            key={teacher.id}
                            onSelect={() => setValue("teacher_id", teacher.id, { shouldValidate: true })}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                teacher.id === watch("teacher_id") ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {teacher.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.teacher_id && <span className="text-sm text-red-500">{errors.teacher_id.message}</span>}
            </div>
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
