import { campaigns } from '../../data/campaigns';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import '../css/Campaigns.css';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function CampaignsPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const categories = ['All', 'Technology', 'Social Good', 'Environment', 'Health'];
  
  const filteredCampaigns = selectedCategory === 'All' 
    ? campaigns 
    : campaigns.filter(campaign => campaign.category === selectedCategory);

  const handleCampaignClick = (campaignId) => {
    navigate(`/campaigns/${campaignId}`);
  };

  return (
    <main className="campaigns-page">
      <div className="campaigns-dashboard">
        <aside className="campaign-sidebar">
          <div className="campaign-sidebar-group">
            <h3 className="campaign-sidebar-title">Categories</h3>
            <nav className="campaign-nav-list">
              {categories.map(category => (
                <button
                  key={category}
                  className={`campaign-nav-item ${selectedCategory === category ? 'campaign-nav-item-active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <div className="campaign-content-area">
          <div className="campaigns-toolbar">
            <div>
              <h1>Active Campaigns</h1>
              <p>Support innovative projects making a difference in communities worldwide</p>
            </div>
            <div className="campaign-sorter">
              <span>Sort by:</span>
              <button className="campaign-sort-trigger">
                Popular
              </button>
            </div>
          </div>

          <div className="campaign-grid campaign-grid-dashboard">
            {filteredCampaigns.map((campaign, index) => {
              const percentRaised = Math.round((campaign.raisedAmount / campaign.goalAmount) * 100);
              const progressWidth = Math.min(percentRaised, 100);
              const backers = Math.max(24, Math.round(campaign.raisedAmount / 35));

              return (
                <article 
                  key={campaign.id} 
                  className="campaign-card campaign-dashboard-card"
                  style={{ '--card-index': index }}
                >
                  <a 
                    href={`/campaigns/${campaign.id}`}
                    className="campaign-media-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCampaignClick(campaign.id);
                    }}
                  >
                    <div className="campaign-dashboard-image">
                      <img src={campaign.image} alt={campaign.title} className="campaign-image" />
                    </div>
                    <div className="campaign-card-badges">
                      <span className="campaign-badge campaign-badge-category">{campaign.category}</span>
                    </div>
                  </a>
                  
                  <div className="campaign-content campaign-dashboard-content">
                    <h2 className="campaign-title">
                      <a href={`/campaigns/${campaign.id}`} className="campaign-title-link">
                        {campaign.title}
                      </a>
                    </h2>
                    <p className="campaign-organization">by {campaign.organization}</p>
                    <p className="campaign-summary">{campaign.summary}</p>
                    
                    <div className="campaign-funding-row">
                      <p className="campaign-raised">{formatCurrency(campaign.raisedAmount)}</p>
                      <p className="campaign-target">of {formatCurrency(campaign.goalAmount)}</p>
                    </div>
                    
                    <div className="campaign-progress">
                      <span style={{ width: `${progressWidth}%` }}></span>
                    </div>
                    
                    <div className="campaign-actions">
                      <div className="campaign-donors">
                        <div className="donor-avatar donor-avatar-image" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#d7dee8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>👤</div>
                        <div className="donor-avatar donor-avatar-image" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#d7dee8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', marginLeft: '-10px' }}>👤</div>
                        <div className="donor-avatar donor-avatar-image" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#d7dee8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', marginLeft: '-10px' }}>👤</div>
                        <div className="donor-avatar donor-avatar-more" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e1e6ef', color: '#5b6d83', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: '-10px' }}>+{backers - 3}</div>
                      </div>
                      <button 
                        className="donate-button campaign-donate-button"
                        onClick={() => handleCampaignClick(campaign.id)}
                      >
                        Donate
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredCampaigns.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#748398' }}>
              <p>No campaigns found in the {selectedCategory.toLowerCase()} category.</p>
              <button 
                onClick={() => setSelectedCategory('All')}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  background: '#1f7de2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                View all campaigns
              </button>
            </div>
          )}

          <div className="campaign-pagination">
            <button disabled>←</button>
            <span className="is-active">1</span>
            <span>2</span>
            <span>3</span>
            <button>→</button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default CampaignsPage;
