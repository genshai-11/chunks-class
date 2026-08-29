import React, { useState, useEffect, useRef } from 'react';
import { ChunkItem, LessonDoc, LanguageMode, CohortAudioSettings, LessonPart } from '../types';
import { CURRICULUM_CATALOG_LEVEL_B } from '../data/curriculumData';
import { CURRICULUM_CATALOG_LEVEL_A } from '../data/levelAData';
import { getLessonById as getFirestoreLessonById } from '../services/firestoreService';
import { audioPlayer, GOOGLE_TTS_VOICES, VoiceOption } from '../services/googleTtsService';
import { usePresenterClicker } from '../hooks/usePresenterClicker';
import { PartsDrawer, groupChunksIntoParts } from './PartsDrawer';
import { PresentationProgressBar } from './PresentationProgressBar';
import { AudioDiagnosticModal } from './AudioDiagnosticModal';
import { AudioSourceType } from '../services/googleTtsService';
import confetti from 'canvas-confetti';
import { 
  Volume2, 
  ChevronLeft, 
  ChevronRight, 
  Layers,
  Moon, 
  SunMedium,
  Maximize2, 
  Minimize2, 
  Keyboard, 
  Eye, 
  EyeOff,
  Music,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Radio,
  Activity,
  Cloud,
  Laptop,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Wifi,
  WifiOff
} from 'lucide-react';

interface ClassroomPresentationProps {
  lesson?: LessonDoc | null;
  initialLessonId?: string;
  sessionNumber?: number;
  onExit?: () => void;
  audioSettings?: CohortAudioSettings;
  courseLevel?: string;
}

