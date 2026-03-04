import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  CreditCard,
  Download,
  FileText,
  GraduationCap,
  HeartHandshake,
  Linkedin,
  Printer,
  Send,
} from 'lucide-react';
import './viewDetail.css';

export default function ViewDetail() {
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
            <p className="donation-detail-subtitle">Detailed receipt and impact report for your contribution.</p>
          </div>
          <div className="donation-detail-top-actions">
            <button type="button" className="donation-detail-print-btn">
              <Printer className="donation-detail-btn-icon" />
              Print
            </button>
            <button type="button" className="donation-detail-download-btn">
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
                  <p className="donation-detail-value">#TXN-98234102</p>
                </div>
                <div>
                  <p className="donation-detail-key">Date</p>
                  <p className="donation-detail-value">Sept 15, 2023</p>
                </div>
                <div>
                  <p className="donation-detail-key">Amount</p>
                  <p className="donation-detail-amount">$2,000.00</p>
                </div>
                <div>
                  <p className="donation-detail-key">Payment Method</p>
                  <p className="donation-detail-value with-icon">
                    <CreditCard className="donation-detail-inline-icon" />
                    Visa **** 4422
                  </p>
                </div>
              </div>
            </article>

            <article className="donation-detail-impact-card">
              <h2 className="donation-detail-card-title success">IMPACT REPORT</h2>
              <div className="donation-detail-impact-main">
                <div className="donation-detail-impact-icon-box">
                  <GraduationCap className="donation-detail-impact-icon" />
                </div>
                <div>
                  <h3 className="donation-detail-impact-title">Education Empowered</h3>
                  <p className="donation-detail-impact-text">
                    Your donation of <strong>$2,000.00</strong> has successfully <strong>provided 5 scholarships</strong>{' '}
                    for girls at the Bright Future Academy for a full academic semester.
                  </p>
                </div>
                <HeartHandshake className="donation-detail-watermark" />
              </div>

              <div className="donation-detail-impact-stats">
                <div className="donation-detail-impact-mini-card">
                  <p>TARGET MET</p>
                  <strong>100%</strong>
                </div>
                <div className="donation-detail-impact-mini-card">
                  <p>LIVES IMPACTED</p>
                  <strong>5 Students</strong>
                </div>
                <div className="donation-detail-impact-mini-card">
                  <p>DURATION</p>
                  <strong>6 Months</strong>
                </div>
              </div>
            </article>

            <section className="donation-detail-share">
              <h2 className="donation-detail-card-title">SHARE THIS IMPACT STORY</h2>
              <div className="donation-detail-share-grid">
                <button type="button" className="donation-detail-share-btn linkedin">
                  <Linkedin className="donation-detail-btn-icon" />
                  LinkedIn
                </button>
                <button type="button" className="donation-detail-share-btn telegram">
                  <Send className="donation-detail-btn-icon" />
                  Telegram
                </button>
              </div>
            </section>
          </div>

          <aside className="donation-detail-right-card">
            <h2 className="donation-detail-card-title">RECIPIENT INFORMATION</h2>
            <div className="donation-detail-avatar">
              <GraduationCap className="donation-detail-avatar-icon" />
            </div>
            <h3 className="donation-detail-recipient-name">Dr. Sarah Jenkins</h3>
            <p className="donation-detail-recipient-link">Girls' Education Fund</p>

            <div className="donation-detail-divider" />

            <h4 className="donation-detail-subhead">OUR MISSION</h4>
            <p className="donation-detail-mission">
              "Empowering young women through comprehensive education, mentorship, and financial support to break the
              cycle of poverty and lead their communities."
            </p>

            <div className="donation-detail-divider" />

            <div className="donation-detail-meta-row">
              <span>TAX ID (EIN)</span>
              <strong>12-3456789</strong>
            </div>
            <div className="donation-detail-meta-row">
              <span>STATUS</span>
              <strong className="donation-detail-status-chip">501(c)(3)</strong>
            </div>

            <div className="donation-detail-divider" />

            <h4 className="donation-detail-subhead">DOCUMENTS</h4>
            <button type="button" className="donation-detail-doc-btn">
              <FileText className="donation-detail-btn-icon" />
              Official Tax Receipt
              <Download className="donation-detail-mini-download" />
            </button>
            <button type="button" className="donation-detail-doc-btn">
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
