import React, { useState } from 'react';
import { InventoryData } from '../types';
import { CheckCircle, XCircle, Plus, Trash2, DollarSign } from 'lucide-react';

interface InventoryFormProps {
  data: InventoryData;
  onChange: (data: InventoryData) => void;
  onAddDrink: (name: string) => void;
  onRemoveDrink: (name: string) => void;
}

export const InventoryForm: React.FC<InventoryFormProps> = ({ data, onChange, onAddDrink, onRemoveDrink }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const updateStock = (type: string, field: 'opening' | 'closing', val: number) => {
    const currentItem = data.items[type];
    const updatedItem = { ...currentItem, [field]: val };
    
    // Formula: Opening - Closing = Sold
    updatedItem.soldCalculated = Math.max(0, updatedItem.opening - updatedItem.closing);

    const newItems = { ...data.items, [type]: updatedItem };
    onChange({ ...data, items: newItems });
  };

  const toggleMaintenance = (field: keyof typeof data.maintenance) => {
    if (typeof data.maintenance[field] === 'boolean') {
       const newVal = !data.maintenance[field];
       onChange({ 
         ...data, 
         maintenance: { ...data.maintenance, [field]: newVal } 
       });
    }
  };

  const handleAddItem = () => {
    if (newItemName.trim()) {
      onAddDrink(newItemName.trim());
      setNewItemName('');
      setIsAdding(false);
    }
  };

  const expectedRevenue = Object.values(data.items).reduce((acc, item) => acc + (item.soldCalculated * 1), 0); // Assuming $1 per drink based on request
  const discrepancy = data.cashCollected - expectedRevenue;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors">
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
          <div>
             <h3 className="font-bold text-gray-800 dark:text-gray-100">Stock Take</h3>
             <p className="text-xs text-gray-500 dark:text-gray-400">Sold = Opening - Closing</p>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1"
          >
             <Plus size={14}/> Add Item
          </button>
        </div>
        
        {isAdding && (
           <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/50 flex gap-2">
              <input 
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Drink Name (e.g. Cola)"
                className="flex-1 border border-blue-200 dark:border-blue-700 dark:bg-gray-800 dark:text-white rounded px-2 py-1 text-sm"
              />
              <button onClick={handleAddItem} className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium">Save</button>
           </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-2 py-3 text-center w-20">Opening</th>
                <th className="px-2 py-3 text-center w-20">Closing</th>
                <th className="px-4 py-3 text-right">Sold</th>
                <th className="px-2 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {Object.keys(data.items).map((type) => {
                const item = data.items[type];
                return (
                  <tr key={type} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-200">{type}</td>
                    <td className="px-2 py-2">
                      <input 
                        type="number" 
                        className="w-full text-center border border-blue-200 dark:border-blue-800 rounded p-2 focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 font-medium dark:text-white"
                        value={item.opening === 0 ? '' : item.opening}
                        placeholder="0"
                        onChange={(e) => updateStock(type, 'opening', Number(e.target.value))}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input 
                        type="number" 
                        className="w-full text-center border border-red-200 dark:border-red-800 rounded p-2 focus:ring-1 focus:ring-red-500 outline-none bg-white dark:bg-gray-800 font-medium dark:text-white"
                        value={item.closing === 0 ? '' : item.closing}
                        placeholder="0"
                        onChange={(e) => updateStock(type, 'closing', Number(e.target.value))}
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-brand-600 dark:text-brand-400 text-lg">
                      {item.soldCalculated}
                    </td>
                    <td className="px-2 py-3 text-center">
                       <button 
                         onClick={() => { if(confirm(`Delete ${type}?`)) onRemoveDrink(type); }}
                         className="text-gray-300 hover:text-red-500 transition-colors"
                       >
                          <Trash2 size={14} />
                       </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cash Reconciliation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 space-y-4 transition-colors">
         <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
             <DollarSign size={18} className="text-emerald-600 dark:text-emerald-400"/> Cash Reconciliation
         </h3>
         <div className="grid grid-cols-2 gap-4 text-sm">
             <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                 <span className="text-gray-500 dark:text-gray-400 block mb-1">Expected Revenue</span>
                 <span className="text-xl font-bold text-gray-800 dark:text-gray-100">BND {expectedRevenue.toFixed(2)}</span>
                 <p className="text-xs text-gray-400 mt-1">(Based on Sold count)</p>
             </div>
             <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50">
                 <span className="text-blue-700 dark:text-blue-300 block mb-1">Cash Collected</span>
                 <div className="flex items-center gap-1">
                    <span className="text-blue-700 dark:text-blue-300 font-bold">BND</span>
                    <input 
                        type="number" 
                        className="w-full bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded px-2 py-1 font-bold text-blue-800 dark:text-blue-200 outline-none"
                        value={data.cashCollected === 0 ? '' : data.cashCollected}
                        placeholder="0.00"
                        onChange={(e) => onChange({ ...data, cashCollected: parseFloat(e.target.value) })}
                    />
                 </div>
             </div>
         </div>
         
         {data.cashCollected > 0 && (
             <div className={`p-3 rounded-lg border flex items-center justify-between ${discrepancy < 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}>
                 <span className={`font-bold ${discrepancy < 0 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                     {discrepancy < 0 ? 'SHORTAGE' : 'OK'}
                 </span>
                 <span className={`font-mono font-bold ${discrepancy < 0 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                     {discrepancy < 0 ? `- BND ${Math.abs(discrepancy).toFixed(2)}` : 'Matches'}
                 </span>
             </div>
         )}
         {discrepancy < 0 && (
            <p className="text-xs text-red-500 dark:text-red-400 text-center">
                This shortage amount (BND {Math.abs(discrepancy).toFixed(2)}) has been synced to Sales.
            </p>
         )}
      </div>

      {/* Maintenance Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 transition-colors">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Facility Status</h3>
        <div className="flex gap-4">
          <button 
            onClick={() => toggleMaintenance('courtsCleaned')}
            className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
              data.maintenance.courtsCleaned 
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' 
                : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            {data.maintenance.courtsCleaned ? <CheckCircle /> : <XCircle />}
            <span className="font-medium text-sm">Courts Cleaned</span>
          </button>

          <button 
            onClick={() => toggleMaintenance('vacuumed')}
            className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
              data.maintenance.vacuumed 
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' 
                : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            {data.maintenance.vacuumed ? <CheckCircle /> : <XCircle />}
            <span className="font-medium text-sm">Vacuumed</span>
          </button>
        </div>
      </div>
    </div>
  );
};