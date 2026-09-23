import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  Cloud, 
  Download, 
  Play, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Save, 
  RefreshCw, 
  FileText, 
  Volume2, 
  MoveUp, 
  MoveDown, 
  X, 
  Check, 
  HelpCircle,
  FolderSync,
  Layers,
  Info
} from 'lucide-react';
import { 
  LessonGrammar, 
  GrammarMiniLesson, 
  GrammarExample, 
  GrammarStructureType 
} from '../types';
import { 
  saveLessonGrammar, 
  syncAllLevelBGrammarToFirestore 
} from '../services/firestoreService';
import { curriculumRegistry } from '../services/curriculumRegistry';
import initialCatalogData from '../data/grammarBoostCatalog.json';

// --------------------------------------------------------------------------
// Domain Types & Constants
// --------------------------------------------------------------------------
export interface TopicResourceData {
  topic_number: number;
  day_number: number;
  lesson_id: string;
  lesson_title: string;
  source_type?: string;
  total_audio_files?: number;
  status?: 'active' | 'pending_audio';
  thematic_module?: string;
  sentence_structures: string[];
  verb_forms: string[];
  tense: string[];
  notes?: string;
  mini_lessons: GrammarMiniLesson[];
}

interface ResourceManagerViewProps {
  onLaunchProjectorForLesson?: (lessonId: string, dayNumber: number) => void;
  onNavigateToPortal?: () => void;
}

const THEMATIC_MODULES = [
  { id: 'all', name: 'Tất cả 30 Topics', minDay: 1, maxDay: 30 },
  { id: 'onboarding', name: '1. Onboarding', minDay: 1, maxDay: 5 },
  { id: 'office_culture', name: '2. Office Culture', minDay: 6, maxDay: 10 },
  { id: 'operations', name: '3. Operations & Management', minDay: 11, maxDay: 15 },
  { id: 'leadership', name: '4. Team & Leadership', minDay: 16, maxDay: 20 },
  { id: 'acumen', name: '5. Professional Acumen', minDay: 21, maxDay: 25 },
  { id: 'business_sales', name: '6. Business & Sales', minDay: 26, maxDay: 30 }
];

function getModuleForDay(day: number): string {
  if (day <= 5) return 'Onboarding';
  if (day <= 10) return 'Office Culture';
  if (day <= 15) return 'Operations & Management';
  if (day <= 20) return 'Team & Leadership';
  if (day <= 25) return 'Professional Acumen';
  return 'Business & Sales';
}

const LOCAL_STORAGE_KEY = 'chunks_grammar_catalog_v2';

/**
 * Recomputes summary arrays based on 1-to-1 canonical rules
 */
function recomputeTopic(topic: TopicResourceData): TopicResourceData {
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

    if (m.file && m.file.toLowerCase().endsWith('.mp3')) {
      audioCount++;
    }
  }

  return {
    ...topic,
    sentence_structures: sentences,
    verb_forms: verbs,
    tense: tenses,
    total_audio_files: audioCount,
    thematic_module: topic.thematic_module || getModuleForDay(topic.day_number)
  };
}

