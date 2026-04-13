import React, { useState, useEffect, useMemo } from 'react';

/* ─────────────────────────────────────────────────────
 * getVal — read one attribute value from a variant.
 *
 * Handles all three data shapes:
 *  1. Mongoose Map set properly → {color:"Blue/White", size:"7"} as plain obj after lean()
 *  2. Empty Map (seeded without attrs) → {} — must fall through to name parse
 *  3. No attributes at all → fall through to name parse
 *
 * attrDefs = product.attributes array [{name:"color",...},{name:"size",...}]
 * The fallback parses "Blue/White - 7" using attr index.
 * ───────────────────────────────────────────────────── */
function getVal(variant, key, attrDefs) {
  // Step 1: try attributes Map or plain object
  const raw = variant.attributes;
  if (raw && typeof raw === 'object') {
    let val;
    if (typeof raw.get === 'function') val = raw.get(key);
    else val = raw[key];
    if (val !== undefined && val !== null && String(val).trim() !== '')
      return String(val).trim();
  }

  // Step 2: parse from variant.name using attrDefs index
  // Supports: "Blue/White - 7", "Blue/White / 7", "Blue/White/7", "Blue_White_7"
  if (variant.name && Array.isArray(attrDefs) && attrDefs.length) {
    const name = variant.name;
    let parts = [];
    if (name.includes(' - '))      parts = name.split(' - ').map(s => s.trim());
    else if (name.includes(' / ')) parts = name.split(' / ').map(s => s.trim());
    else if (name.includes('/'))   parts = name.split('/').map(s => s.trim());
    else if (name.includes('_'))   parts = name.split('_').map(s => s.trim());
    else                           parts = [name.trim()];
    const idx = attrDefs.findIndex(a =>
      (a.name || a).toLowerCase() === key.toLowerCase()
    );
    if (idx >= 0 && parts[idx]?.trim()) return parts[idx].trim();
  }

  return undefined;
}

/* ─────────────────────────────────────────────────────
 * resolveColor — color name → CSS hex + isLight flag
 * ───────────────────────────────────────────────────── */
const COLOR_MAP = {
  white:'#ffffff', ivory:'#fffff0', cream:'#fffdd0', beige:'#f5f5dc', offwhite:'#faf9f0',
  black:'#111111', charcoal:'#36454f',
  red:'#e53e3e', crimson:'#dc143c', maroon:'#800000', burgundy:'#800020',
  coral:'#ff7f50', rose:'#fb7185',
  orange:'#f97316', amber:'#f59e0b', gold:'#ffd700',
  yellow:'#eab308', lime:'#84cc16',
  green:'#22c55e', olive:'#808000', sage:'#87ae73', mint:'#98ff98',
  teal:'#14b8a6', cyan:'#06b6d4', aqua:'#00ffff',
  blue:'#3b82f6', navy:'#1e3a5f', indigo:'#6366f1', cobalt:'#0047ab',
  purple:'#a855f7', violet:'#8b5cf6', lavender:'#967bb6',
  pink:'#ec4899', magenta:'#ff00ff',
  brown:'#92400e', tan:'#d2b48c', khaki:'#c3b091', camel:'#c19a6b',
  grey:'#9ca3af', gray:'#9ca3af', silver:'#c0c0c0', slate:'#64748b',
};
const LIGHT = new Set([
  'white','ivory','cream','beige','offwhite','yellow','gold','lime','silver','khaki','tan','camel',
]);

