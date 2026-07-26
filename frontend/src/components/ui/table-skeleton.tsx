import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
  headers?: string[];
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ columns, rows = 6, headers }) => {
  // Deterministic widths for realistic shimmer look without random layout shifts
  const getCellWidthClass = (colIdx: number) => {
    if (colIdx === 0) return "w-16";
    if (colIdx === 1) return "w-36";
    if (colIdx === 2) return "w-28";
    if (colIdx % 2 === 0) return "w-24";
    return "w-32";
  };

  return (
    <div className="border rounded-md bg-white dark:bg-slate-900 overflow-hidden shadow-sm animate-pulse">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i}>
                {headers && headers[i] ? (
                  headers[i]
                ) : (
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <TableRow key={rowIdx}>
              {Array.from({ length: columns }).map((_, colIdx) => (
                <TableCell key={colIdx} className="py-4">
                  <div 
                    className={`h-4 bg-gray-100 dark:bg-gray-800 rounded ${getCellWidthClass(colIdx)}`}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
