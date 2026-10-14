import React, { useState, useEffect, useRef, useCallback } from "react";
import type {
  Destination,
  Coordinates,
  JourneyStatus,
  UserPreferences,
  TravelMode,
  MapTileStyle,
} from "./types";
import {
  calculateHaversineDistance,
  verifyArrivalCondition,
} from "./utils/geo";
import {
  loadUserPreferences,
  saveUserPreferences,
  saveLastDestination,
} from "./utils/storage";
import { audioAlarm } from "./services/audioAlarm";
import { wakeLockService } from "./services/wakeLock";
import { useGeolocation } from "./hooks/useGeolocation";
import { usePageVisibility } from "./hooks/usePageVisibility";
import { reverseGeocodeGeoapify } from "./services/geoapifyService";
import { getDirections, generateFallbackSteps, type RouteResult } from "./services/routingService";
import { buildRouteGeometry, getActiveStepIndex } from "./utils/travelEngine";

import { Header } from "./components/Header/Header";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { MapContainer } from "./components/Map/MapContainer";
import { DestinationSearch } from "./components/Search/DestinationSearch";
import { JourneyAlarmCard } from "./components/Journey/JourneyAlarmCard";
import { JourneyProgressBar } from "./components/Journey/JourneyProgressBar";
import { ArrivalAlertScreen } from "./components/Arrival/ArrivalAlertScreen";
import { TravelingDirectionsHUD } from "./components/Navigation/TravelingDirectionsHUD";
import { SettingsModal } from "./components/Settings/SettingsModal";
import { SavedPlacesModal } from "./components/Saved/SavedPlacesModal";
import { HistoryModal } from "./components/History/HistoryModal";
import { ChangeLocationPrompt } from "./components/Map/ChangeLocationPrompt";