export const ResourceManagerView: React.FC<ResourceManagerViewProps> = ({
  onLaunchProjectorForLesson,
  onNavigateToPortal
}) => {
  // --------------------------------------------------------------------------
  // State Initialization
  // --------------------------------------------------------------------------
  const [topics, setTopics] = useState<TopicResourceData[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(recomputeTopic);
        }
      }
    } catch (e) {
      console.warn('[ResourceManager] Could not read from localStorage:', e);
    }

    // Default from bundled catalog
    const baseTopics: any[] = (initialCatalogData as any).topics || [];
    return baseTopics.map((t: any) => {
      const dayNum = t.day_number || t.topic_number || 1;
      return recomputeTopic({
        topic_number: t.topic_number || dayNum,
        day_number: dayNum,
        lesson_id: t.lesson_id || `level_b_day_${dayNum}`,
        lesson_title: t.lesson_title || `Day ${dayNum}`,
        source_type: t.source_type || (t.total_audio_files > 0 ? 'audio_boost' : 'curriculum_chunks_verified'),
        total_audio_files: t.total_audio_files ?? 0,
        status: t.status || (t.total_audio_files > 0 ? 'active' : 'pending_audio'),
        thematic_module: t.thematic_module || getModuleForDay(dayNum),
        sentence_structures: t.sentence_structures || [],
        verb_forms: t.verb_forms || [],
        tense: t.tense || [],
        notes: t.notes || '',
        mini_lessons: t.mini_lessons || []
      });
    });
  });

  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');
  const [isNotesExpanded, setIsNotesExpanded] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);

  // Sync Modal State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; message: string }>({
    current: 0,
    total: 30,
    message: ''
  });
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [syncFinished, setSyncFinished] = useState<boolean>(false);

  // Selected Topic
  const selectedTopic = useMemo(() => {
    return topics.find(t => t.day_number === selectedDay) || topics[0];
  }, [topics, selectedDay]);

  // Filtered Topics for Left Sidebar
  const filteredTopics = useMemo(() => {
    return topics.filter(t => {
      const matchSearch = !searchQuery.trim() || 
        t.lesson_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `day ${t.day_number}`.includes(searchQuery.toLowerCase()) ||
        t.sentence_structures.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.verb_forms.some(v => v.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.tense.some(te => te.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (selectedModuleFilter !== 'all') {
        const mod = THEMATIC_MODULES.find(m => m.id === selectedModuleFilter);
        if (mod) {
          if (t.day_number < mod.minDay || t.day_number > mod.maxDay) {
            return false;
          }
        }
      }

      return true;
    });
  }, [topics, searchQuery, selectedModuleFilter]);

  // Keep in-memory registry hydrated on mount
  useEffect(() => {
    topics.forEach(t => {
      curriculumRegistry.updateLessonGrammar(t.lesson_id, {
        verb_forms: t.verb_forms,
        sentence_structures: t.sentence_structures,
        tense: t.tense,
        notes: t.notes,
        mini_lessons: t.mini_lessons,
        total_audio_files: t.total_audio_files,
        source_type: t.source_type,
        status: t.status,
        thematic_module: t.thematic_module
      });
    });
  }, []);

  // --------------------------------------------------------------------------
  // Edit Handlers for Selected Topic
  // --------------------------------------------------------------------------
  const updateCurrentTopic = useCallback((updater: (prev: TopicResourceData) => TopicResourceData) => {
    setTopics(prevTopics => {
      return prevTopics.map(t => {
        if (t.day_number === selectedDay) {
          const updated = recomputeTopic(updater(t));
          return updated;
        }
        return t;
      });
    });
    setHasUnsavedChanges(true);
  }, [selectedDay]);

  const handleUpdateNotes = (notes: string) => {
    updateCurrentTopic(t => ({ ...t, notes }));
  };

  const handleToggleStatus = () => {
    updateCurrentTopic(t => ({
      ...t,
      status: t.status === 'active' ? 'pending_audio' : 'active'
    }));
  };

  const handleUpdateMiniLesson = (index: number, patch: Partial<GrammarMiniLesson>) => {
    updateCurrentTopic(t => {
      const lessons = [...(t.mini_lessons || [])];
      if (!lessons[index]) return t;
      lessons[index] = { ...lessons[index], ...patch };
      return { ...t, mini_lessons: lessons };
    });
  };

  const handleAddMiniLesson = () => {
    updateCurrentTopic(t => {
      const lessons = [...(t.mini_lessons || [])];
      const newNum = lessons.length + 1;
      const newLesson: GrammarMiniLesson = {
        file: `curriculum_d${t.day_number}_${newNum}.manual`,
        topic: `Cấu trúc mới #${newNum}`,
        primary_structure: '',
        structure_type: 'sentence_structure',
        transcript: '',
        structures: [],
        verb_forms: [],
        tense: [],
        examples: [
          { en: '', vi: '' }
        ],
        notes: ''
      };
      lessons.push(newLesson);
      return { ...t, mini_lessons: lessons };
    });
  };

  const handleDeleteMiniLesson = (index: number) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài học #${index + 1}?`)) return;
    updateCurrentTopic(t => {
      const lessons = (t.mini_lessons || []).filter((_, i) => i !== index);
      return { ...t, mini_lessons: lessons };
    });
  };

  const handleMoveMiniLesson = (index: number, direction: 'up' | 'down') => {
    updateCurrentTopic(t => {
      const lessons = [...(t.mini_lessons || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= lessons.length) return t;
      const temp = lessons[index];
      lessons[index] = lessons[targetIndex];
      lessons[targetIndex] = temp;
      return { ...t, mini_lessons: lessons };
    });
  };

  const handleAddExample = (lessonIndex: number) => {
    updateCurrentTopic(t => {
      const lessons = [...(t.mini_lessons || [])];
      const target = lessons[lessonIndex];
      if (!target) return t;
      const examples = [...(target.examples || []), { en: '', vi: '' }];
      lessons[lessonIndex] = { ...target, examples };
      return { ...t, mini_lessons: lessons };
    });
  };

  const handleUpdateExample = (lessonIndex: number, exampleIndex: number, field: 'en' | 'vi', value: string) => {
    updateCurrentTopic(t => {
      const lessons = [...(t.mini_lessons || [])];
      const target = lessons[lessonIndex];
      if (!target) return t;
      const examples = [...(target.examples || [])];
      if (!examples[exampleIndex]) return t;
      examples[exampleIndex] = { ...examples[exampleIndex], [field]: value };
      lessons[lessonIndex] = { ...target, examples };
      return { ...t, mini_lessons: lessons };
    });
  };

  const handleDeleteExample = (lessonIndex: number, exampleIndex: number) => {
    updateCurrentTopic(t => {
      const lessons = [...(t.mini_lessons || [])];
      const target = lessons[lessonIndex];
      if (!target) return t;
      const examples = (target.examples || []).filter((_, i) => i !== exampleIndex);
      lessons[lessonIndex] = { ...target, examples };
      return { ...t, mini_lessons: lessons };
    });
  };

  // --------------------------------------------------------------------------
  // Save & Sync Actions
  // --------------------------------------------------------------------------
  const handleSaveToLocalStorage = () => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(topics));
      // Update in-memory registry for all topics
      topics.forEach(t => {
        curriculumRegistry.updateLessonGrammar(t.lesson_id, {
          verb_forms: t.verb_forms,
          sentence_structures: t.sentence_structures,
          tense: t.tense,
          notes: t.notes,
          mini_lessons: t.mini_lessons,
          total_audio_files: t.total_audio_files,
          source_type: t.source_type,
          status: t.status,
          thematic_module: t.thematic_module
        });
      });
      setHasUnsavedChanges(false);
      setSaveStatusMessage('Đã lưu thành công vào bộ nhớ Web & Registry!');
      setTimeout(() => setSaveStatusMessage(null), 3000);
    } catch (e: any) {
      alert(`Lỗi khi lưu vào bộ nhớ web: ${e?.message || String(e)}`);
    }
  };

  const handleSyncCurrentTopicToFirestore = async () => {
    if (!selectedTopic) return;
    const grammarPayload: LessonGrammar = {
      verb_forms: selectedTopic.verb_forms,
      sentence_structures: selectedTopic.sentence_structures,
      tense: selectedTopic.tense,
      notes: selectedTopic.notes || '',
      mini_lessons: selectedTopic.mini_lessons,
      total_audio_files: selectedTopic.total_audio_files,
      source_type: selectedTopic.source_type,
      status: selectedTopic.status,
      thematic_module: selectedTopic.thematic_module
    };

    setSaveStatusMessage(`Đang đồng bộ Topic ${selectedTopic.day_number} lên Firestore...`);
    const res = await saveLessonGrammar(selectedTopic.lesson_id, grammarPayload);
    if (res.success) {
      handleSaveToLocalStorage();
      setSaveStatusMessage(`Đã đồng bộ Day ${selectedTopic.day_number} lên Firestore thành công!`);
      setTimeout(() => setSaveStatusMessage(null), 3500);
    } else {
      setSaveStatusMessage(`Lỗi đồng bộ: ${res.error}`);
    }
  };

  const handleSyncAllToFirestore = async () => {
    setIsSyncModalOpen(true);
    setIsSyncing(true);
    setSyncFinished(false);
    setSyncLogs([]);
    setSyncProgress({ current: 0, total: topics.length, message: 'Bắt đầu chuẩn bị đồng bộ...' });

    // Save to local storage first
    handleSaveToLocalStorage();

    try {
      const logs: string[] = [];
      const addLog = (msg: string) => {
        logs.push(msg);
        setSyncLogs([...logs]);
      };

      addLog(`Bắt đầu đồng bộ ${topics.length} topics lên Firestore...`);

      for (let i = 0; i < topics.length; i++) {
        const t = topics[i];
        const stepMsg = `[${i + 1}/${topics.length}] Đồng bộ Day ${t.day_number}: ${t.lesson_title}...`;
        setSyncProgress({
          current: i + 1,
          total: topics.length,
          message: stepMsg
        });
        addLog(stepMsg);

        const grammarPayload: LessonGrammar = {
          verb_forms: t.verb_forms,
          sentence_structures: t.sentence_structures,
          tense: t.tense,
          notes: t.notes || '',
          mini_lessons: t.mini_lessons,
          total_audio_files: t.total_audio_files,
          source_type: t.source_type,
          status: t.status,
          thematic_module: t.thematic_module
        };

        const res = await saveLessonGrammar(t.lesson_id, grammarPayload);
        if (!res.success) {
          addLog(`❌ Thất bại tại Day ${t.day_number}: ${res.error}`);
          throw new Error(res.error);
        }
      }

      addLog(`Hoàn tất đồng bộ toàn bộ ${topics.length} topics lên Firestore thành công rực rỡ!`);
      setSyncFinished(true);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      setSyncLogs(prev => [...prev, `LỖI: ${err?.message || String(err)}`]);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportJsonCatalog = () => {
    const exportData = {
      metadata: {
        exported_at: new Date().toISOString(),
        total_topics: topics.length,
        total_structures: topics.reduce(
          (acc, t) => acc + (t.sentence_structures.length + t.verb_forms.length + t.tense.length), 
          0
        ),
        topics_count: topics.length
      },
      topics: topics
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grammar-boost-catalog-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[#FBFBFC] text-zinc-900 font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-[#E8E8EC] bg-white px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-zinc-900">
                Resource & Grammar Studio
              </h1>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                ERE 30 Topics
              </span>
            </div>
            <p className="text-xs text-zinc-500 hidden sm:block">
              Chỉnh sửa, bổ sung cấu trúc phản xạ và đồng bộ trực tiếp lên ERE 30 Topics
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportJsonCatalog}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 shadow-2xs cursor-pointer active:scale-95 transition-all"
            title="Xuất dữ liệu toàn bộ 30 Topics ra định dạng JSON"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span>Xuất JSON</span>
          </button>

          <button
            type="button"
            onClick={handleSyncAllToFirestore}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs cursor-pointer active:scale-95 transition-all disabled:opacity-50"
            title="Đồng bộ tất cả 30 Topics lên Google Cloud Firestore"
          >
            <Cloud className="w-3.5 h-3.5 text-indigo-100" />
            <span>Đồng bộ tất cả lên Firestore</span>
          </button>
        </div>
      </header>

      {/* Standalone Curator Studio Callout Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border-b border-emerald-500/20 px-6 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 text-xs text-zinc-700">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-emerald-800">Chế độ Mới: Grammar Curator Studio</span>
          <span className="text-zinc-500 hidden md:inline">— Xem cấu trúc tinh gọn, KHÔNG transcript, icon audio mini, quét Google Drive & duyệt nhanh 1-click.</span>
        </div>
        <button
          type="button"
          onClick={() => onNavigateToPortal ? onNavigateToPortal() : window.location.assign('/grammar-portal')}
          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
          <span>Mở Grammar Curator Studio &rarr;</span>
        </button>
      </div>

      {/* Main Workspace: Left Sidebar + Center Editing Surface */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Topic Selector */}
        <aside className="w-80 md:w-88 border-r border-[#E8E8EC] bg-white flex flex-col shrink-0">
          {/* Search & Module Filters */}
          <div className="p-3.5 border-b border-[#E8E8EC] space-y-2.5 bg-zinc-50/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm topic, day, cấu trúc..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium placeholder-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
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

            {/* Module Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider shrink-0">
                Module:
              </span>
              <select
                value={selectedModuleFilter}
                onChange={e => setSelectedModuleFilter(e.target.value)}
                className="flex-1 bg-white border border-zinc-200 rounded-md px-2 py-1 text-[11px] font-semibold text-zinc-700 focus:outline-none focus:border-indigo-500 shadow-2xs"
              >
                {THEMATIC_MODULES.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Topics List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
            {filteredTopics.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                Không tìm thấy topic nào phù hợp
              </div>
            ) : (
              filteredTopics.map(topic => {
                const isSelected = topic.day_number === selectedDay;
                const totalStructures = topic.sentence_structures.length + topic.verb_forms.length + topic.tense.length;
                const hasAudios = (topic.total_audio_files || 0) > 0;

                return (
                  <button
                    key={topic.lesson_id}
                    onClick={() => setSelectedDay(topic.day_number)}
                    className={`w-full text-left p-3.5 transition-all flex items-start justify-between gap-3 cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600 pl-3' 
                        : 'hover:bg-zinc-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                          isSelected 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-zinc-200 text-zinc-700'
                        }`}>
                          Day {String(topic.day_number).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider truncate">
                          {topic.thematic_module}
                        </span>
                      </div>

                      <h3 className={`text-xs font-bold leading-snug truncate ${
                        isSelected ? 'text-indigo-950 font-black' : 'text-zinc-800'
                      }`}>
                        {topic.lesson_title.replace(/^Day \d+\s*-\s*/i, '')}
                      </h3>

                      <div className="flex items-center gap-2 mt-2">
                        {/* Audio status pill */}
                        {hasAudios ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {topic.total_audio_files} audios
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Chờ thu âm
                          </span>
                        )}

                        {/* Mini lesson count */}
                        <span className="text-[10px] font-mono font-medium text-zinc-500">
                          {totalStructures} cấu trúc ({topic.mini_lessons?.length || 0} bài)
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Center Panel: Editing Surface for Selected Topic */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {selectedTopic ? (
            <div className="flex-1 overflow-y-auto pb-24">
              {/* Topic Banner */}
              <div className="border-b border-[#E8E8EC] p-6 bg-gradient-to-b from-zinc-50/70 to-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono font-black px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                        DAY {selectedTopic.day_number}
                      </span>
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        {selectedTopic.thematic_module}
                      </span>
                      <button
                        onClick={handleToggleStatus}
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-all ${
                          selectedTopic.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        }`}
                        title="Bấm để chuyển đổi trạng thái Áp dụng / Chờ thu âm"
                      >
                        {selectedTopic.status === 'active' ? '🟢 Active' : '🟡 Chờ thu âm'}
                      </button>
                    </div>

                    <h2 className="text-xl md:text-2xl font-black text-zinc-900 tracking-tight">
                      {selectedTopic.lesson_title}
                    </h2>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleSyncCurrentTopicToFirestore}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold shadow-2xs cursor-pointer active:scale-95 transition-all"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>Lưu & Sync Topic Này</span>
                    </button>

                    {onLaunchProjectorForLesson && (
                      <button
                        type="button"
                        onClick={() => onLaunchProjectorForLesson(selectedTopic.lesson_id, selectedTopic.day_number)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold shadow-2xs cursor-pointer active:scale-95 transition-all"
                      >
                        <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>Chạy Slide Thử Nghiệm</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Reflex Summary Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                  <div className="p-3 rounded-xl border border-sky-200 bg-sky-50/50">
                    <div className="text-[10px] font-mono font-bold uppercase text-sky-700">
                      Mẫu câu (Sentence)
                    </div>
                    <div className="text-xl font-black text-sky-900 mt-0.5">
                      {selectedTopic.sentence_structures.length}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                    <div className="text-[10px] font-mono font-bold uppercase text-emerald-700">
                      Cụm ĐT (Verb Form)
                    </div>
                    <div className="text-xl font-black text-emerald-900 mt-0.5">
                      {selectedTopic.verb_forms.length}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                    <div className="text-[10px] font-mono font-bold uppercase text-amber-700">
                      Thì PX (Tense Reflex)
                    </div>
                    <div className="text-xl font-black text-amber-900 mt-0.5">
                      {selectedTopic.tense.length}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50">
                    <div className="text-[10px] font-mono font-bold uppercase text-indigo-700">
                      Tổng Mini-Lessons
                    </div>
                    <div className="text-xl font-black text-indigo-900 mt-0.5">
                      {selectedTopic.mini_lessons?.length || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Topic Pedagogical Notes (Markdown Collapsible) */}
              <div className="p-6 border-b border-[#E8E8EC] bg-white">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                    className="flex items-center gap-2 text-xs font-bold text-zinc-800 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span>Ghi Chú Sư Phạm & Hướng Dẫn Giáo Viên Cho Topic Này</span>
                    {isNotesExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {selectedTopic.notes ? `${selectedTopic.notes.length} ký tự` : 'Trống'}
                  </span>
                </div>

                {isNotesExpanded && (
                  <div className="space-y-2 mt-2">
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Nội dung này được trình chiếu trong slide giới thiệu ngữ pháp để giáo viên giải thích bản chất phản xạ cho học viên.
                    </p>
                    <textarea
                      value={selectedTopic.notes || ''}
                      onChange={e => handleUpdateNotes(e.target.value)}
                      rows={6}
                      placeholder="- **Adjective usage**: The word 'aware' is an adjective..."
                      className="w-full p-3.5 border border-zinc-200 rounded-xl font-mono text-xs text-zinc-800 bg-zinc-50/40 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 leading-relaxed shadow-2xs"
                    />
                  </div>
                )}
              </div>

              {/* Grammar Points / Mini-Lessons List */}
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider">
                      Danh Sách Mini-Lessons ({selectedTopic.mini_lessons?.length || 0})
                    </h3>
                    <span className="text-xs text-zinc-500">
                      (Mỗi bài tương ứng 1 cấu trúc phản xạ mục tiêu)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddMiniLesson}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs cursor-pointer active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Cấu Trúc / Bài Mới</span>
                  </button>
                </div>

                {/* List of Mini-Lessons */}
                <div className="space-y-5">
                  {(selectedTopic.mini_lessons || []).map((ml, idx) => {
                    const isAudio = ml.file && ml.file.toLowerCase().endsWith('.mp3');
                    const audioUrl = isAudio 
                      ? `http://localhost:3333/audio/Topic ${selectedTopic.topic_number}/${ml.file}` 
                      : null;

                    return (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-2xs hover:shadow-xs transition-shadow space-y-4"
                      >
                        {/* Header Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="w-6 h-6 rounded-lg bg-zinc-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-mono font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">
                              {ml.file || 'Manual Entry'}
                            </span>
                            {isAudio ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                <Volume2 className="w-3 h-3 text-emerald-600" />
                                Audio Có Sẵn
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                                Soạn Thủ Công
                              </span>
                            )}
                          </div>

                          {/* Controls: Up, Down, Delete */}
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleMoveMiniLesson(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded text-zinc-400 hover:text-zinc-700 disabled:opacity-30 cursor-pointer"
                              title="Di chuyển lên"
                            >
                              <MoveUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveMiniLesson(idx, 'down')}
                              disabled={idx === (selectedTopic.mini_lessons?.length || 0) - 1}
                              className="p-1 rounded text-zinc-400 hover:text-zinc-700 disabled:opacity-30 cursor-pointer"
                              title="Di chuyển xuống"
                            >
                              <MoveDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMiniLesson(idx)}
                              className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                              title="Xóa bài học này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Structure Type & Primary Focus Formula */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] font-mono font-bold uppercase text-zinc-500 block mb-1">
                              Loại Cấu Trúc
                            </label>
                            <select
                              value={ml.structure_type || 'sentence_structure'}
                              onChange={e => handleUpdateMiniLesson(idx, { 
                                structure_type: e.target.value as GrammarStructureType 
                              })}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                            >
                              <option value="sentence_structure">🔵 Mẫu câu (Sentence Structure)</option>
                              <option value="verb_form">🟢 Cụm động từ (Verb Form)</option>
                              <option value="tense_reflex">🔴 Thì phản xạ (Tense Reflex)</option>
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-[10px] font-mono font-bold uppercase text-zinc-500 block mb-1">
                              Công Thức Phản Xạ Mục Tiêu (Primary Structure)
                            </label>
                            <input
                              type="text"
                              value={ml.primary_structure || ''}
                              onChange={e => handleUpdateMiniLesson(idx, { primary_structure: e.target.value })}
                              placeholder="Ví dụ: S + be + aware that... hoặc be supposed to + V1"
                              className="w-full font-mono font-bold text-xs p-2 border border-zinc-200 rounded-lg bg-zinc-50 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Verbatim Teacher Transcript */}
                        <div>
                          <label className="text-[10px] font-mono font-bold uppercase text-zinc-500 block mb-1">
                            Lời Giảng Trực Tiếp Của Giáo Viên (Verbatim Transcript)
                          </label>
                          <textarea
                            value={ml.transcript || ''}
                            onChange={e => handleUpdateMiniLesson(idx, { transcript: e.target.value })}
                            rows={3}
                            placeholder="Lời giảng chi tiết từ file ghi âm audio..."
                            className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs leading-relaxed text-zinc-800 bg-zinc-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Audio Player if available */}
                        {audioUrl && (
                          <div className="flex items-center gap-3 p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-700 shrink-0">
                              <Volume2 className="w-4 h-4 text-indigo-500" />
                              <span>Nghe thu âm:</span>
                            </div>
                            <audio 
                              controls 
                              src={audioUrl} 
                              className="h-8 flex-1"
                              onError={(e) => {
                                // Silent failover note: Review server port 3333 may not be running locally
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('.offline-hint')) {
                                  const hint = document.createElement('span');
                                  hint.className = 'offline-hint text-[11px] text-zinc-400 font-mono italic';
                                  hint.innerText = '(File ghi âm máy chủ review port 3333 hiện chưa mở)';
                                  parent.appendChild(hint);
                                }
                              }}
                            />
                          </div>
                        )}

                        {/* Bilingual Examples Editor */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-mono font-bold uppercase text-zinc-500">
                              Ví Dụ Song Ngữ ({ml.examples?.length || 0})
                            </label>
                            <button
                              type="button"
                              onClick={() => handleAddExample(idx)}
                              className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Thêm ví dụ</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {(ml.examples || []).map((ex, exIdx) => (
                              <div key={exIdx} className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-zinc-400 w-4 text-right">
                                  {exIdx + 1}.
                                </span>
                                <input
                                  type="text"
                                  value={ex.en}
                                  onChange={e => handleUpdateExample(idx, exIdx, 'en', e.target.value)}
                                  placeholder="English example..."
                                  className="flex-1 font-semibold text-xs p-1.5 border border-zinc-200 rounded-lg bg-zinc-50 focus:bg-white focus:outline-none focus:border-indigo-500"
                                />
                                <input
                                  type="text"
                                  value={ex.vi}
                                  onChange={e => handleUpdateExample(idx, exIdx, 'vi', e.target.value)}
                                  placeholder="Tiếng Việt tương ứng..."
                                  className="flex-1 text-xs p-1.5 border border-zinc-200 rounded-lg bg-zinc-50 focus:bg-white focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExample(idx, exIdx)}
                                  className="p-1.5 text-zinc-400 hover:text-red-600 cursor-pointer"
                                  title="Xóa ví dụ này"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Pedagogical Point Notes */}
                        <div>
                          <label className="text-[10px] font-mono font-bold uppercase text-zinc-500 block mb-1">
                            Ghi Chú Trọng Tâm Điểm Này (Point Notes)
                          </label>
                          <textarea
                            value={ml.notes || ''}
                            onChange={e => handleUpdateMiniLesson(idx, { notes: e.target.value })}
                            rows={2}
                            placeholder="Quy tắc ngữ pháp, bẫy thường gặp hoặc cách ghi nhớ..."
                            className="w-full p-2 border border-zinc-200 rounded-lg text-xs text-zinc-800 bg-zinc-50/50 focus:bg-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Append Button */}
                <button
                  type="button"
                  onClick={handleAddMiniLesson}
                  className="w-full py-3.5 rounded-xl border-2 border-dashed border-zinc-300 hover:border-indigo-500 hover:bg-indigo-50/30 text-zinc-600 hover:text-indigo-600 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Thêm Cấu Trúc / Bài Học Mới Cho Topic Này</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
              Chọn một Topic bên trái để chỉnh sửa
            </div>
          )}

          {/* Floating / Bottom Save Bar */}
          <div className="border-t border-[#E8E8EC] bg-white/95 backdrop-blur-sm p-4 px-6 flex items-center justify-between shrink-0 shadow-lg">
            <div className="flex items-center gap-3">
              {hasUnsavedChanges ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Có thay đổi chưa lưu
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã đồng bộ bộ nhớ web
                </span>
              )}

              {saveStatusMessage && (
                <span className="text-xs font-medium text-zinc-600 italic">
                  {saveStatusMessage}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleSaveToLocalStorage}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-800 shadow-2xs cursor-pointer active:scale-95 transition-all"
              >
                <Save className="w-3.5 h-3.5 text-zinc-500" />
                <span>Lưu Vào Bộ Nhớ Web</span>
              </button>

              <button
                type="button"
                onClick={handleSyncCurrentTopicToFirestore}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs cursor-pointer active:scale-95 transition-all"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Đồng Bộ Topic Lên Firestore</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Sync All Progress Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <FolderSync className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-900">
                    Đồng Bộ ERE Grammar Lên Firestore
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Cập nhật toàn bộ 30 Topics trực tiếp vào collection /lessons
                  </p>
                </div>
              </div>

              {!isSyncing && (
                <button
                  onClick={() => setIsSyncModalOpen(false)}
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Progress Body */}
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs font-bold text-zinc-700 mb-1.5">
                  <span>Tiến độ: {syncProgress.current} / {syncProgress.total} topics</span>
                  <span>{Math.round((syncProgress.current / syncProgress.total) * 100)}%</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                    style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                  />
                </div>
              </div>

              {/* Status Message */}
              <div className="text-xs font-mono font-medium text-zinc-700 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                {syncProgress.message || 'Đang sẵn sàng...'}
              </div>

              {/* Live Log */}
              <div>
                <div className="text-[10px] font-mono font-bold uppercase text-zinc-400 mb-1">
                  Nhật Ký Đồng Bộ
                </div>
                <div className="h-44 overflow-y-auto p-3 bg-zinc-900 text-zinc-200 font-mono text-[11px] rounded-xl space-y-1">
                  {syncLogs.map((log, lIdx) => (
                    <div key={lIdx} className="leading-snug">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isSyncing}
                onClick={() => setIsSyncModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold cursor-pointer disabled:opacity-40"
              >
                {syncFinished ? 'Hoàn Tất & Đóng' : 'Đóng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
