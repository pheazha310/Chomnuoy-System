// Import apiClient (Axios instance with baseURL and config)
import apiClient from './api-client';

function normalizeResourceId(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    if (!/^\d+$/.test(String(value))) {
        return null;
    }
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
        return null;
    }
    return parsed;
}

function requireResourceId(value, resourceName) {
    const normalizedId = normalizeResourceId(value);
    if (!normalizedId) {
        throw new Error(`Invalid ${resourceName} id.`);
    }
    return normalizedId;
}

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

export async function loginWithGoogleCredential(credential) {
    const response = await apiClient.post('/auth/google/token', { credential });
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

export async function findUserByEmail(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) return null;

    try {
        const response = await apiClient.get('/users/by-email', { params: { email: normalizedEmail } });
        return response.data || null;
    } catch (error) {
        if (error.response?.status === 404) {
            return null;
        }
        throw error;
    }
}

export async function findOrganizationByEmail(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) return null;

    try {
        const response = await apiClient.get('/organizations/by-email', { params: { email: normalizedEmail } });
        return response.data || null;
    } catch (error) {
        if (error.response?.status === 404) {
            return null;
        }
        throw error;
    }
}

export async function changePassword(payload) {
    const response = await apiClient.post('/auth/change-password', payload);
    return response.data;
}

export async function deactivateAccount({ accountType, userId }) {
    const normalizedType = (accountType || '').toLowerCase();
    const resource = normalizedType === 'organization' ? 'organizations' : 'users';
    const normalizedId = requireResourceId(userId, normalizedType === 'organization' ? 'organization' : 'user');
    const response = await apiClient.delete(`/${resource}/${normalizedId}`);
    return response.data;
}

/**
 * Update user profile
 * userId - ID of the user to update
 * formData - form data including name, email, phone, avatar
 */
export async function updateUserProfile(userId, formData) {
    const normalizedId = requireResourceId(userId, 'user');
    const response = await apiClient.post(`/users/${normalizedId}?_method=PUT`, formData, {
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
    const normalizedId = requireResourceId(orgId, 'organization');
    const response = await apiClient.post(`/organizations/${normalizedId}?_method=PUT`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}

export async function getUserById(userId) {
    const normalizedId = requireResourceId(userId, 'user');
    const response = await apiClient.get(`/users/${normalizedId}`);
    return response.data;
}

export async function getMyUserProfile() {
    const response = await apiClient.get('/profile/me');
    return response.data;
}

export async function updateMyUserProfile(formData) {
    const response = await apiClient.post('/profile/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}

export async function getOrganizationById(orgId) {
    const normalizedId = requireResourceId(orgId, 'organization');
    const response = await apiClient.get(`/organizations/${normalizedId}`);
    return response.data;
}

export async function createBakongTransaction(payload) {
    return "";
}

export async function verifyBakongTransaction(tranId) {
    const response = await apiClient.post(`/verify-qr`, {
        "tranId": tranId
    });
    return response.data;
}

export async function checkPayment(payload) {
    const response = await apiClient.post(`/payment/check`, payload);
    return response.data;
}

export async function getPaymentStatus(payload) {
    const response = await apiClient.post(`/payment/status`, payload);
    return response.data;
}

export async function verifyQR(payload) {
    const response = await apiClient.post(`/payment/verify`, payload);
    return response.data;
}

export async function decodeQR(payload) {
    const response = await apiClient.post(`/payment/decode`, payload);
    return response.data;
}

export async function generateDeepLink(payload) {
    const response = await apiClient.post(`/payment/deep-link`, payload);
    return response.data;
}

export async function generateAbaQr(payload) {
  const response = await apiClient.post(`/payment/generate`, payload);
  return response.data;
}
