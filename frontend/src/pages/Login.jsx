import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Lock, Mail, Loader2, AlertCircle, Eye, EyeOff, ArrowRight, Zap, Shield, Users } from 'lucide-react';

function FloatingOrb({ className, style }) {
  return <div className={`absolute rounded-full opacity-15 blur-3xl animate-float ${className}`} style={style} />;
}

function BrandPanel() {
  return (
    <div className="auth-brand-panel">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-[#0a1628] to-zinc-950" />

      {/* Subtle orbs */}
      <FloatingOrb className="w-72 h-72 bg-blue-600 top-[10%] left-[15%]" />
      <FloatingOrb className="w-96 h-96 bg-blue-800 bottom-[10%] right-[10%]" style={{ animationDelay: '2s' }} />
      <FloatingOrb className="w-48 h-48 bg-sky-600 top-[55%] left-[55%]" style={{ animationDelay: '4s' }} />

      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div className="relative z-10 max-w-md px-12 text-center lg:text-left">
        {/* Logo */}
        <div className="inline-flex items-center gap-3 mb-10">
          <img src="/favicon.svg" alt="Obliq Logo" className="w-11 h-11 rounded-xl shadow-lg shadow-blue-600/20" />
          <span className="text-2xl font-bold tracking-tight text-zinc-100">
            Obliq
          </span>
        </div>

        <h1 className="text-4xl lg:text-5xl font-bold text-zinc-100 leading-tight tracking-tight mb-6">
          Where teams
          <br />
          <span className="gradient-text">build together.</span>
        </h1>
        <p className="text-lg text-zinc-400 leading-relaxed mb-10">
          The modern workspace for managing projects, tracking progress, and collaborating seamlessly.
        </p>

        <div className="flex flex-wrap gap-3">
          {[
            { icon: Shield, label: 'Enterprise security' },
            { icon: Users, label: 'Real-time collab' },
            { icon: Zap, label: 'Lightning fast' },
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

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleGoogleCallback = useCallback(async (response) => {
    setError('');
    setSubmitting(true);
    try {
      await googleLogin(response.credential);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Google sign in failed');
    } finally {
      setSubmitting(false);
    }
  }, [googleLogin, navigate]);

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCallback,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          {
            theme: 'filled_black',
            size: 'large',
            width: '100%',
            shape: 'rectangular',
            text: 'continue_with',
          }
        );
      }
    };

    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        initializeGoogleSignIn();
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [handleGoogleCallback]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

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
              <span className="text-xl font-bold tracking-tight text-zinc-100">
                Obliq
              </span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">
              Welcome back
            </h2>
            <p className="text-zinc-500 text-sm mt-1.5">
              Sign in to continue to your workspace
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/8 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wider" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider" htmlFor="password">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field !pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-600/20 text-sm group active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-[var(--bg-primary)] px-3 text-zinc-600">Or continue with</span>
            </div>
          </div>

          {/* Google */}
          <div className="flex justify-center">
            <div id="google-signin-btn" className="w-full min-h-[40px] flex justify-center" />
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-zinc-500">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Create account
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
