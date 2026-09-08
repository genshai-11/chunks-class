import { useEffect, useRef, useState } from 'react';
import { PresentationShortcutConfig } from '../types';
import { shortcutConfigService } from '../services/shortcutConfigService';

export interface ClickerHandlers {
  onNext: () => void;
  onPrev: (options?: { playAudio?: boolean }) => void;
  onToggleBlackout: () => void;
  onToggleSubtitle: () => void;
  onReplayAudio: () => void;
  onTogglePartsDrawer?: () => void;
  onToggleChunkList?: () => void;
  onToggleFullscreen?: () => void;
  onSetLoop?: (count: number) => void;
  isModalOpen?: boolean;
  mode?: 'focus' | 'improv';
}

export function usePresenterClicker(handlers: ClickerHandlers, enabled: boolean = true) {
  const handlersRef = useRef<ClickerHandlers>(handlers);
  handlersRef.current = handlers;
  const prevClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reactive shortcut configuration
  const [config, setConfig] = useState<PresentationShortcutConfig>(() => shortcutConfigService.getConfig());
  const configRef = useRef<PresentationShortcutConfig>(config);
  configRef.current = config;

  useEffect(() => {
    const unsub = shortcutConfigService.subscribe(() => {
      const latest = shortcutConfigService.getConfig();
      setConfig(latest);
      configRef.current = latest;
    });
    return unsub;
  }, []);

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

      const curConfig = configRef.current;
      const kb = curConfig.keyBindings;

      // Prevent default for common navigation/presentation keys to stop page scrolling or refreshing
      const allPreventCodes = [
        'PageDown', 'PageUp', 'ArrowRight', 'ArrowLeft', 'Space', 'F5', 'F11',
        ...(kb.next || []),
        ...(kb.prev || []),
        ...(kb.fullscreen || [])
      ];
      if (allPreventCodes.includes(e.code)) {
        e.preventDefault();
      }

      const h = handlersRef.current;
      const mode = h.mode || 'focus';
      const behavior = mode === 'improv' ? curConfig.improvMode : curConfig.focusMode;

      // Check Next action
      if (kb.next?.includes(e.code)) {
        if (prevClickTimerRef.current) {
          clearTimeout(prevClickTimerRef.current);
          prevClickTimerRef.current = null;
        }
        h.onNext();
        return;
      }

      // Check Prev action (with optional double-press replay)
      if (kb.prev?.includes(e.code)) {
        if (behavior.enableDoublePressReplay) {
          if (prevClickTimerRef.current) {
            // Double-press detected within timeout: cancel timer and replay audio!
            clearTimeout(prevClickTimerRef.current);
            prevClickTimerRef.current = null;
            h.onReplayAudio();
          } else {
            // First press: start timer; invoke onPrev if no second press occurs
            prevClickTimerRef.current = setTimeout(() => {
              prevClickTimerRef.current = null;
              handlersRef.current.onPrev({ playAudio: behavior.playAudioOnPrev });
            }, behavior.doublePressTimeoutMs || 380);
          }
        } else {
          // Immediate execution without delay
          if (prevClickTimerRef.current) {
            clearTimeout(prevClickTimerRef.current);
            prevClickTimerRef.current = null;
          }
          h.onPrev({ playAudio: behavior.playAudioOnPrev });
        }
        return;
      }

      // Check Replay action
      if (kb.replay?.includes(e.code)) {
        h.onReplayAudio();
        return;
      }

      // Check Blackout action
      if (kb.blackout?.includes(e.code)) {
        h.onToggleBlackout();
        return;
      }

      // Check Subtitle action
      if (kb.subtitle?.includes(e.code)) {
        h.onToggleSubtitle();
        return;
      }

      // Check Drawer action
      if (kb.drawer?.includes(e.code)) {
        if (h.onTogglePartsDrawer) {
          h.onTogglePartsDrawer();
        } else if (h.onToggleChunkList) {
          h.onToggleChunkList();
        }
        return;
      }

      // Check Fullscreen action
      if (kb.fullscreen?.includes(e.code)) {
        h.onToggleFullscreen?.();
        return;
      }

      // Check Digit1 action
      if (kb.digit1?.includes(e.code) || e.code === 'Digit1' || e.code === 'Numpad1') {
        h.onSetLoop?.(1);
        return;
      }

      // Check Digit2 action
      if (kb.digit2?.includes(e.code) || e.code === 'Digit2' || e.code === 'Numpad2') {
        h.onSetLoop?.(2);
        return;
      }

      // Check Digit3 action
      if (kb.digit3?.includes(e.code) || e.code === 'Digit3' || e.code === 'Numpad3') {
        h.onSetLoop?.(3);
        return;
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
  }, [enabled]);
}
