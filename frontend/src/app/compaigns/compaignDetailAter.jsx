import React, { useEffect, useMemo, useState } from 'react';
import { 
  LayoutGrid, 
  AlertCircle, 
  Zap, 
  GraduationCap, 
  Stethoscope, 
  Leaf, 
  Filter, 
  ChevronDown,
  CircleDollarSign,
  HeartHandshake
} from 'lucide-react';
import CampaignCard from './pageAfterDonorLogin';
import StatsCard from './StatsCard';

const CAMPAIGNS_CACHE_KEY = 'donor_campaigns_cache_v1';
const DONOR_METRICS_CACHE_KEY = 'donor_campaign_metrics_cache_v1';
const CACHE_MAX_AGE_MS = 5 * 60 * 1000;

const placeholderImage =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#c7d2fe"/><stop offset="100%" stop-color="#fef3c7"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><text x="50%" y="50%" font-size="28" font-family="Source Sans 3, Noto Sans Khmer, sans-serif" text-anchor="middle" fill="#334155">Campaign</text></svg>'
  );

const resolveCampaignImage = (item) => {
  const candidates = [item?.image_url, item?.image, item?.image_path];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return '';
};

const getStorageFileUrl = (path) => {
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
  const relativePath = normalizedPath.startsWith('storage/')
    ? normalizedPath.replace(/^storage\//, '')
    : normalizedPath;
  const encodedPath = relativePath
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `${apiBase}/files/${encodedPath}`;
};

const getTimeLeft = (endDate) => {
  if (!endDate) return "Ongoing";
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return "Ongoing";
  const diffMs = end.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Ended";
  if (diffDays === 1) return "1 day left";
  if (diffDays < 7) return `${diffDays} days left`;
  const weeks = Math.ceil(diffDays / 7);
  return `${weeks} weeks left`;
};

const getDaysLeft = (endDate) => {
  if (!endDate) return null;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return null;
  const diffMs = end.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const normalizeCategory = (value) => {
  const key = String(value || '').toLowerCase();
  if (key.includes('education')) return 'Education';
  if (key.includes('health') || key.includes('medical')) return 'Medical';
  if (key.includes('environment') || key.includes('water')) return 'Environment';
  if (key.includes('disaster')) return 'Disaster Relief';
  return 'General';
};

const readCache = (key) => {
  try {
    const raw = window.sessionStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed?.timestamp) return null;
    if (Date.now() - parsed.timestamp > CACHE_MAX_AGE_MS) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    return parsed.data ?? null;
  } catch {
    return null;
  }
};

const writeCache = (key, data) => {
  try {
    window.sessionStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      data,
    }));
  } catch {
    // Ignore storage write failures.
  }
};

const mapCampaigns = (items) => {
  const activeOnly = items.filter((item) => {
    const status = String(item.status || '').toLowerCase();
    return !status || status === 'active';
  });

  return activeOnly.map((item) => {
    const materialItem = (() => {
      if (item.material_item && typeof item.material_item === 'object') return item.material_item;
      if (typeof item.material_item === 'string') {
        try {
          return JSON.parse(item.material_item);
        } catch {
          return null;
        }
      }
      return null;
    })();
    const goal = Number(item.goal_amount || 0);
    const raised = Number(item.current_amount || 0);
    const timeLeft = getTimeLeft(item.end_date);
    const daysLeft = getDaysLeft(item.end_date);
    const createdAt = item.created_at ? new Date(item.created_at).getTime() : 0;
    const categoryLabel = normalizeCategory(item.category);
    const isNew = createdAt ? Date.now() - createdAt <= 1000 * 60 * 60 * 24 * 14 : false;
    return {
      id: item.id,
      title: item.title || "Untitled Campaign",
      description: item.description || "No description provided.",
      image: getStorageFileUrl(resolveCampaignImage(item)) || placeholderImage,
      category: categoryLabel,
      normalizedCategory: categoryLabel,
      campaignType: item.campaign_type || (materialItem ? 'material' : 'monetary'),
      materialItem,
      organizationId: Number(item.organization_id ?? 0) || null,
      organization:
        item.organization_name ||
        item.organization ||
        (item.organization_id ? `Organization ${item.organization_id}` : 'Verified Organization'),
      location: item.organization_location || item.location || '',
      raised,
      goal,
      timeLeft,
      isUrgent: typeof daysLeft === "number" ? daysLeft > 0 && daysLeft <= 3 : false,
      isNew,
    };
  });
};

