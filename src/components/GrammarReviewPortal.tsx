import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Check, 
  CheckCircle2, 
  Cloud, 
  Save, 
  FolderSync, 
  Search, 
  Edit3, 
  Trash2, 
  Plus, 
  Sparkles, 
  Download, 
  Upload, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  AlertCircle, 
  RefreshCw, 
  FileText, 
  HardDrive, 
  FileAudio, 
  Filter, 
  X, 
  Bot, 
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  ArrowRight,
  Database,
  Layers,
  HelpCircle,
  FolderOpen
} from 'lucide-react';
import { 
  TopicResourceData, 
  DriveFileItem, 
  autoMapDriveFilesToTopics, 
  autoMapLocalFilesToTopics, 
  fetchDriveFolderFiles, 
  uploadFileToDrive, 
  parseGoogleDriveUrl,
  getGoogleDriveStreamUrl 
} from '../services/googleDriveService';
import { 
  saveLessonGrammar 
} from '../services/firestoreService';
import { curriculumRegistry } from '../services/curriculumRegistry';
import { 
  LessonGrammar, 
  GrammarMiniLesson, 
  GrammarExample, 
  GrammarStructureType 
} from '../types';
import initialCatalogData from '../data/grammarBoostCatalog.json';

// --------------------------------------------------------------------------
// Constants & Local Storage Keys
// --------------------------------------------------------------------------
const LOCAL_STORAGE_CATALOG_KEY = 'chunks_grammar_catalog_v2';
const LOCAL_STORAGE_APPROVED_KEY = 'chunks_grammar_approved_v1';
const LOCAL_STORAGE_LAST_SYNC_KEY = 'chunks_grammar_last_firestore_sync';

export interface GrammarReviewPortalProps {
  isStandalone?: boolean;
  onExitToApp?: () => void;
  onLaunchProjectorForLesson?: (lessonId: string, dayNumber: number) => void;
}

/**
 * Recomputes summary arrays based on 1-to-1 canonical rules
 */
export function recomputeTopic(topic: TopicResourceData): TopicResourceData {
  const sentences: string[] = [];
  const verbs: string[] = [];
  const tenses: string[] = [];
  let audioCount = 0;

  for (const m of topic.mini_lessons || []) {
    const structType = m.structure_type || 'sentence_structure';
    const primary = (m.primary_structure || m.topic || '').trim();

    if (structType === 'sentence_structure') {
      if (primary && !sentences.includes(primary)) sentences.push(primary);
      m.structures = primary ? [primary] : [];
      m.verb_forms = [];
      m.tense = [];
    } else if (structType === 'verb_form') {
      if (primary && !verbs.includes(primary)) verbs.push(primary);
      m.verb_forms = primary ? [primary] : [];
      m.structures = [];
      m.tense = [];
    } else if (structType === 'tense_reflex') {
      if (primary && !tenses.includes(primary)) tenses.push(primary);
      m.tense = primary ? [primary] : [];
      m.structures = [];
      m.verb_forms = [];
    }

    if (m.audio_url || (m.file && m.file.toLowerCase().endsWith('.mp3'))) {
      audioCount++;
    }
  }

  return {
    ...topic,
    sentence_structures: sentences,
    verb_forms: verbs,
    tense: tenses,
    total_audio_files: audioCount,
  };
}

