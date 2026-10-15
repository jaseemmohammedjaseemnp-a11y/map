import React from 'react';
import type { RouteStep } from '../../types';
import { ArrowUp, CornerUpRight, CornerUpLeft, Pause, Play, Send, Square, Compass, Gauge } from 'lucide-react';

interface TravelingDirectionsHUDProps {
  steps: RouteStep[];
  currentStepIndex: number;
  currentSpeedKmh?: number;
  travelingHeading?: number;
  distanceToNextManeuverMeters?: number;
  speedMultiplier?: number;
  onSetSpeedMultiplier?: (mult: number) => void;
  onInstantArrival: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onStopJourney: () => void;
  remainingDistanceMeters: number;
  remainingDurationSeconds: number;
  className?: string;
}

export const TravelingDirectionsHUD: React.FC<TravelingDirectionsHUDProps> = ({
  steps,
  currentStepIndex,
  currentSpeedKmh = 0,
  travelingHeading = 0,
  distanceToNextManeuverMeters,
  onInstantArrival,
  isPaused,
  onTogglePause,
  onStopJourney,
  remainingDistanceMeters,
  remainingDurationSeconds,
  className = '',
}) => {
  const currentStep = steps[currentStepIndex] || steps[0] || {
    instruction: 'Head along route toward destination',
    distanceMeters: remainingDistanceMeters,
    icon: '⬆️',
  };

  const nextStep = steps[currentStepIndex + 1];

  const formatDist = (meters: number): string => {
    if (meters < 30) return 'Now';
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatTime = (secs: number): string => {
    const mins = Math.max(1, Math.round(secs / 60));
    if (mins < 60) return `~${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `~${hrs}h ${remMins}m`;
  };

  // Convert degrees to cardinal direction name
  const getCardinalDirection = (deg: number): string => {
    const normalized = (deg % 360 + 360) % 360;
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(normalized / 45) % 8;
    return directions[idx];
  };

  // Determine directional icon based on instruction text
  const renderDirectionIcon = () => {
    const text = (currentStep.instruction || '').toLowerCase();
    if (text.includes('right')) {
      return <CornerUpRight className="w-6 h-6 text-emerald-300" strokeWidth={2.5} />;
    }
    if (text.includes('left')) {
      return <CornerUpLeft className="w-6 h-6 text-emerald-300" strokeWidth={2.5} />;
    }
    return <ArrowUp className="w-6 h-6 text-emerald-300" strokeWidth={2.5} />;
  };

  const stepDistance = distanceToNextManeuverMeters !== undefined
    ? distanceToNextManeuverMeters
    : (currentStep.distanceMeters || remainingDistanceMeters);

  return (
    <div
      className={`w-full max-w-xl mx-auto rounded-3xl bg-[#FFF8ED] border border-[#ded5c5] shadow-lg shadow-[#174C3C]/5 p-4 text-[#14221d] select-none flex flex-col gap-3.5 transition-all duration-200 ${className}`}
    >
      {/* Top Maneuver Row: Direction Icon + Instruction + Live Distance/Time */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          {/* Directional Icon Badge */}
          <div className="w-12 h-12 rounded-2xl bg-[#174C3C] text-white flex items-center justify-center shadow-xs shrink-0 relative">
            {renderDirectionIcon()}
          </div>

          {/* Turn-by-Turn Instruction Text & Live Status Badges */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#687a71] uppercase tracking-wider">
                TRAVELLING DIRECTION
              </span>

              {/* Live Compass Direction Chip */}
              <span className="inline-flex items-center gap-1 text-[10px] font-black bg-[#174C3C]/10 text-[#174C3C] px-2 py-0.5 rounded-full">
                <Compass className="w-3 h-3 text-[#174C3C]" style={{ transform: `rotate(${travelingHeading}deg)` }} />
                <span>{getCardinalDirection(travelingHeading)} ({Math.round(travelingHeading)}°)</span>
              </span>

              {/* Live Speed Chip */}
              <span className="inline-flex items-center gap-1 text-[10px] font-black bg-[#c28b38]/15 text-[#91631e] px-2 py-0.5 rounded-full">
                <Gauge className="w-3 h-3 text-[#91631e]" />
                <span>{Math.round(currentSpeedKmh)} km/h</span>
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-[#14221d] truncate leading-snug mt-0.5">
              {currentStep.instruction}
            </h3>
            {nextStep ? (
              <p className="text-[11px] text-[#687a71] truncate mt-0.5">
                Then {nextStep.instruction.toLowerCase()}
              </p>
            ) : (
              <p className="text-[11px] text-[#687a71] truncate mt-0.5">
                Continue toward destination alarm zone
              </p>
            )}
          </div>
        </div>

        {/* Distance to next turn / remaining */}
        <div className="flex flex-col items-end shrink-0 leading-none pl-2">
          <div className="text-base sm:text-lg font-black text-[#14221d]">
            {formatDist(stepDistance)}
          </div>
          <div className="text-[11px] text-[#687a71] font-semibold mt-1">
            {formatTime(remainingDurationSeconds)}
          </div>
        </div>
      </div>

      {/* Action Row: Pause, Reach Now, Stop only (clean and minimal) */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#ded5c5]/60">
        {/* Pause / Resume */}
        <button
          onClick={onTogglePause}
          className="py-2.5 px-3 rounded-xl bg-[#f5ecdc] hover:bg-[#ebdcc7] border border-[#ded5c5] text-xs font-bold text-[#14221d] flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          title={isPaused ? 'Resume Navigation' : 'Pause Navigation'}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 text-[#14221d]" fill="currentColor" /> : <Pause className="w-3.5 h-3.5 text-[#14221d]" fill="currentColor" />}
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </button>

        {/* Reach Now (Triggers proximity alarm for arrival testing) */}
        <button
          onClick={onInstantArrival}
          className="py-2.5 px-3 rounded-xl bg-[#174C3C] hover:bg-[#123e31] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
          title="Jump within arrival radius to trigger alarm"
        >
          <Send className="w-3.5 h-3.5 rotate-45" />
          <span>Reach Now</span>
        </button>

        {/* Stop Navigation */}
        <button
          onClick={onStopJourney}
          className="py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          title="Stop Journey"
        >
          <Square className="w-3 h-3 text-red-600" fill="currentColor" />
          <span>Stop</span>
        </button>
      </div>
    </div>
  );
};

