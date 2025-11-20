import React, { useState } from 'react';
import { DailyRecord } from '../types';
import { generateDailyInsight } from '../services/geminiService';
import { Share2, Wand2, Calendar } from 'lucide-react';
import { getRecords } from '../services/storageService';

interface ReportViewProps {
  record: DailyRecord;
}

export const ReportView: React.FC<ReportViewProps> = ({ record }) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [reportMode, setReportMode] = useState<'daily' | 'monthly'>('daily');

  const getWhatsAppText = () => {
    const dateStr = new Date(record.date).toLocaleDateString('en-GB');
    
    let text = `*DAILY REPORT - ${record.center.toUpperCase()}*\n`;
    text += `📅 Date: ${dateStr}\n`;
    if (record.sales.staff) {
        text += `👤 Staff: ${record.sales.staff}\n`;
    }
    text += `\n`;
    
    text += `*SALES SUMMARY*\n`;
    
    const bookings = record.sales.courts.bookings;

    if (bookings.length > 0) {
        text += `🏸 *Courts:*\n`;
        bookings.forEach(b => {
            text += `   - ${b.label}: ${b.hours} hrs (BND ${b.totalPrice.toFixed(2)})\n`;
        });
    } else {
        text += `🏸 Courts: BND 0.00\n`;
    }

    if (record.sales.rentals.total > 0) {
        text += `👟 Rentals (Shoes): BND ${record.sales.rentals.total.toFixed(2)} (${record.sales.rentals.shoes} pairs)\n`;
    }
    
    const drinkTotal = Object.values(record.sales.drinks).reduce((acc, d) => acc + (d.qty * d.price), 0);
    text += `🥤 Drinks: BND ${drinkTotal.toFixed(2)}\n`;
    
    const totalShortage = record.sales.deductions.drinkShortage;

    if (record.sales.deductions.discounts > 0 || totalShortage > 0) {
        text += `\n*DEDUCTIONS*\n`;
        if(record.sales.deductions.discounts > 0) {
            text += `🔻 Discount: -BND ${record.sales.deductions.discounts}`;
            if (record.sales.deductions.description) text += ` (${record.sales.deductions.description})`;
            text += `\n`;
        }
        if(totalShortage > 0) {
             text += `⚠️ Drink Shortage: -BND ${totalShortage.toFixed(2)}\n`;
        }
    }

    text += `\n*💰 NET TOTAL: BND ${record.sales.totalRevenue.toFixed(2)}*\n`;
    text += `------------------\n`;
    
    // Facility: Only show if something is ticked
    const isCleaned = record.inventory.maintenance.courtsCleaned;
    const isVacuumed = record.inventory.maintenance.vacuumed;

    if (isCleaned || isVacuumed) {
        text += `*FACILITY*\n`;
        if (isCleaned) text += `✅ Courts Cleaned\n`;
        if (isVacuumed) text += `✅ Vacuumed\n`;
    }

    if (insight) {
        text += `\n*AI INSIGHT*\n${insight}`;
    }

    return text;
  };

  const getMonthlyText = () => {
    const all = getRecords();
    const currentMonth = new Date(record.date).getMonth();
    const currentYear = new Date(record.date).getFullYear();
    
    // Filter for current selected month and center
    const monthlyRecords = all.filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === currentMonth && 
               d.getFullYear() === currentYear && 
               r.center === record.center;
    });

    if (monthlyRecords.length === 0) return "No records found for this month.";

    const monthName = new Date(record.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    
    let totalRev = 0;
    let totalCourts = 0;
    let totalDrinks = 0;
    let totalRentals = 0;
    
    monthlyRecords.forEach(r => {
        totalRev += r.sales.totalRevenue;
        totalCourts += r.sales.courts.bookings.reduce((a,b) => a + b.totalPrice, 0);
        const dTotal = Object.values(r.sales.drinks).reduce((a,b) => a + (b.qty * b.price), 0);
        totalDrinks += dTotal;
        totalRentals += r.sales.rentals.total;
    });

    let text = `*MONTHLY REPORT - ${record.center.toUpperCase()}*\n`;
    text += `📅 ${monthName}\n`;
    text += `📊 Total Operating Days: ${monthlyRecords.length}\n\n`;

    text += `*REVENUE BREAKDOWN*\n`;
    text += `🏸 Courts: BND ${totalCourts.toFixed(2)}\n`;
    text += `🥤 Drinks: BND ${totalDrinks.toFixed(2)}\n`;
    text += `👟 Rentals: BND ${totalRentals.toFixed(2)}\n`;
    
    text += `\n*💰 TOTAL REVENUE: BND ${totalRev.toFixed(2)}*\n`;
    
    return text;
  };

  const currentText = reportMode === 'daily' ? getWhatsAppText() : getMonthlyText();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
    alert('Report copied to clipboard!');
  };

  const handleGenerateInsight = async () => {
    setLoading(true);
    const text = await generateDailyInsight(record);
    setInsight(text);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg transition-colors">
          <button 
            onClick={() => setReportMode('daily')}
            className={`flex-1 py-2 text-sm font-medium rounded transition-all ${reportMode === 'daily' ? 'bg-white dark:bg-gray-600 shadow text-brand-600 dark:text-brand-300' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Daily Report
          </button>
          <button 
            onClick={() => setReportMode('monthly')}
            className={`flex-1 py-2 text-sm font-medium rounded flex items-center justify-center gap-1 transition-all ${reportMode === 'monthly' ? 'bg-white dark:bg-gray-600 shadow text-brand-600 dark:text-brand-300' : 'text-gray-500 dark:text-gray-400'}`}
          >
             <Calendar size={14}/> Monthly Summary
          </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {reportMode === 'daily' && (
            <button 
            onClick={handleGenerateInsight}
            disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white py-3 px-4 rounded-xl font-semibold shadow-sm flex justify-center items-center gap-2 disabled:opacity-50 transition-colors"
            >
            <Wand2 size={18} />
            {loading ? 'Thinking...' : 'AI Analysis'}
            </button>
        )}
        <button 
          onClick={handleCopy}
          className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white py-3 px-4 rounded-xl font-semibold shadow-sm flex justify-center items-center gap-2 transition-colors"
        >
          <Share2 size={18} />
          Copy Report
        </button>
      </div>

      {/* Preview Card */}
      <div className="bg-white dark:bg-gray-800 dark:text-gray-200 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 font-mono text-sm whitespace-pre-wrap transition-colors">
        {currentText}
      </div>
    </div>
  );
};