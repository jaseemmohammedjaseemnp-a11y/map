import React from 'react';
import type { Destination } from '../../types';
import { MapPin, Navigation, PlusCircle, X, Flag, ArrowRight } from 'lucide-react';

interface ChangeLocationPromptProps {
  isOpen: boolean;
  pendingPlace: Destination | null;
  currentDestination: Destination | null;
  currentOrigin: Destination | null;
  onSetAsDestination: () => void;
  onAddAsStop: () => void;
  onSetAsOrigin: () => void;
  onCancel: () => void;
  className?: string;
}

export const ChangeLocationPrompt: React.FC<ChangeLocationPromptProps> = ({
  isOpen,
  pendingPlace,
  currentDestination,
  currentOrigin: _currentOrigin,
  onSetAsDestination,
  onAddAsStop,
  onSetAsOrigin,
  onCancel,
  className = '',
}) => {
  if (!isOpen || !pendingPlace) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 pointer-events-auto select-none ${className}`}>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      />

      {/* Confirmation Card */}
      <div className="relative w-full max-w-md bg-[#FFF8ED] border border-[#ded5c5] rounded-3xl p-5 shadow-2xl z-10 animate-in slide-in-from-bottom-3 sm:zoom-in-95 duration-200 text-[#14221d]">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#ded5c5]/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#174C3C] text-white flex items-center justify-center shadow-xs shrink-0">
              <MapPin className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#687a71] block">
                Map Location Selected
              </span>
              <h3 className="text-base font-bold text-[#14221d] truncate leading-tight">
                {pendingPlace.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-[#f5ecdc] border border-[#ded5c5] flex items-center justify-center text-[#687a71] hover:text-[#14221d] hover:bg-[#ebdcc7] transition-all cursor-pointer"
            title="Cancel and keep current location"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Address / Coordinates Info */}
        <div className="py-3">
          {pendingPlace.address && (
            <p className="text-xs text-[#687a71] mb-2 line-clamp-2">
              {pendingPlace.address}
            </p>
          )}

          {/* Current Destination Notice */}
          {currentDestination && (
            <div className="p-2.5 rounded-xl bg-[#f5ecdc] border border-[#ded5c5] flex items-center justify-between text-xs">
              <span className="text-[#687a71] font-medium">Current Destination:</span>
              <span className="font-bold text-[#174C3C] truncate max-w-[190px]">
                {currentDestination.name}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons: Change Destination, Add as Stop, Set as Starting Point */}
        <div className="flex flex-col gap-2 pt-1">
          {/* Change Destination */}
          <button
            onClick={onSetAsDestination}
            className="w-full py-3 px-4 rounded-xl bg-[#174C3C] hover:bg-[#123e31] text-white font-bold text-xs flex items-center justify-between shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4" />
              <span>Change Destination to this location</span>
            </div>
            <ArrowRight className="w-4 h-4 opacity-75" />
          </button>

          {/* Add as Stop */}
          <button
            onClick={onAddAsStop}
            className="w-full py-2.5 px-4 rounded-xl bg-[#FFF8ED] hover:bg-[#f5ecdc] border border-[#ded5c5] text-[#14221d] font-bold text-xs flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-[#c28b38]" />
              <span>Add as Stop along the journey</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[#687a71]" />
          </button>

          {/* Set as Starting Point */}
          <button
            onClick={onSetAsOrigin}
            className="w-full py-2.5 px-4 rounded-xl bg-[#FFF8ED] hover:bg-[#f5ecdc] border border-[#ded5c5] text-[#14221d] font-semibold text-xs flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              <span>Change Starting Location to here</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[#687a71]" />
          </button>

          {/* Dismiss / Cancel */}
          <button
            onClick={onCancel}
            className="w-full py-2 text-center text-xs text-[#687a71] hover:text-[#14221d] font-medium transition-colors cursor-pointer mt-1"
          >
            Cancel (Keep Current Trip Safe)
          </button>
        </div>
      </div>
    </div>
  );
};
