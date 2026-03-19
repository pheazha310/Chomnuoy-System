import './style.css';
import React, { useEffect, useMemo, useState } from 'react';
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

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
};

const normalizeStatus = (value) => {
  const status = String(value || '').toLowerCase();
  if (status.includes('verify')) return 'Verified';
  if (status.includes('pending')) return 'Pending';
  if (status.includes('reject')) return 'Rejected';
  return value ? String(value) : 'Pending';
};


const AdminDashboard = () => {
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [joinCounts, setJoinCounts] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [joinLoading, setJoinLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(7);
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const [recentOrgs, setRecentOrgs] = useState([]);
  const [recentOrgsLoading, setRecentOrgsLoading] = useState(true);
  const [recentOrgsError, setRecentOrgsError] = useState('');
  const sessionRaw = window.localStorage.getItem('chomnuoy_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const adminName = session?.name || 'Admin';
  const adminRole = session?.role || session?.accountType || 'Admin';
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const chartLabels = useMemo(() => {
    if (rangeDays === 7) return CHART_LABELS;
    const labels = [];
    const today = new Date();
    for (let i = rangeDays - 1; i >= 0; i -= 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      labels.push(day.toLocaleDateString(undefined, { month: 'short', day: '2-digit' }));
    }
    return labels;
  }, [rangeDays]);
  const maxValue = Math.max(...joinCounts, 1);
  const minValue = Math.min(...joinCounts, 0);
  const chartWidth = 560;
  const chartHeight = 180;
  const chartPadding = { top: 10, right: 10, bottom: 10, left: 10 };
  const valueRange = Math.max(1, maxValue - minValue);
  const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const xStep = innerWidth / Math.max(1, (joinCounts.length - 1));
  const chartPoints = joinCounts.map((value, index) => {
    const x = chartPadding.left + index * xStep;
    const y = chartPadding.top + innerHeight - ((value - minValue) / valueRange) * innerHeight;
    return `${x},${y}`;
  }).join(' ');
  const chartAreaPoints = `${chartPoints} ${chartPadding.left + innerWidth},${chartPadding.top + innerHeight} ${chartPadding.left},${chartPadding.top + innerHeight}`;

  const weekdayIndex = (date) => {
    const day = date.getDay(); // 0=Sun
    return (day + 6) % 7; // shift so Mon=0 ... Sun=6
  };

  useEffect(() => {
    let active = true;
    const token = window.localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const fetchUsers = fetch(`${apiBase}/users`, { headers }).then((res) => (res.ok ? res.json() : []));
    const fetchOrgs = fetch(`${apiBase}/organizations`, { headers }).then((res) => (res.ok ? res.json() : []));

    Promise.all([fetchUsers, fetchOrgs])
      .then(([users, orgs]) => {
        if (!active) return;
        const counts = Array.from({ length: rangeDays }, () => 0);
        const now = new Date();
        const last7 = new Date(now);
        last7.setDate(now.getDate() - (rangeDays - 1));

        const addIfInRange = (dateValue) => {
          if (!dateValue) return;
          const createdAt = new Date(dateValue);
          if (Number.isNaN(createdAt.getTime())) return;
          if (createdAt < last7 || createdAt > now) return;
          if (rangeDays === 7) {
            const idx = weekdayIndex(createdAt);
            counts[idx] += 1;
            return;
          }
          const dayDiff = Math.floor((createdAt.setHours(0, 0, 0, 0) - last7.setHours(0, 0, 0, 0)) / 86400000);
          if (dayDiff >= 0 && dayDiff < rangeDays) {
            counts[dayDiff] += 1;
          }
        };

        (Array.isArray(users) ? users : []).forEach((user) => addIfInRange(user?.created_at));
        (Array.isArray(orgs) ? orgs : []).forEach((org) => addIfInRange(org?.created_at));

        setJoinCounts(counts);
      })
      .catch(() => {
        if (!active) return;
        setJoinCounts(Array.from({ length: rangeDays }, () => 0));
      })
      .finally(() => {
        if (active) setJoinLoading(false);
      });

    return () => {
      active = false;
    };
  }, [apiBase, rangeDays]);

  useEffect(() => {
    let active = true;
    const token = window.localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    setRecentOrgsLoading(true);
    setRecentOrgsError('');

    Promise.all([
      fetch(`${apiBase}/organizations`, { headers }).then((res) => (res.ok ? res.json() : [])),
      fetch(`${apiBase}/categories`, { headers }).then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([orgsData, categoriesData]) => {
        if (!active) return;
        const orgs = Array.isArray(orgsData) ? orgsData : [];
        const categories = Array.isArray(categoriesData) ? categoriesData : [];
        const categoryMap = new Map();
        categories.forEach((cat) => {
          if (cat?.id) {
            categoryMap.set(Number(cat.id), cat.category_name || cat.name || '');
          }
        });

        const normalized = orgs
          .map((org) => ({
            id: org.id,
            name: org.name || 'Organization',
            category: categoryMap.get(Number(org.category_id)) || 'Uncategorized',
            status: normalizeStatus(org.verified_status || org.status),
            date: formatDate(org.created_at),
            createdAt: org.created_at ? new Date(org.created_at).getTime() : 0,
          }))
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 6);

        setRecentOrgs(normalized);
      })
      .catch((err) => {
        if (!active) return;
        setRecentOrgs([]);
        setRecentOrgsError(err instanceof Error ? err.message : 'Unable to load organizations.');
      })
      .finally(() => {
        if (active) setRecentOrgsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [apiBase]);

  const totalJoins = useMemo(() => joinCounts.reduce((sum, value) => sum + value, 0), [joinCounts]);

  const handleLogout = () => {
    window.localStorage.removeItem('chomnuoy_session');
    window.localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  return (
    <div className="admin-shell">
      <AdminSidebar onLogout={() => setIsLogoutOpen(true)} userName={adminName} userRole={adminRole} />

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
              <h2>User & Organization Joins</h2>
              <div className="admin-range">
                <button
                  className="admin-ghost-btn"
                  type="button"
                  onClick={() => setIsRangeOpen((prev) => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={isRangeOpen}
                >
                  Last {rangeDays} Days
                </button>
                {isRangeOpen ? (
                  <div className="admin-range-menu" role="listbox">
                    <button
                      type="button"
                      className={rangeDays === 7 ? 'is-active' : ''}
                      onClick={() => {
                        setRangeDays(7);
                        setIsRangeOpen(false);
                      }}
                    >
                      Last 7 Days
                    </button>
                    <button
                      type="button"
                      className={rangeDays === 30 ? 'is-active' : ''}
                      onClick={() => {
                        setRangeDays(30);
                        setIsRangeOpen(false);
                      }}
                    >
                      Last 30 Days
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="admin-chart">
              <div className="admin-chart-canvas" role="img" aria-label="New users and organizations joined per weekday">
                <svg className="admin-chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="adminAreaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2e5cff" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#2e5cff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon className="admin-chart-area" points={chartAreaPoints} />
                  <polyline className="admin-chart-line" points={chartPoints} />
                  {joinCounts.map((value, index) => {
                    const x = chartPadding.left + index * xStep;
                    const y = chartPadding.top + innerHeight - ((value - minValue) / valueRange) * innerHeight;
                    return (
                      <circle
                        key={`${value}-${index}`}
                        className="admin-chart-dot"
                        cx={x}
                        cy={y}
                        r="3"
                        onMouseEnter={() => setTooltip({ index, x, y })}
                        onMouseLeave={() => setTooltip(null)}
                        onFocus={() => setTooltip({ index, x, y })}
                        onBlur={() => setTooltip(null)}
                        tabIndex={0}
                      />
                    );
                  })}
                </svg>
                {tooltip ? (
                  <div
                    className="admin-chart-tooltip"
                    style={{
                      left: `${(tooltip.x / chartWidth) * 100}%`,
                      top: `${(tooltip.y / chartHeight) * 100}%`,
                    }}
                    role="status"
                  >
                    <strong>
                      {joinCounts[tooltip.index]} {joinCounts[tooltip.index] === 1 ? 'join' : 'joins'}
                    </strong>
                    <span>{chartLabels[tooltip.index]}</span>
                  </div>
                ) : null}
                <div className="admin-chart-labels" aria-hidden="true">
                  {chartLabels.map((label, index) => (
                    <span key={`${label}-${index}`}>
                      {rangeDays === 30 && index % 5 !== 0 ? '' : label}
                    </span>
                  ))}
                </div>
              </div>
              {!joinLoading ? (
                <p className="admin-chart-footnote">
                  {totalJoins.toLocaleString()} new joins (users + organizations)
                </p>
              ) : null}
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
            {recentOrgsLoading ? (
              <div className="admin-table-row">
                <span>Loading organizations...</span>
              </div>
            ) : null}
            {!recentOrgsLoading && recentOrgsError ? (
              <div className="admin-table-row">
                <span>{recentOrgsError}</span>
              </div>
            ) : null}
            {!recentOrgsLoading && !recentOrgsError && recentOrgs.length === 0 ? (
              <div className="admin-table-row">
                <span>No organizations found.</span>
              </div>
            ) : null}
            {!recentOrgsLoading && !recentOrgsError && recentOrgs.length > 0
              ? recentOrgs.map((org) => (
                <div key={org.id} className="admin-table-row">
                  <span className="admin-org-name">{org.name}</span>
                  <span>{org.category}</span>
                  <span className={`admin-status admin-status-${org.status.toLowerCase()}`}>{org.status}</span>
                  <span>{org.date}</span>
                </div>
              ))
              : null}
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

