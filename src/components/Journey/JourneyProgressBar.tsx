import React, { useState } from 'react';
import type { TravelMode } from '../../types';
import type { RouteResult } from '../../services/routingService';
import { Gauge, MapPin, Clock, ChevronUp, ChevronDown } from 'lucide-react';

interface JourneyProgressBarProps {
  routeInfo: RouteResult | null;
  distanceMeters: number | null;
  speedKmh: number | null;
  travelMode?: TravelMode;
  simulationProgress?: number;
  durationSeconds?: number;
  className?: string;
}

export const JourneyProgressBar: React.FC<JourneyProgressBarProps> = ({
  routeInfo,
  distanceMeters,
  speedKmh,
  travelMode: _travelMode = 'driving',
  simulationProgress = 0.27,
  durationSeconds,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Format Duration & Distance
  const totalDuration = routeInfo?.formattedDuration || '92 hr 15 mins';
  const totalDistance = routeInfo?.formattedDistance || '7523 km';

  // Current speed display
  const displaySpeed =
    speedKmh !== null && speedKmh !== undefined && speedKmh > 0
      ? `${Math.round(speedKmh)} km/h`
      : '0 km/h';

  // Remaining distance in km or meters
  const remainingMeters = distanceMeters !== null && distanceMeters !== undefined
    ? distanceMeters
    : routeInfo?.distanceMeters || 4050000;

  const displayRemaining =
    remainingMeters < 1000
      ? `${Math.round(remainingMeters)} m`
      : `${Math.round(remainingMeters / 1000)} km`;

  // Dynamic estimated arrival time
  const estSeconds = durationSeconds ?? routeInfo?.durationSeconds ?? 8280;
  const arrivalDate = new Date(Date.now() + estSeconds * 1000);
  const displayArrival = arrivalDate.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  const progressPercent = Math.min(100, Math.max(0, Math.round(simulationProgress * 100)));

  return (
    <div
      className={`rounded-3xl bg-[#FFF8ED] border border-[#ded5c5] p-4 sm:p-5 shadow-lg shadow-[#174C3C]/5 text-[#14221d] select-none transition-all duration-200 ${className}`}
    >
      {/* Header Row: Duration + Distance + Collapse Button */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#14221d] tracking-tight leading-none">
            {totalDuration} <span className="text-[#687a71] font-semibold text-base sm:text-lg">({totalDistance})</span>
          </h2>
          <div className="text-xs text-[#687a71] font-medium mt-1">
            Fastest route · <span className="text-emerald-700 font-bold">Normal traffic</span>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-8 h-8 rounded-full bg-[#f5ecdc] border border-[#ded5c5] flex items-center justify-center text-[#14221d] hover:bg-[#ebdcc7] transition-all cursor-pointer active:scale-95 shrink-0"
          title={isExpanded ? 'Collapse Summary' : 'Expand Summary'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4 text-[#14221d]" /> : <ChevronDown className="w-4 h-4 text-[#14221d]" />}
        </button>
      </div>

      {isExpanded && (
        <>
          {/* 3 Inline Stat Columns: Speed, Remaining Distance, Est. Arrival */}
          <div className="grid grid-cols-3 divide-x divide-[#ded5c5]/70 py-3 mt-1 border-t border-[#ded5c5]/60">
            {/* Current speed */}
            <div className="flex items-center gap-2.5 px-2 first:pl-0">
              <div className="w-8 h-8 rounded-xl bg-[#f5ecdc] flex items-center justify-center text-[#174C3C] shrink-0">
                <Gauge className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black text-[#14221d] truncate">
                  {displaySpeed}
                </div>
                <div className="text-[10px] text-[#687a71] truncate font-medium">
                  Current speed
                </div>
              </div>
            </div>

            {/* Remaining distance */}
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-8 h-8 rounded-xl bg-[#f5ecdc] flex items-center justify-center text-red-600 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black text-[#14221d] truncate">
                  {displayRemaining}
                </div>
                <div className="text-[10px] text-[#687a71] truncate font-medium">
                  Remaining
                </div>
              </div>
            </div>

            {/* Est. arrival time */}
            <div className="flex items-center gap-2.5 px-2 last:pr-0">
              <div className="w-8 h-8 rounded-xl bg-[#f5ecdc] flex items-center justify-center text-[#174C3C] shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black text-[#14221d] truncate">
                  {displayArrival}
                </div>
                <div className="text-[10px] text-[#687a71] truncate font-medium">
                  Est. arrival
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar & Percentage */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 h-2 bg-[#ded5c5] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#174C3C] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-[#687a71] shrink-0">
              {progressPercent}% completed
            </span>
          </div>
        </>
      )}
    </div>
  );
};
