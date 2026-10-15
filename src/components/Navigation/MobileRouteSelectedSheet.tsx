import React from 'react';
import type { RouteResult } from '../../services/routingService';
import type { TravelMode } from '../../types';
import { ArrowLeft, Layers, Gauge, MapPin, Play } from 'lucide-react';

interface MobileRouteSelectedSheetProps {
  routeInfo: RouteResult | null;
  gpsSpeedKmh: number;
  travelMode: TravelMode;
  mapType: 'map' | 'satellite';
  onChangeMapType: (type: 'map' | 'satellite') => void;
  onBack: () => void;
  onStartJourney: () => void;
  className?: string;
}

export const MobileRouteSelectedSheet: React.FC<MobileRouteSelectedSheetProps> = ({
  routeInfo,
  gpsSpeedKmh,
  travelMode: _travelMode,
  mapType,
  onChangeMapType,
  onBack,
  onStartJourney,
  className = '',
}) => {
  const durationText = routeInfo?.formattedDuration || '12 min';
  const distanceText = routeInfo?.formattedDistance || '4.8 km';
  const displaySpeed = gpsSpeedKmh > 0 ? `${Math.round(gpsSpeedKmh)} km/h` : '40 km/h';

  return (
    <div className={`sm:hidden pointer-events-none ${className}`}>
      {/* Floating Top Controls over Map */}
      <div className="fixed top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto safe-top">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[#FFF8ED] border border-[#ded5c5] shadow-md flex items-center justify-center text-[#14221d] hover:bg-[#f5ecdc] transition-all cursor-pointer active:scale-95"
          title="Back to Search"
          aria-label="Back to Search"
        >
          <ArrowLeft className="w-5 h-5 text-[#14221d]" />
        </button>

        {/* Map / Satellite Segmented Toggle Pill */}
        <div className="flex items-center p-1 rounded-full bg-[#FFF8ED] border border-[#ded5c5] shadow-md">
          <button
            onClick={() => onChangeMapType('map')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              mapType === 'map'
                ? 'bg-[#174C3C] text-white shadow-xs'
                : 'text-[#687a71] hover:text-[#14221d]'
            }`}
          >
            Map
          </button>
          <button
            onClick={() => onChangeMapType('satellite')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              mapType === 'satellite'
                ? 'bg-[#174C3C] text-white shadow-xs'
                : 'text-[#687a71] hover:text-[#14221d]'
            }`}
          >
            Satellite
          </button>
        </div>

        {/* Layers Button */}
        <button
          onClick={() => onChangeMapType(mapType === 'satellite' ? 'map' : 'satellite')}
          className="w-10 h-10 rounded-full bg-[#FFF8ED] border border-[#ded5c5] shadow-md flex items-center justify-center text-[#14221d] hover:bg-[#f5ecdc] transition-all cursor-pointer active:scale-95"
          title="Switch Map Layers"
          aria-label="Switch Map Layers"
        >
          <Layers className="w-5 h-5 text-[#14221d]" />
        </button>
      </div>

      {/* Floating Bottom Sheet Card */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-3 pb-safe pointer-events-auto">
        <div className="w-full rounded-3xl bg-[#FFF8ED] border border-[#ded5c5] shadow-2xl p-5 text-[#14221d] animate-in slide-in-from-bottom-6 duration-250">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-[#14221d] tracking-tight leading-tight">
                {durationText} <span className="text-[#687a71] text-base font-bold">({distanceText})</span>
              </h2>
              <p className="text-xs text-[#687a71] font-semibold mt-0.5">
                Fastest route • <span className="text-emerald-700 font-bold">Normal traffic</span>
              </p>
            </div>
          </div>

          {/* 2-Column Metrics Box */}
          <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#ded5c5]/70 my-3.5">
            {/* Speed */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#f5ecdc] flex items-center justify-center text-[#174C3C] shrink-0">
                <Gauge className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black text-[#14221d] truncate">
                  {displaySpeed}
                </div>
                <div className="text-[10px] text-[#687a71] font-semibold">
                  Current speed
                </div>
              </div>
            </div>

            {/* Remaining */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#f5ecdc] flex items-center justify-center text-red-600 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black text-[#14221d] truncate">
                  {distanceText}
                </div>
                <div className="text-[10px] text-[#687a71] font-semibold">
                  Remaining
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar with Vehicle Icon */}
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-base shrink-0">🚗</span>
            <div className="flex-1 h-2 bg-[#ded5c5] rounded-full overflow-hidden">
              <div className="h-full bg-[#174C3C] rounded-full w-1/4" />
            </div>
          </div>

          {/* Start Journey Alarm Button */}
          <button
            onClick={onStartJourney}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#174C3C] hover:bg-[#123e31] text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Journey Alarm</span>
          </button>
        </div>
      </div>
    </div>
  );
};
