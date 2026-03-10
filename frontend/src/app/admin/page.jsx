import './style.css';
import React, { useState } from 'react';

const STATS = [
  {
    id: 'funds',
    label: 'Total Funds Raised',
    value: '$428,500.00',
    change: '+12.5%',
    tone: 'success',
  },
  {
    id: 'items',
    label: 'Total Items Donated',
    value: '12,840',
    change: '+8.2%',
    tone: 'info',
  },
  {
    id: 'tasks',
    label: 'Urgent Tasks',
    value: '14',
    change: 'Action required',
    tone: 'warning',
  },
];

const TASKS = [
  {
    title: 'Verify Organization Documents',
    description: "Helping Hands' files need approval.",
    due: 'Due today',
    tone: 'danger',
  },
  {
    title: 'Schedule Bulk Material Pickup',
    description: '5 active requests waiting.',
    due: 'In 2 hours',
    tone: 'info',
  },
  {
    title: 'Flagged Donation Report',
    description: 'Suspicious transaction alert.',
    due: 'ASAP',
    tone: 'warning',
  },
];

const RECENT_ORGS = [
  {
    name: 'Hope Foundation',
    category: 'Education',
    status: 'Verified',
    date: 'Oct 24, 2023',
  },
  {
    name: 'Green Care',
    category: 'Environment',
    status: 'Pending',
    date: 'Oct 23, 2023',
  },
  {
    name: 'Food Security NGO',
    category: 'Healthcare',
    status: 'Verified',
    date: 'Oct 21, 2023',
  },
];

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 13h8V3H3zM13 21h8v-6h-8zM13 11h8V3h-8zM3 21h8v-6H3z" />
      </svg>
    ),
  },
  {
    label: 'Users',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 8a7 7 0 0 1 14 0" />
      </svg>
    ),
  },
  {
    label: 'Organizations',
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
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
        <path d="M9 20a3 3 0 0 0 6 0" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.06V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.06-.4H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 8.6 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.06V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 8.6a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.06.4H21a2 2 0 1 1 0 4h-.1A1.7 1.7 0 0 0 19.4 15Z" />
      </svg>
    ),
  },
];

const StatCard = ({ stat }) => (
  <div className={`admin-stat-card admin-tone-${stat.tone}`}>
    <div className="admin-stat-top">
      <div className="admin-stat-icon" aria-hidden="true">
        <span />
      </div>
      <span className="admin-stat-change">{stat.change}</span>
    </div>
    <p className="admin-stat-label">{stat.label}</p>
    <p className="admin-stat-value">{stat.value}</p>
  </div>
);

const AdminSidebar = ({ onLogout, userName }) => (
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
        <p className="admin-brand-name">CHOMNUOY</p>
        <p className="admin-brand-sub">ADMIN DASHBOARD</p>
      </div>
    </div>

    <nav className="admin-nav">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.label}
          type="button"
          className={`admin-nav-item${item.label === 'Dashboard' ? ' is-active' : ''}`}
        >
          <span className="admin-nav-icon" aria-hidden="true">
            {item.icon}
          </span>
          <span>{item.label}</span>
        </button>
      ))}
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
          <p className="admin-user-role">Admin</p>
        </div>
      </div>
      <button className="admin-logout-btn" type="button" onClick={onLogout}>
        Logout
      </button>
    </div>
  </aside>
);

const AdminDashboard = () => {
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const sessionRaw = window.localStorage.getItem('chomnuoy_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const adminName = session?.name || 'Admin';

  const handleLogout = () => {
    window.localStorage.removeItem('chomnuoy_session');
    window.localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  return (
    <div className="admin-shell">
      <AdminSidebar onLogout={() => setIsLogoutOpen(true)} userName={adminName} />

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <p className="admin-header-kicker">Admin Dashboard Hub</p>
            <h1>Overview</h1>
          </div>
          <div className="admin-header-actions">
            <button className="admin-icon-btn" type="button" aria-label="Toggle theme">
              <span className="admin-icon" />
            </button>
            <button className="admin-primary-btn" type="button">+ New Task</button>
          </div>
        </header>

      <section className="admin-stats">
        {STATS.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </section>

        <section className="admin-content-grid">
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2>Donation Overview</h2>
              <button className="admin-ghost-btn" type="button">Last 30 Days</button>
            </div>
            <div className="admin-chart">
              <div className="admin-chart-placeholder" aria-hidden="true">
                <div className="admin-chart-icon" />
                <p>Interactive visualization goes here</p>
              </div>
            </div>
          </div>

        <div className="admin-panel admin-tasks">
          <div className="admin-panel-header">
            <h2>Urgent Tasks</h2>
            <span className="admin-pill">3 new</span>
          </div>
          <div className="admin-task-list">
            {TASKS.map((task) => (
              <div key={task.title} className={`admin-task admin-tone-${task.tone}`}>
                <div className="admin-task-icon" aria-hidden="true" />
                <div>
                  <h3>{task.title}</h3>
                  <p>{task.description}</p>
                  <span>{task.due}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="admin-ghost-btn admin-full-btn" type="button">View All Tasks</button>
        </div>

        <div className="admin-panel admin-table">
          <div className="admin-panel-header">
            <h2>Recent Organizations Onboarding</h2>
          </div>
          <div className="admin-table-grid">
            <div className="admin-table-row admin-table-head">
              <span>Organization</span>
              <span>Category</span>
              <span>Status</span>
              <span>Date</span>
            </div>
            {RECENT_ORGS.map((org) => (
              <div key={org.name} className="admin-table-row">
                <span className="admin-org-name">{org.name}</span>
                <span>{org.category}</span>
                <span className={`admin-status admin-status-${org.status.toLowerCase()}`}>{org.status}</span>
                <span>{org.date}</span>
              </div>
            ))}
          </div>
        </div>
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
};

export default function AdminPage() {
  return <AdminDashboard />;
}
