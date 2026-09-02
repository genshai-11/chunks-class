import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  ImprovPackage, 
  ImprovSession, 
  ImprovItem, 
  ImprovHint, 
  ImprovSessionConfig, 
  ImprovLLMConfig,
  CourseLevel,
  LessonDoc,
  ChunkItem
} from '../types';
import { 
  getAllImprovPackages, 
  saveImprovPackage, 
  deleteImprovPackage, 
  parseImprovExcelFile, 
  exportImprovPackageToExcel,
  DEFAULT_IMPROV_MASTER_PROMPT,
  DEFAULT_IMPROV_LLM_CONFIG
} from '../services/improvService';
import { 
  improvTts, 
  synthesizeItemCombinedAudio, 
  playItemAudio, 
  stopImprovAudio 
} from '../services/improvTtsService';
import { audioPlayer, sanitizeSpeechText } from '../services/googleTtsService';
import { curriculumRegistry } from '../services/curriculumRegistry';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Play, 
  Square, 
  RotateCcw, 
  Sliders, 
  Volume2, 
  Layers, 
  Settings, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Save, 
  FileSpreadsheet, 
  ChevronDown, 
  ChevronRight, 
  Filter, 
  Search, 
  Zap, 
  Eye, 
  EyeOff, 
  Clock, 
  Key, 
  Cpu, 
  Globe, 
  BookOpen, 
  Terminal, 
  X, 
  RefreshCw,
  Loader2,
  Headphones,
  HelpCircle,
  BarChart3,
  Copy,
  FolderOpen
} from 'lucide-react';

// --------------------------------------------------------------------------
// 1. Hint Type Color and Styling Taxonomy
// --------------------------------------------------------------------------

export interface HintTypeBadgeInfo {
  bg: string;
  text: string;
  border: string;
  dot: string;
  label: string;
}

export function getHintTypeBadgeClasses(type: string): HintTypeBadgeInfo {
  const t = (type || '').toLowerCase();
  if (t.includes('keyword') || t.includes('core') || t.includes('seed')) {
    return {
      bg: 'bg-red-50 hover:bg-red-100/80',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500',
      label: 'Keyword'
    };
  }
  if (t.includes('logic') || t.includes('collocation') || t.includes('slot') || t.includes('connector')) {
    return {
      bg: 'bg-amber-50 hover:bg-amber-100/80',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      label: 'Logic word'
    };
  }
  if (t.includes('fancy') || t.includes('idiom') || t.includes('contrast') || t.includes('advanced') || t.includes('slang')) {
    return {
      bg: 'bg-purple-50 hover:bg-purple-100/80',
      text: 'text-purple-700',
      border: 'border-purple-200',
      dot: 'bg-purple-500',
      label: 'Fancy word'
    };
  }
  if (t.includes('ending') || t.includes('reaction') || t.includes('dialogue') || t.includes('reflex') || t.includes('example') || t.includes('sentence')) {
    return {
      bg: 'bg-emerald-50 hover:bg-emerald-100/80',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Ending'
    };
  }
  return {
    bg: 'bg-zinc-50 hover:bg-zinc-100',
    text: 'text-zinc-700',
    border: 'border-zinc-200',
    dot: 'bg-zinc-400',
    label: type || 'Hint'
  };
}

const HINT_TYPE_OPTIONS = ['Keyword', 'Logic word', 'Fancy word', 'Ending'];

// --------------------------------------------------------------------------
// 2. Default Seed Sample Packages (Zero-Empty State Guarantee)
// --------------------------------------------------------------------------

function createDefaultSeedPackages(): ImprovPackage[] {
  const now = new Date().toISOString();

  // Seed Package 1: ERES Speaking Masterclass
  const seedPkg1: ImprovPackage = {
    id: 'pkg_improv_eres_k24',
    title: 'Level B - ERES Spoken Reflexes & Conversational Improv (K24)',
    description: '4 Sessions luyện phản xạ ngẫu hứng theo bậc thang gợi ý (2 -> 3 -> 4 -> 5 hints) kết hợp từ vựng và đàm thoại cốt lõi.',
    totalItems: 50,
    sessionsCount: 4,
    sourceCourseLevel: 'LEVEL_B_ERES',
    createdAt: now,
    updatedAt: now,
    sessions: [
      {
        sessionNumber: 1,
        title: 'Session 1: Foundation 2 Hints (Keyword + Ending)',
        hcTotal: 2,
        hintTypes: ['Keyword', 'Ending'],
        items: Array.from({ length: 12 }, (_, i) => ({
          id: `item_s1_i${i + 1}`,
          itemNumber: i + 1,
          sessionNumber: 1,
          hcTotal: 2,
          hints: [
            {
              id: `h_1_${i + 1}_1`,
              text: i % 2 === 0 ? 'give it a shot' : 'hit the ground running',
              translation: i % 2 === 0 ? 'thử làm một phen' : 'bắt tay vào làm ngay tức khắc',
              typeFunction: 'Keyword',
              itemIndex: 1
            },
            {
              id: `h_1_${i + 1}_2`,
              text: i % 2 === 0 ? "Don't hesitate, just give it a shot today!" : 'We need to hit the ground running this quarter.',
              translation: i % 2 === 0 ? 'Đừng chần chừ, hãy thử sức ngay hôm nay!' : 'Chúng ta cần bắt tay vào việc ngay trong quý này.',
              typeFunction: 'Ending',
              itemIndex: 2
            }
          ]
        }))
      },
      {
        sessionNumber: 2,
        title: 'Session 2: Triad Reflex 3 Hints (Keyword + Logic + Ending)',
        hcTotal: 3,
        hintTypes: ['Keyword', 'Logic word', 'Ending'],
        items: Array.from({ length: 12 }, (_, i) => ({
          id: `item_s2_i${i + 1}`,
          itemNumber: i + 1,
          sessionNumber: 2,
          hcTotal: 3,
          hints: [
            {
              id: `h_2_${i + 1}_1`,
              text: 'room for improvement',
              translation: 'vẫn còn cơ hội/khoảng trống để cải thiện',
              typeFunction: 'Keyword',
              itemIndex: 1
            },
            {
              id: `h_2_${i + 1}_2`,
              text: 'to put it bluntly',
              translation: 'nói thẳng ra là / thẳng thắn mà nói',
              typeFunction: 'Logic word',
              itemIndex: 2
            },
            {
              id: `h_2_${i + 1}_3`,
              text: "To put it bluntly, there's still plenty of room for improvement in our presentation.",
              translation: 'Nói thẳng ra là bài thuyết trình của chúng ta vẫn còn rất nhiều điểm cần cải thiện.',
              typeFunction: 'Ending',
              itemIndex: 3
            }
          ]
        }))
      },
      {
        sessionNumber: 3,
        title: 'Session 3: Dynamic Quad 4 Hints (Keyword + Logic + Fancy + Ending)',
        hcTotal: 4,
        hintTypes: ['Keyword', 'Logic word', 'Fancy word', 'Ending'],
        items: Array.from({ length: 13 }, (_, i) => ({
          id: `item_s3_i${i + 1}`,
          itemNumber: i + 1,
          sessionNumber: 3,
          hcTotal: 4,
          hints: [
            {
              id: `h_3_${i + 1}_1`,
              text: 'keep an eye on',
              translation: 'để mắt tới / theo dõi sát sao',
              typeFunction: 'Keyword',
              itemIndex: 1
            },
            {
              id: `h_3_${i + 1}_2`,
              text: 'as far as I know',
              translation: 'theo như tôi được biết',
              typeFunction: 'Logic word',
              itemIndex: 2
            },
            {
              id: `h_3_${i + 1}_3`,
              text: 'a blessing in disguise',
              translation: 'trong cái rủi có cái may',
              typeFunction: 'Fancy word',
              itemIndex: 3
            },
            {
              id: `h_3_${i + 1}_4`,
              text: 'As far as I know, losing that contract was a blessing in disguise because we kept an eye on better deals.',
              translation: 'Theo tôi biết, việc mất hợp đồng đó hóa ra lại là điều may vì chúng ta đã theo sát các cơ hội tốt hơn.',
              typeFunction: 'Ending',
              itemIndex: 4
            }
          ]
        }))
      },
      {
        sessionNumber: 4,
        title: 'Session 4: Advanced Quintet 5 Hints (Extended Logic & Context)',
        hcTotal: 5,
        hintTypes: ['Keyword', 'Logic word', 'Fancy word', 'Logic word', 'Ending'],
        items: Array.from({ length: 13 }, (_, i) => ({
          id: `item_s4_i${i + 1}`,
          itemNumber: i + 1,
          sessionNumber: 4,
          hcTotal: 5,
          hints: [
            {
              id: `h_4_${i + 1}_1`,
              text: 'break the ice',
              translation: 'phá vỡ bầu không khí ngại ngùng ban đầu',
              typeFunction: 'Keyword',
              itemIndex: 1
            },
            {
              id: `h_4_${i + 1}_2`,
              text: 'in the first place',
              translation: 'ngay từ đầu',
              typeFunction: 'Logic word',
              itemIndex: 2
            },
            {
              id: `h_4_${i + 1}_3`,
              text: 'out of the blue',
              translation: 'bất thình lình / hoàn toàn bất ngờ',
              typeFunction: 'Fancy word',
              itemIndex: 3
            },
            {
              id: `h_4_${i + 1}_4`,
              text: 'on top of that',
              translation: 'hơn thế nữa / chưa kể đến',
              typeFunction: 'Logic word',
              itemIndex: 4
            },
            {
              id: `h_4_${i + 1}_5`,
              text: 'He tried to break the ice with a joke, but out of the blue, the client asked why we were here in the first place.',
              translation: 'Anh ấy cố phá tan bầu không khí bằng một câu đùa, nhưng bất thình lình, khách hàng hỏi ngay từ đầu chúng tôi đến đây làm gì.',
              typeFunction: 'Ending',
              itemIndex: 5
            }
          ]
        }))
      }
    ]
  };

  return [seedPkg1];
}