export const ClassroomPresentation: React.FC<ClassroomPresentationProps> = ({
  lesson: providedLesson,
  initialLessonId = "level_b_day_1",
  sessionNumber = 1,
  onExit,
  audioSettings,
  courseLevel = 'LEVEL_B'
}) => {
  const [currentLessonId, setCurrentLessonId] = useState<string>(
    providedLesson ? providedLesson.id : initialLessonId
  );
  const [fetchedLessonDoc, setFetchedLessonDoc] = useState<LessonDoc | null>(providedLesson || null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [showSubtitle, setShowSubtitle] = useState<boolean>(true);
  const [isBlackout, setIsBlackout] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPartsDrawerOpen, setIsPartsDrawerOpen] = useState<boolean>(false);

  // Audio parameters & Real Google Cloud TTS Models
  const [selectedVoice, setSelectedVoice] = useState<string>(
    audioSettings?.voice_profile_en || 'en-US-Journey-F'
  );
  const [selectedVoiceVi, setSelectedVoiceVi] = useState<string>(
    audioSettings?.voice_profile_vi || 'vi-VN-Neural2-A'
  );
  const [speed, setSpeed] = useState<number>(audioSettings?.default_speed || 1.0);
  const [repeatCount, setRepeatCount] = useState<number>(audioSettings?.repeat_count || 1);
  const [languageMode, setLanguageMode] = useState<LanguageMode>(
    audioSettings?.language_mode || 'EN_THEN_VI'
  );
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
  const [gcsConnectionStatus, setGcsConnectionStatus] = useState<'Connected' | 'Reconnecting'>('Connected');
  const [signalStrength, setSignalStrength] = useState<'high' | 'medium' | 'low'>('high');
  const [isCheckingGcs, setIsCheckingGcs] = useState<boolean>(false);
  const [activeSpeechStep, setActiveSpeechStep] = useState<'en' | 'vi' | 'idle'>('idle');
  const [highContrastDark, setHighContrastDark] = useState<boolean>(false);
  const [showKeyboardGuide, setShowKeyboardGuide] = useState<boolean>(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState<boolean>(false);
  const [activeAudioSource, setActiveAudioSource] = useState<AudioSourceType>(audioPlayer.getLastSource());

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubSource = audioPlayer.onSourceChange((source) => {
      setActiveAudioSource(source);
      if (source === 'GCS_MASTER') {
        setGcsConnectionStatus('Connected');
        setSignalStrength('high');
      }
    });

    const unsubLoading = audioPlayer.onLoadingChange((loading) => {
      setIsAudioLoading(loading);
      if (loading) {
        setSignalStrength('medium');
      }
    });

    return () => {
      unsubSource();
      unsubLoading();
    };
  }, []);

  // Load lesson if not provided directly
  useEffect(() => {
    if (providedLesson && providedLesson.id === currentLessonId) {
      setFetchedLessonDoc(providedLesson);
      return;
    }

    let isMounted = true;
    getFirestoreLessonById(currentLessonId)
      .then(doc => {
        if (isMounted && doc) {
          setFetchedLessonDoc(doc);
        }
      })
      .catch(err => {
        console.warn("[Presenter] Fallback to local catalog:", err);
      });

    return () => { isMounted = false; };
  }, [currentLessonId, providedLesson]);

  const allAvailableLessons: LessonDoc[] = currentLessonId.startsWith('level_a') 
    ? CURRICULUM_CATALOG_LEVEL_A 
    : CURRICULUM_CATALOG_LEVEL_B;

  const activeLesson: LessonDoc = fetchedLessonDoc || 
    allAvailableLessons.find(l => l.id === currentLessonId) || 
    allAvailableLessons[0];

  const chunks: ChunkItem[] = activeLesson?.chunks || [];
  const currentChunk: ChunkItem = chunks[currentChunkIndex] || chunks[0];

  const parts: LessonPart[] = groupChunksIntoParts(chunks);

  // Verify GCS resource availability on chunk or lesson changes
  const verifyGcsAvailability = async (chunkItem?: ChunkItem) => {
    const target = chunkItem || currentChunk;
    if (!target) return;
    setIsCheckingGcs(true);
    try {
      if (target.audio_url) {
        const isAvailable = await audioPlayer.checkGcsResource(target.audio_url);
        if (isAvailable) {
          setGcsConnectionStatus('Connected');
          setSignalStrength('high');
        } else {
          setGcsConnectionStatus('Reconnecting');
          setSignalStrength('low');
        }
      } else {
        setGcsConnectionStatus('Connected');
        setSignalStrength('high');
      }
    } catch {
      setGcsConnectionStatus('Reconnecting');
      setSignalStrength('low');
    } finally {
      setIsCheckingGcs(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    if (!currentChunk) return;

    if (currentChunk.audio_url) {
      setIsCheckingGcs(true);
      audioPlayer.checkGcsResource(currentChunk.audio_url).then((isAvailable) => {
        if (isCancelled) return;
        setIsCheckingGcs(false);
        if (isAvailable) {
          setGcsConnectionStatus('Connected');
          setSignalStrength('high');
        } else {
          setGcsConnectionStatus('Reconnecting');
          setSignalStrength('low');
        }
      }).catch(() => {
        if (isCancelled) return;
        setIsCheckingGcs(false);
        setGcsConnectionStatus('Reconnecting');
        setSignalStrength('low');
      });
    } else {
      setGcsConnectionStatus('Connected');
      setSignalStrength('high');
    }

    return () => {
      isCancelled = true;
    };
  }, [currentChunk]);

  // Play current chunk audio using Real Google Cloud TTS (Journey / Studio) & GCS permanent URL
  const playCurrentChunkAudio = async (
    targetChunk: ChunkItem = currentChunk,
    overrideSpeed?: number,
    overrideMode?: LanguageMode,
    overrideRepeat?: number
  ) => {
    if (!targetChunk) return;
    setIsPlayingAudio(true);

    const s = overrideSpeed !== undefined ? overrideSpeed : speed;
    const m = overrideMode || languageMode;
    const r = overrideRepeat !== undefined ? overrideRepeat : repeatCount;

    try {
      await audioPlayer.playBilingualSequence(
        targetChunk.english,
        targetChunk.vietnamese,
        m,
        targetChunk.audio_url,
        selectedVoice,
        selectedVoiceVi,
        s,
        r,
        (step) => {
          setActiveSpeechStep(step);
        }
      );
    } catch (err) {
      console.error('[Presenter Audio] Playback notice:', err);
    } finally {
      setIsPlayingAudio(false);
      setActiveSpeechStep('idle');
    }
  };

  // Step Forward (Clicker Next / PageDown / Space)
  const handleNext = () => {
    if (isBlackout) {
      setIsBlackout(false);
      return;
    }

    if (currentChunkIndex < chunks.length - 1) {
      const nextIdx = currentChunkIndex + 1;
      setCurrentChunkIndex(nextIdx);
      playCurrentChunkAudio(chunks[nextIdx]);
    } else {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 }
      });
    }
  };

  // Step Back (Clicker Prev / PageUp)
  const handlePrev = () => {
    if (isBlackout) {
      setIsBlackout(false);
      return;
    }
    if (currentChunkIndex > 0) {
      const prevIdx = currentChunkIndex - 1;
      setCurrentChunkIndex(prevIdx);
      playCurrentChunkAudio(chunks[prevIdx]);
    }
  };

  // Replay Audio (Key R)
  const handleReplay = () => {
    if (isBlackout) setIsBlackout(false);
    playCurrentChunkAudio(currentChunk);
  };

  // Toggle Blackout Screen (Key B / Period)
  const handleToggleBlackout = () => {
    setIsBlackout(prev => !prev);
    audioPlayer.stop();
  };

  // Toggle Subtitle (Key V)
  const handleToggleSubtitle = () => {
    setShowSubtitle(prev => !prev);
  };

  // Toggle Parts Drawer (Key P)
  const handleTogglePartsDrawer = () => {
    setIsPartsDrawerOpen(prev => !prev);
  };

  // Toggle Fullscreen (Key F / F5)
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Set Loop Repeat Count (Keys 1, 2, 3)
  const handleSetLoop = (count: number) => {
    setRepeatCount(count);
  };

  // Hook Wireless Hardware Clicker
  usePresenterClicker({
    onNext: handleNext,
    onPrev: handlePrev,
    onToggleBlackout: handleToggleBlackout,
    onToggleSubtitle: handleToggleSubtitle,
    onReplayAudio: handleReplay,
    onTogglePartsDrawer: handleTogglePartsDrawer,
    onToggleFullscreen: handleToggleFullscreen,
    onSetLoop: handleSetLoop
  }, true);

  // Play audio when lesson changes or first mounts
  useEffect(() => {
    audioPlayer.stop();
    if (!isBlackout && currentChunk) {
      playCurrentChunkAudio(currentChunk);
    }
  }, [currentLessonId]);

  if (!chunks || chunks.length === 0) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-white rounded-2xl border border-[#E8E8EC]">
        <div className="text-center p-8 space-y-3">
          <div className="text-lg font-bold text-[#DC2626]">No Chunks Loaded in this Session</div>
          <p className="text-xs text-[#6B6B6B]">Please select an active lesson or verify Firestore database connectivity.</p>
          {onExit && (
            <button
              onClick={onExit}
              className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Back to Schedule
            </button>
          )}
        </div>
      </div>
    );
  }

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'vocab': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'phrase': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'sentence': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'dialogue': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'monologue': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'slang': return 'bg-rose-50 text-[#DC2626] border-rose-200';
      case 'idiom': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'grammar': return 'bg-teal-50 text-teal-700 border-teal-200';
      default: return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  return (
    <div
      ref={containerRef}
      id="classroom-presentation-container"
      className={`relative min-h-[86vh] rounded-2xl border transition-colors flex flex-col justify-between overflow-hidden select-none font-sans ${
        highContrastDark 
          ? 'bg-[#09090B] text-white border-zinc-800' 
          : 'bg-white text-[#0A0A0A] border-[#E8E8EC]'
      }`}
    >
      {/* 1. PROGRESS BAR AT THE TOP OF PRESENTATION */}
      <PresentationProgressBar
        currentIndex={currentChunkIndex}
        totalChunks={chunks.length}
        parts={parts}
        highContrastDark={highContrastDark}
        onSeek={(targetIndex) => {
          setCurrentChunkIndex(targetIndex);
          playCurrentChunkAudio(chunks[targetIndex]);
        }}
      />

      {/* 2. BLACKOUT OVERLAY (Triggered via Clicker 'Key B' or button) */}
      {isBlackout && (
        <div
          onClick={() => setIsBlackout(false)}
          className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center text-center p-8 cursor-pointer animate-fade-in"
        >
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-500 mb-4 border border-zinc-800">
            <Moon className="w-8 h-8 text-zinc-400" />
          </div>
          <h2 className="text-2xl font-bold font-display text-zinc-300">
            Blackout Active (Screen Blanked)
          </h2>
          <p className="text-zinc-500 text-sm mt-2 font-mono">
            Press <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-bold">B</span> or click anywhere to resume drill
          </p>
        </div>
      )}

      {/* 2. TOP PRESENTATION TOOLBAR */}
      <div className={`px-6 py-4 border-b flex items-center justify-between gap-4 flex-wrap ${
        highContrastDark ? 'border-zinc-800 bg-[#0F0F12]' : 'border-[#E8E8EC] bg-[#FAFAFA]'
      }`}>
        <div className="flex items-center gap-3">
          {onExit && (
            <button
              onClick={onExit}
              className="p-1.5 rounded-lg border border-[#E8E8EC] hover:bg-white text-xs font-semibold text-[#0A0A0A] transition-colors cursor-pointer"
              title="Exit Presenter Mode"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Lesson Selector */}
          <select
            value={currentLessonId}
            onChange={(e) => {
              setCurrentLessonId(e.target.value);
              setCurrentChunkIndex(0);
            }}
            className={`text-xs font-bold font-display rounded-lg px-3 py-1.5 border transition-all cursor-pointer shadow-xs ${
              highContrastDark 
                ? 'bg-zinc-800 text-white border-zinc-700' 
                : 'bg-white text-[#0A0A0A] border-[#E8E8EC]'
            }`}
          >
            {allAvailableLessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.id.startsWith('level_a') ? 'Level A' : 'Level B'} • Day {l.day_number}: {l.lesson_title}
              </option>
            ))}
          </select>

          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-[#DC2626] text-white">
            Chunk {currentChunkIndex + 1} / {chunks.length}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Visual GCS Audio Connection Indicator (Signal Strength) */}
          <button
            onClick={() => {
              verifyGcsAvailability();
              setIsDiagnosticOpen(true);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer shadow-xs ${
              gcsConnectionStatus === 'Connected' && !isAudioLoading && !isCheckingGcs
                ? highContrastDark
                  ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : highContrastDark
                  ? 'bg-amber-950/50 text-amber-300 border-amber-800 hover:bg-amber-900/60'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
            }`}
            title={`GCS Audio Stream Status: ${isAudioLoading || isCheckingGcs ? 'Reconnecting (Loading audio buffer)' : gcsConnectionStatus}. Click to test & diagnose.`}
          >
            {isAudioLoading || isCheckingGcs ? (
              <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            ) : gcsConnectionStatus === 'Connected' ? (
              <SignalHigh className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <SignalLow className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            )}

            <span className="tracking-tight">
              {isAudioLoading || isCheckingGcs
                ? 'Reconnecting'
                : gcsConnectionStatus}
            </span>

            {/* Micro signal status dot */}
            <span className="relative flex h-2 w-2 ml-0.5">
              {gcsConnectionStatus === 'Connected' && !isAudioLoading && !isCheckingGcs ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </>
              )}
            </span>
          </button>

          {/* Audio Source Diagnostics Trigger Badge */}
          <button
            onClick={() => setIsDiagnosticOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer shadow-xs ${
              activeAudioSource === 'GCS_MASTER'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : activeAudioSource === 'GOOGLE_CLOUD_AI'
                  ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
            title="Kiểm tra kết nối âm thanh & chẩn đoán Google Cloud TTS"
          >
            {activeAudioSource === 'GCS_MASTER' ? (
              <>
                <Radio className="w-3 h-3 text-emerald-600" />
                <span>GCS MP3</span>
              </>
            ) : activeAudioSource === 'GOOGLE_CLOUD_AI' ? (
              <>
                <Cloud className="w-3 h-3 text-blue-600" />
                <span>Journey AI</span>
              </>
            ) : (
              <>
                <Laptop className="w-3 h-3 text-amber-600" />
                <span>Model Máy</span>
              </>
            )}
            <Activity className="w-3 h-3 opacity-60 ml-0.5" />
          </button>

          {/* Voice Model Selector */}
          <select
            value={selectedVoice}
            onChange={(e) => {
              const newVoice = e.target.value;
              setSelectedVoice(newVoice);
              // Preview newly selected voice immediately
              audioPlayer.playChunk(
                currentChunk?.english || "Chunking method",
                null,
                newVoice,
                speed,
                true // force dynamic synthesis test
              );
            }}
            className={`text-xs font-mono font-semibold rounded-lg px-2.5 py-1.5 border transition-all cursor-pointer shadow-xs ${
              highContrastDark 
                ? 'bg-zinc-800 text-zinc-200 border-zinc-700' 
                : 'bg-white text-[#0A0A0A] border-[#E8E8EC]'
            }`}
            title="Google Cloud Real Voice Model"
          >
            {GOOGLE_TTS_VOICES.filter(v => v.languageCode === 'en-US').map(v => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          {/* Parts Drawer Toggle */}
          <button
            onClick={() => setIsPartsDrawerOpen(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isPartsDrawerOpen
                ? 'bg-[#DC2626] text-white border-[#DC2626]'
                : 'bg-white text-[#0A0A0A] border-[#E8E8EC] hover:bg-zinc-50'
            }`}
            title="Parts Navigation (Key: P)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="font-mono">Parts (P)</span>
          </button>

          {/* Subtitle Toggle */}
          <button
            onClick={handleToggleSubtitle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              showSubtitle
                ? 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30'
                : 'bg-zinc-100 text-zinc-500 border-zinc-200'
            }`}
            title="Toggle Subtitle (Key: V)"
          >
            {showSubtitle ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="font-mono">{showSubtitle ? 'VI: ON (V)' : 'VI: OFF (V)'}</span>
          </button>

          {/* Blackout Button */}
          <button
            onClick={handleToggleBlackout}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-300 hover:bg-zinc-100 transition-all cursor-pointer font-mono"
            title="Blackout Screen (Key: B)"
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Blackout (B)</span>
          </button>

          {/* Contrast Theme Toggle */}
          <button
            onClick={() => setHighContrastDark(prev => !prev)}
            className="p-1.5 rounded-lg border border-zinc-300 hover:bg-zinc-100 transition-all cursor-pointer"
            title="Toggle High-Contrast Dark Mode"
          >
            {highContrastDark ? <SunMedium className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
          </button>

          {/* Keyboard Guide */}
          <button
            onClick={() => setShowKeyboardGuide(prev => !prev)}
            className="p-1.5 rounded-lg border border-zinc-300 hover:bg-zinc-100 transition-all cursor-pointer"
            title="Clicker Remote & Keymap Guide"
          >
            <Keyboard className="w-4 h-4 text-zinc-600" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded-lg border border-zinc-300 hover:bg-zinc-100 transition-all cursor-pointer"
            title="Fullscreen Mode (F5 / Key F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3. PRIMARY DRILL STAGE (OPTIMIZED FOR LARGE PROJECTOR VISIBILITY) */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-14 text-center max-w-5xl mx-auto w-full relative">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-6 flex-wrap justify-center">
          {currentChunk.speaker && (
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-zinc-800 text-white flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[#DC2626]" />
              Speaker: {currentChunk.speaker}
            </span>
          )}

          <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${getCategoryColor(currentChunk.category)}`}>
            {currentChunk.category}
          </span>

          {currentChunk.audio_url && (
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-600" />
              GCS Master Audio
            </span>
          )}

          {currentChunk.ipa && (
            <span className={`text-xs font-mono px-3 py-1 rounded-full border ${
              highContrastDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-zinc-50 text-zinc-600 border-zinc-200'
            }`}>
              {currentChunk.ipa}
            </span>
          )}
        </div>

        {/* Primary English Chunk */}
        <div className="my-auto py-4">
          <h1
            className={`font-display font-bold leading-tight md:leading-tight tracking-tight transition-all duration-200 ${
              currentChunk.english.length > 70 
                ? 'text-3xl md:text-5xl' 
                : currentChunk.english.length > 40 
                  ? 'text-4xl md:text-6xl' 
                  : 'text-5xl md:text-7xl'
            } ${activeSpeechStep === 'en' ? 'text-[#DC2626] scale-[1.02]' : ''}`}
          >
            {currentChunk.english}
          </h1>

          {/* Beat Prosody Notation */}
          {currentChunk.beat_prosody && (
            <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#DC2626]/[0.06] border border-[#DC2626]/20">
              <Music className="w-4 h-4 text-[#DC2626] shrink-0 animate-pulse" />
              <span className="text-sm md:text-base font-mono font-bold tracking-wide text-[#DC2626]">
                {currentChunk.beat_prosody}
              </span>
            </div>
          )}

          {/* Vietnamese Subtitle (Toggleable via Key V) */}
          <div className="min-h-[4rem] mt-6 flex items-center justify-center">
            {showSubtitle ? (
              <p className={`text-xl md:text-2xl font-medium transition-all ${
                activeSpeechStep === 'vi' 
                  ? 'text-emerald-600 font-bold' 
                  : highContrastDark ? 'text-zinc-400' : 'text-[#6B6B6B]'
              }`}>
                {currentChunk.vietnamese}
              </p>
            ) : (
              <button
                onClick={() => setShowSubtitle(true)}
                className="text-xs font-mono text-zinc-400 hover:text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-lg border border-dashed border-zinc-300 cursor-pointer"
              >
                [Subtitle Hidden — Press 'V' or click to reveal translation]
              </button>
            )}
          </div>
        </div>

        {/* Audio Speaking State Animation */}
        {isPlayingAudio && (
          <div className="flex items-center gap-2 font-mono text-xs text-[#DC2626] font-bold mt-2">
            <span className="flex gap-1 h-3 items-end">
              <span className="w-1 bg-[#DC2626] h-full animate-bounce"></span>
              <span className="w-1 bg-[#DC2626] h-2/3 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1 bg-[#DC2626] h-4/5 animate-bounce [animation-delay:0.4s]"></span>
            </span>
            <span>Playing: {activeSpeechStep === 'en' ? 'English (EN)' : activeSpeechStep === 'vi' ? 'Vietnamese (VI)' : 'Drill Audio'}</span>
          </div>
        )}
      </div>

      {/* 4. PARTS NAVIGATION DRAWER */}
      <PartsDrawer
        isOpen={isPartsDrawerOpen}
        onClose={() => setIsPartsDrawerOpen(false)}
        parts={parts}
        currentChunkIndex={currentChunkIndex}
        onSelectPart={(startIndex) => {
          setCurrentChunkIndex(startIndex);
          playCurrentChunkAudio(chunks[startIndex]);
        }}
      />

      {/* 5. CLICKER SHORTCUT GUIDE MODAL */}
      {showKeyboardGuide && (
        <div
          onClick={() => setShowKeyboardGuide(false)}
          className="absolute inset-0 bg-black/60 z-40 flex items-center justify-center p-4 font-sans"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white text-zinc-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-zinc-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 font-display font-bold text-lg text-[#DC2626]">
                <Keyboard className="w-5 h-5" />
                <span>Presenter Remote & Keyboard Keymap</span>
              </div>
              <button
                onClick={() => setShowKeyboardGuide(false)}
                className="text-zinc-400 hover:text-zinc-800 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                <span className="font-semibold text-zinc-800">Next Chunk (Manual Step)</span>
                <span className="font-mono font-bold px-2 py-0.5 bg-zinc-200 rounded text-zinc-900">PageDown / Right / Space</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                <span className="font-semibold text-zinc-800">Previous Chunk</span>
                <span className="font-mono font-bold px-2 py-0.5 bg-zinc-200 rounded text-zinc-900">PageUp / Left</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                <span className="font-semibold text-zinc-800">Replay Audio</span>
                <span className="font-mono font-bold px-2 py-0.5 bg-zinc-200 rounded text-zinc-900">Key R</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                <span className="font-semibold text-zinc-800">Blackout (Blank Screen)</span>
                <span className="font-mono font-bold px-2 py-0.5 bg-zinc-200 rounded text-zinc-900">Key B / Period (.)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                <span className="font-semibold text-zinc-800">Toggle Vietnamese Translation</span>
                <span className="font-mono font-bold px-2 py-0.5 bg-zinc-200 rounded text-zinc-900">Key V</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                <span className="font-semibold text-zinc-800">Open Parts Navigation Drawer</span>
                <span className="font-mono font-bold px-2 py-0.5 bg-zinc-200 rounded text-zinc-900">Key P</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                <span className="font-semibold text-zinc-800">Fullscreen Toggle</span>
                <span className="font-mono font-bold px-2 py-0.5 bg-zinc-200 rounded text-zinc-900">F / F5</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                <span className="font-semibold text-zinc-800">Loop 1x / 2x / 3x</span>
                <span className="font-mono font-bold px-2 py-0.5 bg-zinc-200 rounded text-zinc-900">Keys 1, 2, 3</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 font-mono text-center pt-2">
              100% compatible with Logitech Spotlight, R400/R800, Baseus, and generic Bluetooth presenter remotes.
            </p>
          </div>
        </div>
      )}

      {/* 6. BOTTOM NAVIGATION CONTROLS */}
      <div className={`p-4 md:px-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 ${
        highContrastDark ? 'border-zinc-800 bg-[#0F0F12]' : 'border-[#E8E8EC] bg-[#FAFAFA]'
      }`}>
        {/* Navigation Step Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
          <button
            onClick={handlePrev}
            disabled={currentChunkIndex === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white border border-[#E8E8EC] text-xs font-bold text-[#0A0A0A] hover:bg-zinc-50 disabled:opacity-30 transition-all cursor-pointer shadow-xs"
            title="Previous (PageUp / Arrow Left)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous (PageUp)</span>
          </button>

          <button
            onClick={handleReplay}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#DC2626] text-white text-xs font-bold hover:bg-[#B91C1C] transition-all cursor-pointer shadow-xs"
            title="Replay Audio (Key R)"
          >
            <Volume2 className="w-4 h-4" />
            <span>Replay (R)</span>
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-5 py-2 rounded-xl bg-[#0A0A0A] text-white text-xs font-bold hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
            title="Next (PageDown / Arrow Right / Space)"
          >
            <span>{currentChunkIndex === chunks.length - 1 ? 'Lesson Complete 🎉' : 'Next (PageDown)'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Audio sequence & Speed Configuration */}
        <div className="flex items-center gap-3 flex-wrap justify-center text-xs">
          {/* Sequence mode */}
          <div className="flex items-center gap-1 bg-white border border-[#E8E8EC] p-1 rounded-lg">
            <button
              onClick={() => setLanguageMode('EN_ONLY')}
              className={`px-2 py-1 rounded text-[11px] font-bold font-mono transition-colors cursor-pointer ${
                languageMode === 'EN_ONLY' ? 'bg-[#DC2626] text-white' : 'text-zinc-600 hover:text-black'
              }`}
            >
              EN Only
            </button>
            <button
              onClick={() => setLanguageMode('EN_THEN_VI')}
              className={`px-2 py-1 rounded text-[11px] font-bold font-mono transition-colors cursor-pointer ${
                languageMode === 'EN_THEN_VI' ? 'bg-[#DC2626] text-white' : 'text-zinc-600 hover:text-black'
              }`}
            >
              EN ➔ VI
            </button>
            <button
              onClick={() => setLanguageMode('VI_THEN_EN')}
              className={`px-2 py-1 rounded text-[11px] font-bold font-mono transition-colors cursor-pointer ${
                languageMode === 'VI_THEN_EN' ? 'bg-[#DC2626] text-white' : 'text-zinc-600 hover:text-black'
              }`}
            >
              VI ➔ EN Drill
            </button>
          </div>

          {/* Speed presets */}
          <div className="flex items-center gap-1 bg-white border border-[#E8E8EC] p-1 rounded-lg">
            {[0.75, 0.9, 1.0, 1.2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded text-[11px] font-bold font-mono transition-colors cursor-pointer ${
                  speed === s ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-black'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Repeat loops */}
          <div className="flex items-center gap-1 bg-white border border-[#E8E8EC] p-1 rounded-lg">
            {[1, 2, 3].map((r) => (
              <button
                key={r}
                onClick={() => setRepeatCount(r)}
                className={`px-2 py-1 rounded text-[11px] font-bold font-mono transition-colors cursor-pointer ${
                  repeatCount === r ? 'bg-amber-500 text-white' : 'text-zinc-600 hover:text-black'
                }`}
                title={`Loop ${r} time(s)`}
              >
                Loop {r}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 7. CLICKER ACTIVE STATUS STRIP */}
      <div className="bg-[#0A0A0A] text-zinc-400 py-1.5 px-4 text-[11px] font-mono flex items-center justify-between overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-3">
          <span className="text-[#DC2626] font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse"></span>
            Hardware Clicker Active
          </span>
          <span>PageDown (Next)</span>
          <span>•</span>
          <span>PageUp (Back)</span>
          <span>•</span>
          <span>P (Parts)</span>
          <span>•</span>
          <span>B (Blackout)</span>
          <span>•</span>
          <span>V (Translation)</span>
          <span>•</span>
          <span>R (Replay)</span>
        </div>
        <span className="text-zinc-500">Google Cloud TTS (Journey / Studio Models)</span>
      </div>
      {/* 8. AUDIO ENGINE DIAGNOSTICS MODAL */}
      <AudioDiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
      />
    </div>
  );
};
