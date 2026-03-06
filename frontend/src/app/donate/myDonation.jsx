import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  Building2,
  CalendarDays,
  Check,
  Copy,
  Download,
  Filter,
  GraduationCap,
  HandHeart,
  Linkedin,
  Reply,
  Search,
  Send,
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
  const [shareDonation, setShareDonation] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showAllDonations, setShowAllDonations] = useState(false);
  const [isTimePopupOpen, setIsTimePopupOpen] = useState(false);
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const [timeFilterLabel, setTimeFilterLabel] = useState('All Time');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [sortOrder, setSortOrder] = useState('Newest');
  const timeFilterRef = useRef(null);
  const mainFilterRef = useRef(null);
  const timeFilterOptions = ['All Time', 'This Month', 'Last Month', 'Last 3 Months', 'This Year'];
  const statusFilterOptions = ['All Status', 'COMPLETED', 'RECURRING', 'PENDING'];
  const sortOptions = ['Newest', 'Oldest'];

  const latestDonationTime = donations.reduce((latest, item) => {
    const itemTime = new Date(item.date).getTime();
    return itemTime > latest ? itemTime : latest;
  }, 0);
  const referenceDate = new Date(latestDonationTime || Date.now());

  const isInTimeRange = (itemDate) => {
    if (timeFilterLabel === 'All Time') return true;

    const date = new Date(itemDate);
    if (Number.isNaN(date.getTime())) return false;

    const itemYear = date.getFullYear();
    const itemMonth = date.getMonth();
    const refYear = referenceDate.getFullYear();
    const refMonth = referenceDate.getMonth();

    if (timeFilterLabel === 'This Year') {
      return itemYear === refYear;
    }

    if (timeFilterLabel === 'This Month') {
      return itemYear === refYear && itemMonth === refMonth;
    }

    if (timeFilterLabel === 'Last Month') {
      const lastMonthDate = new Date(refYear, refMonth - 1, 1);
      return itemYear === lastMonthDate.getFullYear() && itemMonth === lastMonthDate.getMonth();
    }

    if (timeFilterLabel === 'Last 3 Months') {
      const start = new Date(refYear, refMonth - 2, 1);
      const end = new Date(refYear, refMonth + 1, 0, 23, 59, 59, 999);
      return date >= start && date <= end;
    }

    return true;
  };

  const filteredDonations = donations
    .filter((item) => isInTimeRange(item.date))
    .filter((item) => statusFilter === 'All Status' || item.status === statusFilter)
    .sort((a, b) => {
      const aDate = new Date(a.date).getTime();
      const bDate = new Date(b.date).getTime();
      if (sortOrder === 'Oldest') return aDate - bDate;
      return bDate - aDate;
    });

  const visibleDonations = showAllDonations ? filteredDonations : filteredDonations.slice(0, 3);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedTimeFilter = timeFilterRef.current?.contains(event.target);
      const clickedMainFilter = mainFilterRef.current?.contains(event.target);

      if (!clickedTimeFilter) setIsTimePopupOpen(false);
      if (!clickedMainFilter) setIsFilterPopupOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getReceiptNumber = () => `RCP-${Date.now().toString().slice(-8)}`;
  const escapeHtml = (value = '') =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

  const getReceiptHtml = (donation) => {
    const issuedOn = escapeHtml(new Date().toLocaleString());
    const receiptNumber = escapeHtml(getReceiptNumber());

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Donation Receipt</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 30px;
      background: #f3f6fb;
      color: #0f172a;
      font-family: "Courier New", Courier, monospace;
    }
    .receipt {
      width: min(430px, 100%);
      margin: 0 auto;
      background: #fff;
      border: 1px dashed #94a3b8;
      border-radius: 10px;
      padding: 22px 18px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.14);
    }
    .center { text-align: center; }
    h1 {
      margin: 0;
      font-size: 20px;
      letter-spacing: 0.06em;
    }
    .muted {
      color: #475569;
      font-size: 13px;
      margin-top: 6px;
    }
    .sep {
      margin: 12px 0;
      border-top: 1px dashed #cbd5e1;
    }
    .line {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      margin: 7px 0;
      font-size: 14px;
    }
    .line strong {
      text-align: right;
      max-width: 62%;
      word-break: break-word;
    }
    .thanks {
      margin-top: 16px;
      text-align: center;
      font-size: 13px;
      color: #334155;
    }
    @media print {
      body {
        background: #fff;
        padding: 0;
      }
      .receipt {
        box-shadow: none;
        border-color: #64748b;
      }
    }
  </style>
