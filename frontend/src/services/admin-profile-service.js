import apiClient from '@/services/api-client.js';

const adminProfileRequests = new Map();
let adminProfileEndpointUnavailable =
  String(import.meta.env.VITE_ENABLE_ADMIN_PROFILE_ENDPOINT || '').toLowerCase() !== 'true';
const userRecordRequests = new Map();

async function resolveAdminUserId(userId, email) {
  const normalizedUserId = Number(userId);
  if (Number.isInteger(normalizedUserId) && normalizedUserId > 0) {
    return normalizedUserId;
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Admin profile is missing a valid user id.');
  }

  const response = await apiClient.get('/users/by-email', {
    params: { email: normalizedEmail },
  });

  const resolvedId = Number(response.data?.id);
  if (!Number.isInteger(resolvedId) || resolvedId <= 0) {
    throw new Error('Admin profile could not resolve a valid user id from email.');
  }

  return resolvedId;
}

async function getUserRecord(userId, email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedUserId = Number(userId);
  const cacheKey = normalizedUserId > 0 ? `id:${normalizedUserId}` : `email:${normalizedEmail}`;

  if (userRecordRequests.has(cacheKey)) {
    return userRecordRequests.get(cacheKey);
  }

  const request = (async () => {
    if (Number.isInteger(normalizedUserId) && normalizedUserId > 0) {
      try {
        const response = await apiClient.get(`/users/${normalizedUserId}`);
        return response.data;
      } catch (error) {
        if (error.response?.status !== 404) {
          throw error;
        }
      }
    }

    if (!normalizedEmail) {
      throw new Error('Admin profile was not found for the current session user.');
    }

    const response = await apiClient.get('/users/by-email', {
      params: { email: normalizedEmail },
    });
    return response.data;
  })().finally(() => {
    userRecordRequests.delete(cacheKey);
  });

  userRecordRequests.set(cacheKey, request);
  return request;
}

function buildFallbackAdminProfile(user) {
  const avatarPath = user?.avatar_path || '';
  const avatarUrl =
    user?.avatar_url ||
    (avatarPath ? `${apiClient.defaults.baseURL}/files/${String(avatarPath).replace(/^\/+/, '')}` : '');

  return {
    basic_information: {
      id: user?.id,
      name: user?.name || 'Admin',
      title: user?.title || 'System Administrator',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      location: user?.location || '',
      website: user?.website || '',
      linkedin_url: user?.linkedin_url || '',
      skills: Array.isArray(user?.skills) ? user.skills : [],
      profile_picture: avatarUrl,
      avatar_path: avatarPath,
      role: user?.role || user?.role_name || 'Admin',
      status: user?.status || 'active',
      created_at: user?.created_at || null,
      last_seen_at: user?.last_seen_at || null,
    },
    account_settings: {
      two_factor_enabled: Boolean(user?.two_factor_enabled),
    },
    role_permissions: {
      role: user?.role || user?.role_name || 'Admin',
      view_assigned_permissions: [],
      manage_roles: false,
      access_levels: ['read'],
    },
    activity_log: [],
    network_stats: {
      rank: 'Unavailable',
      connections_count: 0,
      project_reviews_count: 0,
    },
    platform_stats: {
      users_managed: 0,
      organizations_count: 0,
      total_donations: 0,
    },
    _fallback: true,
  };
}

export async function fetchAdminProfile(userId, email = '') {
  const normalizedUserId = await resolveAdminUserId(userId, email);

  if (adminProfileRequests.has(normalizedUserId)) {
    return adminProfileRequests.get(normalizedUserId);
  }

  const request = (async () => {
    if (!adminProfileEndpointUnavailable) {
      try {
        const response = await apiClient.get(`/admin/profile/${normalizedUserId}`);
        return response.data;
      } catch (error) {
        if (error.response?.status !== 404) {
          throw error;
        }
        adminProfileEndpointUnavailable = true;
      }
    }

    const user = await getUserRecord(normalizedUserId, email);
    return buildFallbackAdminProfile(user);
  })()
    .finally(() => {
      adminProfileRequests.delete(normalizedUserId);
    });

  adminProfileRequests.set(normalizedUserId, request);
  return request;
}

export async function updateAdminProfile(userId, payload) {
  const normalizedUserId = await resolveAdminUserId(userId, payload?.email);
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('title', payload.title || '');
  formData.append('email', payload.email);
  formData.append('phone', payload.phone || '');
  formData.append('bio', payload.bio || '');
  formData.append('location', payload.location || '');
  formData.append('website', payload.website || '');
  formData.append('linkedin_url', payload.linkedin_url || '');
  formData.append('skills', JSON.stringify(payload.skills || []));
  formData.append('two_factor_enabled', payload.twoFactorEnabled ? '1' : '0');

  if (payload.avatar) {
    formData.append('avatar', payload.avatar);
  }

  if (!adminProfileEndpointUnavailable) {
    try {
      const response = await apiClient.post(`/admin/profile/${normalizedUserId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      if (error.response?.status !== 404) {
        throw error;
      }
      adminProfileEndpointUnavailable = true;
    }
  }

  const fallbackFormData = new FormData();
  fallbackFormData.append('name', payload.name);
  fallbackFormData.append('email', payload.email);
  fallbackFormData.append('phone', payload.phone || '');
  if (payload.avatar) {
    fallbackFormData.append('avatar', payload.avatar);
  }

  await apiClient.post(`/users/${normalizedUserId}?_method=PUT`, fallbackFormData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const user = await getUserRecord(normalizedUserId, payload?.email);
  return {
    ...buildFallbackAdminProfile(user),
    basic_information: {
      ...buildFallbackAdminProfile(user).basic_information,
      title: payload.title || user?.title || 'System Administrator',
      bio: payload.bio || user?.bio || '',
      location: payload.location || user?.location || '',
      website: payload.website || user?.website || '',
      linkedin_url: payload.linkedin_url || user?.linkedin_url || '',
      skills: Array.isArray(payload.skills) ? payload.skills : (user?.skills || []),
    },
    account_settings: {
      two_factor_enabled: Boolean(payload.twoFactorEnabled),
    },
  };
}

export async function updateAdminPassword(userId, payload) {
  const normalizedUserId = await resolveAdminUserId(userId);
  const response = await apiClient.post(`/admin/profile/${normalizedUserId}/password`, {
    current_password: payload.currentPassword,
    new_password: payload.newPassword,
    new_password_confirmation: payload.confirmPassword,
  });

  return response.data;
}
