import { useState, useEffect } from 'react';
import {
  Shield,
  Palette,
  Eye,
  Link as LinkIcon,
  AlertTriangle,
  Moon,
  Sun,
  Banknote
} from 'lucide-react';
import { changePassword } from '@/services/user-service';
import './AccountSettings.css';

const Toggle = ({ checked, onChange }) => (
  <button
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

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handlePasswordInput = (field) => (event) => {
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordForm((previous) => ({ ...previous, [field]: event.target.value }));
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

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans py-8">
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
                  <input
                    className="w-full rounded-lg border-slate-200 light:border-slate-700 light:bg-slate-800 focus:border-blue-600 focus:ring-blue-600 text-sm p-2 border outline-none"
                    placeholder="********"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordInput('currentPassword')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">New Password</label>
                  <input
                    className="w-full rounded-lg border-slate-200 light:border-slate-700 light:bg-slate-800 focus:border-blue-600 focus:ring-blue-600 text-sm p-2 border outline-none"
                    placeholder="********"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInput('newPassword')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Confirm New Password</label>
                  <input
                    className="w-full rounded-lg border-slate-200 light:border-slate-700 light:bg-slate-800 focus:border-blue-600 focus:ring-blue-600 text-sm p-2 border outline-none"
                    placeholder="********"
                    type="password"
                    value={passwordForm.confirmNewPassword}
                    onChange={handlePasswordInput('confirmNewPassword')}
                  />
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
              <div className="space-y-4">
                {/* Facebook */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 light:border-slate-800 bg-slate-50 light:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white light:bg-slate-900 rounded-lg flex items-center justify-center border border-slate-200 light:border-slate-700">
                      <svg className="w-6 h-6 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold">Facebook</p>
                      <p className="text-xs text-green-600 dark:text-green-400">Connected</p>
                    </div>
                  </div>
                  <button className="text-xs font-semibold text-red-500 hover:underline">Disconnect</button>
                </div>

                {/* Plaid */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 light:border-slate-800 bg-white li   ght:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 light:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 light:border-slate-700">
                      <Banknote className="text-slate-400" size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Plaid Banking</p>
                      <p className="text-xs text-slate-500">Not connected</p>
                    </div>
                  </div>
                  <button className="text-xs font-semibold text-blue-600 hover:underline">Connect</button>
                </div>

                {/* Google */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 light:border-slate-800 bg-white light:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 light:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 light:border-slate-700">
                      <svg className="w-6 h-6 text-slate-900 light:text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.32-2.12 4.5-1.24 1.24-2.88 2.2-5.72 2.2-4.6 0-8.2-3.8-8.2-8.4s3.6-8.4 8.2-8.4c2.5 0 4.4 1 5.8 2.3l2.4-2.4C18.6 2.1 15.8 1 12.48 1 6.48 1 1.48 6 1.48 12s5 11 11 11c3.2 0 5.6-1.1 7.5-3 1.9-1.9 2.5-4.6 2.5-6.8 0-.7-.1-1.3-.2-1.8h-8.8z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold">Google</p>
                      <p className="text-xs text-slate-500">Not connected</p>
                    </div>
                  </div>
                  <button className="text-xs font-semibold text-blue-600 hover:underline">Connect</button>
                </div>
              </div>
            </section>

            {/* Danger Zone */}
            <section className="bg-red-50 light:bg-red-900/10 p-6 sm:p-8 rounded-2xl border border-red-100 dark:border-red-900/20">
              <div className="flex items-center gap-2 mb-4 text-red-600 dark:text-red-500">
                <AlertTriangle size={20} />
                <h3 className="text-lg font-bold">Danger Zone</h3>
              </div>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-6">Deactivating your account will disable your profile and donation history. This cannot be undone.</p>
              <button className="px-6 py-2 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-500 font-semibold rounded-lg hover:bg-red-600 hover:text-white transition-all text-sm">
                Deactivate Account
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
