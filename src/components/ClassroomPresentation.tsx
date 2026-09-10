import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChunkItem, LessonDoc, LanguageMode, CohortAudioSettings, LessonPart, LessonTopicInfo } from '../types';
import { getLessonById as getFirestoreLessonById } from '../services/firestoreService';
import { syncLessonCachedAudioToCloud } from '../services/cloudAudioStorageService';
import { curriculumRegistry } from '../services/curriculumRegistry';
import { playTopicTransitionChime, playLessonCompletionFanfare } from '../utils/audioChimes';
import { audioPlayer, GOOGLE_TTS_VOICES, ALL_VOICES, AudioProvider, VoiceOption, AudioBatchTarget } from '../services/googleTtsService';
import { DEEPGRAM_AURA_VOICES } from '../services/deepgramTtsService';
import { modelRegistryService } from '../services/modelRegistryService';
import { usePresenterClicker } from '../hooks/usePresenterClicker';
import { shortcutConfigService } from '../services/shortcutConfigService';
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
  X,
  Sliders,
  Search,
  Play,
  Check,
  ChevronDown
} from 'lucide-react';

interface ClassroomPresentationProps {
  lesson?: LessonDoc | null;
  initialLessonId?: string;
  sessionNumber?: number;
  onExit?: () => void;
  audioSettings?: CohortAudioSettings;
  courseLevel?: string;
  onSelectLesson?: (lessonId: string, sessionNumber?: number) => void;
  onUpdateAudioSettings?: (settings: CohortAudioSettings) => void;
}

