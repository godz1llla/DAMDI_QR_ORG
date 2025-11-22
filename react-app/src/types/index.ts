export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
}

export enum RestaurantPlan {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
}

export enum OrderStatus {
  NEW = 'NEW',
  PREPARING = 'PREPARING',
  SERVED = 'SERVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface User {
  id: number;
  email: string;
  role: UserRole;
  restaurant_id: number | null;
  first_name: string;
  last_name: string;
}

export interface Restaurant {
  id: number;
  name: string;
  owner_id: number;
  plan: RestaurantPlan;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  is_active: boolean;
  limits?: {
    current_tables: number;
    max_tables: number;
    current_categories: number;
    max_categories: number;
    plan: RestaurantPlan;
  };
}

export interface MenuCategory {
  id: number;
  restaurant_id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: number;
  restaurant_id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: number;
  restaurant_id: number;
  table_number: string;
  qr_code_url: string | null;
  is_active: boolean;
  created_at: string;
  restaurant_name?: string;
}

export interface Order {
  id: number;
  restaurant_id: number;
  table_id: number;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
  table_number?: string;
  items_summary?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
  notes: string | null;
  created_at: string;
}

