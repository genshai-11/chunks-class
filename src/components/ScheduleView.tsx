import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Cohort, ClassSession, CohortAudioSettings, ChunkItem, LessonDoc, CourseLevel } from '../types';
import { exportScheduleAsICS, calculate15Sessions, resolveCourseIdFromLevel } from '../utils/scheduler';
import { curriculumRegistry } from '../services/curriculumRegistry';
import { getAllLessons, deleteFirestoreCohort } from '../services/firestoreService';
import { audioPlayer, AudioProvider } from '../services/googleTtsService';
import { modelRegistryService } from '../services/modelRegistryService';
import { sanitizeSpeechText } from '../services/deepgramTtsService';
import { syncLessonCachedAudioToCloud } from '../services/cloudAudioStorageService';
import { ScheduleAudioSettingsModal } from './ScheduleAudioSettingsModal';
import { 
  Play, 
  Calendar, 
  Clock, 
  Download, 
  ArrowUpRight, 
  CheckCircle2, 
  Edit3, 
  X, 
  Check, 
  Volume2, 
  VolumeX, 
  Zap, 
  RotateCcw, 
  Settings, 
  ChevronDown, 
  Loader2, 
  AlertCircle,
  Activity,
  Headphones,
  Trash2,
  CloudUpload
} from 'lucide-react';

interface ScheduleViewProps {
  cohort: Cohort;
  onUpdateCohort: (updated: Cohort) => void;
  onLaunchProjectorForLesson: (lessonId: string, sessionNumber: number) => void;
  onOpenCreateCohort: () => void;
  onDeleteCohort?: (cohortId: string) => void;
}

export interface SessionAudioStatus {
  isReady: boolean;
  total: number;
  cached: number;
  percent: number;
}

/**
 * Synchronously compute audio baseline status without blocking IndexedDB.
 * Checks for permanent GCS audio URLs or already cached audio in audioPlayer memory.
 */
