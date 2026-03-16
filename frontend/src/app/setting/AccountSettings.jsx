import { useState, useEffect } from 'react';
import {
  Shield,
  Palette,
  Eye,
  EyeOff,
  Link as LinkIcon,
  AlertTriangle,
  Moon,
  Sun,
  Banknote,
  Landmark,
  Apple,
  Linkedin,
  Info,
  Search,
  RefreshCw,
} from 'lucide-react';
import { changePassword, deactivateAccount } from '@/services/user-service';
import {
  getDisplayPreferences,
  getPrivacyPreferences,
  setDisplayPreferences,
  setPrivacyPreferences,
} from '@/utils/user-preferences';
import './AccountSettings.css';

const CONNECTED_APPS_PREFS_KEY = 'chomnuoy_connected_apps_preferences';
const TWO_FACTOR_PREFS_KEY = 'chomnuoy_two_factor_preferences';

const getSessionIdentifier = () => {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    const session = raw ? JSON.parse(raw) : null;
    const userId = Number(session?.userId);
    if (Number.isFinite(userId) && userId > 0) return `user_${userId}`;
    const email = String(session?.email || '').trim().toLowerCase();
    if (email) return `email_${email}`;
    return null;
  } catch {
    return null;
  }
};

const getScopedKey = (baseKey) => {
  const identifier = getSessionIdentifier();
  return identifier ? `${baseKey}_${identifier}` : baseKey;
};

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
      checked ? 'bg-blue-600' : 'bg-slate-200 light:bg-slate-700'
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

