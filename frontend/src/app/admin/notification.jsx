import React, { useEffect, useMemo, useState } from 'react';
import AdminSidebar from './adminsidebar';
import './style.css';
import './notification.css';

const TABS = ['Primary', 'Mentions', 'Activity'];

const FILTERS = [
  { id: 'all', label: 'All Notifications' },
  { id: 'unread', label: 'Unread' },
  { id: 'critical', label: 'Critical Alerts' },
  { id: 'system', label: 'System Updates' },
  { id: 'archive', label: 'Archive' },
];

const NOTIFICATIONS = [
  {
    id: 1,
    category: 'Primary',
    title: 'New Analytics Report: Summer Flash Sale 2024',
    description:
      'Your broadcast reached 1.2M concurrent viewers, setting a new record this quarter. Check the detailed audience breakdown and conversion funnel now.',
    time: '2m ago',
    sortKey: 2,
    tone: 'primary',
    unread: true,
    actions: ['View Report', 'Dismiss'],
    icon: 'analytics',
    type: 'update',
  },
  {
    id: 2,
    category: 'Primary',
    title: 'System Performance Maintenance Scheduled',
    description:
      'Scheduled maintenance will occur on Sunday, Oct 15th at 02:00 UTC. Dashboard access may be limited for approximately 15 minutes.',
    time: '1h ago',
    sortKey: 60,
    tone: 'info',
    unread: false,
    icon: 'maintenance',
    type: 'system',
  },
  {
    id: 3,
    category: 'Primary',
    title: 'Low Latency Alert: US-East Nodes',
    description:
      'Spike detected in stream latency across New York and Virginia data centers. 15% drop in quality reported.',
    time: '4h ago',
    sortKey: 240,
    tone: 'danger',
    unread: true,
    actions: ['Investigate Nodes'],
    icon: 'alert',
    type: 'alert',
  },
  {
    id: 4,
    category: 'Mentions',
    title: 'Sarah Jenkins mentioned you in Q3 Revenue Broadcast',
    description: '"Great spike at 14:00 mark! Was this related to the social media push or the email blast?"',
    time: '1d ago',
    sortKey: 1440,
    tone: 'mention',
    unread: false,
    icon: 'mention',
    type: 'message',
    sender: 'Sarah Jenkins',
  },
  {
    id: 5,
    category: 'Activity',
    title: 'Profile Verification Successful',
    description: 'Your organization has been verified. You now have access to advanced streaming API features.',
    time: '3d ago',
    sortKey: 4320,
    tone: 'success',
    unread: false,
    icon: 'verified',
    type: 'update',
  },
  {
    id: 6,
    category: 'Primary',
    title: 'Campaign Milestone Reached: 10K Supporters',
    description: 'Your relief campaign passed 10,000 supporters. Keep the momentum with a new update.',
    time: '12m ago',
    sortKey: 12,
    tone: 'primary',
    unread: true,
    actions: ['Share Update'],
    icon: 'analytics',
    type: 'update',
  },
  {
    id: 7,
    category: 'Primary',
    title: 'Donation Surge Detected',
    description: 'Donations increased by 28% in the last hour. Consider scheduling a thank-you post.',
    time: '35m ago',
    sortKey: 35,
    tone: 'success',
    unread: false,
    icon: 'verified',
    type: 'update',
  },
  {
    id: 8,
    category: 'Mentions',
    title: 'Luis Ortega mentioned you in Emergency Aid Recap',
    description: '"The donor highlights were strong — can we expand this section next week?"',
    time: '6h ago',
    sortKey: 360,
    tone: 'mention',
    unread: true,
    icon: 'mention',
    type: 'message',
    sender: 'Luis Ortega',
  },
  {
    id: 9,
    category: 'Activity',
    title: 'Scheduled Broadcast Reminder',
    description: 'Your live update is scheduled for tomorrow at 09:00. Prepare your talking points.',
    time: '10h ago',
    sortKey: 600,
    tone: 'info',
    unread: true,
    icon: 'maintenance',
    type: 'system',
  },
  {
    id: 10,
    category: 'Activity',
    title: 'New Subscriber Segment Ready',
    description: 'A new subscriber segment is available based on donor engagement over the last 30 days.',
    time: '2d ago',
    sortKey: 2880,
    tone: 'primary',
    unread: false,
    icon: 'analytics',
    type: 'update',
  },
  {
    id: 11,
    category: 'Mentions',
    title: 'Aimee Parker sent a follow-up message',
    description: '"Can we highlight the donor leaderboard on the next broadcast?"',
    time: '3h ago',
    sortKey: 180,
    tone: 'mention',
    unread: true,
    icon: 'mention',
    type: 'message',
    sender: 'Aimee Parker',
  },
];

