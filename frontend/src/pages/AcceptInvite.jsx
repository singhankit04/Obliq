import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../components/ui/Toast';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import { 
  Building2, 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertTriangle, 
  ArrowRight, 
  Mail, 
  ShieldAlert, 
  Users,
  Sparkles
} from 'lucide-react';

function FloatingOrb({ className, style }) {
  return <div className={`absolute rounded-full opacity-15 blur-3xl animate-float ${className}`} style={style} />;
}

export default function AcceptInvite() {
  const { token: pathToken } = useParams();
  const [searchParams] = useSearchParams();
  const effectiveToken = pathToken || searchParams.get('token');

  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { refreshWorkspaces, setActiveWorkspace } = useWorkspace() || {};
  const { addToast } = useToast();

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [actionDone, setActionDone] = useState(null); // 'accepted' | 'rejected'

  useEffect(() => {
    let isMounted = true;
    const fetchInviteDetails = async () => {
      if (!effectiveToken) {
        setError('Invitation token is missing.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await api.getInviteByToken(effectiveToken);
        if (isMounted) {
          setInvite(data.invite);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Invalid or expired invitation token.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInviteDetails();
    return () => {
      isMounted = false;
    };
  }, [effectiveToken]);

  const handleAccept = async () => {
    if (!effectiveToken) return;
    setAccepting(true);
    try {
      const res = await api.acceptInvite(effectiveToken);
      setActionDone('accepted');
      addToast({
        title: 'Invitation Accepted! 🎉',
        message: `You joined ${invite?.workspace?.name || 'the workspace'}.`,
        type: 'success',
      });

      // Refresh workspace context if user is logged in
      if (refreshWorkspaces) {
        const updatedWorkspaces = await refreshWorkspaces();
        if (res.workspaceId && setActiveWorkspace) {
          const joinedWs = updatedWorkspaces?.find((w) => w._id === res.workspaceId);
          if (joinedWs) setActiveWorkspace(joinedWs);
        }
      }

      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      addToast({
        title: 'Failed to Accept Invitation',
        message: err.message || 'An error occurred while accepting the invitation.',
        type: 'error',
      });
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!effectiveToken) return;
    setRejecting(true);
    try {
      await api.rejectInvite(effectiveToken);
      setActionDone('rejected');
      addToast({
        title: 'Invitation Declined',
        message: 'You have declined the workspace invitation.',
        type: 'info',
      });
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      addToast({
        title: 'Failed to Decline Invitation',
        message: err.message || 'An error occurred while declining the invitation.',
        type: 'error',
      });
    } finally {
      setRejecting(false);
    }
  };

  const isEmailMismatch = user && invite && user.email.toLowerCase() !== invite.inviteeEmail?.toLowerCase();

  return (
    <div className="auth-layout min-h-screen flex bg-zinc-950 text-zinc-100">
      {/* Left Brand Panel */}
      <div className="auth-brand-panel hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-[#0a1628] to-zinc-950" />
        <FloatingOrb className="w-72 h-72 bg-blue-600 top-[10%] left-[15%]" />
        <FloatingOrb className="w-96 h-96 bg-blue-800 bottom-[10%] right-[10%]" style={{ animationDelay: '2s' }} />
        <FloatingOrb className="w-48 h-48 bg-sky-600 top-[55%] left-[55%]" style={{ animationDelay: '4s' }} />
        
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="relative z-10 max-w-md text-left">
          <div className="inline-flex items-center gap-3 mb-10">
            <img src="/favicon.svg" alt="Obliq Logo" className="w-11 h-11 rounded-xl shadow-lg shadow-blue-600/20" />
            <span className="text-2xl font-bold tracking-tight text-zinc-100">Obliq</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold text-zinc-100 leading-tight tracking-tight mb-6">
            Join your team on <br />
            <span className="gradient-text">Obliq Workspace</span>
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed mb-10">
            Collaborate seamless, manage projects, and achieve ambitious goals together.
          </p>

          <div className="flex flex-wrap gap-3">
            {[
              { icon: Sparkles, label: 'Instant workspace access' },
              { icon: Users, label: 'Team collaboration' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm text-zinc-400">
                <Icon className="w-3.5 h-3.5 text-blue-400" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form / Card Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-lg bg-zinc-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/60 relative z-10"
        >
          {/* Header logo on mobile */}
          <div className="flex lg:hidden items-center gap-3 mb-6">
            <img src="/favicon.svg" alt="Obliq Logo" className="w-9 h-9 rounded-xl" />
            <span className="text-xl font-bold text-zinc-100">Obliq</span>
          </div>

          {loading || authLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="text-sm text-zinc-400 font-medium">Verifying invitation details...</p>
            </div>
          ) : actionDone === 'accepted' ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-100">Invitation Accepted!</h2>
              <p className="text-sm text-zinc-400">
                Redirecting you to <span className="text-zinc-200 font-semibold">{invite?.workspace?.name}</span>...
              </p>
            </div>
          ) : actionDone === 'rejected' ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-100">Invitation Declined</h2>
              <p className="text-sm text-zinc-400">Redirecting to Dashboard...</p>
            </div>
          ) : error ? (
            <div className="py-6 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-100">Invalid or Expired Link</h2>
                <p className="mt-2 text-sm text-zinc-400 max-w-sm mx-auto">{error}</p>
              </div>
              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors shadow-lg shadow-blue-600/20"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Banner & Badge */}
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Workspace Invitation</span>
                  <h2 className="text-2xl font-bold text-zinc-100 mt-1">
                    Join {invite?.workspace?.name || 'Workspace'}
                  </h2>
                </div>
                <span className="shrink-0 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-300 capitalize">
                  {invite?.role || 'Member'} Role
                </span>
              </div>

              {/* Workspace details */}
              <div className="bg-zinc-950/60 rounded-xl border border-white/5 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/15 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200">{invite?.workspace?.name}</h3>
                    {invite?.workspace?.description ? (
                      <p className="text-xs text-zinc-400 line-clamp-2">{invite.workspace.description}</p>
                    ) : (
                      <p className="text-xs text-zinc-500 italic">No description provided</p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 space-y-1.5 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Invited by <strong className="text-zinc-200">{invite?.inviter?.name || invite?.inviter?.email}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Sent to: <strong className="text-zinc-200">{invite?.inviteeEmail}</strong></span>
                  </div>
                </div>
              </div>

              {/* Email Mismatch Warning if logged in under different account */}
              {isEmailMismatch && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-300">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <p className="font-semibold text-amber-200">Account Mismatch Warning</p>
                    <p className="mt-0.5 text-amber-300/90">
                      This invitation was sent to <strong>{invite?.inviteeEmail}</strong>, but you are logged in as <strong>{user.email}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!user ? (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-zinc-400 text-center">
                    Please log in or create an account with <span className="text-zinc-200 font-medium">{invite?.inviteeEmail}</span> to accept this invitation.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to={`/login?redirect=/invitation/${effectiveToken}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors shadow-lg shadow-blue-600/20"
                    >
                      Log In
                    </Link>
                    <Link
                      to={`/signup?redirect=/invitation/${effectiveToken}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-colors border border-white/10"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={accepting || rejecting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm transition-colors shadow-lg shadow-blue-600/20"
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Accepting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accept Invitation</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={accepting || rejecting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-transparent hover:bg-zinc-800/80 disabled:opacity-50 text-zinc-400 hover:text-zinc-200 font-medium text-sm transition-colors border border-zinc-700/60"
                  >
                    {rejecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Declining...</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Decline</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
