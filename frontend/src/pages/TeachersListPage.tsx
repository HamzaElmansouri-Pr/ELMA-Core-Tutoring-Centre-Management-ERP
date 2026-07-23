import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { getTeachers, Teacher, deleteTeacher } from "@/api/teachers";
import { TeacherFormDialog } from "@/components/teachers/TeacherFormDialog";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
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

  const { data: teachers = [], refetch, isLoading } = useQuery({
    queryKey: ["teachers"],
    queryFn: getTeachers,
  });

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

  const columns = [
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
  ];

  const table = useReactTable({
    data: teachers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{t("sidebar_teachers", "Teachers")}</h1>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 me-2" />
          {t("add_teacher")}
        </Button>
      </div>

      <div className="border rounded-md bg-white overflow-hidden">
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
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-10">
                  Loading...
                </TableCell>
              </TableRow>
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
