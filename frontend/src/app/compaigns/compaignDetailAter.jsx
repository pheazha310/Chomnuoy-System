import React, { useEffect, useState } from 'react';
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

const CAMPAIGNS = [
  {
    id: 'clean-water-for-villages',
    title: "Clean Water for Villages",
    description: "Providing sustainable clean water solutions for remote communities in sub-Saharan Africa. Your help can change lives.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDZQ5WqI404djBjtac5Fz6r7hTKzvdFzOC7xtPsmBYEvjAwoFjKSOAUsg7NjAqI3e5Ci9ebCJdvwN7nmEtRqaceE0hHFAmrgukUb9zVYexehzmTLAJ8GLAfa8PR2aEZlpAo773uOtmG1rHSqpknCI_TLcS8nFFU6ebB4aRe83hlPEb93U7FJEn8AEf6Mm-sO6LEC1HiPaPZm4BFQPwq7OHdOWhhth_YdphwY-J_ts6sYy3AyXuA7s9kZQ0Ph-YHe3hxuDNOin2xjTVp",
    category: "Environment",
    raised: 18450,
    goal: 25000,
    timeLeft: "3 days left",
    isUrgent: true
  },
  {
    id: 'books-for-rural-schools',
    title: "Books for Rural Schools",
    description: "Equipping rural school libraries with modern textbooks and digital learning resources to bridge the education gap.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD3rTWyzHHN8_GnkruqbYuHZiCtCyv8poqxjaGCbnVCszGrFAyomO6aZD_y0QrHZXPf8rambXZtUhQj7PJM0Hsipc96j87V0lZzGMNt5bhhhvuwvnSJxhaqQW9JDB3RIVgHcqenaidIFRm5ylyF9uSERXQncIB9nh8QOxjwbbEsi2jexglwzZZsxJVdWlhjRRd0t-cZrqjpR4DpXazIjB0yCTIFExgnQAxSpCN-wXOPPunbgvLhFPqpRBy14QlJh1JQDqZJzOewjD1Z",
    category: "Education",
    raised: 5200,
    goal: 12000,
    timeLeft: "12 days left"
  },
  {
    id: 'medical-aid-for-refugees',
    title: "Medical Aid for Refugees",
    description: "Funding mobile clinics to provide essential healthcare services and emergency medicines to displaced families.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA7cMFRe6hoTv1oVmbNDNJi3w9vxNJ4XiZ58JrnOyJNxv9RF6iy6ussa_C38R_XWGi4BuHIRhLTD1WA9r-wggo13jXUngMQnqIzQ_RSVDuRZ7dP1oKP2PaOvSiLUnT4SfBDtHjaIL0ZflhcmQqH8HH6cRRCU9CaDnhzk7UIZbt5JRo7iRLJ63J4nBl2s7fi6XLN3ysQ5Xi5-FV4vc1zr8pjv2NpKEm3uzSmtIWtPrFp7Q76hyiDwZqGaYJTrr3LM8iHMJWvWa2hUA0d",
    category: "Medical",
    raised: 42800,
    goal: 50000,
    timeLeft: "24 hours left"
  },
  {
    id: 'urban-forest-initiative',
    title: "Urban Forest Initiative",
    description: "Planting 5,000 trees across major metropolitan areas to combat heat islands and improve air quality.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDeEusVTlVpD8B4ufJUqUqSkfNvfgxmDNRR9-KTRoBtoLYUp9fbDl2ejywPrXO0b3nAY9UfsG7fFvWe_ZfdL6ztWgwfhQV_F8Xkrkvu0OoYhuJd_rHKVOlaaJDb-BVz-ThpogDWHVwnnuEzgLB64GJWghFEFEG7lGU5o1hTAIh4-me06Hv-kYlW0WsNVDD_wbvWPoH6lf2JuTmmFNPgQ42VogaMiE1XERvkh57Dm5TPoMrE31cg6IMmwEH5srYllSYUVvUYGjEg-Nbz",
    category: "Environment",
    raised: 1200,
    goal: 30000,
    timeLeft: "45 days left",
    isNew: true
  },
  {
    id: 'winter-warmth-drive',
    title: "Winter Warmth Drive",
    description: "Providing coats, blankets, and hot meals to those experiencing homelessness during the severe winter months.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBw9Y2dqtP6zBfyWnMaDgwrX8jw_23uupzwcONvRQXnv7VNT2yuivXkVBPSXvKda3tnlx4_kNOEwWQpsZKmuNsNE8nvDq7yic42fGBTjRseepxNXXYTQRBs6XoIs2Gds5RbCn6loNkUNOvP0XA48ZCOv0vWGTuhEul_Iwwn0dvTAYMxTvUpzL2gtsBM2oVjec-Erio0MuTvz40VtM_G0PHZ3KXiOymL2l07bp-ENBaD23S4uufAFDovSaNg8y7r6WhiNkXRT1cuiGY-",
    category: "Social Welfare",
    raised: 8900,
    goal: 10000,
    timeLeft: "5 days left"
  },
  {
    id: 'youth-coding-bootcamp',
    title: "Youth Coding Bootcamp",
    description: "Empowering underprivileged youth with digital skills through intensive 12-week coding and career preparation bootcamps.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBPW1ta5cOWkI1NriX9db0oENxLfSqRpRClDDtWDT2mB9R9KyGKnCFltSAhO3VXXSlCKCor7DgSoIO6JX5E77ZvJJtDDaTJoYKRwJ0SLA8xY5uKJdXLbE4f9tAegwX-KDx6ui0Tz68fazwTVcOnsdEWAb4DYYsOeGByttHt3ZN1wJiLCYdV4MV64u9QKaWS7M-7A5B1cltlHVT_gZwuyWRLBj3wRwUnMrco9_SUXD21AAtLmyfN89hzovt-w1dnPw-Ab3LCFAtI6y11",
    category: "Education",
    raised: 2500,
    goal: 15000,
    timeLeft: "28 days left"
  }
];

export default function App() {
  const [selectedFilter, setSelectedFilter] = useState('All Campaigns');
  const [visibleCount, setVisibleCount] = useState(6);
  
  const filteredCampaigns = CAMPAIGNS.filter(campaign => {
    if (selectedFilter === 'All Campaigns') return true;
    if (selectedFilter === 'Urgent') return campaign.isUrgent;
    if (selectedFilter === 'Newest') return campaign.isNew;
    return campaign.category === selectedFilter;
  });
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

        {/* Campaign Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {visibleCampaigns.map((campaign, index) => (
            <CampaignCard key={index} {...campaign} />
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
