import React, { useEffect, useMemo, useState } from 'react';
import AdminSidebar from './adminsidebar';
import './transactionAdmin.css';

const PAGE_SIZE = 8;

function readSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatUsd(value) {
  const amount = Number(value || 0);
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatKhr(value) {
  return `${Math.round(Number(value || 0) * 4000).toLocaleString('en-US')} KHR`;
}

function normalizeStatus(value) {
  const key = String(value || '').trim().toLowerCase();
  if (key.includes('complete') || key.includes('success') || key.includes('verify')) return 'Verified';
  if (key.includes('pending') || key.includes('process')) return 'Pending';
  if (key.includes('fail') || key.includes('reject') || key.includes('cancel')) return 'Failed';
  return 'Pending';
}

function normalizeMethod(value, donationType) {
  const key = String(value || '').trim().toLowerCase();
  if (key.includes('aba')) return 'ABA';
  if (key.includes('wing')) return 'Wing';
  if (key.includes('cash')) return 'Cash';
  if (key.includes('khqr') || key.includes('qr')) return 'KHQR';
  if (String(donationType || '').toLowerCase() === 'material') return 'Item';
  return 'Unknown';
}

function formatDateTime(date) {
  if (!date) return '-';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function percentChange(current, previous) {
  if (!current && !previous) return '+0.0%';
  if (!previous) return '+100.0%';
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
}

function isSameDay(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function buildPagination(currentPage, totalPages) {
  if (totalPages <= 1) return [1];
  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
}

const StatCard = ({ tone, title, value, note, icon, delta }) => (
  <article className="admin-transaction-stat-card">
    <div className="admin-transaction-stat-head">
      <div>
        <p className="admin-transaction-stat-title">{title}</p>
        <h3 className="admin-transaction-stat-value">{value}</h3>
      </div>
      <span className={`admin-transaction-stat-icon is-${tone}`} aria-hidden="true">{icon}</span>
    </div>
    <p className="admin-transaction-stat-meta">
      <span className={`admin-transaction-delta${String(delta).startsWith('-') ? ' is-negative' : ''}`}>{delta}</span>
      <span>{note}</span>
    </p>
  </article>
);

export default function TransactionAdminPage() {
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [methodFilter, setMethodFilter] = useState('Payment Method');
  const [dateFilter, setDateFilter] = useState('Date Range');
  const [rows, setRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const session = readSession();
  const adminName = session?.name || 'Admin';
  const adminRole = session?.role || session?.accountType || 'Admin';
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    let active = true;
    const token = window.localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    async function load({ silent = false } = {}) {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      try {
        const [paymentsRes, paymentMethodsRes, donationsRes, usersRes, campaignsRes, organizationsRes] = await Promise.allSettled([
          fetch(`${apiBase}/payments`, { headers }).then((res) => (res.ok ? res.json() : [])),
          fetch(`${apiBase}/payment_methods`, { headers }).then((res) => (res.ok ? res.json() : [])),
          fetch(`${apiBase}/donations`, { headers }).then((res) => (res.ok ? res.json() : [])),
          fetch(`${apiBase}/users`, { headers }).then((res) => (res.ok ? res.json() : [])),
          fetch(`${apiBase}/campaigns`, { headers }).then((res) => (res.ok ? res.json() : [])),
          fetch(`${apiBase}/organizations`, { headers }).then((res) => (res.ok ? res.json() : [])),
        ]);

        if (!active) return;

        const payments = paymentsRes.status === 'fulfilled' && Array.isArray(paymentsRes.value) ? paymentsRes.value : [];
        const paymentMethods = paymentMethodsRes.status === 'fulfilled' && Array.isArray(paymentMethodsRes.value) ? paymentMethodsRes.value : [];
        const donations = donationsRes.status === 'fulfilled' && Array.isArray(donationsRes.value) ? donationsRes.value : [];
        const users = usersRes.status === 'fulfilled' && Array.isArray(usersRes.value) ? usersRes.value : [];
        const campaigns = campaignsRes.status === 'fulfilled' && Array.isArray(campaignsRes.value) ? campaignsRes.value : [];
        const organizations = organizationsRes.status === 'fulfilled' && Array.isArray(organizationsRes.value) ? organizationsRes.value : [];

        const methodMap = new Map(paymentMethods.map((item) => [Number(item.id), item]));
        const donationMap = new Map(donations.map((item) => [Number(item.id), item]));
        const userMap = new Map(users.map((item) => [Number(item.id), item]));
        const campaignMap = new Map(campaigns.map((item) => [Number(item.id), item]));
        const organizationMap = new Map(organizations.map((item) => [Number(item.id), item]));

        const paymentRows = payments.map((payment, index) => {
          const donation = donationMap.get(Number(payment.donation_id));
          const donor = donation ? userMap.get(Number(donation.user_id)) : null;
          const campaign = donation ? campaignMap.get(Number(donation.campaign_id)) : null;
          const organization = donation ? organizationMap.get(Number(donation.organization_id)) : null;
          const methodRecord = methodMap.get(Number(payment.payment_method_id));
          const amount = Number(payment.amount ?? donation?.amount ?? 0);
          const date = toDate(payment.created_at || donation?.created_at);

          return {
            id: payment.transaction_reference || `TXN-${String(payment.id || index + 1).padStart(5, '0')}`,
            donorName: donor?.name || `Donor #${donation?.user_id || index + 1}`,
            recipient: campaign?.title || organization?.name || 'General Donation',
            amount,
            method: normalizeMethod(methodRecord?.method_name || payment.method, donation?.donation_type),
            status: normalizeStatus(payment.payment_status || donation?.status),
            date,
            source: 'payment',
          };
        });

        const fallbackDonationRows = payments.length === 0
          ? donations.map((donation, index) => {
            const donor = userMap.get(Number(donation.user_id));
            const campaign = campaignMap.get(Number(donation.campaign_id));
            const organization = organizationMap.get(Number(donation.organization_id));
            return {
              id: `DON-${String(donation.id || index + 1).padStart(5, '0')}`,
              donorName: donor?.name || `Donor #${donation.user_id || index + 1}`,
              recipient: campaign?.title || organization?.name || 'General Donation',
              amount: Number(donation.amount || 0),
              method: normalizeMethod(donation.payment_method || donation.method, donation.donation_type),
              status: normalizeStatus(donation.status),
              date: toDate(donation.created_at),
              source: 'donation',
            };
          })
          : [];

        const nextRows = (paymentRows.length > 0 ? paymentRows : fallbackDonationRows)
          .filter((row) => row.date)
          .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

        setRows(nextRows);

        if (
          paymentsRes.status === 'rejected'
          && donationsRes.status === 'rejected'
          && usersRes.status === 'rejected'
        ) {
          throw new Error('Failed to load transaction records.');
        }
      } catch (err) {
        if (!active) return;
        setRows([]);
        setError(err instanceof Error ? err.message : 'Failed to load transaction records.');
      } finally {
        if (!active) return;
        setLoading(false);
        setIsRefreshing(false);
      }
    }

    load();
    const timer = window.setInterval(() => load({ silent: true }), 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [apiBase]);

  const statusOptions = useMemo(
    () => ['All Statuses', ...new Set(rows.map((row) => row.status))],
    [rows],
  );

  const methodOptions = useMemo(
    () => ['Payment Method', ...new Set(rows.map((row) => row.method))],
    [rows],
  );

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    return rows.filter((row) => {
      const matchesQuery = !query || `${row.id} ${row.donorName} ${row.recipient} ${row.method} ${row.status}`.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'All Statuses' || row.status === statusFilter;
      const matchesMethod = methodFilter === 'Payment Method' || row.method === methodFilter;

      let matchesDate = true;
      if (row.date) {
        const rowTime = row.date.getTime();
        if (dateFilter === 'Today') {
          matchesDate = rowTime >= todayStart;
        } else if (dateFilter === 'Last 7 Days') {
          matchesDate = rowTime >= todayStart - (6 * 24 * 60 * 60 * 1000);
        } else if (dateFilter === 'Last 30 Days') {
          matchesDate = rowTime >= todayStart - (29 * 24 * 60 * 60 * 1000);
        }
      } else {
        matchesDate = false;
      }

      return matchesQuery && matchesStatus && matchesMethod && matchesDate;
    });
  }, [rows, searchTerm, statusFilter, methodFilter, dateFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, methodFilter, dateFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayRows = rows.filter((row) => row.date && isSameDay(row.date, now));
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayRows = rows.filter((row) => row.date && isSameDay(row.date, yesterday));

    const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime();
    const previousWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13).getTime();
    const previousWeekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const totalVolume = rows.reduce((sum, row) => sum + row.amount, 0);
    const thisMonthVolume = rows.reduce((sum, row) => (
      row.date && row.date.getTime() >= thisMonthStart ? sum + row.amount : sum
    ), 0);
    const previousMonthVolume = rows.reduce((sum, row) => {
      const rowTime = row.date?.getTime() || 0;
      return rowTime >= previousMonthStart && rowTime < previousMonthEnd ? sum + row.amount : sum;
    }, 0);
    const thisWeekVolume = rows.reduce((sum, row) => (
      row.date && row.date.getTime() >= thisWeekStart ? sum + row.amount : sum
    ), 0);
    const previousWeekVolume = rows.reduce((sum, row) => {
      const rowTime = row.date?.getTime() || 0;
      return rowTime >= previousWeekStart && rowTime < previousWeekEnd ? sum + row.amount : sum;
    }, 0);

    return {
      totalVolume,
      previousMonthVolume,
      totalDelta: percentChange(thisMonthVolume, previousMonthVolume),
      todayCount: todayRows.length,
      todayDelta: percentChange(todayRows.length, yesterdayRows.length),
      growthRate: percentChange(thisWeekVolume, previousWeekVolume),
    };
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, safePage]);
  const paginationItems = buildPagination(safePage, totalPages);

  const exportCsv = () => {
    const headers = ['Transaction ID', 'Donor Name', 'Recipient', 'Amount USD', 'Amount KHR', 'Method', 'Status', 'Date'];
    const csvRows = filteredRows.map((row) => [
      row.id,
      row.donorName,
      row.recipient,
      row.amount.toFixed(2),
      formatKhr(row.amount),
      row.method,
      row.status,
      formatDateTime(row.date),
    ]);
    const csv = [headers, ...csvRows]
      .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'admin-transactions.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    window.localStorage.removeItem('chomnuoy_session');
    window.localStorage.removeItem('authToken');
    window.location.href = '/';
  };

  return (
    <div className="admin-shell admin-transaction-shell">
      <AdminSidebar onLogout={() => setIsLogoutOpen(true)} userName={adminName} userRole={adminRole} />

      <main className="admin-main admin-transaction-main">
        <header className="admin-transaction-topbar">
          <label className="admin-transaction-search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6" />
              <path d="M20 20l-4.2-4.2" />
            </svg>
            <input
              type="search"
              placeholder="Search transactions, donors..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <div className="admin-transaction-top-actions">
            <button type="button" className="admin-transaction-icon-btn" aria-label="Notifications">
              <svg viewBox="0 0 24 24"><path d="M12 3v6" /><path d="M12 21a8 8 0 0 0 8-8H4a8 8 0 0 0 8 8Z" /><path d="M6 13V9a6 6 0 1 1 12 0v4" /></svg>
            </button>
            <button type="button" className="admin-transaction-icon-btn" aria-label="Messages">
              <svg viewBox="0 0 24 24"><path d="M4 6h16v12H4z" /><path d="M8 10h8" /></svg>
            </button>
          </div>
        </header>

        <section className="admin-transaction-heading">
          <h1>Transactions Management</h1>
          <p>Monitor and manage all donation activities across the platform.</p>
          <div className="admin-transaction-cta-row">
            <button type="button" className="admin-transaction-ghost-btn" onClick={exportCsv}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12" /><path d="m8 11 4 4 4-4" /><path d="M5 21h14" /></svg>
              <span>Export Data</span>
            </button>
            <button type="button" className="admin-transaction-primary-btn" disabled>
              <span>+</span>
              <span>Add Manual Transaction</span>
            </button>
          </div>
        </section>

        {isRefreshing && !loading ? <div className="admin-transaction-banner">Refreshing transaction data...</div> : null}
        {error ? <div className="admin-transaction-banner is-error">{error}</div> : null}

        <section className="admin-transaction-stats">
          <StatCard
            tone="blue"
            title="Total Transaction Volume"
            value={formatUsd(stats.totalVolume)}
            note={`vs ${formatUsd(stats.previousMonthVolume)} last month`}
            icon="C"
            delta={stats.totalDelta}
          />
          <StatCard
            tone="orange"
            title="Today's Transactions"
            value={String(stats.todayCount)}
            note="transactions vs yesterday"
            icon="D"
            delta={stats.todayDelta}
          />
          <StatCard
            tone="green"
            title="Growth Rate"
            value={stats.growthRate}
            note="this week"
            icon="G"
            delta={stats.growthRate}
          />
        </section>

        <section className="admin-transaction-filters">
          <div className="admin-transaction-filter-group">
            <span className="admin-transaction-filter-label">Filters:</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
            <select value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)}>
              {methodOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
            <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}>
              <option>Date Range</option>
              <option>Today</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <button
            type="button"
            className="admin-transaction-clear-btn"
            onClick={() => {
              setStatusFilter('All Statuses');
              setMethodFilter('Payment Method');
              setDateFilter('Date Range');
              setSearchTerm('');
            }}
          >
            Clear all filters
          </button>
        </section>

        <section className="admin-transaction-table-card">
          <div className="admin-transaction-table-head">
            <span>Transaction ID</span>
            <span>Donor Name</span>
            <span>Recipient</span>
            <span>Amount (USD/KHR)</span>
            <span>Method</span>
            <span>Status</span>
            <span>Date &amp; Time</span>
          </div>

          <div className="admin-transaction-table-body">
            {loading ? <div className="admin-transaction-empty">Loading transactions...</div> : null}
            {!loading && filteredRows.length === 0 ? <div className="admin-transaction-empty">No transaction records found for the current filters.</div> : null}
            {!loading && paginatedRows.length > 0 ? paginatedRows.map((row) => (
              <div key={`${row.source}-${row.id}-${row.donorName}`} className="admin-transaction-row">
                <strong>{`#${row.id}`}</strong>
                <span>{row.donorName}</span>
                <span>{row.recipient}</span>
                <div className="admin-transaction-amount">
                  <strong>{formatUsd(row.amount)}</strong>
                  <small>{formatKhr(row.amount)}</small>
                </div>
                <span className={`admin-transaction-method is-${row.method.toLowerCase()}`}>{row.method}</span>
                <span className={`admin-transaction-status is-${row.status.toLowerCase()}`}>{row.status}</span>
                <span>{formatDateTime(row.date)}</span>
              </div>
            )) : null}
          </div>

          <footer className="admin-transaction-table-footer">
            <span>
              Showing {filteredRows.length === 0 ? 0 : ((safePage - 1) * PAGE_SIZE) + 1} to {Math.min(safePage * PAGE_SIZE, filteredRows.length)} of {filteredRows.length.toLocaleString()} entries
            </span>
            <div className="admin-transaction-pagination">
              <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safePage === 1}>
                {'<'}
              </button>
              {paginationItems.map((page, index) => {
                const previousPage = paginationItems[index - 1];
                return (
                  <React.Fragment key={page}>
                    {previousPage && page - previousPage > 1 ? <span>...</span> : null}
                    <button
                      type="button"
                      className={page === safePage ? 'is-active' : ''}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}
              <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safePage === totalPages}>
                {'>'}
              </button>
            </div>
          </footer>
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
