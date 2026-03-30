import React, { useEffect, useRef, useState } from 'react';
import AdminSidebar from './adminsidebar';
import { normalizeLanguageValue, useLanguage } from '@/i18n/language.jsx';
import './style.css';
import './admin-settings.css';

const DEFAULT_FORM = {
  fullName: 'Administrator Name',
  email: 'admin@chomnuoy.com',
  applicationName: 'Chomnuoy Admin',
  language: 'English (US)',
  currency: 'USD - US Dollar',
  sessionTimeout: '30',
  merchantId: 'CHOM-ABA-8921',
  apiKey: '************************',
  webhookEndpoints: [],
  currentPassword: '',
  newPassword: '',
  require2FA: true,
  automaticLogout: true,
  loginNotifications: false,
};

const SETTING_DEFINITIONS = [
  { key: 'profile.full_name', section: 'profile', field: 'fullName' },
  { key: 'profile.email', section: 'profile', field: 'email' },
  { key: 'platform.application_name', section: 'platform', field: 'applicationName' },
  { key: 'platform.language', section: 'platform', field: 'language' },
  { key: 'platform.currency', section: 'platform', field: 'currency' },
  { key: 'security.session_timeout', section: 'security', field: 'sessionTimeout' },
  { key: 'security.require_2fa', section: 'security', field: 'require2FA' },
  { key: 'security.automatic_logout', section: 'security', field: 'automaticLogout' },
  { key: 'security.login_notifications', section: 'security', field: 'loginNotifications' },
  { key: 'integration.merchant_id', section: 'integration', field: 'merchantId' },
  { key: 'integration.api_key', section: 'integration', field: 'apiKey' },
  { key: 'integration.webhook_endpoints', section: 'integration', field: 'webhookEndpoints' },
];

const AUTO_SAVE_FIELDS = new Set(SETTING_DEFINITIONS.map((item) => item.field));

function getSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function AdminSettingsPage() {
  const { t, setLanguage } = useLanguage();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [isHooksOpen, setIsHooksOpen] = useState(false);
  const [newWebhookEndpoint, setNewWebhookEndpoint] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const autoSaveTimeoutRef = useRef(null);

  const session = getSession();
  const adminName = session?.name || 'Admin';
  const adminRole = session?.role || session?.accountType || 'Admin';
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  const getStorageFileUrl = (path) => {
    if (!path) return '';
    const cleaned = String(path).trim();
    if (!cleaned) return '';
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      return cleaned;
    }
    const appBase = apiBase.replace(/\/api\/?$/, '');
    const normalized = cleaned.replace(/^\/+/, '');
    if (normalized.startsWith('storage/')) {
      return `${appBase}/${normalized}`;
    }
    return `${appBase}/storage/${normalized}`;
  };

  const updateField = (field, value) => {
    if (field === 'language') {
      setLanguage(normalizeLanguageValue(value));
    }

    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (!isLoading && AUTO_SAVE_FIELDS.has(field)) {
        if (autoSaveTimeoutRef.current) {
          window.clearTimeout(autoSaveTimeoutRef.current);
        }
        autoSaveTimeoutRef.current = window.setTimeout(() => {
          handleSave(null, { sourceForm: next, withLoading: false, showSuccess: false });
        }, 650);
      }
      return next;
    });
  };
  const getAuthHeaders = () => {
    const token = window.localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const parseErrorMessage = async (response, fallback) => {
    try {
      const data = await response.json();
      if (typeof data?.message === 'string' && data.message.trim()) {
        return data.message;
      }
      const firstError = Object.values(data?.errors || {})[0];
      if (Array.isArray(firstError) && firstError[0]) {
        return firstError[0];
      }
    } catch {
      // Fall back to the default message.
    }
    return fallback;
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const headers = getAuthHeaders();
        const [settingsResponse, userResponse] = await Promise.all([
          fetch(`${apiBase}/admin/settings`, { headers }),
          session?.userId
            ? fetch(`${apiBase}/users/${session.userId}`, { headers })
            : Promise.resolve(null),
        ]);

        let nextValues = {};
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          const map = settingsData?.map || {};
          nextValues = SETTING_DEFINITIONS.reduce((acc, item) => {
            if (map[item.key] !== undefined && map[item.key] !== null) {
              acc[item.field] = map[item.key];
            }
            return acc;
          }, {});
        }

        let profileValues = {};
        if (userResponse?.ok) {
          const user = await userResponse.json();
          const nextAvatarUrl =
            user?.avatar_url ||
            user?.profile_image ||
            user?.avatar ||
            user?.image_url ||
            user?.photo ||
            user?.picture ||
            getStorageFileUrl(user?.avatar_path);
          profileValues = {
            fullName: user?.name || undefined,
            email: user?.email || undefined,
          };
          setAvatarUrl(nextAvatarUrl || session?.avatar || '');
        }

        if (!active) return;
        const nextForm = {
          ...DEFAULT_FORM,
          ...nextValues,
          ...profileValues,
          webhookEndpoints: Array.isArray(nextValues.webhookEndpoints)
            ? nextValues.webhookEndpoints
            : [],
          currentPassword: '',
          newPassword: '',
        };
        setForm(nextForm);
        setLanguage(normalizeLanguageValue(nextForm.language));
      } catch {
        if (!active) return;
        setMessage('Unable to load saved settings from server.');
        setMessageType('error');
        setAvatarUrl(session?.avatar || '');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [apiBase, session?.userId, setLanguage]);

  useEffect(() => () => {
    if (autoSaveTimeoutRef.current) {
      window.clearTimeout(autoSaveTimeoutRef.current);
    }
  }, []);
  const handleSave = async (event, options = {}) => {
    const {
      sourceForm = form,
      withLoading = true,
      showSuccess = true,
    } = options;

    if (event?.preventDefault) {
      event.preventDefault();
    }

    if (withLoading) {
      setIsSaving(true);
      setMessage('');
      setMessageType('success');
    }

    try {
      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      };

      const settingsPayload = SETTING_DEFINITIONS.map((item) => ({
        key: item.key,
        section: item.section,
        value: sourceForm[item.field],
      }));

      const saveSettingsResponse = await fetch(`${apiBase}/admin/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ settings: settingsPayload }),
      });

      if (!saveSettingsResponse.ok) {
        const errorMessage = await parseErrorMessage(saveSettingsResponse, 'Failed to save settings.');
        throw new Error(errorMessage);
      }

      if (session?.userId) {
        const updateUserResponse = await fetch(`${apiBase}/users/${session.userId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            name: sourceForm.fullName,
            email: sourceForm.email,
          }),
        });

        if (!updateUserResponse.ok) {
          const errorMessage = await parseErrorMessage(updateUserResponse, 'Failed to update admin profile.');
          throw new Error(errorMessage);
        }
      }

      const nextSession = {
        ...(getSession() || {}),
        name: sourceForm.fullName,
        email: sourceForm.email,
      };
      window.localStorage.setItem('chomnuoy_session', JSON.stringify(nextSession));
      window.dispatchEvent(new Event('chomnuoy-session-updated'));

      if (showSuccess) {
        setMessage('Settings saved successfully.');
        setMessageType('success');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save settings.');
      setMessageType('error');
    } finally {
      if (withLoading) {
        setIsSaving(false);
      }
    }
  };

  const handlePasswordUpdate = async () => {
    if (!form.currentPassword || !form.newPassword) {
      setMessage('Please provide current and new password.');
      setMessageType('error');
      return;
    }

    setIsUpdatingPassword(true);
    setMessage('');

    const accountType = String(session?.accountType || session?.role || '');
    const supportedAccountType = accountType === 'Donor' || accountType === 'Organization'
      ? accountType
      : undefined;

    try {
      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      };
      const payload = {
        email: form.email,
        current_password: form.currentPassword,
        new_password: form.newPassword,
        new_password_confirmation: form.newPassword,
        ...(supportedAccountType ? { account_type: supportedAccountType } : {}),
      };

      const response = await fetch(`${apiBase}/auth/change-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorMessage = await parseErrorMessage(response, 'Failed to update password.');
        throw new Error(errorMessage);
      }

      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
      setMessage('Password updated successfully.');
      setMessageType('success');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update password.');
      setMessageType('error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleAddWebhook = () => {
    const endpoint = newWebhookEndpoint.trim();
    if (!endpoint) return;

    if (!/^https?:\/\/.+/i.test(endpoint)) {
      setMessage('Webhook URL must start with http:// or https://');
      setMessageType('error');
      return;
    }

    const exists = (form.webhookEndpoints || []).some(
      (item) => String(item).trim().toLowerCase() === endpoint.toLowerCase()
    );
    if (exists) {
      setMessage('Webhook endpoint already exists.');
      setMessageType('error');
      return;
    }

    updateField('webhookEndpoints', [...(form.webhookEndpoints || []), endpoint]);
    setNewWebhookEndpoint('');
    setMessage('Webhook endpoint added.');
    setMessageType('success');
  };

  const handleRemoveWebhook = (endpoint) => {
    const next = (form.webhookEndpoints || []).filter((item) => item !== endpoint);
    updateField('webhookEndpoints', next);
    setMessage('Webhook endpoint removed.');
    setMessageType('success');
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
        <div className="apsettings-wrap">
          <header className="apsettings-head">
            <div>
              <p className="apsettings-kicker">Admin Platform Settings & Configuration</p>
              <h1>{t('admin.settings.title')}</h1>
              <p className="apsettings-subtitle">{t('admin.settings.subtitle')}</p>
            </div>
            <button
              type="button"
              className="apsettings-save-top"
              onClick={handleSave}
              disabled={isSaving || isLoading}
            >
              {isSaving ? 'Saving...' : t('admin.settings.save')}
            </button>
          </header>

          {message ? (
            <div className={`settings-alert ${messageType === 'error' ? 'settings-alert-error' : 'settings-alert-success'}`}>
              <span className="settings-alert-icon" aria-hidden="true">{messageType === 'error' ? '!' : 'OK'}</span>
              <span>{message}</span>
            </div>
          ) : null}

          <form id="admin-settings-form" className="apsettings-body" onSubmit={handleSave}>
            <section className="apsettings-card">
              <div className="apsettings-card-title">{t('admin.settings.profile')}</div>
              <div className="apsettings-profile-grid">
                <div className="apsettings-avatar-block">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={form.fullName || 'Admin profile'}
                      className="apsettings-avatar"
                    />
                  ) : (
                    <div className="apsettings-avatar" aria-hidden="true">
                      {(form.fullName || adminName || 'Admin')
                        .split(' ')
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="apsettings-input-grid two-col">
                  <label className="apsettings-field">
                    <span>{t('admin.settings.fullName')}</span>
                    <input value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} />
                  </label>
                  <label className="apsettings-field">
                    <span>{t('admin.settings.email')}</span>
                    <input value={form.email} onChange={(event) => updateField('email', event.target.value)} />
                  </label>
                </div>
              </div>
            </section>

            <section className="apsettings-card">
              <div className="apsettings-card-title">{t('admin.settings.platform')}</div>
              <div className="apsettings-input-grid three-col">
                <label className="apsettings-field">
                  <span>{t('admin.settings.appName')}</span>
                  <input
                    value={form.applicationName}
                    onChange={(event) => updateField('applicationName', event.target.value)}
                  />
                </label>
                <label className="apsettings-field">
                  <span>{t('admin.settings.defaultLanguage')}</span>
                  <select value={form.language} onChange={(event) => updateField('language', event.target.value)}>
                    <option value="English (US)">{t('lang.en')}</option>
                    <option value="Khmer (KH)">{t('lang.km')}</option>
                  </select>
                </label>
                <label className="apsettings-field">
                  <span>{t('admin.settings.defaultCurrency')}</span>
                  <select value={form.currency} onChange={(event) => updateField('currency', event.target.value)}>
                    <option value="USD - US Dollar">{t('currency.usd')}</option>
                    <option value="KHR - Khmer Riel">{t('currency.khr')}</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="apsettings-card">
              <div className="apsettings-card-title">{t('admin.settings.security')}</div>
              <div className="apsettings-security-banner">
                <div>
                  <p className="apsettings-banner-title">{t('admin.settings.twoFa')}</p>
                  <p className="apsettings-banner-sub">{t('admin.settings.twoFaSub')}</p>
                </div>
                <label className="apsettings-chip-toggle">
                  <input
                    type="checkbox"
                    checked={form.require2FA}
                    onChange={(event) => updateField('require2FA', event.target.checked)}
                  />
                  <span>{t('admin.settings.enable2fa')}</span>
                </label>
              </div>

              <div className="apsettings-input-grid two-col top-gap">
                <div>
                  <h4>{t('admin.settings.passwordManagement')}</h4>
                  <label className="apsettings-field">
                    <span>{t('admin.settings.currentPassword')}</span>
                    <input
                      type="password"
                      placeholder={t('admin.settings.currentPasswordPlaceholder')}
                      value={form.currentPassword}
                      onChange={(event) => updateField('currentPassword', event.target.value)}
                    />
                  </label>
                  <label className="apsettings-field">
                    <span>{t('admin.settings.newPassword')}</span>
                    <input
                      type="password"
                      placeholder={t('admin.settings.newPasswordPlaceholder')}
                      value={form.newPassword}
                      onChange={(event) => updateField('newPassword', event.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="apsettings-link-btn"
                    onClick={handlePasswordUpdate}
                    disabled={isUpdatingPassword}
                  >
                    {isUpdatingPassword ? 'Updating...' : t('admin.settings.updatePassword')}
                  </button>
                </div>

                <div>
                  <h4>{t('admin.settings.sessionSecurity')}</h4>
                  <div className="apsettings-toggle-row">
                    <div>
                      <p>{t('admin.settings.autoLogout')}</p>
                      <small>{t('admin.settings.autoLogoutSub', { minutes: form.sessionTimeout })}</small>
                    </div>
                    <label className="apsettings-switch">
                      <input
                        type="checkbox"
                        checked={form.automaticLogout}
                        onChange={(event) => updateField('automaticLogout', event.target.checked)}
                      />
                      <span />
                    </label>
                  </div>

                  <div className="apsettings-toggle-row">
                    <div>
                      <p>{t('admin.settings.loginNotifications')}</p>
                      <small>{t('admin.settings.loginNotificationsSub')}</small>
                    </div>
                    <label className="apsettings-switch">
                      <input
                        type="checkbox"
                        checked={form.loginNotifications}
                        onChange={(event) => updateField('loginNotifications', event.target.checked)}
                      />
                      <span />
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <section className="apsettings-card">
              <div className="apsettings-card-title">{t('admin.settings.integration')}</div>
              <div className="apsettings-api-grid">
                <label className="apsettings-field">
                  <span>{t('admin.settings.merchantId')}</span>
                  <input value={form.merchantId} onChange={(event) => updateField('merchantId', event.target.value)} />
                </label>
                <label className="apsettings-field">
                  <span>{t('admin.settings.apiKey')}</span>
                  <input value={form.apiKey} onChange={(event) => updateField('apiKey', event.target.value)} />
                </label>
              </div>
              <div className="apsettings-hook-row">
                <div>
                  <p>{t('admin.settings.webhook')}</p>
                  <small>{t('admin.settings.webhookSub')}</small>
                </div>
                <button type="button" className="apsettings-link-btn" onClick={() => setIsHooksOpen((prev) => !prev)}>
                  {isHooksOpen ? t('admin.settings.save') : t('admin.settings.manageHooks')}
                </button>
              </div>
              {isHooksOpen ? (
                <div className="apsettings-webhook-editor">
                  <div className="apsettings-webhook-add">
                    <input
                      type="url"
                      className="settings-input"
                      placeholder={t('admin.settings.webhookPlaceholder')}
                      value={newWebhookEndpoint}
                      onChange={(event) => setNewWebhookEndpoint(event.target.value)}
                    />
                    <button type="button" className="apsettings-link-btn" onClick={handleAddWebhook}>
                      {t('common.add')}
                    </button>
                  </div>
                  <div className="apsettings-webhook-list">
                    {(form.webhookEndpoints || []).length === 0 ? (
                      <p className="apsettings-webhook-empty">{t('admin.settings.noWebhook')}</p>
                    ) : (
                      (form.webhookEndpoints || []).map((endpoint) => (
                        <div key={endpoint} className="apsettings-webhook-item">
                          <span>{endpoint}</span>
                          <button
                            type="button"
                            className="apsettings-link-btn"
                            onClick={() => handleRemoveWebhook(endpoint)}
                          >
                            {t('common.remove')}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </section>

            <div className="settings-actions">
              <button type="submit" className="settings-save-btn" disabled={isSaving || isLoading}>
                {isSaving ? 'Saving...' : t('admin.settings.save')}
              </button>
            </div>
          </form>
        </div>
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