export const GrammarReviewPortal: React.FC<GrammarReviewPortalProps> = ({
  isStandalone = false,
  onExitToApp,
  onLaunchProjectorForLesson
}) => {
  // --------------------------------------------------------------------------
  // 1. Core State
  // --------------------------------------------------------------------------
  const [topics, setTopics] = useState<TopicResourceData[]>(() => {
    // Build lookup map from initialCatalogData (pre-populated with 288/288 Google Drive audio URLs)
    const initialTopics: any[] = (initialCatalogData as any).topics || [];
    const initialAudioMap = new Map<string, { audio_url: string; audio_source: string; gdrive_file_id?: string }>();
    for (const it of initialTopics) {
      const day = it.day_number || it.topic_number || 1;
      for (const iml of it.mini_lessons || []) {
        if (iml.file && iml.audio_url) {
          initialAudioMap.set(`${day}_${iml.file}`, {
            audio_url: iml.audio_url,
            audio_source: iml.audio_source || 'google_drive',
            gdrive_file_id: iml.gdrive_file_id
          });
        }
      }
    }

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CATALOG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((t: any) => {
            const dayNum = t.day_number || t.topic_number || 1;
            const updatedMini = (t.mini_lessons || []).map((ml: any) => {
              const key = `${dayNum}_${ml.file}`;
              const cloudAudio = initialAudioMap.get(key);
              if (cloudAudio && (cloudAudio.audio_source === 'google_drive' || !ml.audio_url || ml.audio_source !== 'google_drive')) {
                return {
                  ...ml,
                  audio_url: cloudAudio.audio_url,
                  audio_source: cloudAudio.audio_source,
                  gdrive_file_id: cloudAudio.gdrive_file_id || ml.gdrive_file_id
                };
              }
              return ml;
            });
            return recomputeTopic({
              ...t,
              mini_lessons: updatedMini
            });
          });
        }
      }
    } catch (e) {
      console.warn('[GrammarReviewPortal] Could not read from localStorage:', e);
    }
    const baseTopics: any[] = (initialCatalogData as any).topics || [];
    return baseTopics.map((t: any) => {
      const dayNum = t.day_number || t.topic_number || 1;
      return recomputeTopic({
        topic_number: t.topic_number || dayNum,
        day_number: dayNum,
        lesson_id: t.lesson_id || `level_b_day_${dayNum}`,
        lesson_title: t.lesson_title || `Day ${dayNum}`,
        source_type: t.source_type || 'audio_boost',
        total_audio_files: t.total_audio_files ?? 0,
        status: t.status || 'active',
        thematic_module: t.thematic_module,
        sentence_structures: t.sentence_structures || [],
        verb_forms: t.verb_forms || [],
        tense: t.tense || [],
        notes: t.notes || '',
        mini_lessons: (t.mini_lessons || []).map((ml: any) => ({
          ...ml,
          structure_type: ml.structure_type || 'sentence_structure',
          primary_structure: ml.primary_structure || ml.topic || ''
        }))
      });
    });
  });

  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [approvedItems, setApprovedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_APPROVED_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Standalone mode state
  const [isFullStandalone, setIsFullStandalone] = useState<boolean>(() => {
    if (isStandalone) return true;
    if (typeof window !== 'undefined') {
      return (
        window.location.pathname.includes('/grammar-portal') ||
        window.location.pathname.includes('/curator') ||
        window.location.search.includes('standalone=true')
      );
    }
    return false;
  });

  // Audio Playback
  const [currentlyPlayingUrl, setCurrentlyPlayingUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | GrammarStructureType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'has_audio' | 'no_audio'>('all');

  // Modals & Panels
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isAgentReviewModalOpen, setIsAgentReviewModalOpen] = useState<boolean>(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<{ topicIdx: number; itemIdx: number; item: GrammarMiniLesson } | null>(null);

  // Inline Formula Edit State
  const [inlineEditingKey, setInlineEditingKey] = useState<string | null>(null);
  const [inlineEditingVal, setInlineEditingVal] = useState<string>('');

  // Notifications & Sync Tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_LAST_SYNC_KEY);
    } catch {
      return null;
    }
  });

  // Firestore Sync Progress
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; message: string }>({
    current: 0,
    total: 30,
    message: ''
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  // Agent AI Review Audit Result
  const [agentAuditReport, setAgentAuditReport] = useState<{
    totalAudited: number;
    cleanCount: number;
    flaggedCount: number;
    issues: { topicDay: number; itemIndex: number; formula: string; issue: string; canAutoFix: boolean }[];
  } | null>(null);

  // Show Toast
  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // --------------------------------------------------------------------------
  // 2. Audio Playback Control
  // --------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = '';
      }
    };
  }, []);

  /**
   * Safely resolves any audio URL: Converts legacy Google Drive download/view URLs
   * (docs.google.com/uc?export=download&id=... or drive.google.com/uc?id=... or drive.google.com/file/d/...)
   * into direct Google Drive API v3 media stream URLs with CORS and HTTP 206 byte-range support.
   */
  const resolvePlayableAudioUrl = (inputUrl?: string): string => {
    if (!inputUrl) return '';
    const trimmed = inputUrl.trim();
    const legacyGdriveMatch = trimmed.match(
      /(?:docs\.google\.com\/uc\?export=download&id=|drive\.google\.com\/uc\?id=|drive\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/i
    );
    if (legacyGdriveMatch && legacyGdriveMatch[1]) {
      return getGoogleDriveStreamUrl(legacyGdriveMatch[1]);
    }
    return trimmed;
  };

  const handleTogglePlayAudio = (url?: string) => {
    if (!url) {
      showToast('Mục này chưa có audio! Vui lòng gán audio hoặc dùng Google Drive Auto-Sync.', 'info');
      return;
    }

    if (currentlyPlayingUrl === url && isPlaying) {
      audioPlayerRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    const resolvedUrl = resolvePlayableAudioUrl(url);

    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio();
    }

    // Stop and reset any current playback to ensure smooth Google Drive streaming
    audioPlayerRef.current.pause();
    audioPlayerRef.current.currentTime = 0;
    audioPlayerRef.current.src = resolvedUrl;
    audioPlayerRef.current.preload = 'auto';

    audioPlayerRef.current.onended = () => {
      setIsPlaying(false);
      setCurrentlyPlayingUrl(null);
    };
    audioPlayerRef.current.onerror = () => {
      showToast('Không thể phát file audio này. Vui lòng kiểm tra quyền truy cập Google Drive hoặc đường dẫn.', 'error');
      setIsPlaying(false);
      setCurrentlyPlayingUrl(null);
    };

    audioPlayerRef.current.play()
      .then(() => {
        setCurrentlyPlayingUrl(url);
        setIsPlaying(true);
      })
      .catch(err => {
        console.warn('Playback error:', err);
        showToast('Trình duyệt chặn autoplay hoặc URL audio không hợp lệ.', 'error');
        setIsPlaying(false);
      });
  };

  // --------------------------------------------------------------------------
  // 3. Data Mutators & Recomputation
  // --------------------------------------------------------------------------
  const currentTopicIndex = useMemo(() => {
    const idx = topics.findIndex(t => (t.day_number || t.topic_number) === selectedDay);
    return idx >= 0 ? idx : 0;
  }, [topics, selectedDay]);

  const currentTopic = topics[currentTopicIndex] || topics[0];

  const updateCurrentTopic = useCallback((updater: (topic: TopicResourceData) => TopicResourceData) => {
    setTopics(prev => {
      const copy = [...prev];
      const target = copy[currentTopicIndex];
      if (!target) return prev;
      const updated = updater(target);
      copy[currentTopicIndex] = recomputeTopic(updated);
      return copy;
    });
    setHasUnsavedChanges(true);
  }, [currentTopicIndex]);

  // Inline Formula Edit
  const handleSaveInlineFormula = (itemIndex: number) => {
    const trimmed = inlineEditingVal.trim();
    if (!trimmed) return;
    updateCurrentTopic(t => {
      const lessons = [...(t.mini_lessons || [])];
      const target = lessons[itemIndex];
      if (!target) return t;
      lessons[itemIndex] = {
        ...target,
        primary_structure: trimmed
      };
      return { ...t, mini_lessons: lessons };
    });
    setInlineEditingKey(null);
    showToast(`Đã cập nhật cấu trúc: "${trimmed}"`);
  };

  // Category Switch
  const handleChangeCategory = (itemIndex: number, newCategory: GrammarStructureType) => {
    updateCurrentTopic(t => {
      const lessons = [...(t.mini_lessons || [])];
      const target = lessons[itemIndex];
      if (!target) return t;
      lessons[itemIndex] = {
        ...target,
        structure_type: newCategory
      };
      return { ...t, mini_lessons: lessons };
    });
    showToast(`Đã đổi category sang: ${getCategoryLabel(newCategory)}`);
  };

  // Approve Toggle
  const getItemApproveKey = (dayNum: number, itemIdx: number, file?: string) => {
    return file ? `${dayNum}_${file}` : `${dayNum}_${itemIdx}`;
  };

  const handleToggleApprove = (itemIndex: number, file?: string) => {
    const key = getItemApproveKey(selectedDay, itemIndex, file);
    setApprovedItems(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(LOCAL_STORAGE_APPROVED_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleApproveAllInTopic = () => {
    if (!currentTopic || !currentTopic.mini_lessons) return;
    setApprovedItems(prev => {
      const next = { ...prev };
      currentTopic.mini_lessons.forEach((ml, idx) => {
        const key = getItemApproveKey(selectedDay, idx, ml.file);
        next[key] = true;
      });
      try {
        localStorage.setItem(LOCAL_STORAGE_APPROVED_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    showToast(`Đã duyệt toàn bộ ${currentTopic.mini_lessons.length} cấu trúc của Day ${selectedDay}!`);
  };

  // Local Storage Save
  const handleSaveToLocalStorage = () => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CATALOG_KEY, JSON.stringify(topics));
      // Update in-memory registry
      topics.forEach(t => {
        const grammarDoc: LessonGrammar = {
          verb_forms: t.verb_forms || [],
          sentence_structures: t.sentence_structures || [],
          tense: t.tense || [],
          notes: t.notes || '',
          mini_lessons: t.mini_lessons,
          total_audio_files: t.total_audio_files || 0,
          source_type: t.source_type || 'audio_boost',
          status: 'active'
        };
        curriculumRegistry.updateLessonGrammar(t.lesson_id || `level_b_day_${t.day_number}`, grammarDoc);
      });
      setHasUnsavedChanges(false);
      showToast('Đã lưu nháp vào Local Storage & Bộ nhớ Web!');
    } catch (e: any) {
      showToast(`Lỗi khi lưu nháp: ${e?.message || String(e)}`, 'error');
    }
  };

  // Single Topic Firestore Sync
  const handleSyncCurrentTopicToFirestore = async () => {
    if (!currentTopic) return;
    setIsSyncing(true);
    try {
      const grammarPayload: LessonGrammar = {
        verb_forms: currentTopic.verb_forms || [],
        sentence_structures: currentTopic.sentence_structures || [],
        tense: currentTopic.tense || [],
        notes: currentTopic.notes || '',
        mini_lessons: currentTopic.mini_lessons || [],
        total_audio_files: currentTopic.total_audio_files || 0,
        source_type: currentTopic.source_type || 'audio_boost',
        thematic_module: currentTopic.thematic_module,
        status: 'active'
      };

      const lessonDocId = currentTopic.lesson_id || `level_b_day_${currentTopic.day_number}`;
      const res = await saveLessonGrammar(lessonDocId, grammarPayload);
      if (!res.success) {
        throw new Error(res.error || 'Lỗi không xác định khi lưu Firestore');
      }

      curriculumRegistry.updateLessonGrammar(lessonDocId, grammarPayload);
      const now = new Date().toLocaleString('vi-VN');
      setLastSyncTime(now);
      localStorage.setItem(LOCAL_STORAGE_LAST_SYNC_KEY, now);
      setHasUnsavedChanges(false);
      showToast(`Đã đồng bộ Day ${currentTopic.day_number} (${currentTopic.lesson_title}) lên Firestore thành công!`);
    } catch (err: any) {
      showToast(`Lỗi đồng bộ Firestore: ${err?.message || String(err)}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Batch Sync All 30 Topics to Firestore
  const handleSyncAll30TopicsToFirestore = async () => {
    setIsSyncing(true);
    setSyncLogs([]);
    const total = topics.length;

    try {
      for (let i = 0; i < total; i++) {
        const t = topics[i];
        const docId = t.lesson_id || `level_b_day_${t.day_number}`;
        const msg = `[${i + 1}/${total}] Đang đồng bộ Day ${t.day_number} (${t.lesson_title})...`;
        setSyncProgress({ current: i + 1, total, message: msg });
        setSyncLogs(prev => [...prev, msg]);

        const grammarPayload: LessonGrammar = {
          verb_forms: t.verb_forms || [],
          sentence_structures: t.sentence_structures || [],
          tense: t.tense || [],
          notes: t.notes || '',
          mini_lessons: t.mini_lessons || [],
          total_audio_files: t.total_audio_files || 0,
          source_type: t.source_type || 'audio_boost',
          thematic_module: t.thematic_module,
          status: 'active'
        };

        const res = await saveLessonGrammar(docId, grammarPayload);
        if (!res.success) {
          const errMsg = `❌ Lỗi tại Day ${t.day_number}: ${res.error}`;
          setSyncLogs(prev => [...prev, errMsg]);
          throw new Error(res.error);
        }
        curriculumRegistry.updateLessonGrammar(docId, grammarPayload);
      }

      const successMsg = `✓ Đã đồng bộ toàn bộ ${total} Topics lên Google Cloud Firestore thành công rực rỡ!`;
      setSyncLogs(prev => [...prev, successMsg]);
      const now = new Date().toLocaleString('vi-VN');
      setLastSyncTime(now);
      localStorage.setItem(LOCAL_STORAGE_LAST_SYNC_KEY, now);
      setHasUnsavedChanges(false);
      showToast(successMsg);
    } catch (err: any) {
      showToast(`Đồng bộ gián đoạn: ${err?.message || String(err)}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // --------------------------------------------------------------------------
  // 4. Agent AI Review (Trợ lý Agent Kiểm Tra Tự Động)
  // --------------------------------------------------------------------------
  const handleRunAgentReview = () => {
    let totalAudited = 0;
    let cleanCount = 0;
    let flaggedCount = 0;
    const issues: { topicDay: number; itemIndex: number; formula: string; issue: string; canAutoFix: boolean }[] = [];

    topics.forEach(t => {
      (t.mini_lessons || []).forEach((ml, idx) => {
        totalAudited++;
        let hasIssue = false;
        const formula = ml.primary_structure || ml.topic || '';

        // Check 1: Empty or too short formula
        if (!formula || formula.trim().length < 2) {
          hasIssue = true;
          issues.push({
            topicDay: t.day_number,
            itemIndex: idx,
            formula: formula || '[Trống]',
            issue: 'Cấu trúc bị trống hoặc quá ngắn',
            canAutoFix: false
          });
        }

        // Check 2: Audio missing
        if (!ml.audio_url) {
          hasIssue = true;
          issues.push({
            topicDay: t.day_number,
            itemIndex: idx,
            formula,
            issue: 'Chưa có file audio / chưa map Google Drive',
            canAutoFix: false
          });
        }

        // Check 3: Examples check
        if (!ml.examples || ml.examples.length === 0) {
          hasIssue = true;
          issues.push({
            topicDay: t.day_number,
            itemIndex: idx,
            formula,
            issue: 'Thiếu ví dụ song ngữ',
            canAutoFix: false
          });
        } else {
          const hasIncompleteEx = ml.examples.some(e => !e.en?.trim() || !e.vi?.trim());
          if (hasIncompleteEx) {
            hasIssue = true;
            issues.push({
              topicDay: t.day_number,
              itemIndex: idx,
              formula,
              issue: 'Ví dụ thiếu câu tiếng Anh hoặc bản dịch tiếng Việt',
              canAutoFix: false
            });
          }
        }

        if (!hasIssue) {
          cleanCount++;
        } else {
          flaggedCount++;
        }
      });
    });

    setAgentAuditReport({
      totalAudited,
      cleanCount,
      flaggedCount,
      issues
    });
    setIsAgentReviewModalOpen(true);
  };

  // Agent Auto-Approve Clean Items
  const handleAgentAutoApproveClean = () => {
    if (!agentAuditReport) return;
    const newApproved = { ...approvedItems };
    let newlyApprovedCount = 0;

    topics.forEach(t => {
      (t.mini_lessons || []).forEach((ml, idx) => {
        const formula = (ml.primary_structure || ml.topic || '').trim();
        const hasAudio = !!ml.audio_url;
        const hasValidExamples = ml.examples && ml.examples.length > 0 && ml.examples.every(e => e.en?.trim() && e.vi?.trim());
        const isClean = formula.length >= 2 && hasAudio && hasValidExamples;

        if (isClean) {
          const key = getItemApproveKey(t.day_number, idx, ml.file);
          if (!newApproved[key]) {
            newApproved[key] = true;
            newlyApprovedCount++;
          }
        }
      });
    });

    setApprovedItems(newApproved);
    try {
      localStorage.setItem(LOCAL_STORAGE_APPROVED_KEY, JSON.stringify(newApproved));
    } catch {}

    showToast(`Agent đã tự động duyệt ${newlyApprovedCount} cấu trúc đạt chuẩn 100%!`);
    setIsAgentReviewModalOpen(false);
  };

  // --------------------------------------------------------------------------
  // 5. JSON Export & Import
  // --------------------------------------------------------------------------
  const handleExportJson = () => {
    const exportData = {
      metadata: {
        exported_at: new Date().toISOString(),
        total_topics: topics.length,
        total_structures: topics.reduce((acc, t) => acc + (t.mini_lessons?.length || 0), 0),
        approved_count: Object.values(approvedItems).filter(Boolean).length
      },
      topics
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chunks-grammar-catalog-reviewed-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống bản sao lưu JSON hoàn chỉnh!');
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);
        const importedTopics: TopicResourceData[] = parsed.topics || (Array.isArray(parsed) ? parsed : null);
        if (!importedTopics || !Array.isArray(importedTopics)) {
          throw new Error('Định dạng JSON không hợp lệ. Cần chứa mảng topics.');
        }
        const recomputed = importedTopics.map(recomputeTopic);
        setTopics(recomputed);
        localStorage.setItem(LOCAL_STORAGE_CATALOG_KEY, JSON.stringify(recomputed));
        setHasUnsavedChanges(false);
        showToast(`Đã import thành công ${recomputed.length} topics từ file JSON!`);
        setIsJsonModalOpen(false);
      } catch (err: any) {
        showToast(`Lỗi khi đọc file JSON: ${err?.message || String(err)}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  // --------------------------------------------------------------------------
  // 6. Filtered Mini Lessons
  // --------------------------------------------------------------------------
  const filteredMiniLessons = useMemo(() => {
    if (!currentTopic || !currentTopic.mini_lessons) return [];
    return currentTopic.mini_lessons.map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item, originalIndex }) => {
        // Category Filter
        if (categoryFilter !== 'all' && (item.structure_type || 'sentence_structure') !== categoryFilter) {
          return false;
        }

        // Status Filter
        const isApproved = !!approvedItems[getItemApproveKey(selectedDay, originalIndex, item.file)];
        const hasAudio = !!item.audio_url;

        if (statusFilter === 'approved' && !isApproved) return false;
        if (statusFilter === 'pending' && isApproved) return false;
        if (statusFilter === 'has_audio' && !hasAudio) return false;
        if (statusFilter === 'no_audio' && hasAudio) return false;

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchPrimary = (item.primary_structure || '').toLowerCase().includes(q);
          const matchTopic = (item.topic || '').toLowerCase().includes(q);
          const matchFile = (item.file || '').toLowerCase().includes(q);
          const matchExamples = (item.examples || []).some(
            ex => ex.en.toLowerCase().includes(q) || ex.vi.toLowerCase().includes(q)
          );
          if (!matchPrimary && !matchTopic && !matchFile && !matchExamples) return false;
        }

        return true;
      });
  }, [currentTopic, categoryFilter, statusFilter, searchQuery, approvedItems, selectedDay]);

  // Topic Statistics
  const topicStats = useMemo(() => {
    if (!currentTopic || !currentTopic.mini_lessons) {
      return { total: 0, approved: 0, withAudio: 0 };
    }
    const total = currentTopic.mini_lessons.length;
    let approved = 0;
    let withAudio = 0;

    currentTopic.mini_lessons.forEach((ml, idx) => {
      if (approvedItems[getItemApproveKey(selectedDay, idx, ml.file)]) approved++;
      if (ml.audio_url) withAudio++;
    });

    return { total, approved, withAudio };
  }, [currentTopic, approvedItems, selectedDay]);

  // Global Statistics
  const globalStats = useMemo(() => {
    let totalStructures = 0;
    let totalWithAudio = 0;
    topics.forEach(t => {
      (t.mini_lessons || []).forEach(ml => {
        totalStructures++;
        if (ml.audio_url) totalWithAudio++;
      });
    });
    const totalApproved = Object.values(approvedItems).filter(Boolean).length;
    return { totalStructures, totalWithAudio, totalApproved };
  }, [topics, approvedItems]);

  return (
    <div className={`flex flex-col bg-[#FBFBFC] text-zinc-900 font-sans ${isFullStandalone ? 'fixed inset-0 z-50 overflow-hidden' : 'h-[calc(100vh-64px)] overflow-hidden'}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200 ${
          toastMessage.type === 'success'
            ? 'bg-emerald-600 text-white border-emerald-500'
            : toastMessage.type === 'error'
            ? 'bg-rose-600 text-white border-rose-500'
            : 'bg-zinc-800 text-white border-zinc-700'
        }`}>
          {toastMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* --------------------------------------------------------------------------
          TOP HEADER BAR
         -------------------------------------------------------------------------- */}
      <header className="h-16 border-b border-[#E8E8EC] bg-white px-5 flex items-center justify-between shrink-0 z-20 shadow-2xs">
        {/* Brand & Mode Badges */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-black tracking-tight text-zinc-900">
                CHUNKS Grammar Curator Studio
              </h1>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 hidden sm:inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Standalone Review Ready</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 inline-flex items-center gap-1.5 shadow-2xs">
                <HardDrive className="w-3 h-3 text-emerald-600" />
                <span>{globalStats.totalWithAudio}/{globalStats.totalStructures} Audio Google Drive Sẵn Sàng</span>
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 hidden md:block">
              Audit 30 Topics • Compact Audio • Auto-Map Drive • Không Transcript • Đồng bộ Firestore 1-Click
            </p>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2">
          {/* Agent AI Review Button */}
          <button
            type="button"
            onClick={handleRunAgentReview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-xs font-bold text-purple-700 shadow-2xs cursor-pointer active:scale-95 transition-all"
            title="Trợ lý Agent AI tự động kiểm tra cấu trúc, audio & ví dụ"
          >
            <Bot className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">Agent Review</span>
          </button>

          {/* Prominent Action: Sync Audio Từ Google Drive API */}
          <button
            type="button"
            onClick={() => setIsDriveModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-xs font-bold text-blue-700 shadow-2xs cursor-pointer active:scale-95 transition-all"
            title="Quét & Đồng bộ audio từ Google Drive API lên Firestore"
          >
            <FolderSync className="w-3.5 h-3.5 text-blue-600" />
            <span>Sync Audio Từ Google Drive API</span>
          </button>

          {/* JSON Export / Import */}
          <button
            type="button"
            onClick={() => setIsJsonModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 shadow-2xs cursor-pointer active:scale-95 transition-all"
            title="Xuất hoặc Nhập dữ liệu JSON"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden lg:inline">JSON</span>
          </button>

          {/* Save Draft */}
          <button
            type="button"
            onClick={handleSaveToLocalStorage}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs cursor-pointer active:scale-95 transition-all ${
              hasUnsavedChanges
                ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                : 'border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
            }`}
            title="Lưu các thay đổi nháp vào trình duyệt"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{hasUnsavedChanges ? 'Lưu Nháp *' : 'Lưu Nháp'}</span>
          </button>

          {/* Sync to Firestore */}
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
            title="Đồng bộ trực tiếp lên Firebase Firestore"
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-100" />
            <span>Đồng bộ Firestore</span>
          </button>

          {/* Standalone Toggle / Exit Button */}
          <button
            type="button"
            onClick={() => {
              if (onExitToApp) {
                onExitToApp();
              } else {
                setIsFullStandalone(prev => !prev);
              }
            }}
            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer ml-1"
            title={isFullStandalone ? 'Trở về Classroom' : 'Mở toàn màn hình Standalone'}
          >
            {isFullStandalone ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* --------------------------------------------------------------------------
          TOPIC SELECTOR & CONTROL BAR
         -------------------------------------------------------------------------- */}
      <div className="bg-white border-b border-[#E8E8EC] px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Topic Navigator */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={selectedDay <= 1}
            onClick={() => setSelectedDay(prev => Math.max(1, prev - 1))}
            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="Topic trước (Day - 1)"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-600" />
          </button>

          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(Number(e.target.value))}
            className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-900 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs min-w-[240px]"
          >
            {topics.map(t => {
              const day = t.day_number || t.topic_number;
              const totalInDay = t.mini_lessons?.length || 0;
              let approvedCount = 0;
              (t.mini_lessons || []).forEach((ml, idx) => {
                if (approvedItems[getItemApproveKey(day, idx, ml.file)]) approvedCount++;
              });
              const isAllApproved = totalInDay > 0 && approvedCount === totalInDay;
              return (
                <option key={day} value={day}>
                  Day {day}: {t.lesson_title} ({approvedCount}/{totalInDay} {isAllApproved ? '✓' : ''})
                </option>
              );
            })}
          </select>

          <button
            type="button"
            disabled={selectedDay >= topics.length}
            onClick={() => setSelectedDay(prev => Math.min(topics.length, prev + 1))}
            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="Topic kế tiếp (Day + 1)"
          >
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </button>

          {/* Quick Day Launch to Classroom Projector */}
          {onLaunchProjectorForLesson && (
            <button
              type="button"
              onClick={() => onLaunchProjectorForLesson(currentTopic.lesson_id || `level_b_day_${selectedDay}`, selectedDay)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-zinc-600 hover:text-emerald-700 bg-zinc-100 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
              title="Mở bài học này trong Classroom Focus Projector"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Projector</span>
            </button>
          )}
        </div>

        {/* Stats Chips */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-semibold">
            <span>Tổng số:</span>
            <span className="font-mono font-bold text-zinc-900">{topicStats.total}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
            <span>Đã duyệt:</span>
            <span className="font-mono font-bold">{topicStats.approved}/{topicStats.total}</span>
            {topicStats.total > 0 && topicStats.approved === topicStats.total && <Check className="w-3 h-3 text-emerald-600" />}
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
            <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
            <span>Audio:</span>
            <span className="font-mono font-bold">{topicStats.withAudio}/{topicStats.total}</span>
          </div>

          {/* Approve All in Current Topic */}
          <button
            type="button"
            onClick={handleApproveAllInTopic}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all active:scale-95 cursor-pointer ml-1"
            title="Duyệt tất cả các cấu trúc của Day hiện tại"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Duyệt cả Day {selectedDay}</span>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------------
          SEARCH & FILTER TOOLBAR
         -------------------------------------------------------------------------- */}
      <div className="bg-[#FAFAFB] border-b border-[#E8E8EC] px-5 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Search */}
        <div className="relative min-w-[260px] flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo công thức, mô tả, ví dụ, tên file..."
            className="w-full pl-8 pr-3 py-1 bg-white border border-zinc-200 rounded-lg text-xs font-medium placeholder-zinc-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-1">
            <span className="text-zinc-400 text-[11px] font-semibold">Phân loại:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as any)}
              className="bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-medium text-zinc-700 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
            >
              <option value="all">Tất cả Category</option>
              <option value="sentence_structure">🔵 Mẫu câu (Sentence Structure)</option>
              <option value="verb_form">🟢 Cụm động từ (Verb Form)</option>
              <option value="tense_reflex">🟠 Thì phản xạ (Tense Reflex)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className="text-zinc-400 text-[11px] font-semibold">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-medium text-zinc-700 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
            >
              <option value="all">Tất cả</option>
              <option value="approved">✓ Đã duyệt</option>
              <option value="pending">⏳ Chờ duyệt</option>
              <option value="has_audio">🎵 Có Audio</option>
              <option value="no_audio">⚠️ Thiếu Audio</option>
            </select>
          </div>

          {lastSyncTime && (
            <div className="text-[11px] text-zinc-400 font-mono hidden xl:block ml-2">
              Sync Firestore gần nhất: {lastSyncTime}
            </div>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------------------------
          MAIN COMPACT REVIEW TABLE (CRITICAL REQUIREMENT: NO TRANSCRIPT SHOWN)
         -------------------------------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-2xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-[#E8E8EC] text-[11px] font-mono font-bold uppercase text-zinc-500 tracking-wider">
                <th className="py-3 px-3 w-16 text-center">#</th>
                <th className="py-3 px-4">Cấu Trúc Ngữ Pháp Phản Xạ (Primary Structure)</th>
                <th className="py-3 px-3 w-48">Phân Loại Category</th>
                <th className="py-3 px-3 w-40 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {filteredMiniLessons.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-zinc-400">
                    <p className="font-semibold text-sm">Không tìm thấy cấu trúc nào phù hợp với bộ lọc.</p>
                    <p className="text-xs mt-1">Thử xoá tìm kiếm hoặc chọn bộ lọc "Tất cả".</p>
                  </td>
                </tr>
              ) : (
                filteredMiniLessons.map(({ item, originalIndex }) => {
                  const isApproved = !!approvedItems[getItemApproveKey(selectedDay, originalIndex, item.file)];
                  const isThisAudioPlaying = isPlaying && currentlyPlayingUrl === item.audio_url;
                  const hasAudio = !!item.audio_url;
                  const isEditingThis = inlineEditingKey === `${selectedDay}_${originalIndex}`;

                  return (
                    <tr 
                      key={originalIndex}
                      className={`hover:bg-zinc-50/70 transition-colors ${
                        isApproved ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      {/* COL 1: Index + Compact Audio Button */}
                      <td className="py-3 px-3 align-top text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[11px] font-mono font-bold text-zinc-400">
                            #{originalIndex + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleTogglePlayAudio(item.audio_url)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 ${
                              isThisAudioPlaying
                                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                                : hasAudio
                                ? 'bg-zinc-100 hover:bg-emerald-600 hover:text-white text-zinc-700 border border-zinc-200'
                                : 'bg-zinc-100 text-zinc-300 border border-dashed border-zinc-300 cursor-not-allowed'
                            }`}
                            title={
                              isThisAudioPlaying
                                ? 'Tạm dừng audio'
                                : hasAudio
                                ? `Phát audio (${item.file || 'Google Drive stream'})`
                                : 'Chưa có file audio'
                            }
                          >
                            {isThisAudioPlaying ? (
                              <div className="flex items-end gap-0.5 h-3">
                                <span className="w-0.5 h-3 bg-white animate-pulse" />
                                <span className="w-0.5 h-2 bg-white animate-pulse" />
                                <span className="w-0.5 h-3 bg-white animate-pulse" />
                              </div>
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            )}
                          </button>

                          {/* Audio Source Badge */}
                          <div className="text-[9px] font-mono font-bold uppercase">
                            {item.audio_source === 'google_drive' || (item.audio_url && (item.audio_url.includes('drive.google.com') || item.audio_url.includes('docs.google.com') || item.audio_url.includes('googleapis.com/drive'))) ? (
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-0.5">
                                <HardDrive className="w-2.5 h-2.5 text-emerald-600" />
                                <span>[Drive]</span>
                              </span>
                            ) : item.audio_source === 'local_blob' || (item.audio_url && item.audio_url.startsWith('blob:')) ? (
                              <span className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-200">Local</span>
                            ) : hasAudio ? (
                              <span className="text-purple-600 bg-purple-50 px-1 py-0.5 rounded border border-purple-200">Audio</span>
                            ) : (
                              <span className="text-zinc-400 bg-zinc-100 px-1 py-0.5 rounded">None</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* COL 2: Cấu Trúc Ngữ Pháp Phản Xạ (Primary Structure) */}
                      <td className="py-3 px-4 align-top">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={inlineEditingVal}
                              onChange={e => setInlineEditingVal(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveInlineFormula(originalIndex);
                                if (e.key === 'Escape') setInlineEditingKey(null);
                              }}
                              autoFocus
                              className="flex-1 px-2.5 py-1 bg-white border-2 border-emerald-500 rounded-lg text-xs font-bold text-zinc-900 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveInlineFormula(originalIndex)}
                              className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md cursor-pointer"
                              title="Lưu (Enter)"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineEditingKey(null)}
                              className="p-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-md cursor-pointer"
                              title="Huỷ (Esc)"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="group">
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-bold text-zinc-900 leading-snug">
                                {item.primary_structure || item.topic || 'Chưa đặt tên cấu trúc'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setInlineEditingKey(`${selectedDay}_${originalIndex}`);
                                  setInlineEditingVal(item.primary_structure || item.topic || '');
                                }}
                                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-emerald-600 transition-opacity cursor-pointer p-0.5"
                                title="Chỉnh sửa trực tiếp công thức"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                            {item.topic && item.topic !== item.primary_structure && (
                              <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">
                                {item.topic}
                              </p>
                            )}
                            {item.file && (
                              <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                                File: {item.file}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* COL 3: Phân Loại Category (Dropdown 1-chạm: Mẫu câu, Cụm ĐT, Thì phản xạ) */}
                      <td className="py-3 px-3 align-top">
                        <select
                          value={item.structure_type || 'sentence_structure'}
                          onChange={e => handleChangeCategory(originalIndex, e.target.value as GrammarStructureType)}
                          className={`w-full text-xs font-semibold rounded-lg px-2 py-1.5 border focus:outline-none cursor-pointer transition-all ${
                            (item.structure_type || 'sentence_structure') === 'sentence_structure'
                              ? 'bg-blue-50 text-blue-800 border-blue-200 focus:border-blue-400'
                              : item.structure_type === 'verb_form'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 focus:border-emerald-400'
                              : 'bg-amber-50 text-amber-800 border-amber-200 focus:border-amber-400'
                          }`}
                        >
                          <option value="sentence_structure">🔵 Mẫu câu</option>
                          <option value="verb_form">🟢 Cụm ĐT</option>
                          <option value="tense_reflex">🟠 Thì phản xạ</option>
                        </select>
                      </td>

                      {/* COL 4: Thao Tác (Approve, Edit, Delete) */}
                      <td className="py-3 px-3 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleApprove(originalIndex, item.file)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                              isApproved
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'border border-zinc-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-zinc-600'
                            }`}
                            title={isApproved ? 'Click để bỏ duyệt' : 'Click để phê duyệt cấu trúc này'}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isApproved ? '✓ Đã duyệt' : 'Chờ duyệt'}</span>
                          </button>

                          {/* Edit Modal Button */}
                          <button
                            type="button"
                            onClick={() => setEditingItem({ topicIdx: currentTopicIndex, itemIdx: originalIndex, item })}
                            className="p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
                            title="Sửa chi tiết (modal)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Xoá cấu trúc "${item.primary_structure || item.topic}"?`)) {
                                updateCurrentTopic(t => {
                                  const lessons = (t.mini_lessons || []).filter((_, i) => i !== originalIndex);
                                  return { ...t, mini_lessons: lessons };
                                });
                                showToast('Đã xoá cấu trúc khỏi topic.');
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Xoá cấu trúc này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* --------------------------------------------------------------------------
          BOTTOM QUICK DAY PILLS (Horizontal Bar)
         -------------------------------------------------------------------------- */}
      <div className="bg-white border-t border-[#E8E8EC] px-4 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 shadow-xs">
        <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 shrink-0 mr-1">
          30 Days:
        </span>
        {topics.map(t => {
          const day = t.day_number || t.topic_number;
          const isCurrent = day === selectedDay;
          const totalInDay = t.mini_lessons?.length || 0;
          let approvedCount = 0;
          (t.mini_lessons || []).forEach((ml, idx) => {
            if (approvedItems[getItemApproveKey(day, idx, ml.file)]) approvedCount++;
          });
          const isComplete = totalInDay > 0 && approvedCount === totalInDay;

          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold shrink-0 flex items-center gap-1 transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : isComplete
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
              title={`Day ${day}: ${approvedCount}/${totalInDay} đã duyệt`}
            >
              <span>D{day}</span>
              {isComplete && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>
          );
        })}
      </div>

      {/* --------------------------------------------------------------------------
          MODAL 1: GOOGLE DRIVE & LOCAL FOLDER AUTO-SYNC
         -------------------------------------------------------------------------- */}
      {isDriveModalOpen && (
        <GoogleDriveSyncModal
          isOpen={isDriveModalOpen}
          onClose={() => setIsDriveModalOpen(false)}
          topics={topics}
          selectedDay={selectedDay}
          onApplyUpdatedTopics={(updatedTopics) => {
            setTopics(updatedTopics.map(recomputeTopic));
            setHasUnsavedChanges(true);
            showToast('Đã ánh xạ audio thành công vào danh mục Topics!');
          }}
          onSyncComplete={(msg) => {
            const now = new Date().toLocaleString('vi-VN');
            setLastSyncTime(now);
            localStorage.setItem(LOCAL_STORAGE_LAST_SYNC_KEY, now);
            setHasUnsavedChanges(false);
            showToast(msg, 'success');
          }}
        />
      )}

      {/* --------------------------------------------------------------------------
          MODAL 2: FIRESTORE SYNC (Single & Batch 30 Topics)
         -------------------------------------------------------------------------- */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Đồng Bộ Firestore Database</h3>
                  <p className="text-xs text-zinc-500">Cập nhật dữ liệu trực tiếp vào Firebase /lessons</p>
                </div>
              </div>
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 text-xs space-y-1.5">
                <div className="flex justify-between text-zinc-600">
                  <span>Topic hiện tại:</span>
                  <span className="font-bold text-zinc-900">Day {selectedDay} ({currentTopic?.lesson_title})</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Đích lưu Firestore:</span>
                  <span className="font-mono text-zinc-900">/lessons/{currentTopic?.lesson_id || `level_b_day_${selectedDay}`}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Lần sync gần nhất:</span>
                  <span className="font-mono text-zinc-900">{lastSyncTime || 'Chưa ghi nhận'}</span>
                </div>
              </div>

              {/* Progress Bar when syncing */}
              {isSyncing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-zinc-700">
                    <span>{syncProgress.message || 'Đang đồng bộ...'}</span>
                    <span>{syncProgress.current} / {syncProgress.total}</span>
                  </div>
                  <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full transition-all duration-200" 
                      style={{ width: `${(syncProgress.current / (syncProgress.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Log messages */}
              {syncLogs.length > 0 && (
                <div className="bg-zinc-900 text-zinc-200 p-3 rounded-xl font-mono text-[11px] max-h-40 overflow-y-auto space-y-1">
                  {syncLogs.map((log, lIdx) => (
                    <div key={lIdx} className="leading-relaxed">{log}</div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSyncCurrentTopicToFirestore}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <Cloud className="w-4 h-4" />
                  <span>Sync Riêng Day {selectedDay}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncAll30TopicsToFirestore}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Database className="w-4 h-4" />
                  <span>Sync Cả 30 Topics</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------
          MODAL 3: AGENT AI REVIEW AUDIT MODAL
         -------------------------------------------------------------------------- */}
      {isAgentReviewModalOpen && agentAuditReport && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Agent AI Audit Report</h3>
                  <p className="text-xs text-zinc-500">Kiểm tra tính toàn vẹn của 30 Topics</p>
                </div>
              </div>
              <button
                onClick={() => setIsAgentReviewModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Score card */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-center">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">Tổng số đã quét</div>
                  <div className="text-lg font-bold text-zinc-900 font-mono mt-0.5">{agentAuditReport.totalAudited}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase">Chuẩn 100%</div>
                  <div className="text-lg font-bold text-emerald-800 font-mono mt-0.5">{agentAuditReport.cleanCount}</div>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
                  <div className="text-[10px] font-bold text-rose-700 uppercase">Cần lưu ý</div>
                  <div className="text-lg font-bold text-rose-800 font-mono mt-0.5">{agentAuditReport.flaggedCount}</div>
                </div>
              </div>

              {/* Issues list */}
              {agentAuditReport.issues.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-700">Chi tiết các mục cần kiểm tra:</h4>
                  <div className="max-h-56 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200 rounded-xl bg-zinc-50/50 p-2">
                    {agentAuditReport.issues.map((iss, iIdx) => (
                      <div key={iIdx} className="py-2 px-2 text-xs flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-zinc-800">Day {iss.topicDay}</span>
                          <span className="mx-1 text-zinc-400">•</span>
                          <span className="font-semibold text-zinc-900">"{iss.formula}"</span>
                          <p className="text-[11px] text-rose-600 mt-0.5">{iss.issue}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDay(iss.topicDay);
                            setIsAgentReviewModalOpen(false);
                          }}
                          className="px-2 py-1 bg-white hover:bg-zinc-100 text-[10px] font-bold text-zinc-600 border border-zinc-200 rounded-md shrink-0 cursor-pointer"
                        >
                          Đến Day {iss.topicDay} &rarr;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-800">
                  🎉 Toàn bộ {agentAuditReport.totalAudited} cấu trúc đều hoàn hảo, đầy đủ audio và ví dụ song ngữ!
                </div>
              )}

              {/* Action */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAgentReviewModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-700 cursor-pointer"
                >
                  Đóng
                </button>
                {agentAuditReport.cleanCount > 0 && (
                  <button
                    type="button"
                    onClick={handleAgentAutoApproveClean}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Agent Tự Động Duyệt {agentAuditReport.cleanCount} Mục Đạt Chuẩn</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------
          MODAL 4: JSON EXPORT & IMPORT
         -------------------------------------------------------------------------- */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-900">Sao Lưu & Phục Hồi JSON</h3>
              <button onClick={() => setIsJsonModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              Bạn có thể tải xuống file JSON toàn bộ 30 Topics đã review hoặc import file JSON đã chỉnh sửa từ bên ngoài vào.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleExportJson}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Xuất File JSON (Backup)</span>
              </button>

              <label className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-zinc-200 hover:bg-zinc-50 text-zinc-800 text-xs font-bold rounded-xl transition-all cursor-pointer">
                <Upload className="w-4 h-4 text-zinc-500" />
                <span>Nhập File JSON Từ Máy Tính</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJsonFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------
          MODAL 5: EDIT MINI LESSON DETAILS
         -------------------------------------------------------------------------- */}
      {editingItem && (
        <EditMiniLessonModal
          isOpen={!!editingItem}
          item={editingItem.item}
          onClose={() => setEditingItem(null)}
          onSave={(updatedItem) => {
            updateCurrentTopic(t => {
              const lessons = [...(t.mini_lessons || [])];
              lessons[editingItem.itemIdx] = updatedItem;
              return { ...t, mini_lessons: lessons };
            });
            setEditingItem(null);
            showToast('Đã lưu chi tiết cấu trúc!');
          }}
        />
      )}
    </div>
  );
};

// --------------------------------------------------------------------------
// Sub-Modal: Google Drive & Local Audio Folder Sync
// --------------------------------------------------------------------------
interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: TopicResourceData[];
  selectedDay: number;
  onApplyUpdatedTopics: (topics: TopicResourceData[]) => void;
  onSyncComplete?: (message: string) => void;
}

const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({
  isOpen,
  onClose,
  topics,
  selectedDay,
  onApplyUpdatedTopics,
  onSyncComplete
}) => {
  const [activeTab, setActiveTab] = useState<'scan_drive' | 'upload_to_drive' | 'local_folder'>('scan_drive');
  const [folderUrl, setFolderUrl] = useState<string>(() => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('chunks_gdrive_folder_id') || '' : '';
  });
  const [apiKey, setApiKey] = useState<string>(() => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('chunks_gdrive_api_key') || '' : '';
  });
  const [accessToken, setAccessToken] = useState<string>(() => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('chunks_gdrive_access_token') || '' : '';
  });
  const [overwriteExisting, setOverwriteExisting] = useState<boolean>(true);
  const [mapScope, setMapScope] = useState<'all_topics' | 'current_day'>('all_topics');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncingFirestore, setIsSyncingFirestore] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; percent: number; message: string } | null>(null);
  const [completionSummary, setCompletionSummary] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [matchedCount, setMatchedCount] = useState<number>(0);
  const [selectedUploadFiles, setSelectedUploadFiles] = useState<File[]>([]);

  // Persistent Input Handlers
  const handleFolderUrlChange = (val: string) => {
    setFolderUrl(val);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('chunks_gdrive_folder_id', val.trim());
    }
  };

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('chunks_gdrive_api_key', val.trim());
    }
  };

  const handleAccessTokenChange = (val: string) => {
    setAccessToken(val);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('chunks_gdrive_access_token', val.trim());
    }
  };

  // 1-Click: Quét Google Drive & Sync Trực Tiếp Lên Firestore
  const handleScanAndDirectSyncFirestore = async () => {
    if (!folderUrl.trim()) {
      alert('Vui lòng nhập Google Drive Folder URL hoặc Folder ID.');
      return;
    }

    setIsLoading(true);
    setIsSyncingFirestore(true);
    setLogs([]);
    setMatchedCount(0);
    setCompletionSummary(null);

    try {
      const parsed = parseGoogleDriveUrl(folderUrl, 'folder');
      const folderId = parsed.id || folderUrl.trim();

      // Persist in localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('chunks_gdrive_folder_id', folderUrl.trim());
        if (apiKey) localStorage.setItem('chunks_gdrive_api_key', apiKey.trim());
        if (accessToken) localStorage.setItem('chunks_gdrive_access_token', accessToken.trim());
      }

      setLogs(prev => [...prev, `[INIT] Đang kết nối tới Google Drive API với Folder ID: ${folderId}...`]);
      setSyncProgress({ current: 0, total: 100, percent: 10, message: 'Đang quét files audio từ Google Drive API...' });

      const scanResult = await fetchDriveFolderFiles(folderId, apiKey, accessToken);

      setLogs(prev => [
        ...prev,
        `[FETCH] Đã tìm thấy ${scanResult.audioFiles.length} file audio hợp lệ trên Google Drive.`
      ]);

      const mapOptions = {
        targetDayNumber: mapScope === 'current_day' ? selectedDay : undefined,
        overwriteExisting
      };

      setSyncProgress({ current: 0, total: 100, percent: 30, message: 'Đang tự động map audio với các cấu trúc ngữ pháp...' });
      const mapResult = autoMapDriveFilesToTopics(scanResult.audioFiles, topics, mapOptions);

      setLogs(prev => [...prev, ...mapResult.logs]);
      setMatchedCount(mapResult.matchedCount);

      if (mapResult.matchedCount === 0) {
        setLogs(prev => [...prev, '[WARN] Không có file audio nào khớp với cấu trúc trong topic. Huỷ đồng bộ Firestore.']);
        setIsLoading(false);
        setIsSyncingFirestore(false);
        setSyncProgress(null);
        return;
      }

      // Update in-memory state
      onApplyUpdatedTopics(mapResult.updatedTopics);

      // Direct Batch Sync to Firestore!
      setLogs(prev => [...prev, `[FIRESTORE] Đang đồng bộ trực tiếp ${mapResult.updatedTopics.length} topics lên Firebase Firestore...`]);

      const targetTopicsToSync = mapScope === 'current_day'
        ? mapResult.updatedTopics.filter((t: any) => t.day_number === selectedDay || t.topic_number === selectedDay)
        : mapResult.updatedTopics;

      const totalSync = targetTopicsToSync.length;

      for (let i = 0; i < totalSync; i++) {
        const t = targetTopicsToSync[i];
        const docId = t.lesson_id || `level_b_day_${t.day_number || t.topic_number}`;
        const pct = 30 + Math.round(((i + 1) / totalSync) * 70);

        setSyncProgress({
          current: i + 1,
          total: totalSync,
          percent: pct,
          message: `[${i + 1}/${totalSync}] Đang lưu Day ${t.day_number || t.topic_number} (${t.lesson_title}) lên Firestore...`
        });

        const grammarPayload: LessonGrammar = {
          verb_forms: t.verb_forms || [],
          sentence_structures: t.sentence_structures || [],
          tense: t.tense || [],
          notes: t.notes || '',
          mini_lessons: t.mini_lessons || [],
          total_audio_files: t.total_audio_files || 0,
          source_type: 'google_drive',
          thematic_module: t.thematic_module,
          status: 'active'
        };

        const res = await saveLessonGrammar(docId, grammarPayload);
        if (!res.success) {
          throw new Error(`Lỗi lưu Firestore tại ${docId}: ${res.error}`);
        }
        curriculumRegistry.updateLessonGrammar(docId, grammarPayload);
        setLogs(prev => [...prev, `[FIRESTORE ✓] Day ${t.day_number || t.topic_number} (${docId}) đã đồng bộ thành công!`]);
      }

      const summary = `Đã map và sync thành công ${mapResult.matchedCount} audio files từ Google Drive lên Firestore!`;
      setCompletionSummary(summary);
      setLogs(prev => [...prev, `[SUCCESS 🎉] ${summary}`]);
      setSyncProgress({ current: totalSync, total: totalSync, percent: 100, message: 'Hoàn tất đồng bộ 100% lên Firestore!' });
      onSyncComplete?.(summary);
    } catch (err: any) {
      setLogs(prev => [...prev, `[ERROR ❌] ${err?.message || String(err)}`]);
    } finally {
      setIsLoading(false);
      setIsSyncingFirestore(false);
    }
  };

  // Quét & Xem Trước (Không Sync Firestore)
  const handleScanPreviewOnly = async () => {
    if (!folderUrl.trim()) {
      alert('Vui lòng nhập Google Drive Folder URL hoặc Folder ID.');
      return;
    }

    setIsLoading(true);
    setLogs([]);
    setMatchedCount(0);
    setCompletionSummary(null);
    setSyncProgress(null);

    try {
      const parsed = parseGoogleDriveUrl(folderUrl, 'folder');
      const folderId = parsed.id || folderUrl.trim();

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('chunks_gdrive_folder_id', folderUrl.trim());
        if (apiKey) localStorage.setItem('chunks_gdrive_api_key', apiKey.trim());
        if (accessToken) localStorage.setItem('chunks_gdrive_access_token', accessToken.trim());
      }

      setLogs(prev => [...prev, `[INIT] Đang kết nối tới Google Drive Folder ID: ${folderId}...`]);
      const scanResult = await fetchDriveFolderFiles(folderId, apiKey, accessToken);

      setLogs(prev => [
        ...prev,
        `[FETCH] Đã tìm thấy ${scanResult.audioFiles.length} file audio hợp lệ trên Google Drive.`
      ]);

      const mapOptions = {
        targetDayNumber: mapScope === 'current_day' ? selectedDay : undefined,
        overwriteExisting
      };

      const mapResult = autoMapDriveFilesToTopics(scanResult.audioFiles, topics, mapOptions);

      setLogs(prev => [...prev, ...mapResult.logs]);
      setMatchedCount(mapResult.matchedCount);

      if (mapResult.matchedCount > 0) {
        onApplyUpdatedTopics(mapResult.updatedTopics);
        setCompletionSummary(`Đã map thành công ${mapResult.matchedCount} files vào danh mục (Chưa lưu Firestore).`);
      }
    } catch (err: any) {
      setLogs(prev => [...prev, `[ERROR ❌] ${err?.message || String(err)}`]);
    } finally {
      setIsLoading(false);
    }
  };

  // Upload Thư Mục Lên Google Drive & Sync Firestore
  const handleSelectFilesForDriveUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const audioExtensions = /\.(mp3|wav|m4a|ogg|aac|flac)$/i;
    const filtered = Array.from(files).filter((f: File) => audioExtensions.test(f.name));
    setSelectedUploadFiles(filtered);
    setLogs([`Đã chọn ${filtered.length} file audio hợp lệ từ máy tính.`]);
  };

  const handleStartUploadToDriveAndSync = async () => {
    if (selectedUploadFiles.length === 0) {
      alert('Vui lòng chọn thư mục chứa file audio trước khi bắt đầu upload.');
      return;
    }

    if (!accessToken.trim()) {
      alert('OAuth Access Token là bắt buộc để upload file lên Google Drive qua REST API.');
      return;
    }

    const parsed = parseGoogleDriveUrl(folderUrl, 'folder');
    const folderId = parsed.id || folderUrl.trim();
    if (!folderId) {
      alert('Vui lòng nhập Google Drive Folder URL hoặc Folder ID đích.');
      return;
    }

    setIsLoading(true);
    setLogs([]);
    setMatchedCount(0);
    setCompletionSummary(null);

    try {
      setLogs(prev => [
        ...prev,
        `[UPLOAD INIT] Bắt đầu upload ${selectedUploadFiles.length} files lên Google Drive Folder: ${folderId}...`
      ]);

      const uploadedDriveItems: DriveFileItem[] = [];

      for (let i = 0; i < selectedUploadFiles.length; i++) {
        const file = selectedUploadFiles[i];
        const pct = Math.round(((i + 1) / selectedUploadFiles.length) * 50);
        setSyncProgress({
          current: i + 1,
          total: selectedUploadFiles.length,
          percent: pct,
          message: `[${i + 1}/${selectedUploadFiles.length}] Đang upload "${file.name}" lên Google Drive...`
        });

        const uploadedItem = await uploadFileToDrive(file, folderId, accessToken);
        uploadedDriveItems.push(uploadedItem);
        setLogs(prev => [...prev, `[UPLOADED ✓] ${file.name} (Drive ID: ${uploadedItem.id})`]);
      }

      setLogs(prev => [
        ...prev,
        `[MAP] Đã upload thành công ${uploadedDriveItems.length} file lên Google Drive. Đang auto-map vào 30 topics...`
      ]);

      const mapResult = autoMapDriveFilesToTopics(uploadedDriveItems, topics, { overwriteExisting: true });
      setLogs(prev => [...prev, ...mapResult.logs]);
      setMatchedCount(mapResult.matchedCount);

      if (mapResult.matchedCount > 0) {
        onApplyUpdatedTopics(mapResult.updatedTopics);

        // Directly sync to Firestore!
        setLogs(prev => [...prev, `[FIRESTORE] Đang đồng bộ trực tiếp cấu trúc mới lên Firebase Firestore...`]);
        const totalSync = mapResult.updatedTopics.length;

        for (let i = 0; i < totalSync; i++) {
          const t = mapResult.updatedTopics[i];
          const docId = t.lesson_id || `level_b_day_${t.day_number || t.topic_number}`;
          const pct = 50 + Math.round(((i + 1) / totalSync) * 50);

          setSyncProgress({
            current: i + 1,
            total: totalSync,
            percent: pct,
            message: `[${i + 1}/${totalSync}] Đang lưu Firestore Day ${t.day_number || t.topic_number}...`
          });

          const grammarPayload: LessonGrammar = {
            verb_forms: t.verb_forms || [],
            sentence_structures: t.sentence_structures || [],
            tense: t.tense || [],
            notes: t.notes || '',
            mini_lessons: t.mini_lessons || [],
            total_audio_files: t.total_audio_files || 0,
            source_type: 'google_drive',
            thematic_module: t.thematic_module,
            status: 'active'
          };

          await saveLessonGrammar(docId, grammarPayload);
          curriculumRegistry.updateLessonGrammar(docId, grammarPayload);
        }

        const summary = `Đã upload ${uploadedDriveItems.length} audio files lên Google Drive và sync thành công ${mapResult.matchedCount} cấu trúc lên Firestore!`;
        setCompletionSummary(summary);
        setLogs(prev => [...prev, `[SUCCESS 🎉] ${summary}`]);
        setSyncProgress({ current: totalSync, total: totalSync, percent: 100, message: 'Hoàn tất upload và sync Firestore 100%!' });
        onSyncComplete?.(summary);
      }
    } catch (err: any) {
      setLogs(prev => [...prev, `[ERROR ❌] ${err?.message || String(err)}`]);
    } finally {
      setIsLoading(false);
    }
  };

  // Local Folder Auto-Map (Instant Blob Preview)
  const handleSelectLocalFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setLogs([]);
    setMatchedCount(0);
    setCompletionSummary(null);

    try {
      setLogs(prev => [...prev, `[LOCAL] Đang xử lý ${files.length} files từ máy tính...`]);

      const mapOptions = {
        targetDayNumber: mapScope === 'current_day' ? selectedDay : undefined,
        overwriteExisting
      };

      const mapResult = autoMapLocalFilesToTopics(files, topics, mapOptions);
      setLogs(prev => [...prev, ...mapResult.logs]);
      setMatchedCount(mapResult.matchedCount);

      if (mapResult.matchedCount > 0) {
        onApplyUpdatedTopics(mapResult.updatedTopics);
        setCompletionSummary(`Đã map ${mapResult.matchedCount} audio files từ máy tính để nghe thử ngay!`);
      }
    } catch (err: any) {
      setLogs(prev => [...prev, `[ERROR ❌] ${err?.message || String(err)}`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-2xs">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Google Drive API & Audio Auto-Sync</h3>
              <p className="text-xs text-zinc-500">Tự động quét, gắn audio Google Drive trực tiếp lên Firestore 1-chạm</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 bg-zinc-50 px-6 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('scan_drive')}
            className={`pb-2.5 px-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'scan_drive'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Quét Google Drive & Sync Firestore
          </button>
          <button
            onClick={() => setActiveTab('upload_to_drive')}
            className={`pb-2.5 px-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'upload_to_drive'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Upload Thư Mục Lên Drive qua API & Sync
          </button>
          <button
            onClick={() => setActiveTab('local_folder')}
            className={`pb-2.5 px-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'local_folder'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Nghe Thử Offline (File Máy Tính)
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* TAB 1: Scan Drive & 1-Click Sync */}
          {activeTab === 'scan_drive' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Google Drive Folder URL / Folder ID *
                </label>
                <input
                  type="text"
                  value={folderUrl}
                  onChange={e => handleFolderUrlChange(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRs... hoặc ID folder"
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 shadow-2xs"
                />
                <span className="text-[10px] text-zinc-400 mt-0.5 block">
                  Được tự động lưu vào trình duyệt (localStorage: chunks_gdrive_folder_id)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Google Drive API Key (Folder công khai)
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={e => handleApiKeyChange(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">
                    (localStorage: chunks_gdrive_api_key)
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    OAuth Access Token (Folder riêng tư)
                  </label>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={e => handleAccessTokenChange(e.target.value)}
                    placeholder="ya29.a0..."
                    className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">
                    (localStorage: chunks_gdrive_access_token)
                  </span>
                </div>
              </div>

              {/* Options */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-zinc-700">
                    <input
                      type="radio"
                      name="mapScope"
                      checked={mapScope === 'all_topics'}
                      onChange={() => setMapScope('all_topics')}
                    />
                    <span>Map cả 30 Topics</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-zinc-700">
                    <input
                      type="radio"
                      name="mapScope"
                      checked={mapScope === 'current_day'}
                      onChange={() => setMapScope('current_day')}
                    />
                    <span>Chỉ map cho Day {selectedDay}</span>
                  </label>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-600">
                  <input
                    type="checkbox"
                    checked={overwriteExisting}
                    onChange={e => setOverwriteExisting(e.target.checked)}
                  />
                  <span>Ghi đè nếu đã có audio</span>
                </label>
              </div>

              {/* Primary 1-Click Sync Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleScanAndDirectSyncFirestore}
                  disabled={isLoading}
                  className="flex-1 w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
                >
                  <FolderSync className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Đang Quét & Đồng Bộ...' : '⚡ Quét & Sync Trực Tiếp Lên Firestore (1-Click)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleScanPreviewOnly}
                  disabled={isLoading}
                  className="w-full sm:w-auto py-2.5 px-4 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  title="Chỉ map và gắn vào bảng review hiện tại mà không tự động lưu lên Firestore"
                >
                  Chỉ Quét & Xem Trước
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Upload to Drive & Sync */}
          {activeTab === 'upload_to_drive' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                <p className="font-bold mb-0.5">📂 Upload tự động thư mục audio lên Google Drive & Sync Firestore:</p>
                <p className="text-zinc-600 text-[11px]">
                  Chọn thư mục máy tính chứa audio (VD: <code>C:\Users\gensh\Downloads\chunks-grammar\FULL 30 Topic_P@W\Grammar Boost\Grammar Boost</code>). Hệ thống sẽ upload từng file lên Google Drive, lấy direct URL và đồng bộ 1-click lên Firestore!
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Google Drive Folder Đích (URL hoặc Folder ID) *
                </label>
                <input
                  type="text"
                  value={folderUrl}
                  onChange={e => handleFolderUrlChange(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  OAuth Access Token (Bắt buộc để upload) *
                </label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={e => handleAccessTokenChange(e.target.value)}
                  placeholder="ya29.a0..."
                  className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>

              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-300 hover:border-blue-500 rounded-2xl bg-zinc-50 hover:bg-blue-50/30 transition-all cursor-pointer">
                <FolderOpen className="w-8 h-8 text-blue-500 mb-1.5" />
                <span className="text-xs font-bold text-zinc-800">Chọn Thư Mục Chứa File MP3 Cần Upload</span>
                <span className="text-[11px] text-zinc-400 mt-0.5">
                  {selectedUploadFiles.length > 0
                    ? `Đã chọn ${selectedUploadFiles.length} file audio sẵn sàng upload`
                    : 'Hỗ trợ cấu trúc thư mục Topic 1..30 hoặc toàn bộ thư mục audio'}
                </span>
                <input
                  type="file"
                  // @ts-ignore
                  webkitdirectory=""
                  directory=""
                  multiple
                  onChange={handleSelectFilesForDriveUpload}
                  className="hidden"
                />
              </label>

              {selectedUploadFiles.length > 0 && (
                <button
                  type="button"
                  onClick={handleStartUploadToDriveAndSync}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isLoading ? 'Đang Upload & Sync...' : `Bắt Đầu Upload ${selectedUploadFiles.length} File Lên Google Drive & Sync Firestore`}</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 3: Local Folder Instant Preview */}
          {activeTab === 'local_folder' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                <p className="font-bold mb-1">💡 Nghe thử ngay lập tức không cần mạng!</p>
                <p className="text-zinc-600">
                  Chọn thư mục chứa file MP3 trên máy tính. Hệ thống sẽ tạo Blob URL và gắn trực tiếp vào các cấu trúc tương ứng để bạn kiểm tra và duyệt ngay.
                </p>
              </div>

              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-300 hover:border-blue-500 rounded-2xl bg-zinc-50 hover:bg-blue-50/30 transition-all cursor-pointer">
                <FolderOpen className="w-10 h-10 text-blue-500 mb-2" />
                <span className="text-xs font-bold text-zinc-800">Chọn Thư Mục Audio Từ Máy Tính</span>
                <span className="text-[11px] text-zinc-400 mt-1">Hỗ trợ file .mp3, .wav, .m4a</span>
                <input
                  type="file"
                  // @ts-ignore
                  webkitdirectory=""
                  directory=""
                  multiple
                  onChange={handleSelectLocalFolder}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Progress Bar */}
          {syncProgress && (
            <div className="space-y-1.5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                <span className="truncate max-w-[80%]">{syncProgress.message}</span>
                <span className="font-mono">{syncProgress.percent}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${syncProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Completion Summary Card */}
          {completionSummary && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-900">Đồng Bộ Hoàn Tất!</div>
                <div className="text-xs text-emerald-700">{completionSummary}</div>
              </div>
            </div>
          )}

          {/* Real-time Logs Console */}
          {logs.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
                <span>Nhật Ký Auto-Mapping & Sync:</span>
                {matchedCount > 0 && (
                  <span className="text-emerald-600">Đã khớp {matchedCount} audio files!</span>
                )}
              </div>
              <div className="bg-zinc-950 text-emerald-400 p-3.5 rounded-xl font-mono text-[11px] max-h-44 overflow-y-auto space-y-1">
                {logs.map((log, lIdx) => (
                  <div
                    key={lIdx}
                    className={
                      log.includes('[ERROR')
                        ? 'text-rose-400'
                        : log.includes('[SUCCESS') || log.includes('[FIRESTORE ✓]') || log.includes('[MATCH]') || log.includes('[EXACT MATCH]')
                        ? 'text-emerald-300'
                        : log.includes('[FETCH') || log.includes('[UPLOADED')
                        ? 'text-blue-300'
                        : 'text-zinc-300'
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------
// Sub-Modal: Edit Mini Lesson Details
// --------------------------------------------------------------------------
interface EditMiniLessonModalProps {
  isOpen: boolean;
  item: GrammarMiniLesson;
  onClose: () => void;
  onSave: (updated: GrammarMiniLesson) => void;
}

const EditMiniLessonModal: React.FC<EditMiniLessonModalProps> = ({
  item,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<GrammarMiniLesson>({ ...item });
  const [examples, setExamples] = useState<GrammarExample[]>(item.examples || []);

  const handleAddExample = () => {
    setExamples(prev => [...prev, { en: '', vi: '' }]);
  };

  const handleUpdateExample = (index: number, field: 'en' | 'vi', val: string) => {
    setExamples(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleDeleteExample = (index: number) => {
    setExamples(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({
      ...formData,
      examples: examples.filter(ex => ex.en.trim() || ex.vi.trim())
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900">Chỉnh Sửa Chi Tiết Cấu Trúc</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto text-xs">
          <div>
            <label className="block font-bold text-zinc-700 mb-1">Cấu Trúc Ngữ Pháp (Primary Formula) *</label>
            <input
              type="text"
              value={formData.primary_structure || ''}
              onChange={e => setFormData({ ...formData, primary_structure: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Category (Phân loại)</label>
              <select
                value={formData.structure_type || 'sentence_structure'}
                onChange={e => setFormData({ ...formData, structure_type: e.target.value as GrammarStructureType })}
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="sentence_structure">🔵 Mẫu câu (Sentence Structure)</option>
                <option value="verb_form">🟢 Cụm động từ (Verb Form)</option>
                <option value="tense_reflex">🟠 Thì phản xạ (Tense Reflex)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Tên File Audio</label>
              <input
                type="text"
                value={formData.file || ''}
                onChange={e => setFormData({ ...formData, file: e.target.value })}
                placeholder="1en_Gr_01_1.mp3"
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl font-mono text-zinc-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-700 mb-1">URL Audio Trực Tiếp / Google Drive Stream</label>
            <input
              type="text"
              value={formData.audio_url || ''}
              onChange={e => setFormData({ ...formData, audio_url: e.target.value })}
              placeholder="https://docs.google.com/uc?export=download&id=..."
              className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl font-mono text-zinc-700 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Bilingual Examples */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-zinc-700">Ví Dụ Song Ngữ</label>
              <button
                type="button"
                onClick={handleAddExample}
                className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm ví dụ</span>
              </button>
            </div>

            {examples.map((ex, idx) => (
              <div key={idx} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 relative group">
                <input
                  type="text"
                  value={ex.en}
                  onChange={e => handleUpdateExample(idx, 'en', e.target.value)}
                  placeholder="English example..."
                  className="w-full px-2.5 py-1 bg-white border border-zinc-300 rounded-lg font-bold text-zinc-900"
                />
                <input
                  type="text"
                  value={ex.vi}
                  onChange={e => handleUpdateExample(idx, 'vi', e.target.value)}
                  placeholder="Dịch nghĩa tiếng Việt..."
                  className="w-full px-2.5 py-1 bg-white border border-zinc-300 rounded-lg italic text-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteExample(idx)}
                  className="absolute top-2 right-2 text-zinc-400 hover:text-rose-600 p-1"
                  title="Xoá ví dụ này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-bold rounded-xl"
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
            >
              Lưu Thay Đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper for category label
function getCategoryLabel(cat?: GrammarStructureType): string {
  if (cat === 'sentence_structure') return 'Mẫu câu (Sentence Structure)';
  if (cat === 'verb_form') return 'Cụm động từ (Verb Form)';
  if (cat === 'tense_reflex') return 'Thì phản xạ (Tense Reflex)';
  return 'Mẫu câu';
}

export default GrammarReviewPortal;
