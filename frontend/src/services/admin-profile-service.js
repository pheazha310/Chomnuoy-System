import apiClient from '@/services/api-client.js';

export async function fetchAdminProfile(userId) {
  const response = await apiClient.get(`/admin/profile/${userId}`);
  return response.data;
}

export async function updateAdminProfile(userId, payload) {
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

  const response = await apiClient.post(`/admin/profile/${userId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export async function updateAdminPassword(userId, payload) {
  const response = await apiClient.post(`/admin/profile/${userId}/password`, {
    current_password: payload.currentPassword,
    new_password: payload.newPassword,
    new_password_confirmation: payload.confirmPassword,
  });

  return response.data;
}
