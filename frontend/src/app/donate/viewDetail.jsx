import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { verifyBakongTransaction } from '../../services/user-service';
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Download,
  FileText,
  HandHeart,
  HeartHandshake,
  Linkedin,
  Send,
  Wallet,
  ScanQrCode,
  MapPin,
} from 'lucide-react';
import './viewDetail.css';

const LAST_DONATION_DETAIL_KEY = 'chomnuoy_last_donation_detail';
const PENDING_BAKONG_TRANSACTION_KEY = 'chomnuoy_pending_bakong_transaction';

function getSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStorageFileUrl(path) {
  if (!path) return '';
  const rawPath = String(path).trim();
  if (
    rawPath.startsWith('http://') ||
    rawPath.startsWith('https://') ||
    rawPath.startsWith('blob:') ||
    rawPath.startsWith('data:')
  ) {
    return rawPath;
  }

  const normalizedPath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const appBase = apiBase.replace(/\/api\/?$/, '');
  if (normalizedPath.startsWith('uploads/')) {
    return `${appBase}/${normalizedPath}`;
  }
  if (normalizedPath.startsWith('storage/')) {
    return `${appBase}/${normalizedPath}`;
  }
  return `${appBase}/storage/${normalizedPath}`;
}

function getPaymentMeta(method = '') {
  const normalized = String(method).toLowerCase();
  if (
    normalized.includes('bakong') ||
    normalized.includes('khqr') ||
    normalized.includes('qr') ||
    normalized.includes('chomnuoy donation') ||
    normalized.includes('online donation')
  ) {
    return { icon: ScanQrCode, label: 'Bakong KHQR' };
  }
  return { icon: Wallet, label: 'ABA Pay' };
}

function isSuccessfulPaymentStatus(status = '') {
  const normalized = String(status || '').trim().toUpperCase();
  return ['SUCCESS', 'COMPLETED', 'CONFIRMED', 'PAID'].includes(normalized);
}

function extractCampaignIdFromBillNumber(billNumber) {
  const raw = String(billNumber || '').trim();
  const match = raw.match(/^DON-(\d+)-/i);
  return match ? Number(match[1]) : 0;
}

function formatDetailAmount(detail) {
  const rawValue = String(detail?.amount ?? '').trim();
  const isMaterial = Boolean(detail?.isMaterial) || rawValue.toLowerCase().includes('item');

  if (isMaterial) {
    const numericAmount = Number(rawValue.replace(/[^\d.]/g, ''));
    if (Number.isFinite(numericAmount) && numericAmount > 0) {
      return `${numericAmount.toLocaleString('en-US')} item${numericAmount === 1 ? '' : 's'}`;
    }
    return rawValue.replace(/^\$/, '');
  }

  if (rawValue.startsWith('$')) {
    return rawValue;
  }

  return `$${rawValue}`;
}