export const App: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadUserPreferences());
  const [selectedRadius, setSelectedRadius] = useState<number>(() => preferences.radius || 200);
  const [activeTab, setActiveTab] = useState<"map" | "saved" | "history" | "settings">("map");
  const [mapType, setMapType] = useState<"map" | "satellite">("map");

  const [journeyStatus, setJourneyStatus] = useState<JourneyStatus>("idle");
  const [origin, setOrigin] = useState<Destination | null>(null);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [stops, setStops] = useState<Destination[]>([]);
  const [pendingPlace, setPendingPlace] = useState<Destination | null>(null);
  const [isChangePromptOpen, setIsChangePromptOpen] = useState<boolean>(false);
  const [travelMode, setTravelMode] = useState<TravelMode>("driving");
  const [routeInfo, setRouteInfo] = useState<RouteResult | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);

  const [distanceToDestMeters, setDistanceToDestMeters] = useState<number | null>(null);
  const [remainingDistance, setRemainingDistance] = useState<number>(0);
  const [remainingDuration, setRemainingDuration] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [arrivalDistance, setArrivalDistance] = useState<number>(0);
  const [gpsHeading, setGpsHeading] = useState<number>(0);
  const [gpsSpeedKmh, setGpsSpeedKmh] = useState<number>(0);

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSavedPlacesOpen, setIsSavedPlacesOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [_isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(false);

  const routeGeomRef = useRef<ReturnType<typeof buildRouteGeometry> | null>(null);
  const arrivalFiredRef = useRef<boolean>(false);

  const {
    currentPosition,
    readingsHistory,
    error: gpsError,
    isWatching,
    startWatching,
    stopWatching,
    requestCurrentLocation,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
    bufferSize: 15,
  });

  const { isVisible: _isVisible } = usePageVisibility();

  useEffect(() => {
    requestCurrentLocation().catch(() => {});
  }, [requestCurrentLocation]);

  const cpLat = currentPosition?.lat ?? null;
  const cpLng = currentPosition?.lng ?? null;
  const cpAccuracy = currentPosition?.accuracy ?? null;

  useEffect(() => {
    if (cpLat === null || cpLng === null) return;
    if (journeyStatus === "tracking") return;
    setOrigin((prev) => {
      if (prev && prev.name !== "Your location") return prev;
      if (
        prev &&
        Math.abs(prev.lat - (cpLat as number)) < 0.00035 &&
        Math.abs(prev.lng - (cpLng as number)) < 0.00035
      ) {
        return prev;
      }
      return {
        name: "Your location",
        address: `GPS accuracy +-${Math.round(cpAccuracy ?? 0)}m`,
        lat: cpLat as number,
        lng: cpLng as number,
      };
    });
  }, [cpLat, cpLng, cpAccuracy, journeyStatus]);

  useEffect(() => {
    if (!currentPosition) return;
    if (currentPosition.heading !== null && currentPosition.heading !== undefined && !isNaN(currentPosition.heading)) {
      setGpsHeading(currentPosition.heading);
    }
    if (currentPosition.speed !== null && currentPosition.speed !== undefined && currentPosition.speed > 0) {
      setGpsSpeedKmh(Math.round(currentPosition.speed * 3.6 * 10) / 10);
    }
  }, [currentPosition]);

  const handleSavePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    setSelectedRadius(newPrefs.radius);
    saveUserPreferences(newPrefs);
  };

  const handleSelectRadius = (r: number) => {
    setSelectedRadius(r);
    const updated = { ...preferences, radius: r };
    setPreferences(updated);
    saveUserPreferences(updated);
  };

  const handleSelectDestination = (dest: Destination) => {
    setDestination(dest);
    saveLastDestination(dest);
    if (journeyStatus !== "tracking") {
      setJourneyStatus("idle");
    }
    arrivalFiredRef.current = false;
  };

  const handleSelectOrigin = (orig: Destination | null) => {
    if (journeyStatus === "tracking") return;
    setOrigin(orig);
    arrivalFiredRef.current = false;
  };

  const handleClearDestination = () => {
    setDestination(null);
    setStops([]);
    setPendingPlace(null);
    setIsChangePromptOpen(false);
    saveLastDestination(null);
    setRouteInfo(null);
    setDistanceToDestMeters(null);
    setRemainingDistance(0);
    setRemainingDuration(0);
    setCurrentStepIndex(0);
    arrivalFiredRef.current = false;
    if (journeyStatus === "tracking") {
      handleStopJourney();
    } else {
      setJourneyStatus("idle");
    }
  };

  const handleSwapPoints = () => {
    if (journeyStatus === "tracking") return;
    const tmp = origin;
    const tmpDest = destination;
    if (tmpDest) setOrigin(tmpDest);
    if (tmp) {
      setDestination(tmp);
      saveLastDestination(tmp);
    }
    arrivalFiredRef.current = false;
  };

  const handleMapSelectCoordinates = async (coords: Coordinates) => {
    let placeName = coords.lat.toFixed(5) + ", " + coords.lng.toFixed(5);
    let address: string | undefined;
    if (preferences.geoapifyApiKey) {
      const realAddress = await reverseGeocodeGeoapify(coords, preferences.geoapifyApiKey);
      if (realAddress) {
        placeName = realAddress.split(",")[0].trim();
        address = realAddress;
      }
    }
    const clickedPlace: Destination = { name: placeName, address, lat: coords.lat, lng: coords.lng };

    // Accidental click protection:
    // If no destination is set yet, directly set as destination.
    // If destination already exists, DO NOT accidentally overwrite it! Ask permission.
    if (!destination) {
      handleSelectDestination(clickedPlace);
      return;
    }

    setPendingPlace(clickedPlace);
    setIsChangePromptOpen(true);
  };

  const handleConfirmChangeDestination = () => {
    if (!pendingPlace) return;
    handleSelectDestination(pendingPlace);
    setPendingPlace(null);
    setIsChangePromptOpen(false);
  };

  const handleAddAsStop = () => {
    if (!pendingPlace) return;
    setStops((prev) => [...prev, pendingPlace]);
    setPendingPlace(null);
    setIsChangePromptOpen(false);
  };

  const handleConfirmChangeOrigin = () => {
    if (!pendingPlace) return;
    handleSelectOrigin(pendingPlace);
    setPendingPlace(null);
    setIsChangePromptOpen(false);
  };

  const handleCancelChangeLocation = () => {
    setPendingPlace(null);
    setIsChangePromptOpen(false);
  };

  const handleRemoveStop = (index: number) => {
    setStops((prev) => prev.filter((_, i) => i !== index));
  };

  const originLat = origin ? origin.lat : null;
  const originLng = origin ? origin.lng : null;
  const destLat = destination ? destination.lat : null;
  const destLng = destination ? destination.lng : null;

  useEffect(() => {
    if (journeyStatus === "tracking") return;
    if (!originLat || !originLng || !destLat || !destLng) {
      setRouteInfo(null);
      return;
    }
    let cancelled = false;
    setIsLoadingRoute(true);

    const waypoints = stops.map((s) => ({ lat: s.lat, lng: s.lng }));

    getDirections(
      { lat: originLat, lng: originLng },
      { lat: destLat, lng: destLng },
      travelMode,
      preferences.geoapifyApiKey,
      waypoints
    )
      .then((res) => {
        if (cancelled) return;
        setRouteInfo(res);
        setDistanceToDestMeters(res.distanceMeters);
        setRemainingDistance(res.distanceMeters);
        setRemainingDuration(res.durationSeconds);
        setCurrentStepIndex(0);
      })
      .catch(() => {
        if (cancelled) return;
        const allPoints = [
          { lat: originLat, lng: originLng },
          ...waypoints,
          { lat: destLat, lng: destLng },
        ];
        let totalD = 0;
        for (let i = 0; i < allPoints.length - 1; i++) {
          totalD += calculateHaversineDistance(allPoints[i], allPoints[i + 1]);
        }
        const d = Math.round(totalD);
        const secs = Math.round(d / (travelMode === "walking" ? 1.4 : travelMode === "bike" ? 4.5 : 11.1));
        setRouteInfo({
          distanceMeters: d,
          durationSeconds: secs,
          formattedDistance: d < 1000 ? d + " m" : (d / 1000).toFixed(1) + " km",
          formattedDuration: secs > 3600
            ? Math.floor(secs / 3600) + " hr " + Math.round((secs % 3600) / 60) + " min"
            : Math.round(secs / 60) + " min",
          coordinates: allPoints.map((p) => [p.lat, p.lng] as [number, number]),
          mode: travelMode,
          steps: generateFallbackSteps(d),
        });
        setDistanceToDestMeters(d);
        setRemainingDistance(d);
        setRemainingDuration(secs);
        setCurrentStepIndex(0);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRoute(false);
      });
    return () => { cancelled = true; };
  }, [originLat, originLng, destLat, destLng, stops, travelMode, preferences.geoapifyApiKey, journeyStatus]);

  const handleUnlockAudio = async () => {
    const ok = await audioAlarm.unlockAudio();
    setIsAudioUnlocked(ok);
    return ok;
  };

  const handleTestAlarmSound = async () => {
    await handleUnlockAudio();
    audioAlarm.playSoundPattern(preferences.soundType, preferences.volume);
  };

  const triggerArrival = useCallback((dist: number) => {
    if (arrivalFiredRef.current) return;
    arrivalFiredRef.current = true;
    setArrivalDistance(dist);
    setJourneyStatus("arrived");
    audioAlarm.startAlarmLoop(preferences.soundType, preferences.volume, preferences.vibrate);
  }, [preferences.soundType, preferences.volume, preferences.vibrate]);

  const handleStartJourney = async () => {
    if (!destination) return;
    if (!currentPosition && !origin) {
      alert("Waiting for GPS fix. Please enable location access.");
      return;
    }
    await handleUnlockAudio();
    if (preferences.wakeLock) await wakeLockService.requestWakeLock();
    if (routeInfo?.coordinates && routeInfo.coordinates.length > 1) {
      routeGeomRef.current = buildRouteGeometry(routeInfo.coordinates);
    } else {
      routeGeomRef.current = null;
    }
    arrivalFiredRef.current = false;
    setCurrentStepIndex(0);
    setJourneyStatus("tracking");
    startWatching();
  };

  const handleStopJourney = () => {
    setJourneyStatus("idle");
    stopWatching();
    audioAlarm.stopAlarm();
    wakeLockService.releaseWakeLock();
    routeGeomRef.current = null;
    arrivalFiredRef.current = false;
  };

  const handleStopAlarm = () => {
    audioAlarm.stopAlarm();
    setJourneyStatus("idle");
    stopWatching();
    wakeLockService.releaseWakeLock();
    routeGeomRef.current = null;
    arrivalFiredRef.current = false;
  };

  const handleSnooze = () => {
    audioAlarm.stopAlarm();
    arrivalFiredRef.current = false;
    setJourneyStatus("tracking");
  };

  // CORE: Real-GPS navigation update — NO simulation, purely device GPS
  useEffect(() => {
    if (journeyStatus !== "tracking" || !destination || !currentPosition) return;
    const pos = { lat: currentPosition.lat, lng: currentPosition.lng };
    const dest = { lat: destination.lat, lng: destination.lng };
    const distToDest = Math.round(calculateHaversineDistance(pos, dest));
    setDistanceToDestMeters(distToDest);
    setRemainingDistance(distToDest);
    const speedMps = (currentPosition.speed && currentPosition.speed > 0.5)
      ? currentPosition.speed
      : (travelMode === "walking" ? 1.2 : travelMode === "bike" ? 4.0 : 10.0);
    setRemainingDuration(Math.round(distToDest / speedMps));
    if (routeGeomRef.current && routeInfo?.steps && routeInfo.steps.length > 0) {
      const geom = routeGeomRef.current;
      const totalDist = geom.totalDistanceMeters;
      const distCovered = Math.max(0, totalDist - distToDest);
      const progress = totalDist > 0 ? Math.min(1, distCovered / totalDist) : 0;
      const stepIdx = getActiveStepIndex(routeInfo.steps, progress);
      setCurrentStepIndex(stepIdx);
    }
    if (!arrivalFiredRef.current) {
      if (distToDest <= selectedRadius) {
        if (distToDest <= selectedRadius * 0.7) {
          triggerArrival(distToDest);
          return;
        }
        const condition = verifyArrivalCondition(readingsHistory, dest, selectedRadius, 2, 200);
        if (condition.isArrived) {
          triggerArrival(condition.lastDistance);
        }
      }
    }
  }, [
    currentPosition, destination, journeyStatus, selectedRadius,
    travelMode, readingsHistory, routeInfo?.steps, triggerArrival,
  ]);

  const activeSteps = routeInfo?.steps?.length
    ? routeInfo.steps
    : generateFallbackSteps(distanceToDestMeters || 10000);

  const handleSelectNavTab = (tab: "map" | "saved" | "history" | "settings") => {
    setActiveTab(tab);
    if (tab === "saved") setIsSavedPlacesOpen(true);
    if (tab === "history") setIsHistoryOpen(true);
    if (tab === "settings") setIsSettingsOpen(true);
  };

  const currentMapStyle: MapTileStyle = mapType === "satellite" ? "satellite" : "osm-carto";
  const isTracking = journeyStatus === "tracking";
  const vehicleCoords: Coordinates | null = isTracking && currentPosition
    ? { lat: currentPosition.lat, lng: currentPosition.lng }
    : null;

  return (
    <div className="relative w-full h-[100dvh] flex flex-col overflow-hidden font-sans select-none bg-[#FFF8ED] text-[#14221d]">
      {gpsError && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-rose-600 text-white text-xs font-bold px-4 py-2 flex items-center gap-2">
          <span>GPS Error:</span>
          <span>{gpsError}</span>
        </div>
      )}

      {/* Clean Google Maps inspired Header */}
      <Header
        journeyStatus={journeyStatus}
        mapType={mapType}
        onChangeMapType={(type) => {
          setMapType(type);
          const updated = {
            ...preferences,
            mapStyle: type === "satellite" ? ("satellite" as MapTileStyle) : ("osm-carto" as MapTileStyle),
          };
          setPreferences(updated);
          saveUserPreferences(updated);
        }}
        onOpenMenu={() => setIsMenuOpen(true)}
        onSelectDestination={handleSelectDestination}
        geoapifyApiKey={preferences.geoapifyApiKey}
        currentPosition={currentPosition}
        gpsAccuracy={currentPosition?.accuracy}
        isWatchingGps={isWatching}
      />

      {/* Main Map & Navigation Layer */}
      <div className="flex-1 w-full h-full relative overflow-hidden flex">
        {/* Main Map Background: Takes entire screen */}
        <div className="absolute inset-0 z-0">
          <MapContainer
            currentPosition={currentPosition}
            origin={origin}
            destination={destination}
            stops={stops}
            routeCoordinates={routeInfo?.coordinates}
            routeInfo={routeInfo}
            radiusMeters={selectedRadius}
            isArrived={journeyStatus === "arrived"}
            onSelectCoordinates={handleMapSelectCoordinates}
            customApiKey={preferences.googleMapsApiKey}
            geoapifyApiKey={preferences.geoapifyApiKey}
            mapStyle={currentMapStyle}
            onOpenSettings={() => setIsSettingsOpen(true)}
            isTraveling={isTracking}
            travelMode={travelMode}
            travelingCoords={vehicleCoords}
            travelingHeading={gpsHeading}
          />
        </div>

        {/* Floating UI Layer */}
        <div className="relative z-10 w-full h-full pointer-events-none flex flex-col justify-between p-3 sm:p-5 max-w-[1920px] mx-auto">
          {/* Top Section */}
          <div className="flex items-start justify-between w-full">
            {/* Left: Destination Search Card (when not tracking) */}
            {!isTracking && (
              <div className="pointer-events-auto shrink-0 z-20 w-full sm:w-[380px] max-w-full overflow-y-auto max-h-[calc(100vh-6.5rem)] pb-4">
                <DestinationSearch
                  origin={origin}
                  onSelectOrigin={handleSelectOrigin}
                  destination={destination}
                  stops={stops}
                  onRemoveStop={handleRemoveStop}
                  onSelectDestination={handleSelectDestination}
                  onClearDestination={handleClearDestination}
                  currentPosition={currentPosition}
                  geoapifyApiKey={preferences.geoapifyApiKey}
                  travelMode={travelMode}
                  onChangeTravelMode={setTravelMode}
                  routeInfo={routeInfo}
                  isLoadingRoute={isLoadingRoute}
                  onSwapPoints={handleSwapPoints}
                  selectedRadius={selectedRadius}
                  onSelectRadius={handleSelectRadius}
                  onLocateUser={() => requestCurrentLocation()}
                  onStartJourney={handleStartJourney}
                  onTestAlarm={handleTestAlarmSound}
                  onSimulate={undefined}
                  isTracking={isTracking}
                />
              </div>
            )}

            {/* Top Center: Minimal Clean Navigation Card (when tracking) */}
            {isTracking && (
              <div className="pointer-events-auto w-full max-w-xl mx-auto z-20 transition-all duration-200">
                <TravelingDirectionsHUD
                  steps={activeSteps}
                  currentStepIndex={currentStepIndex}
                  currentSpeedKmh={gpsSpeedKmh}
                  onInstantArrival={() => triggerArrival(selectedRadius)}
                  isPaused={isPaused}
                  onTogglePause={() => setIsPaused((prev) => !prev)}
                  onStopJourney={handleStopJourney}
                  remainingDistanceMeters={remainingDistance}
                  remainingDurationSeconds={remainingDuration}
                />
              </div>
            )}
          </div>

          {/* Bottom Section: Journey Summary Card in Bottom-Left */}
          <div className="pointer-events-auto w-full flex flex-col lg:flex-row items-end justify-between gap-4 pb-2 z-20">
            {/* Compact Bottom-Left Journey Summary Card */}
            {destination && routeInfo && (
              <div className="w-full max-w-xl mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom-2 duration-250">
                <JourneyProgressBar
                  routeInfo={routeInfo}
                  distanceMeters={remainingDistance}
                  speedKmh={gpsSpeedKmh || 0}
                  travelMode={travelMode}
                  durationSeconds={remainingDuration}
                  simulationProgress={
                    routeInfo.distanceMeters > 0
                      ? Math.max(0, Math.min(1, 1 - (remainingDistance / routeInfo.distanceMeters)))
                      : 0.27
                  }
                />
              </div>
            )}

            {/* Approaching Destination Alarm Prompt (within 2x radius) */}
            {isTracking && distanceToDestMeters !== null && distanceToDestMeters <= selectedRadius * 2 && (
              <div className="w-full max-w-xs shrink-0 mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom-2 duration-250">
                <JourneyAlarmCard
                  currentPosition={currentPosition}
                  destination={destination}
                  selectedRadius={selectedRadius}
                  journeyStatus={journeyStatus}
                  onPlayAlarm={handleTestAlarmSound}
                  onStopJourney={handleStopJourney}
                  onClose={() => {}}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide-over Navigation Drawer */}
      <Sidebar
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeTab={activeTab}
        onSelectTab={handleSelectNavTab}
      />
      {journeyStatus === "arrived" && destination && (
        <ArrivalAlertScreen
          destination={destination}
          arrivalDistance={arrivalDistance}
          onStopAlarm={handleStopAlarm}
          onSnooze={handleSnooze}
        />
      )}
      <SavedPlacesModal isOpen={isSavedPlacesOpen} onClose={() => { setIsSavedPlacesOpen(false); setActiveTab("map"); }} onSelectDestination={handleSelectDestination} />
      <HistoryModal isOpen={isHistoryOpen} onClose={() => { setIsHistoryOpen(false); setActiveTab("map"); }} onSelectDestination={handleSelectDestination} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => { setIsSettingsOpen(false); setActiveTab("map"); }} preferences={preferences} onSavePreferences={handleSavePreferences} />
      
      {/* Accidental click protection confirmation modal */}
      <ChangeLocationPrompt
        isOpen={isChangePromptOpen}
        pendingPlace={pendingPlace}
        currentDestination={destination}
        currentOrigin={origin}
        onSetAsDestination={handleConfirmChangeDestination}
        onAddAsStop={handleAddAsStop}
        onSetAsOrigin={handleConfirmChangeOrigin}
        onCancel={handleCancelChangeLocation}
      />
    </div>
  );
};

export default App;
