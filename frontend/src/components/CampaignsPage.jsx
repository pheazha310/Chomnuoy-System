import { useMemo, useState } from 'react';
import { campaigns } from '../data/campaigns';
import './css/Campaigns.css';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
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
            <span className="chip-icon" aria-hidden="true" />
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
