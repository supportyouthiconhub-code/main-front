import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { settingsAPI, authAPI } from '../../services/api';
import { Spinner } from '../../components/common/Skeletons';
import { updateSettings } from '../../redux/slices/settingsSlice';

const TABS = [
  { id: 'general',  label: 'Store'    },
  // { id: 'shipping', label: 'Shipping' },
  { id: 'cms',      label: 'CMS Pages'},
  // { id: 'razorpay', label: 'Razorpay' },
  { id: 'password', label: 'Password' },
];

const Card = ({ title, subtitle, children }) => (
  <div className="card p-6 space-y-4 max-w-full">
    <div>
      <h3 className="font-semibold text-gray-800">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

/* ── General ─────────────────────────────────────────── */
function TabGeneral() {
  const dispatch  = useDispatch();
  const [form,    setForm]    = useState({ store_name:'Youth Icon Hub', store_email:'', store_phone:'' });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    settingsAPI.getAll().then(r => setForm(f => ({ ...f, ...(r.data?.general || {}) }))).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await settingsAPI.bulkUpdate(Object.entries(form).map(([key, value]) => ({ key, value })), 'general');
      // Update Redux store immediately so Navbar/Footer update without page refresh
      dispatch(updateSettings({ store_name: form.store_name, store_email: form.store_email, store_phone: form.store_phone }));
      toast.success('Settings saved');
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-10"><Spinner size="lg"/></div>;
  return (
    <div className="space-y-5">
      <Card title="Store Information" subtitle="Basic details shown to customers">
        {[['store_name','Store Name','Youth Icon Hub'],['store_email','Support Email','support@youthfashionhouse.com'],['store_phone','Support Phone','+91 9876543210']].map(([k,l,ph]) => (
          <div key={k}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{l}</label>
            <input type="text" value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
              placeholder={ph} className="input"/>
          </div>
        ))}
      </Card>
      <button onClick={save} disabled={saving} className="btn-primary">
        {saving ? <Spinner size="sm"/> : 'Save Settings'}
      </button>
    </div>
  );
}

/* ── Shipping ─────────────────────────────────────────── */
function TabShipping() {
  const [threshold,   setThreshold]   = useState('1500');
  const [flatRate,    setFlatRate]    = useState('100');
  const [percentRate, setPercentRate] = useState('10');
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    settingsAPI.getAll().then(r => {
      const s = r.data?.shipping || {};
      if (s.shipping_threshold    != null) setThreshold(String(s.shipping_threshold));
      if (s.shipping_flat_rate    != null) setFlatRate(String(s.shipping_flat_rate));
      if (s.shipping_percent_rate != null) setPercentRate(String(s.shipping_percent_rate));
    }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    const t = Number(threshold), f = Number(flatRate), p = Number(percentRate);
    if (isNaN(t)||t<0) { toast.error('Invalid threshold'); return; }
    if (isNaN(f)||f<0) { toast.error('Invalid flat rate'); return; }
    if (isNaN(p)||p<0||p>100) { toast.error('Percent must be 0–100'); return; }
    setSaving(true);
    try {
      await settingsAPI.updateShipping(t, f, p);
      toast.success('Shipping rules saved');
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-10"><Spinner size="lg"/></div>;

  const previewRows = [500, 1000, 1500, 2000, 5000];
  const calcShipping = (sub) => {
    const t = Number(threshold)||1500, f = Number(flatRate)||100, p = Number(percentRate)||10;
    return sub <= t ? f : Math.round(sub * (p/100));
  };

  return (
    <div className="space-y-5">
      <Card title="Shipping Rules" subtitle="How shipping cost is calculated based on order subtotal">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Threshold Amount (₹)</label>
          <input type="number" value={threshold} min="0" onChange={e => setThreshold(e.target.value)} className="input"/>
          <p className="text-xs text-gray-400 mt-1">Orders at or below this get the flat rate; above get the percentage rate</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-4">
          <p className="text-sm font-semibold text-blue-800">Configure Rates</p>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"/>
            <div className="flex-1">
              <p className="text-xs font-semibold text-blue-700 mb-1.5">Subtotal &le; ₹{threshold||'1500'} — Flat Rate</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-600">₹</span>
                <input type="number" value={flatRate} min="0" onChange={e => setFlatRate(e.target.value)}
                  className="w-28 px-3 py-1.5 text-sm border border-blue-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30"/>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"/>
            <div className="flex-1">
              <p className="text-xs font-semibold text-orange-700 mb-1.5">Subtotal &gt; ₹{threshold||'1500'} — Percentage Rate</p>
              <div className="flex items-center gap-2">
                <input type="number" value={percentRate} min="0" max="100" onChange={e => setPercentRate(e.target.value)}
                  className="w-24 px-3 py-1.5 text-sm border border-orange-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/30"/>
                <span className="text-sm font-medium text-orange-600">%</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Preview table */}
      <div className="card p-6 max-w-lg">
        <h3 className="font-semibold text-gray-800 mb-4">Live Preview</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Order Subtotal</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Shipping Cost</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Rule Applied</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {previewRows.map(sub => {
              const sh = calcShipping(sub);
              const isFlat = sub <= (Number(threshold)||1500);
              return (
                <tr key={sub} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-800">₹{sub.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 font-bold text-gray-900">₹{sh.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2">
                    <span className={`badge text-xs ${isFlat ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                      {isFlat ? `Flat ₹${flatRate}` : `${percentRate}%`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary">
        {saving ? <Spinner size="sm"/> : 'Save Shipping Rules'}
      </button>
    </div>
  );
}

/* ── CMS Pages ───────────────────────────────────────── */
function TabCMS() {
  const [success, setSuccess] = useState({ title:'', message:'', whatsappLink:'' });
  const [failure, setFailure] = useState({ title:'', message:'' });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    settingsAPI.getAll().then(r => {
      const cms = r.data?.cms || {};
      if (cms.success_page) { const v = typeof cms.success_page === 'string' ? JSON.parse(cms.success_page) : cms.success_page; setSuccess(v); }
      if (cms.failure_page) { const v = typeof cms.failure_page === 'string' ? JSON.parse(cms.failure_page) : cms.failure_page; setFailure(v); }
    }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await settingsAPI.bulkUpdate([{ key:'success_page', value:success }, { key:'failure_page', value:failure }], 'cms');
      toast.success('CMS pages saved');
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-10"><Spinner size="lg"/></div>;

  return (
    <div className="space-y-5">
      <Card title="Order Success Page" subtitle="Shown to customer after successful payment">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
          <input type="text" value={success.title} onChange={e => setSuccess(p => ({ ...p, title: e.target.value }))}
            placeholder="Order Confirmed!" className="input"/>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message</label>
          <textarea value={success.message} onChange={e => setSuccess(p => ({ ...p, message: e.target.value }))}
            rows={3} className="input resize-none" placeholder="Thank you for your purchase!"/>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            WhatsApp Group Link <span className="text-xs font-normal text-gray-400">(optional)</span>
          </label>
          <input type="url" value={success.whatsappLink} onChange={e => setSuccess(p => ({ ...p, whatsappLink: e.target.value }))}
            placeholder="https://chat.whatsapp.com/..." className="input"/>
        </div>
      </Card>

      <Card title="Payment Failure Page" subtitle="Shown when payment fails or is cancelled">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
          <input type="text" value={failure.title} onChange={e => setFailure(p => ({ ...p, title: e.target.value }))}
            placeholder="Payment Failed" className="input"/>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message</label>
          <textarea value={failure.message} onChange={e => setFailure(p => ({ ...p, message: e.target.value }))}
            rows={3} className="input resize-none" placeholder="We couldn't process your payment..."/>
        </div>
      </Card>

      <button onClick={save} disabled={saving} className="btn-primary">
        {saving ? <Spinner size="sm"/> : 'Save CMS Pages'}
      </button>
    </div>
  );
}

/* ── Razorpay ─────────────────────────────────────────── */
function TabRazorpay() {
  const [mode,    setMode]    = useState('test');
  const [keyInfo, setKeyInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    settingsAPI.getRazorpay().then(r => { setMode(r.data.mode || 'test'); setKeyInfo(r.data); }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try { await settingsAPI.updateRazorpayMode(mode); toast.success(`Switched to ${mode.toUpperCase()} mode`); }
    catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-10"><Spinner size="lg"/></div>;

  return (
    <div className="space-y-5">
      <Card title="Razorpay Configuration" subtitle="Switch between test and live payment modes">
        <div className="grid grid-cols-2 gap-3">
          {[{v:'test',t:'Test Mode',d:'For development & testing'},{v:'live',t:'Live Mode',d:'For real customer payments'}].map(o => (
            <label key={o.v} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${mode===o.v?'border-orange-500 bg-orange-50':'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="mode" value={o.v} checked={mode===o.v} onChange={() => setMode(o.v)} className="accent-orange-600 mt-0.5"/>
              <div><p className="font-semibold text-sm text-gray-800">{o.t}</p><p className="text-xs text-gray-400 mt-0.5">{o.d}</p></div>
            </label>
          ))}
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Active Key ID</p>
          <p className="font-mono text-sm text-gray-700 break-all">
            {mode==='test' ? keyInfo.testKeyId||'rzp_test_...' : keyInfo.liveKeyId||'rzp_live_...'}
          </p>
        </div>
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${mode==='live'?'bg-green-50 border-green-200':'bg-blue-50 border-blue-200'}`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${mode==='live'?'bg-green-500':'bg-blue-500'}`}/>
          <p className={`text-sm font-semibold ${mode==='live'?'text-green-700':'text-blue-700'}`}>
            Currently in <strong>{mode.toUpperCase()}</strong> mode
          </p>
        </div>
        {mode==='live' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-bold text-red-700 mb-1">Live Mode Warning</p>
            <p className="text-sm text-red-600">Real money will be charged to customers. Test thoroughly before going live.</p>
          </div>
        )}
      </Card>
      <button onClick={save} disabled={saving} className="btn-primary">
        {saving ? <Spinner size="sm"/> : `Switch to ${mode.toUpperCase()} Mode`}
      </button>
    </div>
  );
}

/* ── Password ─────────────────────────────────────────── */
function TabPassword() {
  const [form, setForm] = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [saving, setSaving] = useState(false);
  const [show,   setShow]   = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (form.newPassword !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await authAPI.adminChangePassword(form.currentPassword, form.newPassword);
      toast.success('Password changed successfully');
      setForm({ currentPassword:'', newPassword:'', confirm:'' });
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const EyeIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {show
        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
        : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></>
      }
    </svg>
  );

  return (
    <div className="space-y-5">
      <Card title="Change Password" subtitle="Update your admin panel password">
        {[['currentPassword','Current Password'],['newPassword','New Password'],['confirm','Confirm New Password']].map(([k,l]) => (
          <div key={k}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{l}</label>
            <div className="relative">
              <input type={show?'text':'password'} value={form[k]} onChange={e => set(k, e.target.value)}
                className="input pr-10" autoComplete="new-password"/>
              <button type="button" onClick={() => setShow(v => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
                <EyeIcon/>
              </button>
            </div>
          </div>
        ))}
      </Card>
      <button onClick={save} disabled={saving || !form.currentPassword || !form.newPassword || !form.confirm} className="btn-primary">
        {saving ? <Spinner size="sm"/> : 'Change Password'}
      </button>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────── */
export default function AdminSettings() {
  const [tab, setTab] = useState('general');
  return (
    <>
      <Helmet><title>Settings – Admin</title></Helmet>
      <div className="space-y-6">
        <h1 className="font-display font-bold text-2xl text-gray-900">Settings</h1>
        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
                tab===t.id ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        <div>
          {tab==='general'  && <TabGeneral/>}
          {tab==='shipping' && <TabShipping/>}
          {tab==='cms'      && <TabCMS/>}
          {tab==='razorpay' && <TabRazorpay/>}
          {tab==='password' && <TabPassword/>}
        </div>
      </div>
    </>
  );
}
