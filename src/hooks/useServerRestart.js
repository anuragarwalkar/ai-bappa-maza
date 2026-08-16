import { useState, useRef, useCallback, useEffect } from 'react';
import { STRINGS } from '../constants/marathiStrings';
import { requestServerRestart, fetchHealth } from '../services/api';

/**
 * Hook to manage server restart flow, polling, modal state, and feedback toasts
 */
export function useServerRestart() {
  const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [restartMessage, setRestartMessage] = useState(null); // { type: 'info' | 'success' | 'error', text: string }

  const pollIntervalRef = useRef(null);

  const openRestartModal = useCallback(() => {
    setIsRestartModalOpen(true);
  }, []);

  const closeRestartModal = useCallback(() => {
    if (!isRestarting) {
      setIsRestartModalOpen(false);
    }
  }, [isRestarting]);

  const restartServer = useCallback(async () => {
    if (isRestarting) return;
    setIsRestarting(true);
    setRestartMessage({ type: 'info', text: STRINGS.RESTART_IN_PROGRESS });

    try {
      await requestServerRestart();
    } catch (e) {
      console.warn('Restart request sent (server may reload immediately):', e);
    }

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    let attempts = 0;
    const maxAttempts = 25;

    setTimeout(() => {
      pollIntervalRef.current = setInterval(async () => {
        attempts++;
        try {
          const health = await fetchHealth();
          if (health && health.status === 'ok') {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setIsRestarting(false);
            setRestartMessage({ type: 'success', text: STRINGS.RESTART_SUCCESS });

            setTimeout(() => {
              setIsRestartModalOpen(false);
            }, 800);

            setTimeout(() => {
              setRestartMessage(null);
            }, 3500);
          }
        } catch (err) {
          if (attempts >= maxAttempts) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setIsRestarting(false);
            setRestartMessage({ type: 'error', text: STRINGS.RESTART_FAILED });
            setTimeout(() => {
              setRestartMessage(null);
            }, 4000);
          }
        }
      }, 600);
    }, 800);
  }, [isRestarting]);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  return {
    isRestartModalOpen,
    isRestarting,
    restartMessage,
    openRestartModal,
    closeRestartModal,
    restartServer
  };
}
