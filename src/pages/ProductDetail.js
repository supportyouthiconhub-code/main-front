import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { fetchProduct, clearCurrent, fetchProducts } from '../redux/slices/productSlice';
import { addToCartDB, addLocal } from '../redux/slices/cartSlice';
import { openCart } from '../redux/slices/uiSlice';
import VariantSelector from '../components/product/VariantSelector';
import ProductCard from '../components/product/ProductCard';
import { Spinner, PageLoader, GridSkeleton } from '../components/common/Skeletons';

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

export default function ProductDetail() {
  const { slug }   = useParams();
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { current: product, loading, error, items: related, loading: relLoading } = useSelector(s => s.products);
  const { token }  = useSelector(s => s.auth);
const [selectedColor, setSelectedColor] = useState(null);
  const [variant, setVariant] = useState(null);
  const [qty,     setQty]     = useState(1);
  const [imgIdx,  setImgIdx]  = useState(0);
  const [adding,  setAdding]  = useState(false);
  const [tab,     setTab]     = useState('desc');

  useEffect(() => {
    dispatch(fetchProduct(slug));
    return () => dispatch(clearCurrent());
  }, [slug, dispatch]);

  useEffect(() => {
    setVariant(null); setQty(1); setImgIdx(0);
  }, [product]);

  // Load related products when product is available
  useEffect(() => {
    if (product?.category) {
      dispatch(fetchProducts({ category: product.category.slug || product.category, limit: 4, page: 1 }));
    }
  }, [product, dispatch]);


useEffect(() => {
  setImgIdx(0);
}, [variant, selectedColor]);


useEffect(() => {
  if (!selectedColor || !product?.variants?.length) return;

  // find first variant of selected color (with stock)
  const firstVariant = product.variants.find(
    v =>
      v.isActive &&
      v.attributes?.color?.toLowerCase() === selectedColor.toLowerCase() &&
      (v.stock ?? 0) > 0
  );

if (firstVariant && !hasSize) {
  setVariant(firstVariant);
}
}, [selectedColor, product]);
const hasSize = product?.attributes?.some(attr => attr.name === 'size');
useEffect(() => {
  setVariant(null);
}, [selectedColor]);

  if (loading) return <div className="page py-12"><PageLoader /></div>;

  if (error || !product) return (
    <div className="page py-24 text-center space-y-4">
      <svg className="w-16 h-16 text-gray-200 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p className="text-gray-500 text-lg font-medium">Product not found</p>
      <button onClick={() => navigate('/products')} className="btn-primary">Browse Products</button>
    </div>
  );

  const hasV    = (product.variants?.length || 0) > 0;
  const price   = variant?.price ?? product.minPrice ?? product.basePrice ?? 0;
  const cmpAt   = variant?.compareAtPrice ?? product.compareAtPrice;
  const disc    = cmpAt && cmpAt > price ? Math.round(((cmpAt - price) / cmpAt) * 100) : null;
const inStock = (() => {
  if (!hasV) return true;

  // if NO size required → check color stock
  if (!hasSize && selectedColor) {
    const colorVariant = product.variants.find(
      v =>
        v.attributes?.color?.toLowerCase() === selectedColor.toLowerCase() &&
        (v.stock ?? 0) > 0
    );
    return !!colorVariant;
  }

  // if size required → check selected variant
  if (hasSize && variant) {
    return (variant.stock ?? 0) > 0;
  }

  return false;
})();  const maxQty  = variant?.stock ?? 99;

const images = (() => {
  // 1. If full variant selected → use its images
  if (variant?.images?.length) {
    return variant.images;
  }

  // 2. If ONLY color selected → show that color images
  if (selectedColor) {
    const match = product.variants.find(
      v => v.attributes?.color === selectedColor && v.images?.length
    );

    if (match) return match.images;
  }

  // 3. Default → product images
  return product.images || [];
})();

  const addToCart = async () => {
  if (hasV) {
    if (!selectedColor) {
      toast.error('Please select color');
      return;
    }

    if (hasSize && !variant) {
      toast.error('Please select size');
      return;
    }
  }
    setAdding(true);
    try {
      if (token) {
        await dispatch(addToCartDB({
          productId: product._id,
          variantId: variant?._id,
          quantity:  qty,
        })).unwrap();
      } else {
        dispatch(addLocal({
          productId: product._id, variantId: variant?._id, quantity: qty,
          price, name: product.name, image: images[0], variantName: variant?.name,
        }));
      }
      toast.success('Added to cart!');
      dispatch(openCart());
    } catch (e) {
      toast.error(e?.message || 'Could not add to cart');
    }
    setAdding(false);
  };


  const getSizeChart = () => {
  const cat = product?.category?.name?.toLowerCase();

  // 👕 SHIRTS / TOPS
  if (cat?.includes('shirt') || cat?.includes('tshirt') || cat?.includes('top') || cat?.includes('dress')) {
    return {
      headers: ['Size', 'Chest (in)', 'Length (in)', 'Shoulder (in)'],
      rows: [
        ['S', '36-38', '26', '16'],
        ['M', '38-40', '27', '17'],
        ['L', '40-42', '28', '18'],
        ['XL', '42-44', '29', '19'],
      ],
    };
  }

  // 👖 PANTS / JEANS
  if (cat?.includes('pant') || cat?.includes('jeans') || cat?.includes('trouser')) {
    return {
      headers: ['Size', 'Waist (in)', 'Length (in)', 'Hip (in)'],
      rows: [
        ['30', '30', '40', '36'],
        ['32', '32', '41', '38'],
        ['34', '34', '42', '40'],
        ['36', '36', '43', '42'],
      ],
    };
  }

  // 👟 SHOES
  if (cat?.includes('shoe') || cat?.includes('sneaker') || cat?.includes('footwear')) {
    return {
      headers: ['UK Size', 'EU Size', 'Foot Length (cm)'],
      rows: [
        ['6', '40', '24.5'],
        ['7', '41', '25.5'],
        ['8', '42', '26.5'],
        ['9', '43', '27.5'],
      ],
    };
  }

  // 🧾 DEFAULT
  return {
    headers: ['Size', 'Value'],
    rows: [
      ['S', 'Standard'],
      ['M', 'Standard'],
      ['L', 'Standard'],
    ],
  };
};
const sizeChart = getSizeChart();


  return (
    <>
      <Helmet>
        <title>{product.name} – Youth Icon Hub</title>
        <meta name="description" content={product.shortDescription || product.description?.slice(0, 160)} />
      </Helmet>

      <div className="page py-6 sm:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-7 flex-wrap">
          <Link to="/" className="hover:text-orange-600 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-orange-600 transition-colors">Products</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link to={`/products?category=${product.category.slug}`}
                className="hover:text-orange-600 transition-colors capitalize">
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-700 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">

          {/* ── Images ──────────────────────────────────────── */}
          <div className="space-y-3">
            {/* Main image */}
           <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 relative">
  {images[imgIdx] ? (
    <img
      src={images[imgIdx]}
      alt={product.name}
      className="w-full h-full object-contain transition-opacity duration-200"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
    </div>
  )}

  {disc && (
    <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-xl shadow">
      {disc}% OFF
    </div>
  )}
</div>

            {/* Thumbnails — scrollable row */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-150 ${
                      i === imgIdx
                        ? 'border-orange-500 shadow-md scale-105'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}>
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info ────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Brand + title */}
            {product.brand && (
              <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">{product.brand}</p>
            )}
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Pricing */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-bold text-gray-900">{fmt(price)}</span>
            {Number(cmpAt) !== 0 && Number(cmpAt) > price && (
  <span className="text-xl text-gray-400 line-through">
    {fmt(cmpAt)}
  </span>
)}
              {disc && (
                <span className="bg-red-100 text-red-600 text-sm font-bold px-2.5 py-0.5 rounded-xl">
                  Save {disc}%
                </span>
              )}
            </div>

            {/* Stock status */}
            {!hasV && (
              <div className={`flex items-center gap-2 text-sm font-semibold ${inStock ? 'text-green-600' : 'text-red-500'}`}>
                <div className={`w-2 h-2 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
                {inStock ? 'In Stock — Ready to Ship' : 'Out of Stock'}
              </div>
            )}
            {hasV && variant && (
              <div className={`flex items-center gap-2 text-sm font-semibold ${inStock ? 'text-green-600' : 'text-red-500'}`}>
                <div className={`w-2 h-2 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
                {inStock ? `In Stock — ${variant.stock} available` : 'Out of Stock'}
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Variant selector — scrollable */}
            {hasV && (
              <div>
       <VariantSelector 
  product={product} 
  
  onSelect={setVariant}
  onColorSelect={setSelectedColor}
/>
         {hasV && !variant && !selectedColor && (
                  <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl mt-3 font-medium">
                    Please select all options to see availability
                  </p>
                )}
              </div>
            )}

            {/* Qty + Add to cart */}
{(!hasV || 
  (!hasSize && selectedColor) ||   
  (hasSize && variant)             
) && (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  {/* Qty control */}
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <button
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 font-bold text-lg transition-colors"
                    >−</button>
                    <span className="px-5 py-2.5 font-bold text-gray-900 border-x border-gray-200 min-w-[48px] text-center">
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                      className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 font-bold text-lg transition-colors"
                    >+</button>
                  </div>
                  {variant && (
                    <p className="text-sm text-gray-400">{variant.stock} in stock</p>
                  )}
                </div>

                <button
                  onClick={addToCart}
                  disabled={adding || !inStock}
                  className="btn-primary w-full py-4 text-base"
                >
                  {adding ? (
                    <span className="flex items-center gap-2"><Spinner size="sm" /> Adding...</span>
                  ) : !inStock ? (
                    'Out of Stock'
                  ) : (
                    `Add to Cart — ${fmt(price * qty)}`
                  )}
                </button>
              </div>
            )}

            {/* COD info */}
            {/* <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
              <p className="text-sm font-bold text-orange-800 mb-2">Payment Options</p>
              <div className="space-y-1">
                <p className="text-xs text-orange-700">
                  <span className="font-semibold">Full Payment —</span> Pay complete amount online
                </p>
                <p className="text-xs text-orange-700">
                  <span className="font-semibold">Partial (COD) —</span> Pay shipping online, rest on delivery
                </p>
              </div>
            </div> */}

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map(t => (
                  <span key={t} className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Description / Details tabs ─────────────────────── */}
   <div className="mt-12">
  {/* Tabs */}
  <div className="flex border-b border-gray-200 gap-6">
    {['desc', 'details', 'sheet'].map(t => (
      <button
        key={t}
        onClick={() => setTab(t)}
        className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
          tab === t
            ? 'border-orange-600 text-orange-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        {t === 'desc' ? 'Description' : t === 'details' ? 'Details' : 'Size Chart'}
      </button>
    ))}
  </div>

  {/* Content */}
  <div className="py-6">
    {tab === 'desc' ? (
      <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
        {product.description || 'No description available.'}
      </div>

    ) : tab === 'details' ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          ['Category', product.category?.name],
          ['Brand', product.brand],
          ['SKU', product.sku],
          ['Tags', product.tags?.join(', ')],
        ]
          .filter(([, v]) => v)
          .map(([l, v]) => (
            <div key={l} className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm font-semibold text-gray-500 w-24 flex-shrink-0">
                {l}
              </span>
              <span className="text-sm text-gray-700">{v}</span>
            </div>
          ))}
      </div>

    ) : (
      /* ✅ SIZE CHART */

<div className="overflow-x-auto">
  <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
    
    {/* Header */}
    <thead className="bg-orange-50">
      <tr className="text-left text-gray-700">
        {sizeChart.headers.map((h, i) => (
          <th key={i} className="p-3 font-semibold">{h}</th>
        ))}
      </tr>
    </thead>

    {/* Body */}
    <tbody>
      {sizeChart.rows.map((row, i) => (
        <tr key={i} className="border-t hover:bg-gray-50 transition">
          {row.map((cell, j) => (
            <td key={j} className="p-3 text-gray-700">
              {cell}
            </td>
          ))}
        </tr>
      ))}
    </tbody>

  </table>

  <p className="text-xs text-gray-400 mt-3">
    *Sizes may vary slightly depending on product type.
  </p>
</div>
    )}
  </div>
</div>

        {/* ── Related products ──────────────────────────────── */}
        {related && related.length > 1 && (
          <div className="mt-14">
            <h2 className="font-display font-bold text-2xl text-gray-900 mb-6">You May Also Like</h2>
            {relLoading ? (
              <GridSkeleton count={4} />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {related.filter(p => p.slug !== product.slug).slice(0, 4).map(p => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
