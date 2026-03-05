<<<<<<< HEAD
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
=======
﻿import { useEffect, useMemo, useRef, useState } from 'react';
>>>>>>> 6a8fb188948b72f5f029268f02eafcb725d50351
import { campaigns } from '../../data/campaigns';
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
<<<<<<< HEAD
      </svg>
    );
  }

  if (category === 'Disaster Relief') {
    return (
      <svg viewBox="0 0 24 24" className="campaign-nav-icon-svg" aria-hidden="true">
        <path d="M12 4 5 12h4v8h6v-8h4l-7-8z" />
=======
>>>>>>> 6a8fb188948b72f5f029268f02eafcb725d50351
      </svg>
    );
  }

  if (category === 'Disaster Relief') {
    return (
      <svg viewBox="0 0 24 24" className="campaign-nav-icon-svg" aria-hidden="true">
<<<<<<< HEAD
        <path d="M18.8 4.5C11 5.6 7.2 10.5 7.2 16.3c0 2.1 1.7 3.7 3.8 3.7 5.8 0 10.2-4.4 9.3-12.1-.1-.9-.6-1.8-1.5-2.4z" />
        <path d="M8.5 17c1.7-1.2 3.8-2.7 6.5-4.8" />
=======
        <path d="M12 4 5 12h4v8h6v-8h4l-7-8z" />
>>>>>>> 6a8fb188948b72f5f029268f02eafcb725d50351
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="campaign-nav-icon-svg" aria-hidden="true">
<<<<<<< HEAD
      <path d="M4.5 14.5c3.5-.1 5.8 2.2 5.9 5.7-3.5.1-5.8-2.2-5.9-5.7zM10.5 18c3.7-3.5 6.6-7.8 8.1-12.6 1.2 4.6.8 9.8-2.4 13-1.7 1.7-3.9 2.6-5.7 2.6v-3z" />
=======
      <path d="M18.8 4.5C11 5.6 7.2 10.5 7.2 16.3c0 2.1 1.7 3.7 3.8 3.7 5.8 0 10.2-4.4 9.3-12.1-.1-.9-.6-1.8-1.5-2.4z" />
      <path d="M8.5 17c1.7-1.2 3.8-2.7 6.5-4.8" />
>>>>>>> 6a8fb188948b72f5f029268f02eafcb725d50351
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
<<<<<<< HEAD

export default function CampaignsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState('All Campaigns');
  const [selectedUrgency, setSelectedUrgency] = useState('All');
  const [sortBy, setSortBy] = useState('Most Recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, [location.search]);

  const filteredCampaigns = useMemo(() => {
    let result = [...campaigns];

    if (selectedCategory !== 'All Campaigns') {
      result = result.filter((c) => c.category === selectedCategory);
    }

    if (selectedUrgency !== 'All') {
      if (selectedUrgency === 'Urgent') {
        result = result.filter((c) => c.isUrgent);
      } else if (selectedUrgency === 'Nearly Funded') {
        result = result.filter((c) => c.raised / c.goal >= 0.8);
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query)
      );
    }

    if (sortBy === 'Most Funded') {
      result.sort((a, b) => b.raised - a.raised);
    } else if (sortBy === 'Ending Soon') {
      result.sort((a, b) => a.daysLeft - b.daysLeft);
    } else {
      result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [selectedCategory, selectedUrgency, sortBy, searchQuery]);

  const visibleCampaigns = filteredCampaigns.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCampaigns.length;

  useEffect(() => {
    setVisibleCount(6);
  }, [selectedCategory, selectedUrgency, sortBy, searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      navigate('/campaigns');
      return;
    }
    navigate(`/campaigns?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="campaigns-page">
      <div className="campaigns-container">
        <aside className="campaigns-sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Categories</h3>
            <div className="sidebar-options">
              {sidebarCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`sidebar-option ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  <CategoryIcon category={cat} />
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Urgency</h3>
            <div className="sidebar-options">
              <button
                type="button"
                className={`sidebar-option ${selectedUrgency === 'All' ? 'active' : ''}`}
                onClick={() => setSelectedUrgency('All')}
              >
                All
              </button>
              {urgencyOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`sidebar-option ${selectedUrgency === opt ? 'active' : ''}`}
                  onClick={() => setSelectedUrgency(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Sort By</h3>
            <div className="sidebar-options">
              {sortOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`sidebar-option ${sortBy === opt ? 'active' : ''}`}
                  onClick={() => setSortBy(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="campaigns-main">
          <div className="campaigns-header">
            <h1 className="campaigns-title">Active Campaigns</h1>
            <form className="campaigns-search" onSubmit={handleSearchSubmit}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          <div className="campaigns-grid">
            {visibleCampaigns.map((campaign) => (
              <article key={campaign.id} className="campaign-card">
                <div className="campaign-image-wrapper">
                  <img src={campaign.image} alt={campaign.title} className="campaign-image" />
                  {campaign.isUrgent && (
                    <span className="campaign-badge urgent">Urgent</span>
                  )}
                </div>
                <div className="campaign-content">
                  <span className="campaign-category">{campaign.category}</span>
                  <h2 className="campaign-title">{campaign.title}</h2>
                  <p className="campaign-description">{campaign.description}</p>
                  <div className="campaign-progress">
                    <div className="campaign-progress-bar">
                      <div
                        className="campaign-progress-fill"
                        style={{ width: `${formatPercent(campaign.raised, campaign.goal)}%` }}
                      />
                    </div>
                    <span className="campaign-percent">{formatPercent(campaign.raised, campaign.goal)}%</span>
                  </div>
                  <div className="campaign-stats">
                    <div className="campaign-stat">
                      <span className="campaign-stat-label">Raised</span>
                      <span className="campaign-stat-value">{formatCurrency(campaign.raised)}</span>
                    </div>
                    <div className="campaign-stat">
                      <span className="campaign-stat-label">Goal</span>
                      <span className="campaign-stat-value">{formatCurrency(campaign.goal)}</span>
                    </div>
                    <div className="campaign-stat">
                      <span className="campaign-stat-label">Time Left</span>
                      <span className="campaign-stat-value">{campaign.daysLeft} days</span>
                    </div>
                  </div>
                  <div className="campaign-donors">
                    {donorProfileImages.map((src, i) => (
                      <img key={i} src={src} alt="" className="campaign-donor-avatar" />
                    ))}
                    <span className="campaign-donors-count">+{campaign.donors} donors</span>
                  </div>
                  <button type="button" className="campaign-donate-btn">
                    Donate Now
                  </button>
                </div>
              </article>
            ))}
          </div>

          {hasMore && (
            <div className="campaigns-load-more">
              <button
                type="button"
                className="load-more-btn"
                onClick={() => setVisibleCount((c) => c + 3)}
              >
                Load More Campaigns
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
=======

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
  const sortMenuRef = useRef(null);
  const itemsPerPage = 4;

  useEffect(() => {
    function handlePointerDown(event) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const filteredCampaigns = useMemo(() => {
    const byCategory = campaigns.filter((campaign) => {
      if (selectedCategory === 'All Campaigns') {
        return true;
      }

      return campaignCategoryToSidebarCategory(campaign.category) === selectedCategory;
    });

    const urgencySorted = [...byCategory].sort((a, b) => {
      const ratioA = a.raisedAmount / a.goalAmount;
      const ratioB = b.raisedAmount / b.goalAmount;

      if (selectedUrgency === 'Urgent') {
        return ratioA - ratioB;
      }

      if (selectedUrgency === 'Nearly Funded') {
        return ratioB - ratioA;
      }

      return b.raisedAmount - a.raisedAmount;
    });

    if (!verifiedOnly) {
      if (selectedSort === 'Most Funded') {
        return [...urgencySorted].sort((a, b) => b.raisedAmount - a.raisedAmount);
      }

      if (selectedSort === 'Ending Soon') {
        return [...urgencySorted].sort((a, b) => {
          const remainingA = a.goalAmount - a.raisedAmount;
          const remainingB = b.goalAmount - b.raisedAmount;
          return remainingA - remainingB;
        });
      }

      return urgencySorted;
    }

    const verifiedList = urgencySorted.filter((_, index) => index % 2 === 0);

    if (selectedSort === 'Most Funded') {
      return [...verifiedList].sort((a, b) => b.raisedAmount - a.raisedAmount);
    }

    if (selectedSort === 'Ending Soon') {
      return [...verifiedList].sort((a, b) => {
        const remainingA = a.goalAmount - a.raisedAmount;
        const remainingB = b.goalAmount - b.raisedAmount;
        return remainingA - remainingB;
      });
    }

    return verifiedList;
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
>>>>>>> 6a8fb188948b72f5f029268f02eafcb725d50351
