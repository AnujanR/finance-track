import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'

interface TablePaginationProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function TablePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: TablePaginationProps) {
  if (totalItems === 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-sm text-slate-500">
        Showing {start}–{end} of {totalItems}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <span className="text-sm text-slate-600">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  )
}
