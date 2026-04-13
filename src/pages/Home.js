import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchFeatured } from '../redux/slices/productSlice';
import ProductCard from '../components/product/ProductCard';
import { GridSkeleton } from '../components/common/Skeletons';

const CAT_COLORS = [
  'bg-blue-50 text-blue-700 border border-blue-100',
  'bg-purple-50 text-purple-700 border border-purple-100',
  'bg-green-50 text-green-700 border border-green-100',
  'bg-orange-50 text-orange-700 border border-orange-100',
  'bg-pink-50 text-pink-700 border border-pink-100',
];

export default function Home() {
  const dispatch = useDispatch();
  const { featured, featuredLoading, categories } = useSelector(s => s.products);

  useEffect(() => { dispatch(fetchFeatured()); }, [dispatch]);

  return (
    <>
      <Helmet>
        <title>Youth Icon Hub – Quality Products at Best Prices</title>
        <meta name="description" content="Shop quality products with fast delivery, easy returns and best prices." />
      </Helmet>
{/* Moving Strip */}

<div className="w-full bg-black text-white overflow-hidden">
  <div className="flex animate-marquee gap-16 py-2 text-sm font-semibold">
    
    {/* First set */}
    <div className="flex gap-16">
      <span>FOR WHOLESALE CONTACT ON THIS NUMBER 6239922672</span>
      <span>FOR WHOLESALE CONTACT ON THIS NUMBER 6239922672</span>
      <span>FOR WHOLESALE CONTACT ON THIS NUMBER 6239922672</span>
    </div>

    {/* Duplicate set (important for seamless loop) */}
    <div className="flex gap-16">
      <span>FOR WHOLESALE CONTACT ON THIS NUMBER 6239922672</span>
      <span>FOR WHOLESALE CONTACT ON THIS NUMBER 6239922672</span>
      <span>FOR WHOLESALE CONTACT ON THIS NUMBER 6239922672</span>
    </div>

  </div>
</div>
      {/* Hero */}
<section
  className="relative overflow-hidden bg-cover bg-center bg-no-repeat min-h-screen flex items-center"
  style={{
    backgroundImage: "url('https://i.pinimg.com/736x/4d/cf/4b/4dcf4bf9e522e4d0959066c9660e39fb.jpg')",
  }}
>
  {/* Overlay */}
  <div className="absolute inset-0 bg-black/60"></div>      

  {/* Content */}
  <div className="page relative z-10 w-full">
    <div className="max-w-2xl text-center sm:text-left">
      
      {/* Badge */}
      <span className="inline-block bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
        New Collection 2026
      </span>

      {/* Heading */}
      <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl text-white leading-tight mb-6">
        Redefine Your<br />Everyday Style
      </h1>

      {/* Description */}
      <p className="text-white/80 text-lg sm:text-xl mb-10 max-w-lg leading-relaxed">
        Curated pieces crafted with precision, designed to elevate your wardrobe with timeless elegance and modern edge.
      </p>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
        <Link
          to="/products"
          className="bg-white text-black font-semibold px-8 py-3.5 rounded-xl hover:bg-neutral-200 transition-colors shadow-lg text-center"
        >
          Explore Collection
        </Link>

        <Link
          to="/products?featured=true"
          className="border border-white/40 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-center"
        >
          View Highlights
        </Link>
      </div>

    </div>
  </div>

  {/* Decorative circles */}
  <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
  <div className="absolute right-24 bottom-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
</section>

      {/* Trust badges */}
      <section className="border-b border-gray-100 bg-white">
        <div className="page py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
{[
  { title: 'Crafted Excellence', sub: 'Premium materials, perfected design' },
 { title: 'Easy Exchange', sub: 'Contact us or email us to exchange your order' },
  { title: 'Secure Checkout', sub: 'Fast & safe payments with Razorpay' },
  { title: 'Trusted Marketplace', sub: 'Curated products from verified sellers' },
].map((b, i) => (
  <div key={i} className="flex flex-col items-center text-center py-4 px-3">
    <p className="text-sm font-semibold text-gray-800">{b.title}</p>
    <p className="text-xs text-gray-400 mt-0.5">{b.sub}</p>
  </div>
))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="page py-14">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-gray-900">Shop by Category</h2>
              <p className="text-gray-400 mt-1 text-sm">Find exactly what you are looking for</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.slice(0, 5).map((cat, i) => (
              <Link
                key={cat._id}
                to={`/products?category=${cat.slug}`}
                className={`flex flex-col items-center gap-3 py-8 px-4 rounded-2xl ${CAT_COLORS[i % 5]} hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 text-center`}
              >
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-12 h-12 object-contain rounded-xl" />
                ) : (
                  <div className="w-12 h-12 bg-white/60 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                )}
                <span className="font-semibold text-sm">{cat.name}</span>
                {cat.children?.length > 0 && (
                  <span className="text-xs opacity-60">{cat.children.length} sub-categories</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="page pb-16">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-gray-900">Featured Products</h2>
            <p className="text-gray-400 mt-1 text-sm">Handpicked for you</p>
          </div>
          <Link to="/products?featured=true"
            className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors">
            View all
          </Link>
        </div>

        {featuredLoading ? (
          <GridSkeleton count={8} />
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        ) : (
          <p className="text-center py-16 text-gray-400">No featured products yet.</p>
        )}
      </section>

      {/* COD Banner */}
      <section className="mx-4 sm:mx-6 lg:mx-8 mb-16 bg-gray-900 rounded-3xl px-8 sm:px-12 py-12 sm:py-14 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-display font-bold text-2xl sm:text-3xl text-white mb-2">
            Pay Only Shipping Upfront
          </h3>
          <p className="text-gray-400 max-w-md text-sm leading-relaxed">
     Use Partial Payment — Pay Shipping Charges Now, Rest on Delivery. Shop with Confidence.
          </p>
        </div>
        <Link to="/products"
          className="flex-shrink-0 bg-orange-600 hover:bg-orange-500 text-white font-bold px-8 py-3 rounded-xl transition-colors">
          Start Shopping
        </Link>
      </section>
    </>
  );
}
