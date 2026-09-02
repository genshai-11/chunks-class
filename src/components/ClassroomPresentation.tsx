import React, { useState, useEffect, useRef } from 'react';
import { ChunkItem, LessonDoc, LanguageMode, CohortAudioSettings, LessonPart } from '../types';
import { getLessonById as getFirestoreLessonById } from '../services/firestoreService';
import { curriculumRegistry } from '../services/curriculumRegistry';
import { audioPlayer, GOOGLE_TTS_VOICES, ALL_VOICES, AudioProvider, VoiceOption } from '../services/googleTtsService';
import { DEEPGRAM_AURA_VOICES } from '../services/deepgramTtsService';
import { usePresenterClicker } from '../hooks/usePresenterClicker';
import { PartsDrawer, groupChunksIntoParts } from './PartsDrawer';
import { ChunkListPreviewDrawer } from './ChunkListPreviewDrawer';
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
  WifiOff,
  BookOpen,
  TrendingUp,
  Zap,
  CheckCircle2,
  X
} from 'lucide-react';

interface ClassroomPresentationProps {
  lesson?: LessonDoc | null;
  initialLessonId?: string;
  sessionNumber?: number;
  onExit?: () => void;
  audioSettings?: CohortAudioSettings;
  courseLevel?: string;
  onSelectLesson?: (lessonId: string, sessionNumber?: number) => void;
}

