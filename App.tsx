import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { SalesForm } from './components/SalesForm';
import { InventoryForm } from './components/InventoryForm';
import { ReportView } from './components/ReportView';
import { DailyRecord, CenterName, SalesData, InventoryData, CourtBooking } from './types';
import { INITIAL_SALES_DATA, INITIAL_INVENTORY_DATA, DEFAULT_DRINK_PRICE } from './constants';
import { getRecordByDateAndCenter, saveRecord, getRecords, getPreviousClosingStock, getStaffList, saveStaffList } from './services/storageService';

export default function App() {
  const [activeTab, setActiveTab] = useState('sales');
  const [selectedCenter, setSelectedCenter] = useState<CenterName>(CenterName.MZ);
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [staffList, setStaffList] = useState<string[]>([]);
  
  // Main data state
  const [currentRecord, setCurrentRecord] = useState<DailyRecord | null>(null);
  const [allRecords, setAllRecords] = useState<DailyRecord[]>([]);

  // Initialize theme and staff
  useEffect(() => {
      // Load theme
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          setIsDarkMode(true);
          document.documentElement.classList.add('dark');
      } else {
          setIsDarkMode(false);
          document.documentElement.classList.remove('dark');
      }

      // Load staff
      setStaffList(getStaffList());
  }, []);

  const toggleDarkMode = () => {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      if (newMode) {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  };

  const handleAddStaff = (name: string) => {
      if (!staffList.includes(name)) {
          const newList = [...staffList, name];
          setStaffList(newList);
          saveStaffList(newList);
      }
  };

  const handleRemoveStaff = (name: string) => {
      const newList = staffList.filter(s => s !== name);
      setStaffList(newList);
      saveStaffList(newList);
  };

  // Initialize data on load or when date/center changes
  useEffect(() => {
    const loadData = () => {
      const saved = getRecordByDateAndCenter(currentDate, selectedCenter);
      const all = getRecords();
      setAllRecords(all);

      if (saved) {
        // Ensure older records adhere to new types if loaded (migration safe-guard)
        if (typeof saved.sales.deductions.drinkShortage === 'undefined') {
            saved.sales.deductions.drinkShortage = 0;
        }
        // Remove manual shortage if it exists from old data structure access
        if ((saved.sales.deductions as any).manualShortage) {
             delete (saved.sales.deductions as any).manualShortage;
        }
        if (typeof saved.inventory.cashCollected === 'undefined') {
            saved.inventory.cashCollected = 0;
        }
        if (typeof saved.sales.staff === 'undefined') {
            saved.sales.staff = '';
        }
        setCurrentRecord(saved);
      } else {
        // Create new record template
        const prevClosing = getPreviousClosingStock(currentDate, selectedCenter);
        
        // Find the most recent record for this center to copy custom Court Presets and staff preference
        const lastRecord = all
          .filter(r => r.center === selectedCenter)
          .sort((a, b) => b.date.localeCompare(a.date))[0];

        // Merge previous closing into new opening
        const newInventory = JSON.parse(JSON.stringify(INITIAL_INVENTORY_DATA));
        Object.keys(prevClosing).forEach(key => {
           if (!newInventory.items[key]) {
               newInventory.items[key] = { opening: 0, closing: 0, soldCalculated: 0 };
           }
           // Pre-fill 'opening' with yesterday's 'closing'
           newInventory.items[key].opening = prevClosing[key].closing;
        });

        // Ensure Sales Data matches Inventory Keys
        const newSales = JSON.parse(JSON.stringify(INITIAL_SALES_DATA));
        Object.keys(newInventory.items).forEach(key => {
            if (!newSales.drinks[key]) {
                newSales.drinks[key] = { qty: 0, price: DEFAULT_DRINK_PRICE };
            }
        });

        // Restore Custom Court Presets if available
        if (lastRecord && lastRecord.sales.courts.presets) {
           newSales.courts.presets = lastRecord.sales.courts.presets;
        }
        
        // Restore staff from last record if relevant, or blank
        if (lastRecord && lastRecord.sales.staff) {
             // newSales.staff = lastRecord.sales.staff; // Optional: could auto-select previous staff
        }

        const newRecord: DailyRecord = {
          id: `${currentDate}-${selectedCenter}`,
          date: currentDate,
          center: selectedCenter,
          sales: newSales,
          inventory: newInventory,
          synced: false
        };
        setCurrentRecord(newRecord);
      }
    };
    loadData();
  }, [currentDate, selectedCenter]);

  // Save handler
  const handleSave = (updatedRecord: DailyRecord) => {
    setCurrentRecord(updatedRecord);
    saveRecord(updatedRecord);
    setAllRecords(getRecords());
  };

  const updateSales = (sales: SalesData) => {
    if (currentRecord) {
      handleSave({ ...currentRecord, sales });
    }
  };

  // When inventory updates, we must automatically update the Sales quantities AND shortage
  const updateInventory = (inventory: InventoryData) => {
    if (currentRecord) {
      const updatedSales = { ...currentRecord.sales };
      let drinksRevenue = 0;

      // 1. Sync quantities & Calculate Expected Drink Revenue
      Object.keys(inventory.items).forEach(key => {
        const soldQty = inventory.items[key].soldCalculated;
        
        // Ensure sales record exists for this drink
        if (!updatedSales.drinks[key]) {
            updatedSales.drinks[key] = { qty: 0, price: DEFAULT_DRINK_PRICE };
        }

        updatedSales.drinks[key].qty = soldQty;
        // Using the price in sales to calculate total expected revenue for sales report
        drinksRevenue += (soldQty * updatedSales.drinks[key].price);
      });

      // 2. Calculate Drink Shortage
      // Expected = drinksRevenue
      // Actual = inventory.cashCollected
      // If Cash < Expected, Diff is Shortage.
      let drinkShortage = 0;
      if (inventory.cashCollected > 0 && inventory.cashCollected < drinksRevenue) {
          drinkShortage = drinksRevenue - inventory.cashCollected;
      }
      updatedSales.deductions.drinkShortage = drinkShortage;

      // 3. Recalculate total revenue
      const courtTotal = updatedSales.courts.bookings.reduce((acc: number, b: CourtBooking) => acc + b.totalPrice, 0);
      const rentalTotal = updatedSales.rentals.total;
      
      const totalDeductions = updatedSales.deductions.discounts + updatedSales.deductions.drinkShortage;
      
      updatedSales.totalRevenue = drinksRevenue + courtTotal + rentalTotal - totalDeductions;

      handleSave({ ...currentRecord, inventory, sales: updatedSales });
    }
  };

  const handleAddDrink = (name: string) => {
    if (currentRecord && !currentRecord.inventory.items[name]) {
        const newInv = { ...currentRecord.inventory };
        newInv.items[name] = { opening: 0, closing: 0, soldCalculated: 0 };
        
        // Trigger update (which will sync to sales)
        updateInventory(newInv);
    }
  };

  const handleRemoveDrink = (name: string) => {
    if (currentRecord) {
        const newInv = { ...currentRecord.inventory };
        delete newInv.items[name];
        
        const newSales = { ...currentRecord.sales };
        delete newSales.drinks[name];

        updateInventory(newInv);
    }
  };

  if (!currentRecord) return <div className="flex justify-center items-center h-screen dark:bg-gray-900 dark:text-white">Loading...</div>;

  return (
    <Layout 
        currentTab={activeTab} 
        setTab={setActiveTab} 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode}
    >
      
      {/* Global Controls (Center & Date) */}
      <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center transition-colors">
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg w-full sm:w-auto">
          <button 
            onClick={() => setSelectedCenter(CenterName.MZ)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${selectedCenter === CenterName.MZ ? 'bg-white dark:bg-gray-600 text-brand-600 dark:text-brand-300 shadow' : 'text-gray-500 dark:text-gray-400'}`}
          >
            MZ Badminton
          </button>
          <button 
            onClick={() => setSelectedCenter(CenterName.RN)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${selectedCenter === CenterName.RN ? 'bg-white dark:bg-gray-600 text-brand-600 dark:text-brand-300 shadow' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Racket Nation
          </button>
        </div>
        <input 
          type="date" 
          value={currentDate}
          onChange={(e) => setCurrentDate(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 rounded-lg px-4 py-2 text-sm w-full sm:w-auto outline-none focus:ring-2 focus:ring-brand-500 text-gray-700 dark:text-gray-200"
        />
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        
        {activeTab === 'sales' && (
          <SalesForm 
            data={currentRecord.sales} 
            onChange={updateSales} 
            staffList={staffList}
            onAddStaff={handleAddStaff}
            onRemoveStaff={handleRemoveStaff}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryForm 
            data={currentRecord.inventory} 
            onChange={updateInventory}
            onAddDrink={handleAddDrink}
            onRemoveDrink={handleRemoveDrink}
          />
        )}

        {activeTab === 'reports' && (
          <ReportView record={currentRecord} />
        )}
      </div>
    </Layout>
  );
}