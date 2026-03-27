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
  const displayName = (formData.name || session?.name || 'Your Name').trim() || 'Your Name';
  const accountLabel = isOrganization ? 'Organization account' : 'Donor account';
  const profileHint = loading
    ? 'Loading your profile information...'
    : saving
      ? 'Saving your latest profile changes...'
      : 'Click camera icon to change profile picture';
  const avatarInitials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U';
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
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Profile preview"
                      className="h-36 w-36 rounded-full border border-[#E2E8F0] object-cover shadow-[0_8px_24px_rgba(15,23,42,0.15)]"
                    />
                  ) : (
                    <div className="flex h-36 w-36 items-center justify-center rounded-full border border-[#E2E8F0] bg-[linear-gradient(180deg,#EAF3FF_0%,#DDEBFF_100%)] text-4xl font-black text-[#1D4ED8] shadow-[0_8px_24px_rgba(15,23,42,0.15)]">
                      {avatarInitials}
                    </div>
                  )}
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-24 w-24 shrink-0">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Profile avatar"
                    className="h-24 w-24 rounded-full border border-[#CBD5E1] object-cover shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#CBD5E1] bg-[linear-gradient(180deg,#EAF3FF_0%,#DDEBFF_100%)] text-2xl font-black text-[#1D4ED8] shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                    {avatarInitials}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsCameraModalOpen(true)}
                  className="absolute bottom-0 right-0 inline-flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#F8FAFC] bg-[#2563EB] text-white shadow-[0_8px_18px_rgba(37,99,235,0.25)] transition hover:scale-[1.03] hover:bg-[#1D4ED8]"
                  aria-label="Upload avatar"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="min-w-0">
                <p className="text-[2rem] font-black leading-none tracking-tight text-[#0F172A]">{displayName}</p>
                <p className="mt-2 text-lg font-medium text-[#476581]">{accountLabel}</p>
                <p className="mt-1 text-sm text-[#64748B]">{profileHint}</p>
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
