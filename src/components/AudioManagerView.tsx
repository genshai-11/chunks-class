import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CohortAudioSettings, 
  CourseLevel, 
  Course, 
  LessonDoc, 
  ChunkItem,
  LanguageMode 
} from '../types';
import { 
  audioPlayer, 
  AudioProvider, 
  AudioSourceType, 
  AudioBatchTarget,
  GOOGLE_TTS_VOICES,
  sanitizeSpeechText 
} from '../services/googleTtsService';
import { DEEPGRAM_AURA_VOICES } from '../services/deepgramTtsService';
import { curriculumRegistry } from '../services/curriculumRegistry';
import { getAllLessons } from '../services/firestoreService';
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
  Info
} from 'lucide-react';

interface AudioManagerViewProps {
  cohortAudioSettings?: CohortAudioSettings;
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

interface BatchLogItem {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export const AudioManagerView: React.FC<AudioManagerViewProps> = ({
  cohortAudioSettings,
  onUpdateAudioSettings,
  onLaunchProjectorForLesson
}) => {
  // --------------------------------------------------------------------------
  // 1. Courses & Level Tab State
  // --------------------------------------------------------------------------
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseLevel, setSelectedCourseLevel] = useState<CourseLevel>('LEVEL_B_ERES');
  const [lessons, setLessons] = useState<LessonDoc[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState<boolean>(true);

  // --------------------------------------------------------------------------
  // 2. Audio Engine & Provider Configuration
  // --------------------------------------------------------------------------
  const [activeProvider, setActiveProvider] = useState<AudioProvider>(audioPlayer.getAudioProvider());
  const [activeSource, setActiveSource] = useState<AudioSourceType>(audioPlayer.getLastSource());
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState<boolean>(false);

  const [voiceProfileEn, setVoiceProfileEn] = useState<string>(
    cohortAudioSettings?.voice_profile_en || 'aura-asteria-en'
  );
  const [voiceProfileVi, setVoiceProfileVi] = useState<string>(
    cohortAudioSettings?.voice_profile_vi || 'vi-VN-Neural2-A'
  );

  // --------------------------------------------------------------------------
  // 3. Readiness Matrix & Lessons Status Cache
  // --------------------------------------------------------------------------
  const [statusList, setStatusList] = useState<LessonAudioStatus[]>([]);
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

  // --------------------------------------------------------------------------
  // 5. Batch Generator State & Concurrency Controls
  // --------------------------------------------------------------------------
  const [batchScope, setBatchScope] = useState<'current_lesson' | 'entire_course'>('current_lesson');
  const [batchTargetLessonId, setBatchTargetLessonId] = useState<string>('');
  const [batchTarget, setBatchTarget] = useState<AudioBatchTarget>('BOTH');
  const [batchWorkersCount, setBatchWorkersCount] = useState<number>(4);
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
    percentage: number;
    currentTask: string;
    successCount: number;
    failCount: number;
  }>({
    current: 0,
    total: 0,
    percentage: 0,
    currentTask: '',
    successCount: 0,
    failCount: 0
  });
  const [batchLogs, setBatchLogs] = useState<BatchLogItem[]>([]);
  const cancelBatchRef = useRef<boolean>(false);

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

