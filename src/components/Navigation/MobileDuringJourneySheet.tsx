import React, { useState } from 'react';
import type { RouteStep } from '../../types';
import type { RouteResult } from '../../services/routingService';
import {
  ArrowUp,
  CornerUpRight,
  CornerUpLeft,
  Volume2,
  VolumeX,
  Gauge,
  MapPin,
  Square,
  Bell,
  Navigation,
  Layers,
} from 'lucide-react';

interface MobileDuringJourneySheetProps {
  steps: RouteStep[];
  currentStepIndex: number;
  routeInfo: RouteResult | null;
  remainingDistanceMeters: number;
  remainingDurationSeconds: number;
  distanceToNextManeuverMeters?: number;
  gpsSpeedKmh: number;
  travelingHeading?: number;
  onStopJourney: () => void;
  onTestAlarm: () => void;
  onRecenterMap?: () => void;
  onToggleMapLayers?: () => void;
  className?: string;
}

export const MobileDuringJourneySheet: React.FC<MobileDuringJourneySheetProps> = ({
  steps,
  currentStepIndex,
  routeInfo,
  remainingDistanceMeters,
  remainingDurationSeconds,
  distanceToNextManeuverMeters,
  gpsSpeedKmh,
  travelingHeading: _travelingHeading = 0,
  onStopJourney,
  onTestAlarm,
  onRecenterMap,
  onToggleMapLayers,
  className = '',
}) => {
  const [isMuted, setIsMuted] = useState(false);

  const currentStep = steps[currentStepIndex] || steps[0] || {
    instruction: 'Head north along route',
    distanceMeters: remainingDistanceMeters,
  };
  const nextStep = steps[currentStepIndex + 1];

  const formatDist = (meters: number): string => {
    if (meters < 25) return 'Now';
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const nextTurnDist = distanceToNextManeuverMeters !== undefined
    ? formatDist(distanceToNextManeuverMeters)
    : formatDist(currentStep.distanceMeters || remainingDistanceMeters);

  const totalDist = routeInfo?.distanceMeters || 4800;
  const distCovered = Math.max(0, totalDist - remainingDistanceMeters);
  const progressPercent = totalDist > 0 ? Math.min(100, Math.max(0, Math.round((distCovered / totalDist) * 100))) : 28;

  // Estimated Arrival time (e.g. 10:05 AM)
  const arrivalDate = new Date(Date.now() + remainingDurationSeconds * 1000);
  const displayArrival = arrivalDate.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  const durationMins = Math.max(1, Math.round(remainingDurationSeconds / 60));
  const displayDuration = durationMins < 60 ? `${durationMins} min` : `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`;
  const displayRemaining = formatDist(remainingDistanceMeters);
  const displaySpeed = gpsSpeedKmh > 0 ? `${Math.round(gpsSpeedKmh)} km/h` : '40 km/h';

  // Maneuver icon helper
  const renderManeuverIcon = () => {
    const text = (currentStep.instruction || '').toLowerCase();
    if (text.includes('right')) {
      return <CornerUpRight className="w-6 h-6 text-white" strokeWidth={2.5} />;
    }
    if (text.includes('left')) {
      return <CornerUpLeft className="w-6 h-6 text-white" strokeWidth={2.5} />;
    }
    return <ArrowUp className="w-6 h-6 text-white" strokeWidth={2.5} />;
  };

  return (
    <div className={`sm:hidden pointer-events-none ${className}`}>
      {/* 1. Floating Top Turn Maneuver Card */}
      <div className="fixed top-3 left-3 right-3 z-30 pointer-events-auto safe-top">
        <div className="w-full rounded-3xl bg-[#174C3C] text-white p-4 shadow-xl border border-emerald-900/40 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Maneuver Arrow */}
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                {renderManeuverIcon()}
              </div>

              {/* Text: Head north / 200 m */}
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-black truncate leading-tight">
                  {currentStep.instruction || 'Head north'}
                </h3>
                <p className="text-xs text-emerald-200/90 font-bold mt-0.5">
                  {nextTurnDist}
                </p>
              </div>
            </div>

            {/* Mute/Sound Toggle Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
              title={isMuted ? 'Unmute voice' : 'Mute voice'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-emerald-300" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
          </div>

          {/* Sub-pill: Then ↱ next step preview */}
          {nextStep && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/20 text-[11px] font-bold text-emerald-100 self-start">
              <span>Then</span>
              <CornerUpRight className="w-3.5 h-3.5" />
              <span className="truncate max-w-[220px]">{nextStep.instruction}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Floating Right Map Controls (Compass & Layers) */}
      <div className="fixed right-3 top-36 z-30 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={onRecenterMap}
          className="w-10 h-10 rounded-full bg-[#FFF8ED] border border-[#ded5c5] shadow-md flex items-center justify-center text-[#14221d] hover:bg-[#f5ecdc] transition-all cursor-pointer active:scale-95"
          title="Recenter & Follow GPS"
        >
          <Navigation className="w-4 h-4 text-[#174C3C] fill-[#174C3C]" />
        </button>
        <button
          onClick={onToggleMapLayers}
          className="w-10 h-10 rounded-full bg-[#FFF8ED] border border-[#ded5c5] shadow-md flex items-center justify-center text-[#14221d] hover:bg-[#f5ecdc] transition-all cursor-pointer active:scale-95"
          title="Switch Map Layers"
        >
          <Layers className="w-4 h-4 text-[#14221d]" />
        </button>
      </div>

      {/* 3. Floating Bottom Sheet Card */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-3 pb-safe pointer-events-auto">
        <div className="w-full rounded-3xl bg-[#FFF8ED] border border-[#ded5c5] shadow-2xl p-5 text-[#14221d] animate-in slide-in-from-bottom-6 duration-250">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-[#14221d] tracking-tight leading-tight">
                {displayDuration} <span className="text-[#687a71] text-base font-bold">({displayRemaining})</span>
              </h2>
              <p className="text-xs text-[#687a71] font-semibold mt-0.5">
                Arriving at <span className="font-bold text-[#14221d]">{displayArrival}</span>
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
                  {displayRemaining}
                </div>
                <div className="text-[10px] text-[#687a71] font-semibold">
                  Remaining
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar with Vehicle Icon and % Text */}
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-base shrink-0">🚗</span>
            <div className="flex-1 h-2 bg-[#ded5c5] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#174C3C] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-[#687a71] shrink-0">
              {progressPercent}% completed
            </span>
          </div>

          {/* Action Row: Stop Journey & Test Alarm */}
          <div className="grid grid-cols-2 gap-2">
            {/* Stop Journey */}
            <button
              onClick={onStopJourney}
              className="py-3 px-3 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Journey</span>
            </button>

            {/* Test Alarm */}
            <button
              onClick={onTestAlarm}
              className="py-3 px-3 rounded-2xl bg-[#f5ecdc] hover:bg-[#ebdcc7] border border-[#ded5c5] text-[#14221d] text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <Bell className="w-3.5 h-3.5 text-[#c28b38]" />
              <span>Test Alarm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
