import { ClickerAction, PresentationShortcutConfig, ShortcutModeBehavior } from '../types';

export const SHORTCUT_STORAGE_KEY = 'chunks_presentation_shortcuts_v1';

export const DEFAULT_SHORTCUT_CONFIG: PresentationShortcutConfig = {
  version: 3,
  keyBindings: {
    next: ['PageDown', 'ArrowRight', 'Space'],
    prev: ['PageUp', 'ArrowLeft'],
    replay: ['KeyR', '2x:ArrowLeft', '2x:PageUp', 'ArrowRight+ArrowLeft', 'PageDown+PageUp'],
    blackout: ['KeyB', 'Period'],
    subtitle: ['KeyV'],
    drawer: ['KeyP', 'KeyL'],
    fullscreen: ['KeyF', 'F5'],
    digit1: ['Digit1', 'Numpad1'],
    digit2: ['Digit2', 'Numpad2'],
    digit3: ['Digit3', 'Numpad3']
  },
  focusMode: {
    playAudioOnPrev: true,
    enableDoublePressReplay: true,
    doublePressTimeoutMs: 420
  },
  improvMode: {
    playAudioOnPrev: false,
    enableDoublePressReplay: true,
    doublePressTimeoutMs: 420
  }
};

export type ShortcutPresetType = 'PRESENTER_REMOTE' | 'KEYBOARD_STANDARD' | 'INVERTED_CLICKER';

export const SHORTCUT_PRESETS: Record<ShortcutPresetType, { name: string; description: string; bindings: Record<ClickerAction, string[]> }> = {
  PRESENTER_REMOTE: {
    name: 'Bút Trình Chiếu Chuẩn (Presenter Remote)',
    description: 'Tương thích tiêu chuẩn Logitech (Spotlight, R400/R800), Baseus, Ugreen (PageDown = Next, PageUp = Prev, 2x Prev hoặc Right+Left = Replay).',
    bindings: {
      next: ['PageDown', 'ArrowRight', 'Space'],
      prev: ['PageUp', 'ArrowLeft'],
      replay: ['KeyR', '2x:PageUp', '2x:ArrowLeft', 'ArrowRight+ArrowLeft', 'PageDown+PageUp'],
      blackout: ['KeyB', 'Period'],
      subtitle: ['KeyV'],
      drawer: ['KeyP', 'KeyL'],
      fullscreen: ['KeyF', 'F5'],
      digit1: ['Digit1', 'Numpad1'],
      digit2: ['Digit2', 'Numpad2'],
      digit3: ['Digit3', 'Numpad3']
    }
  },
  KEYBOARD_STANDARD: {
    name: 'Bàn Phím Máy Tính Chuẩn (Desktop Keyboard)',
    description: 'Thao tác trực tiếp trên phím mũi tên, phím cách, Enter và phím tắt F5/F11 (2x Mũi tên trái / PageUp hoặc Right+Left = Replay).',
    bindings: {
      next: ['ArrowRight', 'Space', 'Enter'],
      prev: ['ArrowLeft', 'Backspace'],
      replay: ['KeyR', '2x:ArrowLeft', '2x:PageUp', 'ArrowRight+ArrowLeft', 'PageDown+PageUp'],
      blackout: ['KeyB', 'Period'],
      subtitle: ['KeyV'],
      drawer: ['KeyP', 'KeyL'],
      fullscreen: ['KeyF', 'F5', 'F11'],
      digit1: ['Digit1', 'Numpad1'],
      digit2: ['Digit2', 'Numpad2'],
      digit3: ['Digit3', 'Numpad3']
    }
  },
  INVERTED_CLICKER: {
    name: 'Đảo Chiều Tiến ⇄ Lùi (Inverted Clicker)',
    description: 'Phù hợp khi bút trình chiếu có bố cục phím ngược (Nút Trái = Next, Nút Phải = Prev, Left+Right = Replay).',
    bindings: {
      next: ['PageUp', 'ArrowLeft'],
      prev: ['PageDown', 'ArrowRight', 'Space'],
      replay: ['KeyR', '2x:PageDown', '2x:ArrowRight', '2x:PageUp', '2x:ArrowLeft', 'ArrowLeft+ArrowRight', 'PageUp+PageDown'],
      blackout: ['KeyB', 'Period'],
      subtitle: ['KeyV'],
      drawer: ['KeyP', 'KeyL'],
      fullscreen: ['KeyF', 'F5'],
      digit1: ['Digit1', 'Numpad1'],
      digit2: ['Digit2', 'Numpad2'],
      digit3: ['Digit3', 'Numpad3']
    }
  }
};

