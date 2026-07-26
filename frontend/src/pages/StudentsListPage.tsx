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
      cell: (info) => (
        <Link to={`/students/${info.row.original.id}`} className="text-blue-600 hover:underline">
          {info.getValue()}
        </Link>
      ),
    }),
    columnHelper.accessor("parent_phone", {
      header: t("parent_phone"),
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor("active_enrollments_count", {
      header: t("active_enrollments"),
      cell: (info) => info.getValue() || 0,
    }),
    columnHelper.accessor("unpaid_invoices_count", {
      header: t("unpaid_invoices"),
      cell: (info) => info.getValue() || 0,
    }),
    columnHelper.display({
      id: "actions",
      header: t("actions"),
      cell: (info) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(info.row.original)}>
            <Edit className="w-4 h-4 text-blue-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(info.row.original.id)}>
            <Trash2 className="w-4 h-4 text-red-500" />
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
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold">{t("sidebar_students", "Students")}</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("search_students", "Search students...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full bg-white dark:bg-slate-900"
            />
          </div>
          <Button onClick={handleAdd} className="shrink-0">
            <Plus className="w-4 h-4 me-2" />
            {t("add_student")}
          </Button>
        </div>
      </div>

      <div className="border rounded-md bg-white dark:bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
              Array.from({ length: 8 }).map((_, idx) => (
                <TableRow key={idx}>
                  {Array.from({ length: columns.length }).map((_, cIdx) => (
                    <TableCell key={cIdx} className="py-4">
                      <div className={`h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse ${cIdx === 0 ? 'w-36' : cIdx === 1 ? 'w-28' : 'w-20'}`} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p className="text-lg font-medium">{t("no_data_found")}</p>
                    <p className="text-sm mt-1">{t("no_students_yet")}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
