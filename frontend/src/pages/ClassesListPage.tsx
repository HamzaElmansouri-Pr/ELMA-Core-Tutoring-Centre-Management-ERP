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
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("subject.name", {
      id: "subject",
      header: t("sidebar_subjects", "Subjects"),
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor("teacher.name", {
      id: "teacher",
      header: t("sidebar_teachers", "Teachers"),
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor("enrollments_count", {
      header: t("students", "Students"),
      cell: (info) => info.getValue() ?? 0,
    }),
    columnHelper.accessor("price_centimes", {
      header: t("default_price", "Price"),
      cell: (info) => formatDH(info.getValue()),
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
  ], [t, classes]);

  const table = useReactTable({
    data: classes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold">{t("sidebar_classes", "Classes")}</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("search_classes", "Search classes, subject, teacher...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full bg-white dark:bg-slate-900"
            />
          </div>
          <Button onClick={handleAdd} className="shrink-0">
            <Plus className="w-4 h-4 me-2" />
            {t("add_class", "Add Class")}
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
                      <div className={`h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse ${cIdx === 0 ? 'w-32' : cIdx === 1 ? 'w-24' : cIdx === 2 ? 'w-36' : 'w-20'}`} />
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-lg font-medium">{t("no_data_found")}</p>
                    <p className="text-sm mt-1">{t("no_classes_yet")}</p>
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
