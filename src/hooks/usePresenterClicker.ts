import { useEffect, useRef } from 'react';

export interface ClickerHandlers {
  onNext: () => void;
  onPrev: () => void;
  onToggleBlackout: () => void;
  onToggleSubtitle: () => void;
  onReplayAudio: () => void;
  onTogglePartsDrawer?: () => void;
  onToggleChunkList?: () => void;
  onToggleFullscreen?: () => void;
  onSetLoop?: (count: number) => void;
  isModalOpen?: boolean;
}

export function usePresenterClicker(handlers: ClickerHandlers, enabled: boolean = true) {
  const handlersRef = useRef<ClickerHandlers>(handlers);
  handlersRef.current = handlers;
  const prevClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Guard against typing inside input, textarea, select
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      // 2. Guard against clicker actions when a Modal / Overlay is open
      if (handlersRef.current.isModalOpen && e.code !== 'Escape') {
        return;
      }

      if (['PageDown', 'PageUp', 'ArrowRight', 'ArrowLeft', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      const h = handlersRef.current;
      switch (e.code) {
        case 'PageDown':
        case 'ArrowRight':
        case 'Space':
          if (prevClickTimerRef.current) {
            clearTimeout(prevClickTimerRef.current);
            prevClickTimerRef.current = null;
          }
          h.onNext();
          break;
        case 'PageUp':
        case 'ArrowLeft':
          if (prevClickTimerRef.current) {
            // Double-click detected within 380ms: cancel pending timer and replay audio!
            clearTimeout(prevClickTimerRef.current);
            prevClickTimerRef.current = null;
            h.onReplayAudio();
          } else {
            // First press: start 380ms timer; invoke onPrev if no second press occurs
            prevClickTimerRef.current = setTimeout(() => {
              prevClickTimerRef.current = null;
              handlersRef.current.onPrev();
            }, 380);
          }
          break;
        case 'KeyB':
        case 'Period':
          h.onToggleBlackout();
          break;
        case 'KeyV':
          h.onToggleSubtitle();
          break;
        case 'KeyR':
          h.onReplayAudio();
          break;
        case 'KeyP':
          h.onTogglePartsDrawer?.();
          break;
        case 'KeyL':
          h.onToggleChunkList?.();
          break;
        case 'KeyF':
        case 'F5':
          e.preventDefault();
          h.onToggleFullscreen?.();
          break;
        case 'Digit1':
          h.onSetLoop?.(1);
          break;
        case 'Digit2':
          h.onSetLoop?.(2);
          break;
        case 'Digit3':
          h.onSetLoop?.(3);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (prevClickTimerRef.current) {
        clearTimeout(prevClickTimerRef.current);
        prevClickTimerRef.current = null;
      }
    };
  }, [enabled]); // Attached ONCE per enablement change — eliminates render thrashing!
}
