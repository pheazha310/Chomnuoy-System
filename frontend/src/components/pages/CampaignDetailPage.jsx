import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import {
  Heart,
  Share2,
  ArrowLeft,
  Users,
  MapPin,
  Building2,
  Droplets,
  HandHeart,
  ShieldCheck,
  Lock,
  ScanQrCode,
  CircleCheckBig,
  Download,
  Circle,
  Clock3,
  CalendarDays,
  Package,
  Truck,
  MessageCircle,
} from 'lucide-react';
import { createBakongTransaction, getPaymentStatus } from '../../services/user-service';
import { getCampaignById } from '../../data/campaigns';
import {
  CAMPAIGNS_CACHE_KEY as DONOR_CAMPAIGNS_CACHE_KEY,
  campaignCategoryToSidebarCategory,
  fetchCampaignById,
  normalizeCampaign,
} from '../../services/campaign-service';
import { getAuthToken, getSession } from '../../services/session-service';
import '../css/Campaigns.css';
import { generateAbaQr } from '../../services/user-service';

const SAVED_CAMPAIGNS_STORAGE_KEY = 'chomnuoy_saved_campaigns';
const DONOR_HOME_CACHE_KEY = 'donor_home_dashboard_v2';
const LAST_OPENED_CAMPAIGN_KEY = 'chomnuoy_last_opened_campaign_v2';
const DONATION_CACHE_KEY = 'donor_my_donations_v1';
const LAST_DONATION_DETAIL_KEY = 'chomnuoy_last_donation_detail';
const PENDING_BAKONG_TRANSACTION_KEY = 'chomnuoy_pending_bakong_transaction';
const USD_TO_KHR_RATE = 4100;
const DONATION_CURRENCIES = ['USD', 'KHR'];
const MIN_USD_DONATION = 0.001;

