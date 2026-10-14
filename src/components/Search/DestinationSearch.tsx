import React, { useState, useEffect, useRef } from 'react';
import type { Destination, Coordinates, TravelMode } from '../../types';
import type { RouteResult } from '../../services/routingService';
import { searchGeoapifyPlaces } from '../../services/geoapifyService';
import {
  Car,
  Bus,
  Footprints,
  Bike,
  MapPin,
  Crosshair,
  ArrowUpDown,
  Volume2,
  Navigation,
  X,
  Bell,
} from 'lucide-react';

interface DestinationSearchProps {
  origin: Destination | null;
  onSelectOrigin: (orig: Destination | null) => void;
  destination: Destination | null;
  onSelectDestination: (dest: Destination) => void;
  onClearDestination: () => void;
  currentPosition: Coordinates | null;
  geoapifyApiKey?: string;
  travelMode: TravelMode;
  onChangeTravelMode: (mode: TravelMode) => void;
  routeInfo: RouteResult | null;
  isLoadingRoute: boolean;
  onSwapPoints: () => void;
  selectedRadius: number;
  onSelectRadius: (radius: number) => void;
  onLocateUser?: () => void;
  onStartJourney?: () => void;
  onTestAlarm?: () => void;
  onSimulate?: () => void;
  isTracking?: boolean;
  className?: string;
}

const TRAVEL_MODES: { id: TravelMode; label: string; icon: React.ReactNode }[] = [
  { id: 'driving', label: 'Driving', icon: <Car className="w-4 h-4" /> },
  { id: 'transit', label: 'Transit', icon: <Bus className="w-4 h-4" /> },
  { id: 'walking', label: 'Walking', icon: <Footprints className="w-4 h-4" /> },
  { id: 'bike', label: 'Cycling', icon: <Bike className="w-4 h-4" /> },
];

const RADIUS_OPTIONS = [50, 100, 200, 500, 1000];

