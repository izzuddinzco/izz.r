
export enum CenterName {
  MZ = 'MZ Badminton',
  RN = 'Racket Nation'
}

export type DrinkType = string; 

export interface DrinkEntry {
  qty: number;
  price: number;
}

export interface CourtPreset {
  id: string;
  label: string;
  defaultPrice: number;
}

export interface CourtBooking {
  id: string;
  label: string;
  hours: number; // Quantity/Hours
  unitPrice: number;
  totalPrice: number;
}

export interface SalesData {
  staff: string; // Staff on duty
  drinks: Record<string, DrinkEntry>;
  courts: {
    presets: CourtPreset[]; // Configurable list of rates
    bookings: CourtBooking[]; // Actual sales linked to presets or custom
  };
  rentals: {
    shoes: number;
    total: number;
  };
  deductions: {
    discounts: number;
    drinkShortage: number; // Auto-calculated from inventory
    description: string;
  };
  totalRevenue: number;
}

export interface InventoryItem {
  opening: number; 
  closing: number;
  soldCalculated: number;
}

export interface InventoryData {
  items: Record<string, InventoryItem>;
  maintenance: {
    courtsCleaned: boolean;
    vacuumed: boolean;
    notes: string;
  };
  cashCollected: number; // New: For reconciliation
}

export interface DailyRecord {
  id: string;
  date: string;
  center: CenterName;
  sales: SalesData;
  inventory: InventoryData;
  synced: boolean;
}
