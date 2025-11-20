import { DailyRecord, CenterName } from '../types';
import { INITIAL_INVENTORY_DATA, STAFF_LIST } from '../constants';

const STORAGE_KEY = 'badminton_center_data_v2'; // Version 2 for BND and new structure
const STAFF_KEY = 'badminton_staff_list';

export const getRecords = (): DailyRecord[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveRecord = (record: DailyRecord) => {
  const records = getRecords();
  const index = records.findIndex(r => r.date === record.date && r.center === record.center);
  
  if (index >= 0) {
    records[index] = record;
  } else {
    records.push(record);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

export const getRecordByDateAndCenter = (date: string, center: CenterName): DailyRecord | undefined => {
  const records = getRecords();
  return records.find(r => r.date === date && r.center === center);
};

// Helper to get yesterday's closing stock to pre-fill today's opening
export const getPreviousClosingStock = (currentDate: string, center: CenterName) => {
  const records = getRecords();
  // Simple sort descending
  const previousRecords = records
    .filter(r => r.center === center && r.date < currentDate)
    .sort((a, b) => b.date.localeCompare(a.date));
  
  if (previousRecords.length > 0) {
    return previousRecords[0].inventory.items;
  }
  return INITIAL_INVENTORY_DATA.items;
};

// Staff Management
export const getStaffList = (): string[] => {
    const data = localStorage.getItem(STAFF_KEY);
    return data ? JSON.parse(data) : STAFF_LIST;
};

export const saveStaffList = (list: string[]) => {
    localStorage.setItem(STAFF_KEY, JSON.stringify(list));
};