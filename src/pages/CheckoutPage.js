import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { fetchCart, clearAll } from '../redux/slices/cartSlice';
import { saveAndSelectAddress,updateAddress } from '../redux/slices/authSlice';
import { orderAPI, paymentAPI } from '../services/api';
import { Spinner } from '../components/common/Skeletons';

const fmt   = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const SHIPPING = 100;

const loadRzp = () => new Promise(res => {
  if (window.Razorpay) return res(true);
  const s = document.createElement('script');
  s.src     = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload  = () => res(true);
  s.onerror = () => res(false);
  document.body.appendChild(s);
});

const EMPTY_ADDR = {
  fullName: '', phone: '', addressLine1: '', addressLine2: '',
  city: '', state: '', pincode: '', label: 'Home', email: '',
};

const ADDR_FIELDS = [
  { key: 'fullName',     label: 'Full Name',             ph: 'John Doe',             full: false, required: true  },
  { key: 'phone',        label: 'Phone Number',          ph: '9876543210',           full: false, required: true  },
  { key: 'addressLine1', label: 'Address Line 1',        ph: 'House / Flat, Street', full: true,  required: true  },
  { key: 'addressLine2', label: 'Address Line 2',        ph: 'Landmark (optional)',  full: true,  required: false },
  { key: 'city',         label: 'City',                  ph: 'Mumbai',               full: false, required: true  },
  { key: 'state',        label: 'State',                 ph: 'Maharashtra',          full: false, required: true  },
  { key: 'pincode',      label: 'Pincode',               ph: '400001',               full: false, required: true  },
  { key: 'email', label: 'Email', ph: 'example@gmail.com', full: false, required: false },
];

const LABEL_OPTS = ['Home', 'Work', 'Other'];

