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
      cell: (info) => {
        const name = info.getValue() as string;
        const parts = name.split(' ');
        const initials = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs tracking-wider shadow-sm border border-primary/20">
              {initials.toUpperCase() || 'T'}
            </div>
            <div className="font-semibold text-foreground">
              {name}
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("commission_percentage", {
      header: t("commission"),
      cell: (info) => (
        <span className="font-medium text-muted-foreground">{info.getValue()}%</span>
      ),
    }),
    columnHelper.accessor("is_active", {
      header: t("status"),
      cell: (info) => {
        const val = info.getValue();
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${val ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
            {val ? t("active", "Active") : t("inactive", "Inactive")}
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
  ], [t, teachers]);

  const table = useReactTable({
    data: teachers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("sidebar_teachers", "Teachers Management")}</h1>
          <p className="text-sm text-muted-foreground mt-1">View, search, and manage all your professors</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={t("search_teachers", "Search by name...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 w-full bg-background border-border focus-visible:ring-primary rounded-full shadow-sm"
            />
          </div>
          <Button onClick={handleAdd} className="shrink-0 h-10 rounded-full px-5 shadow-sm font-medium">
            <Plus className="w-4 h-4 me-2" />
            {t("add_teacher")}
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
                    <p className="text-lg font-semibold text-foreground">{t("no_data_found", "No data found")}</p>
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
