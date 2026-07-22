import React from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

/**
 * Reusable DataTable Component supporting pagination, search, custom column rendering, and sorting.
 */
export default function DataTable({
  columns,
  data = [],
  pagination = {},
  onPageChange,
  onSearch,
  searchValue = '',
  loading = false,
  emptyMessage = 'No records found.',
}) {
  const { currentPage = 1, totalPages = 1, totalCount = 0, limit = 10 } = pagination;

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
      {/* Table Top Header Bar with Search */}
      {onSearch && (
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search records..."
              className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl py-2 pl-9 pr-4 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Total Results: <span className="text-slate-200 font-semibold">{totalCount}</span>
          </div>
        </div>
      )}

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              {columns.map((col, index) => (
                <th key={index} className="py-3.5 px-4 font-semibold">
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && <ArrowUpDown className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/50 text-sm">
            {loading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="py-4 px-4">
                      <div className="h-4 bg-slate-800/80 rounded w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-500 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => (
                <tr
                  key={row.id || rIdx}
                  className="hover:bg-slate-800/30 transition-colors group text-slate-300"
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="py-3.5 px-4 text-xs font-medium">
                      {col.render ? col.render(row) : row[col.accessorKey]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing Page <span className="text-slate-200 font-semibold">{currentPage}</span> of{' '}
            <span className="text-slate-200 font-semibold">{totalPages}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-slate-900 rounded-lg text-slate-200 border border-slate-800 font-semibold">
              {currentPage}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
