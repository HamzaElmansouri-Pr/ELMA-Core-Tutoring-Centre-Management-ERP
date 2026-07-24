import { useTranslation } from "react-i18next";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { type SchoolClass, createClass, updateClass } from "@/api/classes";
import { getSubjects } from "@/api/subjects";
import { getTeachers } from "@/api/teachers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const scheduleSchema = z.object({
  day: z.string().min(1, "Day is required"),
  start: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Invalid time"),
  end: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Invalid time"),
});

const classSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subject_id: z.number().min(1, "Subject is required"),
  teacher_id: z.number().min(1, "Teacher is required"),
  schedule_info: z.array(scheduleSchema).min(1, "At least one schedule is required"),
});

type ClassFormValues = z.infer<typeof classSchema>;

interface ClassFormDialogProps {
  schoolClass: SchoolClass | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export function ClassFormDialog({
  schoolClass,
  isOpen,
  onClose,
  onSuccess,
}: ClassFormDialogProps) {
  const { t, i18n } = useTranslation("common");

  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: getSubjects });
  const { data: teachers = [] } = useQuery({ queryKey: ["teachers"], queryFn: getTeachers });

  const {
    register,
    control,
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
      schedule_info: schoolClass?.schedule_info?.length
        ? schoolClass.schedule_info
        : [{ day: "monday", start: "14:00", end: "16:00" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "schedule_info",
  });

  const onSubmit = async (data: ClassFormValues) => {
    try {
      if (schoolClass) {
        await updateClass(schoolClass.id, data);
      } else {
        await createClass(data);
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    }
  };

  const translateDay = (day: string) => {
    const days: any = {
      monday: { en: "Monday", fr: "Lundi", ar: "الاثنين" },
      tuesday: { en: "Tuesday", fr: "Mardi", ar: "الثلاثاء" },
      wednesday: { en: "Wednesday", fr: "Mercredi", ar: "الأربعاء" },
      thursday: { en: "Thursday", fr: "Jeudi", ar: "الخميس" },
      friday: { en: "Friday", fr: "Vendredi", ar: "الجمعة" },
      saturday: { en: "Saturday", fr: "Samedi", ar: "السبت" },
      sunday: { en: "Sunday", fr: "Dimanche", ar: "الأحد" },
    };
    return days[day]?.[i18n.language.split('-')[0]] || day;
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
          <div>
            <label className="block text-sm font-medium mb-1">{t("name")}</label>
            <Input {...register("name")} />
            {errors.name && <span className="text-sm text-red-500">{errors.name.message}</span>}
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

          <div className="border rounded p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{t("schedule", "Schedule")}</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ day: "monday", start: "14:00", end: "16:00" })}>
                <Plus className="w-4 h-4 me-2" /> Add
              </Button>
            </div>
            {errors.schedule_info && !Array.isArray(errors.schedule_info) && (
              <span className="text-sm text-red-500">{errors.schedule_info.message}</span>
            )}
            
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <select
                  {...register(`schedule_info.${index}.day` as const)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {translateDay(d)}
                    </option>
                  ))}
                </select>

                <Input type="time" {...register(`schedule_info.${index}.start` as const)} />
                <Input type="time" {...register(`schedule_info.${index}.end` as const)} />

                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
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
