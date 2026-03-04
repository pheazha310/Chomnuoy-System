import React, { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Navigation } from 'lucide-react';

import { getDonorCampaignById } from './campaignData.js';
import './donorCampaignDetail.css';

function formatMoney(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DonorCampaignDetailPage() {
  const { id } = useParams();
  const campaign = getDonorCampaignById(id);
  const [selectedAmount, setSelectedAmount] = useState(25);
  const amounts = [10, 25, 50, 100, 250];

  const progress = useMemo(() => {
    if (!campaign) return 0;
    return Math.min(Math.round((campaign.raised / campaign.goal) * 100), 100);
  }, [campaign]);

  if (!campaign) {
    return <Navigate to="/campaigns/donor" replace />;
  }

  const organizerName = campaign.organizerName || 'WaterLife Foundation';
  const organizerCampaignCount = campaign.organizerCampaignCount || 12;

  return (
    <main className="donor-detail-page">
      <div className="donor-back-link-wrap">
        <Link to="/campaigns/donor" className="donor-back-link">
          <ArrowLeft size={16} />
          Back to campaigns
        </Link>
      </div>

      <section className="donor-detail-layout">
        <article className="donor-detail-main">
          <section className="donor-hero-card">
            <img src={campaign.image} alt={campaign.title} className="donor-hero-image" />
            <div className="donor-hero-overlay">
              <span className="donor-hero-chip">{campaign.category}</span>
              <h1>{campaign.title}</h1>
              <p>
                <MapPin size={14} />
                {campaign.location}
              </p>
            </div>
          </section>

          <section className="donor-tabs">
            <button type="button" className="active">About</button>
            <button type="button">Updates (4)</button>
            <button type="button">Organization</button>
            <button type="button">Comments</button>
          </section>

          <section className="donor-panel">
            <h2>Project Impact</h2>
            <p>
              Access to clean water is a fundamental human right. This campaign funds filtration systems and local
              maintenance training so communities can keep safe water access for the long term.
            </p>
            <div className="donor-impact-grid">
              <div>
                <strong>5,000 Liters/Day</strong>
                <span>Daily filtration capacity per village system.</span>
              </div>
              <div>
                <strong>500+ Families</strong>
                <span>Directly benefiting from safe water access.</span>
              </div>
            </div>
          </section>

          <section className="donor-panel">
            <h2>Recent Updates</h2>
            <div className="donor-update-item">
              <small>Yesterday</small>
              <h3>First filtration unit arrived</h3>
              <p>The core components have arrived at our central hub and installation starts this week.</p>
              <img
                src="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80"
                alt="Campaign update"
              />
            </div>
          </section>
        </article>

        <aside className="donor-detail-side">
          <section className="donor-side-card">
            <p className="money">{formatMoney(campaign.raised)}</p>
            <p className="goal">raised of {formatMoney(campaign.goal)}</p>
            <div className="bar"><span style={{ width: `${progress}%` }} /></div>
            <div className="stats">
              <p><strong>420</strong><span>Donors</span></p>
              <p><strong>12</strong><span>Days Left</span></p>
              <p><strong>{progress}%</strong><span>Reached</span></p>
            </div>
            <h4>Support This Campaign</h4>
            <div className="amounts">
              {amounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className={selectedAmount === amount ? 'active' : ''}
                  onClick={() => setSelectedAmount(amount)}
                >
                  ${amount}
                </button>
              ))}
              <button type="button">Custom</button>
            </div>
            <p className="selected">${selectedAmount}</p>
            <button type="button" className="donate">Donate Now</button>
          </section>

          <section className="donor-side-card">
            <h4>Organized by</h4>
            <div className="org-head">
              <div className="org-icon-box">
                <Building2 size={24} />
              </div>
              <div className="org-meta">
                <p className="org-name">{organizerName}</p>
                <p className="org-subtitle">Verified Organization - {organizerCampaignCount} Campaigns</p>
              </div>
            </div>
            <button type="button" className="contact">Contact Organizer</button>
          </section>

          <section className="donor-side-card">
            <h4>Location</h4>
            <div className="map" role="img" aria-label={`Map preview for ${campaign.location}`}>
              <div className="map-grid" />
              <div className="map-pin">
                <Navigation size={12} />
              </div>
            </div>
            <p className="map-caption">{campaign.location}</p>
          </section>
        </aside>
      </section>
    </main>
  );
}
