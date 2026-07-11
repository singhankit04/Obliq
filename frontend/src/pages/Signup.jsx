import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, Mail, Lock, Key, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function Signup() {
  const [step, setStep] = useState(1); // 1: Details, 2: OTP
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { signup, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleGoogleCallback = async (response) => {
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
  };

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
  }, [step]);

  // Send OTP and transition to step 2
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.sendOtp(email);
      setSuccess('A 4-digit OTP has been sent to your email.');
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
      await api.verifyOtp(email, otp);
      
      // 2. Complete Signup
      await signup(name, email, password);
      
      navigate('/');
    } catch (err) {
      setError(err.message || 'Verification or registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

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
              <label className="block text-slate-300 text-sm font-medium mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                />
              </div>
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
              <label className="block text-slate-300 text-sm font-medium mb-1.5" htmlFor="otp">
                Enter 4-Digit OTP
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="otp"
                  type="text"
                  maxLength={4}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 1234"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-center font-bold tracking-widest text-lg"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={async () => {
                    setError('');
                    setSuccess('');
                    try {
                      await api.sendOtp(email);
                      setSuccess('OTP resent successfully!');
                    } catch (err) {
                      setError(err.message || 'Failed to resend OTP.');
                    }
                  }}
                  className="text-purple-400 hover:text-purple-300 underline focus:outline-none"
                >
                  Resend OTP
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
                disabled={submitting || otp.length !== 4}
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
