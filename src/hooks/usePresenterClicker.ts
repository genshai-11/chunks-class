import { useEffect } from 'react';

export interface ClickerHandlers {
  onNext: () => void;
  onPrev: () => void;
  onToggleBlackout: () => void;
  onToggleSubtitle: () => void;
  onReplayAudio: () => void;
  onTogglePartsDrawer?: () => void;
  onToggleFullscreen?: () => void;
  onSetLoop?: (count: number) => void;
}

export function usePresenterClicker(handlers: ClickerHandlers, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting when user is typing in an input or textarea
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (['PageDown', 'PageUp', 'ArrowRight', 'ArrowLeft', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'PageDown':
        case 'ArrowRight':
        case 'Space':
          handlers.onNext();
          break;
        case 'PageUp':
        case 'ArrowLeft':
          handlers.onPrev();
          break;
        case 'KeyB':
        case 'Period':
          handlers.onToggleBlackout();
          break;
        case 'KeyV':
          handlers.onToggleSubtitle();
          break;
        case 'KeyR':
          handlers.onReplayAudio();
          break;
        case 'KeyP':
          if (handlers.onTogglePartsDrawer) {
            handlers.onTogglePartsDrawer();
          }
          break;
        case 'KeyF':
        case 'F5':
          e.preventDefault();
          if (handlers.onToggleFullscreen) {
            handlers.onToggleFullscreen();
          }
          break;
        case 'Digit1':
          if (handlers.onSetLoop) handlers.onSetLoop(1);
          break;
        case 'Digit2':
          if (handlers.onSetLoop) handlers.onSetLoop(2);
          break;
        case 'Digit3':
          if (handlers.onSetLoop) handlers.onSetLoop(3);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, enabled]);
}
