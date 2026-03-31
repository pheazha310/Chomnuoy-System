import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../css/Campaigns.css';
import {
  campaignCategoryToSidebarCategory,
  CAMPAIGN_FALLBACK_IMAGE,
  fetchCampaigns,
} from '@/services/campaign-service.js';
import { getSession } from '@/services/session-service.js';

const LAST_OPENED_CAMPAIGN_KEY = 'chomnuoy_last_opened_campaign_v2';

function formatCurrency(amount) {
  const numericAmount = Number(amount || 0);
  const minimumFractionDigits = !Number.isInteger(numericAmount) || (numericAmount > 0 && numericAmount < 1)
    ? 2
    : 0;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  }).format(numericAmount);
}

const sidebarCategories = ['All Campaigns', 'Education', 'Healthcare', 'Disaster Relief', 'Environment'];
const urgencyOptions = ['Urgent', 'Ongoing', 'Nearly Funded'];
const sortOptions = ['Most Recent', 'Most Funded', 'Ending Soon'];

function getFundingProgress(campaign) {
  const isMaterialCampaign = String(campaign?.campaignType || '').toLowerCase().includes('material');
  const requestedItems = Math.max(1, Number(campaign?.materialItem?.quantity || campaign?.goalAmount || 1));
  const pledgedItems = Math.max(0, Number(campaign?.raisedAmount || 0));
  const safeGoal = isMaterialCampaign ? requestedItems : Math.max(Number(campaign?.goalAmount || 0), 1);
  const currentValue = isMaterialCampaign ? pledgedItems : Math.max(0, Number(campaign?.raisedAmount || 0));
  return Math.min(100, Math.round((currentValue / safeGoal) * 100));
}

function isVerifiedOrganizationStatus(value) {
  const status = String(value || '').trim().toLowerCase();
  return ['verified', 'approved', 'active'].some((item) => status.includes(item));
}

function normalizeDonationType(value) {
  const key = String(value || '').trim().toLowerCase();
  if (key === 'material' || key === 'materials') return 'material';
  return 'money';
}

function isSuccessfulDonationStatus(value) {
  const key = String(value || '').trim().toLowerCase();
  return ['completed', 'success', 'confirmed', 'paid'].includes(key);
}

function getContributionPercent(value, goal) {
  const safeGoal = Math.max(Number(goal || 0), 1);
  return Math.min(100, Math.round((Math.max(0, Number(value || 0)) / safeGoal) * 100));
}

function formatProgressLabel(progress, suffix) {
  if (progress > 0 && progress < 1) return `<1% ${suffix}`;
  return `${Math.round(progress)}% ${suffix}`;
}

