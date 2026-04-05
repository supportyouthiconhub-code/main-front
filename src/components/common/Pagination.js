import React from 'react';

/**
 * Smart numbered pagination with ellipsis.
 * Props:
 *   page        — current page (1-based)
 *   pages       — total pages
 *   total       — total record count (optional, for "Showing X–Y of Z")
 *   limit       — records per page (optional, for "Showing X–Y of Z")
 *   onChange    — (newPage) => void
 */
export default function Pagination({ page, pages, total, limit, onChange }) {
  if (!pages || pages <= 1) return null;

  // Build page list with ellipsis
  const getPageList = () => {
    const list = [];
    let start = Math.max(1, page - 2);
    let end   = Math.min(pages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);

    if (start > 1) { list.push(1); if (start > 2) list.push('…'); }
    for (let i = start; i <= end; i++) list.push(i);
    if (end < pages) { if (end < pages - 1) list.push('…'); list.push(pages); }
    return list;
  };

  const ChevronLeft = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
    </svg>
  );
  const ChevronRight = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
    </svg>
  );

  const from = total && limit ? ((page - 1) * limit) + 1 : null;
  const to   = total && limit ? Math.min(page * limit, total) : null;

  return (
    <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
      {/* Record count info */}
      <p className="text-xs text-gray-400">
        {from && to && total
          ? `Showing ${from}–${to} of ${total}`
          : `Page ${page} of ${pages}`}
      </p>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft />
        </button>

        {/* Numbered pages */}
        {getPageList().map((n, i) =>
          n === '…' ? (
            <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">
              …
            </span>
          ) : (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`w-8 h-8 text-xs font-semibold rounded-lg transition-colors ${
                n === page
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              {n}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onChange(Math.min(pages, page + 1))}
          disabled={page === pages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}