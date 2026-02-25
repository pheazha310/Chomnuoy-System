import { useMemo, useState } from 'react';
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

function CampaignsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(campaigns.map((campaign) => campaign.category))];
    return ['All Categories', ...uniqueCategories];
  }, []);

  const filteredCampaigns = useMemo(() => {
    if (selectedCategory === 'All Categories') {
      return campaigns;
    }

    return campaigns.filter((campaign) => campaign.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <main className="campaigns-page">
      <section className="campaigns-header">
        <h1>Explore Campaigns</h1>
        <p>Support impactful projects and choose the campaign you want to back.</p>
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

                <div className="campaign-amounts">
                  <p>
                    Goal: <strong>{formatCurrency(campaign.goalAmount)}</strong>
                  </p>
                  <p>
                    Raised: <strong>{formatCurrency(campaign.raisedAmount)}</strong>
                  </p>
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
