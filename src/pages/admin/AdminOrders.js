import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { orderAPI } from '../../services/api';
import { RowSkeleton, Spinner } from '../../components/common/Skeletons';
import Pagination from '../../components/common/Pagination';

const fmt     = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
const LIMIT   = 10;

const STATUSES = ['placed','confirmed','processing','shipped','out_for_delivery','delivered','cancelled','returned'];
const SC = {
  placed:'bg-blue-100 text-blue-700', confirmed:'bg-indigo-100 text-indigo-700',
  processing:'bg-yellow-100 text-yellow-700', shipped:'bg-purple-100 text-purple-700',
  out_for_delivery:'bg-orange-100 text-orange-700', delivered:'bg-green-100 text-green-700',
  cancelled:'bg-red-100 text-red-600', returned:'bg-gray-100 text-gray-600',
};
const PC = {
  pending:'bg-yellow-100 text-yellow-700', partial_paid:'bg-blue-100 text-blue-700',
  paid:'bg-green-100 text-green-700', failed:'bg-red-100 text-red-600',
};

/* ── Quick date preset ────────────────────────────────── */
const today      = () => new Date().toISOString().slice(0, 10);
const daysAgo    = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const monthStart = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); };

const PRESETS = [
  { label: 'Today',       from: today(),       to: today() },
  { label: 'Last 7 days', from: daysAgo(6),    to: today() },
  { label: 'Last 30 days',from: daysAgo(29),   to: today() },
  { label: 'This month',  from: monthStart(),  to: today() },
];

