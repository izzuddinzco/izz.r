import { CenterName } from './types';

export const DEFAULT_DRINKS = [
  'Mineral Water',
  '100 Plus',
  '100 Plus Lime',
  'Milo'
];

export const STAFF_LIST = [
  'Staff',
  'Owner',
  'Manager',
  'Cleaner'
];

export const DEFAULT_DRINK_PRICE = 1.00;

export const RENTAL_PRICES = {
  SHOES: 3,
};

export const INITIAL_COURT_PRESETS = [
  { id: 'p1', label: 'Court 8 AM-5 PM', defaultPrice: 7.00 },
  { id: 'p2', label: 'Court 5 PM-10 PM', defaultPrice: 12.00 },
  { id: 'p3', label: 'Court 10 PM-12 AM', defaultPrice: 9.00 },
  { id: 'p4', label: 'Weekend', defaultPrice: 7.00 },
  { id: 'p5', label: 'Court (Staff)', defaultPrice: 10.00 },
];

export const INITIAL_SALES_DATA = {
  staff: '',
  drinks: {
    'Mineral Water': { qty: 0, price: DEFAULT_DRINK_PRICE },
    '100 Plus': { qty: 0, price: DEFAULT_DRINK_PRICE },
    '100 Plus Lime': { qty: 0, price: DEFAULT_DRINK_PRICE },
    'Milo': { qty: 0, price: DEFAULT_DRINK_PRICE },
  },
  courts: {
    presets: INITIAL_COURT_PRESETS,
    bookings: []
  },
  rentals: { shoes: 0, total: 0 },
  deductions: { discounts: 0, drinkShortage: 0, description: '' },
  totalRevenue: 0,
};

export const INITIAL_INVENTORY_DATA = {
  items: {
    'Mineral Water': { opening: 0, closing: 0, soldCalculated: 0 },
    '100 Plus': { opening: 0, closing: 0, soldCalculated: 0 },
    '100 Plus Lime': { opening: 0, closing: 0, soldCalculated: 0 },
    'Milo': { opening: 0, closing: 0, soldCalculated: 0 },
  },
  maintenance: { courtsCleaned: false, vacuumed: false, notes: '' },
  cashCollected: 0,
};