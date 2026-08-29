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
          h.onNext();
          break;
        case 'PageUp':
        case 'ArrowLeft':
          h.onPrev();
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
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]); // Attached ONCE per enablement change — eliminates render thrashing!
}
