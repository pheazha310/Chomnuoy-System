import { useMemo, useState } from 'react';
import './organization.css';
import OrganizationSidebar from './OrganizationSidebar.jsx';

const fakeDonations = [
  { donor: 'Sarah Jenkins', type: 'Money', amount: 250, status: 'Completed', date: 'Oct 24, 2023' },
  { donor: 'David Miller', type: 'Material', items: 15, itemLabel: 'Backpacks', status: 'Pending', date: 'Oct 23, 2023' },
  { donor: 'Emma Wilson', type: 'Money', amount: 1000, status: 'Completed', date: 'Oct 22, 2023' },
  { donor: 'Noah Carter', type: 'Money', amount: 5200, status: 'Completed', date: 'Oct 20, 2023' },
  { donor: 'Mila Brooks', type: 'Material', items: 40, itemLabel: 'Textbooks', status: 'Completed', date: 'Oct 18, 2023' },
  { donor: 'Oliver Stone', type: 'Money', amount: 320, status: 'Completed', date: 'Oct 18, 2023' },
  { donor: 'Ava Kim', type: 'Material', items: 25, itemLabel: 'Notebooks', status: 'Completed', date: 'Oct 16, 2023' },
];

const fakeCampaigns = [
  { name: 'Annual School Supplies', raised: 12400, goal: 15000, percent: 82, time: '12 Days Left', status: 'Active' },
  { name: 'Clean Water Initiative', raised: 3200, goal: 7000, percent: 45, time: '45 Days Left', status: 'Active' },
  { name: 'Community Food Drive', raised: 1800, goal: 5000, percent: 36, time: '21 Days Left', status: 'Paused' },
  { name: 'Health Outreach Kits', raised: 6100, goal: 9000, percent: 68, time: '7 Days Left', status: 'Active' },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const campaignPerformance = fakeCampaigns.map((campaign) => ({
  name: campaign.name,
  raised: `${formatCurrency(campaign.raised)} raised`,
  goal: `Goal: ${formatCurrency(campaign.goal)}`,
  percent: campaign.percent,
  time: campaign.time,
}));

const donationRows = fakeDonations.slice(0, 2).map((donation) => ({
  donor: donation.donor,
  type: donation.type,
  amount:
    donation.type === 'Money'
      ? formatCurrency(donation.amount)
      : `${donation.items}x ${donation.itemLabel}`,
  status: donation.status,
  date: donation.date,
}));

const pickupAlerts = [
  {
    title: 'Textbook Collection',
    location: '124 North Ave, Downtown',
    when: 'Today',
    action: 'Coordinate Pickup',
    primary: true,
  },
  {
    title: 'Sports Equipment',
    location: 'Community Center East',
    when: 'Tomorrow',
    action: 'Assign Volunteer',
    primary: false,
  },
];

function getOrganizationSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getInitials(name) {
  if (!name) return 'OR';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function Topbar() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [activeNotificationTab, setActiveNotificationTab] = useState('all');
  const session = getOrganizationSession();
  const organizationName = session?.name || 'Organization';
  const roleLabel = session?.role === 'Organization' ? 'Administrator' : (session?.role || 'Administrator');
  const initials = getInitials(organizationName);
  const [notifications, setNotifications] = useState([
    { id: 1, actor: 'SJ', title: 'New Donation Received', detail: 'Sarah Jenkins donated $250 to Annual School Supplies.', time: '2m', type: 'success', unread: true },
    { id: 2, actor: 'TC', title: 'Pickup Request Updated', detail: 'Textbook Collection is now marked as urgent pickup.', time: '30m', type: 'info', unread: true },
    { id: 3, actor: 'CW', title: 'Campaign Goal Progress', detail: 'Clean Water Initiative reached 45% of its target.', time: '1h', type: 'progress', unread: true },
    { id: 4, actor: 'DM', title: 'New Donor Message', detail: 'David Miller asked about delivery details for material items.', time: '5h', type: 'message', unread: false },
    { id: 5, actor: 'VR', title: 'Verification Reminder', detail: 'Please upload updated organization documents by next week.', time: '1d', type: 'warning', unread: false },
  ]);
  const unreadCount = notifications.filter((item) => item.unread).length;
  const visibleNotifications =
    activeNotificationTab === 'unread'
      ? notifications.filter((item) => item.unread)
      : notifications;

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
    setActiveNotificationTab('all');
  };

  return (
    <>
      <header className="org-topbar">
        <div>
          <h1>Organization Dashboard</h1>
          <span className="org-badge">Verified NGO</span>
        </div>

        <div className="org-account">
          <form className="org-topbar-search" role="search" aria-label="Search dashboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <circle cx="11" cy="11" r="7" strokeWidth="1.8" />
              <path d="m20 20-3.6-3.6" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input type="search" placeholder="Search..." />
          </form>
          <button
            type="button"
            className="org-notify-btn"
            aria-label="Notifications"
            onClick={() => setIsNotificationOpen(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {unreadCount > 0 ? <span className="org-notify-dot" /> : null}
          </button>
          <div style={{marginLeft:'15px'}}>
            <p>{organizationName}</p>
            <span>{roleLabel}</span>
          </div>
          <span className="org-avatar">{initials}</span>
        </div>
      </header>

      {isNotificationOpen ? (
        <div className="org-notify-overlay" role="presentation" onClick={() => setIsNotificationOpen(false)}>
          <div
            className="org-notify-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="org-notify-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="org-notify-modal-head">
              <h2 id="org-notify-title">Notifications</h2>
              <div className="org-notify-head-actions">
                <button
                  type="button"
                  className="org-notify-mark-read"
                  onClick={markAllNotificationsRead}
                  disabled={unreadCount === 0}
                >
                  Mark all as read
                </button>
                <button
                  type="button"
                  className="org-notify-close-btn"
                  onClick={() => setIsNotificationOpen(false)}
                  aria-label="Close notifications"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <path d="m18 6-12 12M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="org-notify-tabs" role="tablist" aria-label="Notification filters">
              <button
                type="button"
                role="tab"
                aria-selected={activeNotificationTab === 'all'}
                className={activeNotificationTab === 'all' ? 'is-active' : ''}
                onClick={() => setActiveNotificationTab('all')}
              >
                All
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeNotificationTab === 'unread'}
                className={activeNotificationTab === 'unread' ? 'is-active' : ''}
                onClick={() => setActiveNotificationTab('unread')}
              >
                Unread {unreadCount > 0 ? `(${unreadCount})` : ''}
              </button>
            </div>

            <div className="org-notify-modal-body">
              {visibleNotifications.length === 0 ? (
                <p className="org-notify-empty">No unread notifications.</p>
              ) : (
                visibleNotifications.map((item) => (
                  <article key={item.id} className={`org-notify-item ${item.unread ? 'is-unread' : ''}`}>
                    <span className={`org-notify-avatar ${item.type}`} aria-hidden="true">{item.actor}</span>
                    <div className="org-notify-item-content">
                      <h3>{item.title}</h3>
                      <p>{item.detail}</p>
                      <time>{item.time}</time>
                    </div>
                    {item.unread ? <span className="org-notify-unread-dot" aria-hidden="true" /> : null}
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function OrganizationDashboardPage() {
  const [selectedPickupAlert, setSelectedPickupAlert] = useState(null);
  const summaryCards = useMemo(() => {
    const totalFunds = fakeDonations
      .filter((donation) => donation.type === 'Money' && donation.status === 'Completed')
      .reduce((sum, donation) => sum + donation.amount, 0);
    const totalItems = fakeDonations
      .filter((donation) => donation.type === 'Material' && donation.status === 'Completed')
      .reduce((sum, donation) => sum + donation.items, 0);
    const activeCampaigns = fakeCampaigns.filter((campaign) => campaign.status === 'Active').length;

    return [
      {
        title: 'Total Funds Raised',
        value: formatCurrency(totalFunds),
        change: 'Updated',
        icon: 'TF',
      },
      {
        title: 'Material Items Received',
        value: `${totalItems.toLocaleString()} items`,
        change: 'Updated',
        icon: 'MI',
      },
      {
        title: 'Active Campaigns',
        value: `${activeCampaigns} active`,
        change: 'Updated',
        icon: 'AC',
      },
    ];
  }, []);

  return (
    <div className="org-page">
      <OrganizationSidebar />

      <main className="org-main">
        <Topbar />

        <section className="org-summary-grid" aria-label="Summary metrics">
          {summaryCards.map((card) => (
            <article key={card.title} className="org-summary-card">
              <div className="org-summary-head">
                <span className="org-summary-icon">{card.icon}</span>
                <span className="org-summary-change">{card.change}</span>
              </div>
              <p>{card.title}</p>
              <h2>{card.value}</h2>
            </article>
          ))}
        </section>

        <section className="org-content-grid">
          <div className="org-left-column">
            <div className="org-section-head">
              <h3>Campaign Performance</h3>
              <button type="button">View All</button>
            </div>

            <div className="org-campaign-grid">
              {campaignPerformance.map((campaign) => (
                <article key={campaign.name} className="org-campaign-card">
                  <div className="org-campaign-head">
                    <h4>{campaign.name}</h4>
                    <span>{campaign.time}</span>
                  </div>
                  <div className="org-campaign-meta">
                    <p>{campaign.raised}</p>
                    <strong>{campaign.percent}%</strong>
                  </div>
                  <div className="org-progress" role="img" aria-label={`${campaign.percent}% progress`}>
                    <span style={{ width: `${campaign.percent}%` }} />
                  </div>
                  <p className="org-goal-text">{campaign.goal}</p>
                </article>
              ))}
            </div>

            <article className="org-table-card">
              <div className="org-section-head">
                <h3>Recent Donation Activity</h3>
                <button type="button">Filter</button>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Donor Name</th>
                    <th>Type</th>
                    <th>Amount/Items</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {donationRows.map((row) => (
                    <tr key={`${row.donor}-${row.date}`}>
                      <td>{row.donor}</td>
                      <td>{row.type}</td>
                      <td>{row.amount}</td>
                      <td>
                        <span className={`org-status ${row.status.toLowerCase()}`}>{row.status}</span>
                      </td>
                      <td>{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </div>

          <aside className="org-right-column">
            <article className="org-pickup-card">
              <div className="org-section-head">
                <h3>Pickup Alerts</h3>
                <span className="org-small-badge">3 New</span>
              </div>

              {pickupAlerts.map((item) => (
                <section key={item.title} className="org-alert-item">
                  <div className="org-alert-head">
                    <h4>{item.title}</h4>
                    <span>{item.when}</span>
                  </div>
                  <p>{item.location}</p>
                  <button
                    className={item.primary ? 'primary' : 'secondary'}
                    type="button"
                    onClick={() => setSelectedPickupAlert(item)}
                  >
                    {item.action}
                  </button>
                </section>
              ))}
            </article>

            <article className="org-weekly-card">
              <h3>Weekly Summary</h3>
              <p>New Donors</p>
              <strong>24</strong>
              <span>You've reached 85% of your monthly engagement target.</span>
            </article>
          </aside>
        </section>

        {selectedPickupAlert ? (
          <div className="org-pickup-modal-overlay" role="presentation" onClick={() => setSelectedPickupAlert(null)}>
            <div
              className="org-pickup-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="org-pickup-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 id="org-pickup-modal-title">Coordinate Pickup</h3>
              <p className="org-pickup-modal-copy">Review this pickup alert and continue to pickup management.</p>

              <div className="org-pickup-modal-details">
                <div>
                  <span>Title</span>
                  <strong>{selectedPickupAlert.title}</strong>
                </div>
                <div>
                  <span>Location</span>
                  <strong>{selectedPickupAlert.location}</strong>
                </div>
                <div>
                  <span>When</span>
                  <strong>{selectedPickupAlert.when}</strong>
                </div>
              </div>

              <div className="org-pickup-modal-actions">
                <button type="button" className="org-pickup-modal-btn secondary" onClick={() => setSelectedPickupAlert(null)}>
                  Close
                </button>
                <button
                  type="button"
                  className="org-pickup-modal-btn primary"
                  onClick={() => {
                    setSelectedPickupAlert(null);
                  }}
                >
                  Confirm Pickup
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
