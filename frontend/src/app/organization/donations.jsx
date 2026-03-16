import './organization.css';
import OrganizationSidebar from './OrganizationSidebar.jsx';
import { Download, FileText, Filter, MoreVertical, Package, Users, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';

const donationStats = [
  { label: 'Total Funds Raised', value: '$45,280.00', change: '+12.5%', icon: Wallet, tone: 'green' },
  { label: 'Total Material Items', value: '1,240 items', change: '+5.2%', icon: Package, tone: 'blue' },
  { label: 'Total Unique Donors', value: '856', change: '+8.1%', icon: Users, tone: 'amber' },
];

const donationRows = [
  { donor: 'Alice Merton', initials: 'AM', donationType: 'Money', amount: '$1,200.00', status: 'Completed', date: 'Oct 24, 2023' },
  { donor: 'Robert Kincaid', initials: 'RK', donationType: 'Material', amount: '50x Medical Kits', status: 'Pending', date: 'Oct 23, 2023' },
  { donor: 'Jessica Park', initials: 'JP', donationType: 'Money', amount: '$50.00', status: 'Completed', date: 'Oct 22, 2023' },
  { donor: 'Liam Murphy', initials: 'LM', donationType: 'Material', amount: '120x School Supplies', status: 'Completed', date: 'Oct 21, 2023' },
  { donor: 'Sarah Chen', initials: 'SC', donationType: 'Money', amount: '$2,500.00', status: 'Completed', date: 'Oct 20, 2023' },
  { donor: 'Noah Bennett', initials: 'NB', donationType: 'Material', amount: '10x Wheelchairs', status: 'Pending', date: 'Oct 19, 2023' },
  { donor: 'Mia Tran', initials: 'MT', donationType: 'Money', amount: '$800.00', status: 'Completed', date: 'Oct 18, 2023' },
  { donor: 'Daniel Kim', initials: 'DK', donationType: 'Money', amount: '$150.00', status: 'Completed', date: 'Oct 17, 2023' },
  { donor: 'Olivia Sun', initials: 'OS', donationType: 'Material', amount: '35x Food Packages', status: 'Completed', date: 'Oct 16, 2023' },
  { donor: 'Ava Carter', initials: 'AC', donationType: 'Money', amount: '$975.00', status: 'Completed', date: 'Oct 15, 2023' },
  { donor: 'Ethan Lee', initials: 'EL', donationType: 'Material', amount: '42x School Bags', status: 'Pending', date: 'Oct 14, 2023' },
  { donor: 'Grace Wong', initials: 'GW', donationType: 'Money', amount: '$430.00', status: 'Completed', date: 'Oct 13, 2023' },
  { donor: 'Henry Chou', initials: 'HC', donationType: 'Money', amount: '$1,640.00', status: 'Completed', date: 'Oct 12, 2023' },
  { donor: 'Isabella Kay', initials: 'IK', donationType: 'Material', amount: '18x Hygiene Kits', status: 'Completed', date: 'Oct 11, 2023' },
  { donor: 'Jason Phan', initials: 'JP', donationType: 'Money', amount: '$300.00', status: 'Pending', date: 'Oct 10, 2023' },
];

export default function OrganizationDonationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [showAllRows, setShowAllRows] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  const parseRowDate = (value) => new Date(value).getTime();

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

    nextRows = [...nextRows].sort((a, b) => {
      if (sortOrder === 'oldest') return parseRowDate(a.date) - parseRowDate(b.date);
      return parseRowDate(b.date) - parseRowDate(a.date);
    });

    return nextRows;
  }, [activeTab, sortOrder, statusFilter]);

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
          body { font-family: Arial, sans-serif; padding: 20px; color: #0f172a; }
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
          body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
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
                {visibleRows.map((row) => (
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
                ))}
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
