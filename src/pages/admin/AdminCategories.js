import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { categoryAPI } from '../../services/api';
import { Spinner } from '../../components/common/Skeletons';
import Pagination from '../../components/common/Pagination';

const resolveId = (v) => {
  if (!v) return '';
  if (typeof v === 'object' && v._id) return String(v._id);
  return String(v);
};
const PAGE_SIZE = 10;

const IconEdit = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
  </svg>
);
const IconTrash = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
  </svg>
);
const IconChevron = ({ open }) => (
  <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
  </svg>
);

/* ── Category Form Modal ──────────────────────────────── */
function CategoryModal({ cat, cats, onClose, onSaved }) {
  const isEdit = !!cat?._id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:        cat?.name        || '',
    parent:      resolveId(cat?.parent),
    description: cat?.description || '',
    image:       cat?.image       || '',
    isActive:    cat?.isActive !== false,
    sortOrder:   cat?.sortOrder   || 0,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const selfId = cat?._id ? String(cat._id) : null;
  const selectable = cats
    .filter(c => {
      if (!selfId) return true;
      if (String(c._id) === selfId) return false;
      if (Array.isArray(c.ancestors) && c.ancestors.some(a => String(a) === selfId)) return false;
      return true;
    })
    .sort((a, b) => (a.level - b.level) || a.name.localeCompare(b.name));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, parent: form.parent || null };
      if (isEdit) await categoryAPI.update(cat._id, payload);
      else        await categoryAPI.create(payload);
      toast.success(isEdit ? 'Category updated' : 'Category created');
      onSaved(); onClose();
    } catch (err) { toast.error(err.message); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-xl text-gray-900">{isEdit ? 'Edit Category' : 'New Category'}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required autoFocus className="input" placeholder="e.g. Clothing"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Parent Category</label>
            <select value={form.parent} onChange={e => set('parent', e.target.value)} className="input">
              <option value="">— None (Root Category) —</option>
              {selectable.map(c => (
                <option key={c._id} value={String(c._id)}>
                  {'  '.repeat(c.level || 0)}{c.level > 0 ? '└ ' : ''}{c.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Leave empty to create a top-level category</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="input resize-none" placeholder="Optional"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Image URL</label>
            <input type="text" value={form.image} onChange={e => set('image', e.target.value)} className="input" placeholder="https://..."/>
          </div>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={e => set('sortOrder', parseInt(e.target.value) || 0)} min="0" className="input"/>
            </div>
            <div className="flex items-center gap-2 mb-2.5">
              <input type="checkbox" id="catActive" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="w-4 h-4 accent-orange-600 rounded"/>
              <label htmlFor="catActive" className="text-sm font-semibold text-gray-700 cursor-pointer">Active</label>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Spinner size="sm"/> : isEdit ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Tree Row (for tree view) ─────────────────────────── */
function CatRow({ cat, all, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(true);
  const children = all.filter(c => resolveId(c.parent) === String(cat._id));

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${(cat.level || 0) * 22}px` }}>
            {children.length > 0
              ? <button onClick={() => setExpanded(v => !v)} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 flex-shrink-0">
                  <IconChevron open={expanded}/>
                </button>
              : <span className="w-5 flex-shrink-0"/>}
            {cat.image && <img src={cat.image} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0"/>}
            <div>
              <p className="font-semibold text-gray-800 text-sm">{cat.name}</p>
              {cat.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{cat.description}</p>}
            </div>
          </div>
        </td>
        <td className="px-4 py-3 hidden sm:table-cell">
          <span className="badge bg-gray-100 text-gray-600 text-xs">{cat.level === 0 ? 'Root' : `Level ${cat.level}`}</span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{cat.productCount ?? '—'}</td>
        <td className="px-4 py-3">
          <span className={`badge ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
            {cat.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => onEdit(cat)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"><IconEdit/></button>
            <button onClick={() => onDelete(cat)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><IconTrash/></button>
          </div>
        </td>
      </tr>
      {expanded && children.map(child => <CatRow key={child._id} cat={child} all={all} onEdit={onEdit} onDelete={onDelete}/>)}
    </>
  );
}

/* ── Main Page ────────────────────────────────────────── */
export default function AdminCategories() {
  const [cats,    setCats]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);
  const [view,    setView]    = useState('tree'); // 'tree' | 'flat'

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await categoryAPI.adminGetAll();
      const sorted = (r.data || []).sort(
        (a, b) => (a.level - b.level) || (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name)
      );
      setCats(sorted);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    try {
      await categoryAPI.remove(cat._id);
      toast.success('Category deleted');
      load();
    } catch (e) { toast.error(e.message); }
  };

  // Filtered flat list for search/pagination
  const filtered = cats.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const roots      = cats.filter(c => !resolveId(c.parent));

  const isSearching = !!search;

  return (
    <>
      <Helmet><title>Categories – Admin</title></Helmet>
      {modal !== null && (
        <CategoryModal cat={modal.cat} cats={cats} onClose={() => setModal(null)} onSaved={load}/>
      )}

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900">Categories</h1>
            <p className="text-sm text-gray-400 mt-0.5">{cats.length} total categories</p>
          </div>
          <button onClick={() => setModal({})} className="btn-primary">+ Add Category</button>
        </div>

        <div className="card overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
            <input type="text" placeholder="Search categories..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input max-w-xs text-sm"/>

            {/* View toggle — only when not searching */}
            {!isSearching && (
              <div className="flex rounded-xl border border-gray-200 overflow-hidden ml-auto">
                {[['tree','Tree'],['flat','List']].map(([v,l]) => (
                  <button key={v} onClick={() => setView(v)}
                    className={`px-3.5 py-1.5 text-xs font-semibold transition-colors ${view === v ? 'bg-orange-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-400 tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Level</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Products</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="py-10 text-center"><Spinner size="lg" className="mx-auto"/></td></tr>
                ) : isSearching || view === 'flat' ? (
                  /* ── Flat / search view with pagination ── */
                  paginated.length === 0
                    ? <tr><td colSpan={5} className="py-16 text-center text-gray-400">No categories found matching "{search}"</td></tr>
                    : paginated.map(c => (
                      <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {c.image && <img src={c.image} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0"/>}
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{c.name}</p>
                              {c.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{c.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="badge bg-gray-100 text-gray-600 text-xs">{c.level === 0 ? 'Root' : `Level ${c.level}`}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{c.productCount ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            {c.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setModal({ cat: c })} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"><IconEdit/></button>
                            <button onClick={() => handleDelete(c)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><IconTrash/></button>
                          </div>
                        </td>
                      </tr>
                    ))
                ) : (
                  /* ── Tree view ── */
                  roots.length === 0
                    ? <tr><td colSpan={5} className="py-16 text-center text-gray-400">
                        No categories yet.{' '}
                        <button onClick={() => setModal({})} className="text-orange-600 font-semibold hover:underline">Create one</button>
                      </td></tr>
                    : roots.map(c => <CatRow key={c._id} cat={c} all={cats} onEdit={x => setModal({ cat: x })} onDelete={handleDelete}/>)
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination — only in flat/search view */}
          {(isSearching || view === 'flat') && (
            <Pagination
              page={page}
              pages={totalPages}
              total={filtered.length}
              limit={PAGE_SIZE}
              onChange={setPage}
            />
          )}
        </div>
      </div>
    </>
  );
}
