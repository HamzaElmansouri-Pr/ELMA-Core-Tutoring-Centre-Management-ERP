import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { getTeachersPaginated, type Teacher, deleteTeacher } from "@/api/teachers";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { TeacherFormDialog } from "@/components/teachers/TeacherFormDialog";
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

const columnHelper = createColumnHelper<Teacher>();

export function TeachersListPage() {
  const { t } = useTranslation("common");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
    queryKey: ["teachersPaginated", page, perPage, debouncedSearch],
    queryFn: () => getTeachersPaginated({ page, per_page: perPage, search: debouncedSearch }),
    placeholderData: keepPreviousData,
  });

  const teachers = response?.data || [];
  const meta = response?.meta || null;

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm(t("delete_teacher") + "?")) {
      await deleteTeacher(id);
      refetch();
    }
  };

  const handleAdd = () => {
    setSelectedTeacher(null);
    setIsDialogOpen(true);
  };

  const columns = useMemo(() => [
    columnHelper.accessor("name", {
      header: t("name"),
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("commission_percentage", {
      header: t("commission"),
      cell: (info) => info.getValue() + "%",
    }),
    columnHelper.accessor("is_active", {
      header: t("status"),
      cell: (info) => (info.getValue() ? t("active") : t("inactive")),
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
  ], [t, teachers]);

  const table = useReactTable({
    data: teachers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold">{t("sidebar_teachers", "Teachers")}</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("search_teachers", "Search teachers...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full bg-white dark:bg-slate-900"
            />
          </div>
          <Button onClick={handleAdd} className="shrink-0">
            <Plus className="w-4 h-4 me-2" />
            {t("add_teacher")}
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
                      <div className={`h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse ${cIdx === 0 ? 'w-36' : cIdx === 1 ? 'w-20' : 'w-24'}`} />
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
                <TableCell colSpan={columns.length} className="text-center py-10">
                  No data found
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

      {isDialogOpen && (
        <TeacherFormDialog
          teacher={selectedTeacher}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSuccess={() => {
            setIsDialogOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
