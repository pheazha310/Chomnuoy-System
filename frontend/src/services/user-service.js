import apiClient from './api-client';

// Register 
export async function  registerUser(payload) {
    const response = await apiClient.post('/auth/register', payload);
    return response.data;
}

// Login user
export async function loginUser(payload) {
    const response = await apiClient.post('/auth/login', payload);
    return response.data;
}

// Categories 
export async function getCategories() {
    const response = await apiClient.get('/categories');
    return response.data;
}
