export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

export enum RestaurantPlan {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM'
}

export enum OrderStatus {
  NEW = 'NEW',
  PREPARING = 'PREPARING',
  SERVED = 'SERVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: UserRole;
  restaurant_id: number | null;
  first_name: string;
  last_name: string;
  is_blocked: boolean;
  created_at: Date;
  updated_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

export interface MenuCategory {
  id: number;
  restaurant_id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

export interface Table {
  id: number;
  restaurant_id: number;
  table_number: string;
  qr_code_url: string | null;
  is_active: boolean;
  created_at: Date;
}

export interface Order {
  id: number;
  restaurant_id: number;
  table_id: number;
  status: OrderStatus;
  total_amount: number;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
  notes: string | null;
  created_at: Date;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
  restaurantId: number | null;
}

