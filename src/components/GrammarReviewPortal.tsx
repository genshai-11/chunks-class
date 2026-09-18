import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Check, 
  CheckCircle2, 
  Cloud, 
  Save, 
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
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  ArrowRight,
  Database,
  Layers,
  HelpCircle,
  FolderOpen,
  Loader2
} from 'lucide-react';
import { 
  TopicResourceData, 
  getGoogleDriveStreamUrl 
} from '../services/googleDriveService';
import { 
  saveLessonGrammar,
  getAllLevelBGrammarFromFirestore
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

/**
 * Merges live LessonGrammar from Cloud Firestore into a TopicResourceData instance
 */
export function mergeLiveGrammarIntoTopic(topic: TopicResourceData, live: LessonGrammar): TopicResourceData {
  let updatedMini = topic.mini_lessons || [];
  if (Array.isArray(live.mini_lessons) && live.mini_lessons.length > 0) {
    updatedMini = live.mini_lessons.map((ml: any, idx: number) => {
      const existingMl = topic.mini_lessons ? topic.mini_lessons[idx] : undefined;
      return {
        ...ml,
        audio_url: ml.audio_url || existingMl?.audio_url || '',
        audio_source: ml.audio_source || existingMl?.audio_source || 'google_drive',
        gdrive_file_id: ml.gdrive_file_id || existingMl?.gdrive_file_id,
        structure_type: ml.structure_type || existingMl?.structure_type || 'sentence_structure',
        primary_structure: ml.primary_structure || ml.topic || existingMl?.primary_structure || ''
      };
    });
  }

  return recomputeTopic({
    ...topic,
    sentence_structures: (live.sentence_structures && live.sentence_structures.length > 0) ? live.sentence_structures : topic.sentence_structures || [],
    verb_forms: (live.verb_forms && live.verb_forms.length > 0) ? live.verb_forms : topic.verb_forms || [],
    tense: (live.tense && live.tense.length > 0) ? live.tense : topic.tense || [],
    notes: live.notes !== undefined ? live.notes : topic.notes || '',
    thematic_module: live.thematic_module || topic.thematic_module,
    source_type: live.source_type || topic.source_type || 'audio_boost',
    status: (live.status as any) || topic.status || 'active',
    mini_lessons: updatedMini
  });
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
  const [loadingAudioUrl, setLoadingAudioUrl] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | GrammarStructureType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'has_audio' | 'no_audio'>('all');

  // Modals & Panels
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
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

  // Firestore Loading & Sync Progress
  const [isLoadingFirestore, setIsLoadingFirestore] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; message: string }>({
    current: 0,
    total: 30,
    message: ''
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [syncBanner, setSyncBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Show Toast
  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  }, []);

  // --------------------------------------------------------------------------
  // Live Firestore Fetch & Sync Helper
  // --------------------------------------------------------------------------
  const loadLiveGrammarFromFirestore = useCallback(async (isManualRefresh: boolean = false) => {
    setIsLoadingFirestore(true);
    try {
      const res = await getAllLevelBGrammarFromFirestore();
      if (res.success && Object.keys(res.grammarByDay).length > 0) {
        setTopics(prevTopics => {
          const updatedTopics = prevTopics.map(t => {
            const day = t.day_number || t.topic_number || 1;
            const liveGrammar = res.grammarByDay[day];
            if (liveGrammar) {
              const merged = mergeLiveGrammarIntoTopic(t, liveGrammar);
              const lessonDocId = merged.lesson_id || `level_b_day_${day}`;
              curriculumRegistry.updateLessonGrammar(lessonDocId, {
                verb_forms: merged.verb_forms || [],
                sentence_structures: merged.sentence_structures || [],
                tense: merged.tense || [],
                notes: merged.notes || '',
                mini_lessons: merged.mini_lessons || [],
                total_audio_files: merged.total_audio_files || 0,
                source_type: merged.source_type || 'audio_boost',
                thematic_module: merged.thematic_module,
                status: 'active'
              });
              return merged;
            }
            return t;
          });

          // Sync to localStorage
          try {
            localStorage.setItem(LOCAL_STORAGE_CATALOG_KEY, JSON.stringify(updatedTopics));
            const now = new Date().toLocaleString('en-US');
            setLastSyncTime(now);
            localStorage.setItem(LOCAL_STORAGE_LAST_SYNC_KEY, now);
          } catch (e) {
            console.warn('[GrammarReviewPortal] Could not save to localStorage:', e);
          }

          return updatedTopics;
        });

        const count = Object.keys(res.grammarByDay).length;
        if (isManualRefresh) {
          showToast(`✅ Successfully reloaded ${count} Topics from Cloud Firestore!`, 'success');
        }
      } else if (!res.success && isManualRefresh) {
        showToast(`❌ Error loading data from Firestore: ${res.error}`, 'error');
      }
    } catch (err: any) {
      console.error('[GrammarReviewPortal] loadLiveGrammarFromFirestore error:', err);
      if (isManualRefresh) {
        showToast(`❌ Error loading data from Firestore: ${err?.message || String(err)}`, 'error');
      }
    } finally {
      setIsLoadingFirestore(false);
    }
  }, [showToast]);

  // Load from Firestore on mount
  useEffect(() => {
    loadLiveGrammarFromFirestore(false);
  }, [loadLiveGrammarFromFirestore]);

  // --------------------------------------------------------------------------
  // 2. Audio Playback Control
  // --------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = '';
      }
      setLoadingAudioUrl(null);
    };
  }, []);

  /**
   * Safely resolves any audio URL: Converts legacy Google Drive download/view URLs
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
      showToast('This item does not have audio yet!', 'info');
      return;
    }

    const resolvedUrl = resolvePlayableAudioUrl(url);

    if (currentlyPlayingUrl === url && isPlaying) {
      audioPlayerRef.current?.pause();
      setIsPlaying(false);
      setLoadingAudioUrl(null);
      return;
    }

    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio();
    }

    const audio = audioPlayerRef.current;

    // Immediately set loading state for the audio URL
    setLoadingAudioUrl(resolvedUrl);

    // Stop and reset any current playback to ensure smooth Google Drive streaming
    audio.pause();
    audio.currentTime = 0;
    audio.src = resolvedUrl;
    audio.preload = 'auto';

    audio.onloadstart = () => {
      setLoadingAudioUrl(resolvedUrl);
    };

    audio.onwaiting = () => {
      setLoadingAudioUrl(resolvedUrl);
    };

    audio.oncanplay = () => {
      setLoadingAudioUrl(null);
    };

    audio.onplaying = () => {
      setLoadingAudioUrl(null);
      setIsPlaying(true);
      setCurrentlyPlayingUrl(url);
    };

    audio.onended = () => {
      setLoadingAudioUrl(null);
      setIsPlaying(false);
      setCurrentlyPlayingUrl(null);
    };

    audio.onerror = () => {
      setLoadingAudioUrl(null);
      setIsPlaying(false);
      setCurrentlyPlayingUrl(null);
      showToast('Cannot play this audio file. Please check Google Drive permissions or URL.', 'error');
    };

    audio.play()
      .then(() => {
        setCurrentlyPlayingUrl(url);
        setIsPlaying(true);
        setLoadingAudioUrl(null);
      })
      .catch(err => {
        console.warn('Playback error:', err);
        setLoadingAudioUrl(null);
        setIsPlaying(false);
        setCurrentlyPlayingUrl(null);
        showToast('Browser blocked autoplay or invalid audio URL.', 'error');
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
    showToast(`Updated structure: "${trimmed}"`);
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
    showToast(`Changed category to: ${getCategoryLabel(newCategory)}`);
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
    showToast(`Approved all ${currentTopic.mini_lessons.length} structures for Day ${selectedDay}!`);
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
      showToast('Saved draft to Local Storage & Web Memory!');
    } catch (e: any) {
      showToast(`Error saving draft: ${e?.message || String(e)}`, 'error');
    }
  };

  // Single Topic Firestore Sync
  const handleSyncCurrentTopicToFirestore = async () => {
    if (!currentTopic) return;
    setIsSyncing(true);
    setSyncBanner(null);
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
        throw new Error(res.error || 'Unknown error saving to Firestore');
      }

      curriculumRegistry.updateLessonGrammar(lessonDocId, grammarPayload);
      const now = new Date().toLocaleString('en-US');
      setLastSyncTime(now);
      localStorage.setItem(LOCAL_STORAGE_LAST_SYNC_KEY, now);
      localStorage.setItem(LOCAL_STORAGE_CATALOG_KEY, JSON.stringify(topics));
      setHasUnsavedChanges(false);

      const msg = `✅ Successfully synced Day ${currentTopic.day_number} (${currentTopic.lesson_title}) to Cloud Firestore!`;
      setSyncBanner({ type: 'success', message: msg });
      showToast(msg, 'success');
    } catch (err: any) {
      const errMsg = `❌ Firestore sync error: ${err?.message || String(err)}`;
      setSyncBanner({ type: 'error', message: errMsg });
      showToast(errMsg, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Batch Sync All 30 Topics to Firestore
  const handleSyncAll30TopicsToFirestore = async () => {
    setIsSyncing(true);
    setSyncLogs([]);
    setSyncBanner(null);
    const total = topics.length;

    try {
      for (let i = 0; i < total; i++) {
        const t = topics[i];
        const docId = t.lesson_id || `level_b_day_${t.day_number}`;
        const msg = `[${i + 1}/${total}] Syncing Day ${t.day_number} (${t.lesson_title})...`;
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
          const errMsg = `❌ Error at Day ${t.day_number}: ${res.error}`;
          setSyncLogs(prev => [...prev, errMsg]);
          throw new Error(res.error);
        }
        curriculumRegistry.updateLessonGrammar(docId, grammarPayload);
      }

      // Update localStorage with current topics!
      localStorage.setItem(LOCAL_STORAGE_CATALOG_KEY, JSON.stringify(topics));

      const successMsg = `✅ Successfully synced all ${total} Topics to Cloud Firestore!`;
      setSyncLogs(prev => [...prev, successMsg]);
      const now = new Date().toLocaleString('en-US');
      setLastSyncTime(now);
      localStorage.setItem(LOCAL_STORAGE_LAST_SYNC_KEY, now);
      setHasUnsavedChanges(false);
      setSyncBanner({ type: 'success', message: successMsg });
      showToast(successMsg, 'success');
    } catch (err: any) {
      const errMsg = `❌ Firestore sync error: ${err?.message || String(err)}`;
      setSyncBanner({ type: 'error', message: errMsg });
      showToast(errMsg, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // --------------------------------------------------------------------------
  // 4. JSON Export & Import
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
    showToast('Downloaded complete JSON backup!');
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
          throw new Error('Invalid JSON format. Expected an array of topics.');
        }
        const recomputed = importedTopics.map(recomputeTopic);
        setTopics(recomputed);
        localStorage.setItem(LOCAL_STORAGE_CATALOG_KEY, JSON.stringify(recomputed));
        setHasUnsavedChanges(false);
        showToast(`Successfully imported ${recomputed.length} topics from JSON file!`);
        setIsJsonModalOpen(false);
      } catch (err: any) {
        showToast(`Error reading JSON file: ${err?.message || String(err)}`, 'error');
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
      {/* Prominent Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-[9999] max-w-md px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300 ${
          toastMessage.type === 'success'
            ? 'bg-emerald-600 text-white border-emerald-400 ring-4 ring-emerald-500/20'
            : toastMessage.type === 'error'
            ? 'bg-rose-600 text-white border-rose-400 ring-4 ring-rose-500/20'
            : 'bg-zinc-900 text-white border-zinc-700 ring-4 ring-zinc-500/20'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-100" />
          ) : toastMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-100" />
          ) : (
            <RefreshCw className="w-5 h-5 shrink-0 text-zinc-300" />
          )}
          <span className="leading-snug">{toastMessage.text}</span>
        </div>
      )}

      {/* --------------------------------------------------------------------------
          TOP HEADER BAR
         -------------------------------------------------------------------------- */}
      <header className="h-16 border-b border-[#E8E8EC] bg-white px-5 flex items-center justify-between shrink-0 z-20 shadow-2xs">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-black tracking-tight text-zinc-900">
                CHUNKS Grammar Curator Studio
              </h1>
            </div>
            <p className="text-[11px] text-zinc-500 hidden md:block">
              30 Topics • Compact Audio • Direct Google Drive Streaming • 1-Click Firestore Sync
            </p>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2">
          {/* Refresh / Reload Live from Firestore Button */}
          <button
            type="button"
            onClick={() => loadLiveGrammarFromFirestore(true)}
            disabled={isLoadingFirestore}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 shadow-2xs cursor-pointer active:scale-95 transition-all disabled:opacity-50"
            title="Reload latest data directly from Cloud Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isLoadingFirestore ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLoadingFirestore ? 'Loading Firestore...' : 'Reload from Firestore'}</span>
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
            title="Save draft changes to browser storage"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{hasUnsavedChanges ? 'Save Draft *' : 'Save Draft'}</span>
          </button>

          {/* Sync to Firestore */}
          <button
            type="button"
            onClick={() => {
              setSyncBanner(null);
              setIsSyncModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
            title="Sync directly to Firebase Firestore"
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-100" />
            <span>Sync Firestore</span>
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
            title={isFullStandalone ? 'Return to Classroom' : 'Fullscreen Standalone'}
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
            title="Previous Topic (Day - 1)"
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
            title="Next Topic (Day + 1)"
          >
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </button>

          {/* Quick Day Launch to Classroom Projector */}
          {onLaunchProjectorForLesson && (
            <button
              type="button"
              onClick={() => onLaunchProjectorForLesson(currentTopic.lesson_id || `level_b_day_${selectedDay}`, selectedDay)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-zinc-600 hover:text-emerald-700 bg-zinc-100 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
              title="Open lesson in Classroom Focus Projector"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Projector</span>
            </button>
          )}
        </div>

        {/* Stats Chips */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-semibold">
            <span>Total:</span>
            <span className="font-mono font-bold text-zinc-900">{topicStats.total}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
            <span>Approved:</span>
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
            title="Approve all structures in the current day"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Approve Day {selectedDay}</span>
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
            placeholder="Search by pattern, description, example, file..."
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
            <span className="text-zinc-400 text-[11px] font-semibold">Category:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as any)}
              className="bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-medium text-zinc-700 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
            >
              <option value="all">All Categories</option>
              <option value="sentence_structure">🔵 Sentence Structure</option>
              <option value="verb_form">🟢 Word Form</option>
              <option value="tense_reflex">🟠 Tense</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className="text-zinc-400 text-[11px] font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-medium text-zinc-700 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
            >
              <option value="all">All</option>
              <option value="approved">✓ Approved</option>
              <option value="pending">⏳ Pending</option>
              <option value="has_audio">🎵 With Audio</option>
              <option value="no_audio">⚠️ Missing Audio</option>
            </select>
          </div>

          {lastSyncTime && (
            <div className="text-[11px] text-zinc-400 font-mono hidden xl:block ml-2">
              Last Firestore Sync: {lastSyncTime}
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
                <th className="py-3 px-4">Primary Spoken Grammar Structure</th>
                <th className="py-3 px-3 w-48">Category</th>
                <th className="py-3 px-3 w-40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {filteredMiniLessons.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-zinc-400">
                    <p className="font-semibold text-sm">No structures found matching filter.</p>
                    <p className="text-xs mt-1">Try clearing the search or selecting "All".</p>
                  </td>
                </tr>
              ) : (
                filteredMiniLessons.map(({ item, originalIndex }) => {
                  const isApproved = !!approvedItems[getItemApproveKey(selectedDay, originalIndex, item.file)];
                  const isThisAudioPlaying = isPlaying && currentlyPlayingUrl === item.audio_url;
                  const resolvedItemAudioUrl = item.audio_url ? resolvePlayableAudioUrl(item.audio_url) : '';
                  const isThisAudioLoading = !isThisAudioPlaying && !!loadingAudioUrl && loadingAudioUrl === resolvedItemAudioUrl;
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
                            disabled={!hasAudio}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 ${
                              isThisAudioLoading
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-300 ring-2 ring-emerald-400 ring-offset-1 animate-pulse'
                                : isThisAudioPlaying
                                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                                : hasAudio
                                ? 'bg-zinc-100 hover:bg-emerald-600 hover:text-white text-zinc-700 border border-zinc-200'
                                : 'bg-zinc-100 text-zinc-300 border border-dashed border-zinc-300 cursor-not-allowed'
                            }`}
                            title={
                              isThisAudioLoading
                                ? 'Loading audio from Google Drive...'
                                : isThisAudioPlaying
                                ? 'Pause audio'
                                : hasAudio
                                ? `Play audio (${item.file || 'Google Drive stream'})`
                                : 'No audio file'
                            }
                          >
                            {isThisAudioLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                            ) : isThisAudioPlaying ? (
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

                      {/* COL 2: Primary Spoken Grammar Structure */}
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
                              title="Save (Enter)"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineEditingKey(null)}
                              className="p-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-md cursor-pointer"
                              title="Cancel (Esc)"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="group">
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-bold text-zinc-900 leading-snug">
                                {item.primary_structure || item.topic || 'Unnamed structure'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setInlineEditingKey(`${selectedDay}_${originalIndex}`);
                                  setInlineEditingVal(item.primary_structure || item.topic || '');
                                }}
                                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-emerald-600 transition-opacity cursor-pointer p-0.5"
                                title="Edit pattern inline"
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

                      {/* COL 3: Category Dropdown */}
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
                          <option value="sentence_structure">🔵 Sentence Structure</option>
                          <option value="verb_form">🟢 Word Form</option>
                          <option value="tense_reflex">🟠 Tense</option>
                        </select>
                      </td>

                      {/* COL 4: Actions (Approve, Edit, Delete) */}
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
                            title={isApproved ? 'Click to unapprove' : 'Click to approve'}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isApproved ? '✓ Approved' : 'Pending'}</span>
                          </button>

                          {/* Edit Modal Button */}
                          <button
                            type="button"
                            onClick={() => setEditingItem({ topicIdx: currentTopicIndex, itemIdx: originalIndex, item })}
                            className="p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
                            title="Edit details (modal)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete structure "${item.primary_structure || item.topic}"?`)) {
                                updateCurrentTopic(t => {
                                  const lessons = (t.mini_lessons || []).filter((_, i) => i !== originalIndex);
                                  return { ...t, mini_lessons: lessons };
                                });
                                showToast('Deleted structure from topic.');
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Delete structure"
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
              title={`Day ${day}: ${approvedCount}/${totalInDay} approved`}
            >
              <span>D{day}</span>
              {isComplete && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>
          );
        })}
      </div>

      {/* --------------------------------------------------------------------------
          MODAL: FIRESTORE SYNC (Single & Batch 30 Topics)
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
                  <h3 className="text-sm font-bold text-zinc-900">Sync Cloud Firestore</h3>
                  <p className="text-xs text-zinc-500">Update data directly into Firebase collection /lessons</p>
                </div>
              </div>
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 text-xs space-y-1.5">
                <div className="flex justify-between text-zinc-600">
                  <span>Current Topic:</span>
                  <span className="font-bold text-zinc-900">Day {selectedDay} ({currentTopic?.lesson_title})</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Firestore Target:</span>
                  <span className="font-mono text-zinc-900">/lessons/{currentTopic?.lesson_id || `level_b_day_${selectedDay}`}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Last Sync:</span>
                  <span className="font-mono text-zinc-900">{lastSyncTime || 'Not recorded'}</span>
                </div>
              </div>

              {/* Sync Status Banner */}
              {syncBanner && (
                <div className={`p-3.5 rounded-xl text-xs font-bold flex items-start gap-2.5 border shadow-2xs ${
                  syncBanner.type === 'success'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}>
                  {syncBanner.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{syncBanner.message}</span>
                </div>
              )}

              {/* Progress Bar when syncing */}
              {isSyncing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-zinc-700">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>{syncProgress.message || 'Syncing...'}</span>
                    </span>
                    <span>{syncProgress.current} / {syncProgress.total}</span>
                  </div>
                  <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
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
                  <span>Sync Day {selectedDay}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncAll30TopicsToFirestore}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Database className="w-4 h-4" />
                  <span>Sync All 30 Topics</span>
                </button>
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
              <h3 className="text-sm font-bold text-zinc-900">Backup & Restore JSON</h3>
              <button onClick={() => setIsJsonModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              Download the complete reviewed JSON for all 30 Topics or import an externally edited JSON file.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleExportJson}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON (Backup)</span>
              </button>

              <label className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-zinc-200 hover:bg-zinc-50 text-zinc-800 text-xs font-bold rounded-xl transition-all cursor-pointer">
                <Upload className="w-4 h-4 text-zinc-500" />
                <span>Import JSON File</span>
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
            showToast('Structure details saved!');
          }}
        />
      )}
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
          <h3 className="text-sm font-bold text-zinc-900">Edit Structure Details</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto text-xs">
          <div>
            <label className="block font-bold text-zinc-700 mb-1">Grammar Structure (Primary Formula) *</label>
            <input
              type="text"
              value={formData.primary_structure || ''}
              onChange={e => setFormData({ ...formData, primary_structure: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Category</label>
              <select
                value={formData.structure_type || 'sentence_structure'}
                onChange={e => setFormData({ ...formData, structure_type: e.target.value as GrammarStructureType })}
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="sentence_structure">🔵 Sentence Structure</option>
                <option value="verb_form">🟢 Word Form (Verb Form)</option>
                <option value="tense_reflex">🟠 Tense Reflex</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Audio File Name</label>
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
            <label className="block font-bold text-zinc-700 mb-1">Direct Audio URL / Google Drive Stream</label>
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
              <label className="font-bold text-zinc-700">Bilingual Examples</label>
              <button
                type="button"
                onClick={handleAddExample}
                className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Example</span>
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
                  placeholder="Vietnamese translation..."
                  className="w-full px-2.5 py-1 bg-white border border-zinc-300 rounded-lg italic text-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteExample(idx)}
                  className="absolute top-2 right-2 text-zinc-400 hover:text-rose-600 p-1"
                  title="Delete this example"
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
              className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper for category label
function getCategoryLabel(cat?: GrammarStructureType): string {
  if (cat === 'sentence_structure') return 'Sentence Structure';
  if (cat === 'verb_form') return 'Word Form';
  if (cat === 'tense_reflex') return 'Tense Reflex';
  return 'Sentence Structure';
}

export default GrammarReviewPortal;
