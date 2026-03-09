import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CircleDollarSign,
  CirclePercent,
  Clock3,
  MoreHorizontal,
  PlusCircle,
  Rocket,
  Search,
  Users,
} from 'lucide-react';
import ROUTES from '@/constants/routes.js';
import OrganizationSidebar from './OrganizationSidebar.jsx';
import './organization.css';

const fallbackImages = [
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=640&q=80',
  'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=640&q=80',
  'https://images.unsplash.com/photo-1602154663343-89fe0bf541ab?auto=format&fit=crop&w=640&q=80',
];
const demoCampaignSeed = [
  {
    id: 'seed-1',
    title: 'Education for All: Rural Schools Development',
    category: 'Education',
    goal: 20000,
    raised: 12450,
    progress: 62,
    daysLeft: 15,
    status: 'Active',
    donors: 482,
    image: fallbackImages[0],
  },
  {
    id: 'seed-2',
    title: 'Mobile Medical Units for Remote Villages',
    category: 'Medical',
    goal: 45000,
    raised: 38200,
    progress: 85,
    daysLeft: 22,
    status: 'Active',
    donors: 1204,
    image: fallbackImages[1],
  },
  {
    id: 'seed-3',
    title: 'Clean Water Access in Northern Provinces',
    category: 'Infrastructure',
    goal: 15000,
    raised: 1500,
    progress: 10,
    daysLeft: 45,
    status: 'Active',
    donors: 42,
    image: fallbackImages[2],
  },
];
const demoCampaigns = Array.from({ length: 12 }).map((_, idx) => {
  const base = demoCampaignSeed[idx % demoCampaignSeed.length];
  const cycle = Math.floor(idx / demoCampaignSeed.length);
  const status = cycle === 3 ? 'Draft' : cycle === 2 ? 'Ended' : 'Active';
  const progressDelta = cycle * 8;
  return {
    ...base,
    id: `demo-${idx + 1}`,
    title: `${base.title}${cycle > 0 ? ` #${cycle + 1}` : ''}`,
    raised: Math.max(0, base.raised - cycle * 1300),
    progress: Math.max(0, base.progress - progressDelta),
    donors: Math.max(0, base.donors - cycle * 90),
    daysLeft: status === 'Ended' ? -5 : base.daysLeft + cycle * 4,
    status,
    image: fallbackImages[idx % fallbackImages.length],
  };
});

function getOrganizationSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getDaysLeft(endDate) {
  if (!endDate) return null;
  const end = new Date(endDate).getTime();
  const now = Date.now();
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
}

function getBadgeLabel(item) {
  if (item.status === 'Ended') return 'ENDED';
  if (item.status === 'Draft') return 'DRAFT';
  if (item.daysLeft !== null && item.daysLeft <= 15 && item.daysLeft >= 0) return 'URGENT';
  if (item.progress <= 15) return 'NEW';
  return 'ACTIVE';
}

