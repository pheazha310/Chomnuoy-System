import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import {
  Heart,
  Share2,
  ArrowLeft,
  Users,
  MapPin,
  Building2,
  Droplets,
  HandHeart,
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

function getSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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
  const location = useLocation();
  const [shareLabel, setShareLabel] = useState('Share');
  const [isSaved, setIsSaved] = useState(false);
  const presetAmounts = [10, 25, 50, 100, 250];
  const [selectedAmount, setSelectedAmount] = useState(25);
  const [customAmountInput, setCustomAmountInput] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('QR Payment');
  const [donationMessage, setDonationMessage] = useState('');
  const [locationState, setLocationState] = useState({
    loading: false,
    error: '',
    coords: null,
    lastUpdated: null,
  });
  const resolvedCampaignId = campaignId ?? params.campaignSlug ?? params.id;
  const campaign = getCampaignById(resolvedCampaignId);
  const session = getSession();
  const fallbackCampaignPath = session?.isLoggedIn && session?.role === 'Donor' ? '/campaigns/donor' : '/campaigns';
  const backTarget =
    typeof location.state?.from === 'string' && location.state.from.startsWith('/')
      ? location.state.from
      : fallbackCampaignPath;

  if (!campaign) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Campaign Not Found</h1>
          <button
            onClick={() => navigate(backTarget)}
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
  const creatorName =
    campaign.organization.replace(/\b(Org|Solutions|Collective|Tech)\b/g, '').trim() || campaign.organization;
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    const savedIds = getSavedCampaignIds();
    setIsSaved(savedIds.includes(campaign.id));
  }, [campaign.id]);

  function requestRealLocation() {
    if (!navigator.geolocation) {
      setLocationState({
        loading: false,
        error: 'Geolocation is not supported by your browser.',
        coords: null,
        lastUpdated: null,
      });
      return;
    }

    setLocationState((previous) => ({
      ...previous,
      loading: true,
      error: '',
    }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationState({
          loading: false,
          error: '',
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
          lastUpdated: new Date(),
        });
      },
      (error) => {
        const errorMessage =
          error.code === 1
            ? 'Location access denied. Enable location permission and try again.'
            : 'Unable to get your current location.';
        setLocationState({
          loading: false,
          error: errorMessage,
          coords: null,
          lastUpdated: null,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }

  useEffect(() => {
    requestRealLocation();
  }, []);

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

  function handleCustomAmountApply(event) {
    event.preventDefault();
    const parsed = Number(customAmountInput.replace(/[^\d.]/g, ''));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setDonationMessage('Please enter a valid custom amount greater than $0.');
      return;
    }

    const roundedAmount = Math.round(parsed);
    setSelectedAmount(roundedAmount);
    setDonationMessage(`Custom amount applied: $${roundedAmount.toLocaleString()}.`);
  }

  function handleDonateNow() {
    setDonationMessage(
      `Prepared donation of $${selectedAmount.toLocaleString()} via ${selectedPaymentMethod}. Checkout integration can be connected here.`,
    );
  }

  return (
    <main className="campaign-detail-page campaign-detail-v2">
      <Link to={backTarget} className="detail-back-link">
        <ArrowLeft size={16} /> Back to campaigns
      </Link>

      <section className="campaign-detail-layout campaign-detail-v2-layout" aria-label="Campaign detail">
        <div className="campaign-main-column">
          <article className="campaign-hero-panel campaign-hero-v2">
            <img src={campaign.image} alt={campaign.title} className="campaign-detail-image" referrerPolicy="no-referrer" />
            <div className="campaign-hero-overlay">
              <span className="campaign-category">{campaign.category}</span>
              <h1>{campaign.title}</h1>
              <p className="campaign-hero-location">
                <MapPin size={14} /> Kampong Speu, Cambodia
              </p>
            </div>
          </article>

          <nav className="campaign-tabs campaign-tabs-v2" aria-label="Campaign sections">
            <button type="button" className="tab-active">About</button>
            <button type="button">Updates (4)</button>
            <button type="button">Organization</button>
            <button type="button">Comments</button>
          </nav>

          <article className="campaign-about">
            <h2>Project Impact</h2>
            <p>
              {campaign.summary} Access to clean water is a fundamental human right, and this project installs reliable
              systems with long-term local maintenance.
            </p>
            <div className="campaign-pillars campaign-pillars-v2">
              <article>
                <h3><Droplets size={16} /> 5,000 Liters/Day</h3>
                <p>Daily filtration capacity per village system.</p>
              </article>
              <article>
                <h3><Users size={16} /> 500+ Families</h3>
                <p>Directly benefiting from safe water access.</p>
              </article>
            </div>
          </article>

          <article className="campaign-updates campaign-updates-v2">
            <h2>Recent Updates</h2>
            <div className="update-item">
              <p className="update-meta">Yesterday</p>
              <h3>First Filtration Unit Arrived</h3>
              <p>
                The core components for the first solar filtration system have arrived at our central hub and are being
                inspected by engineers.
              </p>
              <img
                src="https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?auto=format&fit=crop&w=720&q=80"
                alt="Filtration update"
                className="update-inline-image"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="update-item">
              <p className="update-meta">{currentDate}</p>
              <h3>Local team training completed</h3>
              <p>Community technicians completed operational training for daily management and maintenance.</p>
            </div>
          </article>

          <article className="campaign-updates campaign-donors-v2">
            <h2>Recent Donors</h2>
            <div className="donor-list-v2">
              <div className="donor-item-v2">
                <span className="donor-avatar donor-avatar-more">JD</span>
                <div>
                  <strong>John Doe</strong>
                  <p>Donated $50 - 2 hours ago</p>
                </div>
                <Heart size={14} />
              </div>
              <div className="donor-item-v2">
                <span className="donor-avatar donor-avatar-image">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&q=80" alt="" />
                </span>
                <div>
                  <strong>Sarah Miller</strong>
                  <p>Donated $250 - 5 hours ago</p>
                </div>
                <Heart size={14} className="liked" />
              </div>
            </div>
          </article>
        </div>

        <aside className="campaign-side-column">
          <article className="detail-stat-card detail-stat-v2">
            <p className="stat-amount">{formatCurrency(campaign.raisedAmount)}</p>
            <p className="stat-goal">raised of {formatCurrency(campaign.goalAmount)}</p>
            <div className="campaign-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progressWidth}>
              <span style={{ width: `${progressWidth}%` }} />
            </div>
            <div className="detail-mini-stats">
              <p><strong>{backers}</strong><span>Donors</span></p>
              <p><strong>{daysToGo}</strong><span>Days Left</span></p>
              <p><strong>{percentRaised}%</strong><span>Reached</span></p>
            </div>
            <div className="quick-amount-grid">
              {presetAmounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className={amount === selectedAmount ? 'is-selected' : ''}
                  onClick={() => {
                    setSelectedAmount(amount);
                    setDonationMessage('');
                  }}
                >
                  ${amount}
                </button>
              ))}
              <button
                type="button"
                className={!presetAmounts.includes(selectedAmount) ? 'is-selected' : ''}
                onClick={() => setDonationMessage('Enter a custom amount below, then press Apply.')}
              >
                Custom
              </button>
            </div>
            <form className="custom-amount-form" onSubmit={handleCustomAmountApply}>
              <label htmlFor="custom-amount-input">Custom amount (USD)</label>
              <div className="custom-amount-controls">
                <input
                  id="custom-amount-input"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  placeholder="Enter amount"
                  value={customAmountInput}
                  onChange={(event) => setCustomAmountInput(event.target.value)}
                />
                <button type="submit">Apply</button>
              </div>
            </form>
            <div className="payment-methods-inline" role="radiogroup" aria-label="Payment method">
              {['QR Payment', 'ABA Pay', 'Wing Bank'].map((method) => (
                <button
                  key={method}
                  type="button"
                  role="radio"
                  aria-checked={selectedPaymentMethod === method}
                  className={selectedPaymentMethod === method ? 'is-selected' : ''}
                  onClick={() => setSelectedPaymentMethod(method)}
                >
                  {method}
                </button>
              ))}
            </div>
            <p className="selected-amount">$ {selectedAmount.toLocaleString()}</p>
            <button
              type="button"
              className="donate-button detail-donate-button"
              onClick={handleDonateNow}
            >
              <HandHeart size={15} /> Donate Now
            </button>
            {donationMessage ? <p className="donation-inline-message">{donationMessage}</p> : null}
            <div className="detail-secondary-actions">
              <button type="button" className="detail-save-btn" onClick={handleSaveToggle}>
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <button type="button" className="detail-share-btn" onClick={handleShare}>
                <Share2 size={14} /> {shareLabel}
              </button>
            </div>
          </article>

          <article className="detail-creator-card">
            <p className="card-label">Organized by</p>
            <p className="creator-name">{creatorName}</p>
            <p className="creator-subtext">{campaign.organization}</p>
            <button type="button"><Building2 size={14} /> Contact Organizer</button>
          </article>

          <article className="detail-rewards-card detail-location-card">
            <p className="card-label">Location</p>
            {locationState.coords ? (
              <iframe
                title="Current location map"
                src={`https://maps.google.com/maps?q=${locationState.coords.lat},${locationState.coords.lng}&z=14&output=embed`}
                className="location-image"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=720&q=80"
                alt="Project location map"
                className="location-image"
                referrerPolicy="no-referrer"
              />
            )}
            <p className="location-caption">
              {locationState.loading
                ? 'Detecting your real-time location...'
                : locationState.coords
                  ? `Live location: ${locationState.coords.lat.toFixed(5)}, ${locationState.coords.lng.toFixed(5)} (±${Math.round(locationState.coords.accuracy)}m)`
                  : locationState.error || 'Project sites located across 5 villages in the Thpong district.'}
            </p>
            {locationState.lastUpdated ? (
              <p className="location-caption">Updated: {locationState.lastUpdated.toLocaleTimeString()}</p>
            ) : null}
            <div className="detail-secondary-actions">
              <button type="button" className="detail-save-btn" onClick={requestRealLocation}>
                Refresh Location
              </button>
              {locationState.coords ? (
                <a
                  className="detail-share-btn"
                  href={`https://www.google.com/maps?q=${locationState.coords.lat},${locationState.coords.lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Maps
                </a>
              ) : null}
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}

export default CampaignDetailPage;
