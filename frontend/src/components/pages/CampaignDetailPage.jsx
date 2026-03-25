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
  return {
    id: item.id,
    organizationId: Number(item.organizationId ?? item.organization_id ?? 0) || null,
    campaignType: item.campaignType || item.campaign_type || 'monetary',
    title: item.title || 'Untitled campaign',
    category: item.category || item.normalizedCategory || 'General',
    organization: item.organization || 'Verified Organization',
    summary: item.summary || item.description || 'No description available yet.',
    location: item.location || 'Kampong Speu, Cambodia',
    latitude: Number(item.latitude ?? 0) || null,
    longitude: Number(item.longitude ?? 0) || null,
    receiptMessage: item.receipt_message || '',
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
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [recentDonors, setRecentDonors] = useState([]);
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
    const hasFullCampaignType = (value) => Boolean(
      value?.campaignType ||
      value?.campaign_type ||
      value?.materialItem ||
      value?.material_item
    );

    if (routeCampaign && String(routeCampaign.id) === String(resolvedCampaignId)) {
      setCampaignData(mapCachedCampaign(routeCampaign) || routeCampaign);
      if (hasFullCampaignType(routeCampaign)) {
        setCampaignLoading(false);
        return () => {
          mounted = false;
        };
      }
    }

    const local = getCampaignById(resolvedCampaignId);
    if (local) {
      setCampaignData(mapCachedCampaign(local) || local);
      if (hasFullCampaignType(local)) {
        setCampaignLoading(false);
        return () => {
          mounted = false;
        };
      }
    }

    const cached = getCachedCampaignById(resolvedCampaignId);
    if (cached) {
      setCampaignData(cached);
      if (hasFullCampaignType(cached)) {
        setCampaignLoading(false);
        return () => {
          mounted = false;
        };
      }
    }

    if (!/^\d+$/.test(String(resolvedCampaignId))) {
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
        const mapped = {
          id: data?.id,
          organizationId: Number(data?.organization_id ?? 0) || null,
          campaignType: data?.campaign_type || 'monetary',
          title: data?.title || 'Untitled campaign',
          category: data?.category || 'General',
          organization:
              data?.organization_name ||
              data?.organization ||
              (data?.organization_id ? `Organization ${data.organization_id}` : 'Organization'),
          summary: data?.description || data?.summary || 'No description available yet.',
          location: data?.location || 'Kampong Speu, Cambodia',
          latitude: Number(data?.latitude ?? 0) || null,
          longitude: Number(data?.longitude ?? 0) || null,
          receiptMessage: data?.receipt_message || '',
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
          materialItem: (() => {
            if (data?.material_item && typeof data.material_item === 'object') return data.material_item;
            if (typeof data?.material_item === 'string') {
              try {
                return JSON.parse(data.material_item);
              } catch {
                return null;
              }
            }
            return null;
          })(),
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
  const campaignType = String(campaign?.campaignType || 'monetary').toLowerCase();
  const isMaterialCampaign = campaignType.includes('material');
  const materialItem = campaign?.materialItem && typeof campaign.materialItem === 'object'
    ? campaign.materialItem
    : null;
  const requestedItemName = materialItem?.name || materialItem?.item_name || 'Requested items';
  const requestedItemDescription = materialItem?.description || 'Coordinate a pickup to deliver physical support directly to this campaign.';
  const requestedItemTarget = Math.max(1, Number(materialItem?.quantity || 1));
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
  const organizationName = String(campaign?.organization || 'Organization');
  const creatorName =
    organizationName.replace(/\b(Org|Solutions|Collective|Tech)\b/g, '').trim() || organizationName;
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
    if (selectedPaymentMethod === 'Bakong KHQR') {
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

    if (!pickupAddress.trim()) {
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
          description: requestedItemDescription,
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
          pickup_address: pickupAddress.trim(),
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
        date: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        donationId,
        transactionId: `#MAT-${donationId}`,
        paymentMethod: 'Material pickup',
        campaignTitle: safeTitle,
        campaignImage: safeImage,
        campaignLocation: safeLocation,
        organizationName,
        receiptMessage: campaign?.receiptMessage || '',
        status: 'pending',
        isMaterial: true,
      };

      setReceiptDetails(nextReceiptDetails);
      setShowDonationSuccess(true);
    } catch (error) {
      setDonationMessage(getApiErrorMessage(error, 'Failed to schedule this material donation.'));
    } finally {
      setDonationSubmitting(false);
    }
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
          location: updatedCampaign.location || previous?.location || campaign.location,
          latitude: Number(updatedCampaign.latitude ?? previous?.latitude ?? campaign.latitude ?? 0) || null,
          longitude: Number(updatedCampaign.longitude ?? previous?.longitude ?? campaign.longitude ?? 0) || null,
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
    <div class="row"><span class="muted">Campaign</span><strong>${safeTitle}</strong></div>
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
    return (
      <main className="campaign-detail-page donation-success-page">
        <section className="donation-success-card" aria-label="Donation success">
          <div className="donation-success-icon">
            <CircleCheckBig size={28} />
          </div>

          <h1>{receiptDetails?.isMaterial ? 'Material Donation Scheduled!' : 'Thank You for Your Donation!'}</h1>
          <p className="donation-success-campaign">
            Campaign: <span>{safeTitle}</span>
          </p>

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
            <h1>Preparing QR Code</h1>
            <p>We are generating your Bakong KHQR payment so you can scan it immediately.</p>
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
                <strong>{donationSubmitting ? 'Generating your QR...' : 'QR unavailable'}</strong>
                <p>
                  {donationSubmitting
                    ? 'Please wait while we connect to the payment gateway and prepare the QR code.'
                    : 'We could not prepare the QR code yet. You can retry from this page.'}
                </p>
                <div className="donation-qr-badges" aria-label="Supported apps">
                  <span>KHQR</span>
                  <span>Bakong</span>
                </div>
                {!donationSubmitting ? (
                  <button type="button" className="donation-complete-button" onClick={handleCompleteDonation}>
                    <Lock size={16} /> Try Again
                  </button>
                ) : null}
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
                <span>Donation Amount</span>
                <strong>${selectedAmount.toFixed(2)}</strong>
              </div>
              <div>
                <span>Payment Method</span>
                <strong>Bakong KHQR</strong>
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
            <img src={safeImage} alt={safeTitle} className="campaign-detail-image" referrerPolicy="no-referrer" />
            <div className="campaign-hero-overlay">
              <span className="campaign-category">{safeCategory}</span>
              <h1>{safeTitle}</h1>
              <p className="campaign-hero-location">
                <MapPin size={14} /> {safeLocation}
              </p>
            </div>
          </article>

          <nav className="campaign-tabs campaign-tabs-v2" aria-label="Campaign sections">
            <button type="button" className="tab-active">About</button>
            <button type="button">Updates (4)</button>
            <button type="button">Organization</button>
            <button type="button">Comments</button>
          </nav>

          <article className="campaign-about">
            <h2>Project Impact</h2>
            <p>
              {safeSummary} Access to clean water is a fundamental human right, and this project installs reliable
              systems with long-term local maintenance.
            </p>
            <div className="campaign-pillars campaign-pillars-v2">
              <article>
                <h3><Droplets size={16} /> 5,000 Liters/Day</h3>
                <p>Daily filtration capacity per village system.</p>
              </article>
              <article>
                <h3><Users size={16} /> 500+ Families</h3>
                <p>Directly benefiting from safe water access.</p>
              </article>
            </div>
          </article>

          <article className="campaign-updates campaign-updates-v2">
            <h2>Recent Updates</h2>
            <div className="update-item">
              <p className="update-meta">Yesterday</p>
              <h3>First Filtration Unit Arrived</h3>
              <p>
                The core components for the first solar filtration system have arrived at our central hub and are being
                inspected by engineers.
              </p>
              <img
                src="https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?auto=format&fit=crop&w=720&q=80"
                alt="Filtration update"
                className="update-inline-image"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="update-item">
              <p className="update-meta">{currentDate}</p>
              <h3>Local team training completed</h3>
              <p>Community technicians completed operational training for daily management and maintenance.</p>
            </div>
          </article>

          <article className="campaign-updates campaign-donors-v2">
            <div className="campaign-section-header">
              <h2>Recent Donors</h2>
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
                    <span className="donor-avatar donor-avatar-more">{initials}</span>
                    <div>
                      <strong>{donorNameValue}</strong>
                      <p>Donated ${Number(donor.amount || 0).toFixed(2)} - {new Date(donor.created_at).toLocaleDateString()}</p>
                    </div>
                    <Heart size={14} className="liked" />
                  </div>
                );
              }) : (
                <div className="donor-item-v2">
                  <span className="donor-avatar donor-avatar-more">--</span>
                  <div>
                    <strong>No donors yet</strong>
                    <p>The first completed donation will appear here.</p>
                  </div>
                  <Heart size={14} />
                </div>
              )}
            </div>
          </article>
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
                  <label className="material-donation-label" htmlFor="material-quantity-input">How many items can you give?</label>
                  <div className="material-quantity-picker">
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
                  <label className="material-donation-label" htmlFor="pickup-address-input">Pickup address</label>
                  <textarea
                    id="pickup-address-input"
                    className="material-donation-textarea"
                    rows={3}
                    placeholder="Enter your address or meeting point for pickup."
                    value={pickupAddress}
                    onChange={(event) => setPickupAddress(event.target.value)}
                  />
                  <label className="material-donation-label" htmlFor="pickup-date-input">Preferred pickup date</label>
                  <input
                    id="pickup-date-input"
                    className="material-donation-input"
                    type="datetime-local"
                    value={pickupDate}
                    onChange={(event) => setPickupDate(event.target.value)}
                  />
                </div>
                <p className="selected-amount">{materialQuantity} item{materialQuantity > 1 ? 's' : ''} pledged</p>
                <button
                  type="button"
                  className="donate-button detail-donate-button"
                  onClick={handleMaterialDonation}
                  disabled={donationSubmitting}
                >
                  <HandHeart size={15} /> {donationSubmitting ? 'Scheduling...' : 'Schedule Material Pickup'}
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
