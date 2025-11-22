import { RestaurantPlan } from '../types';

export const TARIFF_LIMITS = {
  FREE: {
    tables: 5,
    categories: 5
  },
  PREMIUM: {
    tables: 999,
    categories: 999
  }
};

export function getTableLimit(plan: RestaurantPlan): number {
  return TARIFF_LIMITS[plan].tables;
}

export function getCategoryLimit(plan: RestaurantPlan): number {
  return TARIFF_LIMITS[plan].categories;
}

