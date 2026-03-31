import { useEffect, useMemo, useRef, useState } from 'react';
import './organization.css';
import OrganizationSidebar from './OrganizationSidebar.jsx';
import OrganizationIdentityPill from './OrganizationIdentityPill.jsx';

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
    if (raw) return JSON.parse(raw);
    const fallbackRaw = window.localStorage.getItem('chomnuoy_org_info');
    return fallbackRaw ? JSON.parse(fallbackRaw) : null;
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

function Topbar({ notifications, setNotifications, searchTerm, setSearchTerm }) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [activeNotificationTab, setActiveNotificationTab] = useState('all');
  const [storedProfile, setStoredProfile] = useState(() => getStoredProfile());
  const session = getOrganizationSession();
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

  useEffect(() => {
    const syncProfile = () => {
      setStoredProfile(getStoredProfile());
    };

    window.addEventListener('storage', syncProfile);
    window.addEventListener('chomnuoy-org-profile-updated', syncProfile);
    return () => {
      window.removeEventListener('storage', syncProfile);
      window.removeEventListener('chomnuoy-org-profile-updated', syncProfile);
    };
  }, []);

  return (
    <>
      <header className="org-topbar">
        <div>
          <h1>Organization Dashboard</h1>
          <span className="org-badge">Verified NGO</span>
        </div>

        <div className="org-account">
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
          <OrganizationIdentityPill className="org-topbar-pill" />
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
  const [confirmingPickup, setConfirmingPickup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [materialItems, setMaterialItems] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [users, setUsers] = useState([]);
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
      fetch(`${apiBase}/users`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([campaignData, donationData, materialData, pickupData, userData]) => {
        const campaignsList = Array.isArray(campaignData) ? campaignData : [];
        const donationList = Array.isArray(donationData) ? donationData : [];
        const materialList = Array.isArray(materialData) ? materialData : [];
        const pickupList = Array.isArray(pickupData) ? pickupData : [];
        const userList = Array.isArray(userData) ? userData : [];

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
        setUsers(userList);
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
      title: item.type === 'campaign' ? 'Campaign Update' : item.type === 'follow' ? 'New Follower' : 'Notification',
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
          if (organizationId) {
            const recipientType = String(item.recipient_type || '').toLowerCase();
            const recipientId = Number(item.recipient_id || 0);
            if (recipientType) {
              if (recipientType !== 'organization' || recipientId !== organizationId) return;
            } else if (Number(item.user_id) !== organizationId) {
              return;
            }
          }
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
    const query = searchTerm.trim().toLowerCase();

    return activeCampaigns.filter((item) => {
      if (!query) return true;
      const haystack = `${item.title || ''} ${item.status || ''} ${item.end_date || ''}`.toLowerCase();
      return haystack.includes(query);
    }).slice(0, 2).map((item) => {
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
  }, [campaigns, searchTerm]);

  const donationRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return donations.filter((row) => {
      if (!query) return true;
      const materialItem = materialItems.find((item) => item.donation_id === row.id);
      const donor = users.find((item) => Number(item.id) === Number(row.user_id));
      const haystack = `${donor?.name || ''} ${row.donation_type || ''} ${row.status || ''} ${materialItem?.item_name || ''} ${row.amount || ''}`.toLowerCase();
      return haystack.includes(query);
    }).slice(0, 5).map((row) => {
      const materialItem = materialItems.find((item) => item.donation_id === row.id);
      const pickup = pickups.find((item) => Number(item.donation_id) === Number(row.id));
      const donor = users.find((item) => Number(item.id) === Number(row.user_id));
      const quantity = Math.max(1, Number(materialItem?.quantity || row.amount || 1));
      const amountText = row.donation_type === 'material'
        ? `${quantity}x ${materialItem?.item_name || 'Items'}`
        : `$${Number(row.amount || 0).toLocaleString()}`;
      const statusText = row.donation_type === 'material' && pickup?.status
        ? String(pickup.status)
        : String(row.status || 'Pending');
      return {
        id: row.id ?? `${row.user_id || 'anonymous'}-${row.created_at || 'no-date'}-${row.amount || row.donation_type || 'donation'}`,
        donor: donor?.name || (row.user_id ? `Donor #${row.user_id}` : 'Anonymous'),
        type: row.donation_type === 'material' ? 'Material' : 'Money',
        amount: amountText,
        status: statusText,
        date: row.created_at ? new Date(row.created_at).toLocaleDateString() : '-',
      };
    });
  }, [donations, materialItems, pickups, searchTerm, users]);

  const pickupAlerts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return pickups.filter((item) => {
      if (!query) return true;
      const donation = donations.find((row) => Number(row.id) === Number(item.donation_id));
      const materialItem = materialItems.find((row) => Number(row.donation_id) === Number(item.donation_id));
      const campaign = campaigns.find((row) => Number(row.id) === Number(donation?.campaign_id));
      const donor = users.find((row) => Number(row.id) === Number(donation?.user_id));
      const haystack = `${campaign?.title || ''} ${donor?.name || ''} ${materialItem?.item_name || ''} ${item.pickup_address || ''} ${item.status || ''}`.toLowerCase();
      return haystack.includes(query);
    }).slice(0, 3).map((item, index) => {
      const donation = donations.find((row) => Number(row.id) === Number(item.donation_id));
      const materialItem = materialItems.find((row) => Number(row.donation_id) === Number(item.donation_id));
      const campaign = campaigns.find((row) => Number(row.id) === Number(donation?.campaign_id));
      const donor = users.find((row) => Number(row.id) === Number(donation?.user_id));
      const quantity = Math.max(1, Number(materialItem?.quantity || donation?.amount || 1));
      const donorName = donor?.name || (donation?.user_id ? `Donor #${donation.user_id}` : 'Anonymous donor');
      const itemName = materialItem?.item_name || 'Material items';
      const schedule = item.schedule_date ? new Date(item.schedule_date) : null;
      const hasSchedule = schedule && !Number.isNaN(schedule.getTime());

      return {
        id: item.id,
        donationId: donation?.id ?? null,
        donorUserId: donation?.user_id ?? null,
        title: campaign?.title || `Pickup Request #${item.id}`,
        donorName,
        itemName,
        quantity,
        campaignName: campaign?.title || 'Campaign',
        location: item.pickup_address || 'Location pending',
        scheduleRaw: item.schedule_date || null,
        when: hasSchedule
          ? schedule.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
          : 'Not scheduled yet',
        status: String(item.status || 'pending'),
        action: index === 0 ? 'Coordinate Pickup' : 'Review Pickup',
        primary: index === 0,
      };
    });
  }, [pickups, donations, materialItems, campaigns, searchTerm, users]);

  const handleConfirmPickup = async () => {
    if (!selectedPickupAlert?.id) {
      setSelectedPickupAlert(null);
      return;
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    setConfirmingPickup(true);

    try {
      const pickupResponse = await fetch(`${apiBase}/material_pickups/${selectedPickupAlert.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'confirmed',
          pickup_address: selectedPickupAlert.location,
          schedule_date: selectedPickupAlert.scheduleRaw,
        }),
      });
      if (!pickupResponse.ok) {
        throw new Error(`Failed to confirm pickup (${pickupResponse.status})`);
      }

      if (selectedPickupAlert.donationId) {
        await fetch(`${apiBase}/donations/${selectedPickupAlert.donationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'confirmed',
          }),
        });
      }

      if (selectedPickupAlert.donorUserId) {
        await fetch(`${apiBase}/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: selectedPickupAlert.donorUserId,
            message: `Your material donation for "${selectedPickupAlert.title}" has been confirmed by the organization for pickup.`,
            type: 'pickup-confirmed',
            is_read: false,
          }),
        });
      }

      setPickups((prev) => prev.map((item) => (
        Number(item.id) === Number(selectedPickupAlert.id)
          ? { ...item, status: 'confirmed' }
          : item
      )));
      setDonations((prev) => prev.map((item) => (
        Number(item.id) === Number(selectedPickupAlert.donationId)
          ? { ...item, status: 'confirmed' }
          : item
      )));
      setSelectedPickupAlert(null);
    } catch {
      // Keep the modal open if the request fails so the organization can retry.
    } finally {
      setConfirmingPickup(false);
    }
  };

  return (
    <div className="org-page">
      <OrganizationSidebar />

      <main className="org-main">
        <Topbar
          notifications={notifications}
          setNotifications={setNotifications}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

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
              {campaignPerformance.length === 0 && searchTerm.trim() ? <p>No campaigns found for "{searchTerm}".</p> : null}
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
                  {donationRows.length === 0 && searchTerm.trim() ? (
                    <tr>
                      <td colSpan="5">No donations found for "{searchTerm}".</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </article>
          </div>

          <aside className="org-right-column">
            <article className="org-pickup-card">
              <div className="org-section-head">
                <h3>Pickup Alerts</h3>
                <span className="org-small-badge">{pickupAlerts.length} New</span>
              </div>

              {pickupAlerts.map((item) => (
                <section key={item.id} className="org-alert-item">
                  <div className="org-alert-head">
                    <h4>{item.title}</h4>
                    <span>{item.when}</span>
                  </div>
                  <p>{item.donorName} • {item.quantity}x {item.itemName}</p>
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
              {pickupAlerts.length === 0 && searchTerm.trim() ? <p>No pickup alerts found for "{searchTerm}".</p> : null}
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
              <div className="org-pickup-modal-top">
                <div>
                  <span className={`org-pickup-modal-badge ${selectedPickupAlert.status}`}>
                    {selectedPickupAlert.status === 'confirmed' ? 'Pickup Confirmed' : 'Awaiting Confirmation'}
                  </span>
                  <h3 id="org-pickup-modal-title">Coordinate Pickup</h3>
                  <p className="org-pickup-modal-copy">Review this pickup request and confirm the next step with real campaign and donor data.</p>
                </div>
              </div>

              <div className="org-pickup-modal-card">
                <div className="org-pickup-modal-details">
                  <div>
                    <span>Campaign</span>
                    <strong>{selectedPickupAlert.title}</strong>
                  </div>
                  <div>
                    <span>Donor</span>
                    <strong>{selectedPickupAlert.donorName}</strong>
                  </div>
                  <div>
                    <span>Items</span>
                    <strong>{selectedPickupAlert.quantity}x {selectedPickupAlert.itemName}</strong>
                  </div>
                  <div>
                    <span>Pickup Address</span>
                    <strong>{selectedPickupAlert.location}</strong>
                  </div>
                  <div>
                    <span>Schedule</span>
                    <strong>{selectedPickupAlert.when}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>{selectedPickupAlert.status}</strong>
                  </div>
                </div>
              </div>

              <div className="org-pickup-modal-note">
                <strong>Next step</strong>
                <p>
                  {selectedPickupAlert.status === 'confirmed'
                    ? 'The donor has already been notified that this pickup was confirmed.'
                    : 'Confirm pickup to notify the donor and move this request into the confirmed pickup workflow.'}
                </p>
              </div>

              <div className="org-pickup-modal-actions">
                <button type="button" className="org-pickup-modal-btn secondary" onClick={() => setSelectedPickupAlert(null)}>
                  Close
                </button>
                <button
                  type="button"
                  className="org-pickup-modal-btn primary"
                  onClick={handleConfirmPickup}
                  disabled={confirmingPickup || selectedPickupAlert.status === 'confirmed'}
                >
                  {selectedPickupAlert.status === 'confirmed'
                    ? 'Pickup Confirmed'
                    : confirmingPickup
                      ? 'Confirming...'
                      : 'Confirm Pickup'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
