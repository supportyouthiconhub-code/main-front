import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { adminAPI, orderAPI } from '../../services/api';
import { Spinner } from '../../components/common/Skeletons';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });

const SC = {
  placed:'bg-blue-100 text-blue-700', confirmed:'bg-indigo-100 text-indigo-700',
  processing:'bg-yellow-100 text-yellow-700', shipped:'bg-purple-100 text-purple-700',
  out_for_delivery:'bg-orange-100 text-orange-700', delivered:'bg-green-100 text-green-700',
  cancelled:'bg-red-100 text-red-600', returned:'bg-gray-100 text-gray-600',
};
const PC = { pending:'bg-yellow-100 text-yellow-700', partial_paid:'bg-blue-100 text-blue-700', paid:'bg-green-100 text-green-700', failed:'bg-red-100 text-red-600' };

/* ── Stat Card ────────────────────────────────────────── */
function StatCard({ label, value, sub, icon, bg, to }) {
  return (
    <Link to={to} className="group card p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 block">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1.5">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
      </div>
    </Link>
  );
}

/* ── Icon helpers ─────────────────────────────────────── */
const Icon = ({ path }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path}/>
  </svg>
);

/* ── Main ─────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Paginated recent orders
  const [orders,     setOrders]     = useState([]);
  const [ordPage,    setOrdPage]    = useState(1);
  const [ordPag,     setOrdPag]     = useState(null);
  const [ordLoading, setOrdLoading] = useState(false);
  const ORD_LIMIT = 8;

  useEffect(() => {
    adminAPI.getDashboard()
      .then(r => setData(r.data))
      .catch(() => setData({}))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setOrdLoading(true);
    orderAPI.adminGetAll({ page: ordPage, limit: ORD_LIMIT })
      .then(r => { setOrders(r.data || []); setOrdPag(r.pagination); })
      .finally(() => setOrdLoading(false));
  }, [ordPage]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Spinner size="xl" />
    </div>
  );

  return (
    <>
      <Helmet><title>Dashboard – Admin</title></Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Revenue" value={fmt(data?.totalRevenue)} sub="from paid orders"
            icon={<Icon path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>}
            bg="bg-green-100 text-green-600" to="/admin/orders"
          />
          <StatCard
            label="Total Orders" value={data?.totalOrders ?? 0}
            sub={`${data?.pendingOrders ?? 0} pending`}
            icon={<Icon path="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>}
            bg="bg-blue-100 text-blue-600" to="/admin/orders"
          />
          <StatCard
            label="Products" value={data?.totalProducts ?? 0} sub="active listings"
            icon={<Icon path="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>}
            bg="bg-purple-100 text-purple-600" to="/admin/products"
          />
          <StatCard
            label="Customers" value={data?.totalUsers ?? 0} sub="registered users"
            icon={<Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>}
            bg="bg-orange-100 text-orange-600" to="/admin/users"
          />
        </div>

        {/* Orders by status */}
        {(data?.ordersByStatus || []).length > 0 && (
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wider">Orders by Status</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {data.ordersByStatus.map(s => (
                <div key={s._id} className={`rounded-xl px-4 py-3 ${SC[s._id] || 'bg-gray-100 text-gray-600'}`}>
                  <p className="text-2xl font-bold">{s.count}</p>
                  <p className="text-xs font-semibold mt-0.5 capitalize opacity-80">
                    {s._id?.replace(/_/g, ' ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom section: orders table + low stock */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Recent Orders — paginated */}
          <div className="xl:col-span-2 card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">All Orders</h2>
              <Link to="/admin/orders" className="text-xs font-semibold text-orange-600 hover:underline">
                Full View
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-400 tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Order</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Customer</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Date</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center hidden sm:table-cell">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ordLoading ? (
                    Array(ORD_LIMIT).fill(0).map((_, i) => (
                      <tr key={i}>
                        {[1,2,3,4,5,6].map(c => (
                          <td key={c} className="px-4 py-3">
                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">No orders yet</td>
                    </tr>
                  ) : orders.map(o => (
                    <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800 text-xs">#{o.orderNumber}</p>
                        <p className="text-xs text-gray-400">{o.items?.length} item(s)</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-xs text-gray-700 font-medium">{o.user?.name || '—'}</p>
                        <p className="text-xs text-gray-400">{o.user?.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-gray-900">{fmt(o.pricing?.total)}</p>
                        {o.codAmount > 0 && <p className="text-[10px] text-orange-500">COD: {fmt(o.codAmount)}</p>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500">
                        {fmtDate(o.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`badge text-[10px] ${SC[o.orderStatus] || 'bg-gray-100 text-gray-600'} capitalize`}>
                          {o.orderStatus?.replace(/_/g,' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <span className={`badge text-[10px] ${PC[o.paymentStatus] || 'bg-gray-100 text-gray-500'} capitalize`}>
                          {o.paymentStatus?.replace(/_/g,' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {ordPag && ordPag.pages > 1 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Showing {((ordPage - 1) * ORD_LIMIT) + 1}–{Math.min(ordPage * ORD_LIMIT, ordPag.total)} of {ordPag.total}
                </p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setOrdPage(p => Math.max(1, p - 1))}
                    disabled={ordPage === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>

                  {Array.from({ length: Math.min(5, ordPag.pages) }, (_, i) => {
                    const n = ordPage <= 3 ? i + 1 : ordPage - 2 + i;
                    if (n < 1 || n > ordPag.pages) return null;
                    return (
                      <button key={n} onClick={() => setOrdPage(n)}
                        className={`w-7 h-7 text-xs font-semibold rounded-lg transition-colors ${
                          n === ordPage ? 'bg-orange-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}>
                        {n}
                      </button>
                    );
                  })}

                  <button onClick={() => setOrdPage(p => Math.min(ordPag.pages, p + 1))}
                    disabled={ordPage === ordPag.pages}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Low Stock */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Low Stock</h2>
              <Link to="/admin/products" className="text-xs font-semibold text-orange-600 hover:underline">
                Manage
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {(data?.lowStockProducts || []).length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-green-600">All stocked up!</p>
                  <p className="text-xs text-gray-400 mt-0.5">No variants below 5 units</p>
                </div>
              ) : (
                data.lowStockProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400 truncate">{p.variants?.name || 'Default variant'}</p>
                    </div>
                    <span className={`badge text-xs flex-shrink-0 ${
                      (p.variants?.stock ?? 0) === 0
                        ? 'bg-red-100 text-red-600'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {p.variants?.stock ?? 0} left
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
