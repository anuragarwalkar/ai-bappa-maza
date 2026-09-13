import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to handle PWA installation lifecycle and prompts
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  // Check if currently running in standalone mode (already installed)
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser's mini-infobar on mobile
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      console.log('🎉 [PWA] App installed successfully');
      setDeferredPrompt(null);
      setIsInstalled(true);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] Install prompt outcome: ${outcome}`);
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.warn('[PWA] Error showing install prompt:', err);
    }
    return false;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !window.MSStream;

  const isInstallable = Boolean(deferredPrompt) && !isInstalled && !isDismissed;
  const showIOSHint = isIOS && !isInstalled && !isDismissed;

  return {
    isInstallable,
    isInstalled,
    showIOSHint,
    installedSuccess,
    promptInstall,
    dismiss
  };
}
