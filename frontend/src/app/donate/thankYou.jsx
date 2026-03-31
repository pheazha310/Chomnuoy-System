import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Circle,
  CircleCheckBig,
  Clock3,
  Download,
  MapPin,
  Share2,
  Package,
  Truck,
} from 'lucide-react';
import ROUTES from '@/constants/routes.js';
import '../../components/css/Campaigns.css';

const LAST_DONATION_DETAIL_KEY = 'chomnuoy_last_donation_detail';

function getStoredDonationDetail() {
  try {
    const raw = window.sessionStorage.getItem(LAST_DONATION_DETAIL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function DonationThankYouPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const detail = useMemo(() => {
    return location.state?.donation || getStoredDonationDetail();
  }, [location.state]);

  const campaignTitle = detail?.campaignTitle || 'Your Campaign';
  const campaignImage = detail?.campaignImage || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';
  const campaignLocation = detail?.campaignLocation || 'Cambodia';
  const organizationName = detail?.organizationName || 'Organization';
  const isMaterial = Boolean(detail?.isMaterial);

  const handleShare = () => {
    const shareUrl = `${window.location.origin}${ROUTES.DONATION_THANK_YOU}`;
    const text = isMaterial
      ? `My material donation for ${campaignTitle} was confirmed through Chomnuoy.`
      : `My donation to ${campaignTitle} was successful through Chomnuoy.`;

    if (navigator.share) {
      navigator.share({ title: 'Donation Complete', text, url: shareUrl }).catch(() => {});
      return;
    }

    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadReceipt = () => {
    navigate('/donations/view-detail', { state: { donation: detail } });
  };

  if (!detail) {
    return (
      <main className="campaign-detail-page donation-success-page">
        <section className="donation-success-card" aria-label="Donation success">
          <p className="donation-success-kicker">Donation Receipt</p>
          <h1>We could not find that receipt.</h1>
          <p className="donation-success-campaign">Please return to your donation history and open the latest record again.</p>
          <div className="donation-success-actions">
            <Link to="/donations" className="donation-success-primary">View My Donations</Link>
            <Link to="/AfterLoginHome" className="donation-success-secondary">Back Home</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="campaign-detail-page donation-success-page">
      <section className="donation-success-card" aria-label="Donation success">
        <div className="donation-success-icon">
          <CircleCheckBig size={36} />
        </div>
        <p className="donation-success-kicker">
          {isMaterial ? 'Material Donation Confirmed' : 'Payment Successful'}
        </p>
        <h1>{isMaterial ? 'Your kindness is on its way!' : 'Many Thanks, Your Donation Was Successful!'}</h1>
        <p className="donation-success-campaign">
          {isMaterial
            ? 'Your donation logistics have been confirmed for'
            : 'Your contribution has been recorded for'}
          {' '}
          <span>{campaignTitle}</span>
        </p>

        {isMaterial ? (
          <div className="donation-success-material-grid">
            <article className="donation-success-schedule-card">
              <div className="donation-success-card-head">
                <div>
                  <strong>Scheduled {detail?.paymentMethod === 'Material drop-off' ? 'Drop-off' : 'Pickup'}</strong>
                  <span>{detail?.transactionId ?? ''}</span>
                </div>
              </div>
              <div className="donation-success-schedule-meta">
                <div>
                  <span>Date</span>
                  <strong>{detail?.date ?? ''}</strong>
                </div>
                <div>
                  <span>Location</span>
                  <strong>{detail?.pickupAddress || 'Pending donor location'}</strong>
                </div>
              </div>
              <div className="donation-success-mini-grid">
                <article>
                  <Package size={16} />
                  <strong>{detail?.itemName || 'Material donation'}</strong>
                  <p>{detail?.amount}</p>
                </article>
                <article>
                  <Truck size={16} />
                  <strong>{organizationName}</strong>
                  <p>Preparing the next delivery step.</p>
                </article>
              </div>
            </article>

            <article className="donation-success-share-card">
              <img src={campaignImage} alt={campaignTitle} referrerPolicy="no-referrer" />
              <div className="donation-success-share-copy">
                <strong>Your support is officially scheduled.</strong>
                <p>Thank you for making this campaign stronger with real, useful items.</p>
              </div>
              <button type="button" className="donation-success-secondary" onClick={handleShare}>
                <Share2 size={15} /> Share Impact
              </button>
            </article>
          </div>
        ) : (
          <>
            <div className="donation-success-hero">
              <img src={campaignImage} alt={campaignTitle} referrerPolicy="no-referrer" />
              <div>
                <strong>{campaignTitle}</strong>
                <p>{organizationName}</p>
                <span><MapPin size={14} /> {campaignLocation}</span>
              </div>
            </div>

            <div className="donation-success-receipt">
              <div>
                <span>Amount</span>
                <strong>{`$${detail?.amount ?? '0.00'}`}</strong>
              </div>
              <div>
                <span>Transaction ID</span>
                <strong>{detail?.transactionId ?? ''}</strong>
              </div>
              <div>
                <span>Date</span>
                <strong className="is-highlighted">{detail?.date ?? ''}</strong>
              </div>
            </div>
          </>
        )}

        <div className="donation-success-actions">
          <button type="button" className="donation-success-primary" onClick={handleDownloadReceipt}>
            <Download size={15} /> View Receipt
          </button>
          <button type="button" className="donation-success-secondary" onClick={handleShare}>
            <Share2 size={15} /> Share
          </button>
          <button type="button" className="donation-success-secondary" onClick={() => navigate('/donations')}>
            My Donations
          </button>
        </div>

        {isMaterial ? null : (
          <div className="donation-success-next">
            <h2>What Happens Next?</h2>
            <div className="donation-success-steps">
              <div className="donation-success-step is-complete">
                <span className="step-icon"><CircleCheckBig size={14} /></span>
                <div>
                  <strong>Donation Received</strong>
                  <p>Your contribution has been successfully processed.</p>
                </div>
              </div>
              <div className="donation-success-step is-active">
                <span className="step-icon"><Clock3 size={14} /></span>
                <div>
                  <strong>Funds Routed to Campaign</strong>
                  <p>The campaign team can now see your support in their live totals.</p>
                </div>
              </div>
              <div className="donation-success-step">
                <span className="step-icon"><Circle size={14} /></span>
                <div>
                  <strong>Impact Update</strong>
                  <p>You can follow progress later from your donation history page.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
