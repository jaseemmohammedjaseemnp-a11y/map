# NearMe Alarm 🔔📍
> **Audible GPS proximity alarm for bus, train, bicycle, car, and walking commutes.** Never miss your stop again.

NearMe Alarm is a mobile-first, production-ready Progressive Web Application (PWA) designed to wake you up or alert you with repeating audible chimes and haptic vibrations before reaching your destination.

---

## 🎨 Visual Design & Aesthetics

- **Color Palette:** Dark Forest Green (`#06130d`, `#0b1d16`, `#11291f`, `#1f4837`) combined with Warm Cream (`#fbf7ee`, `#ebdcc4`, `#decbb4`) and emerald/amber accents.
- **Typography:** Modern serif display headers with *Fraunces* and high-legibility interface typography with *Plus Jakarta Sans*.
- **Mobile-First Ergonomics:** Sleek bottom navigation HUD with distance telemetry, GPS accuracy indicators, tap-to-select maps, and emergency full-screen alarm dismissal controls.
- **Glassmorphism:** Layered frosted glass panels with blur backdrop filters (`backdrop-blur-md`).

---

## 🚀 Key Features

1. **Interactive Map & Destination Selection:**
   - Powered by Google Maps JavaScript API with Places Autocomplete.
   - Built-in dark vector fallback map when no API key is supplied or when offline.
   - Tap anywhere on the map to set or adjust destinations.
   - Quick one-tap transit destination presets (Central Station, Metro Terminal, Airport Express).
2. **Custom Arrival Radius:**
   - Adjustable radius pills: `100 m`, `250 m`, `500 m`, `1 km`, and `2 km`.
   - Real-time geodesic circle rendering on map with pulse feedback on arrival.
3. **Live Geolocation & Jitter Rejection:**
   - Real-time GPS tracking via `navigator.geolocation.watchPosition()`.
   - Haversine distance formula with live distance readout and estimated time of arrival (ETA).
   - Multi-fix consecutive buffer verification to filter out satellite drift and GPS jumps.
4. **Web Audio Alarm & Vibration Engine:**
   - Synthesizes 4 distinct sound signatures directly in the browser via Web Audio API: *Chime Bell*, *Sonar Radar*, *Urgent Siren*, and *Subtle Pulse*.
   - Explicit user-gesture activation unlocking `AudioContext`.
   - Synchronized repeating haptic vibrations (`navigator.vibrate`) on supported Android devices.
   - Test Sound button to verify speaker volume before falling asleep.
5. **Destination Reached Screen:**
   - Full-screen high-contrast alarm alert with pulsing radar animations and confetti.
   - Large, easy-to-hit **STOP ALARM** button and **Snooze (+3 min)** button.
6. **Manual Journey Simulation Mode:**
   - Full simulator for testing arrivals without having to travel.
   - "Instant Arrival" test button and continuous speed slider (Walk 5 km/h, Bus 35 km/h, Train 80 km/h).
7. **PWA Installation Support:**
   - Offline app shell caching via custom Service Worker (`/sw.js`).
   - Web App Manifest (`manifest.webmanifest`) and custom SVG vector icons.
   - In-app Add to Home Screen instructions for Android Chrome and iPhone Safari.
8. **Screen Wake Lock & Background Interruption Detection:**
   - Keeps mobile displays active during journeys via `navigator.wakeLock.request('screen')`.
   - Visibility change tracking (`document.visibilityState`) with warnings if throttled.

---

## ⚠️ Critical Mobile Browser Limitations & Privacy

| Feature | Browser Reality & NearMe Alarm Handling |
| :--- | :--- |
| **Background GPS** | Mobile operating systems (iOS Safari & Android Chrome) aggressively freeze or throttle JavaScript execution, timers, and GPS when a tab is backgrounded or the phone is locked. A Service Worker cannot continuously run `watchPosition` in the background. **NearMe Alarm uses the Screen Wake Lock API to keep the screen awake and provides clear foreground banners.** |
| **Audible Alarm** | Browsers block audio playback without prior user interaction. **NearMe Alarm requests audio activation through an explicit user gesture** (when clicking "Start Journey" or "Test Sound"). |
| **Privacy Disclosure** | **100% on-device processing.** GPS coordinates are strictly calculated locally in your browser memory and are **never** uploaded or stored on any remote server. |

---

## 🛠️ Technology Stack

- **Framework:** React 19 + TypeScript (Strict Type Safety)
- **Styling:** Tailwind CSS (Custom Dark Forest & Cream theme)
- **Maps:** Google Maps JavaScript API + Places API (via `@googlemaps/js-api-loader`) with OpenStreetMap dark vector fallback
- **Audio:** Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`)
- **PWA:** Service Worker (`sw.js`) + Web App Manifest
- **Icons:** Custom SVG icon suite + Lucide icons
- **Build Tool:** Vite 8

---

## 📦 Getting Started Locally

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+

### Installation

```bash
# 1. Clone repository
git clone <your-repo-url>
cd map

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env.local

