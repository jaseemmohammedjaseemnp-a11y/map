import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { Destination } from '../../types';
import { formatDistance } from '../../utils/geo';
import { Bell, MapPin, Square } from 'lucide-react';

interface ArrivalAlertScreenProps {
  destination: Destination;
  arrivalDistance: number;
  onStopAlarm: () => void;
  onSnooze: () => void;
}

export const ArrivalAlertScreen: React.FC<ArrivalAlertScreenProps> = ({
  destination,
  arrivalDistance,
  onStopAlarm,
  onSnooze,
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 },
        colors: ['#174C3C', '#c28b38', '#dc2626', '#2563eb'],
      });
    } catch {
      // Confetti fallback
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm text-[#14221d] safe-top safe-bottom select-none">
      <div className="max-w-sm w-full rounded-3xl bg-[#FFF8ED] border border-[#ded5c5] p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Alarm Bell Circle */}
        <div className="relative mb-5 flex items-center justify-center">
          <span className="absolute w-28 h-28 rounded-full bg-red-500/15 animate-ping" />
          <div className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30 z-10 animate-bounce">
            <Bell className="w-10 h-10" />
          </div>
        </div>

        {/* Badge & Title */}
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#c28b38] bg-[#f5ecdc] border border-[#ded5c5] px-3 py-1 rounded-full mb-2">
          Wake-Up Alert
        </div>
        <h1 className="text-2xl font-black text-[#14221d] mb-1">
          Destination Reached!
        </h1>
        <p className="text-xs text-[#687a71] font-medium mb-1">
          You are within the proximity alarm zone of
        </p>
        <p className="text-base font-bold text-[#174C3C] mb-2 truncate max-w-xs flex items-center justify-center gap-1">
          <MapPin className="w-4 h-4 text-red-600 shrink-0" />
          <span>{destination.name}</span>
        </p>

        {destination.address && (
          <p className="text-[11px] text-[#687a71] mb-3 max-w-xs line-clamp-2">
            {destination.address}
          </p>
        )}

        <div className="px-3.5 py-1.5 rounded-full bg-[#f5ecdc] border border-[#ded5c5] text-xs font-semibold text-[#14221d] mb-6">
          <span>Current distance: </span>
          <span className="font-bold text-[#174C3C]">{formatDistance(arrivalDistance)}</span>
        </div>

        {/* Buttons: Stop Alarm & Snooze */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onStopAlarm}
            className="w-full py-3.5 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Stop Alarm</span>
          </button>

          <button
            onClick={onSnooze}
            className="w-full py-2.5 px-4 rounded-xl bg-[#f5ecdc] hover:bg-[#ebdcc7] text-[#14221d] border border-[#ded5c5] font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            Snooze (+3 Minutes)
          </button>
        </div>
      </div>
    </div>
  );
};
