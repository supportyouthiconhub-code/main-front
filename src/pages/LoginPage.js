import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { sendOTP, verifyOTP, clearError, clearOtp } from '../redux/slices/authSlice';
import { Spinner } from '../components/common/Skeletons';

export default function LoginPage() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const [params]   = useSearchParams();
  const { loading, otpSent, error, token, user, initialized, reqId } = useSelector(s => s.auth);

  const [phone,   setPhone]   = useState('');
  const [otp,     setOtp]     = useState('');
  const [timer,   setTimer]   = useState(0);

  const redirect = params.get('redirect') || '/';

  /* Redirect once logged in */
  useEffect(() => {
    if (!initialized) return;
    if (token && user?.role === 'user')  navigate(redirect, { replace: true });
    if (token && user?.role === 'admin') navigate('/admin', { replace: true });
  }, [token, user, initialized]); // eslint-disable-line

  /* Cleanup on unmount */
  useEffect(() => () => {
    dispatch(clearError());
    dispatch(clearOtp());
  }, [dispatch]);

  /* Countdown timer */
  useEffect(() => {
    if (otpSent) setTimer(60);
  }, [otpSent]);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const fmtPhone = () => phone.startsWith('+') ? phone : `+91${phone}`;

  const handleSend = (e) => {
    e.preventDefault();
    dispatch(sendOTP(fmtPhone()));
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    // verifyOTP sets token + user + initialized=true in the slice.
    // App.js useEffect then calls syncCartAfterLogin automatically
    // when it detects token changed from null to a value.
    dispatch(verifyOTP({ phone: fmtPhone(), otp ,  reqId }));
  };

  const handleResend = () => {
    setOtp('');
    dispatch(clearError());
    dispatch(sendOTP(fmtPhone()));
  };

  const handleChangeNumber = () => {
    setOtp('');
    dispatch(clearOtp());
    dispatch(clearError());
  };

  return (
    <>
      <Helmet><title>Login – Youth Fashion House</title></Helmet>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-base">S</span>
              </div>
              <span className="font-display font-bold text-2xl text-gray-900">Youth Fashion House</span>
            </Link>
            <h1 className="font-display font-bold text-3xl text-gray-900">
              {otpSent ? 'Enter OTP' : 'Welcome Back'}
            </h1>
            <p className="text-gray-500 mt-1.5 text-sm">
              {otpSent
                ? `We sent a 6-digit code to +91 ${phone}`
                : 'Login or create an account with your mobile number'}
            </p>
          </div>

          <div className="card p-8 shadow-md">
            {/* Error */}
            {error && (
              <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Step 1: Phone */}
            {!otpSent ? (
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 select-none flex-shrink-0">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      className="input flex-1"
                      required
                      maxLength={10}
                      autoFocus
                      inputMode="numeric"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || phone.length < 10}
                  className="btn-primary w-full py-3"
                >
                  {loading ? <Spinner size="sm" /> : 'Send OTP'}
                </button>
              </form>

            ) : (
              /* Step 2: OTP */
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                  <span className="text-sm text-gray-600">
                    +91 <strong className="text-gray-800">{phone}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleChangeNumber}
                    className="text-xs text-orange-600 font-semibold hover:underline"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    4-digit OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="• • • •"
                    className="input text-center text-2xl tracking-[0.5em] font-bold py-3.5"
                    maxLength={4}
                    required
                    autoFocus
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 4}
                  className="btn-primary w-full py-3"
                >
                  {loading ? <Spinner size="sm" /> : 'Verify & Continue'}
                </button>

                <div className="text-center text-sm">
                  {timer > 0 ? (
                    <p className="text-gray-500">
                      Resend in{' '}
                      <span className="font-semibold text-orange-600 tabular-nums">{timer}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={loading}
                      className="text-orange-600 font-semibold hover:underline disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          <p className="text-center mt-5 text-xs text-gray-400">
            Admin?{' '}
            <Link to="/admin/login" className="text-gray-500 underline hover:text-gray-700">
              Admin Login
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
