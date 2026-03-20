import React, { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '@/app/admin/adminsidebar.jsx';
import '@/app/admin/style.css';
import './ReportsAdmin.css';

const RANGE_OPTIONS = [
  { days: 7, label: 'Last 7 Days' },
  { days: 30, label: 'Last 30 Days' },
  { days: 90, label: 'Last 90 Days' },
];

const STATUS_TONE = {
  'On Track': 'success',
  'At Risk': 'warning',
  Delayed: 'danger',
};

const KPI_ICONS = {
  donations: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z" />
    </svg>
  ),
  items: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h10l2 3h4v7h-2M4 17h8" />
      <path d="M6 19a2 2 0 1 1 4 0M16 19a2 2 0 1 1 4 0" />
    </svg>
  ),
  campaigns: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 11l9-6 9 6-9 6-9-6Z" />
      <path d="M12 17v4" />
    </svg>
  ),
  resolution: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
      <path d="M12 8v4l3 2" />
    </svg>
  ),
};

const DEFAULT_REPORT_DATA = {
  meta: { days: 30, start_date: '', end_date: '' },
  kpis: [],
  series: { labels: [], donors: [], organizations: [], campaigns: [] },
  category_breakdown: [],
  top_campaigns: [],
  placeholders: {},
  examples: { alerts: [] },
};

const formatCurrency = (value) => (
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
);

