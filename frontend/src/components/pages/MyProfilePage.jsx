import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ImageIcon, Mail, MoreVertical, Pencil, Phone, Save, Upload, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  findUserByEmail,
  getOrganizationById,
  registerUser,
  getUserById,
  updateOrganizationProfile,
  updateUserProfile,
} from '@/services/user-service.js';

const PROFILE_AVATAR_OVERRIDES_KEY = 'chomnuoy_profile_avatar_overrides';
const LEGACY_DEFAULT_AVATAR_IDENTIFIER = 'photo-1500648767791-00dcc994a43e';

function getSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getAvatarOverrideKey(sessionValue) {
  const normalizedRole = String(sessionValue?.role || sessionValue?.accountType || 'Donor').toLowerCase();
  const email = String(sessionValue?.email || '').trim().toLowerCase();
  const identity = sessionValue?.userId ? `id:${sessionValue.userId}` : (email ? `email:${email}` : 'anonymous');
  return `${normalizedRole}:${identity}`;
}

function saveAvatarOverride(overrideKey, avatarUrl) {
  if (!overrideKey || !avatarUrl) return;

  try {
    const raw = window.localStorage.getItem(PROFILE_AVATAR_OVERRIDES_KEY);
    const current = raw ? JSON.parse(raw) : {};
    const next = {
      ...current,
      [overrideKey]: avatarUrl,
    };
    window.localStorage.setItem(PROFILE_AVATAR_OVERRIDES_KEY, JSON.stringify(next));
  } catch {
    // Ignore localStorage parse/write failures.
  }
}

function getStorageFileUrl(path) {
  if (!path) return '';
  const rawPath = String(path).trim();
  if (
    rawPath.startsWith('http://') ||
    rawPath.startsWith('https://') ||
    rawPath.startsWith('blob:') ||
    rawPath.startsWith('data:')
  ) {
    return rawPath;
  }

  const normalizedPath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const appBase = apiBase.replace(/\/api\/?$/, '');
  if (normalizedPath.startsWith('storage/')) {
    return `${appBase}/${normalizedPath}`;
  }
  return `${appBase}/storage/${normalizedPath}`;
}

function withCacheBust(url) {
  if (!url || url.startsWith('blob:')) return url || '';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${Date.now()}`;
}

function normalizeAvatarUrl(url) {
  if (!url) return '';
  if (url.includes(LEGACY_DEFAULT_AVATAR_IDENTIFIER)) {
    return '';
  }
  return url;
}

function getInitials(name) {
  if (!name) return 'DU';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function normalizeAccountId(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (!/^\d+$/.test(String(value))) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function generateSocialFallbackPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let result = '';
  for (let index = 0; index < 20; index += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${result}1aA!`;
}

