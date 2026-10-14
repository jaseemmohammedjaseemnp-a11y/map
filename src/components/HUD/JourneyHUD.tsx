import type { Destination, GPSReading, JourneyStatus, TravelMode } from '../../types';
import type { RouteResult } from '../../services/routingService';
import { formatDistance, formatETA } from '../../utils/geo';
import { audioAlarm } from '../../services/audioAlarm';

interface JourneyHUDProps {
  journeyStatus: JourneyStatus;
  destination: Destination | null;
  currentPosition: GPSReading | null;
  distanceMeters: number | null;
  selectedRadius: number;
  onSelectRadius: (radius: number) => void;
  onStartJourney: () => void;
  onStopJourney: () => void;
  gpsAccuracy: number | null;
  isAudioUnlocked: boolean;
  onUnlockAudio: () => void;
  hasBeenBackgrounded: boolean;
  isPageVisible: boolean;
  onOpenSimulation: () => void;
  isSimulating: boolean;
  routeInfo?: RouteResult | null;
  travelMode?: TravelMode;
}

const RADIUS_OPTIONS = [
  { label: '100 m', value: 100, desc: 'Walking/Exit' },
  { label: '250 m', value: 250, desc: 'City Bus Stop' },
  { label: '500 m', value: 500, desc: 'Metro/Train' },
  { label: '1 km', value: 1000, desc: 'Suburban' },
  { label: '2 km', value: 2000, desc: 'Intercity/Highway' },
];

export const JourneyHUD: React.FC<JourneyHUDProps> = ({
  journeyStatus,
  destination,
  currentPosition,
  distanceMeters,
  selectedRadius,
  onSelectRadius,
  onStartJourney,
  onStopJourney,
  gpsAccuracy,
  hasBeenBackgrounded,
  isPageVisible,
  onOpenSimulation,
  isSimulating,
  routeInfo,
  travelMode = 'transit',
}) => {
  const isTracking = journeyStatus === 'tracking';

  const handleTestSound = async () => {
    await audioAlarm.unlockAudio();
    audioAlarm.playSoundPattern('chime', 0.9);
  };

  return (
    <div className="w-full rounded-3xl glass-panel p-4 sm:p-5 shadow-2xl border border-forest-600/50 flex flex-col gap-4 text-cream-100">
      {/* Background Interruption Warning Banner */}
      {!isPageVisible && (
        <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2 animate-pulse">
          <span className="text-base">⚠️</span>
          <span>Tab is backgrounded. Mobile browsers may throttle GPS and audio. Keep screen on!</span>
        </div>
      )}

      {hasBeenBackgrounded && isPageVisible && isTracking && (
        <div className="p-2 rounded-lg bg-forest-900/90 border border-amber-400/30 text-[11px] text-cream-200 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Tab was paused while hidden. GPS refreshed now.</span>
          </span>
          <span className="text-cream-400 text-[10px]">Foreground Recommended</span>
        </div>
      )}

      {/* Primary Metrics Row */}
      <div className="flex items-end justify-between border-b border-forest-800/80 pb-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-cream-400/80">
            {destination ? 'Distance to Destination' : 'Destination not chosen'}
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-cream-50 font-display mt-0.5">
            {routeInfo?.formattedDistance || (distanceMeters !== null ? formatDistance(distanceMeters) : '--')}
          </div>
        </div>

        {/* Live GPS Telemetry Badges */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                gpsAccuracy && gpsAccuracy <= 25
                  ? 'bg-emerald-400 animate-pulse'
                  : gpsAccuracy && gpsAccuracy <= 100
                  ? 'bg-amber-400'
                  : 'bg-red-400'
              }`}
            />
            <span className="font-medium text-cream-200">
              {gpsAccuracy ? `GPS ±${Math.round(gpsAccuracy)}m` : 'Acquiring GPS...'}
            </span>
          </div>

          {currentPosition?.speed !== null && currentPosition?.speed !== undefined && (
            <div className="text-[11px] text-cream-400">
              Speed: {Math.round((currentPosition.speed || 0) * 3.6)} km/h
            </div>
          )}

          {routeInfo?.formattedDuration ? (
            <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <span>⏱️</span>
              <span>Trip Time: {routeInfo.formattedDuration}</span>
            </div>
          ) : distanceMeters !== null ? (
            <div className="text-[11px] font-semibold text-emerald-400">
              ETA: {formatETA(distanceMeters, currentPosition?.speed || null)}
            </div>
          ) : null}
        </div>
      </div>

      {/* Arrival Radius Selection */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-cream-300">Arrival Alert Radius</span>
          <span className="text-xs font-bold text-emerald-400 font-mono">
            {formatDistance(selectedRadius)}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {RADIUS_OPTIONS.map((opt) => {
            const isSelected = selectedRadius === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onSelectRadius(opt.value)}
                disabled={isTracking}
                title={opt.desc}
                className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all text-center flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-forest-950 shadow-md ring-2 ring-emerald-300/50'
                    : 'bg-forest-900/90 text-cream-200 hover:bg-forest-800/90 border border-forest-700/50'
                } ${isTracking ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
              >
                <span className="leading-none">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Journey Action Buttons */}
      <div className="flex flex-col gap-2 pt-1">
        {!isTracking ? (
          <button
            onClick={onStartJourney}
            disabled={!destination}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 shadow-xl transition-all ${
              destination
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-forest-950 hover:brightness-110 active:scale-[0.98] shadow-emerald-900/40 cursor-pointer'
                : 'bg-forest-900/60 text-cream-400/50 border border-forest-800 cursor-not-allowed'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <span>{destination ? 'Start Journey Alarm' : 'Choose Destination on Map'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 py-3.5 px-4 rounded-2xl bg-forest-900 border border-emerald-500/40 flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <div>
                <div className="text-xs font-bold text-cream-100">Tracking Active</div>
                <div className="text-[11px] text-cream-400">Alarm arms within {formatDistance(selectedRadius)}</div>
              </div>
            </div>

            <button
              onClick={onStopJourney}
              className="py-3.5 px-5 rounded-2xl bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 font-bold text-sm transition-all active:scale-95 shadow-lg"
            >
              Stop
            </button>
          </div>
        )}

        {/* Quick Utilities Footer */}
        <div className="flex items-center justify-between text-xs text-cream-300/80 pt-1">
          <button
            onClick={handleTestSound}
            className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-forest-900/60 hover:bg-forest-800 border border-forest-700/40 text-cream-200 hover:text-emerald-300 transition-colors"
            title="Test speaker output before sleep"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <span>Test Sound</span>
          </button>

          <button
            onClick={onOpenSimulation}
            className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg border transition-all ${
              isSimulating
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-semibold'
                : 'bg-forest-900/60 hover:bg-forest-800 border-forest-700/40 text-cream-200 hover:text-amber-300'
            }`}
          >
            <span>🎮</span>
            <span>{isSimulating ? 'Simulation ON' : 'Test Simulator'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
