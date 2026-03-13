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

const placeholderImage =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#c7d2fe"/><stop offset="100%" stop-color="#fef3c7"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><text x="50%" y="50%" font-size="28" font-family="Arial" text-anchor="middle" fill="#334155">Campaign</text></svg>'
  );

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

export default function App() {
  const [selectedFilter, setSelectedFilter] = useState('All Campaigns');
  const [visibleCount, setVisibleCount] = useState(6);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
    setLoading(true);
    setError('');
    fetch(`${apiBase}/campaigns`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load campaigns (${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        const items = Array.isArray(data) ? data : [];
        const activeOnly = items.filter(
          (item) => String(item.status || '').toLowerCase() === 'active'
        );
        const mapped = activeOnly.map((item) => {
          const goal = Number(item.goal_amount || 0);
          const raised = Number(item.current_amount || 0);
          const timeLeft = getTimeLeft(item.end_date);
          const daysLeft = getDaysLeft(item.end_date);
          return {
            id: item.id,
            title: item.title || "Untitled Campaign",
            description: item.description || "No description provided.",
            image: item.image_path || placeholderImage,
            category: item.category || "General",
            raised,
            goal,
            timeLeft,
            isUrgent: typeof daysLeft === "number" ? daysLeft > 0 && daysLeft <= 3 : false,
          };
        });
        setCampaigns(mapped);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load campaigns.");
        setCampaigns([]);
      })
      .finally(() => setLoading(false));
  }, []);
  
  const filteredCampaigns = useMemo(() => campaigns.filter(campaign => {
    if (selectedFilter === 'All Campaigns') return true;
    if (selectedFilter === 'Urgent') return campaign.isUrgent;
    if (selectedFilter === 'Newest') return campaign.isNew;
    return campaign.category === selectedFilter;
  }), [campaigns, selectedFilter]);
  const visibleCampaigns = filteredCampaigns.slice(0, visibleCount);
  const hasMoreCampaigns = visibleCount < filteredCampaigns.length;

  useEffect(() => {
    setVisibleCount(6);
  }, [selectedFilter]);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome & Stats Summary */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Active Fundraising Campaigns</h1>
            <p className="text-slate-600 mt-1">Hello, Alex. You've helped 12 causes this year. Keep the momentum going!</p>
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

        {/* Filters Section */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 px-2 no-scrollbar">
            <button 
              onClick={() => setSelectedFilter('All Campaigns')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedFilter === 'All Campaigns' 
                  ? 'bg-primary text-white' 
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> All Campaigns
            </button>
            <button 
              onClick={() => setSelectedFilter('Urgent')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedFilter === 'Urgent' 
                  ? 'bg-red-500 text-white' 
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <AlertCircle className="w-4 h-4 text-red-500" /> Urgent
            </button>
            <button 
              onClick={() => setSelectedFilter('Newest')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedFilter === 'Newest' 
                  ? 'bg-blue-500 text-white' 
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <Zap className="w-4 h-4" /> Newest
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
            <button 
              onClick={() => setSelectedFilter('Education')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedFilter === 'Education' 
                  ? 'bg-purple-500 text-white' 
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Education
            </button>
            <button 
              onClick={() => setSelectedFilter('Medical')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedFilter === 'Medical' 
                  ? 'bg-blue-500 text-white' 
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <Stethoscope className="w-4 h-4 text-blue-400" /> Medical
            </button>
            <button 
              onClick={() => setSelectedFilter('Environment')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedFilter === 'Environment' 
                  ? 'bg-green-500 text-white' 
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <Leaf className="w-4 h-4 text-green-500" /> Environment
            </button>
          </div>
          <div className="md:ml-auto px-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all">
              <Filter className="w-4 h-4" /> More Filters
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading campaigns...</p>
        ) : null}
        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : null}

        {/* Campaign Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {visibleCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} {...campaign} />
          ))}
        </div>

        {/* Load More */}
        <div className="mt-16 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => current + 3)}
            disabled={!hasMoreCampaigns}
            className="inline-flex items-center gap-2 px-8 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {hasMoreCampaigns ? 'View More Campaigns' : 'No More Campaigns'}
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  );
}
