import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DailyRecord } from '../types';

interface DashboardProps {
  records: DailyRecord[];
}

export const Dashboard: React.FC<DashboardProps> = ({ records }) => {
  // Prepare data for charts
  const chartData = records.slice(-7).map(r => ({
    date: new Date(r.date).toLocaleDateString('en-GB', { weekday: 'short' }),
    revenue: r.sales.totalRevenue,
    drinks: Object.values(r.sales.drinks).reduce((a, b) => a + b.qty, 0)
  }));

  const totalRevenue = records.reduce((acc, r) => acc + r.sales.totalRevenue, 0);
  
  // Fix: CourtBooking does not have 'hours', summing count of bookings instead.
  const totalBookings = records.reduce((acc, r) => {
     return acc + r.sales.courts.bookings.length;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Total Revenue</p>
          <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">BND {totalRevenue.toFixed(0)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Total Bookings</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totalBookings}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-64 transition-colors">
        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4">Weekly Revenue</h3>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
            <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
            <YAxis tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
            <Tooltip 
                formatter={(value) => [`BND ${value}`, 'Revenue']} 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="revenue" fill="#a855f7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

       {/* Drinks Trend */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-64 transition-colors">
        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4">Drink Sales Volume</h3>
        <ResponsiveContainer width="100%" height="80%">
          <LineChart data={chartData}>
             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
             <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
             <YAxis tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
             <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
             <Line type="monotone" dataKey="drinks" stroke="#4f46e5" strokeWidth={2} dot={{r: 4}} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};