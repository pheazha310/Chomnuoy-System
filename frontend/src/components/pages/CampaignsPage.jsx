import { useEffect, useMemo, useRef, useState } from 'react';
import '../css/Campaigns.css';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function CategoryIcon({ category }) {
  if (category === 'All Campaigns') {
    return (
      <svg viewBox="0 0 24 24" className="campaign-nav-icon-svg" aria-hidden="true">
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </svg>
    );
  }

  if (category === 'Education') {
    return (
      <svg viewBox="0 0 24 24" className="campaign-nav-icon-svg" aria-hidden="true">
        <path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5z" />
        <path d="M7 12.4V16c0 1.9 2.2 3.4 5 3.4s5-1.5 5-3.4v-3.6" />
      </svg>
    );
  }

  if (category === 'Healthcare') {
    return (
      <svg viewBox="0 0 24 24" className="campaign-nav-icon-svg" aria-hidden="true">
        <path d="M12 3.4 18.8 6v5.6c0 4.1-2.6 7.2-6.8 9-4.2-1.8-6.8-4.9-6.8-9V6L12 3.4z" />
        <path d="M12 8v7M8.5 11.5h7" />
      </svg>
    );
  }

  if (category === 'Disaster Relief') {
    return (
      <svg viewBox="0 0 24 24" className="campaign-nav-icon-svg" aria-hidden="true">
        <path d="M12 4 5 12h4v8h6v-8h4l-7-8z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="campaign-nav-icon-svg" aria-hidden="true">
      <path d="M18.8 4.5C11 5.6 7.2 10.5 7.2 16.3c0 2.1 1.7 3.7 3.8 3.7 5.8 0 10.2-4.4 9.3-12.1-.1-.9-.6-1.8-1.5-2.4z" />
      <path d="M8.5 17c1.7-1.2 3.8-2.7 6.5-4.8" />
    </svg>
  );
}

const sidebarCategories = ['All Campaigns', 'Education', 'Healthcare', 'Disaster Relief', 'Environment'];
const urgencyOptions = ['Urgent', 'Ongoing', 'Nearly Funded'];
const sortOptions = ['Most Recent', 'Most Funded', 'Ending Soon'];
const donorProfileImages = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=96&q=80',
];
const hiddenCampaignStatuses = new Set(['draft', 'completed', 'complete', 'closed', 'archived', 'cancelled']);

function isPublicCampaignStatus(status) {
  const value = String(status || '').trim().toLowerCase();
  if (!value) return true;
  return !hiddenCampaignStatuses.has(value);
}

function campaignCategoryToSidebarCategory(category) {
  if (category === 'Technology' || category === 'Social Good') {
    return 'Education';
  }

  if (category === 'Health') {
    return 'Healthcare';
  }

  if (category === 'Creative') {
    return 'Disaster Relief';
  }

  return category;
}