class ShortcutConfigService {
  private config: PresentationShortcutConfig;
  private listeners: Array<() => void> = [];

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): PresentationShortcutConfig {
    try {
      const raw = localStorage.getItem(SHORTCUT_STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SHORTCUT_CONFIG };
      const parsed = JSON.parse(raw);
      const version = parsed.version || 1;
      const keyBindings: Record<ClickerAction, string[]> = {
        ...DEFAULT_SHORTCUT_CONFIG.keyBindings,
        ...(parsed.keyBindings || {})
      };

      // Auto-migrate v1 -> v2: Ensure replay includes double-press prev keys if not present
      if (version < 2 && keyBindings.replay) {
        if (!keyBindings.replay.includes('2x:ArrowLeft')) {
          keyBindings.replay.push('2x:ArrowLeft');
        }
        if (!keyBindings.replay.includes('2x:PageUp')) {
          keyBindings.replay.push('2x:PageUp');
        }
      }

      // Auto-migrate v2 -> v3: Ensure replay includes 2-key chords (ArrowRight+ArrowLeft, PageDown+PageUp)
      if (version < 3 && keyBindings.replay) {
        const defaultChords = ['ArrowRight+ArrowLeft', 'PageDown+PageUp'];
        for (const chord of defaultChords) {
          if (!keyBindings.replay.includes(chord)) {
            keyBindings.replay.push(chord);
          }
        }
      }

      const focusMode = {
        ...DEFAULT_SHORTCUT_CONFIG.focusMode,
        ...(parsed.focusMode || {})
      };
      if (focusMode.doublePressTimeoutMs === 380) {
        focusMode.doublePressTimeoutMs = 420;
      }

      const improvMode = {
        ...DEFAULT_SHORTCUT_CONFIG.improvMode,
        ...(parsed.improvMode || {})
      };
      if (improvMode.doublePressTimeoutMs === 380) {
        improvMode.doublePressTimeoutMs = 420;
      }

      return {
        version: Math.max(version, 3),
        keyBindings,
        focusMode,
        improvMode
      };
    } catch {
      return { ...DEFAULT_SHORTCUT_CONFIG };
    }
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(SHORTCUT_STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.error('[ShortcutConfigService] Failed to save config to localStorage:', e);
    }
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch (err) {
        console.error('[ShortcutConfigService] Listener notification error:', err);
      }
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getConfig(): PresentationShortcutConfig {
    return {
      version: this.config.version,
      keyBindings: { ...this.config.keyBindings },
      focusMode: { ...this.config.focusMode },
      improvMode: { ...this.config.improvMode }
    };
  }

  public updateConfig(updates: Partial<PresentationShortcutConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
      keyBindings: {
        ...this.config.keyBindings,
        ...(updates.keyBindings || {})
      },
      focusMode: {
        ...this.config.focusMode,
        ...(updates.focusMode || {})
      },
      improvMode: {
        ...this.config.improvMode,
        ...(updates.improvMode || {})
      }
    };
    this.saveConfig();
  }

  public updateKeyBinding(action: ClickerAction | string, keys: string[]): void {
    const act = action as ClickerAction;
    this.config.keyBindings[act] = Array.from(new Set(keys.filter(Boolean)));
    this.saveConfig();
  }

  public addKeyToAction(action: ClickerAction | string, key: string): void {
    if (!key) return;
    const act = action as ClickerAction;
    const current = this.config.keyBindings[act] || [];
    if (!current.includes(key)) {
      this.config.keyBindings[act] = [...current, key];
      this.saveConfig();
    }
  }

  public removeKeyFromAction(action: ClickerAction | string, key: string): void {
    const act = action as ClickerAction;
    const current = this.config.keyBindings[act] || [];
    this.config.keyBindings[act] = current.filter(k => k !== key);
    this.saveConfig();
  }

  public swapNextPrev(): void {
    const currentNext = [...(this.config.keyBindings.next || [])];
    const currentPrev = [...(this.config.keyBindings.prev || [])];
    this.config.keyBindings.next = currentPrev;
    this.config.keyBindings.prev = currentNext;
    this.saveConfig();
  }

  public updateModeBehavior(mode: 'focusMode' | 'improvMode', updates: Partial<ShortcutModeBehavior>): void {
    this.config[mode] = {
      ...this.config[mode],
      ...updates
    };
    this.saveConfig();
  }

  public applyPreset(preset: ShortcutPresetType): void {
    const presetData = SHORTCUT_PRESETS[preset];
    if (presetData) {
      this.config.keyBindings = {
        ...this.config.keyBindings,
        ...presetData.bindings
      };
      this.saveConfig();
    }
  }

  public resetToDefault(): void {
    this.config = {
      version: 3,
      keyBindings: {
        ...DEFAULT_SHORTCUT_CONFIG.keyBindings
      },
      focusMode: {
        ...DEFAULT_SHORTCUT_CONFIG.focusMode
      },
      improvMode: {
        ...DEFAULT_SHORTCUT_CONFIG.improvMode
      }
    };
    this.saveConfig();
  }

  public hasDoublePressBinding(code: string): boolean {
    if (!code) return false;
    const doubleCode = code.startsWith('2x:') ? code : `2x:${code}`;
    const actions: ClickerAction[] = ['next', 'prev', 'replay', 'blackout', 'subtitle', 'drawer', 'fullscreen', 'digit1', 'digit2', 'digit3'];
    for (const act of actions) {
      const keys = this.config.keyBindings[act];
      if (keys && keys.includes(doubleCode)) {
        return true;
      }
    }
    return false;
  }

  public hasChordStartingWith(firstKey: string): boolean {
    if (!firstKey) return false;
    const actions: ClickerAction[] = ['next', 'prev', 'replay', 'blackout', 'subtitle', 'drawer', 'fullscreen', 'digit1', 'digit2', 'digit3'];
    for (const act of actions) {
      const keys = this.config.keyBindings[act];
      if (keys) {
        for (const k of keys) {
          if (k.includes('+')) {
            const parts = k.split('+');
            const hasMod = parts.some(p => ['ctrl', 'control', 'alt', 'shift', 'meta', 'cmd', 'command', 'win'].includes(p.toLowerCase()));
            if (!hasMod && parts.length === 2 && (parts[0] === firstKey || parts[1] === firstKey)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  public findActionForChord(keyA: string, keyB: string): ClickerAction | null {
    if (!keyA || !keyB) return null;
    const candidate1 = `${keyA}+${keyB}`;
    const candidate2 = `${keyB}+${keyA}`;
    const actions: ClickerAction[] = ['next', 'prev', 'replay', 'blackout', 'subtitle', 'drawer', 'fullscreen', 'digit1', 'digit2', 'digit3'];
    for (const act of actions) {
      const keys = this.config.keyBindings[act];
      if (keys) {
        if (keys.includes(candidate1) || keys.includes(candidate2)) {
          return act;
        }
      }
    }
    return null;
  }

  public findActionForKey(
    code: string,
    isDouble?: boolean,
    modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean }
  ): ClickerAction | null {
    if (!code) return null;
    const actions: ClickerAction[] = ['next', 'prev', 'replay', 'blackout', 'subtitle', 'drawer', 'fullscreen', 'digit1', 'digit2', 'digit3'];

    // 1. Modifiers combination candidate (e.g. Ctrl+KeyR) checked across ALL actions first
    const modPrefixes: string[] = [];
    if (modifiers?.ctrl) modPrefixes.push('Ctrl');
    if (modifiers?.alt) modPrefixes.push('Alt');
    if (modifiers?.shift) modPrefixes.push('Shift');
    if (modifiers?.meta) modPrefixes.push('Meta');

    if (modPrefixes.length > 0) {
      const comboCandidate = `${modPrefixes.join('+')}+${code}`;
      for (const act of actions) {
        const keys = this.config.keyBindings[act];
        if (keys && keys.includes(comboCandidate)) {
          return act;
        }
      }
    }

    // 2. Double-press candidate (e.g. 2x:ArrowLeft) checked across ALL actions first
    // Note: If isDouble is true, search 2x:${code} across ALL actions BEFORE falling back to single keys!
    if (isDouble || code.startsWith('2x:')) {
      const doubleCode = code.startsWith('2x:') ? code : `2x:${code}`;
      for (const act of actions) {
        const keys = this.config.keyBindings[act];
        if (keys && keys.includes(doubleCode)) {
          return act;
        }
      }
    }

    // 3. Fall back to matching raw code across all actions
    // (Only if not a 2x prefixed key, or if no 2x binding matched any action)
    if (!code.startsWith('2x:')) {
      for (const act of actions) {
        const keys = this.config.keyBindings[act];
        if (keys && keys.includes(code)) {
          return act;
        }
      }
    }

    return null;
  }

  public getKeyFriendlyName(code: string): string {
    if (!code) return '';

    // Handle 2x double-press prefix
    if (code.startsWith('2x:')) {
      const baseCode = code.slice(3);
      return `⚡ Bấm đúp 2 lần: ${this.getKeyFriendlyName(baseCode)}`;
    }

    // Handle combinations: 2-key chords vs modifier combinations
    if (code.includes('+')) {
      const parts = code.split('+');
      const hasModifier = parts.some(p => ['ctrl', 'control', 'alt', 'shift', 'meta', 'cmd', 'command', 'win'].includes(p.toLowerCase()));

      // 2-key chord without modifiers (e.g. ArrowRight+ArrowLeft, PageDown+PageUp)
      if (!hasModifier && parts.length === 2) {
        return `🤝 Tổ hợp: ${this.getKeyFriendlyName(parts[0])} + ${this.getKeyFriendlyName(parts[1])}`;
      }

      // Modifier combination keys (e.g. Ctrl+KeyR, Shift+KeyV)
      const baseKey = parts[parts.length - 1];
      const modifiers = parts.slice(0, -1);
      const friendlyModifiers = modifiers.map(m => {
        const lower = m.toLowerCase();
        if (lower === 'ctrl' || lower === 'control') return 'Ctrl';
        if (lower === 'alt') return 'Alt';
        if (lower === 'shift') return 'Shift';
        if (lower === 'meta' || lower === 'cmd') return 'Command / Win';
        return m;
      });
      return `${friendlyModifiers.join(' + ')} + ${this.getKeyFriendlyName(baseKey)}`;
    }

    const friendlyMap: Record<string, string> = {
      'ArrowRight': '→ (Mũi tên Phải)',
      'ArrowLeft': '← (Mũi tên Trái)',
      'ArrowUp': '↑ (Mũi tên Lên)',
      'ArrowDown': '↓ (Mũi tên Xuống)',
      'PageDown': 'Page Down (Next)',
      'PageUp': 'Page Up (Prev)',
      'Space': 'Phím Cách (Space)',
      'Enter': 'Phím Enter (↵)',
      'Backspace': 'Phím Xóa (Backspace)',
      'Period': 'Dấu chấm (.)',
      'Comma': 'Dấu phẩy (,)',
      'Slash': 'Dấu gạch chéo (/)',
      'Backquote': 'Dấu huyền (`)',
      'Minus': 'Dấu trừ (-)',
      'Equal': 'Dấu bằng (=)',
      'Tab': 'Phím Tab',
      'Escape': 'Phím Esc',
      'KeyB': 'Phím B',
      'KeyR': 'Phím R',
      'KeyV': 'Phím V',
      'KeyP': 'Phím P',
      'KeyL': 'Phím L',
      'KeyF': 'Phím F',
      'F5': 'F5',
      'F11': 'F11',
      'Digit1': 'Phím 1',
      'Digit2': 'Phím 2',
      'Digit3': 'Phím 3',
      'Numpad1': 'Numpad 1',
      'Numpad2': 'Numpad 2',
      'Numpad3': 'Numpad 3'
    };

    if (friendlyMap[code]) {
      return friendlyMap[code];
    }

    if (code.startsWith('Key')) {
      return `Phím ${code.slice(3)}`;
    }

    if (code.startsWith('Digit')) {
      return `Phím ${code.slice(5)}`;
    }

    if (code.startsWith('Numpad')) {
      return `Numpad ${code.slice(6)}`;
    }

    return code;
  }

  public getActionLabel(action: string): { title: string; description: string } {
    switch (action) {
      case 'next':
        return {
          title: 'Tiến câu / Bước tiếp theo (Next)',
          description: 'Chuyển sang chunk hoặc hint tiếp theo, phát âm thanh bài học tự động.'
        };
      case 'prev':
        return {
          title: 'Lùi câu / Bước trước (Previous)',
          description: 'Quay lại chunk hoặc hint trước (hỗ trợ bấm đúp để Replay).'
        };
      case 'replay':
        return {
          title: 'Phát lại âm thanh (Replay Audio)',
          description: 'Đọc lại audio câu hoặc chuỗi gợi ý hiện tại.'
        };
      case 'blackout':
        return {
          title: 'Màn hình đen (Blackout Blank Screen)',
          description: 'Tắt màn hình ngay lập tức để học viên tập trung vào giáo viên đứng lớp.'
        };
      case 'subtitle':
        return {
          title: 'Bật / Tắt Vietsub (Toggle Subtitles)',
          description: 'Ẩn hoặc hiện nghĩa tiếng Việt bên dưới câu tiếng Anh.'
        };
      case 'drawer':
        return {
          title: 'Mở danh sách câu / Phần học (Drawer)',
          description: 'Mở ngăn kéo Parts Navigation hoặc Chunk List trong bài.'
        };
      case 'fullscreen':
        return {
          title: 'Toàn màn hình (Toggle Fullscreen)',
          description: 'Bật hoặc tắt chế độ trình chiếu toàn màn hình không viền.'
        };
      case 'digit1':
        return {
          title: 'Phím số 1 (Lặp 1 lần / English only)',
          description: 'Đặt lặp âm thanh 1x (Focus) hoặc chuyển chế độ Tiếng Anh (Improv).'
        };
      case 'digit2':
        return {
          title: 'Phím số 2 (Lặp 2 lần / Vietnamese only)',
          description: 'Đặt lặp âm thanh 2x (Focus) hoặc chuyển chế độ Tiếng Việt (Improv).'
        };
      case 'digit3':
        return {
          title: 'Phím số 3 (Lặp 3 lần)',
          description: 'Đặt lặp âm thanh 3x liên tiếp cho câu hiện tại.'
        };
      default:
        return {
          title: action,
          description: 'Thao tác trình chiếu.'
        };
    }
  }
}

export const shortcutConfigService = new ShortcutConfigService();
