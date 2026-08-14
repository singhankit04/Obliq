import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Key, Loader2, AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Zap, Shield, Users } from 'lucide-react';

function FloatingOrb({ className, style }) {
  return <div className={`absolute rounded-full opacity-15 blur-3xl animate-float ${className}`} style={style} />;
}

function BrandPanel() {
  return (
    <div className="auth-brand-panel">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-[#0a1628] to-zinc-950" />
      <FloatingOrb className="w-72 h-72 bg-blue-600 top-[10%] left-[15%]" />
      <FloatingOrb className="w-96 h-96 bg-blue-800 bottom-[10%] right-[10%]" style={{ animationDelay: '2s' }} />
      <FloatingOrb className="w-48 h-48 bg-sky-600 top-[55%] left-[55%]" style={{ animationDelay: '4s' }} />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />
      <div className="relative z-10 max-w-md px-12 text-center lg:text-left">
        <div className="inline-flex items-center gap-3 mb-10">
          <img src="/favicon.svg" alt="Obliq Logo" className="w-11 h-11 rounded-xl shadow-lg shadow-blue-600/20" />
          <span className="text-2xl font-bold tracking-tight text-zinc-100">Obliq</span>
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-zinc-100 leading-tight tracking-tight mb-6">
          Start building
          <br />
          <span className="gradient-text">something great.</span>
        </h1>
        <p className="text-lg text-zinc-400 leading-relaxed mb-10">
          Join thousands of teams already using Obliq to ship faster and stay organized.
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { icon: Shield, label: 'Free to start' },
            { icon: Users, label: 'Unlimited members' },
            { icon: Zap, label: 'No credit card' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm text-zinc-400">
              <Icon className="w-3.5 h-3.5 text-blue-400" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Signup() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const otpRefs = useRef([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { signup, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const handleGoogleCallback = useCallback(async (response) => {
    setError('');
    setSubmitting(true);
    try {
      await googleLogin(response.credential);
      navigate(redirectUrl);
    } catch (err) {
      setError(err.message || 'Google sign up failed');
    } finally {
      setSubmitting(false);
    }
  }, [googleLogin, navigate, redirectUrl]);

  useEffect(() => {
    if (step !== 1) return;
    const initializeGoogleSignUp = () => {
      if (window.google?.accounts?.id) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCallback,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-signup-btn'),
          { theme: 'filled_black', size: 'large', width: '100%', shape: 'rectangular', text: 'signup_with' }
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

  const handleVerifyAndSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.verifyOtp(email, otpDigits.join(''));
      await signup(name, email, password);
      navigate(redirectUrl);
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
      setError(err.message || 'Failed to resend the code.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="auth-layout">
      <BrandPanel />

      <div className="auth-form-panel">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2.5">
              <img src="/favicon.svg" alt="Obliq Logo" className="w-9 h-9 rounded-lg shadow-sm" />
              <span className="text-xl font-bold tracking-tight text-zinc-100">Obliq</span>
            </div>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`flex items-center gap-2 text-xs font-semibold ${step === 1 ? 'text-blue-400' : 'text-zinc-600'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 1 ? 'bg-blue-600 text-white' : step > 1 ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                {step > 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '1'}
              </div>
              Details
            </div>
            <div className="flex-1 h-px bg-zinc-800" />
            <div className={`flex items-center gap-2 text-xs font-semibold ${step === 2 ? 'text-blue-400' : 'text-zinc-600'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 2 ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                2
              </div>
              Verify
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Create your account</h2>
                  <p className="text-zinc-500 text-sm mt-1.5">Get started with Obliq in seconds</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/8 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wider" htmlFor="name">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="input-field" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wider" htmlFor="signup-email">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input id="signup-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wider" htmlFor="signup-password">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input id="signup-password" type={showPassword ? 'text' : 'password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="input-field !pr-11" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors" tabIndex={-1}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={submitting} className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-600/20 text-sm group active:scale-[0.98]">
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending code...</>
                    ) : (
                      <>Continue <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
                    )}
                  </button>
                </form>

                <div className="relative my-7">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800" /></div>
                  <div className="relative flex justify-center text-xs uppercase tracking-wider">
                    <span className="bg-[var(--bg-primary)] px-3 text-zinc-600">Or continue with</span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div id="google-signup-btn" className="w-full min-h-[40px] flex justify-center" />
                </div>

                <div className="text-center mt-8 text-sm text-zinc-500">
                  Already have an account?{' '}
                  <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">Sign in</Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <button onClick={() => { setStep(1); setError(''); setSuccess(''); }} className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-200 mb-6 transition-colors group">
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  Back to details
                </button>

                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Verify your email</h2>
                  <p className="text-zinc-500 text-sm mt-1.5">We sent a 4-digit code to <span className="text-zinc-300 font-medium">{email}</span></p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/8 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="mb-4 p-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-emerald-400 text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /><span>{success}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyAndSignup} className="space-y-6">
                  <div>
                    <label className="block text-zinc-400 text-xs font-semibold mb-3 uppercase tracking-wider">
                      <Key className="w-3.5 h-3.5 inline mr-1.5" />
                      Verification Code
                    </label>
                    <div className="flex gap-3 justify-center" onPaste={handleOtpPaste}>
                      {otpDigits.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => { otpRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className="w-14 h-14 text-center text-xl font-bold bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          autoFocus={i === 0}
                        />
                      ))}
                    </div>
                    {secondsLeft > 0 && (
                      <p className="text-xs text-zinc-600 text-center mt-3">
                        Code expires in <span className="text-zinc-400 font-medium">{formatTime(secondsLeft)}</span>
                      </p>
                    )}
                  </div>

                  <button type="submit" disabled={submitting || otpDigits.some((d) => !d)} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-600/20 text-sm active:scale-[0.98]">
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                    ) : (
                      <>Create Account <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>

                  <div className="text-center">
                    <button type="button" onClick={handleResendOtp} disabled={submitting} className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors disabled:opacity-50">
                      Resend verification code
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