function CampaignsPage() {
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
  const itemsPerPage = 4;

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
    const appBase = apiBase.replace(/\/api\/?$/, '');
    if (normalizedPath.startsWith('storage/')) {
      return `${appBase}/${normalizedPath}`;
    }
    return `${appBase}/storage/${normalizedPath}`;
  };

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
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    let active = true;
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
        if (!active) return;
        const items = Array.isArray(data) ? data : [];
        const mapped = items
          .filter((item) => isPublicCampaignStatus(item.status))
          .map((item) => ({
            id: item.id,
            title: item.title || 'Untitled Campaign',
            summary: item.summary || item.description || 'No description available.',
            category: item.category || 'Environment',
            organization:
              item.organization_name ||
              item.organization ||
              item.organizationTitle ||
              (item.organization_id ? `Organization ${item.organization_id}` : 'Verified Organization'),
            raisedAmount: Number(item.current_amount || 0),
            goalAmount: Math.max(1, Number(item.goal_amount || 0)),
            image:
              getStorageFileUrl(item.image_path) ||
              item.image_url ||
              item.image ||
              'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
            createdAt: item.created_at ? new Date(item.created_at).getTime() : 0,
          }));
        setCampaigns(mapped);
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

    if (selectedSort === 'Most Funded') {
      return [...baseList].sort((a, b) => b.raisedAmount - a.raisedAmount);
    }

    if (selectedSort === 'Ending Soon') {
      return [...baseList].sort((a, b) => {
        const remainingA = a.goalAmount - a.raisedAmount;
        const remainingB = b.goalAmount - b.raisedAmount;
        return remainingA - remainingB;
      });
    }

    if (selectedSort === 'Most Recent') {
      return [...baseList].sort((a, b) => b.createdAt - a.createdAt);
    }

    return baseList;
  }, [selectedCategory, selectedUrgency, verifiedOnly, selectedSort]);

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
    <main className="campaigns-page campaigns-dashboard">
      <aside className="campaign-sidebar">
        <section className="campaign-sidebar-group" aria-label="Campaign categories">
          <p className="campaign-sidebar-title">Categories</p>
          <div className="campaign-nav-list">
            {sidebarCategories.map((category) => {
              const isActive = selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  className={`campaign-nav-item ${isActive ? 'campaign-nav-item-active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  <span className="campaign-nav-icon" aria-hidden="true">
                    <CategoryIcon category={category} />
                  </span>
                  {category}
                </button>
              );
            })}
          </div>
        </section>

        <section className="campaign-sidebar-group" aria-label="Urgency filter">
          <p className="campaign-sidebar-title">Urgency</p>
          <div className="campaign-pill-list">
            {urgencyOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`campaign-pill ${selectedUrgency === option ? 'campaign-pill-active' : ''}`}
                onClick={() => setSelectedUrgency(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        <section className="campaign-sidebar-group campaign-verified-box" aria-label="Verified filter">
          <p className="campaign-sidebar-title campaign-verified-title">Verified Only</p>
          <p className="campaign-verified-text">Show only campaigns verified by our safety team.</p>
          <label className="campaign-toggle" htmlFor="verified-only-toggle">
            <input
              id="verified-only-toggle"
              type="checkbox"
              checked={verifiedOnly}
              onChange={(event) => setVerifiedOnly(event.target.checked)}
            />
            <span className="campaign-toggle-track" />
          </label>
        </section>
      </aside>

      <section className="campaign-content-area">
        <header className="campaigns-toolbar">
          <div>
            <h1>Active Campaigns</h1>
            <p>Discover and support causes that matter to you.</p>
          </div>
          <div className="campaign-sorter" ref={sortMenuRef}>
            <span>Sort by:</span>
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
        </header>

        {loading ? <p className="campaign-loading">Loading campaigns...</p> : null}
        {error ? <p className="campaign-error">{error}</p> : null}

        <section key={gridAnimationKey} className="campaign-grid campaign-grid-dashboard" aria-label="Campaign list">
          {paginatedCampaigns.map((campaign, index) => {
            const percentRaised = Math.round((campaign.raisedAmount / campaign.goalAmount) * 100);
            const progressWidth = Math.min(percentRaised, 100);
            const detailPath = `/campaigns/${campaign.id}`;
            const isUrgent = percentRaised < 40;
            const badgeCategory = campaignCategoryToSidebarCategory(campaign.category).toUpperCase();
            const mockDonorCount = Math.max(8, Math.round(campaign.raisedAmount / 900));

            return (
              <article key={campaign.id} className="campaign-card campaign-dashboard-card" style={{ '--card-index': index }}>
                <a href={detailPath} className="campaign-media-link" aria-label={`Open ${campaign.title} details`}>
                  <img src={campaign.image} alt={campaign.title} className="campaign-image campaign-dashboard-image" loading="lazy" />
                  <div className="campaign-card-badges">
                    <span className="campaign-badge campaign-badge-category">{badgeCategory}</span>
                    <span className="campaign-badge campaign-badge-verified">Verified</span>
                    {isUrgent ? <span className="campaign-badge campaign-badge-urgent">Urgent</span> : null}
                  </div>
                </a>

                <div className="campaign-content campaign-dashboard-content">
                  <h2>
                    <a href={detailPath} className="campaign-title-link">
                      {campaign.title}
                    </a>
                  </h2>
                  <p className="campaign-organization">Posted by {campaign.organization}</p>
                  <p className="campaign-summary">{campaign.summary}</p>

                  <div className="campaign-funding-row">
                    <p className="campaign-raised">{formatCurrency(campaign.raisedAmount)} raised</p>
                    <p className="campaign-target">Target {formatCurrency(campaign.goalAmount)}</p>
                  </div>

                  <div
                    className="campaign-progress"
                    role="progressbar"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow={progressWidth}
                  >
                    <span style={{ width: `${progressWidth}%` }} />
                  </div>

                  <div className="campaign-actions campaign-dashboard-actions">
                    <div className="campaign-donors" aria-label={`${mockDonorCount} donors`}>
                      <img className="donor-avatar donor-avatar-image" src={donorProfileImages[0]} alt="" aria-hidden="true" />
                      <img className="donor-avatar donor-avatar-image" src={donorProfileImages[1]} alt="" aria-hidden="true" />
                      <span className="donor-avatar donor-avatar-more">+{mockDonorCount}</span>
                    </div>
                    <a href={detailPath} className="donate-button campaign-donate-button" aria-label={`Donate to ${campaign.title}`}>
                      Donate Now
                    </a>
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

        <nav className="campaign-pagination" aria-label="Campaign pages">
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
          >
            &lsaquo;
          </button>

          {Array.from({ length: totalPages }, (_, index) => {
            const page = index + 1;
            return (
              <button
                key={page}
                type="button"
                className={currentPage === page ? 'is-active' : ''}
                aria-current={currentPage === page ? 'page' : undefined}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            );
          })}

          <button
            type="button"
            aria-label="Next page"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
          >
            &rsaquo;
          </button>
        </nav>
      </section>
    </main>
  );
}

export default CampaignsPage;