# 4. Start local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🔑 Map API Configuration

NearMe Alarm comes connected out-of-the-box with **Geoapify API** and also supports **Google Maps Platform**:

### 1. Geoapify API (Connected by default)
- **Features:** Crisp Dark Matter vector/raster tiles (`@2x` Retina), Yellow Roads, OSM Carto, Positron, global Geocoding search & reverse geocoding, and multimodal routing (transit, driving, walking, cycling) with distance (km) and travel duration.
- **Environment Variable:**
  ```bash
  VITE_GEOAPIFY_API_KEY=4535ab6baa8d436fb5c8a356457ada90
  ```
- **In-App Controls:** Switch between *Dark Purple*, *Dark Yellow*, *OSM Carto*, *Klokan Basic*, and *Positron* styles anytime from the in-app Settings modal (⚙️).

### 2. Google Maps Platform (Optional)
- To enable Google Maps Satellite, dark vector terrain, and Google Places Autocomplete:
  1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
  2. Enable **Maps JavaScript API**, **Places API**, and **Geocoding API**.
  3. Create an API Key and add it to `.env.local` or directly inside the in-app Settings modal:
     ```bash
     VITE_GOOGLE_MAPS_API_KEY=AIzaSyYourSecretKeyHere
     ```

---

## 🚢 Deploying to Vercel

1. Push your code to GitHub, GitLab, or Bitbucket.
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your repository.
4. Configure Build Settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add Environment Variables:
   - `VITE_GOOGLE_MAPS_API_KEY` = your Google Maps API key
6. Click **Deploy**. Your PWA is live with automatic SSL!

---

## 📱 Manual Test Checklist

### A. Android Chrome Test Checklist

- [ ] **1. PWA Installation:**
  - Open site on Android Chrome over HTTPS.
  - Verify "Install App" button appears in the header.
  - Click "Install App" and confirm home screen shortcut is created with the NearMe Alarm icon.
- [ ] **2. Geolocation Permissions:**
  - Launch app from home screen.
  - When prompted, grant "While using the app" location permissions.
  - Verify your current location appears as a pulsing green dot with an accuracy circle on the map.
- [ ] **3. Audio Activation & Volume:**
  - Tap the **Test Sound** button.
  - Confirm the harmonic chime plays loudly through phone speakers.
- [ ] **4. Radius & Destination Selection:**
  - Select "City Metro Hub" or tap a custom location 600m away on the map.
  - Select the `250 m` radius pill. Confirm the radius circle updates on the map.
- [ ] **5. Journey Simulation & Alarm Trigger:**
  - Tap **Test Simulator** (gamepad icon) ➔ **Trigger Instant Arrival**.
  - Verify:
    - Screen flashes red and displays "Wake up! You're here".
    - Continuous loud repeating alert sound plays.
    - Phone vibrates in rhythmic pulses (`navigator.vibrate`).
    - Confetti bursts on screen.
  - Tap **STOP ALARM** and verify the alarm and vibration stop immediately.
- [ ] **6. Screen Wake Lock:**
  - Tap **Start Journey Alarm**.
  - Keep the app in the foreground and verify the phone screen does not auto-lock while travelling.

---

### B. iPhone Safari Test Checklist

- [ ] **1. Add to Home Screen (iOS PWA):**
  - Open site in Safari on iOS.
  - Tap the Safari **Share button** (square with up arrow).
  - Tap **Add to Home Screen**, then tap **Add**.
  - Launch the app from the iOS home screen and verify it runs in standalone mode (no browser URL bar).
- [ ] **2. Location Permission:**
  - Grant location permissions when prompted. Verify GPS telemetry shows current coordinates.
- [ ] **3. Web Audio Gesture Unlock:**
  - iOS requires an explicit user gesture to activate `AudioContext`.
  - Tap **Start Journey Alarm** or **Test Sound**. Confirm sound output works through the iPhone speaker.
- [ ] **4. Foreground Journey Tracking:**
  - Start a journey with a destination set.
  - Verify the HUD displays real-time distance and estimated arrival time.
- [ ] **5. Background Interruption Warning:**
  - Switch to another app or home screen for 5 seconds, then return to Safari.
  - Confirm the warning banner indicates: *"Tab was paused while hidden. GPS refreshed now. Foreground Recommended."*
- [ ] **6. Arrival Alert Dismissal:**
  - Trigger arrival via simulation or live transit entry.
  - Verify the **STOP ALARM** button cleanly terminates the Web Audio oscillator loop.
