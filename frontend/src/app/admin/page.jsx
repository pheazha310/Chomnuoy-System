import './style.css';
import React, { useEffect, useMemo, useState } from 'react';
import AdminSidebar from './adminsidebar';

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

const isSameDay = (left, right) => (
  left.getFullYear() === right.getFullYear()
  && left.getMonth() === right.getMonth()
  && left.getDate() === right.getDate()
);

const isUrgentOrganization = (organization) => {
  const status = String(organization?.verified_status || organization?.status || '').toLowerCase();
  if (!status) return true;
  if (status.includes('verify') || status.includes('approved') || status.includes('active')) return false;
  if (status.includes('reject') || status.includes('inactive')) return false;
  return status.includes('pending') || status.includes('review') || status.includes('await');
};

const isUrgentUser = (user) => {
  const role = String(user?.role || user?.role_name || '').toLowerCase();
  if (role.includes('admin')) return false;
  const status = String(user?.status || '').toLowerCase();
  if (!status) return false;
  if (status.includes('active') || status.includes('verified') || status.includes('approve')) return false;
  if (status.includes('reject') || status.includes('inactive')) return false;
  return status.includes('pending') || status.includes('review') || status.includes('await');
};

const formatTaskDue = (value) => {
  if (!value) return 'Awaiting review';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Awaiting review';
  const today = new Date();
  if (isSameDay(date, today)) return 'Submitted today';
  return `Submitted ${date.toLocaleDateString(undefined, { month: 'short', day: '2-digit' })}`;
};

