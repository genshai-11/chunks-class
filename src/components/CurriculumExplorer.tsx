import React, { useState, useEffect, useMemo } from 'react';
import { ChunkCategory, ChunkItem, LessonDoc, CourseLevel, Course } from '../types';
import { 
  getAllLessons, 
  saveLesson, 
  addOrUpdateChunk, 
  deleteChunk, 
  syncAllCurriculumToFirestore, 
  checkFirestoreHealth,
  DatabaseStatus
} from '../services/firestoreService';
import { curriculumRegistry } from '../services/curriculumRegistry';
import { audioPlayer } from '../services/googleTtsService';
import { ChunkModal } from './ChunkModal';
import { ChunkPreviewModal } from './ChunkPreviewModal';
import { LessonExcelUploader } from './LessonExcelUploader';
import { 
  Search, 
  Volume2, 
  Play, 
  Download, 
  Music,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Layers,
  Sparkles,
  ArrowUpDown,
  FileSpreadsheet
} from 'lucide-react';

interface CurriculumExplorerProps {
  onLaunchProjectorForLesson: (lessonId: string, sessionNumber: number) => void;
  defaultCourseLevel?: CourseLevel;
}

const CATEGORY_NAMES: Record<string, string> = {
  vocab: 'Vocabulary',
  phrase: 'Spoken Phrase',
  sentence: 'Pattern Sentence',
  dialogue: 'Dialogue',
  monologue: 'Monologue',
  idiom: 'Idiom',
  slang: 'Slang',
  grammar: 'Collocation (Ngữ pháp)',
  word_family: 'Word Family',
  review: 'Review',
  verb: 'Verb / Action',
};