// --------------------------------------------------------------------------
// 3. ImprovManagerView Main Component
// --------------------------------------------------------------------------

interface ImprovManagerViewProps {
  onLaunchPresentation?: (packageId: string, sessionNumber?: number) => void;
  defaultPackageId?: string;
}

interface GenerationLogItem {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export const ImprovManagerView: React.FC<ImprovManagerViewProps> = ({
  onLaunchPresentation,
  defaultPackageId
}) => {
  // --------------------------------------------------------------------------
  // A. Packages & Active Selection State
  // --------------------------------------------------------------------------
  const [packages, setPackages] = useState<ImprovPackage[]>([]);
  const [activePackageId, setActivePackageId] = useState<string>(defaultPackageId || '');
  const [isLoadingPackages, setIsLoadingPackages] = useState<boolean>(true);
  const [activeSessionTab, setActiveSessionTab] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [audioFilter, setAudioFilter] = useState<'all' | 'ready' | 'missing'>('all');
  const [showVietnamese, setShowVietnamese] = useState<boolean>(true);

  // --------------------------------------------------------------------------
  // B. Modal Visibility States
  // --------------------------------------------------------------------------
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isBatchAudioModalOpen, setIsBatchAudioModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ImprovItem | null>(null);

  // --------------------------------------------------------------------------
  // C. Audio Playback & Synthesis State
  // --------------------------------------------------------------------------
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);
  const [playingHintIndex, setPlayingHintIndex] = useState<number | null>(null);
  const [synthesizingItemIds, setSynthesizingItemIds] = useState<Record<string, boolean>>({});
  const playAbortRef = useRef<boolean>(false);

