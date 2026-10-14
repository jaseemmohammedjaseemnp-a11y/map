import React from 'react';
import type { Destination } from '../../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDestination: (dest: Destination) => void;
}

const PAST_JOURNEYS = [
  { name: 'Pattambi Railway Station', date: 'Yesterday, 6:45 PM', dist: '100 km', time: '2h 18m', lat: 10.8055, lng: 76.1989 },
  { name: 'Kozhikode Beach Point', date: 'Oct 10, 2:15 PM', dist: '48 km', time: '1h 10m', lat: 11.2588, lng: 75.7804 },
  { name: 'Wayanad Hill Pass', date: 'Oct 8, 9:30 AM', dist: '85 km', time: '2h 45m', lat: 11.6854, lng: 76.1320 },
];

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectDestination,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/85 backdrop-blur-md safe-top safe-bottom select-none">
      <div className="w-full max-w-md max-h-[85vh] rounded-3xl glass-card-main p-6 shadow-2xl border border-emerald-500/30 text-cream-50 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-forest-800">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🕒</span>
            <div>
              <h2 className="text-base font-bold text-cream-50">Journey History</h2>
              <p className="text-[11px] text-cream-400">Past completed transit arrivals</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-forest-800 text-cream-300 hover:text-cream-50 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* History List */}
        <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[60vh] pr-1">
          {PAST_JOURNEYS.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl glass-panel-subtle border border-emerald-500/15 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold text-cream-50">{item.name}</div>
                  <div className="text-[10px] text-cream-400/80">{item.date}</div>
                </div>
                <button
                  onClick={() => {
                    onSelectDestination({ name: item.name, lat: item.lat, lng: item.lng });
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-mint-500/20 hover:bg-mint-500/30 text-mint-400 text-xs font-bold transition-colors"
                >
                  Repeat Route
                </button>
              </div>

              <div className="flex items-center gap-4 text-[11px] font-mono text-cream-300/80 pt-1 border-t border-forest-800/60">
                <span>Distance: {item.dist}</span>
                <span>Duration: {item.time}</span>
                <span className="text-mint-400">Status: Arrived</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
