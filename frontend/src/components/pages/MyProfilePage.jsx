import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Check,
  CreditCard,
  Globe2,
  ImageIcon,
  Mail,
  MoreVertical,
  Phone,
  PlusCircle,
  Save,
  Trash2,
  Upload,
  UserRound,
  Wallet,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  deactivateAccount,
  findOrganizationByEmail,
  findUserByEmail,
  getOrganizationById,
  getUserById,
  updateOrganizationProfile,
  updateUserProfile,
} from '@/services/user-service.js';
import { getPrivacyPreferences, setPrivacyPreferences } from '@/utils/user-preferences';

const DONOR_PROFILE_PREFS_KEY = 'chomnuoy_donor_profile_preferences';
const DEFAULT_COVER_IMAGE =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80';
const DEFAULT_AVATAR_FALLBACK =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80';

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

function getSessionScopedKey(baseKey) {
  try {
    const session = getSession();
    const userId = Number(session?.userId);
    if (Number.isFinite(userId) && userId > 0) return `${baseKey}_user_${userId}`;
    const email = String(session?.email || '').trim().toLowerCase();
    if (email) return `${baseKey}_email_${email}`;
    return baseKey;
  } catch {
    return baseKey;
  }
}

function getStorageFileUrl(path) {
  if (!path) return '';
  const value = String(path).trim();
  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('blob:') ||
    value.startsWith('data:')
  ) {
    return value;
  }

  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const normalizedPath = value.replace(/\\/g, '/').replace(/^\/+/, '');
  return normalizedPath.startsWith('files/')
    ? `${apiBase}/${normalizedPath}`
    : `${apiBase}/files/${normalizedPath}`;
}