function CampaignsPage() {
  const location = useLocation();
  const session = getSession();
  const isLoggedIn = Boolean(session?.isLoggedIn);
  const currentUserId = Number(session?.userId || 0);
  const [selectedCategory, setSelectedCategory] = useState('All Campaigns');
  const [selectedUrgency, setSelectedUrgency] = useState('Urgent');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedSort, setSelectedSort] = useState(sortOptions[0]);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const sortMenuRef = useRef(null);
  const itemsPerPage = 6;

  useEffect(() => {
    function handlePointerDown(event) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

    Promise.allSettled([
      fetchCampaigns(),
      fetch(`${apiBase}/organizations`).then((response) => (response.ok ? response.json() : [])),
      fetch(`${apiBase}/donations`).then((response) => (response.ok ? response.json() : [])),
      fetch(`${apiBase}/material_items`).then((response) => (response.ok ? response.json() : [])),
    ])
      .then(([campaignResult, organizationResult, donationResult, materialItemsResult]) => {
        if (!active) return;
        if (campaignResult.status !== 'fulfilled') {
          throw campaignResult.reason instanceof Error ? campaignResult.reason : new Error('Failed to load campaigns.');
        }

        const organizations =
          organizationResult.status === 'fulfilled' && Array.isArray(organizationResult.value)
            ? organizationResult.value
            : [];
        const organizationMap = new Map(organizations.map((item) => [Number(item.id), item]));
        const organizationByUserMap = new Map(
          organizations
            .map((item) => [Number(item.user_id), item])
            .filter(([userId]) => Number.isFinite(userId) && userId > 0),
        );
        const donations =
          donationResult.status === 'fulfilled' && Array.isArray(donationResult.value)
            ? donationResult.value
            : [];
        const materialItems =
          materialItemsResult.status === 'fulfilled' && Array.isArray(materialItemsResult.value)
            ? materialItemsResult.value
            : [];
        const materialQuantityByDonationId = new Map(
          materialItems.map((item) => [Number(item.donation_id), Math.max(1, Number(item.quantity || 1))]),
        );
        const campaignDonationTotals = donations.reduce((map, item) => {
          const campaignId = Number(item.campaign_id || 0);
          if (!campaignId) return map;

          const current = map.get(campaignId) || {
            money: 0,
            material: 0,
            supporters: new Set(),
            currentUserMoney: 0,
            currentUserMaterial: 0,
          };
          const isSuccessful = isSuccessfulDonationStatus(item.status);
          const amount = Math.max(0, Number(item.amount || 0));
          const donationType = normalizeDonationType(item.donation_type);
          if (donationType === 'material' && isSuccessful) {
            current.material += materialQuantityByDonationId.get(Number(item.id)) || Math.max(1, amount);
          } else if (donationType === 'money' && isSuccessful) {
            current.money += amount;
          }
          const donorUserId = Number(item.user_id || 0);
          if (donorUserId && isSuccessful) {
            current.supporters.add(donorUserId);
          }
          if (currentUserId && donorUserId === currentUserId && isSuccessful) {
            if (donationType === 'material') {
              current.currentUserMaterial += materialQuantityByDonationId.get(Number(item.id)) || Math.max(1, amount);
            } else {
              current.currentUserMoney += amount;
            }
          }
          map.set(campaignId, current);
          return map;
        }, new Map());

        const mergedCampaigns = campaignResult.value.map((item) => {
          const organization =
            organizationMap.get(Number(item.organizationId || 0)) ||
            organizationByUserMap.get(Number(item.organizationId || 0)) ||
            null;
          const donationTotals = campaignDonationTotals.get(Number(item.id || 0));
          const isMaterialCampaign = String(item.campaignType || '').toLowerCase().includes('material');
          const campaignGoal = isMaterialCampaign
            ? Number(item.materialItem?.quantity || item.goalAmount || 1)
            : Number(item.goalAmount || 0);
          const liveRaisedAmount = isMaterialCampaign
            ? Number(donationTotals?.material || 0)
            : Number(item.raisedAmount ?? 0);
          const currentUserContribution = isMaterialCampaign
            ? Number(donationTotals?.currentUserMaterial || 0)
            : Number(donationTotals?.currentUserMoney || 0);

          return {
            ...item,
            isVerified: isVerifiedOrganizationStatus(organization?.verified_status || organization?.status),
            raisedAmount: liveRaisedAmount,
            raised: liveRaisedAmount,
            supporterCount: donationTotals?.supporters?.size ?? Number(item.supporterCount || 0),
            currentUserContribution,
            currentUserContributionPercent: getContributionPercent(currentUserContribution, campaignGoal),
          };
        });

        setCampaigns(mergedCampaigns);
        setCurrentPage(1);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load campaigns.');
        setCampaigns([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentUserId]);

  const filteredCampaigns = useMemo(() => {
    const searchTerm = new URLSearchParams(location.search).get('search')?.trim().toLowerCase() || '';
    const byCategory = campaigns.filter((campaign) => {
      if (selectedCategory === 'All Campaigns') {
        return true;
      }

      return campaignCategoryToSidebarCategory(campaign.category) === selectedCategory;
    });

    const urgencyScoped = byCategory.filter((campaign) => {
      const progress = getFundingProgress(campaign);
      if (selectedUrgency === 'Urgent') return Boolean(campaign.isUrgent);
      if (selectedUrgency === 'Nearly Funded') return progress >= 75;
      return campaign.timeLeft !== 'Ended';
    });

    const baseList = verifiedOnly
      ? urgencyScoped.filter((campaign) => campaign.isVerified)
      : urgencyScoped;

    const searchedList = searchTerm
      ? baseList.filter((campaign) => {
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
        })
      : baseList;

    if (selectedSort === 'Most Funded') {
      return [...searchedList].sort((a, b) => getFundingProgress(b) - getFundingProgress(a));
    }

    if (selectedSort === 'Ending Soon') {
      return [...searchedList].sort((a, b) => {
        const daysA = typeof a.daysLeft === 'number' ? a.daysLeft : Number.POSITIVE_INFINITY;
        const daysB = typeof b.daysLeft === 'number' ? b.daysLeft : Number.POSITIVE_INFINITY;
        return daysA - daysB;
      });
    }

    if (selectedSort === 'Most Recent') {
      return [...searchedList].sort((a, b) => b.createdAt - a.createdAt);
    }

    return searchedList;
  }, [campaigns, location.search, selectedCategory, selectedUrgency, verifiedOnly, selectedSort]);

  const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCampaigns = filteredCampaigns.slice(startIndex, startIndex + itemsPerPage);
  const gridAnimationKey = `${selectedCategory}-${selectedUrgency}-${verifiedOnly}-${selectedSort}-${currentPage}`;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  return (
    <main className="campaigns-page campaigns-page-v2">
      <section className="campaign-content-area campaign-content-area-v2">
        <header className="campaigns-toolbar campaigns-toolbar-v2">
          <div>
            <h1>Campaigns</h1>
            <p>Explore the latest organization posts and support active community needs.</p>
          </div>
        </header>

        <section className="campaign-filter-bar" aria-label="Campaign filters">
          <div className="campaign-filter-row">
            {sidebarCategories.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  className={`campaign-filter-chip ${isActive ? 'is-active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              );
            })}
          </div>

          <div className="campaign-filter-row campaign-filter-row-secondary">
            {urgencyOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`campaign-filter-chip campaign-filter-chip-light ${selectedUrgency === option ? 'is-active' : ''}`}
                onClick={() => setSelectedUrgency(option)}
              >
                {option}
              </button>
            ))}

            <button
              type="button"
              className={`campaign-filter-chip campaign-filter-chip-light ${verifiedOnly ? 'is-active' : ''}`}
              onClick={() => setVerifiedOnly((previous) => !previous)}
            >
              Verified Only
            </button>

            <div className="campaign-sorter campaign-sorter-v2" ref={sortMenuRef}>
              <button
                type="button"
                className={`campaign-sort-trigger ${isSortOpen ? 'is-open' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={isSortOpen}
                onClick={() => setIsSortOpen((previous) => !previous)}
              >
                {selectedSort}
              </button>

              {isSortOpen ? (
                <ul className="campaign-sort-menu" role="listbox" aria-label="Sort campaigns">
                  {sortOptions.map((option) => (
                    <li key={option}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selectedSort === option}
                        className={`campaign-sort-option ${selectedSort === option ? 'is-selected' : ''}`}
                        onClick={() => {
                          setSelectedSort(option);
                          setIsSortOpen(false);
                        }}
                      >
                        {option}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </section>

        {error ? <p className="campaign-error">{error}</p> : null}

        <section key={gridAnimationKey} className="campaign-grid campaign-grid-dashboard" aria-label="Campaign list">
          {paginatedCampaigns.map((campaign, index) => {
            const isMaterialCampaign = String(campaign.campaignType || '').toLowerCase().includes('material');
            const requestedItems = Math.max(1, Number(campaign.materialItem?.quantity || campaign.goalAmount || 1));
            const pledgedItems = Math.max(0, Number(campaign.raisedAmount || 0));
            const rawProgress = isMaterialCampaign
              ? (pledgedItems / requestedItems) * 100
              : (Number(campaign.goalAmount || 0) > 0
                ? (Number(campaign.raisedAmount || 0) / Number(campaign.goalAmount || 0)) * 100
                : 0);
            const percentRaised = getFundingProgress(campaign);
            const progressWidth = Math.min(percentRaised, 100);
            const visibleProgressWidth = rawProgress > 0 ? Math.max(Math.min(rawProgress, 100), 1) : 0;
            const detailPath = `/campaigns/${campaign.id}`;
            const detailState = {
              from: '/campaigns',
              campaign,
            };
            const donatePath = isLoggedIn ? detailPath : `/login?redirect=${encodeURIComponent(detailPath)}`;
            const isUrgent = Boolean(campaign.isUrgent);
            const badgeCategory = campaignCategoryToSidebarCategory(campaign.category).toUpperCase();
            const timelineLabel = campaign.timeLeft || 'Ongoing';
            const progressLabel = isMaterialCampaign
              ? formatProgressLabel(rawProgress, 'pledged')
              : formatProgressLabel(rawProgress, 'funded');
            const campaignTypeLabel = isMaterialCampaign ? 'Material Drive' : 'Monetary Campaign';
            const donorContribution = Math.max(0, Number(campaign.currentUserContribution || 0));
            const donorContributionPercent = Math.max(0, Number(campaign.currentUserContributionPercent || 0));
            const donorContributionLabel = isMaterialCampaign
              ? `You pledged ${donorContribution.toLocaleString()} of ${requestedItems.toLocaleString()} items`
              : `You donated ${formatCurrency(donorContribution)} of ${formatCurrency(campaign.goalAmount)}`;
            const donorPercentLabel = donorContribution > 0
              ? `Your share ${donorContributionPercent}%`
              : campaignTypeLabel;

            const persistCampaign = () => {
              window.localStorage.setItem(LAST_OPENED_CAMPAIGN_KEY, JSON.stringify(campaign));
            };

            return (
              <article key={campaign.id} className="campaign-card campaign-dashboard-card" style={{ '--card-index': index }}>
                <Link
                  to={detailPath}
                  state={detailState}
                  className="campaign-media-link"
                  aria-label={`Open ${campaign.title} details`}
                  onClick={persistCampaign}
                >
                  <img
                    src={campaign.image}
                    alt={campaign.title}
                    className="campaign-image campaign-dashboard-image"
                    loading="lazy"
                    onError={(event) => {
                      if (event.currentTarget.src !== CAMPAIGN_FALLBACK_IMAGE) {
                        event.currentTarget.src = CAMPAIGN_FALLBACK_IMAGE;
                      }
                    }}
                  />
                  <div className="campaign-card-badges">
                    {isUrgent ? <span className="campaign-badge campaign-badge-urgent">Urgent</span> : null}
                  </div>
                  <div className="campaign-card-category">
                    <span className="campaign-badge campaign-badge-category">{badgeCategory}</span>
                  </div>
                </Link>

                <div className="campaign-content campaign-dashboard-content">
                  <h2>
                    <Link to={detailPath} state={detailState} className="campaign-title-link" onClick={persistCampaign}>
                      {campaign.title}
                    </Link>
                  </h2>
                  <p className="campaign-organization">{campaign.organization}</p>
                  <p className="campaign-summary">{campaign.summary}</p>

                  <div className="campaign-funding-row">
                    <p className="campaign-raised">
                      <span>{isMaterialCampaign ? 'Pledged' : 'Raised'}</span>
                      <strong>{isMaterialCampaign ? pledgedItems.toLocaleString() : formatCurrency(campaign.raisedAmount)}</strong>
                    </p>
                    <p className="campaign-target">
                      <span>{isMaterialCampaign ? 'Needed' : 'Goal'}</span>
                      <strong>{isMaterialCampaign ? requestedItems.toLocaleString() : formatCurrency(campaign.goalAmount)}</strong>
                    </p>
                  </div>

                  <div className="campaign-progress-shell">
                    <div className="campaign-progress-meta-row">
                      <span>{progressLabel}</span>
                      <span>{donorPercentLabel}</span>
                    </div>
                    <div
                      className="campaign-progress"
                      role="progressbar"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-valuenow={progressWidth}
                    >
                      <span style={{ width: `${visibleProgressWidth}%` }} />
                    </div>
                    {isLoggedIn ? (
                      <div className="campaign-progress-donor-note">
                        <strong>{donorContribution > 0 ? donorContributionLabel : 'You have not donated to this campaign yet'}</strong>
                        <span>{donorContribution > 0 ? `${donorContributionPercent}% of this campaign goal came from you` : campaignTypeLabel}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="campaign-actions campaign-dashboard-actions">
                    <div className="campaign-support-meta" aria-label={timelineLabel}>
                      <span className="campaign-support-meta-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" className="campaign-support-meta-svg">
                          <circle cx="12" cy="12" r="8.5" />
                          <path d="M12 7.8v4.6l3.1 1.8" />
                        </svg>
                      </span>
                      <span className="campaign-support-meta-copy">
                        <strong>{isMaterialCampaign ? `${Math.max(0, requestedItems - pledgedItems).toLocaleString()} items left` : timelineLabel}</strong>
                        <small>Time remaining</small>
                      </span>
                    </div>
                    {isLoggedIn ? (
                      <Link
                        to={detailPath}
                        state={detailState}
                        className="donate-button campaign-donate-button"
                        aria-label={`Support ${campaign.title}`}
                        onClick={persistCampaign}
                      >
                        {isMaterialCampaign ? 'Pledge Support' : 'Support'}
                      </Link>
                    ) : (
                      <a href={donatePath} className="donate-button campaign-donate-button" aria-label={`Support ${campaign.title}`}>
                        {isMaterialCampaign ? 'Pledge Support' : 'Support'}
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
          {!loading && !error && paginatedCampaigns.length === 0 ? (
            <div className="campaign-empty">
              <strong>No public campaigns match these filters.</strong>
              <span>Try All Campaigns or check back after organizations publish more active campaigns.</span>
            </div>
          ) : null}
        </section>

        {totalPages > 1 ? (
          <nav className="campaign-pagination campaign-pagination-v2" aria-label="Campaign pages">
            <button
              type="button"
              className="campaign-view-more-button"
              onClick={() => setCurrentPage((page) => (page < totalPages ? page + 1 : 1))}
            >
              <span className="campaign-view-more-label">
                {currentPage < totalPages ? 'View More Campaigns' : 'Back To First Page'}
              </span>
            </button>
          </nav>
        ) : null}
      </section>
    </main>
  );
}

export default CampaignsPage;
