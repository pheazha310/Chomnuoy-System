import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Share2, 
  Clock, 
  Users, 
  Target, 
  ArrowLeft,
  Calendar,
  MapPin,
  CheckCircle
} from 'lucide-react';

import { getCampaignById } from '../../data/campaigns';
import '../css/Campaigns.css';

const SAVED_CAMPAIGNS_STORAGE_KEY = 'chomnuoy_saved_campaigns';

function getSavedCampaignIds() {
  try {
    const raw = window.localStorage.getItem(SAVED_CAMPAIGNS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setSavedCampaignIds(ids) {
  window.localStorage.setItem(SAVED_CAMPAIGNS_STORAGE_KEY, JSON.stringify(ids));
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function CampaignDetailPage({ campaignId }) {
  const navigate = useNavigate();
  const [shareLabel, setShareLabel] = useState('Share');
  const [isSaved, setIsSaved] = useState(false);
  const campaign = getCampaignById(campaignId);

  if (!campaign) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Campaign Not Found</h1>
          <button 
            onClick={() => navigate('/campaigns/donor')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  const percentRaised = Math.round((campaign.raisedAmount / campaign.goalAmount) * 100);
  const progressWidth = Math.min(percentRaised, 100);
  const backers = Math.max(24, Math.round(campaign.raisedAmount / 35));
  const daysToGo = Math.max(5, 45 - Math.floor(campaign.raisedAmount / 5000));
  const creatorName = campaign.organization.replace(/\b(Org|Solutions|Collective|Tech)\b/g, '').trim() || campaign.organization;
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    const savedIds = getSavedCampaignIds();
    setIsSaved(savedIds.includes(campaignId));
  }, [campaignId]);

  async function handleShare() {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : `/campaigns/${campaign.id}`;
    const shareData = {
      title: campaign.title,
      text: `${campaign.title} - ${campaign.summary}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareLabel('Shared');
      } else {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareUrl);
        } else {
          const tempInput = document.createElement('textarea');
          tempInput.value = shareUrl;
          tempInput.setAttribute('readonly', '');
          tempInput.style.position = 'absolute';
          tempInput.style.left = '-9999px';
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
        }
        setShareLabel('Link Copied');
      }
    } catch {
      setShareLabel('Share Failed');
    } finally {
      window.setTimeout(() => setShareLabel('Share'), 1800);
    }
  }

  function handleSaveToggle() {
    const savedIds = getSavedCampaignIds();
    const nextSavedIds = savedIds.includes(campaign.id)
      ? savedIds.filter((id) => id !== campaign.id)
      : [...savedIds, campaign.id];

    setSavedCampaignIds(nextSavedIds);
    setIsSaved(nextSavedIds.includes(campaign.id));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button 
              onClick={() => navigate('/campaigns/donor')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Campaigns
            </button>
            <div className="flex items-center gap-4">
              <button 
                onClick={handleSaveToggle}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isSaved 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="h-96 bg-slate-200">
          <img 
            src={campaign.image} 
            alt={campaign.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                {campaign.category}
              </span>
              <span className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-full">
                Verified Project
              </span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">{campaign.title}</h1>
            <p className="text-xl text-white/90">{campaign.summary}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Progress Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Raised</p>
                  <p className="text-3xl font-bold text-slate-900">{formatCurrency(campaign.raisedAmount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600 mb-1">Goal</p>
                  <p className="text-xl font-medium text-slate-700">{formatCurrency(campaign.goalAmount)}</p>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>{percentRaised}% funded</span>
                <span>{formatCurrency(campaign.goalAmount - campaign.raisedAmount)} to go</span>
              </div>
            </div>

            {/* Campaign Details */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">About This Campaign</h2>
              <p className="text-slate-700 leading-relaxed mb-6">
                {campaign.summary} This campaign focuses on long-term impact through transparent milestones and verified local implementation. 
                Funding supports implementation, training, and maintenance so results continue after launch.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-slate-400 mt-1" />
                  <div>
                    <p className="font-medium text-slate-900">Organizer</p>
                    <p className="text-slate-600">{campaign.organization}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-slate-400 mt-1" />
                  <div>
                    <p className="font-medium text-slate-900">Time Left</p>
                    <p className="text-slate-600">{daysToGo} days</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Updates */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Campaign Updates</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-600 pl-4">
                  <p className="text-sm text-slate-600 mb-1">Today | Milestone Reached</p>
                  <h3 className="font-semibold text-slate-900 mb-1">{percentRaised}% of our goal reached</h3>
                  <p className="text-slate-700">
                    Thanks to supporters, this project has crossed a major funding milestone and key procurement can begin.
                  </p>
                </div>
                <div className="border-l-4 border-blue-600 pl-4">
                  <p className="text-sm text-slate-600 mb-1">{currentDate}</p>
                  <h3 className="font-semibold text-slate-900 mb-1">Community partners confirmed</h3>
                  <p className="text-slate-700">
                    Local teams finalized operations planning to ensure transparent rollout and regular reporting.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Donation Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 sticky top-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Make a Donation</h3>
              
              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[25, 50, 100, 250].map(amount => (
                  <button
                    key={amount}
                    className="py-2 px-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                  >
                    ${amount}
                  </button>
                ))}
              </div>
              
              {/* Donate Button */}
              <button
                onClick={() => alert('Donation functionality coming soon!')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Back this project
              </button>
              
              {/* Donor Count */}
              <div className="mt-4 text-center text-sm text-slate-600">
                <Users className="w-4 h-4 inline mr-1" />
                {backers} people have donated
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3">Why Donate With Us?</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-slate-700">Verified Campaign</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-slate-700">Tax Deductible</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-slate-700">Regular Updates</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-slate-700">100% Secure</span>
                </div>
              </div>
            </div>

            {/* Creator Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3">Project Creator</h3>
              <p className="font-medium text-slate-900 mb-1">{creatorName}</p>
              <p className="text-sm text-slate-600 mb-4">{campaign.organization}</p>
              <button className="w-full bg-slate-100 text-slate-700 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors">
                Contact Creator
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CampaignDetailPage;