  // Fetch lessons for the selected course level
  const loadLessons = useCallback(async () => {
    setIsLoadingLessons(true);
    try {
      const fetchedLessons = await getAllLessons(selectedCourseLevel);
      setLessons(fetchedLessons);
      if (fetchedLessons.length > 0) {
        setBatchTargetLessonId(fetchedLessons[0].id);
      }
    } catch (e) {
      console.error('Failed to load lessons for audio manager:', e);
    } finally {
      setIsLoadingLessons(false);
    }
  }, [selectedCourseLevel]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  // Recalculate readiness status map whenever lessons, voice profiles, or cache changes
  const calculateReadinessStatus = useCallback(() => {
    if (!lessons || lessons.length === 0) {
      setStatusList([]);
      return;
    }

    const calculated = lessons.map((lesson) => {
      const chunks = lesson.chunks || [];
      const status = audioPlayer.getLessonAudioStatus(chunks, voiceProfileEn, voiceProfileVi);
      const gcsCount = chunks.filter(c => Boolean(c.audio_url && c.audio_url.startsWith('http'))).length;
      const enPercent = chunks.length > 0 ? Math.round((status.enCached / chunks.length) * 100) : 0;
      const viPercent = chunks.length > 0 ? Math.round((status.viCached / chunks.length) * 100) : 0;

      return {
        lessonId: lesson.id,
        dayNumber: lesson.day_number,
        title: lesson.lesson_title || `Day ${lesson.day_number}`,
        totalChunks: chunks.length,
        enCached: status.enCached,
        viCached: status.viCached,
        gcsCount,
        enPercent,
        viPercent,
        isFullyCached: status.isFullyCached
      };
    });

    setStatusList(calculated);
  }, [lessons, voiceProfileEn, voiceProfileVi]);

  useEffect(() => {
    calculateReadinessStatus();
  }, [calculateReadinessStatus]);

  // Provider change handler
  const handleSwitchProvider = (provider: AudioProvider) => {
    setActiveProvider(provider);
    audioPlayer.setAudioProvider(provider);
    if (provider === 'DEEPGRAM_AURA') {
      setVoiceProfileEn('aura-asteria-en');
      onUpdateAudioSettings?.({
        ...(cohortAudioSettings || {
          language_mode: 'EN_THEN_VI',
          auto_advance_delay_sec: 0,
          default_speed: 1.0,
          repeat_count: 1
        }),
        voice_profile_en: 'aura-asteria-en',
        voice_profile_vi: voiceProfileVi,
        provider_primary: 'DEEPGRAM_AURA'
      });
    } else {
      setVoiceProfileEn('en-US-Journey-F');
      onUpdateAudioSettings?.({
        ...(cohortAudioSettings || {
          language_mode: 'EN_THEN_VI',
          auto_advance_delay_sec: 0,
          default_speed: 1.0,
          repeat_count: 1
        }),
        voice_profile_en: 'en-US-Journey-F',
        voice_profile_vi: voiceProfileVi,
        provider_primary: 'GOOGLE_TTS'
      });
    }
  };

  // Helper log function for batch engine
  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    setBatchLogs(prev => [
      { id: `${Date.now()}-${Math.random()}`, timestamp: timeStr, message, type },
      ...prev.slice(0, 99)
    ]);
  };

  // Single chunk audition handler
  const handlePlayChunk = async (chunk: ChunkItem, lang: 'en' | 'vi' | 'sequence') => {
    audioPlayer.stop();
    setPlayingChunkId(chunk.chunk_id);
    setPlayingLang(lang);

    try {
      if (lang === 'en') {
        await audioPlayer.playChunk(
          chunk.english,
          activeProvider === 'DEEPGRAM_AURA' ? null : chunk.audio_url,
          voiceProfileEn,
          1.0
        );
      } else if (lang === 'vi') {
        await audioPlayer.playChunk(
          chunk.vietnamese,
          null,
          voiceProfileVi,
          1.0
        );
      } else if (lang === 'sequence') {
        await audioPlayer.playBilingualSequence(
          chunk.english,
          chunk.vietnamese,
          'EN_THEN_VI',
          activeProvider === 'DEEPGRAM_AURA' ? null : chunk.audio_url,
          voiceProfileEn,
          voiceProfileVi,
          1.0,
          1
        );
      }
    } catch (e: any) {
      console.error('Audio audition error:', e);
    } finally {
      setPlayingChunkId(null);
      setPlayingLang(null);
      calculateReadinessStatus();
    }
  };

