import apiClient from './api-client';

export async function getDonationHistoryResources() {
  const [donationsResponse, materialItemsResponse, campaignsResponse, organizationsResponse, paymentsResponse, pickupsResponse, usersResponse] =
    await Promise.all([
      apiClient.get('/donations'),
      apiClient.get('/material_items'),
      apiClient.get('/campaigns'),
      apiClient.get('/organizations'),
      apiClient.get('/payments'),
      apiClient.get('/material_pickups'),
      apiClient.get('/users'),
    ]);

  return {
    donations: Array.isArray(donationsResponse.data) ? donationsResponse.data : [],
    materialItems: Array.isArray(materialItemsResponse.data) ? materialItemsResponse.data : [],
    campaigns: Array.isArray(campaignsResponse.data) ? campaignsResponse.data : [],
    organizations: Array.isArray(organizationsResponse.data) ? organizationsResponse.data : [],
    payments: Array.isArray(paymentsResponse.data) ? paymentsResponse.data : [],
    pickups: Array.isArray(pickupsResponse.data) ? pickupsResponse.data : [],
    users: Array.isArray(usersResponse.data) ? usersResponse.data : [],
  };
}
