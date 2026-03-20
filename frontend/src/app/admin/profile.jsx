import React, { useEffect, useMemo, useState } from 'react';
import AdminSidebar from './adminsidebar';
import './style.css';
import {
  fetchAdminProfile,
  updateAdminPassword,
  updateAdminProfile,
} from '@/services/admin-profile-service.js';

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const normalizedPath = String(path).replace(/\\/g, '/').replace(/^\/+/, '');
  return normalizedPath.startsWith('files/')
    ? `${apiBase}/${normalizedPath}`
    : `${apiBase}/files/${normalizedPath}`;
}

function getReadableError(err) {
  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    return `Cannot connect to backend API at ${apiBase}. Please make sure Laravel is running.`;
  }

  const fieldErrors = err?.response?.data?.errors || {};
  return (
    fieldErrors.name?.[0] ||
    fieldErrors.email?.[0] ||
    fieldErrors.avatar?.[0] ||
    fieldErrors.current_password?.[0] ||
    fieldErrors.new_password?.[0] ||
    err?.response?.data?.message ||
    err?.message ||
    'Something went wrong.'
  );
}

export default function AdminProfilePage() {
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [selectedAvatarName, setSelectedAvatarName] = useState('');
  const session = getSession();
  const adminId = session?.userId;
  const adminName = session?.name || 'Admin';
  const adminRole = session?.role || session?.accountType || 'Admin';
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    twoFactorEnabled: false,
    avatar: null,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  useEffect(() => {
    if (!adminId) {
      setLoading(false);
      setLoadError('Admin session not found. Please log in again.');
      return undefined;
    }

    let active = true;

    async function loadProfile() {
      setLoading(true);
      setLoadError('');
      try {
        const data = await fetchAdminProfile(adminId);
        if (!active) return;
        setProfile(data);
        setForm({
          name: data?.basic_information?.name || '',
          email: data?.basic_information?.email || '',
          phone: data?.basic_information?.phone || '',
          twoFactorEnabled: Boolean(data?.account_settings?.two_factor_enabled),
          avatar: null,
        });
        setAvatarPreview(
          data?.basic_information?.profile_picture ||
            getStorageFileUrl(data?.basic_information?.avatar_path || ''),
        );
        setSelectedAvatarName('');
      } catch (err) {
        if (!active) return;
        setLoadError(getReadableError(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [adminId]);

  useEffect(() => () => {
    if (avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
  }, [avatarPreview]);

  const initials = useMemo(() => {
    const name = form.name || adminName;
    return name
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [adminName, form.name]);

  const activityLog = profile?.activity_log || [];

  const syncSession = (nextBasicInfo) => {
    const currentSession = getSession() || {};
    const avatar =
      nextBasicInfo?.profile_picture ||
      getStorageFileUrl(nextBasicInfo?.avatar_path || '') ||
      currentSession.avatar ||
      '';

    window.localStorage.setItem(
      'chomnuoy_session',
      JSON.stringify({
        ...currentSession,
        name: nextBasicInfo?.name || currentSession.name,
        email: nextBasicInfo?.email || currentSession.email,
        avatar,
      }),
    );
    window.dispatchEvent(new Event('chomnuoy-session-updated'));
  };

  const handleProfileChange = (field) => (event) => {
    const value = field === 'twoFactorEnabled' ? event.target.checked : event.target.value;
    setSaveMessage('');
    setSaveError('');
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0] || null;
    const previousPreview = avatarPreview;
    setForm((previous) => ({ ...previous, avatar: file }));
    setSaveMessage('');
    setSaveError('');
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
      setSelectedAvatarName(file.name);
      if (previousPreview.startsWith('blob:')) {
        URL.revokeObjectURL(previousPreview);
      }
    } else {
      setSelectedAvatarName('');
    }
    event.target.value = '';
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!adminId) return;
    setSavingProfile(true);
    setSaveMessage('');
    setSaveError('');
    try {
      const data = await updateAdminProfile(adminId, form);
      setProfile(data);
      setForm((previous) => ({ ...previous, avatar: null }));
      const nextBasicInfo = data?.basic_information || {};
      setAvatarPreview(
        nextBasicInfo.profile_picture || getStorageFileUrl(nextBasicInfo.avatar_path || ''),
      );
      setSelectedAvatarName('');
      syncSession(nextBasicInfo);
      setSaveMessage('Profile updated successfully.');
    } catch (err) {
      setSaveError(getReadableError(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = (field) => (event) => {
    setPasswordError('');
    setPasswordMessage('');
    setPasswordForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (!adminId) return;
    setSavingPassword(true);
    setPasswordError('');
    setPasswordMessage('');
    try {
      const response = await updateAdminPassword(adminId, passwordForm);
      setPasswordMessage(response?.message || 'Password updated successfully.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordVisibility({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
      });
    } catch (err) {
      setPasswordError(getReadableError(err));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem('chomnuoy_session');
    window.localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  return (
    <div className="admin-shell">
      <AdminSidebar onLogout={() => setIsLogoutOpen(true)} userName={adminName} userRole={adminRole} />

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <p className="admin-header-kicker">Admin Profile</p>
            <h1>Profile & Security</h1>
          </div>
        </header>

        {loading ? <div className="admin-profile-empty">Loading profile...</div> : null}
        {!loading && loadError ? <div className="admin-profile-empty is-error">{loadError}</div> : null}

        {!loading && !loadError ? (
          <div className="admin-profile-grid">
            <section className="admin-panel admin-profile-hero">
              <div className="admin-profile-identity">
                <div className="admin-profile-avatar">
                  {avatarPreview ? <img src={avatarPreview} alt={form.name} /> : <span>{initials}</span>}
                </div>
                <div>
                  <p className="admin-profile-kicker">Basic Information</p>
                  <h2>{form.name || adminName}</h2>
                  <p>{form.email || '-'}</p>
                  <div className="admin-profile-meta">
                    <span>{profile?.basic_information?.phone || 'No phone number'}</span>
                    <span>{profile?.basic_information?.role || adminRole}</span>
                    <span>Last seen {formatDateTime(profile?.basic_information?.last_seen_at)}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="admin-panel">
              <div className="admin-panel-header">
                <h2>Basic Information</h2>
              </div>
              <form className="admin-profile-form" onSubmit={handleProfileSubmit}>
                <label>
                  <span>Admin Name</span>
                  <input type="text" value={form.name} onChange={handleProfileChange('name')} required />
                </label>
                <label>
                  <span>Email</span>
                  <input type="email" value={form.email} onChange={handleProfileChange('email')} required />
                </label>
                <label>
                  <span>Phone Number</span>
                  <input type="text" value={form.phone} onChange={handleProfileChange('phone')} />
                </label>
                <label>
                  <span>Profile Picture</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} />
                </label>
                {selectedAvatarName ? (
                  <p className="admin-profile-help">Preview updated with `{selectedAvatarName}`. Click Save Profile to keep it.</p>
                ) : null}
                <label className="admin-profile-toggle">
                  <span>Enable 2FA</span>
                  <input
                    type="checkbox"
                    checked={form.twoFactorEnabled}
                    onChange={handleProfileChange('twoFactorEnabled')}
                  />
                </label>
                {saveError ? <p className="admin-profile-error">{saveError}</p> : null}
                {saveMessage ? <p className="admin-profile-success">{saveMessage}</p> : null}
                <button className="admin-primary-btn" type="submit" disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            </section>

            <section className="admin-panel">
              <div className="admin-panel-header">
                <h2>Account Settings</h2>
              </div>
              <form className="admin-profile-form" onSubmit={handlePasswordSubmit}>
                <label>
                  <span>Current Password</span>
                  <div className="admin-password-field">
                    <input
                      type={passwordVisibility.currentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange('currentPassword')}
                      required
                    />
                    <button
                      type="button"
                      className="admin-password-toggle"
                      onClick={() => togglePasswordVisibility('currentPassword')}
                      aria-label={passwordVisibility.currentPassword ? 'Hide current password' : 'Show current password'}
                      aria-pressed={passwordVisibility.currentPassword}
                    >
                      {passwordVisibility.currentPassword ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M3 3l18 18" />
                          <path d="M10.58 10.58a2 2 0 1 0 2.83 2.83" />
                          <path d="M9.88 5.09A10.94 10.94 0 0 1 12 4.91c5 0 9.27 3.11 11 7.09a11.8 11.8 0 0 1-4.07 4.91" />
                          <path d="M6.61 6.61A11.84 11.84 0 0 0 1 12c1.73 3.98 6 7.09 11 7.09 1.67 0 3.27-.35 4.72-.98" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </label>
                <label>
                  <span>New Password</span>
                  <div className="admin-password-field">
                    <input
                      type={passwordVisibility.newPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange('newPassword')}
                      required
                    />
                    <button
                      type="button"
                      className="admin-password-toggle"
                      onClick={() => togglePasswordVisibility('newPassword')}
                      aria-label={passwordVisibility.newPassword ? 'Hide new password' : 'Show new password'}
                      aria-pressed={passwordVisibility.newPassword}
                    >
                      {passwordVisibility.newPassword ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M3 3l18 18" />
                          <path d="M10.58 10.58a2 2 0 1 0 2.83 2.83" />
                          <path d="M9.88 5.09A10.94 10.94 0 0 1 12 4.91c5 0 9.27 3.11 11 7.09a11.8 11.8 0 0 1-4.07 4.91" />
                          <path d="M6.61 6.61A11.84 11.84 0 0 0 1 12c1.73 3.98 6 7.09 11 7.09 1.67 0 3.27-.35 4.72-.98" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </label>
                <label>
                  <span>Confirm Password</span>
                  <div className="admin-password-field">
                    <input
                      type={passwordVisibility.confirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange('confirmPassword')}
                      required
                    />
                    <button
                      type="button"
                      className="admin-password-toggle"
                      onClick={() => togglePasswordVisibility('confirmPassword')}
                      aria-label={passwordVisibility.confirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      aria-pressed={passwordVisibility.confirmPassword}
                    >
                      {passwordVisibility.confirmPassword ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M3 3l18 18" />
                          <path d="M10.58 10.58a2 2 0 1 0 2.83 2.83" />
                          <path d="M9.88 5.09A10.94 10.94 0 0 1 12 4.91c5 0 9.27 3.11 11 7.09a11.8 11.8 0 0 1-4.07 4.91" />
                          <path d="M6.61 6.61A11.84 11.84 0 0 0 1 12c1.73 3.98 6 7.09 11 7.09 1.67 0 3.27-.35 4.72-.98" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </label>
                {passwordError ? <p className="admin-profile-error">{passwordError}</p> : null}
                {passwordMessage ? <p className="admin-profile-success">{passwordMessage}</p> : null}
                <button className="admin-primary-btn" type="submit" disabled={savingPassword}>
                  {savingPassword ? 'Updating...' : 'Change Password'}
                </button>
              </form>
            </section>

          </div>
        ) : null}
      </main>

      {isLogoutOpen ? (
        <div className="admin-modal-overlay" role="presentation" onClick={() => setIsLogoutOpen(false)}>
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-logout-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="admin-logout-title">Are you sure you want to logout?</h3>
            <p>You will be returned to the login page.</p>
            <div className="admin-modal-actions">
              <button type="button" className="admin-modal-cancel" onClick={() => setIsLogoutOpen(false)}>
                Cancel
              </button>
              <button type="button" className="admin-modal-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
