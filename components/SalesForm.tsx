import React, { useState } from 'react';
import { SalesData, CourtBooking, CourtPreset } from '../types';
import { RENTAL_PRICES } from '../constants';
import { Plus, Minus, Settings, X, User } from 'lucide-react';

interface SalesFormProps {
  data: SalesData;
  onChange: (data: SalesData) => void;
  staffList: string[];
  onAddStaff: (name: string) => void;
  onRemoveStaff: (name: string) => void;
}

export const SalesForm: React.FC<SalesFormProps> = ({ data, onChange, staffList, onAddStaff, onRemoveStaff }) => {
  const [isEditingPresets, setIsEditingPresets] = useState(false);
  const [newPreset, setNewPreset] = useState<Partial<CourtPreset>>({ label: '', defaultPrice: 0 });
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [isManagingStaff, setIsManagingStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');

  const updateTotal = (tempData: SalesData) => {
    let drinkTotal = 0;
    Object.values(tempData.drinks).forEach(d => drinkTotal += (d.qty * d.price));

    let courtTotal = tempData.courts.bookings.reduce((acc, b) => acc + b.totalPrice, 0);
    let rentalTotal = tempData.rentals.total;
    
    const totalShortage = tempData.deductions.drinkShortage;
    const revenue = drinkTotal + courtTotal + rentalTotal - tempData.deductions.discounts - totalShortage;

    onChange({
      ...tempData,
      totalRevenue: revenue
    });
  };

  // --- Court Booking Logic (Hours Input) ---
  
  const getBookingForPreset = (presetLabel: string) => {
    return data.courts.bookings.find(b => b.label === presetLabel);
  };

  const updateCourtHours = (preset: CourtPreset, hours: number) => {
    let newBookings = [...data.courts.bookings];
    const existingIndex = newBookings.findIndex(b => b.label === preset.label);

    if (hours <= 0) {
      if (existingIndex >= 0) newBookings.splice(existingIndex, 1);
    } else {
      const totalPrice = preset.defaultPrice * hours;
      if (existingIndex >= 0) {
        newBookings[existingIndex] = {
          ...newBookings[existingIndex],
          hours: hours,
          totalPrice: totalPrice
        };
      } else {
        newBookings.push({
          id: Date.now().toString() + Math.random(),
          label: preset.label,
          unitPrice: preset.defaultPrice,
          hours: hours,
          totalPrice: totalPrice
        });
      }
    }
    updateTotal({ ...data, courts: { ...data.courts, bookings: newBookings } });
  };

  // --- Court Preset Management ---

  const addPreset = () => {
    if (!newPreset.label) return;
    const preset: CourtPreset = {
        id: Date.now().toString(),
        label: newPreset.label || 'New Rate',
        defaultPrice: newPreset.defaultPrice || 0
    };
    const newPresets = [...data.courts.presets, preset];
    updateTotal({ ...data, courts: { ...data.courts, presets: newPresets } });
    setNewPreset({ label: '', defaultPrice: 0 });
  };

  const removePreset = (id: string) => {
     const newPresets = data.courts.presets.filter(p => p.id !== id);
     updateTotal({ ...data, courts: { ...data.courts, presets: newPresets } });
  };
  
  const updatePreset = (id: string, field: keyof CourtPreset, value: any) => {
      const newPresets = data.courts.presets.map(p => p.id === id ? { ...p, [field]: value } : p);
      updateTotal({ ...data, courts: { ...data.courts, presets: newPresets } });
  };

  // --- Rental Logic ---

  const updateRental = (delta: number) => {
    const newVal = Math.max(0, data.rentals.shoes + delta);
    const newRentals = { ...data.rentals, shoes: newVal };
    newRentals.total = (newRentals.shoes * RENTAL_PRICES.SHOES);
    updateTotal({ ...data, rentals: newRentals });
  };

  const updateDeductions = (field: keyof typeof data.deductions, value: any) => {
    const newDeductions = { ...data.deductions, [field]: value };
    updateTotal({ ...data, deductions: newDeductions });
  };

  const handleStaffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (val === 'ADD_NEW') {
          setIsAddingStaff(true);
      } else {
          updateTotal({ ...data, staff: val });
      }
  };

  const saveNewStaff = () => {
      if (newStaffName.trim()) {
          onAddStaff(newStaffName.trim());
          // Only set as active staff if we are not in management mode
          if (!isManagingStaff) {
            updateTotal({ ...data, staff: newStaffName.trim() });
            setIsAddingStaff(false);
          }
          setNewStaffName('');
      } else {
          setIsAddingStaff(false);
      }
  };

  return (
    <div className="space-y-6">
      
      {/* Staff Picker */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex justify-between items-center mb-2">
               <div className="flex items-center gap-2">
                   <User className="text-brand-600 dark:text-brand-400" size={20} />
                   <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Staff on Duty</label>
               </div>
               <button 
                  onClick={() => setIsManagingStaff(!isManagingStaff)}
                  className={`text-xs px-2 py-1 rounded flex items-center gap-1 border ${isManagingStaff ? 'bg-gray-800 text-white dark:bg-gray-600' : 'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}
               >
                   <Settings size={12}/> {isManagingStaff ? 'Done' : 'Manage'}
               </button>
          </div>

          {isManagingStaff ? (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Add or remove staff names from the list.</p>
                  <div className="flex flex-wrap gap-2">
                      {staffList.map(s => (
                          <div key={s} className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full px-3 py-1 text-sm">
                              <span className="dark:text-gray-200">{s}</span>
                              <button onClick={() => onRemoveStaff(s)} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
                          </div>
                      ))}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-600 mt-2">
                       <input 
                        type="text"
                        placeholder="Add Name"
                        className="flex-1 border dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded px-2 py-1 text-sm"
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveNewStaff()}
                      />
                      <button onClick={saveNewStaff} className="bg-brand-600 text-white px-3 py-1 rounded text-sm"><Plus size={16}/></button>
                  </div>
              </div>
          ) : (
            <div className="flex-1">
              {isAddingStaff ? (
                  <div className="flex gap-2">
                      <input 
                        autoFocus
                        type="text"
                        placeholder="Enter Name"
                        className="flex-1 border-b border-brand-500 bg-transparent text-gray-800 dark:text-gray-200 outline-none py-1"
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveNewStaff()}
                      />
                      <button onClick={saveNewStaff} className="text-xs bg-brand-600 text-white px-2 rounded">Save</button>
                      <button onClick={() => setIsAddingStaff(false)} className="text-xs text-gray-500">Cancel</button>
                  </div>
              ) : (
                <select 
                    value={data.staff || ''}
                    onChange={handleStaffChange}
                    className="w-full border-b border-gray-300 dark:border-gray-600 bg-transparent focus:border-brand-600 dark:focus:border-brand-400 outline-none py-1 text-gray-800 dark:text-gray-200 font-medium cursor-pointer"
                >
                    <option value="" disabled>Select Staff...</option>
                    {staffList.map(s => <option key={s} value={s} className="dark:bg-gray-800">{s}</option>)}
                    <option value="ADD_NEW" className="font-bold text-brand-600 dark:text-brand-400">+ Add New Staff</option>
                </select>
              )}
            </div>
          )}
      </div>

      {/* Drinks Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
          <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 p-1 rounded">🥤</span> Drink Sales
        </h3>
        <div className="space-y-3">
          {Object.keys(data.drinks).map((type) => {
            const item = data.drinks[type];
            return (
              <div key={type} className="flex items-center justify-between border-b border-gray-50 dark:border-gray-700 pb-3 last:border-0">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{type}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">BND 1.00</p>
                </div>
                <div className="text-right">
                   <p className="text-xs text-gray-400 uppercase">Sold</p>
                   <p className="font-bold text-lg dark:text-white">{item.qty}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-right">
          <span className="font-bold text-brand-600 dark:text-brand-400">
            Revenue: BND {Object.values(data.drinks).reduce((acc, curr) => acc + (curr.qty * curr.price), 0).toFixed(2)}
          </span>
        </div>
      </section>

      {/* Courts Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 p-1 rounded">🏸</span> Court Bookings
            </h3>
            <button 
                onClick={() => setIsEditingPresets(!isEditingPresets)}
                className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 border ${isEditingPresets ? 'bg-gray-800 text-white border-gray-800 dark:bg-gray-600 dark:border-gray-500' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}
            >
                <Settings size={14}/> {isEditingPresets ? 'Done' : 'Manage Rates'}
            </button>
        </div>

        {/* Presets List with Hours Input */}
        <div className="space-y-3">
             {isEditingPresets ? (
                 <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 space-y-2">
                     <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Edit Booking Types</p>
                     {data.courts.presets.map(p => (
                         <div key={p.id} className="flex items-center gap-2">
                             <input 
                                type="text" 
                                value={p.label} 
                                onChange={(e) => updatePreset(p.id, 'label', e.target.value)}
                                className="flex-1 border dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded px-2 py-1 text-sm"
                             />
                             <span className="text-sm text-gray-500">$</span>
                             <input 
                                type="number" 
                                value={p.defaultPrice}
                                onChange={(e) => updatePreset(p.id, 'defaultPrice', parseFloat(e.target.value))}
                                className="w-16 border dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded px-2 py-1 text-sm"
                             />
                             <button onClick={() => removePreset(p.id)} className="text-red-400"><X size={16}/></button>
                         </div>
                     ))}
                     <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <input 
                            placeholder="New Rate (e.g. 1 AM-3 AM)" 
                            className="flex-1 border dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded px-2 py-1 text-sm"
                            value={newPreset.label}
                            onChange={(e) => setNewPreset({...newPreset, label: e.target.value})}
                          />
                          <input 
                            placeholder="$" 
                            type="number"
                            className="w-16 border dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded px-2 py-1 text-sm"
                            value={newPreset.defaultPrice || ''}
                            onChange={(e) => setNewPreset({...newPreset, defaultPrice: parseFloat(e.target.value)})}
                          />
                          <button onClick={addPreset} className="bg-emerald-600 text-white p-1 rounded"><Plus size={16}/></button>
                     </div>
                 </div>
             ) : (
                 <div className="space-y-2">
                     <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-400 uppercase px-2">
                        <div className="col-span-6">Type</div>
                        <div className="col-span-3 text-center">Hours/Qty</div>
                        <div className="col-span-3 text-right">Total</div>
                     </div>
                     {data.courts.presets.map(p => {
                         const activeBooking = getBookingForPreset(p.label);
                         const hours = activeBooking ? activeBooking.hours : '';
                         const total = activeBooking ? activeBooking.totalPrice : 0;

                         return (
                            <div key={p.id} className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-gray-700 p-2 rounded border border-gray-100 dark:border-gray-600">
                                <div className="col-span-6">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{p.label}</p>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">${p.defaultPrice.toFixed(2)} /hr</p>
                                </div>
                                <div className="col-span-3">
                                    <input 
                                        type="number" 
                                        placeholder="0"
                                        className={`w-full text-center p-1.5 rounded border outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${activeBooking ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 font-bold text-emerald-800 dark:text-emerald-300' : 'bg-gray-50 border-gray-200'}`}
                                        value={hours}
                                        onChange={(e) => updateCourtHours(p, parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="col-span-3 text-right">
                                    <span className={`font-bold ${total > 0 ? 'text-gray-800 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>
                                        {total.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                         );
                     })}
                 </div>
             )}
        </div>

        <div className="mt-4 text-right border-t border-gray-100 dark:border-gray-700 pt-2">
             <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Court Revenue:</span>
             <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                 BND {data.courts.bookings.reduce((a, b) => a + b.totalPrice, 0).toFixed(2)}
             </span>
        </div>
      </section>

      {/* Rental & Deductions */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Rentals & Adjustments</h3>
        
        {/* Shoe Rental - One Line */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 mb-4">
             <div className="flex items-center gap-2">
                 <span className="font-medium text-gray-700 dark:text-gray-300">Shoe Rental ({RENTAL_PRICES.SHOES} BND)</span>
             </div>
             <div className="flex items-center gap-4">
                 <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <button onClick={() => updateRental(-1)} className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-l-lg"><Minus size={14}/></button>
                    <span className="w-8 text-center font-bold text-sm dark:text-white">{data.rentals.shoes}</span>
                    <button onClick={() => updateRental(1)} className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-r-lg"><Plus size={14}/></button>
                 </div>
                 <span className="font-bold min-w-[60px] text-right dark:text-white">BND {data.rentals.total.toFixed(2)}</span>
             </div>
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800/50">
             <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-red-700 dark:text-red-400 uppercase">Discounts</label>
             </div>
             <div className="flex gap-2">
                 <div className="w-1/3">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">Amount (BND)</span>
                    <input 
                        type="number"
                        placeholder="0"
                        value={data.deductions.discounts || ''}
                        onChange={(e) => updateDeductions('discounts', Number(e.target.value))}
                        className="w-full border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 rounded p-2 focus:outline-none focus:border-red-400 text-right font-semibold text-red-600 dark:text-red-400 dark:placeholder-gray-600"
                    />
                 </div>
                 <div className="w-2/3">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">Remarks</span>
                    <input 
                        type="text"
                        value={data.deductions.description}
                        onChange={(e) => updateDeductions('description', e.target.value)}
                        className="w-full border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 rounded p-2 text-sm focus:outline-none focus:border-red-400 dark:text-white"
                        placeholder="Reason for discount..."
                    />
                 </div>
             </div>
          </div>
          
          <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4 space-y-3">
             <div className="flex items-center justify-between">
                <div className="flex flex-col">
                     <label className="text-sm font-semibold text-orange-600 dark:text-orange-400">Drink Shortage</label>
                     <span className="text-[10px] text-gray-400 dark:text-gray-500">Auto-synced from Stock</span>
                </div>
                <div className="font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded border border-orange-100 dark:border-orange-800/50">
                    {data.deductions.drinkShortage.toFixed(2)}
                </div>
             </div>
             
             {data.deductions.drinkShortage > 0 && (
                 <div className="flex justify-between text-sm pt-2 text-red-600 dark:text-red-400 font-bold">
                     <span>Total Deduction</span>
                     <span>- BND {data.deductions.drinkShortage.toFixed(2)}</span>
                 </div>
             )}
          </div>
        </div>
      </section>

      <div className="sticky bottom-20 bg-gray-900 dark:bg-black text-white p-4 rounded-xl shadow-lg flex justify-between items-center border border-gray-800">
        <span className="text-gray-300">Net Total</span>
        <span className="text-2xl font-bold">BND {data.totalRevenue.toFixed(2)}</span>
      </div>
    </div>
  );
};