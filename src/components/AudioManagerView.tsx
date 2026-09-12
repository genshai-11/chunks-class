import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  CohortAudioSettings, 
  CourseLevel, 
  Course, 
  LessonDoc, 
  ChunkItem,
  LanguageMode,
  FailedAudioChunkInfo,
  BatchPreparationMode
} from '../types';
import { 
  audioPlayer, 
  AudioProvider, 
  AudioSourceType, 
  AudioBatchTarget,
  sanitizeSpeechText 
} from '../services/googleTtsService';
import { modelRegistryService, PROVIDERS_META, getMinimalName } from '../services/modelRegistryService';
import { curriculumRegistry } from '../services/curriculumRegistry';
import { getAllLessons, addOrUpdateChunk, updateLessonChunks } from '../services/firestoreService';
import { 
  uploadBase64AudioToGcs, 
  syncLessonCachedAudioToCloud, 
  buildPublicGcsAudioUrl 
} from '../services/cloudAudioStorageService';
import { 
  CANONICAL_PARTS, 
  playPartIntro, 
  prepareAllCanonicalPartAudios, 
  isPartAudioCached,
  PartAnnouncementDef
} from '../services/partAudioService';
import { AudioDiagnosticModal } from './AudioDiagnosticModal';
import { 
  Volume2, 
  Play, 
  RotateCcw, 
  RefreshCw, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Zap, 
  SlidersHorizontal, 
  Layers, 
  Search, 
  X, 
  ChevronRight, 
  ChevronDown, 
  Headphones, 
  Radio, 
  FileAudio, 
  Loader2, 
  Square, 
  Check, 
  Eye, 
  BookOpen, 
  ShieldCheck, 
  ListFilter,
  BarChart3,
  Sliders,
  Cpu,
  Info,
  Edit3,
  Save,
  Trash2,
  CloudUpload,
  AlertTriangle,
  RefreshCcw,
  CheckCheck,
  Filter
} from 'lucide-react';

interface AudioManagerViewProps {
  cohortAudioSettings?: CohortAudioSettings;
  defaultCourseLevel?: CourseLevel;
  onUpdateAudioSettings?: (settings: CohortAudioSettings) => void;
  onLaunchProjectorForLesson?: (lessonId: string, sessionNumber: number) => void;
}

interface LessonAudioStatus {
  lessonId: string;
  dayNumber: number;
  title: string;
  totalChunks: number;
  enCached: number;
  viCached: number;
  gcsCount: number;
  enPercent: number;
  viPercent: number;
  isFullyCached: boolean;
}

const createBaselineStatuses = (lessonList: LessonDoc[]): LessonAudioStatus[] => {
  return lessonList.map(lesson => {
    const chunks = lesson.chunks || [];
    const gcsCount = chunks.filter(c => Boolean(c.audio_url && c.audio_url.startsWith('http') && !c.audio_url.includes('placeholder'))).length;
    return {
      lessonId: lesson.id,
      dayNumber: lesson.day_number,
      title: lesson.lesson_title || `Day ${lesson.day_number}`,
      totalChunks: chunks.length,
      enCached: gcsCount, // Baseline estimation
      viCached: 0,
      gcsCount,
      enPercent: chunks.length > 0 ? Math.round((gcsCount / chunks.length) * 100) : 0,
      viPercent: 0,
      isFullyCached: chunks.length > 0 && gcsCount === chunks.length
    };
  });
};

interface BatchLogItem {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'cloud';
}

