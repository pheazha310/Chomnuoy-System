import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
import {
  CAMPAIGNS_CACHE_KEY,
  fetchCampaigns,
} from '@/services/campaign-service.js';
import { getSession } from '@/services/session-service.js';

const DONOR_METRICS_CACHE_KEY = 'donor_campaign_metrics_cache_v1';
const CACHE_MAX_AGE_MS = 5 * 60 * 1000;

const normalizeDonationType = (value) => {
  const key = String(value || '').trim().toLowerCase();
  return key === 'material' || key === 'materials' ? 'material' : 'money';
};

const isSuccessfulDonationStatus = (value) => {
  const key = String(value || '').trim().toLowerCase();
  return ['completed', 'success', 'confirmed', 'paid'].includes(key);
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

export default function App() {
  const location = useLocation();
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

  const formatMoney = (value) => {
    const number = Number(value || 0);
    if (!Number.isFinite(number)) return '$0.00';
    return `$${number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  useEffect(() => {
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
    const apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

    Promise.all([
      fetchCampaigns(),
      fetch(`${apiBase}/donations`).then((response) => (response.ok ? response.json() : [])),
      fetch(`${apiBase}/material_items`).then((response) => (response.ok ? response.json() : [])),
    ])
      .then(([campaignData, donationsData, materialItemsData]) => {
        const donations = Array.isArray(donationsData) ? donationsData : [];
        const materialItems = Array.isArray(materialItemsData) ? materialItemsData : [];
        const materialQuantityByDonationId = new Map(
          materialItems.map((item) => [Number(item.donation_id), Math.max(1, Number(item.quantity || 1))]),
        );

        const campaignTotals = donations.reduce((map, item) => {
          const campaignId = Number(item.campaign_id || 0);
          if (!campaignId || !isSuccessfulDonationStatus(item.status)) return map;

          const current = map.get(campaignId) || { money: 0, material: 0 };
          const donationType = normalizeDonationType(item.donation_type);

          if (donationType === 'material') {
            current.material += materialQuantityByDonationId.get(Number(item.id)) || Math.max(1, Number(item.amount || 1));
          } else {
            current.money += Number(item.amount || 0);
          }

          map.set(campaignId, current);
          return map;
        }, new Map());

        const mapped = campaignData
          .filter((item) => {
            const status = String(item.status || '').toLowerCase();
            return !status || status === 'active';
          })
          .map((item) => {
            const isMaterialCampaign = String(item.campaignType || '').toLowerCase().includes('material');
            const totals = campaignTotals.get(Number(item.id || 0));
            const liveRaisedAmount = isMaterialCampaign
              ? Number(totals?.material || 0)
              : Number(item.raisedAmount ?? 0);

            return {
              ...item,
              raisedAmount: liveRaisedAmount,
              raised: liveRaisedAmount,
            };
          });

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
    () => {
      const searchTerm = new URLSearchParams(location.search).get('search')?.trim().toLowerCase() || '';
      return campaigns.filter((campaign) => {
        if (selectedFilter === 'All Campaigns') return true;
        if (selectedFilter === 'Urgent') return campaign.isUrgent;
        if (selectedFilter === 'Newest') return campaign.isNew;
        const categoryMatch = campaign.normalizedCategory === selectedFilter;
        if (!categoryMatch) return false;
        return true;
      }).filter((campaign) => {
        if (!searchTerm) return true;
        const haystack = [
          campaign.title,
          campaign.summary,
          campaign.organization,
          campaign.category,
          campaign.location,
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(searchTerm);
      });
    },
    [campaigns, location.search, selectedFilter],
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
