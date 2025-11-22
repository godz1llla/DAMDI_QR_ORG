import apiClient from './client';

export interface CreateStaffRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface Staff {
  id: number;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export const staffApi = {
  list: async (): Promise<{ success: boolean; staff: Staff[] }> => {
    const response = await apiClient.get('/staff');
    return response.data;
  },
  create: async (data: CreateStaffRequest): Promise<{ success: boolean; message: string; staff_id: number }> => {
    const response = await apiClient.post('/staff', data);
    return response.data;
  },
  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/staff/${id}`);
    return response.data;
  },
};

