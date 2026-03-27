import './organization.css';
import OrganizationSidebar from './OrganizationSidebar.jsx';
import OrganizationIdentityPill from './OrganizationIdentityPill.jsx';
import { Download, Eye, FileText, Filter, Package, Truck, Users, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ROUTES from '@/constants/routes.js';

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

function normalizeDonationType(value) {
  const key = String(value || '').trim().toLowerCase();
  if (key === 'material' || key === 'materials') return 'material';
  if (key === 'money' || key === 'cash' || key === 'monetary') return 'money';
  return 'money';
}

function normalizeDonationStatus(value) {
  const key = String(value || '').trim().toLowerCase();
  if (key === 'completed' || key === 'success') return 'completed';
  if (key === 'confirmed') return 'confirmed';
  if (key === 'cancelled' || key === 'canceled') return 'cancelled';
  return 'pending';
}

function formatStatusLabel(value) {
  const key = normalizeDonationStatus(value);
  if (key === 'confirmed') return 'Confirmed';
  if (key === 'completed') return 'Completed';
  if (key === 'cancelled') return 'Cancelled';
  return 'Pending';
}

export default function OrganizationDonationsPage() {
  const navigate = useNavigate();
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
  const [pickups, setPickups] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedPickupRequest, setSelectedPickupRequest] = useState(null);
  const [confirmingPickup, setConfirmingPickup] = useState(false);
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
        fetch(`${apiBase}/material_pickups`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${apiBase}/campaigns`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${apiBase}/users`).then((r) => (r.ok ? r.json() : [])),
      ])
        .then(([donationData, materialData, pickupData, campaignData, userData]) => {
          if (!alive) return;
          const donationList = Array.isArray(donationData) ? donationData : [];
          const materialList = Array.isArray(materialData) ? materialData : [];
          const pickupList = Array.isArray(pickupData) ? pickupData : [];
          const campaignList = Array.isArray(campaignData) ? campaignData : [];
          const userList = Array.isArray(userData) ? userData : [];

          const filteredDonations = organizationId
            ? donationList.filter((item) => Number(item.organization_id) === organizationId)
            : donationList;

          setDonations(filteredDonations);
          setMaterialItems(materialList);
          setPickups(pickupList);
          setCampaigns(campaignList);
          setUsers(userList);
        })
        .catch((err) => {
          if (!alive) return;
          setError(err instanceof Error ? err.message : 'Failed to load donations.');
          setDonations([]);
          setMaterialItems([]);
          setPickups([]);
          setCampaigns([]);
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
    const campaignMap = new Map(campaigns.map((campaign) => [Number(campaign.id), campaign]));
    return donations.map((row) => {
      const donationTypeKey = normalizeDonationType(row.donation_type);
      const donorName = userMap.get(Number(row.user_id)) || `Donor #${row.user_id || 'N/A'}`;
      const linkedItems = materialItems.filter((item) => Number(item.donation_id) === Number(row.id));
      const primaryItem = linkedItems[0];
      const totalQuantity = linkedItems.reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0);
      const amountText = donationTypeKey === 'material'
        ? `${totalQuantity || 1}x ${primaryItem?.item_name || 'Items'}`
        : `$${Number(row.amount || 0).toLocaleString()}`;
      const pickup = pickups.find((item) => Number(item.donation_id) === Number(row.id));
      const statusKey = donationTypeKey === 'material' && pickup?.status
        ? normalizeDonationStatus(pickup.status)
        : normalizeDonationStatus(row.status);
      const dateValue = toDate(row.created_at);
      const campaign = campaignMap.get(Number(row.campaign_id));
      return {
        id: row.id,
        campaignId: Number(row.campaign_id || 0) || null,
        donorUserId: Number(row.user_id || 0) || null,
        donor: donorName,
        initials: getInitials(donorName),
        donationType: donationTypeKey === 'material' ? 'Material' : 'Money',
        donationTypeKey,
        amount: amountText,
        project: campaign?.title || row.project_name || row.title || 'Campaign',
        itemSummary:
          donationTypeKey === 'material'
            ? linkedItems.map((item) => item.item_name).filter(Boolean).join(', ') || 'Material request'
            : row.payment_method || row.method || 'Online donation',
        status: formatStatusLabel(statusKey),
        statusKey,
        date: dateValue ? dateValue.toLocaleDateString() : '-',
        dateValue: dateValue ? dateValue.getTime() : 0,
        pickupId: Number(pickup?.id || 0) || null,
        pickupAddress: pickup?.pickup_address || 'Pickup address pending',
        pickupSchedule: pickup?.schedule_date ? toDate(pickup.schedule_date)?.toLocaleDateString() || 'Schedule pending' : 'Schedule pending',
        pickupScheduleRaw: pickup?.schedule_date || null,
        pickupStatus: pickup?.status || 'pending',
        primaryItemName: primaryItem?.item_name || 'Requested items',
        totalQuantity: totalQuantity || 1,
      };
    });
  }, [campaigns, donations, materialItems, pickups, users]);

  const filteredRows = useMemo(() => {
    let nextRows = donationRows;

    if (activeTab === 'money') {
      nextRows = nextRows.filter((row) => row.donationTypeKey === 'money');
    }
    if (activeTab === 'materials') {
      nextRows = nextRows.filter((row) => row.donationTypeKey === 'material');
    }

    if (statusFilter !== 'all') {
      nextRows = nextRows.filter((row) => row.statusKey === statusFilter);
    }

    const query = searchTerm.trim().toLowerCase();
    if (query) {
      nextRows = nextRows.filter((row) => {
        const haystack = [
          row.donor,
          row.project,
          row.donationType,
          row.amount,
          row.itemSummary,
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
    const headers = ['Donor Name', 'Project', 'Type', 'Amount / Items', 'Status', 'Date'];
    const lines = filteredRows.map((row) => [row.donor, row.project, row.donationType, row.amount, row.status, row.date]);
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
          <td>${row.project}</td>
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
              <th>Project</th>
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
          <div class="row"><span class="label">Project</span><span class="value">${row.project}</span></div>
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

  const handleOpenRowAction = (row) => {
    if (row.donationTypeKey === 'material' && row.pickupId) {
      setSelectedPickupRequest(row);
      return;
    }

    if (row.campaignId) {
      navigate(ROUTES.ORGANIZATION_CAMPAIGN_DETAIL(row.campaignId));
      return;
    }

    window.alert(
      row.donationTypeKey === 'material'
        ? `Pickup details are not available yet for ${row.donor}'s material donation.`
        : `This donation is not linked to a campaign detail yet.`,
    );
  };

  const handleConfirmPickup = async () => {
    if (!selectedPickupRequest?.pickupId) {
      setSelectedPickupRequest(null);
      return;
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    setConfirmingPickup(true);

    try {
      const pickupResponse = await fetch(`${apiBase}/material_pickups/${selectedPickupRequest.pickupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'confirmed',
          pickup_address: selectedPickupRequest.pickupAddress,
          schedule_date: selectedPickupRequest.pickupScheduleRaw,
        }),
      });

      if (!pickupResponse.ok) {
        throw new Error(`Failed to confirm pickup (${pickupResponse.status})`);
      }

      const donationResponse = await fetch(`${apiBase}/donations/${selectedPickupRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      });

      if (!donationResponse.ok) {
        throw new Error(`Failed to update donation (${donationResponse.status})`);
      }

      if (selectedPickupRequest.donorUserId) {
        await fetch(`${apiBase}/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: selectedPickupRequest.donorUserId,
            message: `Your material donation for "${selectedPickupRequest.project}" has been confirmed by the organization for pickup.`,
            type: 'pickup-confirmed',
            is_read: false,
          }),
        }).catch(() => null);
      }

      setPickups((prev) => prev.map((item) => (
        Number(item.id) === Number(selectedPickupRequest.pickupId)
          ? { ...item, status: 'confirmed' }
          : item
      )));
      setDonations((prev) => prev.map((item) => (
        Number(item.id) === Number(selectedPickupRequest.id)
          ? { ...item, status: 'confirmed' }
          : item
      )));
      setSelectedPickupRequest(null);
    } catch {
      // Keep the modal open so the organization can retry.
    } finally {
      setConfirmingPickup(false);
    }
  };

  const donationStats = useMemo(() => {
    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const moneyDonations = donations.filter((row) => normalizeDonationType(row.donation_type) === 'money' && normalizeDonationStatus(row.status) === 'completed');
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
      donations.filter((row) => normalizeDonationType(row.donation_type) === 'material').map((row) => row.id),
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

  const tabCounts = useMemo(() => ({
    all: donationRows.length,
    money: donationRows.filter((row) => row.donationTypeKey === 'money').length,
    materials: donationRows.filter((row) => row.donationTypeKey === 'material').length,
  }), [donationRows]);

  return (
    <div className="org-page">
      <OrganizationSidebar />

      <main className="org-main org-donations-main">
        <div className="org-main-identity">
          <OrganizationIdentityPill />
        </div>

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
                All Donations ({tabCounts.all})
              </button>
              <button
                type="button"
                className={activeTab === 'money' ? 'active' : ''}
                onClick={() => {
                  setActiveTab('money');
                  setShowAllRows(false);
                }}
              >
                Money ({tabCounts.money})
              </button>
              <button
                type="button"
                className={activeTab === 'materials' ? 'active' : ''}
                onClick={() => {
                  setActiveTab('materials');
                  setShowAllRows(false);
                }}
              >
                Materials ({tabCounts.materials})
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
                    <div className="org-donations-filter-section">
                      <p className="org-donations-filter-label">Status</p>
                      <div className="org-donations-filter-row">
                        <button type="button" className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>All</button>
                        <button type="button" className={statusFilter === 'completed' ? 'active' : ''} onClick={() => setStatusFilter('completed')}>Completed</button>
                        <button type="button" className={statusFilter === 'confirmed' ? 'active' : ''} onClick={() => setStatusFilter('confirmed')}>Confirmed</button>
                        <button type="button" className={statusFilter === 'pending' ? 'active' : ''} onClick={() => setStatusFilter('pending')}>Pending</button>
                      </div>
                    </div>
                    <div className="org-donations-filter-section">
                      <p className="org-donations-filter-label">Sort</p>
                      <div className="org-donations-filter-row">
                        <button type="button" className={sortOrder === 'newest' ? 'active' : ''} onClick={() => setSortOrder('newest')}>Newest</button>
                        <button type="button" className={sortOrder === 'oldest' ? 'active' : ''} onClick={() => setSortOrder('oldest')}>Oldest</button>
                      </div>
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
                  <th>Project</th>
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
                    <td colSpan={7}>Loading donations...</td>
                  </tr>
                ) : null}
                {error ? (
                  <tr>
                    <td colSpan={7}>{error}</td>
                  </tr>
                ) : null}
                {!loading && !error && visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No donations match your filters.</td>
                  </tr>
                ) : null}
                {!loading && !error
                  ? visibleRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <div className="org-donations-donor-cell">
                            <span>{row.initials}</span>
                            <div className="org-donations-donor-meta">
                              <strong>{row.donor}</strong>
                              <small>{row.itemSummary}</small>
                            </div>
                          </div>
                        </td>
                        <td>{row.project}</td>
                        <td>
                          <span className={`org-donations-type-chip ${row.donationType.toLowerCase()}`}>{row.donationType}</span>
                        </td>
                        <td>{row.amount}</td>
                        <td>
                          <span className={`org-donations-status ${row.statusKey}`}>
                            <span className="org-donations-dot" aria-hidden="true" />
                            {row.status}
                          </span>
                        </td>
                        <td>{row.date}</td>
                        <td>
                          <div className="org-donations-row-actions">
                            <button type="button" aria-label={`Export ${row.donor} donation record`} onClick={() => handleSaveSingleRow(row)}>
                              <FileText />
                              <span>Receipt</span>
                            </button>
                            <button
                              type="button"
                              className={row.donationTypeKey === 'material' ? 'is-material' : 'is-money'}
                              aria-label={row.donationTypeKey === 'material' ? `Open ${row.donor} material donation workflow` : `View ${row.project} campaign`}
                              onClick={() => handleOpenRowAction(row)}
                            >
                              {row.donationTypeKey === 'material' ? <Truck /> : <Eye />}
                              <span>{row.donationTypeKey === 'material' ? 'Manage Pickup' : 'View Campaign'}</span>
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
      {selectedPickupRequest ? (
        <div className="org-pickup-modal-overlay" role="presentation" onClick={() => setSelectedPickupRequest(null)}>
          <div
            className="org-pickup-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="org-donation-pickup-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className={`org-pickup-modal-badge ${selectedPickupRequest.statusKey}`}>
              {selectedPickupRequest.statusKey === 'confirmed' ? 'Pickup Confirmed' : 'Awaiting Confirmation'}
            </span>
            <h3 id="org-donation-pickup-modal-title">Coordinate Pickup</h3>
            <p className="org-pickup-modal-copy">Review this material donation with real donor, campaign, and pickup data from the project.</p>

            <div className="org-pickup-modal-details">
              <div>
                <span>Campaign</span>
                <strong>{selectedPickupRequest.project}</strong>
              </div>
              <div>
                <span>Donor</span>
                <strong>{selectedPickupRequest.donor}</strong>
              </div>
              <div>
                <span>Items</span>
                <strong>{selectedPickupRequest.totalQuantity}x {selectedPickupRequest.primaryItemName}</strong>
              </div>
              <div>
                <span>Pickup Address</span>
                <strong>{selectedPickupRequest.pickupAddress}</strong>
              </div>
              <div>
                <span>Schedule</span>
                <strong>{selectedPickupRequest.pickupSchedule}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{selectedPickupRequest.status}</strong>
              </div>
            </div>

            <div className="org-pickup-modal-note">
              <strong>Next step</strong>
              <p>
                {selectedPickupRequest.statusKey === 'confirmed'
                  ? 'This pickup is already confirmed and synced with the donation record.'
                  : 'Confirm pickup to update the donation status and notify the donor.'}
              </p>
            </div>

            <div className="org-pickup-modal-actions">
              <button type="button" className="org-pickup-modal-btn secondary" onClick={() => setSelectedPickupRequest(null)}>
                Close
              </button>
              <button
                type="button"
                className="org-pickup-modal-btn primary"
                onClick={handleConfirmPickup}
                disabled={confirmingPickup || selectedPickupRequest.statusKey === 'confirmed'}
              >
                {selectedPickupRequest.statusKey === 'confirmed'
                  ? 'Pickup Confirmed'
                  : confirmingPickup
                    ? 'Confirming...'
                    : 'Confirm Pickup'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isFilterOpen ? <button type="button" className="org-donations-filter-backdrop" onClick={() => setIsFilterOpen(false)} aria-label="Close filter menu" /> : null}
    </div>
  );
}
