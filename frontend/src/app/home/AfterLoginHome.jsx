import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  FileText,
  Award,
  Star,
  Smile,
  Leaf
} from 'lucide-react';
import './afterLoginHome.css';
import { fetchCampaigns, getCampaignStorageFileUrl } from '@/services/campaign-service.js';
import { getSession } from '@/services/session-service.js';

const DASHBOARD_CACHE_KEY = 'donor_home_dashboard_v1';
const DASHBOARD_CACHE_MAX_AGE_MS = 5 * 60 * 1000;
const LAST_OPENED_CAMPAIGN_KEY = 'chomnuoy_last_opened_campaign';

function getLoggedInUserName() {
  const session = getSession();
  const name = typeof session?.name === 'string' ? session.name.trim() : '';
  return name || 'Donor';
}

function formatMoney(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '$0.00';
  return `$${number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getImpactLevel(totalDonated) {
  if (totalDonated >= 2000) return 'Level 5 Donor';
  if (totalDonated >= 1000) return 'Level 4 Donor';
  if (totalDonated >= 500) return 'Level 3 Donor';
  if (totalDonated >= 200) return 'Level 2 Donor';
  return 'Level 1 Donor';
}

function readDashboardCache() {
  try {
    const raw = window.sessionStorage.getItem(DASHBOARD_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed?.timestamp) return null;
    if (Date.now() - parsed.timestamp > DASHBOARD_CACHE_MAX_AGE_MS) {
      window.sessionStorage.removeItem(DASHBOARD_CACHE_KEY);
      return null;
    }
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

function writeDashboardCache(data) {
  try {
    window.sessionStorage.setItem(
      DASHBOARD_CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch {
    // Ignore cache write failures.
  }
}

function getActivityIcon(iconType) {
  switch (String(iconType || '').toLowerCase()) {
    case 'badge':
      return Star;
    default:
      return FileText;
  }
}

function getInitials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'OR';
}

function formatRelativePostDate(value) {
  if (!value) return 'Recently';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Recently';

  const diffMs = Date.now() - parsed.getTime();
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function resolveOrganizationAvatar(organization) {
  return (
    organization?.avatar_url ||
    getCampaignStorageFileUrl(organization?.avatar_path) ||
    organization?.image_url ||
    ''
  );
}

function normalizeCachedActivity(activityData) {
  if (!Array.isArray(activityData)) return [];

  return activityData.map((item, index) => ({
    id: item?.id ?? `cached-activity-${index}`,
    iconType:
      typeof item?.iconType === 'string'
        ? item.iconType
        : typeof item?.type === 'string'
          ? item.type
          : 'notification',
    text: item?.text || 'Notification:',
    note: item?.note || 'New update available.',
    time: item?.time || '',
  }));
}

function mapUrgentCampaigns(campaignsData) {
  const campaignItems = Array.isArray(campaignsData) ? campaignsData : [];

  return campaignItems
    .slice()
    .sort((a, b) => {
      const progressA = a.goalAmount ? a.raisedAmount / a.goalAmount : 0;
      const progressB = b.goalAmount ? b.raisedAmount / b.goalAmount : 0;
      const urgencyA = a.isUrgent ? -1 : 0;
      const urgencyB = b.isUrgent ? -1 : 0;
      return urgencyA - urgencyB || progressA - progressB;
    })
    .map((item) => {
      const progress = item.goalAmount ? Math.min(100, Math.round((item.raisedAmount / item.goalAmount) * 100)) : 0;
      const isEndingSoon = typeof item.daysLeft === 'number' ? item.daysLeft > 0 && item.daysLeft <= 5 : false;
      return {
        id: item.id,
        image: item.image,
        badge: isEndingSoon ? 'ENDING SOON' : 'URGENT',
        badgeTone: isEndingSoon ? 'ending' : 'urgent',
        title: item.title || 'Untitled Campaign',
        description: item.summary || 'No description provided.',
        raised: formatMoney(item.raisedAmount) + ' raised',
        progressLabel: `${progress}%`,
        progress,
        rawCampaign: item,
      };
    })
    .slice(0, 2);
}

function mapOrganizationPosts(campaignsData, organizationsData) {
  const campaignItems = Array.isArray(campaignsData) ? campaignsData : [];
  const organizationMap = new Map(
    (Array.isArray(organizationsData) ? organizationsData : []).map((item) => [Number(item.id), item])
  );

  return campaignItems
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .map((item) => {
      const organization = organizationMap.get(Number(item.organizationId));
      const organizationName =
        organization?.name ||
        item.organization ||
        'Verified Organization';
      const organizationAvatar = resolveOrganizationAvatar(organization);
      return {
        id: item.id,
        organizationName,
        organizationAvatar,
        organizationInitials: getInitials(organizationName),
        postDate: formatRelativePostDate(item.createdAt || item.startDate),
        chip: item.goalAmount ? `${formatMoney(item.goalAmount)} goal` : (item.timeLeft || 'Live campaign'),
        title: item.title || 'Untitled Campaign',
        body: item.summary || item.description || 'No description provided.',
        image: item.image || '',
        rawCampaign: item,
      };
    })
    .slice(0, 3);
}

function mapDonationMetrics(donationsData, userId) {
  const donations = Array.isArray(donationsData) ? donationsData : [];
  const myDonations = userId
    ? donations.filter((item) => Number(item.user_id) === userId)
    : [];
  const total = myDonations.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthTotal = myDonations.reduce((sum, item) => {
    const created = new Date(item.created_at || 0).getTime();
    if (!Number.isNaN(created) && created >= monthStart) {
      return sum + Number(item.amount || 0);
    }
    return sum;
  }, 0);

  return {
    totalDonated: total,
    monthlyTotal: monthTotal,
  };
}

function mapActivity(notificationsData, userId) {
  const notifications = Array.isArray(notificationsData) ? notificationsData : [];
  const filtered = userId
    ? notifications.filter((item) => {
        const recipientType = String(item.recipient_type || '').toLowerCase();
        const recipientId = Number(item.recipient_id || 0);
        if (recipientType) {
          return recipientType === 'user' && recipientId === userId;
        }
        return Number(item.user_id) === userId;
      })
    : [];

  return filtered.slice(0, 4).map((item) => {
    const type = String(item.type || '').toLowerCase();
    return {
      id: item.id,
      iconType: type,
      text: type === 'campaign' ? 'Campaign update:' : 'Notification:',
      note: item.message || 'New update available.',
      time: new Date(item.created_at || Date.now()).toLocaleString(),
    };
  });
}

function OrganizationPostCard({ item, index, onOpen }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(item.image) && !imageFailed;
  const statusLabel = String(item.chip || '').trim() || 'Live campaign';
  const previewLabel = item.rawCampaign?.campaignType === 'material' ? 'Material drive' : 'Fundraising campaign';

  return (
    <article
      className={`dashboard-org-post ${index === 0 ? 'is-featured' : ''}`}
    >
      <div className="dashboard-org-post-head-row">
        <div className="dashboard-org-post-brand">
          {item.organizationAvatar ? (
            <img src={item.organizationAvatar} alt={item.organizationName} />
          ) : (
            <span className="dashboard-org-post-avatar-fallback" aria-hidden="true">
              {item.organizationInitials}
            </span>
          )}
          <div>
            <strong>{item.organizationName}</strong>
            <span>{item.postDate}</span>
          </div>
        </div>
        <span className="dashboard-org-post-chip">{statusLabel}</span>
      </div>

      <div className="dashboard-org-post-content">
        <div className="dashboard-org-post-copy">
          <h3>{item.title}</h3>
          <p>{item.body}</p>
        </div>

        <div className={`dashboard-org-post-media ${showImage ? 'has-image' : 'is-placeholder'}`}>
          {showImage ? (
            <img
              src={item.image}
              alt={item.title}
              className="dashboard-org-post-image"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="dashboard-org-post-image-placeholder" aria-hidden="true">
              <span className="dashboard-org-post-image-badge">{previewLabel}</span>
              <strong>{item.organizationInitials}</strong>
              <p>{item.organizationName}</p>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        className="dashboard-org-post-action"
        onClick={() => onOpen({ rawCampaign: item.rawCampaign, id: item.id })}
      >
        View Campaign
      </button>
    </article>
  );
}

function AfterLoginHome() {
  const navigate = useNavigate();
  const donorName = useMemo(() => getLoggedInUserName(), []);
  const cachedDashboard = useMemo(() => readDashboardCache(), []);
  const [campaigns, setCampaigns] = useState(Array.isArray(cachedDashboard?.campaigns) ? cachedDashboard.campaigns : []);
  const [organizationPosts, setOrganizationPosts] = useState(Array.isArray(cachedDashboard?.organizationPosts) ? cachedDashboard.organizationPosts : []);
  const [activity, setActivity] = useState(normalizeCachedActivity(cachedDashboard?.activity));
  const [totalDonated, setTotalDonated] = useState(Number(cachedDashboard?.totalDonated || 0));
  const [monthlyTotal, setMonthlyTotal] = useState(Number(cachedDashboard?.monthlyTotal || 0));
  const [loading, setLoading] = useState(!cachedDashboard);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = getSession();
    const userId = Number(session?.userId ?? 0);
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    let active = true;
    setError('');
    if (!cachedDashboard) {
      setLoading(true);
    }

    const nextCache = {
      campaigns: Array.isArray(cachedDashboard?.campaigns) ? cachedDashboard.campaigns : [],
      organizationPosts: Array.isArray(cachedDashboard?.organizationPosts) ? cachedDashboard.organizationPosts : [],
      activity: normalizeCachedActivity(cachedDashboard?.activity),
      totalDonated: Number(cachedDashboard?.totalDonated || 0),
      monthlyTotal: Number(cachedDashboard?.monthlyTotal || 0),
    };
    let pendingRequests = 3;

    const finishRequest = () => {
      pendingRequests -= 1;
      if (pendingRequests <= 0 && active) {
        setLoading(false);
      }
    };

    Promise.all([
      fetchCampaigns(),
      fetch(`${apiBase}/organizations`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([campaignsData, organizationsData]) => {
        if (!active) return;
        const urgent = mapUrgentCampaigns(campaignsData);
        const posts = mapOrganizationPosts(campaignsData, organizationsData);
        setCampaigns(urgent);
        setOrganizationPosts(posts);
        nextCache.campaigns = urgent;
        nextCache.organizationPosts = posts;
        writeDashboardCache(nextCache);
      })
      .catch(() => {
        if (!active) return;
        setError('Failed to load some dashboard data.');
      })
      .finally(finishRequest);

    fetch(`${apiBase}/donations`)
      .then((r) => (r.ok ? r.json() : []))
      .then((donationsData) => {
        if (!active) return;
        const metrics = mapDonationMetrics(donationsData, userId);
        setTotalDonated(metrics.totalDonated);
        setMonthlyTotal(metrics.monthlyTotal);
        nextCache.totalDonated = metrics.totalDonated;
        nextCache.monthlyTotal = metrics.monthlyTotal;
        writeDashboardCache(nextCache);
      })
      .catch(() => {
        if (!active) return;
        setError('Failed to load some dashboard data.');
      })
      .finally(finishRequest);

    fetch(`${apiBase}/notifications`)
      .then((r) => (r.ok ? r.json() : []))
      .then((notificationsData) => {
        if (!active) return;
        const mapped = mapActivity(notificationsData, userId);
        setActivity(mapped);
        nextCache.activity = mapped;
        writeDashboardCache(nextCache);
      })
      .catch(() => {
        if (!active) return;
        setError('Failed to load some dashboard data.');
      })
      .finally(finishRequest);

    return () => {
      active = false;
    };
  }, []);

  const monthlyGoal = 250;
  const monthlyPercent = monthlyGoal ? Math.min(100, Math.round((monthlyTotal / monthlyGoal) * 100)) : 0;
  const impactLevel = getImpactLevel(totalDonated);

  const openCampaignDetail = (campaign) => {
    const persistedCampaign = campaign.rawCampaign || null;
    if (!persistedCampaign) return;
    const isMaterialCampaign = String(
      persistedCampaign.campaignType || persistedCampaign.campaign_type || (persistedCampaign.materialItem || persistedCampaign.material_item ? 'material' : '')
    )
      .toLowerCase()
      .includes('material');
    window.localStorage.setItem(LAST_OPENED_CAMPAIGN_KEY, JSON.stringify(persistedCampaign));
    navigate(`/campaigns/${campaign.id}`, {
      state: {
        from: '/AfterLoginHome',
        campaign: persistedCampaign,
        openCheckout: isMaterialCampaign,
      },
    });
  };

  return (
    <div className="dashboard-home">
      <main className="dashboard-content">
        <section className="welcome-grid">
          <div className="welcome-copy">
            <h1>Welcome back, {donorName}!</h1>
            <p>
              You've helped 5 local communities this month through your
              contributions.
            </p>
          </div>

          <article className="metric-card">
            <span>TOTAL DONATED</span>
            <strong>{formatMoney(totalDonated)}</strong>
          </article>

          <article className="metric-card is-blue">
            <span>CURRENT IMPACT</span>
            <strong>
              <Users size={16} /> {impactLevel}
            </strong>
          </article>
        </section>

        <section className="goal-card">
          <div className="goal-head">
            <h2>
              <Award size={17} /> Monthly Donation Goal
            </h2>
            <p>{monthlyPercent}% Achieved</p>
          </div>

          <div
            className="goal-track"
            role="img"
            aria-label={`${monthlyPercent} percent achieved`}
          >
            <span style={{ width: `${monthlyPercent}%` }} />
          </div>

          <div className="goal-meta">
            <span>{formatMoney(monthlyTotal)} raised</span>
            <span>{formatMoney(monthlyGoal)} goal</span>
          </div>
        </section>

        <section className="dashboard-main-grid">
          <div className="dashboard-main-left">
            <div className="section-head">
              <h2>Urgent Campaigns</h2>
              <Link to="/campaigns">View all</Link>
            </div>

            <div className="campaign-grid">
              {campaigns.map((item) => (
                <article className="campaign-card" key={item.id}>
                  <div
                    className="campaign-image"
                    style={{
                      backgroundImage: `url(${item.image})`,
                    }}
                  >
                    <span
                      className={`campaign-badge ${item.badgeTone}`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <div className="campaign-body">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>

                    <div
                      className="campaign-progress"
                      role="img"
                      aria-label={`${item.progressLabel} funded`}
                    >
                      <span
                        style={{
                          width: `${item.progress}%`,
                        }}
                      />
                    </div>

                    <div className="campaign-meta">
                      <strong>{item.raised}</strong>
                      <span>{item.progressLabel}</span>
                    </div>

                    <button type="button" onClick={() => openCampaignDetail(item)}>Donate Now</button>
                  </div>
                </article>
              ))}
              {!loading && campaigns.length === 0 ? (
                <p className="text-sm text-[#64748B]">No urgent campaigns available.</p>
              ) : null}
            </div>

            <section className="dashboard-org-posts-section">
              <div className="section-head dashboard-post-head">
                <h2>Latest From Organizations</h2>
                <Link to="/organizations">See organizations</Link>
              </div>

              <div className="dashboard-org-posts">
                {organizationPosts.map((item, index) => (
                  <OrganizationPostCard
                    key={item.id}
                    item={item}
                    index={index}
                    onOpen={openCampaignDetail}
                  />
                ))}
                {!loading && organizationPosts.length === 0 ? (
                  <p className="text-sm text-[#64748B]">No organization posts available yet.</p>
                ) : null}
              </div>
            </section>

            <section className="personalized">
              <h2>Personalized For You</h2>

              <div className="personalized-grid">
                <article>
                  <span className="topic-icon blue">
                    <Smile size={18} />
                  </span>
                  <div>
                    <strong>Child Education</strong>
                    <p>3 new campaigns match your history</p>
                  </div>
                </article>

                <article>
                  <span className="topic-icon green">
                    <Leaf size={18} />
                  </span>
                  <div>
                    <strong>Environmental Care</strong>
                    <p>Based on your recent follow: SaveMekong</p>
                  </div>
                </article>
              </div>
            </section>
          </div>

          <aside className="dashboard-sidebar">
            <section className="activity-card">
              <h2>
                <FileText size={18} /> Recent Activity
              </h2>

              <ul>
                {activity.map((item) => {
                  const ActivityIcon = getActivityIcon(item.iconType);
                  return (
                    <li key={item.id}>
                      <span className="activity-icon">
                        <ActivityIcon size={16} />
                      </span>
                      <div>
                        <p>{item.text}</p>
                        <strong>{item.note}</strong>
                        <span>{item.time}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {!loading && activity.length === 0 ? (
                <p className="text-sm text-[#64748B]">No recent activity yet.</p>
              ) : null}

              <button
                type="button"
                className="outline-btn"
              >
                See All Activity
              </button>
            </section>

            <section className="cta-card">
              <span className="cta-card-eyebrow">CREATE A CAMPAIGN</span>
              <h3>Want to do more?</h3>
              <p>
                Start your own fundraising campaign for a cause
                you care about.
              </p>
              <div className="cta-card-highlights">
                <span>Tell your story</span>
                <span>Reach donors faster</span>
              </div>
              <Link to="/campaigns/donor" className="cta-start-link">
                Start Campaign
              </Link>
            </section>
          </aside>
        </section>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </main>
    </div>
  );
}

export default AfterLoginHome;