export default function AccountSettings() {
  const [darkMode, setDarkMode] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [publicProfile, setPublicProfile] = useState(true);
  const [showDonations, setShowDonations] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  });
  const [connectedApps, setConnectedApps] = useState({
    facebook: { connected: true, connectedAt: '2023-10-01T00:00:00.000Z' },
    plaid: { connected: false, connectedAt: null },
    google: { connected: false, connectedAt: null },
    paypal: { connected: false, connectedAt: null },
    apple: { connected: false, connectedAt: null },
    linkedin: { connected: false, connectedAt: null },
  });
  const [connectedAppsMessage, setConnectedAppsMessage] = useState('');
  const [connectedAppsError, setConnectedAppsError] = useState('');
  const [connectedAppsLoading, setConnectedAppsLoading] = useState({});
  const [appsFilter, setAppsFilter] = useState('all');
  const [appsQuery, setAppsQuery] = useState('');
  const [isRefreshingApps, setIsRefreshingApps] = useState(false);
  const [isDeactivatingAccount, setIsDeactivatingAccount] = useState(false);
  const [deactivateError, setDeactivateError] = useState('');

  useEffect(() => {
    const displayPreferences = getDisplayPreferences();
    const privacyPreferences = getPrivacyPreferences();
    setDarkMode(displayPreferences.darkMode);
    setHighContrast(displayPreferences.highContrast);
    setPublicProfile(privacyPreferences.publicProfile);
    setShowDonations(privacyPreferences.showDonations);

    try {
      const savedConnectedApps = window.localStorage.getItem(getScopedKey(CONNECTED_APPS_PREFS_KEY));
      if (!savedConnectedApps) return;
      const parsed = JSON.parse(savedConnectedApps);
      setConnectedApps((previous) => {
        const mapped = { ...previous };
        Object.keys(parsed || {}).forEach((key) => {
          const value = parsed[key];
          if (typeof value === 'boolean') {
            mapped[key] = {
              connected: value,
              connectedAt: value ? new Date().toISOString() : null,
            };
            return;
          }
          if (value && typeof value === 'object') {
            mapped[key] = {
              connected: Boolean(value.connected),
              connectedAt: value.connectedAt || null,
            };
          }
        });
        return mapped;
      });
    } catch {
      // Ignore invalid connected-apps preferences.
    }

    try {
      const savedTwoFactor = window.localStorage.getItem(getScopedKey(TWO_FACTOR_PREFS_KEY));
      if (savedTwoFactor === 'true') setTwoFactor(true);
      if (savedTwoFactor === 'false') setTwoFactor(false);
    } catch {
      // Ignore invalid two-factor preferences.
    }
  }, []);

  useEffect(() => {
    setDisplayPreferences({ darkMode, highContrast });
  }, [darkMode, highContrast]);

  useEffect(() => {
    setPrivacyPreferences({ publicProfile, showDonations });
  }, [publicProfile, showDonations]);

  useEffect(() => {
    window.localStorage.setItem(getScopedKey(CONNECTED_APPS_PREFS_KEY), JSON.stringify(connectedApps));
  }, [connectedApps]);

  useEffect(() => {
    window.localStorage.setItem(getScopedKey(TWO_FACTOR_PREFS_KEY), String(twoFactor));
  }, [twoFactor]);

  const handlePasswordInput = (field) => (event) => {
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  const handleUpdatePassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const currentPassword = passwordForm.currentPassword.trim();
    const newPassword = passwordForm.newPassword.trim();
    const confirmNewPassword = passwordForm.confirmNewPassword.trim();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('All password fields are required.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    let session = null;
    try {
      const sessionRaw = window.localStorage.getItem('chomnuoy_session');
      session = sessionRaw ? JSON.parse(sessionRaw) : null;
    } catch {
      session = null;
    }

    const accountEmail = session?.email?.trim();
    if (!accountEmail) {
      setPasswordError('Session is missing account email. Please sign in again.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await changePassword({
        email: accountEmail,
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmNewPassword,
        account_type: session?.accountType || session?.role,
      });

      setPasswordSuccess(response?.message || 'Password updated successfully.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } catch (error) {
      const fieldErrors = error.response?.data?.errors || {};
      const firstError =
        fieldErrors.current_password?.[0] ||
        fieldErrors.new_password?.[0] ||
        fieldErrors.email?.[0] ||
        error.response?.data?.message ||
        'Unable to update password. Please try again.';
      setPasswordError(firstError);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleToggleConnectedApp = (appKey, appLabel) => {
    const current = connectedApps[appKey];
    if (!current) return;

    if (current.connected) {
      const confirmed = window.confirm(`Disconnect ${appLabel}?`);
      if (!confirmed) return;
    }

    setConnectedAppsError('');
    setConnectedAppsMessage('');
    setConnectedAppsLoading((previous) => ({ ...previous, [appKey]: true }));

    window.setTimeout(() => {
      setConnectedApps((previous) => {
        const isNowConnected = !previous[appKey].connected;
        setConnectedAppsMessage(
          `${appLabel} ${isNowConnected ? 'connected' : 'disconnected'} successfully.`,
        );
        return {
          ...previous,
          [appKey]: {
            connected: isNowConnected,
            connectedAt: isNowConnected ? new Date().toISOString() : null,
          },
        };
      });
      setConnectedAppsLoading((previous) => ({ ...previous, [appKey]: false }));
    }, 600);
  };

  const handleRefreshApps = () => {
    setIsRefreshingApps(true);
    setConnectedAppsError('');
    setConnectedAppsMessage('');
    window.setTimeout(() => {
      setIsRefreshingApps(false);
      setConnectedAppsMessage('Connected app statuses are up to date.');
    }, 650);
  };

  const formatConnectedAt = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const connectedAppsList = [
    {
      key: 'facebook',
      label: 'Facebook',
      description: 'Use Facebook for quick login and sharing your impact.',
      icon: (
        <svg className="w-5 h-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      key: 'google',
      label: 'Google',
      description: 'Sync your Google account for easier sign-in and notifications.',
      icon: (
        <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.32-2.12 4.5-1.24 1.24-2.88 2.2-5.72 2.2-4.6 0-8.2-3.8-8.2-8.4s3.6-8.4 8.2-8.4c2.5 0 4.4 1 5.8 2.3l2.4-2.4C18.6 2.1 15.8 1 12.48 1 6.48 1 1.48 6 1.48 12s5 11 11 11c3.2 0 5.6-1.1 7.5-3 1.9-1.9 2.5-4.6 2.5-6.8 0-.7-.1-1.3-.2-1.8h-8.8z" />
        </svg>
      ),
    },
    {
      key: 'plaid',
      label: 'Plaid Banking',
      description: 'Securely connect your bank account for direct transfers.',
      icon: <Landmark className="w-5 h-5 text-slate-500" />,
    },
    {
      key: 'paypal',
      label: 'PayPal',
      description: 'Connect PayPal for fast and secure donations.',
      icon: <Banknote className="w-5 h-5 text-[#003087]" />,
    },
    {
      key: 'apple',
      label: 'Apple Pay',
      description: 'Enable Apple Pay for one-touch donations on Apple devices.',
      icon: <Apple className="w-5 h-5 text-slate-700" />,
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      description: 'Connect LinkedIn to showcase your charitable impact.',
      icon: <Linkedin className="w-5 h-5 text-[#0A66C2]" />,
    },
  ];

  const totalConnectedApps = Object.values(connectedApps).filter((entry) => entry.connected).length;
  const filteredApps = connectedAppsList.filter((app) => {
    const state = connectedApps[app.key];
    if (!state) return false;
    if (appsFilter === 'connected' && !state.connected) return false;
    if (appsFilter === 'not_connected' && state.connected) return false;
    if (!appsQuery.trim()) return true;
    const query = appsQuery.trim().toLowerCase();
    return (
      app.label.toLowerCase().includes(query) ||
      app.description.toLowerCase().includes(query)
    );
  });

  const handleDeactivateAccount = async () => {
    if (isDeactivatingAccount) return;

    const confirmed = window.confirm(
      'Are you sure you want to deactivate your account? This cannot be undone.',
    );
    if (!confirmed) return;

    let session = null;
    try {
      const sessionRaw = window.localStorage.getItem('chomnuoy_session');
      session = sessionRaw ? JSON.parse(sessionRaw) : null;
    } catch {
      session = null;
    }

    const parsedUserId = Number(session?.userId);
    const userId = Number.isSafeInteger(parsedUserId) && parsedUserId > 0 ? parsedUserId : null;
    const accountType = session?.accountType || session?.role || 'Donor';

    if (!userId) {
      setDeactivateError('Unable to deactivate account: missing user session.');
      return;
    }

    setDeactivateError('');
    setIsDeactivatingAccount(true);
    try {
      await deactivateAccount({ accountType, userId });
      window.localStorage.removeItem('chomnuoy_session');
      window.localStorage.removeItem('authToken');
      window.location.href = '/';
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Failed to deactivate your account. Please try again.';
      setDeactivateError(message);
    } finally {
      setIsDeactivatingAccount(false);
    }
  };

  return (
    <div
      className={`account-settings min-h-screen bg-[#f1f5f9] font-sans py-8 ${
        darkMode ? 'is-dark' : ''
      } ${highContrast ? 'is-high-contrast' : ''}`}
    >
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Account Settings & Security</h1>
          <p className="mt-2 text-slate-600">Manage your password, privacy, and display preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Security Section */}
            <section className="bg-white light:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 light:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="text-blue-600" size={20} />
                <h3 className="text-lg font-bold">Security</h3>
              </div>
              <form className="space-y-4" onSubmit={handleUpdatePassword}>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Change Password</p>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Current Password</label>
                  <div className="relative">
                    <input
                      className="w-full rounded-lg border-slate-200 light:border-slate-700 light:bg-slate-800 focus:border-blue-600 focus:ring-blue-600 text-sm p-2 pr-10 border outline-none"
                      placeholder="********"
                      type={passwordVisibility.currentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordInput('currentPassword')}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => togglePasswordVisibility('currentPassword')}
                      aria-label={passwordVisibility.currentPassword ? 'Hide current password' : 'Show current password'}
                    >
                      {passwordVisibility.currentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <input
                      className="w-full rounded-lg border-slate-200 light:border-slate-700 light:bg-slate-800 focus:border-blue-600 focus:ring-blue-600 text-sm p-2 pr-10 border outline-none"
                      placeholder="********"
                      type={passwordVisibility.newPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={handlePasswordInput('newPassword')}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => togglePasswordVisibility('newPassword')}
                      aria-label={passwordVisibility.newPassword ? 'Hide new password' : 'Show new password'}
                    >
                      {passwordVisibility.newPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Confirm New Password</label>
                  <div className="relative">
                    <input
                      className="w-full rounded-lg border-slate-200 light:border-slate-700 light:bg-slate-800 focus:border-blue-600 focus:ring-blue-600 text-sm p-2 pr-10 border outline-none"
                      placeholder="********"
                      type={passwordVisibility.confirmNewPassword ? 'text' : 'password'}
                      value={passwordForm.confirmNewPassword}
                      onChange={handlePasswordInput('confirmNewPassword')}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => togglePasswordVisibility('confirmNewPassword')}
                      aria-label={passwordVisibility.confirmNewPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {passwordVisibility.confirmNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {passwordError ? (
                  <p className="text-sm text-red-600">{passwordError}</p>
                ) : null}
                {passwordSuccess ? (
                  <p className="text-sm text-green-600">{passwordSuccess}</p>
                ) : null}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
                <hr className="my-6 border-slate-100 light:border-slate-800" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 light:text-slate-300">Two-Factor Authentication</p>
                    <p className="text-xs text-slate-500">Add an extra layer of security to your account.</p>
                  </div>
                  <Toggle checked={twoFactor} onChange={() => setTwoFactor(!twoFactor)} />
                </div>
              </form>
            </section>

            {/* Display Section */}
            <section className="bg-white light:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 light:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Palette className="text-blue-600" size={20} />
                <h3 className="text-lg font-bold">Display</h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 light:text-slate-300">Dark Mode</p>
                    <p className="text-xs text-slate-500">Adjust the interface to a dark theme.</p>
                  </div>
                  <Toggle checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">High Contrast Mode</p>
                    <p className="text-xs text-slate-500">Increase contrast for better accessibility.</p>
                  </div>
                  <Toggle checked={highContrast} onChange={() => setHighContrast(!highContrast)} />
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Privacy Section */}
            <section className="bg-white light:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 light:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Eye className="text-blue-600" size={20} />
                <h3 className="text-lg font-bold">Privacy</h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Make my profile public</p>
                    <p className="text-xs text-slate-500">Allow others to find your profile and impact badges.</p>
                  </div>
                  <Toggle checked={publicProfile} onChange={() => setPublicProfile(!publicProfile)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Show my donation amounts</p>
                    <p className="text-xs text-slate-500">Make the specific amounts you donate public.</p>
                  </div>
                  <Toggle checked={showDonations} onChange={() => setShowDonations(!showDonations)} />
                </div>
              </div>
            </section>

            {/* Connected Apps Section */}
            <section className="bg-white light:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 light:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <LinkIcon className="text-blue-600" size={20} />
                <h3 className="text-lg font-bold">Connected Apps</h3>
              </div>
              <h4 className="text-2xl font-bold text-slate-900">Manage Connected Apps</h4>
              <p className="mt-1 mb-5 text-sm text-slate-500">Connect and manage third-party services integrated with your donor account.</p>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-500">{totalConnectedApps} connected</p>
                <button
                  type="button"
                  onClick={handleRefreshApps}
                  disabled={isRefreshingApps}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                >
                  <RefreshCw size={14} className={isRefreshingApps ? 'animate-spin' : ''} />
                  {isRefreshingApps ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAppsFilter('all')}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${appsFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setAppsFilter('connected')}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${appsFilter === 'connected' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Connected
                </button>
                <button
                  type="button"
                  onClick={() => setAppsFilter('not_connected')}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${appsFilter === 'not_connected' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Not connected
                </button>
              </div>
              <label className="mb-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                <Search size={14} />
                <input
                  type="search"
                  value={appsQuery}
                  onChange={(event) => setAppsQuery(event.target.value)}
                  placeholder="Search app"
                  className="w-full bg-transparent text-sm text-slate-700 outline-none"
                />
              </label>
              {connectedAppsMessage ? (
                <p className="mb-4 text-xs text-emerald-600">{connectedAppsMessage}</p>
              ) : null}
              {connectedAppsError ? (
                <p className="mb-4 text-xs text-red-600">{connectedAppsError}</p>
              ) : null}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {filteredApps.map((app) => {
                  const appState = connectedApps[app.key] || { connected: false, connectedAt: null };
                  const isConnected = appState.connected;
                  const isBusy = Boolean(connectedAppsLoading[app.key]);
                  return (
                    <div key={app.key} className="rounded-2xl border border-slate-200 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                            {app.icon}
                          </div>
                          <p className="font-bold text-slate-900">{app.label}</p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {isConnected ? 'Connected' : 'Not connected'}
                        </span>
                      </div>
                      <p className="min-h-[52px] break-words pr-1 text-xs leading-5 text-slate-500">
                        {app.description}
                      </p>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                        <span className="text-[11px] text-slate-400">
                          {isConnected ? `Linked ${formatConnectedAt(appState.connectedAt)}` : ''}
                        </span>
                        <button
                          type="button"
                          disabled={isBusy}
                          className={`text-xs font-semibold hover:underline ${
                            isConnected ? 'text-red-500' : 'text-blue-600'
                          } ${isBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
                          onClick={() => handleToggleConnectedApp(app.key, app.label)}
                        >
                          {isBusy ? (isConnected ? 'Disconnecting...' : 'Connecting...') : (isConnected ? 'Disconnect' : 'Connect')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {filteredApps.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No apps match your current filters.</p>
              ) : null}
              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                <p className="flex items-center gap-2 font-semibold">
                  <Info size={14} />
                  About Integrations
                </p>
                <p className="mt-1">
                  Connecting apps improves login and notifications. We never post without your permission.
                </p>
              </div>
            </section>

            {/* Danger Zone */}
            <section className="bg-red-50 light:bg-red-900/10 p-6 sm:p-8 rounded-2xl border border-red-100 dark:border-red-900/20">
              <div className="flex items-center gap-2 mb-4 text-red-600 dark:text-red-500">
                <AlertTriangle size={20} />
                <h3 className="text-lg font-bold">Danger Zone</h3>
              </div>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-6">Deactivating your account will disable your profile and donation history. This cannot be undone.</p>
              {deactivateError ? (
                <p className="mb-4 text-sm text-red-700">{deactivateError}</p>
              ) : null}
              <button
                type="button"
                onClick={handleDeactivateAccount}
                disabled={isDeactivatingAccount}
                className="px-6 py-2 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-500 font-semibold rounded-lg hover:bg-red-600 hover:text-white transition-all text-sm disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeactivatingAccount ? 'Deactivating...' : 'Deactivate Account'}
              </button>
            </section>
          </div>
        </div>

        {/* Floating Theme Toggle */}
        <button
          className="fixed bottom-6 right-6 p-3 bg-white light:bg-slate-800 border border-slate-200 light:border-slate-700 shadow-xl rounded-full text-slate-600 dark:text-slate-300 hover:scale-110 transition-transform active:scale-95 z-50"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>
    </div>
  );
}
