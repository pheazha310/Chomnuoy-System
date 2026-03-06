import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ROUTES from '../../constants/routes';
import '../css/organization.css';

const organizations = [
  {
    id: 1,
    name: 'Literacy for All',
    summary: 'Empowering underprivileged youth through accessible education and mentorship programs.',
    tags: ['Education', 'Youth'],
    rating: 4.9,
    reviews: '1.2k',
    image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=960&q=80',
  },
  {
    id: 2,
    name: 'Green Earth Initiative',
    summary: 'Focused on reforestation and sustainable farming practices to combat climate change in local communities.',
    tags: ['Environment', 'Climate'],
    rating: 4.7,
    reviews: '856',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=960&q=80',
  },
  {
    id: 3,
    name: 'Health First Network',
    summary: 'Providing essential healthcare services and medical supplies to remote villages and urban families in need.',
    tags: ['Health', 'Emergency'],
    rating: 4.8,
    reviews: '520',
    image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=960&q=80',
  },
  {
    id: 4,
    name: 'Community Core',
    summary: 'Strengthening community ties through shared resources, local events, and neighborhood collaboration.',
    tags: ['Community', 'Social'],
    rating: 4.6,
    reviews: '342',
    image: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=960&q=80',
  },
  {
    id: 5,
    name: 'MindWell Alliance',
    summary: 'Dedicated to mental health awareness and counseling support for people facing stress and trauma.',
    tags: ['Health', 'Mental Health'],
    rating: 4.9,
    reviews: '215',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=960&q=80',
  },
  {
    id: 6,
    name: 'Urban Uplift Foundation',
    summary: 'Transforming urban spaces into thriving hubs of opportunity through grants and training programs.',
    tags: ['Economy', 'Training'],
    rating: 4.5,
    reviews: '189',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=960&q=80',
  },
];

const donorOrganizations = [
  {
    id: 101,
    name: 'Global Scholars Fund',
    summary: 'Empowering underprivileged youth through sustainable education scholarships.',
    category: 'Education',
    region: 'Phnom Penh',
    verified: true,
    taxEligible: true,
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=960&q=80',
    metricLeftLabel: 'Impact Score',
    metricLeftValue: '94/100',
    metricRightLabel: 'Live Projects',
    metricRightValue: '12 Active',
  },
  {
    id: 102,
    name: 'Rural Health Alliance',
    summary: 'Providing essential medical supplies and mobile clinics to underserved areas.',
    category: 'Healthcare',
    region: 'Siem Reap',
    verified: true,
    taxEligible: true,
    image: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=960&q=80',
    metricLeftLabel: 'Impact Score',
    metricLeftValue: '88/100',
    metricRightLabel: 'Funds Raised',
    metricRightValue: '$240k',
  },
  {
    id: 103,
    name: 'Ocean Reclaim Project',
    summary: 'Dedicated to large-scale ocean cleanup and coastal habitat restoration work.',
    category: 'Environment',
    region: 'Kampot',
    verified: true,
    taxEligible: false,
    image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=960&q=80',
    metricLeftLabel: 'Plastic Removed',
    metricLeftValue: '45 Tons',
    metricRightLabel: 'Communities',
    metricRightValue: '28 Active',
  },
  {
    id: 104,
    name: 'Equal Voices Network',
    summary: 'Advocating for legislative change and legal access for vulnerable communities.',
    category: 'Human Rights',
    region: 'Battambang',
    verified: true,
    taxEligible: true,
    image: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?auto=format&fit=crop&w=960&q=80',
    metricLeftLabel: 'Impact Score',
    metricLeftValue: '91/100',
    metricRightLabel: 'Volunteers',
    metricRightValue: '4.2k',
  },
  {
    id: 105,
    name: 'Future Skills Hub',
    summary: 'Building digital literacy and job readiness for youth and women.',
    category: 'Education',
    region: 'Phnom Penh',
    verified: false,
    taxEligible: true,
    image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=960&q=80',
    metricLeftLabel: 'Impact Score',
    metricLeftValue: '84/100',
    metricRightLabel: 'Active Learners',
    metricRightValue: '1.6k',
  },
];