</head>
<body>
  <main class="receipt">
    <div class="center">
      <h1>DONATION RECEIPT</h1>
      <div class="muted">Chomnuoy System</div>
    </div>
    <div class="sep"></div>
    <div class="line"><span>Receipt #</span><strong>${receiptNumber}</strong></div>
    <div class="line"><span>Issued On</span><strong>${issuedOn}</strong></div>
    <div class="sep"></div>
    <div class="line"><span>Date</span><strong>${escapeHtml(donation.date)}</strong></div>
    <div class="line"><span>Amount</span><strong>${escapeHtml(donation.amount)}</strong></div>
    <div class="line"><span>Recipient</span><strong>${escapeHtml(donation.recipient)}</strong></div>
    <div class="line"><span>Sub-cause</span><strong>${escapeHtml(donation.subCause)}</strong></div>
    <div class="sep"></div>
    <p class="thanks">Thank you for your contribution.</p>
  </main>
</body>
</html>`;
  };

  const getAllRecordsHtml = () => {
    const issuedOn = escapeHtml(new Date().toLocaleString());
    const totalRecords = donations.length;

    const rowsHtml = donations
      .map(
        (item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.date)}</td>
        <td>${escapeHtml(item.amount)}</td>
        <td>${escapeHtml(item.recipient)}</td>
        <td>${escapeHtml(item.subCause)}</td>
        <td>${escapeHtml(item.status)}</td>
      </tr>`,
      )
      .join('');

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>All Donation Records</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      background: #f3f6fb;
      color: #0f172a;
      font-family: "Segoe UI", Arial, sans-serif;
    }
    .sheet {
      max-width: 960px;
      margin: 0 auto;
      background: #fff;
      border: 1px solid #dbe3ee;
      border-radius: 12px;
      padding: 18px;
    }
    h1 {
      margin: 0;
      font-size: 24px;
    }
    .meta {
      margin-top: 6px;
      color: #475569;
      font-size: 13px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      font-size: 13px;
    }
    th, td {
      border: 1px solid #dbe3ee;
      padding: 8px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #eff6ff;
      font-weight: 700;
    }
    @media print {
      body {
        background: #fff;
        padding: 0;
      }
      .sheet {
        border: 0;
        border-radius: 0;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <main class="sheet">
    <h1>All Donation Records</h1>
    <p class="meta">Generated on: ${issuedOn} | Total records: ${totalRecords}</p>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Date</th>
          <th>Amount</th>
          <th>Recipient</th>
          <th>Sub-cause</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </main>
</body>
</html>`;
  };

  const handleSaveDonationPdf = () => {
    if (!selectedDonation) return;

    const printWindow = window.open('', '_blank', 'width=560,height=760');
    if (!printWindow) return;

    printWindow.document.write(getReceiptHtml(selectedDonation));
    printWindow.document.close();
    printWindow.focus();
    printWindow.onafterprint = () => printWindow.close();

    setTimeout(() => {
      printWindow.print();
      handleCloseSavePopup();
    }, 250);
  };

  const handleExportAllRecords = () => {
    const printWindow = window.open('', '_blank', 'width=1100,height=760');
    if (!printWindow) return;

    printWindow.document.write(getAllRecordsHtml());
    printWindow.document.close();
    printWindow.focus();
    printWindow.onafterprint = () => printWindow.close();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleOpenSavePopup = (donation) => {
    setSelectedDonation(donation);
  };

  const handleCloseSavePopup = () => {
    setSelectedDonation(null);
  };

  const handleOpenSharePopup = (donation) => {
    setShareDonation(donation);
    setCopied(false);
  };

  const handleCloseSharePopup = () => {
    setShareDonation(null);
    setCopied(false);
  };

  const getShareText = (donation) =>
    `I donated ${donation.amount} to ${donation.recipient} (${donation.subCause}).`;

  const getShareUrl = () => {
    const baseUrl = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');
    return `${baseUrl}/donations/view-detail`;
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const handleShare = (platform) => {
    if (!shareDonation) return;

    const encodedUrl = encodeURIComponent(getShareUrl());

    const shareUrl =
      platform === 'telegram'
        ? `https://t.me/share/url?url=${encodedUrl}`
        : `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    handleCloseSharePopup();
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
          <button type="button" className="my-donation-export-btn" onClick={handleExportAllRecords}>
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
          <div className="my-donation-time-filter-wrap" ref={timeFilterRef}>
            <button
              type="button"
              className="my-donation-filter-time"
              onClick={() => {
                setIsFilterPopupOpen(false);
                setIsTimePopupOpen((prev) => !prev);
              }}
              aria-expanded={isTimePopupOpen}
              aria-haspopup="menu"
            >
              <CalendarDays className="my-donation-small-icon" />
              {timeFilterLabel}
            </button>
            {isTimePopupOpen && (
              <div className="my-donation-time-popup" role="menu">
                {timeFilterOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="menuitem"
                    className={`my-donation-time-option ${timeFilterLabel === option ? 'active' : ''}`}
                    onClick={() => {
                      setTimeFilterLabel(option);
                      setIsTimePopupOpen(false);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="my-donation-main-filter-wrap" ref={mainFilterRef}>
            <button
              type="button"
              className="my-donation-filter-btn"
              onClick={() => {
                setIsTimePopupOpen(false);
                setIsFilterPopupOpen((prev) => !prev);
              }}
              aria-expanded={isFilterPopupOpen}
              aria-haspopup="menu"
            >
              <Filter className="my-donation-medium-icon" />
            </button>
            {isFilterPopupOpen && (
              <div className="my-donation-main-filter-popup" role="menu">
                <p className="my-donation-main-filter-title">Status</p>
                <div className="my-donation-main-filter-row">
                  {statusFilterOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      role="menuitem"
                      className={`my-donation-main-filter-chip ${statusFilter === option ? 'active' : ''}`}
                      onClick={() => setStatusFilter(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <p className="my-donation-main-filter-title">Sort By</p>
                <div className="my-donation-main-filter-row">
                  {sortOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      role="menuitem"
                      className={`my-donation-main-filter-chip ${sortOrder === option ? 'active' : ''}`}
                      onClick={() => setSortOrder(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="my-donation-list">
          {visibleDonations.map((item) => (
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
                <button
                  type="button"
                  className="my-donation-icon-btn"
                  aria-label="Share donation"
                  onClick={() => handleOpenSharePopup(item)}
                >
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
          <button
            type="button"
            className="my-donation-view-all-btn"
            onClick={() => setShowAllDonations((prev) => !prev)}
          >
            {showAllDonations ? 'View Less' : 'View All'}
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
              <button type="button" className="my-donation-modal-btn primary" onClick={handleSaveDonationPdf}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {shareDonation && (
        <div className="my-donation-modal-overlay" onClick={handleCloseSharePopup}>
          <div
            className="my-donation-modal my-donation-share-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-donation-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="my-donation-share-head">
              <div className="my-donation-share-link-icon">
                <Reply className="my-donation-action-icon" />
              </div>
              <h2 id="share-donation-title">Share Your Impact</h2>
              <p>Share this contribution with your network.</p>
            </div>

            <div className="my-donation-modal-details my-donation-share-details">
              <div>
                <span>Amount</span>
                <strong>{shareDonation.amount}</strong>
              </div>
              <div>
                <span>Recipient</span>
                <strong>{shareDonation.recipient}</strong>
              </div>
              <div>
                <span>Project</span>
                <strong>{shareDonation.subCause}</strong>
              </div>
            </div>

            <div className="my-donation-share-link-box">
              <input
                type="text"
                readOnly
                value={getShareUrl()}
                className="my-donation-share-link-input"
                aria-label="Share link"
              />
              <button type="button" className="my-donation-copy-btn" onClick={handleCopyShareLink}>
                {copied ? <Check className="my-donation-btn-icon" /> : <Copy className="my-donation-btn-icon" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <p className="my-donation-share-message">{getShareText(shareDonation)}</p>

            <div className="my-donation-share-actions">
              <button type="button" className="my-donation-share-btn linkedin" onClick={() => handleShare('linkedin')}>
                <Linkedin className="my-donation-btn-icon" />
                Share on LinkedIn
              </button>
              <button type="button" className="my-donation-share-btn telegram" onClick={() => handleShare('telegram')}>
                <Send className="my-donation-btn-icon" />
                Share on Telegram
              </button>
            </div>

            <div className="my-donation-modal-actions">
              <button type="button" className="my-donation-modal-btn secondary" onClick={handleCloseSharePopup}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
