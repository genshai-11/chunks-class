import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ImprovPackage, 
  ImprovSession, 
  ImprovItem, 
  ImprovHint, 
  CohortAudioSettings 
} from '../types';
import { getAllImprovPackages } from '../services/improvService';
import { 
  audioPlayer, 
  GOOGLE_TTS_VOICES, 
  AudioProvider 
} from '../services/googleTtsService';
import { DEEPGRAM_AURA_VOICES } from '../services/deepgramTtsService';
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
  BookOpen
} from 'lucide-react';

interface ImprovPresentationProps {
  packageId?: string;
  sessionNumber?: number;
  onExit?: () => void;
  audioSettings?: CohortAudioSettings;
  onSelectPackage?: (packageId: string, sessionNumber?: number) => void;
}

interface SemanticBadge {
  label: string;
  badgeClass: string;
  darkBadgeClass: string;
  accentColor: string;
}

function getSemanticBadge(typeFunction: string, hintIndex: number): SemanticBadge {
  const norm = (typeFunction || '').toLowerCase().trim();

  if (norm.includes('key') || norm.includes('seed') || norm.includes('core')) {
    return {
      label: 'Keyword',
      badgeClass: 'bg-red-50 text-red-700 border-red-200',
      darkBadgeClass: 'bg-red-950/40 text-red-400 border-red-800/60',
      accentColor: '#DC2626'
    };
  }
  if (norm.includes('logic') || norm.includes('colloc') || norm.includes('slot') || norm.includes('connect')) {
    return {
      label: 'Logic word',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      darkBadgeClass: 'bg-amber-950/40 text-amber-400 border-amber-800/60',
      accentColor: '#F59E0B'
    };
  }
  if (norm.includes('fancy') || norm.includes('adv') || norm.includes('contrast') || norm.includes('nuance') || norm.includes('idiom')) {
    return {
      label: 'Fancy word',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
      darkBadgeClass: 'bg-purple-950/40 text-purple-400 border-purple-800/60',
      accentColor: '#8B5CF6'
    };
  }
  if (norm.includes('end') || norm.includes('resol') || norm.includes('context') || norm.includes('example')) {
    return {
      label: 'Ending',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      darkBadgeClass: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60',
      accentColor: '#10B981'
    };
  }
  if (norm.includes('wh') || norm.includes('quest') || norm.includes('dialog') || norm.includes('react')) {
    return {
      label: 'WH word',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      darkBadgeClass: 'bg-blue-950/40 text-blue-400 border-blue-800/60',
      accentColor: '#3B82F6'
    };
  }

  // Fallback by hint position
  switch (hintIndex) {
    case 0:
      return {
        label: 'Keyword',
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        darkBadgeClass: 'bg-red-950/40 text-red-400 border-red-800/60',
        accentColor: '#DC2626'
      };
    case 1:
      return {
        label: 'Logic word',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        darkBadgeClass: 'bg-amber-950/40 text-amber-400 border-amber-800/60',
        accentColor: '#F59E0B'
      };
    case 2:
      return {
        label: 'Fancy word',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        darkBadgeClass: 'bg-purple-950/40 text-purple-400 border-purple-800/60',
        accentColor: '#8B5CF6'
      };
    default:
      return {
        label: 'Ending',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        darkBadgeClass: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60',
        accentColor: '#10B981'
      };
  }
}

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

  // Audio Engine & Synthesis State
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
  const playRevealedHintsAudio = async (hintsToPlay: ImprovHint[]) => {
    audioPlayer.stop();
    const seqId = ++activeSequenceRef.current;
    setIsPlayingAudio(true);

    try {
      for (let i = 0; i < hintsToPlay.length; i++) {
        if (activeSequenceRef.current !== seqId) return;
        setActivePlayingHintIndex(i);
        const hint = hintsToPlay[i];
        
        await audioPlayer.playChunk(
          hint.text, 
          null, 
          selectedVoice, 
          speed
        );

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
  const playSingleHintAudio = async (hint: ImprovHint, index: number) => {
    audioPlayer.stop();
    const seqId = ++activeSequenceRef.current;
    setIsPlayingAudio(true);
    setActivePlayingHintIndex(index);

    try {
      await audioPlayer.playChunk(hint.text, null, selectedVoice, speed);
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
          playSingleHintAudio(newlyRevealed, nextStep - 1);
        }
      } else {
        // Advance to next item
        if (currentItemIndex < items.length - 1) {
          const nextIndex = currentItemIndex + 1;
          setCurrentItemIndex(nextIndex);
          setCurrentRevealStep(1);
          const nextItem = items[nextIndex];
          if (nextItem && nextItem.hints && nextItem.hints[0]) {
            playSingleHintAudio(nextItem.hints[0], 0);
          }
        }
      }
    } else {
      // All hints mode: Advance to next item immediately
      if (currentItemIndex < items.length - 1) {
        const nextIndex = currentItemIndex + 1;
        setCurrentItemIndex(nextIndex);
        setCurrentRevealStep(hints.length);
        const nextItem = items[nextIndex];
        if (nextItem && nextItem.hints) {
          playRevealedHintsAudio(nextItem.hints);
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
      playRevealedHintsAudio(revealed);
    } else {
      playRevealedHintsAudio(hints);
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

  // Hardware Clicker Listener Hook
  usePresenterClicker({
    onNext: handleNext,
    onPrev: handlePrev,
    onToggleBlackout: () => setIsBlackout(prev => !prev),
    onToggleSubtitle: () => setShowSubtitle(prev => !prev),
    onReplayAudio: handleReplay,
    onToggleFullscreen: handleToggleFullscreen,
    isModalOpen: showShortcutsModal || isPackagePopoverOpen || isAudioSettingsOpen || isSessionPopoverOpen
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
      className={`fixed inset-0 z-50 flex flex-col select-none font-sans overflow-hidden transition-colors duration-200 ${
        highContrastDark 
          ? 'bg-[#0A0A0A] text-white' 
          : 'bg-[#F8F9FA] text-[#0A0A0A]'
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

        {/* Right Side: Voice Settings, Theme, Fullscreen, Exit */}
        <div className="flex items-center gap-2">
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
                    <optgroup label="Google Cloud TTS (Studio / Journey)">
                      {GOOGLE_TTS_VOICES.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Vietnamese Subtitle Voice Selector */}
                <div className="mb-3">
                  <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block mb-1">
                    Vietnamese Voice (Chirp3-HD / Neural2)
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
                    <option value="vi-VN-Neural2-A">vi-VN-Neural2-A (Female Natural)</option>
                    <option value="vi-VN-Neural2-D">vi-VN-Neural2-D (Male Clear)</option>
                    <option value="vi-VN-Chirp3-HD-Vindemiatrix">vi-VN-Chirp3-HD-Vindemiatrix (Deep Female)</option>
                    <option value="vi-VN-Chirp3-HD-Orus">vi-VN-Chirp3-HD-Orus (Studio Male)</option>
                    <option value="vi-VN-Standard-A">vi-VN-Standard-A (Standard)</option>
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
          <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
            {/* Stage Header Info Pill */}
            <div className="mb-6 flex items-center gap-3">
              <span className="text-xs font-mono font-extrabold uppercase px-3 py-1 rounded-full bg-zinc-200/80 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 tracking-wider">
                {activeSession?.title || `Session ${selectedSessionNum}`}
              </span>
              <span className="text-xs font-mono text-zinc-400 font-semibold">
                Item {currentItemIndex + 1} / {totalItemsCount}
              </span>
            </div>

            {/* Horizontal Hint Cards Grid */}
            <div
              className={`w-full grid gap-4 md:gap-6 justify-center items-stretch ${
                hints.length === 2
                  ? 'grid-cols-1 md:grid-cols-2 max-w-4xl'
                  : hints.length === 3
                  ? 'grid-cols-1 md:grid-cols-3 max-w-5xl'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl'
              }`}
            >
              {hints.map((hint, idx) => {
                const isRevealed = revealMode === 'all' || idx < currentRevealStep;
                const isCurrentlySpeaking = isPlayingAudio && activePlayingHintIndex === idx;
                const badgeInfo = getSemanticBadge(hint.typeFunction, idx);

                if (!isRevealed) {
                  // Mystery / Placeholder Card in Step Reveal Mode
                  return (
                    <div
                      key={hint.id || `unrevealed_${idx}`}
                      onClick={() => {
                        setCurrentRevealStep(idx + 1);
                        playSingleHintAudio(hint, idx);
                      }}
                      className={`min-h-[220px] md:min-h-[280px] p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all group ${
                        highContrastDark
                          ? 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300'
                          : 'bg-white/60 border-zinc-300 hover:border-zinc-400 text-zinc-400 hover:text-zinc-700'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Lock className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div className="text-xs font-mono font-bold uppercase tracking-wider">
                        Gợi ý {idx + 1}
                      </div>
                      <div className="text-[11px] font-sans text-zinc-400 mt-1">
                        Bấm để mở hoặc nhấn phím Space
                      </div>
                    </div>
                  );
                }

                // Revealed Card
                return (
                  <div
                    key={hint.id || `hint_${idx}`}
                    className={`min-h-[220px] md:min-h-[280px] p-6 md:p-8 rounded-2xl md:rounded-3xl border flex flex-col justify-between transition-all duration-300 relative group shadow-sm ${
                      isCurrentlySpeaking
                        ? 'ring-4 ring-[#DC2626]/40 border-[#DC2626] scale-[1.02]'
                        : highContrastDark
                        ? 'bg-[#141414] border-zinc-800 hover:border-zinc-700'
                        : 'bg-white border-zinc-200/90 hover:border-zinc-300 hover:shadow-md'
                    }`}
                  >
                    {/* Card Top: Semantic Role Badge & Individual Play Button */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`text-[11px] md:text-xs font-mono font-extrabold uppercase px-2.5 py-1 rounded-md border tracking-wider flex items-center gap-1.5 ${
                          highContrastDark ? badgeInfo.darkBadgeClass : badgeInfo.badgeClass
                        }`}
                      >
                        <span 
                          className="w-1.5 h-1.5 rounded-full" 
                          style={{ backgroundColor: badgeInfo.accentColor }} 
                        />
                        <span>{badgeInfo.label}</span>
                      </span>

                      <button
                        onClick={() => playSingleHintAudio(hint, idx)}
                        className={`p-2 rounded-full transition-all cursor-pointer ${
                          isCurrentlySpeaking
                            ? 'bg-[#DC2626] text-white shadow-md animate-pulse'
                            : highContrastDark
                            ? 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                        }`}
                        title="Nghe riêng gợi ý này"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Card Center: English Text with Large Crisp Display Typography */}
                    <div className="my-auto py-2">
                      <div className="font-display font-extrabold text-2xl md:text-4xl lg:text-5xl leading-tight tracking-tight text-zinc-900 dark:text-zinc-50">
                        {hint.text}
                      </div>
                    </div>

                    {/* Card Bottom: Vietnamese Translation Subtitle */}
                    {showSubtitle && hint.translation && (
                      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                        <div className="text-sm md:text-base font-sans font-medium text-zinc-500 dark:text-zinc-400">
                          {hint.translation}
                        </div>
                      </div>
                    )}
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
        {/* Left: Reveal Mode Selector & Subtitle Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Reveal Mode Segmented Switch */}
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => {
                setRevealMode('step');
                setCurrentRevealStep(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                revealMode === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-[#DC2626] shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Hiện tất cả (All)
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
                className="w-full py-2 bg-[#DC2626] text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
