import React, { useState } from 'react';
import { useSelector } from 'react-redux';

const SORTS = [
  { value:'newest',     label:'Newest First' },
  { value:'price_asc',  label:'Price: Low → High' },
  { value:'price_desc', label:'Price: High → Low' },
  { value:'popular',    label:'Most Popular' },
];

function CatList({ cats, level, active, onSelect }) {
  return cats.map(cat => (
    <React.Fragment key={cat._id}>
      <button onClick={() => onSelect(active === cat.slug ? '' : cat.slug)}
        style={{ paddingLeft: `${8 + level * 14}px` }}
        className={`w-full text-left flex items-center gap-1.5 py-1.5 px-2 rounded-lg text-sm transition-colors ${
          active === cat.slug ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
        }`}>
        {level > 0 && <span className="text-gray-300 text-xs">└</span>}
        {cat.name}
        {active === cat.slug && <span className="ml-auto text-orange-600">✓</span>}
      </button>
      {cat.children?.length > 0 && <CatList cats={cat.children} level={level+1} active={active} onSelect={onSelect} />}
    </React.Fragment>
  ));
}

export default function FilterSidebar({ filters, onChange, onReset }) {
  const { categories } = useSelector(s => s.products);
  const [minP, setMinP] = useState(filters.minPrice || '');
  const [maxP, setMaxP] = useState(filters.maxPrice || '');

  return (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sort By</p>
        <div className="space-y-0.5">
          {SORTS.map(o => (
            <button key={o.value} onClick={() => onChange({ sort: o.value })}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                filters.sort === o.value ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
              }`}>{o.label}</button>
          ))}
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Categories</p>
          <div className="space-y-0.5">
            <CatList cats={categories} level={0} active={filters.category} onSelect={(v) => onChange({ category: v })} />
          </div>
        </div>
      )}

      {/* Price */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Price Range</p>
        <div className="flex gap-2 items-center">
          <input type="number" placeholder="Min" value={minP} onChange={e => setMinP(e.target.value)}
            className="input text-sm py-2" />
          <span className="text-gray-400 text-sm flex-shrink-0">–</span>
          <input type="number" placeholder="Max" value={maxP} onChange={e => setMaxP(e.target.value)}
            className="input text-sm py-2" />
        </div>
        <button onClick={() => onChange({ minPrice: minP, maxPrice: maxP })}
          className="btn-primary w-full mt-2 py-2 text-sm">Apply</button>
      </div>

      <button onClick={() => { setMinP(''); setMaxP(''); onReset(); }} className="btn-secondary w-full text-sm py-2">
        Reset Filters
      </button>
    </div>
  );
}
