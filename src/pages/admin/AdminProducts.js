import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { productAPI } from '../../services/api';
import { Spinner } from '../../components/common/Skeletons';
import Pagination from '../../components/common/Pagination';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const LIMIT = 10;

const SkeletonRows = ({ n }) => (
  <>
    {Array(n).fill(0).map((_, i) => (
      <tr key={i}>
        {[140, 80, 60, 50, 60, 60, 70].map((w, j) => (
          <td key={j} className="px-4 py-3">
            <div className={`h-4 bg-gray-100 rounded animate-pulse`} style={{ width: w }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

export default function AdminProducts() {
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [pagination, setPagination] = useState(null);
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('');
  const [toggling,   setToggling]   = useState(null);
  const [deleting,   setDeleting]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await productAPI.adminGetAll({ page, limit: LIMIT, search, status });
      setProducts(r.data || []);
      setPagination(r.pagination);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const toggleFeatured = async (id) => {
    setToggling(id);
    try {
      await productAPI.toggleFeatured(id);
      setProducts(prev => prev.map(p => p._id === id ? { ...p, isFeatured: !p.isFeatured } : p));
    } catch (e) { toast.error(e.message); }
    setToggling(null);
  };

  const deleteProduct = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await productAPI.remove(id);
      toast.success('Product deleted');
      load();
    } catch (e) { toast.error(e.message); }
    setDeleting(null);
  };

  return (
    <>
      <Helmet><title>Products – Admin</title></Helmet>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900">Products</h1>
            {pagination && (
              <p className="text-sm text-gray-400 mt-0.5">
                {pagination.total} products · page {pagination.page} of {pagination.pages || 1}
              </p>
            )}
          </div>
          <Link to="/admin/products/new" className="btn-primary gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Add Product
          </Link>
        </div>

        {/* Table card */}
        <div className="card overflow-hidden">

          {/* Filters bar */}
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input type="text" placeholder="Search products..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="input pl-9 text-sm"
              />
            </div>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="input text-sm w-36">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {(search || status) && (
              <button onClick={() => { setSearch(''); setStatus(''); setPage(1); }}
                className="text-xs text-gray-400 hover:text-gray-700 underline">
                Clear
              </button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-full">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Price</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Stock</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Featured</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <SkeletonRows n={LIMIT} />
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                        </svg>
                        <p className="text-gray-400 text-sm">No products found</p>
                        <Link to="/admin/products/new" className="btn-primary text-xs py-1.5 px-3">Add Product</Link>
                      </div>
                    </td>
                  </tr>
                ) : products.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50/60 transition-colors group">
                    {/* Product */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                          {p.images?.[0]
                            ? <img src={p.images[0]} alt="" className="w-full h-full object-cover"/>
                            : <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                              </div>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">{p.name}</p>
                          <p className="text-xs text-gray-400">
                            {p.variants?.length || 0} variant{p.variants?.length !== 1 ? 's' : ''}
                            {p.brand ? ` · ${p.brand}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* Category */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                        {p.category?.name || '—'}
                      </span>
                    </td>
                    {/* Price */}
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-bold text-gray-900">{fmt(p.basePrice)}</p>
                      {p.compareAtPrice > p.basePrice && (
                        <p className="text-xs text-gray-400 line-through">{fmt(p.compareAtPrice)}</p>
                      )}
                    </td>
                    {/* Stock */}
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <span className={`inline-flex items-center justify-center min-w-[42px] text-xs font-semibold px-2 py-1 rounded-lg ${
                        (p.totalStock ?? 0) === 0
                          ? 'bg-red-100 text-red-600'
                          : (p.totalStock ?? 0) <= 10
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {p.totalStock ?? '—'}
                      </span>
                    </td>
                    {/* Featured toggle */}
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <button
                        onClick={() => toggleFeatured(p._id)}
                        disabled={toggling === p._id}
                        title={p.isFeatured ? 'Remove featured' : 'Mark as featured'}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all ${
                          p.isFeatured
                            ? 'bg-amber-100 text-amber-500 hover:bg-amber-200'
                            : 'bg-gray-100 text-gray-300 hover:bg-gray-200 hover:text-gray-500'
                        }`}
                      >
                        {toggling === p._id
                          ? <Spinner size="sm"/>
                          : <svg className="w-4 h-4" fill={p.isFeatured ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                            </svg>
                        }
                      </button>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.isActive ? 'bg-green-500' : 'bg-gray-400'}`}/>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/admin/products/${p._id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </Link>
                        <button onClick={() => deleteProduct(p._id, p.name)} disabled={deleting === p._id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          {deleting === p._id ? <Spinner size="sm"/> :
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            page={page}
            pages={pagination?.pages}
            total={pagination?.total}
            limit={LIMIT}
            onChange={(n) => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        </div>
      </div>
    </>
  );
}
