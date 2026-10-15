import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import type { Destination } from '../../types';
import { formatDistance } from '../../utils/geo';
import { Bell, Volume2, Square, Navigation, X } from 'lucide-react';

interface ArrivalAlertScreenProps {
  destination: Destination;
  arrivalDistance: number;
  onStopAlarm: () => void;
  onSnooze: () => void;
  onViewOnMap?: () => void;
}

export const ArrivalAlertScreen: React.FC<ArrivalAlertScreenProps> = ({
  destination,
  arrivalDistance,
  onStopAlarm,
  onSnooze,
  onViewOnMap,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#174C3C', '#c28b38', '#dc2626', '#2563eb'],
      });
    } catch {
      // Confetti fallback
    }
  }, []);

  const handleToggleSound = () => {
    setIsPlaying(!isPlaying);
    if (isPlaying) {
      onSnooze();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs text-[#14221d] safe-top safe-bottom select-none">
      <div className="max-w-md w-full rounded-3xl bg-[#FFF8ED] border border-[#ded5c5] p-5 sm:p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-250">
        {/* Top-Right Close Button */}
        <button
          onClick={onSnooze}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#f5ecdc] hover:bg-[#ebdcc7] text-[#687a71] hover:text-[#14221d] flex items-center justify-center transition-all cursor-pointer active:scale-90"
          title="Dismiss"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Golden Bell Icon Circle */}
        <div className="relative mb-3 flex items-center justify-center mt-1">
          <span className="absolute w-20 h-20 rounded-full bg-amber-400/20 animate-ping" />
          <div className="w-14 h-14 rounded-full bg-[#fcf0dc] text-[#c28b38] flex items-center justify-center shadow-sm z-10 border border-[#edd7b6]">
            <Bell className="w-7 h-7 fill-current" />
          </div>
        </div>

        {/* Headline & Subtitle */}
        <h2 className="text-lg sm:text-xl font-black text-[#14221d] tracking-tight mb-0.5">
          You are near your destination!
        </h2>
        <p className="text-xs text-[#687a71] font-semibold mb-4">
          Within {formatDistance(arrivalDistance)} • <span className="text-[#174C3C] font-bold">{destination.name}</span>
        </p>

        {/* Primary Action Button: Play / Stop Alarm */}
        <button
          onClick={onStopAlarm}
          className="w-full py-3.5 px-6 rounded-2xl bg-[#174C3C] hover:bg-[#123e31] text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mb-2.5"
        >
          <Volume2 className="w-4 h-4 text-emerald-300" />
          <span>Stop Alarm</span>
        </button>

        {/* Bottom Row Action Buttons */}
        <div className="w-full grid grid-cols-2 gap-2">
          {/* Stop Journey */}
          <button
            onClick={onStopAlarm}
            className="py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Journey</span>
          </button>

          {/* View on Map */}
          <button
            onClick={onViewOnMap || onSnooze}
            className="py-2.5 px-3 rounded-xl bg-[#f5ecdc] hover:bg-[#ebdcc7] border border-[#ded5c5] text-[#14221d] text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5 text-[#174C3C]" />
            <span>View on Map</span>
          </button>
        </div>
      </div>
    </div>
  );
};

