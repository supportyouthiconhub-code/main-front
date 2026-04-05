import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe, logout } from './redux/slices/authSlice';
import { fetchCategories } from './redux/slices/productSlice';
import { wipeCart, syncCartAfterLogin } from './redux/slices/cartSlice';
import { fetchPublicSettings } from './redux/slices/settingsSlice';
import FloatingButtons from "./components/common/FloatingButtons";
// Layouts
import Layout      from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';

// Pages
import Home            from './pages/Home';
import ProductList     from './pages/ProductList';
import ProductDetail   from './pages/ProductDetail';
import CartPage        from './pages/CartPage';
import CheckoutPage    from './pages/CheckoutPage';
import LoginPage       from './pages/LoginPage';
import AdminLoginPage  from './pages/AdminLoginPage';
import OrdersPage      from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import OrderSuccess    from './pages/OrderSuccess';
import OrderFailure    from './pages/OrderFailure';
import NotFound        from './pages/NotFound';

// Admin pages
import AdminDashboard   from './pages/admin/AdminDashboard';
import AdminProducts    from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminCategories  from './pages/admin/AdminCategories';
import AdminOrders      from './pages/admin/AdminOrders';
import AdminUsers       from './pages/admin/AdminUsers';
import AdminSettings    from './pages/admin/AdminSettings';

/* ── Scroll to top on every route change ────────────────── */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

/* ── Full-screen loader ──────────────────────────────────── */
const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-10 h-10 border-4 border-gray-200 border-t-orange-600 rounded-full animate-spin" />
  </div>
);

/* ── Route Guards ────────────────────────────────────────── */
const Private = ({ children }) => {
  const { token, initialized } = useSelector(s => s.auth);
  if (!initialized) return <Loader />;
  return token ? children : <Navigate to="/login" replace />;
};

const AdminOnly = ({ children }) => {
  const { token, user, initialized } = useSelector(s => s.auth);
  if (!initialized) return <Loader />;
  if (!token)                 return <Navigate to="/admin/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/"           replace />;
  return children;
};

const CustomerGuest = ({ children }) => {
  const { token, user, initialized } = useSelector(s => s.auth);
  if (!initialized) return <Loader />;
  if (token && user?.role === 'user')  return <Navigate to="/"      replace />;
  if (token && user?.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
};

const AdminGuest = ({ children }) => {
  const { token, user, initialized } = useSelector(s => s.auth);
  if (!initialized) return <Loader />;
  if (token && user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (token && user?.role === 'user')  return <Navigate to="/"      replace />;
  return children;
};

/* ── App ─────────────────────────────────────────────────── */
export default function App() {
  const dispatch = useDispatch();
  const { token, initialized } = useSelector(s => s.auth);
  const prevTokenRef = React.useRef(token); // track previous token value

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchPublicSettings());   // load store name, email, phone
    if (token) dispatch(fetchMe());
    if (token) dispatch(syncCartAfterLogin());
  }, []); // eslint-disable-line

  // Only sync on actual login (token goes null → value), NOT on page refresh
  useEffect(() => {
    const prevToken = prevTokenRef.current;
    prevTokenRef.current = token;

    if (token && !prevToken && initialized) {
      // Token just appeared = fresh login → sync guest cart to DB
      dispatch(syncCartAfterLogin());
    }
    if (!token && prevToken && initialized) {
      // Token just disappeared = logout → wipe cart
      dispatch(wipeCart());
    }
  }, [token, initialized]); // eslint-disable-line




  return (
    <BrowserRouter>
      {/* Scroll to top on every page change */}
      <ScrollToTop />

      <Routes>
        {/* ── Storefront ── */}
        <Route element={<Layout />}>
          <Route path="/"               element={<Home />} />
          <Route path="/products"       element={<ProductList />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/cart"           element={<CartPage />} />
          <Route path="/login" element={<CustomerGuest><LoginPage /></CustomerGuest>} />
          <Route path="/order-success/:orderId" element={<OrderSuccess />} />
          <Route path="/order-failure/:orderId" element={<OrderFailure />} />
          <Route path="/checkout" element={<Private><CheckoutPage /></Private>} />
          <Route path="/orders"   element={<Private><OrdersPage /></Private>} />
          <Route path="/orders/:id" element={<Private><OrderDetailPage /></Private>} />
        </Route>

        {/* ── Admin login ── */}
        <Route path="/admin/login" element={<AdminGuest><AdminLoginPage /></AdminGuest>} />

        {/* ── Admin panel ── */}
        <Route path="/admin" element={<AdminOnly><AdminLayout /></AdminOnly>}>
          <Route index                    element={<AdminDashboard />} />
          <Route path="products"          element={<AdminProducts />} />
          <Route path="products/new"      element={<AdminProductForm />} />
          <Route path="products/:id/edit" element={<AdminProductForm />} />
          <Route path="categories"        element={<AdminCategories />} />
          <Route path="orders"            element={<AdminOrders />} />
          <Route path="users"             element={<AdminUsers />} />
          <Route path="settings"          element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
<RouteAwareFloatingButtons />
    </BrowserRouter>
  );
}

function RouteAwareFloatingButtons() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  if (isAdminRoute) return null;

  return <FloatingButtons />;
}
