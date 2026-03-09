import apiClient from './api-client';

export async function registerUser(payload) {
  const response = await apiClient.post('/auth/register', payload);
  return response.data;
}

export async function loginUser(payload) {
  const response = await apiClient.post('/auth/login', payload);
  return response.data;
}

export async function changePassword(payload) {
  const response = await apiClient.post('/auth/change-password', payload);
  return response.data;
}

export async function deactivateAccount({ accountType, userId }) {
  const normalizedType = (accountType || '').toLowerCase();
  const resource = normalizedType === 'organization' ? 'organizations' : 'users';
  const response = await apiClient.delete(`/${resource}/${userId}`);
  return response.data;
}

export async function getCategories() {
  const response = await apiClient.get('/categories');
  return response.data;
}

export async function updateUserProfile(userId, formData) {
  const response = await apiClient.post(`/users/${userId}?_method=PUT`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function updateOrganizationProfile(orgId, formData) {
  const response = await apiClient.post(`/organizations/${orgId}?_method=PUT`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function getUserById(userId) {
  const response = await apiClient.get(`/users/${userId}`);
  return response.data;
}

export async function getOrganizationById(orgId) {
  const response = await apiClient.get(`/organizations/${orgId}`);
  return response.data;
}
