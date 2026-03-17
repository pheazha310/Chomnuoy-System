import React, { useState } from 'react';
import AdminSidebar from './adminsidebar';
import PickupsTableAdmin from './PickupsTableAdmin.jsx';
import './style.css';

export default function MaterialPickupAdminPage() {
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const sessionRaw = window.localStorage.getItem('chomnuoy_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const adminName = session?.name || 'Admin';
  const adminRole = session?.role || session?.accountType || 'Admin';

  const handleLogout = () => {
    window.localStorage.removeItem('chomnuoy_session');
    window.localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  return (
    <div className="admin-shell">
      <AdminSidebar onLogout={() => setIsLogoutOpen(true)} userName={adminName} userRole={adminRole} />

      <main className="admin-main">
        <PickupsTableAdmin />
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
