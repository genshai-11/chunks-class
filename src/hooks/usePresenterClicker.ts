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

  interface PendingKeyRecord {
    code: string;
    timer: ReturnType<typeof setTimeout>;
    timestamp: number;
  }

  const pendingChordKeyRef = useRef<PendingKeyRecord | null>(null);

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
        // Flush any pending key timer
        if (pendingChordKeyRef.current) {
          clearTimeout(pendingChordKeyRef.current.timer);
          const prevKey = pendingChordKeyRef.current.code;
          pendingChordKeyRef.current = null;
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
        ...(kb.next || []).flatMap(k => k.replace(/^2x:/, '').split('+')),
        ...(kb.prev || []).flatMap(k => k.replace(/^2x:/, '').split('+')),
        ...(kb.replay || []).flatMap(k => k.replace(/^2x:/, '').split('+')),
        ...(kb.fullscreen || []).flatMap(k => k.replace(/^2x:/, '').split('+'))
      ];
      if (allPreventCodes.includes(e.code)) {
        e.preventDefault();
      }

      // 5. 2-Key Chord & Double-press Detection with Pending Key
      if (pendingChordKeyRef.current) {
        const pendingKey = pendingChordKeyRef.current.code;
        const timer = pendingChordKeyRef.current.timer;

        if (pendingKey !== e.code) {
          // Key B arrives while Key A is pending -> Check 2-Key Chord!
          const chordAction = shortcutConfigService.findActionForChord(pendingKey, e.code);
          if (chordAction) {
            // SUCCESSFUL CHORD! Cancel pending action, invoke chord action (e.g. Replay)!
            clearTimeout(timer);
            pendingChordKeyRef.current = null;
            dispatchAction(chordAction);
            return;
          }

          // No chord matched between pendingKey and e.code:
          // Flush pendingKey action first, then proceed to handle e.code
          clearTimeout(timer);
          pendingChordKeyRef.current = null;
          const prevAction = shortcutConfigService.findActionForKey(pendingKey);
          if (prevAction) {
            dispatchAction(prevAction);
          }
          // Now continue to evaluate e.code as below
        } else {
          // Same key pressed again within timeout -> Double Press (2x) Gesture!
          clearTimeout(timer);
          pendingChordKeyRef.current = null;

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

          // If no 2x binding, dispatch single action for both presses
          const singleAction = shortcutConfigService.findActionForKey(e.code);
          if (singleAction) {
            dispatchAction(singleAction);
            dispatchAction(singleAction);
            return;
          }
          return;
        }
      }

      // 6. Check if this key should wait for a potential 2-Key Chord or 2x Double-Press
      const hasChord = shortcutConfigService.hasChordStartingWith(e.code);
      const hasDoublePress = shortcutConfigService.hasDoublePressBinding(e.code) || 
        (behavior.enableDoublePressReplay && !!kb.prev?.includes(e.code));

      if (hasChord || hasDoublePress) {
        const timeout = hasChord ? 350 : (behavior.doublePressTimeoutMs || 380);
        const timer = setTimeout(() => {
          pendingChordKeyRef.current = null;
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

        pendingChordKeyRef.current = {
          code: e.code,
          timer,
          timestamp: Date.now()
        };
        return;
      }

      // 7. Keys without chord or 2x binding execute immediately (zero latency)
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
      if (pendingChordKeyRef.current) {
        clearTimeout(pendingChordKeyRef.current.timer);
        pendingChordKeyRef.current = null;
      }
    };
  }, [enabled]);
}
