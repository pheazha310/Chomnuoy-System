import React, { useMemo, useState } from 'react';
import AdminSidebar from '@/app/admin/adminsidebar.jsx';
import '@/app/admin/style.css';
import './ReportsAdmin.css';

const RANGE_OPTIONS = [
  { days: 7, label: 'Last 7 Days' },
  { days: 30, label: 'Last 30 Days' },
  { days: 90, label: 'Last 90 Days' },
];

const REPORT_SERIES = {
  7: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    donors: [420, 620, 560, 840, 980, 910, 1050],
    organizations: [880, 960, 920, 1120, 1210, 1140, 1240],
    campaigns: [620, 720, 660, 880, 860, 820, 940],
  },
  30: {
    labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    donors: [420, 600, 540, 900, 1100, 1400],
    organizations: [880, 1000, 920, 1200, 1120, 1380],
    campaigns: [580, 720, 640, 900, 820, 960],
  },
  90: {
    labels: ['Week 1', 'Week 3', 'Week 5', 'Week 7', 'Week 9', 'Week 11', 'Week 13'],
    donors: [580, 720, 680, 920, 1080, 1260, 1340],
    organizations: [980, 1120, 1040, 1280, 1190, 1360, 1420],
    campaigns: [620, 760, 700, 880, 840, 920, 980],
  },
};

const STATUS_TONE = {
  'On Track': 'success',
  'At Risk': 'warning',
  Delayed: 'danger',
};

const formatCurrency = (value) => (
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
);

const KpiCard = ({ metric }) => (
  <div className={`admin-report-kpi admin-report-kpi-${metric.tone}`}>
    <div className="admin-report-kpi-top">
      <span className="admin-report-kpi-icon" aria-hidden="true">
        {metric.icon}
      </span>
      <span className="admin-report-kpi-change">{metric.change}</span>
    </div>
    <p className="admin-report-kpi-label">{metric.label}</p>
    <p className="admin-report-kpi-value">{metric.value}</p>
    <p className="admin-report-kpi-note">{metric.note}</p>
  </div>
);

