import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone } from 'lucide-react';

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('pwa_install_dismissed');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    if (isDismissed || isStandalone) return;

    // iOS detection
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android / Desktop Chrome
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    sessionStorage.setItem('pwa_install_dismissed', 'true');
  };

  if (dismissed || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-4 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-96"
        data-testid="pwa-install-prompt"
      >
        <div className="bg-[#111827]/95 backdrop-blur-xl border border-brand/20 rounded-2xl p-4 shadow-[0_0_40px_rgba(0,188,212,0.15)]">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6 text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-white">Install ORBITRADE</h3>
                <button
                  onClick={handleDismiss}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                  data-testid="pwa-dismiss"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                {isIOS
                  ? 'Tap the Share button, then "Add to Home Screen" for the full app experience.'
                  : 'Get instant access with faster loading and a native app experience.'}
              </p>
              {!isIOS && deferredPrompt ? (
                <button
                  onClick={handleInstall}
                  className="w-full py-2.5 rounded-xl bg-brand text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-brand-hover transition-all hover:shadow-[0_0_20px_rgba(0,188,212,0.3)]"
                  data-testid="pwa-install-btn"
                >
                  <Download className="w-3.5 h-3.5" /> Install App
                </button>
              ) : isIOS ? (
                <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-lg">&#x2191;</span>
                  <span className="text-[11px] text-gray-300">Tap Share then <strong className="text-white">"Add to Home Screen"</strong></span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallPrompt;
