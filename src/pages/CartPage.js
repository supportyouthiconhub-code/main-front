import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchCart, updateItemDB, removeItemDB, updateLocal, removeLocal } from '../redux/slices/cartSlice';

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const ship = (s) => s > 1500 ? Math.round(s * 0.1) : 100;

export default function CartPage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { token } = useSelector(s => s.auth);
  const { items, localItems, subtotal, shippingCharges, total, loading } = useSelector(s => s.cart);

  const isAuth = !!token;
  const disp   = isAuth ? (items||[]) : (localItems||[]);
  const sub    = isAuth ? subtotal    : disp.reduce((s,i)=>s+i.price*i.quantity,0);
  const sh     = isAuth ? shippingCharges : ship(sub);
  const tot    = isAuth ? total : sub + sh;

  useEffect(() => { if (token) dispatch(fetchCart()); }, [token, dispatch]);

  const changeQty = (item, delta) => {
    const nq = item.quantity + delta;
    if (isAuth) { if(nq<=0) dispatch(removeItemDB(item._id)); else dispatch(updateItemDB({id:item._id,qty:nq})); }
    else { if(nq<=0) dispatch(removeLocal({productId:item.productId,variantId:item.variantId})); else dispatch(updateLocal({productId:item.productId,variantId:item.variantId,quantity:nq})); }
  };
  const remove = (item) => {
    if (isAuth) dispatch(removeItemDB(item._id));
    else dispatch(removeLocal({productId:item.productId,variantId:item.variantId}));
  };

  return (
    <>
      <Helmet><title>Your Cart – Youth Icon Hub</title></Helmet>
      <div className="page py-8 sm:py-12">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 mb-8">
          Shopping Cart
          {disp.length > 0 && <span className="ml-3 text-base font-normal text-gray-400">({disp.reduce((s,i)=>s+i.quantity,0)} items)</span>}
        </h1>

        {disp.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
            <div className="text-6xl">🛒</div>
            <div><p className="text-xl font-semibold text-gray-700">Your cart is empty</p><p className="text-gray-400 mt-1">Add some products to get started!</p></div>
            <Link to="/products" className="btn-primary px-8 py-3">Shop Now</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {disp.map((item, idx) => (
                <div key={item._id||idx} className="card p-4 sm:p-5 flex gap-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">📦</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 line-clamp-2">{item.name}</p>
                    {item.variantName && <p className="text-xs text-gray-400 mt-0.5">{item.variantName}</p>}
                    <p className="font-bold text-gray-900 mt-1">{fmt(item.price)}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button onClick={() => changeQty(item,-1)} disabled={loading} className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 font-medium">−</button>
                        <span className="px-4 py-1.5 text-sm font-bold border-x border-gray-200 min-w-[36px] text-center">{item.quantity}</span>
                        <button onClick={() => changeQty(item,1)} disabled={loading} className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 font-medium">+</button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">{fmt(item.price*item.quantity)}</span>
                        <button onClick={() => remove(item)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div>
              <div className="card p-6 sticky top-24 space-y-4">
                <h2 className="font-display font-semibold text-xl text-gray-900">Order Summary</h2>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-gray-500"><span>Subtotal ({disp.reduce((s,i)=>s+i.quantity,0)} items)</span><span className="font-semibold text-gray-800">{fmt(sub)}</span></div>
                  <div className="flex justify-between text-gray-500"><span>Shipping</span><span className="font-semibold text-gray-800">{fmt(sh)}</span></div>
                  {sub <= 1500 && <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">Add {fmt(1501-sub)} more for 10% shipping rate</p>}
                  <div className="border-t border-gray-100 pt-2.5 flex justify-between font-bold text-base text-gray-900"><span>Total</span><span>{fmt(tot)}</span></div>
                </div>
                <button onClick={() => navigate(token?'/checkout':'/login?redirect=/checkout')} className="btn-primary w-full py-3">
                  {token ? 'Proceed to Checkout' : 'Login to Checkout'}
                </button>
                <Link to="/products" className="btn-secondary w-full py-2.5 text-sm text-center block">Continue Shopping</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
