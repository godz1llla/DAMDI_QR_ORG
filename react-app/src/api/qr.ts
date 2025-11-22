import apiClient from './client';

export interface QRPreviewResponse {
  success: boolean;
  qr_code: string;
  menu_url: string;
  table_number: string;
  restaurant_name: string;
}

export const qrApi = {
  preview: async (tableId: number): Promise<QRPreviewResponse> => {
    const response = await apiClient.get(`/qr/preview?table_id=${tableId}`);
    return response.data;
  },
  generate: (tableId: number): string => {
    return `${apiClient.defaults.baseURL}/qr/generate?table_id=${tableId}`;
  },
};