export const ClassroomPresentation: React.FC<ClassroomPresentationProps> = ({
  lesson: providedLesson,
  initialLessonId = "level_b_day_1",
  sessionNumber = 1,
  onExit,
  audioSettings,
  courseLevel = 'LEVEL_B',
  onSelectLesson,
  onUpdateAudioSettings
}) => {
  const [currentLessonId, setCurrentLessonId] = useState<string>(() => {
    if (providedLesson?.id) return providedLesson.id;
    return initialLessonId || 'level_b_day_1';
  });
  const [fetchedLessonDoc, setFetchedLessonDoc] = useState<LessonDoc | null>(providedLesson || null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [showSubtitle, setShowSubtitle] = useState<boolean>(true);
  const [isBlackout, setIsBlackout] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPartsDrawerOpen, setIsPartsDrawerOpen] = useState<boolean>(false);
  const [isChunkListOpen, setIsChunkListOpen] = useState<boolean>(false);
  const [isTopicCompleteGate, setIsTopicCompleteGate] = useState<boolean>(false);
  const [isLessonCompleteGate, setIsLessonCompleteGate] = useState<boolean>(false);

  // Redesign Popover States
  const [isLessonSwitcherOpen, setIsLessonSwitcherOpen] = useState<boolean>(false);
  const [isSoundSettingsOpen, setIsSoundSettingsOpen] = useState<boolean>(false);
  const [lessonSearchQuery, setLessonSearchQuery] = useState<string>('');
  const [isAuditioningEn, setIsAuditioningEn] = useState<boolean>(false);
  const [isAuditioningVi, setIsAuditioningVi] = useState<boolean>(false);

  const lessonSwitcherRef = useRef<HTMLDivElement>(null);
  const soundSettingsRef = useRef<HTMLDivElement>(null);

  // Audio parameters & Real Google Cloud TTS Models
  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    const v = audioSettings?.voice_profile_en;
    return v || 'flux-cliff-en';
  });
  const [selectedVoiceVi, setSelectedVoiceVi] = useState<string>(
    audioSettings?.voice_profile_vi || 'vi-VN-Neural2-A'
  );
  const [speed, setSpeed] = useState<number>(audioSettings?.default_speed || 1.0);
  const [repeatCount, setRepeatCount] = useState<number>(audioSettings?.repeat_count || 1);
  const [languageMode, setLanguageMode] = useState<LanguageMode>(
    audioSettings?.language_mode || 'EN_ONLY'
  );
  const [audioError, setAudioError] = useState<string | null>(null);
  const playbackSequenceRef = useRef(0);
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
  const [, setRegistryRevision] = useState<number>(0);

  useEffect(() => {
    return modelRegistryService.subscribe(() => {
      setRegistryRevision(r => r + 1);
    });
  }, []);

  const [shortcutConfig, setShortcutConfig] = useState(() => shortcutConfigService.getConfig());
  useEffect(() => {
    return shortcutConfigService.subscribe(() => {
      setShortcutConfig(shortcutConfigService.getConfig());
    });
  }, []);
  const [prepTarget, setPrepTarget] = useState<AudioBatchTarget>('BOTH');
  const [isPreparingAudio, setIsPreparingAudio] = useState<boolean>(false);
  const [prepProgress, setPrepProgress] = useState<{ current: number; total: number; text: string } | null>(null);
  const [isPrepModalOpen, setIsPrepModalOpen] = useState<boolean>(false);
  const [prepSummary, setPrepSummary] = useState<{ prepared: number; failed: number } | null>(null);

  // Outside click listeners for popovers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (lessonSwitcherRef.current && !lessonSwitcherRef.current.contains(event.target as Node)) {
        setIsLessonSwitcherOpen(false);
      }
      if (soundSettingsRef.current && !soundSettingsRef.current.contains(event.target as Node)) {
        setIsSoundSettingsOpen(false);
      }
    };

    if (isLessonSwitcherOpen || isSoundSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isLessonSwitcherOpen, isSoundSettingsOpen]);

  const handleSwitchLesson = useCallback((newLessonId: string) => {
    const cleanId = newLessonId;
    audioPlayer.stop();
    setIsTopicCompleteGate(false);
    setIsLessonCompleteGate(false);
    setCurrentLessonId(cleanId);
    setCurrentChunkIndex(0);
    const localDoc = curriculumRegistry.getLessonById(cleanId);
    if (localDoc) {
      setFetchedLessonDoc(localDoc);
    }
    onSelectLesson?.(cleanId);
    setIsLessonSwitcherOpen(false);
    setLessonSearchQuery('');
  }, [onSelectLesson]);

  // Synchronize when initialLessonId changes
  useEffect(() => {
    if (initialLessonId && initialLessonId !== currentLessonId) {
      handleSwitchLesson(initialLessonId);
    }
  }, [initialLessonId, currentLessonId, handleSwitchLesson]);

  // Synchronize when providedLesson changes
  useEffect(() => {
    if (providedLesson) {
      setIsTopicCompleteGate(false);
      setIsLessonCompleteGate(false);
      setFetchedLessonDoc(providedLesson);
      setCurrentLessonId(providedLesson.id);
      setCurrentChunkIndex(0);
    }
  }, [providedLesson]);

  // Sync when audioSettings prop updates externally
  useEffect(() => {
    if (audioSettings) {
      if (audioSettings.voice_profile_en && audioSettings.voice_profile_en !== selectedVoice) {
        const cleanEn = audioSettings.voice_profile_en;
        setSelectedVoice(cleanEn);
      }
      if (audioSettings.voice_profile_vi && audioSettings.voice_profile_vi !== selectedVoiceVi) {
        setSelectedVoiceVi(audioSettings.voice_profile_vi);
      }
      if (audioSettings.language_mode && audioSettings.language_mode !== languageMode) {
        setLanguageMode(audioSettings.language_mode);
      }
      if (audioSettings.default_speed && audioSettings.default_speed !== speed) {
        setSpeed(audioSettings.default_speed);
      }
      if (audioSettings.repeat_count && audioSettings.repeat_count !== repeatCount) {
        setRepeatCount(audioSettings.repeat_count);
      }
    }
  }, [audioSettings]);

  // Notify parent whenever audio parameters change
  const isInitialAudioSettingsMount = useRef(true);
  useEffect(() => {
    if (isInitialAudioSettingsMount.current) {
      isInitialAudioSettingsMount.current = false;
      return;
    }
    const hasChanged =
      !audioSettings ||
      audioSettings.voice_profile_en !== selectedVoice ||
      audioSettings.voice_profile_vi !== selectedVoiceVi ||
      audioSettings.language_mode !== languageMode ||
      audioSettings.default_speed !== speed ||
      audioSettings.repeat_count !== repeatCount;

    if (hasChanged) {
      onUpdateAudioSettings?.({
        ...(audioSettings || {
          voice_profile_en: selectedVoice,
          voice_profile_vi: selectedVoiceVi,
          language_mode: languageMode,
          auto_advance_delay_sec: 0,
          default_speed: speed,
          repeat_count: repeatCount
        }),
        voice_profile_en: selectedVoice,
        voice_profile_vi: selectedVoiceVi,
        language_mode: languageMode,
        default_speed: speed,
        repeat_count: repeatCount
      });
    }
  }, [selectedVoice, selectedVoiceVi, speed, repeatCount, languageMode]);

  const handleStartPrepareAudio = async () => {
    if (chunks.length === 0) return;
    setAudioError(null);
    setIsPreparingAudio(true);
    setPrepSummary(null);
    setPrepProgress({ current: 0, total: chunks.length, text: 'Starting synthesis...' });

    try {
      const result = await audioPlayer.prepareChunksAudio(chunks, {
        voiceEn: selectedVoice,
        voiceVi: selectedVoiceVi,
        provider: audioProvider,
        target: prepTarget,
        forceRegenerate: false,
        concurrency: 4,
        onProgress: (curr, tot, text) => {
          setPrepProgress({ current: curr, total: tot, text });
        }
      });
      setPrepSummary(result);

      // If audio was generated, sync to Cloud Storage so it becomes permanent
      if (activeLesson && result.prepared > 0) {
        try {
          const syncRes = await syncLessonCachedAudioToCloud(activeLesson, {
            voiceEn: selectedVoice,
            voiceVi: selectedVoiceVi
          });
          if (syncRes.updatedChunks && syncRes.updatedChunks.length > 0) {
            setFetchedLessonDoc(prev => prev ? { ...prev, chunks: syncRes.updatedChunks } : prev);
          }
        } catch (syncErr) {
          console.warn('[Presenter] Cloud Storage sync failed after batch prepare:', syncErr);
        }
      }
    } catch (e: any) {
      setAudioError(e instanceof Error ? e.message : 'Audio preparation failed.');
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
      curriculumRegistry.updateLesson(providedLesson);
      return;
    }

    let isMounted = true;
    const targetId = currentLessonId;

    getFirestoreLessonById(targetId)
      .then(doc => {
        if (isMounted) {
          if (doc) {
            setFetchedLessonDoc(doc);
            curriculumRegistry.updateLesson(doc);
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

  const activeLesson: LessonDoc = fetchedLessonDoc || 
    curriculumRegistry.getLessonById(currentLessonId) || 
    curriculumRegistry.getAllLessons()[0];

  const [isCurrentLessonFullyCached, setIsCurrentLessonFullyCached] = useState(false);
  const requiredAudio = (chunk: ChunkItem, mode: LanguageMode = languageMode): [string, string][] => {
    if (mode === 'VI_ONLY') return [[chunk.vietnamese || '', selectedVoiceVi]];
    if (mode === 'EN_ONLY') return [[chunk.english || '', selectedVoice]];
    return [[chunk.english || '', selectedVoice], [chunk.vietnamese || '', selectedVoiceVi]];
  };
  useEffect(() => {
    let cancelled = false;
    setIsCurrentLessonFullyCached(false);
    ++playbackSequenceRef.current;
    audioPlayer.stop();
    setIsPlayingAudio(false);
    setAudioError(null);
    const scan = async () => {
      if (!activeLesson?.chunks?.length) return;
      for (const chunk of activeLesson.chunks) {
        const hasGcsEn = Boolean(chunk.audio_url && chunk.audio_url.startsWith('http') && !chunk.audio_url.includes('placeholder'));
        if (hasGcsEn) continue;
        const text = chunk.english?.trim();
        if (!text) continue;
        if (audioPlayer.hasCachedAudio(text, selectedVoice)) continue;
        const cached = await audioPlayer.getCachedAudioAsync(text, selectedVoice);
        if (!cached) return;
      }
      if (!cancelled) setIsCurrentLessonFullyCached(true);
    };
    scan().catch(() => {});
    return () => { cancelled = true; ++playbackSequenceRef.current; audioPlayer.stop(); };
  }, [activeLesson, selectedVoice, isPreparingAudio]);
  const isCurrentLessonAudioReady = isCurrentLessonFullyCached;

  const rawChunks: ChunkItem[] = activeLesson?.chunks || [];
  const chunks: ChunkItem[] = rawChunks.length > 0 
    ? rawChunks 
    : (curriculumRegistry.getAllLessons()[0]?.chunks || []);

  const currentChunk: ChunkItem = chunks[currentChunkIndex] || chunks[0];

  const checkAudioReady = useCallback((chunk: ChunkItem) => {
    const hasGcsEn = Boolean(chunk.audio_url && chunk.audio_url.startsWith('http') && !chunk.audio_url.includes('placeholder'));
    if (hasGcsEn) return true;
    if (isCurrentLessonFullyCached) return true;
    return Boolean(chunk.english?.trim()) && audioPlayer.hasCachedAudio(chunk.english, selectedVoice);
  }, [selectedVoice, isCurrentLessonFullyCached]);

  const parts: LessonPart[] = useMemo(() => {
    return groupChunksIntoParts(chunks, activeLesson?.lesson_title, checkAudioReady);
  }, [chunks, activeLesson?.lesson_title, checkAudioReady]);

  const currentPart = parts.find(p => currentChunkIndex >= p.start_index && currentChunkIndex <= p.end_index) || parts[0] || null;

  // 2-Topics Model
  const topic1Parts = useMemo(() => parts.filter(p => p.topic_number === 1), [parts]);
  const topic2Parts = useMemo(() => parts.filter(p => p.topic_number === 2), [parts]);
  const hasMultipleTopics = topic1Parts.length > 0 && topic2Parts.length > 0;

  const topic1Title = topic1Parts[0]?.topic_title || 'Topic 1';
  const topic2Title = topic2Parts[0]?.topic_title || 'Topic 2';

  const topic1StartIndex = topic1Parts[0]?.start_index ?? 0;
  const topic1EndIndex = topic1Parts[topic1Parts.length - 1]?.end_index ?? (chunks.length - 1);
  const topic2StartIndex = topic2Parts[0]?.start_index ?? chunks.length;
  const topic2EndIndex = topic2Parts[topic2Parts.length - 1]?.end_index ?? (chunks.length - 1);

  const currentTopicNumber: 1 | 2 = (hasMultipleTopics && currentChunkIndex >= topic2StartIndex) ? 2 : 1;

  const lessonTopics: LessonTopicInfo[] = useMemo(() => {
    if (!hasMultipleTopics) {
      return [{
        topic_number: 1,
        title: activeLesson?.lesson_title || 'Lesson',
        part_count: parts.length,
        start_chunk_index: 0,
        end_chunk_index: chunks.length - 1,
        total_chunks: chunks.length,
        audio_ready_chunks: chunks.filter(c => checkAudioReady(c)).length
      }];
    }
    const readyT1 = chunks.slice(topic1StartIndex, topic1EndIndex + 1).filter(c => checkAudioReady(c)).length;
    const readyT2 = chunks.slice(topic2StartIndex, topic2EndIndex + 1).filter(c => checkAudioReady(c)).length;
    return [
      {
        topic_number: 1,
        title: topic1Title,
        part_count: topic1Parts.length,
        start_chunk_index: topic1StartIndex,
        end_chunk_index: topic1EndIndex,
        total_chunks: topic1EndIndex - topic1StartIndex + 1,
        audio_ready_chunks: readyT1
      },
      {
        topic_number: 2,
        title: topic2Title,
        part_count: topic2Parts.length,
        start_chunk_index: topic2StartIndex,
        end_chunk_index: topic2EndIndex,
        total_chunks: topic2EndIndex - topic2StartIndex + 1,
        audio_ready_chunks: readyT2
      }
    ];
  }, [hasMultipleTopics, activeLesson?.lesson_title, parts.length, chunks, checkAudioReady, topic1Title, topic2Title, topic1Parts.length, topic2Parts.length, topic1StartIndex, topic1EndIndex, topic2StartIndex, topic2EndIndex]);

  const readyChunksCount = useMemo(() => {
    return chunks.filter(c => checkAudioReady(c)).length;
  }, [chunks, checkAudioReady]);

  const audioReadyPercent = chunks.length > 0 ? Math.round((readyChunksCount / chunks.length) * 100) : 0;

  // Grouped courses for the quick lesson switcher
  const groupedCourses = useMemo(() => {
    return curriculumRegistry.getGroupedCoursesWithLessons();
  }, []);

  // Filtered courses for searchable lesson switcher popover
  const filteredGroupedCourses = useMemo(() => {
    const query = lessonSearchQuery.trim().toLowerCase();
    if (!query) return groupedCourses;

    return groupedCourses
      .map(group => ({
        ...group,
        lessons: group.lessons.filter(l => 
          l.lesson_title.toLowerCase().includes(query) ||
          `day ${l.day_number}`.toLowerCase().includes(query) ||
          l.id.toLowerCase().includes(query) ||
          group.course.title.toLowerCase().includes(query)
        )
      }))
      .filter(group => group.lessons.length > 0);
  }, [groupedCourses, lessonSearchQuery]);

  const [lessonReadyMap, setLessonReadyMap] = useState<Record<string, boolean>>({});
  useEffect(() => {
    let cancelled = false;
    setLessonReadyMap({});
    const scan = async () => {
      const result: Record<string, boolean> = {};
      for (const lesson of groupedCourses.flatMap(g => g.lessons)) {
        if (!lesson.chunks?.length) {
          result[lesson.id] = false;
          continue;
        }
        let ready = true;
        for (const chunk of lesson.chunks) {
          const hasGcsEn = Boolean(chunk.audio_url && chunk.audio_url.startsWith('http') && !chunk.audio_url.includes('placeholder'));
          if (hasGcsEn || audioPlayer.hasCachedAudio(chunk.english, selectedVoice)) {
            continue;
          }
          ready = false;
          break;
        }
        result[lesson.id] = ready;
      }
      if (!cancelled) setLessonReadyMap(result);
    };
    scan().catch(() => {});
    return () => { cancelled = true; };
  }, [groupedCourses, selectedVoice, isPreparingAudio]);


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
    const seqId = ++playbackSequenceRef.current;
    audioPlayer.stop();
    setAudioError(null);
    setIsPlayingAudio(true);

    const s = overrideSpeed !== undefined ? overrideSpeed : speed;
    const m = overrideMode || languageMode;
    const r = overrideRepeat !== undefined ? overrideRepeat : repeatCount;

    try {
      if (playbackSequenceRef.current !== seqId) return;
      await audioPlayer.playBilingualSequence(
        targetChunk.english,
        targetChunk.vietnamese,
        m,
        targetChunk.audio_url || null,
        selectedVoice || 'flux-cliff-en',
        selectedVoiceVi,
        s,
        r,
        (step) => {
          if (playbackSequenceRef.current === seqId) {
            setActiveSpeechStep(step);
          }
        },
        targetChunk.audio_url_vi || null
      );
    } catch (err) {
      console.warn('[ClassroomPresentation] Audio playback error:', err);
      if (playbackSequenceRef.current === seqId) {
        setAudioError(err instanceof Error ? err.message : 'Audio playback notice. Click to retry.');
      }
    } finally {
      if (playbackSequenceRef.current === seqId) {
        setIsPlayingAudio(false);
        setActiveSpeechStep('idle');
      }
    }
  };

  // Step Forward (Clicker Next / PageDown / Space)
  const handleNext = () => {
    if (isBlackout) {
      setIsBlackout(false);
      return;
    }

    // 1. Topic 1 completion transition gate (modeled after Improv stage)
    if (hasMultipleTopics && currentChunkIndex === topic1EndIndex) {
      if (!isTopicCompleteGate) {
        setIsTopicCompleteGate(true);
        playTopicTransitionChime();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
        audioPlayer.stop();
        return;
      } else {
        setIsTopicCompleteGate(false);
        setCurrentChunkIndex(topic2StartIndex);
        playCurrentChunkAudio(chunks[topic2StartIndex]);
        return;
      }
    }

    // 2. Lesson completion gate (last chunk of lesson)
    if (currentChunkIndex === chunks.length - 1) {
      if (!isLessonCompleteGate) {
        setIsLessonCompleteGate(true);
        playLessonCompletionFanfare();
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.5 }
        });
        audioPlayer.stop();
        return;
      } else {
        setIsLessonCompleteGate(false);
        return;
      }
    }

    if (isTopicCompleteGate) setIsTopicCompleteGate(false);
    if (isLessonCompleteGate) setIsLessonCompleteGate(false);

    if (currentChunkIndex < chunks.length - 1) {
      const nextIdx = currentChunkIndex + 1;
      setCurrentChunkIndex(nextIdx);
      playCurrentChunkAudio(chunks[nextIdx]);
    }
  };

  // Step Back (Clicker Prev / PageUp)
  const handlePrev = (opts?: { playAudio?: boolean }) => {
    if (isBlackout) {
      setIsBlackout(false);
      return;
    }
    if (isTopicCompleteGate) {
      setIsTopicCompleteGate(false);
      return;
    }
    if (isLessonCompleteGate) {
      setIsLessonCompleteGate(false);
      return;
    }
    if (currentChunkIndex > 0) {
      const prevIdx = currentChunkIndex - 1;
      setCurrentChunkIndex(prevIdx);
      const shouldPlay = opts?.playAudio ?? shortcutConfigService.getConfig().focusMode.playAudioOnPrev;
      if (shouldPlay) {
        playCurrentChunkAudio(chunks[prevIdx]);
      } else {
        audioPlayer.stop();
      }
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
    mode: 'focus',
    onNext: handleNext,
    onPrev: handlePrev,
    onToggleBlackout: handleToggleBlackout,
    onToggleSubtitle: handleToggleSubtitle,
    onReplayAudio: handleReplay,
    onTogglePartsDrawer: handleTogglePartsDrawer,
    onToggleChunkList: () => setIsChunkListOpen(prev => !prev),
    onToggleFullscreen: handleToggleFullscreen,
    onSetLoop: handleSetLoop,
    isModalOpen: isLessonSwitcherOpen || isSoundSettingsOpen || isPrepModalOpen || isDiagnosticOpen || showKeyboardGuide || isPartsDrawerOpen || isChunkListOpen
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
      {audioError && (
        <div role="alert" className="z-30 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 px-4 py-2.5 flex flex-wrap gap-3 items-center text-xs border-b border-amber-200 dark:border-amber-800">
          <span className="flex-1">{audioError}</span>
          <button onClick={() => { setPrepTarget(languageMode === 'EN_ONLY' ? 'ENGLISH' : languageMode === 'VI_ONLY' ? 'VIETNAMESE' : 'BOTH'); setIsSoundSettingsOpen(true); }} className="text-xs underline text-amber-900 dark:text-amber-100 cursor-pointer">Cài đặt âm thanh</button>
          <button onClick={() => playCurrentChunkAudio()} className="text-xs underline font-semibold text-amber-900 dark:text-amber-100 cursor-pointer">Thử phát lại</button>
          <button onClick={() => setAudioError(null)} className="p-1 text-amber-700 hover:text-amber-900 dark:text-amber-300 cursor-pointer" title="Đóng"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {/* 1. PROGRESS BAR AT THE TOP OF PRESENTATION */}
      <PresentationProgressBar
        currentIndex={currentChunkIndex}
        totalChunks={chunks.length}
        parts={parts}
        highContrastDark={highContrastDark}
        onSeek={(targetIndex) => {
          setIsTopicCompleteGate(false);
          setIsLessonCompleteGate(false);
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

      {/* 3. SLIM HIGH-SIGNAL TOP BAR */}
      <div className={`px-4 sm:px-6 py-3 border-b flex items-center justify-between gap-3 transition-colors z-20 ${
        highContrastDark ? 'border-zinc-800 bg-[#0F0F12]' : 'border-[#E8E8EC] bg-white/95 backdrop-blur-xs'
      }`}>
        {/* Left: Lesson Context, Compact Lesson Switcher & Dynamic Progress */}
        <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
          {/* Day pill + Level badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span 
              className="font-mono font-bold text-xs px-2.5 py-1.5 rounded-xl bg-[#DC2626] text-white shrink-0 shadow-2xs"
              title={`Day ${activeLesson?.day_number ?? 1}`}
            >
              Day {activeLesson?.day_number ?? 1}
            </span>
            <span 
              className={`hidden sm:inline-block text-xs font-mono font-bold px-2.5 py-1.5 rounded-xl border shrink-0 ${
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

          {/* 1. COMPACT LESSON SWITCHER BUTTON & POPOVER (Feature 1) */}
          <div className="relative" ref={lessonSwitcherRef}>
            <button
              type="button"
              onClick={() => {
                setIsLessonSwitcherOpen(prev => !prev);
                setIsSoundSettingsOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs max-w-[170px] sm:max-w-[240px] md:max-w-[280px] truncate ${
                isLessonSwitcherOpen
                  ? 'border-[#DC2626] ring-2 ring-[#DC2626]/20 bg-red-50/50 dark:bg-red-950/20 text-[#DC2626]'
                  : highContrastDark
                  ? 'border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-zinc-500'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-900 hover:bg-white hover:border-zinc-300'
              }`}
              title="Đổi Bài Học / Switch Lesson"
            >
              <BookOpen className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span className="truncate font-semibold text-left">
                {activeLesson?.day_number === 0 ? 'Day 0: Word List' : `Day ${activeLesson?.day_number ?? 1}`}: {activeLesson?.lesson_title || 'Chọn bài học'}
              </span>
              {isCurrentLessonAudioReady && (
                <Volume2 className="w-4 h-4 text-emerald-500 shrink-0 animate-in fade-in" title="Audio bài học đã sẵn sàng" />
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform ${isLessonSwitcherOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Floating Lesson Switcher Popover (z-50) */}
            {isLessonSwitcherOpen && (
              <div className={`absolute top-full left-0 mt-2 w-[320px] sm:w-[420px] max-h-[75vh] rounded-2xl border shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
                highContrastDark ? 'bg-[#121216] border-zinc-700 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
              }`}>
                {/* Popover Header */}
                <div className={`p-3.5 border-b flex items-center justify-between gap-2 ${
                  highContrastDark ? 'border-zinc-800 bg-zinc-900/80' : 'border-zinc-100 bg-zinc-50/80'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-100 text-[#DC2626] dark:bg-red-950/50">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-tight">Danh Mục Bài Học</h4>
                      <p className="text-[10px] text-zinc-500">Chọn nhanh bài học để chuyển ngay trên lớp</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLessonSwitcherOpen(false)}
                    className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className={`p-2.5 border-b ${highContrastDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      value={lessonSearchQuery}
                      onChange={(e) => setLessonSearchQuery(e.target.value)}
                      placeholder="Tìm theo Day hoặc tên bài học..."
                      className={`w-full text-xs pl-8.5 pr-8 py-2 rounded-xl border transition-all outline-none ${
                        highContrastDark
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-[#DC2626]'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:bg-white focus:border-[#DC2626]'
                      }`}
                      autoFocus
                    />
                    {lessonSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setLessonSearchQuery('')}
                        className="absolute right-2.5 text-zinc-400 hover:text-zinc-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Grouped Courses & Lessons List */}
                <div className="overflow-y-auto p-2 space-y-3 divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-[50vh]">
                  {filteredGroupedCourses.length === 0 ? (
                    <div className="p-6 text-center text-xs text-zinc-400">
                      Không tìm thấy bài học nào phù hợp với từ khóa "{lessonSearchQuery}".
                    </div>
                  ) : (
                    filteredGroupedCourses.map(({ course, lessons }, gIdx) => (
                      <div key={course.id} className={gIdx > 0 ? 'pt-2.5' : ''}>
                        {/* Course Group Header */}
                        <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                          <span>
                            {course.level_code === 'LEVEL_A' ? '📗 Level A - Foundation' :
                             course.level_code === 'LEVEL_B_EREL' ? '🎧 Level B - EREL (Listening)' :
                             course.level_code === 'LEVEL_B_ERES' ? '🗣️ Level B - ERES (Speaking)' :
                             course.title}
                          </span>
                          <span className="font-mono text-[10px] lowercase font-normal bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                            {lessons.length} bài
                          </span>
                        </div>

                        {/* Lesson Items */}
                        <div className="mt-1 space-y-1">
                          {lessons.map(l => {
                            const isCurrent = l.id === currentLessonId || 
                              (l.id.startsWith('level_b_day_') && currentLessonId === l.id.replace('level_b_day_', 'level_b_ere_day_')) ||
                              (l.id.startsWith('level_b_ere_day_') && currentLessonId === l.id.replace('level_b_ere_day_', 'level_b_day_'));
                            const isLessonReady = Boolean(
                              lessonReadyMap[l.id] ||
                              audioPlayer.isLessonAudioReady(l) ||
                              (l.chunks && l.chunks.length > 0 && l.chunks.every(c => Boolean(c.audio_url && c.audio_url.startsWith('http'))))
                            );
                            return (
                              <button
                                key={l.id}
                                type="button"
                                onClick={() => handleSwitchLesson(l.id)}
                                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                                  isCurrent
                                    ? 'bg-red-50 dark:bg-red-950/40 text-[#DC2626] font-bold border border-red-200 dark:border-red-900/60'
                                    : highContrastDark
                                    ? 'hover:bg-zinc-800/80 text-zinc-200'
                                    : 'hover:bg-zinc-100 text-zinc-800'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                    isCurrent
                                      ? 'bg-[#DC2626] text-white'
                                      : highContrastDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-700'
                                  }`}>
                                    {l.day_number === 0 ? 'Day 0' : `Day ${l.day_number}`}
                                  </span>
                                  <span className="truncate">{l.lesson_title}</span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {isLessonReady && (
                                    <Volume2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="Audio đã sẵn sàng" />
                                  )}
                                  <span className="font-mono text-[10px] text-zinc-400">
                                    {l.total_chunks || l.chunks?.length || 0} chunks
                                  </span>
                                  {isCurrent && (
                                    <Check className="w-3.5 h-3.5 text-[#DC2626]" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Part & Class Progress Pills with Tooltips */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            {/* 2-Topic Navigation Pill */}
            {hasMultipleTopics && (
              <button
                type="button"
                onClick={() => {
                  setIsTopicCompleteGate(false);
                  setIsLessonCompleteGate(false);
                  if (currentTopicNumber === 1) {
                    setCurrentChunkIndex(topic2StartIndex);
                    playCurrentChunkAudio(chunks[topic2StartIndex]);
                  } else {
                    setCurrentChunkIndex(topic1StartIndex);
                    playCurrentChunkAudio(chunks[topic1StartIndex]);
                  }
                }}
                className={`text-xs font-mono font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  currentTopicNumber === 1
                    ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                }`}
                title={`Nhấp để chuyển nhanh giữa Topic 1 (${topic1Title}) và Topic 2 (${topic2Title})`}
              >
                <span>{currentTopicNumber === 1 ? '📘 Topic 1' : '📗 Topic 2'}: {currentTopicNumber === 1 ? topic1Title : topic2Title}</span>
              </button>
            )}

            {currentPart && (
              <button
                type="button"
                onClick={() => setIsPartsDrawerOpen(true)}
                className={`text-xs font-mono font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  highContrastDark
                    ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                }`}
                title={`Part ${currentPart.part_in_topic || currentPart.part_index}: ${currentPart.category.toUpperCase()} (${partChunkCurrent}/${partChunkTotal} chunks, ${partProgressPercent}%)`}
              >
                <Layers className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>{currentPart.part_in_topic ? `Phần ${currentPart.part_in_topic}` : `Part ${currentPart.part_index}`}: {partProgressPercent}%</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsChunkListOpen(true)}
              className={`text-xs font-mono font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
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

        {/* Right Action Cluster: Audio Settings Popover, Fullscreen toggle, Theme toggle, Exit */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 2. AUDIO & SOUND SETTINGS ICON BUTTON & POPOVER (Feature 2) */}
          <div className="relative" ref={soundSettingsRef}>
            <button
              type="button"
              onClick={() => {
                setIsSoundSettingsOpen(prev => !prev);
                setIsLessonSwitcherOpen(false);
              }}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                isSoundSettingsOpen
                  ? 'border-[#DC2626] ring-2 ring-[#DC2626]/20 bg-red-50 text-[#DC2626] dark:bg-red-950/30'
                  : highContrastDark
                  ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                  : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700'
              }`}
              title="Cài Đặt Âm Thanh / Audio Setup"
            >
              {isCurrentLessonAudioReady ? (
                <Volume2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <Sliders className="w-4 h-4 text-[#DC2626]" />
              )}
              <span className="hidden sm:inline text-xs font-bold font-mono">
                {isCurrentLessonAudioReady ? 'Audio Ready' : (audioProvider === 'DEEPGRAM_AURA' ? 'Aura AI' : 'Google TTS')}
              </span>
            </button>

            {/* Floating Audio & Sound Settings Popover (z-50) */}
            {isSoundSettingsOpen && (
              <div className={`absolute top-full right-0 mt-2 w-[320px] sm:w-[390px] max-h-[85vh] rounded-2xl border shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
                highContrastDark ? 'bg-[#121216] border-zinc-700 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
              }`}>
                {/* Popover Header */}
                <div className={`p-4 border-b flex items-center justify-between ${
                  highContrastDark ? 'border-zinc-800 bg-zinc-900/80' : 'border-zinc-100 bg-zinc-50/80'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-red-100 text-[#DC2626] dark:bg-red-950/50">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold tracking-tight">Cài Đặt Bộ Tổng Hợp Âm Thanh</h3>
                      <p className="text-[10px] text-zinc-500">Deepgram Aura & Google Cloud TTS Audio Engine</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSoundSettingsOpen(false)}
                    className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Popover Body */}
                <div className="p-4 space-y-4 overflow-y-auto text-xs">
                  {isCurrentLessonAudioReady ? (
                    /* High-contrast readiness banner */
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
                        <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                          <span>Audio Đã Sẵn Sàng</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">GCS Master</span>
                        </div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 leading-snug mt-0.5">
                          Bài học đang phát từ audio chuẩn studio, không cần cấu hình model TTS.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* 1. Audio Engine Provider Switcher */}
                      <div>
                        <label className="block font-bold text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">
                          1. Chọn Engine Tổng Hợp Giọng (Provider)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAudioProvider('DEEPGRAM_AURA');
                              audioPlayer.setAudioProvider('DEEPGRAM_AURA');
                              setSelectedVoice('flux-cliff-en');
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              audioProvider === 'DEEPGRAM_AURA'
                                ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold ring-2 ring-purple-500/20'
                                : highContrastDark ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800' : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-extrabold text-xs">Deepgram Flux & Aura</span>
                              <Zap className="w-3.5 h-3.5 text-purple-600 fill-purple-500" />
                            </div>
                            <p className="text-[10px] text-zinc-500 leading-tight">Neural Natural Voice AI (Khuyên dùng)</p>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAudioProvider('GOOGLE_TTS');
                              audioPlayer.setAudioProvider('GOOGLE_TTS');
                              setSelectedVoice('en-US-Journey-F');
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              audioProvider === 'GOOGLE_TTS'
                                ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold ring-2 ring-blue-500/20'
                                : highContrastDark ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800' : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-extrabold text-xs">Google Cloud TTS</span>
                              <Cloud className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <p className="text-[10px] text-zinc-500 leading-tight">Journey & Studio Models</p>
                          </button>
                        </div>
                      </div>

                      {/* 2. English Voice Model */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="font-bold text-[10px] uppercase tracking-wider text-zinc-500">
                            2. Giọng Đọc Tiếng Anh (English Model)
                          </label>
                          <button
                            type="button"
                            disabled={isAuditioningEn}
                            onClick={async () => {
                              setIsAuditioningEn(true);
                              try {
                                await audioPlayer.playChunk(
                                  "Master English chunk by chunk with natural rhythm.",
                                  null,
                                  selectedVoice,
                                  speed,
                                  true
                                );
                              } finally {
                                setIsAuditioningEn(false);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#DC2626] hover:text-red-700 cursor-pointer disabled:opacity-50"
                            title="Nghe thử giọng tiếng Anh đã chọn"
                          >
                            <Play className={`w-3 h-3 fill-current ${isAuditioningEn ? 'animate-pulse' : ''}`} />
                            <span>{isAuditioningEn ? 'Đang phát...' : 'Nghe thử EN'}</span>
                          </button>
                        </div>

                        <select
                          value={selectedVoice}
                          onChange={(e) => setSelectedVoice(e.target.value)}
                          className={`w-full text-xs font-medium rounded-xl p-2.5 border transition-all cursor-pointer outline-none ${
                            highContrastDark
                              ? 'bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-[#DC2626]'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:bg-white focus:border-[#DC2626]'
                          }`}
                        >
                          {(() => {
                            const focusEn = modelRegistryService.getFocusModels('en');
                            const displayed = focusEn.some(m => m.id === selectedVoice)
                              ? focusEn
                              : (modelRegistryService.getModelById(selectedVoice)
                                  ? [modelRegistryService.getModelById(selectedVoice)!, ...focusEn]
                                  : focusEn);
                            return displayed.map(v => (
                              <option key={v.id} value={v.id}>
                                {v.name}
                              </option>
                            ));
                          })()}
                        </select>
                      </div>

                      {/* 3. Vietnamese Voice Model */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="font-bold text-[10px] uppercase tracking-wider text-zinc-500">
                            3. Giọng Đọc Tiếng Việt (Vietnamese Model)
                          </label>
                          <button
                            type="button"
                            disabled={isAuditioningVi}
                            onClick={async () => {
                              setIsAuditioningVi(true);
                              try {
                                await audioPlayer.playChunk(
                                  "Luyện tập phản xạ tiếng Anh tự nhiên theo cụm từ.",
                                  null,
                                  selectedVoiceVi,
                                  speed,
                                  true
                                );
                              } finally {
                                setIsAuditioningVi(false);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer disabled:opacity-50"
                            title="Nghe thử giọng tiếng Việt đã chọn"
                          >
                            <Play className={`w-3 h-3 fill-current ${isAuditioningVi ? 'animate-pulse' : ''}`} />
                            <span>{isAuditioningVi ? 'Đang phát...' : 'Nghe thử VI'}</span>
                          </button>
                        </div>

                        <select
                          value={selectedVoiceVi}
                          onChange={(e) => setSelectedVoiceVi(e.target.value)}
                          className={`w-full text-xs font-medium rounded-xl p-2.5 border transition-all cursor-pointer outline-none ${
                            highContrastDark
                              ? 'bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-emerald-600'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:bg-white focus:border-emerald-600'
                          }`}
                        >
                          {(() => {
                            const focusVi = modelRegistryService.getFocusModels('vi');
                            const displayed = focusVi.some(m => m.id === selectedVoiceVi)
                              ? focusVi
                              : (modelRegistryService.getModelById(selectedVoiceVi)
                                  ? [modelRegistryService.getModelById(selectedVoiceVi)!, ...focusVi]
                                  : focusVi);
                            return displayed.map(v => (
                              <option key={v.id} value={v.id}>
                                {v.name}
                              </option>
                            ));
                          })()}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Speed & Repeat Controls - Always Accessible */}
                  <div className={`pt-3 border-t space-y-3 ${
                    highContrastDark ? 'border-zinc-800' : 'border-zinc-100'
                  }`}>
                    {/* Language Mode Selector */}
                    <div>
                      <label className="block font-bold text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">
                        Chế độ phát âm thanh (Language Mode)
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setLanguageMode('EN_ONLY')}
                          className={`py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                            languageMode === 'EN_ONLY'
                              ? 'bg-white dark:bg-zinc-800 text-[#DC2626] shadow-xs'
                              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                          }`}
                        >
                          Chỉ Tiếng Anh (EN)
                        </button>
                        <button
                          type="button"
                          onClick={() => setLanguageMode('VI_ONLY')}
                          className={`py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                            languageMode === 'VI_ONLY'
                              ? 'bg-white dark:bg-zinc-800 text-emerald-600 shadow-xs'
                              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                          }`}
                        >
                          Chỉ Tiếng Việt (VI)
                        </button>
                        <button
                          type="button"
                          onClick={() => setLanguageMode('EN_THEN_VI')}
                          className={`py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                            languageMode === 'EN_THEN_VI'
                              ? 'bg-white dark:bg-zinc-800 text-[#DC2626] shadow-xs'
                              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                          }`}
                        >
                          Song ngữ (EN ➔ VI)
                        </button>
                        <button
                          type="button"
                          onClick={() => setLanguageMode('VI_THEN_EN')}
                          className={`py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                            languageMode === 'VI_THEN_EN'
                              ? 'bg-white dark:bg-zinc-800 text-[#DC2626] shadow-xs'
                              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                          }`}
                        >
                          Song ngữ (VI ➔ EN)
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-bold text-[10px] uppercase tracking-wider text-zinc-500">
                          Tốc độ đọc (Speed)
                        </label>
                        <span className="font-mono text-xs font-extrabold text-[#DC2626]">
                          {speed.toFixed(1)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.8"
                        max="2.0"
                        step="0.1"
                        value={speed}
                        onChange={(e) => setSpeed(parseFloat(e.target.value))}
                        className="w-full accent-[#DC2626] cursor-pointer h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">
                        Số lần lặp (Repeat)
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[1, 2, 3].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRepeatCount(r)}
                            className={`py-1.5 px-3 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                              repeatCount === r
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : highContrastDark
                                ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                                : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                            }`}
                          >
                            {r} lần ({r}x)
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions Footer */}
                  <div className={`pt-3 border-t flex items-center justify-between gap-2 ${
                    highContrastDark ? 'border-zinc-800' : 'border-zinc-100'
                  }`}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDiagnosticOpen(true);
                        setIsSoundSettingsOpen(false);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Activity className="w-3.5 h-3.5 text-red-500" />
                      <span>Diagnostics</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPrepModalOpen(true);
                        setIsSoundSettingsOpen(false);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#DC2626] text-white text-[11px] font-bold hover:bg-red-700 transition-colors shadow-2xs"
                    >
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      <span>Batch Prepare</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
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
            className={`p-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
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
              className="p-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-[#DC2626] hover:text-red-700 transition-colors cursor-pointer shadow-2xs"
              title="Thoát Chế Độ Trình Chiếu (Exit Presentation)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 4. PRIMARY DRILL STAGE (DYNAMIC LANGUAGE INVERSION & ENLARGED TYPOGRAPHY - Feature 4) */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-14 text-center max-w-5xl mx-auto w-full relative">
        {isTopicCompleteGate ? (
          <div className="my-auto py-8 w-full max-w-3xl mx-auto p-8 sm:p-10 rounded-3xl border-2 shadow-2xl transition-all animate-fade-in text-center flex flex-col items-center bg-white dark:bg-zinc-900 border-[#DC2626]/40 shadow-red-500/10">
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 text-[#DC2626] flex items-center justify-center text-4xl mb-4 shadow-xs">
              🎉
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <span>📘 CỔNG CHUYỂN TOPIC</span>
            </div>
            <h2 className="font-display font-black text-2xl md:text-3xl text-zinc-950 dark:text-white tracking-tight mb-2">
              ĐÃ HOÀN THÀNH TOPIC 1: {topic1Title.toUpperCase()}!
            </h2>
            <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-300 max-w-lg mb-8">
              Bấm <span className="font-bold text-[#DC2626]">Next</span> (Phím <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-xs">Space</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-xs">➔</kbd> trên bút clicker) để bắt đầu <span className="font-bold text-emerald-600 dark:text-emerald-400">Topic 2: {topic2Title}</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setIsTopicCompleteGate(false);
                  setCurrentChunkIndex(topic2StartIndex);
                  playCurrentChunkAudio(chunks[topic2StartIndex]);
                }}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm md:text-base shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-95 animate-pulse"
              >
                <span>Bắt đầu Topic 2 ({topic2Title})</span>
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTopicCompleteGate(false);
                  setCurrentChunkIndex(topic1StartIndex);
                  playCurrentChunkAudio(chunks[topic1StartIndex]);
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 font-bold text-xs md:text-sm transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Luyện lại Topic 1</span>
              </button>
            </div>
          </div>
        ) : isLessonCompleteGate ? (
          <div className="my-auto py-8 w-full max-w-3xl mx-auto p-8 sm:p-10 rounded-3xl border-2 shadow-2xl transition-all animate-fade-in text-center flex flex-col items-center bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 dark:from-zinc-900 dark:via-zinc-850 dark:to-zinc-900 border-amber-300 dark:border-amber-700/60 shadow-amber-500/10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center text-4xl mb-4 shadow-md">
              🏆
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <span>Xuất sắc · {chunks.length} Chunks Hoàn Tất</span>
            </div>
            <h2 className="font-display font-black text-2xl md:text-3xl text-zinc-950 dark:text-white tracking-tight mb-2">
              Chúc Mừng! Đã Hoàn Thành Toàn Bộ Bài Học
            </h2>
            <p className="text-base font-bold text-[#DC2626] mb-2">
              {activeLesson?.lesson_title}
            </p>
            <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-300 max-w-lg mb-8">
              Tất cả các phần trong {hasMultipleTopics ? `Topic 1 (${topic1Title}) và Topic 2 (${topic2Title})` : 'bài học'} đã được hoàn tất trọn vẹn!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsLessonCompleteGate(false);
                  setCurrentChunkIndex(0);
                  playCurrentChunkAudio(chunks[0]);
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-extrabold text-xs md:text-sm shadow-lg transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Luyện lại từ đầu</span>
              </button>
              {hasMultipleTopics && (
                <button
                  type="button"
                  onClick={() => {
                    setIsLessonCompleteGate(false);
                    setCurrentChunkIndex(topic2StartIndex);
                    playCurrentChunkAudio(chunks[topic2StartIndex]);
                  }}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold text-xs md:text-sm transition-all cursor-pointer"
                >
                  <span>Luyện lại Topic 2</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  playLessonCompletionFanfare();
                  confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-bold text-xs md:text-sm transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Ăn mừng (Confetti)</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Badges */}
            <div className="flex items-center gap-2 mb-6 flex-wrap justify-center">
              {/* Part Badge */}
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-xs ${
                highContrastDark 
                  ? 'bg-zinc-800/90 text-zinc-200 border-zinc-700' 
                  : 'bg-zinc-100/90 text-zinc-800 border-zinc-200'
              }`}>
                <Layers className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>
                  {currentPart 
                    ? `Part ${currentPart.part_index} · ${currentPart.title}` 
                    : (currentChunk.part || 'Drill Phase')}
                </span>
              </span>

              {currentChunk.speaker && (
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-zinc-800 text-white flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#DC2626]" />
                  Speaker: {currentChunk.speaker}
                </span>
              )}

              {/* Category Badge */}
              {(() => {
                const isSlangExample = currentChunk.category === 'slang' && Boolean(
                  currentChunk.is_example || 
                  (currentChunk.notes && (currentChunk.notes.includes('[Example Sentence]') || currentChunk.notes.toLowerCase().includes('example')))
                );

                if (isSlangExample) {
                  return (
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full border border-amber-400/50 bg-amber-500/15 text-amber-600 dark:text-amber-400 uppercase tracking-wider shadow-xs">
                      SLANG EXAMPLE
                    </span>
                  );
                }

                return (
                  <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${getCategoryColor(currentChunk.category)}`}>
                    {currentChunk.category ? currentChunk.category.toUpperCase() : ''}
                  </span>
                );
              })()}

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

            {/* Primary Stage Chunk (Dynamic Language Inversion based on languageMode) */}
            {(() => {
              const isViMode = languageMode === 'VI_ONLY';
              const primaryText = isViMode ? (currentChunk.vietnamese || currentChunk.english) : currentChunk.english;
              const subtitleText = isViMode ? currentChunk.english : currentChunk.vietnamese;
              const isPrimarySpeaking = isViMode ? activeSpeechStep === 'vi' : activeSpeechStep === 'en';
              const isSubtitleSpeaking = isViMode ? activeSpeechStep === 'en' : activeSpeechStep === 'vi';

              return (
                <div className="my-auto py-4 w-full">
                  {/* Primary Large Text */}
                  <h1
                    className={`font-display font-bold leading-tight md:leading-tight tracking-tight transition-colors duration-150 transform-gpu ${
                      primaryText.length > 70 
                        ? 'text-3xl md:text-5xl' 
                        : primaryText.length > 40 
                          ? 'text-4xl md:text-6xl' 
                          : 'text-5xl md:text-7xl'
                    } ${isPrimarySpeaking ? 'text-[#DC2626]' : ''}`}
                  >
                    {primaryText}
                  </h1>

                  {/* Subtitle (Toggleable via Key V, Font size +20% enlarged: text-2xl md:text-3xl font-medium) */}
                  <div className="min-h-[4rem] mt-6 flex items-center justify-center">
                    {showSubtitle ? (
                      <p className={`text-2xl md:text-3xl font-medium transition-colors duration-150 leading-relaxed ${
                        isSubtitleSpeaking 
                          ? 'text-emerald-600 font-bold' 
                          : highContrastDark ? 'text-zinc-400' : 'text-[#6B6B6B]'
                      }`}>
                        {subtitleText}
                      </p>
                    ) : (
                      <button
                        onClick={() => setShowSubtitle(true)}
                        className={`text-xs font-mono px-3.5 py-2 rounded-xl border border-dashed cursor-pointer transition-colors ${
                          highContrastDark 
                            ? 'text-zinc-400 hover:text-zinc-200 bg-zinc-800 border-zinc-700' 
                            : 'text-zinc-400 hover:text-zinc-600 bg-zinc-100 border-zinc-300'
                        }`}
                      >
                        {isViMode 
                          ? "[English translation hidden — Press 'V' or click to reveal]" 
                          : "[Subtitle Hidden — Press 'V' or click to reveal translation]"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

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
          </>
        )}
      </div>

      {/* 5. PARTS NAVIGATION DRAWER */}
      <PartsDrawer
        isOpen={isPartsDrawerOpen}
        onClose={() => setIsPartsDrawerOpen(false)}
        parts={parts}
        currentChunkIndex={currentChunkIndex}
        lessonTitle={activeLesson?.lesson_title}
        onSelectPart={(startIndex) => {
          setIsTopicCompleteGate(false);
          setIsLessonCompleteGate(false);
          setCurrentChunkIndex(startIndex);
          playCurrentChunkAudio(chunks[startIndex]);
        }}
      />

      {/* 6. CLICKER SHORTCUT GUIDE MODAL */}
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
                <span className="font-mono font-bold px-2 py-0.5 bg-zinc-200 rounded text-zinc-900">
                  {shortcutConfig.keyBindings.next?.map(k => shortcutConfigService.getKeyFriendlyName(k)).join(' / ') || 'Chưa gán'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                <span className="font-semibold text-zinc-800">Previous Chunk</span>
                <span className="font-mono font-bold px-2 py-0.5 bg-zinc-200 rounded text-zinc-900">
                  {shortcutConfig.keyBindings.prev?.map(k => shortcutConfigService.getKeyFriendlyName(k)).join(' / ') || 'Chưa gán'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                <span className="font-semibold text-zinc-800">Replay Audio</span>
                <span className="font-mono font-bold px-2 py-0.5 bg-zinc-200 rounded text-zinc-900">
                  {shortcutConfig.keyBindings.replay?.map(k => shortcutConfigService.getKeyFriendlyName(k)).join(' / ') || 'Chưa gán'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                <span className="font-semibold text-zinc-800">Blackout (Blank Screen)</span>
                <span className="font-mono font-bold px-2 py-0.5 bg-zinc-200 rounded text-zinc-900">
                  {shortcutConfig.keyBindings.blackout?.map(k => shortcutConfigService.getKeyFriendlyName(k)).join(' / ') || 'Chưa gán'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                <span className="font-semibold text-zinc-800">Toggle Vietnamese Translation</span>
                <span className="font-mono font-bold px-2 py-0.5 bg-zinc-200 rounded text-zinc-900">
                  {shortcutConfig.keyBindings.subtitle?.map(k => shortcutConfigService.getKeyFriendlyName(k)).join(' / ') || 'Chưa gán'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                <span className="font-semibold text-zinc-800">Open Parts Navigation Drawer</span>
                <span className="font-mono font-bold px-2 py-0.5 bg-zinc-200 rounded text-zinc-900">
                  {shortcutConfig.keyBindings.drawer?.map(k => shortcutConfigService.getKeyFriendlyName(k)).join(' / ') || 'Chưa gán'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                <span className="font-semibold text-zinc-800">Fullscreen Toggle</span>
                <span className="font-mono font-bold px-2 py-0.5 bg-zinc-200 rounded text-zinc-900">
                  {shortcutConfig.keyBindings.fullscreen?.map(k => shortcutConfigService.getKeyFriendlyName(k)).join(' / ') || 'Chưa gán'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                <span className="font-semibold text-zinc-800">Loop 1x / 2x / 3x</span>
                <span className="font-mono font-bold px-2 py-0.5 bg-zinc-200 rounded text-zinc-900">
                  {(shortcutConfig.keyBindings.digit1?.length ? [...shortcutConfig.keyBindings.digit1, ...(shortcutConfig.keyBindings.digit2 || []), ...(shortcutConfig.keyBindings.digit3 || [])] : ['Digit1', 'Digit2', 'Digit3']).map(k => shortcutConfigService.getKeyFriendlyName(k)).join(' / ')}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 font-mono text-center pt-2">
              100% compatible with Logitech Spotlight, R400/R800, Baseus, and generic Bluetooth presenter remotes.
            </p>
          </div>
        </div>
      )}

      {/* 7. MINIMAL HIGH-CONTRAST FLOATING CLASSROOM DOCK (Feature 3: Speed Slider) */}
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
            className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isTopicCompleteGate
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white animate-pulse shadow-emerald-500/20 ring-2 ring-emerald-400/50'
                : isLessonCompleteGate || currentChunkIndex === chunks.length - 1
                ? 'bg-amber-600 text-white hover:bg-amber-500 shadow-amber-500/20'
                : 'bg-zinc-900 text-white hover:bg-zinc-800'
            }`}
            title="Next Chunk (PageDown / Right / Space)"
          >
            <span>
              {isTopicCompleteGate
                ? 'Bắt đầu Topic 2 ➔'
                : (isLessonCompleteGate || currentChunkIndex === chunks.length - 1)
                ? 'Hoàn Tất 🎉'
                : 'Tiếp (Next)'}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Language Mode, Smooth Speed Slider & Loop Count (Feature 3) */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Language Mode Selector: EN and VI */}
          <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-0.5 rounded-lg text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => setLanguageMode('EN_ONLY')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                languageMode === 'EN_ONLY' ? 'bg-[#DC2626] text-white shadow-xs font-extrabold' : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900'
              }`}
              title="Chế độ Tiếng Anh (EN Only - Primary EN, Subtitle VI)"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguageMode('VI_ONLY')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                languageMode === 'VI_ONLY' ? 'bg-[#DC2626] text-white shadow-xs font-extrabold' : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900'
              }`}
              title="Chế độ Tiếng Việt (VI Only - Primary VI, Subtitle EN)"
            >
              VI
            </button>
          </div>

          {/* 3. SMOOTH SPEED RANGE SLIDER (Feature 3) */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-xl border ${
            highContrastDark ? 'bg-zinc-800/80 border-zinc-700' : 'bg-zinc-100/90 border-zinc-200'
          }`}>
            <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400">Speed:</span>
            <input
              type="range"
              min="0.8"
              max="2.0"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-20 sm:w-24 accent-[#DC2626] cursor-pointer h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
              title={`Tốc độ đọc: ${speed.toFixed(1)}x (0.8x - 2.0x)`}
            />
            <span className="text-[11px] font-mono font-extrabold text-[#DC2626] min-w-[30px] text-right">
              {speed.toFixed(1)}x
            </span>
          </div>

          {/* Loop Count */}
          <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-0.5 rounded-lg text-xs font-mono font-bold">
            {[1, 2, 3].map((r) => (
              <button
                key={r}
                onClick={() => setRepeatCount(r)}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer text-[11px] ${
                  repeatCount === r ? 'bg-amber-500 text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900'
                }`}
                title={`Lặp lại ${r} lần (Phím ${r})`}
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

      {/* 8. VOCABULARY & CHUNKS PREVIEW DRAWER */}
      <ChunkListPreviewDrawer
        isOpen={isChunkListOpen}
        onClose={() => setIsChunkListOpen(false)}
        chunks={chunks}
        currentIndex={currentChunkIndex}
        parts={parts}
        currentPart={currentPart}
        highContrastDark={highContrastDark}
        onSelectChunk={(targetIndex) => {
          setIsTopicCompleteGate(false);
          setIsLessonCompleteGate(false);
          setCurrentChunkIndex(targetIndex);
          playCurrentChunkAudio(chunks[targetIndex]);
        }}
        onPreviewAudio={(targetChunk) => {
          playCurrentChunkAudio(targetChunk);
        }}
      />

      {/* 9. BATCH AUDIO PREPARATION MODAL */}
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
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Engine EN:</span>
                  <span className="font-mono font-bold text-zinc-800">
                    {audioProvider === 'DEEPGRAM_AURA' ? 'Deepgram Aura AI' : 'Google Cloud TTS'} ({selectedVoice})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Engine VI:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    Google Cloud TTS ({selectedVoiceVi})
                  </span>
                </div>
              </div>

              {/* Target Audio Selector */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1.5">
                  Mục tiêu tổng hợp (Target Chunks):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPrepTarget('BOTH')}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      prepTarget === 'BOTH'
                        ? 'border-[#DC2626] bg-red-50 text-[#DC2626]'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    Cả EN & VI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrepTarget('ENGLISH')}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      prepTarget === 'ENGLISH'
                        ? 'border-[#DC2626] bg-red-50 text-[#DC2626]'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    Chỉ EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrepTarget('VIETNAMESE')}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      prepTarget === 'VIETNAMESE'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    Chỉ VI
                  </button>
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

      {/* 10. AUDIO ENGINE DIAGNOSTICS MODAL */}
      <AudioDiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
      />
    </div>
  );
};
