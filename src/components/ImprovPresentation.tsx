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
import { getHintTextByLanguage } from '../services/improvTtsService';
import { usePresenterClicker } from '../hooks/usePresenterClicker';
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
  Globe
} from 'lucide-react';

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
  const [selectedVoice, setSelectedVoice] = useState<string>(
    audioSettings?.voice_profile_en || 'aura-asteria-en'
  );
  const [selectedVoiceVi, setSelectedVoiceVi] = useState<string>(
    audioSettings?.voice_profile_vi || 'vi-VN-Neural2-A'
  );
  const [speed, setSpeed] = useState<number>(audioSettings?.default_speed || 1.0);
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

  // Sync audioSettings if updated
  useEffect(() => {
    if (audioSettings?.voice_profile_en) {
      setSelectedVoice(audioSettings.voice_profile_en);
    }
    if (audioSettings?.voice_profile_vi) {
      setSelectedVoiceVi(audioSettings.voice_profile_vi);
    }
    if (audioSettings?.default_speed) {
      setSpeed(audioSettings.default_speed);
    }
  }, [audioSettings?.voice_profile_en, audioSettings?.voice_profile_vi, audioSettings?.default_speed]);

  // Filtered packages for switcher popover
  const filteredPackages = useMemo(() => {
    if (!packageSearchQuery.trim()) return packages;
    const q = packageSearchQuery.toLowerCase();
    return packages.filter(p => 
      p.title.toLowerCase().includes(q) || 
      (p.description && p.description.toLowerCase().includes(q))
    );
  }, [packages, packageSearchQuery]);

  // Audio Playback Engine: Sequential Hints with 1-second gap
  const playRevealedHintsAudio = async (
    hintsToPlay: ImprovHint[],
    voiceEn: string = selectedVoice,
    voiceVi: string = selectedVoiceVi
  ) => {
    audioPlayer.stop();
    const seqId = ++activeSequenceRef.current;
    setIsPlayingAudio(true);

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
            await audioPlayer.playChunk(textToSpeak, null, voiceVi || 'vi-VN-Neural2-A', speed);
          }
        } else {
          // EN_ONLY
          if (enText) {
            await audioPlayer.playChunk(enText, null, voiceEn, speed, voiceEn.startsWith('en-US'));
          }
        }

        if (activeSequenceRef.current !== seqId) return;
        if (i < hintsToPlay.length - 1) {
          // 1-second silence gap between hints
          await new Promise(res => setTimeout(res, 1000));
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

  // Play single hint audio
  const playSingleHintAudio = async (
    hint: ImprovHint,
    index: number,
    voiceEn: string = selectedVoice,
    voiceVi: string = selectedVoiceVi
  ) => {
    audioPlayer.stop();
    const seqId = ++activeSequenceRef.current;
    setIsPlayingAudio(true);
    setActivePlayingHintIndex(index);

    try {
      const enText = getHintTextByLanguage(hint, 'en') || hint.text;
      const viText = getHintTextByLanguage(hint, 'vi') || hint.translation;

      if (languageMode === 'VI_ONLY') {
        const textToSpeak = viText || enText;
        if (textToSpeak) {
          await audioPlayer.playChunk(textToSpeak, null, voiceVi || 'vi-VN-Neural2-A', speed);
        }
      } else {
        // EN_ONLY
        if (enText) {
          await audioPlayer.playChunk(enText, null, voiceEn, speed, voiceEn.startsWith('en-US'));
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
        // Advance to next item
        if (currentItemIndex < items.length - 1) {
          const nextIndex = currentItemIndex + 1;
          setCurrentItemIndex(nextIndex);
          setCurrentRevealStep(1);
          const nextItem = items[nextIndex];
          if (nextItem && nextItem.hints && nextItem.hints[0]) {
            playSingleHintAudio(nextItem.hints[0], 0, selectedVoice, selectedVoiceVi);
          }
        }
      }
    } else {
      // All hints mode: Advance to next item immediately
      if (currentItemIndex < items.length - 1) {
        const nextIndex = currentItemIndex + 1;
        setCurrentItemIndex(nextIndex);
        setCurrentRevealStep(items[nextIndex]?.hints?.length || 1);
        const nextItem = items[nextIndex];
        if (nextItem && nextItem.hints) {
          playRevealedHintsAudio(nextItem.hints, selectedVoice, selectedVoiceVi);
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
        }
      }
    } else {
      if (currentItemIndex > 0) {
        const prevIndex = currentItemIndex - 1;
        setCurrentItemIndex(prevIndex);
        setCurrentRevealStep(items[prevIndex]?.hints?.length || 1);
      }
    }
  };

  const handleReplay = () => {
    if (revealMode === 'step') {
      const revealed = hints.slice(0, currentRevealStep);
      playRevealedHintsAudio(revealed, selectedVoice, selectedVoiceVi);
    } else {
      playRevealedHintsAudio(hints, selectedVoice, selectedVoiceVi);
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
      await audioPlayer.playChunk(
        "Welcome to CHUNKS Improv Focus Mode.",
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
                          <div>{s.title || `Session ${s.sessionNumber}`}</div>
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
                          <div className="truncate font-semibold">{pkg.title}</div>
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
              <Volume2 className="w-3.5 h-3.5 text-[#DC2626]" />
              <span className="hidden sm:inline-block font-mono text-[11px]">
                {selectedVoice.replace('en-US-', '').replace('aura-', '')}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {isAudioSettingsOpen && (
              <div
                className={`absolute right-0 mt-2 w-80 rounded-xl shadow-2xl border p-4 z-50 animate-scale-up ${
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
                    className="p-1 rounded text-zinc-400 hover:text-zinc-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* TTS Provider Segmented Switch */}
                <div className="mb-3">
                  <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block mb-1">
                    TTS Speech Engine
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                    <button
                      onClick={() => {
                        setAudioProvider('DEEPGRAM_AURA');
                        audioPlayer.setAudioProvider('DEEPGRAM_AURA');
                      }}
                      className={`py-1 text-[11px] font-bold rounded-md transition-all ${
                        audioProvider === 'DEEPGRAM_AURA'
                          ? 'bg-white dark:bg-zinc-800 text-[#DC2626] shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      Deepgram Aura
                    </button>
                    <button
                      onClick={() => {
                        setAudioProvider('GOOGLE_TTS');
                        audioPlayer.setAudioProvider('GOOGLE_TTS');
                      }}
                      className={`py-1 text-[11px] font-bold rounded-md transition-all ${
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
                    className={`w-full p-2 text-xs rounded-lg border focus:outline-none focus:border-[#DC2626] ${
                      highContrastDark
                        ? 'bg-zinc-900 border-zinc-700 text-white'
                        : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  >
                    <optgroup label="Deepgram Aura (Ultra-Fast 0ms)">
                      {DEEPGRAM_AURA_VOICES.map((v) => (
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
                    className={`w-full p-2 text-xs rounded-lg border focus:outline-none focus:border-[#DC2626] ${
                      highContrastDark
                        ? 'bg-zinc-900 border-zinc-700 text-white'
                        : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  >
                    <optgroup label="Google Chirp3-HD (Studio Studio Quality)">
                      <option value="vi-VN-Chirp3-HD-Vindemiatrix">vi-VN-Chirp3-HD-Vindemiatrix (Nữ)</option>
                      <option value="vi-VN-Chirp3-HD-Orus">vi-VN-Chirp3-HD-Orus (Nam)</option>
                    </optgroup>
                    <optgroup label="Google Neural2 (Chuẩn Tự Nhiên)">
                      <option value="vi-VN-Neural2-A">vi-VN-Neural2-A (Nữ Chuẩn)</option>
                      <option value="vi-VN-Neural2-D">vi-VN-Neural2-D (Nam Chuẩn)</option>
                    </optgroup>
                  </select>
                </div>

                {/* Audition Test Button */}
                <button
                  onClick={() => handleAuditionVoice(selectedVoice)}
                  disabled={isAuditioningVoice}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  <Radio className={`w-3.5 h-3.5 text-[#DC2626] ${isAuditioningVoice ? 'animate-spin' : ''}`} />
                  <span>{isAuditioningVoice ? 'Đang phát thử giọng...' : 'Thử giọng đọc mẫu'}</span>
                </button>
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
            <div className="mb-6 flex items-center gap-3">
              <span className="text-xs font-mono font-extrabold uppercase px-3 py-1 rounded-full bg-zinc-200/80 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 tracking-wider">
                Session {selectedSessionNum} • {hints.length} hints
              </span>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 font-bold tracking-wider">
                Item {currentItemIndex + 1}/{totalItemsCount}
              </span>
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
                const mainText = languageMode === 'VI_ONLY' ? (hint.translation || hint.text) : hint.text;
                const subText = languageMode === 'VI_ONLY' ? hint.text : hint.translation;

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
                    <div className="my-auto py-2.5 flex-1 flex flex-col justify-center">
                      <div
                        className={`${getResponsiveHintTypography(mainText)} transition-colors duration-150 ${
                          isCurrentlySpeaking
                            ? 'text-[#DC2626] animate-pulse'
                            : 'text-zinc-950 dark:text-zinc-50'
                        }`}
                      >
                        {mainText}
                      </div>

                      {/* Bottom Subtitle / Transcript: Clearly Sized & Toggleable (Key V) */}
                      {showSubtitle && subText && (
                        <div className="mt-2 text-sm sm:text-base font-medium text-zinc-700 dark:text-zinc-300 leading-snug">
                          {subText}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
            disabled={currentItemIndex === 0 && (revealMode === 'all' || currentRevealStep === 1)}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              currentItemIndex === 0 && (revealMode === 'all' || currentRevealStep === 1)
                ? 'opacity-30 cursor-not-allowed border-transparent'
                : highContrastDark
                ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-white'
                : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-900'
            }`}
            title="Lùi lại (PageUp / Mũi tên trái)"
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
            title="Phát lại toàn bộ gợi ý kèm khoảng nghỉ 1 giây (Phím R)"
          >
            <Volume2 className="w-4 h-4" />
            <span>{isPlayingAudio ? 'Đang đọc...' : 'Phát âm (R)'}</span>
          </button>

          {/* Next Button (PageDown / Space / ArrowRight) */}
          <button
            onClick={handleNext}
            disabled={currentItemIndex >= items.length - 1 && currentRevealStep >= hints.length}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              currentItemIndex >= items.length - 1 && currentRevealStep >= hints.length
                ? 'opacity-30 cursor-not-allowed border-transparent'
                : highContrastDark
                ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-white'
                : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-900'
            }`}
            title="Tiếp tục (PageDown / Phím Space / Mũi tên phải)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Audio Speed Slider & Blackout Toggle */}
        <div className="flex items-center gap-3">
          {/* Audio Speed Slider */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
            <span className="text-[10px] font-mono font-bold text-zinc-400">
              {speed.toFixed(1)}x
            </span>
            <input
              type="range"
              min="0.8"
              max="2.0"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-20 accent-[#DC2626] cursor-pointer"
            />
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
                <span className="text-zinc-500">Mở gợi ý tiếp / Sang câu kế</span>
                <span className="font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  Space / PageDown / →
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Quay lại gợi ý / Câu trước</span>
                <span className="font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  PageUp / ←
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Đọc lại âm thanh (kèm 1s gap)</span>
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
                return (
                  <button
                    key={s.sessionNumber}
                    onClick={() => {
                      setSelectedSessionNum(s.sessionNumber);
                      setCurrentItemIndex(0);
                      setCurrentRevealStep(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#DC2626] text-white shadow-xs'
                        : highContrastDark
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    Session {s.sessionNumber} ({s.items.length})
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : isCurrent ? (
                          <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse shrink-0" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700 shrink-0" />
                        )}

                        <span className="text-xs font-mono font-bold text-zinc-950 dark:text-zinc-50">
                          Câu {item.itemNumber || idx + 1}
                        </span>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
                          {item.hints.length} hints
                        </span>
                      </div>

                      <div>
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#DC2626] bg-[#DC2626]/15 px-2.5 py-0.5 rounded-full border border-red-300 dark:border-red-900 animate-pulse">
                            <Flame className="w-3 h-3 text-[#DC2626]" /> Đang Học
                          </span>
                        ) : isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Đã Xong
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 font-medium">
                            Chưa học
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hints Preview */}
                    <div className="flex flex-wrap items-baseline gap-y-1 text-xs">
                      {item.hints.map((h, hIdx) => (
                        <React.Fragment key={h.id || hIdx}>
                          <span className="inline-flex items-baseline gap-1.5">
                            {h.translation && (
                              <span className="text-zinc-900 dark:text-zinc-100 font-bold">
                                {h.translation}
                              </span>
                            )}
                            {h.text && (
                              <span className="text-zinc-600 dark:text-zinc-300 font-mono text-[11px] font-semibold">
                                ({h.text})
                              </span>
                            )}
                          </span>
                          {hIdx < item.hints.length - 1 && (
                            <span className="text-[#DC2626] font-bold text-xs mx-1.5 shrink-0">➔</span>
                          )}
                        </React.Fragment>
                      ))}
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
