import React from 'react';
import { Map, Bookmark, History, Settings, X, MapPin } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'map' | 'saved' | 'history' | 'settings';
  onSelectTab: (tab: 'map' | 'saved' | 'history' | 'settings') => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  className = '',
}) => {
  if (!isOpen) return null;

  const navItems: { id: 'map' | 'saved' | 'history' | 'settings'; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'map', label: 'Navigation Map', icon: <Map className="w-5 h-5" />, desc: 'Live map & routing' },
    { id: 'saved', label: 'Saved Places', icon: <Bookmark className="w-5 h-5" />, desc: 'Bookmarks & home/work' },
    { id: 'history', label: 'Travel History', icon: <History className="w-5 h-5" />, desc: 'Past trips & alerts' },
    { id: 'settings', label: 'Settings & Alarm', icon: <Settings className="w-5 h-5" />, desc: 'Sound, volume & GPS' },
  ];

  return (
    <div className={`fixed inset-0 z-50 flex pointer-events-auto select-none ${className}`}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-over Drawer */}
      <div className="relative w-80 max-w-[85vw] h-full bg-[#FFF8ED] border-r border-[#ded5c5] shadow-2xl p-5 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-250">
        <div className="flex flex-col gap-6">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#ded5c5]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#174C3C] text-white flex items-center justify-center shadow-xs">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-base font-black text-[#14221d] leading-none">
                  NearMe <span className="text-[#c28b38]">Alarm</span>
                </div>
                <div className="text-[11px] text-[#687a71] font-medium mt-0.5">
                  Navigation & Proximity
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#f5ecdc] border border-[#ded5c5] flex items-center justify-center text-[#687a71] hover:text-[#14221d] hover:bg-[#ebdcc7] transition-all cursor-pointer"
              title="Close Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Options List */}
          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3.5 p-3 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#174C3C] text-white shadow-xs'
                      : 'hover:bg-[#f5ecdc] text-[#14221d]'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-white/15 text-white' : 'bg-[#f5ecdc] text-[#174C3C]'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold truncate leading-tight">
                      {item.label}
                    </div>
                    <div
                      className={`text-[11px] truncate mt-0.5 ${
                        isActive ? 'text-cream-200' : 'text-[#687a71]'
                      }`}
                    >
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-[#ded5c5] text-[11px] text-[#687a71] flex items-center justify-between">
          <span>Version 1.0.0</span>
          <span>© NearMe Transit</span>
        </div>
      </div>
    </div>
  );
};
