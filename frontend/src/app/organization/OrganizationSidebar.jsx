import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import ROUTES from '@/constants/routes.js';

export default function OrganizationSidebar() {
  const [isLogoutPopupOpen, setIsLogoutPopupOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'OR';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  };

  const getOrganizationSession = () => {
    try {
      const raw = window.localStorage.getItem('chomnuoy_session');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const session = getOrganizationSession();
  const organizationName = String(session?.name || 'Organization').trim() || 'Organization';
  const organizationLabel = String(session?.role || session?.accountType || 'Organization')
    .trim()
    .toUpperCase() || 'ORGANIZATION';
  const organizationInitials = getInitials(organizationName);

  const handleLogout = () => {
    window.localStorage.removeItem('chomnuoy_session');
    window.localStorage.removeItem('authToken');
    window.location.href = '/';
  };

  return (
    <>
      <aside className="org-sidebar" aria-label="Organization navigation">
        <div className="org-brand">
          <span className="org-brand-mark" aria-hidden="true">
            {organizationInitials}
          </span>
          <span className="org-brand-text">
            <span className="org-brand-name">
              {organizationName}
            </span>
            <span className="org-brand-subtitle">{organizationLabel}</span>
          </span>
        </div>

        <nav className="org-nav">
          <NavLink
            to={ROUTES.ORGANIZATION_DASHBOARD}
            className={({ isActive }) => `org-nav-item${isActive ? ' active' : ''}`}
            end
          >
            <span className="org-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 13h8V3H3zM13 21h8v-6h-8zM13 11h8V3h-8zM3 21h8v-6H3z" strokeWidth="1.8" />
              </svg>
            </span>
            Dashboard
          </NavLink>

          <NavLink
            to={ROUTES.ORGANIZATION_CAMPAIGNS}
            className={({ isActive }) => `org-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="org-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 7h16M4 12h16M4 17h10" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            Campaigns
          </NavLink>

          <NavLink
            to="/organization/donations"
            className={({ isActive }) => `org-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="org-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z" strokeWidth="1.8" />
              </svg>
            </span>
            Donations
          </NavLink>

          <button className="org-nav-item" type="button">
            <span className="org-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 19h16M7 16V9M12 16V5M17 16v-7" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            Reports
          </button>
          <NavLink
            to="/organization/profile"
            className={({ isActive }) => `org-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="org-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 12.5a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" strokeWidth="1.8" />
                <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            Profile
          </NavLink>
          <NavLink
            to="/settings/AccountSettings"
            className={({ isActive }) => `org-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="org-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z" strokeWidth="1.8" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.06V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.06-.4H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 8.6 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.06V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 8.6a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.06.4H21a2 2 0 1 1 0 4h-.1A1.7 1.7 0 0 0 19.4 15Z" strokeWidth="1.2" />
              </svg>
            </span>
            Settings
          </NavLink>
        </nav>

        <div className="org-plan-card">
          <p>Support Tier</p>
          <strong>Pro Plan</strong>
        </div>

        <button className="org-logout-button" type="button" onClick={() => setIsLogoutPopupOpen(true)}>
          Logout
        </button>
      </aside>

      {isLogoutPopupOpen ? (
        <div className="org-logout-overlay" role="presentation" onClick={() => setIsLogoutPopupOpen(false)}>
          <div
            className="org-logout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="org-logout-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="org-logout-title">Are you sure you want to logout?</h3>
            <p>You will be returned to the page before login.</p>
            <div className="org-logout-actions">
              <button type="button" className="org-logout-cancel" onClick={() => setIsLogoutPopupOpen(false)}>
                Cancel
              </button>
              <button type="button" className="org-logout-confirm" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
