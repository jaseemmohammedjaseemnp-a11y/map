import React, { useState, useEffect, useRef } from 'react';
import type { Coordinates, Destination, JourneyStatus } from '../../types';
import { searchGeoapifyPlaces } from '../../services/geoapifyService';
import { Search, X, MapPin } from 'lucide-react';

interface HeaderProps {
  journeyStatus: JourneyStatus;
  mapType: 'map' | 'satellite';
  onChangeMapType: (type: 'map' | 'satellite') => void;
  onOpenMenu: () => void;
  onSelectDestination?: (dest: Destination) => void;
  geoapifyApiKey?: string;
  currentPosition?: Coordinates | null;
  gpsAccuracy?: number | null;
  isWatchingGps?: boolean;
  onSearchQuery?: (q: string) => void;
  searchQuery?: string;
}

export const Header: React.FC<HeaderProps> = ({
  journeyStatus: _journeyStatus,
  mapType,
  onChangeMapType,
  onOpenMenu,
  onSelectDestination,
  geoapifyApiKey = '',
  currentPosition = null,
  gpsAccuracy = null,
  isWatchingGps = true,
  onSearchQuery,
  searchQuery = '',
}) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (_journeyStatus === 'tracking') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }, [_journeyStatus]);

  // Debounced search when typing
  useEffect(() => {
    if (!localQuery || localQuery.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchGeoapifyPlaces(
          localQuery,
          geoapifyApiKey,
          currentPosition
        );
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (err) {
        console.warn('Search query error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [localQuery, geoapifyApiKey, currentPosition]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (dest: Destination) => {
    setLocalQuery(dest.name);
    setIsOpen(false);
    if (onSelectDestination) {
      onSelectDestination(dest);
    }
    if (onSearchQuery) {
      onSearchQuery(dest.name);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      } else if (localQuery.trim().length >= 2) {
        setIsLoading(true);
        const results = await searchGeoapifyPlaces(
          localQuery,
          geoapifyApiKey,
          currentPosition
        );
        setIsLoading(false);
        if (results.length > 0) {
          handleSelect(results[0]);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSearchChange = (val: string) => {
    setLocalQuery(val);
    if (onSearchQuery) onSearchQuery(val);
  };

  const handleClear = () => {
    setLocalQuery('');
    setSuggestions([]);
    setIsOpen(false);
  };

  const gpsLabel = isWatchingGps
    ? `GPS Active${gpsAccuracy ? ` · ±${Math.round(gpsAccuracy)}m` : ' · ±35m'}`
    : 'Acquiring GPS...';

  return (
    <header className="relative w-full z-40 safe-top px-3 sm:px-6 pt-3 pb-2 select-none pointer-events-none">
      <div className="flex items-center justify-between gap-3 max-w-[1920px] mx-auto">
        {/* Left: Hamburger & Brand Logo */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Hamburger Menu Button */}
          <button
            onClick={onOpenMenu}
            className="w-10 h-10 rounded-2xl bg-[#FFF8ED] border border-[#ded5c5] flex items-center justify-center text-[#14221d] shadow-sm hover:bg-[#f5ecdc] transition-all cursor-pointer active:scale-95"
            title="Navigation Menu"
            aria-label="Navigation Menu"
          >
            <span className="text-lg leading-none font-medium">☰</span>
          </button>

          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#174C3C] flex items-center justify-center text-white shadow-sm">
              <MapPin className="w-5 h-5 text-cream-100" />
            </div>
            <div className="hidden xs:block sm:block">
              <div className="flex items-center gap-1.5 text-base sm:text-lg font-black tracking-tight text-[#14221d] leading-none">
                <span>NearMe</span>
                <span className="text-[#c28b38] font-bold">Alarm</span>
              </div>
              <div className="text-[11px] text-[#687a71] font-medium tracking-wide mt-0.5">
                Transit Proximity Alert
              </div>
            </div>
          </div>
        </div>

        {/* Center: Destination Search Bar with Live Autocomplete */}
        <div
          ref={searchContainerRef}
          className="relative flex-1 max-w-xl mx-2 sm:mx-4 pointer-events-auto"
        >
          <div className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#FFF8ED] border border-[#ded5c5] shadow-sm text-sm transition-all focus-within:ring-2 focus-within:ring-[#174C3C]/20 focus-within:border-[#174C3C]">
            <Search className="w-4 h-4 text-[#687a71] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={localQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search destination, city, station, or landmark..."
              className="flex-1 bg-transparent text-[#14221d] placeholder-[#8a9990] text-xs sm:text-sm font-medium outline-none truncate"
            />
            {localQuery && (
              <button
                onClick={handleClear}
                className="text-[#8a9990] hover:text-[#14221d] text-xs p-1 cursor-pointer"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {isLoading && (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-[#174C3C] border-t-transparent animate-spin shrink-0" />
            )}
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {isOpen && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-[#FFF8ED] border border-[#ded5c5] shadow-xl overflow-hidden z-50 p-1 flex flex-col gap-1 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#687a71] border-b border-[#ded5c5]/60">
                Search Suggestions
              </div>
              {suggestions.map((place, idx) => (
                <button
                  key={`${place.lat}-${place.lng}-${idx}`}
                  onClick={() => handleSelect(place)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#f5ecdc] transition-all flex items-start gap-2.5 cursor-pointer group"
                >
                  <MapPin className="w-4 h-4 text-[#174C3C] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-bold text-[#14221d] truncate">
                      {place.name}
                    </div>
                    {place.address && (
                      <div className="text-[11px] text-[#687a71] truncate">
                        {place.address}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-[#c28b38] shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                    Go ➔
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: GPS Status & Map/Satellite Toggle (No unnecessary weather/bell/avatar) */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto shrink-0">
          {/* GPS Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFF8ED] border border-[#ded5c5] shadow-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isWatchingGps ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="text-xs font-semibold text-[#14221d]">
              {gpsLabel}
            </span>
          </div>

          {/* Map / Satellite Mode Toggle Pill */}
          <div className="flex items-center p-1 rounded-full bg-[#FFF8ED] border border-[#ded5c5] shadow-xs">
            <button
              onClick={() => onChangeMapType('map')}
              className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                mapType === 'map'
                  ? 'bg-[#174C3C] text-white shadow-xs'
                  : 'text-[#687a71] hover:text-[#14221d]'
              }`}
            >
              Map
            </button>
            <button
              onClick={() => onChangeMapType('satellite')}
              className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                mapType === 'satellite'
                  ? 'bg-[#174C3C] text-white shadow-xs'
                  : 'text-[#687a71] hover:text-[#14221d]'
              }`}
            >
              Satellite
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
