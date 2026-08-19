import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../services/api';
import {
  Settings, User, Mail, Shield, Building2, Lock,
  Save, Check, AlertCircle, LogOut, Camera, Trash2, Loader2
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

export default function SettingsView() {
  const { user, updateUser, logout } = useAuth();
  const { activeWorkspace, refreshWorkspaces } = useWorkspace();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [wsName, setWsName] = useState(activeWorkspace?.name || '');
  const [wsDesc, setWsDesc] = useState(activeWorkspace?.description || '');
  const [savingWs, setSavingWs] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const isOwner = activeWorkspace?.owner === user?._id || activeWorkspace?.owner === user?.id;

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      addToast({
        title: 'File Too Large',
        message: 'Profile picture must be less than 10MB.',
        type: 'error',
      });
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      const data = await api.uploadAvatar(formData);
      updateUser(data.user);
      addToast({
        title: 'Profile Picture Updated',
        message: 'Your avatar has been updated successfully.',
        type: 'success',
      });
    } catch (err) {
      addToast({
        title: 'Upload Failed',
        message: err.message || 'Could not upload profile picture.',
        type: 'error',
      });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.avatar) return;
    setUploadingAvatar(true);
    try {
      const data = await api.deleteAvatar();
      updateUser(data.user);
      addToast({
        title: 'Avatar Removed',
        message: 'Profile picture reverted to default initials.',
        type: 'success',
      });
    } catch (err) {
      addToast({
        title: 'Failed to Remove',
        message: err.message || 'Could not remove profile picture.',
        type: 'error',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveWorkspace = async (e) => {
    e.preventDefault();
    if (!isOwner || !activeWorkspace?._id) return;
    setSavingWs(true);
    try {
      await api.updateWorkspace(activeWorkspace._id, wsName, wsDesc);
      await refreshWorkspaces();
      addToast({
        title: 'Workspace Saved',
        message: 'Workspace settings updated successfully.',
        type: 'success',
      });
    } catch (err) {
      addToast({
        title: 'Update Failed',
        message: err.message || 'Could not update workspace',
        type: 'error',
      });
    } finally {
      setSavingWs(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-in pb-12 max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-1.5 uppercase tracking-wider">
          <Settings className="w-3.5 h-3.5" />
          Preferences & Configuration
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Account & Workspace Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your personal profile and workspace details.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-[#0c121e] rounded-2xl border border-slate-800/80 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-400" />
          Personal Profile & Avatar
        </h2>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-slate-800/80">
          <div className="relative group">
            <Avatar
              name={user?.name}
              src={user?.avatar}
              size="lg"
              className="w-20 h-20 text-xl border-2 border-slate-700 shadow-md"
            />
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div>
              <h3 className="text-lg font-bold text-slate-100">{user?.name}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {user?.email}
              </p>
            </div>

            {/* Profile Picture Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarFileChange}
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
              />
              <Button
                type="button"
                variant="gradient"
                size="sm"
                icon={Camera}
                loading={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
              >
                {user?.avatar ? 'Replace Photo' : 'Upload Photo'}
              </Button>

              {user?.avatar && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={Trash2}
                  disabled={uploadingAvatar}
                  onClick={handleRemoveAvatar}
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-slate-800"
                >
                  Remove
                </Button>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Supports JPG, PNG, WEBP, or GIF (max 10MB).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
            <input
              type="text"
              readOnly
              value={user?.name || ''}
              className="w-full bg-[#090d16] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 outline-none cursor-not-allowed opacity-80"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
            <input
              type="email"
              readOnly
              value={user?.email || ''}
              className="w-full bg-[#090d16] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 outline-none cursor-not-allowed opacity-80"
            />
          </div>
        </div>
      </div>

      {/* Workspace Settings Card */}
      <div className="bg-[#0c121e] rounded-2xl border border-slate-800/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            Current Workspace
          </h2>
          <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            {isOwner ? 'Owner Controls' : 'Member View'}
          </span>
        </div>

        <form onSubmit={handleSaveWorkspace} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Workspace Name</label>
            <input
              type="text"
              disabled={!isOwner}
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              className={`w-full bg-[#090d16] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none ${
                isOwner ? 'focus:border-blue-500' : 'cursor-not-allowed opacity-80'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Workspace Description</label>
            <textarea
              rows={3}
              disabled={!isOwner}
              value={wsDesc}
              onChange={(e) => setWsDesc(e.target.value)}
              placeholder="Workspace mission or team details..."
              className={`w-full bg-[#090d16] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none resize-none ${
                isOwner ? 'focus:border-blue-500' : 'cursor-not-allowed opacity-80'
              }`}
            />
          </div>

          {isOwner && (
            <div className="flex justify-end pt-2">
              <Button variant="gradient" type="submit" loading={savingWs} icon={Save}>
                Save Workspace
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
