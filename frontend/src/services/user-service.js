// Import apiClient (Axios instance with baseURL and config)
import apiClient from './api-client';

/**
 * Register new user
 * Send POST request to backend to create a new account
 */
export async function registerUser(payload) {
    // payload contains user data (name, email, password, etc.)
    const response = await apiClient.post('/auth/register', payload);

    // return only the response data from backend
    return response.data;
}

/**
 * Login user
 * Send POST request to authenticate user
 */
export async function loginUser(payload) {
    const response = await apiClient.post('/auth/login', payload);
    return response.data;
}

/**
 * Get all categories
 * Send GET request to fetch category list
 */
export async function getCategories() {
    const response = await apiClient.get('/categories');
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

/**
 * Update user profile
 * userId - ID of the user to update
 * formData - form data including name, email, phone, avatar
 */
export async function updateUserProfile(userId, formData) {
    const response = await apiClient.post(`/users/${userId}?_method=PUT`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}

/**
 * Update organization profile
 * orgId - ID of organization
 * formData - form data including organization info and logo/avatar
 */
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