export default function App() {
  const cachedCampaigns = readCache(CAMPAIGNS_CACHE_KEY);
  const cachedMetrics = readCache(DONOR_METRICS_CACHE_KEY);
  const [selectedFilter, setSelectedFilter] = useState('All Campaigns');
  const [visibleCount, setVisibleCount] = useState(6);
  const [campaigns, setCampaigns] = useState(Array.isArray(cachedCampaigns) ? cachedCampaigns : []);
  const [loading, setLoading] = useState(!Array.isArray(cachedCampaigns) || cachedCampaigns.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(Boolean(cachedCampaigns));
  const [error, setError] = useState('');
  const [donorName, setDonorName] = useState('Donor');
  const [donorAvatar, setDonorAvatar] = useState('');
  const [totalDonated, setTotalDonated] = useState(Number(cachedMetrics?.totalDonated || 0));
  const [impactScore, setImpactScore] = useState(Number(cachedMetrics?.impactScore || 0));

  const getSession = () => {
    try {
      const raw = window.localStorage.getItem('chomnuoy_session');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const formatMoney = (value) => {
    const number = Number(value || 0);
    if (!Number.isFinite(number)) return '$0.00';
    return `$${number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
    if (!cachedCampaigns?.length) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError('');
    const session = getSession();
    const userId = Number(session?.userId ?? 0);
    const name = typeof session?.name === 'string' ? session.name.trim() : '';
    setDonorName(name || 'Donor');
    setDonorAvatar(typeof session?.avatar === 'string' ? session.avatar.trim() : '');
    fetch(`${apiBase}/campaigns`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load campaigns (${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        const items = Array.isArray(data) ? data : [];
        const mapped = mapCampaigns(items);
        setCampaigns(mapped);
        writeCache(CAMPAIGNS_CACHE_KEY, mapped);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load campaigns.");
        if (!cachedCampaigns?.length) {
          setCampaigns([]);
        }
      })
      .finally(() => {
        setLoading(false);
        setIsRefreshing(false);
      });

    fetch(`${apiBase}/donations`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        const items = Array.isArray(data) ? data : [];
        const myDonations = userId
          ? items.filter((item) => Number(item.user_id) === userId)
          : [];
        const total = myDonations.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        setTotalDonated(total);
        const uniqueOrgs = new Set(
          myDonations.map((item) => Number(item.organization_id)).filter(Boolean),
        );
        const score = Math.min(1000, 200 + uniqueOrgs.size * 30 + Math.floor(total / 25));
        setImpactScore(score);
        writeCache(DONOR_METRICS_CACHE_KEY, {
          totalDonated: total,
          impactScore: score,
        });
      })
      .catch(() => {
        if (!cachedMetrics) {
          setTotalDonated(0);
          setImpactScore(0);
        }
      });
  }, []);
  
  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter((campaign) => {
        if (selectedFilter === 'All Campaigns') return true;
        if (selectedFilter === 'Urgent') return campaign.isUrgent;
        if (selectedFilter === 'Newest') return campaign.isNew;
        return campaign.normalizedCategory === selectedFilter;
      }),
    [campaigns, selectedFilter],
  );
  const visibleCampaigns = filteredCampaigns.slice(0, visibleCount);
  const hasMoreCampaigns = visibleCount < filteredCampaigns.length;

  useEffect(() => {
    setVisibleCount(6);
  }, [selectedFilter]);

  const donorInitials = useMemo(() => {
    return (donorName || 'Donor')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'D';
  }, [donorName]);

  const filterButtons = [
    {
      key: 'All Campaigns',
      label: 'All Campaigns',
      icon: LayoutGrid,
      activeClass: 'border-blue-600 bg-blue-600 text-white shadow-sm',
      inactiveClass: 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/70',
    },
    {
      key: 'Urgent',
      label: 'Urgent',
      icon: AlertCircle,
      activeClass: 'border-red-200 bg-red-50 text-red-700 shadow-sm',
      inactiveClass: 'border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50/70 hover:text-red-700',
    },
    {
      key: 'Newest',
      label: 'Newest',
      icon: Zap,
      activeClass: 'border-slate-200 bg-slate-50 text-slate-700 shadow-sm',
      inactiveClass: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
    },
    {
      key: 'Education',
      label: 'Education',
      icon: GraduationCap,
      activeClass: 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm',
      inactiveClass: 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-indigo-700',
    },
    {
      key: 'Medical',
      label: 'Medical',
      icon: Stethoscope,
      activeClass: 'border-teal-200 bg-teal-50 text-teal-700 shadow-sm',
      inactiveClass: 'border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:bg-teal-50/70 hover:text-teal-700',
    },
    {
      key: 'Environment',
      label: 'Environment',
      icon: Leaf,
      activeClass: 'border-green-200 bg-green-50 text-green-700 shadow-sm',
      inactiveClass: 'border-slate-200 bg-white text-slate-700 hover:border-green-200 hover:bg-green-50/70 hover:text-green-700',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f8fc]">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Welcome & Stats Summary */}
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4 rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
              {donorAvatar ? (
                <img
                  src={donorAvatar}
                  alt={donorName}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,#e8f1ff_0%,#dbe9ff_100%)] text-xl font-black text-[#1f7de2]">
                  {donorInitials}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">Welcome back,</p>
              <h1 className="text-[2.35rem] font-black leading-none tracking-tight text-slate-950">{donorName}</h1>
              <p className="mt-1 text-sm text-slate-500">Explore active campaigns and continue supporting community needs.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <StatsCard 
              label="Total Donated" 
              value={formatMoney(totalDonated)} 
              icon={<CircleDollarSign className="w-6 h-6" />}
              iconBg="bg-primary/10"
              iconColor="text-primary"
            />
            <StatsCard 
              label="Impact Score" 
              value={impactScore.toLocaleString('en-US')} 
              icon={<HeartHandshake className="w-6 h-6" />}
              iconBg="bg-green-500/10"
              iconColor="text-green-600"
            />
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-8 flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filterButtons.map(({ key, label, icon: Icon, activeClass, inactiveClass }, index) => (
              <React.Fragment key={key}>
                {index === 3 ? <div className="mx-1 hidden h-6 w-px shrink-0 bg-slate-200 md:block" /> : null}
                <button
                  type="button"
                  onClick={() => setSelectedFilter(key)}
                  className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap transition-all ${
                    selectedFilter === key ? activeClass : inactiveClass
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{label}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
          <div className="md:ml-auto">
            <button
              type="button"
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 md:w-auto"
            >
              <Filter className="h-3.5 w-3.5 shrink-0 text-slate-500" /> More Filters
            </button>
          </div>
        </div>

        {isRefreshing && !loading ? (
          <p className="mb-4 text-sm font-medium text-slate-500">Refreshing campaigns...</p>
        ) : null}
        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : null}

        {/* Campaign Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {loading ? Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`campaign-skeleton-${index}`}
              className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm"
              aria-hidden="true"
            >
              <div className="h-40 animate-pulse bg-slate-200" />
              <div className="space-y-4 p-4">
                <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                <div className="h-6 w-4/5 animate-pulse rounded-full bg-slate-200" />
                <div className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
                <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200" />
                <div className="pt-2">
                  <div className="mb-2 h-3 w-full animate-pulse rounded-full bg-slate-200" />
                  <div className="h-10 w-full animate-pulse rounded-2xl bg-slate-200" />
                </div>
              </div>
            </div>
          )) : null}
          {visibleCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} {...campaign} />
          ))}
        </div>

        {/* Load More */}
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => current + 3)}
            disabled={!hasMoreCampaigns}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {hasMoreCampaigns ? 'View More Campaigns' : 'No More Campaigns'}
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </main>
    </div>
  );
}
