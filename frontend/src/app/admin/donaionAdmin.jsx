import React, { useEffect, useMemo, useState } from 'react';
import AdminSidebar from './adminsidebar';
import './donaionAdmin.css';

const DONATIONS_CACHE_KEY = 'admin_donations_dashboard_cache';
const CACHE_MAX_AGE_MS = 5 * 60 * 1000;
const DASHBOARD_DEFAULT_DATA = { donations: [], campaigns: [], users: [], organizations: [], campaignUpdates: [] };

function readCache() {
  try {
    const raw = window.sessionStorage.getItem(DONATIONS_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed?.timestamp || typeof parsed !== 'object') return null;
    if (Date.now() - parsed.timestamp > CACHE_MAX_AGE_MS) {
      window.sessionStorage.removeItem(DONATIONS_CACHE_KEY);
      return null;
    }
    return parsed.data ? { ...DASHBOARD_DEFAULT_DATA, ...parsed.data } : null;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    window.sessionStorage.setItem(DONATIONS_CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data,
    }));
  } catch {
    // Ignore storage failures.
  }
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatKhr(value) {
  return `≈ ${(Number(value || 0) * 4100).toLocaleString('en-US')} KHR`;
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeStatus(value) {
  const key = String(value || '').toLowerCase();
  if (key.includes('complete') || key.includes('success') || key.includes('verify')) return 'Verified';
  if (key.includes('pending')) return 'Pending';
  if (key.includes('fail') || key.includes('reject')) return 'Flagged';
  return 'Pending';
}

function normalizeMethod(value, donationType) {
  if (String(donationType || '').toLowerCase() === 'material') return 'ITEM';
  const key = String(value || '').toLowerCase();
  if (key.includes('aba')) return 'ABA';
  if (key.includes('wing')) return 'WING';
  if (key.includes('cash')) return 'CASH';
  return 'PAY';
}

function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'DN';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function percentChange(current, previous) {
  if (!previous && !current) return '+0.0%';
  if (!previous) return '+100.0%';
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
}

function summarizeText(value, maxLength = 160) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return 'Top-performing campaigns will appear here once donation data is available.';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function safeSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStorageFileUrl(path) {
  if (!path) return '';
  const rawPath = String(path).trim();
  if (
    rawPath.startsWith('http://') ||
    rawPath.startsWith('https://') ||
    rawPath.startsWith('blob:') ||
    rawPath.startsWith('data:')
  ) {
    return rawPath;
  }

  const normalizedPath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const apiBase = import.meta.env.VITE_API_URL || 'https://chomnuoy-backend-1.onrender.com/api';
  const appBase = apiBase.replace(/\/api\/?$/, '');
  if (normalizedPath.startsWith('storage/')) {
    return `${appBase}/${normalizedPath}`;
  }
  return `${appBase}/storage/${normalizedPath}`;
}

function formatFeedDate(date) {
  if (!date) return '';
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startOfToday - startOfTarget) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelativeTime(date) {
  if (!date) return 'Just now';
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const StatCard = ({ icon, tone, delta, deltaTone, label, value, note }) => (
  <article className={`admin-donation-stat admin-donation-stat-${tone}`}>
    <div className="admin-donation-stat-top">
      <span className="admin-donation-stat-icon" aria-hidden="true">{icon}</span>
      <span className={`admin-donation-delta ${deltaTone}`}>{delta}</span>
    </div>
    <p className="admin-donation-stat-label">{label}</p>
    <p className="admin-donation-stat-value">{value}</p>
    <span className="admin-donation-stat-note">{note}</span>
  </article>
);

export default function DonationAdminPage() {
  const cached = readCache();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [loading, setLoading] = useState(!cached);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState(cached || DASHBOARD_DEFAULT_DATA);

  const session = safeSession();
  const adminName = session?.name || 'Admin';
  const adminRole = session?.role || session?.accountType || 'Admin';
  const apiBase = import.meta.env.VITE_API_URL || 'https://chomnuoy-backend-1.onrender.com/api';

  const handleLogout = () => {
    window.localStorage.removeItem('chomnuoy_session');
    window.localStorage.removeItem('authToken');
    window.location.href = '/';
  };

  useEffect(() => {
    let active = true;
    const token = window.localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const hasCached = Boolean(cached);

    async function load({ silent = false } = {}) {
      if (!silent && !hasCached) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError('');

      try {
        const results = await Promise.allSettled([
          fetch(`${apiBase}/donations`, { headers }).then((res) => (res.ok ? res.json() : [])),
          fetch(`${apiBase}/campaigns`, { headers }).then((res) => (res.ok ? res.json() : [])),
          fetch(`${apiBase}/users`, { headers }).then((res) => (res.ok ? res.json() : [])),
          fetch(`${apiBase}/organizations`, { headers }).then((res) => (res.ok ? res.json() : [])),
          fetch(`${apiBase}/campaign_update`, { headers }).then((res) => (res.ok ? res.json() : [])),
        ]);

        if (!active) return;
        if (results[0].status === 'rejected') {
          throw new Error('Failed to load donations.');
        }

        const nextData = {
          donations: results[0].status === 'fulfilled' && Array.isArray(results[0].value) ? results[0].value : [],
          campaigns: results[1].status === 'fulfilled' && Array.isArray(results[1].value) ? results[1].value : [],
          users: results[2].status === 'fulfilled' && Array.isArray(results[2].value) ? results[2].value : [],
          organizations: results[3].status === 'fulfilled' && Array.isArray(results[3].value) ? results[3].value : [],
          campaignUpdates: results[4].status === 'fulfilled' && Array.isArray(results[4].value) ? results[4].value : [],
        };

        setData(nextData);
        writeCache(nextData);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load donations.');
      } finally {
        if (!active) return;
        setLoading(false);
        setIsRefreshing(false);
      }
    }

    load();
    const timer = window.setInterval(() => load({ silent: true }), 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [apiBase]);

  const donationRows = useMemo(() => {
    const userMap = new Map(data.users.map((item) => [Number(item.id), item]));
    const orgMap = new Map(data.organizations.map((item) => [Number(item.id), item]));
    const campaignMap = new Map(data.campaigns.map((item) => [Number(item.id), item]));

    return data.donations.map((item, index) => {
      const donor = userMap.get(Number(item.user_id));
      const campaign = campaignMap.get(Number(item.campaign_id));
      const organization = orgMap.get(Number(item.organization_id));
      const donorName = donor?.name || `Donor #${item.user_id || index + 1}`;
      const campaignName = campaign?.title || organization?.name || 'General Fund';
      const amount = Number(item.amount || 0);
      const date = toDate(item.created_at);

      return {
        id: item.id || index + 1,
        donorName,
        initials: getInitials(donorName),
        avatarUrl: getStorageFileUrl(donor?.avatar_url || donor?.avatar_path),
        campaignName,
        campaignImage: getStorageFileUrl(campaign?.image_path),
        amount,
        amountLabel: String(item.donation_type || '').toLowerCase() === 'material' ? 'Material' : formatCurrency(amount),
        method: normalizeMethod(item.payment_method || item.method, item.donation_type),
        status: normalizeStatus(item.status),
        date,
        dateLabel: date ? date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' }) : '-',
        relativeTime: formatRelativeTime(date),
        transactionId: item.transaction_id || item.reference_id || `TX-${String(item.id || index + 1).padStart(5, '0')}`,
      };
    });
  }, [data]);

  const sortedDonationRows = useMemo(
    () => [...donationRows].sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0)),
    [donationRows],
  );

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return sortedDonationRows.slice(0, 8);
    return sortedDonationRows.filter((row) => (
      `${row.donorName} ${row.campaignName} ${row.transactionId} ${row.method} ${row.status}`.toLowerCase().includes(query)
    )).slice(0, 8);
  }, [searchTerm, sortedDonationRows]);

  const stats = useMemo(() => {
    const moneyRows = donationRows.filter((row) => row.amount > 0);
    const totalFunds = moneyRows.reduce((sum, row) => sum + row.amount, 0);
    const averageDonation = moneyRows.length ? totalFunds / moneyRows.length : 0;
    const totalDonors = new Set(donationRows.map((row) => row.donorName)).size;

    const now = new Date();
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonthRows = moneyRows.filter((row) => row.date && row.date.getMonth() === now.getMonth() && row.date.getFullYear() === now.getFullYear());
    const previousMonthRows = moneyRows.filter((row) => row.date && row.date.getMonth() === previousMonthDate.getMonth() && row.date.getFullYear() === previousMonthDate.getFullYear());
    const currentMonthTotal = currentMonthRows.reduce((sum, row) => sum + row.amount, 0);
    const previousMonthTotal = previousMonthRows.reduce((sum, row) => sum + row.amount, 0);

    return {
      totalFunds,
      averageDonation,
      totalDonors,
      monthGrowth: percentChange(currentMonthTotal, previousMonthTotal),
      donorGrowth: percentChange(currentMonthRows.length, previousMonthRows.length),
    };
  }, [donationRows]);

  const chartBars = useMemo(() => {
    const now = new Date();
    const bars = [];
    for (let offset = 5; offset >= 0; offset -= 1) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const value = donationRows.reduce((sum, row) => {
        if (!row.date) return sum;
        return row.date.getMonth() === monthDate.getMonth() && row.date.getFullYear() === monthDate.getFullYear()
          ? sum + row.amount
          : sum;
      }, 0);
      bars.push({
        label: monthDate.toLocaleDateString(undefined, { month: 'short' }),
        value,
      });
    }
    const max = Math.max(...bars.map((item) => item.value), 1);
    return bars.map((item, index) => ({
      ...item,
      height: `${Math.max(18, (item.value / max) * 100)}%`,
      active: index === bars.length - 1,
    }));
  }, [donationRows]);

  const featuredCampaign = useMemo(() => {
    const campaignTotals = new Map();
    donationRows.forEach((row) => {
      campaignTotals.set(row.campaignName, (campaignTotals.get(row.campaignName) || 0) + row.amount);
    });
    const ranked = data.campaigns
      .map((campaign) => {
        const raised = campaignTotals.get(campaign.title || 'General Fund') || Number(campaign.current_amount || 0);
        const goal = Number(campaign.goal_amount || 0);
        return {
          title: campaign.title || 'New Featured Campaign',
          description: summarizeText(campaign.description),
          raised,
          progress: goal > 0 ? Math.min(100, (raised / goal) * 100) : 0,
          goal,
        };
      })
      .sort((a, b) => b.raised - a.raised);

    return ranked[0] || {
      title: 'New Featured Campaign',
      description: 'Top-performing campaigns will appear here once donation data is available.',
      raised: 0,
      progress: 0,
      goal: 0,
    };
  }, [data.campaigns, donationRows]);

  const recentUpdates = useMemo(() => {
    const campaignMap = new Map(data.campaigns.map((item) => [Number(item.id), item]));

    const explicitUpdates = data.campaignUpdates.map((item, index) => {
      const campaign = campaignMap.get(Number(item.campaign_id));
      const date = toDate(item.update_date || item.created_at);
      const campaignTitle = campaign?.title || `Campaign #${item.campaign_id || index + 1}`;
      return {
        id: `update-${item.id || index}`,
        date,
        dateLabel: formatFeedDate(date),
        title: `${campaignTitle} progress update`,
        description: summarizeText(item.update_description, 190),
        imageUrl: getStorageFileUrl(item.image || campaign?.image_path),
        tone: 'update',
      };
    });

    const donationMoments = sortedDonationRows.slice(0, 8).map((row) => ({
      id: `donation-${row.id}`,
      date: row.date,
      dateLabel: formatFeedDate(row.date),
      title: `${row.donorName} supported ${row.campaignName}`,
      description: row.amount > 0
        ? `${row.amountLabel} received via ${row.method}. Status: ${row.status}.`
        : `A material donation was recorded for ${row.campaignName}.`,
      imageUrl: row.campaignImage || row.avatarUrl,
      tone: 'donation',
    }));

    return [...explicitUpdates, ...donationMoments]
      .filter((item) => item.date)
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
      .slice(0, 4);
  }, [data.campaignUpdates, data.campaigns, sortedDonationRows]);

  const recentDonors = useMemo(() => sortedDonationRows.slice(0, 5).map((row) => ({
    id: `donor-${row.id}`,
    donorName: row.donorName,
    initials: row.initials,
    avatarUrl: row.avatarUrl,
    amountLabel: row.amountLabel,
    relativeTime: row.relativeTime,
    campaignName: row.campaignName,
    highlighted: row.status === 'Verified',
  })), [sortedDonationRows]);

  const scrollToActivityTable = () => {
    document.querySelector('.admin-donation-table-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const exportCsv = () => {
    const headers = ['Donor Name', 'Campaign / Org', 'Amount', 'Method', 'Status', 'Date', 'Transaction ID'];
    const rows = filteredRows.map((row) => [
      row.donorName,
      row.campaignName,
      row.amountLabel,
      row.method,
      row.status,
      row.dateLabel,
      row.transactionId,
    ]);
    const csv = [headers, ...rows]
      .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'admin-donations-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-shell admin-donation-shell">
      <AdminSidebar onLogout={() => setIsLogoutOpen(true)} userName={adminName} userRole={adminRole} />

      <main className="admin-main admin-donation-main">
        <header className="admin-donation-toolbar">
          <label className="admin-donation-search">
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Search donor, campaign or transaction ID..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <button type="button" className="admin-donation-export" onClick={exportCsv}>
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            Export Report
          </button>
        </header>

        {isRefreshing && !loading ? <div className="admin-donation-refresh">Refreshing donations data...</div> : null}
        {error ? <div className="admin-donation-error">{error}</div> : null}

        <section className="admin-donation-stats">
          <StatCard icon="C" tone="blue" delta={stats.monthGrowth} deltaTone={stats.monthGrowth.startsWith('-') ? 'is-negative' : 'is-positive'} label="Total Funds Raised" value={formatCurrency(stats.totalFunds)} note={formatKhr(stats.totalFunds)} />
          <StatCard icon="%" tone="purple" delta={stats.monthGrowth} deltaTone={stats.monthGrowth.startsWith('-') ? 'is-negative' : 'is-positive'} label="Monthly Growth" value={formatCurrency(stats.totalFunds / Math.max(1, chartBars.length))} note="Compared to last month" />
          <StatCard icon="A" tone="amber" delta={percentChange(stats.averageDonation, stats.averageDonation * 1.02)} deltaTone="is-negative" label="Average Donation" value={formatCurrency(stats.averageDonation)} note="Per unique transaction" />
          <StatCard icon="U" tone="green" delta={stats.donorGrowth} deltaTone={stats.donorGrowth.startsWith('-') ? 'is-negative' : 'is-positive'} label="Total Donors" value={stats.totalDonors.toLocaleString()} note="Active contributing users" />
        </section>

        <section className="admin-donation-grid">
          <article className="admin-donation-chart-card">
            <div className="admin-donation-card-head">
              <h2>Monthly Donation Trends</h2>
              <div className="admin-donation-range">
                <button type="button" className="is-active">6 Months</button>
                <button type="button" disabled>1 Year</button>
              </div>
            </div>
            {loading ? (
              <div className="admin-donation-chart-skeleton" aria-hidden="true">
                {Array.from({ length: 6 }).map((_, index) => <span key={index} style={{ height: `${40 + index * 14}px` }} />)}
              </div>
            ) : (
              <div className="admin-donation-chart">
                {chartBars.map((bar) => (
                  <div key={bar.label} className="admin-donation-bar-wrap">
                    <div className={`admin-donation-bar${bar.active ? ' is-active' : ''}`} style={{ height: bar.height }} />
                    <span>{bar.label}</span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="admin-donation-featured">
            <span className="admin-donation-featured-kicker">Featured Campaign</span>
            <h2>{featuredCampaign.title}</h2>
            <p>{featuredCampaign.description}</p>
            <div className="admin-donation-featured-stats">
              <span>{formatCurrency(featuredCampaign.raised)} raised</span>
              <span>{featuredCampaign.goal > 0 ? `${formatCurrency(featuredCampaign.goal)} goal` : 'No goal set yet'}</span>
            </div>
            <div className="admin-donation-progress">
              <div className="admin-donation-progress-fill" style={{ width: `${featuredCampaign.progress}%` }} />
            </div>
            <div className="admin-donation-progress-meta">
              <span>{formatCurrency(featuredCampaign.raised)} raised</span>
              <strong>{Math.round(featuredCampaign.progress)}%</strong>
            </div>
            <button type="button">Boost Campaign</button>
          </article>
        </section>

        <section className="admin-donation-live-grid">
          <article className="admin-donation-live-card">
            <div className="admin-donation-card-head admin-donation-live-head">
              <h2>Recent Updates</h2>
              <span className="admin-donation-live-pill">{recentUpdates.length} live</span>
            </div>

            <div className="admin-donation-live-feed">
              {loading && recentUpdates.length === 0 ? (
                <div className="admin-donation-live-empty">Loading recent campaign activity...</div>
              ) : null}

              {!loading && recentUpdates.length === 0 ? (
                <div className="admin-donation-live-empty">Campaign updates and donation activity will appear here.</div>
              ) : null}

              {recentUpdates.map((item, index) => (
                <article key={item.id} className={`admin-donation-update-item${index === 0 ? ' is-featured' : ''}`}>
                  <div className="admin-donation-update-copy">
                    <span className={`admin-donation-update-date admin-donation-update-date-${item.tone}`}>{item.dateLabel}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                  {item.imageUrl ? (
                    <div className="admin-donation-update-media">
                      <img src={item.imageUrl} alt={item.title} />
                    </div>
                  ) : (
                    <div className={`admin-donation-update-placeholder admin-donation-update-placeholder-${item.tone}`} aria-hidden="true">
                      <span>{item.tone === 'update' ? 'UP' : 'DN'}</span>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </article>

          <article className="admin-donation-live-card admin-donation-donors-card">
            <div className="admin-donation-card-head admin-donation-live-head">
              <h2>Recent Donors</h2>
              <button type="button" className="admin-donation-link-button" onClick={scrollToActivityTable}>View All</button>
            </div>

            <div className="admin-donation-donor-list">
              {loading && recentDonors.length === 0 ? (
                <div className="admin-donation-live-empty">Loading recent donors...</div>
              ) : null}

              {!loading && recentDonors.length === 0 ? (
                <div className="admin-donation-live-empty">Recent donor activity will show up here.</div>
              ) : null}

              {recentDonors.map((donor) => (
                <article key={donor.id} className="admin-donation-donor-card">
                  <div className="admin-donation-donor-meta">
                    {donor.avatarUrl ? (
                      <img className="admin-donation-donor-photo" src={donor.avatarUrl} alt={donor.donorName} />
                    ) : (
                      <span className="admin-donation-donor-photo admin-donation-donor-photo-fallback" aria-hidden="true">{donor.initials}</span>
                    )}
                    <div>
                      <h3>{donor.donorName}</h3>
                      <p>Donated {donor.amountLabel} - {donor.relativeTime}</p>
                      <small>{donor.campaignName}</small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`admin-donation-donor-like${donor.highlighted ? ' is-active' : ''}`}
                    aria-label={donor.highlighted ? 'Highlighted donor' : 'Recent donor'}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z" />
                    </svg>
                  </button>
                </article>
              ))}
            </div>
          </article>
        </section>

        <section className="admin-donation-table-card">
          <div className="admin-donation-card-head">
            <h2>Donation Activity</h2>
            <div className="admin-donation-table-filters">
              <button type="button">Last 30 Days</button>
              <button type="button">Filter By Campaign</button>
            </div>
          </div>

          <div className="admin-donation-table">
            <div className="admin-donation-table-head">
              <span>Donor Name</span>
              <span>Campaign/Org</span>
              <span>Amount</span>
              <span>Method</span>
              <span>Status</span>
              <span>Date</span>
              <span>Action</span>
            </div>

            {loading ? (
              <div className="admin-donation-skeleton-list" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="admin-donation-skeleton-row">
                    <div className="admin-donation-skeleton-user">
                      <span className="admin-donation-skeleton-avatar" />
                      <div className="admin-donation-skeleton-text">
                        <span className="admin-donation-skeleton-line admin-donation-skeleton-line-name" />
                        <span className="admin-donation-skeleton-line admin-donation-skeleton-line-sub" />
                      </div>
                    </div>
                    <span className="admin-donation-skeleton-line admin-donation-skeleton-line-campaign" />
                    <span className="admin-donation-skeleton-line admin-donation-skeleton-line-amount" />
                    <span className="admin-donation-skeleton-pill" />
                    <span className="admin-donation-skeleton-pill" />
                    <span className="admin-donation-skeleton-line admin-donation-skeleton-line-date" />
                    <span className="admin-donation-skeleton-dots" />
                  </div>
                ))}
              </div>
            ) : null}

            {!loading && filteredRows.length === 0 ? <div className="admin-donation-empty">No donations match your search.</div> : null}

            {!loading && filteredRows.length > 0 ? filteredRows.map((row) => (
              <div key={`${row.id}-${row.transactionId}`} className="admin-donation-row">
                <div className="admin-donation-donor">
                  <span className="admin-donation-avatar" aria-hidden="true">{row.initials}</span>
                  <div>
                    <p>{row.donorName}</p>
                    <small>{row.transactionId}</small>
                  </div>
                </div>
                <div className="admin-donation-campaign"><p>{row.campaignName}</p></div>
                <strong className="admin-donation-amount">{row.amountLabel}</strong>
                <span className={`admin-donation-method admin-donation-method-${row.method.toLowerCase()}`}>{row.method}</span>
                <span className={`admin-donation-status admin-donation-status-${row.status.toLowerCase()}`}>{row.status}</span>
                <span className="admin-donation-date">{row.dateLabel}</span>
                <button type="button" className="admin-donation-more" aria-label="More actions"><span /><span /><span /></button>
              </div>
            )) : null}
          </div>
        </section>
      </main>

      {isLogoutOpen ? (
        <div className="admin-modal-overlay" role="presentation" onClick={() => setIsLogoutOpen(false)}>
          <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-logout-title" onClick={(event) => event.stopPropagation()}>
            <h3 id="admin-logout-title">Are you sure you want to logout?</h3>
            <p>You will be returned to the public home page.</p>
            <div className="admin-modal-actions">
              <button type="button" className="admin-modal-cancel" onClick={() => setIsLogoutOpen(false)}>Cancel</button>
              <button type="button" className="admin-modal-logout" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

