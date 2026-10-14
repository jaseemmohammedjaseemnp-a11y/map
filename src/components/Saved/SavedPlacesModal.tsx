import React from 'react';
import type { Destination } from '../../types';

interface SavedPlacesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDestination: (dest: Destination) => void;
}

const SAVED_PRESETS: Destination[] = [
  { name: 'Pattambi', address: 'Palakkad, Kerala, India', lat: 10.8055, lng: 76.1989 },
  { name: 'Kozhikode', address: 'Kozhikode, Kerala, India', lat: 11.2588, lng: 75.7804 },
  { name: 'Wayanad', address: 'Kerala, India', lat: 11.6854, lng: 76.1320 },
  { name: 'Bangalore', address: 'Karnataka, India', lat: 12.9716, lng: 77.5946 },
  { name: 'Ooty', address: 'Tamil Nadu, India', lat: 11.4102, lng: 76.6950 },
  { name: 'Central Railway Station', address: 'Main Terminus Station', lat: 11.2505, lng: 75.7820 },
  { name: 'International Airport', address: 'Terminal Concourse', lat: 11.1369, lng: 75.9553 },
];

export const SavedPlacesModal: React.FC<SavedPlacesModalProps> = ({
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
            <span className="text-xl">🔖</span>
            <div>
              <h2 className="text-base font-bold text-cream-50">Saved Places</h2>
              <p className="text-[11px] text-cream-400">Quickly select your frequent transit stops</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-forest-800 text-cream-300 hover:text-cream-50 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Places List */}
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[60vh] pr-1">
          {SAVED_PRESETS.map((place, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSelectDestination(place);
                onClose();
              }}
              className="flex items-center justify-between p-3.5 rounded-2xl glass-panel-subtle hover:bg-forest-900/90 border border-emerald-500/15 hover:border-mint-400/40 text-left transition-all duration-200 group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-forest-900 border border-emerald-500/30 flex items-center justify-center text-mint-400 group-hover:scale-110 transition-transform">
                  📍
                </div>
                <div>
                  <div className="text-sm font-bold text-cream-50">{place.name}</div>
                  <div className="text-[11px] text-cream-300/70">{place.address}</div>
                </div>
              </div>

              <span className="text-xs text-mint-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                Select →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