const PAGE_SIZE = 3;
const DONOR_PAGE_SIZE = 4;
const DONATION_PRESET_AMOUNTS = [5, 10, 20, 50];
const DONATION_PAYMENT_METHODS = [
  { id: 'qr', label: 'QR Payment', badge: 'QR', badgeClassName: 'payment-badge-qr' },
  { id: 'aba', label: 'ABA Pay', badge: 'ABA', badgeClassName: 'payment-badge-aba' },
  { id: 'wing', label: 'Wing Bank', badge: 'Wing', badgeClassName: 'payment-badge-wing' },
];
const RATING_OPTIONS = [
  { value: 'all', label: 'All Ratings' },
  { value: '4plus', label: 'Rating: 4+ Stars' },
  { value: '45plus', label: 'Rating: 4.5+ Stars' },
];
const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'ratingHigh', label: 'Rating: High to Low' },
  { value: 'ratingLow', label: 'Rating: Low to High' },
  { value: 'nameAZ', label: 'Name: A to Z' },
  { value: 'nameZA', label: 'Name: Z to A' },
];
const DONOR_SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'nameAZ', label: 'Name A-Z' },
  { value: 'impactHigh', label: 'Impact Score' },
];

function getPaginationItems(totalPages, currentPage) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const validPages = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const items = [];

  for (let index = 0; index < validPages.length; index += 1) {
    const page = validPages[index];
    const previousPage = validPages[index - 1];

    if (index > 0 && page - previousPage > 1) {
      items.push('...');
    }

    items.push(page);
  }

  return items;
}

function getDonorSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function Organization() {
  const navigate = useNavigate();
  const location = useLocation();
  const { organizationId } = useParams();
  const donorSession = getDonorSession();
  const isDonorLoggedIn = donorSession?.isLoggedIn && donorSession?.role === 'Donor';

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('4plus');
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isRatingMenuOpen, setIsRatingMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const categoryMenuRef = useRef(null);
  const ratingMenuRef = useRef(null);
  const sortMenuRef = useRef(null);
  const donorSortMenuRef = useRef(null);

  const [donorSearchInput, setDonorSearchInput] = useState('');
  const [donorSearchTerm, setDonorSearchTerm] = useState('');
  const [donorCategory, setDonorCategory] = useState('All Categories');
  const [donorRegion, setDonorRegion] = useState('Everywhere');
  const [donorVerifiedOnly, setDonorVerifiedOnly] = useState(true);
  const [donorTaxEligibleOnly, setDonorTaxEligibleOnly] = useState(false);
  const [donorSortBy, setDonorSortBy] = useState('recent');
  const [isDonorSortMenuOpen, setIsDonorSortMenuOpen] = useState(false);
  const [donorPage, setDonorPage] = useState(1);
  const [favoriteIds, setFavoriteIds] = useState(() => new Set([103]));
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [selectedDonationOrg, setSelectedDonationOrg] = useState(null);
  const [selectedDonationAmount, setSelectedDonationAmount] = useState(10);
  const [customDonationAmount, setCustomDonationAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('qr');
  const [donationMessage, setDonationMessage] = useState('');
  const parsedCustomAmount = Number(customDonationAmount);
  const hasCustomInput = customDonationAmount.trim() !== '';
  const hasValidCustomAmount = hasCustomInput && Number.isFinite(parsedCustomAmount) && parsedCustomAmount > 0;
  const hasInvalidCustomAmount = hasCustomInput && !hasValidCustomAmount;
  const donationAmount = hasValidCustomAmount ? parsedCustomAmount : selectedDonationAmount;

  const categoryOptions = useMemo(() => {
    const categories = new Set();
    organizations.forEach((organization) => {
      organization.tags.forEach((tag) => categories.add(tag));
    });
    return [...categories].sort((a, b) => a.localeCompare(b));
  }, []);

  const filteredOrganizations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filtered = organizations
      .filter((organization) => {
        if (!query) return true;
        const searchableText = `${organization.name} ${organization.summary} ${organization.tags.join(' ')}`.toLowerCase();
        return searchableText.includes(query);
      })
      .filter((organization) => {
        if (selectedCategory === 'all') return true;
        return organization.tags.includes(selectedCategory);
      })
      .filter((organization) => {
        if (ratingFilter === 'all') return true;
        if (ratingFilter === '45plus') return organization.rating >= 4.5;
        return organization.rating >= 4;
      });

    return filtered.sort((left, right) => {
      if (sortBy === 'oldest') return left.id - right.id;
      if (sortBy === 'ratingHigh') return right.rating - left.rating;
      if (sortBy === 'ratingLow') return left.rating - right.rating;
      if (sortBy === 'nameAZ') return left.name.localeCompare(right.name);
      if (sortBy === 'nameZA') return right.name.localeCompare(left.name);
      return right.id - left.id;
    });
  }, [searchTerm, selectedCategory, ratingFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredOrganizations.length / PAGE_SIZE));
  const paginationItems = useMemo(() => getPaginationItems(totalPages, currentPage), [totalPages, currentPage]);

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

  const donationRouteOrganization = useMemo(() => {
    if (!organizationId) return null;
    return donorOrganizations.find((organization) => String(organization.id) === String(organizationId)) ?? null;
  }, [organizationId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, ratingFilter, sortBy]);

  useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setDonorPage(1);
  }, [donorSearchTerm, donorCategory, donorRegion, donorVerifiedOnly, donorTaxEligibleOnly, donorSortBy]);

  useEffect(() => {
    setDonorPage((previousPage) => Math.min(previousPage, donorTotalPages));
  }, [donorTotalPages]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target)) {
        setIsCategoryMenuOpen(false);
      }
      if (ratingMenuRef.current && !ratingMenuRef.current.contains(event.target)) {
        setIsRatingMenuOpen(false);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setIsSortMenuOpen(false);
      }
      if (donorSortMenuRef.current && !donorSortMenuRef.current.contains(event.target)) {
        setIsDonorSortMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsCategoryMenuOpen(false);
        setIsRatingMenuOpen(false);
        setIsSortMenuOpen(false);
        setIsDonorSortMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(location.search).get('search')?.trim() || '';
    setSearchInput(query);
    setSearchTerm(query);
    setDonorSearchInput(query);
    setDonorSearchTerm(query);
  }, [location.search]);

  const paginatedOrganizations = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredOrganizations.slice(start, start + PAGE_SIZE);
  }, [filteredOrganizations, currentPage]);

  const categoryLabel = selectedCategory === 'all' ? 'All Categories' : selectedCategory;
  const ratingLabel = RATING_OPTIONS.find((option) => option.value === ratingFilter)?.label || 'All Ratings';
  const sortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label || 'Most Recent';
  const donorSortLabel = DONOR_SORT_OPTIONS.find((option) => option.value === donorSortBy)?.label || 'Most Recent';
  const hasActiveSearch = searchTerm.trim().length > 0;

  const handleSearch = () => {
    setSearchTerm(searchInput.trim());
  };

  useEffect(() => {
    if (!isDonationModalOpen) {
      return undefined;
    }

    const handleModalEscape = (event) => {
      if (event.key === 'Escape') {
        closeDonationModal();
      }
    };

    document.addEventListener('keydown', handleModalEscape);

    return () => {
      document.removeEventListener('keydown', handleModalEscape);
    };
  }, [isDonationModalOpen]);

  useEffect(() => {
    if (!isDonorLoggedIn || !donationRouteOrganization) {
      return;
    }

    setSelectedDonationOrg(donationRouteOrganization);
    setSelectedDonationAmount(10);
    setCustomDonationAmount('');
    setSelectedPaymentMethod('qr');
    setDonationMessage('');
    setIsDonationModalOpen(true);
  }, [isDonorLoggedIn, donationRouteOrganization]);

  const closeDonationModal = () => {
    setIsDonationModalOpen(false);
    setSelectedDonationOrg(null);
    setSelectedDonationAmount(10);
    setCustomDonationAmount('');
    setSelectedPaymentMethod('qr');
    setDonationMessage('');
    navigate(ROUTES.ORGANIZATIONS);
  };

  const openDonationModal = (organization) => {
    setSelectedDonationOrg(organization);
    setSelectedDonationAmount(10);
    setCustomDonationAmount('');
    setSelectedPaymentMethod('qr');
    setDonationMessage('');
    setIsDonationModalOpen(true);
    navigate(ROUTES.ORGANIZATION_DONATE(organization.id));
  };

  const handleConfirmDonation = () => {
    if (hasInvalidCustomAmount || donationAmount <= 0) {
      return;
    }

    alert(
      `Donation submitted!\nOrganization: ${selectedDonationOrg?.name}\nAmount: $${donationAmount}\nPayment: ${selectedPaymentMethod.toUpperCase()}`
    );
    closeDonationModal();
  };

  if (isDonorLoggedIn) {
    return (
      <main className="donor-org-page">
        <div className={isDonationModalOpen ? 'donor-org-layout donor-org-layout-donation' : 'donor-org-layout'}>
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

              <label className="donor-filter-label" htmlFor="donor-category">
                Category
              </label>
              <select id="donor-category" value={donorCategory} onChange={(event) => setDonorCategory(event.target.value)}>
                {donorCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <label className="donor-filter-label" htmlFor="donor-region">
                Province / Region
              </label>
              <select id="donor-region" value={donorRegion} onChange={(event) => setDonorRegion(event.target.value)}>
                {donorRegions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <p className="donor-filter-label">Verification Status</p>
              <label className="donor-check">
                <input
                  type="checkbox"
                  checked={donorVerifiedOnly}
                  onChange={(event) => setDonorVerifiedOnly(event.target.checked)}
                />
                Verified Impact
              </label>
              <label className="donor-check">
                <input
                  type="checkbox"
                  checked={donorTaxEligibleOnly}
                  onChange={(event) => setDonorTaxEligibleOnly(event.target.checked)}
                />
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

              <button type="button" className="donor-apply-btn" onClick={() => setDonorSearchTerm(donorSearchInput.trim())}>
                Apply Filters
              </button>
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
                }}
              >
                Clear all
              </button>
            </section>
          </aside>

          <section className="donor-org-main">
            {isDonationModalOpen && selectedDonationOrg ? (
              <section className="donation-modal-overlay">
                <article className="donation-modal-card" aria-label="Organization donation form">
                  <header className="donation-modal-head">
                    <div className="donation-modal-title-wrap">
                      <span className="donation-modal-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M12 14V4" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M8.5 7.5L12 4l3.5 3.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <div>
                        <strong>Donate</strong>
                        <p>Make a difference today</p>
                      </div>
                    </div>
                    <button type="button" className="donation-modal-close" aria-label="Close donation panel" onClick={closeDonationModal}>
                      &times;
                    </button>
                  </header>

                  <div className="donation-modal-body">
                    <section className="donation-supporting">
                      <p>YOU ARE SUPPORTING</p>
                      <h2>{selectedDonationOrg.name}</h2>
                      <span>Your contribution directly supports educational supplies and scholarships for underprivileged students.</span>
                    </section>

                    <section className="donation-section">
                      <h3>Select Donation Amount</h3>
                      <div className="donation-amount-grid">
                        {DONATION_PRESET_AMOUNTS.map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            className={selectedDonationAmount === amount && customDonationAmount.trim() === '' ? 'is-active' : ''}
                            onClick={() => {
                              setSelectedDonationAmount(amount);
                              setCustomDonationAmount('');
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
                          onChange={(event) => setCustomDonationAmount(event.target.value)}
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
                            onClick={() => setSelectedPaymentMethod(method.id)}
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
                        onChange={(event) => setDonationMessage(event.target.value)}
                      />
                    </section>
                  </div>

                  <div className="donation-modal-footer">
                    <button
                      type="button"
                      className="donation-confirm-btn"
                      onClick={handleConfirmDonation}
                      disabled={hasInvalidCustomAmount || donationAmount <= 0}
                    >
                      <span aria-hidden="true">&#10084;</span> Confirm Donation (${donationAmount})
                    </button>
                    <p className="donation-note">
                      By clicking confirm, you agree to our Terms of Service. 100% of your donation (minus payment processing fees)
                      goes directly to the organization.
                    </p>
                  </div>
                </article>
              </section>
            ) : null}

            {!isDonationModalOpen ? (
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
                        <button type="button" className="donor-donate-btn" onClick={() => openDonationModal(organization)}>
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
              <button
                type="button"
                onClick={() => setDonorPage((page) => Math.min(donorTotalPages, page + 1))}
                disabled={donorPage === donorTotalPages}
              >
                {'>'}
              </button>
            </nav>
            </div>
            ) : null}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="organizations-content">
      <section className="organizations-header">
        <h1>Our Partner Organizations</h1>
        <p>
          Connecting you with local initiatives making a real difference in education, health, and the
          environment. Join a community of impact-makers.
        </p>
      </section>

      <section className="organizations-controls" aria-label="Organization Filters">
        <div className="search-wrap">
          <input
            className="search-input"
            type="search"
            placeholder="Search organizations by name, mission, or keyword..."
            aria-label="Search organizations"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <button type="button" className="search-btn" aria-label="Search organizations" onClick={handleSearch}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="11" cy="11" r="5.5" />
              <path d="M16 16L20 20" />
            </svg>
          </button>
        </div>
        {hasActiveSearch ? (
          <p className="search-result-note">
            Showing {filteredOrganizations.length} result{filteredOrganizations.length === 1 ? '' : 's'} for "
            {searchTerm}"
          </p>
        ) : null}
        <div className="filter-row">
          <div className="category-filter" ref={categoryMenuRef}>
            <button
              type="button"
              className="filter-select category-trigger"
              aria-haspopup="listbox"
              aria-expanded={isCategoryMenuOpen}
              aria-label="Filter by category"
              onClick={() => {
                setIsCategoryMenuOpen((open) => !open);
                setIsRatingMenuOpen(false);
                setIsSortMenuOpen(false);
              }}
            >
              {categoryLabel}
            </button>
            {isCategoryMenuOpen ? (
              <ul className="category-menu" role="listbox" aria-label="Categories">
                <li>
                  <button
                    type="button"
                    className={`category-option ${selectedCategory === 'all' ? 'category-option-active' : ''}`}
                    onClick={() => {
                      setSelectedCategory('all');
                      setIsCategoryMenuOpen(false);
                    }}
                  >
                    All Categories
                  </button>
                </li>
                {categoryOptions.map((category) => (
                  <li key={category}>
                    <button
                      type="button"
                      className={`category-option ${selectedCategory === category ? 'category-option-active' : ''}`}
                      onClick={() => {
                        setSelectedCategory(category);
                        setIsCategoryMenuOpen(false);
                      }}
                    >
                      {category}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="category-filter" ref={ratingMenuRef}>
            <button
              type="button"
              className="filter-select category-trigger"
              aria-haspopup="listbox"
              aria-expanded={isRatingMenuOpen}
              aria-label="Filter by rating"
              onClick={() => {
                setIsRatingMenuOpen((open) => !open);
                setIsCategoryMenuOpen(false);
                setIsSortMenuOpen(false);
              }}
            >
              {ratingLabel}
            </button>
            {isRatingMenuOpen ? (
              <ul className="category-menu" role="listbox" aria-label="Ratings">
                {RATING_OPTIONS.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      className={`category-option ${ratingFilter === option.value ? 'category-option-active' : ''}`}
                      onClick={() => {
                        setRatingFilter(option.value);
                        setIsRatingMenuOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="category-filter" ref={sortMenuRef}>
            <button
              type="button"
              className="filter-select category-trigger"
              aria-haspopup="listbox"
              aria-expanded={isSortMenuOpen}
              aria-label="Sort organizations"
              onClick={() => {
                setIsSortMenuOpen((open) => !open);
                setIsCategoryMenuOpen(false);
                setIsRatingMenuOpen(false);
              }}
            >
              {sortLabel}
            </button>
            {isSortMenuOpen ? (
              <ul className="category-menu" role="listbox" aria-label="Sort options">
                {SORT_OPTIONS.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      className={`category-option ${sortBy === option.value ? 'category-option-active' : ''}`}
                      onClick={() => {
                        setSortBy(option.value);
                        setIsSortMenuOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <button
            className="clear-filters"
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearchTerm('');
              setSelectedCategory('all');
              setRatingFilter('4plus');
              setSortBy('recent');
              setIsCategoryMenuOpen(false);
              setIsRatingMenuOpen(false);
              setIsSortMenuOpen(false);
            }}
          >
            Clear Filters
          </button>
        </div>
      </section>

      <section className="organization-grid" aria-label="Organization List">
        {paginatedOrganizations.map((organization) => (
          <article key={organization.id} className="organization-card">
            <img src={organization.image} alt={organization.name} />
            <div className="card-body">
              <p className="rating">
                <span aria-hidden="true">*</span> {organization.rating} <span className="reviews">({organization.reviews})</span>
              </p>
              <h2>{organization.name}</h2>
              <p className="summary">{organization.summary}</p>
              <div className="tags">
                {organization.tags.map((tag) => (
                  <span key={`${organization.id}-${tag}`} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="card-actions">
                <button type="button" className="btn-primary">
                  Donate
                </button>
                <button type="button" className="btn-outline">
                  View Profile
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {filteredOrganizations.length === 0 ? <p>No organizations found for "{searchTerm}".</p> : null}

      <nav className="pagination" aria-label="Pagination">
        <button type="button" aria-label="Previous page" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="pagination-icon">
            <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {paginationItems.map((item, index) =>
          item === '...' ? (
            <span key={`ellipsis-${index}`}>...</span>
          ) : (
            <button
              key={item}
              type="button"
              className={currentPage === item ? 'active' : ''}
              aria-current={currentPage === item ? 'page' : undefined}
              onClick={() => setCurrentPage(item)}
            >
              {item}
            </button>
          )
        )}
        <button type="button" aria-label="Next page" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="pagination-icon">
            <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </nav>
    </main>
  );
}

export default Organization;


