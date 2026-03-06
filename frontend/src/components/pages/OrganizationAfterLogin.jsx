import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ROUTES from '../../constants/routes';
import {
  DONATION_PAYMENT_METHODS,
  DONATION_PRESET_AMOUNTS,
  DONOR_PAGE_SIZE,
  DONOR_SORT_OPTIONS,
  donorOrganizations,
  getDonorSession,
  getPaginationItems,
} from './organizationShared';
import '../css/organization.css';

function OrganizationAfterLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { organizationId } = useParams();

  const donorSession = getDonorSession();
  const isDonorLoggedIn = donorSession?.isLoggedIn && donorSession?.role === 'Donor';

  const [donorSearchInput, setDonorSearchInput] = useState('');
  const [donorSearchTerm, setDonorSearchTerm] = useState('');
  const [donorCategory, setDonorCategory] = useState('All Categories');
  const [donorRegion, setDonorRegion] = useState('Everywhere');
  const [donorVerifiedOnly, setDonorVerifiedOnly] = useState(true);
  const [donorTaxEligibleOnly, setDonorTaxEligibleOnly] = useState(false);
  const [donorSortBy, setDonorSortBy] = useState('recent');
  const [isDonorSortMenuOpen, setIsDonorSortMenuOpen] = useState(false);
  const [isDonorCategoryMenuOpen, setIsDonorCategoryMenuOpen] = useState(false);
  const [isDonorRegionMenuOpen, setIsDonorRegionMenuOpen] = useState(false);
  const [donorPage, setDonorPage] = useState(1);
  const [favoriteIds, setFavoriteIds] = useState(() => new Set([103]));
  const [selectedDonationAmount, setSelectedDonationAmount] = useState(10);
  const [customDonationAmount, setCustomDonationAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('qr');
  const [donationMessage, setDonationMessage] = useState('');
  const [donationStatusMessage, setDonationStatusMessage] = useState('');

  const donorSortMenuRef = useRef(null);
  const donorCategoryMenuRef = useRef(null);
  const donorRegionMenuRef = useRef(null);

  const parsedCustomAmount = Number(customDonationAmount);
  const hasCustomInput = customDonationAmount.trim() !== '';
  const hasValidCustomAmount = hasCustomInput && Number.isFinite(parsedCustomAmount) && parsedCustomAmount > 0;
  const hasInvalidCustomAmount = hasCustomInput && !hasValidCustomAmount;
  const donationAmount = hasValidCustomAmount ? parsedCustomAmount : selectedDonationAmount;

  const donorCategories = useMemo(() => ['All Categories', ...new Set(donorOrganizations.map((item) => item.category))], []);
  const donorRegions = useMemo(() => ['Everywhere', ...new Set(donorOrganizations.map((item) => item.region))], []);

  const donorFilteredOrganizations = useMemo(() => {
    const query = donorSearchTerm.trim().toLowerCase();
    return donorOrganizations
      .filter((organization) => {
        if (!query) return true;
        const searchableText = `${organization.name} ${organization.summary} ${organization.category} ${organization.region}`.toLowerCase();
        return searchableText.includes(query);
      })
      .filter((organization) => donorCategory === 'All Categories' || organization.category === donorCategory)
      .filter((organization) => donorRegion === 'Everywhere' || organization.region === donorRegion)
      .filter((organization) => !donorVerifiedOnly || organization.verified)
      .filter((organization) => !donorTaxEligibleOnly || organization.taxEligible)
      .sort((left, right) => {
        if (donorSortBy === 'nameAZ') return left.name.localeCompare(right.name);
        if (donorSortBy === 'impactHigh') return parseInt(right.metricLeftValue, 10) - parseInt(left.metricLeftValue, 10);
        return right.id - left.id;
      });
  }, [donorCategory, donorRegion, donorSearchTerm, donorSortBy, donorTaxEligibleOnly, donorVerifiedOnly]);

  const donorTotalPages = Math.max(1, Math.ceil(donorFilteredOrganizations.length / DONOR_PAGE_SIZE));
  const donorPaginationItems = useMemo(() => getPaginationItems(donorTotalPages, donorPage), [donorPage, donorTotalPages]);

  const donorPaginatedOrganizations = useMemo(() => {
    const start = (donorPage - 1) * DONOR_PAGE_SIZE;
    return donorFilteredOrganizations.slice(start, start + DONOR_PAGE_SIZE);
  }, [donorFilteredOrganizations, donorPage]);

  const isDonationPage = Boolean(organizationId);
  const selectedDonationOrg = useMemo(() => {
    if (!organizationId) return null;
    return donorOrganizations.find((organization) => String(organization.id) === String(organizationId)) ?? null;
  }, [organizationId]);
  const fromQuery = new URLSearchParams(location.search).get('from');
  const donationBackTarget = fromQuery && fromQuery.startsWith('/') ? fromQuery : ROUTES.ORGANIZATIONS;
  const selectedPaymentLabel = DONATION_PAYMENT_METHODS.find((method) => method.id === selectedPaymentMethod)?.label || 'QR Payment';

  const donorSortLabel = DONOR_SORT_OPTIONS.find((option) => option.value === donorSortBy)?.label || 'Most Recent';
  const donorCategoryLabel = donorCategory || 'All Categories';
  const donorRegionLabel = donorRegion || 'Everywhere';

  useEffect(() => {
    setDonorPage(1);
  }, [donorSearchTerm, donorCategory, donorRegion, donorVerifiedOnly, donorTaxEligibleOnly, donorSortBy]);

  useEffect(() => {
    setDonorPage((previousPage) => Math.min(previousPage, donorTotalPages));
  }, [donorTotalPages]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (donorSortMenuRef.current && !donorSortMenuRef.current.contains(event.target)) {
        setIsDonorSortMenuOpen(false);
      }
      if (donorCategoryMenuRef.current && !donorCategoryMenuRef.current.contains(event.target)) {
        setIsDonorCategoryMenuOpen(false);
      }
      if (donorRegionMenuRef.current && !donorRegionMenuRef.current.contains(event.target)) {
        setIsDonorRegionMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsDonorSortMenuOpen(false);
        setIsDonorCategoryMenuOpen(false);
        setIsDonorRegionMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const navigateToDonatePage = (organization) => {
    setSelectedDonationAmount(10);
    setCustomDonationAmount('');
    setSelectedPaymentMethod('qr');
    setDonationMessage('');
    setDonationStatusMessage('');
    navigate(`${ROUTES.ORGANIZATION_DONATE(organization.id)}?from=${encodeURIComponent(ROUTES.ORGANIZATIONS)}`);
  };

  const handleConfirmDonation = () => {
    if (hasInvalidCustomAmount || donationAmount <= 0) {
      return;
    }

    setDonationStatusMessage(
      `Donation submitted: $${donationAmount.toLocaleString()} to ${selectedDonationOrg?.name} via ${selectedPaymentLabel}.`
    );
  };

  if (!isDonorLoggedIn) {
    return null;
  }

  if (isDonationPage) {
    if (!selectedDonationOrg) {
      return (
        <main className="donation-page">
          <div className="donation-page-full">
            <div className="donation-modal-card donation-page-card">
              <div className="donation-modal-body">
                <section className="donation-supporting">
                  <h2>Organization not found</h2>
                  <p>Please go back and try another organization.</p>
                </section>
              </div>
              <div className="donation-modal-footer">
                <button type="button" className="donation-confirm-btn" onClick={() => navigate(donationBackTarget)}>
                  Back to organizations
                </button>
              </div>
            </div>
          </div>
        </main>
      );
    }

    return (
      <main className="donation-page">
        <div className="donation-page-full">
          <div className="donation-layout">
            <section className="donation-main-column">
              <div className="donation-modal-card donation-page-card">
              <div className="donation-modal-head">
                <div className="donation-modal-brand">
                  <div className="donation-modal-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M22 8.65a2 2 0 0 0-3.42-1.41L17 8.82l-1.58-1.58A2 2 0 0 0 12 8.65c0 .53.21 1.04.59 1.41l3.35 3.35c.58.58 1.52.58 2.1 0l3.37-3.35A2 2 0 0 0 22 8.65Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3 14h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H3z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M7 16h4l5.2 1.88A2 2 0 0 1 17.5 19.8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M7 20.4 13.1 22 21 19.7c.82-.24 1.27-1.11 1.03-1.93A1.6 1.6 0 0 0 20.5 16.6H16"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="donation-modal-title-wrap">
                    <strong>Donate</strong>
                    <p>Make a difference today</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="donation-modal-close donation-back-btn"
                  aria-label="Back to organizations"
                  onClick={() => navigate(donationBackTarget)}
                >
                  {'\u2190'} Back to organizations
                </button>
              </div>

              <div className="donation-modal-body">
                <section className="donation-supporting">
                  <span>YOU ARE SUPPORTING</span>
                  <h2>{selectedDonationOrg.name}</h2>
                  <p>{selectedDonationOrg.summary}</p>
                </section>

                <section className="donation-section">
                  <h3>Select Donation Amount</h3>
                  <div className="donation-amount-grid">
                    {DONATION_PRESET_AMOUNTS.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        className={selectedDonationAmount === amount && !hasCustomInput ? 'is-active' : ''}
                        onClick={() => {
                          setSelectedDonationAmount(amount);
                          setCustomDonationAmount('');
                          setDonationStatusMessage('');
                        }}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="donation-section">
                  <h3>Custom Amount</h3>
                  <label className="donation-custom-input">
                    <span className="donation-input-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3.5" y="6.5" width="17" height="11" rx="2.2" strokeWidth="1.8" />
                        <circle cx="12" cy="12" r="2.2" strokeWidth="1.8" />
                        <path d="M7 9.8h.01M17 14.2h.01" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      placeholder="Enter amount in USD"
                      value={customDonationAmount}
                      onChange={(event) => {
                        setCustomDonationAmount(event.target.value);
                        setDonationStatusMessage('');
                      }}
                    />
                    <span className="donation-input-suffix">USD</span>
                  </label>
                  {hasInvalidCustomAmount ? <p className="donation-field-error">Enter a valid amount greater than 0.</p> : null}
                </section>

                <section className="donation-section">
                  <h3>Payment Method</h3>
                  <div className="donation-payment-grid">
                    {DONATION_PAYMENT_METHODS.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        className={selectedPaymentMethod === method.id ? 'is-active' : ''}
                        onClick={() => {
                          setSelectedPaymentMethod(method.id);
                          setDonationStatusMessage('');
                        }}
                      >
                        <span className={`payment-badge ${method.badgeClassName}`}>{method.badge}</span>
                        <span>{method.label}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="donation-section">
                  <h3>Message to Organization</h3>
                  <textarea
                    placeholder="Write a short message of encouragement or specific instructions..."
                    value={donationMessage}
                    onChange={(event) => {
                      setDonationMessage(event.target.value);
                      setDonationStatusMessage('');
                    }}
                  />
                </section>
              </div>

              <div className="donation-modal-footer">
                <div className="donation-separator" />
                <button
                  type="button"
                  className="donation-confirm-btn"
                  onClick={handleConfirmDonation}
                  disabled={hasInvalidCustomAmount || donationAmount <= 0}
                >
                  <span aria-hidden="true">&#10084;</span> Confirm Donation (${donationAmount.toLocaleString()})
                </button>
                {donationStatusMessage ? <p className="donation-status-note">{donationStatusMessage}</p> : null}
                <p className="donation-legal">
                  By clicking confirm, you agree to our Terms of Service. 100% of your donation (minus payment processing fees)
                  goes directly to the organization.
                </p>
              </div>
              </div>
            </section>

            <aside className="donation-side-column">
              <div className="donation-summary-card">
                <p className="donation-summary-label">Donation Summary</p>
                <h3>{selectedDonationOrg.name}</h3>
                <p>{selectedDonationOrg.category} - {selectedDonationOrg.region}</p>
                <div className="donation-summary-item">
                  <span>Amount</span>
                  <strong>${donationAmount.toLocaleString()}</strong>
                </div>
                <div className="donation-summary-item">
                  <span>Payment Method</span>
                  <strong>{selectedPaymentLabel}</strong>
                </div>
                <div className="donation-summary-item">
                  <span>Tax Eligible</span>
                  <strong>{selectedDonationOrg.taxEligible ? 'Yes' : 'No'}</strong>
                </div>
                <button
                  type="button"
                  className="donation-summary-back"
                  onClick={() => navigate(donationBackTarget)}
                >
                  Back to organizations
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="donor-org-page">
      <div className="donor-org-layout">
        <aside className="donor-org-sidebar">
          <section className="donor-org-panel donor-user-panel">
            <div className="donor-user-head">
              <img
                src={donorSession.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80'}
                alt={donorSession.name || 'Donor'}
              />
              <div>
                <p>Welcome back,</p>
                <strong>{donorSession.name || 'Alex Rivera'}</strong>
              </div>
            </div>
            <div className="donor-user-stat">
              <span>Total Impact</span>
              <strong>$4,820.00</strong>
            </div>
            <div className="donor-user-stat">
              <span>Causes Supported</span>
              <strong>14</strong>
            </div>
          </section>

          <section className="donor-org-panel donor-filter-panel" aria-label="Filter Results">
            <h3>Filter Results</h3>

            <label className="donor-filter-label" htmlFor="donor-category">Category</label>
            <div className="category-filter donor-filter-dropdown" ref={donorCategoryMenuRef}>
              <button
                id="donor-category"
                type="button"
                className="filter-select category-trigger"
                aria-haspopup="listbox"
                aria-expanded={isDonorCategoryMenuOpen}
                aria-label="Filter donor category"
                onClick={() => {
                  setIsDonorCategoryMenuOpen((open) => !open);
                  setIsDonorRegionMenuOpen(false);
                }}
              >
                {donorCategoryLabel}
              </button>
              {isDonorCategoryMenuOpen ? (
                <ul className="category-menu" role="listbox" aria-label="Donor categories">
                  {donorCategories.map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        className={`category-option ${donorCategory === item ? 'category-option-active' : ''}`}
                        onClick={() => {
                          setDonorCategory(item);
                          setIsDonorCategoryMenuOpen(false);
                        }}
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <label className="donor-filter-label" htmlFor="donor-region">Province / Region</label>
            <div className="category-filter donor-filter-dropdown" ref={donorRegionMenuRef}>
              <button
                id="donor-region"
                type="button"
                className="filter-select category-trigger"
                aria-haspopup="listbox"
                aria-expanded={isDonorRegionMenuOpen}
                aria-label="Filter donor region"
                onClick={() => {
                  setIsDonorRegionMenuOpen((open) => !open);
                  setIsDonorCategoryMenuOpen(false);
                }}
              >
                {donorRegionLabel}
              </button>
              {isDonorRegionMenuOpen ? (
                <ul className="category-menu" role="listbox" aria-label="Donor regions">
                  {donorRegions.map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        className={`category-option ${donorRegion === item ? 'category-option-active' : ''}`}
                        onClick={() => {
                          setDonorRegion(item);
                          setIsDonorRegionMenuOpen(false);
                        }}
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <p className="donor-filter-label">Verification Status</p>
            <label className="donor-check">
              <input type="checkbox" checked={donorVerifiedOnly} onChange={(event) => setDonorVerifiedOnly(event.target.checked)} />
              Verified Impact
            </label>
            <label className="donor-check">
              <input type="checkbox" checked={donorTaxEligibleOnly} onChange={(event) => setDonorTaxEligibleOnly(event.target.checked)} />
              Tax Receipt Eligible
            </label>

            <input
              className="donor-filter-search"
              type="search"
              placeholder="Search organizations..."
              value={donorSearchInput}
              onChange={(event) => setDonorSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  setDonorSearchTerm(donorSearchInput.trim());
                }
              }}
            />

            <button type="button" className="donor-apply-btn" onClick={() => setDonorSearchTerm(donorSearchInput.trim())}>Apply Filters</button>
            <button
              type="button"
              className="donor-clear-btn"
              onClick={() => {
                setDonorSearchInput('');
                setDonorSearchTerm('');
                setDonorCategory('All Categories');
                setDonorRegion('Everywhere');
                setDonorVerifiedOnly(true);
                setDonorTaxEligibleOnly(false);
                setDonorSortBy('recent');
                setIsDonorCategoryMenuOpen(false);
                setIsDonorRegionMenuOpen(false);
                setIsDonorSortMenuOpen(false);
              }}
            >
              Clear all
            </button>
          </section>
        </aside>

        <section className="donor-org-main">
          <div className="donor-main-content">
              <header className="donor-org-header">
                <div>
                  <h1>Browse Organizations</h1>
                  <p>Discover 1,248 verified non-profit organizations</p>
                </div>
                <div className="donor-sort-wrap" ref={donorSortMenuRef}>
                  <span>Sort by:</span>
                  <div className="category-filter donor-sort-filter">
                    <button
                      type="button"
                      className="filter-select category-trigger donor-sort-trigger"
                      aria-haspopup="listbox"
                      aria-expanded={isDonorSortMenuOpen}
                      aria-label="Sort donor organizations"
                      onClick={() => setIsDonorSortMenuOpen((open) => !open)}
                    >
                      {donorSortLabel}
                    </button>
                    {isDonorSortMenuOpen ? (
                      <ul className="category-menu donor-sort-menu" role="listbox" aria-label="Donor sort options">
                        {DONOR_SORT_OPTIONS.map((option) => (
                          <li key={option.value}>
                            <button
                              type="button"
                              className={`category-option ${donorSortBy === option.value ? 'category-option-active' : ''}`}
                              onClick={() => {
                                setDonorSortBy(option.value);
                                setIsDonorSortMenuOpen(false);
                              }}
                            >
                              {option.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </header>

              <section className="donor-org-grid" aria-label="Organization List">
                {donorPaginatedOrganizations.map((organization) => {
                  const isFavorite = favoriteIds.has(organization.id);
                  return (
                    <article key={organization.id} className="donor-org-card">
                      <div className="donor-org-image-wrap">
                        <img src={organization.image} alt={organization.name} />
                        <div className="donor-org-badges">
                          <span>{organization.category.toUpperCase()}</span>
                          {organization.verified ? <strong>Verified</strong> : null}
                        </div>
                      </div>
                      <div className="donor-org-card-body">
                        <div className="donor-org-title-row">
                          <h2>{organization.name}</h2>
                          <button
                            type="button"
                            className={`donor-favorite ${isFavorite ? 'is-active' : ''}`}
                            aria-label="Toggle favorite"
                            onClick={() =>
                              setFavoriteIds((previous) => {
                                const next = new Set(previous);
                                if (next.has(organization.id)) {
                                  next.delete(organization.id);
                                } else {
                                  next.add(organization.id);
                                }
                                return next;
                              })
                            }
                          >
                            &#9829;
                          </button>
                        </div>
                        <p>{organization.summary}</p>
                        <div className="donor-org-metrics">
                          <div>
                            <span>{organization.metricLeftLabel}</span>
                            <strong>{organization.metricLeftValue}</strong>
                          </div>
                          <div>
                            <span>{organization.metricRightLabel}</span>
                            <strong>{organization.metricRightValue}</strong>
                          </div>
                        </div>
                        <div className="donor-org-actions">
                          <button type="button" className="donor-donate-btn" onClick={() => navigateToDonatePage(organization)}>
                            Donate
                          </button>
                          <button type="button" className="donor-follow-btn" aria-label="Follow organization">
                            Follow
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>

              <nav className="donor-org-pagination" aria-label="Pagination">
                <button type="button" onClick={() => setDonorPage((page) => Math.max(1, page - 1))} disabled={donorPage === 1}>
                  {'<'}
                </button>
                {donorPaginationItems.map((item, index) =>
                  item === '...' ? (
                    <span key={`donor-ellipsis-${index}`}>...</span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      className={donorPage === item ? 'active' : ''}
                      aria-current={donorPage === item ? 'page' : undefined}
                      onClick={() => setDonorPage(item)}
                    >
                      {item}
                    </button>
                  )
                )}
                <button type="button" onClick={() => setDonorPage((page) => Math.min(donorTotalPages, page + 1))} disabled={donorPage === donorTotalPages}>
                  {'>'}
                </button>
              </nav>
            </div>
        </section>
      </div>
    </main>
  );
}

export default OrganizationAfterLogin;