export const ClassroomPresentation: React.FC<ClassroomPresentationProps> = ({
  lesson: providedLesson,
  initialLessonId = "level_b_eres_day_1",
  sessionNumber = 1,
  onExit,
  audioSettings,
  courseLevel = 'LEVEL_B_ERES',
  onSelectLesson
}) => {
  const [currentLessonId, setCurrentLessonId] = useState<string>(() => {
    if (providedLesson?.id) return providedLesson.id;
    let initial = initialLessonId || 'level_b_eres_day_1';
    if (initial.startsWith('level_b_day_')) {
      initial = initial.replace('level_b_day_', 'level_b_eres_day_');
    }
    return initial;
  });
  const [fetchedLessonDoc, setFetchedLessonDoc] = useState<LessonDoc | null>(providedLesson || null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [showSubtitle, setShowSubtitle] = useState<boolean>(true);
  const [isBlackout, setIsBlackout] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPartsDrawerOpen, setIsPartsDrawerOpen] = useState<boolean>(false);
  const [isChunkListOpen, setIsChunkListOpen] = useState<boolean>(false);

  // Audio parameters & Real Google Cloud TTS Models
  const [selectedVoice, setSelectedVoice] = useState<string>(
    audioSettings?.voice_profile_en || 'en-US-Journey-F'
  );
  const [selectedVoiceVi, setSelectedVoiceVi] = useState<string>(
    audioSettings?.voice_profile_vi || 'vi-VN-Neural2-A'
  );
  const [speed, setSpeed] = useState<number>(audioSettings?.default_speed || 1.0);
  const [repeatCount, setRepeatCount] = useState<number>(audioSettings?.repeat_count || 1);
  const [languageMode, setLanguageMode] = useState<LanguageMode>(() => {
    if (audioSettings?.language_mode === 'VI_ONLY') return 'VI_ONLY';
    return 'EN_ONLY';
  });
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
  
  // Audio Provider & Batch Pre-generation Engine
  const [audioProvider, setAudioProvider] = useState<AudioProvider>(audioPlayer.getAudioProvider());
  const [isPreparingAudio, setIsPreparingAudio] = useState<boolean>(false);
  const [prepProgress, setPrepProgress] = useState<{ current: number; total: number; text: string } | null>(null);
  const [isPrepModalOpen, setIsPrepModalOpen] = useState<boolean>(false);
  const [prepSummary, setPrepSummary] = useState<{ prepared: number; failed: number } | null>(null);

  // Synchronize when initialLessonId changes
  useEffect(() => {
    if (initialLessonId) {
      let cleanId = initialLessonId;
      if (cleanId.startsWith('level_b_day_')) {
        cleanId = cleanId.replace('level_b_day_', 'level_b_eres_day_');
      }
      if (cleanId !== currentLessonId) {
        setCurrentLessonId(cleanId);
        setCurrentChunkIndex(0);
      }
    }
  }, [initialLessonId]);

  // Synchronize when providedLesson changes
  useEffect(() => {
    if (providedLesson) {
      setFetchedLessonDoc(providedLesson);
      setCurrentLessonId(providedLesson.id);
      setCurrentChunkIndex(0);
    }
  }, [providedLesson]);

  const handleStartPrepareAudio = async () => {
    if (chunks.length === 0) return;
    setIsPreparingAudio(true);
    setPrepSummary(null);
    setPrepProgress({ current: 0, total: chunks.length, text: 'Starting synthesis...' });

    try {
      const result = await audioPlayer.prepareChunksAudio(
        chunks,
        selectedVoice,
        audioProvider,
        (curr, tot, text) => {
          setPrepProgress({ current: curr, total: tot, text });
        }
      );
      setPrepSummary(result);
    } catch (e: any) {
      console.error('Audio preparation failed:', e);
    } finally {
      setIsPreparingAudio(false);
    }
  };

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
    let targetId = currentLessonId;
    if (targetId.startsWith('level_b_day_')) {
      targetId = targetId.replace('level_b_day_', 'level_b_eres_day_');
    }

    getFirestoreLessonById(targetId)
      .then(doc => {
        if (isMounted) {
          if (doc) {
            setFetchedLessonDoc(doc);
          } else {
            const fallbackDoc = curriculumRegistry.getLessonById(targetId);
            if (fallbackDoc) setFetchedLessonDoc(fallbackDoc);
          }
        }
      })
      .catch(err => {
        console.warn("[Presenter] Fallback to local catalog:", err);
        if (isMounted) {
          const fallbackDoc = curriculumRegistry.getLessonById(targetId);
          if (fallbackDoc) setFetchedLessonDoc(fallbackDoc);
        }
      });

    return () => { isMounted = false; };
  }, [currentLessonId, providedLesson]);

  const normalizedId = currentLessonId.startsWith('level_b_day_') 
    ? currentLessonId.replace('level_b_day_', 'level_b_eres_day_') 
    : currentLessonId;

  const activeLesson: LessonDoc = fetchedLessonDoc || 
    curriculumRegistry.getLessonById(normalizedId) || 
    curriculumRegistry.getLessonById(currentLessonId) || 
    curriculumRegistry.getAllLessons()[0];

  const rawChunks: ChunkItem[] = activeLesson?.chunks || [];
  const chunks: ChunkItem[] = rawChunks.length > 0 
    ? rawChunks 
    : (curriculumRegistry.getAllLessons()[0]?.chunks || []);

  const currentChunk: ChunkItem = chunks[currentChunkIndex] || chunks[0];

  const parts: LessonPart[] = groupChunksIntoParts(chunks);
  const currentPart = parts.find(p => currentChunkIndex >= p.start_index && currentChunkIndex <= p.end_index) || parts[0] || null;

  // Grouped courses for the quick lesson switcher
  const groupedCourses = React.useMemo(() => {
    return curriculumRegistry.getGroupedCoursesWithLessons();
  }, []);

  const handleSwitchLesson = (newLessonId: string) => {
    let cleanId = newLessonId;
    if (cleanId.startsWith('level_b_day_')) {
      cleanId = cleanId.replace('level_b_day_', 'level_b_eres_day_');
    }
    audioPlayer.stop();
    setCurrentLessonId(cleanId);
    setCurrentChunkIndex(0);
    const localDoc = curriculumRegistry.getLessonById(cleanId);
    if (localDoc) {
      setFetchedLessonDoc(localDoc);
    }
    onSelectLesson?.(cleanId);
  };

  // Dual Progress % Computations
  const partChunkTotal = currentPart ? currentPart.chunk_count : 0;
  const partChunkCurrent = currentPart ? Math.max(0, Math.min(partChunkTotal, currentChunkIndex - currentPart.start_index + 1)) : 0;
  const partProgressPercent = partChunkTotal > 0 ? Math.round((partChunkCurrent / partChunkTotal) * 100) : 0;
  const classProgressPercent = chunks.length > 0 ? Math.round(((currentChunkIndex + 1) / chunks.length) * 100) : 0;

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
    onToggleChunkList: () => setIsChunkListOpen(prev => !prev),
    onToggleFullscreen: handleToggleFullscreen,
    onSetLoop: handleSetLoop,
    isModalOpen: isPrepModalOpen || isDiagnosticOpen || showKeyboardGuide || isPartsDrawerOpen || isChunkListOpen
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
      <div className="h-[500px] flex flex-col items-center justify-center bg-white rounded-2xl border border-[#E8E8EC] p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-[#DC2626] flex items-center justify-center mx-auto">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="text-lg font-bold text-[#DC2626]">Không tìm thấy Chunks cho bài học này</div>
        <p className="text-xs text-[#6B6B6B] max-w-md">
          Bài học hiện tại chưa có dữ liệu chunk. Vui lòng chọn bài học khác từ danh mục bên dưới:
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <select
            onChange={(e) => {
              if (e.target.value) handleSwitchLesson(e.target.value);
            }}
            className="text-xs font-bold px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 hover:bg-white cursor-pointer"
          >
            <option value="">-- Chọn bài học khác --</option>
            {groupedCourses.map(({ course, lessons }) => (
              <optgroup key={course.id} label={course.title}>
                {lessons.map(l => (
                  <option key={l.id} value={l.id}>
                    Day {l.day_number}: {l.lesson_title} ({l.total_chunks || l.chunks?.length || 0} chunks)
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {onExit && (
            <button
              onClick={onExit}
              className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Về Lịch Học
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

      {/* 2. SLIM HIGH-SIGNAL TOP BAR */}
      <div className={`px-4 sm:px-6 py-3 border-b flex items-center justify-between gap-4 transition-colors z-20 ${
        highContrastDark ? 'border-zinc-800 bg-[#0F0F12]' : 'border-[#E8E8EC] bg-white/95 backdrop-blur-xs'
      }`}>
        {/* Left: Lesson Context, Quick Switcher & Dynamic Progress */}
        <div className="flex items-center gap-2.5 min-w-0 flex-wrap sm:flex-nowrap">
          {/* Day pill + Level badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span 
              className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-[#DC2626] text-white shrink-0 shadow-2xs"
              title={`Day ${activeLesson?.day_number ?? 1}`}
            >
              Day {activeLesson?.day_number ?? 1}
            </span>
            <span 
              className={`text-xs font-mono font-bold px-2 py-1 rounded-lg border shrink-0 ${
                highContrastDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
              }`}
              title={`Course Level: ${courseLevel}`}
            >
              {courseLevel === 'LEVEL_A'
                ? 'Level A'
                : courseLevel === 'LEVEL_B_EREL'
                ? 'Level B (EREL)'
                : courseLevel === 'LEVEL_B_ERES'
                ? 'Level B (ERES)'
                : courseLevel?.replace(/_/g, ' ') || 'Level B'}
            </span>
          </div>

          {/* Quick Lesson Switcher Dropdown with clear truncate */}
          <div className="relative flex items-center min-w-0">
            <BookOpen className="w-3.5 h-3.5 text-[#DC2626] absolute left-2.5 pointer-events-none shrink-0" />
            <select
              value={normalizedId}
              onChange={(e) => handleSwitchLesson(e.target.value)}
              className={`text-xs font-bold pl-8 pr-3 py-1 rounded-lg border transition-all cursor-pointer max-w-[180px] sm:max-w-[260px] md:max-w-[320px] truncate shadow-2xs ${
                highContrastDark 
                  ? 'bg-zinc-900 text-zinc-100 border-zinc-700 hover:border-zinc-500' 
                  : 'bg-zinc-50 text-zinc-900 border-zinc-200 hover:bg-white hover:border-zinc-300'
              }`}
              title="Đổi Bài Học / Quick Lesson Switcher"
            >
              {groupedCourses.map(({ course, lessons }) => (
                <optgroup 
                  key={course.id} 
                  label={`${
                    course.level_code === 'LEVEL_A' ? '📗 Level A - Foundation' :
                    course.level_code === 'LEVEL_B_EREL' ? '🎧 Level B - EREL (Listening)' :
                    course.level_code === 'LEVEL_B_ERES' ? '🗣️ Level B - ERES (Speaking)' :
                    course.title
                  } (${lessons.length} bài)`}
                >
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.day_number === 0 ? 'Day 0: Word List' : `Day ${l.day_number}`}: {l.lesson_title} ({l.total_chunks || l.chunks?.length || 0} chunks)
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Part & Class Progress Pills with Tooltips */}
          <div className="hidden md:flex items-center gap-1.5 ml-1 shrink-0">
            {currentPart && (
              <button
                type="button"
                onClick={() => setIsPartsDrawerOpen(true)}
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  highContrastDark
                    ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                }`}
                title={`Part ${currentPart.part_index}: ${currentPart.category.toUpperCase()} (${partChunkCurrent}/${partChunkTotal} chunks, ${partProgressPercent}%)`}
              >
                <Layers className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Part {currentPart.part_index}: {partProgressPercent}%</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsChunkListOpen(true)}
              className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                highContrastDark
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
              title={`Tổng tiến độ bài học: ${currentChunkIndex + 1}/${chunks.length} chunks (${classProgressPercent}%)`}
            >
              <span>{currentChunkIndex + 1}/{chunks.length}</span>
            </button>
          </div>
        </div>

        {/* Right Action Cluster: Provider switcher, Voice model selector, Fullscreen toggle, Theme toggle, Exit button with tooltips */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Audio Engine Provider Switcher */}
          <select
            value={audioProvider}
            onChange={(e) => {
              const newProv = e.target.value as AudioProvider;
              setAudioProvider(newProv);
              audioPlayer.setAudioProvider(newProv);
              if (newProv === 'DEEPGRAM_AURA') {
                setSelectedVoice('aura-asteria-en');
              } else {
                setSelectedVoice('en-US-Journey-F');
              }
            }}
            className={`text-xs font-mono font-bold rounded-lg px-2.5 py-1 border transition-all cursor-pointer shadow-2xs ${
              highContrastDark 
                ? 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:border-zinc-500' 
                : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:bg-white hover:border-zinc-300'
            }`}
            title="Audio Engine Provider (Deepgram Aura / Google Cloud TTS)"
          >
            <option value="DEEPGRAM_AURA">Deepgram Aura</option>
            <option value="GOOGLE_TTS">Google Cloud TTS</option>
          </select>

          {/* Voice Model Selector */}
          <select
            value={selectedVoice}
            onChange={(e) => {
              const newVoice = e.target.value;
              setSelectedVoice(newVoice);
              audioPlayer.playChunk(
                currentChunk?.english || "Chunking method",
                null,
                newVoice,
                speed,
                true
              );
            }}
            className={`hidden sm:block text-xs font-mono font-medium rounded-lg px-2.5 py-1 border transition-all cursor-pointer shadow-2xs ${
              highContrastDark 
                ? 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:border-zinc-500' 
                : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:bg-white hover:border-zinc-300'
            }`}
            title="Voice Model Selection"
          >
            {audioProvider === 'DEEPGRAM_AURA' ? (
              DEEPGRAM_AURA_VOICES.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))
            ) : (
              GOOGLE_TTS_VOICES.filter(v => v.languageCode === 'en-US').map(v => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))
            )}
          </select>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-2xs ${
              highContrastDark ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700'
            }`}
            title="Toàn Màn Hình / Fullscreen (F / F5)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setHighContrastDark(prev => !prev)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-2xs ${
              highContrastDark ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-amber-400' : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-600'
            }`}
            title="Giao Diện Sáng / Tối (High Contrast Theme)"
          >
            {highContrastDark ? <SunMedium className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Exit Presentation */}
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-[#DC2626] hover:text-red-700 transition-colors cursor-pointer shadow-2xs"
              title="Thoát Chế Độ Trình Chiếu (Exit Presentation)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
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

      {/* 6. MINIMAL HIGH-CONTRAST FLOATING CLASSROOM DOCK */}
      <div className={`p-3 px-4 sm:px-6 border-t flex flex-wrap items-center justify-between gap-3 z-20 ${
        highContrastDark ? 'border-zinc-800 bg-[#0F0F12]' : 'border-zinc-200 bg-white/95 backdrop-blur-xs'
      }`}>
        {/* Navigation Step Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentChunkIndex === 0}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-white text-xs font-bold text-zinc-900 disabled:opacity-30 transition-all cursor-pointer shadow-xs"
            title="Previous Chunk (PageUp / Left)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <button
            onClick={handleReplay}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#DC2626] text-white text-xs font-bold hover:bg-[#B91C1C] transition-all cursor-pointer shadow-xs"
            title="Replay Audio (Key R)"
          >
            <Volume2 className="w-4 h-4" />
            <span>Phát Lại (R)</span>
          </button>

          <button
            onClick={handleNext}
            className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
            title="Next Chunk (PageDown / Right / Space)"
          >
            <span>{currentChunkIndex === chunks.length - 1 ? 'Hoàn Tất 🎉' : 'Tiếp (Next)'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Language Mode & Drill Speed */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Language Mode Selector: EN and VI */}
          <div className="flex items-center gap-0.5 bg-zinc-100 border border-zinc-200 p-0.5 rounded-lg text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => setLanguageMode('EN_ONLY')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                languageMode === 'EN_ONLY' ? 'bg-[#DC2626] text-white shadow-xs font-extrabold' : 'text-zinc-600 hover:text-zinc-900'
              }`}
              title="Phát Tiếng Anh (EN Only - Deepgram / Google TTS EN / GCS)"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguageMode('VI_ONLY')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                languageMode === 'VI_ONLY' ? 'bg-[#DC2626] text-white shadow-xs font-extrabold' : 'text-zinc-600 hover:text-zinc-900'
              }`}
              title="Phát Tiếng Việt (VI Only - Google TTS vi-VN-Neural2-A)"
            >
              VI
            </button>
          </div>

          {/* Speed */}
          <div className="flex items-center gap-0.5 bg-zinc-100 border border-zinc-200 p-0.5 rounded-lg text-xs font-mono font-bold">
            {[0.8, 1.0, 1.2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer text-[11px] ${
                  speed === s ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Loop Count */}
          <div className="flex items-center gap-0.5 bg-zinc-100 border border-zinc-200 p-0.5 rounded-lg text-xs font-mono font-bold">
            {[1, 2, 3].map((r) => (
              <button
                key={r}
                onClick={() => setRepeatCount(r)}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer text-[11px] ${
                  repeatCount === r ? 'bg-amber-500 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {r}x
              </button>
            ))}
          </div>
        </div>

        {/* Right: Quick Stage Feature Toggles */}
        <div className="flex items-center gap-1.5">
          {/* Subtitle Toggle */}
          <button
            onClick={handleToggleSubtitle}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
              showSubtitle
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-zinc-100 text-zinc-500 border-zinc-200'
            }`}
            title="Toggle Vietnamese Subtitle (Key: V)"
          >
            {showSubtitle ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Phụ Đề (V)</span>
          </button>

          {/* Words List Drawer */}
          <button
            onClick={() => setIsChunkListOpen(prev => !prev)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-white text-xs font-mono font-bold text-zinc-800 transition-all cursor-pointer"
            title="Vocabulary & Chunks List (Key: L)"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#DC2626]" />
            <span className="hidden sm:inline">List (L)</span>
          </button>

          {/* Parts Drawer */}
          <button
            onClick={() => setIsPartsDrawerOpen(prev => !prev)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-white text-xs font-mono font-bold text-zinc-800 transition-all cursor-pointer"
            title="Parts Drawer (Key: P)"
          >
            <Layers className="w-3.5 h-3.5 text-[#DC2626]" />
            <span className="hidden sm:inline">Parts (P)</span>
          </button>

          {/* Blackout */}
          <button
            onClick={handleToggleBlackout}
            className="p-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 transition-all cursor-pointer"
            title="Blackout Screen (Key: B)"
          >
            <Moon className="w-4 h-4" />
          </button>

          {/* Keyboard Guide */}
          <button
            onClick={() => setShowKeyboardGuide(true)}
            className="p-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 transition-all cursor-pointer"
            title="Remote Clicker Keymap (Key: ?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 9. VOCABULARY & CHUNKS PREVIEW DRAWER */}
      <ChunkListPreviewDrawer
        isOpen={isChunkListOpen}
        onClose={() => setIsChunkListOpen(false)}
        chunks={chunks}
        currentIndex={currentChunkIndex}
        parts={parts}
        currentPart={currentPart}
        highContrastDark={highContrastDark}
        onSelectChunk={(targetIndex) => {
          setCurrentChunkIndex(targetIndex);
          playCurrentChunkAudio(chunks[targetIndex]);
        }}
        onPreviewAudio={(targetChunk) => {
          playCurrentChunkAudio(targetChunk);
        }}
      />

      {/* 10. BATCH AUDIO PREPARATION MODAL */}
      {isPrepModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl border border-[#E8E8EC] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="p-5 border-b border-[#E8E8EC] flex items-center justify-between bg-[#FAFAFA]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4 fill-amber-500" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#0A0A0A] tracking-tight">Prepare Lesson Audio</h3>
                  <p className="text-xs text-zinc-500">Pre-synthesize & cache all chunks for 0ms in-class playback</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isPreparingAudio) setIsPrepModalOpen(false);
                }}
                disabled={isPreparingAudio}
                className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Lesson:</span>
                  <span className="font-bold text-zinc-900">{activeLesson.lesson_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Total Chunks:</span>
                  <span className="font-mono font-bold text-[#DC2626]">{chunks.length} chunks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Audio Engine:</span>
                  <span className="font-mono font-bold text-zinc-800">
                    {audioProvider === 'DEEPGRAM_AURA' ? 'Deepgram Aura AI' : 'Google Cloud TTS'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Selected Voice:</span>
                  <span className="font-mono font-bold text-zinc-800">{selectedVoice}</span>
                </div>
              </div>

              {/* Progress State */}
              {prepProgress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 truncate max-w-[240px] font-mono">{prepProgress.text}</span>
                    <span className="font-mono font-bold text-[#DC2626]">
                      {prepProgress.current} / {prepProgress.total} ({Math.round((prepProgress.current / prepProgress.total) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#DC2626] rounded-full transition-all duration-150"
                      style={{ width: `${(prepProgress.current / prepProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Completion Summary */}
              {prepSummary && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Successfully prepared <b>{prepSummary.prepared} chunks</b>. Ready for zero-delay offline playback!
                  </span>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="pt-3 border-t border-[#E8E8EC] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrepModalOpen(false)}
                  disabled={isPreparingAudio}
                  className="px-4 py-2 rounded-xl border border-[#E8E8EC] text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-30"
                >
                  {prepSummary ? 'Close' : 'Cancel'}
                </button>

                {!prepSummary && (
                  <button
                    type="button"
                    onClick={handleStartPrepareAudio}
                    disabled={isPreparingAudio}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#DC2626] text-white text-xs font-bold hover:bg-[#B91C1C] shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isPreparingAudio ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Synthesizing ({prepProgress?.current || 0}/{chunks.length})...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Start Batch Synthesis</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 11. AUDIO ENGINE DIAGNOSTICS MODAL */}
      <AudioDiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
      />
    </div>
  );
};