  // Single chunk regeneration handler
  const handleRegenerateSingleChunk = async (chunk: ChunkItem) => {
    setRegeneratingChunkId(chunk.chunk_id);
    try {
      await audioPlayer.prepareChunksAudio(
        [chunk],
        {
          voiceEn: voiceProfileEn,
          voiceVi: voiceProfileVi,
          provider: activeProvider,
          target: batchTarget,
          concurrency: 1
        }
      );
      addLog(`Tạo lại audio thành công cho chunk #${chunk.item_number}: "${chunk.english.slice(0, 30)}..."`, 'success');
      calculateReadinessStatus();
    } catch (err: any) {
      addLog(`Lỗi tạo audio cho chunk #${chunk.item_number}: ${err?.message || String(err)}`, 'error');
    } finally {
      setRegeneratingChunkId(null);
    }
  };

  // Start Batch Generation Engine
  const handleStartBatchGeneration = async (
    overrideScope?: 'current_lesson' | 'entire_course',
    overrideLessonId?: string
  ) => {
    if (isBatchRunning) return;

    const effectiveScope = overrideScope || batchScope;
    const effectiveLessonId = overrideLessonId || batchTargetLessonId;

    cancelBatchRef.current = false;
    setIsBatchRunning(true);
    setBatchLogs([]);

    let targetChunks: ChunkItem[] = [];
    let scopeDesc = '';

    if (effectiveScope === 'current_lesson') {
      const lesson = lessons.find(l => l.id === effectiveLessonId || String(l.day_number) === String(effectiveLessonId)) || lessons[0];
      if (!lesson || !lesson.chunks || lesson.chunks.length === 0) {
        addLog('Không tìm thấy chunk nào trong bài học được chọn.', 'error');
        setIsBatchRunning(false);
        return;
      }
      targetChunks = [...lesson.chunks];
      scopeDesc = `Day ${lesson.day_number} (${lesson.lesson_title}) - ${targetChunks.length} chunks`;
    } else {
      targetChunks = lessons.flatMap(l => l.chunks || []);
      scopeDesc = `Toàn bộ ${selectedCourseLevel} (${lessons.length} bài học) - ${targetChunks.length} chunks`;
    }

    const multiplier = batchTarget === 'BOTH' ? 2 : 1;
    const totalOperations = targetChunks.length * multiplier;

    setBatchProgress({
      current: 0,
      total: totalOperations,
      percentage: 0,
      currentTask: `Khởi tạo quy trình cho ${scopeDesc}...`,
      successCount: 0,
      failCount: 0
    });

    addLog(`Bắt đầu chạy Batch Generator: ${scopeDesc} | Engine: ${activeProvider} | Workers: ${batchWorkersCount}`, 'info');

    let processedCount = 0;
    let successCount = 0;
    let failCount = 0;
    let cursor = 0;

    const worker = async (workerId: number) => {
      while (cursor < targetChunks.length) {
        if (cancelBatchRef.current) {
          break;
        }

        const index = cursor++;
        const chunk = targetChunks[index];
        const cleanEn = sanitizeSpeechText(chunk.english);
        const cleanVi = chunk.vietnamese ? sanitizeSpeechText(chunk.vietnamese) : '';

        // Synthesize EN (Background synthesis directly into persistent IndexedDB cache)
        if (batchTarget === 'ENGLISH' || batchTarget === 'BOTH') {
          if (cancelBatchRef.current) break;
          try {
            await audioPlayer.synthesizeSingleChunk({
              text: cleanEn,
              language: 'en',
              voiceName: voiceProfileEn,
              provider: activeProvider,
              forceRegenerate: true
            });
            successCount++;
          } catch (e: any) {
            failCount++;
            addLog(`[Worker ${workerId}] Lỗi EN (#${chunk.item_number}): ${e?.message || 'Failed'}`, 'warning');
          }
          processedCount++;
          const percent = Math.round((processedCount / totalOperations) * 100);
          setBatchProgress(prev => ({
            ...prev,
            current: processedCount,
            percentage: Math.min(100, percent),
            currentTask: `Worker ${workerId} -> EN: "${cleanEn.slice(0, 24)}..."`,
            successCount,
            failCount
          }));
        }

        // Synthesize VI (Background synthesis directly into persistent IndexedDB cache)
        if ((batchTarget === 'VIETNAMESE' || batchTarget === 'BOTH') && cleanVi) {
          if (cancelBatchRef.current) break;
          try {
            await audioPlayer.synthesizeSingleChunk({
              text: cleanVi,
              language: 'vi',
              voiceName: voiceProfileVi,
              provider: 'GOOGLE_TTS',
              forceRegenerate: true
            });
            successCount++;
          } catch (e: any) {
            failCount++;
            addLog(`[Worker ${workerId}] Lỗi VI (#${chunk.item_number}): ${e?.message || 'Failed'}`, 'warning');
          }
          processedCount++;
          const percent = Math.round((processedCount / totalOperations) * 100);
          setBatchProgress(prev => ({
            ...prev,
            current: processedCount,
            percentage: Math.min(100, percent),
            currentTask: `Worker ${workerId} -> VI: "${cleanVi.slice(0, 24)}..."`,
            successCount,
            failCount
          }));
        }

        // Periodic UI update
        if (index % 3 === 0 || cursor >= targetChunks.length) {
          calculateReadinessStatus();
        }
      }
    };

    try {
      const workers = Array.from(
        { length: Math.min(batchWorkersCount, targetChunks.length) },
        (_, i) => worker(i + 1)
      );
      await Promise.all(workers);

      calculateReadinessStatus();

      if (cancelBatchRef.current) {
        addLog(`Đã dừng Batch Generator theo yêu cầu của người dùng. (Đã xử lý: ${processedCount}/${totalOperations})`, 'warning');
      } else {
        addLog(`🎉 Hoàn tất Batch Audio cho ${scopeDesc}! Thành công: ${successCount}, Lỗi: ${failCount}`, 'success');
      }
    } catch (err: any) {
      addLog(`Lỗi xử lý batch: ${err?.message || String(err)}`, 'error');
    } finally {
      setIsBatchRunning(false);
      calculateReadinessStatus();
      setBatchProgress(prev => ({
        ...prev,
        currentTask: cancelBatchRef.current ? 'Đã hủy quy trình' : 'Đã hoàn tất xử lý batch'
      }));
    }
  };

