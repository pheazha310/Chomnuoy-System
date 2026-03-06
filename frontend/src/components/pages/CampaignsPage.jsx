<<<<<<< HEAD
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
=======
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
>>>>>>> 858d8f8053a40d2a03432d1b31c60943f62e9c61
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
<<<<<<< HEAD
      <svg viewBox="0 0 24 24" className="campaign-nav-icon-svg" aria-hidden="true">
        <path
          d="M12 2.8 19.1 5.6v6.1c0 4.5-2.9 8-7.1 9.8-4.2-1.8-7.1-5.3-7.1-9.8V5.6L12 2.8z"
          fill="currentColor"
          stroke="none"
        />
        <path
          d="M12 6.7v10.8"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M8.2 9.8H12"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
        />
=======
      <svg viewBox="0 0 24 24" className="chip-icon-svg" aria-hidden="true">
        <path d="M12 20s-6.5-3.9-8.5-7.9C2 9.7 3.5 7 6.4 7c1.8 0 3 1 3.6 2 0.6-1 1.8-2 3.6-2 2.9 0 4.4 2.7 2.9 5.1C18.5 16.1 12 20 12 20z" />
>>>>>>> 858d8f8053a40d2a03432d1b31c60943f62e9c61
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
  const location = useLocation();
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
  const fromPath = `${location.pathname}${location.search}`;

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
=======
function CampaignsPage() {
  const location = useLocation();
  const searchQuery = useMemo(() => new URLSearchParams(location.search).get('search')?.trim() || '', [location.search]);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(campaigns.map((campaign) => campaign.category))];
    return ['All Categories', ...uniqueCategories];
  }, []);

  const filteredCampaigns = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase();
    return campaigns.filter((campaign) => {
      const matchesCategory = selectedCategory === 'All Categories' || campaign.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;

      const searchableText = `${campaign.title} ${campaign.summary} ${campaign.category}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [selectedCategory, searchQuery]);

  return (
    <main className="campaigns-page">
      <section className="campaigns-header">
        <h1>Explore Campaigns</h1>
        <p>Support impactful projects and choose the campaign you want to back.</p>
        {searchQuery ? <p>Showing {filteredCampaigns.length} result(s) for "{searchQuery}"</p> : null}
      </section>
>>>>>>> 858d8f8053a40d2a03432d1b31c60943f62e9c61

      <section className="campaign-filters" aria-label="Campaign categories">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`category-chip ${selectedCategory === category ? 'category-chip-active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            <span className="chip-icon" aria-hidden="true">
              <CategoryIcon category={category} />
            </span>
            {category}
          </button>
        ))}
      </section>

      <section className="campaign-grid" aria-label="Campaign list">
        {filteredCampaigns.map((campaign) => {
          const percentRaised = Math.round((campaign.raisedAmount / campaign.goalAmount) * 100);
          const progressWidth = Math.min(percentRaised, 100);
          const detailPath = `/campaigns/${campaign.id}`;

          return (
            <article key={campaign.id} className="campaign-card">
              <a href={detailPath} className="campaign-media-link" aria-label={`Open ${campaign.title} details`}>
                <img src={campaign.image} alt={campaign.title} className="campaign-image" loading="lazy" />
              </a>

              <div className="campaign-content">
                <span className="campaign-category">{campaign.category}</span>
                <h2>
                  <a href={detailPath} className="campaign-title-link">
                    {campaign.title}
                  </a>
                </h2>
                <p className="campaign-summary">{campaign.summary}</p>

<<<<<<< HEAD
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
                <Link to={detailPath} state={{ from: fromPath }} className="campaign-media-link" aria-label={`Open ${campaign.title} details`}>
                  <img src={campaign.image} alt={campaign.title} className="campaign-image campaign-dashboard-image" loading="lazy" />
                  <div className="campaign-card-badges">
                    <span className="campaign-badge campaign-badge-category">{badgeCategory}</span>
                    <span className="campaign-badge campaign-badge-verified">Verified</span>
                    {isUrgent ? <span className="campaign-badge campaign-badge-urgent">Urgent</span> : null}
                  </div>
                </Link>

                <div className="campaign-content campaign-dashboard-content">
                  <h2>
                    <Link to={detailPath} state={{ from: fromPath }} className="campaign-title-link">
                      {campaign.title}
                    </Link>
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
                    <Link
                      to={detailPath}
                      state={{ from: fromPath }}
                      className="donate-button campaign-donate-button"
                      aria-label={`Donate to ${campaign.title}`}
                    >
                      Donate Now
                    </Link>
                  </div>
=======
                <div className="campaign-amounts">
                  <p>
                    Goal: <strong>{formatCurrency(campaign.goalAmount)}</strong>
                  </p>
                  <p>
                    Raised: <strong>{formatCurrency(campaign.raisedAmount)}</strong>
                  </p>
>>>>>>> 858d8f8053a40d2a03432d1b31c60943f62e9c61
                </div>

                <div className="campaign-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progressWidth}>
                  <span style={{ width: `${progressWidth}%` }} />
                </div>

                <div className="campaign-actions">
                  <a href={detailPath} className="campaign-link">
                    View campaign
                  </a>
                  <a href={detailPath} className="donate-button" aria-label={`Donate to ${campaign.title}`}>
                    Donate
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

export default CampaignsPage;
