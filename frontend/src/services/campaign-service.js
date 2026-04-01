const DEFAULT_API_BASE = 'http://127.0.0.1:8000/api';

export const CAMPAIGNS_CACHE_KEY = 'donor_campaigns_cache_v2';
export const CAMPAIGN_FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#DBEAFE"/><stop offset="100%" stop-color="#FEF3C7"/></linearGradient></defs><rect width="1200" height="700" fill="url(#g)"/><text x="50%" y="50%" font-size="36" font-family="Source Sans 3, Noto Sans Khmer, sans-serif" text-anchor="middle" fill="#334155">Campaign Image</text></svg>'
  );

const hiddenCampaignStatuses = new Set(['draft', 'completed', 'complete', 'closed', 'archived', 'cancelled']);

function getApiBase() {
  return import.meta.env.VITE_API_URL || DEFAULT_API_BASE;
}

function normalizeDonationType(value) {
  const key = String(value || '').trim().toLowerCase();
  return key === 'material' || key === 'materials' ? 'material' : 'money';
}

function isSuccessfulDonationStatus(value) {
  const key = String(value || '').trim().toLowerCase();
  return ['completed', 'success', 'confirmed', 'paid'].includes(key);
}

function parsePossibleJson(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  return null;
}

export function getCampaignStorageFileUrl(path) {
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
  const apiBase = getApiBase();
  const appBase = apiBase.replace(/\/api\/?$/, '');

  if (normalizedPath.startsWith('uploads/') || normalizedPath.startsWith('storage/')) {
    return `${appBase}/${normalizedPath}`;
  }

  // Files stored on Laravel's public disk are commonly returned as relative
  // paths like "campaigns/uuid.jpg" and should be served from /storage/.
  if (normalizedPath.startsWith('campaigns/') || normalizedPath.startsWith('avatars/')) {
    return `${appBase}/storage/${normalizedPath}`;
  }

  if (normalizedPath.startsWith('files/')) {
    return `${apiBase}/${normalizedPath}`;
  }

  const encodedPath = normalizedPath
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `${apiBase}/files/${encodedPath}`;
}

export function normalizeCampaignCategory(value) {
  const key = String(value || '').trim().toLowerCase();

  if (key.includes('education') || key.includes('technology') || key.includes('tech')) return 'Education';
  if (key.includes('health') || key.includes('medical')) return 'Medical';
  if (key.includes('environment') || key.includes('water') || key.includes('climate')) return 'Environment';
  if (key.includes('disaster') || key.includes('relief') || key.includes('emergency')) return 'Disaster Relief';
  if (key.includes('social') || key.includes('community') || key.includes('welfare')) return 'Community';

  return 'General';
}

export function campaignCategoryToSidebarCategory(category) {
  const normalized = normalizeCampaignCategory(category);

  if (normalized === 'Medical') return 'Healthcare';
  if (normalized === 'Community') return 'Disaster Relief';

  return normalized;
}

export function isPublicCampaignStatus(status) {
  const value = String(status || '').trim().toLowerCase();
  if (!value) return true;

  return !hiddenCampaignStatuses.has(value);
}

