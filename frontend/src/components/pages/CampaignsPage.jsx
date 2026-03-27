import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../css/Campaigns.css';
import {
  campaignCategoryToSidebarCategory,
  CAMPAIGN_FALLBACK_IMAGE,
  fetchCampaigns,
} from '@/services/campaign-service.js';
import { getSession } from '@/services/session-service.js';

const LAST_OPENED_CAMPAIGN_KEY = 'chomnuoy_last_opened_campaign';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

const sidebarCategories = ['All Campaigns', 'Education', 'Healthcare', 'Disaster Relief', 'Environment'];
const urgencyOptions = ['Urgent', 'Ongoing', 'Nearly Funded'];
const sortOptions = ['Most Recent', 'Most Funded', 'Ending Soon'];

function CampaignsPage() {
  const location = useLocation();
  const session = getSession();
  const isLoggedIn = Boolean(session?.isLoggedIn);
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

    fetchCampaigns()
      .then((data) => {
        if (!active) return;
        setCampaigns(data);
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
  }, []);

  const filteredCampaigns = useMemo(() => {
    const searchTerm = new URLSearchParams(location.search).get('search')?.trim().toLowerCase() || '';
    const byCategory = campaigns.filter((campaign) => {
      if (selectedCategory === 'All Campaigns') {
        return true;
      }

      return campaignCategoryToSidebarCategory(campaign.category) === selectedCategory;
    });

    const urgencySorted = [...byCategory].sort((a, b) => {
      const ratioA = a.goalAmount ? a.raisedAmount / a.goalAmount : 0;
      const ratioB = b.goalAmount ? b.raisedAmount / b.goalAmount : 0;

      if (selectedUrgency === 'Urgent') {
        return ratioA - ratioB;
      }

      if (selectedUrgency === 'Nearly Funded') {
        return ratioB - ratioA;
      }

      return b.raisedAmount - a.raisedAmount;
    });

    const baseList = verifiedOnly
      ? urgencySorted.filter((_, index) => index % 2 === 0)
      : urgencySorted;

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
      return [...searchedList].sort((a, b) => b.raisedAmount - a.raisedAmount);
    }

    if (selectedSort === 'Ending Soon') {
      return [...searchedList].sort((a, b) => {
        const remainingA = a.goalAmount - a.raisedAmount;
        const remainingB = b.goalAmount - b.raisedAmount;
        return remainingA - remainingB;
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

        {loading ? <p className="campaign-loading">Loading campaigns...</p> : null}
        {error ? <p className="campaign-error">{error}</p> : null}

        <section key={gridAnimationKey} className="campaign-grid campaign-grid-dashboard" aria-label="Campaign list">
          {paginatedCampaigns.map((campaign, index) => {
            const isMaterialCampaign = String(campaign.campaignType || '').toLowerCase().includes('material');
            const requestedItems = Math.max(1, Number(campaign.materialItem?.quantity || campaign.goalAmount || 1));
            const pledgedItems = Math.max(0, Number(campaign.raisedAmount || 0));
            const percentRaised = isMaterialCampaign
              ? Math.round((pledgedItems / requestedItems) * 100)
              : Math.round((campaign.raisedAmount / campaign.goalAmount) * 100);
            const progressWidth = Math.min(percentRaised, 100);
            const detailPath = `/campaigns/${campaign.id}`;
            const detailState = {
              from: '/campaigns',
              campaign,
            };
            const donatePath = isLoggedIn ? detailPath : `/login?redirect=${encodeURIComponent(detailPath)}`;
            const isUrgent = percentRaised < 40;
            const badgeCategory = campaignCategoryToSidebarCategory(campaign.category).toUpperCase();
            const daysLeft = Math.max(3, 30 - Math.floor(percentRaised / 4));

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
                    <div
                      className="campaign-progress"
                      role="progressbar"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-valuenow={progressWidth}
                    >
                      <span style={{ width: `${progressWidth}%` }} />
                    </div>
                  </div>

                  <div className="campaign-actions campaign-dashboard-actions">
                    <div className="campaign-support-meta" aria-label={`${daysLeft} days left`}>
                      <span className="campaign-support-meta-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" className="campaign-support-meta-svg">
                          <circle cx="12" cy="12" r="8.5" />
                          <path d="M12 7.8v4.6l3.1 1.8" />
                        </svg>
                      </span>
                      <span className="campaign-support-meta-copy">
                        <strong>{daysLeft} days left</strong>
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
                        Support
                      </Link>
                    ) : (
                      <a href={donatePath} className="donate-button campaign-donate-button" aria-label={`Support ${campaign.title}`}>
                        Support
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
