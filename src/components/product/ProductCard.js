import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { addToCartDB, addLocal } from '../../redux/slices/cartSlice';
import { openCart } from '../../redux/slices/uiSlice';

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const { token } = useSelector(s => s.auth);
  const [adding, setAdding] = useState(false);

  const hasVariants  = (product.variants?.length || 0) > 0;
  const price        = product.minPrice ?? product.basePrice ?? 0;
  const compareAt    = product.compareAtPrice;
  const discount     = compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : null;
  const image        = product.images?.[0];
  const inStock      = hasVariants
    ? product.variants.some(v => v.isActive && (v.stock ?? 0) > 0)
    : true;

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasVariants || !inStock || adding) return;
    setAdding(true);
    try {
      if (token) {
        await dispatch(addToCartDB({ productId: product._id, quantity: 1 })).unwrap();
      } else {
        dispatch(addLocal({
          productId: product._id, quantity: 1,
          price: product.basePrice, name: product.name, image,
        }));
      }
      toast.success('Added to cart');
      dispatch(openCart());
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Could not add to cart');
    }
    setAdding(false);
  };

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">

        {/* Image container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {image ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
          )}

          {/* Top-left badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {discount && (
              <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
                {discount}% OFF
              </span>
            )}
            {product.isFeatured && (
              <span className="bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
                Featured
              </span>
            )}
          </div>

          {/* Out of stock overlay */}
          {!inStock && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                Out of Stock
              </span>
            </div>
          )}

          {/* Quick add button — shown on hover for simple products */}
          {!hasVariants && inStock && (
            <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <button
                onClick={handleQuickAdd}
                disabled={adding}
                className="w-full bg-gray-900 hover:bg-orange-600 text-white text-xs font-semibold py-2.5 transition-colors duration-200"
              >
                {adding ? 'Adding...' : 'Quick Add to Cart'}
              </button>
            </div>
          )}
          {hasVariants && inStock && (
            <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <div className="w-full bg-gray-900 text-white text-xs font-semibold py-2.5 text-center">
                Select Options
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3.5">
          {product.category?.name && (
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              {product.category.name}
            </p>
          )}

          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-2.5 min-h-[2.5rem]">
            {product.name}
          </h3>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base font-bold text-gray-900">{fmt(price)}</span>
           {Number(compareAt) > 0 && Number(compareAt) > price && (
  <span className="text-xs text-gray-400 line-through">
    {fmt(compareAt)}
  </span>
)}
            </div>
            {hasVariants && (
              <span className="text-[10px] text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                {product.variants.length} options
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
