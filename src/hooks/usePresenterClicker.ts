import { useEffect, useRef, useState } from 'react';
import { PresentationShortcutConfig, ClickerAction } from '../types';
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

  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingKeyRef = useRef<string | null>(null);

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

  const dispatchAction = (action: ClickerAction) => {
    const h = handlersRef.current;
    const curConfig = configRef.current;
    const mode = h.mode || 'focus';
    const behavior = mode === 'improv' ? curConfig.improvMode : curConfig.focusMode;

    switch (action) {
      case 'next':
        h.onNext();
        break;
      case 'prev':
        h.onPrev({ playAudio: behavior.playAudioOnPrev });
        break;
      case 'replay':
        h.onReplayAudio();
        break;
      case 'blackout':
        h.onToggleBlackout();
        break;
      case 'subtitle':
        h.onToggleSubtitle();
        break;
      case 'drawer':
        if (h.onTogglePartsDrawer) {
          h.onTogglePartsDrawer();
        } else if (h.onToggleChunkList) {
          h.onToggleChunkList();
        }
        break;
      case 'fullscreen':
        h.onToggleFullscreen?.();
        break;
      case 'digit1':
        h.onSetLoop?.(1);
        break;
      case 'digit2':
        h.onSetLoop?.(2);
        break;
      case 'digit3':
        h.onSetLoop?.(3);
        break;
    }
  };

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
      const mode = handlersRef.current.mode || 'focus';
      const behavior = mode === 'improv' ? curConfig.improvMode : curConfig.focusMode;

      // 3. Modifier Combination Handling (e.g. Ctrl+KeyR, Shift+KeyR, Alt+KeyB)
      const isModifierOnly = ['ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight'].includes(e.code);
      if (isModifierOnly) return;

      const hasModifiers = e.ctrlKey || e.shiftKey || e.altKey || e.metaKey;
      if (hasModifiers) {
        // Flush any pending single-press timer
        if (pendingTimerRef.current) {
          clearTimeout(pendingTimerRef.current);
          pendingTimerRef.current = null;
          const prevKey = pendingKeyRef.current;
          pendingKeyRef.current = null;
          if (prevKey) {
            const act = shortcutConfigService.findActionForKey(prevKey);
            if (act) dispatchAction(act);
          }
        }

        const mods: string[] = [];
        if (e.ctrlKey) mods.push('Ctrl');
        if (e.altKey) mods.push('Alt');
        if (e.shiftKey) mods.push('Shift');
        if (e.metaKey) mods.push('Meta');
        const comboCode = `${mods.join('+')}+${e.code}`;

        const comboAction = shortcutConfigService.findActionForKey(comboCode);
        if (comboAction) {
          e.preventDefault();
          dispatchAction(comboAction);
          return;
        }
      }

      // 4. Prevent default for common navigation/presentation keys
      const allPreventCodes = [
        'PageDown', 'PageUp', 'ArrowRight', 'ArrowLeft', 'Space', 'F5', 'F11',
        ...(kb.next || []).map(k => k.replace(/^2x:/, '')),
        ...(kb.prev || []).map(k => k.replace(/^2x:/, '')),
        ...(kb.replay || []).map(k => k.replace(/^2x:/, '')),
        ...(kb.fullscreen || []).map(k => k.replace(/^2x:/, ''))
      ];
      if (allPreventCodes.includes(e.code)) {
        e.preventDefault();
      }

      // 5. Double-press vs Single-press Detection
      if (pendingKeyRef.current === e.code && pendingTimerRef.current) {
        // SECOND PRESS OF SAME KEY WITHIN TIMEOUT -> DOUBLE PRESS (2x) GESTURE!
        clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
        pendingKeyRef.current = null;

        // Check if there is an action bound to 2x:e.code
        const doubleAction = shortcutConfigService.findActionForKey(e.code, true);
        if (doubleAction) {
          dispatchAction(doubleAction);
          return;
        }

        // Fallback: behavior.enableDoublePressReplay on prev keys
        if (behavior.enableDoublePressReplay && kb.prev?.includes(e.code)) {
          handlersRef.current.onReplayAudio();
          return;
        }

        // Otherwise dispatch normal action
        const singleAction = shortcutConfigService.findActionForKey(e.code);
        if (singleAction) {
          dispatchAction(singleAction);
          return;
        }
        return;
      }

      // If a different key was pending, flush it now
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
        const prevKey = pendingKeyRef.current;
        pendingKeyRef.current = null;
        if (prevKey) {
          const act = shortcutConfigService.findActionForKey(prevKey);
          if (act) dispatchAction(act);
        }
      }

      // Check if this key has any 2x double-press binding or doublePressReplay enabled
      const hasDoublePress = shortcutConfigService.hasDoublePressBinding(e.code) || 
        (behavior.enableDoublePressReplay && !!kb.prev?.includes(e.code));

      if (hasDoublePress) {
        // Start waiting for possible second press
        pendingKeyRef.current = e.code;
        const timeout = behavior.doublePressTimeoutMs || 380;
        pendingTimerRef.current = setTimeout(() => {
          pendingTimerRef.current = null;
          pendingKeyRef.current = null;
          const singleAction = shortcutConfigService.findActionForKey(e.code);
          if (singleAction) {
            dispatchAction(singleAction);
          } else {
            // Default digit fallback
            if (e.code === 'Digit1' || e.code === 'Numpad1') dispatchAction('digit1');
            else if (e.code === 'Digit2' || e.code === 'Numpad2') dispatchAction('digit2');
            else if (e.code === 'Digit3' || e.code === 'Numpad3') dispatchAction('digit3');
          }
        }, timeout);
        return;
      }

      // Keys without 2x binding execute immediately (zero latency)
      const directAction = shortcutConfigService.findActionForKey(e.code);
      if (directAction) {
        dispatchAction(directAction);
        return;
      }

      // Fallback for digits if not explicitly mapped
      if (e.code === 'Digit1' || e.code === 'Numpad1') {
        dispatchAction('digit1');
      } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
        dispatchAction('digit2');
      } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
        dispatchAction('digit3');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
        pendingKeyRef.current = null;
      }
    };
  }, [enabled]);
}
