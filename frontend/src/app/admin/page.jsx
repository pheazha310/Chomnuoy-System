import './style.css';
import React, { useState } from 'react';
import AdminSidebar from './adminsidebar';

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

const CHART_VALUES = [12, 18, 10, 22, 16, 26, 20];
const CHART_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TASK_ICONS = {
  danger: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4 3 20h18L12 4Z" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinejoin="round" />
      <path d="M12 9v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="6" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="1.7" fill="none" />
      <path d="M8 12h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 9v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4 3 20h18L12 4Z" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinejoin="round" />
      <path d="M12 9v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
    </svg>
  ),
};

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


const AdminDashboard = () => {
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const sessionRaw = window.localStorage.getItem('chomnuoy_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const adminName = session?.name || 'Admin';
  const maxValue = Math.max(...CHART_VALUES);
  const minValue = Math.min(...CHART_VALUES);
  const chartWidth = 560;
  const chartHeight = 180;
  const valueRange = Math.max(1, maxValue - minValue);
  const xStep = chartWidth / (CHART_VALUES.length - 1);
  const chartPoints = CHART_VALUES.map((value, index) => {
    const x = index * xStep;
    const y = chartHeight - ((value - minValue) / valueRange) * chartHeight;
    return `${x},${y}`;
  }).join(' ');
  const chartAreaPoints = `${chartPoints} ${chartWidth},${chartHeight} 0,${chartHeight}`;

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
              <div className="admin-chart-canvas" role="img" aria-label="Donations trend for the last 7 days">
                <svg className="admin-chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="adminAreaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2e5cff" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#2e5cff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon className="admin-chart-area" points={chartAreaPoints} />
                  <polyline className="admin-chart-line" points={chartPoints} />
                  {CHART_VALUES.map((value, index) => {
                    const x = index * xStep;
                    const y = chartHeight - ((value - minValue) / valueRange) * chartHeight;
                    return <circle key={`${value}-${index}`} className="admin-chart-dot" cx={x} cy={y} r="4" />;
                  })}
                </svg>
                <div className="admin-chart-labels" aria-hidden="true">
                  {CHART_LABELS.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
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
                <div className="admin-task-icon" aria-hidden="true">
                  {TASK_ICONS[task.tone] ?? TASK_ICONS.info}
                </div>
                <div className="admin-task-body">
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
