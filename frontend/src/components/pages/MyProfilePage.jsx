import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Camera,
  CreditCard,
  Globe2,
  ImageIcon,
  Lock,
  Mail,
  MoreVertical,
  Phone,
  PlusCircle,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getOrganizationById,
  getUserById,
  findOrganizationByEmail,
  findUserByEmail,
  updateOrganizationProfile,
  updateUserProfile,
} from '@/services/user-service.js';

function getSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed) return null;
    if (!parsed.isLoggedIn && (parsed.email || parsed.userId || parsed.id || parsed.role || parsed.accountType)) {
      const normalized = { ...parsed, isLoggedIn: true };
      window.localStorage.setItem('chomnuoy_session', JSON.stringify(normalized));
      return normalized;
    }
    return parsed;
  } catch {
    return null;
  }
}

function getStorageFileUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const normalizedPath = String(path).replace(/\\/g, '/').replace(/^\/+/, '');
  return normalizedPath.startsWith('files/')
    ? `${apiBase}/${normalizedPath}`
    : `${apiBase}/files/${normalizedPath}`;
}

function withCacheBust(url) {
  if (!url || url.startsWith('blob:')) return url || '';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${Date.now()}`;
}

export default function MyProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const syncTimersRef = useRef([]);
  const session = useMemo(() => getSession(), []);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [hideSaveToast, setHideSaveToast] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [showIllustrations, setShowIllustrations] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [formData, setFormData] = useState({
    name: session?.name || '',
    email: session?.email || '',
    phone: '',
    avatar: session?.avatar || '',
  });
  const [preferences, setPreferences] = useState({
    emailUpdates: true,
    monthlyImpact: true,
    campaignAlerts: false,
    language: 'English (US)',
  });

  const isOrganization = session?.role === 'Organization' || session?.accountType === 'Organization';
  const accountId =
    session?.userId ?? session?.accountId ?? session?.id ?? session?.user_id ?? null;
  const [resolvedAccountId, setResolvedAccountId] = useState(accountId);
  const illustrationOptions = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=320&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80',
    'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=320&q=80',
  ];

  const clearSyncTimers = () => {
    syncTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    syncTimersRef.current = [];
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.isLoggedIn) {
        navigate('/login', { replace: true });
        return;
      }

      let effectiveAccountId = accountId;
      if (!effectiveAccountId && session?.email) {
        try {
          let matched = isOrganization
            ? await findOrganizationByEmail(session.email)
            : await findUserByEmail(session.email);
          if (!matched?.id) {
            matched = isOrganization
              ? await findUserByEmail(session.email)
              : await findOrganizationByEmail(session.email);
          }
          if (matched?.id) {
            effectiveAccountId = matched.id;
            setResolvedAccountId(matched.id);
            const nextSession = { ...(getSession() || {}), userId: matched.id };
            window.localStorage.setItem('chomnuoy_session', JSON.stringify(nextSession));
            window.dispatchEvent(new Event('chomnuoy-session-updated'));
          }
        } catch {
          // ignore lookup failure and fall back to session data
        }
      }

      if (!effectiveAccountId) {
        setError('Your session is missing an account id. Please sign in again.');
        return;
      }

      try {
        const data = isOrganization
          ? await getOrganizationById(effectiveAccountId)
          : await getUserById(effectiveAccountId);

        setFormData({
          name: data?.name || session?.name || '',
          email: data?.email || session?.email || '',
          phone: data?.phone || '',
          avatar: getStorageFileUrl(data?.avatar_path) || session?.avatar || '',
        });
        setError('');
      } catch {
        setFormData({
          name: session?.name || '',
          email: session?.email || '',
          phone: '',
          avatar: session?.avatar || '',
        });
      } finally {
        setLoading(false);
      }
    };

    setResolvedAccountId(accountId);
    setLoading(true);
    loadProfile();
  }, [accountId, isOrganization, navigate, session]);

  useEffect(() => () => clearSyncTimers(), []);

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setAvatarFile(file);
    setFormData((prev) => ({
      ...prev,
      avatar: URL.createObjectURL(file),
    }));
    setIsEditing(true);
    setIsCameraModalOpen(false);
    setShowIllustrations(false);
  };

  const handleSelectIllustration = (url) => {
    setAvatarFile(null);
    setFormData((prev) => ({
      ...prev,
      avatar: url,
    }));
    setIsEditing(true);
    setIsCameraModalOpen(false);
    setShowIllustrations(false);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    clearSyncTimers();
    setError('');
    setSuccess('');

    setSaving(true);

    try {
      let effectiveAccountId = resolvedAccountId;
      if (!effectiveAccountId) {
        const emailToUse = formData.email || session?.email || '';
        if (emailToUse) {
          let matched = isOrganization
            ? await findOrganizationByEmail(emailToUse)
            : await findUserByEmail(emailToUse);
          if (!matched?.id) {
            matched = isOrganization
              ? await findUserByEmail(emailToUse)
              : await findOrganizationByEmail(emailToUse);
          }
          if (matched?.id) {
            effectiveAccountId = matched.id;
            setResolvedAccountId(matched.id);
            const nextSession = { ...(getSession() || {}), userId: matched.id };
            window.localStorage.setItem('chomnuoy_session', JSON.stringify(nextSession));
            window.dispatchEvent(new Event('chomnuoy-session-updated'));
          }
        }
      }

      if (!effectiveAccountId) {
        setError('Your session is missing an account id. Please sign in again.');
        return;
      }

      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('email', formData.email);
      if (!isOrganization) {
        payload.append('phone', formData.phone);
      }
      if (avatarFile) {
        payload.append('avatar', avatarFile);
      }

      const updated = isOrganization
        ? await updateOrganizationProfile(effectiveAccountId, payload)
        : await updateUserProfile(effectiveAccountId, payload);

      const savedAvatarUrl = withCacheBust(getStorageFileUrl(updated?.avatar_path));
      const finalAvatar = savedAvatarUrl || formData.avatar || session?.avatar || '';
      const nextSession = {
        ...(getSession() || {}),
        name: updated?.name || formData.name,
        email: updated?.email || formData.email,
        avatar: finalAvatar,
      };

      setFormData((prev) => ({
        ...prev,
        name: updated?.name || prev.name,
        email: updated?.email || prev.email,
        phone: updated?.phone ?? prev.phone,
        avatar: finalAvatar,
      }));
      setAvatarFile(null);
      setIsEditing(false);
      setShowSaveToast(true);
      setHideSaveToast(false);

      const hideTimer = window.setTimeout(() => {
        setHideSaveToast(true);
      }, 4500);

      const syncTimer = window.setTimeout(() => {
        window.localStorage.setItem('chomnuoy_session', JSON.stringify(nextSession));
        window.dispatchEvent(new Event('chomnuoy-session-updated'));
        setShowSaveToast(false);
        setHideSaveToast(false);
        setSuccess('Profile updated successfully.');
      }, 5000);

      syncTimersRef.current = [hideTimer, syncTimer];
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="rounded-2xl border border-[#D7DCE5] bg-white p-6 text-[#64748B]">Loading profile...</div>
      </main>
    );
  }
  return (
    <main className="mx-auto w-full max-w-6xl bg-[#F4F6FA] px-4 py-8">
      {showSaveToast ? (
        <div
          className={`fixed right-4 top-5 z-50 rounded-xl border border-[#BFDBFE] bg-white px-4 py-3 text-sm font-semibold text-[#1D4ED8] shadow-[0_10px_28px_rgba(37,99,235,0.2)] transition-all duration-500 ${
            hideSaveToast ? 'translate-x-[120%] opacity-0' : 'translate-x-0 opacity-100'
          }`}
        >
          Profile saved. Navbar photo will update in 5 seconds...
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleAvatarChange}
      />

      {isCameraModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">Profile</p>
                <h3 className="mt-1 text-2xl font-semibold text-[#0F172A]">Change profile picture</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#64748B] hover:bg-[#F1F5F9]"
                  aria-label="More options"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCameraModalOpen(false);
                    setShowIllustrations(false);
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]"
                  aria-label="Close picture modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-8">
              <div className="flex flex-col items-center">
                <div className="relative h-36 w-36">
                  <img
                    src={formData.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80'}
                    alt="Profile preview"
                    className="h-36 w-36 rounded-full border border-[#E2E8F0] object-cover shadow-[0_8px_24px_rgba(15,23,42,0.15)]"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white bg-[#0F172A] text-white shadow-[0_10px_22px_rgba(15,23,42,0.25)] hover:bg-[#1E293B]"
                    aria-label="Upload avatar"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                </div>
                <p className="mt-4 text-sm text-[#64748B]">Pick a photo or illustration. JPG/PNG, max 5MB.</p>
              </div>

              {showIllustrations ? (
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {illustrationOptions.map((imageUrl) => (
                    <button
                      key={imageUrl}
                      type="button"
                      onClick={() => handleSelectIllustration(imageUrl)}
                      className="rounded-2xl border border-[#E2E8F0] bg-white p-1 transition hover:border-[#60A5FA] hover:shadow-[0_8px_18px_rgba(37,99,235,0.2)]"
                    >
                      <img src={imageUrl} alt="Illustration option" className="h-20 w-full rounded-xl object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setShowIllustrations((prev) => !prev)}
                  className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-left transition hover:border-[#BFDBFE] hover:bg-[#F8FAFC]"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#E2E8F0] text-[#475569]">
                    <ImageIcon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-[#0F172A]">Browse illustrations</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-left transition hover:border-[#BFDBFE] hover:bg-[#F8FAFC]"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#E2E8F0] text-[#475569]">
                    <Upload className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-[#0F172A]">Upload from device</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-left transition hover:border-[#BFDBFE] hover:bg-[#F8FAFC]"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#E2E8F0] text-[#475569]">
                    <Camera className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-[#0F172A]">Take a picture</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <section>
        <h1 className="text-[34px] font-bold tracking-tight text-[#0F172A]">My Profile Settings</h1>
        <p className="mt-1 text-sm text-[#64748B]">Manage your account information and donation preferences.</p>
      </section>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {success}
        </div>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-2xl border border-[#D7DCE5] bg-white shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
        <div className="relative h-64 w-full">
          <img
            src="https://images.unsplash.com/photo-1477233534935-f5e6fe7c1159?auto=format&fit=crop&w=1600&q=80"
            alt="Profile cover"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/45" />
          <button
            type="button"
            className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-lg border border-[#D5DCE8] bg-white/95 px-3 py-2 text-xs font-semibold text-[#334155] backdrop-blur transition hover:bg-white"
          >
            <Camera className="h-3.5 w-3.5" />
            Update Cover
          </button>
        </div>

        <div className="p-5">
          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20">
                <img
                  src={formData.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80'}
                  alt="Profile avatar"
                  className="h-20 w-20 rounded-full border border-[#CBD5E1] object-cover"
                />
                <button
                  type="button"
                  onClick={() => setIsCameraModalOpen(true)}
                  className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                  aria-label="Change profile picture"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[34px] font-bold tracking-tight text-[#0F172A]">{formData.name || 'Your Name'}</p>
                  {!isOrganization ? (
                    <span className="rounded-md bg-[#FEF3C7] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#92400E]">
                      Gold Donor
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#DBEAFE] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#1D4ED8]">
                    <Lock className="h-3 w-3" />
                    Verified Profile
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#64748B]">Member since October 2023 - Phnom Penh, Cambodia</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-6">
          <form
            onSubmit={handleSave}
            className="rounded-2xl border border-[#D7DCE5] bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#93C5FD] text-[#2563EB]">
                <BadgeCheck className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-[18px] font-semibold text-[#0F172A]">Personal Information</h2>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#475569]">
                Full Name
                <input
                  value={formData.name}
                  onFocus={() => setIsEditing(true)}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#2563EB]"
                />
              </label>

              <label className="block text-xs font-semibold text-[#475569]">
                Email Address
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="email"
                    value={formData.email}
                    onFocus={() => setIsEditing(true)}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-[#CBD5E1] bg-white pl-9 pr-3 text-sm text-[#0F172A] outline-none transition focus:border-[#2563EB]"
                  />
                </div>
              </label>

              {!isOrganization ? (
                <label className="block text-xs font-semibold text-[#475569]">
                  Phone Number
                  <div className="relative mt-1">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      value={formData.phone}
                      onFocus={() => setIsEditing(true)}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      className="h-10 w-full rounded-lg border border-[#CBD5E1] bg-white pl-9 pr-3 text-sm text-[#0F172A] outline-none transition focus:border-[#2563EB]"
                    />
                  </div>
                </label>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={saving || !isEditing}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#2563EB] px-4 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </form>

          <div className="rounded-2xl border border-[#D7DCE5] bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#93C5FD] text-[#2563EB]">
                <Bell className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-[18px] font-semibold text-[#0F172A]">Preferences</h2>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Notification Settings</p>

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={preferences.emailUpdates}
                  onChange={(e) => setPreferences((prev) => ({ ...prev, emailUpdates: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#93C5FD]"
                />
                <span>
                  <span className="block font-medium text-[#0F172A]">Email updates about my donations</span>
                  <span className="text-xs text-[#64748B]">Stay informed when your donation is processed.</span>
                </span>
              </label>

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={preferences.monthlyImpact}
                  onChange={(e) => setPreferences((prev) => ({ ...prev, monthlyImpact: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#93C5FD]"
                />
                <span>
                  <span className="block font-medium text-[#0F172A]">Monthly impact reports</span>
                  <span className="text-xs text-[#64748B]">See how your contributions are making a difference.</span>
                </span>
              </label>

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={preferences.campaignAlerts}
                  onChange={(e) => setPreferences((prev) => ({ ...prev, campaignAlerts: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#93C5FD]"
                />
                <span>
                  <span className="block font-medium text-[#0F172A]">New campaign alerts</span>
                  <span className="text-xs text-[#64748B]">Get notified about urgent new donation needs.</span>
                </span>
              </label>

              <div className="border-t border-[#E2E8F0] pt-4">
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#64748B]">Language Selection</label>
                <div className="relative mt-1">
                  <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences((prev) => ({ ...prev, language: e.target.value }))}
                    className="h-10 w-full appearance-none rounded-lg border border-[#CBD5E1] bg-white pl-9 pr-3 text-sm text-[#0F172A] outline-none transition focus:border-[#2563EB]"
                  >
                    <option>English (US)</option>
                    <option>English (UK)</option>
                    <option>Khmer (KH)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-6">
          <div className="rounded-2xl border border-[#D7DCE5] bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#93C5FD] text-[#2563EB]">
                  <CreditCard className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-[18px] font-semibold text-[#0F172A]">Payment Methods</h2>
              </div>
              <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]">
                <PlusCircle className="h-3.5 w-3.5" />
                Add New
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-[#D9E2F2] bg-[#F8FAFF] px-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#0052B4] text-[10px] font-bold text-white">ABA</span>
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">ABA Bank Mobile Pay</p>
                    <p className="text-xs text-[#64748B]">Connected account ending in ••••82</p>
                  </div>
                </div>
                <span className="rounded-md bg-[#E2E8F0] px-2 py-1 text-[10px] font-semibold text-[#334155]">DEFAULT</span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-white px-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#6ABF40] text-[10px] font-bold text-white">WING</span>
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">Wing Money</p>
                    <p className="text-xs text-[#64748B]">Connected account ending in ••••45</p>
                  </div>
                </div>
                <button type="button" className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]">SET DEFAULT</button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#F3C3C3] bg-[#FFF7F7] p-5 shadow-[0_8px_20px_rgba(127,29,29,0.05)]">
            <div className="mb-2 flex items-center gap-2 text-[#DC2626]">
              <AlertTriangle className="h-4 w-4" />
              <h2 className="text-[18px] font-semibold">Danger Zone</h2>
            </div>
            <p className="text-sm text-[#B45309]">
              Once you delete your account, there is no going back. All your donation history and impact metrics will be permanently removed.
            </p>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#FECACA] bg-white px-4 py-2 text-sm font-semibold text-[#DC2626] transition hover:bg-[#FEF2F2]"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
