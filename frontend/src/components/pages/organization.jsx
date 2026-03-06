import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ROUTES from '../../constants/routes';
import OrganizationAfterLogin from './OrganizationAfterLogin';
import OrganizationBeforeLogin from './OrganizationBeforeLogin';
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
  const donorCategoryMenuRef = useRef(null);
  const donorRegionMenuRef = useRef(null);

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
      if (donorCategoryMenuRef.current && !donorCategoryMenuRef.current.contains(event.target)) {
        setIsDonorCategoryMenuOpen(false);
      }
      if (donorRegionMenuRef.current && !donorRegionMenuRef.current.contains(event.target)) {
        setIsDonorRegionMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsCategoryMenuOpen(false);
        setIsRatingMenuOpen(false);
        setIsSortMenuOpen(false);
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
  const donorCategoryLabel = donorCategory || 'All Categories';
  const donorRegionLabel = donorRegion || 'Everywhere';
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
      <OrganizationAfterLogin
        donorSession={donorSession}
        isDonationModalOpen={isDonationModalOpen}
        donorCategoryMenuRef={donorCategoryMenuRef}
        isDonorCategoryMenuOpen={isDonorCategoryMenuOpen}
        setIsDonorCategoryMenuOpen={setIsDonorCategoryMenuOpen}
        setIsDonorRegionMenuOpen={setIsDonorRegionMenuOpen}
        donorCategoryLabel={donorCategoryLabel}
        donorCategories={donorCategories}
        donorCategory={donorCategory}
        setDonorCategory={setDonorCategory}
        donorRegionMenuRef={donorRegionMenuRef}
        isDonorRegionMenuOpen={isDonorRegionMenuOpen}
        donorRegionLabel={donorRegionLabel}
        donorRegions={donorRegions}
        donorRegion={donorRegion}
        setDonorRegion={setDonorRegion}
        donorVerifiedOnly={donorVerifiedOnly}
        setDonorVerifiedOnly={setDonorVerifiedOnly}
        donorTaxEligibleOnly={donorTaxEligibleOnly}
        setDonorTaxEligibleOnly={setDonorTaxEligibleOnly}
        donorSearchInput={donorSearchInput}
        setDonorSearchInput={setDonorSearchInput}
        setDonorSearchTerm={setDonorSearchTerm}
        setDonorSortBy={setDonorSortBy}
        openDonationModal={openDonationModal}
        closeDonationModal={closeDonationModal}
        selectedDonationOrg={selectedDonationOrg}
        DONATION_PRESET_AMOUNTS={DONATION_PRESET_AMOUNTS}
        selectedDonationAmount={selectedDonationAmount}
        customDonationAmount={customDonationAmount}
        setSelectedDonationAmount={setSelectedDonationAmount}
        setCustomDonationAmount={setCustomDonationAmount}
        hasInvalidCustomAmount={hasInvalidCustomAmount}
        DONATION_PAYMENT_METHODS={DONATION_PAYMENT_METHODS}
        selectedPaymentMethod={selectedPaymentMethod}
        setSelectedPaymentMethod={setSelectedPaymentMethod}
        donationMessage={donationMessage}
        setDonationMessage={setDonationMessage}
        handleConfirmDonation={handleConfirmDonation}
        donationAmount={donationAmount}
        donorSortMenuRef={donorSortMenuRef}
        isDonorSortMenuOpen={isDonorSortMenuOpen}
        setIsDonorSortMenuOpen={setIsDonorSortMenuOpen}
        donorSortLabel={donorSortLabel}
        DONOR_SORT_OPTIONS={DONOR_SORT_OPTIONS}
        donorSortBy={donorSortBy}
        donorPaginatedOrganizations={donorPaginatedOrganizations}
        favoriteIds={favoriteIds}
        setFavoriteIds={setFavoriteIds}
        donorPaginationItems={donorPaginationItems}
        donorPage={donorPage}
        setDonorPage={setDonorPage}
        donorTotalPages={donorTotalPages}
      />
    );
  }

  return (
    <OrganizationBeforeLogin
      searchInput={searchInput}
      setSearchInput={setSearchInput}
      handleSearch={handleSearch}
      hasActiveSearch={hasActiveSearch}
      filteredOrganizations={filteredOrganizations}
      searchTerm={searchTerm}
      categoryMenuRef={categoryMenuRef}
      isCategoryMenuOpen={isCategoryMenuOpen}
      setIsCategoryMenuOpen={setIsCategoryMenuOpen}
      setIsRatingMenuOpen={setIsRatingMenuOpen}
      setIsSortMenuOpen={setIsSortMenuOpen}
      categoryLabel={categoryLabel}
      selectedCategory={selectedCategory}
      setSelectedCategory={setSelectedCategory}
      categoryOptions={categoryOptions}
      ratingMenuRef={ratingMenuRef}
      isRatingMenuOpen={isRatingMenuOpen}
      ratingLabel={ratingLabel}
      ratingFilter={ratingFilter}
      setRatingFilter={setRatingFilter}
      RATING_OPTIONS={RATING_OPTIONS}
      sortMenuRef={sortMenuRef}
      isSortMenuOpen={isSortMenuOpen}
      sortLabel={sortLabel}
      sortBy={sortBy}
      setSortBy={setSortBy}
      SORT_OPTIONS={SORT_OPTIONS}
      paginatedOrganizations={paginatedOrganizations}
      paginationItems={paginationItems}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      totalPages={totalPages}
      setSearchInputAndTerm={() => {
        setSearchInput('');
        setSearchTerm('');
      }}
    />
  );
}

export default Organization;