function withCacheBust(url) {
  if (!url || url.startsWith('blob:')) return url || '';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${Date.now()}`;
}

function getInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return 'DU';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function readDonorProfilePreferences() {
  const key = getSessionScopedKey(DONOR_PROFILE_PREFS_KEY);
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      return {
        emailUpdates: true,
        monthlyImpact: true,
        campaignAlerts: false,
        language: 'English (US)',
      };
    }
    const parsed = JSON.parse(stored);
    return {
      emailUpdates: parsed?.emailUpdates ?? true,
      monthlyImpact: parsed?.monthlyImpact ?? true,
      campaignAlerts: parsed?.campaignAlerts ?? false,
      language: parsed?.language || 'English (US)',
    };
  } catch {
    return {
      emailUpdates: true,
      monthlyImpact: true,
      campaignAlerts: false,
      language: 'English (US)',
    };
  }
}

function saveDonorProfilePreferences(preferences) {
  const key = getSessionScopedKey(DONOR_PROFILE_PREFS_KEY);
  window.localStorage.setItem(key, JSON.stringify(preferences));
  setPrivacyPreferences({
    ...getPrivacyPreferences(),
    publicProfile: preferences.emailUpdates,
    showDonations: preferences.monthlyImpact,
  });
}

function PaymentMethodCard({ title, subtitle, icon, actionLabel, accentClass, badge }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentClass}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0F172A]">{title}</p>
          <p className="text-xs text-[#64748B]">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {badge ? (
          <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2563EB]">
            {badge}
          </span>
        ) : null}
        <button
          type="button"
          className="rounded-lg border border-[#D7DCE5] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#475569] transition hover:bg-[#F8FAFC]"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

function PreferenceRow({ checked, onChange, title, description }) {
  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
      />
      <span>
        <span className="block text-sm font-medium text-[#0F172A]">{title}</span>
        <span className="block text-xs text-[#64748B]">{description}</span>
      </span>
    </label>
  );
}

export default function MyProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const webcamVideoRef = useRef(null);
  const webcamCanvasRef = useRef(null);
  const session = useMemo(() => getSession(), []);

  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [showIllustrations, setShowIllustrations] = useState(false);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [webcamError, setWebcamError] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [resolvedAccountId, setResolvedAccountId] = useState(
    session?.userId ?? session?.accountId ?? session?.id ?? session?.user_id ?? null,
  );
  const [formData, setFormData] = useState({
    name: session?.name || '',
    email: session?.email || '',
    phone: session?.phone || '',
    avatar: session?.avatar || '',
  });
  const [preferences, setPreferences] = useState(() => readDonorProfilePreferences());

  const isOrganization = session?.role === 'Organization' || session?.accountType === 'Organization';
  const displayName = (formData.name || session?.name || 'Donor User').trim() || 'Donor User';
  const avatarInitials = getInitials(displayName);
  const joinYear = new Date().getFullYear();

  const illustrationOptions = [
    DEFAULT_AVATAR_FALLBACK,
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=320&q=80',
  ];

  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.isLoggedIn) {
        navigate('/login', { replace: true });
        return;
      }

      let effectiveAccountId = resolvedAccountId;

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
          // Fall back to current session values.
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
          phone: data?.phone || session?.phone || '',
          avatar: getStorageFileUrl(data?.avatar_path) || session?.avatar || '',
        });
        setError('');
      } catch {
        setFormData({
          name: session?.name || '',
          email: session?.email || '',
          phone: session?.phone || '',
          avatar: session?.avatar || '',
        });
      }
    };

    loadProfile();
  }, [isOrganization, navigate, resolvedAccountId, session]);

  useEffect(() => {
    setPreferences(readDonorProfilePreferences());
  }, []);

  useEffect(() => () => {
    if (formData.avatar?.startsWith?.('blob:')) {
      URL.revokeObjectURL(formData.avatar);
    }
  }, [formData.avatar]);

  useEffect(() => {
    if (!isWebcamOpen) return undefined;

    let active = true;
    let nextStream = null;

    const startWebcam = async () => {
      try {
        setWebcamError('');
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera access is not supported in this browser.');
        }

        nextStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });

        if (!active) {
          nextStream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = nextStream;
          await webcamVideoRef.current.play().catch(() => {});
        }
      } catch (err) {
        setWebcamError(err instanceof Error ? err.message : 'Unable to access your camera.');
      }
    };

    startWebcam();

    return () => {
      active = false;
      if (nextStream) {
        nextStream.getTracks().forEach((track) => track.stop());
      }
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = null;
      }
    };
  }, [isWebcamOpen]);

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setAvatarFile(file);
    setFormData((previous) => ({
      ...previous,
      avatar: URL.createObjectURL(file),
    }));
    setIsCameraModalOpen(false);
    setShowIllustrations(false);
    setIsWebcamOpen(false);
  };

  const handleSelectIllustration = (url) => {
    setAvatarFile(null);
    setFormData((previous) => ({
      ...previous,
      avatar: url,
    }));
    setIsCameraModalOpen(false);
    setShowIllustrations(false);
    setIsWebcamOpen(false);
  };

  const handleOpenCamera = async () => {
    setShowIllustrations(false);

    const isMobileLike = /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent || '');
    if (isMobileLike) {
      cameraInputRef.current?.click();
      return;
    }

    setIsWebcamOpen(true);
  };

  const handleCaptureFromWebcam = () => {
    const video = webcamVideoRef.current;
    const canvas = webcamCanvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setWebcamError('Camera is not ready yet. Please try again.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setWebcamError('Unable to capture photo.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setWebcamError('Unable to capture photo.');
        return;
      }

      const file = new File([blob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(file);
      setAvatarFile(file);
      setFormData((previous) => ({
        ...previous,
        avatar: previewUrl,
      }));
      setIsWebcamOpen(false);
      setIsCameraModalOpen(false);
      setWebcamError('');
    }, 'image/jpeg', 0.92);
  };

  const handleFieldChange = (field) => (event) => {
    setError('');
    setSuccess('');
    setFormData((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const handlePreferenceChange = (field) => (event) => {
    setSuccess('');
    setPreferences((previous) => ({
      ...previous,
      [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      let effectiveAccountId = resolvedAccountId;

      if (!effectiveAccountId && formData.email) {
        let matched = isOrganization
          ? await findOrganizationByEmail(formData.email)
          : await findUserByEmail(formData.email);

        if (!matched?.id) {
          matched = isOrganization
            ? await findUserByEmail(formData.email)
            : await findOrganizationByEmail(formData.email);
        }

        if (matched?.id) {
          effectiveAccountId = matched.id;
          setResolvedAccountId(matched.id);
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
        isLoggedIn: true,
        userId: effectiveAccountId,
        name: updated?.name || formData.name,
        email: updated?.email || formData.email,
        phone: updated?.phone ?? formData.phone,
        avatar: finalAvatar,
      };

      setFormData((previous) => ({
        ...previous,
        name: updated?.name || previous.name,
        email: updated?.email || previous.email,
        phone: updated?.phone ?? previous.phone,
        avatar: finalAvatar,
      }));

      saveDonorProfilePreferences(preferences);
      window.localStorage.setItem('chomnuoy_session', JSON.stringify(nextSession));
      window.dispatchEvent(new Event('chomnuoy-session-updated'));

      setAvatarFile(null);
      setSuccess('Profile settings updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isDeleting) return;

    const confirmed = window.confirm(
      'Delete your account permanently? Your donation history and profile cannot be restored.',
    );
    if (!confirmed) return;

    const activeSession = getSession();
    const userId = Number(activeSession?.userId || resolvedAccountId || 0);
    const accountType = activeSession?.accountType || activeSession?.role || 'Donor';

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      setError('Unable to delete account: missing user session.');
      return;
    }

    setIsDeleting(true);
    setError('');
    setSuccess('');

    try {
      await deactivateAccount({ accountType, userId });
      window.localStorage.removeItem('chomnuoy_session');
      window.localStorage.removeItem('authToken');
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#EEF4FB_0%,#F8FAFC_34%,#F4F7FB_100%)] py-8">
      <div className="mx-auto w-full max-w-7xl px-4">
        <section>
          <h1 className="text-[2rem] font-bold tracking-tight text-[#0F172A]">My Profile Settings</h1>
          <p className="mt-1 text-sm text-[#64748B]">Manage your account information and donation preferences.</p>
        </section>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {success}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
            <div className="w-full max-w-xl overflow-hidden rounded-[28px] border border-[#D7DCE5] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">Profile Photo</p>
                  <h2 className="mt-1 text-xl font-semibold text-[#0F172A]">Update your avatar</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#64748B] transition hover:bg-[#F1F5F9]"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCameraModalOpen(false);
                      setShowIllustrations(false);
                    }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] text-[#0F172A] transition hover:bg-[#F8FAFC]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-7">
                <div className="flex flex-col items-center">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Profile preview"
                      className="h-32 w-32 rounded-full border border-[#CBD5E1] object-cover shadow-[0_10px_28px_rgba(15,23,42,0.12)]"
                    />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-full border border-[#CBD5E1] bg-[linear-gradient(180deg,#DBEAFE_0%,#E0F2FE_100%)] text-3xl font-black text-[#1D4ED8] shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                      {avatarInitials}
                    </div>
                  )}
                  <p className="mt-4 text-sm text-[#64748B]">Choose a photo or quick illustration for your donor account.</p>
                </div>

                {showIllustrations ? (
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {illustrationOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleSelectIllustration(option)}
                        className="overflow-hidden rounded-2xl border border-[#E2E8F0] p-1 transition hover:border-[#93C5FD] hover:shadow-[0_10px_24px_rgba(37,99,235,0.14)]"
                      >
                        <img src={option} alt="Avatar option" className="h-20 w-full rounded-xl object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setShowIllustrations((previous) => !previous)}
                    className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-left transition hover:bg-[#F8FAFC]"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                      <ImageIcon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold text-[#0F172A]">Illustrations</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-left transition hover:bg-[#F8FAFC]"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                      <Upload className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold text-[#0F172A]">Upload</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenCamera}
                    className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-left transition hover:bg-[#F8FAFC]"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                      <Camera className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold text-[#0F172A]">Camera</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {isWebcamOpen ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4">
            <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-[#D7DCE5] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">Camera</p>
                  <h2 className="mt-1 text-xl font-semibold text-[#0F172A]">Take a profile photo</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsWebcamOpen(false);
                    setWebcamError('');
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] text-[#0F172A] transition hover:bg-[#F8FAFC]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-6">
                <div className="overflow-hidden rounded-[24px] bg-[#0F172A]">
                  <video
                    ref={webcamVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
                <canvas ref={webcamCanvasRef} className="hidden" />
                {webcamError ? (
                  <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {webcamError}
                  </p>
                ) : (
                  <p className="mt-4 text-sm text-[#64748B]">Position yourself in frame, then capture the photo.</p>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsWebcamOpen(false);
                      setWebcamError('');
                    }}
                    className="rounded-xl border border-[#D7DCE5] bg-white px-4 py-2.5 text-sm font-semibold text-[#475569] transition hover:bg-[#F8FAFC]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCaptureFromWebcam}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(37,99,235,0.22)] transition hover:bg-[#1D4ED8]"
                  >
                    <Camera className="h-4 w-4" />
                    Capture Photo
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <section className="mt-6 overflow-hidden rounded-[28px] border border-[#D7DCE5] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <div className="relative h-52 w-full overflow-hidden sm:h-60">
            <img src={DEFAULT_COVER_IMAGE} alt="Profile cover" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.42)_100%)]" />
            <button
              type="button"
              className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-xs font-semibold text-[#334155] backdrop-blur transition hover:bg-white"
            >
              <Camera className="h-3.5 w-3.5" />
              Update Cover
            </button>
          </div>

          <div className="p-4 sm:p-5">
            <div className="rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Profile avatar"
                      className="h-full w-full rounded-full border-4 border-white object-cover shadow-[0_10px_24px_rgba(15,23,42,0.1)]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full border-4 border-white bg-[linear-gradient(180deg,#DBEAFE_0%,#E0F2FE_100%)] text-2xl font-black text-[#1D4ED8] shadow-[0_10px_24px_rgba(15,23,42,0.1)]">
                      {avatarInitials}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsCameraModalOpen(true)}
                    className="absolute bottom-0 right-0 inline-flex h-9 w-9 items-center justify-center rounded-full border-4 border-[#F8FAFC] bg-[#2563EB] text-white shadow-[0_8px_18px_rgba(37,99,235,0.25)] transition hover:bg-[#1D4ED8]"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] sm:text-[2rem]">{displayName}</h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#DBEAFE] px-2.5 py-1 text-xs font-semibold text-[#1D4ED8]">
                      <Check className="h-3.5 w-3.5" />
                      donor
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#64748B]">Member since {joinYear} | Phnom Penh, Cambodia</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleSave} className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
          <div className="space-y-6">
            <section className="rounded-[24px] border border-[#D7DCE5] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                  <UserRound className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-[#0F172A]">Personal Information</h3>
                  <p className="text-xs text-[#64748B]">Full name, email, and phone number.</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[#334155]">Full Name</span>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={handleFieldChange('name')}
                      className="h-11 w-full rounded-xl border border-[#D7DCE5] bg-white pl-10 pr-4 text-sm text-[#0F172A] outline-none transition focus:border-[#60A5FA] focus:ring-4 focus:ring-[#DBEAFE]"
                      placeholder="Enter your full name"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[#334155]">Email Address</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={handleFieldChange('email')}
                      className="h-11 w-full rounded-xl border border-[#D7DCE5] bg-white pl-10 pr-4 text-sm text-[#0F172A] outline-none transition focus:border-[#60A5FA] focus:ring-4 focus:ring-[#DBEAFE]"
                      placeholder="name@example.com"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[#334155]">Phone Number</span>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={handleFieldChange('phone')}
                      className="h-11 w-full rounded-xl border border-[#D7DCE5] bg-white pl-10 pr-4 text-sm text-[#0F172A] outline-none transition focus:border-[#60A5FA] focus:ring-4 focus:ring-[#DBEAFE]"
                      placeholder="092871472"
                    />
                  </div>
                </label>
              </div>

              <div className="mt-5">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(37,99,235,0.22)] transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </section>

            <section className="rounded-[24px] border border-[#D7DCE5] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                  <Globe2 className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-[#0F172A]">Preferences</h3>
                  <p className="text-xs text-[#64748B]">Notification settings and language selection.</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <PreferenceRow
                  checked={preferences.emailUpdates}
                  onChange={handlePreferenceChange('emailUpdates')}
                  title="Email updates about my donations"
                  description="Receive donation confirmations and progress updates by email."
                />

                <PreferenceRow
                  checked={preferences.monthlyImpact}
                  onChange={handlePreferenceChange('monthlyImpact')}
                  title="Monthly impact reports"
                  description="See how your contributions are making a difference."
                />

                <PreferenceRow
                  checked={preferences.campaignAlerts}
                  onChange={handlePreferenceChange('campaignAlerts')}
                  title="New campaign alerts"
                  description="Get notified about urgent causes and nearby donation needs."
                />

                <div className="border-t border-[#E2E8F0] pt-4">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-[#334155]">Language Selection</span>
                    <select
                      value={preferences.language}
                      onChange={handlePreferenceChange('language')}
                      className="h-11 w-full rounded-xl border border-[#D7DCE5] bg-white px-4 text-sm text-[#0F172A] outline-none transition focus:border-[#60A5FA] focus:ring-4 focus:ring-[#DBEAFE]"
                    >
                      <option>English (US)</option>
                      <option>English (UK)</option>
                      <option>Khmer</option>
                    </select>
                  </label>
                </div>
              </div>
            </section>
          </div>
          <div className="space-y-6">
            <section className="rounded-[24px] border border-[#D7DCE5] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-[#0F172A]">Payment Methods</h3>
                    <p className="text-xs text-[#64748B]">Manage your preferred donor payment channels.</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg text-xs font-semibold text-[#2563EB] transition hover:text-[#1D4ED8]"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add New
                </button>
              </div>

              <div className="mt-5 space-y-3">
                <PaymentMethodCard
                  title="ABA Mobile Pay"
                  subtitle="Connected banking ending in **** 1244"
                  badge="default"
                  actionLabel="Edit"
                  accentClass="bg-[#EDF4FF] text-[#2563EB]"
                  icon={<CreditCard className="h-5 w-5" />}
                />
                <PaymentMethodCard
                  title="Wing Money"
                  subtitle="Connected account ending in **** 92"
                  actionLabel="Set Default"
                  accentClass="bg-[#EAFBF3] text-[#16A34A]"
                  icon={<Wallet className="h-5 w-5" />}
                />
              </div>
            </section>

            <section className="rounded-[24px] border border-[#F3C3C3] bg-[#FFF7F7] p-5 shadow-[0_12px_30px_rgba(127,29,29,0.05)]">
              <div className="flex items-center gap-2 text-[#DC2626]">
                <AlertTriangle className="h-4 w-4" />
                <h3 className="text-base font-semibold">Danger Zone</h3>
              </div>
              <p className="mt-2 text-sm text-[#9F1239]">
                Once you delete your account, there is no going back. All your donation history and impact metrics
                will be permanently removed.
              </p>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#FECACA] bg-white px-4 py-2.5 text-sm font-semibold text-[#DC2626] transition hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </section>
          </div>
        </form>
      </div>
    </main>
  );
}
