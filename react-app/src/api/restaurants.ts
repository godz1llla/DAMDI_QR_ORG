import apiClient from './client';
import { Restaurant } from '../types';

export interface CreateRestaurantRequest {
  restaurant_name: string;
  owner_email: string;
  owner_password: string;
  owner_first_name: string;
  owner_last_name: string;
  plan?: string;
  address?: string;
  phone?: string;
}

export const restaurantsApi = {
  list: async (): Promise<{ success: boolean; restaurants: Restaurant[] }> => {
    const response = await apiClient.get('/restaurants');
    return response.data;
  },
  create: async (data: CreateRestaurantRequest): Promise<{ success: boolean; message: string; restaurant_id: number }> => {
    const response = await apiClient.post('/restaurants', data);
    return response.data;
  },
  getMy: async (): Promise<{ success: boolean; restaurant: Restaurant }> => {
    const response = await apiClient.get('/restaurants/my');
    return response.data;
  },
  updateMy: async (data: { name?: string; address?: string; phone?: string; whatsapp_number?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put('/restaurants/my', data);
    return response.data;
  },
  getLimits: async (): Promise<{ success: boolean; limits: any }> => {
    const response = await apiClient.get('/restaurants/limits');
    return response.data;
  },
  getStats: async (): Promise<{ success: boolean; stats: any }> => {
    const response = await apiClient.get('/restaurants/stats');
    return response.data;
  },
  update: async (id: number, data: { is_active?: boolean; plan?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put(`/restaurants/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/restaurants/${id}`);
    return response.data;
  },
};

