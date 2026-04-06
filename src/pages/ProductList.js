import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchProducts, setFilters, resetFilters } from '../redux/slices/productSlice';
import ProductCard from '../components/product/ProductCard';
import { GridSkeleton } from '../components/common/Skeletons';

const SORTS = [
  { v: 'newest',     l: 'Newest First' },
  { v: 'price_asc',  l: 'Price: Low to High' },
  { v: 'price_desc', l: 'Price: High to Low' },
  { v: 'popular',    l: 'Most Popular' },
];

const XIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" clipRule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
  </svg>
);

/* ── Flatten category tree recursively ───────────────── */
function flattenCats(list, level = 0) {
  const out = [];
  (list || []).forEach(c => {
    out.push({ ...c, level });
    if (c.children?.length) {
      out.push(...flattenCats(c.children, level + 1));
    }
  });
  return out;
}

/* ── Filter Sidebar ───────────────────────────────────── */
function FilterPanel({ filters, onChange, onReset, categories, onClose }) {
  const [minP, setMinP] = useState(filters.minPrice || '');
  const [maxP, setMaxP] = useState(filters.maxPrice || '');

  // Keep price inputs in sync with external filter changes (e.g. clear all)
  useEffect(() => { setMinP(filters.minPrice || ''); }, [filters.minPrice]);
  useEffect(() => { setMaxP(filters.maxPrice || ''); }, [filters.maxPrice]);

  const flatCats = flattenCats(categories);

  const applyPrice = () => onChange({ minPrice: minP, maxPrice: maxP });
  const clearAll   = () => { setMinP(''); setMaxP(''); onReset(); };

  return (
    <div className="space-y-6">

      {/* Sort */}
  

      <div className="border-t border-gray-100" />

      {/* Categories */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Category</h3>
        <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1">
          {/* All */}
          <button
            onClick={() => onChange({ category: '' })}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center justify-between ${
              !filters.category
                ? 'bg-orange-50 text-orange-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}>
            <span>All Categories</span>
            {!filters.category && (
              <svg className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            )}
          </button>

          {flatCats.length === 0 && (
            <p className="text-xs text-gray-400 px-3 py-2">No categories available</p>
          )}

          {flatCats.map(c => {
            const isSelected = filters.category === c.slug;
            return (
              <button key={c._id}
                onClick={() => onChange({ category: isSelected ? '' : c.slug })}
                className={`w-full text-left rounded-xl text-sm transition-colors flex items-center justify-between gap-1 ${
                  isSelected
                    ? 'bg-orange-50 text-orange-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                style={{ paddingLeft: `${12 + c.level * 14}px`, paddingRight: 12, paddingTop: 8, paddingBottom: 8 }}
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  {c.level > 0 && (
                    <span className="text-gray-300 text-xs flex-shrink-0">└</span>
                  )}
                  <span className="truncate">{c.name}</span>
                </span>
                {isSelected && (
                  <svg className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-100" />

          <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Sort By</h3>
        <div className="space-y-0.5">
          {SORTS.map(s => (
            <button key={s.v}
              onClick={() => onChange({ sort: s.v })}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center justify-between ${
                filters.sort === s.v
                  ? 'bg-orange-50 text-orange-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
              <span>{s.l}</span>
              {filters.sort === s.v && (
                <svg className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Price Range</h3>
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">₹</span>
            <input type="number" placeholder="Min" value={minP}
              onChange={e => setMinP(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyPrice()}
              className="input pl-7 py-2 text-sm" min="0"/>
          </div>
          <span className="text-gray-300 font-medium">—</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">₹</span>
            <input type="number" placeholder="Max" value={maxP}
              onChange={e => setMaxP(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyPrice()}
              className="input pl-7 py-2 text-sm" min="0"/>
          </div>
        </div>
        <button onClick={applyPrice} className="btn-primary w-full py-2 text-sm">
          Apply Price Filter
        </button>
            {/* <div className="border-t border-gray-100" /> */}
          <button onClick={clearAll} className="btn-secondary w-full mt-2 py-2 text-sm">
        Clear All Filters
      </button>
      </div>

  

      {/* Clear all */}
    
    </div>
  );
}

/* ── Active filter pill ───────────────────────────────── */
function FilterChip({ label, color, onRemove }) {
  const styles = {
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    blue:   'bg-blue-50   text-blue-700   border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    gray:   'bg-gray-100  text-gray-700   border-gray-200',
  };
  return (
    <button
      onClick={onRemove}
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors hover:opacity-80 ${styles[color] || styles.gray}`}>
      {label}
      <XIcon />
    </button>
  );
}

/* ── Main Page ────────────────────────────────────────── */
export default function ProductList() {
  const dispatch    = useDispatch();
  const [sp, setSp] = useSearchParams();
  const { items, loading, pagination, filters, categories } = useSelector(s => s.products);
  const [page,       setPage]       = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);

  // Sync URL → Redux filters
  useEffect(() => {
    const p = Object.fromEntries(sp.entries());
    dispatch(setFilters({
      category: p.category || '',
      minPrice: p.minPrice || '',
      maxPrice: p.maxPrice || '',
      sort:     p.sort     || 'newest',
      search:   p.search   || '',
      featured: p.featured || '',
    }));
    setPage(1);
  }, [sp]); // eslint-disable-line

  // Fetch on filter / page change
  useEffect(() => {
    const q = { ...filters, page };
    Object.keys(q).forEach(k => { if (!q[k]) delete q[k]; });
    dispatch(fetchProducts(q));
  }, [filters, page, dispatch]);

  // Write a filter change back to URL (merges with existing)
  const onChange = useCallback((newF) => {
    const merged = { ...filters, ...newF };
    const p = {};
    Object.entries(merged).forEach(([k, v]) => { if (v) p[k] = v; });
    setSp(p);
    setPage(1);
  }, [filters, setSp]);

  const onReset = useCallback(() => {
    dispatch(resetFilters());
    setSp({});
    setPage(1);
  }, [dispatch, setSp]);

  // ── Active filter chips ──────────────────────────────
  const chips = [];
  if (filters.search) {
    chips.push({ id: 'search', label: `"${filters.search}"`, color: 'gray',   remove: () => onChange({ search: '' }) });
  }
  if (filters.category) {
    const flatCats = flattenCats(categories);
    const catName  = flatCats.find(c => c.slug === filters.category)?.name || filters.category.replace(/-/g, ' ');
    chips.push({ id: 'category', label: catName, color: 'orange', remove: () => onChange({ category: '' }) });
  }
  if (filters.minPrice || filters.maxPrice) {
    const label = `₹${filters.minPrice || '0'} — ₹${filters.maxPrice || '∞'}`;
    chips.push({ id: 'price', label, color: 'blue', remove: () => onChange({ minPrice: '', maxPrice: '' }) });
  }
  if (filters.sort && filters.sort !== 'newest') {
    const sortLabel = SORTS.find(s => s.v === filters.sort)?.l || filters.sort;
    chips.push({ id: 'sort', label: sortLabel, color: 'purple', remove: () => onChange({ sort: 'newest' }) });
  }

  // Page title
  const pageTitle = filters.search
    ? `Results for "${filters.search}"`
    : filters.category
    ? (() => {
        const flatCats = flattenCats(categories);
        return flatCats.find(c => c.slug === filters.category)?.name
          || filters.category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      })()
    : 'All Products';

  return (
    <>
      <Helmet><title>{pageTitle} – Youth Icon Hub</title></Helmet>

      <div className="page py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-orange-600 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium truncate">{pageTitle}</span>
        </nav>

        {/* Header row */}
        <div className="flex items-center justify-between mb-5 gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900">{pageTitle}</h1>
            {pagination && (
              <p className="text-sm text-gray-400 mt-1">
                {pagination.total} product{pagination.total !== 1 ? 's' : ''}
                {page > 1 ? ` · page ${page} of ${pagination.pages}` : ''}
              </p>
            )}
          </div>

          {/* Mobile filter button */}
          <button onClick={() => setFilterOpen(true)}
            className="lg:hidden btn-secondary text-sm gap-2 relative flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
            </svg>
            Filters
            {chips.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {chips.length}
              </span>
            )}
          </button>
        </div>

        {/* Active filter chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-xs text-gray-400 font-medium">Active filters:</span>
            {chips.map(chip => (
              <FilterChip key={chip.id} label={chip.label} color={chip.color} onRemove={chip.remove} />
            ))}
            <button onClick={onReset}
              className="text-xs text-gray-400 hover:text-gray-700 underline transition-colors ml-1">
              Clear all
            </button>
          </div>
        )}

        <div className="flex gap-7">

          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800 text-sm">Filters</h2>
                {chips.length > 0 && (
                  <span className="text-xs font-bold bg-orange-600 text-white w-5 h-5 rounded-full flex items-center justify-center">
                    {chips.length}
                  </span>
                )}
              </div>
              <FilterPanel
                filters={filters}
                onChange={onChange}
                onReset={onReset}
                categories={categories}
              />
            </div>
          </aside>

          {/* Mobile drawer */}
          {filterOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setFilterOpen(false)} />
              <div className="relative w-80 max-w-[90vw] bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
                <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-lg text-gray-900">Filters</h2>
                    {chips.length > 0 && (
                      <span className="text-xs font-bold bg-orange-600 text-white px-1.5 py-0.5 rounded-full">
                        {chips.length}
                      </span>
                    )}
                  </div>
                  <button onClick={() => setFilterOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
                <div className="p-5 flex-1 overflow-y-auto">
                  <FilterPanel
                    filters={filters}
                    onChange={f => { onChange(f); setFilterOpen(false); }}
                    onReset={() => { onReset(); setFilterOpen(false); }}
                    categories={categories}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Products grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <GridSkeleton count={12} />
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-5">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 text-lg">No products found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {chips.length > 0 ? 'Try removing some filters' : 'No products available right now'}
                  </p>
                </div>
                {chips.length > 0 && (
                  <button onClick={onReset} className="btn-primary px-6">Clear All Filters</button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {items.map(p => <ProductCard key={p._id} product={p} />)}
                </div>

                {/* Pagination */}
                {pagination?.pages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-12">
                    <button
                      onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={page === 1}
                      className="flex items-center gap-1.5 btn-secondary px-4 py-2.5 text-sm disabled:opacity-40">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                      </svg>
                      Prev
                    </button>

                    {(() => {
                      const total = pagination.pages;
                      const pages = [];
                      let start = Math.max(1, page - 2);
                      let end   = Math.min(total, start + 4);
                      if (end - start < 4) start = Math.max(1, end - 4);
                      if (start > 1) { pages.push(1); if (start > 2) pages.push('…'); }
                      for (let i = start; i <= end; i++) pages.push(i);
                      if (end < total) { if (end < total - 1) pages.push('…'); pages.push(total); }
                      return pages.map((n, i) =>
                        n === '…' ? (
                          <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-gray-400">…</span>
                        ) : (
                          <button key={n}
                            onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className={`w-9 h-9 text-sm font-semibold rounded-xl transition-colors ${
                              n === page
                                ? 'bg-orange-600 text-white shadow-sm'
                                : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-600'
                            }`}>
                            {n}
                          </button>
                        )
                      );
                    })()}

                    <button
                      onClick={() => { setPage(p => Math.min(pagination.pages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={page === pagination.pages}
                      className="flex items-center gap-1.5 btn-secondary px-4 py-2.5 text-sm disabled:opacity-40">
                      Next
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}