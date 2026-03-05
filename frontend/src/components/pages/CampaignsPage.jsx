import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { campaigns } from '../../data/campaigns';
import '../css/Campaigns.css';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(raised, goal) {
  if (goal === 0) return 0;
  return Math.round((raised / goal) * 100);
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

  if (category === 'Environment') {
    return (
      <svg viewBox="0 0 24 24" className="campaign-nav-icon-svg" aria-hidden="true">
        <path d="M18.8 4.5C11 5.6 7.2 10.5 7.2 16.3c0 2.1 1.7 3.7 3.8 3.7 5.8 0 10.2-4.4 9.3-12.1-.1-.9-.6-1.8-1.5-2.4z" />
        <path d="M8.5 17c1.7-1.2 3.8-2.7 6.5-4.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="campaign-nav-icon-svg" aria-hidden="true">
      <path d="M4.5 14.5c3.5-.1 5.8 2.2 5.9 5.7-3.5.1-5.8-2.2-5.9-5.7zM10.5 18c3.7-3.5 6.6-7.8 8.1-12.6 1.2 4.6.8 9.8-2.4 13-1.7 1.7-3.9 2.6-5.7 2.6v-3z" />
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
