import React from 'react';
import type { Destination, Coordinates } from '../../types';
import { formatDistance } from '../../utils/geo';

interface SimulationControlsProps {
  isOpen: boolean;
  onClose: () => void;
  destination: Destination | null;
  currentPosition: Coordinates | null;
  isSimulating: boolean;
  simulationProgress: number;
  onToggleSimulation: (active: boolean) => void;
  onProgressChange: (progress: number) => void;
  onInstantArrival: () => void;
  speedKmh: number;
  onSpeedChange: (speed: number) => void;
  selectedRadius: number;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isOpen,
  onClose,
  destination,
  isSimulating,
  simulationProgress,
  onToggleSimulation,
  onProgressChange,
  onInstantArrival,
  speedKmh,
  onSpeedChange,
  selectedRadius,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-forest-950/80 backdrop-blur-md safe-bottom">
      <div className="w-full max-w-lg rounded-3xl glass-panel p-5 sm:p-6 shadow-2xl border border-amber-500/40 text-cream-100 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-forest-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎮</span>
            <div>
              <h2 className="text-base font-bold text-cream-50">Manual Journey Simulator</h2>
              <p className="text-[11px] text-cream-400">Test arrival alarm without leaving your desk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-forest-800 text-cream-300 hover:text-cream-50"
          >
            ✕
          </button>
        </div>

        {!destination && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
            Please pick a destination on the map first before running the simulation.
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={onInstantArrival}
            disabled={!destination}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              destination
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-forest-950 active:scale-95 cursor-pointer'
                : 'bg-forest-900/40 text-cream-400/40 border border-forest-800 cursor-not-allowed'
            }`}
          >
            <span>⚡</span>
            <span>Trigger Instant Arrival (Jump inside {formatDistance(selectedRadius)})</span>
          </button>
          <p className="text-[11px] text-cream-400/80 text-center">
            Instantly positions GPS inside arrival radius to test audio chime, vibration, and alert screen.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-forest-900/80 border border-forest-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cream-200">Continuous Movement</span>
            <button
              onClick={() => onToggleSimulation(!isSimulating)}
              disabled={!destination}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                isSimulating
                  ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
              }`}
            >
              {isSimulating ? 'Pause Motion' : 'Start Motion'}
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-cream-300">
              <span>Journey Progress</span>
              <span className="font-mono font-bold text-emerald-400">
                {Math.round(simulationProgress * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={simulationProgress}
              onChange={(e) => onProgressChange(parseFloat(e.target.value))}
              disabled={!destination}
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-forest-950 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-cream-400/60">
              <span>Departure Point</span>
              <span>Arrival Target</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-1.5 pt-1">
            <span className="text-xs text-cream-400">Simulated Speed:</span>
            <div className="flex gap-1.5">
              {[
                { label: 'Walk (5 km/h)', val: 5 },
                { label: 'Bus (35 km/h)', val: 35 },
                { label: 'Train (80 km/h)', val: 80 },
              ].map((s) => (
                <button
                  key={s.val}
                  onClick={() => onSpeedChange(s.val)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    speedKmh === s.val
                      ? 'bg-emerald-500 text-forest-950'
                      : 'bg-forest-950 text-cream-300 border border-forest-800 hover:bg-forest-800'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-forest-800 text-cream-200 text-xs font-semibold hover:bg-forest-750"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