  const handleStopBatchGeneration = () => {
    cancelBatchRef.current = true;
    addLog('Đang gửi lệnh dừng đến các luồng worker...', 'warning');
  };

  // --------------------------------------------------------------------------
  // Summary Metrics Computation
  // --------------------------------------------------------------------------
  const totalChunksInLevel = statusList.reduce((sum, s) => sum + s.totalChunks, 0);
  const totalEnCached = statusList.reduce((sum, s) => sum + s.enCached, 0);
  const totalViCached = statusList.reduce((sum, s) => sum + s.viCached, 0);
  const totalGcsMaster = statusList.reduce((sum, s) => sum + s.gcsCount, 0);

  const overallEnPercent = totalChunksInLevel > 0 ? Math.round((totalEnCached / totalChunksInLevel) * 100) : 0;
  const overallViPercent = totalChunksInLevel > 0 ? Math.round((totalViCached / totalChunksInLevel) * 100) : 0;
  const overallGcsPercent = totalChunksInLevel > 0 ? Math.round((totalGcsMaster / totalChunksInLevel) * 100) : 0;

  // Filter lessons in table
  const filteredLessons = statusList.filter(l => {
    const matchesSearch = 
      searchFilter === '' ||
      l.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      `day ${l.dayNumber}`.includes(searchFilter.toLowerCase()) ||
      l.lessonId.toLowerCase().includes(searchFilter.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ready') return l.isFullyCached;
    if (statusFilter === 'missing') return !l.isFullyCached;
    if (statusFilter === 'has_gcs') return l.gcsCount > 0;
    return true;
  });

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

          {/* Running Indicator */}
          {isBatchRunning && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-bold animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
              <span>Đang xử lý {batchWorkersCount} luồng...</span>
            </div>
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
              3. Giọng Tiếng Anh ({activeProvider === 'DEEPGRAM_AURA' ? 'Deepgram' : 'Google'})
            </label>
            <select
              value={voiceProfileEn}
              disabled={isBatchRunning}
              onChange={(e) => {
                setVoiceProfileEn(e.target.value);
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
              {activeProvider === 'DEEPGRAM_AURA' ? (
                DEEPGRAM_AURA_VOICES.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.gender})
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
            <div className="mt-2 text-[11px] text-zinc-400 font-mono truncate">
              ID: {voiceProfileEn}
            </div>
          </div>

          {/* Vietnamese Voice Profile */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              4. Giọng Tiếng Việt (Google Cloud)
            </label>
            <select
              value={voiceProfileVi}
              disabled={isBatchRunning}
              onChange={(e) => {
                setVoiceProfileVi(e.target.value);
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
              {GOOGLE_TTS_VOICES.filter(v => v.languageCode === 'vi-VN').map(v => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>

            {/* Action Buttons Row */}
            <div className="mt-2.5 flex items-center gap-2">
              {!isBatchRunning ? (
                <button
                  type="button"
                  onClick={handleStartBatchGeneration}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Bắt Đầu Tạo Audio</span>
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

        {/* Live Progress Bar and Stats */}
        {isBatchRunning && (
          <div className="p-4 bg-zinc-900 text-white rounded-xl space-y-2 font-mono text-xs animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 truncate max-w-md">
                {batchProgress.currentTask}
              </span>
              <span className="text-[#DC2626] font-bold text-sm">
                {batchProgress.percentage}% ({batchProgress.current} / {batchProgress.total})
              </span>
            </div>

            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#DC2626] h-full transition-all duration-200"
                style={{ width: `${batchProgress.percentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
              <span>Đã hoàn thành: <b className="text-emerald-400">{batchProgress.successCount}</b></span>
              <span>Lỗi / Cần thử lại: <b className="text-rose-400">{batchProgress.failCount}</b></span>
              <span>Workers đang chạy: <b className="text-amber-400">{batchWorkersCount}</b></span>
            </div>
          </div>
        )}

        {/* Live Log Console (Show when logs exist) */}
        {batchLogs.length > 0 && (
          <div className="p-3 bg-zinc-950 text-zinc-200 rounded-xl border border-zinc-800 font-mono text-[11px] max-h-36 overflow-y-auto space-y-1">
            <div className="text-zinc-500 font-bold border-b border-zinc-800 pb-1 mb-1 flex items-center justify-between">
              <span>Bảng Nhật Ký Hoạt Động (Live Activity Console)</span>
              <button 
                onClick={() => setBatchLogs([])} 
                className="text-zinc-500 hover:text-zinc-300 text-[10px]"
              >
                Xóa Log
              </button>
            </div>
            {batchLogs.map(log => (
              <div key={log.id} className="flex items-start gap-2">
                <span className="text-zinc-600 shrink-0">[{log.timestamp}]</span>
                <span className={
                  log.type === 'success' ? 'text-emerald-400' :
                  log.type === 'warning' ? 'text-amber-400' :
                  log.type === 'error' ? 'text-rose-400' : 'text-zinc-300'
                }>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
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
                <th className="py-3 px-4 w-60 text-center">Thao Tác</th>
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
                filteredLessons.map((item) => {
                  const lessonDoc = lessons.find(l => l.id === item.lessonId);
                  const isEn100 = item.enPercent === 100 && item.totalChunks > 0;
                  const isVi100 = item.viPercent === 100 && item.totalChunks > 0;

                  return (
                    <tr
                      key={item.lessonId}
                      className="hover:bg-zinc-50/80 transition-colors group cursor-pointer"
                      onClick={() => lessonDoc && setInspectingLesson(lessonDoc)}
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
                        <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                          item.gcsCount > 0 ? 'bg-blue-50 text-blue-700' : 'text-zinc-400'
                        }`}>
                          {item.gcsCount > 0 ? `${item.gcsCount} files` : '—'}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Audition First Chunk */}
                          <button
                            type="button"
                            onClick={() => {
                              if (lessonDoc && lessonDoc.chunks?.[0]) {
                                handlePlayChunk(lessonDoc.chunks[0], 'en');
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                            title="Nghe thử chunk đầu tiên"
                          >
                            <Volume2 className="w-3 h-3 text-[#DC2626]" />
                            <span>Nghe Thử</span>
                          </button>

                          {/* Regenerate This Lesson */}
                          <button
                            type="button"
                            disabled={isBatchRunning}
                            onClick={() => {
                              setBatchScope('current_lesson');
                              setBatchTargetLessonId(item.lessonId);
                              handleStartBatchGeneration('current_lesson', item.lessonId);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                            title="Tạo lại toàn bộ audio cho bài này"
                          >
                            <Zap className="w-3 h-3 text-amber-600" />
                            <span>Tạo Lại</span>
                          </button>

                          {/* Inspect Chunks Drawer */}
                          <button
                            type="button"
                            onClick={() => lessonDoc && setInspectingLesson(lessonDoc)}
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
                  <h3 className="font-display font-bold text-lg text-zinc-900">
                    {inspectingLesson.lesson_title}
                  </h3>
                  <div className="text-xs text-zinc-500 font-mono mt-0.5">
                    ID: {inspectingLesson.id} • Tổng: {inspectingLesson.chunks?.length || 0} Chunks
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isBatchRunning}
                  onClick={() => {
                    handleStartBatchGeneration('current_lesson', inspectingLesson.id);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  title="Tạo lại audio cho riêng bài học này"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tạo Lại Audio (Day {inspectingLesson.day_number})</span>
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
                  onClick={() => setInspectingLesson(null)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

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
                  const isEnCached = audioPlayer.getLessonAudioStatus([chunk], voiceProfileEn, voiceProfileVi).enCached > 0;
                  const isViCached = audioPlayer.getLessonAudioStatus([chunk], voiceProfileEn, voiceProfileVi).viCached > 0;

                  return (
                    <div
                      key={chunk.chunk_id}
                      className="pt-3 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 rounded-xl hover:bg-zinc-50 transition-colors"
                    >
                      {/* Left: Text & Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                            #{chunk.item_number}
                          </span>
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-200/80 text-zinc-700">
                            {chunk.category || 'vocab'}
                          </span>
                          {chunk.audio_url && (
                            <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                              GCS Master
                            </span>
                          )}
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
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Play EN */}
                        <button
                          type="button"
                          disabled={isPlayingThis && playingLang === 'en'}
                          onClick={() => handlePlayChunk(chunk, 'en')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
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
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                            isPlayingThis && playingLang === 'vi'
                              ? 'bg-emerald-600 text-white'
                              : isViCached
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                          }`}
                          title="Nghe thử tiếng Việt (Google Neural2)"
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

                        {/* Single Chunk Regenerate */}
                        <button
                          type="button"
                          disabled={isRegeneratingThis}
                          onClick={() => handleRegenerateSingleChunk(chunk)}
                          className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-[#DC2626] transition-colors cursor-pointer"
                          title="Tạo lại âm thanh cho chunk này"
                        >
                          {isRegeneratingThis ? (
                            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                          ) : (
                            <Zap className="w-4 h-4" />
                          )}
                        </button>
                      </div>
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