  // Batch Audio Worker State
  const [batchWorkersCount, setBatchWorkersCount] = useState<number>(4);
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
    prepared: number;
    skipped: number;
    failed: number;
    statusText: string;
  }>({ current: 0, total: 0, prepared: 0, skipped: 0, failed: 0, statusText: '' });
  const [batchLogs, setBatchLogs] = useState<string[]>([]);
  const cancelBatchAudioRef = useRef<boolean>(false);

  // --------------------------------------------------------------------------
  // D. AI Generator Form State
  // --------------------------------------------------------------------------
  const [genTitle, setGenTitle] = useState<string>('CHUNKS Improv Mastery - Level B Reflexes');
  const [genDescription, setGenDescription] = useState<string>('Bộ bài tập ngẫu hứng 4 sessions rèn luyện phản xạ nhanh kết hợp từ vựng cốt lõi...');
  const [genTotalItems, setGenTotalItems] = useState<number>(50);
  const [genSessionsCount, setGenSessionsCount] = useState<number>(4);
  const [genSessionConfigs, setGenSessionConfigs] = useState<ImprovSessionConfig[]>([
    { sessionNumber: 1, hcTotal: 2, hintTypes: ['Keyword', 'Ending'], itemsCount: 12 },
    { sessionNumber: 2, hcTotal: 3, hintTypes: ['Keyword', 'Logic word', 'Ending'], itemsCount: 12 },
    { sessionNumber: 3, hcTotal: 4, hintTypes: ['Keyword', 'Logic word', 'Fancy word', 'Ending'], itemsCount: 13 },
    { sessionNumber: 4, hcTotal: 5, hintTypes: ['Keyword', 'Logic word', 'Fancy word', 'Logic word', 'Ending'], itemsCount: 13 }
  ]);

  // Vocab & Pedagogy Controls
  const [genSourceLevel, setGenSourceLevel] = useState<CourseLevel | 'ALL'>('LEVEL_B_ERES');
  const [genAvailableLessons, setGenAvailableLessons] = useState<LessonDoc[]>([]);
  const [genSelectedLessonIds, setGenSelectedLessonIds] = useState<string[]>([]);
  const [genDifficulty, setGenDifficulty] = useState<'Easy (A1-A2)' | 'Medium (B1)' | 'Hard (B2-C1)'>('Medium (B1)');
  const [genRelevance, setGenRelevance] = useState<'Thấp (Brainstorming ngẫu nhiên)' | 'Vừa (Tương quan ngữ cảnh)' | 'Cao (Gắn kết câu chuyện logic)'>('Cao (Gắn kết câu chuyện logic)');

  // LLM Config
  const [isLlmAccordionOpen, setIsLlmAccordionOpen] = useState<boolean>(false);
  const [genEndpoint, setGenEndpoint] = useState<string>('http://34.56.142.97:20128/v1');
  const [genApiKey, setGenApiKey] = useState<string>('sk-ba04304581f3081e-z78xn9-2f401106');
  const [genShowApiKey, setGenShowApiKey] = useState<boolean>(false);
  const [genModel, setGenModel] = useState<string>('ds/deepseek-v4-flash');
  const [genMasterPrompt, setGenMasterPrompt] = useState<string>(DEFAULT_IMPROV_MASTER_PROMPT);

  // Generator Live Execution
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [genProgress, setGenProgress] = useState<{ percent: number; current: number; total: number; message: string }>({
    percent: 0,
    current: 0,
    total: 50,
    message: ''
  });
  const [genLogs, setGenLogs] = useState<GenerationLogItem[]>([]);
  const [tokenStats, setTokenStats] = useState<{ elapsedSec: number; speed: string; estimatedTokens: number }>({
    elapsedSec: 0,
    speed: '~45 t/s',
    estimatedTokens: 0
  });
  const abortGenRef = useRef<AbortController | null>(null);
  const timerGenRef = useRef<any>(null);

  // --------------------------------------------------------------------------
  // E. Excel Import Drag & Drop State
  // --------------------------------------------------------------------------
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importParsedPackage, setImportParsedPackage] = useState<ImprovPackage | null>(null);
  const [isParsingImport, setIsParsingImport] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'create_new' | 'replace_current'>('create_new');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // 1. Initial Load of Packages & Registry
  // --------------------------------------------------------------------------
  useEffect(() => {
    async function loadData() {
      setIsLoadingPackages(true);
      try {
        let loaded = await getAllImprovPackages();
        if (!loaded || loaded.length === 0) {
          const seeds = createDefaultSeedPackages();
          for (const s of seeds) {
            await saveImprovPackage(s);
          }
          loaded = seeds;
        }
        setPackages(loaded);
        if (loaded.length > 0) {
          const found = defaultPackageId ? loaded.find(p => p.id === defaultPackageId) : null;
          setActivePackageId(found ? found.id : loaded[0].id);
        }
      } catch (err) {
        console.error('Failed to load Improv packages:', err);
        const seeds = createDefaultSeedPackages();
        setPackages(seeds);
        setActivePackageId(seeds[0].id);
      } finally {
        setIsLoadingPackages(false);
      }
    }
    loadData();
  }, [defaultPackageId]);

  // Load available lessons for Vocab selector when source level changes
  useEffect(() => {
    const lessons = curriculumRegistry.getLessons(genSourceLevel === 'ALL' ? 'LEVEL_B_ERES' : genSourceLevel);
    setGenAvailableLessons(lessons);
    setGenSelectedLessonIds(lessons.map(l => l.id));
  }, [genSourceLevel]);

  // Update session configs when total sessions count changes
  useEffect(() => {
    setGenSessionConfigs(prev => {
      const result: ImprovSessionConfig[] = [];
      const baseItemsPerSession = Math.floor(genTotalItems / genSessionsCount);
      const remainder = genTotalItems % genSessionsCount;

      for (let s = 1; s <= genSessionsCount; s++) {
        const existing = prev.find(c => c.sessionNumber === s);
        const defaultHc = Math.min(6, s + 1); // e.g. S1: 2 hints, S2: 3 hints, S3: 4 hints, S4: 5 hints
        let defaultTypes: string[] = ['Keyword'];
        if (defaultHc >= 2) defaultTypes.push('Ending');
        if (defaultHc >= 3) defaultTypes = ['Keyword', 'Logic word', 'Ending'];
        if (defaultHc >= 4) defaultTypes = ['Keyword', 'Logic word', 'Fancy word', 'Ending'];
        if (defaultHc >= 5) defaultTypes = ['Keyword', 'Logic word', 'Fancy word', 'Logic word', 'Ending'];

        result.push({
          sessionNumber: s,
          hcTotal: existing?.hcTotal || defaultHc,
          hintTypes: existing?.hintTypes || defaultTypes,
          itemsCount: baseItemsPerSession + (s <= remainder ? 1 : 0)
        });
      }
      return result;
    });
  }, [genSessionsCount, genTotalItems]);

  // Active Package Object
  const activePackage = useMemo(() => {
    return packages.find(p => p.id === activePackageId) || packages[0] || null;
  }, [packages, activePackageId]);

  // Flattened and Filtered Items for Active Package
  const filteredItems = useMemo(() => {
    if (!activePackage) return [];
    let items: ImprovItem[] = [];

    if (activeSessionTab === 'all') {
      activePackage.sessions.forEach(s => items.push(...s.items));
    } else {
      const session = activePackage.sessions.find(s => s.sessionNumber === activeSessionTab);
      if (session) items.push(...session.items);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(it => 
        it.hints.some(h => 
          h.text.toLowerCase().includes(q) || 
          h.translation.toLowerCase().includes(q) ||
          h.typeFunction.toLowerCase().includes(q)
        )
      );
    }

    return items;
  }, [activePackage, activeSessionTab, searchQuery]);

  // Stats Summary
  const stats = useMemo(() => {
    if (!activePackage) {
      return { totalItems: 0, totalSessions: 0, totalHints: 0, audioPreparedCount: 0, audioPreparedPercent: 0 };
    }
    let totalItems = 0;
    let totalHints = 0;
    let audioPreparedCount = 0;

    activePackage.sessions.forEach(s => {
      s.items.forEach(it => {
        totalItems++;
        totalHints += it.hints.length;
        const cacheKey = `improv_item_${it.id}_aura-asteria-en_vi-VN-Neural2-A_EN_ONLY`;
        if (audioPlayer.getCachedAudio(cacheKey, 'aura-asteria-en')) {
          audioPreparedCount++;
        }
      });
    });

    const percent = totalItems > 0 ? Math.round((audioPreparedCount / totalItems) * 100) : 0;

    return {
      totalItems,
      totalSessions: activePackage.sessions.length,
      totalHints,
      audioPreparedCount,
      audioPreparedPercent: percent
    };
  }, [activePackage, synthesizingItemIds]);

  // Extracted Core Vocab count for Generator
  const extractedSeedVocabCount = useMemo(() => {
    let count = 0;
    genSelectedLessonIds.forEach(lId => {
      const lesson = curriculumRegistry.getLessonById(lId);
      if (lesson && lesson.chunks) {
        count += lesson.chunks.filter(c => c.category === 'vocab' || c.category === 'phrase').length;
      }
    });
    return count;
  }, [genSelectedLessonIds]);

  // --------------------------------------------------------------------------
  // 2. Audio Playback with 1-Second Pause Sequence
  // --------------------------------------------------------------------------

  const handlePlayItemWithPause = async (item: ImprovItem) => {
    // If already playing this item, stop immediately
    if (playingItemId === item.id) {
      playAbortRef.current = true;
      audioPlayer.stop();
      stopImprovAudio();
      setPlayingItemId(null);
      setPlayingHintIndex(null);
      return;
    }

    // Stop any ongoing audio
    audioPlayer.stop();
    stopImprovAudio();
    playAbortRef.current = false;
    setPlayingItemId(item.id);

    const hints = [...item.hints].sort((a, b) => a.itemIndex - b.itemIndex);

    for (let i = 0; i < hints.length; i++) {
      if (playAbortRef.current) break;

      const hint = hints[i];
      setPlayingHintIndex(hint.itemIndex);

      try {
        // Play hint speech
        await audioPlayer.playChunk(hint.text, null, 'aura-asteria-en', 1.0, false);
      } catch (err) {
        console.warn(`[Audio] Playback error on hint #${hint.itemIndex}:`, err);
      }

      if (playAbortRef.current) break;

      // 1.0-second silence gap between hints (except after the last hint)
      if (i < hints.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (playingItemId === item.id || !playAbortRef.current) {
      setPlayingItemId(null);
      setPlayingHintIndex(null);
    }
  };

  // Synthesize audio for single item
  const handleSynthesizeSingleItem = async (item: ImprovItem) => {
    setSynthesizingItemIds(prev => ({ ...prev, [item.id]: true }));
    try {
      await synthesizeItemCombinedAudio(item, 'aura-asteria-en', 'vi-VN-Neural2-A', 'EN_ONLY');
      // Trigger small confetti
      confetti({ particleCount: 20, spread: 40, origin: { y: 0.8 } });
    } catch (err: any) {
      alert(`Lỗi tạo audio: ${err?.message || 'Không thể tạo âm thanh cho item này'}`);
    } finally {
      setSynthesizingItemIds(prev => ({ ...prev, [item.id]: false }));
    }
  };

  // --------------------------------------------------------------------------
  // 3. Package-Wide Batch Audio Generator (4 Workers)
  // --------------------------------------------------------------------------

  const handleStartBatchAudioGeneration = async () => {
    if (!activePackage) return;
    setIsBatchRunning(true);
    cancelBatchAudioRef.current = false;
    setBatchLogs([]);

    const addLog = (msg: string) => {
      const time = new Date().toLocaleTimeString('vi-VN');
      setBatchLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 100)]);
    };

    addLog(`Khởi động bộ tổng hợp âm thanh đa luồng (${batchWorkersCount} workers)...`);

    try {
      await improvTts.preparePackageAudio(
        activePackage,
        {
          voiceEn: 'aura-asteria-en',
          voiceVi: 'vi-VN-Neural2-A',
          concurrency: batchWorkersCount,
          forceRegenerate: false
        },
        (current, total, statusText) => {
          setBatchProgress({
            current,
            total,
            prepared: current,
            skipped: 0,
            failed: 0,
            statusText
          });
          addLog(statusText);
        }
      );

      addLog('Đã hoàn tất tạo toàn bộ âm thanh cho package!');
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      addLog(`Lỗi batch audio: ${err?.message || 'Không xác định'}`);
    } finally {
      setIsBatchRunning(false);
    }
  };

  // --------------------------------------------------------------------------
  // 4. AI Package Generator Trigger & LLM Integration
  // --------------------------------------------------------------------------

  const addGenLog = (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
    const time = new Date().toLocaleTimeString('vi-VN');
    setGenLogs(prev => [
      ...prev,
      { id: `log_${Date.now()}_${Math.random()}`, timestamp: time, type, message }
    ]);
  };

  const handleStartAiGeneration = async () => {
    if (!genTitle.trim()) {
      alert('Vui lòng nhập Tiêu đề Package');
      return;
    }

    setIsGenerating(true);
    setGenLogs([]);
    setTokenStats({ elapsedSec: 0, speed: '~45 t/s', estimatedTokens: 0 });
    setGenProgress({ percent: 5, current: 0, total: genTotalItems, message: 'Đang trích xuất từ vựng cốt lõi từ giáo trình...' });

    // Start timer
    let seconds = 0;
    timerGenRef.current = setInterval(() => {
      seconds++;
      setTokenStats(prev => ({
        ...prev,
        elapsedSec: seconds,
        estimatedTokens: Math.floor(seconds * 42)
      }));
    }, 1000);

    const abortController = new AbortController();
    abortGenRef.current = abortController;

    addGenLog('info', `Bắt đầu sinh dữ liệu AI cho "${genTitle}" (${genTotalItems} items, ${genSessionsCount} sessions)...`);

    try {
      // Step 1: Collect seed vocabulary from selected lessons
      let seedVocabs: { english: string; vietnamese: string }[] = [];
      genSelectedLessonIds.forEach(lId => {
        const lesson = curriculumRegistry.getLessonById(lId);
        if (lesson && lesson.chunks) {
          lesson.chunks.forEach(c => {
            if ((c.category === 'vocab' || c.category === 'phrase') && c.english) {
              seedVocabs.push({ english: c.english, vietnamese: c.vietnamese || '' });
            }
          });
        }
      });

      if (seedVocabs.length === 0) {
        addGenLog('warning', 'Không tìm thấy từ vựng trong các bài đã chọn. Đang sử dụng danh mục từ vựng mặc định...');
        seedVocabs = [
          { english: 'give it a shot', vietnamese: 'thử một phen' },
          { english: 'hit the ground running', vietnamese: 'bắt tay vào làm ngay' },
          { english: 'room for improvement', vietnamese: 'vẫn còn chỗ để cải thiện' },
          { english: 'keep an eye on', vietnamese: 'để mắt tới' }
        ];
      }

      addGenLog('info', `Đã gom được ${seedVocabs.length} từ vựng hạt giống. Đang biên soạn Prompt gửi LLM...`);
      setGenProgress({ percent: 25, current: 10, total: genTotalItems, message: 'Đang gửi yêu cầu tới DeepSeek Flash LLM...' });

      // Compile master prompt variables
      const compiledPrompt = genMasterPrompt
        .replace(/\{\{difficulty\}\}/g, genDifficulty)
        .replace(/\{\{relevance\}\}/g, genRelevance)
        .replace(/\{\{vocabList\}\}/g, seedVocabs.slice(0, 30).map(v => `${v.english} (${v.vietnamese})`).join(', '))
        .replace(/\{\{itemCount\}\}/g, String(genTotalItems));

      const requestPayload = {
        model: genModel || 'ds/deepseek-v4-flash',
        messages: [
          { role: 'system', content: compiledPrompt },
          {
            role: 'user',
            content: `Generate an Improv Package with Title "${genTitle}", Total Items: ${genTotalItems}, Sessions: ${JSON.stringify(genSessionConfigs)}, Seed Vocabularies: ${JSON.stringify(seedVocabs.slice(0, 25))}. Output ONLY JSON.`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      };

      addGenLog('info', `Gửi POST tới endpoint: ${genEndpoint} (Model: ${genModel})...`);

      const endpointUrl = genEndpoint.replace(/\/+$/, '') + '/chat/completions';
      
      let rawJsonContent = '';

      try {
        const response = await fetch(endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${genApiKey}`
          },
          body: JSON.stringify(requestPayload),
          signal: abortController.signal
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`LLM HTTP ${response.status}: ${errBody}`);
        }

        const resData = await response.json();
        rawJsonContent = resData.choices?.[0]?.message?.content || '';
        addGenLog('success', 'Nhận phản hồi thành công từ LLM! Đang bóc tách cú pháp JSON...');
      } catch (fetchErr: any) {
        if (abortController.signal.aborted) {
          addGenLog('warning', 'Quá trình sinh dữ liệu đã bị người dùng hủy.');
          return;
        }
        addGenLog('warning', `Không kết nối được LLM Endpoint (${fetchErr?.message}). Đang kích hoạt bộ sinh dữ liệu ngoại tuyến chuẩn xác...`);
        
        // Fallback offline procedural generator for instant resilience
        rawJsonContent = generateOfflineFallbackPackageJson(
          genTitle, 
          genDescription, 
          genTotalItems, 
          genSessionConfigs, 
          seedVocabs
        );
      }

      setGenProgress({ percent: 75, current: 35, total: genTotalItems, message: 'Đang chuẩn hóa và lưu trữ Package...' });

      // Clean & parse JSON
      let cleaned = rawJsonContent.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');

      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch (pErr) {
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          parsed = JSON.parse(cleaned.substring(start, end + 1));
        } else {
          throw new Error('Không thể phân tích cú pháp JSON trả về từ AI.');
        }
      }

      // Build ImprovPackage
      const newPackageId = `pkg_improv_${Date.now()}`;
      const now = new Date().toISOString();

      const newSessions: ImprovSession[] = (parsed.sessions || []).map((s: any, sIdx: number) => {
        const sessionNumber = s.sessionNumber || (sIdx + 1);
        const config = genSessionConfigs.find(c => c.sessionNumber === sessionNumber) || genSessionConfigs[sIdx] || { hcTotal: 4, hintTypes: ['Keyword', 'Ending'] };
        
        const items: ImprovItem[] = (s.items || []).map((it: any, itIdx: number) => {
          const itemNumber = it.itemNumber || (itIdx + 1);
          const hints: ImprovHint[] = (it.hints || []).map((h: any, hIdx: number) => ({
            id: `h_${sessionNumber}_${itemNumber}_${h.itemIndex || (hIdx + 1)}`,
            text: String(h.text || '').trim(),
            translation: String(h.translation || '').trim(),
            typeFunction: String(h.typeFunction || (config.hintTypes[hIdx] || 'Hint')).trim(),
            itemIndex: h.itemIndex || (hIdx + 1)
          }));

          return {
            id: `item_s${sessionNumber}_i${itemNumber}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            itemNumber,
            sessionNumber,
            hcTotal: hints.length || config.hcTotal,
            hints
          };
        });

        return {
          sessionNumber,
          title: s.title || `Session ${sessionNumber}`,
          hcTotal: config.hcTotal,
          hintTypes: config.hintTypes,
          items
        };
      });

      const totalItemsCount = newSessions.reduce((sum, s) => sum + s.items.length, 0);

      const createdPkg: ImprovPackage = {
        id: newPackageId,
        title: parsed.title || genTitle,
        description: parsed.description || genDescription,
        totalItems: totalItemsCount,
        sessionsCount: newSessions.length,
        sessions: newSessions,
        sourceCourseLevel: genSourceLevel,
        sourceLessonIds: genSelectedLessonIds,
        createdAt: now,
        updatedAt: now
      };

      // Save package
      await saveImprovPackage(createdPkg);

      setPackages(prev => [createdPkg, ...prev]);
      setActivePackageId(createdPkg.id);
      setActiveSessionTab('all');

      setGenProgress({ percent: 100, current: totalItemsCount, total: totalItemsCount, message: 'Hoàn tất sinh Package thành công!' });
      addGenLog('success', `Đã lưu Package "${createdPkg.title}" với ${totalItemsCount} items!`);

      confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });

      setTimeout(() => {
        setIsGeneratorOpen(false);
      }, 1500);

    } catch (err: any) {
      addGenLog('error', `Thất bại: ${err?.message || 'Lỗi không xác định trong quá trình sinh AI'}`);
    } finally {
      if (timerGenRef.current) clearInterval(timerGenRef.current);
      setIsGenerating(false);
      abortGenRef.current = null;
    }
  };

  const handleCancelAiGeneration = () => {
    if (abortGenRef.current) {
      abortGenRef.current.abort();
    }
    if (timerGenRef.current) {
      clearInterval(timerGenRef.current);
    }
    setIsGenerating(false);
    addGenLog('warning', 'Đã hủy quá trình sinh AI theo yêu cầu.');
  };

  // Helper for generating offline fallback package JSON
  function generateOfflineFallbackPackageJson(
    title: string,
    description: string,
    totalItems: number,
    sessionConfigs: ImprovSessionConfig[],
    seeds: { english: string; vietnamese: string }[]
  ): string {
    const sessions = sessionConfigs.map(sConfig => {
      const items = Array.from({ length: sConfig.itemsCount || Math.ceil(totalItems / sessionConfigs.length) }, (_, itIdx) => {
        const itemNumber = itIdx + 1;
        const seed = seeds[(itIdx + (sConfig.sessionNumber * 3)) % seeds.length] || { english: 'give it a shot', vietnamese: 'thử một phen' };
        
        const hints: any[] = [];
        for (let h = 1; h <= sConfig.hcTotal; h++) {
          const type = sConfig.hintTypes[h - 1] || 'Hint';
          let text = '';
          let translation = '';

          if (h === 1) {
            text = seed.english;
            translation = seed.vietnamese;
          } else if (h === 2 && sConfig.hcTotal === 2) {
            text = `Why don't you ${seed.english} right now?`;
            translation = `Sao bạn không ${seed.vietnamese} ngay bây giờ?`;
          } else if (h === 2) {
            text = `to make matters worse / in addition`;
            translation = `tệ hơn nữa là / ngoài ra`;
          } else if (h === 3 && sConfig.hcTotal === 3) {
            text = `In addition, we definitely should ${seed.english}.`;
            translation = `Ngoài ra, chúng ta chắc chắn nên ${seed.vietnamese}.`;
          } else if (h === 3) {
            text = `a blessing in disguise`;
            translation = `trong cái rủi có cái may`;
          } else if (h === 4 && sConfig.hcTotal === 4) {
            text = `Believe it or not, ${seed.english} turned out to be a blessing in disguise.`;
            translation = `Tin hay không tùy bạn, việc ${seed.vietnamese} hóa ra lại là điều may mắn.`;
          } else {
            text = `Finally, we decided to ${seed.english} and move forward.`;
            translation = `Cuối cùng, chúng tôi quyết định ${seed.vietnamese} và tiếp tục tiến bước.`;
          }

          hints.push({
            itemIndex: h,
            text,
            translation,
            typeFunction: type
          });
        }

        return {
          itemNumber,
          sessionNumber: sConfig.sessionNumber,
          hcTotal: sConfig.hcTotal,
          hints
        };
      });

      return {
        sessionNumber: sConfig.sessionNumber,
        title: `Session ${sConfig.sessionNumber}`,
        hcTotal: sConfig.hcTotal,
        hintTypes: sConfig.hintTypes,
        items
      };
    });

    return JSON.stringify({
      title,
      description,
      sessions
    });
  }

  // --------------------------------------------------------------------------
  // 5. Inline Quick Editor Save & Update
  // --------------------------------------------------------------------------

  const handleSaveEditedItem = async (andSynthesizeAudio: boolean = false) => {
    if (!editingItem || !activePackage) return;

    const updatedSessions = activePackage.sessions.map(s => {
      if (s.sessionNumber === editingItem.sessionNumber) {
        return {
          ...s,
          items: s.items.map(it => it.id === editingItem.id ? editingItem : it)
        };
      }
      return s;
    });

    const updatedPackage: ImprovPackage = {
      ...activePackage,
      sessions: updatedSessions,
      updatedAt: new Date().toISOString()
    };

    await saveImprovPackage(updatedPackage);
    setPackages(prev => prev.map(p => p.id === updatedPackage.id ? updatedPackage : p));

    if (andSynthesizeAudio) {
      await handleSynthesizeSingleItem(editingItem);
    }

    setEditingItem(null);
  };

  // --------------------------------------------------------------------------
  // 6. Excel Import & Export Operations
  // --------------------------------------------------------------------------

  const handleFileDrop = async (file: File) => {
    setImportFile(file);
    setIsParsingImport(true);
    try {
      const parsed = await parseImprovExcelFile(file);
      setImportParsedPackage(parsed);
    } catch (err: any) {
      alert(`Lỗi đọc file Excel: ${err?.message || 'Không thể xử lý file này'}`);
      setImportFile(null);
      setImportParsedPackage(null);
    } finally {
      setIsParsingImport(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importParsedPackage) return;

    if (importMode === 'replace_current' && activePackage) {
      const merged: ImprovPackage = {
        ...importParsedPackage,
        id: activePackage.id,
        title: activePackage.title,
        updatedAt: new Date().toISOString()
      };
      await saveImprovPackage(merged);
      setPackages(prev => prev.map(p => p.id === merged.id ? merged : p));
    } else {
      await saveImprovPackage(importParsedPackage);
      setPackages(prev => [importParsedPackage, ...prev]);
      setActivePackageId(importParsedPackage.id);
    }

    setIsImportModalOpen(false);
    setImportFile(null);
    setImportParsedPackage(null);
    confetti({ particleCount: 50, spread: 60 });
  };

  const handleExportExcel = () => {
    if (!activePackage) return;
    exportImprovPackageToExcel(activePackage);
  };

  const handleDownloadSampleExcel = () => {
    const sampleRows = [
      {
        'Session': 1,
        'Item': 1,
        'hc-total': 2,
        'hint-1': 'give it a shot',
        'hint-1-translation': 'thử làm một phen',
        'hint-1-type / function': 'Keyword',
        'hint-2': "Don't hesitate, just give it a shot today!",
        'hint-2-translation': 'Đừng chần chừ, hãy thử sức ngay hôm nay!',
        'hint-2-type / function': 'Ending'
      },
      {
        'Session': 2,
        'Item': 1,
        'hc-total': 3,
        'hint-1': 'room for improvement',
        'hint-1-translation': 'còn chỗ để cải thiện',
        'hint-1-type / function': 'Keyword',
        'hint-2': 'to put it bluntly',
        'hint-2-translation': 'thẳng thắn mà nói',
        'hint-2-type / function': 'Logic word',
        'hint-3': "To put it bluntly, there's still plenty of room for improvement.",
        'hint-3-translation': 'Thẳng thắn mà nói, vẫn còn nhiều chỗ cần cải thiện.',
        'hint-3-type / function': 'Ending'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Improv_Package');
    XLSX.writeFile(wb, 'Improv-package-sample.xlsx');
  };

  // --------------------------------------------------------------------------
  // 7. Delete Package
  // --------------------------------------------------------------------------

  const handleDeleteActivePackage = async () => {
    if (!activePackage) return;
    await deleteImprovPackage(activePackage.id);
    const remaining = packages.filter(p => p.id !== activePackage.id);
    setPackages(remaining);
    if (remaining.length > 0) {
      setActivePackageId(remaining[0].id);
    } else {
      const seeds = createDefaultSeedPackages();
      setPackages(seeds);
      setActivePackageId(seeds[0].id);
      await saveImprovPackage(seeds[0]);
    }
    setIsDeleteModalOpen(false);
  };

  if (isLoadingPackages && packages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-zinc-500 font-mono text-sm gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#DC2626]" />
        <span>Đang tải CHUNKS Improv Studio & Generator...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] text-[#0A0A0A] font-sans antialiased overflow-y-auto">
      {/* ==================================================================== */}
      {/* 1. HEADER & PACKAGE SELECTOR TOOLBAR */}
      {/* ==================================================================== */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#E8E8EC] px-6 py-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Package Switcher & Info */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-[#DC2626] border border-red-100 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#DC2626] bg-red-50 px-2 py-0.5 rounded border border-red-100">
                  Improv Studio
                </span>
                <span className="text-xs text-zinc-400">•</span>
                <span className="text-xs text-zinc-500 font-mono">
                  {activePackage?.sessionsCount || 0} Sessions ({stats.totalItems} Items)
                </span>
              </div>

              {/* Dropdown switcher */}
              <div className="relative mt-1">
                <select
                  value={activePackageId}
                  onChange={(e) => {
                    setActivePackageId(e.target.value);
                    setActiveSessionTab('all');
                  }}
                  className="text-base font-bold text-zinc-900 bg-transparent hover:bg-zinc-50 border-0 focus:ring-2 focus:ring-[#DC2626]/20 rounded-lg cursor-pointer transition-all pr-8 py-0.5 truncate max-w-[320px] sm:max-w-[450px]"
                >
                  {packages.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.sessionsCount} Sessions - {p.totalItems} Items)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right: Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Create New (AI Generator) */}
            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Tạo Package Mới (AI Generator)</span>
            </button>

            {/* Import Excel */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E8E8EC] hover:border-zinc-300 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 active:scale-95 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-500" />
              <span>Import Excel</span>
            </button>

            {/* Export Excel */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E8E8EC] hover:border-zinc-300 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span>Export Excel</span>
            </button>

            {/* Delete Package */}
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-2 rounded-xl border border-[#E8E8EC] hover:border-red-200 hover:bg-red-50 text-zinc-400 hover:text-red-600 active:scale-95 transition-all cursor-pointer"
              title="Xóa Package hiện tại"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-zinc-100">
          <div className="bg-zinc-50/80 rounded-lg p-2.5 border border-zinc-200/60 flex items-center gap-3">
            <div className="p-2 bg-white rounded-md border border-zinc-200 text-zinc-600">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Total Items</div>
              <div className="text-sm font-bold text-zinc-800">{stats.totalItems} Items</div>
            </div>
          </div>

          <div className="bg-zinc-50/80 rounded-lg p-2.5 border border-zinc-200/60 flex items-center gap-3">
            <div className="p-2 bg-white rounded-md border border-zinc-200 text-zinc-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Total Sessions</div>
              <div className="text-sm font-bold text-zinc-800">{stats.totalSessions} Sessions</div>
            </div>
          </div>

          <div className="bg-zinc-50/80 rounded-lg p-2.5 border border-zinc-200/60 flex items-center gap-3">
            <div className="p-2 bg-white rounded-md border border-zinc-200 text-zinc-600">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Total Hints</div>
              <div className="text-sm font-bold text-zinc-800">{stats.totalHints} Clues</div>
            </div>
          </div>

          <div className="bg-zinc-50/80 rounded-lg p-2.5 border border-zinc-200/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-md border border-zinc-200 text-zinc-600">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Audio Prepared</div>
                <div className="text-sm font-bold text-zinc-800">
                  {stats.audioPreparedPercent}% ({stats.audioPreparedCount}/{stats.totalItems})
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsBatchAudioModalOpen(true)}
              className="px-2 py-1 text-[11px] font-bold text-[#DC2626] bg-red-50 hover:bg-red-100 rounded-md border border-red-200 cursor-pointer transition-all"
            >
              Batch TTS
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. MAIN CONTENT: SESSION TABS & REVIEW / AUDITION TABLE */}
      {/* ==================================================================== */}
      <div className="flex-1 p-6 space-y-6">
        {/* Session Navigation Tabs & Filter Bar */}
        <div className="bg-white rounded-2xl border border-[#E8E8EC] p-4 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Session Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <button
                onClick={() => setActiveSessionTab('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeSessionTab === 'all'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                Tất Cả Sessions ({activePackage?.totalItems || 0})
              </button>

              {activePackage?.sessions.map(s => (
                <button
                  key={s.sessionNumber}
                  onClick={() => setActiveSessionTab(s.sessionNumber)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeSessionTab === s.sessionNumber
                      ? 'bg-[#DC2626] text-white shadow-xs'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  <span>Session {s.sessionNumber}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeSessionTab === s.sessionNumber ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {s.hcTotal} Hints ({s.items.length})
                  </span>
                </button>
              ))}
            </div>

            {/* Quick Controls: Subtitle Toggle & Batch Audio Trigger */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowVietnamese(!showVietnamese)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  showVietnamese
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                }`}
                title="Bật/Tắt hiển thị nghĩa tiếng Việt"
              >
                {showVietnamese ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{showVietnamese ? 'Hiện Tiếng Việt' : 'Ẩn Tiếng Việt'}</span>
              </button>

              <button
                onClick={() => setIsBatchAudioModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Tạo Toàn Bộ Audio Package (4 Workers)</span>
              </button>
            </div>
          </div>

          {/* Search & Sub-Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-zinc-100">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm hint tiếng Anh, nghĩa tiếng Việt, hoặc từ loại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50/80 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <span className="text-xs text-zinc-400 font-mono">
                Hiển thị {filteredItems.length} / {stats.totalItems} items
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 3. ITEMS REVIEW & AUDITION STREAM */}
        {/* ================================================================== */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E8EC] p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-zinc-700">Không tìm thấy Item nào</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Không có gợi ý nào khớp với bộ lọc tìm kiếm. Hãy thử đổi từ khóa hoặc chọn Session khác.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isPlayingThis = playingItemId === item.id;
              const isSynthesizing = synthesizingItemIds[item.id] || false;
              const cacheKey = `improv_item_${item.id}_aura-asteria-en_vi-VN-Neural2-A_EN_ONLY`;
              const isAudioReady = Boolean(audioPlayer.getCachedAudio(cacheKey, 'aura-asteria-en'));

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 p-4.5 shadow-2xs hover:shadow-xs ${
                    isPlayingThis 
                      ? 'border-[#DC2626] ring-2 ring-red-500/10' 
                      : 'border-[#E8E8EC] hover:border-zinc-300'
                  }`}
                >
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    {/* Left Index & Session Badge */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-8 h-8 rounded-xl bg-zinc-100 font-mono font-bold text-xs text-zinc-700 flex items-center justify-center border border-zinc-200">
                        #{item.itemNumber}
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">
                            Session {item.sessionNumber}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-zinc-300" />
                          <span className="text-[10px] font-mono font-semibold text-zinc-600 bg-zinc-100 px-1.5 py-0.2 rounded">
                            {item.hints.length} Hints
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`w-2 h-2 rounded-full ${isAudioReady ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                          <span className="text-[10px] font-mono text-zinc-500">
                            {isAudioReady ? 'Audio Ready' : 'No Cache'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Center: Horizontal Clue / Hint Cards Stream */}
                    <div className="flex-1 overflow-x-auto pb-1">
                      <div className="flex items-stretch gap-2.5 min-w-max">
                        {item.hints.map((hint) => {
                          const badge = getHintTypeBadgeClasses(hint.typeFunction);
                          const isHintActive = isPlayingThis && playingHintIndex === hint.itemIndex;

                          return (
                            <div
                              key={hint.id || hint.itemIndex}
                              className={`p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between w-[210px] sm:w-[240px] shrink-0 ${
                                isHintActive
                                  ? 'bg-red-50/90 border-[#DC2626] ring-2 ring-red-500/20 scale-102'
                                  : 'bg-zinc-50/80 border-zinc-200/80 hover:bg-zinc-50'
                              }`}
                            >
                              {/* Clue Header: Number & Badge */}
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <span className="text-[10px] font-mono font-bold text-zinc-400">
                                  HINT {hint.itemIndex}
                                </span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.bg} ${badge.text} ${badge.border}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                  <span>{badge.label}</span>
                                </span>
                              </div>

                              {/* Clue English Text */}
                              <div className="text-xs font-bold text-zinc-900 leading-snug line-clamp-3 mb-1">
                                {hint.text}
                              </div>

                              {/* Clue Vietnamese Meaning */}
                              {showVietnamese && hint.translation && (
                                <div className="text-[11px] text-zinc-500 italic line-clamp-2 mt-auto pt-1 border-t border-zinc-200/60 font-medium">
                                  {hint.translation}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Actions (Play with 1s pause, Synthesize, Edit) */}
                    <div className="flex items-center gap-2 shrink-0 self-end xl:self-center">
                      {/* Play Combined Audio with 1s Pause */}
                      <button
                        onClick={() => handlePlayItemWithPause(item)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                          isPlayingThis
                            ? 'bg-zinc-900 text-white'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                        }`}
                        title="Nghe lần lượt từng hint với 1 giây ngừng nghỉ"
                      >
                        {isPlayingThis ? (
                          <>
                            <Square className="w-3.5 h-3.5 text-red-400 fill-current animate-pulse" />
                            <span>Dừng</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 text-[#DC2626] fill-current" />
                            <span>Nghe Thử (1s Pause)</span>
                          </>
                        )}
                      </button>

                      {/* Single Item TTS Synthesizer */}
                      <button
                        onClick={() => handleSynthesizeSingleItem(item)}
                        disabled={isSynthesizing}
                        className="p-2 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100 text-zinc-600 disabled:opacity-50 cursor-pointer transition-all"
                        title="Tổng hợp âm thanh mới cho item này"
                      >
                        {isSynthesizing ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#DC2626]" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>

                      {/* Edit Item */}
                      <button
                        onClick={() => setEditingItem(JSON.parse(JSON.stringify(item)))}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E8EC] hover:border-zinc-300 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 cursor-pointer active:scale-95 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Sửa Text</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. MODAL: PACKAGE GENERATOR PANEL (AI GENERATOR) */}
      {/* ==================================================================== */}
      {isGeneratorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E8E8EC] shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E8E8EC] flex items-center justify-between bg-zinc-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-50 text-[#DC2626] border border-red-100">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-zinc-900">
                    Trợ Lý Tạo Package Bài Tập Phản Xạ Ngẫu Hứng (AI Improv Studio)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Tự động phân bổ bậc thang gợi ý (2..5 clues), gắn kết từ vựng giáo trình cốt lõi và ngữ cảnh đàm thoại.
                  </p>
                </div>
              </div>

              <button
                onClick={() => !isGenerating && setIsGeneratorOpen(false)}
                disabled={isGenerating}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* 1. Basic Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1.5 uppercase font-mono tracking-wider text-[10px]">
                    Tiêu Đề Package
                  </label>
                  <input
                    type="text"
                    value={genTitle}
                    onChange={(e) => setGenTitle(e.target.value)}
                    placeholder="VD: Level B - ERES Spoken Reflexes K24"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-[#DC2626]/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1.5 uppercase font-mono tracking-wider text-[10px]">
                    Mô Tả Ngắn
                  </label>
                  <input
                    type="text"
                    value={genDescription}
                    onChange={(e) => setGenDescription(e.target.value)}
                    placeholder="VD: 4 Sessions rèn luyện phản xạ nhanh kết hợp từ vựng..."
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-[#DC2626]/20"
                  />
                </div>
              </div>

              {/* 2. Total Items & Number of Sessions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-zinc-50/80 rounded-2xl border border-zinc-200/60">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1.5 uppercase font-mono tracking-wider text-[10px]">
                    Tổng Số Items Dự Kiến
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={200}
                    value={genTotalItems}
                    onChange={(e) => setGenTotalItems(Math.max(5, parseInt(e.target.value) || 50))}
                    className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl font-bold font-mono focus:ring-2 focus:ring-[#DC2626]/20"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block font-mono">
                    Mặc định: 50 items (Phân bổ đều qua các session)
                  </span>
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1.5 uppercase font-mono tracking-wider text-[10px]">
                    Số Lượng Sessions (1..8)
                  </label>
                  <select
                    value={genSessionsCount}
                    onChange={(e) => setGenSessionsCount(parseInt(e.target.value) || 4)}
                    className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl font-bold font-mono focus:ring-2 focus:ring-[#DC2626]/20"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={n}>
                        {n} Sessions {n === 4 ? '(Tiêu chuẩn 4 Bậc Thang)' : ''}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-zinc-400 mt-1 block font-mono">
                    Mỗi session có thể tùy chỉnh số lượng gợi ý (hcTotal) riêng biệt.
                  </span>
                </div>
              </div>

              {/* 3. Dynamic Session Configs Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-zinc-800 uppercase font-mono tracking-wider text-[10px] flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-[#DC2626]" />
                    <span>Cấu Hình Bậc Thang Gợi Ý Từng Session (Dynamic Matrix)</span>
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {genSessionConfigs.length} Sessions Configured
                  </span>
                </div>

                <div className="border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-100 text-zinc-600 font-mono text-[10px] uppercase border-b border-zinc-200">
                      <tr>
                        <th className="p-3">Session</th>
                        <th className="p-3">Số Gợi Ý (hcTotal)</th>
                        <th className="p-3">Hint Types Phân Bổ</th>
                        <th className="p-3 text-right">Items Dự Kiến</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 bg-white">
                      {genSessionConfigs.map((cfg, idx) => (
                        <tr key={cfg.sessionNumber} className="hover:bg-zinc-50/60">
                          <td className="p-3 font-bold text-zinc-800">
                            Session {cfg.sessionNumber}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={1}
                                max={8}
                                value={cfg.hcTotal}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 2;
                                  setGenSessionConfigs(prev => prev.map(c => 
                                    c.sessionNumber === cfg.sessionNumber ? { ...c, hcTotal: val } : c
                                  ));
                                }}
                                className="w-14 p-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-center font-mono font-bold"
                              />
                              <span className="text-[11px] text-zinc-500">hints/item</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1.5">
                              {HINT_TYPE_OPTIONS.map(ht => {
                                const isSelected = cfg.hintTypes.includes(ht);
                                const badge = getHintTypeBadgeClasses(ht);

                                return (
                                  <button
                                    key={ht}
                                    type="button"
                                    onClick={() => {
                                      setGenSessionConfigs(prev => prev.map(c => {
                                        if (c.sessionNumber === cfg.sessionNumber) {
                                          const nextTypes = isSelected 
                                            ? c.hintTypes.filter(t => t !== ht)
                                            : [...c.hintTypes, ht];
                                          return { ...c, hintTypes: nextTypes.length > 0 ? nextTypes : ['Keyword'] };
                                        }
                                        return c;
                                      }));
                                    }}
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                      isSelected
                                        ? `${badge.bg} ${badge.text} ${badge.border} ring-1 ring-zinc-300`
                                        : 'bg-zinc-50 text-zinc-400 border-zinc-200 opacity-60'
                                    }`}
                                  >
                                    {ht}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-zinc-700">
                            ~{cfg.itemsCount} items
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Source Vocab & Pedagogy Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-zinc-50/80 rounded-2xl border border-zinc-200/60">
                {/* Source Course Level & Lessons */}
                <div>
                  <label className="font-bold text-zinc-700 block mb-1 uppercase font-mono tracking-wider text-[10px]">
                    Nguồn Từ Vựng Giáo Trình
                  </label>
                  <select
                    value={genSourceLevel}
                    onChange={(e) => setGenSourceLevel(e.target.value as any)}
                    className="w-full p-2 bg-white border border-zinc-200 rounded-xl font-medium focus:ring-2 focus:ring-[#DC2626]/20 text-xs mb-2"
                  >
                    <option value="LEVEL_A">Level A - Foundation (Days 1..15)</option>
                    <option value="LEVEL_B_EREL">Level B - EREL Listening (Days 1..15)</option>
                    <option value="LEVEL_B_ERES">Level B - ERES Speaking (Days 1..15)</option>
                    <option value="ALL">Tất cả giáo trình (All Levels)</option>
                  </select>

                  <div className="text-[10px] text-zinc-500 font-mono flex items-center justify-between">
                    <span>Đã chọn {genSelectedLessonIds.length} bài</span>
                    <span className="text-[#DC2626] font-bold">~{extractedSeedVocabCount} core chunks</span>
                  </div>
                </div>

                {/* Difficulty Selector */}
                <div>
                  <label className="font-bold text-zinc-700 block mb-1 uppercase font-mono tracking-wider text-[10px]">
                    Độ Khó (Pedagogy Difficulty)
                  </label>
                  <select
                    value={genDifficulty}
                    onChange={(e) => setGenDifficulty(e.target.value as any)}
                    className="w-full p-2 bg-white border border-zinc-200 rounded-xl font-medium focus:ring-2 focus:ring-[#DC2626]/20 text-xs"
                  >
                    <option value="Easy (A1-A2)">Easy (A1-A2) - Đơn giản, trực diện</option>
                    <option value="Medium (B1)">Medium (B1) - Đàm thoại thực tế & Collocations</option>
                    <option value="Hard (B2-C1)">Hard (B2-C1) - Idioms & Cấu trúc nâng cao</option>
                  </select>
                  <span className="text-[10px] text-zinc-400 mt-1 block font-mono">
                    Điều chỉnh ngữ nghĩa gợi ý và độ phức tạp câu.
                  </span>
                </div>

                {/* Relevance Selector */}
                <div>
                  <label className="font-bold text-zinc-700 block mb-1 uppercase font-mono tracking-wider text-[10px]">
                    Mức Độ Liên Tưởng (Relevance)
                  </label>
                  <select
                    value={genRelevance}
                    onChange={(e) => setGenRelevance(e.target.value as any)}
                    className="w-full p-2 bg-white border border-zinc-200 rounded-xl font-medium focus:ring-2 focus:ring-[#DC2626]/20 text-xs"
                  >
                    <option value="Thấp (Brainstorming ngẫu nhiên)">Thấp (Brainstorming ngẫu nhiên)</option>
                    <option value="Vừa (Tương quan ngữ cảnh)">Vừa (Tương quan ngữ cảnh)</option>
                    <option value="Cao (Gắn kết câu chuyện logic)">Cao (Gắn kết câu chuyện logic)</option>
                  </select>
                  <span className="text-[10px] text-zinc-400 mt-1 block font-mono">
                    Mức độ mạch lạc giữa các gợi ý trong cùng 1 item.
                  </span>
                </div>
              </div>

              {/* 5. Dynamic LLM Settings (Accordion) */}
              <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setIsLlmAccordionOpen(!isLlmAccordionOpen)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-50 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-zinc-800 text-xs">Cấu Hình Mô Hình LLM & Prompt Nâng Cao</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      {genModel}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isLlmAccordionOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLlmAccordionOpen && (
                  <div className="p-4 border-t border-zinc-100 space-y-4 bg-zinc-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold text-zinc-600 block mb-1 font-mono text-[10px]">Endpoint URL</label>
                        <input
                          type="text"
                          value={genEndpoint}
                          onChange={(e) => setGenEndpoint(e.target.value)}
                          className="w-full p-2 bg-white border border-zinc-200 rounded-lg font-mono text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-zinc-600 block mb-1 font-mono text-[10px]">API Key</label>
                        <div className="relative">
                          <input
                            type={genShowApiKey ? 'text' : 'password'}
                            value={genApiKey}
                            onChange={(e) => setGenApiKey(e.target.value)}
                            className="w-full p-2 bg-white border border-zinc-200 rounded-lg font-mono text-[11px] pr-8"
                          />
                          <button
                            type="button"
                            onClick={() => setGenShowApiKey(!genShowApiKey)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                          >
                            {genShowApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-zinc-600 block mb-1 font-mono text-[10px]">Model</label>
                        <input
                          type="text"
                          value={genModel}
                          onChange={(e) => setGenModel(e.target.value)}
                          className="w-full p-2 bg-white border border-zinc-200 rounded-lg font-mono text-[11px]"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-bold text-zinc-600 font-mono text-[10px]">
                          Master System Prompt Editor
                        </label>
                        <button
                          type="button"
                          onClick={() => setGenMasterPrompt(DEFAULT_IMPROV_MASTER_PROMPT)}
                          className="text-[10px] text-[#DC2626] font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Khôi phục Prompt mặc định</span>
                        </button>
                      </div>

                      {/* Variables chips */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className="text-[10px] text-zinc-400 font-mono">Biến có sẵn:</span>
                        {['{{difficulty}}', '{{relevance}}', '{{vocabList}}', '{{itemCount}}'].map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setGenMasterPrompt(prev => prev + ' ' + tag)}
                            className="text-[10px] font-mono bg-white border border-zinc-200 hover:border-zinc-400 px-1.5 py-0.5 rounded text-zinc-600 cursor-pointer"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>

                      <textarea
                        rows={6}
                        value={genMasterPrompt}
                        onChange={(e) => setGenMasterPrompt(e.target.value)}
                        className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl font-mono text-[11px] leading-relaxed text-zinc-800 focus:ring-2 focus:ring-[#DC2626]/20"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Live Generation Progress Console */}
              {isGenerating && (
                <div className="p-4 bg-zinc-900 text-zinc-100 rounded-2xl border border-zinc-800 space-y-3 font-mono">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#DC2626]" />
                      <span className="font-bold">{genProgress.message || 'Đang sinh dữ liệu AI...'}</span>
                    </div>
                    <span className="text-zinc-400 font-bold">{genProgress.percent}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${genProgress.percent}%` }}
                    />
                  </div>

                  {/* Status Bar */}
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
                    <span>Thời gian: {tokenStats.elapsedSec}s</span>
                    <span>Tốc độ: {tokenStats.speed}</span>
                    <span>Ước tính tokens: ~{tokenStats.estimatedTokens}</span>
                  </div>

                  {/* Real-time Log Feed */}
                  <div className="bg-black/60 rounded-xl p-3 max-h-32 overflow-y-auto space-y-1 text-[10px]">
                    {genLogs.map(log => (
                      <div key={log.id} className="flex items-start gap-2">
                        <span className="text-zinc-500">{log.timestamp}</span>
                        <span className={
                          log.type === 'error' ? 'text-red-400 font-bold' :
                          log.type === 'success' ? 'text-emerald-400 font-bold' :
                          log.type === 'warning' ? 'text-amber-400' : 'text-zinc-300'
                        }>
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#E8E8EC] bg-zinc-50/80 flex items-center justify-between">
              <div className="text-xs text-zinc-500">
                Sẽ tạo <span className="font-bold text-zinc-900">{genTotalItems} items</span> chia vào <span className="font-bold text-zinc-900">{genSessionsCount} sessions</span>.
              </div>

              <div className="flex items-center gap-2">
                {isGenerating ? (
                  <button
                    onClick={handleCancelAiGeneration}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Hủy Quá Trình (Cancel)
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsGeneratorOpen(false)}
                      className="px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 transition-all cursor-pointer"
                    >
                      Đóng
                    </button>
                    <button
                      onClick={handleStartAiGeneration}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Bắt Đầu Sinh Dữ Liệu AI</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. MODAL: INLINE QUICK EDITOR */}
      {/* ==================================================================== */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E8E8EC] shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#E8E8EC] flex items-center justify-between bg-zinc-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-zinc-100 text-zinc-800 font-mono font-bold text-xs">
                  #{editingItem.itemNumber}
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-zinc-900">
                    Chỉnh Sửa Văn Bản Gợi Ý (Quick Inline Editor)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Session {editingItem.sessionNumber} • {editingItem.hints.length} Gợi ý
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editable Hint Cards */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {editingItem.hints.map((hint, idx) => (
                <div key={hint.id || idx} className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-zinc-500">
                      GỢI Ý #{hint.itemIndex}
                    </span>

                    <select
                      value={hint.typeFunction}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setEditingItem(prev => {
                          if (!prev) return null;
                          const nextHints = prev.hints.map((h, hIdx) => hIdx === idx ? { ...h, typeFunction: newType } : h);
                          return { ...prev, hints: nextHints };
                        });
                      }}
                      className="text-xs font-bold p-1 px-2.5 bg-white border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#DC2626]/20"
                    >
                      {HINT_TYPE_OPTIONS.map(ht => (
                        <option key={ht} value={ht}>{ht}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-zinc-600 block mb-1 font-mono text-[10px] uppercase">
                      English Hint Text
                    </label>
                    <input
                      type="text"
                      value={hint.text}
                      onChange={(e) => {
                        const newText = e.target.value;
                        setEditingItem(prev => {
                          if (!prev) return null;
                          const nextHints = prev.hints.map((h, hIdx) => hIdx === idx ? { ...h, text: newText } : h);
                          return { ...prev, hints: nextHints };
                        });
                      }}
                      className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:ring-2 focus:ring-[#DC2626]/20"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-zinc-600 block mb-1 font-mono text-[10px] uppercase">
                      Vietnamese Translation
                    </label>
                    <input
                      type="text"
                      value={hint.translation}
                      onChange={(e) => {
                        const newVi = e.target.value;
                        setEditingItem(prev => {
                          if (!prev) return null;
                          const nextHints = prev.hints.map((h, hIdx) => hIdx === idx ? { ...h, translation: newVi } : h);
                          return { ...prev, hints: nextHints };
                        });
                      }}
                      className="w-full p-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-700 italic focus:ring-2 focus:ring-[#DC2626]/20"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-[#E8E8EC] bg-zinc-50/80 flex items-center justify-between">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 transition-all cursor-pointer"
              >
                Hủy Bỏ
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveEditedItem(false)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-xs font-bold text-zinc-800 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Văn Bản</span>
                </button>

                <button
                  onClick={() => handleSaveEditedItem(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Lưu & Tạo Audio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. MODAL: PACKAGE BATCH AUDIO GENERATOR */}
      {/* ==================================================================== */}
      {isBatchAudioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E8E8EC] shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#E8E8EC] flex items-center justify-between bg-zinc-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-zinc-900">
                    Bộ Tổng Hợp Âm Thanh Toàn Diện Package (Batch Audio TTS)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Sử dụng DeepSeek/Deepgram Aura & Google TTS để tạo audio cho toàn bộ {stats.totalItems} items.
                  </p>
                </div>
              </div>

              <button
                onClick={() => !isBatchRunning && setIsBatchAudioModalOpen(false)}
                disabled={isBatchRunning}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Workers count selector */}
              <div className="flex items-center justify-between p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/60">
                <div>
                  <div className="font-bold text-zinc-800 text-xs">Số Luồng Xử Lý Song Song (Workers Pool)</div>
                  <div className="text-[11px] text-zinc-400">Tối ưu tốc độ tạo âm thanh mà không nghẽn mạng</div>
                </div>

                <div className="flex items-center gap-1.5 font-mono">
                  {[2, 4, 6, 8].map(w => (
                    <button
                      key={w}
                      type="button"
                      disabled={isBatchRunning}
                      onClick={() => setBatchWorkersCount(w)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        batchWorkersCount === w
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      {w} Threads
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Bar & Live Status */}
              {isBatchRunning && (
                <div className="p-4 bg-zinc-900 text-zinc-100 rounded-2xl border border-zinc-800 space-y-2 font-mono">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span>{batchProgress.statusText || 'Đang xử lý batch audio...'}</span>
                    </span>
                    <span className="text-amber-400 font-bold">
                      {batchProgress.current} / {batchProgress.total}
                    </span>
                  </div>

                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${(batchProgress.current / (batchProgress.total || 1)) * 100}%` }}
                    />
                  </div>

                  {/* Logs Drawer */}
                  <div className="bg-black/60 rounded-xl p-3 max-h-32 overflow-y-auto space-y-1 text-[10px] text-zinc-300">
                    {batchLogs.map((log, lIdx) => (
                      <div key={lIdx}>{log}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#E8E8EC] bg-zinc-50/80 flex items-center justify-between">
              <button
                onClick={() => setIsBatchAudioModalOpen(false)}
                disabled={isBatchRunning}
                className="px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 transition-all cursor-pointer"
              >
                Đóng
              </button>

              <button
                onClick={handleStartBatchAudioGeneration}
                disabled={isBatchRunning}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Bắt Đầu Tạo Audio ({batchWorkersCount} Workers)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. MODAL: IMPORT EXCEL SPREADSHEET */}
      {/* ==================================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E8E8EC] shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#E8E8EC] flex items-center justify-between bg-zinc-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-zinc-900">
                    Import Package từ Excel (.xlsx / .csv)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Tải lên file bảng tính chứa cấu trúc Session, Item, và các cột hint-1..N.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleFileDrop(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
                  isDragOver
                    ? 'border-[#DC2626] bg-red-50/40'
                    : 'border-zinc-200 bg-zinc-50/60 hover:bg-zinc-50'
                }`}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.xlsx, .xls, .csv';
                  input.onchange = (e: any) => {
                    if (e.target?.files?.[0]) handleFileDrop(e.target.files[0]);
                  };
                  input.click();
                }}
              >
                <div className="p-3 bg-white rounded-2xl shadow-xs border border-zinc-200 text-zinc-600">
                  <Upload className="w-6 h-6 text-[#DC2626]" />
                </div>

                <div>
                  <div className="text-sm font-bold text-zinc-800">
                    {importFile ? importFile.name : 'Kéo thả file Excel (.xlsx) vào đây hoặc click để chọn'}
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">
                    Hỗ trợ định dạng .xlsx, .xls, .csv theo tiêu chuẩn CHUNKS Improv.
                  </div>
                </div>

                {isParsingImport && (
                  <div className="flex items-center gap-2 text-xs text-[#DC2626] font-mono">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang đọc và phân tích bảng tính...</span>
                  </div>
                )}
              </div>

              {/* Sample Template & Mode Options */}
              <div className="flex items-center justify-between p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/60 text-xs">
                <button
                  type="button"
                  onClick={handleDownloadSampleExcel}
                  className="text-xs font-bold text-[#DC2626] hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải File Mẫu Excel (Sample Template)</span>
                </button>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'create_new'}
                      onChange={() => setImportMode('create_new')}
                      className="text-[#DC2626] focus:ring-[#DC2626]"
                    />
                    <span className="font-semibold text-zinc-700">Tạo Package Mới</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace_current'}
                      onChange={() => setImportMode('replace_current')}
                      className="text-[#DC2626] focus:ring-[#DC2626]"
                    />
                    <span className="font-semibold text-zinc-700">Ghi Đè Package Này</span>
                  </label>
                </div>
              </div>

              {/* Parsed Preview */}
              {importParsedPackage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs space-y-1 font-mono">
                  <div className="font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Đọc thành công: {importParsedPackage.title}</span>
                  </div>
                  <div>• Số Sessions: {importParsedPackage.sessionsCount} sessions</div>
                  <div>• Tổng Items: {importParsedPackage.totalItems} items</div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#E8E8EC] bg-zinc-50/80 flex items-center justify-between">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 transition-all cursor-pointer"
              >
                Hủy
              </button>

              <button
                onClick={handleConfirmImport}
                disabled={!importParsedPackage}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Xác Nhận Import Package</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. MODAL: DELETE PACKAGE CONFIRMATION */}
      {/* ==================================================================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E8E8EC] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#DC2626] border border-red-100 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-display font-bold text-base text-zinc-900">
                Xác Nhận Xóa Package?
              </h3>
              <p className="text-xs text-zinc-500">
                Bạn có chắc chắn muốn xóa package <span className="font-bold text-zinc-800">"{activePackage?.title}"</span>? Hành động này sẽ xóa toàn bộ {stats.totalItems} items và không thể hoàn tác.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 transition-all cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleDeleteActivePackage}
                className="py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovManagerView;
