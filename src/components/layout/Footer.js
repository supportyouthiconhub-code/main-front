import React from 'react';
import { Link } from 'react-router-dom';

import { useSelector } from 'react-redux';
import { Mail, Phone, MessageCircle, Camera } from 'lucide-react';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';
export default function Footer() {
  const { store_name, store_email, store_phone } = useSelector(s => s.settings);

  return (
    <footer className="bg-gray-900 text-gray-400 mt-20">
      <div className="page py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">
                  {(store_name || 'Y').charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-white font-display font-bold text-base leading-tight">
                {store_name}
              </span>
            </div>
            <p className="text-sm leading-relaxed">
             Quality Fashion Products at the Best Prices with Fast Delivery.
            </p>
          </div>

          {/* Shop links */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-3">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/products?featured=true" className="hover:text-white transition-colors">Featured</Link></li>
              <li><Link to="/products?sort=popular" className="hover:text-white transition-colors">Best Sellers</Link></li>
              <li><Link to="/products?sort=newest" className="hover:text-white transition-colors">New Arrivals</Link></li>
            </ul>
          </div>

          {/* Account links */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-3">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-white transition-colors">Login / Sign Up</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">My Orders</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">My Cart</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-3">Support</h4>
<ul className="flex items-center gap-5">

  {/* Email */}
  {store_email && (
    <li>
      <a 
        href={`mailto:${store_email}`} 
        className=" rounded-full bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition"
      >
        <Mail size={22} />
      </a>
    </li>
  )}

  {/* Phone */}
  {store_phone && (
    <li>
      <a 
        href={`tel:${store_phone}`} 
        className="rounded-full bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition"
      >
        <Phone size={22} />
      </a>
    </li>
  )}

  {/* WhatsApp */}
  <li>
    <a 
      href="https://wa.me/919911234567"
      target="_blank"
      rel="noopener noreferrer"
      className=" rounded-full bg-gray-800 text-gray-400 hover:text-green-500 hover:bg-gray-700 transition"
    >
      <FaWhatsapp size={22} />
    </a>
  </li>

  {/* Instagram */}
  <li>
    <a 
      href="https://instagram.com/yourusername"
      target="_blank"
      rel="noopener noreferrer"
      className=" rounded-full bg-gray-800 text-gray-400 hover:text-pink-500 hover:bg-gray-700 transition"
    >
      <FaInstagram size={22} />
    </a>
  </li>

</ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>© {new Date().getFullYear()} {store_name}. All rights reserved.</p>
          <p>
            Payments secured by{' '}
            <span className="text-white font-semibold">Razorpay</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