export default function ViewDetail() {
  const location = useLocation();
  const [detail, setDetail] = useState(() => {
    const fromState = location.state?.donation;
    if (fromState) return fromState;
    try {
      const raw = window.sessionStorage.getItem(LAST_DONATION_DETAIL_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!detail);
  const [error, setError] = useState('');

  const session = getSession();
  const userId = Number(session?.userId ?? 0);

  useEffect(() => {
    if (detail || !userId) {
      setLoading(false);
      return;
    }

    let alive = true;
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

    const verifyPendingTransaction = async () => {
      try {
        const raw = window.sessionStorage.getItem(PENDING_BAKONG_TRANSACTION_KEY);
        if (!raw) return;
        const pending = JSON.parse(raw);
        if (!pending?.tranId) return;
        await verifyBakongTransaction(pending.tranId);
        window.sessionStorage.removeItem(PENDING_BAKONG_TRANSACTION_KEY);
      } catch {
        // Let the page continue loading local records even if verification is not reachable yet.
      }
    };

    verifyPendingTransaction().then(() => Promise.all([
      fetch(`${apiBase}/donations`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${apiBase}/campaigns`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${apiBase}/payments`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${apiBase}/organizations`).then((r) => (r.ok ? r.json() : [])),
    ]))
      .then(([donationsData, campaignsData, paymentsData, organizationsData]) => {
        if (!alive) return;

        const donations = Array.isArray(donationsData) ? donationsData : [];
        const latestDonation = donations
          .filter((item) => Number(item.user_id) === userId)
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0] || null;

        const campaignList = Array.isArray(campaignsData) ? campaignsData : [];
        const paymentList = Array.isArray(paymentsData) ? paymentsData : [];
        const organizationList = Array.isArray(organizationsData) ? organizationsData : [];
        const latestDirectPayment = paymentList
          .filter((item) => Number(item.user_id) === userId && !Number(item.donation_id || 0) && isSuccessfulPaymentStatus(item.status))
          .sort((a, b) => new Date(b.paid_at || b.created_at || 0).getTime() - new Date(a.paid_at || a.created_at || 0).getTime())[0] || null;

        const latestDonationTime = latestDonation ? new Date(latestDonation.created_at || 0).getTime() : 0;
        const latestPaymentTime = latestDirectPayment ? new Date(latestDirectPayment.paid_at || latestDirectPayment.created_at || 0).getTime() : 0;

        if (!latestDonation && !latestDirectPayment) {
          setError('No donation details available yet.');
          setLoading(false);
          return;
        }

        if (latestDonation && latestDonationTime >= latestPaymentTime) {
          const campaign = campaignList.find((item) => Number(item.id) === Number(latestDonation.campaign_id));
          const payment = paymentList.find((item) => Number(item.donation_id) === Number(latestDonation.id));
          const organization = organizationList.find((item) => Number(item.id) === Number(latestDonation.organization_id));

          const nextDetail = {
            donationId: latestDonation.id,
            amount: Number(latestDonation.amount || 0).toFixed(2),
            date: new Date(latestDonation.created_at || Date.now()).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }),
            transactionId: payment?.transaction_id ? `#${payment.transaction_id}` : `#DON-${latestDonation.id}`,
            paymentMethod: payment?.store_label || payment?.terminal_label || 'Bakong KHQR',
            campaignTitle: campaign?.title || 'Campaign',
            campaignImage:
              getStorageFileUrl(campaign?.image_path) ||
              campaign?.image ||
              'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
            campaignLocation: campaign?.location || organization?.location || 'Cambodia',
            organizationName: organization?.name || campaign?.organization_name || 'Organization',
            receiptMessage: campaign?.receipt_message || '',
            status: latestDonation.status || 'completed',
          };

          setDetail(nextDetail);
          window.sessionStorage.setItem(LAST_DONATION_DETAIL_KEY, JSON.stringify(nextDetail));
          setLoading(false);
          return;
        }

        const campaignId = extractCampaignIdFromBillNumber(latestDirectPayment?.bill_number);
        const campaign = campaignList.find((item) => Number(item.id) === campaignId);
        const organization = organizationList.find((item) => Number(item.id) === Number(campaign?.organization_id || 0));

        const nextDetail = {
          donationId: null,
          amount: Number(latestDirectPayment?.amount || 0).toFixed(2),
          date: new Date(latestDirectPayment?.paid_at || latestDirectPayment?.created_at || Date.now()).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }),
          transactionId: latestDirectPayment?.transaction_id ? `#${latestDirectPayment.transaction_id}` : `#PAY-${latestDirectPayment?.id || ''}`,
          paymentMethod: latestDirectPayment?.store_label || latestDirectPayment?.terminal_label || 'Bakong KHQR',
          campaignTitle: campaign?.title || 'Campaign',
          campaignImage:
            getStorageFileUrl(campaign?.image_path) ||
            campaign?.image ||
            'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
          campaignLocation: campaign?.location || organization?.location || 'Cambodia',
          organizationName: organization?.name || 'Organization',
          receiptMessage: campaign?.receipt_message || '',
          status: latestDirectPayment?.status || 'success',
        };

        setDetail(nextDetail);
        window.sessionStorage.setItem(LAST_DONATION_DETAIL_KEY, JSON.stringify(nextDetail));
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Failed to load donation details.');
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [detail, userId]);

  const paymentMeta = useMemo(() => getPaymentMeta(detail?.paymentMethod), [detail?.paymentMethod]);
  const PaymentIcon = paymentMeta.icon;
  const amountLabel = formatDetailAmount(detail);
  const shareMessage = detail
    ? `I just supported ${detail.campaignTitle} through Chomnuoy.`
    : 'I just supported a campaign through Chomnuoy.';

  const handleDownloadPdf = () => {
    window.print();
  };

  const handleShare = (platform) => {
    const baseUrl = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');
    const shareUrl = `${baseUrl}/donations/view-detail`;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedMessage = encodeURIComponent(shareMessage);

    const targetUrl =
      platform === 'telegram'
        ? `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`
        : `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="donation-detail-page">
        <main className="donation-detail-container">
          <p className="donation-detail-subtitle">Loading donation details...</p>
        </main>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="donation-detail-page">
        <main className="donation-detail-container">
          <Link to="/donations" className="donation-detail-back-link">
            <ArrowLeft className="donation-detail-back-icon" />
            Back to History
          </Link>
          <p className="donation-detail-subtitle">{error || 'No donation details available yet.'}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="donation-detail-page">
      <main className="donation-detail-container">
        <Link to="/donations" className="donation-detail-back-link">
          <ArrowLeft className="donation-detail-back-icon" />
          Back to History
        </Link>

        <section className="donation-detail-top-head">
          <div>
            <span className="donation-detail-verified-badge">
              <BadgeCheck className="donation-detail-small-icon" />
              TRANSACTION VERIFIED
            </span>
            <h1 className="donation-detail-title">Donation Details</h1>
            <p className="donation-detail-subtitle">Detailed receipt and campaign impact summary from your real donation.</p>
          </div>
          <div className="donation-detail-top-actions">
            <button type="button" className="donation-detail-download-btn" onClick={handleDownloadPdf}>
              <Download className="donation-detail-btn-icon" />
              Download Receipt
            </button>
          </div>
        </section>

        <section className="donation-detail-content-grid">
          <div className="donation-detail-left-col">
            <article className="donation-detail-card">
              <h2 className="donation-detail-card-title">TRANSACTION SUMMARY</h2>
              <div className="donation-detail-summary-grid">
                <div>
                  <p className="donation-detail-key">Transaction ID</p>
                  <p className="donation-detail-value transaction-id">{detail.transactionId}</p>
                </div>
                <div>
                  <p className="donation-detail-key">Date</p>
                  <p className="donation-detail-value">{detail.date}</p>
                </div>
                <div>
                  <p className="donation-detail-key">Amount</p>
                  <p className="donation-detail-amount">{amountLabel}</p>
                </div>
                <div>
                  <p className="donation-detail-key">Payment Method</p>
                  <p className="donation-detail-value with-icon">
                    <PaymentIcon className="donation-detail-inline-icon" />
                    {paymentMeta.label}
                  </p>
                </div>
              </div>
            </article>

            <article className="donation-detail-impact-card">
              <h2 className="donation-detail-card-title success">IMPACT REPORT</h2>
              <div className="donation-detail-impact-main">
                <div className="donation-detail-impact-icon-box">
                  <HandHeart className="donation-detail-impact-icon" />
                </div>
                <div>
                  <h3 className="donation-detail-impact-title">Contribution Recorded</h3>
                  <p className="donation-detail-impact-text">
                    Your donation of <strong>{amountLabel}</strong> was recorded for <strong>{detail.campaignTitle}</strong>.
                    {detail.receiptMessage ? ` ${detail.receiptMessage}` : ' You can track the campaign progress from your donor dashboard.'}
                  </p>
                </div>
                <HeartHandshake className="donation-detail-watermark" />
              </div>

              <div className="donation-detail-impact-stats">
                <div className="donation-detail-impact-mini-card">
                  <p>STATUS</p>
                  <strong>{String(detail.status || 'completed').toUpperCase()}</strong>
                </div>
                <div className="donation-detail-impact-mini-card">
                  <p>CAMPAIGN</p>
                  <strong>{detail.campaignTitle}</strong>
                </div>
                <div className="donation-detail-impact-mini-card">
                  <p>LOCATION</p>
                  <strong>{detail.campaignLocation}</strong>
                </div>
              </div>
            </article>

            <section className="donation-detail-share">
              <h2 className="donation-detail-card-title">SHARE THIS IMPACT STORY</h2>
              <div className="donation-detail-share-grid">
                <button
                  type="button"
                  className="donation-detail-share-btn linkedin"
                  onClick={() => handleShare('linkedin')}
                >
                  <Linkedin className="donation-detail-btn-icon" />
                  LinkedIn
                </button>
                <button
                  type="button"
                  className="donation-detail-share-btn telegram"
                  onClick={() => handleShare('telegram')}
                >
                  <Send className="donation-detail-btn-icon" />
                  Telegram
                </button>
              </div>
            </section>
          </div>

          <aside className="donation-detail-right-card">
            <h2 className="donation-detail-card-title">RECIPIENT INFORMATION</h2>
            <div className="donation-detail-avatar donation-detail-avatar-image">
              <img src={detail.campaignImage} alt={detail.campaignTitle} />
            </div>
            <h3 className="donation-detail-recipient-name">{detail.organizationName}</h3>
            <p className="donation-detail-recipient-link">{detail.campaignTitle}</p>

            <div className="donation-detail-divider" />

            <h4 className="donation-detail-subhead">CAMPAIGN LOCATION</h4>
            <p className="donation-detail-mission">
              <MapPin className="donation-detail-inline-icon" /> {detail.campaignLocation}
            </p>

            <div className="donation-detail-divider" />

            <div className="donation-detail-meta-row">
              <span>DONATION ID</span>
              <strong>#{detail.donationId || '--'}</strong>
            </div>
            <div className="donation-detail-meta-row">
              <span>STATUS</span>
              <strong className="donation-detail-status-chip">{String(detail.status || 'completed').toUpperCase()}</strong>
            </div>

            <div className="donation-detail-divider" />

            <h4 className="donation-detail-subhead">DOCUMENTS</h4>
            <button type="button" className="donation-detail-doc-btn" onClick={handleDownloadPdf}>
              <FileText className="donation-detail-btn-icon" />
              Official Tax Receipt
              <Download className="donation-detail-mini-download" />
            </button>
            <button type="button" className="donation-detail-doc-btn" onClick={handleDownloadPdf}>
              <Award className="donation-detail-btn-icon" />
              Impact Certificate
              <Download className="donation-detail-mini-download" />
            </button>
          </aside>
        </section>
      </main>
    </div>
  );
}
