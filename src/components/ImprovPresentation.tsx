import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ImprovPackage, 
  ImprovSession, 
  ImprovItem, 
  ImprovHint, 
  CohortAudioSettings,
  LanguageMode
} from '../types';
import { getAllImprovPackages } from '../services/improvService';
import { 
  getResponsiveHintTypography, 
  getSemanticHintBadge, 
  improvText, 
  improvColors 
} from '../styles/improvTheme';
import { 
  audioPlayer, 
  GOOGLE_TTS_VOICES, 
  AudioProvider 
} from '../services/googleTtsService';
import { DEEPGRAM_AURA_VOICES } from '../services/deepgramTtsService';
import { 
  improvTts,
  getHintTextByLanguage, 
  isSessionAudioReady, 
  isPackageAudioReady 
} from '../services/improvTtsService';
import { usePresenterClicker } from '../hooks/usePresenterClicker';
import confetti from 'canvas-confetti';
import { 
  Volume2, 
  ChevronLeft, 
  ChevronRight, 
  Moon, 
  SunMedium, 
  Maximize2, 
  Minimize2, 
  Keyboard, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Radio, 
  Play, 
  Check, 
  ChevronDown, 
  X, 
  Layers, 
  Lock, 
  Sliders, 
  RotateCcw,
  Search,
  BookOpen,
  ListOrdered,
  ListFilter,
  CheckCircle2,
  Flame,
  Globe,
  FastForward,
  Trophy,
  Music
} from 'lucide-react';

// ============================================================================
// Native Web Audio API Sound Cues (0ms Latency, Zero Assets, 100% Offline)
// ============================================================================
let sharedAudioCtx: AudioContext | null = null;

const getWebAudioContext = (): AudioContext | null => {
  try {
    if (typeof window === 'undefined') return null;
    if (!sharedAudioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        sharedAudioCtx = new AudioContextClass();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
};

/**
 * Play gentle arpeggio 4-note chime for session transition:
 * C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz) -> C6 (1046.50Hz)
 * Soft sine waves, smooth attack & decay, duration ~0.5s.
 */
const playSessionTransitionChime = () => {
  const ctx = getWebAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.50];
  const now = ctx.currentTime;
  const noteDuration = 0.11;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * noteDuration);

    const startTime = now + idx * noteDuration;
    const noteEnd = startTime + 0.22;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(noteEnd);
  });
};

/**
 * Play victory celebration fanfare for package completion:
 * C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz) -> C6 (1046.50Hz) -> E6 (1318.51Hz)
 * Triumphant harmonics with triangle/sine, lasting ~0.8s.
 */
const playPackageCompletionFanfare = () => {
  const ctx = getWebAudioContext();
  if (!ctx) return;

  const notes = [
    { freq: 523.25, start: 0.00, dur: 0.14 },
    { freq: 659.25, start: 0.12, dur: 0.14 },
    { freq: 783.99, start: 0.24, dur: 0.14 },
    { freq: 1046.50, start: 0.38, dur: 0.20 },
    { freq: 1318.51, start: 0.54, dur: 0.38 }
  ];
  const now = ctx.currentTime;

  notes.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + start);

    const startTime = now + start;
    const endTime = startTime + dur;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.22, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(endTime);
  });
};

interface ImprovPresentationProps {
  packageId?: string;
  sessionNumber?: number;
  onExit?: () => void;
  audioSettings?: CohortAudioSettings;
  onSelectPackage?: (packageId: string, sessionNumber?: number) => void;
}

const getSemanticBadge = getSemanticHintBadge;

