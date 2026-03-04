import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { campaigns } from '@/data/campaigns.js';

import '../css/Campaigns.css';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'raised', label: 'Most Raised' },
  { value: 'goal', label: 'Highest Goal' },
];

const PER_PAGE = 6;

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CampaignsPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState('featured');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const categories = useMemo(
    () => ['All', ...new Set(campaigns.map((campaign) => campaign.category))],
    [],
  );

  const visibleCampaigns = useMemo(() => {
    const filtered = campaigns.filter((campaign) => (
      selectedCategory === 'All' ? true : campaign.category === selectedCategory
    ));

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (selectedSort === 'raised') return b.raisedAmount - a.raisedAmount;
      if (selectedSort === 'goal') return b.goalAmount - a.goalAmount;
      if (selectedSort === 'newest') return b.id.localeCompare(a.id);
      return 0;
    });

    return sorted;
  }, [selectedCategory, selectedSort]);

  const totalPages = Math.max(1, Math.ceil(visibleCampaigns.length / PER_PAGE));

  const paginatedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return visibleCampaigns.slice(start, start + PER_PAGE);
  }, [currentPage, visibleCampaigns]);

  function handleCategoryChange(category) {
    setSelectedCategory(category);
    setCurrentPage(1);
  }

  function handleSortChange(option) {
    setSelectedSort(option);
    setCurrentPage(1);
    setIsSortOpen(false);
  }

  return (
    <main className="campaigns-page">
      <section className="campaigns-dashboard">
        <aside className="campaign-sidebar">
          <section className="campaign-sidebar-group">
            <h2 className="campaign-sidebar-title">Navigation</h2>
            <div className="campaign-nav-list">
              <button type="button" className="campaign-nav-item campaign-nav-item-active">
                <span className="campaign-nav-icon">+</span>
                Explore Campaigns
              </button>
            </div>
          </section>

          <section className="campaign-sidebar-group">
            <h2 className="campaign-sidebar-title">Categories</h2>
            <div className="campaign-pill-list">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`campaign-pill ${selectedCategory === category ? 'campaign-pill-active' : ''}`}
                  onClick={() => handleCategoryChange(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </section>

          <section className="campaign-sidebar-group campaign-verified-box">
            <h2 className="campaign-sidebar-title campaign-verified-title">Verified Projects</h2>
            <p className="campaign-verified-text">Campaigns are reviewed for transparent impact reporting.</p>
          </section>
        </aside>

        <section className="campaign-content-area">
          <header className="campaigns-toolbar">
            <div>
              <h1>Campaigns</h1>
              <p>{visibleCampaigns.length} active fundraisers</p>
            </div>

            <div className="campaign-sorter">
              <span>Sort by</span>
              <button
                type="button"
                className={`campaign-sort-trigger ${isSortOpen ? 'is-open' : ''}`}
                onClick={() => setIsSortOpen((prev) => !prev)}
              >
                {SORT_OPTIONS.find((option) => option.value === selectedSort)?.label}
              </button>

              {isSortOpen && (
                <ul className="campaign-sort-menu">
                  {SORT_OPTIONS.map((option) => (
                    <li key={option.value}>
                      <button
                        type="button"
                        className={`campaign-sort-option ${selectedSort === option.value ? 'is-selected' : ''}`}
                        onClick={() => handleSortChange(option.value)}
                      >
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </header>

          <section className="campaign-grid campaign-grid-dashboard">
            {paginatedCampaigns.map((campaign, index) => {
              const percent = Math.min(Math.round((campaign.raisedAmount / campaign.goalAmount) * 100), 100);
              const donors = 12 + (index % 4) * 7;
              return (
                <article
                  key={campaign.id}
                  className="campaign-card campaign-dashboard-card"
                  style={{ '--card-index': index }}
                >
                  <Link to={`/campaigns/${campaign.id}`} className="campaign-media-link">
                    <div className="campaign-card-badges">
                      <span className="campaign-badge campaign-badge-category">{campaign.category}</span>
                      <span className="campaign-badge campaign-badge-verified">Verified</span>
                      {percent >= 80 && <span className="campaign-badge campaign-badge-urgent">Urgent</span>}
                    </div>
                    <img src={campaign.image} alt={campaign.title} className="campaign-image campaign-dashboard-image" />
                  </Link>

                  <div className="campaign-content campaign-dashboard-content">
                    <h2>
                      <Link to={`/campaigns/${campaign.id}`} className="campaign-title-link">
                        {campaign.title}
                      </Link>
                    </h2>
                    <p className="campaign-summary">{campaign.summary}</p>

                    <div className="campaign-funding-row">
                      <p className="campaign-raised">{formatCurrency(campaign.raisedAmount)} raised</p>
                      <p className="campaign-target">{formatCurrency(campaign.goalAmount)} goal</p>
                    </div>

                    <div className="campaign-progress">
                      <span style={{ width: `${percent}%` }} />
                    </div>

                    <div className="campaign-actions">
                      <div className="campaign-donors">
                        <span className="donor-avatar donor-avatar-more">+{donors}</span>
                      </div>
                      <button
                        type="button"
                        className="donate-button campaign-donate-button"
                        onClick={() => navigate(`/campaigns/${campaign.id}`)}
                      >
                        Support
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <div className="campaign-pagination">
            <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => page - 1)}>
              {'<'}
            </button>
            {Array.from({ length: totalPages }).map((_, index) => {
              const page = index + 1;
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={page === currentPage ? 'is-active' : ''}
                >
                  {page}
                </button>
              );
            })}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((page) => page + 1)}
            >
              {'>'}
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