export default function MyProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const liveCameraVideoRef = useRef(null);
  const liveCameraStreamRef = useRef(null);
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const syncTimersRef = useRef([]);
  const session = useMemo(() => getSession(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [hideSaveToast, setHideSaveToast] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [showIllustrations, setShowIllustrations] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
  });

  const isOrganization = session?.role === 'Organization' || session?.accountType === 'Organization';
  const accountId = normalizeAccountId(session?.userId);
  const [resolvedAccountId, setResolvedAccountId] = useState(accountId);
  const avatarInitials = getInitials(formData.name || session?.name || 'Donor User');
  const hasAvatarImage = Boolean(normalizeAvatarUrl(formData.avatar));
  const illustrationOptions = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=320&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80',
    'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=320&q=80',
  ];

  const clearSyncTimers = () => {
    syncTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    syncTimersRef.current = [];
  };

  const stopLiveCamera = () => {
    const stream = liveCameraStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      liveCameraStreamRef.current = null;
    }

    if (liveCameraVideoRef.current) {
      liveCameraVideoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.isLoggedIn) {
        navigate('/login', { replace: true });
        return;
      }

      if (!accountId) {
        if (isOrganization) {
          setFormData({
            name: session?.name || '',
            email: session?.email || '',
            phone: '',
            avatar: normalizeAvatarUrl(session?.avatar || ''),
          });
          setLoading(false);
          return;
        }

        const sessionEmail = String(session?.email || '').trim().toLowerCase();
        if (!sessionEmail) {
          setFormData({
            name: session?.name || '',
            email: session?.email || '',
            phone: '',
            avatar: normalizeAvatarUrl(session?.avatar || ''),
          });
          setLoading(false);
          return;
        }

        try {
          let linkedUser = await findUserByEmail(sessionEmail);
          if (!linkedUser) {
            const registerResult = await registerUser({
              role: 'Donor',
              name: session?.name || sessionEmail.split('@')[0] || 'Donor User',
              email: sessionEmail,
              password: generateSocialFallbackPassword(),
            });
            linkedUser = registerResult?.user || null;
          }

          const linkedId = normalizeAccountId(linkedUser?.id);
          if (linkedId) {
            const nextSession = {
              ...(getSession() || {}),
              userId: linkedId,
              role: 'Donor',
              accountType: 'Donor',
              email: linkedUser?.email || session?.email || '',
              name: linkedUser?.name || session?.name || 'Donor User',
            };
            window.localStorage.setItem('chomnuoy_session', JSON.stringify(nextSession));
            window.dispatchEvent(new Event('chomnuoy-session-updated'));
            setResolvedAccountId(linkedId);

            const data = await getUserById(linkedId);
            setFormData({
              name: data?.name || nextSession.name || '',
              email: data?.email || nextSession.email || '',
              phone: data?.phone || '',
              avatar: normalizeAvatarUrl(getStorageFileUrl(data?.avatar_path) || nextSession?.avatar || ''),
            });
            setLoading(false);
            return;
          }
        } catch {
          // Fall through to session-only profile state.
        }

        setFormData({
          name: session?.name || '',
          email: session?.email || '',
          phone: '',
          avatar: normalizeAvatarUrl(session?.avatar || ''),
        });
        setError('Unable to link this account to backend profile automatically. Please sign in with email/password.');
        setLoading(false);
        return;
      }

      setResolvedAccountId(accountId);

      try {
        const data = isOrganization
          ? await getOrganizationById(accountId)
          : await getUserById(accountId);

        setFormData({
          name: data?.name || session?.name || '',
          email: data?.email || session?.email || '',
          phone: data?.phone || '',
          avatar: normalizeAvatarUrl(getStorageFileUrl(data?.avatar_path) || session?.avatar || ''),
        });
      } catch {
        setFormData({
          name: session?.name || '',
          email: session?.email || '',
          phone: '',
          avatar: normalizeAvatarUrl(session?.avatar || ''),
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [accountId, isOrganization, navigate, session]);

  useEffect(() => () => {
    clearSyncTimers();
    stopLiveCamera();
  }, []);

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

  const handleOpenLiveCamera = async () => {
    setCameraError('');

    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      liveCameraStreamRef.current = stream;
      setIsLiveCameraOpen(true);

      window.setTimeout(() => {
        if (!liveCameraVideoRef.current) return;
        liveCameraVideoRef.current.srcObject = stream;
        liveCameraVideoRef.current.play().catch(() => {});
      }, 0);
    } catch {
      setCameraError('Camera access denied. Please allow camera permission.');
      cameraInputRef.current?.click();
    }
  };

  const handleCaptureLivePhoto = () => {
    const video = liveCameraVideoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `camera-profile-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setAvatarFile(file);
      setFormData((prev) => ({
        ...prev,
        avatar: URL.createObjectURL(file),
      }));
      setIsEditing(true);
      setIsLiveCameraOpen(false);
      setIsCameraModalOpen(false);
      setShowIllustrations(false);
      stopLiveCamera();
    }, 'image/jpeg', 0.95);
  };

  const focusInput = (ref) => {
    ref.current?.focus();
    setIsEditing(true);
  };

  const handleAvatarImageError = () => {
    setFormData((prev) => ({ ...prev, avatar: '' }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    clearSyncTimers();
    setError('');
    setSuccess('');
    const currentAccountId = resolvedAccountId || normalizeAccountId(getSession()?.userId);
    if (!currentAccountId) {
      setError('This account is not linked to a backend profile yet. Please sign in with email/password to edit profile.');
      return;
    }
    setSaving(true);

    try {
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
        ? await updateOrganizationProfile(currentAccountId, payload)
        : await updateUserProfile(currentAccountId, payload);

      const savedAvatarUrl = withCacheBust(getStorageFileUrl(updated?.avatar_path));
      const finalAvatar = savedAvatarUrl || normalizeAvatarUrl(formData.avatar) || normalizeAvatarUrl(session?.avatar || '') || '';
      const nextSession = {
        ...(getSession() || {}),
        name: updated?.name || formData.name,
        email: updated?.email || formData.email,
        avatar: finalAvatar,
      };
      const avatarOverrideKey = !isOrganization
        ? (nextSession.avatarOverrideKey || getAvatarOverrideKey(nextSession))
        : null;
      if (avatarOverrideKey) {
        nextSession.avatarOverrideKey = avatarOverrideKey;
      }

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
        if (avatarOverrideKey) {
          saveAvatarOverride(avatarOverrideKey, finalAvatar);
        }
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
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 text-[#64748B]">Loading profile...</div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      {showSaveToast ? (
        <div
          className={`fixed right-4 top-5 z-50 rounded-xl border border-[#BFDBFE] bg-white px-4 py-3 text-sm font-semibold text-[#1D4ED8] shadow-[0_10px_28px_rgba(37,99,235,0.2)] transition-all duration-500 ${
            hideSaveToast ? 'translate-x-[120%] opacity-0' : 'translate-x-0 opacity-100'
          }`}
        >
          Profile saved. Navbar photo will update in 5 seconds...
        </div>
      ) : null}

      {isCameraModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/55 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-2xl rounded-[26px] border border-[#D7E2F2] bg-gradient-to-b from-[#F8FAFF] to-[#F2F6FC] p-3 sm:p-4 shadow-[0_22px_56px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2">
              <button
                type="button"
                onClick={() => {
                  setIsCameraModalOpen(false);
                  setShowIllustrations(false);
                }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#BFD3EF] bg-white text-[#0F172A] transition hover:bg-[#EEF5FF]"
                aria-label="Close picture modal"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="px-3 text-center">
                <h3 className="text-xl font-bold tracking-tight text-[#0F172A] sm:text-2xl">Change profile picture</h3>
                <p className="text-xs font-medium text-[#64748B] sm:text-sm">Choose a source and update your account image.</p>
              </div>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#BFD3EF] bg-white text-[#4B5563] transition hover:bg-[#EEF5FF]"
                aria-label="More options"
              >
                <MoreVertical className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-4 rounded-[22px] border border-[#DCE8F6] bg-white px-3 pb-4 pt-5 sm:px-5 sm:pb-6 sm:pt-7">
              <div className="relative mx-auto h-36 w-36 sm:h-40 sm:w-40">
                {hasAvatarImage ? (
                  <img
                    src={formData.avatar}
                    alt="Profile preview"
                    onError={handleAvatarImageError}
                    className="h-36 w-36 rounded-full border-4 border-white object-cover shadow-[0_14px_28px_rgba(15,23,42,0.22)] sm:h-40 sm:w-40"
                  />
                ) : (
                  <span className="inline-flex h-36 w-36 items-center justify-center rounded-full border-4 border-white bg-[#EAF2FF] text-3xl font-extrabold tracking-[0.04em] text-[#1D4ED8] shadow-[0_14px_28px_rgba(15,23,42,0.14)] sm:h-40 sm:w-40 sm:text-4xl">
                    {avatarInitials}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-0 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#D5E2F2] bg-white text-[#475569] shadow-md transition hover:bg-[#F8FAFC] sm:h-11 sm:w-11"
                  aria-label="Upload avatar"
                >
                  <Camera className="h-5 w-5" />
                </button>
              </div>

              {showIllustrations ? (
                <div className="mx-auto mt-7 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
                  {illustrationOptions.map((imageUrl) => (
                    <button
                      key={imageUrl}
                      type="button"
                      onClick={() => handleSelectIllustration(imageUrl)}
                      className="rounded-xl border border-[#D0D5DD] bg-white p-1 transition hover:border-[#60A5FA] hover:shadow-[0_10px_24px_rgba(37,99,235,0.16)]"
                    >
                      <img src={imageUrl} alt="Illustration option" className="h-20 w-full rounded-lg object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="mx-auto mt-6 grid max-w-2xl grid-cols-1 gap-2 text-center sm:grid-cols-3 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowIllustrations((prev) => !prev)}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FBFF] p-3 transition hover:-translate-y-0.5 hover:border-[#93C5FD] hover:bg-[#EEF5FF]"
                >
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#DFE9F8] text-[#4B5563] transition group-hover:bg-[#D4E4FB]">
                    <ImageIcon className="h-7 w-7" />
                  </span>
                  <span className="text-base font-semibold text-[#1F2937]">Browse Illustrations</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FBFF] p-3 transition hover:-translate-y-0.5 hover:border-[#93C5FD] hover:bg-[#EEF5FF]"
                >
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#DFE9F8] text-[#4B5563] transition group-hover:bg-[#D4E4FB]">
                    <Upload className="h-7 w-7" />
                  </span>
                  <span className="text-base font-semibold text-[#1F2937]">Upload from Device</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenLiveCamera}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FBFF] p-3 transition hover:-translate-y-0.5 hover:border-[#93C5FD] hover:bg-[#EEF5FF]"
                >
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#DFE9F8] text-[#4B5563] transition group-hover:bg-[#D4E4FB]">
                    <Camera className="h-7 w-7" />
                  </span>
                  <span className="text-base font-semibold text-[#1F2937]">Take a picture</span>
                </button>
              </div>
              {cameraError ? (
                <p className="mt-3 text-center text-xs font-semibold text-red-600">{cameraError}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isLiveCameraOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0F172A]/70 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#D5E2F3] bg-white p-4 shadow-[0_22px_56px_rgba(15,23,42,0.4)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0F172A]">Take a picture</h3>
              <button
                type="button"
                onClick={() => {
                  setIsLiveCameraOpen(false);
                  stopLiveCamera();
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#CBD5E1] text-[#475569] hover:bg-[#F8FAFC]"
                aria-label="Close camera"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#D9E4F3] bg-[#0F172A]">
              <video ref={liveCameraVideoRef} className="aspect-[4/3] w-full object-cover" autoPlay playsInline muted />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsLiveCameraOpen(false);
                  stopLiveCamera();
                }}
                className="rounded-lg border border-[#CBD5E1] bg-white px-4 py-2 text-sm font-semibold text-[#334155] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCaptureLivePhoto}
                className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
              >
                Capture
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <div className="mb-6">
          <h1 className="text-4xl font-bold tracking-tight text-[#0F172A]">My Profile Settings</h1>
          <p className="mt-2 text-base text-[#64748B]">Manage your account information.</p>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {success}
          </div>
        ) : null}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20">
                {hasAvatarImage ? (
                  <img
                    src={formData.avatar}
                    alt="Profile avatar"
                    onError={handleAvatarImageError}
                    className="h-20 w-20 rounded-full border border-[#CBD5E1] object-cover"
                  />
                ) : (
                  <span className="inline-flex h-20 w-20 items-center justify-center rounded-full border border-[#CBD5E1] bg-[#EAF2FF] text-xl font-extrabold tracking-[0.04em] text-[#1D4ED8]">
                    {avatarInitials}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsCameraModalOpen(true)}
                  className="absolute bottom-0 right-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                  aria-label="Upload avatar"
                >
                  <Camera className="h-4 w-4" />
                </button>
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
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0F172A]">{formData.name || 'Your Name'}</p>
                <p className="text-sm text-[#64748B]">{isOrganization ? 'Organization account' : 'Donor account'}</p>
                <p className="mt-1 text-xs text-[#64748B]">Click camera icon to change profile picture</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-[#334155]">
              Full Name
              <div className="relative mt-2">
                <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  ref={nameInputRef}
                  value={formData.name}
                  onFocus={() => setIsEditing(true)}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white pl-11 pr-10 text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
                <button
                  type="button"
                  onClick={() => focusInput(nameInputRef)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#2563EB]"
                  aria-label="Edit name"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </label>

            <label className="text-sm font-semibold text-[#334155]">
              Email Address
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  ref={emailInputRef}
                  type="email"
                  value={formData.email}
                  onFocus={() => setIsEditing(true)}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white pl-11 pr-10 text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
                <button
                  type="button"
                  onClick={() => focusInput(emailInputRef)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#2563EB]"
                  aria-label="Edit email"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </label>
          </div>

          {!isOrganization ? (
            <label className="block max-w-md text-sm font-semibold text-[#334155]">
              Phone Number
              <div className="relative mt-2">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  ref={phoneInputRef}
                  value={formData.phone}
                  onFocus={() => setIsEditing(true)}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white pl-11 pr-10 text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
                <button
                  type="button"
                  onClick={() => focusInput(phoneInputRef)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#2563EB]"
                  aria-label="Edit phone"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </label>
          ) : null}

          <button
            type="submit"
            disabled={saving || !isEditing}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2563EB] px-5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
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
      </section>
    </main>
  );
}
