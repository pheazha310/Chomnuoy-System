import apiClient from './api-client';

export async function  registerUser(payload) {
    const response = await apiClient.post('/auth/register', payload);
    return response.data;
}