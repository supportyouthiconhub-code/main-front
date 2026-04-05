import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { toggleCart } from '../../redux/slices/uiSlice';
import { selectCartCount, wipeCart } from '../../redux/slices/cartSlice';

export default function Navbar() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { pathname, search: locationSearch } = useLocation();
  const { user, token }    = useSelector(s => s.auth);
  const { categories }     = useSelector(s => s.products);
  const cartCount          = useSelector(selectCartCount);
  const { store_name }     = useSelector(s => s.settings);

  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [userMenu,  setUserMenu]  = useState(false);
  const [search,    setSearch]    = useState('');

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  // Keep navbar search input in sync with URL ?search= param
  useEffect(() => {
    const params = new URLSearchParams(locationSearch);
    const q = params.get('search') || '';
    setSearch(q);
  }, [locationSearch]);

  useEffect(() => { setMenuOpen(false); setUserMenu(false); }, [pathname]);

  const doSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    // Navigate preserving the search term in URL — ProductList reads it from there
    navigate(`/products?search=${encodeURIComponent(q)}`);
    // Do NOT clear search so user can see/edit what they typed
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(wipeCart());
    navigate('/');
  };

  // Shorten name for logo initial — first letter of first word
  const logoLetter = (store_name || 'Y').charAt(0).toUpperCase();
  const isAdmin    = user?.role === 'admin';

  return (
    <header className={`sticky top-0 z-40 bg-white transition-shadow ${scrolled ? 'shadow-md' : 'border-b border-gray-100'}`}>
      <div className="page">
        <div className="flex items-center h-16 gap-3">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 mr-2">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">{logoLetter}</span>
            </div>
          <span className="font-sans font-bold text-lg text-gray-900 hidden sm:block leading-tight">
  {/* {store_name}
   */}
   Youth Icon Hub
</span>
          </Link>

          {/* Desktop categories — root only */}
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            <Link to="/products"
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors whitespace-nowrap">
              All Products
            </Link>
            {categories
              .filter(c => !c.parent && c.level === 0)
              .map(cat => (
                <Link key={cat._id} to={`/products?category=${cat.slug}`}
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors whitespace-nowrap">
                  {cat.name}
                </Link>
              ))}
          </nav>

          {/* Search */}
          {pathname.startsWith('/products') && (

          <form onSubmit={doSearch} className="hidden md:flex flex-1 max-w-sm">
            <div className="relative w-full">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
          </form>
          )}
          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">

            {/* Cart */}
            <button onClick={() => dispatch(toggleCart())}
              className="relative p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* User menu */}
            {token ? (
              <div className="relative">
                <button onClick={() => setUserMenu(v => !v)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-7 h-7 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || ''}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[80px] truncate">
                    {user?.name?.split(' ')[0] || 'Account'}
                  </span>
                  {isAdmin && (
                    <span className="hidden sm:block text-[9px] font-bold bg-orange-600 text-white px-1.5 py-0.5 rounded-full leading-none">
                      ADMIN
                    </span>
                  )}
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>

                {userMenu && (
                  <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-2xl shadow-lg border border-gray-100 py-1.5 z-50">
                    {/* Admin panel link — only for admins */}
                    {isAdmin && (
                      <>
                        <Link to="/admin"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-50 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
                          </svg>
                          Admin Panel
                        </Link>
                        <div className="border-t border-gray-100 my-1" />
                      </>
                    )}
                    <Link to="/orders"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                      </svg>
                      My Orders
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary text-sm px-4 py-2">Login</Link>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(v => !v)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl ml-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden pb-4 border-t border-gray-100 pt-3 space-y-1">
            {pathname.startsWith('/products') && (

            <form onSubmit={doSearch} className="mb-3">
              <div className="relative">
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all"/>
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
            </form>
            )}

            <Link to="/products" className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl">All Products</Link>
            {categories
              .filter(c => !c.parent && c.level === 0)
              .map(cat => (
                <Link key={cat._id} to={`/products?category=${cat.slug}`}
                  className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl">
                  {cat.name}
                </Link>
              ))}

            <div className="border-t border-gray-100 pt-2 mt-2">
              {token ? (
                <>
                  {isAdmin && (
                    <Link to="/admin" className="block px-3 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-50 rounded-xl">
                      Admin Panel
                    </Link>
                  )}
                  <Link to="/orders" className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-xl">My Orders</Link>
                  <button onClick={handleLogout}
                    className="w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl">
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/login" className="block px-3 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-50 rounded-xl">Login / Sign Up</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}