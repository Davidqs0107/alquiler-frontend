import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  total: number;
  limit: number | null;
  offset: number | null;
  onPageChange: (offset: number) => void;
}

export function Pagination({ total, limit, offset, onPageChange }: PaginationProps) {
  const currentPage = offset ? Math.floor(offset / (limit || total)) + 1 : 1;
  const totalPages = limit ? Math.ceil(total / limit) : 1;
  const hasNext = offset !== null && (offset + (limit || total)) < total;
  const hasPrev = offset !== null && offset > 0;

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between py-3 border-t border-[var(--border-subtle)]">
      <div className="text-sm text-[var(--ink-tertiary)]">
        Mostrando {offset ? offset + 1 : 1} - {Math.min((offset || 0) + (limit || total), total)} de {total}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(0, (offset || 0) - (limit || total)))}
          disabled={!hasPrev}
          className="p-1.5 rounded hover:bg-[var(--surface-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm text-[var(--ink-secondary)]">
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() => onPageChange((offset || 0) + (limit || total))}
          disabled={!hasNext}
          className="p-1.5 rounded hover:bg-[var(--surface-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface SimplePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function SimplePagination({ page, totalPages, onPageChange }: SimplePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-3">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-1.5 rounded hover:bg-[var(--surface-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm text-[var(--ink-secondary)]">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="p-1.5 rounded hover:bg-[var(--surface-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Siguiente"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}