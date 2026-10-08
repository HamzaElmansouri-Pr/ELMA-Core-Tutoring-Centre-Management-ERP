import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { getStudentsPaginated, type Student, deleteStudent } from "@/api/students";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { StudentFormDialog } from "@/components/students/StudentFormDialog";
import { SmartEnrollmentWizard } from "@/components/students/SmartEnrollmentWizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";

const columnHelper = createColumnHelper<Student>();

export function StudentsListPage() {
  const { t } = useTranslation("common");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: response, refetch, isLoading } = useQuery({
    queryKey: ["studentsPaginated", page, perPage, debouncedSearch],
    queryFn: () => getStudentsPaginated({ page, per_page: perPage, search: debouncedSearch }),
    placeholderData: keepPreviousData,
  });

  const students = response?.data || [];
  const meta = response?.meta || null;

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm(t("delete_student") + "?")) {
      await deleteStudent(id);
      refetch();
    }
  };

  const handleAdd = () => {
    setIsWizardOpen(true);
  };

  const columns = useMemo(() => [
    columnHelper.accessor((row) => `${row.first_name} ${row.last_name}`, {
      id: "name",
      header: t("name"),
      cell: (info) => {
        const student = info.row.original;
        const initials = `${student.first_name.charAt(0)}${student.last_name.charAt(0)}`.toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs tracking-wider shadow-sm border border-primary/20">
              {initials}
            </div>
            <div className="flex flex-col">
              <Link to={`/students/${student.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                {info.getValue()}
              </Link>
              <span className="text-xs text-muted-foreground">{student.parent_phone || 'No phone'}</span>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("active_enrollments_count", {
      header: t("active_enrollments"),
      cell: (info) => {
        const val = info.getValue() || 0;
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${val > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
            {val} Active
          </span>
        );
      },
    }),
    columnHelper.accessor("unpaid_invoices_count", {
      header: t("unpaid_invoices"),
      cell: (info) => {
        const val = info.getValue() || 0;
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${val > 0 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
            {val} Unpaid
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: () => <div className="text-right">{t("actions")}</div>,
      cell: (info) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => handleEdit(info.row.original)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => handleDelete(info.row.original.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    }),
  ], [t, students]);

  const table = useReactTable({
    data: students,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("sidebar_students", "Students Management")}</h1>
          <p className="text-sm text-muted-foreground mt-1">View, search, and manage all your students</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={t("search_students", "Search by name or phone...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 w-full bg-background border-border focus-visible:ring-primary rounded-full shadow-sm"
            />
          </div>
          <Button onClick={handleAdd} className="shrink-0 h-10 rounded-full px-5 shadow-sm font-medium">
            <Plus className="w-4 h-4 me-2" />
            {t("add_student")}
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-border">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-12 font-semibold text-muted-foreground">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx} className="border-border">
                  {Array.from({ length: columns.length }).map((_, cIdx) => (
                    <TableCell key={cIdx} className="py-5">
                      <div className={`h-5 bg-muted rounded animate-pulse ${cIdx === 0 ? 'w-48' : cIdx === 1 ? 'w-24' : 'w-20'}`} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30 transition-colors border-border group">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-lg font-semibold text-foreground">{t("no_data_found")}</p>
                    <p className="text-sm mt-1">Try adjusting your search query.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {/* Pagination Footer */}
        <div className="border-t border-border bg-muted/20 px-4 py-3">
          <PaginationControls
            meta={meta}
            onPageChange={(newPage) => setPage(newPage)}
            onPerPageChange={(newPerPage) => {
              setPerPage(newPerPage);
              setPage(1);
            }}
            isLoading={isLoading}
          />
        </div>
      </div>

      {isEditDialogOpen && (
        <StudentFormDialog
          student={selectedStudent}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSuccess={() => {
            setIsEditDialogOpen(false);
            refetch();
          }}
        />
      )}

      {isWizardOpen && (
        <SmartEnrollmentWizard
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
