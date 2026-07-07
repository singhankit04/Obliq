import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

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
          <h2 className="text-2xl font-bold text-slate-100">Forgot Password</h2>
          <p className="text-slate-400 text-sm mt-1">Enter your email and we'll send a password reset link</p>
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

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-5">
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

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-slate-100 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20 text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        ) : (
          <div className="mt-4">
            <Link
              to="/login"
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm"
            >
              Return to login
            </Link>
          </div>
        )}

        <div className="text-center mt-6 text-sm">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-300 font-medium text-xs hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