export const ImprovPresentation: React.FC<ImprovPresentationProps> = ({
  packageId,
  sessionNumber = 1,
  onExit,
  audioSettings,
  onSelectPackage
}) => {
  // Packages & Navigation State
  const [packages, setPackages] = useState<ImprovPackage[]>([]);
  const [selectedPkgId, setSelectedPkgId] = useState<string>(packageId || '');
  const [selectedSessionNum, setSelectedSessionNum] = useState<number>(sessionNumber);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(0);

  // Reveal & Display Mode
  const [revealMode, setRevealMode] = useState<'step' | 'all'>('step');
  const [currentRevealStep, setCurrentRevealStep] = useState<number>(1);
  const [showSubtitle, setShowSubtitle] = useState<boolean>(true);
  const [isBlackout, setIsBlackout] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [highContrastDark, setHighContrastDark] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [isListDrawerOpen, setIsListDrawerOpen] = useState<boolean>(false);

  // Audio Engine & Synthesis State
  const [languageMode, setLanguageMode] = useState<'EN_ONLY' | 'VI_ONLY'>('EN_ONLY');
  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    const v = audioSettings?.voice_profile_en;
    return (v && v !== 'aura-theia-en') ? v : 'aura-asteria-en';
  });
  const [selectedVoiceVi, setSelectedVoiceVi] = useState<string>(
    audioSettings?.voice_profile_vi || 'vi-VN-Neural2-A'
  );
  const [speed, setSpeed] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('chunks_improv_playback_speed');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 0.7 && val <= 2.0) return val;
      }
    } catch {}
    return audioSettings?.default_speed || 1.0;
  });
  const [hintPauseSec, setHintPauseSec] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('chunks_improv_hint_pause_sec');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 0.3 && val <= 1.5) return val;
      }
    } catch {}
    return 0.8;
  });
  const [enableSoundCues, setEnableSoundCues] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('chunks_improv_sound_cues');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // Persist speed, hintPauseSec & soundCues to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('chunks_improv_playback_speed', String(speed));
    } catch {}
  }, [speed]);

  useEffect(() => {
    try {
      localStorage.setItem('chunks_improv_hint_pause_sec', String(hintPauseSec));
    } catch {}
  }, [hintPauseSec]);

  useEffect(() => {
    try {
      localStorage.setItem('chunks_improv_sound_cues', String(enableSoundCues));
    } catch {}
  }, [enableSoundCues]);
  const [audioProvider, setAudioProvider] = useState<AudioProvider>(audioPlayer.getAudioProvider());
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [activePlayingHintIndex, setActivePlayingHintIndex] = useState<number | null>(null);
  const [isAuditioningVoice, setIsAuditioningVoice] = useState<boolean>(false);

  // Popover controls
  const [isPackagePopoverOpen, setIsPackagePopoverOpen] = useState<boolean>(false);
  const [isSessionPopoverOpen, setIsSessionPopoverOpen] = useState<boolean>(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState<boolean>(false);
  const [packageSearchQuery, setPackageSearchQuery] = useState<string>('');

  const packagePopoverRef = useRef<HTMLDivElement>(null);
  const sessionPopoverRef = useRef<HTMLDivElement>(null);
  const audioSettingsRef = useRef<HTMLDivElement>(null);
  const activeSequenceRef = useRef<number>(0);

  // Load packages on mount
  useEffect(() => {
    let mounted = true;
    getAllImprovPackages().then((loaded) => {
      if (!mounted) return;
      setPackages(loaded);
      if (loaded.length > 0) {
        if (!selectedPkgId || !loaded.some(p => p.id === selectedPkgId)) {
          setSelectedPkgId(loaded[0].id);
        }
      }
    });
    return () => { mounted = false; };
  }, [selectedPkgId]);

  // Sync packageId prop if provided
  useEffect(() => {
    if (packageId && packageId !== selectedPkgId) {
      setSelectedPkgId(packageId);
      setCurrentItemIndex(0);
      setCurrentRevealStep(1);
    }
  }, [packageId]);

  // Sync sessionNumber prop if provided
  useEffect(() => {
    if (sessionNumber && sessionNumber !== selectedSessionNum) {
      setSelectedSessionNum(sessionNumber);
      setCurrentItemIndex(0);
      setCurrentRevealStep(1);
    }
  }, [sessionNumber]);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (packagePopoverRef.current && !packagePopoverRef.current.contains(e.target as Node)) {
        setIsPackagePopoverOpen(false);
      }
      if (sessionPopoverRef.current && !sessionPopoverRef.current.contains(e.target as Node)) {
        setIsSessionPopoverOpen(false);
      }
      if (audioSettingsRef.current && !audioSettingsRef.current.contains(e.target as Node)) {
        setIsAudioSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Active Package & Session Calculation
  const activePackage = useMemo(() => {
    return packages.find(p => p.id === selectedPkgId) || packages[0] || null;
  }, [packages, selectedPkgId]);

  const activeSession: ImprovSession | null = useMemo(() => {
    if (!activePackage || !activePackage.sessions || activePackage.sessions.length === 0) {
      return null;
    }
    return activePackage.sessions.find(s => s.sessionNumber === selectedSessionNum) || activePackage.sessions[0];
  }, [activePackage, selectedSessionNum]);

  const items: ImprovItem[] = useMemo(() => {
    return activeSession?.items || [];
  }, [activeSession]);

  const currentItem: ImprovItem | null = useMemo(() => {
    if (items.length === 0) return null;
    const safeIndex = Math.max(0, Math.min(currentItemIndex, items.length - 1));
    return items[safeIndex];
  }, [items, currentItemIndex]);

  const hints: ImprovHint[] = useMemo(() => {
    if (!currentItem || !currentItem.hints) return [];
    return [...currentItem.hints].sort((a, b) => a.itemIndex - b.itemIndex);
  }, [currentItem]);

  // Session Progression & Item Status
  const currentSessionIdx = useMemo(() => {
    if (!activePackage || !activePackage.sessions) return -1;
    return activePackage.sessions.findIndex(s => s.sessionNumber === selectedSessionNum);
  }, [activePackage, selectedSessionNum]);

  const nextSession: ImprovSession | null = useMemo(() => {
    if (!activePackage || !activePackage.sessions || currentSessionIdx < 0) return null;
    if (currentSessionIdx < activePackage.sessions.length - 1) {
      return activePackage.sessions[currentSessionIdx + 1];
    }
    return null;
  }, [activePackage, currentSessionIdx]);

  const prevSession: ImprovSession | null = useMemo(() => {
    if (!activePackage || !activePackage.sessions || currentSessionIdx <= 0) return null;
    return activePackage.sessions[currentSessionIdx - 1];
  }, [activePackage, currentSessionIdx]);

  const isLastSessionInPackage = useMemo(() => {
    if (!activePackage || !activePackage.sessions || activePackage.sessions.length === 0) return false;
    return currentSessionIdx === activePackage.sessions.length - 1;
  }, [activePackage, currentSessionIdx]);

  const isLastItemInSession = items.length > 0 && currentItemIndex === items.length - 1;
  const isLastItemFullyRevealed = isLastItemInSession && (revealMode === 'all' || currentRevealStep >= hints.length);

  // Auto celebratory confetti on reaching package completion
  const hasTriggeredPackageCompletionRef = useRef<string | null>(null);
  useEffect(() => {
    if (isLastItemFullyRevealed && isLastSessionInPackage && activePackage) {
      const stateKey = `${activePackage.id}_s${selectedSessionNum}_item${currentItemIndex}`;
      if (hasTriggeredPackageCompletionRef.current !== stateKey) {
        hasTriggeredPackageCompletionRef.current = stateKey;
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
        if (enableSoundCues) {
          playPackageCompletionFanfare();
        }
      }
    }
  }, [isLastItemFullyRevealed, isLastSessionInPackage, activePackage, selectedSessionNum, currentItemIndex, enableSoundCues]);

  // Sync audioSettings if updated
  useEffect(() => {
    if (audioSettings?.voice_profile_en) {
      const v = audioSettings.voice_profile_en;
      setSelectedVoice((v && v !== 'aura-theia-en') ? v : 'aura-asteria-en');
    }
    if (audioSettings?.voice_profile_vi) {
      setSelectedVoiceVi(audioSettings.voice_profile_vi);
    }
    if (audioSettings?.default_speed) {
      const saved = localStorage.getItem('chunks_improv_playback_speed');
      if (!saved) {
        setSpeed(audioSettings.default_speed);
      }
    }
  }, [audioSettings?.voice_profile_en, audioSettings?.voice_profile_vi, audioSettings?.default_speed]);

  // Audio Readiness State
  const [readyPackageMap, setReadyPackageMap] = useState<Record<string, boolean>>({});
  const [readySessionMap, setReadySessionMap] = useState<Record<string, boolean>>({});
  const [isSessionReady, setIsSessionReady] = useState<boolean>(false);

  // Helper to check if an ImprovSession has audio ready (either GCS/HTTP audioUrl or cached TTS)
  const checkSessionAudioReady = async (
    s: ImprovSession | null,
    vEn: string,
    vVi: string,
    lMode: 'EN_ONLY' | 'VI_ONLY'
  ): Promise<boolean> => {
    if (!s || !s.items || s.items.length === 0) return false;

    // Check if all items already have a valid audioUrl
    const allHaveAudioUrl = s.items.every(
      it => Boolean(it.audioUrl && (it.audioUrl.startsWith('http://') || it.audioUrl.startsWith('https://') || it.audioUrl.startsWith('data:')))
    );
    if (allHaveAudioUrl) return true;

    // Check through improvTts with active voice and fallback voice
    try {
      let ready = await isSessionAudioReady(s, vEn, vVi, lMode);
      if (ready) return true;
      if (vEn !== 'aura-asteria-en' || vVi !== 'vi-VN-Neural2-A') {
        ready = await isSessionAudioReady(s, 'aura-asteria-en', 'vi-VN-Neural2-A', lMode);
        if (ready) return true;
      }
    } catch {
      // Continue to direct cache check
    }

    // Direct cache key check
    try {
      const normalizedMode = lMode === 'VI_ONLY' ? 'VI_ONLY' : 'EN_ONLY';
      for (const item of s.items) {
        if (item.audioUrl && (item.audioUrl.startsWith('http') || item.audioUrl.startsWith('data:'))) {
          continue;
        }
        const k1 = `improv_item_${item.id}_${vEn}_${vVi}_${normalizedMode}`;
        const k2 = `improv_item_${item.id}_aura-asteria-en_vi-VN-Neural2-A_${normalizedMode}`;
        const cached = (await audioPlayer.getCachedAudioAsync(k1)) || (await audioPlayer.getCachedAudioAsync(k2));
        if (!cached) return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  // Scan audio readiness for packages
  useEffect(() => {
    let isMounted = true;
    const scanPackages = async () => {
      const map: Record<string, boolean> = {};
      for (const p of packages) {
        if (!isMounted) return;
        try {
          let ready = await isPackageAudioReady(p, selectedVoice, selectedVoiceVi, languageMode);
          if (!ready && (selectedVoice !== 'aura-asteria-en' || selectedVoiceVi !== 'vi-VN-Neural2-A')) {
            ready = await isPackageAudioReady(p, 'aura-asteria-en', 'vi-VN-Neural2-A', languageMode);
          }
          if (!ready && p.sessions && p.sessions.length > 0) {
            let allSessionsReady = true;
            for (const sess of p.sessions) {
              const sReady = await checkSessionAudioReady(sess, selectedVoice, selectedVoiceVi, languageMode);
              if (!sReady) {
                allSessionsReady = false;
                break;
              }
            }
            if (allSessionsReady) ready = true;
          }
          map[p.id] = ready;
        } catch {
          map[p.id] = false;
        }
      }
      if (isMounted) {
        setReadyPackageMap(map);
      }
    };

    scanPackages();
    return () => {
      isMounted = false;
    };
  }, [packages, selectedVoice, selectedVoiceVi, languageMode, isPackagePopoverOpen]);

  // Scan audio readiness for sessions in active package
  useEffect(() => {
    let isMounted = true;
    const scanSessions = async () => {
      if (!activePackage?.sessions || activePackage.sessions.length === 0) {
        if (isMounted) {
          setReadySessionMap({});
          setIsSessionReady(false);
        }
        return;
      }

      const map: Record<string, boolean> = {};
      for (const s of activePackage.sessions) {
        if (!isMounted) return;
        try {
          const ready = await checkSessionAudioReady(s, selectedVoice, selectedVoiceVi, languageMode);
          const sId = (s as any).id || String(s.sessionNumber);
          map[sId] = ready;
          map[String(s.sessionNumber)] = ready;
        } catch {
          const sId = (s as any).id || String(s.sessionNumber);
          map[sId] = false;
          map[String(s.sessionNumber)] = false;
        }
      }
      if (isMounted) {
        setReadySessionMap(map);
        const activeKey = (activeSession as any)?.id || String(selectedSessionNum);
        setIsSessionReady(Boolean(map[activeKey] || map[String(selectedSessionNum)]));
      }
    };

    scanSessions();
    return () => {
      isMounted = false;
    };
  }, [activePackage, selectedSessionNum, selectedVoice, selectedVoiceVi, languageMode, isSessionPopoverOpen, isAudioSettingsOpen]);

  // Re-check active session readiness specifically
  useEffect(() => {
    let isMounted = true;
    if (!activeSession) {
      setIsSessionReady(false);
      return;
    }
    checkSessionAudioReady(activeSession, selectedVoice, selectedVoiceVi, languageMode).then((ready) => {
      if (isMounted) {
        setIsSessionReady(ready);
        const activeKey = (activeSession as any)?.id || String(activeSession.sessionNumber);
        setReadySessionMap(prev => ({
          ...prev,
          [activeKey]: ready,
          [String(activeSession.sessionNumber)]: ready
        }));
      }
    }).catch(() => {
      if (isMounted) setIsSessionReady(false);
    });
    return () => {
      isMounted = false;
    };
  }, [activeSession, selectedVoice, selectedVoiceVi, languageMode, isAudioSettingsOpen]);

  // Filtered packages for switcher popover
  const filteredPackages = useMemo(() => {
    if (!packageSearchQuery.trim()) return packages;
    const q = packageSearchQuery.toLowerCase();
    return packages.filter(p => 
      p.title.toLowerCase().includes(q) || 
      (p.description && p.description.toLowerCase().includes(q))
    );
  }, [packages, packageSearchQuery]);

  // Audio Playback Engine: Sequential Hints with 1-second gap (Cache & GCS First)
  const playRevealedHintsAudio = async (
    hintsToPlay: ImprovHint[],
    voiceEn: string = selectedVoice,
    voiceVi: string = selectedVoiceVi
  ) => {
    audioPlayer.stop();
    improvTts.stop();
    const seqId = ++activeSequenceRef.current;
    setIsPlayingAudio(true);

    const effectiveVoiceEn = (voiceEn && voiceEn !== 'aura-theia-en') ? voiceEn : 'aura-asteria-en';
    const effectiveVoiceVi = voiceVi || 'vi-VN-Neural2-A';

    try {
      for (let i = 0; i < hintsToPlay.length; i++) {
        if (activeSequenceRef.current !== seqId) return;
        setActivePlayingHintIndex(i);
        const hint = hintsToPlay[i];
        
        const enText = getHintTextByLanguage(hint, 'en') || hint.text;
        const viText = getHintTextByLanguage(hint, 'vi') || hint.translation;

        if (languageMode === 'VI_ONLY') {
          const textToSpeak = viText || enText;
          if (textToSpeak) {
            if (hint.audioUrlVi && hint.audioUrlVi.startsWith('http')) {
              await audioPlayer.playChunk(textToSpeak, hint.audioUrlVi, effectiveVoiceVi, speed);
            } else {
              const hintKeyVi = `improv_hint_${hint.id}_${effectiveVoiceVi}_vi`;
              const cachedVi = (await audioPlayer.getCachedAudioAsync(hintKeyVi)) ||
                               (await audioPlayer.getCachedAudioAsync(viText || hint.translation, effectiveVoiceVi));
              if (cachedVi) {
                await audioPlayer.playBase64(cachedVi, speed);
              } else {
                await audioPlayer.playChunk(textToSpeak, null, effectiveVoiceVi, speed);
              }
            }
          }
        } else {
          // EN_ONLY
          if (enText) {
            if (hint.audioUrl && hint.audioUrl.startsWith('http')) {
              await audioPlayer.playChunk(enText, hint.audioUrl, effectiveVoiceEn, speed);
            } else {
              const hintKeyEn = `improv_hint_${hint.id}_${effectiveVoiceEn}_en`;
              const cachedEn = (await audioPlayer.getCachedAudioAsync(hintKeyEn)) ||
                               (await audioPlayer.getCachedAudioAsync(`improv_hint_${hint.id}_aura-asteria-en_en`)) ||
                               (await audioPlayer.getCachedAudioAsync(enText, effectiveVoiceEn));
              if (cachedEn) {
                await audioPlayer.playBase64(cachedEn, speed);
              } else {
                await audioPlayer.playChunk(enText, null, effectiveVoiceEn, speed);
              }
            }
          }
        }

        if (activeSequenceRef.current !== seqId) return;
        if (i < hintsToPlay.length - 1) {
          // Configurable pause between hints (0.3s - 1.5s, default 0.8s)
          await new Promise(res => setTimeout(res, Math.round(hintPauseSec * 1000)));
        }
      }
    } catch (err) {
      console.warn('[ImprovPresentation] Hint audio playback notice:', err);
    } finally {
      if (activeSequenceRef.current === seqId) {
        setIsPlayingAudio(false);
        setActivePlayingHintIndex(null);
      }
    }
  };

  // Play single hint audio (Cache & GCS First)
  const playSingleHintAudio = async (
    hint: ImprovHint,
    index: number,
    voiceEn: string = selectedVoice,
    voiceVi: string = selectedVoiceVi
  ) => {
    audioPlayer.stop();
    improvTts.stop();
    const seqId = ++activeSequenceRef.current;
    setIsPlayingAudio(true);
    setActivePlayingHintIndex(index);

    const effectiveVoiceEn = (voiceEn && voiceEn !== 'aura-theia-en') ? voiceEn : 'aura-asteria-en';
    const effectiveVoiceVi = voiceVi || 'vi-VN-Neural2-A';

    try {
      const enText = getHintTextByLanguage(hint, 'en') || hint.text;
      const viText = getHintTextByLanguage(hint, 'vi') || hint.translation;

      if (languageMode === 'VI_ONLY') {
        const textToSpeak = viText || enText;
        if (textToSpeak) {
          if (hint.audioUrlVi && hint.audioUrlVi.startsWith('http')) {
            await audioPlayer.playChunk(textToSpeak, hint.audioUrlVi, effectiveVoiceVi, speed);
          } else {
            const hintKeyVi = `improv_hint_${hint.id}_${effectiveVoiceVi}_vi`;
            const cachedVi = (await audioPlayer.getCachedAudioAsync(hintKeyVi)) ||
                             (await audioPlayer.getCachedAudioAsync(viText || hint.translation, effectiveVoiceVi));
            if (cachedVi) {
              await audioPlayer.playBase64(cachedVi, speed);
            } else {
              await audioPlayer.playChunk(textToSpeak, null, effectiveVoiceVi, speed);
            }
          }
        }
      } else {
        // EN_ONLY
        if (enText) {
          if (hint.audioUrl && hint.audioUrl.startsWith('http')) {
            await audioPlayer.playChunk(enText, hint.audioUrl, effectiveVoiceEn, speed);
          } else {
            const hintKeyEn = `improv_hint_${hint.id}_${effectiveVoiceEn}_en`;
            const cachedEn = (await audioPlayer.getCachedAudioAsync(hintKeyEn)) ||
                             (await audioPlayer.getCachedAudioAsync(`improv_hint_${hint.id}_aura-asteria-en_en`)) ||
                             (await audioPlayer.getCachedAudioAsync(enText, effectiveVoiceEn));
            if (cachedEn) {
              await audioPlayer.playBase64(cachedEn, speed);
            } else {
              await audioPlayer.playChunk(enText, null, effectiveVoiceEn, speed);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[ImprovPresentation] Single hint playback notice:', err);
    } finally {
      if (activeSequenceRef.current === seqId) {
        setIsPlayingAudio(false);
        setActivePlayingHintIndex(null);
      }
    }
  };

  // Play continuous combined item audio or fallback to revealed hints
  const playWholeItemAudio = async (
    item: ImprovItem,
    voiceEn: string = selectedVoice,
    voiceVi: string = selectedVoiceVi
  ) => {
    audioPlayer.stop();
    improvTts.stop();
    const seqId = ++activeSequenceRef.current;
    setIsPlayingAudio(true);

    const effectiveVoiceEn = (voiceEn && voiceEn !== 'aura-theia-en') ? voiceEn : 'aura-asteria-en';
    const effectiveVoiceVi = voiceVi || 'vi-VN-Neural2-A';

    try {
      if (languageMode === 'VI_ONLY') {
        if (item.audioUrlVi && item.audioUrlVi.startsWith('http')) {
          await improvTts.playItemAudio(item, speed, undefined, effectiveVoiceEn, effectiveVoiceVi, 'VI_ONLY');
          return;
        }
        const itemCacheKeyVi = `improv_item_${item.id}_${effectiveVoiceEn}_${effectiveVoiceVi}_VI_ONLY`;
        const cachedVi = (await audioPlayer.getCachedAudioAsync(itemCacheKeyVi)) ||
                         (await audioPlayer.getCachedAudioAsync(`improv_item_${item.id}_aura-asteria-en_${effectiveVoiceVi}_VI_ONLY`));
        if (cachedVi) {
          await audioPlayer.playBase64(cachedVi, speed);
          return;
        }
      } else {
        // EN_ONLY
        if (item.audioUrl && item.audioUrl.startsWith('http')) {
          await improvTts.playItemAudio(item, speed, undefined, effectiveVoiceEn, effectiveVoiceVi, 'EN_ONLY');
          return;
        }
        const itemCacheKeyEn = `improv_item_${item.id}_${effectiveVoiceEn}_${effectiveVoiceVi}_EN_ONLY`;
        const cachedEn = (await audioPlayer.getCachedAudioAsync(itemCacheKeyEn)) ||
                         (await audioPlayer.getCachedAudioAsync(`improv_item_${item.id}_aura-asteria-en_${effectiveVoiceVi}_EN_ONLY`));
        if (cachedEn) {
          await audioPlayer.playBase64(cachedEn, speed);
          return;
        }
      }

      // If neither GCS stream URL nor combined continuous cache exists: play hints sequentially
      if (item.hints && item.hints.length > 0) {
        await playRevealedHintsAudio(item.hints, effectiveVoiceEn, effectiveVoiceVi);
      }
    } catch (err) {
      console.warn('[ImprovPresentation] Whole item audio playback notice:', err);
    } finally {
      if (activeSequenceRef.current === seqId) {
        setIsPlayingAudio(false);
      }
    }
  };

  // Session Transition Controller
  const goToNextSession = (targetSession: ImprovSession) => {
    audioPlayer.stop();
    improvTts.stop();
    setSelectedSessionNum(targetSession.sessionNumber);
    setCurrentItemIndex(0);
    const initialStep = revealMode === 'all' ? (targetSession.items[0]?.hints?.length || 1) : 1;
    setCurrentRevealStep(initialStep);
    onSelectPackage?.(selectedPkgId, targetSession.sessionNumber);

    if (enableSoundCues) {
      playSessionTransitionChime();
    }
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 }
    });

    // Auto-play audio of first item/hint in new session
    const firstItem = targetSession.items[0];
    if (firstItem) {
      if (revealMode === 'step') {
        if (firstItem.hints && firstItem.hints[0]) {
          playSingleHintAudio(firstItem.hints[0], 0, selectedVoice, selectedVoiceVi);
        }
      } else {
        playWholeItemAudio(firstItem, selectedVoice, selectedVoiceVi);
      }
    }
  };

  // Navigation Logic
  const handleNext = () => {
    if (isBlackout) {
      setIsBlackout(false);
      return;
    }

    if (revealMode === 'step') {
      if (currentRevealStep < hints.length) {
        const nextStep = currentRevealStep + 1;
        setCurrentRevealStep(nextStep);
        // Play the newly revealed hint
        const newlyRevealed = hints[nextStep - 1];
        if (newlyRevealed) {
          playSingleHintAudio(newlyRevealed, nextStep - 1, selectedVoice, selectedVoiceVi);
        }
      } else {
        // Advance to next item or next session
        if (currentItemIndex < items.length - 1) {
          const nextIndex = currentItemIndex + 1;
          setCurrentItemIndex(nextIndex);
          setCurrentRevealStep(1);
          const nextItem = items[nextIndex];
          if (nextItem && nextItem.hints && nextItem.hints[0]) {
            playSingleHintAudio(nextItem.hints[0], 0, selectedVoice, selectedVoiceVi);
          }
        } else {
          // Last hint of the final item in session
          if (nextSession) {
            goToNextSession(nextSession);
          } else {
            // Already last session of package
            if (enableSoundCues) {
              playPackageCompletionFanfare();
            }
            confetti({
              particleCount: 150,
              spread: 100,
              origin: { y: 0.5 }
            });
          }
        }
      }
    } else {
      // All hints mode: Advance to next item immediately or next session
      if (currentItemIndex < items.length - 1) {
        const nextIndex = currentItemIndex + 1;
        setCurrentItemIndex(nextIndex);
        setCurrentRevealStep(items[nextIndex]?.hints?.length || 1);
        const nextItem = items[nextIndex];
        if (nextItem) {
          playWholeItemAudio(nextItem, selectedVoice, selectedVoiceVi);
        }
      } else {
        // Final item of the session
        if (nextSession) {
          goToNextSession(nextSession);
        } else {
          // Already last session of package
          if (enableSoundCues) {
            playPackageCompletionFanfare();
          }
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.5 }
          });
        }
      }
    }
  };

  const handlePrev = () => {
    if (isBlackout) {
      setIsBlackout(false);
      return;
    }

    if (revealMode === 'step') {
      if (currentRevealStep > 1) {
        setCurrentRevealStep(currentRevealStep - 1);
      } else {
        if (currentItemIndex > 0) {
          const prevIndex = currentItemIndex - 1;
          setCurrentItemIndex(prevIndex);
          const prevItem = items[prevIndex];
          const prevTotalHints = prevItem?.hints?.length || 1;
          setCurrentRevealStep(prevTotalHints);
        } else if (currentItemIndex === 0 && currentRevealStep === 1 && prevSession && prevSession.items.length > 0) {
          // Step back to the last item of previous session
          const lastIdx = prevSession.items.length - 1;
          const lastItem = prevSession.items[lastIdx];
          const lastItemHintsCount = lastItem?.hints?.length || 1;
          setSelectedSessionNum(prevSession.sessionNumber);
          setCurrentItemIndex(lastIdx);
          setCurrentRevealStep(lastItemHintsCount);
          onSelectPackage?.(selectedPkgId, prevSession.sessionNumber);
        }
      }
    } else {
      if (currentItemIndex > 0) {
        const prevIndex = currentItemIndex - 1;
        setCurrentItemIndex(prevIndex);
        setCurrentRevealStep(items[prevIndex]?.hints?.length || 1);
      } else if (currentItemIndex === 0 && prevSession && prevSession.items.length > 0) {
        // Step back to the last item of previous session
        const lastIdx = prevSession.items.length - 1;
        const lastItem = prevSession.items[lastIdx];
        const lastItemHintsCount = lastItem?.hints?.length || 1;
        setSelectedSessionNum(prevSession.sessionNumber);
        setCurrentItemIndex(lastIdx);
        setCurrentRevealStep(lastItemHintsCount);
        onSelectPackage?.(selectedPkgId, prevSession.sessionNumber);
      }
    }
  };

  const handleReplay = () => {
    if (revealMode === 'step') {
      const revealed = hints.slice(0, currentRevealStep);
      playRevealedHintsAudio(revealed, selectedVoice, selectedVoiceVi);
    } else {
      if (currentItem) {
        playWholeItemAudio(currentItem, selectedVoice, selectedVoiceVi);
      } else {
        playRevealedHintsAudio(hints, selectedVoice, selectedVoiceVi);
      }
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keybinding listener for Language Mode (Key 1 -> EN_ONLY, Key 2 -> VI_ONLY)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;
      if (showShortcutsModal || isPackagePopoverOpen || isAudioSettingsOpen || isSessionPopoverOpen || isListDrawerOpen) return;

      if (e.code === 'Digit1' || e.code === 'Numpad1' || e.key === '1') {
        setLanguageMode('EN_ONLY');
      } else if (e.code === 'Digit2' || e.code === 'Numpad2' || e.key === '2') {
        setLanguageMode('VI_ONLY');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcutsModal, isPackagePopoverOpen, isAudioSettingsOpen, isSessionPopoverOpen, isListDrawerOpen]);

  // Hardware Clicker Listener Hook
  usePresenterClicker({
    onNext: handleNext,
    onPrev: handlePrev,
    onToggleBlackout: () => setIsBlackout(prev => !prev),
    onToggleSubtitle: () => setShowSubtitle(prev => !prev),
    onReplayAudio: handleReplay,
    onTogglePartsDrawer: () => setIsListDrawerOpen(prev => !prev),
    onToggleChunkList: () => setIsListDrawerOpen(prev => !prev),
    onToggleFullscreen: handleToggleFullscreen,
    onSetLoop: (count) => {
      if (count === 1) setLanguageMode('EN_ONLY');
      if (count === 2) setLanguageMode('VI_ONLY');
    },
    isModalOpen: showShortcutsModal || isPackagePopoverOpen || isAudioSettingsOpen || isSessionPopoverOpen || isListDrawerOpen
  });

  // Audition voice test
  const handleAuditionVoice = async (voiceId: string) => {
    setIsAuditioningVoice(true);
    try {
      const isVi = voiceId.startsWith('vi');
      const sampleText = isVi
        ? "Chào mừng bạn đến với chế độ luyện phản xạ CHUNKS Improv."
        : "Welcome to CHUNKS Improv Focus Mode.";
      await audioPlayer.playChunk(
        sampleText,
        null,
        voiceId,
        speed,
        voiceId.startsWith('en-US')
      );
    } finally {
      setIsAuditioningVoice(false);
    }
  };

  const selectPackage = (pkg: ImprovPackage) => {
    setSelectedPkgId(pkg.id);
    const firstSession = pkg.sessions?.[0]?.sessionNumber || 1;
    setSelectedSessionNum(firstSession);
    setCurrentItemIndex(0);
    setCurrentRevealStep(1);
    setIsPackagePopoverOpen(false);
    onSelectPackage?.(pkg.id, firstSession);
  };

  const selectSession = (sessionNum: number) => {
    setSelectedSessionNum(sessionNum);
    setCurrentItemIndex(0);
    setCurrentRevealStep(1);
    setIsSessionPopoverOpen(false);
    onSelectPackage?.(selectedPkgId, sessionNum);
  };

  // Progress percentage
  const totalItemsCount = items.length || 1;
  const progressPercent = Math.round(((currentItemIndex + 1) / totalItemsCount) * 100);

  return (
    <div
      style={{ fontFamily: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      className={`fixed inset-0 z-50 flex flex-col select-none overflow-hidden transition-colors duration-200 ${
        highContrastDark 
          ? 'bg-[#0A0A0A] text-white' 
          : 'bg-[#FAFAFA] text-black'
      }`}
    >
      {/* ==================================================================== */}
      {/* 1. BLACKOUT OVERLAY (Key B / Period) */}
      {/* ==================================================================== */}
      {isBlackout && (
        <div
          onClick={() => setIsBlackout(false)}
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center cursor-pointer animate-fade-in"
        >
          <div className="text-zinc-700 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span>Blackout Mode Active • Bấm phím bất kỳ để quay lại</span>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. TOP BAR */}
      {/* ==================================================================== */}
      <header
        className={`h-16 px-4 md:px-6 flex items-center justify-between border-b shrink-0 z-30 ${
          highContrastDark 
            ? 'bg-[#111111] border-zinc-800' 
            : 'bg-white border-[#E8E8EC]'
        }`}
      >
        {/* Left Side: Brand, Session Pill, Package Switcher */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          {/* Logo Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <img 
              src="/logo.png" 
              alt="CHUNKS" 
              className="h-7 w-auto object-contain rounded" 
            />
            <span className="hidden lg:inline-flex text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20">
              IMPROV STAGE
            </span>
          </div>

          {/* Session Pill Popover */}
          <div className="relative" ref={sessionPopoverRef}>
            <button
              onClick={() => setIsSessionPopoverOpen(!isSessionPopoverOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                highContrastDark
                  ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-200'
                  : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
              <span>
                Session {selectedSessionNum} • {activeSession?.hcTotal || hints.length || 2} Hints
              </span>
              {isSessionReady && (
                <Volume2 className="w-4 h-4 text-emerald-500 shrink-0 animate-in fade-in" title="Session đã sẵn sàng audio" />
              )}
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {isSessionPopoverOpen && (
              <div
                className={`absolute left-0 mt-2 w-64 rounded-xl shadow-2xl border p-2 z-50 animate-scale-up ${
                  highContrastDark
                    ? 'bg-[#18181B] border-zinc-700 text-white'
                    : 'bg-white border-[#E8E8EC] text-zinc-900'
                }`}
              >
                <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase text-zinc-400">
                  Select Session
                </div>
                <div className="space-y-1 mt-1">
                  {(activePackage?.sessions || []).map((s) => {
                    const isSelected = s.sessionNumber === selectedSessionNum;
                    const sId = (s as any).id || String(s.sessionNumber);
                    const isSessReady = Boolean(readySessionMap[sId] || readySessionMap[String(s.sessionNumber)]);
                    return (
                      <button
                        key={s.sessionNumber}
                        onClick={() => selectSession(s.sessionNumber)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${
                          isSelected
                            ? 'bg-[#DC2626] text-white'
                            : highContrastDark
                            ? 'hover:bg-zinc-800 text-zinc-300'
                            : 'hover:bg-zinc-100 text-zinc-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{s.title || `Session ${s.sessionNumber}`}</span>
                            {isSessReady && (
                              <Volume2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="Audio đã sẵn sàng" />
                            )}
                          </div>
                          <div className={`text-[10px] font-mono ${isSelected ? 'text-red-100' : 'text-zinc-400'}`}>
                            {s.hcTotal || 2} hints • {s.items.length} items
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Package Switcher Popover */}
          <div className="relative" ref={packagePopoverRef}>
            <button
              onClick={() => setIsPackagePopoverOpen(!isPackagePopoverOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold max-w-[160px] sm:max-w-[260px] truncate transition-all cursor-pointer shadow-2xs ${
                highContrastDark
                  ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
              <span className="truncate">{activePackage?.title || 'Select Package'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            </button>

            {isPackagePopoverOpen && (
              <div
                className={`absolute left-0 mt-2 w-80 sm:w-96 rounded-xl shadow-2xl border p-3 z-50 animate-scale-up ${
                  highContrastDark
                    ? 'bg-[#18181B] border-zinc-700 text-white'
                    : 'bg-white border-[#E8E8EC] text-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="text-[11px] font-mono font-bold uppercase text-zinc-400">
                    Improv Packages ({packages.length})
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {packages.reduce((sum, p) => sum + p.totalItems, 0)} Total Drills
                  </span>
                </div>

                {/* Search Input */}
                <div className="relative mt-2 mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={packageSearchQuery}
                    onChange={(e) => setPackageSearchQuery(e.target.value)}
                    placeholder="Search packages..."
                    className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:border-[#DC2626] ${
                      highContrastDark
                        ? 'bg-zinc-900 border-zinc-700 text-white'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  />
                </div>

                {/* Package List */}
                <div className="max-h-64 overflow-y-auto space-y-1 py-1">
                  {filteredPackages.map((pkg) => {
                    const isSelected = pkg.id === activePackage?.id;
                    const isPkgReady = Boolean(readyPackageMap[pkg.id]);
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => selectPackage(pkg)}
                        className={`w-full text-left p-2.5 rounded-lg flex items-start justify-between text-xs transition-all ${
                          isSelected
                            ? 'bg-[#DC2626]/10 border border-[#DC2626]/30 text-[#DC2626] font-bold'
                            : highContrastDark
                            ? 'hover:bg-zinc-800 text-zinc-200'
                            : 'hover:bg-zinc-50 text-zinc-800'
                        }`}
                      >
                        <div className="min-w-0 mr-2">
                          <div className="truncate font-semibold flex items-center gap-1.5">
                            <span>{pkg.title}</span>
                            {isPkgReady && (
                              <Volume2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="Audio đã sẵn sàng" />
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                            {pkg.sessionsCount || pkg.sessions?.length || 1} sessions • {pkg.totalItems} items
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                  {filteredPackages.length === 0 && (
                    <div className="text-center py-4 text-xs text-zinc-400">
                      No matching improv packages found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* List Drawer Toggle Button */}
          <button
            onClick={() => setIsListDrawerOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              highContrastDark
                ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-200'
                : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-900'
            }`}
            title="Xem danh sách câu trong Package [Phím L / P]"
          >
            <ListOrdered className="w-3.5 h-3.5 text-[#DC2626]" />
            <span className="hidden sm:inline">Danh Sách Câu</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold">
              {currentItemIndex + 1}/{totalItemsCount}
            </span>
          </button>
        </div>

        {/* Center: Item Progress Counter & Bar */}
        <div className="hidden md:flex flex-col items-center justify-center min-w-[180px] max-w-xs">
          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            <span className="text-[#DC2626]">
              Câu {currentItemIndex + 1}
            </span>
            <span className="text-zinc-400">/</span>
            <span className="text-zinc-500">{totalItemsCount}</span>
          </div>

          <div className="w-36 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-[#DC2626] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Right Side: Language Mode, Voice Settings, Theme, Fullscreen, Exit */}
        <div className="flex items-center gap-2">
          {/* Top Bar Language Mode Pill */}
          <div className="hidden sm:flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setLanguageMode('EN_ONLY')}
              className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                languageMode === 'EN_ONLY'
                  ? 'bg-white dark:bg-zinc-800 text-[#DC2626] shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
              title="Chỉ đọc tiếng Anh (Phím 1)"
            >
              EN
            </button>
            <button
              onClick={() => setLanguageMode('VI_ONLY')}
              className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                languageMode === 'VI_ONLY'
                  ? 'bg-white dark:bg-zinc-800 text-[#DC2626] shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
              title="Chỉ đọc tiếng Việt (Google Cloud TTS) (Phím 2)"
            >
              VI
            </button>
          </div>

          {/* Audio Setup Popover Button */}
          <div className="relative" ref={audioSettingsRef}>
            <button
              onClick={() => setIsAudioSettingsOpen(!isAudioSettingsOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                highContrastDark
                  ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-800'
              }`}
              title="Cài đặt giọng đọc & TTS"
            >
              {isSessionReady ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#DC2626]" />
              )}
              <span className="hidden sm:inline-block font-mono text-[11px]">
                {isSessionReady
                  ? 'Audio Ready'
                  : selectedVoice.replace('en-US-', '').replace('aura-', '')}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {isAudioSettingsOpen && (
              <div
                className={`absolute right-0 mt-2 w-84 sm:w-96 max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl border p-4 z-50 animate-scale-up ${
                  highContrastDark
                    ? 'bg-[#18181B] border-zinc-700 text-white'
                    : 'bg-white border-[#E8E8EC] text-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800 mb-3">
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#DC2626]" />
                    <span>Cấu hình Âm Thanh Improv</span>
                  </div>
                  <button
                    onClick={() => setIsAudioSettingsOpen(false)}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isSessionReady ? (
                  /* Audio Ready Banner */
                  <div className="p-3 mb-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
                      <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                        <span>Audio Đã Sẵn Sàng</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">Cache Sẵn Có</span>
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 leading-snug mt-0.5">
                        Session đang sử dụng audio Improv đã tạo sẵn. Tùy chọn model TTS được ẩn.
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* TTS Provider Segmented Switch */}
                    <div className="mb-3">
                      <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block mb-1">
                        TTS Speech Engine
                      </label>
                      <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <button
                          type="button"
                          onClick={() => {
                            setAudioProvider('DEEPGRAM_AURA');
                            audioPlayer.setAudioProvider('DEEPGRAM_AURA');
                          }}
                          className={`py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                            audioProvider === 'DEEPGRAM_AURA'
                              ? 'bg-white dark:bg-zinc-800 text-[#DC2626] shadow-xs'
                              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                          }`}
                        >
                          Deepgram Aura
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAudioProvider('GOOGLE_TTS');
                            audioPlayer.setAudioProvider('GOOGLE_TTS');
                          }}
                          className={`py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                            audioProvider === 'GOOGLE_TTS'
                              ? 'bg-white dark:bg-zinc-800 text-[#DC2626] shadow-xs'
                              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                          }`}
                        >
                          Google Cloud TTS
                        </button>
                      </div>
                    </div>

                    {/* English Voice Selector */}
                    <div className="mb-3">
                      <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block mb-1">
                        English Voice Model
                      </label>
                      <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className={`w-full p-2 text-xs rounded-lg border focus:outline-none focus:border-[#DC2626] cursor-pointer ${
                          highContrastDark
                            ? 'bg-zinc-900 border-zinc-700 text-white'
                            : 'bg-white border-zinc-200 text-zinc-900'
                        }`}
                      >
                        <optgroup label="Deepgram Aura (Ultra-Fast 0ms)">
                          {DEEPGRAM_AURA_VOICES.filter(v => v.id !== 'aura-theia-en').map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name} ({v.gender})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Google Cloud TTS (Journey / Studio)">
                          {GOOGLE_TTS_VOICES.filter(v => v.languageCode.startsWith('en')).map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name} ({v.gender})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    {/* Vietnamese Voice Selector */}
                    <div className="mb-4">
                      <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block mb-1">
                        Vietnamese Voice Model (Google Cloud)
                      </label>
                      <select
                        value={selectedVoiceVi}
                        onChange={(e) => setSelectedVoiceVi(e.target.value)}
                        className={`w-full p-2 text-xs rounded-lg border focus:outline-none focus:border-[#DC2626] cursor-pointer ${
                          highContrastDark
                            ? 'bg-zinc-900 border-zinc-700 text-white'
                            : 'bg-white border-zinc-200 text-zinc-900'
                        }`}
                      >
                        <optgroup label="Google Chirp3-HD (Studio Studio Quality)">
                          {GOOGLE_TTS_VOICES.filter(v => v.languageCode === 'vi-VN' && v.id.includes('Chirp3-HD')).map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.id} ({v.gender === 'FEMALE' ? 'Nữ' : 'Nam'})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Google Neural2 (Chuẩn Tự Nhiên)">
                          {GOOGLE_TTS_VOICES.filter(v => v.languageCode === 'vi-VN' && v.id.includes('Neural2')).map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.id} ({v.gender === 'FEMALE' ? 'Nữ Chuẩn' : 'Nam Chuẩn'})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Google WaveNet">
                          {GOOGLE_TTS_VOICES.filter(v => v.languageCode === 'vi-VN' && v.id.includes('Wavenet')).map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.id} ({v.gender === 'FEMALE' ? 'Nữ' : 'Nam'})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Google Standard">
                          {GOOGLE_TTS_VOICES.filter(v => v.languageCode === 'vi-VN' && v.id.includes('Standard')).map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.id} ({v.gender === 'FEMALE' ? 'Nữ' : 'Nam'})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    {/* Audition Test Buttons */}
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => handleAuditionVoice(selectedVoice)}
                        disabled={isAuditioningVoice}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                        title="Thử phát âm tiếng Anh"
                      >
                        <Radio className={`w-3.5 h-3.5 text-[#DC2626] ${isAuditioningVoice ? 'animate-spin' : ''}`} />
                        <span>Thử EN</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAuditionVoice(selectedVoiceVi)}
                        disabled={isAuditioningVoice}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                        title="Thử phát âm tiếng Việt"
                      >
                        <Radio className={`w-3.5 h-3.5 text-emerald-600 ${isAuditioningVoice ? 'animate-spin' : ''}`} />
                        <span>Thử VI</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Speed, Pause & Sound Cues Controls - Always Accessible */}
                <div className={`pt-3 border-t space-y-3.5 ${
                  highContrastDark ? 'border-zinc-800' : 'border-zinc-200'
                }`}>
                  {/* 1. Tốc độ đọc (Speed) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold">
                        Tốc độ đọc (Speed)
                      </label>
                      <span className="font-mono text-xs font-extrabold text-[#DC2626]">
                        {speed.toFixed(1)}x
                      </span>
                    </div>
                    {/* Quick Presets */}
                    <div className="grid grid-cols-4 gap-1 mb-2">
                      {[0.8, 1.0, 1.2, 1.5].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setSpeed(preset)}
                          className={`py-1 text-[11px] font-mono font-bold rounded-md transition-all cursor-pointer ${
                            Math.abs(speed - preset) < 0.05
                              ? 'bg-[#DC2626] text-white shadow-xs'
                              : highContrastDark
                              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                          }`}
                        >
                          {preset.toFixed(1)}x
                        </button>
                      ))}
                    </div>
                    {/* Slider */}
                    <input
                      type="range"
                      min="0.7"
                      max="2.0"
                      step="0.05"
                      value={speed}
                      onChange={(e) => setSpeed(parseFloat(e.target.value))}
                      className="w-full accent-[#DC2626] cursor-pointer h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-zinc-400 mt-1">
                      <span>0.7x (Chậm)</span>
                      <span>1.0x (Chuẩn)</span>
                      <span>2.0x (Nhanh)</span>
                    </div>
                  </div>

                  {/* 2. Khoảng nghỉ giữa các Hints (Pause) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold">
                        Khoảng nghỉ giữa các Hints (Pause)
                      </label>
                      <span className="font-mono text-xs font-extrabold text-[#DC2626]">
                        {hintPauseSec.toFixed(1)}s
                      </span>
                    </div>
                    {/* Quick Presets */}
                    <div className="grid grid-cols-5 gap-1 mb-2">
                      {[
                        { val: 0.3, label: '0.3s', tip: 'Cực nhanh' },
                        { val: 0.5, label: '0.5s', tip: 'Nhanh' },
                        { val: 0.8, label: '0.8s', tip: 'Tự nhiên' },
                        { val: 1.0, label: '1.0s', tip: 'Chuẩn' },
                        { val: 1.5, label: '1.5s', tip: 'Chậm' }
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => setHintPauseSec(preset.val)}
                          title={preset.tip}
                          className={`py-1 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer flex flex-col items-center justify-center ${
                            Math.abs(hintPauseSec - preset.val) < 0.05
                              ? 'bg-[#DC2626] text-white shadow-xs'
                              : highContrastDark
                              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                          }`}
                        >
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                    {/* Slider */}
                    <input
                      type="range"
                      min="0.3"
                      max="1.5"
                      step="0.1"
                      value={hintPauseSec}
                      onChange={(e) => setHintPauseSec(parseFloat(e.target.value))}
                      className="w-full accent-[#DC2626] cursor-pointer h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-zinc-400 mt-1">
                      <span>0.3s (Cực nhanh)</span>
                      <span>0.8s (Tự nhiên)</span>
                      <span>1.5s (Chậm)</span>
                    </div>
                  </div>

                  {/* 3. Âm đệm chuyển Session (Sound Cues) */}
                  <div className="pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-[#DC2626]" />
                        <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                          Âm đệm Web Audio (Sound Cues)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEnableSoundCues(!enableSoundCues)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                          enableSoundCues ? 'bg-[#DC2626] justify-end' : 'bg-zinc-300 dark:bg-zinc-700 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                      </button>
                    </div>

                    {/* Audition sound cues buttons */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={playSessionTransitionChime}
                        className="flex-1 py-1.5 px-2 text-[10px] font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer flex items-center justify-center gap-1"
                        title="Nghe thử âm chuyển Session (Arpeggio 4 nốt C5-E5-G5-C6)"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Thử Chime</span>
                      </button>
                      <button
                        type="button"
                        onClick={playPackageCompletionFanfare}
                        className="flex-1 py-1.5 px-2 text-[10px] font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer flex items-center justify-center gap-1"
                        title="Nghe thử âm hoàn thành Package (Hợp âm Fanfare)"
                      >
                        <Trophy className="w-3 h-3 text-rose-500" />
                        <span>Thử Fanfare</span>
                      </button>
                    </div>
                  </div>

                  {/* 4. Chế độ đọc (Language Mode) */}
                  <div className="pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                    <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block mb-1">
                      Chế độ đọc (Language Mode)
                    </label>
                    <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setLanguageMode('EN_ONLY')}
                        className={`py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                          languageMode === 'EN_ONLY'
                            ? 'bg-white dark:bg-zinc-800 text-[#DC2626] shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                      >
                        English (1)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguageMode('VI_ONLY')}
                        className={`py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                          languageMode === 'VI_ONLY'
                            ? 'bg-white dark:bg-zinc-800 text-[#DC2626] shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                      >
                        Tiếng Việt (2)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setHighContrastDark(!highContrastDark)}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              highContrastDark
                ? 'bg-zinc-900 border-zinc-800 text-amber-400 hover:bg-zinc-800'
                : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
            }`}
            title={highContrastDark ? 'Switch to Light Mode' : 'Switch to High-Contrast Dark'}
          >
            {highContrastDark ? <SunMedium className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Shortcuts Guide Modal Toggle */}
          <button
            onClick={() => setShowShortcutsModal(true)}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              highContrastDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
            }`}
            title="Bảng phím tắt trình chiếu"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleToggleFullscreen}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              highContrastDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
            }`}
            title="Toggle Fullscreen (F5 / Key F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Exit Button */}
          {onExit && (
            <button
              onClick={onExit}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <span>Thoát</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 3. MAIN STAGE CENTER (Horizontal Hint Cards Container) */}
      {/* ==================================================================== */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 md:px-12 py-6 overflow-y-auto z-10">
        {items.length === 0 ? (
          <div className="text-center max-w-md p-8 border border-dashed rounded-2xl border-zinc-300 dark:border-zinc-800">
            <BookOpen className="w-12 h-12 mx-auto text-zinc-400 mb-3" />
            <h3 className="font-bold text-lg mb-1">Chưa có dữ liệu Improv</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Vui lòng chọn hoặc tạo gói Improv trong Improv Studio.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 flex flex-col items-center">
            {/* Stage Header Info Pill */}
            <div className="mb-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <span className="text-xs font-mono font-extrabold uppercase px-3 py-1 rounded-full bg-zinc-200/80 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 tracking-wider">
                Session {selectedSessionNum} • {hints.length} hints
              </span>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 font-bold tracking-wider">
                Item {currentItemIndex + 1}/{totalItemsCount}
              </span>
              {isLastItemInSession && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 dark:border-amber-400/40 shadow-xs animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-ping" />
                  <span>CÂU CUỐI CỦA SESSION</span>
                </span>
              )}
            </div>

            {/* Horizontal Hints Flow Container (Always Parallel Columns, Projector-Optimized) */}
            <div
              className={`justify-center items-stretch w-full ${
                hints.length === 2
                  ? 'grid grid-cols-2 gap-4 sm:gap-8 md:gap-12 max-w-5xl'
                  : hints.length === 3
                  ? 'grid grid-cols-3 gap-3 sm:gap-6 md:gap-8 max-w-6xl'
                  : hints.length === 5
                  ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 max-w-7xl'
                  : 'grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 max-w-7xl'
              }`}
            >
              {hints.map((hint, idx) => {
                const isRevealed = revealMode === 'all' || idx < currentRevealStep;
                const isCurrentlySpeaking = isPlayingAudio && activePlayingHintIndex === idx;
                const badgeInfo = getSemanticBadge(hint.typeFunction, idx);

                if (!isRevealed) {
                  // Step Reveal Placeholder: Clear contrast, Non-Boxy
                  return (
                    <div
                      key={hint.id || `unrevealed_${idx}`}
                      onClick={() => {
                        setCurrentRevealStep(idx + 1);
                        playSingleHintAudio(hint, idx, selectedVoice, selectedVoiceVi);
                      }}
                      className="min-h-[180px] md:min-h-[220px] p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 group bg-[#F3F4F6] dark:bg-[#18181B] border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"
                    >
                      <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-150 shadow-xs">
                        <Lock className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                      </div>
                      <div className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                        Gợi ý {idx + 1}
                      </div>
                      <div className="text-[11px] sm:text-xs text-zinc-800 dark:text-zinc-200 font-bold mt-1">
                        Bấm hoặc Space để mở
                      </div>
                    </div>
                  );
                }

                // Main Primary & Secondary Content by Language Mode
                const enText = getHintTextByLanguage(hint, 'en');
                const viText = getHintTextByLanguage(hint, 'vi');

                const mainText = languageMode === 'VI_ONLY' ? (viText || enText) : (enText || viText);
                const subText = languageMode === 'VI_ONLY' ? enText : viText;

                // Revealed Hint Item: High-Signal, High-Contrast Stage Display
                return (
                  <div
                    key={hint.id || `hint_${idx}`}
                    className={`min-h-[200px] md:min-h-[260px] p-4 md:p-6 flex flex-col justify-between transition-all duration-200 relative group rounded-2xl bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800 shadow-sm ${
                      isCurrentlySpeaking
                        ? 'bg-red-50/50 dark:bg-red-950/20 ring-2 ring-[#DC2626]/60 border-red-300 dark:border-red-900'
                        : 'hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {/* Top: Compact Semantic Role Badge & Individual Play Button */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] md:text-[11px] font-mono font-bold uppercase tracking-wider border shadow-xs ${
                          highContrastDark ? badgeInfo.darkBadgeClass : badgeInfo.badgeClass
                        }`}
                      >
                        <span 
                          className="w-1.5 h-1.5 rounded-full shrink-0" 
                          style={{ backgroundColor: badgeInfo.accentColor }} 
                        />
                        <span>{badgeInfo.label}</span>
                      </span>

                      <button
                        onClick={() => playSingleHintAudio(hint, idx, selectedVoice, selectedVoiceVi)}
                        className={`p-1.5 rounded-full transition-all duration-150 cursor-pointer ${
                          isCurrentlySpeaking
                            ? 'bg-[#DC2626] text-white shadow-md animate-pulse'
                            : highContrastDark
                            ? 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 hover:text-black'
                        }`}
                        title="Nghe riêng gợi ý này"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Center: Responsive Typography (Zero-Overflow Projector Display) */}
                    <div className="my-auto py-2.5 flex-1 flex flex-col justify-center items-center text-center w-full">
                      <div
                        className={`${getResponsiveHintTypography(mainText)} transition-colors duration-150 text-center w-full ${
                          isCurrentlySpeaking
                            ? 'text-[#DC2626] animate-pulse'
                            : 'text-zinc-950 dark:text-zinc-50'
                        }`}
                      >
                        {mainText}
                      </div>

                      {/* Bottom Subtitle / Transcript: Clearly Sized & Toggleable (Key V) */}
                      {showSubtitle && subText && subText !== mainText && (
                        <div className="mt-2 text-sm sm:text-base font-medium text-zinc-700 dark:text-zinc-300 leading-snug text-center w-full">
                          {subText}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Session Transition or Package Completion Banner */}
            {isLastItemFullyRevealed && (
              <div className="w-full max-w-4xl mt-8 animate-fade-in">
                {nextSession ? (
                  <div className={`p-5 sm:p-6 rounded-2xl border transition-all shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 ${
                    highContrastDark
                      ? 'bg-zinc-900/90 border-amber-500/40 text-zinc-100 shadow-amber-950/20'
                      : 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-amber-300 text-zinc-900 shadow-amber-100'
                  }`}>
                    <div className="flex items-center gap-3.5 text-center sm:text-left">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 text-2xl shadow-xs">
                        🎉
                      </div>
                      <div>
                        <div className="font-extrabold text-base sm:text-lg text-zinc-900 dark:text-zinc-100">
                          Đã hoàn thành Session {selectedSessionNum}!
                        </div>
                        <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                          Bấm <span className="font-bold text-zinc-900 dark:text-zinc-100">Tiếp tục</span> (Phím <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[11px]">Space</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[11px]">➔</kbd>) để sang Session {nextSession.sessionNumber}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => goToNextSession(nextSession)}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      <span>Sang Session {nextSession.sessionNumber}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className={`p-8 rounded-2xl border transition-all shadow-xl text-center flex flex-col items-center ${
                    highContrastDark
                      ? 'bg-zinc-900/90 border-rose-500/40 text-zinc-100 shadow-rose-950/20'
                      : 'bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-rose-300 text-zinc-900 shadow-rose-100'
                  }`}>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center mb-3 shadow-md text-3xl">
                      🏆
                    </div>
                    <h3 className="font-black text-xl sm:text-2xl text-zinc-950 dark:text-white mb-1">
                      Chúc mừng! Bạn đã hoàn thành toàn bộ Package
                    </h3>
                    <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-6">
                      {activePackage?.title}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          if (activePackage?.sessions && activePackage.sessions.length > 0) {
                            const firstSess = activePackage.sessions[0];
                            setSelectedSessionNum(firstSess.sessionNumber);
                            setCurrentItemIndex(0);
                            setCurrentRevealStep(revealMode === 'all' ? (firstSess.items[0]?.hints?.length || 1) : 1);
                            onSelectPackage?.(selectedPkgId, firstSess.sessionNumber);
                          }
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Luyện lại từ Session 1</span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentItemIndex(0);
                          setCurrentRevealStep(revealMode === 'all' ? (items[0]?.hints?.length || 1) : 1);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Luyện lại Session này</span>
                      </button>
                      <button
                        onClick={() => {
                          if (enableSoundCues) playPackageCompletionFanfare();
                          confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
                        }}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-400/60 dark:border-amber-500/40 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Ăn mừng (Confetti)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* 4. BOTTOM DOCK (Presenter Clicker & Controls) */}
      {/* ==================================================================== */}
      <footer
        className={`h-20 px-4 md:px-8 border-t flex items-center justify-between shrink-0 z-30 ${
          highContrastDark 
            ? 'bg-[#111111] border-zinc-800' 
            : 'bg-white border-[#E8E8EC]'
        }`}
      >
        {/* Left: Reveal Mode Selector, Language Mode Toggle & Subtitle Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Reveal Mode Segmented Switch */}
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => {
                setRevealMode('step');
                setCurrentRevealStep(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                revealMode === 'step'
                  ? 'bg-white dark:bg-zinc-800 text-[#DC2626] shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Từng bước (Step)
            </button>
            <button
              onClick={() => {
                setRevealMode('all');
                setCurrentRevealStep(hints.length);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                revealMode === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-[#DC2626] shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Hiện tất cả (All)
            </button>
          </div>

          {/* Language Mode Segmented Switch (EN / VI) */}
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setLanguageMode('EN_ONLY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                languageMode === 'EN_ONLY'
                  ? 'bg-white dark:bg-zinc-800 text-[#DC2626] shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
              title="Tiếng Anh làm trung tâm (Phím 1)"
            >
              <span>EN</span>
              <span className="text-[9px] font-mono px-1 rounded bg-zinc-200/80 dark:bg-zinc-700/80 text-zinc-600 dark:text-zinc-300">1</span>
            </button>
            <button
              onClick={() => setLanguageMode('VI_ONLY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                languageMode === 'VI_ONLY'
                  ? 'bg-white dark:bg-zinc-800 text-[#DC2626] shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
              title="Tiếng Việt làm trung tâm (Phím 2)"
            >
              <span>VI</span>
              <span className="text-[9px] font-mono px-1 rounded bg-zinc-200/80 dark:bg-zinc-700/80 text-zinc-600 dark:text-zinc-300">2</span>
            </button>
          </div>

          {/* Subtitle Visibility Toggle (Key V) */}
          <button
            onClick={() => setShowSubtitle(!showSubtitle)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              showSubtitle
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                : 'bg-transparent text-zinc-400 border-dashed border-zinc-300 dark:border-zinc-800'
            }`}
            title="Bật/tắt dịch nghĩa tiếng Việt (Phím V)"
          >
            {showSubtitle ? <Eye className="w-3.5 h-3.5 text-[#DC2626]" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Vietsub</span>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
              V
            </span>
          </button>

          {/* List Drawer Toggle (Key L / Key P) */}
          <button
            onClick={() => setIsListDrawerOpen(!isListDrawerOpen)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isListDrawerOpen
                ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border-zinc-400'
                : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100'
            }`}
            title="Xem danh sách câu trong Package (Phím L / P)"
          >
            <ListOrdered className="w-3.5 h-3.5 text-[#DC2626]" />
            <span className="hidden sm:inline">Danh sách</span>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
              L
            </span>
          </button>
        </div>

        {/* Center: Replay Button & Hardware Clicker Navigation */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Previous Button (PageUp / ArrowLeft) */}
          <button
            onClick={handlePrev}
            disabled={currentItemIndex === 0 && (revealMode === 'all' || currentRevealStep === 1) && !prevSession}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              currentItemIndex === 0 && (revealMode === 'all' || currentRevealStep === 1) && !prevSession
                ? 'opacity-30 cursor-not-allowed border-transparent'
                : highContrastDark
                ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-white'
                : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-900'
            }`}
            title={
              currentItemIndex === 0 && (revealMode === 'all' || currentRevealStep === 1) && prevSession
                ? `Lùi về Session ${prevSession.sessionNumber} (PageUp / Mũi tên trái)`
                : "Lùi lại (PageUp / Mũi tên trái)"
            }
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Replay Audio Button (Key R) */}
          <button
            onClick={handleReplay}
            disabled={isPlayingAudio}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-white transition-all cursor-pointer shadow-md active:scale-95 ${
              isPlayingAudio
                ? 'bg-[#DC2626] ring-4 ring-[#DC2626]/30 animate-pulse'
                : 'bg-[#DC2626] hover:bg-[#B91C1C]'
            }`}
            title={`Phát lại toàn bộ gợi ý kèm khoảng nghỉ ${hintPauseSec.toFixed(1)}s (Phím R)`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{isPlayingAudio ? 'Đang đọc...' : 'Phát âm (R)'}</span>
          </button>

          {/* Next Button (PageDown / Space / ArrowRight) */}
          <button
            onClick={handleNext}
            className={`flex items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer shadow-xs active:scale-95 ${
              isLastItemFullyRevealed
                ? nextSession
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-amber-400 ring-2 ring-amber-400/30 px-4'
                  : 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white border-rose-400 ring-2 ring-rose-400/30 px-4 animate-pulse'
                : highContrastDark
                ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-white'
                : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-900'
            }`}
            title={
              isLastItemFullyRevealed
                ? nextSession
                  ? `Sang Session ${nextSession.sessionNumber} (Space / ➔)`
                  : 'Hoàn thành Package! (Bấm để ăn mừng)'
                : 'Tiếp tục (PageDown / Phím Space / Mũi tên phải)'
            }
          >
            {isLastItemFullyRevealed ? (
              nextSession ? (
                <>
                  <span className="text-xs font-bold hidden sm:inline">Sang Session {nextSession.sessionNumber}</span>
                  <FastForward className="w-5 h-5 animate-pulse" />
                </>
              ) : (
                <>
                  <span className="text-xs font-bold hidden sm:inline">Hoàn thành</span>
                  <Trophy className="w-5 h-5" />
                </>
              )
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Right: Audio Speed, Pause & Blackout Toggle */}
        <div className="flex items-center gap-3">
          {/* Audio Speed Slider */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900" title="Tốc độ phát âm">
            <span className="text-[10px] font-mono font-bold text-zinc-400">
              {speed.toFixed(1)}x
            </span>
            <input
              type="range"
              min="0.7"
              max="2.0"
              step="0.05"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-16 sm:w-20 accent-[#DC2626] cursor-pointer"
            />
          </div>

          {/* Hint Pause Indicator */}
          <div
            onClick={() => setIsAudioSettingsOpen(true)}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            title="Khoảng nghỉ giữa các Hints (bấm để chỉnh)"
          >
            <span className="text-[10px] font-mono font-bold text-zinc-400">Pause:</span>
            <span className="text-xs font-mono font-extrabold text-[#DC2626]">{hintPauseSec.toFixed(1)}s</span>
          </div>

          {/* Blackout Button (Key B) */}
          <button
            onClick={() => setIsBlackout(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              highContrastDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
            }`}
            title="Màn hình đen hoàn toàn (Phím B hoặc Dấu chấm)"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-black border border-zinc-500" />
            <span className="hidden sm:inline">Blackout</span>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
              B
            </span>
          </button>
        </div>
      </footer>

      {/* ==================================================================== */}
      {/* 5. KEYBOARD SHORTCUTS MODAL */}
      {/* ==================================================================== */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div
            className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl ${
              highContrastDark 
                ? 'bg-[#18181B] border-zinc-700 text-white' 
                : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Keyboard className="w-4 h-4 text-[#DC2626]" />
                <span>Bảng phím tắt & Remote Clicker</span>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs font-sans">
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Mở gợi ý tiếp / Sang câu & Session kế</span>
                <span className="font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  Space / PageDown / →
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Quay lại gợi ý / Câu & Session trước</span>
                <span className="font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  PageUp / ←
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Đọc lại gợi ý (kèm khoảng nghỉ)</span>
                <span className="font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  Key R
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Chế độ Tiếng Anh / Tiếng Việt</span>
                <span className="font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  Phím 1 / Phím 2
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Mở danh sách câu trong bài</span>
                <span className="font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  Key L / Key P
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Bật / tắt dịch nghĩa tiếng Việt</span>
                <span className="font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  Key V
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Màn hình đen (Blackout)</span>
                <span className="font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  Key B / Dấu chấm (.)
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-zinc-500">Toàn màn hình</span>
                <span className="font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  F5 / Key F
                </span>
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="w-full py-2 bg-[#DC2626] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. PACKAGE ITEM LIST DRAWER (Key L / Key P) */}
      {/* ==================================================================== */}
      {isListDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          {/* Click outside to close */}
          <div className="flex-1" onClick={() => setIsListDrawerOpen(false)} />

          <div
            className={`w-full max-w-md md:max-w-lg h-full flex flex-col shadow-2xl border-l z-10 animate-slide-left ${
              highContrastDark
                ? 'bg-[#18181B] border-zinc-700 text-white'
                : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-[#DC2626]" />
                <div>
                  <h3 className="font-bold text-sm">Danh Sách Câu Improv</h3>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    {activePackage?.title} • Session {selectedSessionNum}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsListDrawerOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Session Switcher inside Drawer */}
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto">
              {(activePackage?.sessions || []).map((s) => {
                const isSelected = s.sessionNumber === selectedSessionNum;
                const hintCount = s.hcTotal || s.items?.[0]?.hints?.length || 2;
                return (
                  <button
                    key={s.sessionNumber}
                    onClick={() => {
                      setSelectedSessionNum(s.sessionNumber);
                      setCurrentItemIndex(0);
                      setCurrentRevealStep(1);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#DC2626] text-white shadow-xs'
                        : highContrastDark
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    <span>Session {s.sessionNumber}</span>
                    <span
                      className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-black/10 dark:bg-white/10 text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {hintCount} hints
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {items.map((item, idx) => {
                const isCurrent = idx === currentItemIndex;
                const isCompleted = idx < currentItemIndex;

                return (
                  <div
                    key={item.id || idx}
                    onClick={() => {
                      setCurrentItemIndex(idx);
                      setCurrentRevealStep(1);
                      setIsListDrawerOpen(false);
                    }}
                    className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col gap-2 group ${
                      isCurrent
                        ? 'border-[#DC2626] bg-[#DC2626]/[0.08] shadow-xs ring-1 ring-[#DC2626]'
                        : isCompleted
                        ? highContrastDark
                          ? 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                          : 'border-zinc-200/90 bg-zinc-50/80 hover:border-zinc-300'
                        : highContrastDark
                        ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800/90'
                        : 'border-[#E8E8EC] hover:border-zinc-300 bg-white hover:bg-zinc-50'
                    }`}
                  >
                    {/* Minimal status indicator */}
                    <div className="flex items-center gap-2">
                      {isCurrent ? (
                        <>
                          <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] animate-pulse shrink-0" />
                          <span className="text-xs font-mono font-black text-black dark:text-white">
                            #{item.itemNumber || idx + 1}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-[#DC2626]">
                            Đang học
                          </span>
                        </>
                      ) : isCompleted ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400">
                            #{item.itemNumber || idx + 1}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700 shrink-0" />
                          <span className="text-xs font-mono font-medium text-zinc-500">
                            #{item.itemNumber || idx + 1}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Hints Preview: High contrast black in Light Mode, zinc-100 in Dark Mode */}
                    <div className="flex flex-wrap items-baseline gap-y-1 text-xs font-bold leading-snug">
                      {item.hints.map((h, hIdx) => {
                        const enText = getHintTextByLanguage(h, 'en') || h.text;
                        const viText = getHintTextByLanguage(h, 'vi') || h.translation;
                        return (
                          <React.Fragment key={h.id || hIdx}>
                            <span className="inline-flex items-baseline gap-1.5">
                              {viText ? (
                                <>
                                  <span className="text-black dark:text-zinc-100 font-bold text-xs leading-snug">
                                    {viText}
                                  </span>
                                  {enText && enText !== viText && (
                                    <span className="text-black dark:text-zinc-200 font-mono font-bold text-xs leading-snug">
                                      ({enText})
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-black dark:text-zinc-100 font-bold text-xs leading-snug">
                                  {enText}
                                </span>
                              )}
                            </span>
                            {hIdx < item.hints.length - 1 && (
                              <span className="text-[#DC2626] font-bold text-xs mx-1.5 shrink-0 select-none">➔</span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
