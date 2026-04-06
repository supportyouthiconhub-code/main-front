import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { orderAPI, settingsAPI } from '../services/api';
import { PageLoader, Spinner } from '../components/common/Skeletons';

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const STATUS_COLORS = { placed:'bg-blue-100 text-blue-700', confirmed:'bg-indigo-100 text-indigo-700', processing:'bg-yellow-100 text-yellow-700', shipped:'bg-purple-100 text-purple-700', out_for_delivery:'bg-orange-100 text-orange-700', delivered:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-600', returned:'bg-gray-100 text-gray-600' };

/* ── Order Success ────────────────────────────────────── */
export function OrderSuccess() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [cms, setCms]     = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      orderAPI.getById(orderId).then(r => setOrder(r.data)),
      settingsAPI.getPublic().then(r => setCms(r.data)),
    ]).finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <PageLoader />;

  return (
    <>
      <Helmet><title>Order Confirmed – Youth Icon Hub</title></Helmet>
      <div className="page py-16 max-w-xl mx-auto text-center">
        <div className="card p-10 space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl text-gray-900">{cms?.success_page?.title || 'Order Confirmed! 🎉'}</h1>
            <p className="text-gray-500 mt-2 text-sm">{cms?.success_page?.message || 'Thank you for your purchase! Your order has been placed successfully.'}</p>
          </div>
          {order && (
            <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Order No.</span><span className="font-bold text-gray-900">#{order.orderNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className={`badge ${order.paymentStatus==='paid'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'}`}>{order.paymentStatus==='paid'?'Paid':'Partial Paid'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-bold text-gray-900">{fmt(order.pricing?.total)}</span></div>
              {order.codAmount > 0 && <div className="flex justify-between"><span className="text-gray-500">COD Amount</span><span className="font-semibold text-orange-600">{fmt(order.codAmount)}</span></div>}
            </div>
          )}
          {cms?.success_page?.whatsappLink && (
            <a href={cms.success_page.whatsappLink} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
              💬 Join WhatsApp Group
            </a>
          )}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link to={`/orders/${orderId}`} className="btn-secondary flex-1">View Order</Link>
            <Link to="/products" className="btn-primary flex-1">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Order Failure ────────────────────────────────────── */
export function OrderFailure() {
  const [cms, setCms] = useState({});
  useEffect(() => { settingsAPI.getPublic().then(r => setCms(r.data)); }, []);

  return (
    <>
      <Helmet><title>Payment Failed – Youth Icon Hub</title></Helmet>
      <div className="page py-16 max-w-xl mx-auto text-center">
        <div className="card p-10 space-y-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl text-gray-900">{cms?.failure_page?.title || 'Payment Failed'}</h1>
            <p className="text-gray-500 mt-2 text-sm">{cms?.failure_page?.message || "We couldn't process your payment. Please try again."}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/checkout" className="btn-primary flex-1">Try Again</Link>
            <Link to="/orders" className="btn-secondary flex-1">My Orders</Link>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Orders List ──────────────────────────────────────── */
export function OrdersPage() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getAll().then(r => setOrders(r.data || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <>
      <Helmet><title>My Orders – Youth Icon Hub</title></Helmet>
      <div className="page py-8 sm:py-12 max-w-4xl mx-auto">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 mb-8">My Orders</h1>
        {orders.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="text-5xl">📦</div>
            <p className="text-gray-500">No orders yet.</p>
            <Link to="/products" className="btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
          {orders.map(order => {
   const displayStatus =
    order.paymentStatus === 'failed'
      ? 'cancelled'
      : order.orderStatus;

  return (
              <Link key={order._id} to={`/orders/${order._id}`}
                className="card p-5 block hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">#{order.orderNumber}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                  </div>
                  <span className={`badge ${STATUS_COLORS[order.orderStatus]||'bg-gray-100 text-gray-600'} capitalize`}>  {displayStatus.replace(/_/g,' ')}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-sm text-gray-500">{order.items?.length} item(s)</p>
                  <p className="font-bold text-gray-900">{fmt(order.pricing?.total)}</p>
                </div>
              </Link>
        );
})}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Order Detail ─────────────────────────────────────── */
export function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { orderAPI.getById(id).then(r => setOrder(r.data)).finally(() => setLoading(false)); }, [id]);

  if (loading) return <PageLoader />;
  if (!order) return <div className="page py-24 text-center text-gray-500">Order not found</div>;

  return (
    <>
      <Helmet><title>Order #{order.orderNumber} – Youth Icon Hub</title></Helmet>
      <div className="page py-8 sm:py-12 max-w-4xl mx-auto">
        <Link to="/orders" className="text-sm text-orange-600 hover:underline mb-6 inline-block">← Back to Orders</Link>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900">Order #{order.orderNumber}</h1>
            <p className="text-gray-400 text-sm mt-1">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
          </div>
          <span className={`badge text-sm px-3 py-1 ${STATUS_COLORS[order.orderStatus]||'bg-gray-100 text-gray-600'} capitalize`}>{order.orderStatus?.replace(/_/g,' ')}</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {order.items.map((item,i) => (
              <div key={i} className="card p-4 flex gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.image?<img src={item.image} alt="" className="w-full h-full object-cover"/>:<div className="w-full h-full bg-gray-200"/>}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{item.name}</p>
                  {item.variantName && <p className="text-xs text-gray-400">{item.variantName}</p>}
                  <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity} × {fmt(item.price)}</p>
                </div>
                <p className="font-bold text-gray-900 flex-shrink-0">{fmt(item.price*item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Payment</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{fmt(order.pricing.subtotal)}</span></div>
                <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{fmt(order.pricing.shippingCharges)}</span></div>
                <div className="flex justify-between font-bold pt-2 border-t border-gray-100 text-gray-900"><span>Total</span><span>{fmt(order.pricing.total)}</span></div>
                {order.codAmount > 0 && <div className="flex justify-between text-orange-600 text-xs"><span>COD Pending</span><span>{fmt(order.codAmount)}</span></div>}
              </div>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Delivery Address</h3>
              <div className="text-sm text-gray-600 space-y-0.5">
                <p className="font-semibold text-gray-800">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}</p>
                <p>📞 {order.shippingAddress.phone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── 404 ──────────────────────────────────────────────── */
export function NotFound() {
  const navigate = useNavigate();
  return (
    <>
      <Helmet><title>404 – Page Not Found</title></Helmet>
      <div className="page py-32 text-center space-y-5">
        <p className="text-8xl font-display font-bold text-gray-200">404</p>
        <div><h1 className="font-display font-bold text-2xl text-gray-800">Page not found</h1><p className="text-gray-500 mt-2">The page you're looking for doesn't exist.</p></div>
        <button onClick={() => navigate('/')} className="btn-primary">Go Home</button>
      </div>
    </>
  );
}

export default OrdersPage;
