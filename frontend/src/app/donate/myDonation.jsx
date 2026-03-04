import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  Building2,
  CalendarDays,
  Download,
  Filter,
  GraduationCap,
  HandHeart,
  Reply,
  Search,
  Share2,
  Stethoscope,
  Waves,
} from 'lucide-react';
import './myDonation.css';

const summaryCards = [
  {
    title: 'TOTAL LIFETIME GIVING',
    value: '$24,850.00',
    subtitle: '12% increase from last year',
    icon: <Banknote className="my-donation-icon-svg" />,
    iconBox: 'my-donation-summary-icon-blue',
    subtitleColor: 'my-donation-summary-subtitle-success',
  },
  {
    title: 'ORGANIZATIONS SUPPORTED',
    value: '18',
    subtitle: 'Direct support to local & global entities',
    icon: <Building2 className="my-donation-icon-svg" />,
    iconBox: 'my-donation-summary-icon-green',
    subtitleColor: 'my-donation-summary-subtitle-muted',
  },
  {
    title: 'IMPACT (LIVES TOUCHED)',
    value: '1,420',
    subtitle: 'Across environmental & social sectors',
    icon: <HandHeart className="my-donation-icon-svg" />,
    iconBox: 'my-donation-summary-icon-amber',
    subtitleColor: 'my-donation-summary-subtitle-muted',
  },
];

const donations = [
  {
    date: 'Oct 24, 2023',
    amount: '$500.00',
    recipient: 'Global Relief Org',
    subCause: 'Clean Water Initiative',
    status: 'COMPLETED',
    icon: <Waves className="my-donation-cause-icon-svg" />,
    iconBg: 'my-donation-cause-icon-blue',
    statusClass: 'my-donation-status-completed',
  },
  {
    date: 'Sep 15, 2023',
    amount: '$2,000.00',
    recipient: 'Dr. Sarah Jenkins',
    subCause: "Girls' Education Fund",
    status: 'COMPLETED',
    icon: <GraduationCap className="my-donation-cause-icon-svg" />,
    iconBg: 'my-donation-cause-icon-amber',
    statusClass: 'my-donation-status-completed',
  },
  {
    date: 'Aug 28, 2023',
    amount: '$100.00',
    recipient: 'HealthWatch International',
    subCause: 'Community Health Center Support',
    status: 'RECURRING',
    icon: <Stethoscope className="my-donation-cause-icon-svg" />,
    iconBg: 'my-donation-cause-icon-green',
    statusClass: 'my-donation-status-recurring',
  },
  {
    date: 'Aug 10, 2023',
    amount: '$5,000.00',
    recipient: 'Emergency Task Force',
    subCause: 'Disaster Relief Fund',
    status: 'PENDING',
    icon: <HandHeart className="my-donation-cause-icon-svg" />,
    iconBg: 'my-donation-cause-icon-rose',
    statusClass: 'my-donation-status-pending',
  },
];

export default function MyDonation() {
  const [selectedDonation, setSelectedDonation] = useState(null);

  const handleOpenSavePopup = (donation) => {
    setSelectedDonation(donation);
  };

  const handleCloseSavePopup = () => {
    setSelectedDonation(null);
  };

  return (
    <div className="my-donation-page">
      <main className="my-donation-container">
        <div className="my-donation-head">
          <div>
            <h1 className="my-donation-title">My Donation</h1>
            <p className="my-donation-subtitle">
              Detailed record of your contributions and the organizations you support.
            </p>
          </div>
          <button type="button" className="my-donation-export-btn">
            <Download className="my-donation-btn-icon" />
            Export All Records
          </button>
        </div>

        <section className="my-donation-summary-grid">
          {summaryCards.map((card) => (
            <article key={card.title} className="my-donation-summary-card">
              <div className="my-donation-summary-top">
                <span className={`my-donation-summary-icon ${card.iconBox}`}>{card.icon}</span>
                <p className="my-donation-summary-title">{card.title}</p>
              </div>
              <p className="my-donation-summary-value">{card.value}</p>
              <p className={`my-donation-summary-subtitle ${card.subtitleColor}`}>{card.subtitle}</p>
            </article>
          ))}
        </section>

        <section className="my-donation-toolbar">
          <label className="my-donation-search-wrap">
            <Search className="my-donation-search-icon" />
            <input
              type="text"
              placeholder="Search by recipient or project..."
              className="my-donation-search-input"
            />
          </label>
          <button type="button" className="my-donation-filter-time">
            <CalendarDays className="my-donation-small-icon" />
            All Time
          </button>
          <button type="button" className="my-donation-filter-btn">
            <Filter className="my-donation-medium-icon" />
          </button>
        </section>

        <section className="my-donation-list">
          {donations.map((item) => (
            <article key={`${item.recipient}-${item.amount}`} className="my-donation-row">
              <div>
                <p className="my-donation-label">DATE</p>
                <p className="my-donation-date">{item.date}</p>
              </div>
              <div>
                <p className="my-donation-label">AMOUNT</p>
                <p className="my-donation-amount">{item.amount}</p>
              </div>
              <div>
                <p className="my-donation-label">CAUSE & RECIPIENT</p>
                <div className="my-donation-recipient-wrap">
                  <span className={`my-donation-cause-icon ${item.iconBg}`}>{item.icon}</span>
                  <div>
                    <p className="my-donation-recipient">RECIPIENT: {item.recipient}</p>
                    <p className="my-donation-sub-cause">Sub-cause: {item.subCause}</p>
                  </div>
                </div>
              </div>
              <div className="my-donation-status-wrap">
                <span className={`my-donation-status ${item.statusClass}`}>{item.status}</span>
              </div>
              <button
                type="button"
                className="my-donation-icon-btn"
                aria-label="Save donation"
                onClick={() => handleOpenSavePopup(item)}
              >
                <Download className="my-donation-action-icon" />
              </button>
              <div className="my-donation-actions">
                <button type="button" className="my-donation-icon-btn">
                  <Share2 className="my-donation-action-icon" strokeWidth={2.7} />
                </button>
                <Link to="/donations/view-detail" className="my-donation-detail-btn">
                  View Details
                </Link>
              </div>
            </article>
          ))}
        </section>

        <div className="my-donation-bottom-action">
          <button type="button" className="my-donation-view-all-btn">
            View All
          </button>
        </div>
      </main>

      {selectedDonation && (
        <div className="my-donation-modal-overlay" onClick={handleCloseSavePopup}>
          <div
            className="my-donation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-donation-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="save-donation-title">Save Donation Record</h2>
            <p>
              Save this donation to your quick-access list?
            </p>

            <div className="my-donation-modal-details">
              <div>
                <span>Date</span>
                <strong>{selectedDonation.date}</strong>
              </div>
              <div>
                <span>Amount</span>
                <strong>{selectedDonation.amount}</strong>
              </div>
              <div>
                <span>Recipient</span>
                <strong>{selectedDonation.recipient}</strong>
              </div>
            </div>

            <div className="my-donation-modal-actions">
              <button type="button" className="my-donation-modal-btn secondary" onClick={handleCloseSavePopup}>
                Cancel
              </button>
              <button type="button" className="my-donation-modal-btn primary" onClick={handleCloseSavePopup}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
