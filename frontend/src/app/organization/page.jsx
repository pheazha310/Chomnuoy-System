import './organization.css';
import OrganizationSidebar from './OrganizationSidebar.jsx';

const summaryCards = [
  {
    title: 'Total Funds Raised',
    value: '$45,280.00',
    change: '+12.5%',
    icon: 'TF',
  },
  {
    title: 'Material Items Received',
    value: '1,240 items',
    change: '+5.2%',
    icon: 'MI',
  },
  {
    title: 'Active Campaigns',
    value: '8 active',
    change: 'Stable',
    icon: 'AC',
  },
];

const campaignPerformance = [
  {
    name: 'Annual School Supplies',
    raised: '$12,400 raised',
    goal: 'Goal: $15,000',
    percent: 82,
    time: '12 Days Left',
  },
  {
    name: 'Clean Water Initiative',
    raised: '$3,200 raised',
    goal: 'Goal: $7,000',
    percent: 45,
    time: '45 Days Left',
  },
];

const donationRows = [
  {
    donor: 'Sarah Jenkins',
    type: 'Money',
    amount: '$250.00',
    status: 'Completed',
    date: 'Oct 24, 2023',
  },
  {
    donor: 'David Miller',
    type: 'Material',
    amount: '15x Backpacks',
    status: 'Pending',
    date: 'Oct 23, 2023',
  },
  {
    donor: 'Emma Wilson',
    type: 'Money',
    amount: '$1,000.00',
    status: 'Completed',
    date: 'Oct 22, 2023',
  },
];

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
  const session = getOrganizationSession();
  const organizationName = session?.name || 'Organization';
  const roleLabel = session?.role === 'Organization' ? 'Administrator' : (session?.role || 'Administrator');
  const initials = getInitials(organizationName);

  return (
    <header className="org-topbar">
      <div>
        <h1>Organization Dashboard</h1>
        <span className="org-badge">Verified NGO</span>
      </div>

      <div className="org-account">
        <div>
          <p>{organizationName}</p>
          <span>{roleLabel}</span>
        </div>
        <span className="org-avatar">{initials}</span>
      </div>
    </header>
  );
}

export default function OrganizationDashboardPage() {
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
                  <button className={item.primary ? 'primary' : 'secondary'} type="button">
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
      </main>
    </div>
  );
}
