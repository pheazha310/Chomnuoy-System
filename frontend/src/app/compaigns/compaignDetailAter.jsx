import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  CircleDollarSign,
  Filter,
  GraduationCap,
  HeartHandshake,
  LayoutGrid,
  Leaf,
  Stethoscope,
  Zap,
} from 'lucide-react';

import CampaignCard from './pageAfterDonorLogin.jsx';
import StatsCard from './StatsCard.jsx';
import { donorCampaigns } from './campaignData.js';

const FILTERS = [
  { key: 'all', label: 'All Campaigns', icon: LayoutGrid },
  { key: 'urgent', label: 'Urgent', icon: AlertCircle },
  { key: 'newest', label: 'Newest', icon: Zap },
  { key: 'education', label: 'Education', icon: GraduationCap },
  { key: 'medical', label: 'Medical', icon: Stethoscope },
  { key: 'environment', label: 'Environment', icon: Leaf },
];

function matchesFilter(campaign, filter) {
  if (filter === 'all') return true;
  if (filter === 'urgent') return Boolean(campaign.isUrgent);
  if (filter === 'newest') return Boolean(campaign.isNew);
  if (filter === 'education') return campaign.category === 'Education';
  if (filter === 'medical') return campaign.category === 'Medical';
  if (filter === 'environment') return campaign.category === 'Environment';
  return true;
}

export default function DonorCampaignsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const PAGE_SIZE = 4;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredCampaigns = useMemo(
    () => donorCampaigns.filter((campaign) => matchesFilter(campaign, activeFilter)),
    [activeFilter],
  );
  const visibleCampaigns = filteredCampaigns.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCampaigns.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeFilter]);

  function handleViewMore() {
    if (hasMore) {
      setVisibleCount((count) => count + PAGE_SIZE);
      return;
    }
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Active Fundraising Campaigns</h1>
            <p className="mt-1">Discover verified projects and support the causes you care about.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <StatsCard
              label="Total Donated"
              value="$1,250.00"
              icon={<CircleDollarSign className="w-6 h-6" />}
              iconBg="bg-primary/10"
              iconColor="text-primary"
            />
            <StatsCard
              label="Impact Score"
              value="850"
              icon={<HeartHandshake className="w-6 h-6" />}
              iconBg="bg-green-500/10"
              iconColor="text-green-600"
            />
          </div>
        </div>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 px-1">
              {FILTERS.map((item) => {
                const Icon = item.icon;
                const isActive = activeFilter === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveFilter(item.key)}
                    className={[
                      'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all',
                      isActive
                        ? 'border-blue-600 bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)]'
                        : 'border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <Icon className={['h-4 w-4', isActive ? 'text-white' : 'text-slate-500'].join(' ')} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="md:ml-auto px-1">
              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                <Filter className="h-4 w-4 text-slate-500" />
                More Filters
              </button>
            </div>
          </div>
        </section>

        <div className="mb-6 flex items-center justify-between">
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-bold text-white">
              {filteredCampaigns.length}
            </span>
            Showing campaign(s)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {visibleCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} {...campaign} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <button
            type="button"
            onClick={handleViewMore}
            className="inline-flex items-center gap-2 rounded-2xl border border-blue-700 bg-gradient-to-r from-blue-700 to-blue-600 px-10 py-3.5 font-extrabold text-white shadow-[0_10px_26px_rgba(29,78,216,0.35)] transition-all hover:translate-y-[-1px] hover:from-blue-800 hover:to-blue-700"
          >
            {hasMore ? 'View More Campaigns' : 'Show Fewer'}
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      </main>
    </div>
  );
}
