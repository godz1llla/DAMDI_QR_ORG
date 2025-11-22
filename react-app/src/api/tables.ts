import apiClient from './client';
import { Table } from '../types';

export interface CreateTableRequest {
  table_number: string;
}

export interface TablesResponse {
  success: boolean;
  tables: Table[];
  limits?: {
    current: number;
    max: number;
    plan: string;
  };
}

export const tablesApi = {
  list: async (): Promise<TablesResponse> => {
    const response = await apiClient.get('/tables');
    return response.data;
  },
  create: async (data: CreateTableRequest): Promise<{ success: boolean; message: string; table_id: number }> => {
    const response = await apiClient.post('/tables', data);
    return response.data;
  },
  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/tables/${id}`);
    return response.data;
  },
};

