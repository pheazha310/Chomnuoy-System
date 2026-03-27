import { useEffect, useMemo, useRef, useState } from 'react';
import './organization.css';
import OrganizationSidebar from './OrganizationSidebar.jsx';
function getOrganizationSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStoredProfile() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_org_profile');
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

function Topbar({ notifications, setNotifications }) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [activeNotificationTab, setActiveNotificationTab] = useState('all');
  const session = getOrganizationSession();
  const storedProfile = getStoredProfile();
  const organizationName = storedProfile?.name || session?.name || 'Organization';
  const organizationLogo = storedProfile?.logo || '';
  const roleLabel = session?.role === 'Organization' ? 'Administrator' : (session?.role || 'Administrator');
  const initials = getInitials(organizationName);
  const unreadCount = notifications.filter((item) => item.unread).length;
  const visibleNotifications =
    activeNotificationTab === 'unread'
      ? notifications.filter((item) => item.unread)
      : notifications;

  const markAllNotificationsRead = () => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
    setActiveNotificationTab('all');
    notifications.forEach((item) => {
      fetch(`${apiBase}/notifications/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true }),
      }).catch(() => null);
    });
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
          <span className="org-avatar">
            {organizationLogo ? <img src={organizationLogo} alt="" /> : initials}
          </span>
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
  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [materialItems, setMaterialItems] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const lastNotificationIdRef = useRef(0);
  const session = getOrganizationSession();
  const organizationId = Number(session?.userId ?? 0);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    Promise.all([
      fetch(`${apiBase}/campaigns`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${apiBase}/donations`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${apiBase}/material_items`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${apiBase}/material_pickups`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([campaignData, donationData, materialData, pickupData]) => {
        const campaignsList = Array.isArray(campaignData) ? campaignData : [];
        const donationList = Array.isArray(donationData) ? donationData : [];
        const materialList = Array.isArray(materialData) ? materialData : [];
        const pickupList = Array.isArray(pickupData) ? pickupData : [];

        const filteredCampaigns = organizationId
          ? campaignsList.filter((item) => Number(item.organization_id) === organizationId)
          : campaignsList;
        const filteredDonations = organizationId
          ? donationList.filter((item) => Number(item.organization_id) === organizationId)
          : donationList;

        setCampaigns(filteredCampaigns);
        setDonations(filteredDonations);
        setMaterialItems(materialList);
        setPickups(pickupList);
      })
      .catch(() => null);
  }, [organizationId]);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    let alive = true;
    let source = null;
    let pollTimer = null;

    const mapNotification = (item) => ({
      id: item.id,
      actor: (item.type || 'NT').slice(0, 2).toUpperCase(),
      title: item.type === 'campaign' ? 'Campaign Update' : 'Notification',
      detail: item.message || 'New update available.',
      time: new Date(item.created_at || Date.now()).toLocaleString(),
      type: item.type || 'info',
      unread: !item.is_read,
    });

    const upsertNotifications = (items) => {
      setNotifications((prev) => {
        const next = new Map(prev.map((item) => [item.id, item]));
        items.forEach((item) => {
          next.set(item.id, mapNotification(item));
        });
        return Array.from(next.values()).sort((a, b) => b.id - a.id);
      });
    };

    const loadNotifications = () => {
      return fetch(`${apiBase}/notifications`)
        .then((response) => (response.ok ? response.json() : []))
        .then((data) => {
          if (!alive) return;
          const items = Array.isArray(data) ? data : [];
          const filtered = organizationId
            ? items.filter((item) => {
                const recipientType = String(item.recipient_type || '').toLowerCase();
                const recipientId = Number(item.recipient_id || 0);
                if (recipientType) {
                  if (recipientType !== 'organization' || recipientId !== organizationId) return false;
                } else if (Number(item.user_id) !== organizationId) {
                  return false;
                }
                const type = String(item.type || '').toLowerCase();
                return type !== 'message' && type !== 'reply';
              })
            : [];
          const mapped = filtered.map(mapNotification);
          setNotifications(mapped);
          const latestId = mapped.reduce((maxId, item) => Math.max(maxId, Number(item.id) || 0), 0);
          lastNotificationIdRef.current = Math.max(lastNotificationIdRef.current, latestId);
        })
        .catch(() => {
          if (!alive) return;
          setNotifications([]);
        });
    };

    const startPolling = () => {
      if (pollTimer) return;
      pollTimer = window.setInterval(loadNotifications, 15000);
    };

    const startEventSource = () => {
      if (typeof EventSource === 'undefined') {
        startPolling();
        return;
      }
      const url = `${apiBase}/notifications/stream?recipient_type=organization&recipient_id=${organizationId}&last_id=${lastNotificationIdRef.current}`;
      source = new EventSource(url);
      source.addEventListener('notification', (event) => {
        if (!alive) return;
        try {
          const item = JSON.parse(event.data);
          if (organizationId && Number(item.user_id) !== organizationId) return;
          const type = String(item.type || '').toLowerCase();
          if (type === 'message' || type === 'reply') return;
          upsertNotifications([item]);
          lastNotificationIdRef.current = Math.max(lastNotificationIdRef.current, Number(item.id) || 0);
        } catch {
          // ignore malformed payload
        }
      });
      source.onerror = () => {
        if (!alive) return;
        if (source) source.close();
        source = null;
        startPolling();
      };
    };

    loadNotifications().then(() => {
      if (!alive) return;
      startEventSource();
    });
    return () => {
      alive = false;
      if (source) source.close();
      if (pollTimer) window.clearInterval(pollTimer);
    };
  }, [organizationId]);

  const summaryCards = useMemo(() => {
    const totalRaised = campaigns.reduce((sum, item) => sum + Number(item.current_amount || 0), 0);
    const activeCount = campaigns.filter((item) => String(item.status || '').toLowerCase() === 'active').length;
    const materialDonationIds = new Set(
      donations.filter((item) => item.donation_type === 'material').map((item) => item.id),
    );
    const materialCount = materialItems
      .filter((item) => materialDonationIds.has(item.donation_id))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    return [
      {
        title: 'Total Funds Raised',
        value: `$${totalRaised.toLocaleString()}`,
        change: '+12.5%',
        icon: 'TF',
      },
      {
        title: 'Material Items Received',
        value: `${materialCount.toLocaleString()} items`,
        change: '+5.2%',
        icon: 'MI',
      },
      {
        title: 'Active Campaigns',
        value: `${activeCount} active`,
        change: 'Stable',
        icon: 'AC',
      },
    ];
  }, [campaigns, donations, materialItems]);

  const campaignPerformance = useMemo(() => {
    const activeCampaigns = campaigns.filter((item) => String(item.status || '').toLowerCase() === 'active');
    return activeCampaigns.slice(0, 2).map((item) => {
      const goal = Number(item.goal_amount || 0);
      const raised = Number(item.current_amount || 0);
      const percent = goal ? Math.round((raised / goal) * 100) : 0;
      return {
        name: item.title || 'Untitled Campaign',
        raised: `$${raised.toLocaleString()} raised`,
        goal: `Goal: $${goal.toLocaleString()}`,
        percent,
        time: item.end_date ? `${Math.max(0, Math.ceil((new Date(item.end_date) - Date.now()) / (1000 * 60 * 60 * 24)))} Days Left` : 'Ongoing',
      };
    });
  }, [campaigns]);

  const donationRows = useMemo(() => {
    return donations.slice(0, 5).map((row) => {
      const materialItem = materialItems.find((item) => item.donation_id === row.id);
      const amountText = row.donation_type === 'material'
        ? `${materialItem?.quantity || 1}x Items`
        : `$${Number(row.amount || 0).toLocaleString()}`;
      return {
        id: row.id ?? `${row.user_id || 'anonymous'}-${row.created_at || 'no-date'}-${row.amount || row.donation_type || 'donation'}`,
        donor: row.user_id ? `Donor #${row.user_id}` : 'Anonymous',
        type: row.donation_type === 'material' ? 'Material' : 'Money',
        amount: amountText,
        status: row.status || 'Pending',
        date: row.created_at ? new Date(row.created_at).toLocaleDateString() : '-',
      };
    });
  }, [donations, materialItems]);

  const pickupAlerts = useMemo(() => {
    return pickups.slice(0, 2).map((item, index) => ({
      title: `Pickup Request #${item.id}`,
      location: item.pickup_address || 'Location pending',
      when: item.schedule_date ? new Date(item.schedule_date).toLocaleDateString() : 'Pending',
      action: index === 0 ? 'Coordinate Pickup' : 'Assign Volunteer',
      primary: index === 0,
    }));
  }, [pickups]);

  return (
    <div className="org-page">
      <OrganizationSidebar />

      <main className="org-main">
        <Topbar notifications={notifications} setNotifications={setNotifications} />

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
                    <tr key={row.id}>
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
