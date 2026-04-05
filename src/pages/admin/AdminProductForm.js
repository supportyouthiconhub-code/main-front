import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { productAPI, categoryAPI, uploadAPI } from '../../services/api';
import { Spinner } from '../../components/common/Skeletons';

/* ─── helpers ────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 9);

async function uploadOne(file) {
  const fd = new FormData();
  fd.append('image', file);
  const r = await uploadAPI.single(fd);
  return r.url || r.data?.url;
}

async function resolveUrls(images) {
  const out = [];
  for (const img of images) {
    if (img.type === 'existing') out.push(img.url);
    else if (img.file) { try { out.push(await uploadOne(img.file)); } catch {} }
  }
  return out.filter(Boolean);
}

/* ─── Product-level image uploader ──────────────────── */
function ImageUploader({ images, setImages }) {
  const ref  = useRef();
  const [drag, setDrag] = useState(false);
  const add  = (files) => Array.from(files).filter(f => f.type.startsWith('image/')).forEach(file => {
    const r = new FileReader();
    r.onload = e => setImages(p => [...p, { type:'new', file, preview: e.target.result, _uid: uid() }]);
    r.readAsDataURL(file);
  });
  return (
    <div className="space-y-3">
      <div onClick={() => ref.current.click()}
        onDrop={e => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${drag ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-400 hover:bg-gray-50'}`}>
        <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={e => add(e.target.files)}/>
        <svg className="w-7 h-7 text-gray-300 mx-auto mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        <p className="text-sm text-gray-500">{drag ? 'Drop images' : 'Click or drag to upload product images'}</p>
        <p className="text-xs text-gray-400 mt-0.5">JPG · PNG · WEBP — max 5 MB</p>
      </div>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={img._uid || i} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
              <img src={img.type === 'new' ? img.preview : img.url} alt="" className="w-full h-full object-cover"/>
              {i === 0 && <div className="absolute bottom-0 inset-x-0 bg-orange-600 text-white text-[8px] font-bold text-center py-0.5">MAIN</div>}
              <button type="button" onClick={() => setImages(p => p.filter((_,j) => j !== i))}
                className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Per-variant image picker ───────────────────────── */
function VariantImageDrawer({ form, setForm }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(null);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      setIndex(e.detail.index);
      setOpen(true);
    };
    window.addEventListener('openVariantImages', handler);
    return () => window.removeEventListener('openVariantImages', handler);
  }, []);

const [tempImages, setTempImages] = useState([]);

useEffect(() => {
  if (open && index !== null) {
    setTempImages(form.variants[index].images || []);
  }
}, [open, index, form]);

if (!open || index === null) return null;


  const addFiles = (files) => {
    const newImgs = [];
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = e => {
        newImgs.push({ type:'new', file, preview: e.target.result, _uid: uid() });

        if (newImgs.length === files.length) {
       setTempImages(prev => [...prev, ...newImgs]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

const remove = (i) => setTempImages(prev => prev.filter((_, idx) => idx !== i));

  return (
   <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-stretch justify-center md:justify-end">
  
  <div className="
    w-full md:w-[400px]
    h-[85vh] md:h-full
    bg-white
    rounded-t-2xl md:rounded-none
    p-4
    overflow-auto
    shadow-xl
  ">
        
        {/* Header */}
        <div className="flex top-0 justify-between items-center mb-4">
          <h2 className="font-semibold">Variant Images</h2>
       <button type="button" onClick={() => setOpen(false)}>✕</button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-3">
{tempImages.map((img, i) => (
            <div key={i} className="relative group">
              <img
                src={img.type === 'new' ? img.preview : img.url}
                className="w-full h-24 object-cover rounded-lg border"
              />
              <button
            type="button"
  onClick={() => remove(i)}
                className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 rounded opacity-0 group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Add */}
      <button
  type="button"
  onClick={() => ref.current.click()}
  className="mt-4 w-full border-2 border-dashed py-3 rounded-lg text-gray-500 hover:border-orange-500"
>
  + Add Images
</button>
<div className="flex gap-2 mt-4">
  <button
    type="button"
    onClick={() => setOpen(false)}
    className="flex-1 border py-2 rounded-lg text-sm"
  >
    Cancel
  </button>

  <button
    type="button"
    onClick={() => {
      setForm(f => ({
        ...f,
        variants: f.variants.map((v, i) =>
          i === index ? { ...v, images: tempImages } : v
        )
      }));
      setOpen(false);
    }}
    className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm"
  >
    Save
  </button>
</div>

        <input
          ref={ref}
          type="file"
          multiple
          className="hidden"
        onChange={(e) => {
    e.stopPropagation();
    addFiles(e.target.files);
  }}
        />
      </div>
    </div>
  );
}

/* ─── One variant row ────────────────────────────────── */
function VariantRow({ v, i, cols, onChange, onRemove }) {
  const s = (k, val) => onChange(i, k, val);
  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50/40 group align-middle">
      {cols.map(col => (
        <td key={col} className="px-2 py-2 min-w-[90px]">
          <input type="text"
            value={v.attrs[col] ?? ''}
            onChange={e => s('attrs', { ...v.attrs, [col]: e.target.value })}
            placeholder={col}
            className="w-full text-sm px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 capitalize"/>
        </td>
      ))}
      {/* Price */}
      <td className="px-2 py-2 w-28">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
          <input type="number" value={v.price ?? ''} onChange={e => s('price', e.target.value)}
            placeholder="0" min="0" step="0.01" required
            className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400"/>
        </div>
      </td>
      {/* Stock */}
      <td className="px-2 py-2 w-20">
        <input type="number" value={v.stock ?? ''} onChange={e => s('stock', e.target.value)}
          placeholder="0" min="0" required
          className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400"/>
      </td>
      {/* Variant image */}
      <td className="px-2 py-2 w-14">
<button
  type="button"
  onClick={() => window.dispatchEvent(new CustomEvent('openVariantImages', { detail: { index: i } }))}
  className="text-xs text-blue-600 hover:underline"
>
  Manage ({v.images?.length || 0})
</button>
      </td>
      {/* SKU */}
      <td className="px-2 py-2 w-32 hidden md:table-cell">
        <input type="text" value={v.sku ?? ''} onChange={e => s('sku', e.target.value)}
          placeholder="Optional"
          className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400"/>
      </td>
      {/* Active */}
      <td className="px-2 py-2 w-12 text-center">
        <input type="checkbox" checked={v.isActive !== false} onChange={e => s('isActive', e.target.checked)}
          className="w-4 h-4 accent-orange-600 rounded"/>
      </td>
      {/* Remove */}
      <td className="px-2 py-2 w-8 text-center">
        <button type="button" onClick={() => onRemove(i)}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors mx-auto opacity-0 group-hover:opacity-100">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </td>
    </tr>
  );
}

const mkVariant = (cols) => ({
  _uid: uid(), attrs: cols.reduce((a,k) => ({ ...a, [k]:'' }), {}),
  price:'', stock:'', sku:'', isActive:true,images: [],
});

/* ─── Main Form ──────────────────────────────────────── */
export default function AdminProductForm() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = !!id;

  const [loading,    setLoading]    = useState(isEdit);
  const [saving,     setSaving]     = useState(false);
  const [categories, setCategories] = useState([]);
  const [images,     setImages]     = useState([]);
  const [activeTab,  setActiveTab]  = useState('basic');
  const [bulkPrice,  setBulkPrice]  = useState('');
  const [bulkStock,  setBulkStock]  = useState('');

  // Dynamic attribute columns e.g. ['color','size']
  const [cols,    setCols]    = useState(['color', 'size']);
  const [newCol,  setNewCol]  = useState('');

  const [form, setForm] = useState({
    name:'', description:'', shortDescription:'',
    basePrice:'', compareAtPrice:'', category:'',
    brand:'', tags:'', isFeatured:false, isActive:true,
    variants:[],
  });
  const set   = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setV  = (i, k, v) => setForm(f => ({
    ...f,
    variants: f.variants.map((x, idx) => idx === i ? { ...x, [k]: v } : x),
  }));
  const addRow    = () => set('variants', [...form.variants, mkVariant(cols)]);
  const removeRow = (i) => set('variants', form.variants.filter((_,j) => j !== i));

  const addCol = () => {
    const name = newCol.trim().toLowerCase();
    if (!name || cols.includes(name)) return;
    setCols(p => [...p, name]);
    setForm(f => ({ ...f, variants: f.variants.map(v => ({ ...v, attrs: { ...v.attrs, [name]:'' } })) }));
    setNewCol('');
  };

  const removeCol = (name) => {
    setCols(p => p.filter(c => c !== name));
    setForm(f => ({ ...f, variants: f.variants.map(v => {
      const { [name]:_, ...rest } = v.attrs;
      return { ...v, attrs:rest };
    })}));
  };

  const applyBulk = () => {
    if (!bulkPrice && !bulkStock) return;
    setForm(f => ({ ...f, variants: f.variants.map(v => ({
      ...v,
      ...(bulkPrice ? { price: bulkPrice } : {}),
      ...(bulkStock ? { stock: bulkStock } : {}),
    }))}));
    setBulkPrice(''); setBulkStock('');
    toast.success('Applied to all variants');
  };

  /* ── Load existing product ─────────────────────────── */
  useEffect(() => {
    categoryAPI.adminGetAll().then(r => setCategories(r.data || []));
    if (!isEdit) return;

    productAPI.adminGetById(id).then(r => {
      const p = r.data;
      if (!p) { setLoading(false); return; }

      // Determine attribute column names
      const keySet = new Set();
      (p.attributes || []).forEach(a => { if (a.name) keySet.add(a.name.toLowerCase()); });
      // Also scan variants to catch any extra keys
      (p.variants || []).forEach(v => {
        if (v.attributes && typeof v.attributes === 'object') {
          Object.entries(v.attributes).forEach(([k, val]) => {
            if (val !== undefined && val !== null && val !== '') keySet.add(k.toLowerCase());
          });
        }
      });
      const keys = keySet.size > 0 ? [...keySet] : ['color', 'size'];
      setCols(keys);

      setForm({
        name:             p.name             || '',
        description:      p.description      || '',
        shortDescription: p.shortDescription || '',
        basePrice:        p.basePrice        ?? '',
        compareAtPrice:   p.compareAtPrice   ?? '',
        category:         p.category?._id    || p.category || '',
        brand:            p.brand            || '',
        tags:             (p.tags || []).join(', '),
        isFeatured:       !!p.isFeatured,
        isActive:         p.isActive !== false,
        variants: (p.variants || []).map(v => {
          const attrs = {};

          // Step 1: try attributes object/Map
          const rawAttrs = v.attributes;
          if (rawAttrs && typeof rawAttrs === 'object') {
            keys.forEach(k => {
              let val;
              if (typeof rawAttrs.get === 'function') {
                val = rawAttrs.get(k);
              } else {
                val = rawAttrs[k];
              }
              if (val && String(val).trim()) attrs[k] = String(val).trim();
            });
          }

          // Step 2: if still empty, parse variant.name
          // Supports: "Blue/White - 7", "Blue/White / 7", "Blue/White_7"
          if (!Object.keys(attrs).length && v.name) {
            // Try different separators
            let parts = [];
            if (v.name.includes(' - '))      parts = v.name.split(' - ').map(s => s.trim());
            else if (v.name.includes(' / ')) parts = v.name.split(' / ').map(s => s.trim());
            else if (v.name.includes('/'))   parts = v.name.split('/').map(s => s.trim());
            else if (v.name.includes('_'))   parts = v.name.split('_').map(s => s.trim());
            else                             parts = [v.name.trim()]; // single value variant

            keys.forEach((k, idx) => {
              if (parts[idx] && parts[idx].trim()) attrs[k] = parts[idx].trim();
            });
          }

          return {
            _uid:     uid(),
            _id:      v._id,
            attrs,
            price:    v.price    ?? '',
            stock:    v.stock    ?? 0,
            sku:      v.sku      || '',
            isActive: v.isActive !== false,
     images: (v.images || []).map(url => ({
  type: 'existing',
  url,
  _uid: uid()
})),
          };
        }),
      });

      setImages((p.images || []).map(url => ({ type:'existing', url, _uid: uid() })));
      setLoading(false);
    }).catch(() => { toast.error('Failed to load product'); setLoading(false); });
  }, [id, isEdit]); // eslint-disable-line

  /* ── Submit ────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())   { toast.error('Product name is required'); setActiveTab('basic'); return; }
    if (!form.basePrice)     { toast.error('Base price is required');   setActiveTab('basic'); return; }
    if (!form.category)      { toast.error('Category is required');     setActiveTab('basic'); return; }
    if (!images.length)      { toast.error('At least one image is required'); setActiveTab('images'); return; }

    setSaving(true);
    try {
      const imageUrls = await resolveUrls(images);

      // Build product-level attributes array from variant data
      const attrMap = {};
      cols.forEach(k => { attrMap[k] = new Set(); });
      form.variants.forEach(v => {
        cols.forEach(k => { if (v.attrs?.[k]) attrMap[k].add(v.attrs[k]); });
      });
      const attributes = cols
        .filter(k => attrMap[k]?.size > 0)
        .map(k => ({ name: k, values: [...attrMap[k]] }));

      // Build variants — never send empty string SKU (causes unique index error)
      const variants = await Promise.all(form.variants.map(async v => {
 let varImgs = [];

for (const img of v.images || []) {
  if (img.type === 'existing') {
    varImgs.push(img.url);
  } else if (img.file) {
    try {
      const url = await uploadOne(img.file);
      if (url) varImgs.push(url);
    } catch {}
  }
}

        // Build name from non-empty attrs
        const name = cols.map(k => v.attrs?.[k] || '').filter(Boolean).join(' / ') || 'Default';
        // Build attributes object (saved as Mongoose Map)
        const attrObj = {};
        cols.forEach(k => { if (v.attrs?.[k]) attrObj[k] = v.attrs[k]; });

        return {
          ...(v._id ? { _id: v._id } : {}),
          name,
          attributes: attrObj,
          price:      parseFloat(v.price)  || 0,
          stock:      parseInt(v.stock)    || 0,
          // IMPORTANT: send undefined (not empty string) to avoid unique index collision
          sku:        v.sku?.trim() || undefined,
          isActive:   v.isActive !== false,
       images: varImgs
        };
      }));

      const payload = {
        ...form,
        images:         imageUrls,
        tags:           form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        basePrice:      parseFloat(form.basePrice)      || 0,
        compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
        attributes,
        variants,
      };
   if (isEdit) {
  await productAPI.update(id, payload);
  toast.success('Product updated!');
} else {
  const res = await productAPI.create(payload);
  toast.success('Product created!');

  // after create → stay on edit page
  // navigate(`/admin/products/${res.data._id}`);
    navigate(`/admin/products`);

}
    } catch (err) { toast.error(err.message || 'Failed to save product'); }
    setSaving(false);
  };

  /* ── UI ────────────────────────────────────────────── */
  const TABS = [
    { id:'basic',    label:'Basic Info', warn: !form.name || !form.basePrice || !form.category },
    { id:'images',   label:'Images',     count: images.length,         warn: images.length === 0 },
    { id:'variants', label:'Variants',   count: form.variants.length,  warn: false },
  ];

  const totalStock = form.variants.reduce((s,v) => s + (parseInt(v.stock)||0), 0);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-sm text-gray-400">Loading product...</p>
      </div>
    </div>
  );

  return (
    <>
      <Helmet><title>{isEdit ? 'Edit Product' : 'New Product'} – Admin</title></Helmet>
      <form onSubmit={handleSubmit} className="space-y-5 max-w-full">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900">{isEdit ? 'Edit Product' : 'New Product'}</h1>
            {isEdit && <p className="text-xs text-gray-400 mt-0.5">ID: {id}</p>}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => navigate('/admin/products')} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Spinner size="sm"/> Saving...</> : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${activeTab === t.id ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
              {t.warn && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">!</span>}
              {!t.warn && t.count > 0 && <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">{t.count}</span>}
            </button>
          ))}
        </div>

        {/* ── BASIC INFO ─────────────────────────────────── */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div className="card p-5 space-y-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Product Details</h2>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required className="input" placeholder="e.g. Classic Cotton T-Shirt"/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Short Description <span className="ml-1 text-xs font-normal text-gray-400">shown in listings</span></label>
                <input type="text" value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)} className="input" placeholder="One-line summary" maxLength={150}/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} className="input resize-none" placeholder="Full product description..."/>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card p-5 space-y-4">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pricing</h2>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Base Price (₹) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                    <input type="number" value={form.basePrice} onChange={e => set('basePrice', e.target.value)} required min="0" step="0.01" className="input pl-8" placeholder="0.00"/>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Used as display price; each variant can override this.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Compare-at Price <span className="ml-1 text-xs font-normal text-gray-400">shows strikethrough</span></label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                    <input type="number" value={form.compareAtPrice} onChange={e => set('compareAtPrice', e.target.value)} min="0" step="0.01" className="input pl-8" placeholder="Optional"/>
                  </div>
                </div>
              </div>

              <div className="card p-5 space-y-4">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Organisation</h2>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                  <select value={form.category} onChange={e => set('category', e.target.value)} required className="input">
                    <option value="">Select category</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>
                        {'—'.repeat(c.level||0)}{c.level > 0 ? ' ' : ''}{c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brand</label>
                  <input type="text" value={form.brand} onChange={e => set('brand', e.target.value)} className="input" placeholder="Brand name"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tags <span className="ml-1 text-xs font-normal text-gray-400">comma-separated</span></label>
                  <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)} className="input" placeholder="cotton, casual, summer"/>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Settings</h2>
              <div className="flex flex-wrap gap-6">
                {[['isActive','Active','Visible to customers'],['isFeatured','Featured','Show on homepage']].map(([k,l,d]) => (
                  <label key={k} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} className="w-4 h-4 accent-orange-600 rounded"/>
                    <div><p className="text-sm font-semibold text-gray-700">{l}</p><p className="text-xs text-gray-400">{d}</p></div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── IMAGES ─────────────────────────────────────── */}
      {activeTab === 'images' && (
          <div className="card p-5 space-y-3">
            <div>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Product Images</h2>
              <p className="text-xs text-gray-400 mt-1">First image is the main cover. Each variant can also have its own image.</p>
            </div>
            <ImageUploader images={images} setImages={setImages}/>
            {images.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 font-medium">
                At least one product image is required.
              </div>
            )}
          </div>
        )} 
        {/* ── VARIANTS ───────────────────────────────────── */}
        {activeTab === 'variants' && (
          <div className="card overflow-hidden">

            {/* Column manager */}
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60 space-y-3">
              <div className="flex items-center justify-end">
                {/* <div>
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Variant Options</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Each row = one variant (e.g. Black / 34). Configure columns, then add rows.</p>
                </div> */}
                <button type="button" onClick={addRow}
                  className="btn-primary text-xs py-2 px-3 flex-shrink-0 gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                  </svg>
                  Add Variant
                </button>
              </div>

              {/* Active columns */}
              <div className="flex flex-wrap items-center gap-2">
                {/* <span className="text-xs text-gray-400 font-medium flex-shrink-0">Columns:</span> */}
                {/* {cols.map(c => (
                  <span key={c} className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm capitalize">
                    {c}
                    <button type="button" onClick={() => removeCol(c)} className="ml-0.5 text-gray-400 hover:text-red-500 leading-none text-sm">×</button>
                  </span>
                ))} */}

                {/* Add column input */}
                {/* <input type="text" value={newCol}
                  onChange={e => setNewCol(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCol())}
                  placeholder="+ column name"
                  className="text-xs border border-dashed border-gray-300 rounded-lg px-2.5 py-1.5 w-32 focus:outline-none focus:border-orange-400 bg-white"/> */}
                {/* {newCol && (
                  <button type="button" onClick={addCol}
                    className="text-xs text-orange-600 font-semibold hover:underline">Add</button>
                )} */}

                {/* Quick shortcuts */}
                {/* {['material','fit','style','size'].filter(n => !cols.includes(n)).slice(0,3).map(n => (
                  <button key={n} type="button"
                    onClick={() => { setCols(p => [...p, n]); setForm(f => ({ ...f, variants: f.variants.map(v => ({ ...v, attrs: { ...v.attrs, [n]:'' } })) })); }}
                    className="text-xs text-gray-400 border border-dashed border-gray-200 px-2 py-1 rounded-lg hover:text-orange-600 hover:border-orange-300 transition-colors capitalize">
                    + {n}
                  </button>
                ))} */}
              </div>
            </div>

            {form.variants.length === 0 ? (
              <div className="py-16 text-center px-5 space-y-3">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">No variants yet</p>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  Each variant has its own color, size, price, stock and image.
                </p>
                <button type="button" onClick={addRow} className="btn-primary text-sm">Add First Variant</button>
              </div>
            ) : (
              <>
                {/* Bulk fill */}
                {/* <div className="px-5 py-3 bg-blue-50/60 border-b border-blue-100 flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold text-blue-700 flex-shrink-0">Set for all:</span>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                    <input type="number" value={bulkPrice} onChange={e => setBulkPrice(e.target.value)} placeholder="Price"
                      className="pl-5 pr-2 py-1.5 text-xs border border-blue-200 rounded-lg w-24 focus:outline-none bg-white"/>
                  </div>
                  <input type="number" value={bulkStock} onChange={e => setBulkStock(e.target.value)} placeholder="Stock"
                    className="px-2.5 py-1.5 text-xs border border-blue-200 rounded-lg w-20 focus:outline-none bg-white"/>
                  <button type="button" onClick={applyBulk} disabled={!bulkPrice && !bulkStock}
                    className="btn-primary text-xs py-1.5 px-3 disabled:opacity-40">Apply All</button>
                </div> */}

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" style={{ minWidth: `${cols.length * 100 + 300}px` }}>
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {cols.map(c => (
                          <th key={c} className="px-2 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider capitalize min-w-[90px]">{c}</th>
                        ))}
                        <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Price (₹)</th>
                        <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Stock</th>
                        <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-14">Image</th>
                        <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 hidden md:table-cell">SKU</th>
                        <th className="px-2 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">On</th>
                        <th className="px-2 py-2.5 w-8"/>
                      </tr>
                    </thead>
                    <tbody>
                      {form.variants.map((v, i) => (
                        <VariantRow key={v._uid || i} v={v} i={i} cols={cols} onChange={setV} onRemove={removeRow}/>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add row */}
                <div className="px-5 py-3 border-t border-gray-100">
                  <button type="button" onClick={addRow}
                    className="text-sm text-orange-600 font-semibold hover:underline flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                    </svg>
                    Add another variant
                  </button>
                </div>

                {/* Summary */}
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>Total stock: <strong className="text-gray-800">{totalStock}</strong></span>
                  <span>Active: <strong className="text-gray-800">{form.variants.filter(v => v.isActive !== false).length}/{form.variants.length}</strong></span>
                  <span>Price range: <strong className="text-gray-800">
                    {(() => {
                      const pp = form.variants.map(v => parseFloat(v.price)||0).filter(p => p > 0);
                      if (!pp.length) return '—';
                      const mn = Math.min(...pp), mx = Math.max(...pp);
                      return mn === mx ? `₹${mn.toLocaleString('en-IN')}` : `₹${mn.toLocaleString('en-IN')} – ₹${mx.toLocaleString('en-IN')}`;
                    })()}
                  </strong></span>
                </div>
              </>
            )}
          </div>
        )}
<VariantImageDrawer form={form} setForm={setForm} />
        {/* Save bar */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-secondary text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary text-sm">
            {saving ? <><Spinner size="sm"/> Saving...</> : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </form>
    </>
  );
}