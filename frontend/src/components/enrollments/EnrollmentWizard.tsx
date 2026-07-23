import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { getClasses } from "@/api/classes";
import { enrollStudent } from "@/api/enrollments";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDH } from "@/utils/currency";

interface EnrollmentWizardProps {
  studentId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EnrollmentWizard({ studentId, isOpen, onClose, onSuccess }: EnrollmentWizardProps) {
  const { t } = useTranslation("common");
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: classes = [] } = useQuery({ queryKey: ["classes"], queryFn: getClasses });

  const handleEnroll = async () => {
    if (!selectedClassId) return;
    setIsSubmitting(true);
    try {
      await enrollStudent(studentId, selectedClassId);
      onSuccess();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("enroll_student", "Enroll Student")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("select_class", "Select Class")}</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn("w-full justify-between", !selectedClassId && "text-muted-foreground")}
                >
                  {selectedClass ? selectedClass.name : "Search class..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search class..." />
                  <CommandEmpty>No class found.</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      {classes.map((c) => (
                        <CommandItem
                          value={c.name}
                          key={c.id}
                          onSelect={() => setSelectedClassId(c.id)}
                        >
                          <Check
                            className={cn("mr-2 h-4 w-4", c.id === selectedClassId ? "opacity-100" : "opacity-0")}
                          />
                          {c.name} - {c.subject?.name} ({formatDH(c.subject?.default_price_centimes || 0)})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {selectedClass && (
            <div className="bg-slate-50 p-3 rounded text-sm space-y-1 dark:bg-slate-800">
              <p><strong>Subject:</strong> {selectedClass.subject?.name}</p>
              <p><strong>Teacher:</strong> {selectedClass.teacher?.name}</p>
              <p><strong>Price:</strong> {formatDH(selectedClass.subject?.default_price_centimes || 0)} / month</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleEnroll} disabled={!selectedClassId || isSubmitting}>
            Confirm Enrollment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
