import apiClient from './client';
import { MenuCategory, MenuItem } from '../types';

export interface CreateCategoryRequest {
  name: string;
}

export interface CreateItemRequest {
  category_id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available?: boolean;
}

export interface UpdateItemRequest {
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  is_available?: boolean;
  category_id?: number;
}

export interface MenuResponse {
  success: boolean;
  menu: Array<{ category: MenuCategory; items: MenuItem[] }>;
  limits?: {
    current_categories: number;
    max_categories: number;
    plan: string;
  };
}

export const menuApi = {
  get: async (restaurantId: number): Promise<MenuResponse> => {
    const response = await apiClient.get(`/menu?restaurant_id=${restaurantId}`);
    return response.data;
  },
  createCategory: async (data: CreateCategoryRequest): Promise<{ success: boolean; message: string; category_id: number }> => {
    const response = await apiClient.post('/menu/categories', data);
    return response.data;
  },
  deleteCategory: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/menu/categories/${id}`);
    return response.data;
  },
  createItem: async (data: CreateItemRequest): Promise<{ success: boolean; message: string; item_id: number }> => {
    const response = await apiClient.post('/menu/items', data);
    return response.data;
  },
  updateItem: async (id: number, data: UpdateItemRequest): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put(`/menu/items/${id}`, data);
    return response.data;
  },
  deleteItem: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/menu/items/${id}`);
    return response.data;
  },
};

