import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

const UNREAD_STORAGE_KEY = 'admin_notifications_unread';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: '/admin',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 13h8V3H3zM13 21h8v-6h-8zM13 11h8V3h-8zM3 21h8v-6H3z" />
      </svg>
    ),
  },
  {
    label: 'Users',
    path: '/admin/users',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 8a7 7 0 0 1 14 0" />
      </svg>
    ),
  },
  {
    label: 'Organizations',
    path: '/admin/organizations',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 21h18M4 21V7l8-4 8 4v14M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    label: 'Material Pickups',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h10l2 3h4v7h-2M4 17h8M6 19a2 2 0 1 1 4 0M16 19a2 2 0 1 1 4 0" />
      </svg>
    ),
  },
  {
    label: 'Reports',
    path: '/admin/reports',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19h16M7 16V9M12 16V5M17 16v-7" />
      </svg>
    ),
  },
  {
    label: 'Donations',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z" />
      </svg>
    ),
  },
  {
    label: 'Transactions',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 7h10M7 7l3-3M7 7l3 3M17 17H7M17 17l-3-3M17 17l-3 3" />
      </svg>
    ),
  },
  {
    label: 'Notifications',
    path: '/admin/notifications',
    showBadge: true,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
        <path d="M9 20a3 3 0 0 0 6 0" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    path: '/admin/settings',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.06V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.06-.4H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 8.6 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.06V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 8.6a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.06.4H21a2 2 0 1 1 0 4h-.1A1.7 1.7 0 0 0 19.4 15Z" />
      </svg>
    ),
  },
];

const AdminSidebar = ({ onLogout, userName, userRole = 'Admin' }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const readCount = () => {
      const raw = window.localStorage.getItem(UNREAD_STORAGE_KEY);
      const parsed = Number(raw);
      setUnreadCount(Number.isFinite(parsed) ? parsed : 0);
    };

    readCount();
    const onStorage = (event) => {
      if (event.key === UNREAD_STORAGE_KEY) {
        readCount();
      }
    };
    const onCustom = () => readCount();
    window.addEventListener('storage', onStorage);
    window.addEventListener('admin-notify-updated', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('admin-notify-updated', onCustom);
    };
  }, []);

  return (
    <aside className="admin-sidebar" aria-label="Admin navigation">
    <div className="admin-brand">
      <span className="admin-brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="admin-brand-icon" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      <div className="admin-brand-text">
        <p className="admin-brand-name">{'\u1787\u17c6\u1793\u17bd\u1799 / CHOMNUOY'}</p>
        <p className="admin-brand-sub">DIGITAL DONATION PLATFORM</p>
      </div>
    </div>

    <nav className="admin-nav">
      {NAV_ITEMS.map((item) => {
        if (item.path) {
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) => `admin-nav-item${isActive ? ' is-active' : ''}`}
              end={item.path === '/admin'}
            >
              <span className="admin-nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.showBadge && unreadCount > 0 ? (
                <span className="admin-nav-badge" aria-label={`${unreadCount} unread notifications`}>
                  {unreadCount}
                </span>
              ) : null}
            </NavLink>
          );
        }

        return (
          <button key={item.label} type="button" className="admin-nav-item">
            <span className="admin-nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>

    <div className="admin-sidebar-footer">
      <div className="admin-user">
        <div className="admin-avatar" aria-hidden="true">
          {userName
            .split(' ')
            .map((part) => part[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </div>
        <div>
          <p className="admin-user-name">{userName}</p>
          <p className="admin-user-role">{userRole}</p>
        </div>
      </div>
      <button className="admin-logout-btn" type="button" onClick={onLogout}>
        Logout
      </button>
    </div>
  </aside>
  );
};

export default AdminSidebar;