function getSavedCampaignIds() {
  try {
    const raw = window.localStorage.getItem(SAVED_CAMPAIGNS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setSavedCampaignIds(ids) {
  window.localStorage.setItem(SAVED_CAMPAIGNS_STORAGE_KEY, JSON.stringify(ids));
}

function readSessionCache(key) {
  try {
    const raw = window.sessionStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.data ?? null;
  } catch {
    return null;
  }
}

function getCachedCampaignById(id) {
  try {
    const rawLastOpened = window.localStorage.getItem(LAST_OPENED_CAMPAIGN_KEY);
    const lastOpened = rawLastOpened ? JSON.parse(rawLastOpened) : null;
    if (lastOpened && String(lastOpened.id) === String(id)) {
      return normalizeCampaign(lastOpened);
    }
  } catch {
    // Ignore malformed local cache.
  }

  const donorCampaigns = readSessionCache(DONOR_CAMPAIGNS_CACHE_KEY);
  if (Array.isArray(donorCampaigns)) {
    const match = donorCampaigns.find((item) => String(item?.id) === String(id));
    if (match) return normalizeCampaign(match);
  }

  const donorHome = readSessionCache(DONOR_HOME_CACHE_KEY);
  const donorHomeCampaigns = Array.isArray(donorHome?.campaigns) ? donorHome.campaigns : [];
  const homeMatch = donorHomeCampaigns.find((item) => String(item?.id) === String(id));
  if (homeMatch) return normalizeCampaign(homeMatch);

  return null;
}

function formatCurrency(amount) {
  const numericAmount = Number(amount || 0);
  const minimumFractionDigits = !Number.isInteger(numericAmount) || (numericAmount > 0 && numericAmount < 1)
    ? 2
    : 0;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  }).format(numericAmount);
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

function convertAmountToCurrency(amount, currency) {
  return currency === 'KHR' ? convertUsdToKhrAmount(amount) : Number(amount || 0);
}

function formatDonationAmount(amount, currency) {
  const numericAmount = Number(amount || 0);
  if (!Number.isFinite(numericAmount)) {
    return currency === 'KHR' ? '0 KHR' : '$0';
  }

  if (currency === 'KHR') {
    return `${Math.round(numericAmount).toLocaleString('en-US')} KHR`;
  }

  const fractionDigits = 2;
  return `$${numericAmount.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}

function isCompletedPayment(payment) {
  const status = String(payment?.payment_status || payment?.status || '').toLowerCase();
  return ['success', 'completed', 'paid', 'confirmed'].includes(status);
}

function paymentMatchesCampaign(payment, campaignId) {
  const normalizedCampaignId = Number(campaignId || 0);
  if (!normalizedCampaignId) return false;

  const billNumber = String(payment?.bill_number || '').trim();
  if (billNumber.startsWith(`DON-${normalizedCampaignId}-`)) {
    return true;
  }

  return false;
}

function extractBankDonorName(payment) {
  let response = payment?.bakong_response;
  if (typeof response === 'string') {
    try {
      response = JSON.parse(response);
    } catch {
      response = null;
    }
  }

  const candidates = [
    response?.customer_name,
    response?.customerName,
    response?.sender_name,
    response?.senderName,
    response?.account_name,
    response?.accountName,
    response?.payer_name,
    response?.payerName,
    response?.data?.customer_name,
    response?.data?.customerName,
    response?.data?.sender_name,
    response?.data?.senderName,
    response?.data?.account_name,
    response?.data?.accountName,
    response?.data?.payer_name,
    response?.data?.payerName,
  ];

  return candidates
    .map((value) => String(value || '').trim())
    .find(Boolean) || '';
}

function normalizePaymentAmountToUsd(amount, currency) {
  const numericAmount = Number(amount || 0);
  if (!Number.isFinite(numericAmount)) return 0;
  return String(currency || 'USD').toUpperCase() === 'KHR' ? numericAmount / USD_TO_KHR_RATE : numericAmount;
}

function isSuccessfulPaymentStatus(value) {
  const status = String(value || '').trim().toLowerCase();
  return ['success', 'completed', 'paid', 'confirmed'].includes(status);
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

function clearDonationCaches() {
  try {
    window.sessionStorage.removeItem(DONATION_CACHE_KEY);
    window.sessionStorage.removeItem(DONOR_HOME_CACHE_KEY);
    window.sessionStorage.removeItem(DONOR_CAMPAIGNS_CACHE_KEY);
  } catch {
    // Ignore cache clear failures.
  }
}

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

function getFetchHeaders() {
  const token = getAuthToken();
  return token
    ? {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      }
    : {
        Accept: 'application/json',
      };
}

function normalizeMaterialOptions(materialItem, fallbackCategory) {
  const items = Array.isArray(materialItem)
    ? materialItem
    : materialItem && typeof materialItem === 'object'
      ? [materialItem]
      : [];

  const normalizedItems = items
    .map((item, index) => {
      const quantity = Math.max(1, Number(item?.quantity || 1));
      const name = String(item?.name || item?.item_name || `Requested item ${index + 1}`).trim();
      const description = String(
        item?.description || 'Coordinate a pickup to deliver physical support directly to this campaign.'
      ).trim();

      return {
        id: String(item?.id || item?.item_id || `${name}-${index + 1}`),
        name,
        description,
        category: String(item?.category || fallbackCategory || 'Material').trim(),
        quantity,
        image: item?.image || item?.image_url || item?.photo || '',
        priority: String(item?.priority || item?.material_priority || '').trim(),
        unitLabel: String(item?.unit_label || item?.unitLabel || 'units').trim(),
      };
    })
    .filter((item) => item.name);

  if (normalizedItems.length > 0) {
    return normalizedItems;
  }

  return [
    {
      id: 'material-default',
      name: 'Requested items',
      description: 'Coordinate a pickup to deliver physical support directly to this campaign.',
      category: String(fallbackCategory || 'Material').trim(),
      quantity: 1,
      image: '',
      priority: '',
      unitLabel: 'units',
    },
  ];
}

function toLocalDateTimeValue(date) {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return '';

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function buildMaterialScheduleOptions(pickupDate) {
  const baseDate = pickupDate ? new Date(pickupDate) : new Date();
  const selectedDate = pickupDate ? new Date(pickupDate) : null;
  const timeRanges = [
    { id: '09:00-11:00', label: '09:00 AM - 11:00 AM', startHour: 9, startMinute: 0 },
    { id: '11:00-13:00', label: '11:00 AM - 01:00 PM', startHour: 11, startMinute: 0 },
    { id: '14:00-16:00', label: '02:00 PM - 04:00 PM', startHour: 14, startMinute: 0 },
    { id: '16:00-18:00', label: '04:00 PM - 06:00 PM', startHour: 16, startMinute: 0 },
  ];

  const dateOptions = Array.from({ length: 4 }, (_, index) => {
    const date = new Date(baseDate);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + index + 1);
    return {
      id: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      date,
      dayLabel: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dateLabel: date.toLocaleDateString('en-US', { day: '2-digit' }),
      monthLabel: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      isSelected: Boolean(
        selectedDate &&
        selectedDate.getFullYear() === date.getFullYear() &&
        selectedDate.getMonth() === date.getMonth() &&
        selectedDate.getDate() === date.getDate()
      ),
    };
  });

  const selectedTimeId = selectedDate
    ? `${String(selectedDate.getHours()).padStart(2, '0')}:${String(selectedDate.getMinutes()).padStart(2, '0')}-${String(selectedDate.getHours() + 2).padStart(2, '0')}:${String(selectedDate.getMinutes()).padStart(2, '0')}`
    : '';

  return {
    dateOptions,
    timeRanges: timeRanges.map((slot) => ({
      ...slot,
      isSelected: selectedTimeId === slot.id,
    })),
  };
}

function CampaignDetailPage({ campaignId }) {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [campaignData, setCampaignData] = useState(null);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [shareLabel, setShareLabel] = useState('Share');
  const [isSaved, setIsSaved] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(25);
  const [customAmountInput, setCustomAmountInput] = useState('');
  const [selectedDonationCurrency, setSelectedDonationCurrency] = useState('USD');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Bakong KHQR');
  const [donationMessage, setDonationMessage] = useState('');
  const [showCheckout, setShowCheckout] = useState(() => Boolean(location.state?.openCheckout));
  const [showDonationSuccess, setShowDonationSuccess] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState(null);
  const [materialQuantity, setMaterialQuantity] = useState(1);
  const [selectedMaterialOptionId, setSelectedMaterialOptionId] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialDeliveryMode, setMaterialDeliveryMode] = useState('pickup');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [donorCoordinates, setDonorCoordinates] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [recentDonors, setRecentDonors] = useState([]);
  const [campaignPaymentSummary, setCampaignPaymentSummary] = useState({
    raisedAmount: null,
    supporterCount: null,
    donors: [],
  });
  const [campaignUpdates, setCampaignUpdates] = useState([]);
  const [campaignComments, setCampaignComments] = useState([]);
  const [activeTab, setActiveTab] = useState('about');
  const [donationSubmitting, setDonationSubmitting] = useState(false);
  const [abaQrCheckout, setAbaQrCheckout] = useState(null);
  const [autoStartAbaQr, setAutoStartAbaQr] = useState(false);
  const [monthlyDonation, setMonthlyDonation] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const resolvedCampaignId = campaignId ?? params.campaignSlug ?? params.id;
  const routeCampaign = location.state?.campaign;
  const campaign = campaignData ?? normalizeCampaign(getCampaignById(resolvedCampaignId));
  const session = getSession();
  const fallbackCampaignPath = session?.isLoggedIn && session?.role === 'Donor' ? '/campaigns/donor' : '/campaigns';
  const backTarget =
    typeof location.state?.from === 'string' && location.state.from.startsWith('/')
      ? location.state.from
      : fallbackCampaignPath;

  useEffect(() => {
    setDonorName(session?.name || 'John Doe');
    setDonorEmail(session?.email || 'john.doe@example.com');
  }, [session?.name, session?.email]);

  useEffect(() => {
    if (location.state?.openCheckout) {
      setDonationMessage('');
      setShowCheckout(true);
    }
  }, [location.state]);


  useEffect(() => {
    let mounted = true;
    const isNumericCampaignId = /^\d+$/.test(String(resolvedCampaignId));
    const normalizedRouteCampaign = normalizeCampaign(routeCampaign);
    const normalizedLocalCampaign = normalizeCampaign(getCampaignById(resolvedCampaignId));

    if (normalizedRouteCampaign) {
      if (String(normalizedRouteCampaign.id) === String(resolvedCampaignId) || !isNumericCampaignId) {
        setCampaignData(normalizedRouteCampaign);
        if (!isNumericCampaignId) {
          setCampaignLoading(false);
          return () => {
            mounted = false;
          };
        }
      }
    }

    if (normalizedLocalCampaign) {
      setCampaignData(normalizedLocalCampaign);
      if (!isNumericCampaignId) {
        setCampaignLoading(false);
        return () => {
          mounted = false;
        };
      }
    }

    const cached = getCachedCampaignById(resolvedCampaignId);
    if (cached) {
      setCampaignData(cached);
      if (!isNumericCampaignId) {
        setCampaignLoading(false);
        return () => {
          mounted = false;
        };
      }
    }

    if (!isNumericCampaignId) {
      // No numeric campaign ID provided and no campaign resolved from route/local cache.
      setCampaignData(null);
      return () => {
        mounted = false;
      };
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);
    setCampaignLoading(true);
    fetchCampaignById(resolvedCampaignId, { signal: controller.signal })
      .then((data) => {
        if (!mounted) return;
        setCampaignData(data);
      })
      .catch(() => {
        if (!mounted) return;
        setCampaignData(null);
      })
      .finally(() => {
        if (!mounted) return;
        window.clearTimeout(timeoutId);
        setCampaignLoading(false);
      });

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [resolvedCampaignId, routeCampaign]);

  useEffect(() => {
    if (!campaign) {
      setIsSaved(false);
      return;
    }

    const savedIds = getSavedCampaignIds();
    setIsSaved(savedIds.includes(campaign.id));
  }, [campaign]);

  useEffect(() => {
    if (!resolvedCampaignId || !/^\d+$/.test(String(resolvedCampaignId))) {
      setRecentDonors([]);
      setCampaignPaymentSummary({ raisedAmount: null, supporterCount: null, donors: [] });
      return;
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    let alive = true;

    const fetchOptions = {
      headers: getFetchHeaders(),
    };

    Promise.all([
      fetch(`${apiBase}/campaigns/${resolvedCampaignId}/donations`, fetchOptions).then((response) => (response.ok ? response.json() : [])),
      fetch(`${apiBase}/payments`, fetchOptions).then((response) => (response.ok ? response.json() : [])),
      fetch(`${apiBase}/donations`, fetchOptions).then((response) => (response.ok ? response.json() : [])),
      fetch(`${apiBase}/users`, fetchOptions).then((response) => (response.ok ? response.json() : [])),
    ])
      .then(([campaignDonationData, paymentData, donationData, userData]) => {
        if (!alive) return;

        const campaignDonations = Array.isArray(campaignDonationData) ? campaignDonationData : [];
        const payments = Array.isArray(paymentData) ? paymentData : [];
        const donations = Array.isArray(donationData) ? donationData : [];
        const users = Array.isArray(userData) ? userData : [];

        const donationMap = new Map(donations.map((item) => [Number(item.id), item]));
        const campaignDonationMap = new Map(campaignDonations.map((item) => [Number(item.id), item]));
        const userMap = new Map(users.map((item) => [Number(item.id), item]));

        const paidPaymentsForCampaign = payments
          .filter((payment) => isCompletedPayment(payment))
          .map((payment) => {
            const linkedDonation = donationMap.get(Number(payment?.donation_id));
            const linkedUser = userMap.get(Number(payment?.user_id || linkedDonation?.user_id));
            return {
              payment,
              donation: linkedDonation,
              user: linkedUser || null,
            };
          })
          .filter(({ payment, donation }) =>
            Number(donation?.campaign_id) === Number(resolvedCampaignId)
            || paymentMatchesCampaign(payment, resolvedCampaignId)
          )
          .sort((left, right) => new Date(right.payment?.paid_at || right.payment?.created_at || right.donation?.created_at || 0).getTime() - new Date(left.payment?.paid_at || left.payment?.created_at || left.donation?.created_at || 0).getTime());

        const paidDonorRows = paidPaymentsForCampaign.map(({ payment, donation, user }, index) => ({
          id: payment?.id || donation?.id || `paid-${index}`,
          donor_name:
            user?.name
            || campaignDonationMap.get(Number(donation?.id))?.donor_name
            || donation?.donor_name
            || extractBankDonorName(payment)
            || payment?.customer_name
            || payment?.sender_name
            || payment?.payer_name
            || 'Anonymous Donor',
          amount: Number(payment?.amount ?? donation?.amount ?? 0),
          created_at: payment?.paid_at || payment?.created_at || donation?.created_at || new Date().toISOString(),
          currency: payment?.currency || 'USD',
        }));

        const totalPaidAmount = paidDonorRows.reduce(
          (sum, item) => sum + normalizePaymentAmountToUsd(item.amount, item.currency),
          0,
        );
        const uniquePaidDonors = new Set(
          paidPaymentsForCampaign
            .map(({ payment, donation, user }) => String(user?.id || donation?.user_id || `payment-${payment?.id || ''}`))
            .filter(Boolean),
        ).size;

        setCampaignPaymentSummary({
          raisedAmount: paidDonorRows.length > 0 ? totalPaidAmount : null,
          supporterCount: paidDonorRows.length > 0 ? uniquePaidDonors : null,
          donors: paidDonorRows,
        });
        setRecentDonors(paidDonorRows.length > 0 ? paidDonorRows : campaignDonations);
      })
      .catch(() => {
        if (!alive) return;
        setRecentDonors([]);
        setCampaignPaymentSummary({ raisedAmount: null, supporterCount: null, donors: [] });
      });

    return () => {
      alive = false;
    };
  }, [resolvedCampaignId, showDonationSuccess]);

  useEffect(() => {
    if (!resolvedCampaignId || !/^\d+$/.test(String(resolvedCampaignId))) {
      setCampaignUpdates([]);
      return;
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    let alive = true;

    fetch(`${apiBase}/campaign_update`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (!alive) return;
        const updates = Array.isArray(data)
          ? data
              .filter((item) => String(item?.campaign_id) === String(resolvedCampaignId))
              .sort((a, b) => new Date(b?.update_date || 0).getTime() - new Date(a?.update_date || 0).getTime())
          : [];
        setCampaignUpdates(updates);
      })
      .catch(() => {
        if (!alive) return;
        setCampaignUpdates([]);
      });

    return () => {
      alive = false;
    };
  }, [resolvedCampaignId, showDonationSuccess]);

  useEffect(() => {
    const organizationId = Number(
      routeCampaign?.organizationId ??
      routeCampaign?.organization_id ??
      campaignData?.organizationId ??
      campaignData?.organization_id ??
      campaign?.organizationId ??
      campaign?.organization_id ??
      0
    );

    if (!organizationId) {
      setCampaignComments([]);
      return;
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    let alive = true;

    fetch(`${apiBase}/reviews`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (!alive) return;
        const comments = Array.isArray(data)
          ? data
              .filter((item) => Number(item?.organization_id) === organizationId)
              .sort((a, b) => new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime())
          : [];
        setCampaignComments(comments);
      })
      .catch(() => {
        if (!alive) return;
        setCampaignComments([]);
      });

    return () => {
      alive = false;
    };
  }, [routeCampaign, campaignData, campaign]);

  const safeTitle = campaign?.title || 'Campaign';
  const safeCategory = campaign?.category || 'General';
  const safeSummary = campaign?.summary || 'No description available yet.';
  const safeLocation = campaign?.location || 'Kampong Speu, Cambodia';
  const postedLatitude = Number(campaign?.latitude ?? 0) || null;
  const postedLongitude = Number(campaign?.longitude ?? 0) || null;
  const hasPostedCoordinates = postedLatitude !== null && postedLongitude !== null;
  const postedMapsQuery = hasPostedCoordinates
    ? `${postedLatitude},${postedLongitude}`
    : encodeURIComponent(safeLocation);
  const campaignType = String(
    campaign?.campaignType || (campaign?.materialItem ? 'material' : 'monetary')
  ).toLowerCase();
  const isMaterialCampaign = campaignType.includes('material');
  const materialOptions = normalizeMaterialOptions(campaign?.materialItem, safeCategory);
  const activeMaterialOption = materialOptions.find((item) => item.id === selectedMaterialOptionId) || materialOptions[0];
  const requestedItemName = activeMaterialOption?.name || 'Requested items';
  const requestedItemDescription = activeMaterialOption?.description || 'Coordinate a pickup to deliver physical support directly to this campaign.';
  const requestedItemTarget = Math.max(1, Number(activeMaterialOption?.quantity || 1));
  const requestedItemCategory = activeMaterialOption?.category || safeCategory;
  const materialDeliveryLabel = materialDeliveryMode === 'dropoff' ? 'Self Drop-off' : 'Schedule Pickup';
  const materialAddressLabel = materialDeliveryMode === 'dropoff' ? 'Drop-off details' : 'Pickup address';
  const materialModeDescription = materialDeliveryMode === 'dropoff'
    ? 'Deliver the items yourself to the organization location below.'
    : 'Our logistics team will collect the donation from your address.';
  const materialAddressPlaceholder = materialDeliveryMode === 'dropoff'
    ? 'Add your arrival note, landmark, or contact detail for the handoff.'
    : 'Enter your street name, building, apartment, or meeting point.';
  const materialAddressNote = materialDeliveryMode === 'dropoff'
    ? 'Share a clear note so the organizer knows how and when to expect your drop-off.'
    : 'Add a precise landmark or gate number so pickup is easier to coordinate.';
  const materialDestinationLabel = materialDeliveryMode === 'dropoff' ? 'Drop-off hub' : 'Destination';
  const presetAmounts = Array.isArray(campaign?.donationTiers) && campaign.donationTiers.length > 0
    ? campaign.donationTiers
        .map((item) => Number(item?.amount ?? item))
        .filter((amount) => Number.isFinite(amount) && amount > 0)
        .slice(0, 5)
    : [10, 25, 50, 100, 250];
  const presetDisplayAmounts = presetAmounts.map((amount) => convertAmountToCurrency(amount, selectedDonationCurrency));
  const safeImage =
    campaign?.image ||
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';
  const goalAmount = Number(campaign?.goalAmount ?? 0);
  const raisedAmount = Number(campaignPaymentSummary.raisedAmount ?? campaign?.raisedAmount ?? 0);
  const rawPercentRaised = goalAmount > 0 ? (raisedAmount / goalAmount) * 100 : 0;
  const percentRaised = goalAmount > 0 ? Math.round(rawPercentRaised) : 0;
  const progressWidth = Math.min(100, raisedAmount > 0 ? Math.max(rawPercentRaised, 1) : 0);
  const supporterCount = Math.max(
    Number(campaignPaymentSummary.supporterCount ?? recentDonors.length ?? campaign?.supporterCount ?? 0),
    0,
  );
  const pledgedItems = recentDonors.reduce(
    (sum, item) => sum + Math.max(1, Number(item?.quantity || item?.amount || 1)),
    0,
  );
  const requestedItemImage = activeMaterialOption?.image || safeImage;
  const remainingItemNeed = Math.max(requestedItemTarget - pledgedItems, 0);
  const materialProgressPercent = Math.min(100, Math.round((pledgedItems / requestedItemTarget) * 100));
  const progressPercent = isMaterialCampaign ? materialProgressPercent : progressWidth;
  const daysToGo = typeof campaign?.daysLeft === 'number' ? Math.max(0, campaign.daysLeft) : null;
  const supportTimelineLabel = campaign?.timeLeft || 'Ongoing';
  const progressStatusLabel = isMaterialCampaign ? `${materialProgressPercent}% pledged` : `${percentRaised}% funded`;
  const campaignTypeLabel = isMaterialCampaign ? 'Material Drive' : 'Monetary Campaign';
  const campaignBadgeCategory = campaignCategoryToSidebarCategory(safeCategory).toUpperCase();
  const progressPrimaryLabel = isMaterialCampaign ? 'Pledged' : 'Raised';
  const progressSecondaryLabel = isMaterialCampaign ? 'Needed' : 'Goal';
  const progressPrimaryValue = isMaterialCampaign ? pledgedItems.toLocaleString() : formatCurrency(raisedAmount);
  const progressSecondaryValue = isMaterialCampaign ? requestedItemTarget.toLocaleString() : formatCurrency(goalAmount);
  const showUrgentBadge = Boolean(campaign?.isUrgent) || String(campaign?.status || '').toLowerCase().includes('urgent');
  const organizationName = String(campaign?.organization || 'Organization');
  const materialDestinationTitle = materialDeliveryMode === 'dropoff'
    ? `${organizationName} Drop-off Point`
    : `${organizationName} Receiving Location`;
  const materialDestinationNote = materialDeliveryMode === 'dropoff'
    ? 'You will bring the donated items directly to this verified organization address.'
    : 'Your selected pickup address will be routed here after organizer confirmation.';
  const materialLocationActionLabel = materialDeliveryMode === 'dropoff'
    ? 'Use My Location for Route'
    : 'Use Current Location';
  const materialMapsActionLabel = materialDeliveryMode === 'dropoff'
    ? 'Open Drop-off Hub in Maps'
    : 'Open Destination in Maps';
  const creatorName =
    organizationName.replace(/\b(Org|Solutions|Collective|Tech)\b/g, '').trim() || organizationName;
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const campaignCreatedAt = campaign?.createdAt ? new Date(campaign.createdAt) : null;
  const campaignEndDate = campaign?.endDate ? new Date(campaign.endDate) : null;
  const isCampaignEndDateValid = campaignEndDate && !Number.isNaN(campaignEndDate.getTime());
  const impactHeadline = isMaterialCampaign ? requestedItemName : safeCategory;
  const impactNarrativeParts = [
    safeSummary,
    campaign?.distributionPlan,
    campaign?.donorUpdates,
  ].filter((value, index, array) => {
    const normalized = String(value || '').trim();
    return normalized && array.findIndex((item) => String(item || '').trim() === normalized) === index;
  });
  const impactNarrative = impactNarrativeParts.join(' ');
  const impactCards = isMaterialCampaign
    ? [
        {
          icon: Users,
          title: `${requestedItemTarget} ${requestedItemTarget === 1 ? 'Item' : 'Items'} Requested`,
          body: requestedItemDescription,
        },
        {
          icon: MapPin,
          title: safeLocation,
          body: campaign?.pickupInstructions || 'Delivery and handover will be coordinated with the organizer.',
        },
      ]
    : [
        {
          icon: Droplets,
          title: `${formatCurrency(goalAmount)} Goal`,
          body: goalAmount > 0
            ? `${percentRaised}% of the funding target has been reached for this campaign.`
            : 'Funding progress will appear here as donations are received.',
        },
        {
          icon: Users,
          title: `${supporterCount}+ Supporters`,
          body: `Campaign organized by ${organizationName}${safeLocation ? ` in ${safeLocation}` : ''}.`,
        },
      ];
  const fallbackUpdates = [
    campaignCreatedAt && !Number.isNaN(campaignCreatedAt.getTime())
      ? {
          id: 'created',
          date: campaignCreatedAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          title: 'Campaign published',
          description: `${safeTitle} is now live and open for donor support.`,
          image: safeImage,
        }
      : null,
    {
      id: 'progress',
      date: currentDate,
      title: isMaterialCampaign ? 'Current material request' : 'Current fundraising progress',
      description: isMaterialCampaign
        ? `${pledgedItems} pledges recorded toward ${requestedItemTarget} requested ${requestedItemTarget === 1 ? 'item' : 'items'}.`
        : `${formatCurrency(raisedAmount)} has been raised out of ${formatCurrency(goalAmount)}.`,
      image: '',
    },
    isCampaignEndDateValid
      ? {
          id: 'deadline',
          date: campaignEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          title: 'Campaign deadline',
          description: `${supportTimelineLabel} before this campaign closes.`,
          image: '',
        }
      : null,
  ].filter(Boolean);
  const updateItems = campaignUpdates.length > 0
    ? campaignUpdates.slice(0, 3).map((item, index) => ({
        id: item.id || `update-${index}`,
        date: item?.update_date
          ? new Date(item.update_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : currentDate,
        title: index === 0 ? 'Latest update' : `Update ${campaignUpdates.length - index}`,
        description: item?.update_description || 'Campaign update available.',
        image: getStorageFileUrl(item?.image) || '',
      }))
    : fallbackUpdates;
  const commentItems = campaignComments.slice(0, 6).map((item, index) => ({
    id: item.id || `comment-${index}`,
    author: `Supporter ${item.user_id || index + 1}`,
    rating: Math.max(1, Math.min(5, Number(item.rating || 0) || 5)),
    comment: item.comment || 'Shared positive feedback for this organization.',
    date: item.created_at
      ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : currentDate,
  }));
  const qrPendingState = donationSubmitting && !abaQrCheckout;
  const receiptOrganizationMapQuery = receiptDetails?.organizationMapsQuery || postedMapsQuery;
  const receiptDonorMapQuery = receiptDetails?.donorMapsQuery || encodeURIComponent(receiptDetails?.pickupAddress || pickupAddress || safeLocation);
  const donorDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${receiptDonorMapQuery}&destination=${receiptOrganizationMapQuery}`;
  const organizationMapUrl = `https://www.google.com/maps?q=${receiptOrganizationMapQuery}`;
  const donorMapUrl = `https://www.google.com/maps?q=${receiptDonorMapQuery}`;
  const processingFee = 0;
  const totalDonation = selectedAmount + processingFee;
  const selectedAmountLabel = formatDonationAmount(selectedAmount, selectedDonationCurrency);
  const totalDonationLabel = formatDonationAmount(totalDonation, selectedDonationCurrency);
  const [qrCountdownSeconds, setQrCountdownSeconds] = useState(0);
  const materialSchedule = buildMaterialScheduleOptions(pickupDate);
  const selectedPickupWindowLabel = materialSchedule.timeRanges.find((slot) => slot.isSelected)?.label
    || (pickupDate
      ? new Date(pickupDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : 'Choose a time window');

  useEffect(() => {
    if (!isMaterialCampaign) return;

    if (!selectedMaterialOptionId || !materialOptions.some((item) => item.id === selectedMaterialOptionId)) {
      setSelectedMaterialOptionId(materialOptions[0]?.id || '');
      setMaterialQuantity(1);
      setMaterialDescription('');
    }
  }, [isMaterialCampaign, materialOptions, selectedMaterialOptionId]);

  useEffect(() => {
    if (!abaQrCheckout?.expiresAt || ['completed', 'success', 'failed', 'expired'].includes(abaQrCheckout?.status)) {
      setQrCountdownSeconds(0);
      return undefined;
    }

    setQrCountdownSeconds(getRemainingSeconds(abaQrCheckout.expiresAt));
    const intervalId = window.setInterval(() => {
      setQrCountdownSeconds(getRemainingSeconds(abaQrCheckout.expiresAt));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [abaQrCheckout?.expiresAt, abaQrCheckout?.status]);

  useEffect(() => {
    if (!showCheckout || abaQrCheckout?.status !== 'expired') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShowCheckout(false);
      setAbaQrCheckout(null);
      setDonationSubmitting(false);
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [showCheckout, abaQrCheckout?.status]);

  useEffect(() => {
    if (!abaQrCheckout?.tranId || ['completed', 'success', 'failed', 'expired'].includes(abaQrCheckout?.status)) {
      return undefined;
    }

    let active = true;
    const intervalId = window.setInterval(async () => {
      if (isQrExpired(abaQrCheckout?.expiresAt)) {
        if (!active) return;
        setAbaQrCheckout((previous) => (
          previous ? { ...previous, status: 'expired' } : previous
        ));
        setDonationSubmitting(false);
        setDonationMessage('Payment expired after 5 minutes. Please go back and donate again.');
        window.sessionStorage.removeItem(PENDING_BAKONG_TRANSACTION_KEY);
        return;
      }

      try {
        const verification = await getPaymentStatus({
          payment_id: Number(abaQrCheckout.tranId),
          user_id: Number(session?.userId ?? 0) || undefined,
        });
        if (!active) return;

        const transaction = verification?.payment;
        const normalizedStatus = String(transaction?.status || '').toLowerCase();
        if (!normalizedStatus) return;

        setAbaQrCheckout((previous) => (
          previous ? { ...previous, status: normalizedStatus } : previous
        ));

        if (isSuccessfulPaymentStatus(normalizedStatus)) {
          active = false;
          window.clearInterval(intervalId);
          const userId = Number(session?.userId ?? 0);
          const organizationId =
            Number(
              routeCampaign?.organizationId ??
              routeCampaign?.organization_id ??
              campaignData?.organizationId ??
              campaignData?.organization_id ??
              campaign?.organizationId ??
              campaign?.organization_id ??
              0
            ) || undefined;

          let persisted;
          try {
            persisted = await persistSuccessfulQrDonation({
              userId,
              organizationId,
              paymentAmount: Number(transaction?.amount ?? totalDonation),
              paymentCurrency: transaction?.currency || abaQrCheckout.currency || selectedDonationCurrency,
              paymentReference: transaction?.transaction_id || transaction?.md5 || `PAY-${abaQrCheckout.tranId}`,
            });
          } catch (error) {
            setDonationSubmitting(false);
            setDonationMessage(getApiErrorMessage(error, 'Payment was received, but saving the donation failed.'));
            window.sessionStorage.removeItem(PENDING_BAKONG_TRANSACTION_KEY);
            return;
          }

          const nextReceiptDetails = {
            amount: Number(transaction?.amount ?? totalDonation),
            currency: transaction?.currency || abaQrCheckout.currency || selectedDonationCurrency,
            date: new Date(transaction?.paid_at || Date.now()).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }),
            donationId: persisted?.donation?.id ?? null,
            transactionId: transaction?.transaction_id ? `#${transaction.transaction_id}` : `#PAY-${abaQrCheckout.tranId}`,
            paymentMethod: abaQrCheckout.paymentLabel,
            campaignTitle: safeTitle,
            campaignImage: safeImage,
            campaignLocation: safeLocation,
            organizationName,
            receiptMessage: campaign?.receiptMessage || '',
            status: 'completed',
          };

          clearDonationCaches();
          setReceiptDetails(nextReceiptDetails);
          setDonationMessage('Your payment was successful.');
          try {
            window.sessionStorage.setItem(LAST_DONATION_DETAIL_KEY, JSON.stringify(nextReceiptDetails));
          } catch {
            // Ignore persistence failures.
          }
          setShowCheckout(false);
          navigate(ROUTES.DONATION_THANK_YOU, { state: { donation: nextReceiptDetails } });
          window.sessionStorage.removeItem(PENDING_BAKONG_TRANSACTION_KEY);
          return;
        }

        if (['failed', 'cancelled', 'expired'].includes(normalizedStatus)) {
          setDonationMessage(`Payment ${normalizedStatus}. Please generate a new KHQR and try again.`);
          setDonationSubmitting(false);
          window.sessionStorage.removeItem(PENDING_BAKONG_TRANSACTION_KEY);
        }
      } catch {
        // Continue polling quietly while the QR is active.
      }
    }, 4000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [abaQrCheckout, totalDonation, safeTitle, safeImage, safeLocation, organizationName, campaign, selectedDonationCurrency, session?.userId, routeCampaign, campaignData, recentDonors.length]);

  useEffect(() => {
    if (!showCheckout || !autoStartAbaQr || donationSubmitting || abaQrCheckout) {
      return;
    }

    setAutoStartAbaQr(false);
    handleCompleteDonation();
  }, [showCheckout, autoStartAbaQr, donationSubmitting, abaQrCheckout]);

  if (!campaign && campaignLoading) {
    return (
      <main className="campaign-detail-loading-screen" aria-busy="true">
        <div className="campaign-detail-loading-copy">
          <span className="campaign-detail-loading-spinner" aria-hidden="true" />
          <h1>Loading campaign...</h1>
          <p>Please wait while we prepare the campaign details.</p>
        </div>
      </main>
    );
  }

  if (!campaign) {
    return (
      <div className="campaign-detail-loading-screen">
        <div className="campaign-detail-loading-copy">
          <h1>Campaign Not Found</h1>
          <p>We couldn&apos;t find that campaign. Try returning to the campaign list.</p>
          <button
            onClick={() => navigate(backTarget)}
            className="campaign-detail-back-button"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  async function handleShare() {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : `/campaigns/${campaign.id}`;
    const shareData = {
      title: campaign.title,
      text: `${campaign.title} - ${campaign.summary}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareLabel('Shared');
      } else {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareUrl);
        } else {
          const tempInput = document.createElement('textarea');
          tempInput.value = shareUrl;
          tempInput.setAttribute('readonly', '');
          tempInput.style.position = 'absolute';
          tempInput.style.left = '-9999px';
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
        }
        setShareLabel('Link Copied');
      }
    } catch {
      setShareLabel('Share Failed');
    } finally {
      window.setTimeout(() => setShareLabel('Share'), 1800);
    }
  }

  function handleSaveToggle() {
    const savedIds = getSavedCampaignIds();
    const nextSavedIds = savedIds.includes(campaign.id)
      ? savedIds.filter((id) => id !== campaign.id)
      : [...savedIds, campaign.id];

    setSavedCampaignIds(nextSavedIds);
    setIsSaved(nextSavedIds.includes(campaign.id));
  }

  function handleCustomAmountApply(event) {
    event.preventDefault();
    const parsed = Number(customAmountInput.replace(/[^\d.]/g, ''));
    const minimumAmount = selectedDonationCurrency === 'USD' ? MIN_USD_DONATION : 1;
    if (!Number.isFinite(parsed) || parsed < minimumAmount) {
      setDonationMessage(
        selectedDonationCurrency === 'USD'
          ? `Please enter a valid custom amount of at least ${MIN_USD_DONATION} USD.`
          : `Please enter a valid custom amount of at least 1 ${selectedDonationCurrency}.`,
      );
      return;
    }

    const roundedAmount = selectedDonationCurrency === 'KHR'
      ? Math.round(parsed)
      : Math.max(MIN_USD_DONATION, Number(parsed.toFixed(3)));
    setSelectedAmount(roundedAmount);
    setDonationMessage(`Custom amount applied: ${formatDonationAmount(roundedAmount, selectedDonationCurrency)}.`);
  }

  function handleDonationCurrencyChange(nextCurrency) {
    if (nextCurrency === selectedDonationCurrency) return;

    const usdEquivalent = selectedDonationCurrency === 'KHR'
      ? convertKhrToUsdAmount(selectedAmount)
      : selectedAmount;
    const nextAmount = nextCurrency === 'KHR'
      ? convertUsdToKhrAmount(usdEquivalent)
      : Math.max(MIN_USD_DONATION, Number(usdEquivalent.toFixed(3)));

    setSelectedDonationCurrency(nextCurrency);
    setSelectedAmount(nextAmount);
    setCustomAmountInput('');
    setDonationMessage('');
    setAbaQrCheckout(null);
  }

  async function handleDonateNow() {
    setDonationMessage('');
    setAbaQrCheckout(null);
    setShowCheckout(true);
    if (!isMaterialCampaign && selectedPaymentMethod === 'Bakong KHQR') {
      setAutoStartAbaQr(true);
    }

    // Generate ABA QR code
    const payload = {
      "amount": totalDonation,
      "currency": selectedDonationCurrency,
      "bill_number": `DON-${campaign.id}-${Date.now()}`,
      "mobile_number": "",
      "store_label": "Chomnuoy Donation",
      "terminal_label": "Online Donation",
      "type": "individual",
      "campaign_id": campaign.id,
      "user_id": session?.userId || null
    };
    try {
      console.log('Generating QR with payload:', payload);
      const generateQR = await generateAbaQr(payload);
      console.log('QR response:', generateQR);
      
      if (generateQR.success && generateQR.qr_code) {
        try {
          // Import qrcode dynamically to avoid SSR issues
          const QRCode = await import('qrcode');
          console.log('QR Code library loaded');
          
          const qrImage = await QRCode.toDataURL(generateQR.qr_code);
          console.log('QR Image generated:', qrImage.substring(0, 50) + '...');
          
          setAbaQrCheckout({
            tranId: generateQR.payment_id?.toString() || '',
            donationId: null,
            image: qrImage,
            paymentLabel: 'Bakong KHQR',
            status: 'pending',
            amount: payload.amount,
            currency: selectedDonationCurrency,
            expiresAt: generateQR.expires_at,
            md5: generateQR.md5
          });
          console.log('abaQrCheckout set successfully');
        } catch (qrError) {
          console.error('Error generating QR image:', qrError);
          // Fallback: set the QR data without image
          setAbaQrCheckout({
            tranId: generateQR.payment_id?.toString() || '',
            donationId: null,
            image: null,
            paymentLabel: 'Bakong KHQR',
            status: 'pending',
            amount: payload.amount,
            currency: selectedDonationCurrency,
            expiresAt: generateQR.expires_at,
            md5: generateQR.md5
          });
        }
      } else {
        console.error('Invalid QR response:', generateQR);
        const errorMessage = generateQR?.message || 'Failed to generate QR code. Please try again.';
        setDonationMessage(`QR Generation Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Network error occurred. Please check your connection.';
      setDonationMessage(`QR Generation Failed: ${errorMessage}`);
    }
  }

  async function handleMaterialDonation() {
    const userId = Number(session?.userId ?? 0);
    if (!userId) {
      setDonationMessage('Please log in as a donor before pledging materials.');
      return;
    }

    if (!campaign?.id || !campaignData?.id) {
      setDonationMessage('This campaign is not ready for material pledges yet.');
      return;
    }

    if (materialDeliveryMode === 'pickup' && !pickupAddress.trim()) {
      setDonationMessage('Please enter a pickup address for the material donation.');
      return;
    }

    const quantity = Math.max(1, Number(materialQuantity || 1));
    const organizationId =
      Number(
        routeCampaign?.organizationId ??
        routeCampaign?.organization_id ??
        campaignData?.organizationId ??
        campaignData?.organization_id ??
        campaign?.organizationId ??
        campaign?.organization_id ??
        0
      ) || undefined;

    setDonationSubmitting(true);
    setDonationMessage('');

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const donationResponse = await fetch(`${apiBase}/donations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: userId,
          organization_id: organizationId,
          campaign_id: Number(campaign.id),
          amount: quantity,
          donation_type: 'material',
          status: 'pending',
        }),
      });

      const donationPayload = await donationResponse.json().catch(() => ({}));
      if (!donationResponse.ok) {
        throw new Error(donationPayload?.message || `Failed to create material donation (${donationResponse.status})`);
      }

      const donationId = Number(donationPayload?.donation?.id ?? donationPayload?.id ?? 0);
      if (!donationId) {
        throw new Error('Material donation was created without a valid donation record.');
      }

      const itemResponse = await fetch(`${apiBase}/material_items`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          donation_id: donationId,
          item_name: requestedItemName,
          quantity,
          description: materialDescription.trim() || requestedItemDescription,
        }),
      });

      if (!itemResponse.ok) {
        throw new Error(`Failed to save material item (${itemResponse.status})`);
      }

      const pickupResponse = await fetch(`${apiBase}/material_pickups`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          donation_id: donationId,
          pickup_address: materialDeliveryMode === 'dropoff'
            ? (pickupAddress.trim() || `Self drop-off to ${safeLocation}`)
            : pickupAddress.trim(),
          schedule_date: pickupDate || null,
          status: 'pending',
        }),
      });

      if (!pickupResponse.ok) {
        throw new Error(`Failed to schedule pickup (${pickupResponse.status})`);
      }

      clearDonationCaches();
      const nextReceiptDetails = {
        amount: `${quantity} item${quantity > 1 ? 's' : ''}`,
        quantity,
        itemName: requestedItemName,
        itemDescription: requestedItemDescription,
        date: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        donationId,
        transactionId: `#MAT-${donationId}`,
        paymentMethod: materialDeliveryMode === 'dropoff' ? 'Material drop-off' : 'Material pickup',
        campaignTitle: safeTitle,
        campaignImage: safeImage,
        campaignLocation: safeLocation,
        organizationMapsQuery: postedMapsQuery,
        organizationName,
        pickupAddress: pickupAddress.trim() || `Self drop-off to ${safeLocation}`,
        donorMapsQuery: donorCoordinates
          ? `${donorCoordinates.latitude},${donorCoordinates.longitude}`
          : encodeURIComponent(pickupAddress.trim() || safeLocation),
        receiptMessage: campaign?.receiptMessage || '',
        status: 'pending',
        isMaterial: true,
      };

      setDonationMessage('');
      setReceiptDetails(nextReceiptDetails);
      try {
        window.sessionStorage.setItem(LAST_DONATION_DETAIL_KEY, JSON.stringify(nextReceiptDetails));
      } catch {
        // Ignore persistence failures.
      }
      setShowCheckout(false);
      navigate(ROUTES.DONATION_THANK_YOU, { state: { donation: nextReceiptDetails } });
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      setDonationMessage(getApiErrorMessage(error, 'Failed to schedule this material donation.'));
    } finally {
      setDonationSubmitting(false);
    }
  }

  function handleUseCurrentLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setDonationMessage('Current location is not available on this device.');
      return;
    }

    setLocationLoading(true);
    setDonationMessage('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const nextAddress = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        setDonorCoordinates({ latitude, longitude });
        setPickupAddress(nextAddress);
        setLocationLoading(false);
        setDonationMessage('Current location added to the donor address field.');
      },
      () => {
        setLocationLoading(false);
        setDonationMessage('We could not access your current location. Please enter the address manually.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }

  function handleMaterialDateSelection(date) {
    const nextDate = pickupDate ? new Date(pickupDate) : new Date(date);
    nextDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    if (Number.isNaN(nextDate.getTime())) return;
    setPickupDate(toLocalDateTimeValue(nextDate));
  }

  function handleMaterialTimeSelection(slot) {
    const nextDate = pickupDate ? new Date(pickupDate) : new Date();
    nextDate.setHours(slot.startHour, slot.startMinute, 0, 0);
    setPickupDate(toLocalDateTimeValue(nextDate));
  }

  async function handleCompleteDonation() {
    const userId = Number(session?.userId ?? 0);
    if (!userId) {
      setDonationMessage('Please log in as a donor before completing this donation.');
      return;
    }

    if (!campaign?.id || !campaignData?.id) {
      setDonationMessage('This campaign is not ready for live donations yet.');
      return;
    }

    setDonationSubmitting(true);
    setDonationMessage('');

    const organizationId =
      Number(
        routeCampaign?.organizationId ??
        routeCampaign?.organization_id ??
        campaignData?.organizationId ??
        campaignData?.organization_id ??
        campaign?.organizationId ??
        campaign?.organization_id ??
        0
      ) || undefined;

    try {
      if (selectedPaymentMethod === 'Bakong KHQR') {
        const bakongTransaction = await createBakongTransaction({
          user_id: userId,
          ...(organizationId ? { organization_id: organizationId } : {}),
          campaign_id: Number(campaign.id),
          amount: totalDonation,
          currency: selectedDonationCurrency,
          customer_name: donorName,
          customer_email: donorEmail,
        });

        const checkoutMeta = bakongTransaction?.checkout?.meta ?? {};
        const qrData = bakongTransaction?.checkout?.qr;
        if (!qrData?.image && !qrData?.string) {
          throw new Error('The Bakong QR payload is incomplete.');
        }

        window.sessionStorage.setItem(PENDING_BAKONG_TRANSACTION_KEY, JSON.stringify({
          tranId: bakongTransaction?.transaction?.tran_id || '',
          donationId: bakongTransaction?.donation?.id || null,
          campaignId: Number(campaign.id),
          organizationId,
          amount: totalDonation,
          currency: selectedDonationCurrency,
          expiresAt: bakongTransaction?.checkout?.expires_at || new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          paymentOption: checkoutMeta?.payment_option || '',
          environment: checkoutMeta?.environment || 'sandbox',
          createdAt: new Date().toISOString(),
        }));

        setAbaQrCheckout({
          tranId: bakongTransaction?.transaction?.tran_id || '',
          donationId: bakongTransaction?.donation?.id || null,
          image: qrData?.image || '',
          qrString: qrData?.string || '',
          deeplink: qrData?.deeplink || '',
          checkoutUrl: qrData?.checkout_url || '',
          appStore: qrData?.app_store || '',
          playStore: qrData?.play_store || '',
          amount: Number(qrData?.amount ?? totalDonation),
          currency: qrData?.currency || selectedDonationCurrency,
          expiresAt: bakongTransaction?.checkout?.expires_at || new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          environment: checkoutMeta?.environment || 'sandbox',
          status: 'pending',
          paymentLabel: checkoutMeta?.payment_label || 'Bakong KHQR',
        });
        return;
      }

      const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await fetch(`${apiBase}/donations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: userId,
          organization_id: organizationId,
          campaign_id: Number(campaign.id),
          amount: totalDonation,
          donation_type: 'money',
          status: 'completed',
          payment_method: selectedPaymentMethod,
          is_monthly: monthlyDonation,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          payload?.message ||
          payload?.errors?.organization_id?.[0] ||
          payload?.errors?.amount?.[0] ||
          `Failed to complete donation (${response.status})`;
        throw new Error(message);
      }

      const donation = payload?.donation ?? null;
      const payment = payload?.payment ?? null;
      const updatedCampaign = payload?.campaign ?? null;

      if (updatedCampaign) {
        setCampaignData((previous) => ({
          ...(previous || campaign),
          id: updatedCampaign.id ?? previous?.id ?? campaign.id,
          organizationId: Number(updatedCampaign.organization_id ?? previous?.organizationId ?? campaign.organizationId ?? 0) || null,
          campaignType: updatedCampaign.campaign_type || previous?.campaignType || campaign.campaignType || 'monetary',
          title: updatedCampaign.title || previous?.title || campaign.title,
          category: updatedCampaign.category || previous?.category || campaign.category,
          organization:
            updatedCampaign.organization_name ||
            previous?.organization ||
            campaign.organization,
          summary: updatedCampaign.description || previous?.summary || campaign.summary,
          location: updatedCampaign.organization_location || updatedCampaign.location || previous?.location || campaign.location,
          latitude: Number(updatedCampaign.organization_latitude ?? updatedCampaign.latitude ?? previous?.latitude ?? campaign.latitude ?? 0) || null,
          longitude: Number(updatedCampaign.organization_longitude ?? updatedCampaign.longitude ?? previous?.longitude ?? campaign.longitude ?? 0) || null,
          receiptMessage: updatedCampaign.receipt_message || previous?.receiptMessage || campaign.receiptMessage,
          donationTiers: previous?.donationTiers || campaign.donationTiers || null,
          materialItem: previous?.materialItem || campaign.materialItem || null,
          goalAmount: Number(updatedCampaign.goal_amount ?? previous?.goalAmount ?? campaign.goalAmount ?? 0),
          raisedAmount: Number(updatedCampaign.current_amount ?? previous?.raisedAmount ?? campaign.raisedAmount ?? 0),
          image:
            getStorageFileUrl(updatedCampaign.image_path) ||
            previous?.image ||
            campaign.image,
        }));
      }

      clearDonationCaches();
      const nextReceiptDetails = {
        amount: Number(donation?.amount ?? totalDonation),
        currency: selectedDonationCurrency,
        date: new Date(donation?.created_at || Date.now()).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        donationId: donation?.id ?? null,
        transactionId: payment?.transaction_reference ? `#${payment.transaction_reference}` : `#DON-${donation?.id ?? ''}`,
        paymentMethod: selectedPaymentMethod,
        campaignTitle: safeTitle,
        campaignImage: safeImage,
        campaignLocation: safeLocation,
        organizationName,
        receiptMessage: campaign?.receiptMessage || '',
        status: donation?.status || 'completed',
      };
      setReceiptDetails(nextReceiptDetails);
      try {
        window.sessionStorage.setItem(LAST_DONATION_DETAIL_KEY, JSON.stringify(nextReceiptDetails));
      } catch {
        // Ignore persistence failures.
      }
      navigate(ROUTES.DONATION_THANK_YOU, { state: { donation: nextReceiptDetails } });
    } catch (error) {
      setDonationMessage(getApiErrorMessage(error, 'Failed to complete donation.'));
    } finally {
      setDonationSubmitting(false);
    }
  }

  async function persistSuccessfulQrDonation({ userId, organizationId, paymentAmount, paymentCurrency, paymentReference }) {
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(`${apiBase}/donations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: userId,
        organization_id: organizationId,
        campaign_id: Number(campaign.id),
        amount: paymentAmount,
        donation_type: 'money',
        status: 'completed',
        payment_method: 'Bakong KHQR',
        transaction_reference: paymentReference,
        is_monthly: monthlyDonation,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        payload?.message ||
        payload?.errors?.organization_id?.[0] ||
        payload?.errors?.amount?.[0] ||
        `Failed to record donation (${response.status})`;
      throw new Error(message);
    }

    const donation = payload?.donation ?? null;
    const payment = payload?.payment ?? null;
    const updatedCampaign = payload?.campaign ?? null;

    if (updatedCampaign) {
      setCampaignData((previous) => ({
        ...(previous || campaign),
        id: updatedCampaign.id ?? previous?.id ?? campaign.id,
        organizationId: Number(updatedCampaign.organization_id ?? previous?.organizationId ?? campaign.organizationId ?? 0) || null,
        campaignType: updatedCampaign.campaign_type || previous?.campaignType || campaign.campaignType || 'monetary',
        title: updatedCampaign.title || previous?.title || campaign.title,
        category: updatedCampaign.category || previous?.category || campaign.category,
        organization:
          updatedCampaign.organization_name ||
          previous?.organization ||
          campaign.organization,
        summary: updatedCampaign.description || previous?.summary || campaign.summary,
        location: updatedCampaign.organization_location || updatedCampaign.location || previous?.location || campaign.location,
        latitude: Number(updatedCampaign.organization_latitude ?? updatedCampaign.latitude ?? previous?.latitude ?? campaign.latitude ?? 0) || null,
        longitude: Number(updatedCampaign.organization_longitude ?? updatedCampaign.longitude ?? previous?.longitude ?? campaign.longitude ?? 0) || null,
        receiptMessage: updatedCampaign.receipt_message || previous?.receiptMessage || campaign.receiptMessage,
        donationTiers: previous?.donationTiers || campaign.donationTiers || null,
        materialItem: previous?.materialItem || campaign.materialItem || null,
        goalAmount: Number(updatedCampaign.goal_amount ?? previous?.goalAmount ?? campaign.goalAmount ?? 0),
        raisedAmount: Number(updatedCampaign.current_amount ?? previous?.raisedAmount ?? campaign.raisedAmount ?? 0),
        image:
          getStorageFileUrl(updatedCampaign.image_path) ||
          previous?.image ||
          campaign.image,
      }));
    }

    const donorDisplay = donorName || 'Donor';
    setRecentDonors((previous) => [
      {
        id: donation?.id ?? `paid-${Date.now()}`,
        donor_name: donorDisplay,
        amount: paymentAmount,
        currency: paymentCurrency,
        created_at: donation?.created_at || new Date().toISOString(),
      },
      ...previous,
    ]);

    setCampaignPaymentSummary((previous) => ({
      raisedAmount: Number(previous.raisedAmount ?? campaign?.raisedAmount ?? 0) + normalizePaymentAmountToUsd(paymentAmount, paymentCurrency),
      supporterCount: Math.max(1, Number(previous.supporterCount ?? recentDonors.length ?? 0) + 1),
      donors: [
        {
          id: donation?.id ?? `paid-${Date.now()}`,
          donor_name: donorDisplay,
          amount: paymentAmount,
          currency: paymentCurrency,
          created_at: donation?.created_at || new Date().toISOString(),
        },
        ...(previous.donors || []),
      ],
    }));

    clearDonationCaches();

    return {
      donation,
      payment,
    };
  }

  function handleDownloadReceipt() {
    if (!receiptDetails) return;
    const amountLabel = receiptDetails?.isMaterial ? 'Items' : 'Amount';
    const amountValue = receiptDetails?.isMaterial
      ? receiptDetails.amount
      : formatDonationAmount(receiptDetails.amount, receiptDetails.currency || selectedDonationCurrency);
    const referenceLabel = receiptDetails?.isMaterial ? 'Reference' : 'Transaction ID';
    const receiptCampaignTitle = receiptDetails?.campaignTitle || safeTitle;

    const receiptHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Donation Receipt</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
    .sheet { max-width: 520px; margin: 0 auto; border: 1px solid #dbe4ef; border-radius: 12px; padding: 24px; }
    h1 { margin: 0 0 12px; font-size: 24px; }
    .row { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid #e5ecf5; }
    .row:last-child { border-bottom: 0; }
    .muted { color: #64748b; }
  </style>
</head>
<body>
  <main class="sheet">
    <h1>Donation Receipt</h1>
    <div class="row"><span class="muted">Campaign</span><strong>${receiptCampaignTitle}</strong></div>
    <div class="row"><span class="muted">${amountLabel}</span><strong>${amountValue}</strong></div>
    <div class="row"><span class="muted">${referenceLabel}</span><strong>${receiptDetails.transactionId}</strong></div>
    <div class="row"><span class="muted">Payment Method</span><strong>${receiptDetails.paymentMethod || selectedPaymentMethod}</strong></div>
    <div class="row"><span class="muted">Date</span><strong>${receiptDetails.date}</strong></div>
  </main>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=680,height=760');
    if (!printWindow) return;
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 250);
  }

  if (showDonationSuccess) {
    const successCampaignTitle = receiptDetails?.campaignTitle || safeTitle;
    const successCampaignImage = receiptDetails?.campaignImage || safeImage;
    const successCampaignLocation = receiptDetails?.campaignLocation || safeLocation;
    const successOrganizationName = receiptDetails?.organizationName || organizationName;
    return (
      <main className="campaign-detail-page donation-success-page">
        <section className="donation-success-card" aria-label="Donation success">
          <div className="donation-success-icon">
            <CircleCheckBig size={28} />
          </div>

          <p className="donation-success-kicker">
            {receiptDetails?.isMaterial ? 'Material Donation Confirmed' : 'Donation Complete'}
          </p>
          <h1>{receiptDetails?.isMaterial ? 'Your kindness is on its way!' : 'Thank You for Your Donation!'}</h1>
          <p className="donation-success-campaign">
            {receiptDetails?.isMaterial
              ? 'Thank you for contributing to the community. Your donation will be collected as scheduled and delivered to those in need.'
              : `Campaign: `}
            {!receiptDetails?.isMaterial ? <span>{successCampaignTitle}</span> : null}
          </p>

          {receiptDetails?.isMaterial ? (
            <div className="donation-success-material-grid">
              <article className="donation-success-schedule-card">
                <div className="donation-success-card-head">
                  <strong>Scheduled {receiptDetails?.paymentMethod === 'Material drop-off' ? 'Drop-off' : 'Pickup'}</strong>
                  <span>{receiptDetails?.transactionId ?? ''}</span>
                </div>
                <div className="donation-success-schedule-meta">
                  <div>
                    <span>DATE & TIME</span>
                    <strong>{receiptDetails?.date ?? ''}</strong>
                    <p>{pickupDate ? new Date(pickupDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : selectedPickupWindowLabel}</p>
                  </div>
                  <div>
                    <span>ADDRESS</span>
                    <strong>{receiptDetails?.pickupAddress || 'Pending donor location'}</strong>
                    <p>{successCampaignLocation}</p>
                  </div>
                </div>
                <div className="donation-success-mini-grid">
                  <article>
                    <Package size={16} />
                    <strong>{receiptDetails?.itemName || 'Material donation'}</strong>
                    <p>{receiptDetails?.amount}</p>
                  </article>
                  <article>
                    <MessageCircle size={16} />
                    <strong>Impact Report</strong>
                    <p>Organizer updates will appear in your donations page.</p>
                  </article>
                </div>
              </article>

              <div className="donation-success-receipt">
                <div>
                  <span>Items</span>
                  <strong>{receiptDetails?.amount}</strong>
                </div>
              </div>

              <article className="donation-success-share-card">
                <img src={successCampaignImage} alt={successCampaignTitle} referrerPolicy="no-referrer" />
                <div className="donation-success-share-copy">
                  <strong>Inspire others with your kindness.</strong>
                  <p>Sharing your donation journey encourages friends and family to join the movement.</p>
                </div>
                <button type="button" className="donation-success-secondary" onClick={handleShare}>
                  <Share2 size={15} /> Share Impact
                </button>
              </article>
            </div>
          ) : (
            <>
              <div className="donation-success-hero">
                <img src={successCampaignImage} alt={successCampaignTitle} referrerPolicy="no-referrer" />
                <div>
                  <strong>{successCampaignTitle}</strong>
                  <p>{successOrganizationName}</p>
                  <span><MapPin size={14} /> {successCampaignLocation}</span>
                </div>
              </div>

              <div className="donation-success-receipt">
                <div>
                  <span>Amount</span>
                  <strong>{`$${receiptDetails?.amount ?? totalDonation.toFixed(2)}`}</strong>
                </div>
                <div>
                  <span>Transaction ID</span>
                  <strong>{receiptDetails?.transactionId ?? ''}</strong>
                </div>
                <div>
                  <span>Date</span>
                  <strong className="is-highlighted">{receiptDetails?.date ?? ''}</strong>
                </div>
              </div>
            </>
          )}

          {receiptDetails?.isMaterial ? (
            <div className="donation-success-actions">
              <button
                type="button"
                className="donation-success-primary"
                onClick={() => navigate('/donations')}
              >
                View My Donations
              </button>
              <button type="button" className="donation-success-secondary" onClick={() => navigate('/AfterLoginHome')}>
                Back to Home
              </button>
            </div>
          ) : (
            <div className="donation-success-actions">
              <button
                type="button"
                className="donation-success-primary"
                onClick={() => navigate('/donations/view-detail', { state: { donation: receiptDetails } })}
              >
                <Download size={15} /> Download Receipt
              </button>
              <button type="button" className="donation-success-secondary" onClick={handleShare}>
                <Share2 size={15} /> Share to Social Media
              </button>
            </div>
          )}

          {receiptDetails?.isMaterial ? (
            <div className="donation-success-next donation-success-next-material">
              <article className="donation-success-logistics-card">
                <div>
                  <span>Logistics Center</span>
                  <strong>{successOrganizationName}</strong>
                  <p>Your items will be sorted at our logistics center before being distributed to local communities.</p>
                </div>
                <a className="donation-success-location-link" href={organizationMapUrl} target="_blank" rel="noreferrer">
                  Open Maps
                </a>
              </article>
              <article className="donation-success-logistics-map">
                <iframe
                  title="Logistics map"
                  src={`https://maps.google.com/maps?q=${receiptOrganizationMapQuery}&z=12&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </article>
            </div>
          ) : (
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
                    <strong>Funds Transferred</strong>
                    <p>Allocating funds to the village construction teams.</p>
                  </div>
                </div>
                <div className="donation-success-step">
                  <span className="step-icon"><Circle size={14} /></span>
                  <div>
                    <strong>Impact Reported</strong>
                    <p>You will receive a detailed impact report in 3 months.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="donation-success-support">
            Have questions about your donation? <button type="button" onClick={() => setShowDonationSuccess(false)}>Contact Support</button>
          </p>
        </section>
      </main>
    );
  }

  if (showCheckout && isMaterialCampaign) {
    return (
      <main className="campaign-detail-page donation-checkout-page material-campaign-page">
        <button
          type="button"
          className="detail-back-link donation-checkout-back"
          onClick={() => setShowCheckout(false)}
        >
          <ArrowLeft size={16} /> Back to Campaign
        </button>

        <section className="donation-checkout-header material-checkout-header">
          <div>
            <h1>Material Donation</h1>
            <p>Select the requested materials, review logistics, and confirm the handover details for this campaign.</p>
          </div>
          <div className="donation-checkout-secure material-checkout-secure">
            <ShieldCheck size={16} />
            <span>Secure Request</span>
          </div>
        </section>

        <section className="material-stepper" aria-label="Material donation steps">
          {[
            { id: 'items', label: 'Items', done: true },
            { id: 'schedule', label: 'Schedule', done: Boolean(pickupAddress.trim() || pickupDate) },
            { id: 'confirm', label: 'Confirm', done: false },
          ].map((step, index) => (
            <div key={step.id} className={`material-step ${step.done ? 'is-complete' : ''}`}>
              <div className="material-step-badge">{step.done ? <CircleCheckBig size={16} /> : <Circle size={16} />}</div>
              <div>
                <strong>{index + 1}</strong>
                <span>{step.label}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="material-donation-layout" aria-label="Material donation scheduling">
          <div className="material-donation-main">
            <article className="donation-checkout-card material-form-section">
              <div className="material-section-heading">
                <div>
                  <h2><Building2 size={18} /> Select Items to Donate</h2>
                  <p>Every item you commit helps this campaign move closer to delivery.</p>
                </div>
                <span className="material-section-pill">{requestedItemCategory}</span>
              </div>

              <div className="material-item-grid">
                {materialOptions.map((item) => {
                  const isSelected = item.id === activeMaterialOption?.id;
                  const itemImage = item.image || safeImage;
                  const itemPriority = item.priority || campaign?.materialPriority || '';

                  return (
                    <article key={item.id} className={`material-select-card ${isSelected ? 'is-selected' : ''}`}>
                      <div
                        role="button"
                        tabIndex={0}
                        className="material-select-card-button"
                        onClick={() => {
                          setSelectedMaterialOptionId(item.id);
                          setMaterialQuantity(1);
                          setMaterialDescription('');
                          setDonationMessage('');
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter' && event.key !== ' ') return;
                          event.preventDefault();
                          setSelectedMaterialOptionId(item.id);
                          setMaterialQuantity(1);
                          setMaterialDescription('');
                          setDonationMessage('');
                        }}
                      >
                        <div className="material-select-card-media">
                          <img src={itemImage} alt={item.name} referrerPolicy="no-referrer" />
                          <div className="material-select-card-badges">
                            <span>{item.category}</span>
                            {itemPriority ? <span className="is-priority">{itemPriority}</span> : null}
                          </div>
                        </div>
                        <div className="material-select-card-body">
                          <div className="material-select-card-copy">
                            <strong>{item.name}</strong>
                            <p>{item.description}</p>
                          </div>
                          <div className="material-select-card-footer">
                            <div className="material-select-card-meta">
                              <span>Needed</span>
                              <strong>{item.quantity.toLocaleString()} {item.unitLabel}</strong>
                            </div>
                            {isSelected ? (
                              <div className="material-quantity-picker material-quantity-picker-inline">
                                <button type="button" onClick={(event) => {
                                  event.stopPropagation();
                                  setMaterialQuantity((current) => Math.max(1, current - 1));
                                }}
                                >
                                  -
                                </button>
                                <input
                                  id="material-quantity-input"
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={materialQuantity}
                                  onClick={(event) => event.stopPropagation()}
                                  onChange={(event) => setMaterialQuantity(Math.max(1, Number(event.target.value) || 1))}
                                />
                                <button type="button" onClick={(event) => {
                                  event.stopPropagation();
                                  setMaterialQuantity((current) => current + 1);
                                }}
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <span className="material-select-card-action">Select item</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <label className="material-field" htmlFor="material-description-input">
                <span>Description (Optional)</span>
                <textarea
                  id="material-description-input"
                  className="material-donation-textarea"
                  rows={4}
                  placeholder="Briefly describe the items and their condition."
                  value={materialDescription}
                  onChange={(event) => setMaterialDescription(event.target.value)}
                />
              </label>
            </article>

            <article className="donation-checkout-card material-form-section">
                <div className="material-section-heading">
                  <div>
                    <h2><Truck size={18} /> Schedule Your Contribution</h2>
                    <p>{materialModeDescription}</p>
                  </div>
                </div>
              <div className="material-logistics-toggle">
                <button
                  type="button"
                  className={materialDeliveryMode === 'pickup' ? 'is-selected' : ''}
                  onClick={() => setMaterialDeliveryMode('pickup')}
                >
                  <Truck size={18} />
                  <strong>Home Pickup</strong>
                  <span>Schedule a collection from your address</span>
                </button>
                <button
                  type="button"
                  className={materialDeliveryMode === 'dropoff' ? 'is-selected' : ''}
                  onClick={() => setMaterialDeliveryMode('dropoff')}
                >
                  <Building2 size={18} />
                  <strong>Self Drop-off</strong>
                  <span>Visit one of our logistics hubs</span>
                </button>
              </div>

              <div className="material-address-grid">
                <label className="material-field" htmlFor="pickup-address-input">
                  <span>{materialDeliveryMode === 'dropoff' ? 'Drop-off address' : 'Pickup address'}</span>
                  <input
                    id="pickup-address-input"
                    className="material-donation-input"
                    type="text"
                    placeholder={materialAddressPlaceholder}
                    value={pickupAddress}
                    onChange={(event) => setPickupAddress(event.target.value)}
                  />
                </label>
                <div className="material-readonly-stack">
                  <span>{materialDestinationLabel}</span>
                  <div className="material-readonly-field">
                    <MapPin size={15} />
                    <div className="material-readonly-copy">
                      <strong>{materialDestinationTitle}</strong>
                      <span>{safeLocation}</span>
                    </div>
                  </div>
                  <small className="material-field-note">{materialDestinationNote}</small>
                </div>
              </div>

              <div className="material-address-actions">
                <button
                  type="button"
                  className="material-location-button"
                  onClick={handleUseCurrentLocation}
                  disabled={locationLoading}
                >
                  <MapPin size={15} /> {locationLoading ? 'Getting current location...' : materialLocationActionLabel}
                </button>
                <a
                  className="material-inline-map-link"
                  href={`https://www.google.com/maps?q=${postedMapsQuery}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {materialMapsActionLabel}
                </a>
              </div>

              <div className="material-map-preview">
                <iframe
                  title="Material handoff route"
                  src={`https://maps.google.com/maps?q=${receiptDonorMapQuery}&z=13&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="material-schedule-section">
                <div className="material-schedule-heading">
                  <h3><CalendarDays size={16} /> Select Date & Time Window</h3>
                  <span>{selectedPickupWindowLabel}</span>
                </div>
                <div className="material-date-grid">
                  {materialSchedule.dateOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`material-date-card ${option.isSelected ? 'is-selected' : ''}`}
                      onClick={() => handleMaterialDateSelection(option.date)}
                    >
                      <span>{option.dayLabel}</span>
                      <strong>{option.dateLabel}</strong>
                      <small>{option.monthLabel}</small>
                    </button>
                  ))}
                </div>
                <div className="material-time-grid">
                  {materialSchedule.timeRanges.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      className={`material-time-chip ${slot.isSelected ? 'is-selected' : ''}`}
                      onClick={() => handleMaterialTimeSelection(slot)}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
                <label className="material-field" htmlFor="pickup-date-input">
                  <span>Custom Date and Time</span>
                  <input
                    id="pickup-date-input"
                    className="material-donation-input"
                    type="datetime-local"
                    value={pickupDate}
                    onChange={(event) => setPickupDate(event.target.value)}
                  />
                </label>
              </div>
            </article>

            <article className="donation-checkout-card material-story-section">
              <h2>Request Overview</h2>
              <p>{safeSummary}</p>
              <div className="campaign-pillars campaign-pillars-v2">
                <article>
                  <h3><Users size={16} /> {requestedItemTarget} Items Target</h3>
                  <p>{remainingItemNeed} item{remainingItemNeed === 1 ? '' : 's'} still needed for the selected material.</p>
                </article>
                <article>
                  <h3><MapPin size={16} /> {safeLocation}</h3>
                  <p>Using the organization&apos;s saved public location.</p>
                </article>
              </div>
            </article>
          </div>

          <aside className="donation-summary-card material-summary-card">
            <h2>Donation Summary</h2>
            <div className="donation-summary-campaign">
              <img src={requestedItemImage} alt={requestedItemName} referrerPolicy="no-referrer" />
              <div>
                <p>SELECTED ITEM</p>
                <strong>{requestedItemName}</strong>
                <span><Clock3 size={13} /> Estimated organizer review within 48 hours</span>
              </div>
            </div>

            <div className="material-preview-stat">
              <p>{materialQuantity}</p>
              <span>item{materialQuantity === 1 ? '' : 's'} selected for this donation</span>
            </div>

            <div className="donation-summary-lines">
              <div>
                <span>Selected Items</span>
                <strong>{requestedItemName} ({materialQuantity})</strong>
              </div>
              <div>
                <span>Delivery Method</span>
                <strong>{materialDeliveryLabel}</strong>
              </div>
              <div>
                <span>Preferred Window</span>
                <strong>{selectedPickupWindowLabel}</strong>
              </div>
              <div>
                <span>Location</span>
                <strong>{safeLocation}</strong>
              </div>
              <div>
                <span>Remaining Need</span>
                <strong>{remainingItemNeed.toLocaleString()} items</strong>
              </div>
            </div>

            <div className="material-impact-box">
              <strong>Commitment note</strong>
              <p>Your donor address will be visible to the logistics team only. We will confirm the exact route and pickup status after organizer review.</p>
            </div>

            <div className="material-summary-chat">
              <div className="material-summary-chat-avatar" aria-hidden="true">{organizationName.slice(0, 1)}</div>
              <div>
                <strong>Need help scheduling?</strong>
                <p>Chat with logistics</p>
              </div>
            </div>

            <button
              type="button"
              className="donation-complete-button"
              onClick={handleMaterialDonation}
              disabled={donationSubmitting}
            >
              <HandHeart size={16} /> {donationSubmitting ? 'Scheduling...' : 'Review & Confirm'}
            </button>

            <p className="donation-summary-terms">
              By scheduling, you confirm these items are available and ready for handover at the selected time.
            </p>

            {donationMessage ? <p className="donation-inline-message">{donationMessage}</p> : null}
          </aside>
        </section>
      </main>
    );
  }

  if (showCheckout) {
    if (abaQrCheckout) {
      return (
        <main className="campaign-detail-page donation-checkout-page">
          <button
            type="button"
            className="detail-back-link donation-checkout-back"
            onClick={() => {
              setAbaQrCheckout(null);
              setShowCheckout(false);
            }}
          >
            <ArrowLeft size={16} /> Back to Campaign
          </button>

          <section className="donation-checkout-header">
            <div>
              <h1>Scan to Donate</h1>
              <p>Scan this QR code to complete your donation. We will confirm the payment automatically.</p>
            </div>
            <div className="donation-checkout-secure">
              <ShieldCheck size={16} />
              <span>{abaQrCheckout.environment === 'production' ? 'Live Bakong KHQR' : 'Sandbox Bakong KHQR'}</span>
            </div>
          </section>

          <section className="donation-checkout-layout" aria-label="Bakong QR payment">
            <div className="donation-checkout-main">
              <article className="donation-checkout-card">
                <h2><ScanQrCode size={18} /> {abaQrCheckout.paymentLabel}</h2>
                <div className="donation-qr-panel">
                  <div className="donation-qr-frame">
                    <div className="donation-qr-card">
                      {abaQrCheckout.image ? (
                        <img
                          src={abaQrCheckout.image}
                          alt={`${abaQrCheckout.paymentLabel} QR code`}
                          style={{ width: '100%', maxWidth: 280, borderRadius: 16, display: 'block' }}
                        />
                      ) : (
                        <div className="donation-qr-code" aria-hidden="true">
                          {Array.from({ length: 49 }).map((_, index) => (
                            <span key={`fallback-qr-cell-${index}`} className={index % 2 === 0 || index % 5 === 0 ? 'is-filled' : ''} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <strong>{abaQrCheckout.paymentLabel} Ready</strong>
                  <p>
                    Amount: {formatDonationAmount(abaQrCheckout.amount, abaQrCheckout.currency || selectedDonationCurrency)}. Scan with Bakong or any KHQR-supported banking app.
                  </p>
                  <div className="donation-qr-badges" aria-label="Supported apps">
                    <span>{abaQrCheckout.paymentLabel}</span>
                    <span>{isSuccessfulPaymentStatus(abaQrCheckout.status) ? 'Paid' : 'Waiting'}</span>
                  </div>
                    {isSuccessfulPaymentStatus(abaQrCheckout.status) ? (
                      <p className="donation-inline-message donation-inline-message-success">
                        Your payment was successful. Thank you for your donation.
                      </p>
                    ) : null}
                  {!isSuccessfulPaymentStatus(abaQrCheckout.status) ? (
                    <div className={`donation-countdown-card ${abaQrCheckout.status === 'expired' ? 'is-expired' : ''}`}>
                      <span className="donation-countdown-label">Time Remaining</span>
                      <strong>{abaQrCheckout.status === 'expired' ? '00:00' : formatCountdown(qrCountdownSeconds)}</strong>
                      <p>
                        {abaQrCheckout.status === 'expired'
                          ? 'This payment session expired. Please go back and donate again.'
                          : 'Complete payment before the timer ends.'}
                      </p>
                    </div>
                  ) : null}
                  {abaQrCheckout.deeplink ? (
                    <a className="detail-share-btn" href={abaQrCheckout.deeplink}>
                      Open in banking app
                    </a>
                  ) : null}
                  {!abaQrCheckout.deeplink && abaQrCheckout.checkoutUrl ? (
                    <a className="detail-share-btn" href={abaQrCheckout.checkoutUrl} target="_blank" rel="noreferrer">
                      Open checkout page
                    </a>
                  ) : null}
                    {!abaQrCheckout.image && abaQrCheckout.qrString ? (
                      <p className="donation-inline-message">KHQR string received from gateway. If your app cannot scan here, use the checkout link.</p>
                    ) : null}
                    {!isSuccessfulPaymentStatus(abaQrCheckout.status) ? (
                      <p className="donation-inline-message">
                        Waiting for payment confirmation. Transaction ID: {abaQrCheckout.tranId}
                      </p>
                    ) : null}
                    {abaQrCheckout.expiresAt ? (
                      <p className={`donation-inline-message donation-inline-message-expiry ${isSuccessfulPaymentStatus(abaQrCheckout.status) ? 'is-success-state' : ''}`}>
                        Expires at {new Date(abaQrCheckout.expiresAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.
                      </p>
                    ) : null}
                </div>
              </article>
            </div>

            <aside className="donation-summary-card">
              <h2>Donation Summary</h2>
              <div className="donation-summary-campaign">
                <img src={safeImage} alt={safeTitle} referrerPolicy="no-referrer" />
                <div>
                  <p>CAMPAIGN</p>
                  <strong>{safeTitle}</strong>
                  <span><MapPin size={13} /> {safeLocation}</span>
                </div>
              </div>

              <div className="donation-summary-lines">
                <div>
                  <span>Donor</span>
                  <strong>{donorName || 'Donor'}</strong>
                </div>
                <div>
                  <span>Payment Method</span>
                  <strong>{abaQrCheckout.paymentLabel}</strong>
                </div>
              </div>

              <div className="donation-summary-total">
                <span>Total to Donate</span>
                <strong>{formatDonationAmount(abaQrCheckout.amount, abaQrCheckout.currency || selectedDonationCurrency)}</strong>
              </div>

              {donationMessage ? <p className="donation-inline-message">{donationMessage}</p> : null}
            </aside>
          </section>
        </main>
      );
    }

    return (
      <main className="campaign-detail-page donation-checkout-page">
        <button
          type="button"
          className="detail-back-link donation-checkout-back"
          onClick={() => {
            setShowCheckout(false);
            setDonationSubmitting(false);
          }}
        >
          <ArrowLeft size={16} /> Back to Campaign
        </button>

        <section className="donation-checkout-header">
          <div>
            <h1>{qrPendingState ? 'Preparing QR Code' : 'Payment Setup Needed'}</h1>
            <p>
              {qrPendingState
                ? 'We are generating your Bakong KHQR payment so you can scan it immediately.'
                : 'The payment gateway did not return a scannable QR yet. Review the details below and retry the request.'}
            </p>
          </div>
          <div className="donation-checkout-secure">
            <ShieldCheck size={16} />
            <span>Bakong KHQR</span>
          </div>
        </section>

        <section className="donation-checkout-layout" aria-label="Donation QR checkout">
          <div className="donation-checkout-main">
            <article className="donation-checkout-card">
              <h2><ScanQrCode size={18} /> Bakong KHQR</h2>
              <div className="donation-qr-panel">
                <div className="donation-qr-frame">
                  <div className={`donation-qr-card ${qrPendingState ? 'is-loading' : 'is-unavailable'}`}>
                    {qrPendingState ? (
                      <div className="donation-qr-status" aria-hidden="true">
                        <span className="donation-qr-status-dot" />
                        <span className="donation-qr-status-dot" />
                        <span className="donation-qr-status-dot" />
                      </div>
                    ) : (
                      <div className="donation-qr-unavailable-icon" aria-hidden="true">
                        <ScanQrCode size={52} />
                      </div>
                    )}
                  </div>
                </div>
                <strong>{qrPendingState ? 'Generating your QR...' : 'QR unavailable'}</strong>
                <p>
                  {qrPendingState
                    ? 'Please wait while we connect to the payment gateway and prepare the QR code.'
                    : 'We could not prepare the QR code yet. Please retry from this page. If it still fails, go back and start the donation again.'}
                </p>
                <div className="donation-qr-badges" aria-label="Supported apps">
                  <span>KHQR</span>
                  <span>Bakong</span>
                  <span>{totalDonationLabel}</span>
                </div>
                <div className="donation-qr-help-list" aria-label="Payment status details">
                  <p><strong>Status:</strong> {qrPendingState ? 'Connecting to payment gateway' : abaQrCheckout?.status === 'expired' ? 'Expired' : 'Awaiting retry'}</p>
                  <p><strong>Method:</strong> Bakong KHQR</p>
                  <p><strong>Amount:</strong> {totalDonationLabel}</p>
                  <p><strong>Time Limit:</strong> 5 minutes</p>
                </div>
                <button
                  type="button"
                  className="donation-complete-button"
                  onClick={() => {
                    if (abaQrCheckout?.status === 'expired') {
                      setShowCheckout(false);
                      setAbaQrCheckout(null);
                      setDonationSubmitting(false);
                      return;
                    }
                    handleCompleteDonation();
                  }}
                  disabled={donationSubmitting}
                >
                  <Lock size={16} /> {qrPendingState ? 'Preparing...' : abaQrCheckout?.status === 'expired' ? 'Back to Donate Again' : 'Try Again'}
                </button>
                {donationMessage ? <p className="donation-inline-message">{donationMessage}</p> : null}
              </div>
            </article>
          </div>

          <aside className="donation-summary-card">
            <h2>Donation Summary</h2>
            <div className="donation-summary-campaign">
              <img src={safeImage} alt={safeTitle} referrerPolicy="no-referrer" />
              <div>
                <p>CAMPAIGN</p>
                <strong>{safeTitle}</strong>
                <span><MapPin size={13} /> {safeLocation}</span>
              </div>
            </div>

            <div className="donation-summary-lines">
              <div>
                <span>Donor</span>
                <strong>{donorName || 'Donor'}</strong>
              </div>
              <div>
                <span>Donation Amount</span>
                <strong>{selectedAmountLabel}</strong>
              </div>
              <div>
                <span>Payment Method</span>
                <strong>Bakong KHQR</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{qrPendingState ? 'Preparing QR' : 'Pending retry'}</strong>
              </div>
            </div>

            <div className="donation-summary-total">
              <span>Total to Donate</span>
              <strong>{totalDonationLabel}</strong>
            </div>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <main className="campaign-detail-page campaign-detail-v2">
      <Link to={backTarget} className="detail-back-link">
        <ArrowLeft size={16} /> Back to campaigns
      </Link>

      <section className="campaign-detail-layout campaign-detail-v2-layout" aria-label="Campaign detail">
        <div className="campaign-main-column">
          <article className="campaign-hero-panel campaign-hero-v2">
            <div className="campaign-hero-media">
              <img src={safeImage} alt={safeTitle} className="campaign-detail-image" referrerPolicy="no-referrer" />
              <div className="campaign-hero-badges">
                {showUrgentBadge ? (
                  <span className="campaign-hero-flag">
                    <Clock3 size={14} /> Urgent
                  </span>
                ) : null}
                <span className="campaign-category">{safeCategory}</span>
              </div>
            </div>
            <div className="campaign-hero-body">
              <div className="campaign-hero-copy">
                <p className="campaign-hero-eyebrow">{campaignBadgeCategory}</p>
                <h1>{safeTitle}</h1>
                <p className="campaign-hero-organization">{organizationName}</p>
                <p className="campaign-hero-summary">{safeSummary}</p>
              </div>

              <div className="campaign-hero-progress-card">
                <div className="campaign-hero-progress-header">
                  <div>
                    <span>{progressPrimaryLabel}</span>
                    <strong>{progressPrimaryValue}</strong>
                  </div>
                  <div>
                    <span>{progressSecondaryLabel}</span>
                    <strong>{progressSecondaryValue}</strong>
                  </div>
                </div>
                <div className="campaign-hero-progress-meta">
                  <span>{progressStatusLabel}</span>
                  <span>{campaignTypeLabel}</span>
                </div>
                <div className="campaign-progress campaign-progress-v2" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progressPercent}>
                  <span style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              <div className="campaign-hero-footer">
                <div className="campaign-hero-timeline">
                  <span className="campaign-hero-timeline-icon">
                    <Clock3 size={16} />
                  </span>
                  <div>
                    <strong>{supportTimelineLabel}</strong>
                    <span>{organizationName}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="campaign-hero-support"
                  onClick={handleDonateNow}
                >
                  {isMaterialCampaign ? 'Pledge Support' : 'Support'}
                </button>
              </div>
            </div>
          </article>

          <nav className="campaign-tabs campaign-tabs-v2" aria-label="Campaign sections">
            <button type="button" className={activeTab === 'about' ? 'tab-active' : ''} onClick={() => setActiveTab('about')}>About</button>
            <button type="button" className={activeTab === 'updates' ? 'tab-active' : ''} onClick={() => setActiveTab('updates')}>Updates ({updateItems.length})</button>
            <button type="button" className={activeTab === 'organization' ? 'tab-active' : ''} onClick={() => setActiveTab('organization')}>Organization</button>
            <button type="button" className={activeTab === 'comments' ? 'tab-active' : ''} onClick={() => setActiveTab('comments')}>Comments ({commentItems.length})</button>
          </nav>

          {activeTab === 'about' ? (
            <>
              <article className="campaign-about">
                <h2>Project Impact</h2>
                <p>{impactNarrative || safeSummary}</p>
                <div className="campaign-pillars campaign-pillars-v2">
                  {impactCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <article key={card.title}>
                        <h3><Icon size={16} /> {card.title}</h3>
                        <p>{card.body}</p>
                      </article>
                    );
                  })}
                </div>
              </article>

              <article className="campaign-updates campaign-donors-v2">
                <div className="campaign-section-header">
                  <h2>{isMaterialCampaign ? 'Recent Supporters' : 'Recent Donors'}</h2>
                  <button type="button" className="campaign-section-link">View All</button>
                </div>
                <div className="donor-list-v2">
                  {recentDonors.length > 0 ? recentDonors.map((donor) => {
                    const donorNameValue = donor?.donor_name || 'Anonymous Donor';
                    const initials = donorNameValue
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join('')
                      .toUpperCase() || 'DN';

                    return (
                      <div className="donor-item-v2" key={donor.id}>
                        <span className="donor-avatar donor-avatar-more" data-initial={initials}>{initials}</span>
                        <div>
                          <strong>{donorNameValue}</strong>
                          <p>
                            {isMaterialCampaign
                              ? `Pledged ${Number(donor.amount || 0)} item${Number(donor.amount || 0) > 1 ? 's' : ''} - ${new Date(donor.created_at).toLocaleDateString()}`
                              : `Donated ${formatDonationAmount(donor.amount || 0, donor.currency || 'USD')} - ${new Date(donor.created_at).toLocaleDateString()}`}
                          </p>
                        </div>
                        <Heart size={14} className="liked" />
                      </div>
                    );
                  }) : (
                    <div className="donor-item-v2">
                      <span className="donor-avatar donor-avatar-more" data-initial="--">--</span>
                      <div>
                        <strong>{isMaterialCampaign ? 'No supporters yet' : 'No donors yet'}</strong>
                        <p>{isMaterialCampaign ? 'The first material pledge will appear here.' : 'The first completed donation will appear here.'}</p>
                      </div>
                      <Heart size={14} />
                    </div>
                  )}
                </div>
              </article>
            </>
          ) : null}

          {activeTab === 'updates' ? (
            <article className="campaign-updates campaign-updates-v2">
              <h2>Recent Updates</h2>
              {updateItems.map((item) => (
                <div className="update-item" key={item.id}>
                  <p className="update-meta">{item.date}</p>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={`${impactHeadline} update`}
                      className="update-inline-image"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                </div>
              ))}
            </article>
          ) : null}

          {activeTab === 'organization' ? (
            <article className="campaign-updates campaign-updates-v2">
              <h2>Organization</h2>
              <div className="update-item">
                <p className="update-meta">ORGANIZED BY</p>
                <h3>{organizationName}</h3>
                <p>{campaign?.distributionPlan || campaign?.pickupInstructions || safeSummary}</p>
              </div>
              <div className="campaign-pillars campaign-pillars-v2">
                <article>
                  <h3><Building2 size={16} /> {organizationName}</h3>
                  <p>{campaign?.status ? `Campaign status: ${campaign.status}` : 'Campaign currently available for donor support.'}</p>
                </article>
                <article>
                  <h3><MapPin size={16} /> {safeLocation}</h3>
                  <p>{hasPostedCoordinates ? `Coordinates: ${postedLatitude.toFixed(5)}, ${postedLongitude.toFixed(5)}` : 'Public campaign location shared by the organization.'}</p>
                </article>
              </div>
            </article>
          ) : null}

          {activeTab === 'comments' ? (
            <article className="campaign-updates campaign-updates-v2">
              <h2>Comments</h2>
              {commentItems.length > 0 ? commentItems.map((item) => (
                <div className="update-item" key={item.id}>
                  <p className="update-meta">{item.date}</p>
                  <h3>{item.author}</h3>
                  <p>Rating: {item.rating}/5</p>
                  <p>{item.comment}</p>
                </div>
              )) : (
                <div className="update-item">
                  <p className="update-meta">{currentDate}</p>
                  <h3>No comments yet</h3>
                  <p>Organization reviews will appear here when supporters leave feedback.</p>
                </div>
              )}
            </article>
          ) : null}
        </div>

        <aside className="campaign-side-column">
          <article className="detail-stat-card detail-stat-v2">
            {isMaterialCampaign ? (
              <>
                <p className="stat-amount">{pledgedItems}</p>
                <p className="stat-goal">pledges of {requestedItemTarget} item target</p>
                <div className="campaign-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={materialProgressPercent}>
                  <span style={{ width: `${materialProgressPercent}%` }} />
                </div>
                <div className="detail-mini-stats">
                  <p><strong>{requestedItemTarget}</strong><span>Items Needed</span></p>
                  <p><strong>{daysToGo ?? '-'}</strong><span>Days Left</span></p>
                  <p><strong>{materialProgressPercent}%</strong><span>Pledged</span></p>
                </div>
                <div className="material-donation-card">
                  <div className="material-donation-item">
                    <strong>{requestedItemName}</strong>
                    <p>{requestedItemDescription}</p>
                  </div>
                  <p className="selected-amount">
                    Donate this item through the material request form.
                  </p>
                </div>
                <button
                  type="button"
                  className="donate-button detail-donate-button"
                  onClick={handleDonateNow}
                >
                  <HandHeart size={15} /> Donate Material
                </button>
              </>
            ) : (
              <>
                <p className="stat-amount">{formatCurrency(raisedAmount)}</p>
                <p className="stat-goal">raised of {formatCurrency(goalAmount)}</p>
                <div className="campaign-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progressWidth}>
                  <span style={{ width: `${progressWidth}%` }} />
                </div>
                <div className="detail-mini-stats">
                  <p><strong>{supporterCount}</strong><span>Donors</span></p>
                  <p><strong>{daysToGo ?? '-'}</strong><span>Days Left</span></p>
                  <p><strong>{percentRaised}%</strong><span>Reached</span></p>
                </div>
                <div className="quick-amount-grid">
                  {DONATION_CURRENCIES.map((currency) => (
                    <button
                      key={currency}
                      type="button"
                      className={selectedDonationCurrency === currency ? 'is-selected' : ''}
                      onClick={() => handleDonationCurrencyChange(currency)}
                    >
                      {currency}
                    </button>
                  ))}
                </div>
                <div className="quick-amount-grid">
                  {presetDisplayAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      className={amount === selectedAmount ? 'is-selected' : ''}
                      onClick={() => {
                        setSelectedAmount(amount);
                        setCustomAmountInput('');
                        setDonationMessage('');
                      }}
                    >
                      {formatDonationAmount(amount, selectedDonationCurrency)}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={!presetDisplayAmounts.includes(selectedAmount) ? 'is-selected' : ''}
                    onClick={() => setDonationMessage(`Enter a custom amount in ${selectedDonationCurrency}, then press Apply.`)}
                  >
                    Custom
                  </button>
                </div>
                <form className="custom-amount-form" onSubmit={handleCustomAmountApply}>
                  <label htmlFor="custom-amount-input">Custom amount ({selectedDonationCurrency})</label>
                  <div className="custom-amount-controls">
                    <input
                      id="custom-amount-input"
                      type="number"
                      min={selectedDonationCurrency === 'USD' ? '0.001' : '1'}
                      step={selectedDonationCurrency === 'USD' ? '0.001' : '1'}
                      inputMode="decimal"
                      placeholder={`Enter amount in ${selectedDonationCurrency}`}
                      value={customAmountInput}
                      onChange={(event) => setCustomAmountInput(event.target.value)}
                    />
                    <button type="submit">Apply</button>
                  </div>
                </form>
                <p className="selected-amount">{selectedAmountLabel}</p>
                <button
                  type="button"
                  className="donate-button detail-donate-button"
                  onClick={handleDonateNow}
                >
                  <HandHeart size={15} /> Donate Now
                </button>
              </>
            )}
            {donationMessage ? <p className="donation-inline-message">{donationMessage}</p> : null}
            <div className="detail-secondary-actions">
              <button type="button" className="detail-save-btn" onClick={handleSaveToggle}>
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <button type="button" className="detail-share-btn" onClick={handleShare}>
                <Share2 size={14} /> {shareLabel}
              </button>
            </div>
          </article>

          <article className="detail-creator-card">
            <p className="card-label">Organized by</p>
            <p className="creator-name">{creatorName}</p>
            <p className="creator-subtext">{campaign.organization}</p>
            <button type="button"><Building2 size={14} /> Contact Organizer</button>
          </article>

          <article className="detail-rewards-card detail-location-card">
            <p className="card-label">Location</p>
            <iframe
              title="Campaign location map"
              src={`https://maps.google.com/maps?q=${postedMapsQuery}&z=${hasPostedCoordinates ? 14 : 12}&output=embed`}
              className="location-image"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <p className="location-caption">
              Posted by the organization: {safeLocation}
            </p>
            {hasPostedCoordinates ? (
              <p className="location-caption">Pinned coordinates: {postedLatitude.toFixed(5)}, {postedLongitude.toFixed(5)}</p>
            ) : null}
            <div className="detail-secondary-actions">
              <span className="detail-save-btn">Organization Posted</span>
              <a
                className="detail-share-btn"
                href={`https://www.google.com/maps?q=${postedMapsQuery}`}
                target="_blank"
                rel="noreferrer"
              >
                Open Maps
              </a>
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}

export default CampaignDetailPage;
