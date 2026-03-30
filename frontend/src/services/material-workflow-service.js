import apiClient from './api-client';

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateLabel(value) {
  const parsed = parseDate(value);
  if (!parsed) return value || '-';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

export function formatTimeLabel(value) {
  const parsed = parseDate(value);
  if (!parsed) return 'Pending confirmation';
  return parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function normalizeMaterialWorkflowStatus(value) {
  const key = String(value || '').trim().toLowerCase();

  if (['cancelled', 'canceled'].includes(key)) {
    return { key: 'cancelled', label: 'Cancelled', adminLabel: 'Cancelled', donorTone: 'cancelled', organizationLabel: 'Cancelled' };
  }
  if (['completed', 'complete', 'delivered', 'success', 'done'].includes(key)) {
    return { key: 'completed', label: 'Delivered', adminLabel: 'Completed', donorTone: 'delivered', organizationLabel: 'Completed' };
  }
  if (['in transit', 'transit', 'in_transit', 'enroute', 'en route'].includes(key)) {
    return { key: 'in_transit', label: 'In Transit', adminLabel: 'In Transit', donorTone: 'transit', organizationLabel: 'In Transit' };
  }
  if (['assigned', 'accepted', 'confirmed', 'driver assigned', 'scheduled'].includes(key)) {
    return { key: 'confirmed', label: 'Confirmed', adminLabel: 'Assigned', donorTone: 'pending', organizationLabel: 'Confirmed' };
  }

  return { key: 'pending', label: 'Pending', adminLabel: 'Pending', donorTone: 'pending', organizationLabel: 'Pending' };
}

export function getMaterialWorkflowTimeline(status) {
  const normalized = normalizeMaterialWorkflowStatus(status).key;
  const order = {
    cancelled: 0,
    pending: 1,
    confirmed: 2,
    in_transit: 3,
    completed: 4,
  };
  const activeStep = order[normalized] ?? 1;

  return [
    { key: 'requested', label: 'Pickup requested', done: activeStep >= 1 },
    { key: 'confirmed', label: 'Driver assigned', done: activeStep >= 2 },
    { key: 'transit', label: 'In transit', done: activeStep >= 3 },
    { key: 'completed', label: 'Delivered', done: activeStep >= 4 },
  ];
}

export function getMaterialCategoryLabel(value) {
  const text = String(value || '').trim().toLowerCase();
  if (text.includes('cloth')) return 'Clothing';
  if (text.includes('educ') || text.includes('book') || text.includes('school')) return 'Education';
  if (text.includes('food')) return 'Food Supply';
  if (text.includes('house')) return 'Household';
  return 'Other';
}

export function getInitials(name, fallback = 'NA') {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function getOrganizationFromMaps({ pickup, donation, campaign, organizationsById, organizationsByUserId }) {
  const directOrganizationId = toNumber(pickup?.organization_id ?? donation?.organization_id ?? campaign?.organization_id);
  if (directOrganizationId && organizationsById.has(directOrganizationId)) {
    return organizationsById.get(directOrganizationId);
  }
  if (directOrganizationId && organizationsByUserId.has(directOrganizationId)) {
    return organizationsByUserId.get(directOrganizationId);
  }
  return null;
}

export async function getMaterialWorkflowResources() {
  const [
    donationsResponse,
    materialItemsResponse,
    pickupsResponse,
    campaignsResponse,
    organizationsResponse,
    usersResponse,
    notificationsResponse,
  ] = await Promise.all([
    apiClient.get('/donations'),
    apiClient.get('/material_items'),
    apiClient.get('/material_pickups'),
    apiClient.get('/campaigns'),
    apiClient.get('/organizations'),
    apiClient.get('/users'),
    apiClient.get('/notifications').catch(() => ({ data: [] })),
  ]);

  return {
    donations: Array.isArray(donationsResponse.data) ? donationsResponse.data : [],
    materialItems: Array.isArray(materialItemsResponse.data) ? materialItemsResponse.data : [],
    pickups: Array.isArray(pickupsResponse.data) ? pickupsResponse.data : [],
    campaigns: Array.isArray(campaignsResponse.data) ? campaignsResponse.data : [],
    organizations: Array.isArray(organizationsResponse.data) ? organizationsResponse.data : [],
    users: Array.isArray(usersResponse.data) ? usersResponse.data : [],
    notifications: Array.isArray(notificationsResponse.data) ? notificationsResponse.data : [],
  };
}

export function buildMaterialWorkflowRows(resources = {}) {
  const donations = Array.isArray(resources.donations) ? resources.donations : [];
  const materialItems = Array.isArray(resources.materialItems) ? resources.materialItems : [];
  const pickups = Array.isArray(resources.pickups) ? resources.pickups : [];
  const campaigns = Array.isArray(resources.campaigns) ? resources.campaigns : [];
  const organizations = Array.isArray(resources.organizations) ? resources.organizations : [];
  const users = Array.isArray(resources.users) ? resources.users : [];

  const donationMap = new Map(donations.map((item) => [Number(item.id), item]));
  const campaignMap = new Map(campaigns.map((item) => [Number(item.id), item]));
  const organizationMap = new Map(organizations.map((item) => [Number(item.id), item]));
  const organizationByUserMap = new Map(
    organizations
      .map((item) => [Number(item.user_id), item])
      .filter(([id]) => Number.isFinite(id) && id > 0)
  );
  const userMap = new Map(users.map((item) => [Number(item.id), item]));
  const materialItemsByDonation = materialItems.reduce((map, item) => {
    const donationId = Number(item.donation_id);
    if (!map.has(donationId)) {
      map.set(donationId, []);
    }
    map.get(donationId).push(item);
    return map;
  }, new Map());
  const pickupByDonationId = new Map(
    pickups
      .map((item) => [Number(item.donation_id), item])
      .filter(([donationId]) => Number.isFinite(donationId) && donationId > 0)
  );

  const materialDonations = donations
    .filter((item) => String(item.donation_type || '').toLowerCase().includes('material'))
    .map((donation) => {
      const donationId = Number(donation.id);
      const pickup = pickupByDonationId.get(donationId) || null;
      const campaign = campaignMap.get(Number(donation.campaign_id)) || null;
      const organization = getOrganizationFromMaps({
        pickup,
        donation,
        campaign,
        organizationsById: organizationMap,
        organizationsByUserId: organizationByUserMap,
      });
      const donor = userMap.get(Number(donation.user_id ?? pickup?.user_id ?? pickup?.donor_id)) || null;
      const items = materialItemsByDonation.get(donationId) || [];
      const primaryItem = items[0] || null;
      const totalQuantity = items.reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0) || Math.max(1, Number(donation.amount || 1));
      const itemNames = items.map((item) => item.item_name).filter(Boolean);
      const scheduleDate = pickup?.schedule_date || pickup?.pickup_date || pickup?.date || donation.created_at || '';
      const statusMeta = normalizeMaterialWorkflowStatus(pickup?.status || donation.status);
      const organizationName =
        pickup?.organization_name ||
        campaign?.organization_name ||
        organization?.name ||
        organization?.organization_name ||
        donation.organization_name ||
        `Organization #${donation.organization_id || 'N/A'}`;
      const donorName =
        pickup?.donor_name ||
        donor?.name ||
        donation.user_name ||
        `Donor #${donation.user_id || 'N/A'}`;
      const pickupAddress =
        pickup?.pickup_address ||
        pickup?.address ||
        donation.pickup_address ||
        campaign?.pickup_location ||
        campaign?.location ||
        'Pickup address pending';
      const latitude = toNumber(pickup?.pickup_latitude ?? pickup?.latitude ?? pickup?.lat);
      const longitude = toNumber(pickup?.pickup_longitude ?? pickup?.longitude ?? pickup?.lng);
      const category = getMaterialCategoryLabel(
        primaryItem?.category ||
        campaign?.material_priority ||
        campaign?.category ||
        pickup?.category ||
        pickup?.item_category ||
        primaryItem?.item_name
      );

      return {
        id: pickup?.id || `material-${donationId}`,
        donationId,
        pickupId: toNumber(pickup?.id),
        campaignId: toNumber(donation.campaign_id),
        organizationId: toNumber(donation.organization_id ?? pickup?.organization_id ?? campaign?.organization_id ?? organization?.id),
        donorUserId: toNumber(donation.user_id ?? pickup?.user_id ?? pickup?.donor_id),
        donorName,
        donorInitials: getInitials(donorName, 'DN'),
        organizationName,
        campaignTitle: campaign?.title || donation.project_name || 'Campaign',
        category,
        itemName: primaryItem?.item_name || pickup?.item_name || 'Material items',
        itemNames,
        itemSummary: itemNames.join(', ') || primaryItem?.description || 'Material request',
        quantity: totalQuantity,
        quantityLabel: `${totalQuantity}x ${primaryItem?.item_name || 'Items'}`,
        pickupAddress,
        statusKey: statusMeta.key,
        donorStatusLabel: statusMeta.label,
        organizationStatusLabel: statusMeta.organizationLabel,
        adminStatusLabel: statusMeta.adminLabel,
        donorStatusTone: statusMeta.donorTone,
        scheduleDateRaw: scheduleDate,
        scheduleDateLabel: formatDateLabel(scheduleDate),
        scheduleTimeLabel: formatTimeLabel(scheduleDate),
        createdAtValue: parseDate(scheduleDate)?.getTime() || parseDate(donation.created_at)?.getTime() || 0,
        timeline: getMaterialWorkflowTimeline(pickup?.status || donation.status),
        lat: latitude,
        lng: longitude,
        donation,
        pickup,
        campaign,
        organization,
      };
    });

  return materialDonations.sort((a, b) => b.createdAtValue - a.createdAtValue);
}

export async function updateMaterialWorkflowStatus({
  pickupId,
  donationId,
  pickupPatch = {},
  donationStatus,
  notification,
}) {
  if (pickupId) {
    await apiClient.put(`/material_pickups/${pickupId}`, pickupPatch);
  }
  if (donationId && donationStatus) {
    await apiClient.put(`/donations/${donationId}`, { status: donationStatus });
  }
  if (notification?.user_id) {
    await apiClient.post('/notifications', {
      user_id: notification.user_id,
      message: notification.message,
      type: notification.type || 'material-workflow-update',
      is_read: false,
    }).catch(() => null);
  }
}