export const computeBaselineStatus = (
  session: ClassSession,
  chunks: ChunkItem[],
  voiceEn: string
): SessionAudioStatus => {
  const total = chunks.length;
  if (total === 0) {
    return { isReady: false, total: 0, cached: 0, percent: 0 };
  }
  let readyCount = 0;
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const hasGcs = Boolean(c.audio_url && c.audio_url.startsWith('http') && !c.audio_url.includes('placeholder'));
    const isCached = audioPlayer.hasCachedAudio(c.english, voiceEn);
    if (hasGcs || isCached) {
      readyCount++;
    }
  }
  const percent = Math.round((readyCount / total) * 100);
  return {
    isReady: readyCount === total,
    total,
    cached: readyCount,
    percent
  };
};

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  cohort,
  onUpdateCohort,
  onLaunchProjectorForLesson,
  onOpenCreateCohort,
  onDeleteCohort
}) => {
  const [editingSessionNumber, setEditingSessionNumber] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'in_progress' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  
  // Cohort Settings Editor Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>(cohort.title);
  const [editTeacherId, setEditTeacherId] = useState<string>(cohort.teacher_id || 'teacher_genshai');
  const [editCourseId, setEditCourseId] = useState<string>(cohort.course_id || resolveCourseIdFromLevel(cohort.level_code) || 'course_level_b');
  const [editLevelCode, setEditLevelCode] = useState<CourseLevel | string>(cohort.level_code || 'LEVEL_B');
  const [editTotalSessions, setEditTotalSessions] = useState<number>(cohort.total_sessions || cohort.sessions?.length || 30);
  const [editStartDate, setEditStartDate] = useState<string>(cohort.start_date || '2026-09-01');
  const [editDays, setEditDays] = useState<string[]>(cohort.schedule_pattern?.days_of_week || ['Mon', 'Wed', 'Fri']);
  const [editStartTime, setEditStartTime] = useState<string>(cohort.schedule_pattern?.start_time || '19:30');
  const [editEndTime, setEditEndTime] = useState<string>(cohort.schedule_pattern?.end_time || '21:00');
  const [isDeletingCohort, setIsDeletingCohort] = useState<boolean>(false);

  useEffect(() => {
    setEditTitle(cohort.title || '');
    setEditTeacherId(cohort.teacher_id || 'teacher_genshai');
    setEditCourseId(cohort.course_id || resolveCourseIdFromLevel(cohort.level_code) || 'course_level_b');
    setEditLevelCode(cohort.level_code || 'LEVEL_B');
    setEditTotalSessions(cohort.total_sessions || cohort.sessions?.length || 30);
    setEditStartDate(cohort.start_date || '2026-09-01');
    setEditDays(cohort.schedule_pattern?.days_of_week || ['Mon', 'Wed', 'Fri']);
    setEditStartTime(cohort.schedule_pattern?.start_time || '19:30');
    setEditEndTime(cohort.schedule_pattern?.end_time || '21:00');
  }, [cohort]);

  // Audio Settings Modal & Audio Readiness State
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState<boolean>(false);
  const [isLoadingAudioStatus, setIsLoadingAudioStatus] = useState<boolean>(false);
  const [liveLessons, setLiveLessons] = useState<Record<string, LessonDoc>>({});
  const liveLessonsRef = useRef<Record<string, LessonDoc>>({});
  const progressiveCheckRef = useRef<number>(0);

  const getVoiceEn = useCallback(() => {
    return cohort.audio_settings?.voice_profile_en || 
      cohort.audio_settings?.voice_profile_primary || 
      modelRegistryService.getMainModelEn() || 
      'flux-cliff-en';
  }, [cohort.audio_settings]);

  // Synchronous zero-latency baseline initialization on mount
  const [sessionAudioStatus, setSessionAudioStatus] = useState<Record<number, SessionAudioStatus>>(() => {
    const initial: Record<number, SessionAudioStatus> = {};
    const voiceEn = cohort.audio_settings?.voice_profile_en || 
      cohort.audio_settings?.voice_profile_primary || 
      modelRegistryService.getMainModelEn() || 
      'flux-cliff-en';
    for (const session of cohort?.sessions || []) {
      const lesson = curriculumRegistry.getLessonById(session.lesson_id);
      const chunks = lesson?.chunks || [];
      initial[session.session_number] = computeBaselineStatus(session, chunks, voiceEn);
    }
    return initial;
  });

  // Quick Action Generation & Progress State
  const [generatingSessionNumber, setGeneratingSessionNumber] = useState<number | null>(null);
  const [isSyncingCloudSessionNumber, setIsSyncingCloudSessionNumber] = useState<number | null>(null);
  const [isSyncingAllCloud, setIsSyncingAllCloud] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number; percentage: number }>({
    current: 0,
    total: 0,
    percentage: 0
  });
  const cancelGenerationRef = useRef<boolean>(false);
  const [activeActionMenuSession, setActiveActionMenuSession] = useState<number | null>(null);

  // Toast notifications
  const [toast, setToast] = useState<{ type: 'success' | 'info' | 'error' | 'warning'; message: string } | null>(null);
  const showToast = useCallback((type: 'success' | 'info' | 'error' | 'warning', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Close quick action dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => setActiveActionMenuSession(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Bounded & progressive audio checking across sessions (does not lock IndexedDB)
  const runProgressiveAudioCheck = useCallback(async (
    checkId: number,
    customLessons?: Record<string, LessonDoc>
  ) => {
    const sessionsList = cohort?.sessions || [];
    if (sessionsList.length === 0) return;

    setIsLoadingAudioStatus(true);
    const voiceEn = getVoiceEn();

    try {
      const allCachedKeys = await audioPlayer.getAllCachedKeys();

      const cleanCachedTexts = new Set<string>();
      for (const k of allCachedKeys) {
        const idx = k.indexOf('::');
        if (idx !== -1) {
          cleanCachedTexts.add(k.substring(idx + 2).trim().toLowerCase());
        } else {
          cleanCachedTexts.add(k.trim().toLowerCase());
        }
      }

      for (const session of sessionsList) {
        if (progressiveCheckRef.current !== checkId) return;

        const lesson = (customLessons && customLessons[session.lesson_id]) || 
          liveLessonsRef.current[session.lesson_id] || 
          curriculumRegistry.getLessonById(session.lesson_id);
        const chunks = lesson?.chunks || [];
        const total = chunks.length;

        if (total === 0) {
          setSessionAudioStatus(prev => ({
            ...prev,
            [session.session_number]: { isReady: false, total: 0, cached: 0, percent: 0 }
          }));
          continue;
        }

        let readyCount = 0;
        for (let i = 0; i < chunks.length; i++) {
          const c = chunks[i];
          const clean = sanitizeSpeechText(c.english).trim().toLowerCase();
          const rawLower = (c.english || '').trim().toLowerCase();
          const hasGcs = Boolean(c.audio_url && c.audio_url.startsWith('http') && !c.audio_url.includes('placeholder'));
          const { keys: candidateKeys } = audioPlayer.getLookupCandidateKeys(c.english, voiceEn);
          const isCached = hasGcs || 
            audioPlayer.hasCachedAudio(c.english, voiceEn) || 
            candidateKeys.some(k => allCachedKeys.has(k)) ||
            cleanCachedTexts.has(clean) ||
            cleanCachedTexts.has(rawLower);
          if (isCached) readyCount++;
        }

        const percent = Math.round((readyCount / total) * 100);
        setSessionAudioStatus(prev => ({
          ...prev,
          [session.session_number]: {
            isReady: readyCount === total,
            total,
            cached: readyCount,
            percent
          }
        }));
      }
    } catch (err) {
      console.warn('[ScheduleView] Progressive audio check error:', err);
    } finally {
      if (progressiveCheckRef.current === checkId) {
        setIsLoadingAudioStatus(false);
      }
    }
  }, [cohort.sessions, getVoiceEn]);

  const refreshAudioStatuses = useCallback(() => {
    progressiveCheckRef.current++;
    runProgressiveAudioCheck(progressiveCheckRef.current);
  }, [runProgressiveAudioCheck]);

  // Recalculate baseline immediately when cohort sessions or audio settings change, then run progressive check
  useEffect(() => {
    const voiceEn = getVoiceEn();
    const baseline: Record<number, SessionAudioStatus> = {};
    for (const session of cohort?.sessions || []) {
      const lesson = liveLessonsRef.current[session.lesson_id] || curriculumRegistry.getLessonById(session.lesson_id);
      const chunks = lesson?.chunks || [];
      baseline[session.session_number] = computeBaselineStatus(session, chunks, voiceEn);
    }
    setSessionAudioStatus(baseline);

    progressiveCheckRef.current++;
    runProgressiveAudioCheck(progressiveCheckRef.current);
  }, [cohort.id, cohort.sessions?.length, cohort.audio_settings]);

  // Fetch live lessons from Firestore for the cohort's level
  useEffect(() => {
    let cancelled = false;
    const fetchLiveLessons = async () => {
      if (!cohort?.level_code) return;
      try {
        const firestoreLessons = await getAllLessons(cohort.level_code);
        if (cancelled || !firestoreLessons?.length) return;

        const lessonMap: Record<string, LessonDoc> = {};
        for (const l of firestoreLessons) {
          lessonMap[l.id] = l;
          curriculumRegistry.updateLesson(l);
        }
        liveLessonsRef.current = { ...liveLessonsRef.current, ...lessonMap };
        setLiveLessons(prev => ({ ...prev, ...lessonMap }));

        const voiceEn = getVoiceEn();
        setSessionAudioStatus(prev => {
          const updated = { ...prev };
          for (const session of cohort.sessions || []) {
            const lesson = lessonMap[session.lesson_id] || curriculumRegistry.getLessonById(session.lesson_id);
            const chunks = lesson?.chunks || [];
            updated[session.session_number] = computeBaselineStatus(session, chunks, voiceEn);
          }
          return updated;
        });

        progressiveCheckRef.current++;
        runProgressiveAudioCheck(progressiveCheckRef.current, lessonMap);
      } catch (err) {
        console.warn('[ScheduleView] Failed to fetch live lessons from Firestore:', err);
      }
    };

    fetchLiveLessons();
    return () => { cancelled = true; };
  }, [cohort.id, cohort.level_code]);

  // Check single session audio status after quick batch generation
  const checkSingleSessionAudio = async (session: ClassSession) => {
    const lesson = liveLessonsRef.current[session.lesson_id] || liveLessons[session.lesson_id] || curriculumRegistry.getLessonById(session.lesson_id);
    const chunks = lesson?.chunks || [];
    const total = chunks.length;
    if (total === 0) return;

    const voiceEn = getVoiceEn();

    try {
      const allCachedKeys = await audioPlayer.getAllCachedKeys();
      const cleanCachedTexts = new Set<string>();
      for (const k of allCachedKeys) {
        const idx = k.indexOf('::');
        if (idx !== -1) {
          cleanCachedTexts.add(k.substring(idx + 2).trim().toLowerCase());
        } else {
          cleanCachedTexts.add(k.trim().toLowerCase());
        }
      }

      let readyCount = 0;
      for (let i = 0; i < chunks.length; i++) {
        const c = chunks[i];
        const clean = sanitizeSpeechText(c.english).trim().toLowerCase();
        const rawLower = (c.english || '').trim().toLowerCase();
        const hasGcs = Boolean(c.audio_url && c.audio_url.startsWith('http') && !c.audio_url.includes('placeholder'));
        const { keys: candidateKeys } = audioPlayer.getLookupCandidateKeys(c.english, voiceEn);
        const isCached = hasGcs || 
          audioPlayer.hasCachedAudio(c.english, voiceEn) || 
          candidateKeys.some(k => allCachedKeys.has(k)) ||
          cleanCachedTexts.has(clean) ||
          cleanCachedTexts.has(rawLower);
        if (isCached) readyCount++;
      }

      const percent = Math.round((readyCount / total) * 100);
      setSessionAudioStatus(prev => ({
        ...prev,
        [session.session_number]: {
          isReady: readyCount === total,
          total,
          cached: readyCount,
          percent
        }
      }));
    } catch (err) {
      console.warn(`Failed to check audio for single session ${session.session_number}:`, err);
    }
  };

  // Quick Action Synthesis Handler with concurrent worker pool (4 workers)
  const handleQuickGenerateAudio = async (
    session: ClassSession,
    mode: 'missing_only' | 'en_only' | 'force_overwrite'
  ) => {
    const lesson = liveLessons[session.lesson_id] || curriculumRegistry.getLessonById(session.lesson_id);
    const chunks = lesson?.chunks || [];
    if (chunks.length === 0) {
      showToast('error', `Bài học "${session.lesson_title}" không có câu nào.`);
      return;
    }

    const voiceEn = getVoiceEn();
    const voiceVi = cohort.audio_settings?.voice_profile_vi || 
      cohort.audio_settings?.voice_profile_secondary || 
      modelRegistryService.getMainModelVi() || 
      'vi-VN-Neural2-A';

    const provider: AudioProvider = (voiceEn.startsWith('aura-') || voiceEn.startsWith('flux-')) 
      ? 'DEEPGRAM_AURA' 
      : 'GOOGLE_TTS';

    let targetChunks = chunks;

    if (mode === 'missing_only') {
      targetChunks = chunks.filter((c) => {
        const hasGcs = Boolean(c.audio_url && c.audio_url.startsWith('http') && !c.audio_url.includes('placeholder'));
        const isReady = hasGcs || audioPlayer.hasCachedAudio(c.english, voiceEn);
        return !isReady;
      });

      if (targetChunks.length === 0) {
        showToast('success', `Session ${session.session_number}: Tất cả ${chunks.length} câu đều đã có audio sẵn sàng!`);
        return;
      }
    }

    const total = targetChunks.length;
    setGeneratingSessionNumber(session.session_number);
    setGenerationProgress({ current: 0, total, percentage: 0 });
    cancelGenerationRef.current = false;

    const forceRegenerate = mode === 'force_overwrite';
    const concurrency = 4;
    let nextIdx = 0;
    let completed = 0;

    const worker = async () => {
      while (nextIdx < targetChunks.length) {
        if (cancelGenerationRef.current) break;
        const chunk = targetChunks[nextIdx++];
        const cleanEn = sanitizeSpeechText(chunk.english);
        if (cleanEn) {
          try {
            await audioPlayer.synthesizeSingleChunk({
              text: cleanEn,
              language: 'en',
              voiceName: voiceEn,
              forceRegenerate,
              provider
            });
          } catch (err) {
            console.warn(`[QuickAudio] Lỗi phát âm "${cleanEn.slice(0, 25)}":`, err);
          }
        }
        completed++;
        const pct = Math.round((completed / total) * 100);
        setGenerationProgress({ current: completed, total, percentage: pct });
      }
    };

    const workers = Array.from({ length: Math.min(total, concurrency) }, () => worker());
    await Promise.all(workers);

    if (cancelGenerationRef.current) {
      showToast('info', `Đã hủy tạo audio cho Session ${session.session_number}.`);
    } else {
      showToast('info', `Đang lưu audio Session ${session.session_number} lên Cloud Storage...`);
      if (lesson) {
        try {
          const syncRes = await syncLessonCachedAudioToCloud(lesson, {
            voiceEn,
            voiceVi: cohort.audio_settings?.voice_profile_vi || 'vi-VN-Neural2-A',
            target: 'BOTH'
          });
          if (syncRes.updatedChunks && syncRes.updatedChunks.length > 0) {
            const updatedLesson = { ...lesson, chunks: syncRes.updatedChunks };
            liveLessonsRef.current[session.lesson_id] = updatedLesson;
            setLiveLessons(prev => ({ ...prev, [session.lesson_id]: updatedLesson }));
          }
        } catch (syncErr) {
          console.warn('[QuickAudio] Lỗi đồng bộ audio lên cloud:', syncErr);
        }
      }
      showToast('success', `✓ Đã tạo xong & đồng bộ thành công Session ${session.session_number} lên Cloud Storage!`);
    }

    await checkSingleSessionAudio(session);
    setGeneratingSessionNumber(null);
  };

  const handleSyncSessionToCloud = async (session: ClassSession) => {
    const lesson = liveLessonsRef.current[session.lesson_id] || liveLessons[session.lesson_id] || curriculumRegistry.getLessonById(session.lesson_id);
    if (!lesson || !lesson.chunks || lesson.chunks.length === 0) {
      showToast('error', `Bài học "${session.lesson_title}" không có câu nào.`);
      return;
    }

    const voiceEn = getVoiceEn();
    const voiceVi = cohort.audio_settings?.voice_profile_vi || 
      cohort.audio_settings?.voice_profile_secondary || 
      modelRegistryService.getMainModelVi() || 
      'vi-VN-Neural2-A';

    setIsSyncingCloudSessionNumber(session.session_number);
    showToast('info', `Đang đồng bộ audio Session ${session.session_number} lên Cloud Storage...`);

    try {
      const res = await syncLessonCachedAudioToCloud(lesson, {
        voiceEn,
        voiceVi,
        target: 'BOTH'
      });
      if (res.updatedChunks && res.updatedChunks.length > 0) {
        const updatedLesson = { ...lesson, chunks: res.updatedChunks };
        liveLessonsRef.current[session.lesson_id] = updatedLesson;
        setLiveLessons(prev => ({ ...prev, [session.lesson_id]: updatedLesson }));
      }
      await checkSingleSessionAudio(session);
      if (res.uploadedEn + res.uploadedVi === 0) {
        showToast('info', 'Buổi học này chưa có audio mới trong cache để đồng bộ (hoặc tất cả câu đã có link Cloud).');
      } else {
        showToast('success', `✓ Đã đồng bộ ${res.uploadedEn + res.uploadedVi} audio chunks lên Cloud Storage!`);
      }
    } catch (err: any) {
      console.error('[ScheduleView] Cloud sync error:', err);
      showToast('error', `Lỗi đồng bộ Cloud: ${err?.message || 'Không xác định'}`);
    } finally {
      setIsSyncingCloudSessionNumber(null);
    }
  };

  const handleSyncAllCachedSessionsToCloud = async () => {
    const sessionsWithAudio = (cohort.sessions || []).filter(s => (sessionAudioStatus[s.session_number]?.cached || 0) > 0);
    if (sessionsWithAudio.length === 0) {
      showToast('warning', 'Không có buổi học nào có audio trong cache để tải lên. Vui lòng bấm Tạo Audio trước.');
      return;
    }

    setIsSyncingAllCloud(true);
    const voiceEn = getVoiceEn();
    const voiceVi = cohort.audio_settings?.voice_profile_vi || 
      cohort.audio_settings?.voice_profile_secondary || 
      modelRegistryService.getMainModelVi() || 
      'vi-VN-Neural2-A';

    let totalUploaded = 0;
    try {
      for (let idx = 0; idx < sessionsWithAudio.length; idx++) {
        const s = sessionsWithAudio[idx];
        const lesson = liveLessonsRef.current[s.lesson_id] || liveLessons[s.lesson_id] || curriculumRegistry.getLessonById(s.lesson_id);
        if (!lesson || !lesson.chunks || lesson.chunks.length === 0) {
          continue;
        }

        showToast('info', `Đang tải lên Cloud buổi ${s.session_number} (${idx + 1}/${sessionsWithAudio.length})...`);
        const res = await syncLessonCachedAudioToCloud(lesson, {
          voiceEn,
          voiceVi,
          target: 'BOTH'
        });

        if (res.updatedChunks && res.updatedChunks.length > 0) {
          const updatedLesson = { ...lesson, chunks: res.updatedChunks };
          liveLessonsRef.current[s.lesson_id] = updatedLesson;
          setLiveLessons(prev => ({ ...prev, [s.lesson_id]: updatedLesson }));
        }

        await checkSingleSessionAudio(s);
        totalUploaded += (res.uploadedEn + res.uploadedVi);
      }

      showToast('success', `✓ Đã hoàn tất đồng bộ Cloud! Đã tải lên ${totalUploaded} audio chunks qua ${sessionsWithAudio.length} buổi học.`);
    } catch (err: any) {
      console.error('[ScheduleView] Sync all cloud error:', err);
      showToast('error', `Lỗi đồng bộ Cloud hàng loạt: ${err?.message || 'Không xác định'}`);
    } finally {
      setIsSyncingAllCloud(false);
    }
  };

  const handleSaveAudioSettings = (newSettings: CohortAudioSettings) => {
    const updatedCohort: Cohort = {
      ...cohort,
      audio_settings: newSettings,
      updated_at: new Date().toISOString()
    };
    onUpdateCohort(updatedCohort);
    showToast('success', '✓ Đã cập nhật cấu hình Audio thành công!');
    refreshAudioStatuses();
  };

  const toggleEditDay = (day: string) => {
    if (editDays.includes(day)) {
      if (editDays.length > 1) {
        setEditDays(editDays.filter(d => d !== day));
      }
    } else {
      setEditDays([...editDays, day]);
    }
  };

  const handleSaveCohortSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const newSessions = calculate15Sessions(
      editLevelCode,
      editStartDate,
      editDays,
      editStartTime,
      editEndTime,
      [],
      editTotalSessions
    );

    // Preserve existing session statuses (completed/in_progress)
    const mergedSessions = newSessions.map((newS) => {
      const existing = (cohort.sessions || []).find(s => s.session_number === newS.session_number);
      if (existing) {
        return {
          ...newS,
          status: existing.status,
          notes: existing.notes || newS.notes
        };
      }
      return newS;
    });

    const updatedCohort: Cohort = {
      ...cohort,
      title: editTitle.trim() || cohort.title,
      teacher_id: editTeacherId.trim() || cohort.teacher_id || 'teacher_genshai',
      course_id: editCourseId,
      level_code: editLevelCode as CourseLevel,
      total_sessions: editTotalSessions,
      start_date: editStartDate,
      schedule_pattern: {
        days_of_week: editDays,
        start_time: editStartTime,
        end_time: editEndTime,
        duration_minutes: 90
      },
      sessions: mergedSessions,
      updated_at: new Date().toISOString()
    };
    onUpdateCohort(updatedCohort);
    showToast('success', `✓ Đã cập nhật cohort "${updatedCohort.title}" (${mergedSessions.length} sessions)!`);
    setIsEditModalOpen(false);
  };

  const handleDeleteCohortClick = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete cohort "${cohort.title}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeletingCohort(true);
    try {
      await deleteFirestoreCohort(cohort.id);
      showToast('info', `Đã xóa lớp học "${cohort.title}".`);
      setIsEditModalOpen(false);
      onDeleteCohort?.(cohort.id);
    } catch (err: any) {
      showToast('error', `Lỗi khi xóa cohort: ${err?.message || err}`);
    } finally {
      setIsDeletingCohort(false);
    }
  };

  const sessions = cohort?.sessions || [];
  const completedCount = sessions.filter(s => s.status === 'completed').length;
  const totalSessions = cohort?.total_sessions || sessions.length || 15;
  const inProgressSession = sessions.find(s => s.status === 'in_progress') || sessions.find(s => s.status === 'scheduled') || sessions[0];
  const progressPercent = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0;

  // Aggregate audio readiness summary
  const readySessionsCount = sessions.filter(s => sessionAudioStatus[s.session_number]?.isReady).length;
  const sessionsWithCachedCount = sessions.filter(s => (sessionAudioStatus[s.session_number]?.cached || 0) > 0).length;

  const handleStatusChange = (sessionNumber: number, newStatus: ClassSession['status']) => {
    const updatedSessions = sessions.map(s => {
      if (s.session_number === sessionNumber) {
        return { ...s, status: newStatus };
      }
      return s;
    });
    onUpdateCohort({ ...cohort, sessions: updatedSessions, updated_at: new Date().toISOString() });
  };

  const handleDateChange = (sessionNumber: number, newDate: string) => {
    const updatedSessions = sessions.map(s => {
      if (s.session_number === sessionNumber) {
        const parts = newDate.split('-').map(Number);
        const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return { ...s, scheduled_date: newDate, day_of_week: days[d.getDay()] };
      }
      return s;
    });
    onUpdateCohort({ ...cohort, sessions: updatedSessions, updated_at: new Date().toISOString() });
    setEditingSessionNumber(null);
  };

  const handleLaunchSession = (lessonId: string, sessionNumber: number) => {
    onLaunchProjectorForLesson(lessonId, sessionNumber);
  };

  const handleExportICS = () => {
    const icsData = exportScheduleAsICS(cohort);
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${(cohort?.title || 'Cohort').replace(/\s+/g, '_')}_Schedule.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSessions = sessions.filter(s => {
    if (filterStatus === 'all') return true;
    return s.status === filterStatus;
  });

  const daysOfWeekText = cohort?.schedule_pattern?.days_of_week?.join(' - ') || 'Mon - Wed - Fri';
  const startTimeText = cohort?.schedule_pattern?.start_time || '19:30';
  const endTimeText = cohort?.schedule_pattern?.end_time || '21:00';

  // Render Audio Readiness Badge for a session
  const renderAudioBadge = (sessionNumber: number) => {
    if (generatingSessionNumber === sessionNumber) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin text-blue-600 shrink-0" />
          <span>Đang tạo {generationProgress.percentage}%</span>
        </span>
      );
    }

    if (isSyncingCloudSessionNumber === sessionNumber) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin text-emerald-600 shrink-0" />
          <span>Đang sync Cloud...</span>
        </span>
      );
    }

    const session = sessions.find(s => s.session_number === sessionNumber);
    const lesson = session ? (liveLessons[session.lesson_id] || curriculumRegistry.getLessonById(session.lesson_id)) : null;
    const chunks = lesson?.chunks || [];
    const voiceEn = getVoiceEn();

    // Fall back to synchronous baseline if async check is pending or status not yet recorded
    const status = sessionAudioStatus[sessionNumber] || (session ? computeBaselineStatus(session, chunks, voiceEn) : null);

    if (!status) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-400">
          <Loader2 className="w-2.5 h-2.5 animate-spin shrink-0" />
          <span>Kiểm tra...</span>
        </span>
      );
    }

    if (status.total === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-500">
          Trống
        </span>
      );
    }

    if (status.isReady) {
      return (
        <span 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs"
          title={`Tất cả ${status.total}/${status.total} câu đã sẵn sàng audio (100%)`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>✓ Audio 100% Sẵn sàng</span>
        </span>
      );
    }

    if (status.cached > 0) {
      const missing = status.total - status.cached;
      return (
        <span 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs"
          title={`Đã có ${status.cached}/${status.total} câu (${status.percent}%). Thiếu ${missing} câu.`}
        >
          <Volume2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Thiếu {missing}/{status.total} câu</span>
        </span>
      );
    }

    return (
      <span 
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-zinc-100 text-zinc-600 border border-zinc-200"
        title="Chưa có câu nào có audio"
      >
        <VolumeX className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        <span>Chưa có audio</span>
      </span>
    );
  };

  // Render Quick Action Menu / Progress Controls
  const renderQuickActionMenu = (session: ClassSession) => {
    const isGenerating = generatingSessionNumber === session.session_number;
    const isSyncing = isSyncingCloudSessionNumber === session.session_number;

    if (isSyncing) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
          <Loader2 className="w-3 h-3 animate-spin text-emerald-600 shrink-0" />
          <span>Đang sync...</span>
        </div>
      );
    }

    if (isGenerating) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-blue-700">
            {generationProgress.current}/{generationProgress.total}
          </span>
          <button
            type="button"
            onClick={() => { cancelGenerationRef.current = true; }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-bold cursor-pointer transition-colors"
            title="Hủy quá trình tạo audio"
          >
            <X className="w-3 h-3" />
            <span>Hủy</span>
          </button>
        </div>
      );
    }

    return (
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveActionMenuSession(activeActionMenuSession === session.session_number ? null : session.session_number);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
          title="Thao tác nhanh Audio"
        >
          <Zap className="w-3 h-3 text-amber-500" />
          <span>Tạo Audio</span>
          <ChevronDown className="w-3 h-3 text-zinc-400" />
        </button>

        {activeActionMenuSession === session.session_number && (
          <div 
            className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-[#E8E8EC] py-1 z-30 font-sans animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100">
              Audio Session {session.session_number}
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveActionMenuSession(null);
                handleQuickGenerateAudio(session, 'missing_only');
              }}
              className="w-full text-left px-3 py-2 text-xs text-zinc-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <div className="font-bold">⚡ Tạo thiếu</div>
                <div className="text-[10px] text-zinc-400">Chỉ tạo các câu chưa có audio</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveActionMenuSession(null);
                handleQuickGenerateAudio(session, 'en_only');
              }}
              className="w-full text-left px-3 py-2 text-xs text-zinc-700 hover:bg-blue-50 hover:text-blue-900 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-blue-500 shrink-0" />
              <div>
                <div className="font-bold">🎙️ Tạo EN</div>
                <div className="text-[10px] text-zinc-400">Tạo tiếng Anh cho toàn bộ bài</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveActionMenuSession(null);
                handleQuickGenerateAudio(session, 'force_overwrite');
              }}
              className="w-full text-left px-3 py-2 text-xs text-zinc-700 hover:bg-red-50 hover:text-red-900 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-red-500 shrink-0" />
              <div>
                <div className="font-bold">🔁 Ghi đè</div>
                <div className="text-[10px] text-zinc-400">Tạo mới toàn bộ 100% audio</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveActionMenuSession(null);
                handleSyncSessionToCloud(session);
              }}
              className="w-full text-left px-3 py-2 text-xs text-zinc-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <CloudUpload className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <div className="font-bold">☁️ Đồng bộ Cloud</div>
                <div className="text-[10px] text-zinc-400">Tải audio trong cache lên Firebase Storage</div>
              </div>
            </button>

            <div className="my-1 border-t border-zinc-100" />

            <button
              type="button"
              onClick={() => {
                setActiveActionMenuSession(null);
                setIsAudioSettingsOpen(true);
              }}
              className="w-full text-left px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-100 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-zinc-500 shrink-0" />
              <div>
                <div className="font-bold">⚙️ Cài đặt âm thanh</div>
                <div className="text-[10px] text-zinc-400">Cấu hình giọng đọc & tốc độ</div>
              </div>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans">
      {/* 1. Header Banner & Actions */}
      <div className="bg-white rounded-xl border border-[#E8E8EC] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#DC2626]/10 text-[#DC2626] uppercase">
                {totalSessions}-Session Cohort Track
              </span>
              <span className="text-xs text-[#6B6B6B] font-mono">
                • Start Date: {cohort.start_date}
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Audio: {readySessionsCount}/{totalSessions} Ready
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl text-[#0A0A0A] tracking-tight">
              {cohort.title}
            </h1>
            <p className="text-sm text-[#6B6B6B] mt-1">
              Level {cohort?.level_code?.replace('_', ' ') || 'B'} • {daysOfWeekText} ({startTimeText} – {endTimeText})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Audio Settings Button */}
            <button
              onClick={() => setIsAudioSettingsOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E8E8EC] bg-white text-xs font-semibold text-[#0A0A0A] hover:bg-[#FAFAFA] transition-all cursor-pointer shadow-xs"
              title="Cấu hình giọng đọc Deepgram / Google Cloud, tốc độ & chế độ phát"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Cài Đặt Audio</span>
            </button>

            {/* Sync Cloud Audio (All Cached Sessions) */}
            <button
              disabled={isSyncingAllCloud}
              onClick={handleSyncAllCachedSessionsToCloud}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                isSyncingAllCloud 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 cursor-wait'
                  : 'border-[#E8E8EC] bg-white text-[#0A0A0A] hover:bg-[#FAFAFA]'
              }`}
              title={
                sessionsWithCachedCount > 0
                  ? `Đồng bộ toàn bộ ${sessionsWithCachedCount} buổi đã có audio trong cache lên Firebase Storage`
                  : 'Đồng bộ audio trong cache lên Firebase Storage'
              }
            >
              {isSyncingAllCloud ? (
                <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>
                {isSyncingAllCloud 
                  ? 'Đang Sync Cloud...' 
                  : sessionsWithCachedCount > 0 
                    ? `Sync Tất Cả (${sessionsWithCachedCount} buổi ready)` 
                    : 'Sync Cloud'}
              </span>
            </button>

            {/* Edit Cohort Schedule */}
            <button
              onClick={() => {
                setEditTitle(cohort.title);
                setEditStartDate(cohort.start_date || '2026-09-01');
                setEditDays(cohort.schedule_pattern?.days_of_week || ['Mon', 'Wed', 'Fri']);
                setEditStartTime(cohort.schedule_pattern?.start_time || '19:30');
                setEditEndTime(cohort.schedule_pattern?.end_time || '21:00');
                setIsEditModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E8E8EC] bg-white text-xs font-semibold text-[#0A0A0A] hover:bg-[#FAFAFA] transition-all cursor-pointer shadow-xs"
              title="Thay đổi ngày bắt đầu, giờ học và tính lại 15 buổi"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Edit Schedule</span>
            </button>

            {/* Export iCal */}
            <button
              onClick={handleExportICS}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E8E8EC] bg-white text-xs font-semibold text-[#0A0A0A] hover:bg-[#FAFAFA] transition-all cursor-pointer shadow-xs"
              title="Xuất file đồng bộ lịch (.ics) cho Google Calendar hoặc Apple Calendar"
            >
              <Download className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span>Export iCal (.ics)</span>
            </button>

            {/* Launch Presenter */}
            {inProgressSession && (
              <button
                onClick={() => handleLaunchSession(inProgressSession.lesson_id, inProgressSession.session_number)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Session {inProgressSession.session_number}</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-5 border-t border-[#E8E8EC]">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0A0A0A]">Cohort Progression:</span>
              <span className="font-mono text-[#DC2626] font-bold">
                {completedCount} of {cohort.total_sessions} sessions completed
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-[#0A0A0A]">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-[#F1F1F4] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#DC2626] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Spotlight Next Session Card */}
      {inProgressSession && (
        <div className="bg-gradient-to-r from-[#DC2626]/[0.04] via-[#FAFAFA] to-white rounded-xl border-2 border-[#DC2626]/20 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DC2626] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#DC2626]"></span>
              </span>
              <span className="text-xs font-mono font-bold uppercase text-[#DC2626] tracking-wider">
                {inProgressSession.status === 'in_progress' ? 'Session In Progress' : 'Next Scheduled Session'}
              </span>
              <div className="ml-2">
                {renderAudioBadge(inProgressSession.session_number)}
              </div>
            </div>
            <h2 className="font-display font-bold text-lg text-[#0A0A0A]">
              Session {inProgressSession.session_number}: {inProgressSession.lesson_title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-[#6B6B6B] font-mono">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#DC2626]" />
                {inProgressSession.day_of_week}, {inProgressSession.scheduled_date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#6B6B6B]" />
                {inProgressSession.start_time} – {inProgressSession.end_time}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {renderQuickActionMenu(inProgressSession)}
            <button
              onClick={() => handleLaunchSession(inProgressSession.lesson_id, inProgressSession.session_number)}
              className="flex-1 md:flex-none px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer group"
            >
              <span>Launch Presenter Drill</span>
              <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Filter Bar & View Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E8E8EC] rounded-lg shadow-2xs overflow-x-auto shrink-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-[#0A0A0A] text-white font-semibold shadow-xs'
                : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
            }`}
          >
            All 15 Sessions ({cohort.sessions.length})
          </button>
          <button
            onClick={() => setFilterStatus('scheduled')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              filterStatus === 'scheduled'
                ? 'bg-[#0A0A0A] text-white font-semibold shadow-xs'
                : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
            }`}
          >
            Scheduled ({cohort.sessions.filter(s => s.status === 'scheduled').length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              filterStatus === 'completed'
                ? 'bg-[#16A34A] text-white font-semibold shadow-xs'
                : 'text-[#6B6B6B] hover:text-[#0A0A0A]'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="text-[11px] text-[#6B6B6B] font-mono hidden md:block">
            * Direct clicker integration enabled
          </div>
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200">
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'GRID' ? 'bg-white text-[#DC2626] shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
              title="Lưới bài học hiện tại"
            >
              Lưới Thẻ
            </button>
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'LIST' ? 'bg-white text-[#DC2626] shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
              title="Danh sách tối giản"
            >
              Danh Sách
            </button>
          </div>
        </div>
      </div>

      {/* 4. 15-Sessions Content */}
      {viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session) => {
            const lessonMeta = liveLessons[session.lesson_id] || curriculumRegistry.getLessonById(session.lesson_id);
            const chunkCount = lessonMeta?.total_chunks || lessonMeta?.chunks?.length || 0;
            const isCompleted = session.status === 'completed';
            const isInProgress = session.status === 'in_progress';
            const isGenerating = generatingSessionNumber === session.session_number;

            return (
              <div
                key={session.session_number}
                className={`bg-white rounded-xl border p-4.5 flex flex-col justify-between transition-all hover:shadow-sm ${
                  isInProgress 
                    ? 'border-[#DC2626] ring-2 ring-[#DC2626]/10' 
                    : isCompleted 
                      ? 'border-[#16A34A]/40 bg-[#FAFAFA]/70' 
                      : 'border-[#E8E8EC]'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                        isInProgress 
                          ? 'bg-[#DC2626] text-white' 
                          : isCompleted 
                            ? 'bg-[#16A34A] text-white' 
                            : 'bg-[#F1F1F4] text-[#0A0A0A]'
                      }`}>
                        {session.session_number}
                      </span>
                      <span className="font-mono text-xs font-semibold text-[#0A0A0A]">
                        Session {session.session_number}/{cohort.total_sessions || cohort.sessions?.length || 30}
                      </span>
                    </div>

                    <select
                      value={session.status}
                      onChange={(e) => handleStatusChange(session.session_number, e.target.value as any)}
                      className={`text-[11px] font-semibold font-mono rounded-md px-2 py-1 border transition-colors cursor-pointer ${
                        isCompleted 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : isInProgress 
                            ? 'bg-red-50 text-[#DC2626] border-red-200 font-bold' 
                            : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                      }`}
                    >
                      <option value="scheduled">⏳ Scheduled</option>
                      <option value="in_progress">🔴 In Progress</option>
                      <option value="completed">✅ Completed</option>
                      <option value="cancelled">🚫 Postponed</option>
                    </select>
                  </div>

                  {/* Audio Readiness & Quick Action Bar */}
                  <div className="my-2 p-2 rounded-xl bg-[#FAFAFA] border border-[#E8E8EC] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {renderAudioBadge(session.session_number)}
                    </div>
                    <div className="shrink-0">
                      {renderQuickActionMenu(session)}
                    </div>
                  </div>

                  {/* Real-time Progress Bar for Generating Session */}
                  {isGenerating && (
                    <div className="mb-2">
                      <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${generationProgress.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Lesson Title */}
                  <h3 className="font-display font-bold text-sm text-[#0A0A0A] leading-snug line-clamp-2 min-h-[2.5rem]">
                    {session.lesson_title}
                  </h3>

                  {/* Metadata Details */}
                  <div className="mt-3 space-y-1.5 text-xs text-[#6B6B6B]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-[#6B6B6B]" />
                        {session.day_of_week}, {session.scheduled_date}
                      </span>
                      {editingSessionNumber === session.session_number ? (
                        <input
                          type="date"
                          defaultValue={session.scheduled_date}
                          onBlur={(e) => handleDateChange(session.session_number, e.target.value)}
                          className="text-[11px] border rounded px-1 py-0.5 font-mono"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => setEditingSessionNumber(session.session_number)}
                          className="text-[11px] text-zinc-400 hover:text-zinc-700 underline cursor-pointer"
                          title="Reschedule Date"
                        >
                          Reschedule
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3 h-3 text-[#6B6B6B]" />
                        {session.start_time} – {session.end_time}
                      </span>
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
                        {chunkCount} Chunks
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Drill Launch CTA */}
                <div className="mt-4 pt-3 border-t border-[#E8E8EC] flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 truncate">
                    {session.lesson_type}
                  </span>

                  <button
                    onClick={() => handleLaunchSession(session.lesson_id, session.session_number)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isInProgress
                        ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C] shadow-xs'
                        : 'bg-zinc-100 hover:bg-[#DC2626] hover:text-white text-zinc-800'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Launch Drill</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-100 text-zinc-700 font-bold border-b border-zinc-200">
                <tr>
                  <th className="p-3 w-16 text-center">Session</th>
                  <th className="p-3 w-36">Lịch Học</th>
                  <th className="p-3">Bài Học</th>
                  <th className="p-3 w-52">Trạng Thái Audio</th>
                  <th className="p-3 w-32">Trạng Thái Buổi</th>
                  <th className="p-3 w-28 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredSessions.map((session) => {
                  const isCompleted = session.status === 'completed';
                  const isInProgress = session.status === 'in_progress';
                  return (
                    <tr key={session.session_number} className={`hover:bg-zinc-50 transition-colors ${isInProgress ? 'bg-red-50/20' : ''}`}>
                      <td className="p-3 text-center">
                        <span className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                          isInProgress ? 'bg-[#DC2626] text-white' : isCompleted ? 'bg-[#16A34A] text-white' : 'bg-[#F1F1F4] text-[#0A0A0A]'
                        }`}>
                          {session.session_number}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-mono text-zinc-900 font-bold">{session.scheduled_date}</div>
                            <div className="font-mono text-[10px] text-zinc-500 mt-0.5">{session.day_of_week} • {session.start_time} - {session.end_time}</div>
                          </div>
                          {editingSessionNumber === session.session_number ? (
                            <input
                              type="date"
                              defaultValue={session.scheduled_date}
                              onBlur={(e) => handleDateChange(session.session_number, e.target.value)}
                              className="text-[11px] border rounded px-1 py-0.5 font-mono ml-2"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => setEditingSessionNumber(session.session_number)}
                              className="text-[11px] text-zinc-400 hover:text-zinc-700 cursor-pointer p-1"
                              title="Reschedule Date"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-display font-bold text-sm text-zinc-900 line-clamp-1">{session.lesson_title}</div>
                        <div className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">{session.lesson_type}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {renderAudioBadge(session.session_number)}
                          {renderQuickActionMenu(session)}
                        </div>
                      </td>
                      <td className="p-3">
                        <select
                          value={session.status}
                          onChange={(e) => handleStatusChange(session.session_number, e.target.value as any)}
                          className={`text-[11px] font-semibold font-mono rounded-md px-2 py-1 border transition-colors cursor-pointer w-full ${
                            isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : isInProgress ? 'bg-red-50 text-[#DC2626] border-red-200 font-bold' : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                          }`}
                        >
                          <option value="scheduled">⏳ Scheduled</option>
                          <option value="in_progress">🔴 In Progress</option>
                          <option value="completed">✅ Completed</option>
                          <option value="cancelled">🚫 Postponed</option>
                        </select>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleLaunchSession(session.lesson_id, session.session_number)}
                          className={`inline-flex items-center justify-center gap-1.5 w-full px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isInProgress ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C] shadow-xs' : 'bg-zinc-100 hover:bg-[#DC2626] hover:text-white text-zinc-800'
                          }`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Vào Lớp</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. COHORT ADMIN & SCHEDULE SETTINGS MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl border border-[#E8E8EC] shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E8E8EC] flex items-center justify-between bg-[#FAFAFA]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#0A0A0A] tracking-tight">Cohort Admin & Schedule Settings</h3>
                  <p className="text-xs text-zinc-500">Configure cohort metadata, re-bind curriculum course track, recalculate dynamic sessions, or manage cohort lifecycle</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCohortSettings} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Title & Teacher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Cohort Title / Batch Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E8EC] text-sm focus:outline-hidden focus:border-[#DC2626]"
                    placeholder="e.g. Level B - ERE Spoken Reflexes K30"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Teacher ID / Instructor
                  </label>
                  <input
                    type="text"
                    value={editTeacherId}
                    onChange={(e) => setEditTeacherId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E8EC] text-sm focus:outline-hidden focus:border-[#DC2626]"
                    placeholder="e.g. teacher_genshai"
                  />
                </div>
              </div>

              {/* Course Re-binding (Gán data vào course) */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Course Track / Gán Data Giáo Trình Vào Cohort
                </label>
                <select
                  value={editCourseId}
                  onChange={(e) => {
                    const selCourse = e.target.value;
                    setEditCourseId(selCourse);
                    if (selCourse === 'course_level_b' || selCourse === 'LEVEL_B') {
                      setEditLevelCode('LEVEL_B');
                      setEditTotalSessions(30);
                    } else if (selCourse === 'course_level_a' || selCourse === 'LEVEL_A') {
                      setEditLevelCode('LEVEL_A');
                      setEditTotalSessions(16);
                    } else if (selCourse === 'course_level_b_erel' || selCourse === 'LEVEL_B_EREL') {
                      setEditLevelCode('LEVEL_B_EREL');
                      setEditTotalSessions(15);
                    } else if (selCourse === 'course_level_b_eres' || selCourse === 'LEVEL_B_ERES') {
                      setEditLevelCode('LEVEL_B_ERES');
                      setEditTotalSessions(15);
                    }
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E8EC] text-sm font-semibold focus:outline-hidden focus:border-[#DC2626] bg-white cursor-pointer"
                >
                  <option value="course_level_b">Level B - ERE (30 Topics • 3,150 Chunks)</option>
                  <option value="course_level_a">Level A - Foundation (16 Lessons • 4,480 Chunks)</option>
                  <option value="course_level_b_erel">Level B - EREL Listening (15 Lessons • 1,019 Chunks)</option>
                  <option value="course_level_b_eres">Level B - ERES Speaking (15 Lessons • 3,371 Chunks)</option>
                </select>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Khi chuyển Course Track, hệ thống sẽ tự động liên kết bài học tương ứng và cập nhật số buổi học tiêu chuẩn.
                </p>
              </div>

              {/* Start Date & Total Sessions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Start Date (Khai Giảng)
                  </label>
                  <input
                    type="date"
                    required
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E8EC] text-sm font-mono focus:outline-hidden focus:border-[#DC2626]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Total Sessions (Số Buổi Học)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={editTotalSessions}
                    onChange={(e) => setEditTotalSessions(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E8EC] text-sm font-mono font-bold focus:outline-hidden focus:border-[#DC2626]"
                  />
                </div>
              </div>

              {/* Recurring Days */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Schedule Days
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                    const isSelected = editDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleEditDay(day)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#DC2626] text-white shadow-xs'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E8EC] text-sm font-mono focus:outline-hidden focus:border-[#DC2626]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E8EC] text-sm font-mono focus:outline-hidden focus:border-[#DC2626]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#E8E8EC] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleDeleteCohortClick}
                  disabled={isDeletingCohort}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  title="Xóa vĩnh viễn cohort này"
                >
                  {isDeletingCohort ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" /> : <Trash2 className="w-3.5 h-3.5 text-red-600" />}
                  <span>Delete Cohort</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#E8E8EC] text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#DC2626] text-white text-xs font-bold hover:bg-[#B91C1C] shadow-sm transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Recalculate {editTotalSessions} Sessions</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. AUDIO SETTINGS MODAL */}
      <ScheduleAudioSettingsModal
        isOpen={isAudioSettingsOpen}
        onClose={() => setIsAudioSettingsOpen(false)}
        audioSettings={cohort.audio_settings}
        onSave={handleSaveAudioSettings}
      />

      {/* 7. FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-200">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold ${
            toast.type === 'success' 
              ? 'bg-emerald-900 text-white border-emerald-700' 
              : toast.type === 'error'
                ? 'bg-red-900 text-white border-red-700'
                : toast.type === 'warning'
                  ? 'bg-amber-900 text-white border-amber-700'
                  : 'bg-zinc-900 text-white border-zinc-700'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : toast.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Volume2 className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button 
              type="button" 
              onClick={() => setToast(null)}
              className="ml-2 p-0.5 hover:bg-white/20 rounded cursor-pointer transition-colors"
            >
              <X className="w-3 h-3 text-white/80" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