export function getDaysLeft(endDate) {
  if (!endDate) return null;

  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return null;

  const diffMs = end.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getTimeLeft(endDate) {
  const diffDays = getDaysLeft(endDate);
  if (diffDays === null) return 'Ongoing';
  if (diffDays <= 0) return 'Ended';
  if (diffDays === 1) return '1 day left';
  if (diffDays < 7) return `${diffDays} days left`;

  const weeks = Math.ceil(diffDays / 7);
  return `${weeks} weeks left`;
}

export function normalizeCampaign(item) {
  if (!item) return null;

  const materialItem = parsePossibleJson(item.material_item ?? item.materialItem);
  const donationTiers = parsePossibleJson(item.donation_tiers ?? item.donationTiers);
  const goalAmount = Math.max(0, Number(item.goal_amount ?? item.goalAmount ?? item.goal ?? 0));
  const raisedAmount = Math.max(
    0,
    Number(item.live_current_amount ?? item.current_amount ?? item.raisedAmount ?? item.raised_amount ?? item.raised ?? 0)
  );
  const supporterCount = Math.max(
    0,
    Number(item.live_supporter_count ?? item.supporter_count ?? item.supporterCount ?? 0)
  );
  const category = item.category || item.normalizedCategory || 'General';
  const normalizedCategory = normalizeCampaignCategory(category);
  const createdAtValue = item.created_at || item.createdAt || '';
  const createdAt = createdAtValue ? new Date(createdAtValue).getTime() : 0;
  const daysLeft = getDaysLeft(item.end_date || item.endDate);
  const isMaterialCampaign = String(
    item.campaign_type || item.campaignType || (materialItem ? 'material' : 'monetary')
  )
    .toLowerCase()
    .includes('material');

  return {
    id: item.id,
    organizationId: Number(item.organization_id ?? item.organizationId ?? 0) || null,
    campaignType: isMaterialCampaign ? 'material' : 'monetary',
    title: item.title || 'Untitled Campaign',
    description: item.description || item.summary || 'No description provided.',
    summary: item.summary || item.description || 'No description provided.',
    category,
    normalizedCategory,
    organization:
      item.organization_name ||
      item.organization ||
      item.organizationTitle ||
      (item.organization_id || item.organizationId
        ? `Organization ${item.organization_id || item.organizationId}`
        : 'Verified Organization'),
    location: item.organization_location || item.organizationLocation || item.location || '',
    organizationLocation: item.organization_location || item.organizationLocation || item.location || '',
    latitude: Number(item.organization_latitude ?? item.organizationLatitude ?? item.latitude ?? 0) || null,
    longitude: Number(item.organization_longitude ?? item.organizationLongitude ?? item.longitude ?? 0) || null,
    status: item.status || '',
    startDate: item.start_date || item.startDate || '',
    endDate: item.end_date || item.endDate || '',
    createdAt: createdAtValue,
    receiptMessage: item.receipt_message || item.receiptMessage || '',
    donorUpdates: item.donor_updates || item.donorUpdates || '',
    distributionPlan: item.distribution_plan || item.distributionPlan || '',
    materialPriority: item.material_priority || item.materialPriority || '',
    pickupInstructions: item.pickup_instructions || item.pickupInstructions || '',
    donationTiers: Array.isArray(donationTiers) ? donationTiers : null,
    materialItem,
    goalAmount,
    raisedAmount,
    goal: goalAmount,
    raised: raisedAmount,
    supporterCount,
    image:
      getCampaignStorageFileUrl(item.image_path) ||
      item.image_url ||
      item.image ||
      CAMPAIGN_FALLBACK_IMAGE,
    timeLeft: getTimeLeft(item.end_date || item.endDate),
    daysLeft,
    isUrgent: typeof daysLeft === 'number' ? daysLeft > 0 && daysLeft <= 3 : false,
    isNew: createdAt ? Date.now() - createdAt <= 1000 * 60 * 60 * 24 * 14 : false,
    isPublic: isPublicCampaignStatus(item.status),
  };
}

function buildCampaignTotals(donations, materialItems) {
  const materialQuantityByDonationId = new Map(
    (Array.isArray(materialItems) ? materialItems : []).map((item) => [
      Number(item.donation_id),
      Math.max(1, Number(item.quantity || 1)),
    ]),
  );

  return (Array.isArray(donations) ? donations : []).reduce((map, item) => {
    const campaignId = Number(item.campaign_id || 0);
    if (!campaignId || !isSuccessfulDonationStatus(item.status)) return map;

    const current = map.get(campaignId) || { money: 0, material: 0, supporters: new Set() };
    const donationType = normalizeDonationType(item.donation_type);
    const amount = Math.max(0, Number(item.amount || 0));

    if (donationType === 'material') {
      current.material += materialQuantityByDonationId.get(Number(item.id)) || Math.max(1, amount);
    } else {
      current.money += amount;
    }

    const donorUserId = Number(item.user_id || 0);
    if (donorUserId) {
      current.supporters.add(donorUserId);
    }

    map.set(campaignId, current);
    return map;
  }, new Map());
}

function applyCampaignTotals(campaigns, donations, materialItems) {
  const totalsByCampaignId = buildCampaignTotals(donations, materialItems);

  return campaigns.map((campaign) => {
    const campaignTotals = totalsByCampaignId.get(Number(campaign.id || 0));
    const isMaterialCampaign = String(campaign.campaignType || '').toLowerCase().includes('material');
    const liveRaisedAmount = isMaterialCampaign
      ? Number(campaignTotals?.material || 0)
      : Number(campaign.raisedAmount || 0);

    return {
      ...campaign,
      raisedAmount: liveRaisedAmount,
      raised: liveRaisedAmount,
      supporterCount: campaignTotals?.supporters?.size ?? campaign.supporterCount,
    };
  });
}

export function mapCampaigns(items, options = {}) {
  const includeHidden = options.includeHidden === true;

  return (Array.isArray(items) ? items : [])
    .map((item) => normalizeCampaign(item))
    .filter(Boolean)
    .filter((item) => (includeHidden ? true : item.isPublic));
}

export async function fetchCampaigns(options = {}) {
  const apiBase = getApiBase();
  const [campaignResult, donationResult, materialItemsResult] = await Promise.allSettled([
    fetch(`${apiBase}/campaigns`, options),
    fetch(`${apiBase}/donations`, options),
    fetch(`${apiBase}/material_items`, options),
  ]);

  if (campaignResult.status !== 'fulfilled') {
    throw new Error('Failed to load campaigns.');
  }

  const campaignResponse = campaignResult.value;

  if (!campaignResponse.ok) {
    throw new Error(`Failed to load campaigns (${campaignResponse.status})`);
  }

  const campaignsData = await campaignResponse.json();
  const donationsData =
    donationResult.status === 'fulfilled' && donationResult.value.ok
      ? await donationResult.value.json()
      : [];
  const materialItemsData =
    materialItemsResult.status === 'fulfilled' && materialItemsResult.value.ok
      ? await materialItemsResult.value.json()
      : [];

  return applyCampaignTotals(mapCampaigns(campaignsData), donationsData, materialItemsData);
}

export async function fetchCampaignById(id, options = {}) {
  const apiBase = getApiBase();
  const [campaignResult, donationResult, materialItemsResult] = await Promise.allSettled([
    fetch(`${apiBase}/campaigns/${id}`, options),
    fetch(`${apiBase}/donations`, options),
    fetch(`${apiBase}/material_items`, options),
  ]);

  if (campaignResult.status !== 'fulfilled') {
    throw new Error('Failed to load campaign.');
  }

  const campaignResponse = campaignResult.value;

  if (!campaignResponse.ok) {
    throw new Error(`Failed to load campaign (${campaignResponse.status})`);
  }

  const campaignData = await campaignResponse.json();
  const donationsData =
    donationResult.status === 'fulfilled' && donationResult.value.ok
      ? await donationResult.value.json()
      : [];
  const materialItemsData =
    materialItemsResult.status === 'fulfilled' && materialItemsResult.value.ok
      ? await materialItemsResult.value.json()
      : [];

  return applyCampaignTotals([normalizeCampaign(campaignData)], donationsData, materialItemsData)[0] ?? null;
}
