import React from 'react';
import { Home, Bookmark, Clock, Settings } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'map' | 'saved' | 'history' | 'settings';
  onSelectTab: (tab: 'map' | 'saved' | 'history' | 'settings') => void;
  className?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  className = '',
}) => {
  const tabs = [
    { id: 'map' as const, label: 'Home', icon: Home },
    { id: 'saved' as const, label: 'Saved', icon: Bookmark },
    { id: 'history' as const, label: 'History', icon: Clock },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 bg-[#FFF8ED] border-t border-[#ded5c5] px-4 py-2 flex items-center justify-around select-none shadow-lg sm:hidden safe-bottom ${className}`}
      aria-label="Mobile Navigation Bar"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer active:scale-90 ${
              isActive ? 'text-[#174C3C]' : 'text-[#687a71] hover:text-[#14221d]'
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'
                }`}
              />
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#174C3C]" />
              )}
            </div>
            <span
              className={`text-[10px] tracking-tight ${
                isActive ? 'font-black text-[#174C3C]' : 'font-semibold'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