const UNREAD_STORAGE_KEY = 'admin_notifications_unread';
const READ_MAP_STORAGE_KEY = 'admin_notifications_read_map';

const FILTER_ICONS = {
  all: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  unread: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 8h16v8H4z" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="m4 8 8 5 8-5" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </svg>
  ),
  critical: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4 3 20h18L12 4Z" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M12 9v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.3" fill="currentColor" />
    </svg>
  ),
  system: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  archive: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h16v4H4z" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M6 9h12v10H6z" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M10 13h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};

const NOTIFICATION_ICONS = {
  analytics: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M7 13l3-3 2 2 4-5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  ),
  maintenance: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="6" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4 3 20h18L12 4Z" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M12 9v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.2" fill="currentColor" />
    </svg>
  ),
  mention: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 18a6 6 0 1 1 6-6v3a2 2 0 1 1-4 0v-3a2 2 0 1 0-4 0 3 3 0 0 0 3 3"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  ),
  verified: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 15 6l4 .7-2.7 3.5.6 4.2L12 13l-4.9 1.4.6-4.2L5 6.7 9 6l3-3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
      <path d="m9.5 12 1.7 1.7 3.6-3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
};

export default function AdminNotificationPage() {
  const [activeTab, setActiveTab] = useState('Primary');
  const [activeFilter, setActiveFilter] = useState('all');
  const [items, setItems] = useState([]);
  const [brokenAvatars, setBrokenAvatars] = useState({});
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [activeNotification, setActiveNotification] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [isReplySending, setIsReplySending] = useState(false);
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const sessionRaw = window.localStorage.getItem('chomnuoy_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const adminName = session?.name || 'Admin';
  const adminRole = session?.role || session?.accountType || 'Admin';

  const getStorageFileUrl = (path) => {
    if (!path) return '';
    const cleaned = String(path).trim();
    if (!cleaned) return '';
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      return cleaned;
    }
    const appBase = apiBase.replace(/\/api\/?$/, '');
    const normalized = cleaned.replace(/^\/+/, '');
    if (normalized.startsWith('storage/')) {
      return `${appBase}/${normalized}`;
    }
    return `${appBase}/storage/${normalized}`;
  };

  const getInitials = (value) => {
    if (!value) return '';
    return String(value)
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleLogout = () => {
    window.localStorage.removeItem('chomnuoy_session');
    window.localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
      if (item.category !== activeTab) return false;
      if (item.type === 'reply' && activeFilter !== 'system') return false;
      if (activeFilter === 'unread') return item.unread;
      if (activeFilter === 'critical') return item.tone === 'danger';
      if (activeFilter === 'system') return item.tone === 'info';
      if (activeFilter === 'archive') return item.archived;
      return true;
      })
      .sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0));
  }, [items, activeFilter, activeTab]);

  const unreadCount = items.filter((item) => item.unread).length;
  const criticalCount = items.filter((item) => item.tone === 'danger').length;

  const loadReadMap = () => {
    const raw = window.localStorage.getItem(READ_MAP_STORAGE_KEY);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  const saveReadMap = (nextMap) => {
    window.localStorage.setItem(READ_MAP_STORAGE_KEY, JSON.stringify(nextMap));
  };

  const syncUnreadCount = (nextItems) => {
    const nextCount = nextItems.filter((item) => item.unread).length;
    window.localStorage.setItem(UNREAD_STORAGE_KEY, String(nextCount));
    window.dispatchEvent(new Event('admin-notify-updated'));
  };

  useEffect(() => {
    syncUnreadCount(items);
  }, [items]);

  const parseMessageDetails = (rawMessage = '') => {
    const lines = String(rawMessage).split('\n').map((line) => line.trim()).filter(Boolean);
    const fromLine = lines.find((line) => line.toLowerCase().startsWith('from:')) || '';
    const subjectLine = lines.find((line) => line.toLowerCase().startsWith('subject:')) || '';
    const messageLine = lines.find((line) => line.toLowerCase().startsWith('message:')) || '';
    const fromValue = fromLine.replace(/^from:\s*/i, '');
    const fromMatch = fromValue.match(/^(.*?)<\s*([^>]+)\s*>$/);
    const fromName = fromMatch ? fromMatch[1].trim() : fromValue;
    const fromEmail = fromMatch ? fromMatch[2].trim() : '';
    const subjectValue = subjectLine.replace(/^subject:\s*/i, '');
    const messageValue = messageLine.replace(/^message:\s*/i, '');
    return {
      from: fromName || null,
      fromEmail: fromEmail || null,
      subject: subjectValue || null,
      body: messageValue || rawMessage,
    };
  };

  useEffect(() => {
    let active = true;
    const token = window.localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch(`${apiBase}/notifications`, { headers }).then((response) => (response.ok ? response.json() : [])),
      fetch(`${apiBase}/users`, { headers }).then((response) => (response.ok ? response.json() : [])),
      fetch(`${apiBase}/organizations`, { headers }).then((response) => (response.ok ? response.json() : [])),
    ])
      .then(([data, usersData, organizationsData]) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        const usersList = Array.isArray(usersData) ? usersData : [];
        const organizationsList = Array.isArray(organizationsData) ? organizationsData : [];
        const usersById = new Map();
        const organizationsById = new Map();
        usersList.forEach((user) => {
          if (user?.id) {
            const avatarRaw =
              user.avatar_url ||
              user.profile_image ||
              user.avatar ||
              user.image_url ||
              user.photo ||
              user.picture ||
              user.avatar_path ||
              '';
            const avatarUrl = getStorageFileUrl(avatarRaw);
            usersById.set(Number(user.id), {
              id: user.id,
              name: user.name || 'User',
              email: user.email || '',
              avatarUrl,
            });
          }
        });
        organizationsList.forEach((organization) => {
          if (organization?.id) {
            organizationsById.set(Number(organization.id), {
              id: organization.id,
              name: organization.name || 'Organization',
            });
          }
        });
        const readMap = loadReadMap();
        const mapped = list
          .filter((item) => {
            const recipientType = String(item.recipient_type || '').toLowerCase();
            const type = String(item.type || '').toLowerCase();
            if (recipientType) {
              return recipientType === 'admin';
            }
            return type === 'message' || type === 'campaign';
          })
          .map((item) => {
          const type = String(item.type || '').toLowerCase();
          const createdAt = item.created_at ? new Date(item.created_at) : new Date();
          const minutesAgo = Math.max(1, Math.round((Date.now() - createdAt.getTime()) / 60000));
          const parsed = parseMessageDetails(item.message || '');
          const sender = usersById.get(Number(item.user_id)) || null;
          const organization = organizationsById.get(Number(item.user_id)) || null;
          const senderType = String(item.sender_type || (type === 'campaign' ? 'organization' : '')).toLowerCase();
          const senderName = senderType === 'organization'
            ? (item.sender_name || organization?.name || 'Organization')
            : (item.sender_name || parsed.from || sender?.name || 'User');
          const senderEmail = senderType === 'organization'
            ? (item.sender_email || '')
            : (item.sender_email || parsed.fromEmail || sender?.email || '');
          const senderAvatarUrl = senderType === 'user' ? (sender?.avatarUrl || '') : '';
          const title = type === 'message'
            ? senderName
            : parsed.subject
              ? parsed.subject
              : type === 'reply'
                ? 'Admin reply'
                : senderType === 'organization'
                  ? `Post by ${senderName}`
                  : `Message from ${senderName}`;
          const isReadFromServer = Boolean(item.is_read);
          const isReadLocally = Boolean(readMap[item.id]);
          const isUnread = !(isReadFromServer || isReadLocally);
          return {
            id: item.id,
            userId: item.user_id,
            category: type === 'message' || type === 'reply' ? 'Mentions' : 'Primary',
            title,
            description: parsed.body || item.message || 'New update available.',
            time: minutesAgo < 60 ? `${minutesAgo}m ago` : createdAt.toLocaleString(),
            sortKey: minutesAgo,
            tone: type === 'message' ? 'mention' : (type === 'reply' ? 'info' : 'primary'),
            unread: isUnread,
            actions: type === 'message' ? ['Reply'] : undefined,
            icon: type === 'message' ? 'mention' : 'analytics',
            type: type || 'update',
            sender: senderName,
            senderEmail,
            senderAvatarUrl,
            senderType,
            source: 'api',
            replied: false,
          };
        });

        setItems(mapped);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
      });

    return () => {
      active = false;
    };
  }, [apiBase]);

  const markAllAsRead = () => {
    setItems((prev) => {
      const next = prev.map((item) => ({ ...item, unread: false }));
      const readMap = loadReadMap();
      next.forEach((item) => {
        readMap[item.id] = true;
      });
      saveReadMap(readMap);
      syncUnreadCount(next);
      return next;
    });
  };

  const dismissNotification = () => {};

  const markAsRead = (id) => {
    let targetSource = null;
    setItems((prev) => {
      const next = prev.map((item) => {
        if (item.id === id) {
          targetSource = item.source || null;
          return { ...item, unread: false };
        }
        return item;
      });
      const readMap = loadReadMap();
      readMap[id] = true;
      saveReadMap(readMap);
      syncUnreadCount(next);
      return next;
    });
    if (targetSource === 'api') {
      const token = window.localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      fetch(`${apiBase}/notifications/${id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true }),
      }).catch(() => {});
    }
  };

  const openDetails = (item) => {
    setActiveNotification(item);
    if (item.unread) {
      markAsRead(item.id);
    }
  };

  const closeDetails = () => {
    setActiveNotification(null);
    setReplyDraft('');
  };

  const handleReplySend = async () => {
    if (!replyDraft.trim() || !activeNotification) return;
    if (!activeNotification.userId) {
      setReplyDraft('');
      return;
    }
    setIsReplySending(true);
    const token = window.localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const response = await fetch(`${apiBase}/notifications`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: activeNotification.userId,
          sender_type: 'admin',
          sender_name: adminName,
          recipient_type: 'user',
          recipient_id: activeNotification.userId,
          message: replyDraft.trim(),
          type: 'reply',
          is_read: false,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to send reply.');
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === activeNotification.id ? { ...item, unread: false, replied: true } : item
        )
      );
      markAsRead(activeNotification.id);
      setReplyDraft('');
      closeDetails();
    } catch {
      setReplyDraft(replyDraft);
    } finally {
      setIsReplySending(false);
    }
  };

  return (
    <div className="admin-shell admin-notify-shell">
      <AdminSidebar onLogout={() => setIsLogoutOpen(true)} userName={adminName} userRole={adminRole} />

      <main className="admin-main admin-notify-main">
        <header className="admin-notify-header">
          <div className="admin-notify-header-left">
            <p className="admin-notify-kicker">Broadcast Intelligence Center</p>
            <h1>Notifications</h1>
          </div>
        </header>

        <section className="admin-notify-content">
          <div className="admin-notify-left">
            <div className="admin-notify-toolbar">
              <div className="admin-notify-tabs" role="tablist" aria-label="Notification categories">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`admin-notify-tab${activeTab === tab ? ' is-active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                    role="tab"
                    aria-selected={activeTab === tab}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="admin-notify-header-cards">
                <div className="admin-notify-header-card">
                  <span>Unread</span>
                  <strong>{unreadCount}</strong>
                </div>
                <div className="admin-notify-header-card">
                  <span>Critical</span>
                  <strong>{criticalCount}</strong>
                </div>
                <div className="admin-notify-header-card">
                  <span>Total</span>
                  <strong>{items.length}</strong>
                </div>
              </div>
            </div>

            <div className="admin-notify-list">
              {filteredItems.length === 0 ? (
                <div className="admin-notify-empty admin-notify-empty-card">
                  <div>
                    <h3>Nothing here yet</h3>
                    <p>No notifications match this view. Try another tab or filter.</p>
                  </div>
                </div>
              ) : null}
              {filteredItems.map((item) => (
                <article
                  key={item.id}
                  className={`admin-notify-card admin-notify-${item.tone}${item.unread ? ' is-unread' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetails(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      openDetails(item);
                    }
                  }}
                >
                  <div className="admin-notify-icon" aria-hidden="true">
                    {item.type === 'message' ? (
                      item.senderAvatarUrl && !brokenAvatars[item.id] ? (
                        <img
                          src={item.senderAvatarUrl}
                          alt=""
                          onError={() =>
                            setBrokenAvatars((prev) => ({ ...prev, [item.id]: true }))
                          }
                        />
                      ) : (
                        <span className="admin-notify-avatar-fallback">{getInitials(item.sender)}</span>
                      )
                    ) : (
                      NOTIFICATION_ICONS[item.icon] || NOTIFICATION_ICONS.analytics
                    )}
                  </div>
                  <div className="admin-notify-body">
                    <div className="admin-notify-topline">
                      <div className="admin-notify-title">
                        <h3>{item.title}</h3>
                        {item.senderEmail ? (
                          <span className="admin-notify-sender-email">{item.senderEmail}</span>
                        ) : null}
                      </div>
                      <time>{item.time}</time>
                    </div>
                    <p>{item.description}</p>
                    {item.actions ? (
                      <div className="admin-notify-actions">
                        {item.actions
                          .filter((action) => (action === 'Reply' ? item.unread : true))
                          .map((action) => (
                          <button
                            key={action}
                            type="button"
                            className={action === 'Dismiss' ? 'ghost' : ''}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (action === 'Reply') {
                                openDetails(item);
                              }
                            }}
                          >
                            {action}
                          </button>
                          ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>

            <button type="button" className="admin-notify-older">
              See older notifications
            </button>
          </div>

          <aside className="admin-notify-right">
            <div className="admin-notify-panel">
              <div className="admin-notify-panel-header">
                <div>
                  <h2>Notifications</h2>
                  <p>Stay updated with your broadcasts</p>
                </div>
                <span className="admin-notify-pill">{unreadCount} new</span>
              </div>
              {filteredItems.length === 0 ? (
                <div className="admin-notify-empty-mini">
                  No notifications in this view.
                </div>
              ) : null}
              <div className="admin-notify-filter-list">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    className={`admin-notify-filter${activeFilter === filter.id ? ' is-active' : ''}`}
                    onClick={() => setActiveFilter(filter.id)}
                  >
                    <span aria-hidden="true">{FILTER_ICONS[filter.id]}</span>
                    <span>{filter.label}</span>
                    {filter.id === 'unread' ? (
                      <span className="admin-notify-filter-count">{unreadCount}</span>
                    ) : null}
                  </button>
                ))}
              </div>
              <button type="button" className="admin-notify-mark" onClick={markAllAsRead}>
                Mark all as read
              </button>
            </div>

            <div className="admin-notify-panel admin-notify-brief">
              <h3>Channel Health</h3>
              <div className="admin-notify-brief-grid">
                <div>
                  <span>Live Viewers</span>
                  <strong>72.4K</strong>
                </div>
                <div>
                  <span>Avg. Watch</span>
                  <strong>16m 21s</strong>
                </div>
                <div>
                  <span>Drop Rate</span>
                  <strong>1.3%</strong>
                </div>
                <div>
                  <span>Engagement</span>
                  <strong>High</strong>
                </div>
              </div>
            </div>
          </aside>
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

      {activeNotification ? (
        <div className="admin-modal-overlay" role="presentation" onClick={closeDetails}>
          <div
            className="admin-modal admin-notify-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-notify-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-notify-detail-header">
              <div className={`admin-notify-detail-icon admin-notify-${activeNotification.tone}`}>
                {activeNotification.type === 'message' ? (
                  activeNotification.senderAvatarUrl && !brokenAvatars[activeNotification.id] ? (
                    <img
                      src={activeNotification.senderAvatarUrl}
                      alt=""
                      onError={() =>
                        setBrokenAvatars((prev) => ({ ...prev, [activeNotification.id]: true }))
                      }
                    />
                  ) : (
                    <span className="admin-notify-avatar-fallback">
                      {getInitials(activeNotification.sender)}
                    </span>
                  )
                ) : (
                  NOTIFICATION_ICONS[activeNotification.icon] || NOTIFICATION_ICONS.analytics
                )}
              </div>
              <div>
                <p className="admin-notify-detail-kicker">{activeNotification.type}</p>
                <h3 id="admin-notify-detail-title">{activeNotification.title}</h3>
                {activeNotification.senderEmail ? (
                  <span className="admin-notify-detail-sender">{activeNotification.senderEmail}</span>
                ) : null}
                <span className="admin-notify-detail-time">{activeNotification.time}</span>
              </div>
            </div>
            <p className="admin-notify-detail-body">{activeNotification.description}</p>

            {activeNotification.type === 'message' && activeNotification.unread ? (
              <div className="admin-notify-reply">
                <div className="admin-notify-reply-header">
                  <span>Reply to {activeNotification.sender || 'sender'}</span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Write your reply..."
                  value={replyDraft}
                  onChange={(event) => setReplyDraft(event.target.value)}
                />
                <div className="admin-notify-reply-actions">
                  <button type="button" className="admin-notify-reply-ghost" onClick={closeDetails}>
                    Cancel
                  </button>
                  <button type="button" className="admin-notify-reply-send" onClick={handleReplySend}>
                    Send Reply
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

