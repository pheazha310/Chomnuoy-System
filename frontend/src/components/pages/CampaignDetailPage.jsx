import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Heart,
  Share2,
  ArrowLeft,
  Users,
  MapPin,
  Building2,
  Droplets,
  HandHeart,
  Trophy,
  Target,
  Clock,
  CheckCircle2,
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
  const params = useParams();
  const navigate = useNavigate();
  const [shareLabel, setShareLabel] = useState('Share');
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [selectedAmount, setSelectedAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState('');
  
  const resolvedCampaignId = campaignId ?? params.campaignSlug ?? params.id;
  const campaign = getCampaignById(resolvedCampaignId);

  if (!campaign) {
    return (
      <div className="campaign-not-found">
        <div className="not-found-content">
          <h1 className="not-found-title">Campaign Not Found</h1>
          <p className="not-found-text">The campaign you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/campaigns')}
            className="back-to-campaigns-btn"
          >
            <ArrowLeft size={18} />
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
  const creatorName =
    campaign.organization.replace(/\b(Org|Solutions|Collective|Tech)\b/g, '').trim() || campaign.organization;
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    const savedIds = getSavedCampaignIds();
    setIsSaved(savedIds.includes(campaign.id));
  }, [campaign.id]);

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

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    setCustomAmount(value);
    if (value && !isNaN(value)) {
      setSelectedAmount(parseFloat(value));
    }
  };

  return (
    <main className="campaign-detail-page">
      {/* Back Button */}
      <button className="detail-back-btn" onClick={() => navigate('/campaigns')}>
        <ArrowLeft size={18} />
        <span>Back to Campaigns</span>
      </button>

      {/* Hero Section */}
      <section className="campaign-hero">
        <div className="hero-image-container">
          <img src={campaign.image} alt={campaign.title} className="hero-image" />
          <div className="hero-overlay">
            <span className="hero-category-badge">{campaign.category}</span>
            {campaign.isUrgent && (
              <span className="hero-urgent-badge">
                <Clock size={14} /> Urgent
              </span>
            )}
          </div>
        </div>
        <div className="hero-content">
          <h1 className="hero-title">{campaign.title}</h1>
          <p className="hero-organization">by {creatorName}</p>
          <div className="hero-meta">
            <span className="hero-location">
              <MapPin size={16} />
              Kampong Speu, Cambodia
            </span>
            <span className="hero-days-left">
              <Clock size={16} />
              {daysToGo} days left
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="campaign-detail-grid">
        {/* Left Column - Content */}
        <div className="detail-content-column">
          {/* Progress Card - Mobile */}
          <div className="mobile-progress-card">
            <div className="progress-stats-row">
              <div>
                <span className="progress-amount">{formatCurrency(campaign.raisedAmount)}</span>
                <span className="progress-goal"> of {formatCurrency(campaign.goalAmount)}</span>
              </div>
              <span className="progress-percent">{percentRaised}%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${progressWidth}%` }} />
            </div>
            <div className="progress-meta">
              <span><Users size={14} /> {backers} donors</span>
              <span><Clock size={14} /> {daysToGo} days left</span>
            </div>
          </div>

          {/* Tabs */}
          <nav className="detail-tabs">
            <button 
              className={`detail-tab ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
            >
              About
            </button>
            <button 
              className={`detail-tab ${activeTab === 'updates' ? 'active' : ''}`}
              onClick={() => setActiveTab('updates')}
            >
              Updates (4)
            </button>
            <button 
              className={`detail-tab ${activeTab === 'organization' ? 'active' : ''}`}
              onClick={() => setActiveTab('organization')}
            >
              Organization
            </button>
          </nav>

          {/* About Section */}
          {activeTab === 'about' && (
            <article className="detail-section about-section">
              <h2 className="section-title">
                <Target size={20} />
                Project Impact
              </h2>
              <p className="section-description">
                {campaign.summary} Access to clean water is a fundamental human right, and this project installs reliable
                systems with long-term local maintenance.
              </p>
              
              <div className="impact-cards">
                <div className="impact-card">
                  <div className="impact-icon">
                    <Droplets size={24} />
                  </div>
                  <h3>5,000 Liters/Day</h3>
                  <p>Daily filtration capacity per village system.</p>
                </div>
                <div className="impact-card">
                  <div className="impact-icon">
                    <Users size={24} />
                  </div>
                  <h3>500+ Families</h3>
                  <p>Directly benefiting from safe water access.</p>
                </div>
                <div className="impact-card">
                  <div className="impact-icon">
                    <Trophy size={24} />
                  </div>
                  <h3>100% Success Rate</h3>
                  <p>All projects completed on time and operational.</p>
                </div>
                <div className="impact-card">
                  <div className="impact-icon">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3>Verified Project</h3>
                  <p>Verified by our team for authenticity.</p>
                </div>
              </div>

              <div className="section-image-container">
                <img
                  src="https://images.unsplash.com/photo-1541976844346-61c92498ea3c?auto=format&fit=crop&w=1200&q=80"
                  alt="Clean water project"
                  className="section-image"
                />
              </div>
            </article>
          )}

          {/* Updates Section */}
          {activeTab === 'updates' && (
            <article className="detail-section updates-section">
              <h2 className="section-title">Recent Updates</h2>
              <div className="updates-list">
                <div className="update-card">
                  <span className="update-date">Yesterday</span>
                  <h3>First Filtration Unit Arrived</h3>
                  <p>
                    The core components for the first solar filtration system have arrived at our central hub and are being
                    inspected by engineers.
                  </p>
                  <img
                    src="https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?auto=format&fit=crop&w=720&q=80"
                    alt="Filtration update"
                    className="update-image"
                  />
                </div>
                <div className="update-card">
                  <span className="update-date">{currentDate}</span>
                  <h3>Local team training completed</h3>
                  <p>Community technicians completed operational training for daily management and maintenance.</p>
                </div>
              </div>
            </article>
          )}

          {/* Organization Section */}
          {activeTab === 'organization' && (
            <article className="detail-section organization-section">
              <h2 className="section-title">About the Organization</h2>
              <div className="organization-card">
                <div className="org-header">
                  <div className="org-icon">
                    <Building2 size={32} />
                  </div>
                  <div>
                    <h3>{campaign.organization}</h3>
                    <p className="org-subtitle">Verified Organization</p>
                  </div>
                </div>
                <p className="org-description">
                  We are dedicated to providing sustainable clean water solutions to communities in need.
                  Our team works directly with local partners to ensure long-term success.
                </p>
                <div className="org-stats">
                  <div className="org-stat">
                    <span className="stat-value">50+</span>
                    <span className="stat-label">Projects Completed</span>
                  </div>
                  <div className="org-stat">
                    <span className="stat-value">$2.5M</span>
                    <span className="stat-label">Total Raised</span>
                  </div>
                  <div className="org-stat">
                    <span className="stat-value">10K+</span>
                    <span className="stat-label">Lives Impacted</span>
                  </div>
                </div>
                <button className="contact-org-btn">
                  <Building2 size={16} />
                  Contact Organizer
                </button>
              </div>
            </article>
          )}

          {/* Recent Donors */}
          <article className="detail-section donors-section">
            <h2 className="section-title">
              <Heart size={20} />
              Recent Donors
            </h2>
            <div className="donors-list">
              <div className="donor-card">
                <span className="donor-avatar donor-avatar-more">JD</span>
                <div className="donor-info">
                  <strong>John Doe</strong>
                  <span className="donor-amount">$50</span>
                  <span className="donor-time">2 hours ago</span>
                </div>
                <Heart size={18} className="donor-heart" />
              </div>
              <div className="donor-card">
                <span className="donor-avatar donor-avatar-image">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&q=80" alt="" />
                </span>
                <div className="donor-info">
                  <strong>Sarah Miller</strong>
                  <span className="donor-amount">$250</span>
                  <span className="donor-time">5 hours ago</span>
                </div>
                <Heart size={18} className="donor-heart liked" />
              </div>
              <div className="donor-card">
                <span className="donor-avatar donor-avatar-more">AK</span>
                <div className="donor-info">
                  <strong>Alex Kim</strong>
                  <span className="donor-amount">$100</span>
                  <span className="donor-time">1 day ago</span>
                </div>
                <Heart size={18} className="donor-heart" />
              </div>
            </div>
          </article>
        </div>

        {/* Right Column - Donation Card (Sticky) */}
        <aside className="detail-donation-column">
          <div className="donation-card-sticky">
            <div className="donation-card-header">
              <h2>Make a Difference</h2>
              <p>Your contribution helps bring clean water to those in need.</p>
            </div>

            {/* Progress */}
            <div className="donation-progress">
              <div className="donation-progress-header">
                <span className="donation-raised">{formatCurrency(campaign.raisedAmount)}</span>
                <span className="donation-goal">of {formatCurrency(campaign.goalAmount)}</span>
              </div>
              <div className="donation-progress-bar">
                <div className="donation-progress-fill" style={{ width: `${progressWidth}%` }} />
              </div>
              <div className="donation-progress-stats">
                <span><strong>{percentRaised}%</strong> raised</span>
                <span><strong>{backers}</strong> donors</span>
                <span><strong>{daysToGo}</strong> days left</span>
              </div>
            </div>

            {/* Amount Selection */}
            <div className="amount-selection">
              <p className="amount-label">Select Amount</p>
              <div className="amount-grid">
                {[10, 25, 50, 100, 250].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className={`amount-btn ${selectedAmount === amount && !customAmount ? 'active' : ''}`}
                    onClick={() => handleAmountSelect(amount)}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
              <div className="custom-amount">
                <span className="currency-symbol">$</span>
                <input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  className="custom-amount-input"
                />
              </div>
              {customAmount && (
                <p className="selected-amount-display">
                  You're donating: <strong>${selectedAmount.toFixed(2)}</strong>
                </p>
              )}
            </div>

            {/* Donate Button */}
            <button className="donate-now-btn" onClick={() => alert('Donation functionality coming soon!')}>
              <HandHeart size={18} />
              Donate Now
            </button>

            {/* Secondary Actions */}
            <div className="donation-secondary-actions">
              <button className="secondary-action-btn" onClick={handleSaveToggle}>
                <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <button className="secondary-action-btn" onClick={handleShare}>
                <Share2 size={16} />
                {shareLabel}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="trust-badges">
              <div className="trust-badge">
                <CheckCircle2 size={16} />
                <span>Secure payment</span>
              </div>
              <div className="trust-badge">
                <CheckCircle2 size={16} />
                <span>Tax deductible</span>
              </div>
              <div className="trust-badge">
                <CheckCircle2 size={16} />
                <span>Verified project</span>
              </div>
            </div>
          </div>

          {/* Organizer Card */}
          <article className="organizer-card-sidebar">
            <p className="organizer-label">Organized by</p>
            <div className="organizer-info">
              <div className="organizer-icon">
                <Building2 size={24} />
              </div>
              <div>
                <h4 className="organizer-name">{creatorName}</h4>
                <p className="organizer-org">{campaign.organization}</p>
              </div>
            </div>
            <button className="contact-organizer-btn">
              <Building2 size={16} />
              Contact Organizer
            </button>
          </article>

          {/* Location Card */}
          <article className="location-card-sidebar">
            <p className="location-label">Project Location</p>
            <div className="location-image-container">
              <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=720&q=80"
                alt="Project location map"
                className="location-sidebar-image"
              />
            </div>
            <p className="location-caption">
              <MapPin size={14} />
              Thpong district, Kampong Speu, Cambodia
            </p>
          </article>
        </aside>
      </section>
    </main>
  );
}

export default CampaignDetailPage;
