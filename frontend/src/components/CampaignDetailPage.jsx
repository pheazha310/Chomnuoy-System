import { getCampaignById } from '../data/campaigns';
import './css/Campaigns.css';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function CampaignDetailPage({ campaignId }) {
  const campaign = getCampaignById(campaignId);

  if (!campaign) {
    return (
      <main className="campaign-detail-page">
        <p>Campaign not found.</p>
        <a href="/campaigns" className="detail-back-link">
          Back to campaigns
        </a>
      </main>
    );
  }

  const percentRaised = Math.round((campaign.raisedAmount / campaign.goalAmount) * 100);
  const progressWidth = Math.min(percentRaised, 100);
  const backers = Math.max(24, Math.round(campaign.raisedAmount / 35));
  const daysToGo = Math.max(5, 45 - Math.floor(campaign.raisedAmount / 5000));
  const creatorName = campaign.organization.replace(/\b(Org|Solutions|Collective|Tech)\b/g, '').trim() || campaign.organization;
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <main className="campaign-detail-page">
      <a href="/campaigns" className="detail-back-link">
        Back to campaigns
      </a>

      <section className="campaign-detail-layout">
        <article className="campaign-main-column">
          <section className="campaign-hero-panel">
            <img src={campaign.image} alt={campaign.title} className="campaign-detail-image" />
            <div className="campaign-hero-overlay">
              <span className="campaign-category">Verified Project | {campaign.category}</span>
              <h1>{campaign.title}</h1>
            </div>
          </section>

          <section className="campaign-about">
            <div className="campaign-tabs" role="tablist" aria-label="Campaign sections">
              <button type="button" className="tab-active">
                About Campaign
              </button>
              <button type="button">Updates</button>
              <button type="button">FAQ</button>
              <button type="button">Community</button>
            </div>
            <p>
              {campaign.summary} This campaign focuses on long-term impact through transparent milestones and verified
              local implementation.
            </p>
            <div className="campaign-pillars">
              <article>
                <h3>Sustainable Delivery</h3>
                <p>Funding supports implementation, training, and maintenance so results continue after launch.</p>
              </article>
              <article>
                <h3>Local Training</h3>
                <p>Community partners receive practical onboarding to operate and maintain project resources.</p>
              </article>
            </div>
          </section>

          <section className="campaign-updates">
            <h2>Campaign Updates</h2>
            <article className="update-item">
              <p className="update-meta">Today | Milestone Reached</p>
              <h3>{percentRaised}% of our goal reached</h3>
              <p>
                Thanks to supporters, this project has crossed a major funding milestone and key procurement can begin.
              </p>
            </article>
            <article className="update-item">
              <p className="update-meta">{currentDate}</p>
              <h3>Community partners confirmed</h3>
              <p>Local teams finalized operations planning to ensure transparent rollout and regular reporting.</p>
            </article>
          </section>
        </article>

        <aside className="campaign-side-column">
          <article className="detail-stat-card">
            <p className="stat-amount">{formatCurrency(campaign.raisedAmount)}</p>
            <p className="stat-goal">pledged of {formatCurrency(campaign.goalAmount)} goal</p>
            <p className="stat-funded">{percentRaised}% funded</p>
            <div
              className="campaign-progress"
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={progressWidth}
            >
              <span style={{ width: `${progressWidth}%` }} />
            </div>
            <div className="detail-mini-stats">
              <p>
                <strong>{backers}</strong>
                <span>Backers</span>
              </p>
              <p>
                <strong>{daysToGo}</strong>
                <span>Days to go</span>
              </p>
            </div>
            <button type="button" className="donate-button detail-donate-button">
              Back this project
            </button>
            <div className="detail-secondary-actions">
              <button type="button">Share</button>
              <button type="button">Save</button>
            </div>
          </article>

          <article className="detail-creator-card">
            <p className="card-label">Project Creator</p>
            <p className="creator-name">{creatorName}</p>
            <p className="creator-subtext">{campaign.organization}</p>
            <button type="button">Contact Creator</button>
          </article>

          <article className="detail-rewards-card">
            <p className="card-label">Select a reward</p>
            <div className="reward-item">
              <h4>$25 or more</h4>
              <p>Supporter update access and campaign recognition.</p>
            </div>
            <div className="reward-item reward-featured">
              <h4>$100 or more</h4>
              <p>Limited reward tier with premium project update package.</p>
            </div>
            <div className="reward-item">
              <h4>$500 or more</h4>
              <p>Community partner mention and direct impact report.</p>
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}

export default CampaignDetailPage;
