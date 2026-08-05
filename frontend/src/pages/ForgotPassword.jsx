import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight, Zap, Shield, Users } from 'lucide-react';

function FloatingShape({ className, style }) {
  return <div className={`absolute rounded-full opacity-20 blur-xl animate-float ${className}`} style={style} />;
}

function BrandPanel() {
  return (
    <div className="auth-brand-panel">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/80 via-[#0c0a2a] to-cyan-950/50" />
      <FloatingShape className="w-72 h-72 bg-violet-600 top-[10%] left-[15%]" />
      <FloatingShape className="w-96 h-96 bg-purple-700 bottom-[10%] right-[10%]" style={{ animationDelay: '2s' }} />
      <FloatingShape className="w-48 h-48 bg-cyan-600 top-[55%] left-[55%]" style={{ animationDelay: '4s' }} />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div className="relative z-10 max-w-md px-12 text-center lg:text-left">
        <div className="inline-flex items-center gap-3 mb-10">
          <img src="/favicon.svg" alt="Obliq Logo" className="w-12 h-12 rounded-2xl shadow-xl shadow-blue-500/25" />
          <span className="text-3xl font-black tracking-tight text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Obliq
          </span>
        </div>

        <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
          We&apos;ve got
          <br />
          <span className="gradient-text">your back.</span>
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed">
          Happens to the best of us. Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>
    </div>
  );
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const data = await api.forgotPassword(email);
      setSuccess(data.message || 'If the email is registered, a password reset link has been sent.');
    } catch (err) {
      setError(err.message || 'Failed to request password reset.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <BrandPanel />

      <div className="auth-form-panel">
        <div className="w-full max-w-sm animate-slide-in">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2.5">
              <img src="/favicon.svg" alt="Obliq Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-blue-500/20" />
              <span className="text-2xl font-black tracking-tight text-[var(--text-primary)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Obliq
              </span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Forgot password
            </h2>
            <p className="text-[var(--text-tertiary)] text-sm mt-1.5">
              Enter your email and we&apos;ll send a reset link
            </p>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-500/8 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-4 bg-emerald-500/8 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-emerald-400 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[var(--text-secondary)] text-xs font-semibold mb-2 uppercase tracking-wider" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
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

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-900/25 text-sm group animate-gradient-shift bg-[length:200%_200%]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="mt-4">
              <Link
                to="/login"
                className="w-full py-3 bg-[var(--bg-elevated)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-primary)] text-[var(--text-primary)] font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm"
              >
                Return to login
              </Link>
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] font-medium text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
