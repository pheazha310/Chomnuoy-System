<<<<<<< HEAD
﻿import { useEffect, useMemo, useRef, useState } from 'react';
=======
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
>>>>>>> 98a91b4038f164e7469f5235a468ee2dc3a4e59f
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
  if (category === 'All Categories') {
    return (
      <svg viewBox="0 0 24 24" className="chip-icon-svg" aria-hidden="true">
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </svg>
    );
  }

  if (category === 'Technology') {
    return (
      <svg viewBox="0 0 24 24" className="chip-icon-svg" aria-hidden="true">
        <rect x="4" y="5" width="16" height="11" rx="2" />
        <path d="M9 19h6M12 16v3" />
      </svg>
    );
  }

  if (category === 'Social Good') {
    return (
      <svg viewBox="0 0 24 24" className="chip-icon-svg" aria-hidden="true">
        <path d="M12 20s-6.5-3.9-8.5-7.9C2 9.7 3.5 7 6.4 7c1.8 0 3 1 3.6 2 0.6-1 1.8-2 3.6-2 2.9 0 4.4 2.7 2.9 5.1C18.5 16.1 12 20 12 20z" />
      </svg>
    );
  }

  if (category === 'Environment') {
    return (
      <svg viewBox="0 0 24 24" className="chip-icon-svg" aria-hidden="true">
        <path d="M18.8 4.5C11 5.6 7.2 10.5 7.2 16.3c0 2.1 1.7 3.7 3.8 3.7 5.8 0 10.2-4.4 9.3-12.1-.1-.9-.6-1.8-1.5-2.4z" />
        <path d="M8.5 17c1.7-1.2 3.8-2.7 6.5-4.8" />
      </svg>
    );
  }

  if (category === 'Health') {
    return (
      <svg viewBox="0 0 24 24" className="chip-icon-svg" aria-hidden="true">
        <path d="M12 3l7 3v5.8c0 4.2-2.5 7.3-7 9.2-4.5-1.9-7-5-7-9.2V6l7-3z" />
        <path d="M12 8v6M9 11h6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="chip-icon-svg" aria-hidden="true">
      <path d="M4.5 14.5c3.5-.1 5.8 2.2 5.9 5.7-3.5.1-5.8-2.2-5.9-5.7zM10.5 18c3.7-3.5 6.6-7.8 8.1-12.6 1.2 4.6.8 9.8-2.4 13-1.7 1.7-3.9 2.6-5.7 2.6v-3z" />
    </svg>
  );
}

<<<<<<< HEAD
const sidebarCategories = ['All Campaigns', 'Education', 'Healthcare', 'Disaster Relief', 'Environment'];
const urgencyOptions = ['Urgent', 'Ongoing', 'Nearly Funded'];
const sortOptions = ['Most Recent', 'Most Funded', 'Ending Soon'];
const donorProfileImages = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=96&q=80',
];
=======
function CampaignsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchQuery = useMemo(() => new URLSearchParams(location.search).get('search')?.trim() || '', [location.search]);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
>>>>>>> 98a91b4038f164e7469f5235a468ee2dc3a4e59f

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(campaigns.map((campaign) => campaign.category))];
    return ['All Categories', ...uniqueCategories];
  }, []);

  const filteredCampaigns = useMemo(() => {
<<<<<<< HEAD
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
=======
    const normalizedQuery = searchQuery.toLowerCase();
    return campaigns.filter((campaign) => {
      const matchesCategory =
        selectedCategory === 'All Categories' || campaign.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;

      const searchableText = `${campaign.title} ${campaign.summary} ${campaign.category} ${campaign.organization}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [selectedCategory, searchQuery]);

  const handleSearch = (query) => {
    const encoded = encodeURIComponent(query.trim());
    navigate(`/campaigns?search=${encoded}`);
  };

  return (
    <main className="campaigns-page">
      <section className="campaigns-header">
        <h1>Explore Campaigns</h1>
        <p>Support impactful projects and choose the campaign you want to back.</p>
        {searchQuery && (
          <div className="search-results-info">
            <p>Showing {filteredCampaigns.length} result(s) for "{searchQuery}"</p>
            <button 
              className="clear-search-btn" 
              onClick={() => handleSearch('')}
>>>>>>> 98a91b4038f164e7469f5235a468ee2dc3a4e59f
            >
              Clear Search
            </button>
          </div>
        )}
      </section>

      <section className="campaign-filters" aria-label="Campaign categories">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`category-chip ${selectedCategory === category ? 'category-chip-active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            <span className="chip-icon" aria-hidden="true">
              {category === 'All Categories' && '🌍'}
              {category === 'Technology' && '💻'}
              {category === 'Social Good' && '🤝'}
              {category === 'Environment' && '🌱'}
              {category === 'Health' && '🏥'}
              {category === 'Creative' && '🎨'}
            </span>
            {category}
          </button>
        ))}
      </section>

      <section className="campaign-grid" aria-label="Campaign list">
        {filteredCampaigns.length === 0 ? (
          <div className="no-results">
            <h3>No campaigns found</h3>
            <p>Try adjusting your search terms or browse all categories.</p>
            <button 
              className="reset-btn"
              onClick={() => {
                setSelectedCategory('All Categories');
                handleSearch('');
              }}
            >
              Browse All Campaigns
            </button>
          </div>
        ) : (
          filteredCampaigns.map((campaign) => {
            const percentRaised = formatPercent(campaign.raisedAmount, campaign.goalAmount);
            const progressWidth = Math.min(percentRaised, 100);
            const detailPath = `/campaigns/${campaign.id}`;

            return (
              <article key={campaign.id} className="campaign-card">
                <div className="campaign-image-container">
                  <img src={campaign.image} alt={campaign.title} className="campaign-image" />
                  <div className="campaign-category-badge">{campaign.category}</div>
                </div>
                
                <div className="campaign-content">
                  <div className="campaign-header">
                    <h2 className="campaign-title">{campaign.title}</h2>
                    <p className="campaign-organization">{campaign.organization}</p>
                  </div>
                  
                  <p className="campaign-summary">{campaign.summary}</p>
                  
                  <div className="campaign-metrics">
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${progressWidth}%` }}
                          role="progressbar"
                          aria-valuenow={percentRaised}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                      <span className="progress-text">{percentRaised}% funded</span>
                    </div>
                    
                    <div className="funding-info">
                      <div className="raised-amount">
                        <span className="amount">{formatCurrency(campaign.raisedAmount)}</span>
                        <span className="label">raised</span>
                      </div>
                      <div className="goal-amount">
                        <span className="amount">{formatCurrency(campaign.goalAmount)}</span>
                        <span className="label">goal</span>
                      </div>
                    </div>
                  </div>
                  
                  <a href={detailPath} className="campaign-cta">
                    Learn More
                  </a>
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}

export default CampaignsPage;
