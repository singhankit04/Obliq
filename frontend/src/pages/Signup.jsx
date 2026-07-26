import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, Mail, Lock, Key, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function Signup() {
  const [step, setStep] = useState(1); // 1: Details, 2: OTP
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const otpRefs = useRef([]);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { signup, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleGoogleCallback = useCallback(async (response) => {
    setError('');
    setSubmitting(true);
    try {
      await googleLogin(response.credential);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Google sign up failed');
    } finally {
      setSubmitting(false);
    }
  }, [googleLogin, navigate]);

  useEffect(() => {
    if (step !== 1) return;

    const initializeGoogleSignUp = () => {
      if (window.google?.accounts?.id) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id_here';
        
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCallback,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-signup-btn'),
          { 
            theme: 'filled_dark', 
            size: 'large', 
            width: '100%',
            shape: 'rectangular',
            text: 'signup_with',
          }
        );
      }
    };

    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        initializeGoogleSignUp();
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [step, handleGoogleCallback]);

  useEffect(() => {
    if (step !== 2 || secondsLeft <= 0) return undefined;
    const timer = window.setInterval(() => setSecondsLeft((current) => current - 1), 1000);
    return () => window.clearInterval(timer);
  }, [step, secondsLeft]);

  // Send OTP and transition to step 2
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);

    try {
      await api.sendOtp(email);
      setSuccess('A 4-digit OTP has been sent to your email.');
      setOtpDigits(['', '', '', '']);
      setSecondsLeft(600);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send verification email.');
    } finally {
      setSubmitting(false);
    }
  };

  // Verify OTP and complete signup
  const handleVerifyAndSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // 1. Verify OTP
      await api.verifyOtp(email, otpDigits.join(''));
      
      // 2. Complete Signup
      await signup(name, email, password);
      
      navigate('/');
    } catch (err) {
      setError(err.message || 'Verification or registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (digit && index < otpRefs.current.length - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (event) => {
    event.preventDefault();
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4).split('');
    if (!digits.length) return;
    setOtpDigits([...digits, ...Array(4 - digits.length).fill('')]);
    otpRefs.current[Math.min(digits.length, 4) - 1]?.focus();
  };

  const handleResendOtp = async () => {
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await api.sendOtp(email);
      setOtpDigits(['', '', '', '']);
      setSecondsLeft(600);
      setSuccess('A fresh verification code is on its way.');
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Could not resend your code.');
    } finally {
      setSubmitting(false);
    }
  };

  const formattedTime = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] px-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl border border-slate-800 animate-slide-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-purple-600/10 rounded-xl mb-4 border border-purple-500/20">
            <span className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent tracking-wider">
              OBLIQ
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Create Account</h2>
          <p className="text-slate-400 text-sm mt-1">
            {step === 1 ? 'Get started with your free workspace' : 'Verify your email address'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-200 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-start gap-3 text-emerald-200 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {step === 1 ? (
          <>
            <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5" htmlFor="name">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-slate-300 text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <span className={`text-[11px] ${password.length > 0 && password.length < 6 ? 'text-red-400 font-medium' : 'text-slate-500'}`}>
                  Min. 6 characters
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-4 py-2.5 bg-slate-950/50 border rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 transition-all text-sm ${
                    password.length > 0 && password.length < 6
                      ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                      : 'border-slate-800 focus:border-purple-500 focus:ring-purple-500'
                  }`}
                />
              </div>
              {password.length > 0 && password.length < 6 && (
                <p className="text-[11px] text-red-400 mt-1">Password must be at least 6 characters long.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-slate-100 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20 text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                'Send Verification OTP'
              )}
            </button>
          </form>

          <div className="relative my-6" >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0b0f19] px-2 text-slate-500">Or continue with</span>
            </div>
          </div>

          <div className="flex justify-center">
            <div id="google-signup-btn" className="w-full min-h-[40px] flex justify-center"></div>
          </div>
        </>
      ) : (
          <form onSubmit={handleVerifyAndSignup} className="space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-slate-300 text-sm font-medium" htmlFor="otp-0">Enter verification code</label>
                <span className="flex items-center gap-1 text-xs font-medium text-slate-500"><Key className="h-3.5 w-3.5" />{formattedTime}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">We sent a 4-digit code to {email}.</p>
              <div className="mt-4 flex justify-between gap-3" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => { otpRefs.current[index] = element; }}
                    id={`otp-${index}`}
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    aria-label={`Verification digit ${index + 1}`}
                    value={digit}
                    onChange={(event) => handleOtpChange(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    className="h-14 min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950/50 text-center text-xl font-bold text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                  />
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-slate-500">
                Didn&apos;t receive it?{' '}
                <button type="button" onClick={handleResendOtp} disabled={submitting || secondsLeft > 540} className="font-semibold text-indigo-300 transition hover:text-indigo-200 disabled:cursor-not-allowed disabled:text-slate-600">
                  {secondsLeft > 540 ? `Resend in ${formattedTime}` : 'Resend code'}
                </button>
              </p>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setSuccess('');
                  setError('');
                }}
                className="flex-1 py-3 border border-slate-800 hover:bg-slate-800/30 text-slate-300 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <button
                type="submit"
                disabled={submitting || otpDigits.join('').length !== 4}
                className="flex-[2] py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-slate-100 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20 text-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Register'
                )}
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-6 text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
