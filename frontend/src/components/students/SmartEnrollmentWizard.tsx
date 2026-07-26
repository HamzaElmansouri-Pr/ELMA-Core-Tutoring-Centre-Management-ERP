import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Loader2, UserPlus } from "lucide-react";

import { type Student, getStudents, createStudent, bulkEnrollStudent } from "@/api/students";
import { getClasses, type SchoolClass } from "@/api/classes";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Zod schema for Student Creation
const studentSchema = z.object({
  first_name: z.string().min(1, "First Name is required"),
  last_name: z.string().min(1, "Last Name is required"),
  parent_phone: z.string().or(z.literal("")).transform(e => e === "" ? null : e).nullable(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface SmartEnrollmentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SmartEnrollmentWizard({ isOpen, onClose, onSuccess }: SmartEnrollmentWizardProps) {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();

  // Wizard State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);

  // Queries
  const { data: allStudents = [], isLoading: isSearching } = useQuery({
    queryKey: ["students"],
    queryFn: getStudents,
  });

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return allStudents.slice(0, 10);
    }
    const q = searchQuery.toLowerCase().trim();
    return allStudents.filter(s => 
      s.first_name?.toLowerCase().includes(q) ||
      s.last_name?.toLowerCase().includes(q) ||
      s.parent_phone?.toLowerCase().includes(q) ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      `${s.last_name} ${s.first_name}`.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [allStudents, searchQuery]);

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
  });

  // Forms
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      parent_phone: "",
    },
  });

  // Reset wizard on close
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSearchQuery("");
      setSelectedStudent(null);
      setSelectedClasses([]);
      reset();
    }
  }, [isOpen, reset]);

  // Mutations
  const enrollMutation = useMutation({
    mutationFn: async (data: StudentFormValues) => {
      let studentId = selectedStudent?.id;
      
      // Step A: If no student selected, create new student
      if (!studentId) {
        const newStudent = await createStudent(data as any);
        studentId = newStudent.id;
      }

      // Step B: Bulk Enroll in selected classes
      if (studentId && selectedClasses.length > 0) {
        await bulkEnrollStudent(studentId, selectedClasses);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      onSuccess();
    },
    onError: (error) => {
      console.error(error);
      alert("An error occurred during enrollment.");
    },
  });

  const handleSelectExisting = (student: Student) => {
    setSelectedStudent(student);
    reset({
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      parent_phone: student.parent_phone || '',
    });
    setStep(2);
  };

  const handleCreateNew = () => {
    setSelectedStudent(null);
    reset({ first_name: "", last_name: "", parent_phone: "" });
    setStep(2);
  };

  const toggleClass = (classId: number) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const onFinalSubmit = (data: StudentFormValues) => {
    enrollMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Step 1: Find or Create Student"}
            {step === 2 && "Step 2: Student Details"}
            {step === 3 && "Step 3: Select Classes (Re-inscription)"}
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1: SEARCH */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="border rounded-md max-h-64 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading students...
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {searchResults.map((student) => (
                    <li 
                      key={student.id} 
                      className="p-3 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center"
                      onClick={() => handleSelectExisting(student)}
                    >
                      <div>
                        <p className="font-medium">{`${student.first_name} ${student.last_name}`}</p>
                        <p className="text-sm text-gray-500">{student.parent_phone}</p>
                      </div>
                      <Button variant="ghost" size="sm">Select</Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  {searchQuery ? `No students matching "${searchQuery}"` : "No students in the database yet."}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-gray-500">Student not in system?</span>
              <Button onClick={handleCreateNew} variant="outline" className="gap-2">
                <UserPlus className="w-4 h-4" /> Create New Student
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: DETAILS */}
        {step === 2 && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <Input {...register("first_name")} disabled={!!selectedStudent} />
                {errors.first_name && <span className="text-sm text-red-500">{errors.first_name.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <Input {...register("last_name")} disabled={!!selectedStudent} />
                {errors.last_name && <span className="text-sm text-red-500">{errors.last_name.message}</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t("parent_phone")}</label>
              <Input type="tel" {...register("parent_phone")} disabled={!!selectedStudent} />
              {errors.parent_phone && <span className="text-sm text-red-500">{errors.parent_phone.message}</span>}
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button type="submit">Next: Select Classes</Button>
            </div>
          </form>
        )}

        {/* STEP 3: ENROLLMENT */}
        {step === 3 && (
          <form onSubmit={handleSubmit(onFinalSubmit)} className="space-y-4">
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {classes?.map((cls: SchoolClass) => (
                <label 
                  key={cls.id} 
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedClasses.includes(cls.id) ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                >
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedClasses.includes(cls.id)}
                    onChange={() => toggleClass(cls.id)}
                  />
                  <div>
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-xs text-gray-500">
                      {cls.subject?.name} • {cls.teacher?.name}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => setStep(2)}>Back</Button>
              <Button type="submit" disabled={enrollMutation.isPending}>
                {enrollMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {selectedClasses.length > 0 ? `Enroll in ${selectedClasses.length} Classes` : 'Save Student (No Classes)'}
              </Button>
            </div>
          </form>
        )}

      </DialogContent>
    </Dialog>
  );
}
