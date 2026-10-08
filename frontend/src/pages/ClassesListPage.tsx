import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { getClassesPaginated, type SchoolClass, deleteClass } from "@/api/classes";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ClassFormDialog } from "@/components/classes/ClassFormDialog";
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
import { formatDH } from "@/utils/currency";

const columnHelper = createColumnHelper<SchoolClass>();

export function ClassesListPage() {
  const { t } = useTranslation("common");
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
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
    queryKey: ["classesPaginated", page, perPage, debouncedSearch],
    queryFn: () => getClassesPaginated({ page, per_page: perPage, search: debouncedSearch }),
    placeholderData: keepPreviousData,
  });

  const classes = response?.data || [];
  const meta = response?.meta || null;

  const handleEdit = (schoolClass: SchoolClass) => {
    setSelectedClass(schoolClass);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm(t("delete_class", "Delete Class") + "?")) {
      await deleteClass(id);
      refetch();
    }
  };

  const handleAdd = () => {
    setSelectedClass(null);
    setIsDialogOpen(true);
  };

  const columns = useMemo(() => [
    columnHelper.accessor("name", {
      header: t("name"),
      cell: (info) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-sm border border-primary/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 5v17"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/></svg>
          </div>
          <div className="font-semibold text-foreground">
            {info.getValue()}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("subject.name", {
      id: "subject",
      header: t("sidebar_subjects", "Subjects"),
      cell: (info) => <span className="font-medium text-muted-foreground">{info.getValue() || "-"}</span>,
    }),
    columnHelper.accessor("teacher.name", {
      id: "teacher",
      header: t("sidebar_teachers", "Teachers"),
      cell: (info) => <span className="text-foreground">{info.getValue() || "-"}</span>,
    }),
    columnHelper.accessor("enrollments_count", {
      header: t("students", "Students"),
      cell: (info) => {
        const val = info.getValue() ?? 0;
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${val > 0 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
            {val} Enrolled
          </span>
        );
      },
    }),
    columnHelper.accessor("price_centimes", {
      header: t("default_price", "Price"),
      cell: (info) => (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatDH(info.getValue())}</span>
      ),
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
  ], [t, classes]);

  const table = useReactTable({
    data: classes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("sidebar_classes", "Classes Management")}</h1>
          <p className="text-sm text-muted-foreground mt-1">View, search, and manage all academic classes</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={t("search_classes", "Search classes, subject, teacher...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 w-full bg-background border-border focus-visible:ring-primary rounded-full shadow-sm"
            />
          </div>
          <Button onClick={handleAdd} className="shrink-0 h-10 rounded-full px-5 shadow-sm font-medium">
            <Plus className="w-4 h-4 me-2" />
            {t("add_class", "Add Class")}
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
        <ClassFormDialog
          schoolClass={selectedClass}
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
