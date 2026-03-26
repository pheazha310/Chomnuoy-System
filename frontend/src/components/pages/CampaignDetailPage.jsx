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
} from 'lucide-react';
import { createBakongTransaction, verifyBakongTransaction } from '../../services/user-service';

import { getCampaignById } from '../../data/campaigns';
import '../css/Campaigns.css';

const SAVED_CAMPAIGNS_STORAGE_KEY = 'chomnuoy_saved_campaigns';
const DONOR_CAMPAIGNS_CACHE_KEY = 'donor_campaigns_cache_v1';
const DONOR_HOME_CACHE_KEY = 'donor_home_dashboard_v1';
const LAST_OPENED_CAMPAIGN_KEY = 'chomnuoy_last_opened_campaign';
const DONATION_CACHE_KEY = 'donor_my_donations_v1';
const LAST_DONATION_DETAIL_KEY = 'chomnuoy_last_donation_detail';
const PENDING_BAKONG_TRANSACTION_KEY = 'chomnuoy_pending_bakong_transaction';

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

function getSession() {
  try {
    const raw = window.localStorage.getItem('chomnuoy_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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

function mapCachedCampaign(item) {
  if (!item?.id) return null;
  let parsedTiers = null;
  let parsedMaterialItem = null;
  if (typeof item.donation_tiers === 'string') {
    try {
      parsedTiers = JSON.parse(item.donation_tiers);
    } catch {
      parsedTiers = null;
    }
  } else if (Array.isArray(item.donation_tiers)) {
    parsedTiers = item.donation_tiers;
  }
  if (typeof item.material_item === 'string') {
    try {
      parsedMaterialItem = JSON.parse(item.material_item);
    } catch {
      parsedMaterialItem = null;
    }
  } else if (item.material_item && typeof item.material_item === 'object') {
    parsedMaterialItem = item.material_item;
  } else if (item.materialItem && typeof item.materialItem === 'object') {
    parsedMaterialItem = item.materialItem;
  }
  const inferredCampaignType = item.campaignType || item.campaign_type || (parsedMaterialItem ? 'material' : 'monetary');
  return {
    id: item.id,
    organizationId: Number(item.organizationId ?? item.organization_id ?? 0) || null,
    campaignType: inferredCampaignType,
    title: item.title || 'Untitled campaign',
    category: item.category || item.normalizedCategory || 'General',
    organization: item.organization || 'Verified Organization',
    summary: item.summary || item.description || 'No description available yet.',
    location: item.organizationLocation || item.organization_location || item.location || 'Kampong Speu, Cambodia',
    latitude: Number(item.organizationLatitude ?? item.organization_latitude ?? item.latitude ?? 0) || null,
    longitude: Number(item.organizationLongitude ?? item.organization_longitude ?? item.longitude ?? 0) || null,
    status: item.status || '',
    startDate: item.startDate || item.start_date || '',
    endDate: item.endDate || item.end_date || '',
    createdAt: item.createdAt || item.created_at || '',
    receiptMessage: item.receipt_message || '',
    donorUpdates: item.donorUpdates || item.donor_updates || '',
    distributionPlan: item.distributionPlan || item.distribution_plan || '',
    materialPriority: item.materialPriority || item.material_priority || '',
    pickupInstructions: item.pickupInstructions || item.pickup_instructions || '',
    donationTiers: parsedTiers,
    materialItem: parsedMaterialItem,
    goalAmount: Number(item.goalAmount ?? item.goal ?? 0),
    raisedAmount: Number(item.raisedAmount ?? item.raised ?? 0),
    image:
      item.image ||
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  };
}

function getCachedCampaignById(id) {
  try {
    const rawLastOpened = window.localStorage.getItem(LAST_OPENED_CAMPAIGN_KEY);
    const lastOpened = rawLastOpened ? JSON.parse(rawLastOpened) : null;
    if (lastOpened && String(lastOpened.id) === String(id)) {
      return mapCachedCampaign(lastOpened);
    }
  } catch {
    // Ignore malformed local cache.
  }

  const donorCampaigns = readSessionCache(DONOR_CAMPAIGNS_CACHE_KEY);
  if (Array.isArray(donorCampaigns)) {
    const match = donorCampaigns.find((item) => String(item?.id) === String(id));
    if (match) return mapCachedCampaign(match);
  }

  const donorHome = readSessionCache(DONOR_HOME_CACHE_KEY);
  const donorHomeCampaigns = Array.isArray(donorHome?.campaigns) ? donorHome.campaigns : [];
  const homeMatch = donorHomeCampaigns.find((item) => String(item?.id) === String(id));
  if (homeMatch) return mapCachedCampaign(homeMatch);

  return null;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Bakong KHQR');
  const [donationMessage, setDonationMessage] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showDonationSuccess, setShowDonationSuccess] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState(null);
  const [materialQuantity, setMaterialQuantity] = useState(1);
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialDeliveryMode, setMaterialDeliveryMode] = useState('pickup');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [donorCoordinates, setDonorCoordinates] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [recentDonors, setRecentDonors] = useState([]);
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
  const campaign = campaignData ?? getCampaignById(resolvedCampaignId);
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
    let mounted = true;
    const isNumericCampaignId = /^\d+$/.test(String(resolvedCampaignId));

    if (routeCampaign && String(routeCampaign.id) === String(resolvedCampaignId)) {
      setCampaignData(mapCachedCampaign(routeCampaign) || routeCampaign);
      if (!isNumericCampaignId) {
        setCampaignLoading(false);
        return () => {
          mounted = false;
        };
      }
    }

    const local = getCampaignById(resolvedCampaignId);
    if (local) {
      setCampaignData(mapCachedCampaign(local) || local);
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
      setCampaignData(null);
      return () => {
        mounted = false;
      };
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);
    setCampaignLoading(true);
    fetch(`${apiBase}/campaigns/${resolvedCampaignId}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load campaign (${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        if (!mounted) return;
        const parsedMaterialItem = (() => {
          if (data?.material_item && typeof data.material_item === 'object') return data.material_item;
          if (typeof data?.material_item === 'string') {
            try {
              return JSON.parse(data.material_item);
            } catch {
              return null;
            }
          }
          return null;
        })();
        const mapped = {
          id: data?.id,
          organizationId: Number(data?.organization_id ?? 0) || null,
          campaignType: data?.campaign_type || (parsedMaterialItem ? 'material' : 'monetary'),
          title: data?.title || 'Untitled campaign',
          category: data?.category || 'General',
          organization:
              data?.organization_name ||
              data?.organization ||
              (data?.organization_id ? `Organization ${data.organization_id}` : 'Organization'),
          summary: data?.description || data?.summary || 'No description available yet.',
          location: data?.organization_location || data?.location || 'Kampong Speu, Cambodia',
          latitude: Number(data?.organization_latitude ?? data?.latitude ?? 0) || null,
          longitude: Number(data?.organization_longitude ?? data?.longitude ?? 0) || null,
          status: data?.status || '',
          startDate: data?.start_date || '',
          endDate: data?.end_date || '',
          createdAt: data?.created_at || '',
          receiptMessage: data?.receipt_message || '',
          donorUpdates: data?.donor_updates || '',
          distributionPlan: data?.distribution_plan || '',
          materialPriority: data?.material_priority || '',
          pickupInstructions: data?.pickup_instructions || '',
          donationTiers: (() => {
            if (Array.isArray(data?.donation_tiers)) return data.donation_tiers;
            if (typeof data?.donation_tiers === 'string') {
              try {
                return JSON.parse(data.donation_tiers);
              } catch {
                return null;
              }
            }
            return null;
          })(),
          materialItem: parsedMaterialItem,
          goalAmount: Number(data?.goal_amount ?? data?.goal ?? 0),
          raisedAmount: Number(data?.current_amount ?? data?.raised_amount ?? data?.raised ?? 0),
          image:
            getStorageFileUrl(data?.image_path) ||
            data?.image_url ||
            data?.image ||
            'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
        };
        setCampaignData(mapped);
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
      return;
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    let alive = true;

    fetch(`${apiBase}/campaigns/${resolvedCampaignId}/donations`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (!alive) return;
        setRecentDonors(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!alive) return;
        setRecentDonors([]);
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
  const materialItem = campaign?.materialItem && typeof campaign.materialItem === 'object'
    ? campaign.materialItem
    : null;
  const requestedItemName = materialItem?.name || materialItem?.item_name || 'Requested items';
  const requestedItemDescription = materialItem?.description || 'Coordinate a pickup to deliver physical support directly to this campaign.';
  const requestedItemTarget = Math.max(1, Number(materialItem?.quantity || 1));
  const materialDeliveryLabel = materialDeliveryMode === 'dropoff' ? 'Self Drop-off' : 'Schedule Pickup';
  const materialAddressLabel = materialDeliveryMode === 'dropoff' ? 'Drop-off details' : 'Pickup address';
  const materialAddressPlaceholder = materialDeliveryMode === 'dropoff'
    ? 'Add the note or place where you will drop off the items.'
    : 'Enter your street name, building, apartment, or meeting point.';
  const presetAmounts = Array.isArray(campaign?.donationTiers) && campaign.donationTiers.length > 0
    ? campaign.donationTiers
        .map((item) => Number(item?.amount ?? item))
        .filter((amount) => Number.isFinite(amount) && amount > 0)
        .slice(0, 5)
    : [10, 25, 50, 100, 250];
  const safeImage =
    campaign?.image ||
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';
  const goalAmount = Number(campaign?.goalAmount ?? 0);
  const raisedAmount = Number(campaign?.raisedAmount ?? 0);
  const percentRaised = goalAmount > 0 ? Math.round((raisedAmount / goalAmount) * 100) : 0;
  const progressWidth = Math.min(percentRaised, 100);
  const backers = Math.max(24, Math.round(raisedAmount / 35) || 0);
  const daysToGo = Math.max(5, 45 - Math.floor(raisedAmount / 5000) || 0);
  const pledgedItems = Math.max(recentDonors.length, 0);
  const materialProgressPercent = Math.min(100, Math.round((pledgedItems / requestedItemTarget) * 100));
  const progressPercent = isMaterialCampaign ? materialProgressPercent : progressWidth;
  const supportTimelineLabel = `${daysToGo} ${daysToGo === 1 ? 'day' : 'days'} left`;
  const progressStatusLabel = isMaterialCampaign ? `${materialProgressPercent}% pledged` : `${percentRaised}% funded`;
  const campaignTypeLabel = isMaterialCampaign ? 'Material Drive' : 'Monetary Campaign';
  const showUrgentBadge = daysToGo <= 7 || String(campaign?.status || '').toLowerCase().includes('urgent');
  const organizationName = String(campaign?.organization || 'Organization');
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
          title: `${backers}+ Supporters`,
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
          description: `${daysToGo} day${daysToGo === 1 ? '' : 's'} remaining before this campaign closes.`,
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

  useEffect(() => {
    if (!abaQrCheckout?.tranId || abaQrCheckout?.status === 'completed' || abaQrCheckout?.status === 'failed') {
      return undefined;
    }

    let active = true;
    const intervalId = window.setInterval(async () => {
      try {
        const verification = await verifyBakongTransaction(abaQrCheckout.tranId);
        if (!active) return;

        const transaction = verification?.transaction;
        const normalizedStatus = String(transaction?.status || '').toLowerCase();
        if (!normalizedStatus) return;

        setAbaQrCheckout((previous) => (
          previous ? { ...previous, status: normalizedStatus } : previous
        ));

        if (normalizedStatus === 'completed') {
          const nextReceiptDetails = {
            amount: Number(transaction?.amount ?? totalDonation).toFixed(2),
            date: new Date(transaction?.paid_at || Date.now()).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }),
            donationId: transaction?.donation_id ?? null,
            transactionId: transaction?.tran_id ? `#${transaction.tran_id}` : '',
            paymentMethod: abaQrCheckout.paymentLabel,
            campaignTitle: safeTitle,
            campaignImage: safeImage,
            campaignLocation: safeLocation,
            organizationName,
            receiptMessage: campaign?.receiptMessage || '',
            status: normalizedStatus,
          };

          clearDonationCaches();
          setReceiptDetails(nextReceiptDetails);
          try {
            window.sessionStorage.setItem(LAST_DONATION_DETAIL_KEY, JSON.stringify(nextReceiptDetails));
          } catch {
            // Ignore persistence failures.
          }
          setShowCheckout(false);
          setShowDonationSuccess(true);
          window.sessionStorage.removeItem(PENDING_BAKONG_TRANSACTION_KEY);
          return;
        }

        if (['failed', 'cancelled', 'expired'].includes(normalizedStatus)) {
          setDonationMessage(`Payment ${normalizedStatus}. Please generate a new KHQR and try again.`);
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
  }, [abaQrCheckout, totalDonation, safeTitle, safeImage, safeLocation, organizationName, campaign?.receiptMessage]);

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
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setDonationMessage('Please enter a valid custom amount greater than $0.');
      return;
    }

    const roundedAmount = Math.round(parsed);
    setSelectedAmount(roundedAmount);
    setDonationMessage(`Custom amount applied: $${roundedAmount.toLocaleString()}.`);
  }

  function handleDonateNow() {
    setDonationMessage('');
    setAbaQrCheckout(null);
    setShowCheckout(true);
    if (!isMaterialCampaign && selectedPaymentMethod === 'Bakong KHQR') {
      setAutoStartAbaQr(true);
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
      const token = window.localStorage.getItem('authToken');
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
      setShowDonationSuccess(true);
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
          amount: Number(qrData?.amount ?? totalDonation).toFixed(2),
          currency: qrData?.currency || 'USD',
          environment: checkoutMeta?.environment || 'sandbox',
          status: 'pending',
          paymentLabel: checkoutMeta?.payment_label || 'Bakong KHQR',
        });
        return;
      }

      const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
      const token = window.localStorage.getItem('authToken');
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
        amount: Number(donation?.amount ?? totalDonation).toFixed(2),
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
      setShowDonationSuccess(true);
    } catch (error) {
      setDonationMessage(getApiErrorMessage(error, 'Failed to complete donation.'));
    } finally {
      setDonationSubmitting(false);
    }
  }

  function handleDownloadReceipt() {
    if (!receiptDetails) return;
    const amountLabel = receiptDetails?.isMaterial ? 'Items' : 'Amount';
    const amountValue = receiptDetails?.isMaterial ? receiptDetails.amount : `$${receiptDetails.amount}`;
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
          <h1>{receiptDetails?.isMaterial ? 'Material Donation Scheduled!' : 'Thank You for Your Donation!'}</h1>
          <p className="donation-success-campaign">
            Campaign: <span>{successCampaignTitle}</span>
          </p>

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
              <span>{receiptDetails?.isMaterial ? 'Items' : 'Amount'}</span>
              <strong>{receiptDetails?.isMaterial ? receiptDetails?.amount : `$${receiptDetails?.amount ?? totalDonation.toFixed(2)}`}</strong>
            </div>
            <div>
              <span>{receiptDetails?.isMaterial ? 'Reference' : 'Transaction ID'}</span>
              <strong>{receiptDetails?.transactionId ?? ''}</strong>
            </div>
            <div>
              <span>Date</span>
              <strong className="is-highlighted">{receiptDetails?.date ?? ''}</strong>
            </div>
          </div>

          {receiptDetails?.isMaterial ? (
            <div className="donation-success-highlight">
              <strong>{receiptDetails?.itemName || 'Material donation'} recorded successfully</strong>
              <p>
                {receiptDetails?.quantity
                  ? `${receiptDetails.quantity} ${receiptDetails.quantity > 1 ? 'items are' : 'item is'} now waiting for organizer review and delivery coordination.`
                  : 'The organizer will review your pledged items and confirm the pickup or drop-off details soon.'}
              </p>
            </div>
          ) : null}

          {receiptDetails?.isMaterial ? (
            <div className="donation-success-location-grid">
              <article className="donation-success-location-card">
                <p className="donation-success-location-label">Organization Location</p>
                <strong>{receiptDetails?.campaignLocation || safeLocation}</strong>
                <div className="donation-success-location-map">
                  <iframe
                    title="Organization location"
                    src={`https://maps.google.com/maps?q=${receiptOrganizationMapQuery}&z=13&output=embed`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <a className="donation-success-location-link" href={organizationMapUrl} target="_blank" rel="noreferrer">
                  Open organization map
                </a>
              </article>

              <article className="donation-success-location-card">
                <p className="donation-success-location-label">
                  {receiptDetails?.paymentMethod === 'Material drop-off' ? 'Donor Drop-off Location' : 'Donor Pickup Location'}
                </p>
                <strong>{receiptDetails?.pickupAddress || 'No donor location was provided.'}</strong>
                <div className="donation-success-location-map">
                  <iframe
                    title="Donor location"
                    src={`https://maps.google.com/maps?q=${receiptDonorMapQuery}&z=13&output=embed`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="donation-success-location-actions">
                  <a className="donation-success-location-link" href={donorMapUrl} target="_blank" rel="noreferrer">
                    Open donor map
                  </a>
                  <a className="donation-success-location-link is-secondary" href={donorDirectionsUrl} target="_blank" rel="noreferrer">
                    Track route
                  </a>
                </div>
              </article>
            </div>
          ) : null}

          <div className="donation-success-actions">
            <button
              type="button"
              className="donation-success-primary"
              onClick={() => navigate('/donations/view-detail', { state: { donation: receiptDetails } })}
            >
              <Download size={15} /> {receiptDetails?.isMaterial ? 'View Donation Details' : 'Download Receipt'}
            </button>
            <button type="button" className="donation-success-secondary" onClick={handleShare}>
              <Share2 size={15} /> Share to Social Media
            </button>
          </div>

          <div className="donation-success-next">
            <h2>What Happens Next?</h2>
            <div className="donation-success-steps">
              <div className="donation-success-step is-complete">
                <span className="step-icon"><CircleCheckBig size={14} /></span>
                <div>
                  <strong>{receiptDetails?.isMaterial ? 'Donation Recorded' : 'Donation Received'}</strong>
                  <p>{receiptDetails?.isMaterial ? 'Your pledged items have been recorded for organizer review.' : 'Your contribution has been successfully processed.'}</p>
                </div>
              </div>
              <div className="donation-success-step is-active">
                <span className="step-icon"><Clock3 size={14} /></span>
                <div>
                  <strong>{receiptDetails?.isMaterial ? 'Pickup Scheduled' : 'Funds Transferred'}</strong>
                  <p>{receiptDetails?.isMaterial ? 'The organization will confirm the pickup window and delivery details.' : 'Allocating funds to the village construction teams.'}</p>
                </div>
              </div>
              <div className="donation-success-step">
                <span className="step-icon"><Circle size={14} /></span>
                <div>
                  <strong>{receiptDetails?.isMaterial ? 'Impact Reported' : 'Impact Reported'}</strong>
                  <p>{receiptDetails?.isMaterial ? 'You will receive updates once your items are collected and distributed.' : 'You will receive a detailed impact report in 3 months.'}</p>
                </div>
              </div>
            </div>
          </div>

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
            <p>Review the item request, choose the logistics method, and schedule your support separately from money donations.</p>
          </div>
          <div className="donation-checkout-secure material-checkout-secure">
            <ShieldCheck size={16} />
            <span>Secure Request</span>
          </div>
        </section>

        <section className="material-donation-layout" aria-label="Material donation scheduling">
          <div className="material-donation-main">
            <article className="donation-checkout-card material-form-section">
              <h2><Building2 size={18} /> Item Details</h2>
              <div className="material-top-grid">
                <label className="material-field">
                  <span>Category</span>
                  <div className="material-readonly-field">{safeCategory}</div>
                </label>
                <label className="material-field">
                  <span>Quantity</span>
                  <div className="material-quantity-picker material-quantity-picker-wide">
                    <button type="button" onClick={() => setMaterialQuantity((current) => Math.max(1, current - 1))}>-</button>
                    <input
                      id="material-quantity-input"
                      type="number"
                      min="1"
                      step="1"
                      value={materialQuantity}
                      onChange={(event) => setMaterialQuantity(Math.max(1, Number(event.target.value) || 1))}
                    />
                    <button type="button" onClick={() => setMaterialQuantity((current) => current + 1)}>+</button>
                  </div>
                </label>
              </div>

              <div className="material-request-highlight">
                <strong>{requestedItemName}</strong>
                <p>{requestedItemDescription}</p>
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
              <h2><MapPin size={18} /> Logistics</h2>
              <div className="material-logistics-toggle">
                <button
                  type="button"
                  className={materialDeliveryMode === 'pickup' ? 'is-selected' : ''}
                  onClick={() => setMaterialDeliveryMode('pickup')}
                >
                  Schedule Pickup
                </button>
                <button
                  type="button"
                  className={materialDeliveryMode === 'dropoff' ? 'is-selected' : ''}
                  onClick={() => setMaterialDeliveryMode('dropoff')}
                >
                  Self Drop-off
                </button>
              </div>

              <div className="material-address-block">
                <label className="material-field" htmlFor="pickup-address-input">
                  <span>{materialAddressLabel}</span>
                  <input
                    id="pickup-address-input"
                    className="material-donation-input"
                    type="text"
                    placeholder={materialAddressPlaceholder}
                    value={pickupAddress}
                    onChange={(event) => setPickupAddress(event.target.value)}
                  />
                </label>
                <div className="material-address-actions">
                  <button
                    type="button"
                    className="material-location-button"
                    onClick={handleUseCurrentLocation}
                    disabled={locationLoading}
                  >
                    <MapPin size={15} /> {locationLoading ? 'Getting current location...' : 'Use Current Location'}
                  </button>
                  <p className="material-address-hint">
                    Add a precise landmark or gate number so pickup is easier to coordinate.
                  </p>
                </div>
              </div>

              <label className="material-field" htmlFor="pickup-date-input">
                <span>Preferred Date and Time</span>
                <input
                  id="pickup-date-input"
                  className="material-donation-input"
                  type="datetime-local"
                  value={pickupDate}
                  onChange={(event) => setPickupDate(event.target.value)}
                />
              </label>
            </article>

            <article className="donation-checkout-card material-story-section">
              <h2>Request Overview</h2>
              <p>{safeSummary}</p>
              <div className="campaign-pillars campaign-pillars-v2">
                <article>
                  <h3><Users size={16} /> {requestedItemTarget} Items Target</h3>
                  <p>Requested directly by the organization for this campaign.</p>
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
              <img src={safeImage} alt={safeTitle} referrerPolicy="no-referrer" />
              <div>
                <p>TYPE</p>
                <strong>{requestedItemName}</strong>
                <span><Clock3 size={13} /> Estimated organizer review within 48 hours</span>
              </div>
            </div>

            <div className="donation-summary-lines">
              <div>
                <span>Selected Items</span>
                <strong>{requestedItemName} ({materialQuantity})</strong>
              </div>
              <div>
                <span>Logistics</span>
                <strong>{materialDeliveryLabel}</strong>
              </div>
              <div>
                <span>Organization</span>
                <strong>{organizationName}</strong>
              </div>
              <div>
                <span>Location</span>
                <strong>{safeLocation}</strong>
              </div>
            </div>

            <div className="material-impact-box">
              <strong>Impact Message</strong>
              <p>Your items will be reviewed by the organization and matched to the campaign needs before delivery is confirmed.</p>
            </div>

            <button
              type="button"
              className="donation-complete-button"
              onClick={handleMaterialDonation}
              disabled={donationSubmitting}
            >
              <HandHeart size={16} /> {donationSubmitting ? 'Scheduling...' : 'Schedule Donation'}
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
                    Amount: ${abaQrCheckout.amount} {abaQrCheckout.currency}. Scan with Bakong or any KHQR-supported banking app.
                  </p>
                  <div className="donation-qr-badges" aria-label="Supported apps">
                    <span>{abaQrCheckout.paymentLabel}</span>
                    <span>{abaQrCheckout.status === 'completed' ? 'Paid' : 'Waiting'}</span>
                  </div>
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
                  {abaQrCheckout.status !== 'completed' ? (
                    <p className="donation-inline-message">
                      Waiting for payment confirmation. Transaction ID: {abaQrCheckout.tranId}
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
                <strong>${abaQrCheckout.amount}</strong>
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
                  <span>{totalDonation.toFixed(2)} USD</span>
                </div>
                <div className="donation-qr-help-list" aria-label="Payment status details">
                  <p><strong>Status:</strong> {qrPendingState ? 'Connecting to payment gateway' : 'Awaiting retry'}</p>
                  <p><strong>Method:</strong> Bakong KHQR</p>
                  <p><strong>Amount:</strong> ${totalDonation.toFixed(2)}</p>
                </div>
                <button
                  type="button"
                  className="donation-complete-button"
                  onClick={handleCompleteDonation}
                  disabled={donationSubmitting}
                >
                  <Lock size={16} /> {qrPendingState ? 'Preparing...' : 'Try Again'}
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
                <strong>${selectedAmount.toFixed(2)}</strong>
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
              <strong>${totalDonation.toFixed(2)}</strong>
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
                <p className="campaign-hero-eyebrow">{campaignTypeLabel}</p>
                <h1>{safeTitle}</h1>
                <p className="campaign-hero-summary">{safeSummary}</p>
              </div>

              <div className="campaign-hero-progress-card">
                <div className="campaign-hero-progress-header">
                  <div>
                    <span>Raised</span>
                    <strong>{isMaterialCampaign ? pledgedItems : formatCurrency(raisedAmount)}</strong>
                  </div>
                  <div>
                    <span>Goal</span>
                    <strong>{isMaterialCampaign ? requestedItemTarget : formatCurrency(goalAmount)}</strong>
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
                              : `Donated $${Number(donor.amount || 0).toFixed(2)} - ${new Date(donor.created_at).toLocaleDateString()}`}
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
                  <p><strong>{daysToGo}</strong><span>Days Left</span></p>
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
                  <p><strong>{backers}</strong><span>Donors</span></p>
                  <p><strong>{daysToGo}</strong><span>Days Left</span></p>
                  <p><strong>{percentRaised}%</strong><span>Reached</span></p>
                </div>
                <div className="quick-amount-grid">
                  {presetAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      className={amount === selectedAmount ? 'is-selected' : ''}
                      onClick={() => {
                        setSelectedAmount(amount);
                        setDonationMessage('');
                      }}
                    >
                      ${amount}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={!presetAmounts.includes(selectedAmount) ? 'is-selected' : ''}
                    onClick={() => setDonationMessage('Enter a custom amount below, then press Apply.')}
                  >
                    Custom
                  </button>
                </div>
                <form className="custom-amount-form" onSubmit={handleCustomAmountApply}>
                  <label htmlFor="custom-amount-input">Custom amount (USD)</label>
                  <div className="custom-amount-controls">
                    <input
                      id="custom-amount-input"
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      placeholder="Enter amount"
                      value={customAmountInput}
                      onChange={(event) => setCustomAmountInput(event.target.value)}
                    />
                    <button type="submit">Apply</button>
                  </div>
                </form>
                <p className="selected-amount">$ {selectedAmount.toLocaleString()}</p>
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
