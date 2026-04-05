import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { closeCart } from '../../redux/slices/uiSlice';
import {
  fetchCart, updateItemDB, removeItemDB,
  updateLocal, removeLocal,
} from '../../redux/slices/cartSlice';
import { Spinner } from '../common/Skeletons';

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const ship = (sub) => sub > 1500 ? Math.round(sub * 0.1) : 100;

export default function CartDrawer() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const open      = useSelector(s => s.ui.cartOpen);
  const { token } = useSelector(s => s.auth);
  const { items, localItems, subtotal, shippingCharges, total, loading } = useSelector(s => s.cart);

  const dbItems    = items      || [];
  const guestItems = localItems || [];
  const isAuth     = !!token;

  const displayItems = isAuth ? dbItems : guestItems;
  const sub  = isAuth ? subtotal : guestItems.reduce((s,i) => s + i.price * i.quantity, 0);
  const sh   = isAuth ? shippingCharges : ship(sub);
  const tot  = isAuth ? total : sub + sh;

  useEffect(() => { if (open && token) dispatch(fetchCart()); }, [open, token, dispatch]);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);

  const changeQty = (item, delta) => {
    const newQty = item.quantity + delta;
    if (isAuth) {
      if (newQty <= 0) dispatch(removeItemDB(item._id));
      else dispatch(updateItemDB({ id: item._id, qty: newQty }));
    } else {
      if (newQty <= 0) dispatch(removeLocal({ productId: item.productId, variantId: item.variantId }));
      else dispatch(updateLocal({ productId: item.productId, variantId: item.variantId, quantity: newQty }));
    }
  };

  const remove = (item) => {
    if (isAuth) dispatch(removeItemDB(item._id));
    else dispatch(removeLocal({ productId: item.productId, variantId: item.variantId }));
  };

  const goCheckout = () => {
    dispatch(closeCart());
    navigate(token ? '/checkout' : '/login?redirect=/checkout');
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50" onClick={() => dispatch(closeCart())} />}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] z-50 flex flex-col bg-white shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-lg text-gray-900">
            Your Cart
            {displayItems.length > 0 && <span className="ml-2 text-sm font-normal text-gray-400">({displayItems.reduce((s,i)=>s+i.quantity,0)})</span>}
          </h2>
          <button onClick={() => dispatch(closeCart())} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && displayItems.length === 0 ? (
            <div className="flex items-center justify-center h-32"><Spinner size="lg" /></div>
          ) : displayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 text-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl">🛒</div>
              <p className="font-medium text-gray-600">Your cart is empty</p>
              <button onClick={() => { dispatch(closeCart()); navigate('/products'); }} className="btn-primary text-sm">Shop Now</button>
            </div>
          ) : (
            <div className="space-y-4">
              {displayItems.map((item, idx) => (
                <div key={item._id || idx} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    {item.image
                      ? <img src={item.image} alt={item.name} className="w-full h-full object-cover"/>
                      : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">📦</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-2">{item.name}</p>
                    {item.variantName && <p className="text-xs text-gray-400 mt-0.5">{item.variantName}</p>}
                    <p className="text-sm font-bold text-gray-900 mt-1">{fmt(item.price)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button onClick={() => changeQty(item, -1)} disabled={loading} className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-medium text-sm">−</button>
                        <span className="px-3 py-1 text-sm font-semibold border-x border-gray-200 min-w-[32px] text-center">{item.quantity}</span>
                        <button onClick={() => changeQty(item, 1)} disabled={loading} className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-medium text-sm">+</button>
                      </div>
                      <button onClick={() => remove(item)} className="ml-auto p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {displayItems.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3 bg-gray-50/70">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span className="font-medium text-gray-700">{fmt(sub)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Shipping</span><span className="font-medium text-gray-700">{fmt(sh)}</span></div>
              <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-200">
                <span>Total</span><span>{fmt(tot)}</span>
              </div>
            </div>
            <button onClick={goCheckout} className="btn-primary w-full py-3 text-sm">
              {token ? 'Proceed to Checkout' : 'Login to Checkout'}
            </button>
            <button onClick={() => { dispatch(closeCart()); navigate('/cart'); }} className="btn-secondary w-full py-2.5 text-sm">
              View Full Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