const AdminDashboard = () => {
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isAllTasksOpen, setIsAllTasksOpen] = useState(false);
  const [joinCounts, setJoinCounts] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [joinLoading, setJoinLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(7);
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const [recentOrgs, setRecentOrgs] = useState([]);
  const [recentOrgsLoading, setRecentOrgsLoading] = useState(true);
  const [recentOrgsError, setRecentOrgsError] = useState('');
  const [overviewStats, setOverviewStats] = useState([
    { id: 'customers-today', label: 'Customers Today', value: '0', change: 'Loading...', tone: 'success' },
    { id: 'total-customers', label: 'Total Customers', value: '0', change: 'Loading...', tone: 'info' },
    { id: 'tasks', label: 'Urgent Tasks', value: '0', change: 'Loading...', tone: 'warning' },
  ]);
  const [urgentTasks, setUrgentTasks] = useState([]);
  const [allUrgentTasks, setAllUrgentTasks] = useState([]);
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
        const safeUsers = Array.isArray(users) ? users : [];
        const safeOrgs = Array.isArray(orgs) ? orgs : [];
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

        safeUsers.forEach((user) => addIfInRange(user?.created_at));
        safeOrgs.forEach((org) => addIfInRange(org?.created_at));

        const customersToday = safeUsers.filter((user) => {
          if (!user?.created_at) return false;
          const createdAt = new Date(user.created_at);
          if (Number.isNaN(createdAt.getTime())) return false;
          return isSameDay(createdAt, now);
        }).length;

        const pendingOrganizations = safeOrgs
          .filter((org) => isUrgentOrganization(org))
          .sort((left, right) => new Date(left?.created_at || 0).getTime() - new Date(right?.created_at || 0).getTime());

        const pendingUsers = safeUsers
          .filter((user) => isUrgentUser(user))
          .sort((left, right) => new Date(left?.created_at || 0).getTime() - new Date(right?.created_at || 0).getTime());

        const combinedUrgentTasks = [
          ...pendingUsers.map((user) => ({
            title: `Review User ${user?.name || 'Unknown'}`,
            description: 'User account is waiting for approval.',
            due: formatTaskDue(user?.created_at),
            tone: 'warning',
            createdAt: user?.created_at ? new Date(user.created_at).getTime() : 0,
          })),
          ...pendingOrganizations.map((org) => ({
            title: `Review Organization ${org?.name || 'Organization'}`,
            description: 'Organization registration is waiting for verification.',
            due: formatTaskDue(org?.created_at),
            tone: 'warning',
            createdAt: org?.created_at ? new Date(org.created_at).getTime() : 0,
          })),
        ].sort((left, right) => left.createdAt - right.createdAt);

        setOverviewStats([
          {
            id: 'customers-today',
            label: 'Customers Today',
            value: customersToday.toLocaleString(),
            change: `${rangeDays}-day live data`,
            tone: 'success',
          },
          {
            id: 'total-customers',
            label: 'Total Customers',
            value: (safeUsers.length + safeOrgs.length).toLocaleString(),
            change: `${safeUsers.length.toLocaleString()} users + ${safeOrgs.length.toLocaleString()} orgs`,
            tone: 'info',
          },
          {
            id: 'tasks',
            label: 'Urgent Tasks',
            value: combinedUrgentTasks.length.toLocaleString(),
            change: combinedUrgentTasks.length > 0 ? 'Users and orgs need review' : 'All caught up',
            tone: 'warning',
          },
        ]);

        const mappedUrgentTasks = combinedUrgentTasks.map(({ createdAt, ...task }) => task);

        setAllUrgentTasks(mappedUrgentTasks);
        setUrgentTasks(
          mappedUrgentTasks.slice(0, 3)
        );

        setJoinCounts(counts);
      })
      .catch(() => {
        if (!active) return;
        setJoinCounts(Array.from({ length: rangeDays }, () => 0));
        setOverviewStats([
          { id: 'customers-today', label: 'Customers Today', value: '0', change: 'Unable to load', tone: 'success' },
          { id: 'total-customers', label: 'Total Customers', value: '0', change: 'Unable to load', tone: 'info' },
          { id: 'tasks', label: 'Urgent Tasks', value: '0', change: 'Unable to load', tone: 'warning' },
        ]);
        setUrgentTasks([]);
        setAllUrgentTasks([]);
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
        {overviewStats.map((stat) => (
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
            <span className="admin-pill">{allUrgentTasks.length} new</span>
          </div>
          <div className="admin-task-list">
            {urgentTasks.length > 0 ? urgentTasks.map((task, index) => (
              <div key={`${task.title}-${index}`} className={`admin-task admin-tone-${task.tone}`}>
                <div className="admin-task-icon" aria-hidden="true">
                  {TASK_ICONS[task.tone] ?? TASK_ICONS.info}
                </div>
                <div className="admin-task-body">
                  <h3>{task.title}</h3>
                  <p>{task.description}</p>
                  <span>{task.due}</span>
                </div>
              </div>
            )) : (
              <div className="admin-task admin-tone-info">
                <div className="admin-task-icon" aria-hidden="true">
                  {TASK_ICONS.info}
                </div>
                <div className="admin-task-body">
                  <h3>No urgent tasks</h3>
                  <p>There are no organizations waiting for review right now.</p>
                  <span>Up to date</span>
                </div>
              </div>
            )}
          </div>
          <button
            className="admin-ghost-btn admin-full-btn"
            type="button"
            onClick={() => setIsAllTasksOpen(true)}
          >
            View All Tasks
          </button>
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

      {isAllTasksOpen ? (
        <div className="admin-modal-overlay" role="presentation" onClick={() => setIsAllTasksOpen(false)}>
          <div
            className="admin-modal admin-modal-large"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-all-tasks-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="admin-all-tasks-title">All Urgent Tasks</h3>
            <p>
              {allUrgentTasks.length > 0
                ? `${allUrgentTasks.length} urgent task${allUrgentTasks.length === 1 ? '' : 's'} need attention.`
                : 'There are no urgent tasks right now.'}
            </p>
            <div className="admin-task-list">
              {allUrgentTasks.length > 0 ? allUrgentTasks.map((task, index) => (
                <div key={`modal-${task.title}-${index}`} className={`admin-task admin-tone-${task.tone}`}>
                  <div className="admin-task-icon" aria-hidden="true">
                    {TASK_ICONS[task.tone] ?? TASK_ICONS.info}
                  </div>
                  <div className="admin-task-body">
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                    <span>{task.due}</span>
                  </div>
                </div>
              )) : (
                <div className="admin-task admin-tone-info">
                  <div className="admin-task-icon" aria-hidden="true">
                    {TASK_ICONS.info}
                  </div>
                  <div className="admin-task-body">
                    <h3>No urgent tasks</h3>
                    <p>There are no organizations waiting for review right now.</p>
                    <span>Up to date</span>
                  </div>
                </div>
              )}
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="admin-modal-cancel" onClick={() => setIsAllTasksOpen(false)}>
                Close
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

