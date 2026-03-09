import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function OrganizationSidebar() {
  const [isLogoutPopupOpen, setIsLogoutPopupOpen] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;

  const isActive = (targetPath) => pathname === targetPath;

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
            <svg viewBox="0 0 24 24" className="org-brand-icon" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22 8.65a2 2 0 0 0-3.42-1.41L17 8.82l-1.58-1.58A2 2 0 0 0 12 8.65c0 .53.21 1.04.59 1.41l3.35 3.35c.58.58 1.52.58 2.1 0l3.37-3.35A2 2 0 0 0 22 8.65Z"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 14h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H3z"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 16h4l5.2 1.88A2 2 0 0 1 17.5 19.8"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 20.4 13.1 22 21 19.7c.82-.24 1.27-1.11 1.03-1.93A1.6 1.6 0 0 0 20.5 16.6H16"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="org-brand-text">
            <span className="org-brand-name">
              {"\u1787\u17c6\u1793\u17bd\u1799 / CHOMNUOY"}
            </span>
            <span className="org-brand-subtitle">DIGITAL DONATION PLATFORM</span>
          </span>
        </div>

        <nav className="org-nav">
          <Link to="/organization/dashboard" className={`org-nav-item ${isActive('/organization/dashboard') ? 'active' : ''}`}>
            <span className="org-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 13h8V3H3zM13 21h8v-6h-8zM13 11h8V3h-8zM3 21h8v-6H3z" strokeWidth="1.8" />
              </svg>
            </span>
            Dashboard
          </Link>
          <button className="org-nav-item" type="button">
            <span className="org-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 7h16M4 12h16M4 17h10" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            Campaigns
          </button>
          <Link to="/organization/donations" className={`org-nav-item ${isActive('/organization/donations') ? 'active' : ''}`}>
            <span className="org-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z" strokeWidth="1.8" />
              </svg>
            </span>
            Donations
          </Link>
          <button className="org-nav-item" type="button">
            <span className="org-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 19h16M7 16V9M12 16V5M17 16v-7" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            Reports
          </button>
          <button className="org-nav-item" type="button">
            <span className="org-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z" strokeWidth="1.8" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.06V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.06-.4H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 8.6 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.06V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 8.6a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.06.4H21a2 2 0 1 1 0 4h-.1A1.7 1.7 0 0 0 19.4 15Z" strokeWidth="1.2" />
              </svg>
            </span>
            Settings
          </button>
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