/* ── Order Detail Modal ───────────────────────────────── */
function OrderModal({ order, onClose, onUpdated }) {
  const [status, setStatus] = useState(order.orderStatus);
  const [note,   setNote]   = useState('');
  const [saving, setSaving] = useState(false);

  const update = async () => {
    setSaving(true);
    try {
      await orderAPI.updateStatus(order._id, status, note);
      toast.success('Order updated');
      onUpdated(order._id, status);
      onClose();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="font-semibold text-xl text-gray-900">Order #{order.orderNumber}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* Customer */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Customer</p>
            <p className="font-semibold text-gray-800">{order.user?.name || '—'}</p>
            <p className="text-sm text-gray-500">{order.user?.phone}</p>
          </div>
          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Items</p>
            <div className="space-y-2">
              {(order.items || []).map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full bg-gray-200"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    {item.variantName && <p className="text-xs text-gray-400">{item.variantName}</p>}
                  </div>
                  <p className="text-sm text-gray-500 flex-shrink-0">×{item.quantity}</p>
                  <p className="text-sm font-semibold text-gray-800 flex-shrink-0">{fmt(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Pricing */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pricing</p>
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{fmt(order.pricing?.subtotal)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{fmt(order.pricing?.shippingCharges)}</span></div>
            <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t border-gray-200"><span>Total</span><span>{fmt(order.pricing?.total)}</span></div>
            {order.codAmount > 0 && <div className="flex justify-between text-orange-600 text-xs pt-1"><span>COD Pending</span><span>{fmt(order.codAmount)}</span></div>}
          </div>
          {/* Address */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Shipping Address</p>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p className="font-semibold text-gray-800">{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.addressLine1}{order.shippingAddress?.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}</p>
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}</p>
              <p>Ph: {order.shippingAddress?.phone}</p>
            </div>
          </div>
          {/* Update status */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Update Order Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all capitalize ${
                    status === s ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="Add a note (optional)" className="input text-sm"/>
            <button onClick={update} disabled={saving} className="btn-primary w-full py-2.5">
              {saving ? <Spinner size="sm"/> : 'Update Order'}
            </button>
          </div>
          {/* History */}
          {(order.statusHistory || []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Status History</p>
              <div className="space-y-2.5">
                {[...order.statusHistory].reverse().map((h, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mt-1.5 flex-shrink-0"/>
                    <div>
                      <span className="font-semibold text-gray-700 capitalize">{h.status?.replace(/_/g, ' ')}</span>
                      {h.note && <span className="text-gray-400 ml-2">— {h.note}</span>}
                      <p className="text-xs text-gray-400">{new Date(h.updatedAt).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────── */
export default function AdminOrders() {
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(1);
  const [pagination,   setPagination]   = useState(null);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');
  const [selected,     setSelected]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (statusFilter) params.status   = statusFilter;
      if (search)       params.search   = search;
      if (dateFrom)     params.dateFrom = dateFrom;
      if (dateTo)       params.dateTo   = dateTo;
      const r = await orderAPI.adminGetAll(params);
      setOrders(r.data || []);
      setPagination(r.pagination);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, [page, statusFilter, search, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const handleUpdated = (id, newStatus) =>
    setOrders(prev => prev.map(o => o._id === id ? { ...o, orderStatus: newStatus } : o));

  const applyPreset = (preset) => {
    setDateFrom(preset.from);
    setDateTo(preset.to);
    setPage(1);
  };

  const clearDates = () => { setDateFrom(''); setDateTo(''); setPage(1); };

  const hasDateFilter = dateFrom || dateTo;
  const hasAnyFilter  = search || statusFilter || hasDateFilter;

  return (
    <>
      <Helmet><title>Orders – Admin</title></Helmet>
      {selected && <OrderModal order={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated}/>}

      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900">Orders</h1>
            {pagination && (
              <p className="text-sm text-gray-400 mt-0.5">
                {pagination.total} order{pagination.total !== 1 ? 's' : ''}
                {hasAnyFilter ? ' (filtered)' : ''}
              </p>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">

          {/* ── Filter bar ── */}
          <div className="p-4 border-b border-gray-100 space-y-3 bg-gray-50/50">

            {/* Row 1: search + status */}
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input type="text" placeholder="Search order #..."
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="input pl-9 text-sm w-48"/>
              </div>

              <select value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="input text-sm w-44">
                <option value="">All Statuses</option>
                {STATUSES.map(s => (
                  <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>
                ))}
              </select>

              {hasAnyFilter && (
                <button
                  onClick={() => { setSearch(''); setStatusFilter(''); clearDates(); }}
                  className="text-xs text-gray-400 hover:text-gray-700 underline self-center">
                  Clear all
                </button>
              )}
            </div>

            {/* Row 2: date range */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Presets */}
              <div className="flex gap-1.5 flex-wrap">
                {PRESETS.map(p => {
                  const active = dateFrom === p.from && dateTo === p.to;
                  return (
                    <button key={p.label} onClick={() => applyPreset(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        active
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-orange-400 hover:text-orange-700'
                      }`}>
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom range */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input type="date" value={dateFrom}
                    onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                    className="input text-sm py-1.5 pl-3 pr-2 w-36 text-gray-700"
                    max={dateTo || today()}
                  />
                </div>
                <span className="text-gray-400 text-sm font-medium flex-shrink-0">to</span>
                <div className="relative">
                  <input type="date" value={dateTo}
                    onChange={e => { setDateTo(e.target.value); setPage(1); }}
                    className="input text-sm py-1.5 pl-3 pr-2 w-36 text-gray-700"
                    min={dateFrom}
                    max={today()}
                  />
                </div>
                {hasDateFilter && (
                  <button onClick={clearDates}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Active date filter label */}
            {hasDateFilter && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Showing orders from</span>
                <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                  {dateFrom ? fmtDate(dateFrom + 'T00:00:00') : 'beginning'} — {dateTo ? fmtDate(dateTo + 'T00:00:00') : 'today'}
                </span>
              </div>
            )}
          </div>

          {/* ── Table ── */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-400 tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Order</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Customer</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Date</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-center hidden sm:table-cell">Payment</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={7}><RowSkeleton rows={LIMIT}/></td></tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <div className="space-y-2">
                        <p className="text-gray-400">No orders found</p>
                        {hasAnyFilter && (
                          <button
                            onClick={() => { setSearch(''); setStatusFilter(''); clearDates(); }}
                            className="text-xs text-orange-600 hover:underline font-semibold">
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : orders.map(o => (
                  <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">#{o.orderNumber}</p>
                      <p className="text-xs text-gray-400">{o.items?.length} item(s)</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-sm text-gray-700 font-medium">{o.user?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{o.user?.phone}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500">
                      {fmtDate(o.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-800">{fmt(o.pricing?.total)}</p>
                      {o.codAmount > 0 && <p className="text-xs text-orange-500">COD: {fmt(o.codAmount)}</p>}
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className={`badge text-xs ${PC[o.paymentStatus] || 'bg-gray-100 text-gray-500'} capitalize`}>
                        {o.paymentStatus?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge text-xs ${SC[o.orderStatus] || 'bg-gray-100 text-gray-600'} capitalize`}>
                        {o.orderStatus?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelected(o)}
                        className="text-xs font-semibold text-orange-600 hover:underline">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <Pagination
            page={page}
            pages={pagination?.pages}
            total={pagination?.total}
            limit={LIMIT}
            onChange={(n) => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        </div>
      </div>
    </>
  );
}