const formatDateForFileName = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const escapeCsvCell = (value) => {
  const normalized = String(value ?? '').replace(/"/g, '""');
  return `"${normalized}"`;
};

const escapeHtml = (value) => (
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
);

const formatMetricValue = (metric) => {
  if (metric.id === 'donations') {
    return formatCurrency(metric.value);
  }
  if (metric.id === 'resolution') {
    return `${Number(metric.value || 0).toLocaleString()}h`;
  }
  return Number(metric.value || 0).toLocaleString();
};

const KpiCard = ({ metric }) => (
  <div className={`admin-report-kpi admin-report-kpi-${metric.tone || 'neutral'}`}>
    <div className="admin-report-kpi-top">
      <span className="admin-report-kpi-icon" aria-hidden="true">
        {KPI_ICONS[metric.id] || KPI_ICONS.donations}
      </span>
      {metric.change ? <span className="admin-report-kpi-change">{metric.change}</span> : null}
    </div>
    <p className="admin-report-kpi-label">{metric.label}</p>
    <p className="admin-report-kpi-value">{formatMetricValue(metric)}</p>
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
  const [reportData, setReportData] = useState(DEFAULT_REPORT_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sessionRaw = window.localStorage.getItem('chomnuoy_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const adminName = session?.name || 'Admin';
  const adminRole = session?.role || session?.accountType || 'Admin';
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    let active = true;
    const token = window.localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const params = new URLSearchParams({
      days: String(rangeDays),
      include_pending: String(filters.includePending),
    });

    setLoading(true);
    setError('');

    fetch(`${apiBase}/report/admin-dashboard?${params.toString()}`, { headers })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load report data (${response.status})`);
        }
        return response.json();
      })
      .then((payload) => {
        if (!active) return;
        setReportData({
          ...DEFAULT_REPORT_DATA,
          ...payload,
          meta: { ...DEFAULT_REPORT_DATA.meta, ...(payload?.meta || {}) },
          series: { ...DEFAULT_REPORT_DATA.series, ...(payload?.series || {}) },
          examples: { ...DEFAULT_REPORT_DATA.examples, ...(payload?.examples || {}) },
        });
      })
      .catch((fetchError) => {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load admin report data.');
        setReportData(DEFAULT_REPORT_DATA);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [apiBase, filters.includePending, rangeDays]);

  const series = reportData.series || DEFAULT_REPORT_DATA.series;
  const chartWidth = 560;
  const chartHeight = 220;
  const chartPadding = { top: 18, right: 34, bottom: 22, left: 34 };
  const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const totalPoints = Math.max(1, series.labels.length - 1);
  const xStep = innerWidth / totalPoints;
  const chartValues = [
    ...(series.donors || []),
    ...(series.organizations || []),
    ...(series.campaigns || []),
  ];
  const combinedMax = Math.max(...chartValues, 1);
  const combinedMin = Math.min(...chartValues, 0);
  const valueRange = Math.max(1, combinedMax - combinedMin);
  const yTicks = 6;

  const buildPoints = (values) => values.map((value, index) => {
    const x = chartPadding.left + index * xStep;
    const y = chartPadding.top + innerHeight - ((value - combinedMin) / valueRange) * innerHeight;
    return { x, y };
  });

  const donorPoints = buildPoints(series.donors || []);
  const orgPoints = buildPoints(series.organizations || []);
  const campaignPoints = buildPoints(series.campaigns || []);
  const donorLine = donorPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const orgLine = orgPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const campaignLine = campaignPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const donorArea = donorLine
    ? `${donorLine} ${chartPadding.left + innerWidth},${chartPadding.top + innerHeight} ${chartPadding.left},${chartPadding.top + innerHeight}`
    : '';

  const tickValues = Array.from({ length: yTicks }, (_, index) => {
    const value = combinedMin + (valueRange * (yTicks - 1 - index)) / (yTicks - 1);
    return Math.round(value);
  });

  const rangeLabel = useMemo(() => {
    const option = RANGE_OPTIONS.find((item) => item.days === rangeDays);
    return option ? option.label : `Last ${rangeDays} Days`;
  }, [rangeDays]);

  const alerts = reportData.examples?.alerts || [];
  const topCampaigns = reportData.top_campaigns || [];
  const categoryBreakdown = reportData.category_breakdown || [];
  const placeholderNotes = reportData.placeholders || {};

  const handleDownloadCsv = () => {
    const rows = [];

    rows.push(['Section', 'Label', 'Value', 'Extra']);

    (reportData.kpis || []).forEach((metric) => {
      rows.push(['KPI', metric.label, formatMetricValue(metric), metric.change || metric.note || '']);
    });

    (series.labels || []).forEach((label, index) => {
      rows.push([
        'Trend',
        label,
        series.donors?.[index] ?? 0,
        `Organizations: ${series.organizations?.[index] ?? 0}, Campaigns: ${series.campaigns?.[index] ?? 0}`,
      ]);
    });

    categoryBreakdown.forEach((item) => {
      rows.push(['Category Breakdown', item.label, `${item.value}%`, '']);
    });

    topCampaigns.forEach((campaign) => {
      rows.push([
        'Top Campaign',
        campaign.name,
        formatCurrency(campaign.raised),
        `${campaign.org} | ${campaign.status}`,
      ]);
    });

    alerts.forEach((alert) => {
      rows.push(['Alert Example', alert.title, alert.description, alert.time]);
    });

    const csvContent = rows
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-report-${rangeDays}d-${formatDateForFileName()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const kpiMarkup = (reportData.kpis || [])
      .map((metric) => `
        <div class="kpi">
          <p class="kpi-label">${escapeHtml(metric.label)}</p>
          <p class="kpi-value">${escapeHtml(formatMetricValue(metric))}</p>
          <p class="kpi-note">${escapeHtml(metric.change || metric.note || '')}</p>
        </div>
      `)
      .join('');

    const trendRows = (series.labels || [])
      .map((label, index) => `
        <tr>
          <td>${escapeHtml(label)}</td>
          <td>${escapeHtml(series.donors?.[index] ?? 0)}</td>
          <td>${escapeHtml(series.organizations?.[index] ?? 0)}</td>
          <td>${escapeHtml(series.campaigns?.[index] ?? 0)}</td>
        </tr>
      `)
      .join('');

    const campaignRows = topCampaigns
      .map((campaign) => `
        <tr>
          <td>${escapeHtml(campaign.name)}</td>
          <td>${escapeHtml(campaign.org)}</td>
          <td>${escapeHtml(formatCurrency(campaign.raised))}</td>
          <td>${escapeHtml(campaign.status)}</td>
        </tr>
      `)
      .join('');

    const categoryRows = categoryBreakdown
      .map((item) => `
        <tr>
          <td>${escapeHtml(item.label)}</td>
          <td>${escapeHtml(`${item.value}%`)}</td>
        </tr>
      `)
      .join('');

    const exportMarkup = `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Admin Report Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }
            h1, h2 { margin: 0 0 12px; }
            p { margin: 0 0 16px; color: #475569; }
            .meta { margin-bottom: 24px; font-size: 14px; }
            .kpis { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
            .kpi { border: 1px solid #dbe4f0; border-radius: 12px; padding: 14px; }
            .kpi-label { font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
            .kpi-value { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
            .kpi-note { font-size: 13px; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 8px; text-align: left; font-size: 14px; }
            th { color: #334155; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
            .section { margin-top: 24px; }
            @media print { body { margin: 18px; } }
          </style>
        </head>
        <body>
          <h1>Admin Report</h1>
          <p class="meta">Range: ${escapeHtml(rangeLabel)} | Generated: ${escapeHtml(new Date().toLocaleString())}</p>

          <section class="section">
            <h2>KPIs</h2>
            <div class="kpis">${kpiMarkup}</div>
          </section>

          <section class="section">
            <h2>Growth Trends</h2>
            <table>
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Donations</th>
                  <th>Organizations</th>
                  <th>Campaigns</th>
                </tr>
              </thead>
              <tbody>${trendRows}</tbody>
            </table>
          </section>

          <section class="section">
            <h2>Top Campaigns</h2>
            <table>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Organization</th>
                  <th>Raised</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>${campaignRows}</tbody>
            </table>
          </section>

          <section class="section">
            <h2>Category Breakdown</h2>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>${categoryRows}</tbody>
            </table>
          </section>
        </body>
      </html>
    `;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.setAttribute('aria-hidden', 'true');

    const cleanup = () => {
      window.setTimeout(() => {
        if (printFrame.parentNode) {
          printFrame.parentNode.removeChild(printFrame);
        }
      }, 500);
    };

    printFrame.onload = () => {
      const frameWindow = printFrame.contentWindow;
      if (!frameWindow) {
        cleanup();
        return;
      }

      frameWindow.focus();
      window.setTimeout(() => {
        frameWindow.print();
        cleanup();
      }, 250);
    };

    document.body.appendChild(printFrame);

    const frameDocument = printFrame.contentDocument;
    if (!frameDocument) {
      cleanup();
      return;
    }

    frameDocument.open();
    frameDocument.write(exportMarkup);
    frameDocument.close();
  };

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
            <p className="admin-report-subtitle">Track fundraising performance, platform growth, and campaign results from live database data.</p>
          </div>
          <div className="admin-report-actions">
            <button className="admin-report-ghost" type="button" onClick={handleDownloadCsv} disabled={loading}>
              Export CSV
            </button>
            <button className="admin-primary-btn" type="button" onClick={handleExportPdf} disabled={loading}>
              Export PDF
            </button>
          </div>
        </header>

        {error ? <div className="admin-report-message admin-report-message-error">{error}</div> : null}

        <section className="admin-report-kpis">
          {(reportData.kpis || []).map((metric) => (
            <KpiCard key={metric.id} metric={metric} />
          ))}
          {!loading && (reportData.kpis || []).length === 0 ? (
            <div className="admin-report-message">No KPI data available.</div>
          ) : null}
        </section>

        <section className="admin-report-grid">
          <div className="admin-panel admin-report-trends">
            <div className="admin-panel-header">
              <div>
                <h2>Platform Growth Trends</h2>
                <p className="admin-report-caption">Donations, organizations, and campaigns over {rangeLabel.toLowerCase()}.</p>
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
                <span style={{ '--legend-color': '#2563eb' }}>Donations</span>
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
                    <span key={`right-${value}`}>{value}</span>
                  ))}
                </div>
              </div>
              {series.labels.length > 0 ? (
                <>
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
                    {donorArea ? <polygon className="admin-report-area" points={donorArea} /> : null}
                    {donorLine ? <polyline className="admin-report-line admin-report-line-donor" points={donorLine} /> : null}
                    {orgLine ? <polyline className="admin-report-line admin-report-line-org" points={orgLine} /> : null}
                    {campaignLine ? <polyline className="admin-report-line admin-report-line-campaign" points={campaignLine} /> : null}
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
                </>
              ) : (
                <div className="admin-report-message">{loading ? 'Loading chart data...' : 'No chart data available.'}</div>
              )}
            </div>
          </div>

          <div className="admin-panel admin-report-map">
            <div className="admin-panel-header">
              <h2>Geographic Impact</h2>
              <button className="admin-ghost-btn" type="button">Full Map</button>
            </div>
            {/* Example block until the backend stores geolocation or region analytics for donations/organizations. */}
            <div className="admin-report-map-preview">
              <div className="admin-report-map-dot" />
              <div className="admin-report-map-dot" />
              <div className="admin-report-map-dot" />
              <span>Heatmap Loading...</span>
            </div>
            <p className="admin-report-placeholder-note">
              {placeholderNotes.geographic_impact || 'Example placeholder until geographic analytics is available in the database.'}
            </p>
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
              {!loading && categoryBreakdown.length === 0 ? <div className="admin-report-message">No category data available.</div> : null}
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
              const progress = Math.min(100, Math.round((Number(campaign.raised || 0) / Math.max(Number(campaign.goal || 0), 1)) * 100));
              const tone = STATUS_TONE[campaign.status] || 'neutral';
              return (
                <div key={campaign.id} className="admin-report-table-row">
                  <div className="admin-report-campaign">
                    <p>{campaign.name}</p>
                    <small>{campaign.growth}</small>
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
            {!loading && topCampaigns.length === 0 ? <div className="admin-report-message">No campaign performance data available.</div> : null}
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
            <p className="admin-report-placeholder-note">
              {placeholderNotes.refund_filter || 'Refund filter is example-only until refund data exists in the database.'}
            </p>
            <div className="admin-report-filter-actions">
              <button
                className="admin-report-ghost"
                type="button"
                onClick={() => setFilters({ includePending: true, includeRefunds: false, autoExport: true })}
              >
                Reset
              </button>
              <button className="admin-primary-btn" type="button">Apply Filters</button>
            </div>
          </div>

          <div className="admin-panel admin-report-panel">
            <div className="admin-panel-header">
              <h2>Operational Alerts</h2>
              <button className="admin-ghost-btn" type="button">View All</button>
            </div>
            {/* Example alert cards until the backend exposes SLA breaches, refund events, or analytics thresholds. */}
            <p className="admin-report-placeholder-note">
              {placeholderNotes.operational_alerts || 'Operational alerts are still example data until alert rules are stored in the backend.'}
            </p>
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