export default function CheckoutPage() {
  const navigate = useDispatch();
  const dispatch = useDispatch();
  const nav      = useNavigate();

  const { user }  = useSelector(s => s.auth);
  const { items, subtotal, shippingCharges, total } = useSelector(s => s.cart);
const [editAddrId, setEditAddrId] = useState(null);
  const [payType,   setPayType]   = useState('full');
  const [selAddr,   setSelAddr]   = useState(null);   // _id of selected saved address
  const [showNew,   setShowNew]   = useState(false);  // showing new-address form?
  const [newAddr,   setNewAddr]   = useState({ ...EMPTY_ADDR });
  const [saveAddr,  setSaveAddr]  = useState(true);   // save new address to profile?
  const [placing,   setPlacing]   = useState(false);

  // Fetch fresh cart on mount
  useEffect(() => { dispatch(fetchCart()); }, [dispatch]);

  // Auto-select default address or show new form if no addresses
  useEffect(() => {
    if (!user) return;
    if (user.addresses?.length > 0) {
      const def = user.addresses.find(a => a.isDefault) || user.addresses[0];
      setSelAddr(def._id);
      setShowNew(false);
    } else {
      setSelAddr(null);
      setShowNew(true);
    }
  }, [user]);



const SHIPPING = payType === 'full' ? 0 : 100;
const sh = SHIPPING;

// ✅ total for FULL (unchanged)
const finalTotal = subtotal + sh;

// ✅ ALWAYS calculate partial using COD shipping (fixed ₹100)
const partialBaseTotal = subtotal + 100;

const partialAmount =
  subtotal <= 1500
    ? Math.min(100, partialBaseTotal)
    : Math.round(partialBaseTotal * 0.1);

const codAmount = partialBaseTotal - partialAmount;

// ✅ then decide based on payType
const online = payType === 'full' ? finalTotal : partialAmount;
const cod    = payType === 'full' ? 0 : (finalTotal - partialAmount);

const tot = finalTotal;
const fullTotal = subtotal; 

  // Get the address that will be used for the order
  const getOrderAddress = () => {
    if (!showNew && selAddr) {
      const saved = user?.addresses?.find(a => a._id === selAddr);
      if (saved) return {
        fullName:     saved.fullName,
        phone:        saved.phone,
        addressLine1: saved.addressLine1,
        addressLine2: saved.addressLine2 || '',
        city:         saved.city,
        state:        saved.state,
        pincode:      saved.pincode,
          email: saved.email || user?.email || '' ,
      };
    }
    return newAddr;
  };
  const addrToUse = getOrderAddress();
const validateAddress = (a) => {
  const required = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];

  const isValid = required.every(k => a[k]?.trim());

  // const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email);

  // return isValid && emailValid;
  return isValid ;
};
  const place = async () => {
  

    if (!validateAddress(addrToUse)) {
      toast.error('Please fill all required address fields');
      return;
    }

    setPlacing(true);
    try {
      // ── Save new address to profile if checkbox is ticked ──
      let finalAddr = addrToUse;
    if (showNew && saveAddr) {
if (editAddrId) {
  const res = await dispatch(updateAddress({
    id: editAddrId,
    data: newAddr
  })).unwrap();

  const updated = res.addresses.find(a => a._id === editAddrId);
  if (updated) {
    setSelAddr(updated._id);
  }

  toast.success('Address updated');
} else {
    // CREATE new address
    const res = await dispatch(saveAndSelectAddress({
      ...newAddr,
      isDefault: !user?.addresses?.length,
    })).unwrap();

    toast.success('Address saved');
  }
}

      // ── Place order ──
      const orderRes = await orderAPI.place({
        shippingAddress: finalAddr,
        paymentType:     payType,
          email: finalAddr.email 
      });
      const order = orderRes.data;

      // ── Initialise Razorpay ──
      const keyRes = await paymentAPI.getKey();
      await new Promise(res => setTimeout(res, 300));
      const rpRes  = await paymentAPI.createOrder(order._id);
      const rpData = rpRes.data;

      const loaded = await loadRzp();
      if (!loaded) {
        toast.error('Failed to load payment gateway');
        setPlacing(false);
        return;
      }
// ✅ ADD THIS ABOVE

      const rzp = new window.Razorpay({
        key:         keyRes.key,
        amount:      rpData.amount,
        currency:    rpData.currency,
        name:        '',
        description: payType === 'partial'
          ? `Shipping for Order ${rpData.orderNumber}`
          : `Order ${rpData.orderNumber}`,
        order_id: rpData.razorpayOrderId,
        config: {
    display: {
      blocks: {
        offers: {
          name: "Available Offers",
          instruments: [
            {
              method: "card"
            },
            {
              method: "netbanking"
            },
            {
              method: "wallet"
            },
            {
              method: "upi"
            }
          ]
        }
      },
      sequence: ["block.offers"],
      preferences: {
        show_default_blocks: true
      }
    }
  },

prefill: { 
  name: addrToUse.fullName || user?.name || '',
  contact: addrToUse.phone || user?.phone || '',
  email: addrToUse.email || user?.email || '' // ✅ FIX
},
       theme:    { color: '#ea580c' },
        handler: async (resp) => {
          try {
            await paymentAPI.verify({
              razorpayOrderId:  resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
              orderId: order._id,
            });
            dispatch(clearAll());
            nav(`/order-success/${order._id}`);
          } catch {
            nav(`/order-failure/${order._id}`);
          }
        },
        modal: {
          ondismiss: async () => {
            await paymentAPI.failure({
              razorpayOrderId: rpData.razorpayOrderId,
              orderId: order._id,
              error: { description: 'Dismissed' },
            });
            nav(`/order-failure/${order._id}`);
          },
        },
      });

      rzp.open();
    } catch (e) {
      toast.error(e.message || 'Could not place order');
    }
    setPlacing(false);
  };
  

  if (!items?.length) return (
    <div className="page py-24 text-center space-y-4">
      <p className="text-gray-500 text-lg">Your cart is empty.</p>
      <button onClick={() => nav('/products')} className="btn-primary">Shop Now</button>
    </div>
  );

  return (
    <>
      <Helmet><title>Checkout – Youth Icon Hub</title></Helmet>

      <div className="page py-8 sm:py-12">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            {/* ── Step 1: Delivery Address ───────────────────── */}
            <div className="card p-6">
              <h2 className="font-semibold text-lg text-gray-900 mb-5 flex items-center gap-2.5">
                <span className="w-7 h-7 bg-orange-600 text-white text-sm rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </span>
                Delivery Address
              </h2>

              {/* Saved addresses */}
              {user?.addresses?.length > 0 && !showNew && (
                <div className="space-y-3 mb-4">
                  {user.addresses.map(a => (
                    <label
                      key={a._id}
                      className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selAddr === a._id
                          ? 'border-orange-500 bg-orange-50/40'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="addr"
                        checked={selAddr === a._id}
                        onChange={() => setSelAddr(a._id)}
                        className="mt-1 accent-orange-600 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-800">{a.fullName}</p>
                          <span className="badge bg-gray-100 text-gray-500 text-xs">{a.label}</span>
                          {a.isDefault && (
                            <span className="badge bg-orange-100 text-orange-700 text-xs">Default</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}
                        </p>
                        <p className="text-sm text-gray-600">{a.city}, {a.state} — {a.pincode}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Ph: {a.phone}</p>
{a.email && (
  <p className="text-xs text-gray-400 mt-0.5">
    Email: {a.email}
  </p>
)}
                      </div>
                      <button
  type="button"
  onClick={() => {
    setShowNew(true);
    setEditAddrId(a._id);
    setNewAddr({
      fullName: a.fullName,
      phone: a.phone,
      addressLine1: a.addressLine1,
      addressLine2: a.addressLine2 || '',
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      email: a.email || '',
      label: a.label || 'Home',
    });
  }}
  className="text-xs text-blue-600 font-semibold mt-2 hover:underline"
>
  Edit
</button>
                    </label>
                    
                  ))}

                  <button
                    onClick={() => { setShowNew(true); setNewAddr({ ...EMPTY_ADDR }); }}
                    className="text-sm text-orange-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                    </svg>
                    Add new address
                  </button>
                </div>
              )}

              {/* New address form */}
              {showNew && (
                <div className="space-y-4">
                  {/* Label selector */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address Label</label>
                    <div className="flex gap-2">
                      {LABEL_OPTS.map(l => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setNewAddr(p => ({ ...p, label: l }))}
                          className={`px-4 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                            newAddr.label === l
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Address fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ADDR_FIELDS.map(({ key, label, ph, full, required }) => (
                      <div key={key} className={full ? 'sm:col-span-2' : ''}>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          {label}
                          {required && <span className="text-red-500 ml-0.5">*</span>}
                        </label>
                        <input
                          type="text"
                          value={newAddr[key]}
                          onChange={e => setNewAddr(p => ({ ...p, [key]: e.target.value }))}
                          placeholder={ph}
                          className="input"
                          required={required}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Save to profile checkbox */}
                  <label className="flex items-center gap-3 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={saveAddr}
                      onChange={e => setSaveAddr(e.target.checked)}
                      className="w-4 h-4 accent-orange-600 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Save this address to my profile for future orders
                    </span>
                  </label>

                  {/* Back to saved */}
                  {user?.addresses?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { setShowNew(false); }}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                      </svg>
                      Use a saved address
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Step 2: Payment Method ─────────────────────── */}
            <div className="card p-6">
              <h2 className="font-semibold text-lg text-gray-900 mb-5 flex items-center gap-2.5">
                <span className="w-7 h-7 bg-orange-600 text-white text-sm rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </span>
                Payment Method
              </h2>
<div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
    <p className="text-sm text-green-700 font-medium">
      ₹100 discount applicable on orders above ₹2000. This will be applied during checkout page.
    </p>
  </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    v: 'full',
                    title: 'Full Payment',
                    desc: 'Pay complete amount online via Razorpay',
sub: `Pay ${fmt(fullTotal)} now (If you pay full amount, Shipping charges is Free)`                  },
                  {
                    v: 'partial',
                    title: 'Partial (COD)',
desc: payType === 'full'
  ? 'Pay partial amount now, rest on delivery'
  : 'Pay partial amount now, rest on delivery',
sub: `Pay ${fmt(partialAmount)} now + ${fmt(codAmount)} on delivery`,                },
                ].map(o => (
                  <label
                    key={o.v}
                    className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      payType === o.v
                        ? 'border-orange-500 bg-orange-50/40'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="pay"
                      value={o.v}
                      checked={payType === o.v}
                      onChange={() => setPayType(o.v)}
                      className="mt-1 accent-orange-600 flex-shrink-0"
                    />
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{o.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{o.desc}</p>
                      <p className="text-xs font-bold text-orange-600 mt-1.5">{o.sub}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ── Order Summary ──────────────────────────────── */}
          <div>
            <div className="card p-6 sticky top-24 space-y-4">
              <h2 className="font-display font-semibold text-xl text-gray-900">Order Summary</h2>

              {/* Items */}
              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                {items.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-11 h-11 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {item.image
                        ? <img src={item.image} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gray-200" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 line-clamp-2">{item.name}</p>
                      {item.variantName && (
                        <p className="text-[10px] text-gray-400">{item.variantName}</p>
                      )}
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-gray-800 flex-shrink-0">
                      {fmt(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
             <div className="flex justify-between text-gray-500">
  <span>Subtotal</span>
  <span className="font-semibold text-gray-700">{fmt(subtotal)}</span>
</div>


<div className="flex justify-between text-gray-500">
  <span>Shipping</span>
  <span className="font-semibold text-gray-700">{fmt(sh)}</span>
</div>
                <div className="flex justify-between font-bold text-base text-gray-900 pt-1 border-t border-gray-100">
                  <span>Total</span>
                  <span>{fmt(tot)}</span>
                </div>
              </div>

              {/* Payment breakdown */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-bold text-blue-800">Payment Breakdown</p>
                <div className="flex justify-between text-xs text-blue-700">
                  <span>Pay online now</span>
                  <span className="font-bold">{fmt(online)}</span>
                </div>
                {cod > 0 && (
                  <div className="flex justify-between text-xs text-blue-700">
                    <span>Pay on delivery</span>
                    <span className="font-bold">{fmt(cod)}</span>
                  </div>
                )}
              </div>

              {/* Place order */}
              <button
                onClick={place}
                disabled={placing || !items?.length}
                className="btn-primary w-full py-3.5 text-base"
              >
                {placing ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    Processing...
                  </span>
                ) : (
                  `Pay ${fmt(online)}`
                )}
              </button>

              <p className="text-xs text-center text-gray-400">
                Secured by Razorpay
              </p>
              <div className="flex gap-3 p-4 rounded-xl border-2 border-orange-400 bg-orange-50/60 shadow-sm hover:shadow-md transition-all">

  {/* Icon */}
  <div className="flex-shrink-0 text-orange-500 mt-1">
  
  </div>

  {/* Content */}
  <div>
    <p className="font-semibold text-orange-700 text-sm mb-1">
      Hey! Please Read Before Choosing COD
    </p>

    <p className="text-gray-700 text-sm leading-relaxed">
      If you select <span className="font-semibold text-orange-600">Cash on Delivery</span>, 
      you will need to pay a small amount in advance. This is because some customers 
      refuse orders at delivery without valid reasons, which causes shipping losses. 
      This step helps us reduce unnecessary costs and continue providing reliable service.
    </p>
  </div>

</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
