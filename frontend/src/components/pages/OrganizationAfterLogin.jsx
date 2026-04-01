import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ROUTES from '../../constants/routes';
import { createBakongTransaction, verifyBakongTransaction } from '../../services/user-service';
import {
  DONATION_PAYMENT_METHODS,
  DONATION_PRESET_AMOUNTS,
  DONOR_PAGE_SIZE,
  DONOR_SORT_OPTIONS,
  getDonorSession,
  getPaginationItems,
} from './organizationShared';
import '../css/organization.css';

const ORG_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=960&q=80',
  'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=960&q=80',
  'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=960&q=80',
  'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?auto=format&fit=crop&w=960&q=80',
];
const MIN_USD_DONATION = 0.001;
const PENDING_BAKONG_TRANSACTION_KEY = 'chomnuoy_pending_bakong_transaction';
const FOLLOWED_ORGANIZATIONS_KEY = 'chomnuoy_followed_organizations_v1';
const ORGANIZATION_FOLLOW_COUNTS_KEY = 'chomnuoy_organization_follow_counts_v1';
const DONOR_ORGANIZATIONS_CACHE_KEY = 'chomnuoy_donor_organizations_dashboard_v1';
const DONOR_ORGANIZATIONS_CACHE_MAX_AGE_MS = 5 * 60 * 1000;
const USD_TO_KHR_RATE = 4100;
const DONATION_CURRENCIES = ['USD', 'KHR'];

function getApiErrorMessage(error, fallbackMessage) {
  const validationErrors = error?.response?.data?.errors;
  const firstValidationMessage = validationErrors && typeof validationErrors === 'object'
    ? Object.values(validationErrors).flat().find(Boolean)
    : null;

  return error?.response?.data?.message
    || error?.response?.data?.error
    || firstValidationMessage
    || error?.message
    || fallbackMessage;
}

function formatCompactNumber(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return '0';
  if (number >= 1000000) return `${(number / 1000000).toFixed(number >= 10000000 ? 0 : 1)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(number >= 100000 ? 0 : 1)}K`;
  return `${Math.round(number)}`;
}

