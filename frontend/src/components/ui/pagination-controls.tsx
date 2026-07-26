import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

interface PaginationControlsProps {
  meta?: PaginationMeta | null;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  isLoading?: boolean;
}

export function PaginationControls({
  meta,
  onPageChange,
  onPerPageChange,
  isLoading = false,
}: PaginationControlsProps) {
  const { t } = useTranslation("common");

  if (!meta || meta.total === 0) {
    return null;
  }

  const { current_page, last_page, from, to, total, per_page } = meta;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-slate-800">
      <div className="flex items-center gap-2">
        <span>
          {t("showing", "Showing")} <span className="font-semibold">{from || 0}</span> {t("to", "to")}{" "}
          <span className="font-semibold">{to || 0}</span> {t("of", "of")}{" "}
          <span className="font-semibold">{total}</span> {t("entries", "entries")}
        </span>
        {onPerPageChange && (
          <div className="flex items-center gap-1 ms-4">
            <span className="text-xs text-gray-500">{t("per_page", "Per page")}:</span>
            <select
              value={per_page}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              disabled={isLoading}
              className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={current_page <= 1 || isLoading}
          title={t("first_page", "First Page")}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page <= 1 || isLoading}
          title={t("prev_page", "Previous Page")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="px-3 py-1 font-medium text-xs sm:text-sm bg-gray-100 dark:bg-slate-800 rounded">
          {t("page", "Page")} {current_page} {t("of", "of")} {last_page || 1}
        </span>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(current_page + 1)}
          disabled={current_page >= last_page || isLoading}
          title={t("next_page", "Next Page")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(last_page)}
          disabled={current_page >= last_page || isLoading}
          title={t("last_page", "Last Page")}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