function formatMinutesToHours(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h} hr ${m} min`;
}

export const DestinationSearch: React.FC<DestinationSearchProps> = ({
  origin,
  onSelectOrigin,
  destination,
  onSelectDestination,
  onClearDestination: _onClearDestination,
  currentPosition,
  geoapifyApiKey = '',
  travelMode,
  onChangeTravelMode,
  routeInfo,
  isLoadingRoute,
  onSwapPoints,
  selectedRadius,
  onSelectRadius,
  onLocateUser,
  onStartJourney,
  onTestAlarm,
  onSimulate: _onSimulate,
  isTracking = false,
  className = '',
}) => {
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  // Search input state for Origin and Destination
  const [originText, setOriginText] = useState(origin?.name || '');
  const [destText, setDestText] = useState(destination?.name || '');
  const [originSuggestions, setOriginSuggestions] = useState<Destination[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<Destination[]>([]);
  const [isOriginLoading, setIsOriginLoading] = useState(false);
  const [isDestLoading, setIsDestLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'origin' | 'dest' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync text when external props change
  useEffect(() => {
    if (origin?.name) setOriginText(origin.name);
  }, [origin?.name]);

  useEffect(() => {
    if (destination?.name) setDestText(destination.name);
  }, [destination?.name]);

  // Click outside listener to dismiss dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for Origin
  useEffect(() => {
    if (activeDropdown !== 'origin' || !originText || originText.trim().length < 2) {
      setOriginSuggestions([]);
      setIsOriginLoading(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsOriginLoading(true);
      try {
        const results = await searchGeoapifyPlaces(originText, geoapifyApiKey, currentPosition);
        setOriginSuggestions(results);
      } finally {
        setIsOriginLoading(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [originText, activeDropdown, geoapifyApiKey, currentPosition]);

  // Debounced search for Destination
  useEffect(() => {
    if (activeDropdown !== 'dest' || !destText || destText.trim().length < 2) {
      setDestSuggestions([]);
      setIsDestLoading(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsDestLoading(true);
      try {
        const results = await searchGeoapifyPlaces(destText, geoapifyApiKey, currentPosition);
        setDestSuggestions(results);
      } finally {
        setIsDestLoading(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [destText, activeDropdown, geoapifyApiKey, currentPosition]);

  const handleSelectOriginPlace = (place: Destination) => {
    setOriginText(place.name);
    setActiveDropdown(null);
    onSelectOrigin(place);
  };

  const handleSelectDestPlace = (place: Destination) => {
    setDestText(place.name);
    setActiveDropdown(null);
    onSelectDestination(place);
  };

  const primaryDistanceMeters = routeInfo?.distanceMeters || 100000;
  const primaryDurationSeconds = routeInfo?.durationSeconds || 8280;

  const primaryDistFormatted =
    routeInfo?.formattedDistance ||
    (primaryDistanceMeters < 1000
      ? `${Math.round(primaryDistanceMeters)} m`
      : `${(primaryDistanceMeters / 1000).toFixed(1)} km`);

  const primaryDuration =
    routeInfo?.formattedDuration ||
    formatMinutesToHours(Math.round(primaryDurationSeconds / 60));

  const routeAlternatives = [
    {
      id: 0,
      time: primaryDuration,
      distance: primaryDistFormatted,
      via:
        travelMode === 'walking'
          ? 'Fastest pedestrian route'
          : travelMode === 'bike'
          ? 'Bicycle route'
          : travelMode === 'transit'
          ? 'Direct transit corridor'
          : 'Fastest route (Via NH 66)',
      traffic: travelMode === 'walking' || travelMode === 'bike' ? 'Scenic & clear' : 'Normal traffic',
      trafficColor: 'text-emerald-700 font-semibold',
    },
    {
      id: 1,
      time: formatMinutesToHours(Math.round((primaryDurationSeconds / 60) * 1.12)),
      distance:
        primaryDistanceMeters < 1000
          ? `${Math.round(primaryDistanceMeters * 1.05)} m`
          : `${(Number((primaryDistanceMeters / 1000).toFixed(1)) * 1.05).toFixed(1)} km`,
      via:
        travelMode === 'walking'
          ? 'Quiet side streets'
          : travelMode === 'bike'
          ? 'Paved trail route'
          : 'Via State Highway (SH 28)',
      traffic: travelMode === 'walking' || travelMode === 'bike' ? 'Low grade' : 'Moderate traffic',
      trafficColor: 'text-amber-700 font-semibold',
    },
  ];

  return (
    <div
      ref={containerRef}
      className={`w-full max-w-[390px] rounded-3xl bg-[#FFF8ED] border border-[#ded5c5] p-4 sm:p-5 shadow-lg shadow-[#174C3C]/5 flex flex-col gap-4 text-[#14221d] select-none ${className}`}
    >
      {/* Origin & Destination Interactive Box */}
      <div className="flex flex-col gap-2 p-3 rounded-2xl bg-[#f5ecdc] border border-[#ded5c5] relative">
        {/* Origin Row */}
        <div className="relative">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100 shrink-0" />
              <input
                type="text"
                value={originText}
                onChange={(e) => {
                  setOriginText(e.target.value);
                  setActiveDropdown('origin');
                }}
                onFocus={() => setActiveDropdown('origin')}
                placeholder="Starting location..."
                className="w-full bg-transparent text-xs font-bold text-[#14221d] placeholder-[#8a9990] outline-none truncate"
              />
              {originText && (
                <button
                  onClick={() => {
                    setOriginText('');
                    onSelectOrigin(null);
                  }}
                  className="text-[#8a9990] hover:text-[#14221d] text-xs p-1 cursor-pointer"
                  title="Clear origin"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {onLocateUser && (
              <button
                onClick={onLocateUser}
                className="text-[#687a71] hover:text-[#174C3C] p-1 text-xs shrink-0 cursor-pointer"
                title="Use current GPS location"
              >
                <Crosshair className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Origin Autocomplete Suggestions */}
          {activeDropdown === 'origin' && originSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-[#FFF8ED] border border-[#ded5c5] shadow-xl overflow-hidden z-50 p-1 flex flex-col gap-1 max-h-48 overflow-y-auto">
              {isOriginLoading && (
                <div className="p-2 text-xs text-[#687a71] text-center">Searching...</div>
              )}
              {originSuggestions.map((place, idx) => (
                <button
                  key={`${place.lat}-${place.lng}-${idx}`}
                  onClick={() => handleSelectOriginPlace(place)}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-[#f5ecdc] transition-all flex items-start gap-2 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[#14221d] truncate">{place.name}</div>
                    {place.address && (
                      <div className="text-[10px] text-[#687a71] truncate">{place.address}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dotted connecting line */}
        <div className="ml-1 pl-2 border-l-2 border-dashed border-[#b8ab97] h-2 -my-1" />

        {/* Destination Row */}
        <div className="relative">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <input
                type="text"
                value={destText}
                onChange={(e) => {
                  setDestText(e.target.value);
                  setActiveDropdown('dest');
                }}
                onFocus={() => setActiveDropdown('dest')}
                placeholder="Enter destination..."
                className="w-full bg-transparent text-xs font-bold text-[#14221d] placeholder-[#8a9990] outline-none truncate"
              />
              {destText && (
                <button
                  onClick={() => {
                    setDestText('');
                    _onClearDestination();
                  }}
                  className="text-[#8a9990] hover:text-[#14221d] text-xs p-1 cursor-pointer"
                  title="Clear destination"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              onClick={onSwapPoints}
              className="w-7 h-7 rounded-lg bg-[#FFF8ED] border border-[#ded5c5] flex items-center justify-center text-[#14221d] hover:bg-[#ebdcc7] transition-all cursor-pointer shadow-2xs shrink-0"
              title="Swap locations"
            >
              <ArrowUpDown className="w-3 h-3 text-[#687a71]" />
            </button>
          </div>

          {/* Destination Autocomplete Suggestions */}
          {activeDropdown === 'dest' && destSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-[#FFF8ED] border border-[#ded5c5] shadow-xl overflow-hidden z-50 p-1 flex flex-col gap-1 max-h-48 overflow-y-auto">
              {isDestLoading && (
                <div className="p-2 text-xs text-[#687a71] text-center">Searching...</div>
              )}
              {destSuggestions.map((place, idx) => (
                <button
                  key={`${place.lat}-${place.lng}-${idx}`}
                  onClick={() => handleSelectDestPlace(place)}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-[#f5ecdc] transition-all flex items-start gap-2 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[#14221d] truncate">{place.name}</div>
                    {place.address && (
                      <div className="text-[10px] text-[#687a71] truncate">{place.address}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Travel Mode Pills Row */}
      <div className="grid grid-cols-4 gap-1.5">
        {TRAVEL_MODES.map((mode) => {
          const isActive = travelMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onChangeTravelMode(mode.id)}
              className={`flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#174C3C] text-white shadow-xs'
                  : 'bg-[#f5ecdc] text-[#687a71] hover:text-[#14221d] hover:bg-[#ebdcc7]'
              }`}
            >
              <span>{mode.icon}</span>
              <span className="truncate">{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Route Options List */}
      <div className="flex flex-col gap-2">
        {!destination ? (
          <div className="p-4 rounded-2xl bg-[#f5ecdc] border border-dashed border-[#ded5c5] text-center flex flex-col items-center gap-1.5 py-5">
            <div className="w-10 h-10 rounded-full bg-[#FFF8ED] flex items-center justify-center text-[#174C3C]">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-[#14221d]">Select Destination</div>
            <div className="text-[11px] text-[#687a71] leading-relaxed max-w-xs">
              Search destination above or <strong>click anywhere on the map</strong> to navigate.
            </div>
          </div>
        ) : isLoadingRoute ? (
          <div className="p-4 rounded-2xl bg-[#f5ecdc] border border-[#ded5c5] text-center text-xs text-[#687a71] flex items-center justify-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-[#174C3C] border-t-transparent animate-spin" />
            <span>Calculating optimal route...</span>
          </div>
        ) : (
          routeAlternatives.map((route, idx) => {
            const isSelected = selectedRouteIndex === idx;
            return (
              <div
                key={route.id}
                onClick={() => setSelectedRouteIndex(idx)}
                className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#f5ecdc] border-[#174C3C]/40 shadow-xs'
                    : 'bg-[#faf5ec] border-[#ded5c5] hover:bg-[#f5ecdc]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black text-[#14221d]">{route.time}</div>
                  <div className="text-[10px] text-[#687a71] truncate font-semibold">
                    {route.distance} • {route.via}
                  </div>
                  <div className={`text-[10px] ${route.trafficColor}`}>{route.traffic}</div>
                </div>

                {isSelected && onStartJourney && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartJourney();
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#174C3C] hover:bg-[#123e31] text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Navigation className="w-3.5 h-3.5 fill-current" />
                    <span>Start</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Arrival Alert Radius Selector */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-[#14221d]">
          <div className="flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-[#c28b38]" />
            <span>Alarm Radius</span>
            <span className="text-[#c28b38] font-bold">
              ({selectedRadius >= 1000 ? `${selectedRadius / 1000} km` : `${selectedRadius}m`})
            </span>
          </div>
          <span className="text-[10px] text-[#687a71] font-medium">Alerts before arrival</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 p-1 rounded-2xl bg-[#f5ecdc] border border-[#ded5c5]">
          {RADIUS_OPTIONS.map((radius) => {
            const isActive = selectedRadius === radius;
            return (
              <button
                key={radius}
                onClick={() => onSelectRadius(radius)}
                className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#174C3C] text-white shadow-xs'
                    : 'text-[#687a71] hover:text-[#14221d]'
                }`}
              >
                {radius >= 1000 ? `${radius / 1000} km` : `${radius}m`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Button: Test Alarm */}
      <div className="pt-1">
        <button
          onClick={onTestAlarm}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#f5ecdc] hover:bg-[#ebdcc7] border border-[#ded5c5] text-[#14221d] text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
        >
          <Volume2 className="w-4 h-4 text-[#174C3C]" />
          <span>Test Alarm Sound</span>
        </button>
      </div>
    </div>
  );
};