const getCategoryLabel = (category: string): string => {
  if (CATEGORY_NAMES[category]) {
    return CATEGORY_NAMES[category];
  }
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export const CurriculumExplorer: React.FC<CurriculumExplorerProps> = ({
  onLaunchProjectorForLesson,
  defaultCourseLevel = 'LEVEL_B_ERES'
}) => {
  const [selectedLevel, setSelectedLevel] = useState<CourseLevel>(defaultCourseLevel);
  const [lessons, setLessons] = useState<LessonDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<ChunkCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [playingChunkId, setPlayingChunkId] = useState<string | null>(null);

  const availableCourses = useMemo<Course[]>(() => {
    return curriculumRegistry.getAllCourses();
  }, []);

  const currentCourse = useMemo(() => {
    return curriculumRegistry.getCourse(selectedLevel);
  }, [selectedLevel]);

  const getCourseTabLabel = (course: Course) => {
    if (course.level_code === 'LEVEL_A') return 'Level A';
    if (course.level_code === 'LEVEL_B_EREL') return 'Level B - EREL (Listening)';
    if (course.level_code === 'LEVEL_B_ERES') return 'Level B - ERES (Speaking)';
    return course.title;
  };

  // Database status & sync state
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  // View Mode toggle: CARDS vs COMPACT_TABLE
  const [viewMode, setViewMode] = useState<'CARDS' | 'COMPACT_TABLE'>('CARDS');

  // Chunk Modal (Add/Edit)
  const [isChunkModalOpen, setIsChunkModalOpen] = useState<boolean>(false);
  const [editingChunk, setEditingChunk] = useState<ChunkItem | null>(null);
  const [targetLessonId, setTargetLessonId] = useState<string>('');
  const [targetDayNumber, setTargetDayNumber] = useState<number>(1);

  // Full Screen Preview Modal
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewChunksList, setPreviewChunksList] = useState<ChunkItem[]>([]);
  const [previewInitialIndex, setPreviewInitialIndex] = useState<number>(0);
  const [previewLessonTitle, setPreviewLessonTitle] = useState<string>('');
  const [previewDayNumber, setPreviewDayNumber] = useState<number>(1);

  // Bulk import & Excel state
  const [isBulkImportOpen, setIsBulkImportOpen] = useState<boolean>(false);
  const [bulkImportText, setBulkImportText] = useState<string>('');
  const [isExcelModalOpen, setIsExcelModalOpen] = useState<boolean>(false);

  // Load lessons from Firestore / Local storage
  const loadCurriculumData = async () => {
    setIsLoading(true);
    try {
      const data = await getAllLessons(selectedLevel);
      setLessons(data);
      const health = await checkFirestoreHealth();
      setDbStatus(health);
    } catch (err) {
      console.error("Error loading curriculum lessons:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCurriculumData();
  }, [selectedLevel]);

  // Handle Full Database Synchronization to Firestore
  const handleSyncToFirestore = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncAllCurriculumToFirestore((current, total, message) => {
        setSyncProgress({ current, total, message });
      });

      if (result.success) {
        setSyncResult({
          success: true,
          message: `Đã đồng bộ thành công ${result.totalLessons} bài học & ${result.totalChunks} chunks trực tiếp lên Firestore Database!`
        });
        await loadCurriculumData();
      } else {
        setSyncResult({
          success: false,
          message: `Lỗi đồng bộ: ${result.error || 'Vui lòng kiểm tra lại quyền truy cập Firestore.'}`
        });
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: `Lỗi: ${err?.message || String(err)}`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Play audio preview
  const handlePlayChunk = async (chunk: ChunkItem) => {
    setPlayingChunkId(chunk.chunk_id);
    try {
      await audioPlayer.playChunk(
        chunk.english,
        chunk.audio_url,
        'en-US-Journey-F',
        1.0
      );
    } catch {
      // ignore
    } finally {
      setPlayingChunkId(null);
    }
  };

  const PAGE_SIZE = 50;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim().toLowerCase());
      setCurrentPage(1);
    }, 150);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLevel, selectedDay, selectedCategory]);

  // Filtered Chunks memo
  const filteredChunks = useMemo(() => {
    const q = debouncedQuery;
    let list: { chunk: ChunkItem; lesson: LessonDoc }[] = [];

    lessons.forEach(lesson => {
      if (selectedDay === 'all' || lesson.day_number === selectedDay) {
        (lesson.chunks || []).forEach(chunk => {
          if (selectedCategory === 'all' || chunk.category === selectedCategory) {
            if (!q) {
              list.push({ chunk, lesson });
            } else {
              const matchesSearch = 
                (chunk.english && chunk.english.toLowerCase().includes(q)) ||
                (chunk.vietnamese && chunk.vietnamese.toLowerCase().includes(q)) ||
                (chunk.beat_prosody && chunk.beat_prosody.toLowerCase().includes(q)) ||
                (chunk.ipa && chunk.ipa.toLowerCase().includes(q));

              if (matchesSearch) {
                list.push({ chunk, lesson });
              }
            }
          }
        });
      }
    });

    return list;
  }, [lessons, selectedDay, selectedCategory, debouncedQuery]);

  const totalPages = Math.ceil(filteredChunks.length / PAGE_SIZE) || 1;
  const paginatedChunks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredChunks.slice(start, start + PAGE_SIZE);
  }, [filteredChunks, currentPage]);

  // Total statistics
  const totalChunksInLevel = useMemo(() => {
    return lessons.reduce((acc, l) => acc + (l.chunks?.length || 0), 0);
  }, [lessons]);

  // Compute chunks in current scope (either all lessons in level or specific selected day)
  const currentScopeChunks = useMemo(() => {
    const list: ChunkItem[] = [];
    lessons.forEach(lesson => {
      if (selectedDay === 'all' || lesson.day_number === selectedDay) {
        if (lesson.chunks && Array.isArray(lesson.chunks)) {
          list.push(...lesson.chunks);
        }
      }
    });
    return list;
  }, [lessons, selectedDay]);

  // Dynamically compute unique categories present in current selection with chunk counts
  const dynamicCategories = useMemo(() => {
    const categoryCounts = new Map<string, number>();
    currentScopeChunks.forEach(chunk => {
      if (chunk.category) {
        categoryCounts.set(chunk.category, (categoryCounts.get(chunk.category) || 0) + 1);
      }
    });

    const result: { id: ChunkCategory; label: string; count: number }[] = [];
    categoryCounts.forEach((count, catId) => {
      result.push({
        id: catId as ChunkCategory,
        label: getCategoryLabel(catId),
        count
      });
    });

    // Preferred order for common chunk categories
    const PREFERRED_ORDER = ['phrase', 'sentence', 'vocab', 'dialogue', 'monologue', 'idiom', 'slang', 'grammar', 'word_family', 'review', 'verb'];
    result.sort((a, b) => {
      const idxA = PREFERRED_ORDER.indexOf(a.id);
      const idxB = PREFERRED_ORDER.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.label.localeCompare(b.label);
    });

    return result;
  }, [currentScopeChunks]);

  // Reset selected category to 'all' if current selectedCategory doesn't exist in the new selection
  useEffect(() => {
    if (selectedCategory !== 'all') {
      const exists = dynamicCategories.some(c => c.id === selectedCategory);
      if (!exists) {
        setSelectedCategory('all');
      }
    }
  }, [dynamicCategories, selectedCategory]);

  // Open modal to add chunk
  const handleOpenAddChunk = () => {
    const activeLesson = selectedDay === 'all' 
      ? lessons[0] 
      : lessons.find(l => l.day_number === selectedDay) || lessons[0];
    
    if (activeLesson) {
      setTargetLessonId(activeLesson.id);
      setTargetDayNumber(activeLesson.day_number);
      setEditingChunk(null);
      setIsChunkModalOpen(true);
    }
  };

  // Open modal to edit chunk
  const handleOpenEditChunk = (chunk: ChunkItem, lesson: LessonDoc) => {
    setTargetLessonId(lesson.id);
    setTargetDayNumber(lesson.day_number);
    setEditingChunk(chunk);
    setIsChunkModalOpen(true);
  };

  // Save chunk (Add or Edit)
  const handleSaveChunk = async (chunkToSave: ChunkItem) => {
    await addOrUpdateChunk(targetLessonId, chunkToSave);
    await loadCurriculumData();
  };

  // Delete chunk
  const handleDeleteChunk = async (chunk: ChunkItem, lesson: LessonDoc) => {
    if (window.confirm(`Bạn có chắc muốn xóa cụm "${chunk.english}" khỏi Day ${lesson.day_number}?`)) {
      await deleteChunk(lesson.id, chunk.chunk_id);
      await loadCurriculumData();
    }
  };

  // Open Full-Screen Presentation Preview
  const handleOpenPreview = (chunkIndex: number, lesson: LessonDoc) => {
    setPreviewChunksList(lesson.chunks);
    setPreviewInitialIndex(chunkIndex);
    setPreviewLessonTitle(lesson.lesson_title);
    setPreviewDayNumber(lesson.day_number);
    setIsPreviewModalOpen(true);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Level", "Chunk ID", "Day", "Category", "English", "Vietnamese", "Beat Prosody", "IPA", "Speaker"];
    const rows = filteredChunks.map(({ chunk, lesson }) => [
      selectedLevel,
      chunk.chunk_id,
      `Day ${lesson.day_number}`,
      chunk.category,
      `"${chunk.english.replace(/"/g, '""')}"`,
      `"${chunk.vietnamese.replace(/"/g, '""')}"`,
      `"${chunk.beat_prosody || ''}"`,
      `"${chunk.ipa || ''}"`,
      `"${chunk.speaker || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `chunks_${selectedLevel.toLowerCase()}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(lessons, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `curriculum_${selectedLevel.toLowerCase()}_database.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans">
      {/* 1. Database Health & Sync Status Banner */}
      <div className="bg-white rounded-2xl border border-[#E8E8EC] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`p-2.5 rounded-xl ${dbStatus?.isConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-sm text-[#0A0A0A]">
                Firestore Database: <span className="font-mono text-xs text-zinc-600">chunks-voicecloning-genshai</span>
              </h3>
              <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                dbStatus?.isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-700'
              }`}>
                {dbStatus?.isConnected ? '● Connected Live' : '○ Local Synced'}
              </span>
            </div>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Đang tải trực tiếp: <strong className="text-[#0A0A0A]">{lessons.length} bài học</strong> ({totalChunksInLevel.toLocaleString()} chunks trong {currentCourse?.title || selectedLevel})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={loadCurriculumData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E8EC] bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-all cursor-pointer shadow-xs"
            title="Làm mới dữ liệu từ server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm Mới DB</span>
          </button>

          <button
            onClick={handleSyncToFirestore}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] disabled:bg-zinc-400 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Đang Đồng Bộ Firestore...' : 'Đồng Bộ Chunks Lên DB'}</span>
          </button>
        </div>
      </div>

      {/* Sync progress notification */}
      {syncProgress && isSyncing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 animate-fade-in text-blue-900 text-xs">
          <div className="flex items-center justify-between mb-1.5 font-bold">
            <span>{syncProgress.message}</span>
            <span className="font-mono">{syncProgress.current} / {syncProgress.total}</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-[#DC2626] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.round((syncProgress.current / syncProgress.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {syncResult && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs ${
          syncResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          {syncResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
          <span>{syncResult.message}</span>
        </div>
      )}

      {/* 2. Main Curriculum Hero & Action Toolbar */}
      <div className="bg-white rounded-2xl border border-[#E8E8EC] p-5 md:p-6 shadow-xs space-y-5">
        {/* Row 1: Full-Width Title & Metadata */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8E8EC] pb-5">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#DC2626]/10 text-[#DC2626] uppercase tracking-wider">
                Curriculum Explorer
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                • {totalChunksInLevel.toLocaleString()} Chunks • {lessons.length} Bài học
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">
                {selectedLevel.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-[#0A0A0A] tracking-tight">
              {currentCourse?.title || `Course ${selectedLevel}`}
            </h1>
            <p className="text-xs text-zinc-500 max-w-3xl leading-relaxed">
              {currentCourse?.description || 'Hệ thống cụm câu phản xạ chia theo Day & Part chuẩn sư phạm.'}
            </p>
          </div>

          {/* Action buttons on top right */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E8E8EC] hover:border-[#DC2626] text-zinc-800 hover:text-[#DC2626] text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Upload className="w-4 h-4 text-[#DC2626]" />
              <span>Import Excel</span>
            </button>
            <button
              onClick={handleOpenAddChunk}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Chunk</span>
            </button>
          </div>
        </div>

        {/* Row 2: Course Level Tabs + View Mode + Export Cluster */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Course Level Selector Tabs */}
          <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200/80 gap-1 flex-wrap">
            {availableCourses.map((course) => {
              const isSelected = selectedLevel === course.level_code || selectedLevel === course.id;
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => { 
                    setSelectedLevel(course.level_code); 
                    setSelectedDay('all');
                    setSelectedCategory('all');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected ? 'bg-white text-[#DC2626] shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {getCourseTabLabel(course)}
                </button>
              );
            })}
          </div>

          {/* Right Action cluster: View Mode + Export */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200/80">
              <button
                type="button"
                onClick={() => setViewMode('CARDS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'CARDS' ? 'bg-white text-[#DC2626] shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title="Chế độ thẻ chi tiết"
              >
                Thẻ Chi Tiết
              </button>
              <button
                type="button"
                onClick={() => setViewMode('COMPACT_TABLE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'COMPACT_TABLE' ? 'bg-white text-[#DC2626] shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title="Chế độ bảng rút gọn"
              >
                Bảng Gọn
              </button>
            </div>

            {/* Export Menu */}
            <div className="flex items-center gap-1 bg-[#FAFAFA] border border-[#E8E8EC] p-1 rounded-xl">
              <button
                onClick={handleExportCSV}
                className="p-1.5 text-zinc-600 hover:text-[#DC2626] hover:bg-white rounded-lg transition-all cursor-pointer"
                title="Xuất CSV"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button
                onClick={handleExportJSON}
                className="p-1.5 text-zinc-600 hover:text-[#DC2626] hover:bg-white rounded-lg transition-all cursor-pointer"
                title="Xuất JSON Database"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 3: Filter & Search Controls */}
        <div className="pt-3 border-t border-[#E8E8EC] grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm tiếng Anh, tiếng Việt, IPA, trọng âm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#FAFAFA] border border-[#E8E8EC] rounded-xl text-xs font-medium text-[#0A0A0A] focus:bg-white focus:outline-none focus:border-[#DC2626]"
            />
          </div>

          {/* Day Selector */}
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E8E8EC] rounded-xl text-xs font-semibold text-[#0A0A0A] focus:bg-white focus:outline-none focus:border-[#DC2626] cursor-pointer"
          >
            <option value="all">Tất Cả {lessons.length} Bài Học (Day 1 – {lessons.length > 0 ? Math.max(...lessons.map(l => l.day_number)) : 15})</option>
            {lessons.map(l => (
              <option key={l.id} value={l.day_number}>
                Day {l.day_number}: {l.lesson_title} ({l.chunks?.length || 0} chunks)
              </option>
            ))}
          </select>

          {/* Dynamic Category Selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ChunkCategory | 'all')}
            className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E8E8EC] rounded-xl text-xs font-semibold text-[#0A0A0A] focus:bg-white focus:outline-none focus:border-[#DC2626] cursor-pointer"
          >
            <option value="all">
              Tất Cả Thể Loại (All Categories) ({currentScopeChunks.length})
            </option>
            {dynamicCategories.map(c => (
              <option key={c.id} value={c.id}>
                {c.label} ({c.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Chunks List / Grid */}
      <div className="space-y-3">
        {filteredChunks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8E8EC] p-12 text-center space-y-3">
            <Layers className="w-8 h-8 text-zinc-300 mx-auto" />
            <h3 className="font-display font-bold text-base text-[#0A0A0A]">
              Không tìm thấy chunk nào phù hợp
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Thử xóa bớt bộ lọc tìm kiếm hoặc thêm cụm từ mới vào bài học này.
            </p>
            <button
              onClick={handleOpenAddChunk}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#DC2626] text-white text-xs font-bold hover:bg-[#B91C1C] transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Chunk Mới Ngay</span>
            </button>
          </div>
        ) : viewMode === 'COMPACT_TABLE' ? (
          /* COMPACT MINIMAL TABLE VIEW */
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-100 text-zinc-700 font-bold border-b border-zinc-200">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3 w-20 text-center">Day</th>
                    <th className="p-3 w-24">Thể Loại</th>
                    <th className="p-3">Cụm Tiếng Anh & Ngắt Nhịp</th>
                    <th className="p-3">Bản Dịch Tiếng Việt</th>
                    <th className="p-3 w-40 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paginatedChunks.map(({ chunk, lesson }, idx) => {
                    const isPlaying = playingChunkId === chunk.chunk_id;
                    const itemNum = (currentPage - 1) * PAGE_SIZE + idx + 1;
                    return (
                      <tr 
                        key={chunk.chunk_id || `chunk_row_${idx}`}
                        className={`hover:bg-zinc-50 transition-colors ${isPlaying ? 'bg-red-50/40' : ''}`}
                      >
                        <td className="p-3 text-center font-mono text-zinc-400 font-medium">
                          {itemNum}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-zinc-100 text-zinc-700">
                            Day {lesson.day_number}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-red-50 text-[#DC2626] uppercase">
                            {chunk.category}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-zinc-900 text-sm">
                            {chunk.english}
                          </div>
                          {chunk.beat_prosody && (
                            <div className="text-[11px] font-mono text-[#DC2626] mt-0.5">
                              {chunk.beat_prosody}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-zinc-600 font-medium">
                          {chunk.vietnamese}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handlePlayChunk(chunk)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isPlaying ? 'bg-[#DC2626] text-white border-[#DC2626]' : 'bg-zinc-50 text-zinc-600 hover:bg-[#DC2626] hover:text-white border-zinc-200'
                              }`}
                              title="Nghe phát âm"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditChunk(chunk, lesson)}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all cursor-pointer"
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteChunk(chunk, lesson)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-[#DC2626] hover:bg-red-50 transition-all cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onLaunchProjectorForLesson(lesson.id, lesson.day_number)}
                              className="px-2 py-1 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[10px] font-bold transition-all cursor-pointer shadow-xs ml-1"
                              title="Chiếu Day này"
                            >
                              Day {lesson.day_number}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* DETAILED CARDS VIEW */
          <div className="grid grid-cols-1 gap-3">
            {paginatedChunks.map(({ chunk, lesson }, idx) => {
              const isPlaying = playingChunkId === chunk.chunk_id;

              return (
                <div
                  key={chunk.chunk_id || `chunk_${idx}`}
                  className={`bg-white rounded-2xl border p-4.5 transition-all hover:border-[#DC2626]/40 hover:shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isPlaying ? 'border-[#DC2626] ring-1 ring-[#DC2626]/20 bg-red-50/20' : 'border-[#E8E8EC]'
                  }`}
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Tags */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">
                        Day {lesson.day_number}
                      </span>
                      <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded-md bg-[#DC2626]/10 text-[#DC2626] uppercase">
                        {chunk.category}
                      </span>
                      {chunk.speaker && (
                        <span className="text-[11px] text-zinc-500 font-mono">
                          Speaker: <strong>{chunk.speaker}</strong>
                        </span>
                      )}
                      {chunk.ipa && (
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {chunk.ipa}
                        </span>
                      )}
                    </div>

                    {/* English Chunk & Translation */}
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handlePlayChunk(chunk)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 mt-0.5 ${
                          isPlaying 
                            ? 'bg-[#DC2626] text-white border-[#DC2626]' 
                            : 'bg-[#FAFAFA] hover:bg-[#DC2626] hover:text-white text-zinc-600 border-zinc-200'
                        }`}
                        title="Nghe phát âm chuẩn"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      <div className="space-y-1">
                        <h3 className="font-display font-bold text-base md:text-lg text-[#0A0A0A] leading-snug">
                          {chunk.english}
                        </h3>

                        {chunk.beat_prosody && (
                          <div className="text-xs font-mono font-semibold text-[#DC2626] flex items-center gap-1.5">
                            <Music className="w-3.5 h-3.5 shrink-0" />
                            <span>{chunk.beat_prosody}</span>
                          </div>
                        )}

                        <p className="text-xs md:text-sm text-[#6B6B6B]">
                          {chunk.vietnamese}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-2 shrink-0 md:self-center">
                    {/* Preview in Projector modal */}
                    <button
                      onClick={() => {
                        const chunkIndex = lesson.chunks.findIndex(c => c.chunk_id === chunk.chunk_id);
                        handleOpenPreview(chunkIndex >= 0 ? chunkIndex : 0, lesson);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-all cursor-pointer"
                      title="Xem trước chế độ lớp học"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem Trước</span>
                    </button>

                    {/* Edit Chunk */}
                    <button
                      onClick={() => handleOpenEditChunk(chunk, lesson)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all cursor-pointer"
                      title="Chỉnh sửa chunk"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Chunk */}
                    <button
                      onClick={() => handleDeleteChunk(chunk, lesson)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-[#DC2626] hover:bg-red-50 transition-all cursor-pointer"
                      title="Xóa chunk"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Launch lesson button */}
                    <button
                      onClick={() => onLaunchProjectorForLesson(lesson.id, lesson.day_number)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold transition-all cursor-pointer shadow-xs ml-1"
                      title="Chiếu Day này lên lớp"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Day {lesson.day_number}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Bar (Count & Pagination) */}
        {filteredChunks.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-[#E8E8EC] shadow-xs mt-4">
            <div className="flex flex-col text-xs font-mono">
              <span className="text-[#6B6B6B]">
                Tìm thấy <strong className="text-[#0A0A0A]">{filteredChunks.length}</strong> chunks phù hợp
              </span>
              {filteredChunks.length > PAGE_SIZE && (
                <span className="text-zinc-500 mt-1">
                  Hiển thị <strong>{(currentPage - 1) * PAGE_SIZE + 1} – {Math.min(currentPage * PAGE_SIZE, filteredChunks.length)}</strong> trên tổng số <strong>{filteredChunks.length}</strong> chunks (Trang {currentPage}/{totalPages})
                </span>
              )}
            </div>
            {filteredChunks.length > PAGE_SIZE && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-bold text-zinc-700 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  ← Trang Trước
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      pageNum = Math.min(totalPages - 4 + i, Math.max(1, currentPage - 2 + i));
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-[#DC2626] text-white shadow-xs'
                            : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-bold text-zinc-700 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  Trang Sau →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Chunk Modal */}
      <ChunkModal
        isOpen={isChunkModalOpen}
        onClose={() => setIsChunkModalOpen(false)}
        onSave={handleSaveChunk}
        initialChunk={editingChunk}
        dayNumber={targetDayNumber}
      />

      {/* Classroom Simulation Preview Modal */}
      <ChunkPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        chunks={previewChunksList}
        initialIndex={previewInitialIndex}
        dayNumber={previewDayNumber}
        lessonTitle={previewLessonTitle}
      />

      {/* Excel & Data Ingest Modal */}
      <LessonExcelUploader
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onUploadSuccess={() => {
          loadCurriculumData();
        }}
        onStartDrillNow={(newLessonId, day) => {
          onLaunchProjectorForLesson(newLessonId, day);
        }}
      />
    </div>
  );
};
