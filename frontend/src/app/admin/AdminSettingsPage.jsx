import React, { useState } from 'react';
import AdminSidebar from './adminsidebar';
import './style.css';

function getSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function AdminSettingsPage() {
  const session = getSession();
  const adminName = session?.name || 'Admin';
  const adminRole = session?.role || session?.accountType || 'Admin';
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    siteName: 'CHOMNUOY',
    supportEmail: session?.email || 'admin@chomnuoy.com',
    language: 'English',
    emailNotifications: true,
    browserNotifications: true,
    maintenanceMode: false,
  });

  const handleChange = (field) => (event) => {
    const value = typeof form[field] === 'boolean' ? event.target.checked : event.target.value;
    setSaved(false);
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSaved(true);
  };

  const handleLogout = () => {
    window.localStorage.removeItem('chomnuoy_session');
    window.localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  return (
    <div className="admin-shell">
      <AdminSidebar onLogout={() => setIsLogoutOpen(true)} userName={adminName} userRole={adminRole} />

      <main className="admin-main admin-settings-page">
        <header className="admin-header">
          <div>
            <p className="admin-header-kicker">Admin Settings</p>
            <h1>System Settings</h1>
          </div>
        </header>

        <section className="admin-panel admin-settings-card">
          <div className="admin-panel-header">
            <h2>General Settings</h2>
          </div>

          <form className="admin-settings-form" onSubmit={handleSubmit}>
            <label>
              <span>Website Name</span>
              <input type="text" value={form.siteName} onChange={handleChange('siteName')} />
            </label>

            <label>
              <span>Support Email</span>
              <input type="email" value={form.supportEmail} onChange={handleChange('supportEmail')} />
            </label>

            <label>
              <span>Language</span>
              <select value={form.language} onChange={handleChange('language')}>
                <option value="English">English</option>
                <option value="Khmer">Khmer</option>
              </select>
            </label>

            <label className="admin-profile-toggle">
              <span>Email Notifications</span>
              <input
                type="checkbox"
                checked={form.emailNotifications}
                onChange={handleChange('emailNotifications')}
              />
            </label>

            <label className="admin-profile-toggle">
              <span>Browser Notifications</span>
              <input
                type="checkbox"
                checked={form.browserNotifications}
                onChange={handleChange('browserNotifications')}
              />
            </label>

            <label className="admin-profile-toggle">
              <span>Maintenance Mode</span>
              <input
                type="checkbox"
                checked={form.maintenanceMode}
                onChange={handleChange('maintenanceMode')}
              />
            </label>

            {saved ? <p className="admin-profile-success">Settings saved successfully.</p> : null}

            <button className="admin-primary-btn" type="submit">
              Save Settings
            </button>
          </form>
        </section>
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
