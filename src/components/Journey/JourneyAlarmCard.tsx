import React from 'react';
import type { Destination, GPSReading, JourneyStatus } from '../../types';
import { Bell, Volume2, Square, X } from 'lucide-react';

interface JourneyAlarmCardProps {
  currentPosition: GPSReading | null;
  destination: Destination | null;
  selectedRadius: number;
  journeyStatus: JourneyStatus;
  onPlayAlarm: () => void;
  onStopJourney: () => void;
  onClose?: () => void;
  className?: string;
}

export const JourneyAlarmCard: React.FC<JourneyAlarmCardProps> = ({
  currentPosition: _currentPosition,
  destination: _destination,
  selectedRadius,
  journeyStatus: _journeyStatus,
  onPlayAlarm,
  onStopJourney,
  onClose,
  className = '',
}) => {
  return (
    <div
      className={`w-full max-w-[340px] rounded-3xl bg-[#FFF8ED] border border-[#ded5c5] p-5 shadow-lg shadow-[#174C3C]/5 flex flex-col items-center text-center text-[#14221d] select-none relative ${className}`}
    >
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#f5ecdc] border border-[#ded5c5] flex items-center justify-center text-[#687a71] hover:text-[#14221d] text-xs transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Bell Icon Circle */}
      <div className="w-14 h-14 rounded-full bg-[#f5ecdc] border border-[#ded5c5] flex items-center justify-center text-[#c28b38] mb-3">
        <Bell className="w-7 h-7 animate-bounce" />
      </div>

      {/* Heading & Radius */}
      <h3 className="text-base font-bold text-[#14221d] leading-snug">
        Approaching Destination
      </h3>
      <p className="text-xs text-[#687a71] font-medium mt-0.5 mb-4">
        Within {selectedRadius}m proximity zone
      </p>

      {/* Primary Action: Test Alarm */}
      <button
        onClick={onPlayAlarm}
        className="w-full py-3 px-4 rounded-xl bg-[#174C3C] hover:bg-[#123e31] text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer mb-2.5"
      >
        <Volume2 className="w-4 h-4" />
        <span>Test Alarm</span>
      </button>

      {/* Secondary Action: Stop Journey */}
      <button
        onClick={onStopJourney}
        className="w-full py-2.5 px-4 rounded-xl bg-[#f5ecdc] hover:bg-[#ebdcc7] border border-[#ded5c5] text-xs font-bold text-[#14221d] flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
      >
        <Square className="w-3 h-3 text-red-600" fill="currentColor" />
        <span>Stop Journey</span>
      </button>
    </div>
  );
};