function getInitials(name) {
  const value = String(name || '').trim();
  if (!value) return 'OR';
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function OrganizationCampaignsPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 3;

  useEffect(() => {
    let mounted = true;
    const session = getOrganizationSession();
    const orgId = Number(session?.userId ?? 0);
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${apiBase}/campaigns`);
        if (!response.ok) {
          throw new Error(`Failed to load campaigns (${response.status})`);
        }
        const data = await response.json();
        const own = Array.isArray(data) ? data.filter((item) => Number(item.organization_id) === orgId) : [];
        if (mounted) {
          setCampaigns(own);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unable to load campaigns');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const session = getOrganizationSession();
  const accountName = session?.name || 'Organization';
  const roleLabel = session?.role === 'Organization' ? 'Administrator' : (session?.role || 'Administrator');
  const accountInitials = getInitials(accountName);

  const normalized = useMemo(
    () =>
      campaigns.map((item, index) => {
        const goal = Number(item.goal_amount ?? 0);
        const raised = Number(item.current_amount ?? 0);
        const daysLeft = getDaysLeft(item.end_date);
        const ended = daysLeft !== null ? daysLeft < 0 : false;
        const rawStatus = String(item.status || '').toLowerCase();
        const status = rawStatus.includes('draft') ? 'Draft' : ended ? 'Ended' : 'Active';
        const progress = goal > 0 ? Math.max(0, Math.min(100, (raised / goal) * 100)) : 0;
        return {
          id: item.id,
          title: item.title || 'Untitled campaign',
          category: item.category || 'General',
          goal,
          raised,
          progress,
          daysLeft,
          status,
          donors: Number(item.donors_count ?? 0),
          image: item.image_url || fallbackImages[index % fallbackImages.length],
        };
      }),
    [campaigns]
  );
  const isUsingDemoData = normalized.length === 0 && !loading && !error;

  const dataSource = normalized.length > 0 ? normalized : demoCampaigns;

  const searched = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return dataSource.filter((item) => !q || item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q));
  }, [dataSource, searchTerm]);

  const filtered = useMemo(() => {
    if (activeTab === 'active') return searched.filter((item) => item.status === 'Active');
    if (activeTab === 'past') return searched.filter((item) => item.status === 'Ended');
    return searched.filter((item) => item.status === 'Draft');
  }, [searched, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchTerm]);

  const summary = useMemo(() => {
    const activeCount = dataSource.filter((item) => item.status === 'Active').length;
    const totalRaised = dataSource.reduce((sum, item) => sum + item.raised, 0);
    const avgCompletion = dataSource.length
      ? Math.round(dataSource.reduce((sum, item) => sum + item.progress, 0) / dataSource.length)
      : 0;
    return { activeCount, totalRaised, avgCompletion };
  }, [dataSource]);

  return (
    <div className="org-page">
      <OrganizationSidebar />
      <main className="org-main org-cpg-main">
        <header className="org-cpg-header">
          <h1>Campaign Management</h1>
          <div className="org-cpg-head-right">
            <label className="org-cpg-search">
              <Search size={14} />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search campaigns, donors, or categories..."
              />
            </label>
            <button type="button" className="org-cpg-create-btn">
              <PlusCircle size={14} />
              Create New Campaign
            </button>
            <button type="button" className="org-cpg-icon-btn" aria-label="Notifications">
              <Bell size={16} />
              <span className="org-cpg-icon-dot" aria-hidden="true" />
            </button>
            <div className="org-cpg-profile" title={accountName}>
              <div className="org-cpg-profile-text">
                <strong>{accountName}</strong>
                <span>{roleLabel}</span>
              </div>
              <span className="org-cpg-avatar">{accountInitials}</span>
            </div>
          </div>
        </header>

        <section className="org-cpg-kpis">
          <article className="org-cpg-kpi-card">
            <div className="org-cpg-kpi-head">
              <p>Total Active Campaigns</p>
              <span className="icon blue">
                <Rocket size={14} />
              </span>
            </div>
            <strong>{summary.activeCount}</strong>
            <small>v.s. last month</small>
          </article>
          <article className="org-cpg-kpi-card">
            <div className="org-cpg-kpi-head">
              <p>Total Funds Raised</p>
              <span className="icon green">
                <CircleDollarSign size={14} />
              </span>
            </div>
            <strong>${summary.totalRaised.toLocaleString()}</strong>
            <small>Across all campaigns</small>
          </article>
          <article className="org-cpg-kpi-card">
            <div className="org-cpg-kpi-head">
              <p>Avg. Completion Rate</p>
              <span className="icon amber">
                <CirclePercent size={14} />
              </span>
            </div>
            <strong>{summary.avgCompletion}%</strong>
            <small>Target reaching efficiency</small>
          </article>
        </section>

        <section className="org-cpg-panel">
          <div className="org-cpg-tabs">
            <button type="button" className={activeTab === 'active' ? 'is-active' : ''} onClick={() => setActiveTab('active')}>
              Active Campaigns
            </button>
            <button type="button" className={activeTab === 'past' ? 'is-active' : ''} onClick={() => setActiveTab('past')}>
              Past Campaigns
            </button>
            <button type="button" className={activeTab === 'drafts' ? 'is-active' : ''} onClick={() => setActiveTab('drafts')}>
              Drafts
            </button>
          </div>

          {isUsingDemoData ? (
            <p className="org-cpg-msg">No organization campaigns yet. Showing demo layout data.</p>
          ) : null}
          {loading ? <p className="org-cpg-msg">Loading campaigns...</p> : null}
          {!loading && error ? <p className="org-cpg-msg is-error">{error}</p> : null}
          {!loading && !error && visible.length === 0 ? <p className="org-cpg-msg">No campaigns found.</p> : null}

          {!loading && !error && visible.length > 0 ? (
            <div className="org-cpg-list">
              {visible.map((item) => {
                const badge = getBadgeLabel(item);
                return (
                  <article key={item.id} className="org-cpg-item">
                    <img src={item.image} alt={item.title} />
                    <div className="org-cpg-item-body">
                      <div className="org-cpg-item-meta">
                        <span className={`org-cpg-badge ${badge.toLowerCase()}`}>{badge}</span>
                        <span>Category: {item.category}</span>
                      </div>
                      <h3>{item.title}</h3>
                      <div className="org-cpg-item-fund">
                        <span>
                          Raised: <strong>${item.raised.toLocaleString()}</strong>
                        </span>
                        <span>
                          Goal: <strong>${item.goal.toLocaleString()}</strong>
                        </span>
                      </div>
                      <div className="org-cpg-progress">
                        <span style={{ width: `${item.progress}%` }} />
                      </div>
                      <div className="org-cpg-item-foot">
                        <span>
                          <Clock3 size={12} />
                          {item.daysLeft === null ? '-' : `${Math.max(0, item.daysLeft)} days left`}
                        </span>
                        <span>
                          <Users size={12} />
                          {item.donors.toLocaleString()} Donors
                        </span>
                      </div>
                    </div>
                    <div className="org-cpg-actions">
                      <button type="button" onClick={() => navigate(ROUTES.CAMPAIGN_DETAILS(String(item.id)))}>
                        View Details
                        <ArrowRight size={14} />
                      </button>
                      <button type="button" className="more" aria-label="More">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}

          <footer className="org-cpg-footer">
            <p>
              Showing {visible.length} of {filtered.length} {activeTab === 'past' ? 'past' : activeTab} campaigns
            </p>
            <div className="org-cpg-pagination">
              <button type="button" disabled={safePage <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                {'<'}
              </button>
              {Array.from({ length: totalPages }).slice(0, 5).map((_, idx) => {
                const pageNumber = idx + 1;
                return (
                  <button
                    type="button"
                    key={pageNumber}
                    className={safePage === pageNumber ? 'is-active' : ''}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button type="button" disabled={safePage >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
                {'>'}
              </button>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
