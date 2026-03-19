import './organization.css';
import OrganizationSidebar from './OrganizationSidebar.jsx';
import { Download, FileText, Filter, MoreVertical, Package, Users, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

function getOrganizationSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getInitials(name) {
  if (!name) return 'DN';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function OrganizationDonationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [showAllRows, setShowAllRows] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [donations, setDonations] = useState([]);
  const [materialItems, setMaterialItems] = useState([]);
  const [users, setUsers] = useState([]);
  const session = getOrganizationSession();
  const organizationId = Number(session?.userId ?? 0);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    let alive = true;
    const load = () => {
      setLoading(true);
      setError('');
      Promise.all([
        fetch(`${apiBase}/donations`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${apiBase}/material_items`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${apiBase}/users`).then((r) => (r.ok ? r.json() : [])),
      ])
        .then(([donationData, materialData, userData]) => {
          if (!alive) return;
          const donationList = Array.isArray(donationData) ? donationData : [];
          const materialList = Array.isArray(materialData) ? materialData : [];
          const userList = Array.isArray(userData) ? userData : [];

          const filteredDonations = organizationId
            ? donationList.filter((item) => Number(item.organization_id) === organizationId)
            : donationList;

          setDonations(filteredDonations);
          setMaterialItems(materialList);
          setUsers(userList);
        })
        .catch((err) => {
          if (!alive) return;
          setError(err instanceof Error ? err.message : 'Failed to load donations.');
          setDonations([]);
          setMaterialItems([]);
          setUsers([]);
        })
        .finally(() => {
          if (!alive) return;
          setLoading(false);
        });
    };

    load();
    const timer = window.setInterval(load, 15000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [organizationId]);

  const donationRows = useMemo(() => {
    const userMap = new Map(users.map((user) => [Number(user.id), user.name]));
    return donations.map((row) => {
      const donorName = userMap.get(Number(row.user_id)) || `Donor #${row.user_id || 'N/A'}`;
      const materialItem = materialItems.find((item) => Number(item.donation_id) === Number(row.id));
      const amountText = row.donation_type === 'material'
        ? `${materialItem?.quantity || 1}x ${materialItem?.item_name || 'Items'}`
        : `$${Number(row.amount || 0).toLocaleString()}`;
      const dateValue = toDate(row.created_at);
      return {
        id: row.id,
        donor: donorName,
        initials: getInitials(donorName),
        donationType: row.donation_type === 'material' ? 'Material' : 'Money',
        amount: amountText,
        status: row.status || 'Pending',
        date: dateValue ? dateValue.toLocaleDateString() : '-',
        dateValue: dateValue ? dateValue.getTime() : 0,
      };
    });
  }, [donations, materialItems, users]);

  const filteredRows = useMemo(() => {
    let nextRows = donationRows;

    if (activeTab === 'money') {
      nextRows = nextRows.filter((row) => row.donationType.toLowerCase() === 'money');
    }
    if (activeTab === 'materials') {
      nextRows = nextRows.filter((row) => row.donationType.toLowerCase() === 'material');
    }

    if (statusFilter !== 'all') {
      nextRows = nextRows.filter((row) => row.status.toLowerCase() === statusFilter);
    }

    const query = searchTerm.trim().toLowerCase();
    if (query) {
      nextRows = nextRows.filter((row) => {
        const haystack = [
          row.donor,
          row.donationType,
          row.amount,
          row.status,
          row.date,
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    nextRows = [...nextRows].sort((a, b) => {
      if (sortOrder === 'oldest') return a.dateValue - b.dateValue;
      return b.dateValue - a.dateValue;
    });

    return nextRows;
  }, [activeTab, sortOrder, statusFilter, donationRows, searchTerm]);

  const visibleRows = showAllRows ? filteredRows : filteredRows.slice(0, 7);

  const handleCsvExport = () => {
    const headers = ['Donor Name', 'Type', 'Amount / Items', 'Status', 'Date'];
    const lines = filteredRows.map((row) => [row.donor, row.donationType, row.amount, row.status, row.date]);
    const csv = [headers, ...lines]
      .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'organization-donations.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePdfExport = () => {
    const rowsMarkup = filteredRows
      .map(
        (row) => `<tr>
          <td>${row.donor}</td>
          <td>${row.donationType}</td>
          <td>${row.amount}</td>
          <td>${row.status}</td>
          <td>${row.date}</td>
        </tr>`,
      )
      .join('');

    const printWindow = window.open('', '_blank', 'width=980,height=760');
    if (!printWindow) return;

    printWindow.document.write(`<!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Organization Donations</title>
        <style>
          body { font-family: "Source Sans 3", "Noto Sans Khmer", sans-serif; padding: 20px; color: #0f172a; }
          h1 { margin: 0 0 10px; font-size: 22px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #dbe3ee; padding: 8px; font-size: 12px; text-align: left; }
          th { background: #eef5ff; }
        </style>
      </head>
      <body>
        <h1>Organization Donations Report</h1>
        <table>
          <thead>
            <tr>
              <th>Donor Name</th>
              <th>Type</th>
              <th>Amount / Items</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>${rowsMarkup}</tbody>
        </table>
      </body>
      </html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 200);
  };

  const handleSaveSingleRow = (row) => {
    const printWindow = window.open('', '_blank', 'width=760,height=640');
    if (!printWindow) return;

    printWindow.document.write(`<!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Donation Record</title>
        <style>
          body { font-family: "Source Sans 3", "Noto Sans Khmer", sans-serif; padding: 24px; color: #0f172a; }
          h1 { margin: 0 0 12px; font-size: 22px; }
          .card { border: 1px solid #dbe3ee; border-radius: 10px; padding: 14px; max-width: 520px; }
          .row { display: flex; justify-content: space-between; gap: 12px; margin: 8px 0; }
          .label { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
          .value { color: #0f172a; font-size: 14px; font-weight: 700; }
        </style>
      </head>
      <body>
        <h1>Donation Record</h1>
        <div class="card">
          <div class="row"><span class="label">Donor</span><span class="value">${row.donor}</span></div>
          <div class="row"><span class="label">Type</span><span class="value">${row.donationType}</span></div>
          <div class="row"><span class="label">Amount / Items</span><span class="value">${row.amount}</span></div>
          <div class="row"><span class="label">Status</span><span class="value">${row.status}</span></div>
          <div class="row"><span class="label">Date</span><span class="value">${row.date}</span></div>
        </div>
      </body>
      </html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 200);
  };

  const donationStats = useMemo(() => {
    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const moneyDonations = donations.filter((row) => row.donation_type !== 'material');
    const totalFunds = moneyDonations.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const thisMonthFunds = moneyDonations
      .filter((row) => {
        const date = toDate(row.created_at);
        return date && date >= startThisMonth;
      })
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const lastMonthFunds = moneyDonations
      .filter((row) => {
        const date = toDate(row.created_at);
        return date && date >= startLastMonth && date <= endLastMonth;
      })
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);

    const materialDonationIds = new Set(
      donations.filter((row) => row.donation_type === 'material').map((row) => row.id),
    );
    const totalItems = materialItems
      .filter((item) => materialDonationIds.has(item.donation_id))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const thisMonthItems = materialItems
      .filter((item) => {
        if (!materialDonationIds.has(item.donation_id)) return false;
        const donation = donations.find((row) => Number(row.id) === Number(item.donation_id));
        const date = toDate(donation?.created_at);
        return date && date >= startThisMonth;
      })
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const lastMonthItems = materialItems
      .filter((item) => {
        if (!materialDonationIds.has(item.donation_id)) return false;
        const donation = donations.find((row) => Number(row.id) === Number(item.donation_id));
        const date = toDate(donation?.created_at);
        return date && date >= startLastMonth && date <= endLastMonth;
      })
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    const uniqueDonors = new Set(donations.map((row) => row.user_id)).size;
    const thisMonthDonors = new Set(
      donations
        .filter((row) => {
          const date = toDate(row.created_at);
          return date && date >= startThisMonth;
        })
        .map((row) => row.user_id),
    ).size;
    const lastMonthDonors = new Set(
      donations
        .filter((row) => {
          const date = toDate(row.created_at);
          return date && date >= startLastMonth && date <= endLastMonth;
        })
        .map((row) => row.user_id),
    ).size;

    const percentChange = (current, previous) => {
      if (!previous) return '+0.0%';
      const change = ((current - previous) / previous) * 100;
      const sign = change >= 0 ? '+' : '';
      return `${sign}${change.toFixed(1)}%`;
    };

    return [
      { label: 'Total Funds Raised', value: `$${totalFunds.toLocaleString()}`, change: percentChange(thisMonthFunds, lastMonthFunds), icon: Wallet, tone: 'green' },
      { label: 'Total Material Items', value: `${totalItems.toLocaleString()} items`, change: percentChange(thisMonthItems, lastMonthItems), icon: Package, tone: 'blue' },
      { label: 'Total Unique Donors', value: uniqueDonors.toLocaleString(), change: percentChange(thisMonthDonors, lastMonthDonors), icon: Users, tone: 'amber' },
    ];
  }, [donations, materialItems]);

  return (
    <div className="org-page">
      <OrganizationSidebar />

      <main className="org-main org-donations-main">
        <section className="org-donations-summary-grid" aria-label="Donation summary">
          {donationStats.map((item) => (
            <article key={item.label} className="org-donations-summary-card">
              <div className="org-donations-summary-head">
                <p>{item.label}</p>
                <span className={`org-donations-summary-icon ${item.tone}`}>
                  <item.icon />
                </span>
              </div>
              <h2>{item.value}</h2>
              <small>{item.change} vs last month</small>
            </article>
          ))}
        </section>

        <section className="org-donations-table-card">
          <div className="org-donations-table-toolbar">
            <div className="org-donations-tabs">
              <button
                type="button"
                className={activeTab === 'all' ? 'active' : ''}
                onClick={() => {
                  setActiveTab('all');
                  setShowAllRows(false);
                }}
              >
                All Donations
              </button>
              <button
                type="button"
                className={activeTab === 'money' ? 'active' : ''}
                onClick={() => {
                  setActiveTab('money');
                  setShowAllRows(false);
                }}
              >
                Money
              </button>
              <button
                type="button"
                className={activeTab === 'materials' ? 'active' : ''}
                onClick={() => {
                  setActiveTab('materials');
                  setShowAllRows(false);
                }}
              >
                Materials
              </button>
            </div>
            <div className="org-donations-table-actions">
              <label className="org-donations-search">
                <input
                  type="search"
                  placeholder="Search by recipient or project..."
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setShowAllRows(false);
                  }}
                />
              </label>
              <div className="org-donations-filter-wrap">
                <button type="button" className="org-donations-action-btn" onClick={() => setIsFilterOpen((prev) => !prev)}>
                  <Filter />
                  Filter
                </button>
                {isFilterOpen ? (
                  <div className="org-donations-filter-menu">
                    <p>Status</p>
                    <div className="org-donations-filter-row">
                      <button type="button" className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>All</button>
                      <button type="button" className={statusFilter === 'completed' ? 'active' : ''} onClick={() => setStatusFilter('completed')}>Completed</button>
                      <button type="button" className={statusFilter === 'pending' ? 'active' : ''} onClick={() => setStatusFilter('pending')}>Pending</button>
                    </div>
                    <p>Sort</p>
                    <div className="org-donations-filter-row">
                      <button type="button" className={sortOrder === 'newest' ? 'active' : ''} onClick={() => setSortOrder('newest')}>Newest</button>
                      <button type="button" className={sortOrder === 'oldest' ? 'active' : ''} onClick={() => setSortOrder('oldest')}>Oldest</button>
                    </div>
                    <button type="button" className="org-donations-filter-close" onClick={() => setIsFilterOpen(false)}>
                      Apply
                    </button>
                  </div>
                ) : null}
              </div>
              <button type="button" className="org-donations-action-btn" onClick={handlePdfExport}>
                <FileText />
                PDF
              </button>
              <button type="button" className="org-donations-action-btn primary" onClick={handleCsvExport}>
                <Download />
                Export CSV
              </button>
              <button
                type="button"
                className="org-donations-view-all-btn"
                onClick={() => setShowAllRows((prev) => !prev)}
              >
                {showAllRows ? 'View Less' : 'View All'}
              </button>
            </div>
          </div>

          <div className="org-donations-table-scroll">
            <table className="org-donations-table">
              <thead>
                <tr>
                  <th>Donor Name</th>
                  <th>Type</th>
                  <th>Amount / Items</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>Loading donations...</td>
                  </tr>
                ) : null}
                {error ? (
                  <tr>
                    <td colSpan={6}>{error}</td>
                  </tr>
                ) : null}
                {!loading && !error && visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No donations match your filters.</td>
                  </tr>
                ) : null}
                {!loading && !error
                  ? visibleRows.map((row) => (
                      <tr key={`${row.donor}-${row.date}`}>
                        <td>
                          <div className="org-donations-donor-cell">
                            <span>{row.initials}</span>
                            <strong>{row.donor}</strong>
                          </div>
                        </td>
                        <td>
                          <span className={`org-donations-type-chip ${row.donationType.toLowerCase()}`}>{row.donationType}</span>
                        </td>
                        <td>{row.amount}</td>
                        <td>
                          <span className={`org-donations-status ${row.status.toLowerCase()}`}>
                            <span className="org-donations-dot" aria-hidden="true" />
                            {row.status}
                          </span>
                        </td>
                        <td>{row.date}</td>
                        <td>
                          <div className="org-donations-row-actions">
                            <button type="button" aria-label="Save this donation record" onClick={() => handleSaveSingleRow(row)}>
                              <FileText />
                            </button>
                            <button type="button" aria-label="More options">
                              <MoreVertical />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>

          <footer className="org-donations-table-footer">
            <p>Showing {visibleRows.length} of {filteredRows.length} results</p>
          </footer>
        </section>
      </main>
      {isFilterOpen ? <button type="button" className="org-donations-filter-backdrop" onClick={() => setIsFilterOpen(false)} aria-label="Close filter menu" /> : null}
    </div>
  );
}