export const AudioManagerView: React.FC<AudioManagerViewProps> = ({
  cohortAudioSettings,
  defaultCourseLevel,
  onUpdateAudioSettings,
  onLaunchProjectorForLesson
}) => {
  // --------------------------------------------------------------------------
  // 1. Courses & Level Tab State
  // --------------------------------------------------------------------------
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseLevel, setSelectedCourseLevel] = useState<CourseLevel>(
    defaultCourseLevel || 'LEVEL_B_ERES'
  );
  const [lessons, setLessons] = useState<LessonDoc[]>(() => {
    return curriculumRegistry.getLessons(defaultCourseLevel || 'LEVEL_B_ERES');
  });
  const [isLoadingLessons, setIsLoadingLessons] = useState<boolean>(false);

  useEffect(() => {
    if (defaultCourseLevel && defaultCourseLevel !== selectedCourseLevel) {
      setSelectedCourseLevel(defaultCourseLevel);
    }
  }, [defaultCourseLevel]);

  // --------------------------------------------------------------------------
  // 2. Audio Engine & Provider Configuration
  // --------------------------------------------------------------------------
  const [activeProvider, setActiveProvider] = useState<AudioProvider>(audioPlayer.getAudioProvider());
  const [activeSource, setActiveSource] = useState<AudioSourceType>(audioPlayer.getLastSource());
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState<boolean>(false);

  const [voiceProfileEn, setVoiceProfileEn] = useState<string>(
    cohortAudioSettings?.voice_profile_en || modelRegistryService.getMainModelEn()
  );
  const [voiceProfileVi, setVoiceProfileVi] = useState<string>(
    cohortAudioSettings?.voice_profile_vi || modelRegistryService.getMainModelVi()
  );

  const [statusList, setStatusList] = useState<LessonAudioStatus[]>(() => {
    return createBaselineStatuses(curriculumRegistry.getLessons(defaultCourseLevel || 'LEVEL_B_ERES'));
  });

  // Synchronously initialize statusList baseline data whenever lessons change
  useEffect(() => {
    if (!lessons || lessons.length === 0) {
      setStatusList([]);
      return;
    }
    const initialStatuses = createBaselineStatuses(lessons);
    setStatusList((prev: LessonAudioStatus[]) => {
      if (prev.length === 0) return initialStatuses;
      const prevMap: Map<string, LessonAudioStatus> = new Map<string, LessonAudioStatus>(prev.map(s => [s.lessonId, s]));
      return initialStatuses.map(init => {
        const existing = prevMap.get(init.lessonId);
        if (existing && existing.totalChunks === init.totalChunks) {
          return existing;
        }
        return init;
      });
    });
  }, [lessons]);
  const [registeredModels, setRegisteredModels] = useState(() => modelRegistryService.getAllModels());
  const allowedModels = useMemo(() => {
    return registeredModels.filter(m => m.focusEnabled && !(m.language === 'vi' && m.provider === 'DEEPGRAM'));
  }, [registeredModels]);
  const englishModels = useMemo(() => {
    const list = allowedModels.filter(m => m.language === 'en');
    return list.sort((a, b) => {
      const isGeminiA = a.provider === 'GEMINI_AI_STUDIO';
      const isGeminiB = b.provider === 'GEMINI_AI_STUDIO';
      if (isGeminiA && !isGeminiB) return 1;
      if (!isGeminiA && isGeminiB) return -1;
      return 0;
    });
  }, [allowedModels]);
  const vietnameseModels = useMemo(() => {
    return allowedModels.filter(m => m.language === 'vi');
  }, [allowedModels]);
  useEffect(() => modelRegistryService.subscribe(() => setRegisteredModels(modelRegistryService.getAllModels())), []);
  useEffect(() => {
    const en = cohortAudioSettings?.voice_profile_en || modelRegistryService.getMainModelEn();
    setVoiceProfileEn(en);
    setVoiceProfileVi(cohortAudioSettings?.voice_profile_vi || modelRegistryService.getMainModelVi());
    setActiveProvider(modelRegistryService.getModelById(en)?.provider === 'DEEPGRAM' ? 'DEEPGRAM_AURA' : 'GOOGLE_TTS');
  }, [cohortAudioSettings?.voice_profile_en, cohortAudioSettings?.voice_profile_vi, registeredModels]);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'missing' | 'has_gcs'>('all');

  // --------------------------------------------------------------------------
  // 4. Chunk Inspector & Audition Drawer State
  // --------------------------------------------------------------------------
  const [inspectingLesson, setInspectingLesson] = useState<LessonDoc | null>(null);
  const [chunkSearch, setChunkSearch] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [playingChunkId, setPlayingChunkId] = useState<string | null>(null);
  const [playingLang, setPlayingLang] = useState<'en' | 'vi' | 'sequence' | null>(null);
  const [regeneratingChunkId, setRegeneratingChunkId] = useState<string | null>(null);
  const [regeneratingTarget, setRegeneratingTarget] = useState<'en' | 'vi' | 'both' | null>(null);

  // Quick Edit State for chunk
  const [editingChunkId, setEditingChunkId] = useState<string | null>(null);
  const [editEnText, setEditEnText] = useState<string>('');
  const [editViText, setEditViText] = useState<string>('');
  const [isSavingChunk, setIsSavingChunk] = useState<boolean>(false);

  // Pre-generation Review Modal State
  const [showModalRegenReview, setShowModalRegenReview] = useState<boolean>(false);
  const [modalRegenTarget, setModalRegenTarget] = useState<AudioBatchTarget>('BOTH');
  const [modalRegenOverwrite, setModalRegenOverwrite] = useState<boolean>(true);

  // --------------------------------------------------------------------------
  // 5. Batch Generator State & Concurrency Controls
  // --------------------------------------------------------------------------
  const [batchScope, setBatchScope] = useState<'current_lesson' | 'entire_course'>('current_lesson');
  const [batchTargetLessonId, setBatchTargetLessonId] = useState<string>('');
  const [batchTarget, setBatchTarget] = useState<AudioBatchTarget>('BOTH');
  const [batchWorkersCount, setBatchWorkersCount] = useState<number>(4);
  const [forceOverwrite, setForceOverwrite] = useState<boolean>(false);
  const [isResettingAudio, setIsResettingAudio] = useState<boolean>(false);
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);

  // New Batch Preparation Controls & Auto-Sync
  const [batchMode, setBatchMode] = useState<BatchPreparationMode>('missing_only');
  const [autoSyncToCloud, setAutoSyncToCloud] = useState<boolean>(true);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'success' | 'cloud'>('all');

  // Failed Audio Queue with LocalStorage Persistence
  const [failedChunks, setFailedChunks] = useState<FailedAudioChunkInfo[]>(() => {
    try {
      const saved = localStorage.getItem('chunks_audio_failed_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('chunks_audio_failed_queue', JSON.stringify(failedChunks));
    } catch (e) {
      console.warn('Failed to persist failedChunks to localStorage:', e);
    }
  }, [failedChunks]);

  const clearFailedQueue = () => setFailedChunks([]);
  const removeFailedChunk = (chunkId: string) => setFailedChunks(prev => prev.filter(c => c.chunkId !== chunkId));

  // --------------------------------------------------------------------------
  // Part Intro Transition Audios State & Handlers (Reusable Across Cohorts)
  // --------------------------------------------------------------------------
  const [partAudioCacheStatus, setPartAudioCacheStatus] = useState<Record<string, boolean>>({});
  const [isPreppingPartAudios, setIsPreppingPartAudios] = useState<boolean>(false);
  const [preppingPartProgress, setPreppingPartProgress] = useState<{ current: number; total: number } | null>(null);
  const [auditioningPartKey, setAuditioningPartKey] = useState<string | null>(null);

  const checkAllPartAudiosCache = useCallback(async () => {
    const status: Record<string, boolean> = {};
    for (const p of CANONICAL_PARTS) {
      status[p.key] = await isPartAudioCached(p.titleEn, voiceProfileEn);
    }
    setPartAudioCacheStatus(status);
  }, [voiceProfileEn]);

  useEffect(() => {
    checkAllPartAudiosCache();
  }, [checkAllPartAudiosCache]);

  const handleAuditionPartIntro = async (part: PartAnnouncementDef) => {
    if (auditioningPartKey) return;
    setAuditioningPartKey(part.key);
    try {
      await playPartIntro(part.titleEn, part.partNumber, voiceProfileEn);
    } catch (e: any) {
      addLog(`Lỗi nghe thử part intro "${part.titleEn}": ${e?.message || String(e)}`, 'error');
    } finally {
      setAuditioningPartKey(null);
      await checkAllPartAudiosCache();
    }
  };

  const handlePrepareAllPartAudios = async () => {
    if (isPreppingPartAudios) return;
    setIsPreppingPartAudios(true);
    setPreppingPartProgress({ current: 0, total: CANONICAL_PARTS.length });
    addLog('Bắt đầu tạo trước âm thanh cho tất cả 7 canonical parts...', 'info');

    try {
      await prepareAllCanonicalPartAudios(voiceProfileEn, (current, total) => {
        setPreppingPartProgress({ current, total });
      });
      addLog('🎉 Đã chuẩn bị xong toàn bộ âm thanh Part Announcements và lưu vào IndexedDB!', 'success');
    } catch (e: any) {
      addLog(`Lỗi chuẩn bị part audios: ${e?.message || String(e)}`, 'error');
    } finally {
      setIsPreppingPartAudios(false);
      setPreppingPartProgress(null);
      await checkAllPartAudiosCache();
    }
  };

  const [batchProgress, setBatchProgress] = useState<{
    stage: 'idle' | 'preparing' | 'synthesizing' | 'uploading_cloud' | 'saving_firestore' | 'completed' | 'cancelled';
    current: number;
    total: number;
    percentage: number;
    currentTask: string;
    successCount: number;
    failCount: number;
    cloudSyncedCount: number;
    skippedCount: number;
  }>({
    stage: 'idle',
    current: 0,
    total: 0,
    percentage: 0,
    currentTask: '',
    successCount: 0,
    failCount: 0,
    cloudSyncedCount: 0,
    skippedCount: 0
  });
  const [batchLogs, setBatchLogs] = useState<BatchLogItem[]>([]);
  const cancelBatchRef = useRef<boolean>(false);
  const [isSyncingToCloud, setIsSyncingToCloud] = useState<boolean>(false);
  const [syncCloudProgress, setSyncCloudProgress] = useState<string | null>(null);

  // Per-chunk custom voice model overrides & expandable settings
  const [chunkVoiceEn, setChunkVoiceEn] = useState<Record<string, string>>({});
  const [chunkVoiceVi, setChunkVoiceVi] = useState<Record<string, string>>({});
  const [expandedChunkVoiceConfig, setExpandedChunkVoiceConfig] = useState<Record<string, boolean>>({});

  // Check if all lessons in current level have 100% GCS Master audio
  const isAllLessonsGcsSynced = lessons.length > 0 && lessons.every(lesson => {
    const chunks = lesson.chunks || [];
    if (chunks.length === 0) return false;
    return chunks.every(c => Boolean(c.audio_url && c.audio_url.startsWith('http') && !c.audio_url.includes('placeholder')));
  });

  // Load available courses on mount
  useEffect(() => {
    const allCourses = curriculumRegistry.getAllCourses();
    setCourses(allCourses);
    if (allCourses.length > 0 && !allCourses.some(c => c.level_code === selectedCourseLevel)) {
      setSelectedCourseLevel(allCourses[0].level_code);
    }
  }, []);

  // Listen to audioPlayer source changes
  useEffect(() => {
    const unsub = audioPlayer.onSourceChange((source) => {
      setActiveSource(source);
    });
    return unsub;
  }, []);

  // Fetch all lessons for the selected course level
  const loadLessons = useCallback(async () => {
    // 1. Synchronously pre-seed lessons with curriculumRegistry so lessons is IMMEDIATELY available on mount
    const defaultLessons = curriculumRegistry.getLessons(selectedCourseLevel);
    if (defaultLessons && defaultLessons.length > 0) {
      setLessons(defaultLessons);
      setBatchTargetLessonId(prev => (!prev || !defaultLessons.some(l => l.id === prev)) ? defaultLessons[0].id : prev);
      setIsLoadingLessons(false);
    } else {
      setIsLoadingLessons(true);
    }

    try {
      const fetched = await getAllLessons(selectedCourseLevel);
      if (fetched && fetched.length > 0) {
        setLessons(fetched);
        setBatchTargetLessonId(prev => (!prev || !fetched.some(l => l.id === prev)) ? fetched[0].id : prev);
      }
    } catch (e: any) {
      console.error('Failed to load lessons for AudioManager from Firestore:', e);
      if (!defaultLessons || defaultLessons.length === 0) {
        const fallback = curriculumRegistry.getLessons(selectedCourseLevel);
        setLessons(fallback);
      }
    } finally {
      setIsLoadingLessons(false);
    }
  }, [selectedCourseLevel]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  // Recalculate readiness status map whenever lessons, voice profiles, or cache changes
  const readinessVersion = useRef(0);
  const latestAppliedVersion = useRef(0);
  const calculateReadinessStatus = useCallback(async () => {
    const version = ++readinessVersion.current;
    if (!lessons || lessons.length === 0) {
      setStatusList([]);
      return;
    }

    try {
      const calculated = await Promise.all(lessons.map(async (lesson) => {
        const chunks = lesson.chunks || [];
        const gcsCount = chunks.filter(c => Boolean(c.audio_url && c.audio_url.startsWith('http') && !c.audio_url.includes('placeholder'))).length;

        try {
          const status = await audioPlayer.checkLessonAudioStatus(chunks, voiceProfileEn, voiceProfileVi);
          const isEnReady = chunks.length > 0 && status.enCached === chunks.length;
          const enPercent = chunks.length > 0 ? (isEnReady ? 100 : Math.round((status.enCached / chunks.length) * 100)) : 0;
          const viPercent = chunks.length > 0 ? Math.round((status.viCached / chunks.length) * 100) : 0;

          return {
            lessonId: lesson.id,
            dayNumber: lesson.day_number,
            title: lesson.lesson_title || `Day ${lesson.day_number}`,
            totalChunks: chunks.length,
            enCached: isEnReady ? chunks.length : status.enCached,
            viCached: status.viCached,
            gcsCount,
            enPercent,
            viPercent,
            isFullyCached: status.isFullyCached
          };
        } catch (lessonErr) {
          console.warn(`[calculateReadinessStatus] Error checking status for lesson ${lesson.id}:`, lessonErr);
          return {
            lessonId: lesson.id,
            dayNumber: lesson.day_number,
            title: lesson.lesson_title || `Day ${lesson.day_number}`,
            totalChunks: chunks.length,
            enCached: gcsCount,
            viCached: 0,
            gcsCount,
            enPercent: chunks.length > 0 ? Math.round((gcsCount / chunks.length) * 100) : 0,
            viPercent: 0,
            isFullyCached: chunks.length > 0 && gcsCount === chunks.length
          };
        }
      }));

      // Update statusList reliably without race condition discard bugs
      if (version >= latestAppliedVersion.current) {
        latestAppliedVersion.current = version;
        setStatusList(calculated);
      }
    } catch (err) {
      console.error('[calculateReadinessStatus] Unhandled error during readiness check:', err);
    }
  }, [lessons, voiceProfileEn, voiceProfileVi]);

  useEffect(() => {
    calculateReadinessStatus();
  }, [calculateReadinessStatus]);

  // Provider change handler
  const handleSwitchProvider = (provider: AudioProvider) => {
    setActiveProvider(provider);
    audioPlayer.setAudioProvider(provider);
    const model = englishModels.find(m => provider === 'DEEPGRAM_AURA' ? m.provider === 'DEEPGRAM' : m.provider !== 'DEEPGRAM');
    if (!model) return;
    setVoiceProfileEn(model.id);
    onUpdateAudioSettings?.({
      ...(cohortAudioSettings || { language_mode: 'EN_THEN_VI', auto_advance_delay_sec: 0, default_speed: 1, repeat_count: 1 }),
      voice_profile_en: model.id, voice_profile_vi: voiceProfileVi, provider_primary: provider
    });
  };

  // Helper log function for batch engine
  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' | 'cloud' = 'info') => {
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    setBatchLogs(prev => [
      { id: `${Date.now()}-${Math.random()}`, timestamp: timeStr, message, type },
      ...prev.slice(0, 199)
    ]);
  };

  // Single chunk audition handler
  const handlePlayChunk = async (chunk: ChunkItem, lang: 'en' | 'vi' | 'sequence') => {
    audioPlayer.stop();
    setPlayingChunkId(chunk.chunk_id);
    setPlayingLang(lang);

    const selectedEn = chunkVoiceEn[chunk.chunk_id] || voiceProfileEn;
    const selectedVi = chunkVoiceVi[chunk.chunk_id] || voiceProfileVi;
    try {
      if (lang === 'en') {
        await audioPlayer.playChunk(
          chunk.english,
          activeProvider === 'DEEPGRAM_AURA' ? null : chunk.audio_url,
          selectedEn,
          1.0
        );
      } else if (lang === 'vi') {
        await audioPlayer.playChunk(
          chunk.vietnamese,
          chunk.audio_url_vi || null,
          selectedVi,
          1.0
        );
      } else if (lang === 'sequence') {
        await audioPlayer.playBilingualSequence(
          chunk.english,
          chunk.vietnamese,
          'EN_THEN_VI',
          activeProvider === 'DEEPGRAM_AURA' ? null : chunk.audio_url,
          selectedEn,
          selectedVi,
          1.0,
          1,
          undefined,
          chunk.audio_url_vi || null
        );
      }
    } catch (e: any) {
      addLog('Audio playback failed: ' + (e?.message || String(e)), 'error');
    } finally {
      setPlayingChunkId(null);
      setPlayingLang(null);
      calculateReadinessStatus();
    }
  };

  // Single chunk regeneration handler with explicit language target (EN, VI, or BOTH), text override, and voice override
  const handleRegenerateChunkAudio = async (
    chunk: ChunkItem, 
    targetLang: 'en' | 'vi' | 'both' = 'both',
    textEnOverride?: string,
    textViOverride?: string,
    voiceEnOverride?: string,
    voiceViOverride?: string
  ) => {
    setRegeneratingChunkId(chunk.chunk_id);
    setRegeneratingTarget(targetLang);
    try {
      const enText = sanitizeSpeechText(textEnOverride || chunk.english);
      const viText = sanitizeSpeechText(textViOverride || chunk.vietnamese || '');

      const effectiveVoiceEn = voiceEnOverride || chunkVoiceEn[chunk.chunk_id] || voiceProfileEn;
      const effectiveVoiceVi = voiceViOverride || chunkVoiceVi[chunk.chunk_id] || voiceProfileVi;
      const effectiveProvider: AudioProvider = (effectiveVoiceEn.startsWith('aura-') || effectiveVoiceEn.startsWith('flux-')) ? 'DEEPGRAM_AURA' : 'GOOGLE_TTS';

      if ((targetLang !== 'vi' && !englishModels.some(m => m.id === effectiveVoiceEn)) || (targetLang !== 'en' && !vietnameseModels.some(m => m.id === effectiveVoiceVi))) throw new Error('Enable the selected model for Focus in Settings.');
      const updatedChunk = { ...chunk };
      let cloudFailed = false;
      const effectiveLesson = inspectingLesson || lessons.find(l => l.chunks?.some(c => c.chunk_id === chunk.chunk_id)) || lessons[0];
      const effectiveLessonId = effectiveLesson?.id || '';

      if (targetLang === 'en' || targetLang === 'both') {
        if (enText) {
          const synthRes = await audioPlayer.synthesizeSingleChunk({
            text: enText,
            language: 'en',
            voiceName: effectiveVoiceEn,
            provider: effectiveProvider,
            forceRegenerate: true
          });
          if (!synthRes?.base64) throw new Error('EN synthesis returned no audio.');
          if (synthRes?.base64) {
            try {
              const gcsUrl = await uploadBase64AudioToGcs({
                base64Audio: synthRes.base64,
                levelCode: selectedCourseLevel,
                lessonId: effectiveLessonId,
                chunkId: chunk.chunk_id,
                lang: 'en'
              });
              updatedChunk.audio_url = gcsUrl;
            } catch (uploadErr) {
              cloudFailed = true;
              console.warn(`[Regenerate] Upload EN to GCS failed for chunk ${chunk.chunk_id}:`, uploadErr);
            }
          }
        }
      }

      if (targetLang === 'vi' || targetLang === 'both') {
        if (viText) {
          const synthResVi = await audioPlayer.synthesizeSingleChunk({
            text: viText,
            language: 'vi',
            voiceName: effectiveVoiceVi,
            provider: 'GOOGLE_TTS',
            forceRegenerate: true
          });
          if (!synthResVi?.base64) throw new Error('VI synthesis returned no audio.');
          if (synthResVi?.base64) {
            try {
              const gcsUrlVi = await uploadBase64AudioToGcs({
                base64Audio: synthResVi.base64,
                levelCode: selectedCourseLevel,
                lessonId: effectiveLessonId,
                chunkId: chunk.chunk_id,
                lang: 'vi'
              });
              updatedChunk.audio_url_vi = gcsUrlVi;
            } catch (uploadErr) {
              cloudFailed = true;
              console.warn(`[Regenerate] Upload VI to GCS failed for chunk ${chunk.chunk_id}:`, uploadErr);
            }
          }
        }
      }

      // Persist to Firestore via addOrUpdateChunk
      if (effectiveLessonId) {
        const updatedLesson = await addOrUpdateChunk(effectiveLessonId, updatedChunk);
        if (updatedLesson) {
          if (inspectingLesson && inspectingLesson.id === effectiveLessonId) {
            setInspectingLesson(updatedLesson);
          }
          setLessons(prev => prev.map(l => l.id === updatedLesson.id ? updatedLesson : l));
        }
      }

      if (cloudFailed) { addLog('Audio saved in this browser; Cloud upload failed. Retry Cloud sync before switching devices.', 'warning'); calculateReadinessStatus(); return; }
      const langLabel = targetLang === 'en' ? 'Tiếng Anh (EN)' : targetLang === 'vi' ? 'Tiếng Việt (VI)' : 'Cả 2 (EN + VI)';
      addLog(`Tạo lại audio (${langLabel}) thành công cho chunk #${chunk.item_number}: "${enText.slice(0, 24)}..."`, 'success');
      calculateReadinessStatus();
    } catch (err: any) {
      addLog(`Lỗi tạo audio cho chunk #${chunk.item_number}: ${err?.message || String(err)}`, 'error');
    } finally {
      setRegeneratingChunkId(null);
      setRegeneratingTarget(null);
    }
  };

  const handleRegenerateSingleChunk = handleRegenerateChunkAudio;

  // Quick save edited text handler with optional immediate audio synthesis
  const handleSaveChunkText = async (
    chunk: ChunkItem, 
    alsoGenerateAudio?: 'en' | 'vi' | 'both'
  ) => {
    if (!inspectingLesson) return;
    setIsSavingChunk(true);
    try {
      const updatedChunk: ChunkItem = {
        ...chunk,
        english: editEnText.trim() || chunk.english,
        vietnamese: editViText.trim() || chunk.vietnamese
      };

      const updatedLesson = await addOrUpdateChunk(inspectingLesson.id, updatedChunk);
      if (updatedLesson) {
        setInspectingLesson(updatedLesson);
        setLessons(prev => prev.map(l => l.id === updatedLesson.id ? updatedLesson : l));
        addLog(`Đã cập nhật nội dung văn bản cho chunk #${chunk.item_number}`, 'success');
      }

      setEditingChunkId(null);

      // Optionally synthesize audio immediately with the updated text
      if (alsoGenerateAudio) {
        await handleRegenerateChunkAudio(
          updatedChunk, 
          alsoGenerateAudio, 
          updatedChunk.english, 
          updatedChunk.vietnamese
        );
      }
    } catch (err: any) {
      addLog(`Lỗi khi lưu chunk #${chunk.item_number}: ${err?.message || String(err)}`, 'error');
    } finally {
      setIsSavingChunk(false);
      calculateReadinessStatus();
    }
  };

  // Reset / Clear Audio URLs from chunks of a lesson (set audio_url and audio_url_vi to null)
  const handleResetAudioUrls = async (targetLessonId?: string) => {
    const lessonIdToReset = targetLessonId || (batchScope === 'current_lesson' ? batchTargetLessonId : inspectingLesson?.id) || inspectingLesson?.id;
    const lesson = lessons.find(l => l.id === lessonIdToReset) || inspectingLesson;
    if (!lesson || !lesson.chunks || lesson.chunks.length === 0) {
      alert('Không tìm thấy bài học hoặc bài học không có chunks nào để xóa link audio.');
      return;
    }

    const confirmMsg = `Bạn có chắc chắn muốn xóa toàn bộ link audio Cloud Storage cũ của bài học "Day ${lesson.day_number}: ${lesson.lesson_title}" không?\n\nToàn bộ liên kết audio_url và audio_url_vi sẽ được đặt lại về null và cập nhật lên Firestore để bạn tạo lại từ đầu.`;
    if (!window.confirm(confirmMsg)) return;

    setIsResettingAudio(true);
    try {
      const updatedChunks = lesson.chunks.map(c => ({
        ...c,
        audio_url: null,
        audio_url_vi: null
      }));

      await updateLessonChunks(lesson.id, updatedChunks);
      const updatedLesson: LessonDoc = { ...lesson, chunks: updatedChunks };

      if (inspectingLesson?.id === lesson.id) {
        setInspectingLesson(updatedLesson);
      }
      setLessons(prev => prev.map(l => l.id === lesson.id ? updatedLesson : l));
      calculateReadinessStatus();
      addLog(`Đã xóa toàn bộ link audio cũ của Day ${lesson.day_number}. Dữ liệu đã lưu lên Firestore.`, 'success');
      alert(`Đã xóa toàn bộ link audio cũ của Day ${lesson.day_number}! Bạn có thể bắt đầu tạo mới.`);
    } catch (err: any) {
      console.error('Reset audio links error:', err);
      addLog(`Lỗi khi xóa link audio: ${err?.message || err}`, 'error');
      alert(`Lỗi khi xóa link audio: ${err?.message || err}`);
    } finally {
      setIsResettingAudio(false);
    }
  };

  // Start Batch Generation Engine with Granular Staging & Tracking
  const handleStartBatchGeneration = async (
    overrideScope?: 'current_lesson' | 'entire_course',
    overrideLessonId?: string,
    modeOverride?: BatchPreparationMode,
    targetChunkIds?: string[],
    targetOverride?: AudioBatchTarget,
    forceOverwriteOverride?: boolean
  ) => {
    if (isBatchRunning) return;

    const effectiveScope: 'current_lesson' | 'entire_course' = 
      (overrideScope === 'current_lesson' || overrideScope === 'entire_course') 
        ? overrideScope 
        : batchScope;

    const effectiveLessonId: string = 
      (typeof overrideLessonId === 'string' && overrideLessonId) 
        ? overrideLessonId 
        : (batchTargetLessonId || lessons[0]?.id || '');

    const effectiveTarget: AudioBatchTarget = targetOverride || batchTarget;
    const effectiveForceOverwrite: boolean = forceOverwriteOverride !== undefined ? forceOverwriteOverride : (forceOverwrite || modeOverride === 'full' || (!modeOverride && batchMode === 'full'));
    const effectiveMode: BatchPreparationMode = modeOverride || (effectiveForceOverwrite ? 'full' : batchMode);

    cancelBatchRef.current = false;
    setIsBatchRunning(true);

    interface BatchItem {
      chunk: ChunkItem;
      lesson: LessonDoc;
    }

    let candidateItems: BatchItem[] = [];
    let scopeDesc = '';

    if (effectiveScope === 'current_lesson') {
      const lesson = lessons.find(l => l.id === effectiveLessonId || String(l.day_number) === String(effectiveLessonId)) || lessons[0];
      if (!lesson || !lesson.chunks || lesson.chunks.length === 0) {
        addLog('Không tìm thấy chunk nào trong bài học được chọn.', 'error');
        setIsBatchRunning(false);
        return;
      }
      candidateItems = lesson.chunks.map(chunk => ({ chunk, lesson }));
      scopeDesc = `Day ${lesson.day_number} (${lesson.lesson_title}) - ${candidateItems.length} chunks`;
    } else {
      candidateItems = lessons.flatMap(lesson => (lesson.chunks || []).map(chunk => ({ chunk, lesson })));
      scopeDesc = `Toàn bộ ${selectedCourseLevel} (${lessons.length} bài học) - ${candidateItems.length} chunks`;
    }

    const invalidModel = candidateItems.some(({ chunk }) =>
      (effectiveTarget !== 'VIETNAMESE' && !englishModels.some(m => m.id === (chunkVoiceEn[chunk.chunk_id] || voiceProfileEn))) ||
      (effectiveTarget !== 'ENGLISH' && !!chunk.vietnamese && !vietnameseModels.some(m => m.id === (chunkVoiceVi[chunk.chunk_id] || voiceProfileVi)))
    );
    if (invalidModel) {
      addLog('Enable the selected EN/VI models for Focus in Settings before preparing audio.', 'error');
      setIsBatchRunning(false);
      return;
    }
    // Hydrate the selected voice cache before deciding which sentences are missing.
    await Promise.all(candidateItems.map(async ({ chunk }) => {
      await audioPlayer.getCachedAudioAsync(chunk.english, chunkVoiceEn[chunk.chunk_id] || voiceProfileEn);
      if (chunk.vietnamese) await audioPlayer.getCachedAudioAsync(chunk.vietnamese, chunkVoiceVi[chunk.chunk_id] || voiceProfileVi);
    }));
    let targetItems: BatchItem[] = [];
    let initialSkippedCount = 0;

    // Filter candidate items based on effectiveMode
    if (effectiveMode === 'failed_only') {
      const retryIds = new Set(
        targetChunkIds && targetChunkIds.length > 0 
          ? targetChunkIds 
          : failedChunks.map(f => f.chunkId)
      );
      targetItems = candidateItems.filter(item => retryIds.has(item.chunk.chunk_id));
      if (targetItems.length === 0) {
        addLog('Không tìm thấy câu nào trong danh sách lỗi cần thử lại cho phạm vi này.', 'warning');
        setIsBatchRunning(false);
        return;
      }
      scopeDesc = `[Thử Lại Lỗi] ${targetItems.length} câu - ${scopeDesc}`;
    } else if (effectiveMode === 'missing_only') {
      const shouldCheckEn = effectiveTarget === 'ENGLISH' || effectiveTarget === 'BOTH';
      const shouldCheckVi = effectiveTarget === 'VIETNAMESE' || effectiveTarget === 'BOTH';

      targetItems = candidateItems.filter(item => {
        const c = item.chunk;
        const targetVoiceEn = chunkVoiceEn[c.chunk_id] || voiceProfileEn;
        const targetVoiceVi = chunkVoiceVi[c.chunk_id] || voiceProfileVi;
        const hasGcsEn = Boolean(c.audio_url && c.audio_url.startsWith('http') && !c.audio_url.includes('placeholder'));
        const isCachedEn = audioPlayer.hasCachedAudio(c.english, targetVoiceEn);
        const needsEn = shouldCheckEn && !isCachedEn;

        const hasGcsVi = Boolean(c.audio_url_vi && c.audio_url_vi.startsWith('http'));
        const isCachedVi = c.vietnamese ? audioPlayer.hasCachedAudio(c.vietnamese, targetVoiceVi) : true;
        const needsVi = shouldCheckVi && Boolean(c.vietnamese) && !isCachedVi;

        return needsEn || needsVi;
      });

      initialSkippedCount = candidateItems.length - targetItems.length;

      if (targetItems.length === 0) {
        addLog(`✓ Toàn bộ ${candidateItems.length} audio trong phạm vi đã có sẵn! Không có câu nào bị thiếu.`, 'success');
        setIsBatchRunning(false);
        setBatchProgress(prev => ({
          ...prev,
          stage: 'completed',
          percentage: 100,
          currentTask: 'Toàn bộ audio đã đầy đủ (0 câu thiếu)'
        }));
        return;
      }
      scopeDesc = `[Chỉ Câu Thiếu] ${targetItems.length} câu (bỏ qua ${initialSkippedCount} câu đã có) - ${scopeDesc}`;
    } else {
      // 'full'
      targetItems = candidateItems;
    }

    const multiplier = effectiveTarget === 'BOTH' ? 2 : 1;
    const totalOperations = targetItems.length * multiplier;

    // Stage 1: Preparing
    setBatchProgress({
      stage: 'preparing',
      current: 0,
      total: totalOperations,
      percentage: 0,
      currentTask: `Khởi tạo hàng đợi cho ${scopeDesc}...`,
      successCount: 0,
      failCount: 0,
      cloudSyncedCount: 0,
      skippedCount: initialSkippedCount
    });

    addLog(`Bắt đầu chạy Batch Generator: ${scopeDesc} | Chế độ: ${effectiveMode} | Auto Cloud Sync: ${autoSyncToCloud ? 'BẬT' : 'TẮT'} | Workers: ${batchWorkersCount}`, 'info');

    let processedCount = 0;
    let successCount = 0;
    let failCount = 0;
    let cloudSyncedCount = 0;
    let skippedCount = initialSkippedCount;
    let cursor = 0;

    const succeededChunkIds = new Set<string>();
    const newlyFailedMap = new Map<string, FailedAudioChunkInfo>();
    const modifiedLessonsMap = new Map<string, LessonDoc>();

    const worker = async (workerId: number) => {
      while (cursor < targetItems.length) {
        if (cancelBatchRef.current) break;

        const index = cursor++;
        const { chunk, lesson: chunkLesson } = targetItems[index];
        const cleanEn = sanitizeSpeechText(chunk.english);
        const cleanVi = chunk.vietnamese ? sanitizeSpeechText(chunk.vietnamese) : '';

        // --- 1. Synthesize English ---
        if (effectiveTarget === 'ENGLISH' || effectiveTarget === 'BOTH') {
          if (cancelBatchRef.current) break;

          const targetVoiceEn = chunkVoiceEn[chunk.chunk_id] || voiceProfileEn;
          const hasGcsEn = Boolean(chunk.audio_url && chunk.audio_url.startsWith('http') && !chunk.audio_url.includes('placeholder'));
          const isCachedEn = audioPlayer.hasCachedAudio(cleanEn, targetVoiceEn);

          // Reuse only the selected model cache in missing-only mode
          if (!effectiveForceOverwrite && (effectiveMode === 'missing_only' && isCachedEn)) {
            skippedCount++;
            processedCount++;
            addLog(`[Worker ${workerId}] Bỏ qua EN #${chunk.item_number} do đã có audio GCS cũ. (Bật 'Ghi đè' để đổi model sang ${targetVoiceEn})`, 'info');
          } else {
            setBatchProgress(prev => ({
              ...prev,
              stage: 'synthesizing',
              currentTask: `Worker ${workerId} -> Tạo TTS EN: "${cleanEn.slice(0, 20)}..." [${targetVoiceEn}]`
            }));

            try {
              const synthRes = await audioPlayer.synthesizeSingleChunk({
                text: cleanEn,
                language: 'en',
                voiceName: targetVoiceEn,
                provider: activeProvider,
                forceRegenerate: effectiveForceOverwrite
              });

              if (!synthRes?.base64) {
                throw new Error('Dữ liệu âm thanh trả về rỗng từ nhà cung cấp TTS');
              }

              // English TTS Succeeded
              if (autoSyncToCloud) {
                setBatchProgress(prev => ({
                  ...prev,
                  stage: 'uploading_cloud',
                  currentTask: `Worker ${workerId} -> Tải lên Cloud GCS: #${chunk.item_number} [${targetVoiceEn}]`
                }));

                try {
                  const gcsUrl = await uploadBase64AudioToGcs({
                    base64Audio: synthRes.base64,
                    levelCode: selectedCourseLevel,
                    lessonId: chunkLesson?.id || effectiveLessonId,
                    chunkId: chunk.chunk_id,
                    lang: 'en'
                  });
                  chunk.audio_url = gcsUrl;
                  cloudSyncedCount++;
                  successCount++;
                  succeededChunkIds.add(chunk.chunk_id);
                  modifiedLessonsMap.set(chunkLesson.id, chunkLesson);
                  addLog(`[Worker ${workerId}] [Cloud Sync] Tải lên GCS EN #${chunk.item_number} [${targetVoiceEn}] thành công`, 'cloud');
                } catch (uploadErr: any) {
                  failCount++;
                  const errMsg = uploadErr?.message || String(uploadErr);
                  addLog(`[Worker ${workerId}] [Upload Lỗi] Không thể tải EN lên GCS cho #${chunk.item_number}: ${errMsg}`, 'error');
                  newlyFailedMap.set(`${chunk.chunk_id}_en`, {
                    chunkId: chunk.chunk_id,
                    itemNumber: chunk.item_number,
                    lessonId: chunkLesson.id,
                    dayNumber: chunkLesson.day_number,
                    lessonTitle: chunkLesson.lesson_title,
                    textEn: chunk.english,
                    textVi: chunk.vietnamese,
                    lang: 'en',
                    error: errMsg,
                    stage: 'cloud_upload',
                    timestamp: new Date().toLocaleTimeString('vi-VN'),
                    retryCount: 1
                  });
                }
              } else {
                successCount++;
                succeededChunkIds.add(chunk.chunk_id);
                addLog(`[Worker ${workerId}] Tạo TTS EN #${chunk.item_number} [${targetVoiceEn}] (${activeProvider}) thành công`, 'success');
              }
            } catch (e: any) {
              failCount++;
              const errMsg = e?.message || 'Lỗi tạo TTS';
              addLog(`[Worker ${workerId}] Lỗi TTS EN #${chunk.item_number} [${targetVoiceEn}]: ${errMsg}`, 'error');
              newlyFailedMap.set(`${chunk.chunk_id}_en`, {
                chunkId: chunk.chunk_id,
                itemNumber: chunk.item_number,
                lessonId: chunkLesson.id,
                dayNumber: chunkLesson.day_number,
                lessonTitle: chunkLesson.lesson_title,
                textEn: chunk.english,
                textVi: chunk.vietnamese,
                lang: 'en',
                error: errMsg,
                stage: 'tts_synthesis',
                timestamp: new Date().toLocaleTimeString('vi-VN'),
                retryCount: 1
              });
            }
            processedCount++;
          }

          const percent = Math.round((processedCount / totalOperations) * 100);
          setBatchProgress(prev => ({
            ...prev,
            current: processedCount,
            percentage: Math.min(100, percent),
            successCount,
            failCount,
            cloudSyncedCount,
            skippedCount
          }));
        }

        // --- 2. Synthesize Vietnamese ---
        if ((effectiveTarget === 'VIETNAMESE' || effectiveTarget === 'BOTH') && cleanVi) {
          if (cancelBatchRef.current) break;

          const targetVoiceVi = chunkVoiceVi[chunk.chunk_id] || voiceProfileVi;
          const hasGcsVi = Boolean(chunk.audio_url_vi && chunk.audio_url_vi.startsWith('http'));
          const isCachedVi = audioPlayer.hasCachedAudio(cleanVi, targetVoiceVi);

          if (!effectiveForceOverwrite && (effectiveMode === 'missing_only' && isCachedVi)) {
            skippedCount++;
            processedCount++;
            addLog(`[Worker ${workerId}] Bỏ qua VI #${chunk.item_number} do đã có audio GCS cũ. (Bật 'Ghi đè' để đổi model sang ${targetVoiceVi})`, 'info');
          } else {
            setBatchProgress(prev => ({
              ...prev,
              stage: 'synthesizing',
              currentTask: `Worker ${workerId} -> Tạo TTS VI: "${cleanVi.slice(0, 20)}..." [${targetVoiceVi}]`
            }));

            try {
              const synthResVi = await audioPlayer.synthesizeSingleChunk({
                text: cleanVi,
                language: 'vi',
                voiceName: targetVoiceVi,
                provider: 'GOOGLE_TTS',
                forceRegenerate: effectiveForceOverwrite
              });

              if (!synthResVi?.base64) {
                throw new Error('Dữ liệu âm thanh VI rỗng từ Google Cloud TTS');
              }

              if (autoSyncToCloud) {
                setBatchProgress(prev => ({
                  ...prev,
                  stage: 'uploading_cloud',
                  currentTask: `Worker ${workerId} -> Tải lên Cloud GCS VI: #${chunk.item_number} [${targetVoiceVi}]`
                }));

                try {
                  const gcsUrlVi = await uploadBase64AudioToGcs({
                    base64Audio: synthResVi.base64,
                    levelCode: selectedCourseLevel,
                    lessonId: chunkLesson?.id || effectiveLessonId,
                    chunkId: chunk.chunk_id,
                    lang: 'vi'
                  });
                  chunk.audio_url_vi = gcsUrlVi;
                  cloudSyncedCount++;
                  successCount++;
                  succeededChunkIds.add(chunk.chunk_id);
                  modifiedLessonsMap.set(chunkLesson.id, chunkLesson);
                  addLog(`[Worker ${workerId}] [Cloud Sync] Tải lên GCS VI #${chunk.item_number} [${targetVoiceVi}] thành công`, 'cloud');
                } catch (uploadErr: any) {
                  failCount++;
                  const errMsg = uploadErr?.message || String(uploadErr);
                  addLog(`[Worker ${workerId}] [Upload Lỗi] Không thể tải VI lên GCS cho #${chunk.item_number}: ${errMsg}`, 'error');
                  newlyFailedMap.set(`${chunk.chunk_id}_vi`, {
                    chunkId: chunk.chunk_id,
                    itemNumber: chunk.item_number,
                    lessonId: chunkLesson.id,
                    dayNumber: chunkLesson.day_number,
                    lessonTitle: chunkLesson.lesson_title,
                    textEn: chunk.english,
                    textVi: chunk.vietnamese,
                    lang: 'vi',
                    error: errMsg,
                    stage: 'cloud_upload',
                    timestamp: new Date().toLocaleTimeString('vi-VN'),
                    retryCount: 1
                  });
                }
              } else {
                successCount++;
                succeededChunkIds.add(chunk.chunk_id);
                addLog(`[Worker ${workerId}] Tạo TTS VI #${chunk.item_number} [${targetVoiceVi}] thành công`, 'success');
              }
            } catch (e: any) {
              failCount++;
              const errMsg = e?.message || 'Lỗi tạo TTS VI';
              addLog(`[Worker ${workerId}] Lỗi TTS VI #${chunk.item_number} [${targetVoiceVi}]: ${errMsg}`, 'error');
              newlyFailedMap.set(`${chunk.chunk_id}_vi`, {
                chunkId: chunk.chunk_id,
                itemNumber: chunk.item_number,
                lessonId: chunkLesson.id,
                dayNumber: chunkLesson.day_number,
                lessonTitle: chunkLesson.lesson_title,
                textEn: chunk.english,
                textVi: chunk.vietnamese,
                lang: 'vi',
                error: errMsg,
                stage: 'tts_synthesis',
                timestamp: new Date().toLocaleTimeString('vi-VN'),
                retryCount: 1
              });
            }
            processedCount++;
          }

          const percent = Math.round((processedCount / totalOperations) * 100);
          setBatchProgress(prev => ({
            ...prev,
            current: processedCount,
            percentage: Math.min(100, percent),
            successCount,
            failCount,
            cloudSyncedCount,
            skippedCount
          }));
        }

        // Periodic UI update
        if (index % 4 === 0 || cursor >= targetItems.length) {
          calculateReadinessStatus();
        }
      }
    };

    try {
      const workers = Array.from(
        { length: Math.min(batchWorkersCount, targetItems.length) },
        (_, i) => worker(i + 1)
      );
      await Promise.all(workers);

      // --- Stage 3: Firestore Persistence ---
      if (modifiedLessonsMap.size > 0) {
        setBatchProgress(prev => ({
          ...prev,
          stage: 'saving_firestore',
          currentTask: `Đang lưu ${modifiedLessonsMap.size} bài học vào cơ sở dữ liệu Firestore...`
        }));
        addLog(`Đang cập nhật link audio mới cho ${modifiedLessonsMap.size} bài học lên Firestore...`, 'info');

        for (const lesson of modifiedLessonsMap.values()) {
          try {
            await updateLessonChunks(lesson.id, lesson.chunks);
            addLog(`Đã lưu link audio mới cho Day ${lesson.day_number} (${lesson.lesson_title}) vào Firestore`, 'success');
          } catch (saveErr: any) {
            const errMsg = saveErr?.message || String(saveErr);
            addLog(`[Lỗi Firestore] Không thể lưu Day ${lesson.day_number}: ${errMsg}`, 'error');
            for (const chk of lesson.chunks) {
              if (succeededChunkIds.has(chk.chunk_id)) {
                newlyFailedMap.set(`${chk.chunk_id}_firestore`, {
                  chunkId: chk.chunk_id,
                  itemNumber: chk.item_number,
                  lessonId: lesson.id,
                  dayNumber: lesson.day_number,
                  lessonTitle: lesson.lesson_title,
                  textEn: chk.english,
                  textVi: chk.vietnamese,
                  lang: 'both',
                  error: `Lỗi lưu Firestore: ${errMsg}`,
                  stage: 'firestore_save',
                  timestamp: new Date().toLocaleTimeString('vi-VN'),
                  retryCount: 1
                });
              }
            }
          }
        }
      }

      // --- Stage 4: Post-Batch Auto-Sync Verification ---
      if (autoSyncToCloud && modifiedLessonsMap.size > 0 && !cancelBatchRef.current) {
        addLog('Đang hoàn tất kiểm tra trạng thái Cloud Storage bucket...', 'info');
      }

      await loadLessons();
      calculateReadinessStatus();

      // --- Stage 5: Update Failed Chunks Queue & Final Status ---
      setFailedChunks(prev => {
        // Remove items that succeeded
        const remaining = prev.filter(f => !succeededChunkIds.has(f.chunkId));
        const updated = [...remaining];
        newlyFailedMap.forEach(newItem => {
          const existingIdx = updated.findIndex(u => u.chunkId === newItem.chunkId && u.lang === newItem.lang);
          if (existingIdx >= 0) {
            updated[existingIdx] = {
              ...newItem,
              retryCount: (updated[existingIdx].retryCount || 1) + 1
            };
          } else {
            updated.push(newItem);
          }
        });
        return updated;
      });

      if (cancelBatchRef.current) {
        addLog(`Đã dừng Batch Generator theo yêu cầu. (Đã xử lý: ${processedCount}/${totalOperations})`, 'warning');
      } else {
        const statusType = failCount > 0 ? 'warning' : 'success';
        addLog(`🎉 Hoàn tất Batch Audio cho ${scopeDesc}! Thành công: ${successCount}, Tải lên Cloud: ${cloudSyncedCount}, Lỗi: ${failCount}, Bỏ qua/Có sẵn: ${skippedCount}`, statusType);
      }
    } catch (err: any) {
      addLog(`Lỗi quy trình batch: ${err?.message || String(err)}`, 'error');
    } finally {
      setIsBatchRunning(false);
      calculateReadinessStatus();
      setBatchProgress(prev => ({
        ...prev,
        stage: cancelBatchRef.current ? 'cancelled' : 'completed',
        percentage: 100,
        currentTask: cancelBatchRef.current ? 'Đã dừng quy trình theo yêu cầu' : 'Hoàn tất quy trình xử lý batch'
      }));
    }
  };

  const handlePrepareAllLessons = (mode: BatchPreparationMode = 'missing_only') => {
    setBatchScope('entire_course');
    return handleStartBatchGeneration('entire_course', undefined, mode);
  };

  const handleStopBatchGeneration = () => {
    cancelBatchRef.current = true;
    addLog('Đang gửi lệnh dừng đến các luồng worker...', 'warning');
  };

  // Retry All Failed Chunks Action
  const handleRetryAllFailedChunks = () => {
    if (failedChunks.length === 0 || isBatchRunning) return;
    handleStartBatchGeneration(undefined, undefined, 'failed_only');
  };

  // Retry Single Failed Chunk Action
  const handleRetrySingleFailedChunk = (failedItem: FailedAudioChunkInfo) => {
    if (isBatchRunning) return;
    handleStartBatchGeneration(undefined, undefined, 'failed_only', [failedItem.chunkId]);
  };

  // Sync IndexedDB Local Cached Audio to GCS Bucket & Firestore
  const handleSyncCacheToCloud = async () => {
    if (isSyncingToCloud || isBatchRunning) return;
    if (!lessons || lessons.length === 0) {
      addLog('Không có bài học nào để đồng bộ.', 'warning');
      return;
    }

    setIsSyncingToCloud(true);
    setSyncCloudProgress('Bắt đầu đồng bộ cache lên Cloud Storage...');
    addLog('Bắt đầu đồng bộ toàn bộ cache trình duyệt lên Cloud Storage (gs://chunks-voicecloning-genshai.firebasestorage.app)...', 'info');

    let totalSynced = 0;
    let totalSyncedEn = 0;
    let totalSyncedVi = 0;

    try {
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        setSyncCloudProgress(`Đang sync Day ${lesson.day_number} (${i + 1}/${lessons.length})...`);
        const result = await syncLessonCachedAudioToCloud(lesson, {
          voiceEn: voiceProfileEn,
          voiceVi: voiceProfileVi,
          target: batchTarget,
          forceOverwrite: forceOverwrite,
          onProgress: (current, total, status) => {
            setSyncCloudProgress(`Day ${lesson.day_number} [${current}/${total}]: ${status}`);
          }
        });
        totalSyncedEn += result.uploadedEn;
        totalSyncedVi += result.uploadedVi;
        totalSynced += (result.uploadedEn + result.uploadedVi);
      }

      await loadLessons();
      calculateReadinessStatus();
      addLog(`Đồng bộ thành công ${totalSynced} audio chunks lên Cloud Storage bucket gs://chunks-voicecloning-genshai.firebasestorage.app!`, 'success');
    } catch (err: any) {
      addLog(`Lỗi đồng bộ cache lên Cloud Storage: ${err?.message || String(err)}`, 'error');
    } finally {
      setIsSyncingToCloud(false);
      setSyncCloudProgress(null);
    }
  };

  // --------------------------------------------------------------------------
  // Summary Metrics Computation
  // --------------------------------------------------------------------------
  const statusMap = useMemo(() => new Map<string, LessonAudioStatus>(statusList.map(s => [s.lessonId, s])), [statusList]);

  const totalChunksInLevel = useMemo(() => {
    if (statusList.length > 0) return statusList.reduce((sum, s) => sum + s.totalChunks, 0);
    return lessons.reduce((sum, l) => sum + (l.chunks?.length || 0), 0);
  }, [statusList, lessons]);

  const totalEnCached = useMemo(() => {
    if (statusList.length > 0) return statusList.reduce((sum, s) => sum + s.enCached, 0);
    return lessons.reduce((sum, l) => {
      const gcs = (l.chunks || []).filter(c => Boolean(c.audio_url && c.audio_url.startsWith('http') && !c.audio_url.includes('placeholder'))).length;
      return sum + gcs;
    }, 0);
  }, [statusList, lessons]);

  const totalViCached = useMemo(() => {
    if (statusList.length > 0) return statusList.reduce((sum, s) => sum + s.viCached, 0);
    return 0;
  }, [statusList]);

  const totalGcsMaster = useMemo(() => {
    if (statusList.length > 0) return statusList.reduce((sum, s) => sum + s.gcsCount, 0);
    return lessons.reduce((sum, l) => {
      const gcs = (l.chunks || []).filter(c => Boolean(c.audio_url && c.audio_url.startsWith('http') && !c.audio_url.includes('placeholder'))).length;
      return sum + gcs;
    }, 0);
  }, [statusList, lessons]);

  const overallEnPercent = totalChunksInLevel > 0 ? Math.round((totalEnCached / totalChunksInLevel) * 100) : 0;
  const overallViPercent = totalChunksInLevel > 0 ? Math.round((totalViCached / totalChunksInLevel) * 100) : 0;
  const overallGcsPercent = totalChunksInLevel > 0 ? Math.round((totalGcsMaster / totalChunksInLevel) * 100) : 0;

  // Filter lessons in table
  const filteredLessons = useMemo(() => {
    return lessons.filter(l => {
      const matchesSearch = 
        searchFilter === '' ||
        (l.lesson_title || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
        `day ${l.day_number}`.includes(searchFilter.toLowerCase()) ||
        l.id.toLowerCase().includes(searchFilter.toLowerCase());

      if (!matchesSearch) return false;

      const st = statusMap.get(l.id);
      if (!st) return true;

      if (statusFilter === 'ready') return st.isFullyCached;
      if (statusFilter === 'missing') return !st.isFullyCached;
      if (statusFilter === 'has_gcs') return st.gcsCount > 0;
      return true;
    });
  }, [lessons, statusMap, searchFilter, statusFilter]);

  // Filter chunks in inspector
  const filteredChunks = (inspectingLesson?.chunks || []).filter(c => {
    const matchesQuery = 
      chunkSearch === '' ||
      c.english.toLowerCase().includes(chunkSearch.toLowerCase()) ||
      c.vietnamese.toLowerCase().includes(chunkSearch.toLowerCase()) ||
      String(c.item_number).includes(chunkSearch);

    if (!matchesQuery) return false;

    if (selectedCategoryFilter === 'all') return true;
    return c.category === selectedCategoryFilter;
  });

  const uniqueCategories = Array.from(
    new Set((inspectingLesson?.chunks || []).map(c => c.category || 'vocab'))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans animate-fade-in text-zinc-900">
      {(!englishModels.some(m => m.id === voiceProfileEn) || !vietnameseModels.some(m => m.id === voiceProfileVi)) && (
        <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Selected model unavailable. Enable it for Focus in Settings or choose an allowed EN/VI model below.</p>
      )}
      {/* ------------------------------------------------------------------ */}
      {/* 1. Header & Live Engine Status                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2 rounded-xl bg-[#DC2626]/10 text-[#DC2626]">
              <Headphones className="w-5 h-5" />
            </span>
            <h1 className="font-display font-bold text-2xl text-zinc-900 tracking-tight">
              Quản Lý Âm Thanh Toàn Diện (Audio Management)
            </h1>
          </div>
          <p className="text-xs text-zinc-500 max-w-3xl leading-relaxed">
            Kiểm soát chất lượng phát âm song ngữ, giám sát tỷ lệ sẵn sàng bộ nhớ đệm (0ms Latency), 
            nghe thử từng câu phản xạ và thực thi công cụ tạo lại âm thanh hàng loạt (Batch Synthesis Engine).
          </p>
        </div>

        {/* Engine Status Badge & Diagnostics */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active Audio Provider Toggle */}
          <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200 shadow-2xs">
            <button
              onClick={() => handleSwitchProvider('DEEPGRAM_AURA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                activeProvider === 'DEEPGRAM_AURA'
                  ? 'bg-white text-[#DC2626] shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Deepgram Aura (0ms)</span>
            </button>
            <button
              onClick={() => handleSwitchProvider('GOOGLE_TTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                activeProvider === 'GOOGLE_TTS'
                  ? 'bg-white text-[#DC2626] shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              <span>Google Cloud AI</span>
            </button>
          </div>

          {/* Diagnostic Modal Trigger */}
          <button
            onClick={() => setIsDiagnosticOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-mono font-bold text-zinc-800 transition-all cursor-pointer shadow-xs"
            title="Mở Bảng Chẩn Đoán Âm Thanh"
          >
            <Activity className="w-3.5 h-3.5 text-[#DC2626] animate-pulse" />
            <span>Nguồn: {activeSource}</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Course Level Navigation Tabs                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 overflow-x-auto">
        {(courses.length > 0 ? courses : [
          { id: 'course_level_b_eres', level_code: 'LEVEL_B_ERES', title: 'Level B - ERES Speaking' },
          { id: 'course_level_b_erel', level_code: 'LEVEL_B_EREL', title: 'Level B - EREL Listening' },
          { id: 'course_level_a', level_code: 'LEVEL_A', title: 'Level A - Foundation Chunks' }
        ]).map((c) => {
          const isSelected = selectedCourseLevel === c.level_code;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCourseLevel(c.level_code as CourseLevel)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                isSelected
                  ? 'bg-[#DC2626] text-white shadow-xs font-extrabold'
                  : 'bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200/80 hover:border-zinc-300'
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-zinc-400'}`} />
              <span>{c.title}</span>
              {isSelected && (
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">
                  Active
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Readiness Matrix Overview & Summary Metrics                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Chunks */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">
              Tổng Số Chunks
            </span>
            <span className="p-2 rounded-xl bg-zinc-100 text-zinc-700">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-zinc-900 tracking-tight">
              {totalChunksInLevel.toLocaleString()}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
              <span>{lessons.length} Buổi học trong khóa</span>
            </div>
          </div>
        </div>

        {/* Metric 2: EN Audio Ready % */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">
              EN Audio Sẵn Sàng (0ms)
            </span>
            <span className={`p-2 rounded-xl ${overallEnPercent >= 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-zinc-900">
                {overallEnPercent}%
              </span>
              <span className="text-xs font-mono text-zinc-500">
                ({totalEnCached}/{totalChunksInLevel})
              </span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${overallEnPercent >= 90 ? 'bg-emerald-600' : 'bg-amber-500'}`}
                style={{ width: `${overallEnPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 3: VI Audio Ready % */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">
              VI Audio Sẵn Sàng (0ms)
            </span>
            <span className={`p-2 rounded-xl ${overallViPercent >= 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-zinc-900">
                {overallViPercent}%
              </span>
              <span className="text-xs font-mono text-zinc-500">
                ({totalViCached}/{totalChunksInLevel})
              </span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${overallViPercent >= 90 ? 'bg-emerald-600' : 'bg-amber-500'}`}
                style={{ width: `${overallViPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 4: GCS Master Audio Count */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">
              GCS Master CDN
            </span>
            <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <FileAudio className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-zinc-900">
                {totalGcsMaster}
              </span>
              <span className="text-xs font-mono text-zinc-500">
                ({overallGcsPercent}%)
              </span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${overallGcsPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. Batch Generator / Regeneration Tool (Control Center)            */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
              <Zap className="w-4 h-4 fill-current" />
            </span>
            <div>
              <h2 className="font-display font-bold text-base text-zinc-900">
                Batch Generator & Audio Synthesis Engine
              </h2>
              <p className="text-xs text-zinc-500">
                Tạo trước toàn bộ âm thanh song ngữ vào bộ nhớ đệm hoặc tải lại audio với cấu hình giọng đọc mới.
              </p>
            </div>
          </div>

          {/* Top Actions: Sync Cloud & Running Indicator */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSyncingToCloud || isBatchRunning}
              onClick={handleSyncCacheToCloud}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50 ${
                isAllLessonsGcsSynced
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              title={isAllLessonsGcsSynced ? "Toàn bộ bài học trong level đã được đồng bộ 100% lên Cloud Storage" : "Tải toàn bộ audio đã có trong cache trình duyệt lên Cloud Storage bucket để dùng vĩnh viễn"}
            >
              {isSyncingToCloud ? (
                <CloudUpload className="w-3.5 h-3.5 animate-bounce" />
              ) : isAllLessonsGcsSynced ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5" />
              )}
              <span>{isSyncingToCloud ? 'Đang sync lên Cloud...' : isAllLessonsGcsSynced ? '✓ Đã đồng bộ Cloud (100%)' : 'Sync Cache ➔ Cloud Bucket'}</span>
            </button>

            {/* Running Indicator */}
            {isBatchRunning && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-bold animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>Đang xử lý {batchWorkersCount} luồng...</span>
              </div>
            )}
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-zinc-500 font-mono uppercase px-1">Chế Độ Tạo:</span>
            
            <button
              type="button"
              disabled={isBatchRunning}
              onClick={() => setBatchMode('missing_only')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                batchMode === 'missing_only'
                  ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                  : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chỉ Câu Còn Thiếu (Missing Only)</span>
            </button>

            <button
              type="button"
              disabled={isBatchRunning}
              onClick={() => setBatchMode('full')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                batchMode === 'full'
                  ? 'bg-zinc-900 text-white shadow-xs font-extrabold'
                  : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Toàn Bộ (Full)</span>
            </button>

            <button
              type="button"
              disabled={isBatchRunning || failedChunks.length === 0}
              onClick={() => setBatchMode('failed_only')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                batchMode === 'failed_only'
                  ? 'bg-rose-600 text-white shadow-xs font-extrabold'
                  : failedChunks.length > 0
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  : 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed opacity-60'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>🔄 Thử Lại Câu Bị Lỗi (Failed Only)</span>
              {failedChunks.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  batchMode === 'failed_only' ? 'bg-white text-rose-700' : 'bg-rose-600 text-white'
                }`}>
                  {failedChunks.length}
                </span>
              )}
            </button>
          </div>

          <div className="text-[11px] text-zinc-400 font-mono">
            {batchMode === 'missing_only' && '💡 Bỏ qua các câu đã có audio để tiết kiệm quota & chi phí'}
            {batchMode === 'full' && '⚡ Tổng hợp lại toàn bộ audio trong phạm vi đã chọn'}
            {batchMode === 'failed_only' && `⚠️ Chỉ xử lý ${failedChunks.length} câu trong hàng đợi lỗi`}
          </div>
        </div>

        {/* Uniform Voice Model Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2 text-xs font-bold font-mono">
            <span className="text-base">🎙️</span>
            <span>
              Model áp dụng đồng nhất cho toàn bộ Workers: <span className="underline decoration-amber-500 font-black">[{voiceProfileEn}]</span> ({modelRegistryService.getModelById(voiceProfileEn)?.provider || activeProvider})
            </span>
          </div>
          {!isBatchRunning && (
            <button
              type="button"
              onClick={() => {
                setForceOverwrite(true);
                setBatchMode('full');
                handleStartBatchGeneration(undefined, undefined, 'full', undefined, undefined, true);
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              title={`Ghi đè toàn bộ audio bằng ${voiceProfileEn}`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>⚡ Tạo Lại Toàn Bộ (Ghi Đè) Bằng [{voiceProfileEn}]</span>
            </button>
          )}
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Scope Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              1. Phạm Vi Tạo (Scope)
            </label>
            <select
              value={batchScope}
              disabled={isBatchRunning}
              onChange={(e) => setBatchScope(e.target.value as any)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 cursor-pointer focus:outline-none focus:border-[#DC2626]"
            >
              <option value="current_lesson">Bài học được chọn (Single Lesson)</option>
              <option value="entire_course">Toàn bộ khóa học ({selectedCourseLevel})</option>
            </select>

            {batchScope === 'current_lesson' && (
              <select
                value={batchTargetLessonId}
                disabled={isBatchRunning}
                onChange={(e) => setBatchTargetLessonId(e.target.value)}
                className="w-full mt-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 cursor-pointer"
              >
                {lessons.map(l => (
                  <option key={l.id} value={l.id}>
                    Day {l.day_number}: {l.lesson_title} ({l.chunks?.length || 0} chunks)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Target Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              2. Mục Tiêu (Target Audio)
            </label>
            <select
              value={batchTarget}
              disabled={isBatchRunning}
              onChange={(e) => setBatchTarget(e.target.value as AudioBatchTarget)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 cursor-pointer focus:outline-none focus:border-[#DC2626]"
            >
              <option value="BOTH">Cả Tiếng Anh & Tiếng Việt (Both)</option>
              <option value="ENGLISH">Chỉ Tiếng Anh (English Only)</option>
              <option value="VIETNAMESE">Chỉ Tiếng Việt (Vietnamese Only)</option>
            </select>

            <div className="mt-2 text-[11px] text-zinc-500 font-mono">
              Worker Pool:
              <select
                value={batchWorkersCount}
                disabled={isBatchRunning}
                onChange={(e) => setBatchWorkersCount(parseInt(e.target.value))}
                className="ml-2 px-2 py-0.5 bg-zinc-50 border border-zinc-200 rounded-md text-xs font-bold text-zinc-800"
              >
                <option value={2}>2 Workers</option>
                <option value={4}>4 Workers (Chuẩn)</option>
                <option value={8}>8 Workers (Tốc độ cao)</option>
              </select>
            </div>
          </div>

          {/* English Voice Profile */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              3. Giọng Tiếng Anh ({modelRegistryService.getModelById(voiceProfileEn)?.provider || activeProvider})
            </label>
            <select
              value={voiceProfileEn}
              disabled={isBatchRunning}
              onChange={(e) => {
                setVoiceProfileEn(e.target.value);
                setActiveProvider(modelRegistryService.getModelById(e.target.value)?.provider === 'DEEPGRAM' ? 'DEEPGRAM_AURA' : 'GOOGLE_TTS');
                modelRegistryService.setMainModelEn(e.target.value);
                onUpdateAudioSettings?.({
                  ...(cohortAudioSettings || {
                    language_mode: 'EN_THEN_VI',
                    auto_advance_delay_sec: 0,
                    default_speed: 1.0,
                    repeat_count: 1
                  }),
                  voice_profile_en: e.target.value
                });
              }}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 cursor-pointer focus:outline-none focus:border-[#DC2626]"
            >
              {!englishModels.some(m => m.id === voiceProfileEn) && <option value={voiceProfileEn} disabled>{voiceProfileEn} (unavailable)</option>}
              {englishModels.map(v => (
                <option key={v.id} value={v.id}>
                  {getMinimalName(v)} • [{PROVIDERS_META[v.provider]?.shortName || v.provider}]
                </option>
              ))}
            </select>
            <div className="mt-2 text-[11px] text-zinc-400 font-mono truncate">
              ID: {voiceProfileEn}
            </div>
          </div>

          {/* Vietnamese Voice Profile */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              4. Giọng Tiếng Việt ({modelRegistryService.getModelById(voiceProfileVi)?.provider || 'Google Cloud'})
            </label>
            <select
              value={voiceProfileVi}
              disabled={isBatchRunning}
              onChange={(e) => {
                setVoiceProfileVi(e.target.value);
                modelRegistryService.setMainModelVi(e.target.value);
                onUpdateAudioSettings?.({
                  ...(cohortAudioSettings || {
                    language_mode: 'EN_THEN_VI',
                    auto_advance_delay_sec: 0,
                    default_speed: 1.0,
                    repeat_count: 1
                  }),
                  voice_profile_vi: e.target.value
                });
              }}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 cursor-pointer focus:outline-none focus:border-[#DC2626]"
            >
              {!vietnameseModels.some(m => m.id === voiceProfileVi) && <option value={voiceProfileVi} disabled>{voiceProfileVi} (unavailable)</option>}
              {vietnameseModels.map(v => (
                <option key={v.id} value={v.id}>
                  {getMinimalName(v)} • [{PROVIDERS_META[v.provider]?.shortName || v.provider}]
                </option>
              ))}
            </select>

            {/* Action Buttons Row */}
            <div className="mt-2.5 flex items-center gap-2">
              {!isBatchRunning ? (
                <button
                  type="button"
                  onClick={() => handleStartBatchGeneration()}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs ${
                    batchMode === 'failed_only'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : batchMode === 'missing_only'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-[#DC2626] hover:bg-[#B91C1C]'
                  }`}
                >
                  {batchMode === 'failed_only' ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Thử Lại Lỗi ({failedChunks.length})</span>
                    </>
                  ) : batchMode === 'missing_only' ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 fill-current" />
                      <span>Tạo Câu Còn Thiếu</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Bắt Đầu Tạo Audio</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopBatchGeneration}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
                  <span>Dừng / Hủy</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Overwrite Toggle & Auto Cloud Sync Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
          <div className="flex flex-wrap items-center gap-4">
            {/* Auto Cloud Sync Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoSyncToCloud}
                disabled={isBatchRunning}
                onChange={(e) => setAutoSyncToCloud(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-zinc-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-zinc-900 flex items-center gap-1">
                <CloudUpload className="w-3.5 h-3.5 text-blue-600" />
                Tự động tải lên Cloud Storage & lưu Firestore (Auto Cloud Sync)
              </span>
              <span className="text-[10px] text-zinc-500 hidden sm:inline">
                {autoSyncToCloud ? '— Tải ngay lên GCS bucket & cập nhật DB' : '— Chỉ lưu tạm vào IndexedDB'}
              </span>
            </label>

            {/* Overwrite Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={forceOverwrite}
                disabled={isBatchRunning}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setForceOverwrite(checked);
                  if (checked && batchMode === 'missing_only') {
                    setBatchMode('full');
                  }
                }}
                className="w-4 h-4 rounded text-[#DC2626] border-zinc-300 focus:ring-[#DC2626] cursor-pointer disabled:opacity-50"
              />
              <span className="text-xs font-bold text-zinc-800">
                Ghi đè audio đã có (Force Overwrite)
              </span>
              <span className="text-[10px] text-zinc-400 hidden sm:inline">
                {forceOverwrite ? '— Tạo mới và tải đè lên GCS' : '— Bỏ qua các chunk đã có file audio'}
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isBatchRunning || isResettingAudio}
              onClick={() => handleResetAudioUrls()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-xs font-bold text-red-700 cursor-pointer shadow-2xs transition-all disabled:opacity-50"
              title="Xóa link audio cũ của bài học để tạo lại từ đầu"
            >
              {isResettingAudio ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-600" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
              )}
              <span>Xóa link audio cũ</span>
            </button>
          </div>
        </div>

        {/* Live Multi-Stage Progress Tracker & Metrics */}
        {(isBatchRunning || batchProgress.stage !== 'idle') && (
          <div className="p-5 bg-zinc-950 text-white rounded-2xl space-y-3.5 font-mono text-xs border border-zinc-800 shadow-xl animate-fade-in">
            {/* Visual Stage Pipeline */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-zinc-900/90 rounded-xl border border-zinc-800">
              {[
                { key: 'preparing', num: '1', label: 'Chuẩn Bị' },
                { key: 'synthesizing', num: '2', label: 'Tạo TTS' },
                { key: 'uploading_cloud', num: '3', label: 'Tải Lên Cloud' },
                { key: 'saving_firestore', num: '4', label: 'Lưu Firestore' },
                { key: 'completed', num: '5', label: 'Hoàn Tất' }
              ].map((step, sIdx, sArr) => {
                const stageOrder = ['preparing', 'synthesizing', 'uploading_cloud', 'saving_firestore', 'completed'];
                const curIdx = stageOrder.indexOf(batchProgress.stage);
                const thisIdx = stageOrder.indexOf(step.key);
                const isCurrent = batchProgress.stage === step.key;
                const isPassed = curIdx > thisIdx || batchProgress.stage === 'completed';

                return (
                  <React.Fragment key={step.key}>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all text-xs ${
                      isCurrent
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold animate-pulse'
                        : isPassed
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 font-semibold'
                        : 'text-zinc-500 border border-transparent'
                    }`}>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCurrent 
                          ? 'bg-amber-400 text-zinc-950' 
                          : isPassed 
                          ? 'bg-emerald-500 text-zinc-950' 
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {isPassed && !isCurrent ? '✓' : step.num}
                      </span>
                      <span>{step.label}</span>
                    </div>
                    {sIdx < sArr.length - 1 && (
                      <span className="text-zinc-700 text-xs">➔</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Progress Bar & Current Status */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 truncate max-w-lg flex items-center gap-2">
                  {isBatchRunning && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#DC2626] shrink-0" />}
                  <span>{batchProgress.currentTask || 'Đang xử lý quy trình batch...'}</span>
                </span>
                <span className="text-[#DC2626] font-bold text-sm shrink-0">
                  {batchProgress.percentage}% ({batchProgress.current} / {batchProgress.total})
                </span>
              </div>

              <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 h-full transition-all duration-200"
                  style={{ width: `${batchProgress.percentage}%` }}
                />
              </div>
            </div>

            {/* Live Metric Tiles Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                <div className="text-[10px] text-zinc-400 uppercase font-sans">Tổng Số Câu</div>
                <div className="text-base font-bold text-white font-mono mt-0.5">{batchProgress.total}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                <div className="text-[10px] text-emerald-400 uppercase font-sans flex items-center justify-center gap-1">
                  <Check className="w-3 h-3" /> Thành Công
                </div>
                <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">{batchProgress.successCount}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                <div className="text-[10px] text-blue-400 uppercase font-sans flex items-center justify-center gap-1">
                  <CloudUpload className="w-3 h-3" /> Đã Tải Cloud
                </div>
                <div className="text-base font-bold text-blue-400 font-mono mt-0.5">{batchProgress.cloudSyncedCount}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                <div className="text-[10px] text-rose-400 uppercase font-sans flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Bị Lỗi
                </div>
                <div className="text-base font-bold text-rose-400 font-mono mt-0.5">{batchProgress.failCount}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center col-span-2 sm:col-span-1">
                <div className="text-[10px] text-zinc-400 uppercase font-sans">Đã Có / Bỏ Qua</div>
                <div className="text-base font-bold text-zinc-300 font-mono mt-0.5">{batchProgress.skippedCount}</div>
              </div>
            </div>
          </div>
        )}

        {/* Failed Audio Queue / Selective Regeneration Panel */}
        {failedChunks.length > 0 && (
          <div className="p-5 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3.5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-200/80">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-rose-100 text-rose-700">
                  <AlertTriangle className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-display font-bold text-sm text-rose-950 flex items-center gap-2">
                    <span>Phát Hiện {failedChunks.length} Audio Bị Lỗi Trong Hàng Đợi</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 text-xs font-mono font-bold">
                      {failedChunks.length} lỗi
                    </span>
                  </h3>
                  <p className="text-xs text-rose-700">
                    Các câu này gặp sự cố mạng, hạn mức API hoặc lỗi tải lên Cloud Storage. Bạn có thể thử lại ngay mà không cần tạo lại toàn bộ khóa học.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isBatchRunning}
                  onClick={handleRetryAllFailedChunks}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>🔄 Thử Lại Toàn Bộ ({failedChunks.length} câu)</span>
                </button>

                <button
                  type="button"
                  disabled={isBatchRunning}
                  onClick={clearFailedQueue}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-300 bg-white hover:bg-rose-100/50 text-rose-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa Hàng Đợi Lỗi</span>
                </button>
              </div>
            </div>

            {/* Failed Chunks List Table */}
            <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-xl border border-rose-200/80 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-rose-100/60 text-rose-900 font-bold border-b border-rose-200 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3 w-16 text-center">Buổi</th>
                    <th className="py-2.5 px-3 w-16 text-center">Câu #</th>
                    <th className="py-2.5 px-3">Văn Bản (EN / VI)</th>
                    <th className="py-2.5 px-3 w-32 text-center">Giai Đoạn Lỗi</th>
                    <th className="py-2.5 px-3">Chi Tiết Lỗi</th>
                    <th className="py-2.5 px-3 w-36 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100">
                  {failedChunks.map((item, idx) => (
                    <tr key={`${item.chunkId}-${item.lang}-${idx}`} className="hover:bg-rose-50/50">
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-700">
                        Day {item.dayNumber || '?'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-800">
                        #{item.itemNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-zinc-900 truncate max-w-xs">{item.textEn}</div>
                        {item.textVi && (
                          <div className="text-[11px] text-zinc-500 truncate max-w-xs">{item.textVi}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          item.stage === 'cloud_upload'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : item.stage === 'firestore_save'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {item.stage === 'cloud_upload' ? 'Lỗi Tải Cloud' : item.stage === 'firestore_save' ? 'Lỗi Lưu DB' : 'Lỗi Tạo TTS'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-rose-700 max-w-xs truncate" title={item.error}>
                        {item.error}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            disabled={isBatchRunning}
                            onClick={() => handleRetrySingleFailedChunk(item)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                            title="Thử lại câu này ngay"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Thử Lại</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFailedChunk(item.chunkId)}
                            className="p-1 rounded-lg hover:bg-rose-200 text-rose-600 transition-all cursor-pointer"
                            title="Xóa khỏi danh sách lỗi"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Live Log Console with Filtering Tabs */}
        {batchLogs.length > 0 && (
          <div className="p-3.5 bg-zinc-950 text-zinc-200 rounded-xl border border-zinc-800 font-mono text-[11px] space-y-2">
            <div className="text-zinc-400 font-bold border-b border-zinc-800 pb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-zinc-300 font-bold">Bảng Nhật Ký Hoạt Động (Live Activity Console)</span>
                {/* Filter Pills */}
                <div className="flex items-center gap-1 ml-2">
                  <button
                    type="button"
                    onClick={() => setLogFilter('all')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      logFilter === 'all' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Tất cả ({batchLogs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogFilter('error')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      logFilter === 'error' ? 'bg-rose-900 text-rose-200' : 'text-rose-400 hover:text-rose-300'
                    }`}
                  >
                    Lỗi ({batchLogs.filter(l => l.type === 'error' || l.type === 'warning').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogFilter('cloud')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      logFilter === 'cloud' ? 'bg-blue-900 text-blue-200' : 'text-blue-400 hover:text-blue-300'
                    }`}
                  >
                    Cloud Sync ({batchLogs.filter(l => l.type === 'cloud' || l.message.toLowerCase().includes('cloud') || l.message.toLowerCase().includes('gcs')).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogFilter('success')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      logFilter === 'success' ? 'bg-emerald-900 text-emerald-200' : 'text-emerald-400 hover:text-emerald-300'
                    }`}
                  >
                    Thành công ({batchLogs.filter(l => l.type === 'success').length})
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setBatchLogs([])} 
                className="text-zinc-500 hover:text-zinc-300 text-[10px] cursor-pointer"
              >
                Xóa Log
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              {batchLogs
                .filter(log => {
                  if (logFilter === 'all') return true;
                  if (logFilter === 'error') return log.type === 'error' || log.type === 'warning';
                  if (logFilter === 'cloud') return log.type === 'cloud' || log.message.toLowerCase().includes('cloud') || log.message.toLowerCase().includes('gcs');
                  if (logFilter === 'success') return log.type === 'success';
                  return true;
                })
                .map(log => (
                  <div key={log.id} className="flex items-start gap-2">
                    <span className="text-zinc-600 shrink-0">[{log.timestamp}]</span>
                    <span className={
                      log.type === 'success' ? 'text-emerald-400' :
                      log.type === 'cloud' ? 'text-cyan-400' :
                      log.type === 'warning' ? 'text-amber-400' :
                      log.type === 'error' ? 'text-rose-400' : 'text-zinc-300'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4.5 Part Intro & Transition Announcements (Reusable Audio)         */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-display font-bold text-base text-zinc-900">
                Part Intro & Transition Announcements (Âm thanh chuyển Part dùng lại)
              </h2>
              <p className="text-xs text-zinc-500">
                Âm thanh thông báo chuẩn khi bắt đầu phần mới trong Focus Mode. Tự động tái sử dụng cho tất cả bài học.
              </p>
            </div>
          </div>

          {/* Batch Prepare Button */}
          <button
            type="button"
            disabled={isPreppingPartAudios}
            onClick={handlePrepareAllPartAudios}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:bg-purple-300 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Tạo trước và lưu toàn bộ 7 âm thanh thông báo Part vào bộ nhớ đệm IndexedDB"
          >
            {isPreppingPartAudios ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>
                  Đang chuẩn bị {preppingPartProgress ? `(${preppingPartProgress.current}/${preppingPartProgress.total})` : '...'}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Chuẩn bị tất cả âm thanh Part (Batch Prepare Part Audios)</span>
              </>
            )}
          </button>
        </div>

        {/* Canonical Parts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {CANONICAL_PARTS.map((part) => {
            const isCached = partAudioCacheStatus[part.key] ?? false;
            const isAuditioning = auditioningPartKey === part.key;

            return (
              <div
                key={part.key}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                  isCached
                    ? 'bg-emerald-50/30 border-emerald-200/80 hover:border-emerald-300'
                    : 'bg-zinc-50/60 border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                      Part {part.partNumber}
                    </span>
                    {isCached ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Ready / Cached</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-600">
                        <span>Not Cached</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-xs text-zinc-900 font-display">
                    {part.titleEn}
                  </h3>
                  <div className="text-[11px] text-zinc-500">
                    {part.titleVi}
                  </div>

                  {/* Speech Text Box */}
                  <div className="mt-2.5 p-2 rounded-lg bg-white border border-zinc-200/80 text-[11px] font-mono text-zinc-700 flex items-start gap-1.5">
                    <span className="text-zinc-400 shrink-0 font-sans">TTS:</span>
                    <span className="font-semibold text-zinc-900">"{part.speechText}"</span>
                  </div>
                </div>

                {/* Audition Button */}
                <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-400">
                    Giọng: {voiceProfileEn.split('-')[0]}
                  </span>
                  <button
                    type="button"
                    disabled={isAuditioning}
                    onClick={() => handleAuditionPartIntro(part)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    {isAuditioning ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                        <span>Đang đọc...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3 text-emerald-400" />
                        <span>Nghe thử</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. Lesson Readiness Matrix Table                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        {/* Table Header & Search Filter */}
        <div className="p-5 border-b border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#FCFCFD]">
          <div>
            <h2 className="font-display font-bold text-base text-zinc-900">
              Bảng Trạng Thái Audio Sẵn Sàng ({filteredLessons.length} Bài Học)
            </h2>
            <p className="text-xs text-zinc-500">
              Chi tiết từng buổi học với tỷ lệ đệm tiếng Anh, tiếng Việt và trạng thái liên kết GCS master.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Tìm bài học, Day..."
                className="pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#DC2626] w-48"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 cursor-pointer focus:outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ready">100% Sẵn sàng</option>
              <option value="missing">Còn thiếu audio</option>
              <option value="has_gcs">Có GCS Master</option>
            </select>

            {/* Sync Cache to Cloud Button */}
            <button
              type="button"
              disabled={isSyncingToCloud || isBatchRunning}
              onClick={handleSyncCacheToCloud}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50 ${
                isAllLessonsGcsSynced
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              title={isAllLessonsGcsSynced ? "Toàn bộ bài học trong level đã được đồng bộ 100% lên Cloud Storage" : "Tải toàn bộ audio đã có trong cache trình duyệt lên Cloud Storage bucket để dùng vĩnh viễn"}
            >
              {isSyncingToCloud ? (
                <CloudUpload className="w-3.5 h-3.5 animate-bounce" />
              ) : isAllLessonsGcsSynced ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5" />
              )}
              <span>{isSyncingToCloud ? 'Đang sync lên Cloud...' : isAllLessonsGcsSynced ? '✓ Đã đồng bộ Cloud (100%)' : 'Sync Cache ➔ Cloud Bucket'}</span>
            </button>

            {/* Refresh Cache Button */}
            <button
              onClick={() => calculateReadinessStatus()}
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
              title="Làm mới trạng thái đệm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-50 text-zinc-700 font-bold border-b border-zinc-200">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Buổi</th>
                <th className="py-3 px-4">Tiêu Đề Bài Học</th>
                <th className="py-3 px-4 w-28 text-center">Số Chunks</th>
                <th className="py-3 px-4 w-40 text-center">Tiếng Anh (EN)</th>
                <th className="py-3 px-4 w-40 text-center">Tiếng Việt (VI)</th>
                <th className="py-3 px-4 w-28 text-center">GCS Master</th>
                <th className="py-3 px-4 w-72 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {isLoadingLessons ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400 font-mono text-xs">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#DC2626]" />
                    Đang nạp dữ liệu bài học...
                  </td>
                </tr>
              ) : filteredLessons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400 font-mono text-xs">
                    Không tìm thấy bài học nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredLessons.map((lesson) => {
                  const lessonDoc = lesson;
                  const chunks = lesson.chunks || [];
                  const gcsCount = chunks.filter(c => Boolean(c.audio_url && c.audio_url.startsWith('http') && !c.audio_url.includes('placeholder'))).length;
                  const item = statusMap.get(lesson.id) || {
                    lessonId: lesson.id,
                    dayNumber: lesson.day_number,
                    title: lesson.lesson_title || `Day ${lesson.day_number}`,
                    totalChunks: chunks.length,
                    enCached: gcsCount,
                    viCached: 0,
                    gcsCount,
                    enPercent: chunks.length > 0 ? Math.round((gcsCount / chunks.length) * 100) : 0,
                    viPercent: 0,
                    isFullyCached: chunks.length > 0 && gcsCount === chunks.length
                  };
                  const isEn100 = item.enPercent === 100 && item.totalChunks > 0;
                  const isVi100 = item.viPercent === 100 && item.totalChunks > 0;

                  return (
                    <tr
                      key={lesson.id}
                      className="hover:bg-zinc-50/80 transition-colors group cursor-pointer"
                      onClick={() => setInspectingLesson(lesson)}
                    >
                      {/* Day Number */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-zinc-900">
                        <span className="px-2 py-1 rounded-lg bg-zinc-100 text-zinc-800">
                          Day {item.dayNumber}
                        </span>
                      </td>

                      {/* Lesson Title */}
                      <td className="py-3.5 px-4 font-semibold text-zinc-900">
                        <div className="truncate max-w-xs">{item.title}</div>
                        <div className="text-[10px] text-zinc-400 font-mono font-normal">
                          {item.lessonId}
                        </div>
                      </td>

                      {/* Total Chunks */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-zinc-700">
                        {item.totalChunks}
                      </td>

                      {/* EN Audio Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                            isEn100
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.enPercent > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-zinc-100 text-zinc-500'
                          }`}>
                            {item.enCached}/{item.totalChunks} ({item.enPercent}%) {isEn100 && '✓'}
                          </span>
                          <div className="w-24 bg-zinc-100 rounded-full h-1 overflow-hidden">
                            <div
                              className={`h-full ${isEn100 ? 'bg-emerald-600' : 'bg-amber-500'}`}
                              style={{ width: `${item.enPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* VI Audio Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                            isVi100
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.viPercent > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-zinc-100 text-zinc-500'
                          }`}>
                            {item.viCached}/{item.totalChunks} ({item.viPercent}%) {isVi100 && '✓'}
                          </span>
                          <div className="w-24 bg-zinc-100 rounded-full h-1 overflow-hidden">
                            <div
                              className={`h-full ${isVi100 ? 'bg-emerald-600' : 'bg-amber-500'}`}
                              style={{ width: `${item.viPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* GCS Master */}
                      <td className="py-3.5 px-4 text-center">
                        {item.totalChunks > 0 && item.gcsCount === item.totalChunks ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>100% GCS Master</span>
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                            item.gcsCount > 0 ? 'bg-blue-50 text-blue-700' : 'text-zinc-400'
                          }`}>
                            {item.gcsCount > 0 ? `${item.gcsCount} files` : '—'}
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {/* Audition First Chunk */}
                          <button
                            type="button"
                            onClick={() => {
                              if (lesson.chunks?.[0]) {
                                handlePlayChunk(lesson.chunks[0], 'en');
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                            title="Nghe thử chunk đầu tiên"
                          >
                            <Volume2 className="w-3 h-3 text-[#DC2626]" />
                            <span>Nghe Thử</span>
                          </button>

                          {/* Quick Retry If Lesson Has Failed Chunks */}
                          {(() => {
                            const lessonFailedChunks = failedChunks.filter(f => f.lessonId === lesson.id);
                            if (lessonFailedChunks.length === 0) return null;
                            return (
                              <button
                                type="button"
                                disabled={isBatchRunning}
                                onClick={() => {
                                  setBatchScope('current_lesson');
                                  setBatchTargetLessonId(lesson.id);
                                  handleStartBatchGeneration('current_lesson', lesson.id, 'failed_only', lessonFailedChunks.map(f => f.chunkId));
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 border border-rose-200 shadow-2xs"
                                title={`Thử lại ${lessonFailedChunks.length} câu bị lỗi trong bài này`}
                              >
                                <RotateCcw className="w-3 h-3 text-rose-600" />
                                <span>Thử Lỗi ({lessonFailedChunks.length})</span>
                              </button>
                            );
                          })()}

                          {/* Quick Create Missing Audio If Not 100% Ready */}
                          {(item.enPercent < 100 || item.viPercent < 100) && (
                            <button
                              type="button"
                              disabled={isBatchRunning}
                              onClick={() => {
                                setBatchScope('current_lesson');
                                setBatchTargetLessonId(lesson.id);
                                handleStartBatchGeneration('current_lesson', lesson.id, 'missing_only');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 border border-emerald-200 shadow-2xs"
                              title="Tạo các câu còn thiếu cho bài này"
                            >
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              <span>Tạo Thiếu</span>
                            </button>
                          )}

                          {/* Regenerate This Lesson */}
                          <button
                            type="button"
                            disabled={isBatchRunning}
                            onClick={() => {
                              setBatchScope('current_lesson');
                              setBatchTargetLessonId(lesson.id);
                              handleStartBatchGeneration('current_lesson', lesson.id, 'full');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                            title="Tạo lại toàn bộ audio cho bài này"
                          >
                            <Zap className="w-3 h-3 text-amber-600" />
                            <span>Tạo Lại</span>
                          </button>

                          {/* Reset Audio URLs for This Lesson */}
                          <button
                            type="button"
                            disabled={isBatchRunning || isResettingAudio}
                            onClick={() => handleResetAudioUrls(lesson.id)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold transition-all cursor-pointer inline-flex items-center"
                            title="Xóa link audio cũ của bài này để tạo lại từ đầu"
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </button>

                          {/* Inspect Chunks Drawer */}
                          <button
                            type="button"
                            onClick={() => setInspectingLesson(lesson)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                            title="Xem chi tiết từng chunk"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Chi Tiết</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 6. Audition & Inspector Drawer / Modal                             */}
      {/* ------------------------------------------------------------------ */}
      {inspectingLesson && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg bg-[#DC2626] text-white font-mono font-bold text-xs">
                  Day {inspectingLesson.day_number}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-lg text-zinc-900">
                      {inspectingLesson.lesson_title}
                    </h3>
                    {(() => {
                      const chunks = inspectingLesson.chunks || [];
                      const gcs = chunks.filter(c => Boolean(c.audio_url && c.audio_url.startsWith('http') && !c.audio_url.includes('placeholder'))).length;
                      if (chunks.length > 0 && gcs === chunks.length) {
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>100% GCS Master</span>
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="text-xs text-zinc-500 font-mono mt-0.5">
                    ID: {inspectingLesson.id} • Tổng: {inspectingLesson.chunks?.length || 0} Chunks
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* 1-Click Prepare Missing Audio for This Lesson */}
                <button
                  type="button"
                  disabled={isBatchRunning}
                  onClick={() => {
                    handleStartBatchGeneration(
                      'current_lesson',
                      inspectingLesson.id,
                      'missing_only',
                      undefined,
                      'BOTH',
                      false
                    );
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  title="Chuẩn bị nhanh các câu còn thiếu audio cho bài học này"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Chuẩn Bị Audio Bài Này</span>
                </button>

                {/* Open Custom Regeneration & Voice Selection Drawer */}
                <button
                  type="button"
                  disabled={isBatchRunning}
                  onClick={() => {
                    setShowModalRegenReview(prev => !prev);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  title="Tùy chọn giọng đọc và tạo lại bài này"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Tạo Lại Bài Này</span>
                </button>

                <button
                  type="button"
                  disabled={isBatchRunning || isResettingAudio}
                  onClick={() => handleResetAudioUrls(inspectingLesson.id)}
                  className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  title="Xóa toàn bộ link audio Cloud Storage cũ của bài học này"
                >
                  {isResettingAudio ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-red-600" />}
                  <span>Xóa link audio cũ</span>
                </button>

                {onLaunchProjectorForLesson && (
                  <button
                    onClick={() => {
                      onLaunchProjectorForLesson(inspectingLesson.id, inspectingLesson.day_number || 1);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-[#DC2626]" />
                    <span>Mở Lớp Học (Drill)</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setInspectingLesson(null);
                    setShowModalRegenReview(false);
                  }}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Pre-Generation Review Drawer / Banner */}
            {showModalRegenReview && (
              <div className="p-4 bg-zinc-900 text-white border-b border-zinc-800 animate-fade-in space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎙️</span>
                    <h4 className="font-bold text-sm text-zinc-100">
                      Cấu Hình & Tạo Audio Cho Day {inspectingLesson.day_number}: {inspectingLesson.lesson_title}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowModalRegenReview(false)}
                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  {/* Target Language Pills */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Ngôn ngữ mục tiêu
                    </label>
                    <div className="flex items-center gap-1.5">
                      {(['ENGLISH', 'VIETNAMESE', 'BOTH'] as AudioBatchTarget[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setModalRegenTarget(t)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            modalRegenTarget === t
                              ? 'bg-[#DC2626] text-white shadow-xs'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          {t === 'ENGLISH' ? 'Tiếng Anh (EN)' : t === 'VIETNAMESE' ? 'Tiếng Việt (VI)' : 'Cả Hai (EN + VI)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Model Selectors */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Giọng Model Cho Bài Này
                    </label>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-emerald-400 shrink-0 w-6">EN:</span>
                        <select
                          value={voiceProfileEn}
                          onChange={(e) => {
                            setVoiceProfileEn(e.target.value);
                            modelRegistryService.setMainModelEn(e.target.value);
                            onUpdateAudioSettings?.({
                              ...(cohortAudioSettings || {
                                language_mode: 'EN_THEN_VI',
                                auto_advance_delay_sec: 0,
                                default_speed: 1.0,
                                repeat_count: 1
                              }),
                              voice_profile_en: e.target.value
                            });
                          }}
                          className="flex-1 text-xs font-semibold bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-2 py-1 focus:outline-none focus:border-[#DC2626] cursor-pointer"
                        >
                          {englishModels.map(v => (
                            <option key={v.id} value={v.id} className="bg-zinc-800 text-white">
                              {getMinimalName(v)} • [{PROVIDERS_META[v.provider]?.shortName || v.provider}]
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-blue-400 shrink-0 w-6">VI:</span>
                        <select
                          value={voiceProfileVi}
                          onChange={(e) => {
                            setVoiceProfileVi(e.target.value);
                            modelRegistryService.setMainModelVi(e.target.value);
                            onUpdateAudioSettings?.({
                              ...(cohortAudioSettings || {
                                language_mode: 'EN_THEN_VI',
                                auto_advance_delay_sec: 0,
                                default_speed: 1.0,
                                repeat_count: 1
                              }),
                              voice_profile_vi: e.target.value
                            });
                          }}
                          className="flex-1 text-xs font-semibold bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-600 cursor-pointer"
                        >
                          {vietnameseModels.map(v => (
                            <option key={v.id} value={v.id} className="bg-zinc-800 text-white">
                              {getMinimalName(v)} • [{PROVIDERS_META[v.provider]?.shortName || v.provider}]
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Overwrite Toggle & Action Buttons */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Chế độ thực thi
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setModalRegenOverwrite(true)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          modalRegenOverwrite ? 'bg-amber-600 text-white shadow-xs' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                      >
                        Ghi đè toàn bộ audio cũ
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalRegenOverwrite(false)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          !modalRegenOverwrite ? 'bg-emerald-600 text-white shadow-xs' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                      >
                        Chỉ tạo câu còn thiếu
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isBatchRunning}
                        onClick={() => {
                          setShowModalRegenReview(false);
                          handleStartBatchGeneration(
                            'current_lesson',
                            inspectingLesson.id,
                            modalRegenOverwrite ? 'full' : 'missing_only',
                            undefined,
                            modalRegenTarget,
                            modalRegenOverwrite
                          );
                        }}
                        className="px-3 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Bắt Đầu Tạo Audio</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowModalRegenReview(false)}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search & Filter Subheader */}
            <div className="p-4 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-3 bg-white">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={chunkSearch}
                  onChange={(e) => setChunkSearch(e.target.value)}
                  placeholder="Tìm chunk theo tiếng Anh hoặc tiếng Việt..."
                  className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-[#DC2626]"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedCategoryFilter === 'all'
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Tất cả ({inspectingLesson.chunks?.length || 0})
                </button>
                {uniqueCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider font-mono transition-all cursor-pointer ${
                      selectedCategoryFilter === cat
                        ? 'bg-[#DC2626] text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Chunks List Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 divide-y divide-zinc-100">
              {filteredChunks.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 font-mono text-xs">
                  Không tìm thấy chunk nào phù hợp.
                </div>
              ) : (
                filteredChunks.map((chunk) => {
                  const isPlayingThis = playingChunkId === chunk.chunk_id;
                  const isRegeneratingThis = regeneratingChunkId === chunk.chunk_id;
                  const isEditingThis = editingChunkId === chunk.chunk_id;
                  const isVoiceConfigOpen = Boolean(expandedChunkVoiceConfig[chunk.chunk_id]);
                  const selectedVoiceEn = chunkVoiceEn[chunk.chunk_id] || voiceProfileEn;
                  const selectedVoiceVi = chunkVoiceVi[chunk.chunk_id] || voiceProfileVi;
                  const isEnCached = audioPlayer.hasCachedAudio(chunk.english, selectedVoiceEn);
                  const isViCached = !!chunk.vietnamese && audioPlayer.hasCachedAudio(chunk.vietnamese, selectedVoiceVi);

                  if (isEditingThis) {
                    return (
                      <div
                        key={chunk.chunk_id}
                        className="pt-3 first:pt-0 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 animate-fade-in shadow-xs"
                      >
                        {/* Header info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#DC2626] bg-[#DC2626]/10 px-2 py-0.5 rounded">
                              Chỉnh sửa Chunk #{chunk.item_number}
                            </span>
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-200 text-zinc-700">
                              {chunk.category || 'vocab'}
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={isSavingChunk}
                            onClick={() => setEditingChunkId(null)}
                            className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>

                        {/* Text Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider flex items-center gap-1">
                              <span>Tiếng Anh</span>
                              <span className="text-zinc-400 font-normal">(hỗ trợ // để ngắt nhịp)</span>
                            </label>
                            <input
                              type="text"
                              value={editEnText}
                              disabled={isSavingChunk}
                              onChange={(e) => setEditEnText(e.target.value)}
                              placeholder="English phrase / sentence..."
                              className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-[#DC2626]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                              Dịch nghĩa Tiếng Việt
                            </label>
                            <input
                              type="text"
                              value={editViText}
                              disabled={isSavingChunk}
                              onChange={(e) => setEditViText(e.target.value)}
                              placeholder="Vietnamese meaning..."
                              className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-emerald-600"
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            disabled={isSavingChunk}
                            onClick={() => setEditingChunkId(null)}
                            className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all cursor-pointer"
                          >
                            Đóng
                          </button>
                          <button
                            type="button"
                            disabled={isSavingChunk}
                            onClick={() => handleSaveChunkText(chunk)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-zinc-300 hover:border-zinc-400 text-zinc-800 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            {isSavingChunk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            <span>Chỉ Lưu Văn Bản</span>
                          </button>
                          <button
                            type="button"
                            disabled={isSavingChunk}
                            onClick={() => handleSaveChunkText(chunk, 'en')}
                            className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#DC2626] border border-red-200 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Zap className="w-3.5 h-3.5 text-[#DC2626]" />
                            <span>Lưu & Tạo Audio EN</span>
                          </button>
                          <button
                            type="button"
                            disabled={isSavingChunk}
                            onClick={() => handleSaveChunkText(chunk, 'vi')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Zap className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Lưu & Tạo Audio VI</span>
                          </button>
                          <button
                            type="button"
                            disabled={isSavingChunk}
                            onClick={() => handleSaveChunkText(chunk, 'both')}
                            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Lưu & Tạo Cả 2</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={chunk.chunk_id}
                      className="pt-3 first:pt-0 flex flex-col p-3 rounded-xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-200/60"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Left: Text & Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                              #{chunk.item_number}
                            </span>
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-200/80 text-zinc-700">
                              {chunk.category || 'vocab'}
                            </span>
                            {chunk.audio_url && chunk.audio_url.startsWith('http') && !chunk.audio_url.includes('placeholder') && (
                              <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                GCS Master
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingChunkId(chunk.chunk_id);
                                setEditEnText(chunk.english);
                                setEditViText(chunk.vietnamese || '');
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-blue-600 text-[11px] font-semibold transition-colors cursor-pointer"
                              title="Sửa nhanh nội dung câu tiếng Anh & tiếng Việt"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Sửa Text</span>
                            </button>
                          </div>

                          {/* English with Highlighted Prosody */}
                          <div className="text-sm font-bold text-zinc-900 leading-snug">
                            {chunk.english.split('//').map((part, idx, arr) => (
                              <React.Fragment key={idx}>
                                <span>{part}</span>
                                {idx < arr.length - 1 && (
                                  <span className="text-[#DC2626] font-bold px-1 select-none">
                                    //
                                  </span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>

                          {/* Vietnamese Translation */}
                          <div className="text-xs text-zinc-600 font-medium">
                            {chunk.vietnamese}
                          </div>
                        </div>

                        {/* Right: Audio Audition & Regeneration Controls */}
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          {/* Play EN */}
                          <button
                            type="button"
                            disabled={isPlayingThis && playingLang === 'en'}
                            onClick={() => handlePlayChunk(chunk, 'en')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                              isPlayingThis && playingLang === 'en'
                                ? 'bg-[#DC2626] text-white'
                                : isEnCached
                                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                            }`}
                            title="Nghe thử tiếng Anh"
                          >
                            {isPlayingThis && playingLang === 'en' ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5 text-[#DC2626]" />
                            )}
                            <span>EN {isEnCached && '✓'}</span>
                          </button>

                          {/* Play VI */}
                          <button
                            type="button"
                            disabled={isPlayingThis && playingLang === 'vi'}
                            onClick={() => handlePlayChunk(chunk, 'vi')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                              isPlayingThis && playingLang === 'vi'
                                ? 'bg-emerald-600 text-white'
                                : isViCached
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900'
                                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                            }`}
                            title="Nghe thử tiếng Việt (Google Cloud TTS)"
                          >
                            {isPlayingThis && playingLang === 'vi' ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            <span>VI {isViCached && '✓'}</span>
                          </button>

                          {/* Play Sequence EN -> VI */}
                          <button
                            type="button"
                            disabled={isPlayingThis && playingLang === 'sequence'}
                            onClick={() => handlePlayChunk(chunk, 'sequence')}
                            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer"
                            title="Nghe chuỗi song ngữ EN ➔ VI"
                          >
                            {isPlayingThis && playingLang === 'sequence' ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#DC2626]" />
                            ) : (
                              <Play className="w-4 h-4 fill-current text-zinc-700" />
                            )}
                          </button>

                          {/* Separator */}
                          <div className="h-4 w-px bg-zinc-200 mx-0.5 hidden sm:block" />

                          {/* Toggle Model & Language selector */}
                          <button
                            type="button"
                            onClick={() => setExpandedChunkVoiceConfig(prev => ({
                              ...prev,
                              [chunk.chunk_id]: !prev[chunk.chunk_id]
                            }))}
                            className={`p-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer inline-flex items-center gap-1 ${
                              isVoiceConfigOpen 
                                ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs' 
                                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200'
                            }`}
                            title="Chọn Model & Giọng đọc riêng cho câu này"
                          >
                            <SlidersHorizontal className="w-3 h-3" />
                            <span className="hidden sm:inline">Model</span>
                            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isVoiceConfigOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Regenerate EN Button */}
                          <button
                            type="button"
                            disabled={isRegeneratingThis}
                            onClick={() => handleRegenerateChunkAudio(chunk, 'en', undefined, undefined, selectedVoiceEn, selectedVoiceVi)}
                            className="px-2 py-1 rounded-xl bg-red-50 hover:bg-red-100 text-[#DC2626] border border-red-200 text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                            title="Tạo lại âm thanh tiếng Anh"
                          >
                            {isRegeneratingThis && regeneratingTarget === 'en' ? (
                              <Loader2 className="w-3 h-3 animate-spin text-[#DC2626]" />
                            ) : (
                              <Zap className="w-3 h-3 text-[#DC2626]" />
                            )}
                            <span>Tạo EN</span>
                          </button>

                          {/* Regenerate VI Button */}
                          <button
                            type="button"
                            disabled={isRegeneratingThis}
                            onClick={() => handleRegenerateChunkAudio(chunk, 'vi', undefined, undefined, selectedVoiceEn, selectedVoiceVi)}
                            className="px-2 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                            title="Tạo lại âm thanh tiếng Việt"
                          >
                            {isRegeneratingThis && regeneratingTarget === 'vi' ? (
                              <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                            ) : (
                              <Zap className="w-3 h-3 text-emerald-600" />
                            )}
                            <span>Tạo VI</span>
                          </button>

                          {/* Regenerate Both (EN + VI) Button */}
                          <button
                            type="button"
                            disabled={isRegeneratingThis}
                            onClick={() => handleRegenerateChunkAudio(chunk, 'both', undefined, undefined, selectedVoiceEn, selectedVoiceVi)}
                            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-amber-600 transition-colors cursor-pointer"
                            title="Tạo lại cả 2 tiếng (EN + VI)"
                          >
                            {isRegeneratingThis && regeneratingTarget === 'both' ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Model & Language Selector Bar */}
                      {isVoiceConfigOpen && (
                        <div className="mt-3 pt-3 border-t border-zinc-200/80 bg-zinc-50/90 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-fade-in shadow-2xs">
                          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                            {/* EN Voice Select */}
                            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase font-mono shrink-0">Model EN:</span>
                              <select
                                value={selectedVoiceEn}
                                onChange={(e) => setChunkVoiceEn(prev => ({ ...prev, [chunk.chunk_id]: e.target.value }))}
                                className="w-full text-xs font-semibold bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-[#DC2626] cursor-pointer"
                              >
                                {!englishModels.some(m => m.id === selectedVoiceEn) && <option value={selectedVoiceEn} disabled>{selectedVoiceEn} (unavailable)</option>}
                                <optgroup label="Deepgram Aura & Flux">
                                  {englishModels.filter(v => v.provider === 'DEEPGRAM').map(v => (
                                    <option key={v.id} value={v.id}>{getMinimalName(v)} • [{PROVIDERS_META[v.provider]?.shortName || v.provider}]</option>
                                  ))}
                                </optgroup>
                                <optgroup label="Google Cloud & Custom (EN)">
                                  {englishModels.filter(v => v.provider !== 'DEEPGRAM' && v.provider !== 'GEMINI_AI_STUDIO').map(v => (
                                    <option key={v.id} value={v.id}>{getMinimalName(v)} • [{PROVIDERS_META[v.provider]?.shortName || v.provider}]</option>
                                  ))}
                                </optgroup>
                                {englishModels.some(v => v.provider === 'GEMINI_AI_STUDIO') && (
                                  <optgroup label="Gemini Flash (Preview)">
                                    {englishModels.filter(v => v.provider === 'GEMINI_AI_STUDIO').map(v => (
                                      <option key={v.id} value={v.id}>{getMinimalName(v)} • [Gemini Flash Preview]</option>
                                    ))}
                                  </optgroup>
                                )}
                              </select>
                            </div>

                            {/* VI Voice Select */}
                            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase font-mono shrink-0">Model VI:</span>
                              <select
                                value={selectedVoiceVi}
                                onChange={(e) => setChunkVoiceVi(prev => ({ ...prev, [chunk.chunk_id]: e.target.value }))}
                                className="w-full text-xs font-semibold bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
                              >
                                {!vietnameseModels.some(m => m.id === selectedVoiceVi) && <option value={selectedVoiceVi} disabled>{selectedVoiceVi} (unavailable)</option>}
                                <optgroup label="Google Neural2, WaveNet & Standard (vi-VN)">
                                  {vietnameseModels.filter(v => !v.id.includes('Chirp')).map(v => (
                                    <option key={v.id} value={v.id}>{getMinimalName(v)} • [{PROVIDERS_META[v.provider]?.shortName || v.provider}]</option>
                                  ))}
                                </optgroup>
                                <optgroup label="Google Chirp3-HD Studio (vi-VN)">
                                  {vietnameseModels.filter(v => v.id.includes('Chirp')).map(v => (
                                    <option key={v.id} value={v.id}>{getMinimalName(v)} • [Chirp3-HD Studio]</option>
                                  ))}
                                </optgroup>
                              </select>
                            </div>
                          </div>

                          {/* Quick Generation Action Buttons inside panel */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={isRegeneratingThis}
                              onClick={() => handleRegenerateChunkAudio(chunk, 'en', undefined, undefined, selectedVoiceEn, selectedVoiceVi)}
                              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              {isRegeneratingThis && regeneratingTarget === 'en' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                              <span>Tạo EN</span>
                            </button>
                            <button
                              type="button"
                              disabled={isRegeneratingThis}
                              onClick={() => handleRegenerateChunkAudio(chunk, 'vi', undefined, undefined, selectedVoiceEn, selectedVoiceVi)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              {isRegeneratingThis && regeneratingTarget === 'vi' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                              <span>Tạo VI</span>
                            </button>
                            <button
                              type="button"
                              disabled={isRegeneratingThis}
                              onClick={() => handleRegenerateChunkAudio(chunk, 'both', undefined, undefined, selectedVoiceEn, selectedVoiceVi)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              {isRegeneratingThis && regeneratingTarget === 'both' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                              <span>Tạo Cả 2</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 7. Diagnostic Modal Integration                                    */}
      {/* ------------------------------------------------------------------ */}
      <AudioDiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
      />
    </div>
  );
};

export default AudioManagerView;
