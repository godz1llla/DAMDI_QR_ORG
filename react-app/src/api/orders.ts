import apiClient from './client';
import { Order, OrderStatus } from '../types';

export interface CreateOrderRequest {
  restaurant_id: number;
  table_id?: number;
  order_type?: 'DINE_IN' | 'DELIVERY';
  customer_phone?: string;
  delivery_address?: string;
  items: Array<{
    menu_item_id: number;
    quantity: number;
    notes?: string;
  }>;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export const ordersApi = {
  create: async (data: CreateOrderRequest): Promise<{ 
    success: boolean; 
    message: string; 
    order_id: number; 
    total_amount: number;
    whatsapp_number?: string | null;
    order_type?: string;
    items?: Array<{ name: string; quantity: number; price: number }>;
    customer_phone?: string | null;
    delivery_address?: string | null;
    table_number?: string | null;
  }> => {
    const response = await apiClient.post('/orders', data);
    return response.data;
  },
  list: async (): Promise<{ success: boolean; orders: Order[] }> => {
    const response = await apiClient.get('/orders');
    return response.data;
  },
  poll: async (lastId: number = 0): Promise<{ success: boolean; orders: Order[] }> => {
    const response = await apiClient.get(`/orders/poll?last_id=${lastId}`);
    return response.data;
  },
  updateStatus: async (id: number, data: UpdateOrderStatusRequest): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put(`/orders/${id}/status`, data);
    return response.data;
  },
  getStats: async (): Promise<{ success: boolean; stats: any }> => {
    const response = await apiClient.get('/orders/stats');
    return response.data;
  },
};

