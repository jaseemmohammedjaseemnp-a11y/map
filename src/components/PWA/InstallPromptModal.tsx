import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPromptModal: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(checkStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture beforeinstallprompt for Android Chrome / Chromium
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (isStandalone) {
    return null; // Already installed as PWA!
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
      setShowModal(false);
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {/* Floating Install App Chip (Only if not standalone) */}
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel text-xs font-semibold text-cream-100 hover:text-emerald-400 border border-emerald-500/30 hover:border-emerald-400 shadow-lg active:scale-95 transition-all"
        title="Install as App on Home Screen"
      >
        <span className="text-emerald-400">📲</span>
        <span>Install App</span>
      </button>

      {/* Guide Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/85 backdrop-blur-md safe-top safe-bottom">
          <div className="w-full max-w-sm rounded-3xl glass-panel p-6 shadow-2xl border border-forest-600 text-cream-100 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-forest-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📲</span>
                <h3 className="font-bold text-cream-50">Add to Home Screen</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full text-cream-300 hover:text-cream-50"
              >
                ✕
              </button>
            </div>

            {isIOS ? (
              <div className="flex flex-col gap-3 text-xs leading-relaxed text-cream-200">
                <p>To run NearMe Alarm in fullscreen mode with fast launch on iOS Safari:</p>
                <div className="p-3 rounded-2xl bg-forest-900 border border-forest-800 flex items-center gap-3">
                  <span className="text-lg">1️⃣</span>
                  <span>Tap the <strong>Share button</strong> in Safari’s bottom toolbar</span>
                </div>
                <div className="p-3 rounded-2xl bg-forest-900 border border-forest-800 flex items-center gap-3">
                  <span className="text-lg">2️⃣</span>
                  <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                </div>
                <div className="p-3 rounded-2xl bg-forest-900 border border-forest-800 flex items-center gap-3">
                  <span className="text-lg">3️⃣</span>
                  <span>Tap <strong>Add</strong> in the top right corner</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-xs leading-relaxed text-cream-200">
                <p>To install NearMe Alarm as an app on your Android device:</p>
                <div className="p-3 rounded-2xl bg-forest-900 border border-forest-800 flex items-center gap-3">
                  <span className="text-lg">1️⃣</span>
                  <span>Tap your browser's menu (three dots <strong>⋮</strong>)</span>
                </div>
                <div className="p-3 rounded-2xl bg-forest-900 border border-forest-800 flex items-center gap-3">
                  <span className="text-lg">2️⃣</span>
                  <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-forest-950 font-bold text-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
