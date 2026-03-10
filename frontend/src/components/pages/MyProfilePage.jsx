import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ImageIcon, Mail, Pencil, Phone, Save, Upload, User, X } from 'lucide-react';
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
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

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

function createAvatarSizeErrorMessage() {
  return 'Avatar must be 2MB or smaller.';
}

function isAvatarFileTooLarge(file) {
  return Boolean(file && Number(file.size) > MAX_AVATAR_SIZE_BYTES);
}

function formatFileSize(bytes) {
  const size = Number(bytes) || 0;
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Invalid image file.'));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
  });
}

async function optimizeAvatarFile(file) {
  if (!file || !isAvatarFileTooLarge(file)) {
    return { file, optimized: false, originalSize: file?.size || 0 };
  }

  const sourceImage = await loadImageFromFile(file);
  const dimensions = [1280, 1080, 960, 840];
  const qualities = [0.85, 0.78, 0.7, 0.62, 0.54];

  for (const maxDimension of dimensions) {
    const scale = Math.min(1, maxDimension / Math.max(sourceImage.width, sourceImage.height));
    const width = Math.max(1, Math.round(sourceImage.width * scale));
    const height = Math.max(1, Math.round(sourceImage.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) continue;

    context.drawImage(sourceImage, 0, 0, width, height);

    for (const quality of qualities) {
      const blob = await canvasToBlob(canvas, quality);
      if (!blob) continue;
      const optimizedFile = new File(
        [blob],
        file.name.replace(/\.[^.]+$/, '') + '.jpg',
        { type: 'image/jpeg' },
      );
      if (!isAvatarFileTooLarge(optimizedFile)) {
        return { file: optimizedFile, optimized: true, originalSize: file.size };
      }
    }
  }

  throw new Error(createAvatarSizeErrorMessage());
}

function extractRequestErrorMessage(err) {
  const avatarValidationError = err?.response?.data?.errors?.avatar?.[0];
  if (avatarValidationError) {
    return createAvatarSizeErrorMessage();
  }
  return err?.response?.data?.message || 'Failed to update profile.';
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

  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [hideSaveToast, setHideSaveToast] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [avatarHint, setAvatarHint] = useState('');
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

      setFormData((prev) => ({
        ...prev,
        name: session?.name || prev.name || '',
        email: session?.email || prev.email || '',
        avatar: normalizeAvatarUrl(session?.avatar || prev.avatar || ''),
      }));

      if (!accountId) {
        if (isOrganization) {
          return;
        }

        const sessionEmail = String(session?.email || '').trim().toLowerCase();
        if (!sessionEmail) return;

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
            return;
          }
        } catch {
          // Fall through to session-only profile state.
        }

        setError('Unable to link this account to backend profile automatically. Please sign in with email/password.');
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
      }
    };

    loadProfile();
  }, [accountId, isOrganization, navigate, session]);

  useEffect(() => () => {
    clearSyncTimers();
    stopLiveCamera();
  }, []);

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const { file: acceptedFile, optimized, originalSize } = await optimizeAvatarFile(file);
      setError('');
      setAvatarHint(
        optimized
          ? `Image optimized from ${formatFileSize(originalSize)} to ${formatFileSize(acceptedFile.size)}.`
          : '',
      );
      setAvatarFile(acceptedFile);
      setFormData((prev) => ({
        ...prev,
        avatar: URL.createObjectURL(acceptedFile),
      }));
      setIsEditing(true);
      setIsCameraModalOpen(false);
      setShowIllustrations(false);
    } catch (optimizationError) {
      setAvatarHint('');
      setError(optimizationError?.message || createAvatarSizeErrorMessage());
    }
  };

  const handleSelectIllustration = (url) => {
    setAvatarFile(null);
    setAvatarHint('');
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

    const maxDimension = 1080;
    const scale = Math.min(1, maxDimension / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `camera-profile-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setError('');
      setAvatarHint('');
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
    }, 'image/jpeg', 0.82);
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
        if (isAvatarFileTooLarge(avatarFile)) {
          throw new Error(createAvatarSizeErrorMessage());
        }
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
      setError(err?.message === createAvatarSizeErrorMessage() ? err.message : extractRequestErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1324]/70 px-3 py-4 backdrop-blur-[4px] sm:px-6">
          <div className="w-full max-w-5xl rounded-[30px] border border-[#C5D6EC] bg-gradient-to-b from-[#FDFEFF] via-[#F6FAFF] to-[#EDF3FB] p-3 shadow-[0_36px_90px_rgba(2,12,27,0.52)] sm:p-6">
            <div className="flex items-center justify-between rounded-2xl border border-[#DFEAF8] bg-white px-3 py-3 sm:px-5">
              <button
                type="button"
                onClick={() => {
                  setIsCameraModalOpen(false);
                  setShowIllustrations(false);
                }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#BCD0EA] bg-white text-[#0F172A] transition hover:bg-[#EEF4FF]"
                aria-label="Close picture modal"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="px-3 text-center sm:px-4">
                <h3 className="text-2xl font-extrabold tracking-tight text-[#0B1A34] sm:text-[2.3rem]">Change profile picture</h3>
                <p className="text-xs font-medium text-[#4D6281] sm:text-sm">Choose a source, confirm preview, then press Save Changes.</p>
              </div>
              <span className="rounded-full border border-[#D4E1F4] bg-[#F3F8FF] px-3 py-1 text-[11px] font-bold tracking-[0.08em] text-[#1E40AF] sm:text-xs">
                PROFILE PHOTO
              </span>
            </div>

            <div className="mt-4 rounded-[26px] border border-[#D4E2F4] bg-white p-3 sm:p-5">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
                <div className="rounded-3xl border border-[#D7E5F6] bg-[linear-gradient(165deg,#F7FBFF_0%,#ECF4FF_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5B7293]">Preview</p>
                  <div className="relative mx-auto mt-4 h-40 w-40 sm:h-52 sm:w-52">
                    <div className="absolute -inset-3 rounded-full bg-[radial-gradient(circle,_rgba(37,99,235,0.24),_rgba(37,99,235,0)_70%)]" />
                    {hasAvatarImage ? (
                      <img
                        src={formData.avatar}
                        alt="Profile preview"
                        onError={handleAvatarImageError}
                        className="relative h-40 w-40 rounded-full border-[6px] border-white object-cover shadow-[0_20px_36px_rgba(15,23,42,0.3)] sm:h-52 sm:w-52"
                      />
                    ) : (
                      <span className="relative inline-flex h-40 w-40 items-center justify-center rounded-full border-[6px] border-white bg-[#EAF2FF] text-4xl font-extrabold tracking-[0.04em] text-[#1D4ED8] shadow-[0_20px_36px_rgba(15,23,42,0.2)] sm:h-52 sm:w-52 sm:text-5xl">
                        {avatarInitials}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-1 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#BFD3EA] bg-white text-[#334155] shadow-[0_8px_16px_rgba(15,23,42,0.24)] transition hover:-translate-y-0.5 hover:bg-[#F3F8FF]"
                      aria-label="Upload avatar"
                    >
                      <Camera className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">Live Preview</p>
                  <p className="mt-2 text-center text-xs font-medium text-[#627794]">Tip: square or centered portraits look best.</p>
                </div>

                <div className="rounded-3xl border border-[#DCE8F6] bg-[#F9FCFF] p-3 sm:p-4">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => setShowIllustrations((prev) => !prev)}
                      className={`group flex min-h-[124px] flex-col items-start justify-center rounded-2xl border px-4 py-3 text-left transition ${
                        showIllustrations
                          ? 'border-[#2563EB] bg-[#EAF3FF] shadow-[0_10px_24px_rgba(37,99,235,0.22)]'
                          : 'border-[#D6E2F2] bg-white hover:-translate-y-0.5 hover:border-[#8CB8F4] hover:shadow-[0_8px_20px_rgba(37,99,235,0.16)]'
                      }`}
                    >
                      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                        showIllustrations ? 'bg-[#DBEAFE] text-[#1D4ED8]' : 'bg-[#ECF2FA] text-[#4B5563]'
                      }`}>
                        <ImageIcon className="h-5 w-5" />
                      </span>
                      <span className="mt-3 text-lg font-semibold leading-tight text-[#1F2937]">Illustrations</span>
                      <span className="mt-1 text-xs font-medium text-[#64748B]">Preset options</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="group flex min-h-[124px] flex-col items-start justify-center rounded-2xl border border-[#1E40AF] bg-gradient-to-br from-[#2D67E6] via-[#2459D1] to-[#1E40AF] px-4 py-3 text-left text-white shadow-[0_14px_30px_rgba(30,64,175,0.34)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(30,64,175,0.4)]"
                    >
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                        <Upload className="h-5 w-5" />
                      </span>
                      <span className="mt-3 text-lg font-semibold leading-tight">Upload File</span>
                      <span className="mt-1 text-xs font-medium text-[#DCE7FF]">Recommended source</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenLiveCamera}
                      className="group flex min-h-[124px] flex-col items-start justify-center rounded-2xl border border-[#D6E2F2] bg-white px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-[#8CB8F4] hover:shadow-[0_8px_20px_rgba(37,99,235,0.16)]"
                    >
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ECF2FA] text-[#4B5563]">
                        <Camera className="h-5 w-5" />
                      </span>
                      <span className="mt-3 text-lg font-semibold leading-tight text-[#1F2937]">Take Photo</span>
                      <span className="mt-1 text-xs font-medium text-[#64748B]">Webcam or mobile</span>
                    </button>
                  </div>

                  {showIllustrations ? (
                    <div className="mt-3 rounded-2xl border border-[#D7E4F5] bg-white p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#5F7492]">Choose an illustration</p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {illustrationOptions.map((imageUrl) => (
                          <button
                            key={imageUrl}
                            type="button"
                            onClick={() => handleSelectIllustration(imageUrl)}
                            className={`group relative overflow-hidden rounded-2xl border bg-white p-1.5 transition ${
                              formData.avatar === imageUrl
                                ? 'border-[#2563EB] shadow-[0_12px_26px_rgba(37,99,235,0.25)]'
                                : 'border-[#D2DDEB] hover:-translate-y-0.5 hover:border-[#60A5FA] hover:shadow-[0_10px_22px_rgba(37,99,235,0.18)]'
                            }`}
                          >
                            <img src={imageUrl} alt="Illustration option" className="h-24 w-full rounded-xl object-cover" />
                            {formData.avatar === imageUrl ? (
                              <span className="absolute right-2 top-2 rounded-full bg-[#2563EB] px-2 py-0.5 text-[10px] font-bold text-white">
                                Selected
                              </span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <p className="mt-3 rounded-xl border border-[#D8E4F2] bg-white px-3 py-2 text-center text-xs font-medium text-[#5A6F8A]">
                    JPG, PNG, WEBP up to 2MB. Larger files are optimized automatically.
                  </p>
                </div>
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
        {avatarHint ? (
          <div className="mb-4 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm font-medium text-[#1D4ED8]">
            {avatarHint}
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
