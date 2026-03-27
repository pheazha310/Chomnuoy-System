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

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isCompletedDonation = (donation) => {
  const status = String(donation?.status || '').toLowerCase();
  return status === '' || status === 'completed' || status === 'success' || status === 'paid';
};

const isMoneyDonation = (donation) => String(donation?.donation_type || '').toLowerCase() === 'money';

const isMaterialDonation = (donation) => String(donation?.donation_type || '').toLowerCase() === 'material';

const isPendingLike = (value) => {
  const status = String(value || '').toLowerCase();
  return !status || status.includes('pending') || status.includes('review') || status.includes('urgent');
};

const countInDateWindow = (items, getValue, start, end) => (
  items.reduce((total, item) => {
    const dateValue = getValue(item);
    if (!dateValue) return total;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return total;
    return date >= start && date <= end ? total + 1 : total;
  }, 0)
);

const sumInDateWindow = (items, amountSelector, dateSelector, start, end) => (
  items.reduce((total, item) => {
    const dateValue = dateSelector(item);
    if (!dateValue) return total;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime()) || date < start || date > end) return total;
    return total + toNumber(amountSelector(item));
  }, 0)
);

const formatCurrency = (value) => `$${toNumber(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatCount = (value) => toNumber(value).toLocaleString();

const formatDeltaPercent = (current, previous) => {
  const currentValue = toNumber(current);
  const previousValue = toNumber(previous);

  if (previousValue <= 0) {
    return currentValue > 0 ? 'New activity' : 'No change';
  }

  const percent = ((currentValue - previousValue) / previousValue) * 100;
  const rounded = Math.abs(percent).toFixed(1);
  return `${percent >= 0 ? '+' : '-'}${rounded}%`;
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
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState('');
  const [overviewStats, setOverviewStats] = useState([
    { id: 'funds', label: 'Total Funds Raised', value: '$0.00', change: 'Loading...', tone: 'success' },
    { id: 'items', label: 'Total Items Donated', value: '0', change: 'Loading...', tone: 'info' },
    { id: 'tasks', label: 'Urgent Tasks', value: '0', change: 'Loading...', tone: 'warning' },
  ]);
  const [urgentTasks, setUrgentTasks] = useState([]);
  const [urgentTaskTotal, setUrgentTaskTotal] = useState(0);
  const sessionRaw = window.localStorage.getItem('chomnuoy_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const adminName = session?.name || 'Admin';
  const adminRole = session?.role || session?.accountType || 'Admin';
  const apiBase = import.meta.env.VITE_API_URL || 'https://chomnuoy-backend-1.onrender.com/api';
  const rangeLabel = rangeDays === 1 ? 'Today' : `Last ${rangeDays} Days`;
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

    setOverviewLoading(true);
    setOverviewError('');

    Promise.all([
      fetch(`${apiBase}/donations`, { headers }).then((res) => (res.ok ? res.json() : [])),
      fetch(`${apiBase}/material_items`, { headers }).then((res) => (res.ok ? res.json() : [])),
      fetch(`${apiBase}/material_pickups`, { headers }).then((res) => (res.ok ? res.json() : [])),
      fetch(`${apiBase}/organizations`, { headers }).then((res) => (res.ok ? res.json() : [])),
      fetch(`${apiBase}/notifications`, { headers }).then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([donationsData, materialItemsData, pickupsData, organizationsData, notificationsData]) => {
        if (!active) return;

        const donations = Array.isArray(donationsData) ? donationsData : [];
        const materialItems = Array.isArray(materialItemsData) ? materialItemsData : [];
        const pickups = Array.isArray(pickupsData) ? pickupsData : [];
        const organizations = Array.isArray(organizationsData) ? organizationsData : [];
        const notifications = Array.isArray(notificationsData) ? notificationsData : [];

        const completedMoneyDonations = donations.filter((item) => isMoneyDonation(item) && isCompletedDonation(item));
        const completedMaterialDonations = donations.filter((item) => isMaterialDonation(item) && isCompletedDonation(item));

        const totalFundsRaised = completedMoneyDonations.reduce((sum, item) => sum + toNumber(item.amount), 0);
        const totalItemsDonated = materialItems.length > 0
          ? materialItems.reduce((sum, item) => sum + Math.max(0, toNumber(item.quantity) || 1), 0)
          : completedMaterialDonations.length;

        const now = new Date();
        const currentWindowStart = new Date(now);
        currentWindowStart.setDate(now.getDate() - 29);
        currentWindowStart.setHours(0, 0, 0, 0);

        const previousWindowEnd = new Date(currentWindowStart);
        previousWindowEnd.setMilliseconds(-1);

        const previousWindowStart = new Date(currentWindowStart);
        previousWindowStart.setDate(currentWindowStart.getDate() - 30);

        const currentFunds = sumInDateWindow(completedMoneyDonations, (item) => item.amount, (item) => item.created_at, currentWindowStart, now);
        const previousFunds = sumInDateWindow(completedMoneyDonations, (item) => item.amount, (item) => item.created_at, previousWindowStart, previousWindowEnd);

        const currentItems = materialItems.length > 0
          ? sumInDateWindow(materialItems, (item) => item.quantity || 1, (item) => item.created_at, currentWindowStart, now)
          : countInDateWindow(completedMaterialDonations, (item) => item.created_at, currentWindowStart, now);

        const previousItems = materialItems.length > 0
          ? sumInDateWindow(materialItems, (item) => item.quantity || 1, (item) => item.created_at, previousWindowStart, previousWindowEnd)
          : countInDateWindow(completedMaterialDonations, (item) => item.created_at, previousWindowStart, previousWindowEnd);

        const pendingOrganizations = organizations.filter((item) => isPendingLike(item?.verified_status || item?.status));
        const pendingPickups = pickups.filter((item) => isPendingLike(item?.status));
        const unreadNotifications = notifications.filter((item) => !item?.is_read);

        const dynamicTasks = [
          pendingOrganizations.length > 0
            ? {
              title: 'Verify Organization Documents',
              description: `${pendingOrganizations.length} organization${pendingOrganizations.length === 1 ? '' : 's'} waiting for review.`,
              due: 'Needs review',
              tone: 'danger',
            }
            : null,
          pendingPickups.length > 0
            ? {
              title: 'Schedule Material Pickups',
              description: `${pendingPickups.length} pickup request${pendingPickups.length === 1 ? '' : 's'} still pending.`,
              due: 'Pending scheduling',
              tone: 'info',
            }
            : null,
          unreadNotifications.length > 0
            ? {
              title: 'Check Unread Notifications',
              description: `${unreadNotifications.length} unread alert${unreadNotifications.length === 1 ? '' : 's'} require attention.`,
              due: 'Action required',
              tone: 'warning',
            }
            : null,
        ].filter(Boolean);

        const urgentCount = pendingOrganizations.length + pendingPickups.length + unreadNotifications.length;

        setOverviewStats([
          {
            id: 'funds',
            label: 'Total Funds Raised',
            value: formatCurrency(totalFundsRaised),
            change: formatDeltaPercent(currentFunds, previousFunds),
            tone: 'success',
          },
          {
            id: 'items',
            label: 'Total Items Donated',
            value: formatCount(totalItemsDonated),
            change: formatDeltaPercent(currentItems, previousItems),
            tone: 'info',
          },
          {
            id: 'tasks',
            label: 'Urgent Tasks',
            value: formatCount(urgentCount),
            change: urgentCount > 0 ? 'Action required' : 'All clear',
            tone: 'warning',
          },
        ]);
        setUrgentTasks(dynamicTasks);
        setUrgentTaskTotal(urgentCount);
      })
      .catch((err) => {
        if (!active) return;
        setOverviewStats([
          {
            id: 'funds',
            label: 'Total Funds Raised',
            value: '$0.00',
            change: 'Unavailable',
            tone: 'success',
          },
          {
            id: 'items',
            label: 'Total Items Donated',
            value: '0',
            change: 'Unavailable',
            tone: 'info',
          },
          {
            id: 'tasks',
            label: 'Urgent Tasks',
            value: '0',
            change: 'Unavailable',
            tone: 'warning',
          },
        ]);
        setUrgentTasks([]);
        setUrgentTaskTotal(0);
        setOverviewError(err instanceof Error ? err.message : 'Unable to load overview data.');
      })
      .finally(() => {
        if (active) setOverviewLoading(false);
      });

    return () => {
      active = false;
    };
  }, [apiBase]);

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
    window.location.href = '/';
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
      {overviewError && !overviewLoading ? <p className="admin-chart-footnote">{overviewError}</p> : null}

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
                  <span>{rangeLabel}</span>
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M5 7.5 10 12.5l5-5" />
                  </svg>
                </button>
                {isRangeOpen ? (
                  <div className="admin-range-menu" role="listbox">
                    <button
                      type="button"
                      className={rangeDays === 1 ? 'is-active' : ''}
                      onClick={() => {
                        setRangeDays(1);
                        setIsRangeOpen(false);
                      }}
                    >
                      <span>Today</span>
                      <small>Current day activity</small>
                    </button>
                    <button
                      type="button"
                      className={rangeDays === 7 ? 'is-active' : ''}
                      onClick={() => {
                        setRangeDays(7);
                        setIsRangeOpen(false);
                      }}
                    >
                      <span>Last 7 Days</span>
                      <small>Weekly trend</small>
                    </button>
                    <button
                      type="button"
                      className={rangeDays === 30 ? 'is-active' : ''}
                      onClick={() => {
                        setRangeDays(30);
                        setIsRangeOpen(false);
                      }}
                    >
                      <span>Last 30 Days</span>
                      <small>Monthly overview</small>
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
            <span className="admin-pill">{formatCount(urgentTaskTotal)} open</span>
          </div>
          <div className="admin-task-list">
            {urgentTasks.length > 0 ? urgentTasks.map((task) => (
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
            )) : (
              <div className="admin-task admin-tone-info">
                <div className="admin-task-icon" aria-hidden="true">
                  {TASK_ICONS.info}
                </div>
                <div className="admin-task-body">
                  <h3>No urgent tasks</h3>
                  <p>Current project data does not show pending admin actions.</p>
                  <span>All clear</span>
                </div>
              </div>
            )}
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
            <p>You will be returned to the public home page.</p>
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