export default function ReportsAdmin() {
  const [rangeDays, setRangeDays] = useState(30);
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [filters, setFilters] = useState({
    includePending: true,
    includeRefunds: false,
    autoExport: true,
  });

  const sessionRaw = window.localStorage.getItem('chomnuoy_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const adminName = session?.name || 'Admin';
  const adminRole = session?.role || session?.accountType || 'Admin';

  const series = REPORT_SERIES[rangeDays] || REPORT_SERIES[30];
  const chartWidth = 560;
  const chartHeight = 220;
  const chartPadding = { top: 18, right: 34, bottom: 22, left: 34 };
  const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const totalPoints = Math.max(1, series.donors.length - 1);
  const xStep = innerWidth / totalPoints;
  const combinedMax = Math.max(...series.donors, ...series.organizations, ...series.campaigns, 1);
  const combinedMin = Math.min(...series.donors, ...series.organizations, ...series.campaigns, 0);
  const valueRange = Math.max(1, combinedMax - combinedMin);

  const buildPoints = (values) => values.map((value, index) => {
    const x = chartPadding.left + index * xStep;
    const y = chartPadding.top + innerHeight - ((value - combinedMin) / valueRange) * innerHeight;
    return { x, y };
  });

  const donorPoints = buildPoints(series.donors);
  const orgPoints = buildPoints(series.organizations);
  const campaignPoints = buildPoints(series.campaigns);
  const donorLine = donorPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const orgLine = orgPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const campaignLine = campaignPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const donorArea = `${donorLine} ${chartPadding.left + innerWidth},${chartPadding.top + innerHeight} ${chartPadding.left},${chartPadding.top + innerHeight}`;
  const yTicks = 6;
  const tickValues = Array.from({ length: yTicks }, (_, index) => {
    const value = combinedMin + (valueRange * (yTicks - 1 - index)) / (yTicks - 1);
    return Math.round(value / 10) * 10;
  });

  const rangeLabel = useMemo(() => {
    const option = RANGE_OPTIONS.find((item) => item.days === rangeDays);
    return option ? option.label : 'Last 30 Days';
  }, [rangeDays]);

  const metrics = useMemo(() => ([
    {
      id: 'donations',
      label: 'Donation Volume',
      value: rangeDays === 7 ? formatCurrency(12450) : rangeDays === 90 ? formatCurrency(241300) : formatCurrency(82450),
      change: '+6.4%',
      note: rangeLabel,
      tone: 'success',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z" />
        </svg>
      ),
    },
    {
      id: 'items',
      label: 'Items Picked Up',
      value: rangeDays === 7 ? '2,680' : rangeDays === 90 ? '32,140' : '9,840',
      change: '+3.1%',
      note: 'Material pickups',
      tone: 'info',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h10l2 3h4v7h-2M4 17h8" />
          <path d="M6 19a2 2 0 1 1 4 0M16 19a2 2 0 1 1 4 0" />
        </svg>
      ),
    },
    {
      id: 'campaigns',
      label: 'Active Campaigns',
      value: rangeDays === 7 ? '58' : rangeDays === 90 ? '126' : '94',
      change: '+11.2%',
      note: 'Verified campaigns',
      tone: 'warning',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 11l9-6 9 6-9 6-9-6Z" />
          <path d="M12 17v4" />
        </svg>
      ),
    },
    {
      id: 'resolution',
      label: 'Avg. Resolution Time',
      value: rangeDays === 7 ? '12h' : rangeDays === 90 ? '10h' : '14h',
      change: '-8%',
      note: 'Report follow-up',
      tone: 'neutral',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="7" />
          <path d="M12 8v4l3 2" />
        </svg>
      ),
    },
  ]), [rangeDays, rangeLabel]);

  const topCampaigns = [
    {
      id: 1,
      name: 'School Kits for Rural Kids',
      org: 'Bright Future',
      raised: 12800,
      goal: 15000,
      status: 'On Track',
      growth: '+12%',
    },
    {
      id: 2,
      name: 'Emergency Health Kits',
      org: 'LifeLine Aid',
      raised: 9800,
      goal: 16000,
      status: 'At Risk',
      growth: '+4%',
    },
    {
      id: 3,
      name: 'Green Village Water Wells',
      org: 'HopeFlow',
      raised: 21500,
      goal: 22000,
      status: 'On Track',
      growth: '+19%',
    },
    {
      id: 4,
      name: 'Flood Relief Essentials',
      org: 'Rescue Path',
      raised: 6400,
      goal: 12000,
      status: 'Delayed',
      growth: '-6%',
    },
  ];

  const categoryBreakdown = [
    { label: 'Education', value: 38 },
    { label: 'Healthcare', value: 26 },
    { label: 'Disaster Relief', value: 18 },
    { label: 'Environment', value: 12 },
    { label: 'Other', value: 6 },
  ];

  const alerts = [
    {
      title: 'Spike in refund requests',
      description: 'Refund rate increased to 4.6% in the last 48 hours.',
      tone: 'warning',
      time: '2 hours ago',
    },
    {
      title: 'Delayed pickup tickets',
      description: '9 material pickups exceeded the 24h SLA window.',
      tone: 'danger',
      time: 'Today',
    },
    {
      title: 'High conversion campaign',
      description: '“Green Village Water Wells” is converting 21% above average.',
      tone: 'success',
      time: 'Yesterday',
    },
  ];

  const handleLogout = () => {
    window.localStorage.removeItem('chomnuoy_session');
    window.localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  return (
    <div className="admin-shell admin-report-shell">
      <AdminSidebar onLogout={() => setIsLogoutOpen(true)} userName={adminName} userRole={adminRole} />

      <main className="admin-main admin-report-main">
        <header className="admin-report-header">
          <div>
            <p className="admin-header-kicker">Admin Reports Center</p>
            <h1>Reports &amp; Insights</h1>
            <p className="admin-report-subtitle">Track fundraising performance, operational health, and campaign impact.</p>
          </div>
          <div className="admin-report-actions">
            <button className="admin-report-ghost" type="button">Download CSV</button>
            <button className="admin-primary-btn" type="button">Export PDF</button>
          </div>
        </header>

        <section className="admin-report-kpis">
          {metrics.map((metric) => (
            <KpiCard key={metric.id} metric={metric} />
          ))}
        </section>

        <section className="admin-report-grid">
          <div className="admin-panel admin-report-trends">
            <div className="admin-panel-header">
              <div>
                <h2>Donation &amp; Item Trends</h2>
                <p className="admin-report-caption">Compare funds raised with material pickups.</p>
              </div>
              <div className="admin-range">
                <button
                  className="admin-ghost-btn"
                  type="button"
                  onClick={() => setIsRangeOpen((prev) => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={isRangeOpen}
                >
                  {rangeLabel}
                </button>
                {isRangeOpen ? (
                  <div className="admin-range-menu" role="listbox">
                    {RANGE_OPTIONS.map((option) => (
                      <button
                        key={option.days}
                        type="button"
                        className={rangeDays === option.days ? 'is-active' : ''}
                        onClick={() => {
                          setRangeDays(option.days);
                          setIsRangeOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="admin-report-chart">
              <div className="admin-report-legend">
                <span style={{ '--legend-color': '#2563eb' }}>Donors</span>
                <span style={{ '--legend-color': '#10b981' }}>Organizations</span>
                <span style={{ '--legend-color': '#f59e0b' }}>Campaigns</span>
              </div>
              <div className="admin-report-axes">
                <div className="admin-report-axis admin-report-axis-left">
                  {tickValues.map((value) => (
                    <span key={`left-${value}`}>{value}</span>
                  ))}
                </div>
                <div className="admin-report-axis admin-report-axis-right">
                  {tickValues.map((value) => (
                    <span key={`right-${value}`}>{Math.max(0, Math.round((value / combinedMax) * 250))}</span>
                  ))}
                </div>
              </div>
              <svg className="admin-report-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="adminReportArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {tickValues.map((_, index) => {
                  const y = chartPadding.top + (innerHeight * index) / (yTicks - 1);
                  return (
                    <line
                      key={`grid-${index}`}
                      className="admin-report-gridline"
                      x1={chartPadding.left}
                      y1={y}
                      x2={chartPadding.left + innerWidth}
                      y2={y}
                    />
                  );
                })}
                <polygon className="admin-report-area" points={donorArea} />
                <polyline className="admin-report-line admin-report-line-donor" points={donorLine} />
                <polyline className="admin-report-line admin-report-line-org" points={orgLine} />
                <polyline className="admin-report-line admin-report-line-campaign" points={campaignLine} />
                {donorPoints.map((point, index) => (
                  <circle key={`donor-${index}`} className="admin-report-dot admin-report-dot-donor" cx={point.x} cy={point.y} r="3.5" />
                ))}
                {orgPoints.map((point, index) => (
                  <circle key={`org-${index}`} className="admin-report-dot admin-report-dot-org" cx={point.x} cy={point.y} r="3.5" />
                ))}
              </svg>
              <div className="admin-report-labels" style={{ '--label-count': series.labels.length }}>
                {series.labels.map((label, index) => (
                  <span key={`${label}-${index}`}>{label}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="admin-panel admin-report-map">
            <div className="admin-panel-header">
              <h2>Geographic Impact</h2>
              <button className="admin-ghost-btn" type="button">Full Map</button>
            </div>
            <div className="admin-report-map-preview">
              <div className="admin-report-map-dot" />
              <div className="admin-report-map-dot" />
              <div className="admin-report-map-dot" />
              <span>Heatmap Loading...</span>
            </div>
            <div className="admin-report-map-legend">
              {categoryBreakdown.map((item) => (
                <div key={item.label} className="admin-report-map-row">
                  <span>{item.label}</span>
                  <div className="admin-report-map-bar">
                    <span style={{ width: `${item.value}%` }} />
                  </div>
                  <strong>{item.value}%</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="admin-panel admin-report-table">
          <div className="admin-panel-header">
            <h2>Top Campaign Performance</h2>
            <button className="admin-ghost-btn" type="button">View Full Report</button>
          </div>
          <div className="admin-report-table-grid">
            <div className="admin-report-table-row admin-report-table-head">
              <span>Campaign</span>
              <span>Organization</span>
              <span>Raised</span>
              <span>Progress</span>
              <span>Status</span>
            </div>
            {topCampaigns.map((campaign) => {
              const progress = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));
              const tone = STATUS_TONE[campaign.status] || 'neutral';
              return (
                <div key={campaign.id} className="admin-report-table-row">
                  <div className="admin-report-campaign">
                    <p>{campaign.name}</p>
                    <small>{campaign.growth} this period</small>
                  </div>
                  <span>{campaign.org}</span>
                  <span>{formatCurrency(campaign.raised)}</span>
                  <div className="admin-report-progress">
                    <div>
                      <span style={{ width: `${progress}%` }} />
                    </div>
                    <small>{progress}%</small>
                  </div>
                  <span className={`admin-report-status admin-report-status-${tone}`}>{campaign.status}</span>
                </div>
              );
            })}
          </div>
        </div>

        <section className="admin-report-secondary">
          <div className="admin-panel admin-report-panel">
            <div className="admin-panel-header">
              <h2>Report Filters</h2>
              <span className="admin-report-pill">Live</span>
            </div>
            <div className="admin-report-filter-list">
              <label className="admin-report-filter">
                <span>Include pending donations</span>
                <input
                  type="checkbox"
                  checked={filters.includePending}
                  onChange={(event) => setFilters((prev) => ({ ...prev, includePending: event.target.checked }))}
                />
              </label>
              <label className="admin-report-filter">
                <span>Include refunds</span>
                <input
                  type="checkbox"
                  checked={filters.includeRefunds}
                  onChange={(event) => setFilters((prev) => ({ ...prev, includeRefunds: event.target.checked }))}
                />
              </label>
              <label className="admin-report-filter">
                <span>Auto-export weekly</span>
                <input
                  type="checkbox"
                  checked={filters.autoExport}
                  onChange={(event) => setFilters((prev) => ({ ...prev, autoExport: event.target.checked }))}
                />
              </label>
            </div>
            <div className="admin-report-filter-actions">
              <button className="admin-report-ghost" type="button">Reset</button>
              <button className="admin-primary-btn" type="button">Apply Filters</button>
            </div>
          </div>

          <div className="admin-panel admin-report-panel">
            <div className="admin-panel-header">
              <h2>Operational Alerts</h2>
              <button className="admin-ghost-btn" type="button">View All</button>
            </div>
            <div className="admin-report-alerts">
              {alerts.map((alert) => (
                <div key={alert.title} className={`admin-report-alert admin-report-alert-${alert.tone}`}>
                  <div>
                    <h3>{alert.title}</h3>
                    <p>{alert.description}</p>
                  </div>
                  <span>{alert.time}</span>
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
}
