import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  FileText,
  Building2,
  Truck,
  Award,
  Star,
  Smile,
  Leaf
} from 'lucide-react';
import './afterLoginHome.css';

const placeholderImage =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#c7d2fe"/><stop offset="100%" stop-color="#fef3c7"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><text x="50%" y="50%" font-size="28" font-family="Arial" text-anchor="middle" fill="#334155">Campaign</text></svg>'
  );

function getLoggedInUserName() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    if (!raw) return 'Donor';

    const session = JSON.parse(raw);
    const name = typeof session?.name === 'string' ? session.name.trim() : '';
    return name || 'Donor';
  } catch {
    return 'Donor';
  }
}

function getSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStorageFileUrl(path) {
  if (!path) return '';
  const rawPath = String(path).trim();
  if (
    rawPath.startsWith('http://') ||
    rawPath.startsWith('https://') ||
    rawPath.startsWith('blob:') ||
    rawPath.startsWith('data:')
  ) {
    return rawPath;
  }
  const normalizedPath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const appBase = apiBase.replace(/\/api\/?$/, '');
  if (normalizedPath.startsWith('storage/')) {
    return `${appBase}/${normalizedPath}`;
  }
  return `${appBase}/storage/${normalizedPath}`;
}

function getDaysLeft(endDate) {
  if (!endDate) return null;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return null;
  const diffMs = end.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
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

function AfterLoginHome() {
  const donorName = useMemo(() => getLoggedInUserName(), []);
  const [campaigns, setCampaigns] = useState([]);
  const [activity, setActivity] = useState([]);
  const [totalDonated, setTotalDonated] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = getSession();
    const userId = Number(session?.userId ?? 0);
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      fetch(`${apiBase}/campaigns`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${apiBase}/donations`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${apiBase}/notifications`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([campaignsData, donationsData, notificationsData]) => {
        if (!active) return;
        const campaignItems = Array.isArray(campaignsData) ? campaignsData : [];
        const activeCampaigns = campaignItems.filter(
          (item) => String(item.status || '').toLowerCase() === 'active'
        );
        const urgent = activeCampaigns
          .map((item) => {
            const goal = Number(item.goal_amount || 0);
            const raised = Number(item.current_amount || 0);
            const progress = goal ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
            const daysLeft = getDaysLeft(item.end_date);
            const isEndingSoon = typeof daysLeft === 'number' ? daysLeft > 0 && daysLeft <= 5 : false;
            return {
              id: item.id,
              image: getStorageFileUrl(item.image_path) || placeholderImage,
              badge: isEndingSoon ? 'ENDING SOON' : 'URGENT',
              badgeTone: isEndingSoon ? 'ending' : 'urgent',
              title: item.title || 'Untitled Campaign',
              description: item.description || 'No description provided.',
              raised: formatMoney(raised) + ' raised',
              progressLabel: `${progress}%`,
              progress,
            };
          })
          .slice(0, 2);
        setCampaigns(urgent);

        const donations = Array.isArray(donationsData) ? donationsData : [];
        const myDonations = userId
          ? donations.filter((item) => Number(item.user_id) === userId)
          : [];
        const total = myDonations.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        setTotalDonated(total);

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const monthTotal = myDonations.reduce((sum, item) => {
          const created = new Date(item.created_at || 0).getTime();
          if (!Number.isNaN(created) && created >= monthStart) {
            return sum + Number(item.amount || 0);
          }
          return sum;
        }, 0);
        setMonthlyTotal(monthTotal);

        const notifications = Array.isArray(notificationsData) ? notificationsData : [];
        const filtered = userId
          ? notifications.filter((item) => Number(item.user_id) === userId)
          : notifications;
        const mapped = filtered.slice(0, 4).map((item) => {
          const type = String(item.type || '').toLowerCase();
          const icon = type === 'campaign'
            ? Building2
            : type === 'pickup'
              ? Truck
              : type === 'badge'
                ? Star
                : FileText;
          return {
            id: item.id,
            icon,
            text: type === 'campaign' ? 'Campaign update:' : 'Notification:',
            note: item.message || 'New update available.',
            time: new Date(item.created_at || Date.now()).toLocaleString(),
          };
        });
        setActivity(mapped);
      })
      .catch(() => {
        if (!active) return;
        setError('Failed to load dashboard data.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const monthlyGoal = 250;
  const monthlyPercent = monthlyGoal ? Math.min(100, Math.round((monthlyTotal / monthlyGoal) * 100)) : 0;
  const impactLevel = getImpactLevel(totalDonated);

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

                    <button type="button">Donate Now</button>
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
                {activity.map((item) => (
                  <li key={item.id}>
                    <span className="activity-icon">
                      <item.icon size={16} />
                    </span>
                    <div>
                      <p>{item.text}</p>
                      <strong>{item.note}</strong>
                      <span>{item.time}</span>
                    </div>
                  </li>
                ))}
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
              <button type="button">
                Start Campaign
              </button>
            </section>
          </aside>
        </section>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </main>
    </div>
  );
}

export default AfterLoginHome;