function resolveColor(val) {
  const raw   = (val || '').toLowerCase().trim();
  if (COLOR_MAP[raw])            return { bg: COLOR_MAP[raw], light: LIGHT.has(raw) };
  if (/^#|^rgb|^hsl/.test(raw)) return { bg: raw, light: false };
  // Try first word of multi-word colors like "Blue/White", "Dark Green", "Navy Blue"
  const first = raw.split(/[\s,/\-]/)[0];
  if (COLOR_MAP[first])          return { bg: COLOR_MAP[first], light: LIGHT.has(first) };
  return { bg: null, light: false };
}

/* ─────────────────────────────────────────────────────
 * VariantSelector
 * ───────────────────────────────────────────────────── */
export default function VariantSelector({ product, onSelect, onColorSelect }) {
  const attrs = product.attributes || [];

  const [selected, setSelected] = useState({});
  // { "color": "Blue/White", "size": "7" }

  /* Pre-compute _vals for every variant once */
  const variants = useMemo(() =>
    (product.variants || []).map(v => ({
      ...v,
      _vals: attrs.reduce((acc, a) => {
        acc[a.name] = getVal(v, a.name, attrs);
        return acc;
      }, {}),
    })),
  [product.variants, attrs]); // eslint-disable-line

  /* Emit matched variant whenever selection changes */
  useEffect(() => {
    if (!attrs.length) { onSelect(null); return; }
    const allPicked = attrs.every(a => selected[a.name]);
    if (!allPicked)    { onSelect(null); return; }
    const match = variants.find(v =>
      v.isActive && attrs.every(a => v._vals[a.name] === selected[a.name])
    );
    onSelect(match || null);
  }, [selected]); // eslint-disable-line

  if (!attrs.length) return null;

  /* ── Can a value still produce a valid in-stock variant? ─ */
  const isAvailable = (attrName, value) => {
    const hyp = { ...selected, [attrName]: value };
    return variants.some(v => {
      if (!v.isActive || (v.stock ?? 0) === 0) return false;
      return attrs.every(a => {
        if (!hyp[a.name]) return true;   // not yet selected → accept any
        return v._vals[a.name] === hyp[a.name];
      });
    });
  };

  /* ── Selecting a value clears downstream attrs ─────────── */
const toggle = (attrName, value) => {
  setSelected(prev => {
    const isSel = prev[attrName] === value;
    const next  = { ...prev, [attrName]: isSel ? undefined : value };

    // 🔥 send color selection to parent
    if (attrName.toLowerCase() === 'color') {
      if (onColorSelect) onColorSelect(isSel ? null : value);
    }

    const idx = attrs.findIndex(a => a.name === attrName);
    attrs.slice(idx + 1).forEach(a => { next[a.name] = undefined; });

    return next;
  });
};

  const isColorAttr = (n) => /colou?r/i.test(n);
  const isSizeAttr  = (n) => /size/i.test(n);

  return (
    <div className="space-y-5">
      {attrs.map((attr, attrIdx) => {
        const isColor = isColorAttr(attr.name);
        const isSize  = isSizeAttr(attr.name);
        const sel     = selected[attr.name];

        /* For attr at index N, only show values that actually exist
         * given the selections already made for attrs 0…N-1.
         * For the first attr (color) always show all defined values. */
        const valuesToShow = attrIdx === 0
          ? attr.values
          : attr.values.filter(val =>
              variants.some(v =>
                v.isActive &&
                attrs.slice(0, attrIdx).every(a => {
                  const pick = selected[a.name];
                  return !pick || v._vals[a.name] === pick;
                }) &&
                v._vals[attr.name] === val
              )
            );

        /* Show the size/dependent row only after the color is picked */
        const prevAttr   = attrIdx > 0 ? attrs[attrIdx - 1] : null;
        const prevPicked = prevAttr ? !!selected[prevAttr.name] : true;

        return (
          <div key={attr.name}>
            {/* Row label */}
            <div className="flex items-center gap-2 mb-3">
              <p className="text-sm font-semibold text-gray-800 capitalize">{attr.name}</p>
              {sel && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                  {sel}
                </span>
              )}
            </div>

            {/* "Select X first" hint */}
            {!prevPicked && (
              <p className="text-xs text-gray-400 italic">
                Select {prevAttr.name} first to see available {attr.name}s
              </p>
            )}

            {/* Option buttons */}
            {prevPicked && (
              <div className="flex flex-wrap gap-2.5">
                {valuesToShow.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">
                    No {attr.name} options available for selected {prevAttr?.name}
                  </p>
                ) : valuesToShow.map(val => {
                  const avail = isAvailable(attr.name, val);
                  const isSel = sel === val;

                  /* ── Color swatch ── */
                  // if (isColor) {
                  //   const { bg, light } = resolveColor(val);
                  //   return (
                  //     <button key={val} type="button" title={val}
                  //       disabled={!avail}
                  //       onClick={() => toggle(attr.name, val)}
                  //       className="relative focus:outline-none flex-shrink-0"
                  //       style={{ width: 40, height: 40 }}>
                  //       {/* Selection ring */}
                  //       <span className="absolute inset-0 rounded-full pointer-events-none transition-shadow duration-150"
                  //         style={{ boxShadow: isSel ? '0 0 0 2.5px #fff, 0 0 0 4.5px #ea580c' : 'none' }}/>
                  //       {/* Swatch fill */}
                  //       <span className="absolute inset-1 rounded-full flex items-center justify-center overflow-hidden transition-transform duration-150"
                  //         style={{
                  //           background:  bg || '#e5e7eb',
                  //           border:      light ? '1.5px solid #d1d5db' : '1.5px solid rgba(0,0,0,0.1)',
                  //           opacity:     avail ? 1 : 0.25,
                  //           cursor:      avail ? 'pointer' : 'not-allowed',
                  //           transform:   isSel ? 'scale(0.86)' : 'scale(1)',
                  //         }}>
                  //         {/* Fallback text for unknown colors */}
                  //         {!bg && (
                  //           <span className="text-[8px] font-bold text-gray-600 leading-tight text-center px-0.5">
                  //             {val.slice(0, 4)}
                  //           </span>
                  //         )}
                  //         {/* Strikethrough for unavailable */}
                  //         {!avail && (
                  //           <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                  //             <span className="absolute" style={{
                  //               width:'130%', height: 1.5,
                  //               background:'rgba(0,0,0,0.4)',
                  //               top:'50%', left:'-15%',
                  //               transform:'rotate(45deg)',
                  //             }}/>
                  //           </span>
                  //         )}
                  //       </span>
                  //     </button>
                  //   );
                  // }

                  if (isColor) {
  return (
    <button
      key={val}
      type="button"
      disabled={!avail}
      onClick={() => toggle(attr.name, val)}
      className="flex-shrink-0 px-4 h-10 text-sm font-medium rounded-xl border-2 whitespace-nowrap transition-all duration-150"
      style={{
        background:  isSel  ? '#ea580c' : avail ? '#fff' : '#f9fafb',
        color:       isSel  ? '#fff'    : avail ? '#374151' : '#d1d5db',
        borderColor: isSel  ? '#ea580c' : avail ? '#e5e7eb' : '#f3f4f6',
        cursor:      avail  ? 'pointer' : 'not-allowed',
      }}
    >
      {val.replace('/', ' / ')}
    </button>
  );
}

                  /* ── Size chip ── */
                  if (isSize) {
                    return (
                      <button key={val} type="button"
                        disabled={!avail}
                        onClick={() => toggle(attr.name, val)}
                        className="flex-shrink-0 min-w-[44px] h-10 px-3 text-sm font-semibold rounded-xl border-2 transition-all duration-150"
                        style={{
                          background:     isSel  ? '#111827' : avail ? '#fff' : '#f9fafb',
                          color:          isSel  ? '#fff'    : avail ? '#374151' : '#d1d5db',
                          borderColor:    isSel  ? '#111827' : avail ? '#e5e7eb' : '#f3f4f6',
                          cursor:         avail  ? 'pointer' : 'not-allowed',
                          textDecoration: !avail ? 'line-through' : 'none',
                        }}>
                        {val}
                      </button>
                    );
                  }

                  /* ── Generic chip ── */
                  return (
                    <button key={val} type="button"
                      disabled={!avail}
                      onClick={() => toggle(attr.name, val)}
                      className="flex-shrink-0 px-4 h-10 text-sm font-medium rounded-xl border-2 whitespace-nowrap transition-all duration-150"
                      style={{
                        background:  isSel  ? '#ea580c' : avail ? '#fff' : '#f9fafb',
                        color:       isSel  ? '#fff'    : avail ? '#374151' : '#d1d5db',
                        borderColor: isSel  ? '#ea580c' : avail ? '#e5e7eb' : '#f3f4f6',
                        cursor:      avail  ? 'pointer' : 'not-allowed',
                      }}>
                      {val}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Low-stock warning */}
            {sel && prevPicked && (() => {
              const match = variants.find(v =>
                attrs.slice(0, attrIdx + 1).every(a =>
                  !selected[a.name] || v._vals[a.name] === selected[a.name]
                )
              );
              if (match && match.stock > 0 && match.stock <= 5)
                return (
                  <p className="text-xs text-amber-600 font-medium mt-2">
                    Only {match.stock} left — order soon
                  </p>
                );
              return null;
            })()}
          </div>
        );
      })}
    </div>
  );
}
