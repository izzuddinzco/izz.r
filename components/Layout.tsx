import React from 'react';
import { ClipboardList, Beer, Menu, Moon, Sun } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: string;
  setTab: (tab: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentTab, setTab, isDarkMode, toggleDarkMode }) => {
  const navItems = [
    { id: 'sales', label: 'Sales', icon: <ClipboardList size={20} /> },
    { id: 'inventory', label: 'Stock', icon: <Beer size={20} /> },
    { id: 'reports', label: 'Reports', icon: <Menu size={20} /> },
  ];

  return (
    <div className={`min-h-screen flex flex-col max-w-screen-xl mx-auto shadow-2xl shadow-gray-200 dark:shadow-none transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className="bg-brand-600 text-white p-4 sticky top-0 z-50 shadow-md flex justify-between items-center">
        <div>
             <h1 className="text-xl font-bold tracking-tight">CourtCommand</h1>
             <p className="text-brand-100 text-xs">Daily Operations</p>
        </div>
        <button 
            onClick={toggleDarkMode}
            className="h-9 w-9 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        >
             {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 pb-24 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 w-full max-w-screen-xl border-t pb-safe transition-colors duration-200 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                currentTab === item.id
                  ? 'text-brand-500 border-t-2 border-brand-500'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};