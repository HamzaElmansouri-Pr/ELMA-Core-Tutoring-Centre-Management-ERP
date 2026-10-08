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
    <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden animate-pulse">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="border-border">
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i} className="h-12 font-semibold text-muted-foreground">
                {headers && headers[i] ? (
                  headers[i]
                ) : (
                  <div className="h-4 w-20 bg-muted rounded" />
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <TableRow key={rowIdx} className="border-border">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <TableCell key={colIdx} className="py-4">
                  <div 
                    className={`h-4 bg-muted/60 rounded ${getCellWidthClass(colIdx)}`}
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