function formatRelativeLabel(value) {
  if (!value) return 'Recently';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Recently';

  const diffMs = Date.now() - parsed.getTime();
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function convertUsdToKhrAmount(amount) {
  const numericAmount = Number(amount || 0);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return 0;
  return Math.round((numericAmount * USD_TO_KHR_RATE) / 100) * 100;
}

function convertKhrToUsdAmount(amount) {
  const numericAmount = Number(amount || 0);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return 0;
  return numericAmount / USD_TO_KHR_RATE;
}

function isQrExpired(expiresAt) {
  if (!expiresAt) return false;
  const expiryTime = new Date(expiresAt).getTime();
  return Number.isFinite(expiryTime) && expiryTime <= Date.now();
}

function getRemainingSeconds(expiresAt) {
  if (!expiresAt) return 0;
  const expiryTime = new Date(expiresAt).getTime();
  if (!Number.isFinite(expiryTime)) return 0;
  return Math.max(0, Math.ceil((expiryTime - Date.now()) / 1000));
}

function formatCountdown(seconds) {
  const safeSeconds = Math.max(0, Number(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function isSuccessfulPaymentStatus(value) {
  const status = String(value || '').trim().toLowerCase();
  return ['success', 'completed', 'paid', 'confirmed'].includes(status);
}

function buildCandidateApiBases() {
  const configuredApiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const runtimeApiBase = `${window.location.protocol}//${window.location.hostname}:8000/api`;

  return [
    configuredApiBase,
    runtimeApiBase,
    'http://127.0.0.1:8000/api',
    'http://localhost:8000/api',
  ].filter((value, index, array) => value && array.indexOf(value) === index);
}

function readDonorOrganizationsCache() {
  try {
    const raw = window.sessionStorage.getItem(DONOR_ORGANIZATIONS_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed?.timestamp || !parsed?.data) return null;
    if (Date.now() - parsed.timestamp > DONOR_ORGANIZATIONS_CACHE_MAX_AGE_MS) {
      window.sessionStorage.removeItem(DONOR_ORGANIZATIONS_CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeDonorOrganizationsCache(data) {
  try {
    window.sessionStorage.setItem(
      DONOR_ORGANIZATIONS_CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      }),
    );
  } catch {
    // Ignore storage failures.
  }
}

function OrganizationAfterLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { organizationId } = useParams();
  const cachedDashboard = useMemo(() => readDonorOrganizationsCache(), []);

  const donorSession = getDonorSession();
  const isDonorLoggedIn = donorSession?.isLoggedIn && donorSession?.role === 'Donor';
  const donorDisplayName = useMemo(() => {
    const rawName = typeof donorSession?.name === 'string' ? donorSession.name.trim() : '';
    return rawName || 'Donor';
  }, [donorSession?.name]);
  const donorAvatar = typeof donorSession?.avatar === 'string' ? donorSession.avatar.trim() : '';
  const donorInitials = useMemo(() => (
    donorDisplayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'D'
  ), [donorDisplayName]);

  const [donorSearchInput, setDonorSearchInput] = useState('');
  const [donorSearchTerm, setDonorSearchTerm] = useState('');
  const [donorCategory, setDonorCategory] = useState('All Categories');
  const [donorRegion, setDonorRegion] = useState('Everywhere');
  const [donorVerifiedOnly, setDonorVerifiedOnly] = useState(false);
  const [donorTaxEligibleOnly, setDonorTaxEligibleOnly] = useState(false);
  const [donorSortBy, setDonorSortBy] = useState('recent');
  const [isDonorSortMenuOpen, setIsDonorSortMenuOpen] = useState(false);
  const [isDonorCategoryMenuOpen, setIsDonorCategoryMenuOpen] = useState(false);
  const [isDonorRegionMenuOpen, setIsDonorRegionMenuOpen] = useState(false);
  const [donorPage, setDonorPage] = useState(1);
  const [favoriteIds, setFavoriteIds] = useState(() => new Set([103]));
  const [followedOrganizationIds, setFollowedOrganizationIds] = useState(() => {
    try {
      const raw = window.localStorage.getItem(FOLLOWED_ORGANIZATIONS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed.map((item) => Number(item)).filter(Boolean) : []);
    } catch {
      return new Set();
    }
  });
  const [organizationFollowCounts, setOrganizationFollowCounts] = useState(() => {
    try {
      const raw = window.localStorage.getItem(ORGANIZATION_FOLLOW_COUNTS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [selectedFollowOrganizationId, setSelectedFollowOrganizationId] = useState(null);
  const [followProfileTab, setFollowProfileTab] = useState('feed');
  const [organizationItems, setOrganizationItems] = useState(Array.isArray(cachedDashboard?.organizationItems) ? cachedDashboard.organizationItems : []);
  const [loadingOrganizations, setLoadingOrganizations] = useState(!Array.isArray(cachedDashboard?.organizationItems) || cachedDashboard.organizationItems.length === 0);
  const [organizationError, setOrganizationError] = useState('');
  const [donorImpactTotal, setDonorImpactTotal] = useState(Number(cachedDashboard?.donorImpactTotal || 0));
  const [donorCausesSupported, setDonorCausesSupported] = useState(Number(cachedDashboard?.donorCausesSupported || 0));
  const [selectedDonationAmount, setSelectedDonationAmount] = useState(10);
  const [customDonationAmount, setCustomDonationAmount] = useState('');
  const [selectedDonationCurrency, setSelectedDonationCurrency] = useState('USD');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('khqr');
  const [donationMessage, setDonationMessage] = useState('');
  const [donationStatusMessage, setDonationStatusMessage] = useState('');
  const [isSubmittingDonation, setIsSubmittingDonation] = useState(false);
  const [donationQrData, setDonationQrData] = useState(null);
  const [qrCountdownSeconds, setQrCountdownSeconds] = useState(0);

  const donorSortMenuRef = useRef(null);
  const donorCategoryMenuRef = useRef(null);
  const donorRegionMenuRef = useRef(null);

  useEffect(() => {
    if (!donationQrData?.expiresAt || ['completed', 'success', 'failed', 'expired'].includes(donationQrData?.status)) {
      setQrCountdownSeconds(0);
      return undefined;
    }

    setQrCountdownSeconds(getRemainingSeconds(donationQrData.expiresAt));
    const intervalId = window.setInterval(() => {
      setQrCountdownSeconds(getRemainingSeconds(donationQrData.expiresAt));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [donationQrData?.expiresAt, donationQrData?.status]);

  const minimumDonationAmount = selectedDonationCurrency === 'USD' ? MIN_USD_DONATION : 1;
  const parsedCustomAmount = Number(customDonationAmount);
  const hasCustomInput = customDonationAmount.trim() !== '';
  const hasValidCustomAmount =
    hasCustomInput && Number.isFinite(parsedCustomAmount) && parsedCustomAmount >= minimumDonationAmount;
  const hasInvalidCustomAmount = hasCustomInput && !hasValidCustomAmount;
  const donationAmount = hasValidCustomAmount ? parsedCustomAmount : selectedDonationAmount;
  const donationPresetAmounts = DONATION_PRESET_AMOUNTS.map((amount) => (
    selectedDonationCurrency === 'KHR' ? convertUsdToKhrAmount(amount) : amount
  ));

  const formatMoney = (value) => {
    const number = Number(value || 0);
    if (!Number.isFinite(number)) return '$0.00';
    const fractionDigits = !Number.isInteger(number) || (number > 0 && number < 1) ? 2 : 0;
    return `$${number.toLocaleString('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}`;
  };

  const formatDonationMoney = (value, currency = selectedDonationCurrency) => {
    const number = Number(value || 0);
    if (!Number.isFinite(number)) return currency === 'KHR' ? '0 KHR' : '$0.00';
    if (currency === 'KHR') {
      return `${Math.round(number).toLocaleString('en-US')} KHR`;
    }
    const fractionDigits = 2;
    return `$${number.toLocaleString('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}`;
  };

  const donorCategories = useMemo(
    () => ['All Categories', ...new Set(organizationItems.map((item) => item.category))],
    [organizationItems],
  );
  const donorRegions = useMemo(
    () => ['Everywhere', ...new Set(organizationItems.map((item) => item.region))],
    [organizationItems],
  );
  const verifiedCount = useMemo(
    () => organizationItems.filter((item) => item.verified).length,
    [organizationItems],
  );
  const registeredCount = organizationItems.length;

  const donorFilteredOrganizations = useMemo(() => {
    const query = donorSearchTerm.trim().toLowerCase();
    return organizationItems
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
  }, [donorCategory, donorRegion, donorSearchTerm, donorSortBy, donorTaxEligibleOnly, donorVerifiedOnly, organizationItems]);

  const donorTotalPages = Math.max(1, Math.ceil(donorFilteredOrganizations.length / DONOR_PAGE_SIZE));
  const donorPaginationItems = useMemo(() => getPaginationItems(donorTotalPages, donorPage), [donorPage, donorTotalPages]);

  const donorPaginatedOrganizations = useMemo(() => {
    const start = (donorPage - 1) * DONOR_PAGE_SIZE;
    return donorFilteredOrganizations.slice(start, start + DONOR_PAGE_SIZE);
  }, [donorFilteredOrganizations, donorPage]);

  const isDonationPage = Boolean(organizationId);
  const selectedDonationOrg = useMemo(() => {
    if (!organizationId) return null;
    return organizationItems.find((organization) => String(organization.id) === String(organizationId)) ?? null;
  }, [organizationId, organizationItems]);
  const selectedFollowOrganization = useMemo(() => (
    organizationItems.find((organization) => Number(organization.id) === Number(selectedFollowOrganizationId)) ?? null
  ), [organizationItems, selectedFollowOrganizationId]);
  const fromQuery = new URLSearchParams(location.search).get('from');
  const donationBackTarget = fromQuery && fromQuery.startsWith('/') ? fromQuery : ROUTES.ORGANIZATIONS;
  const selectedPaymentLabel = DONATION_PAYMENT_METHODS.find((method) => method.id === selectedPaymentMethod)?.label || 'Bakong KHQR';

  const donorSortLabel = DONOR_SORT_OPTIONS.find((option) => option.value === donorSortBy)?.label || 'Most Recent';
  const donorCategoryLabel = donorCategory || 'All Categories';
  const donorRegionLabel = donorRegion || 'Everywhere';

  useEffect(() => {
    setDonorPage(1);
  }, [donorSearchTerm, donorCategory, donorRegion, donorVerifiedOnly, donorTaxEligibleOnly, donorSortBy]);

  useEffect(() => {
    window.localStorage.setItem(
      FOLLOWED_ORGANIZATIONS_KEY,
      JSON.stringify(Array.from(followedOrganizationIds)),
    );
  }, [followedOrganizationIds]);

  useEffect(() => {
    window.localStorage.setItem(
      ORGANIZATION_FOLLOW_COUNTS_KEY,
      JSON.stringify(organizationFollowCounts),
    );
  }, [organizationFollowCounts]);

  useEffect(() => {
    if (!selectedFollowOrganization) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSelectedFollowOrganizationId(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedFollowOrganization]);

  useEffect(() => {
    if (!donationQrData?.tranId) {
      return undefined;
    }

    let active = true;
    const intervalId = window.setInterval(async () => {
      if (isQrExpired(donationQrData?.expiresAt)) {
        if (!active) return;
        setDonationQrData((previous) => (
          previous ? { ...previous, status: 'expired' } : previous
        ));
        setDonationStatusMessage('Payment expired after 5 minutes. Please go back and donate again.');
        setIsSubmittingDonation(false);
        window.sessionStorage.removeItem(PENDING_BAKONG_TRANSACTION_KEY);
        return;
      }

      try {
        const result = await verifyBakongTransaction(donationQrData.tranId);
        if (!active) return;

        const status = String(result?.transaction?.status || '').toLowerCase();
        if (!status) return;

        setDonationQrData((previous) => (
          previous ? { ...previous, status } : previous
        ));

        if (isSuccessfulPaymentStatus(status)) {
          setDonationStatusMessage('Your payment was successful.');
          setIsSubmittingDonation(false);
          window.sessionStorage.removeItem(PENDING_BAKONG_TRANSACTION_KEY);
          return;
        }

        if (['failed', 'cancelled', 'expired'].includes(status)) {
          setDonationStatusMessage(`Payment ${status}. Please generate a new KHQR and try again.`);
          setIsSubmittingDonation(false);
          window.sessionStorage.removeItem(PENDING_BAKONG_TRANSACTION_KEY);
        }
      } catch {
        // Keep polling while the QR session is active.
      }
    }, 4000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [donationQrData?.tranId]);

  useEffect(() => {
    setDonorPage((previousPage) => Math.min(previousPage, donorTotalPages));
  }, [donorTotalPages]);

  useEffect(() => {
    const userId = Number(donorSession?.userId ?? 0);
    let active = true;
    if (!cachedDashboard) {
      setLoadingOrganizations(true);
    }
    setOrganizationError('');
    const candidateApiBases = buildCandidateApiBases();

    const loadOrganizations = async () => {
      let lastError = 'Failed to load organizations.';

      for (const apiBase of candidateApiBases) {
        try {
          const [orgResult, categoryResult, campaignResult, donationResult] = await Promise.allSettled([
            fetch(`${apiBase}/organizations`).then(async (response) => {
              if (!response.ok) {
                throw new Error(`Failed to load organizations (${response.status})`);
              }
              return response.json();
            }),
            fetch(`${apiBase}/categories`).then((r) => (r.ok ? r.json() : [])),
            fetch(`${apiBase}/campaigns`).then((r) => (r.ok ? r.json() : [])),
            fetch(`${apiBase}/donations`).then((r) => (r.ok ? r.json() : [])),
          ]);

          if (orgResult.status !== 'fulfilled') {
            throw orgResult.reason instanceof Error ? orgResult.reason : new Error('Failed to load organizations.');
          }

          const organizations = Array.isArray(orgResult.value) ? orgResult.value : [];
          const categories = categoryResult.status === 'fulfilled' && Array.isArray(categoryResult.value) ? categoryResult.value : [];
          const campaigns = campaignResult.status === 'fulfilled' && Array.isArray(campaignResult.value) ? campaignResult.value : [];
          const donations = donationResult.status === 'fulfilled' && Array.isArray(donationResult.value) ? donationResult.value : [];
          const categoryMap = new Map(categories.map((item) => [Number(item.id), item.category_name]));

          const mapped = organizations.map((org, index) => {
            const orgCampaigns = campaigns.filter((item) => Number(item.organization_id) === Number(org.id));
            const orgDonations = donations.filter((item) => Number(item.organization_id) === Number(org.id));
            const raised = orgDonations.reduce((sum, item) => sum + Number(item.amount || 0), 0);
            const campaignCount = orgCampaigns.length;
            const impactScore = Math.min(100, 60 + campaignCount * 2 + Math.floor(raised / 1000));
            const location = String(org.location || '').trim();
            const region = location.split(',').shift()?.trim() || 'Everywhere';
            const baseFollowers = Math.max(12, campaignCount * 28 + orgDonations.length * 3 + Math.round(raised / 250));
            const savedFollowerBoost = Number(organizationFollowCounts[String(org.id)] || 0);
            const projectRegions = new Set(
              orgCampaigns
                .map((item) => String(item.location || '').split(',').pop()?.trim())
                .filter(Boolean),
            );
            const recentActivity = orgCampaigns
              .slice()
              .sort((left, right) => new Date(right.created_at || right.start_date || 0) - new Date(left.created_at || left.start_date || 0))
              .slice(0, 4)
              .map((campaign, activityIndex) => ({
                id: `campaign-${campaign.id || activityIndex}`,
                title: campaign.title || `Project update ${activityIndex + 1}`,
                body: campaign.description || `${org.name || 'This organization'} posted a new update for supporters.`,
                metric: campaign.goal_amount
                  ? `Goal ${formatMoney(campaign.goal_amount)}`
                  : `${campaign.status || 'Active'} campaign`,
                image: campaign.image_path || ORG_IMAGE_POOL[(index + activityIndex) % ORG_IMAGE_POOL.length],
                dateLabel: formatRelativeLabel(campaign.created_at || campaign.start_date || campaign.updated_at),
              }));

            const statusValue = String(org.verified_status || '').toLowerCase();
            const isVerified = statusValue
              ? ['verified', 'approved', 'active'].includes(statusValue)
              : true;
            const statusLabel = isVerified
              ? 'Verified'
              : (statusValue ? statusValue.charAt(0).toUpperCase() + statusValue.slice(1) : 'Pending');

            return {
              id: org.id,
              name: org.name || 'Organization',
              summary: org.description || 'Organization description is being updated.',
              category: categoryMap.get(Number(org.category_id)) || 'General',
              region: region || 'Everywhere',
              verified: isVerified,
              statusLabel,
              taxEligible: false,
              image: ORG_IMAGE_POOL[index % ORG_IMAGE_POOL.length],
              metricLeftLabel: 'Impact Score',
              metricLeftValue: `${impactScore}/100`,
              metricRightLabel: 'Live Projects',
              metricRightValue: `${campaignCount} Active`,
              projectsCount: campaignCount,
              countriesCount: Math.max(1, projectRegions.size || (region && region !== 'Everywhere' ? 1 : 0)),
              raisedTotal: raised,
              followersCount: baseFollowers + savedFollowerBoost,
              about: org.description || `${org.name || 'This organization'} is building measurable community impact across ${region || 'Cambodia'}.`,
              recentActivity: recentActivity.length > 0 ? recentActivity : [
                {
                  id: `fallback-${org.id}`,
                  title: org.name || 'Organization update',
                  body: org.description || 'This organization will publish updates for donors and followers soon.',
                  metric: campaignCount > 0 ? `${campaignCount} live projects` : 'Profile recently created',
                  image: ORG_IMAGE_POOL[index % ORG_IMAGE_POOL.length],
                  dateLabel: 'Recently',
                },
              ],
            };
          });

          const myDonations = userId
            ? donations.filter((item) => Number(item.user_id) === userId)
            : [];
          const totalImpact = myDonations.reduce((sum, item) => sum + Number(item.amount || 0), 0);
          const uniqueCauses = new Set(
            myDonations.map((item) => Number(item.organization_id)).filter(Boolean),
          );

          if (!active) return;

          setOrganizationItems(mapped);
          setDonorImpactTotal(totalImpact);
          setDonorCausesSupported(uniqueCauses.size);
          setOrganizationError('');
          writeDonorOrganizationsCache({
            organizationItems: mapped,
            donorImpactTotal: totalImpact,
            donorCausesSupported: uniqueCauses.size,
          });
          return;
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Failed to load organizations.';
        }
      }

      if (!active) return;
      setOrganizationError(lastError);
      if (!cachedDashboard) {
        setOrganizationItems([]);
        setDonorImpactTotal(0);
        setDonorCausesSupported(0);
      }
    };

    loadOrganizations().finally(() => {
      if (!active) return;
      setLoadingOrganizations(false);
    });

    return () => {
      active = false;
    };
  }, [cachedDashboard, donorSession?.userId, organizationFollowCounts]);

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
    setSelectedDonationCurrency('USD');
    setSelectedDonationAmount(10);
    setCustomDonationAmount('');
    setSelectedPaymentMethod('khqr');
    setDonationMessage('');
    setDonationStatusMessage('');
    setDonationQrData(null);
    navigate(`${ROUTES.ORGANIZATION_DONATE(organization.id)}?from=${encodeURIComponent(ROUTES.ORGANIZATIONS)}`);
  };

  const handleFollowToggle = (organization) => {
    if (!organization?.id) return;

    const orgId = Number(organization.id);
    const isAlreadyFollowing = followedOrganizationIds.has(orgId);
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

    setFollowedOrganizationIds((previous) => {
      const next = new Set(previous);
      if (isAlreadyFollowing) {
        next.delete(orgId);
      } else {
        next.add(orgId);
      }
      return next;
    });

    setOrganizationFollowCounts((previous) => {
      const key = String(orgId);
      const current = Number(previous[key] || 0);
      return {
        ...previous,
        [key]: Math.max(0, current + (isAlreadyFollowing ? -1 : 1)),
      };
    });

    setOrganizationItems((previous) => previous.map((item) => (
      Number(item.id) === orgId
        ? {
          ...item,
          followersCount: Math.max(0, Number(item.followersCount || 0) + (isAlreadyFollowing ? -1 : 1)),
        }
        : item
    )));

    if (!isAlreadyFollowing && isDonorLoggedIn && Number(donorSession?.userId || 0) > 0) {
      const donorUserId = Number(donorSession?.userId || 0);
      const donorName = donorDisplayName || 'Donor';
      const donorEmail = donorSession?.email || '';
      const orgName = organization.name || 'your organization';

      fetch(`${apiBase}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: donorUserId,
          sender_type: 'user',
          sender_name: donorName,
          sender_email: donorEmail,
          recipient_type: 'organization',
          recipient_id: orgId,
          message: `${donorName} started following ${orgName}.`,
          type: 'follow',
          is_read: false,
        }),
      }).catch(() => null);
    }
  };

  const openFollowProfile = (organization) => {
    setSelectedFollowOrganizationId(Number(organization.id));
    setFollowProfileTab('feed');
    if (!followedOrganizationIds.has(Number(organization.id))) {
      handleFollowToggle(organization);
    }
  };

  const handleConfirmDonation = async () => {
    if (hasInvalidCustomAmount || donationAmount <= 0) {
      return;
    }

    if (!selectedDonationOrg || !donorSession?.userId) {
      setDonationStatusMessage('Your donor session is missing. Please sign in again.');
      return;
    }

    setIsSubmittingDonation(true);
    setDonationStatusMessage('Preparing Bakong KHQR checkout...');

    try {
      const result = await createBakongTransaction({
        user_id: Number(donorSession.userId),
        organization_id: Number(selectedDonationOrg.id),
        amount: donationAmount,
        currency: selectedDonationCurrency,
        customer_name: donorSession.name || '',
        customer_email: donorSession.email || '',
        customer_phone: donorSession.phone || '',
        message: donationMessage,
      });

      const checkout = result?.checkout;
      const qr = checkout?.qr;
      if (checkout?.mode !== 'qr' || (!qr?.image && !qr?.string)) {
        throw new Error('The Bakong QR payload is incomplete.');
      }

      window.sessionStorage.setItem(PENDING_BAKONG_TRANSACTION_KEY, JSON.stringify({
        tranId: result?.transaction?.tran_id || '',
        donationId: result?.donation?.id || null,
        organizationId: selectedDonationOrg.id,
        amount: donationAmount,
        currency: selectedDonationCurrency,
        expiresAt: result?.checkout?.expires_at || new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        paymentOption: result?.checkout?.meta?.payment_option || '',
        environment: result?.checkout?.meta?.environment || 'sandbox',
        createdAt: new Date().toISOString(),
      }));

      setDonationQrData({
        image: qr?.image || '',
        qrString: qr?.string || '',
        deeplink: qr?.deeplink || '',
        checkoutUrl: qr?.checkout_url || '',
        amount: qr?.amount || donationAmount,
        currency: qr?.currency || selectedDonationCurrency,
        expiresAt: result?.checkout?.expires_at || new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        paymentLabel: result?.checkout?.meta?.payment_label || selectedPaymentLabel,
        tranId: result?.transaction?.tran_id || '',
        status: 'pending',
      });
      setDonationStatusMessage('QR code generated. Ask the donor to scan and complete payment.');
    } catch (error) {
      setDonationStatusMessage(getApiErrorMessage(error, 'Failed to start Bakong KHQR checkout.'));
      setIsSubmittingDonation(false);
    }
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
                  <h3>Select Currency</h3>
                  <div className="donation-currency-grid">
                    {DONATION_CURRENCIES.map((currency) => (
                      <button
                        key={currency}
                        type="button"
                        className={selectedDonationCurrency === currency ? 'is-active' : ''}
                        onClick={() => {
                          if (currency === selectedDonationCurrency) return;

                          const usdEquivalent = selectedDonationCurrency === 'KHR'
                            ? convertKhrToUsdAmount(donationAmount)
                            : donationAmount;
                          const nextAmount = currency === 'KHR'
                            ? convertUsdToKhrAmount(usdEquivalent)
                            : Math.max(MIN_USD_DONATION, Number(usdEquivalent.toFixed(3)));

                          setSelectedDonationCurrency(currency);
                          setSelectedDonationAmount(nextAmount);
                          setCustomDonationAmount('');
                          setDonationStatusMessage('');
                          setDonationQrData(null);
                        }}
                      >
                        {currency}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="donation-section">
                  <h3>Select Donation Amount</h3>
                  <div className="donation-amount-grid">
                    {donationPresetAmounts.map((amount) => (
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
                        {formatDonationMoney(amount)}
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
                      min={selectedDonationCurrency === 'USD' ? '0.001' : '1'}
                      step={selectedDonationCurrency === 'USD' ? '0.001' : '1'}
                      inputMode="decimal"
                      placeholder={`Enter amount in ${selectedDonationCurrency}`}
                      value={customDonationAmount}
                      onChange={(event) => {
                        setCustomDonationAmount(event.target.value);
                        setDonationStatusMessage('');
                      }}
                    />
                    <span className="donation-input-suffix">{selectedDonationCurrency}</span>
                  </label>
                  {hasInvalidCustomAmount ? (
                    <p className="donation-field-error">
                      {selectedDonationCurrency === 'USD'
                        ? `Enter a valid amount of at least ${MIN_USD_DONATION} USD.`
                        : 'Enter a valid amount of at least 1.'}
                    </p>
                  ) : null}
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
                  disabled={hasInvalidCustomAmount || donationAmount <= 0 || isSubmittingDonation}
                >
                  <span aria-hidden="true">&#10084;</span> {isSubmittingDonation ? 'Generating KHQR...' : `Confirm Donation (${formatDonationMoney(donationAmount)})`}
                </button>
                {donationStatusMessage ? <p className="donation-status-note">{donationStatusMessage}</p> : null}
                {donationQrData ? (
                  <div className="donation-status-note">
                    {donationQrData.image ? (
                      <img
                        src={donationQrData.image}
                        alt={`${donationQrData.paymentLabel} QR code`}
                        style={{ width: '100%', maxWidth: 240, display: 'block', margin: '12px auto', borderRadius: 16 }}
                      />
                    ) : null}
                    <p>Transaction: {donationQrData.tranId}</p>
                    <p>Amount: {formatDonationMoney(donationQrData.amount, donationQrData.currency)}</p>
                    <p>Status: {isSuccessfulPaymentStatus(donationQrData.status) ? 'SUCCESS' : String(donationQrData.status || 'pending').toUpperCase()}</p>
                    {isSuccessfulPaymentStatus(donationQrData.status) ? (
                      <p>Your payment was successful. Thank you for your donation.</p>
                    ) : null}
                    {!isSuccessfulPaymentStatus(donationQrData.status) ? (
                      <p>
                        Time remaining: {String(donationQrData.status || '').toLowerCase() === 'expired' ? '00:00' : formatCountdown(qrCountdownSeconds)}
                      </p>
                    ) : null}
                    {donationQrData.expiresAt ? (
                      <p>Expires at {new Date(donationQrData.expiresAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.</p>
                    ) : null}
                    {donationQrData.deeplink ? <a href={donationQrData.deeplink}>Open banking app</a> : null}
                    {!donationQrData.deeplink && donationQrData.checkoutUrl ? (
                      <a href={donationQrData.checkoutUrl} target="_blank" rel="noreferrer">Open checkout page</a>
                    ) : null}
                    {!donationQrData.image && donationQrData.qrString ? (
                      <p>KHQR string is ready from the gateway. Use the checkout link if scan rendering is unavailable.</p>
                    ) : null}
                  </div>
                ) : null}
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
                  <strong>{formatDonationMoney(donationAmount)}</strong>
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
              {donorAvatar ? (
                <img
                  src={donorAvatar}
                  alt={donorDisplayName}
                />
              ) : (
                <span className="donor-user-avatar-fallback" aria-hidden="true">{donorInitials}</span>
              )}
              <div>
                <p>Welcome back,</p>
                <strong>{donorDisplayName}</strong>
              </div>
            </div>
            <div className="donor-user-stat">
              <span>Total Impact</span>
              <strong>{formatMoney(donorImpactTotal)}</strong>
            </div>
            <div className="donor-user-stat">
              <span>Causes Supported</span>
              <strong>{donorCausesSupported}</strong>
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
                setDonorVerifiedOnly(false);
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
                  <p>
                    Discover {registeredCount.toLocaleString('en-US')} registered organizations
                    {verifiedCount > 0 ? `, including ${verifiedCount.toLocaleString('en-US')} verified non-profit organizations` : ''}
                  </p>
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
                  const isFollowing = followedOrganizationIds.has(Number(organization.id));
                  return (
                    <article key={organization.id} className="donor-org-card">
                      <div className="donor-org-image-wrap">
                        <img src={organization.image} alt={organization.name} />
                        <div className="donor-org-badges">
                          <span>{organization.category.toUpperCase()}</span>
                          <strong>{organization.statusLabel}</strong>
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
                          <button
                            type="button"
                            className={`donor-follow-btn ${isFollowing ? 'is-following' : ''}`}
                            aria-label={isFollowing ? 'View followed organization' : 'Follow organization'}
                            onClick={() => openFollowProfile(organization)}
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
                {!loadingOrganizations && donorPaginatedOrganizations.length === 0 ? (
                  <p className="text-sm text-slate-500">No organizations found for the current filters.</p>
                ) : null}
              </section>

              {organizationError ? (
                <p className="mt-4 text-sm text-red-600">{organizationError}</p>
              ) : null}

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

      {selectedFollowOrganization ? (
        <div
          className="org-follow-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedFollowOrganization.name} profile`}
          onClick={() => setSelectedFollowOrganizationId(null)}
        >
          <div className="org-follow-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="org-follow-close"
              aria-label="Close organization profile"
              onClick={() => setSelectedFollowOrganizationId(null)}
            >
              x
            </button>

            <header className="org-follow-hero">
              <div className="org-follow-avatar-wrap">
                <img src={selectedFollowOrganization.image} alt={selectedFollowOrganization.name} className="org-follow-avatar" />
              </div>
              <h2>{selectedFollowOrganization.name}</h2>
              <p className="org-follow-subtitle">
                {selectedFollowOrganization.category} - {formatCompactNumber(selectedFollowOrganization.followersCount)} followers
              </p>
              <p className="org-follow-location">{selectedFollowOrganization.region}</p>

              <button
                type="button"
                className={`org-follow-primary ${followedOrganizationIds.has(Number(selectedFollowOrganization.id)) ? 'is-following' : ''}`}
                onClick={() => handleFollowToggle(selectedFollowOrganization)}
              >
                {followedOrganizationIds.has(Number(selectedFollowOrganization.id)) ? 'Following' : 'Follow'}
              </button>

              {followedOrganizationIds.has(Number(selectedFollowOrganization.id)) ? (
                <div className="org-follow-toast">
                  You&apos;re subscribed. You will now receive real-time updates from {selectedFollowOrganization.name}.
                </div>
              ) : null}

              <div className="org-follow-stats">
                <article>
                  <strong>{formatMoney(selectedFollowOrganization.raisedTotal)}</strong>
                  <span>Raised</span>
                </article>
                <article>
                  <strong>{selectedFollowOrganization.projectsCount}</strong>
                  <span>Projects</span>
                </article>
                <article>
                  <strong>{selectedFollowOrganization.countriesCount}</strong>
                  <span>Regions</span>
                </article>
              </div>
            </header>

            <nav className="org-follow-tabs" aria-label="Organization profile sections">
              {['feed', 'projects', 'about'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={followProfileTab === tab ? 'is-active' : ''}
                  onClick={() => setFollowProfileTab(tab)}
                >
                  {tab === 'feed' ? 'Feed' : tab === 'projects' ? 'Projects' : 'About'}
                </button>
              ))}
            </nav>

            <section className="org-follow-content">
              {followProfileTab === 'feed' ? (
                <div className="org-follow-feed">
                  <div className="org-follow-section-head">
                    <h3>Recent Activity</h3>
                    <span>Live updates</span>
                  </div>
                  {selectedFollowOrganization.recentActivity.map((item, index) => (
                    <article key={item.id} className={`org-follow-post ${index === 0 ? 'is-featured' : ''}`}>
                      <div className="org-follow-post-head">
                        <div className="org-follow-post-brand">
                          <img src={selectedFollowOrganization.image} alt={selectedFollowOrganization.name} />
                          <div>
                            <strong>{selectedFollowOrganization.name}</strong>
                            <span>{item.dateLabel}</span>
                          </div>
                        </div>
                        <span className="org-follow-post-chip">{item.metric}</span>
                      </div>
                      <p>{item.body}</p>
                      {index === 0 ? (
                        <img src={item.image} alt={item.title} className="org-follow-post-image" />
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : null}

              {followProfileTab === 'projects' ? (
                <div className="org-follow-projects">
                  {selectedFollowOrganization.recentActivity.map((item) => (
                    <article key={`project-${item.id}`} className="org-follow-project-card">
                      <img src={item.image} alt={item.title} />
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.body}</p>
                        <span>{item.metric}</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}

              {followProfileTab === 'about' ? (
                <article className="org-follow-about">
                  <h3>About {selectedFollowOrganization.name}</h3>
                  <p>{selectedFollowOrganization.about}</p>
                  <dl>
                    <div>
                      <dt>Category</dt>
                      <dd>{selectedFollowOrganization.category}</dd>
                    </div>
                    <div>
                      <dt>Region</dt>
                      <dd>{selectedFollowOrganization.region}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{selectedFollowOrganization.statusLabel}</dd>
                    </div>
                  </dl>
                </article>
              ) : null}
            </section>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default OrganizationAfterLogin;

