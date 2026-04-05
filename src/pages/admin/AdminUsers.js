import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';
import { RowSkeleton, Spinner } from '../../components/common/Skeletons';
import Pagination from '../../components/common/Pagination';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const LIMIT = 15;
const SC = {
  delivered:'bg-green-100 text-green-700', shipped:'bg-purple-100 text-purple-700',
  placed:'bg-blue-100 text-blue-700', confirmed:'bg-indigo-100 text-indigo-700',
  cancelled:'bg-red-100 text-red-600',
};

/* ── User Modal ───────────────────────────────────────── */
function UserModal({ userId, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getUser(userId).then(r => setData(r.data)).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="font-semibold text-xl text-gray-900">User Details</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-6">
          {loading ? <div className="flex justify-center py-10"><Spinner size="lg"/></div>
          : !data ? <p className="text-center text-gray-400 py-8">Failed to load user</p>
          : (
            <>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-100 text-orange-700 rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0">
                  {data.user?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">{data.user?.name || data.user?.addresses?.[0]?.fullName || 'No name'}</p>
                  {data.user?.phone && <p className="text-gray-500 text-sm">{data.user.phone}</p>}
                  {data.user?.email && <p className="text-gray-400 text-xs">{data.user.email}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[['Role', data.user?.role || '—', 'capitalize'],['Status', data.user?.isActive ? 'Active' : 'Inactive', data.user?.isActive ? 'text-green-600' : 'text-red-500'],['Joined', new Date(data.user?.createdAt).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}), '']].map(([l,v,cls]) => (
                  <div key={l} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{l}</p>
                    <p className={`font-semibold text-sm ${cls}`}>{v}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Saved Addresses ({data.user?.addresses?.length || 0})
                </p>
                {(data.user?.addresses || []).length === 0
                  ? <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-400">No saved addresses</div>
                  : <div className="space-y-3">
                      {data.user.addresses.map(a => (
                        <div key={a._id} className="border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="badge bg-orange-100 text-orange-700 text-xs font-semibold">{a.label}</span>
                            {a.isDefault && <span className="badge bg-green-100 text-green-700 text-xs">Default</span>}
                          </div>
                          <p className="font-semibold text-gray-800 text-sm">{a.fullName}</p>
                          <p className="text-sm text-gray-600 mt-0.5">{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}</p>
                          <p className="text-sm text-gray-600">{a.city}, {a.state} — {a.pincode}</p>
                          <p className="text-xs text-gray-400 mt-1">Ph: {a.phone}</p>
                                 <p className="text-xs text-gray-400 mt-1">Email: {a.email}</p>
                        </div>
                      ))}
                    </div>}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Recent Orders ({data.orders?.length || 0})
                </p>
                {(data.orders || []).length === 0
                  ? <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-400">No orders yet</div>
                  : <div className="space-y-2">
                      {data.orders.slice(0, 5).map(o => (
                        <div key={o._id} className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">#{o.orderNumber}</p>
                            <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800 text-sm">{fmt(o.pricing?.total)}</p>
                            <span className={`badge text-xs ${SC[o.orderStatus]||'bg-gray-100 text-gray-600'} capitalize`}>{o.orderStatus?.replace(/_/g,' ')}</span>
                          </div>
                        </div>
                      ))}
                    </div>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────── */
export default function AdminUsers() {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [pagination, setPagination] = useState(null);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [toggling,   setToggling]   = useState(null);
  const [selUser,    setSelUser]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminAPI.getUsers({ page, limit: LIMIT, search, role: roleFilter });
      console.log("FULL RESPONSE:", r);
      setUsers(r.data || []);
      setPagination(r.pagination);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, [page, search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (id) => {
    setToggling(id);
    try {
      const r = await adminAPI.toggleUser(id);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: r.data.isActive } : u));
      toast.success('User updated');
    } catch (e) { toast.error(e.message); }
    setToggling(null);
  };

  const handleRoleChange = async (id, role) => {
    try {
      await adminAPI.changeRole(id, role);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role } : u));
      toast.success('Role updated');
    } catch (e) { toast.error(e.message); }
  };

  return (
    <>
      <Helmet><title>Users – Admin</title></Helmet>
      {selUser && <UserModal userId={selUser} onClose={() => setSelUser(null)}/>}

      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900">Users</h1>
            {pagination && <p className="text-sm text-gray-400 mt-0.5">{pagination.total} registered users</p>}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
            <input type="text" placeholder="Search by name, phone, email..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input max-w-xs text-sm"/>
            <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="input max-w-[140px] text-sm">
              <option value="">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-400 tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Address</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Joined</th>
                  <th className="px-4 py-3 text-center">Role</th>
                  <th className="px-4 py-3 text-center">Active</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={6}><RowSkeleton rows={LIMIT}/></td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-gray-400">No users found</td></tr>
                ) : users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-orange-100 text-orange-700 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                {(u.name || u.addresses?.[0]?.fullName)?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800">{u.name || u.addresses?.[0]?.fullName || 'No name'}</p>
                          <p className="text-xs text-gray-400">{u.phone || u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {u.addresses?.length > 0 ? (
                        <div>
                          <p className="text-xs text-gray-700 font-medium truncate max-w-[160px]">{u.addresses[0].addressLine1}, {u.addresses[0].city}</p>
                          <p className="text-xs text-gray-400">{u.addresses[0].state} — {u.addresses[0].pincode}</p>
                          {u.addresses.length > 1 && <p className="text-xs text-orange-500">+{u.addresses.length - 1} more</p>}
                        </div>
                      ) : <span className="text-xs text-gray-400">No address</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select value={u.role} onChange={e => handleRoleChange(u._id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleToggle(u._id)} disabled={toggling === u._id || u.role === 'admin'}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${u.isActive ? 'bg-green-500' : 'bg-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                        {toggling === u._id
                          ? <span className="absolute inset-0 flex items-center justify-center"><Spinner size="sm"/></span>
                          : <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition duration-200 ${u.isActive ? 'translate-x-4' : 'translate-x-0'}`}/>}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelUser(u._id)} className="text-xs font-semibold text-orange-600 hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pages={pagination?.pages} total={pagination?.total} limit={LIMIT} onChange={setPage}/>
        </div>
      </div>
    </>
  );
}
