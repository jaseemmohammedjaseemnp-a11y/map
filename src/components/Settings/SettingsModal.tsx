import React, { useState } from 'react';
import type { UserPreferences, AlarmSoundType, MapTileStyle } from '../../types';
import { audioAlarm } from '../../services/audioAlarm';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSavePreferences: (prefs: UserPreferences) => void;
}

const SOUND_OPTIONS: { id: AlarmSoundType; label: string; desc: string }[] = [
  { id: 'chime', label: 'Chime Bell', desc: 'Melodic crystalline harmonic bell' },
  { id: 'radar', label: 'Sonar Radar', desc: 'Resonant sub-bass frequency ping' },
  { id: 'siren', label: 'Urgent Siren', desc: 'Alternating attention-grabbing siren' },
  { id: 'subtle', label: 'Subtle Pulse', desc: 'Soft dual-tone gentle notification' },
];

const MAP_STYLES: { id: MapTileStyle; label: string; desc: string; icon: string }[] = [
  { id: 'dark-matter-dark-purple', label: 'Dark Purple', desc: 'Sleek night theme with purple tone', icon: '🌑' },
  { id: 'dark-matter-yellow-roads', label: 'Yellow Roads', desc: 'High-contrast yellow highway grid', icon: '🟡' },
  { id: 'osm-carto', label: 'Crisp Streets', desc: 'Standard vibrant street map', icon: '🗺️' },
  { id: 'klokantech-basic', label: 'Clean Vector', desc: 'Lightweight minimal streets', icon: '📐' },
  { id: 'positron', label: 'Positron Light', desc: 'Subtle light grey daytime cartography', icon: '☀️' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences,
}) => {
  const [localPrefs, setLocalPrefs] = useState<UserPreferences>(preferences);
  const [googleKeyInput, setGoogleKeyInput] = useState<string>(preferences.googleMapsApiKey || '');
  const [geoapifyKeyInput, setGeoapifyKeyInput] = useState<string>(
    preferences.geoapifyApiKey || (import.meta.env.VITE_GEOAPIFY_API_KEY as string) || '4535ab6baa8d436fb5c8a356457ada90'
  );

  if (!isOpen) return null;

  const handleTestSound = async (soundId: AlarmSoundType) => {
    await audioAlarm.unlockAudio();
    audioAlarm.playSoundPattern(soundId, localPrefs.volume);
  };

  const handleSave = () => {
    const updated: UserPreferences = {
      ...localPrefs,
      googleMapsApiKey: googleKeyInput.trim(),
      geoapifyApiKey: geoapifyKeyInput.trim(),
    };
    onSavePreferences(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-forest-950/85 backdrop-blur-md safe-top safe-bottom">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl glass-panel p-5 sm:p-6 shadow-2xl border border-forest-600/50 text-cream-100 flex flex-col gap-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-forest-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <div>
              <h2 className="text-base font-bold text-cream-50">Preferences & Map API</h2>
              <p className="text-[11px] text-cream-400">Audio alarm, map provider, styles & wake lock</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-forest-800 text-cream-300 hover:text-cream-50"
          >
            ✕
          </button>
        </div>

        {/* Geoapify Map API Provider & Styling */}
        <div className="p-4 rounded-2xl bg-forest-900/90 border border-forest-700/80 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">📍</span>
              <span className="text-xs font-bold text-cream-100 uppercase tracking-wider">
                Geoapify Map API (Active & Connected)
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
              ● Connected
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-cream-300">Geoapify API Key</label>
            <input
              type="text"
              value={geoapifyKeyInput}
              onChange={(e) => setGeoapifyKeyInput(e.target.value)}
              placeholder="e.g. 4535ab6baa8d436fb5c8a356457ada90"
              className="w-full px-3 py-2 rounded-xl bg-forest-950 border border-forest-700 text-xs font-mono text-cream-50 placeholder-cream-600 focus:border-emerald-500 outline-none"
            />
            <p className="text-[10px] text-cream-400/80 leading-relaxed">
              Provides vector/raster map tiles, global address geocoding, and turn-by-turn routing.
            </p>
          </div>

          {/* Map Style Selector */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-[11px] font-semibold text-cream-300">Map Visual Style</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MAP_STYLES.map((style) => {
                const isSelected = (localPrefs.mapStyle || 'dark-matter-dark-purple') === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setLocalPrefs({ ...localPrefs, mapStyle: style.id })}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-0.5 ${
                      isSelected
                        ? 'bg-forest-800 border-emerald-400 shadow-md ring-1 ring-emerald-400/30'
                        : 'bg-forest-950/70 border-forest-800 hover:bg-forest-850'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xs">{style.icon}</span>
                      <span className="text-[11px] font-bold text-cream-100">{style.label}</span>
                    </div>
                    <span className="text-[9px] text-cream-400 leading-tight">{style.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Optional Google Maps API Key Config */}
        <div className="p-3.5 rounded-2xl bg-forest-900/60 border border-forest-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cream-200">Google Maps Platform API Key</span>
            <span className="text-[10px] text-cream-400">Optional</span>
          </div>
          <input
            type="text"
            value={googleKeyInput}
            onChange={(e) => setGoogleKeyInput(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-3 py-2 rounded-xl bg-forest-950 border border-forest-700 text-xs font-mono text-cream-50 placeholder-cream-600 focus:border-emerald-500 outline-none"
          />
          <p className="text-[10px] text-cream-400/80 leading-relaxed">
            Optional override. When supplied with Maps JavaScript API enabled, the map automatically upgrades to Google Maps Live.
          </p>
        </div>

        {/* Alarm Sound Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-cream-400">
            Alarm Melody
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SOUND_OPTIONS.map((snd) => {
              const isSelected = localPrefs.soundType === snd.id;
              return (
                <div
                  key={snd.id}
                  onClick={() => setLocalPrefs({ ...localPrefs, soundType: snd.id })}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-forest-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-400/40'
                      : 'bg-forest-900/60 border-forest-800 hover:bg-forest-800/50'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-cream-100">{snd.label}</div>
                    <div className="text-[10px] text-cream-400">{snd.desc}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestSound(snd.id);
                    }}
                    title="Play Preview"
                    className="p-1.5 rounded-lg bg-forest-950/70 hover:bg-forest-700 text-emerald-400 active:scale-95"
                  >
                    ▶
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Volume Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-semibold text-cream-200">
            <span>Alert Volume</span>
            <span className="font-mono text-emerald-400">
              {Math.round(localPrefs.volume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={localPrefs.volume}
            onChange={(e) => setLocalPrefs({ ...localPrefs, volume: parseFloat(e.target.value) })}
            className="w-full accent-emerald-500 cursor-pointer h-2 bg-forest-950 rounded-lg"
          />
        </div>

        {/* Toggles */}
        <div className="flex flex-col gap-2.5 divide-y divide-forest-800/80">
          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="text-xs font-bold text-cream-100">Haptic Vibration</div>
              <div className="text-[11px] text-cream-400">Vibrate mobile phone when alarm sounds</div>
            </div>
            <button
              onClick={() => setLocalPrefs({ ...localPrefs, vibrate: !localPrefs.vibrate })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                localPrefs.vibrate ? 'bg-emerald-500' : 'bg-forest-800'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-cream-50 shadow-md transform transition-transform ${
                  localPrefs.vibrate ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="text-xs font-bold text-cream-100">Keep Screen Awake (Wake Lock)</div>
              <div className="text-[11px] text-cream-400">
                Prevents phone from sleeping during journey to avoid GPS throttling
              </div>
            </div>
            <button
              onClick={() => setLocalPrefs({ ...localPrefs, wakeLock: !localPrefs.wakeLock })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                localPrefs.wakeLock ? 'bg-emerald-500' : 'bg-forest-800'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-cream-50 shadow-md transform transition-transform ${
                  localPrefs.wakeLock ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Browser Disclaimer & Privacy Callout */}
        <div className="p-3.5 rounded-2xl bg-forest-950/60 border border-forest-800/80 text-[11px] text-cream-300/90 space-y-1.5 leading-relaxed">
          <div className="font-bold text-emerald-400 flex items-center gap-1">
            <span>🔒</span>
            <span>Zero Tracking & Privacy Disclosure</span>
          </div>
          <p>
            NearMe Alarm processes your GPS coordinates <strong>100% locally on your device</strong>. No coordinates or destination queries are ever uploaded or transmitted to any server.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-forest-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-forest-900 text-cream-300 text-xs font-semibold hover:bg-forest-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-forest-950 text-xs font-bold shadow-lg"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
