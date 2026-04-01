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
import { fetchCampaigns } from '@/services/campaign-service.js';
import { getSession } from '@/services/session-service.js';

const DASHBOARD_CACHE_KEY = 'donor_home_dashboard_v1';
const DASHBOARD_CACHE_MAX_AGE_MS = 5 * 60 * 1000;
const LAST_OPENED_CAMPAIGN_KEY = 'chomnuoy_last_opened_campaign_v2';
const USD_TO_KHR_RATE = 4100;

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

function isSuccessfulPaymentStatus(status) {
  const value = String(status || '').trim().toUpperCase();
  return ['COMPLETED', 'SUCCESS', 'CONFIRMED', 'PAID'].includes(value);
}

function isSuccessfulDonationStatus(status) {
  const value = String(status || '').trim().toUpperCase();
  return ['COMPLETED', 'SUCCESS', 'CONFIRMED', 'PAID', 'RECURRING'].includes(value);
}

function normalizeCurrency(currency) {
  return String(currency || 'USD').trim().toUpperCase() === 'KHR' ? 'KHR' : 'USD';
}

function convertToUsdAmount(amount, currency = 'USD') {
  const numericAmount = Number(amount || 0);
  if (!Number.isFinite(numericAmount)) return 0;
  return normalizeCurrency(currency) === 'KHR' ? numericAmount / USD_TO_KHR_RATE : numericAmount;
}

function extractCampaignIdFromBillNumber(billNumber) {
  const raw = String(billNumber || '').trim();
  const match = raw.match(/^DON-(\d+)-/i);
  return match ? Number(match[1]) : 0;
}

function findBestMatchingPayment({ donation, payments, matchedPaymentIds }) {
  const donationAmount = Number(donation?.amount || 0);
  const donationUserId = Number(donation?.user_id || 0);
  const donationCampaignId = Number(donation?.campaign_id || 0);
  const donationTime = new Date(donation?.created_at || 0).getTime();

  return payments
    .filter((payment) => !matchedPaymentIds.has(Number(payment.id)))
    .filter((payment) => isSuccessfulPaymentStatus(payment.status))
    .filter((payment) => Number(payment.user_id || 0) === donationUserId)
    .filter((payment) => Number(payment.amount || 0) === donationAmount)
    .filter((payment) => {
      const paymentCampaignId = extractCampaignIdFromBillNumber(payment.bill_number);
      return !donationCampaignId || !paymentCampaignId || paymentCampaignId === donationCampaignId;
    })
    .map((payment) => {
      const paymentTime = new Date(payment.paid_at || payment.created_at || 0).getTime();
      return {
        payment,
        timeDifference: Math.abs(paymentTime - donationTime),
      };
    })
    .filter(({ timeDifference }) => Number.isFinite(timeDifference) && timeDifference <= 60 * 60 * 1000)
    .sort((a, b) => a.timeDifference - b.timeDifference)[0]?.payment ?? null;
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

function normalizeCachedCampaigns(campaignData) {
  if (!Array.isArray(campaignData)) return [];
  return campaignData.slice(0, 2);
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

function mapDonationMetrics(donationsData, paymentsData, userId) {
  const donations = Array.isArray(donationsData) ? donationsData : [];
  const payments = Array.isArray(paymentsData) ? paymentsData : [];
  const myDonations = userId
    ? donations.filter((item) => Number(item.user_id) === userId && String(item.donation_type || '').toLowerCase() === 'money')
    : [];
  const myPayments = userId
    ? payments.filter((item) => Number(item.user_id) === userId)
    : [];
  const paymentMap = new Map();
  const matchedPaymentIds = new Set();

  myPayments.forEach((item) => {
    const donationId = Number(item.donation_id || 0);
    if (donationId) {
      paymentMap.set(donationId, item);
    }
  });

  const successfulDonationRows = myDonations
    .filter((item) => isSuccessfulDonationStatus(item.status))
    .map((item) => {
      const payment = paymentMap.get(Number(item.id)) || findBestMatchingPayment({
        donation: item,
        payments: myPayments,
        matchedPaymentIds,
      });

      if (payment?.id) {
        matchedPaymentIds.add(Number(payment.id));
      }

      return {
        amountUsd: convertToUsdAmount(item.amount, payment?.currency),
        createdAt: new Date(item.created_at || 0).getTime(),
      };
    });

  const successfulDirectPaymentRows = myPayments
    .filter((item) => !matchedPaymentIds.has(Number(item.id)))
    .filter((item) => !Number(item.donation_id || 0))
    .filter((item) => isSuccessfulPaymentStatus(item.status))
    .map((item) => ({
      amountUsd: convertToUsdAmount(item.amount, item.currency),
      createdAt: new Date(item.paid_at || item.created_at || 0).getTime(),
    }));

  const successfulMoneyRows = [...successfulDonationRows, ...successfulDirectPaymentRows];
  const total = successfulMoneyRows.reduce((sum, item) => sum + item.amountUsd, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthTotal = successfulMoneyRows.reduce((sum, item) => {
    if (!Number.isNaN(item.createdAt) && item.createdAt >= monthStart) {
      return sum + item.amountUsd;
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

function AfterLoginHome() {
  const navigate = useNavigate();
  const donorName = useMemo(() => getLoggedInUserName(), []);
  const cachedDashboard = useMemo(() => readDashboardCache(), []);
  const [campaigns, setCampaigns] = useState(normalizeCachedCampaigns(cachedDashboard?.campaigns));
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
      campaigns: normalizeCachedCampaigns(cachedDashboard?.campaigns),
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

    fetchCampaigns()
      .then((campaignsData) => {
        if (!active) return;
        const urgent = mapUrgentCampaigns(campaignsData);
        setCampaigns(urgent);
        nextCache.campaigns = urgent;
        writeDashboardCache(nextCache);
      })
      .catch(() => {
        if (!active) return;
        setError('Failed to load some dashboard data.');
      })
      .finally(finishRequest);

    Promise.all([
      fetch(`${apiBase}/donations`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${apiBase}/payments`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([donationsData, paymentsData]) => {
        if (!active) return;
        const metrics = mapDonationMetrics(donationsData, paymentsData, userId);
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
              {campaigns.slice(0, 2).map((item) => (
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
              <h3>Want to do more?</h3>
              <p>
                Start your own fundraising campaign for a cause
                you care about.
              </p>
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
