import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ImageIcon, Mail, MoreVertical, Pencil, Phone, Save, Upload, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getOrganizationById,
  getUserById,
  updateOrganizationProfile,
  updateUserProfile,
} from '@/services/user-service.js';

function getSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
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
  const appBase = apiBase.replace(/\/api\/?$/, '');
  return `${appBase}/storage/${path}`;
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
  const [showIllustrations, setShowIllustrations] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
  });

  const isOrganization = session?.role === 'Organization' || session?.accountType === 'Organization';
  const accountId = session?.userId;
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
      if (!session?.isLoggedIn || !accountId) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const data = isOrganization
          ? await getOrganizationById(accountId)
          : await getUserById(accountId);

        setFormData({
          name: data?.name || session?.name || '',
          email: data?.email || session?.email || '',
          phone: data?.phone || '',
          avatar: getStorageFileUrl(data?.avatar_path) || session?.avatar || '',
        });
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

  const focusInput = (ref) => {
    ref.current?.focus();
    setIsEditing(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    clearSyncTimers();
    setError('');
    setSuccess('');
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
        ? await updateOrganizationProfile(accountId, payload)
        : await updateUserProfile(accountId, payload);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-[34px] bg-[#F2F4F7] p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsCameraModalOpen(false);
                  setShowIllustrations(false);
                }}
                className="inline-flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#0B6DA8] text-[#0F172A] hover:bg-white"
                aria-label="Close picture modal"
              >
                <X className="h-8 w-8" />
              </button>
              <h3 className="text-4xl font-semibold text-[#1F2937]">Change profile picture</h3>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#4B5563] hover:bg-white"
                aria-label="More options"
              >
                <MoreVertical className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-10 rounded-[30px] bg-white px-8 pb-10 pt-12">
              <div className="relative mx-auto h-56 w-56">
                <img
                  src={formData.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80'}
                  alt="Profile preview"
                  className="h-56 w-56 rounded-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-4 right-2 inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]"
                  aria-label="Upload avatar"
                >
                  <Camera className="h-6 w-6" />
                </button>
              </div>

              {showIllustrations ? (
                <div className="mx-auto mt-8 grid max-w-xl grid-cols-3 gap-3">
                  {illustrationOptions.map((imageUrl) => (
                    <button
                      key={imageUrl}
                      type="button"
                      onClick={() => handleSelectIllustration(imageUrl)}
                      className="rounded-xl border border-[#D0D5DD] bg-white p-1 transition hover:border-[#60A5FA]"
                    >
                      <img src={imageUrl} alt="Illustration option" className="h-20 w-full rounded-lg object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="mx-auto mt-10 grid max-w-xl grid-cols-3 gap-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowIllustrations((prev) => !prev)}
                  className="flex flex-col items-center gap-3 rounded-2xl p-3 hover:bg-[#F8FAFC]"
                >
                  <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#E2E8F0] text-[#4B5563]">
                    <ImageIcon className="h-8 w-8" />
                  </span>
                  <span className="text-lg font-semibold text-[#1F2937]">Browse Illustrations</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 rounded-2xl p-3 hover:bg-[#F8FAFC]"
                >
                  <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#E2E8F0] text-[#4B5563]">
                    <Upload className="h-8 w-8" />
                  </span>
                  <span className="text-lg font-semibold text-[#1F2937]">Upload from Device</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 rounded-2xl p-3 hover:bg-[#F8FAFC]"
                >
                  <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#E2E8F0] text-[#4B5563]">
                    <Camera className="h-8 w-8" />
                  </span>
                  <span className="text-lg font-semibold text-[#1F2937]">Take a picture</span>
                </button>
              </div>
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
                <img
                  src={formData.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80'}
                  alt="Profile avatar"
                  className="h-20 w-20 rounded-full border border-[#CBD5E1] object-cover"
                />
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
