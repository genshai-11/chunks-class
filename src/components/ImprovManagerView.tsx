import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  ImprovPackage, 
  ImprovSession, 
  ImprovItem, 
  ImprovHint, 
  ImprovSessionConfig, 
  ImprovLLMConfig,
  ImprovLlmProvider,
  CourseLevel,
  LessonDoc,
  ChunkItem,
  CohortAudioSettings
} from '../types';
import { 
  getAllImprovPackages, 
  saveImprovPackage, 
  deleteImprovPackage, 
  addOrUpdateImprovItem, 
  deleteImprovItem, 
  parseImprovExcelFile, 
  exportImprovPackageToExcel, 
  loadDefaultPresets, 
  DEFAULT_IMPROV_MASTER_PROMPT, 
  DEFAULT_IMPROV_LLM_CONFIG, 
  DEEPSEEK_DEFAULT_CONFIG, 
  GOOGLE_GENAI_DEFAULT_CONFIG, 
  executeLlmGeneration, 
  testLlmConnection 
} from '../services/improvService';
import { IMPROV_SET_01, IMPROV_SET_02 } from '../data/improvSet01And02';
import { DEFAULT_IMPROV_PACKAGES } from '../data/defaultImprovPackages';
import { 
  getSemanticHintBadge, 
  improvText, 
  improvColors 
} from '../styles/improvTheme';
import { 
  improvTts, 
  synthesizeItemCombinedAudio, 
  synthesizeSingleHintAudio,
  playItemAudio, 
  stopImprovAudio,
  getHintTextByLanguage
} from '../services/improvTtsService';
import { audioPlayer, sanitizeSpeechText, ALL_VOICES, GOOGLE_TTS_VOICES } from '../services/googleTtsService';
import { curriculumRegistry } from '../services/curriculumRegistry';
import { 
  syncImprovPackageCachedAudioToCloud, 
  uploadImprovBase64AudioToGcs 
} from '../services/cloudAudioStorageService';
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
  FolderOpen,
  LayoutGrid,
  Table as TableIcon,
  List,
  Flame,
  CheckSquare,
  Minus,
  Maximize2,
  Minimize2,
  Moon,
  Sun,
  CloudUpload
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
  const badge = getSemanticHintBadge(type);
  const classes = badge.badgeClass.split(' ');
  const bg = classes[0] || 'bg-zinc-50';
  const text = classes[1] || 'text-zinc-700';
  const border = classes[2] || 'border-zinc-200';
  return {
    bg: `${bg} hover:${bg}/80`,
    text,
    border,
    dot: badge.dotClass,
    label: badge.label
  };
}

const HINT_TYPE_OPTIONS = ['Keyword', 'Logic word', 'Fancy word', 'Ending'];

// --------------------------------------------------------------------------
// 2. Default Seed Sample Packages (Zero-Empty State Guarantee)
// --------------------------------------------------------------------------

function createDefaultSeedPackages(): ImprovPackage[] {
  const allSeeds = [IMPROV_SET_01, IMPROV_SET_02, ...DEFAULT_IMPROV_PACKAGES];
  return Array.from(new Map(allSeeds.map(p => [p.id, p])).values());
}

// --------------------------------------------------------------------------
// 3. ImprovManagerView Main Component
// --------------------------------------------------------------------------

interface ImprovManagerViewProps {
  onLaunchPresentation?: (packageId: string, sessionNumber?: number) => void;
  defaultPackageId?: string;
  audioSettings?: CohortAudioSettings;
}

interface GenerationLogItem {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export const ImprovManagerView: React.FC<ImprovManagerViewProps> = ({
  onLaunchPresentation,
  defaultPackageId,
  audioSettings
}) => {
  const currentVoiceEn = audioSettings?.voice_profile_en || 'aura-asteria-en';
  const currentVoiceVi = audioSettings?.voice_profile_vi || 'vi-VN-Neural2-A';
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
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // --------------------------------------------------------------------------
  // B. Modal Visibility & Item CRUD States
  // --------------------------------------------------------------------------
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isBatchAudioModalOpen, setIsBatchAudioModalOpen] = useState<boolean>(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ImprovItem | null>(null);
  const [newItem, setNewItem] = useState<ImprovItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ sessionNumber: number; itemId: string; itemNumber: number } | null>(null);

  // --------------------------------------------------------------------------
  // C. Audio Playback & Synthesis State
  // --------------------------------------------------------------------------
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);
  const [playingHintIndex, setPlayingHintIndex] = useState<number | null>(null);
  const [playingLang, setPlayingLang] = useState<'en' | 'vi'>('en');
  const [synthesizingItemIds, setSynthesizingItemIds] = useState<Record<string, boolean>>({});
  const playAbortRef = useRef<boolean>(false);

  // Batch Audio Worker State & Custom Voices
  const [batchWorkersCount, setBatchWorkersCount] = useState<number>(4);
  const [batchTargetLang, setBatchTargetLang] = useState<'en' | 'vi' | 'both'>('both');
  const [batchVoiceEn, setBatchVoiceEn] = useState<string>(currentVoiceEn || 'aura-asteria-en');
  const [batchVoiceVi, setBatchVoiceVi] = useState<string>(currentVoiceVi || 'vi-VN-Neural2-A');
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
  const [isSyncingToCloud, setIsSyncingToCloud] = useState<boolean>(false);
  const [cloudSyncProgress, setCloudSyncProgress] = useState<string | null>(null);

  // Keep batch voice in sync if prop changes
  useEffect(() => {
    if (currentVoiceEn) setBatchVoiceEn(currentVoiceEn);
  }, [currentVoiceEn]);

  useEffect(() => {
    if (currentVoiceVi) setBatchVoiceVi(currentVoiceVi);
  }, [currentVoiceVi]);

  // Voice options for batch generation modal
  const enVoiceOptions = useMemo(() => {
    return ALL_VOICES.filter(v => v.languageCode === 'en-US' || v.id.startsWith('aura-') || v.id.startsWith('en-US-'));
  }, []);

  const viVoiceOptions = useMemo(() => {
    return GOOGLE_TTS_VOICES.filter(v => v.languageCode === 'vi-VN');
  }, []);

  // Per-item voice model overrides & expandable config
  const [itemVoiceEn, setItemVoiceEn] = useState<Record<string, string>>({});
  const [itemVoiceVi, setItemVoiceVi] = useState<Record<string, string>>({});
  const [expandedItemVoiceConfig, setExpandedItemVoiceConfig] = useState<Record<string, boolean>>({});
  const [synthesizingHintIds, setSynthesizingHintIds] = useState<Record<string, boolean>>({});

  // UI Feedback Toast & Fullscreen / Dark Mode State
  const [deleteSuccessToast, setDeleteSuccessToast] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chunks_theme') === 'dark' || document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('chunks_theme', next ? 'dark' : 'light');
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return next;
    });
  };

  // --------------------------------------------------------------------------
  // D. AI Generator Form State (3-Layer Filter) - Default to Level B ERES
  // --------------------------------------------------------------------------
  const [genTitle, setGenTitle] = useState<string>('CHUNKS Improv Mastery - Level B ERES Reflexes');
  const [genDescription, setGenDescription] = useState<string>('Bộ bài tập ngẫu hứng đa tầng rèn luyện phản xạ nhanh kết hợp từ vựng cốt lõi Level B ERES...');
  const [genTotalItems, setGenTotalItems] = useState<number>(50);
  const [genSessionsCount, setGenSessionsCount] = useState<number>(4);
  const [genSessionConfigs, setGenSessionConfigs] = useState<ImprovSessionConfig[]>([
    { sessionNumber: 1, hcTotal: 2, hintTypes: ['Keyword', 'Ending'], itemsCount: 12 },
    { sessionNumber: 2, hcTotal: 3, hintTypes: ['Keyword', 'Logic word', 'Ending'], itemsCount: 12 },
    { sessionNumber: 3, hcTotal: 4, hintTypes: ['Keyword', 'Logic word', 'Fancy word', 'Ending'], itemsCount: 13 },
    { sessionNumber: 4, hcTotal: 4, hintTypes: ['Keyword', 'Logic word', 'Fancy word', 'Ending'], itemsCount: 13 }
  ]);

  // Layer 1: Khóa học (Defaults to LEVEL_B_ERES)
  const [genSourceLevel, setGenSourceLevel] = useState<CourseLevel | 'ALL'>('LEVEL_B_ERES');
  // Layer 2: Bài học (Days) - Defaults to level_b_eres_day_1
  const [genAvailableLessons, setGenAvailableLessons] = useState<LessonDoc[]>([]);
  const [genSelectedLessonIds, setGenSelectedLessonIds] = useState<string[]>(['level_b_eres_day_1']);
  // Layer 3: Thể loại & Từ vựng cụ thể
  const [genCategoryFilter, setGenCategoryFilter] = useState<string>('all');
  const [genVocabSearch, setGenVocabSearch] = useState<string>('');
  const [genSelectedVocabIds, setGenSelectedVocabIds] = useState<string[]>([]);

  // Pedagogy controls
  const [genDifficulty, setGenDifficulty] = useState<'Easy (A1-A2)' | 'Medium (B1)' | 'Hard (B2-C1)'>('Medium (B1)');
  const [genRelevance, setGenRelevance] = useState<'Thấp (Brainstorming ngẫu nhiên)' | 'Vừa (Tương quan ngữ cảnh)' | 'Cao (Gắn kết câu chuyện logic)'>('Cao (Gắn kết câu chuyện logic)');

  // LLM Config
  const [genProvider, setGenProvider] = useState<ImprovLlmProvider>('DEEPSEEK');
  const [isLlmAccordionOpen, setIsLlmAccordionOpen] = useState<boolean>(true);
  const [genEndpoint, setGenEndpoint] = useState<string>(DEEPSEEK_DEFAULT_CONFIG.endpoint);
  const [genApiKey, setGenApiKey] = useState<string>(DEEPSEEK_DEFAULT_CONFIG.apiKey);
  const [genShowApiKey, setGenShowApiKey] = useState<boolean>(false);
  const [genModel, setGenModel] = useState<string>(DEEPSEEK_DEFAULT_CONFIG.model);
  const [genMasterPrompt, setGenMasterPrompt] = useState<string>(DEFAULT_IMPROV_MASTER_PROMPT);

  const handleProviderChange = (newProvider: ImprovLlmProvider) => {
    setGenProvider(newProvider);
    setTestResult(null);
    if (newProvider === 'DEEPSEEK') {
      setGenEndpoint(DEEPSEEK_DEFAULT_CONFIG.endpoint);
      setGenApiKey(DEEPSEEK_DEFAULT_CONFIG.apiKey);
      setGenModel('deepseek-chat');
    } else if (newProvider === 'GOOGLE_GENAI') {
      setGenEndpoint(GOOGLE_GENAI_DEFAULT_CONFIG.endpoint);
      const savedGeminiKey = localStorage.getItem('chunks_gemini_api_key') || '';
      setGenApiKey(savedGeminiKey);
      setGenModel('gemini-2.5-flash');
    } else {
      setGenEndpoint('https://api.openai.com/v1');
      setGenModel('gpt-4o-mini');
    }
  };

  // Connection test state
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; message: string; model?: string } | null>(null);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testLlmConnection({
        provider: genProvider,
        endpoint: genEndpoint,
        apiKey: genApiKey,
        model: genModel,
        masterPrompt: genMasterPrompt,
        temperature: 0.7,
        maxTokens: 50
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        message: err?.message || 'Lỗi kết nối tới mô hình AI'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };


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
        const defaultSeeds = createDefaultSeedPackages();

        const deletedIdsStr = typeof window !== 'undefined' ? localStorage.getItem('chunks_improv_deleted_package_ids') : null;
        let deletedIds = new Set<string>();
        if (deletedIdsStr) {
          try {
            deletedIds = new Set<string>(JSON.parse(deletedIdsStr));
          } catch (e) {
            console.error('Error parsing deletedIds:', e);
          }
        }

        // Filter defaultSeeds so that deletedIds are never resurrected!
        const filteredDefaultSeeds = defaultSeeds.filter(d => !deletedIds.has(d.id));
        // Also filter loaded packages in case of race condition:
        loaded = (loaded || []).filter(p => !deletedIds.has(p.id));

        // Ensure default packages (DEFAULT_IMPROV_PACKAGES, IMPROV_SET_01, IMPROV_SET_02)
        // are automatically persisted into localStorage and Firestore so Studio is never empty,
        // ONLY if they have not been deleted!
        let needsPersistence = false;
        if (!loaded || loaded.length === 0) {
          loaded = filteredDefaultSeeds;
          needsPersistence = true;
        } else {
          const loadedIds = new Set(loaded.map(p => p.id));
          const missingDefaults = filteredDefaultSeeds.filter(d => !loadedIds.has(d.id));
          if (missingDefaults.length > 0) {
            loaded = [...missingDefaults, ...loaded];
            needsPersistence = true;
          }
        }

        if (needsPersistence) {
          for (const s of filteredDefaultSeeds) {
            try {
              await saveImprovPackage(s);
            } catch (err) {
              console.warn('[ImprovManagerView] Auto-persistence notice for pkg:', s.id, err);
            }
          }
        }

        setPackages(loaded);
        if (loaded.length > 0) {
          const found = defaultPackageId ? loaded.find(p => p.id === defaultPackageId) : null;
          setActivePackageId(found ? found.id : loaded[0].id);
        }
      } catch (err) {
        console.error('Failed to load Improv packages, restoring defaults:', err);
        const deletedIdsStr = typeof window !== 'undefined' ? localStorage.getItem('chunks_improv_deleted_package_ids') : null;
        let deletedIds = new Set<string>();
        if (deletedIdsStr) {
          try {
            deletedIds = new Set<string>(JSON.parse(deletedIdsStr));
          } catch (e) {
            console.error('Error parsing deletedIds:', e);
          }
        }
        const seeds = createDefaultSeedPackages().filter(d => !deletedIds.has(d.id));
        if (seeds.length > 0) {
          setPackages(seeds);
          setActivePackageId(seeds[0].id);
          for (const s of seeds) {
            saveImprovPackage(s).catch(() => {});
          }
        }
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
    // Default genSelectedLessonIds MUST be single lesson (e.g. Day 1) or empty to prevent initial lag
    if (lessons.length > 0) {
      setGenSelectedLessonIds([lessons[0].id]);
    } else {
      setGenSelectedLessonIds([]);
    }
  }, [genSourceLevel]);

  // Layer 3: Extract all seed chunks from selected lessons
  const allAvailableSeedChunks: ChunkItem[] = useMemo(() => {
    const chunks: ChunkItem[] = [];
    genSelectedLessonIds.forEach(lId => {
      const lesson = curriculumRegistry.getLessonById(lId);
      if (lesson && lesson.chunks) {
        chunks.push(...lesson.chunks);
      }
    });
    return chunks;
  }, [genSelectedLessonIds]);

  // Available categories in the extracted chunks
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    allAvailableSeedChunks.forEach(c => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [allAvailableSeedChunks]);

  // Filtered seed chunks based on Category filter & Search query
  const filteredSeedChunks = useMemo(() => {
    return allAvailableSeedChunks.filter(c => {
      const matchCat = genCategoryFilter === 'all' || c.category === genCategoryFilter;
      const matchSearch = !genVocabSearch.trim() || 
        c.english.toLowerCase().includes(genVocabSearch.toLowerCase()) || 
        (c.vietnamese && c.vietnamese.toLowerCase().includes(genVocabSearch.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [allAvailableSeedChunks, genCategoryFilter, genVocabSearch]);

  // Slice visible chunks to maximum 80 items to prevent DOM freezing/lag
  const visibleSeedChunks = useMemo(() => {
    return filteredSeedChunks.slice(0, 80);
  }, [filteredSeedChunks]);

  // Fast O(1) set lookup for selected vocabularies
  const selectedVocabSet = useMemo(() => new Set(genSelectedVocabIds), [genSelectedVocabIds]);

  // Auto-select seed chunks when selected lessons change
  useEffect(() => {
    setGenSelectedVocabIds(allAvailableSeedChunks.map(c => c.id));
  }, [allAvailableSeedChunks]);


  // Update session configs when total sessions count changes
  useEffect(() => {
    setGenSessionConfigs(prev => {
      const result: ImprovSessionConfig[] = [];
      const baseItemsPerSession = Math.floor(genTotalItems / genSessionsCount);
      const remainder = genTotalItems % genSessionsCount;

      for (let s = 1; s <= genSessionsCount; s++) {
        const existing = prev.find(c => c.sessionNumber === s);
        const defaultHc = Math.min(4, s + 1); // e.g. S1: 2 hints, S2: 3 hints, S3: 4 hints, S4: 4 hints
        let defaultTypes: string[] = ['Keyword'];
        if (defaultHc === 2) defaultTypes = ['Danh từ · Keyword', 'Động từ · Ending'];
        if (defaultHc === 3) defaultTypes = ['Keyword', 'Từ nối · Logic word', 'Ending'];
        if (defaultHc >= 4) defaultTypes = ['Keyword', 'Từ nối · Logic word', 'Fancy word / Ẩn dụ', 'Ending'];

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
        const isReady = Boolean(
          (it.audioUrl && (it.audioUrl.startsWith('http') || it.audioUrl === 'cached')) ||
          (it.audioUrlVi && it.audioUrlVi.startsWith('http')) ||
          audioPlayer.getCachedAudio(`improv_item_${it.id}_${currentVoiceEn}_${currentVoiceVi}_EN_ONLY`, currentVoiceEn) ||
          audioPlayer.getCachedAudio(`improv_item_${it.id}_${currentVoiceEn}_${currentVoiceVi}_EN_THEN_VI`, currentVoiceEn) ||
          (it.hints && it.hints.length > 0 && it.hints.every(h => {
            const t = h.text?.trim();
            return !t || Boolean((h.audioUrl && h.audioUrl.startsWith('http')) || audioPlayer.getCachedAudio(t, currentVoiceEn) || audioPlayer.isChunkCached(t, currentVoiceEn));
          }))
        );
        if (isReady) {
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
  }, [activePackage, synthesizingItemIds, currentVoiceEn, currentVoiceVi]);

  // --------------------------------------------------------------------------
  // 2. Audio Playback with 1-Second Pause Sequence (EN / VI)
  // --------------------------------------------------------------------------

  const handlePlayItemWithPause = async (item: ImprovItem, lang: 'en' | 'vi' = 'en') => {
    // If already playing this item and same language, stop immediately
    if (playingItemId === item.id && playingLang === lang) {
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
    setPlayingLang(lang);

    const hints = [...item.hints].sort((a, b) => a.itemIndex - b.itemIndex);

    for (let i = 0; i < hints.length; i++) {
      if (playAbortRef.current) break;

      const hint = hints[i];
      setPlayingHintIndex(hint.itemIndex);

      try {
        const textToSpeak = getHintTextByLanguage(hint, lang);
        const voice = lang === 'vi' ? currentVoiceVi : currentVoiceEn;
        await audioPlayer.playChunk(textToSpeak, null, voice, 1.0, false);
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

  // Synthesize audio for single item (EN, VI, or BOTH) with optional voice model overrides
  const handleSynthesizeSingleItem = async (
    item: ImprovItem, 
    target: 'en' | 'vi' | 'both' = 'both',
    voiceEnOverride?: string,
    voiceViOverride?: string
  ) => {
    const effectiveVoiceEn = voiceEnOverride || itemVoiceEn[item.id] || currentVoiceEn;
    const effectiveVoiceVi = voiceViOverride || itemVoiceVi[item.id] || currentVoiceVi;
    setSynthesizingItemIds(prev => ({ ...prev, [item.id]: true }));
    try {
      if (target === 'en' || target === 'both') {
        await synthesizeItemCombinedAudio(item, effectiveVoiceEn, effectiveVoiceVi, 'EN_ONLY', true);
      }
      if (target === 'vi' || target === 'both') {
        await synthesizeItemCombinedAudio(item, effectiveVoiceEn, effectiveVoiceVi, 'VI_ONLY', true);
      }

      // Check if base64 audio exists in cache and upload to Cloud Storage
      if (activePackage) {
        let hasCloudUpdates = false;
        const updatedItem: ImprovItem = {
          ...item,
          hints: item.hints ? item.hints.map(h => ({ ...h })) : []
        };

        // 1. Upload EN combined audio and hint audios to Cloud Storage
        if (target === 'en' || target === 'both') {
          const kEn = `improv_item_${item.id}_${effectiveVoiceEn}_${effectiveVoiceVi}_EN_ONLY`;
          const cachedEn = await audioPlayer.getCachedAudioAsync(kEn);
          if (cachedEn) {
            try {
              const gcsUrlEn = await uploadImprovBase64AudioToGcs({
                base64Audio: cachedEn,
                pkgId: activePackage.id,
                id: item.id,
                lang: 'en',
                isHint: false
              });
              updatedItem.audioUrl = gcsUrlEn;
              hasCloudUpdates = true;
            } catch (cloudErr) {
              console.warn(`[GCS Single Item Sync] Failed item EN ${item.id}:`, cloudErr);
            }
          }

          if (updatedItem.hints) {
            for (const h of updatedItem.hints) {
              const hKeyEn = `improv_hint_${h.id}_${effectiveVoiceEn}_en`;
              const hCachedEn = await audioPlayer.getCachedAudioAsync(hKeyEn);
              if (hCachedEn) {
                try {
                  const gcsHintUrlEn = await uploadImprovBase64AudioToGcs({
                    base64Audio: hCachedEn,
                    pkgId: activePackage.id,
                    id: h.id,
                    lang: 'en',
                    isHint: true
                  });
                  h.audioUrl = gcsHintUrlEn;
                  hasCloudUpdates = true;
                } catch (hintErr) {
                  console.warn(`[GCS Single Item Sync] Failed hint EN ${h.id}:`, hintErr);
                }
              }
            }
          }
        }

        // 2. Upload VI combined audio and hint audios to Cloud Storage
        if (target === 'vi' || target === 'both') {
          const kVi = `improv_item_${item.id}_${effectiveVoiceEn}_${effectiveVoiceVi}_VI_ONLY`;
          const cachedVi = await audioPlayer.getCachedAudioAsync(kVi);
          if (cachedVi) {
            try {
              const gcsUrlVi = await uploadImprovBase64AudioToGcs({
                base64Audio: cachedVi,
                pkgId: activePackage.id,
                id: item.id,
                lang: 'vi',
                isHint: false
              });
              updatedItem.audioUrlVi = gcsUrlVi;
              hasCloudUpdates = true;
            } catch (cloudErr) {
              console.warn(`[GCS Single Item Sync] Failed item VI ${item.id}:`, cloudErr);
            }
          }

          if (updatedItem.hints) {
            for (const h of updatedItem.hints) {
              const hKeyVi = `improv_hint_${h.id}_${effectiveVoiceVi}_vi`;
              const hCachedVi = await audioPlayer.getCachedAudioAsync(hKeyVi);
              if (hCachedVi) {
                try {
                  const gcsHintUrlVi = await uploadImprovBase64AudioToGcs({
                    base64Audio: hCachedVi,
                    pkgId: activePackage.id,
                    id: h.id,
                    lang: 'vi',
                    isHint: true
                  });
                  h.audioUrlVi = gcsHintUrlVi;
                  hasCloudUpdates = true;
                } catch (hintErr) {
                  console.warn(`[GCS Single Item Sync] Failed hint VI ${h.id}:`, hintErr);
                }
              }
            }
          }
        }

        if (hasCloudUpdates) {
          const updatedSessions = activePackage.sessions.map(s => {
            if (s.sessionNumber !== updatedItem.sessionNumber) return s;
            return {
              ...s,
              items: s.items.map(it => it.id === updatedItem.id ? updatedItem : it)
            };
          });
          const updatedPkg: ImprovPackage = {
            ...activePackage,
            sessions: updatedSessions,
            updatedAt: new Date().toISOString()
          };
          await saveImprovPackage(updatedPkg);
          setPackages(prev => prev.map(p => p.id === updatedPkg.id ? updatedPkg : p));
        }
      }

      // Trigger small confetti
      confetti({ particleCount: 20, spread: 40, origin: { y: 0.8 } });
    } catch (err: any) {
      alert(`Lỗi tạo audio: ${err?.message || 'Không thể tạo âm thanh cho item này'}`);
    } finally {
      setSynthesizingItemIds(prev => ({ ...prev, [item.id]: false }));
    }
  };

  // Synthesize/regenerate audio specifically for a single hint
  const handleSynthesizeSingleHint = async (
    item: ImprovItem,
    hint: ImprovHint,
    lang: 'en' | 'vi',
    voiceOverride?: string
  ) => {
    if (!activePackage) return;
    const hintKey = `${hint.id}_${lang}`;
    setSynthesizingHintIds(prev => ({ ...prev, [hintKey]: true }));
    try {
      const effectiveVoice = voiceOverride || (lang === 'vi' ? (itemVoiceVi[item.id] || currentVoiceVi) : (itemVoiceEn[item.id] || currentVoiceEn));
      const base64 = await synthesizeSingleHintAudio(hint, lang, effectiveVoice, true);

      let gcsUrl = '';
      try {
        gcsUrl = await uploadImprovBase64AudioToGcs({
          base64Audio: base64,
          pkgId: activePackage.id,
          id: hint.id,
          lang: lang,
          isHint: true
        });
      } catch (uploadErr) {
        console.warn(`[GCS Hint Sync] Failed upload for hint ${hint.id} (${lang}):`, uploadErr);
      }

      const updatedSessions = activePackage.sessions.map(s => {
        if (s.sessionNumber !== item.sessionNumber) return s;
        return {
          ...s,
          items: s.items.map(it => {
            if (it.id !== item.id) return it;
            return {
              ...it,
              hints: (it.hints || []).map(h => {
                if (h.id !== hint.id) return h;
                return {
                  ...h,
                  ...(lang === 'en' 
                    ? { audioUrl: gcsUrl || h.audioUrl } 
                    : { audioUrlVi: gcsUrl || h.audioUrlVi })
                };
              })
            };
          })
        };
      });

      const updatedPkg: ImprovPackage = {
        ...activePackage,
        sessions: updatedSessions,
        updatedAt: new Date().toISOString()
      };
      await saveImprovPackage(updatedPkg);
      setPackages(prev => prev.map(p => p.id === updatedPkg.id ? updatedPkg : p));
      confetti({ particleCount: 15, spread: 30, origin: { y: 0.8 } });
    } catch (err: any) {
      alert(`Lỗi tạo audio gợi ý: ${err?.message || 'Không thể tạo âm thanh'}`);
    } finally {
      setSynthesizingHintIds(prev => ({ ...prev, [hintKey]: false }));
    }
  };

  // --------------------------------------------------------------------------
  // 3. Item Management CRUD Helpers (Thêm, Xóa, Sửa)
  // --------------------------------------------------------------------------

  const handleOpenAddItemModal = (sessionNum?: number) => {
    const targetSessionNum = sessionNum || (activeSessionTab === 'all' ? 1 : activeSessionTab);
    const targetSession = activePackage?.sessions.find(s => s.sessionNumber === targetSessionNum);
    const defaultHc = targetSession?.hcTotal || 2;
    const defaultTypes = targetSession?.hintTypes || ['Danh từ · Keyword', 'Động từ · Ending'];

    const initialHints: ImprovHint[] = Array.from({ length: defaultHc }, (_, idx) => ({
      id: `new_h_${Date.now()}_${idx + 1}`,
      text: '',
      translation: '',
      typeFunction: defaultTypes[idx] || (idx === 0 ? 'Danh từ · Keyword' : idx === defaultHc - 1 ? 'Động từ · Ending' : 'Từ nối · Logic word'),
      itemIndex: idx + 1
    }));

    const nextItemNumber = (targetSession?.items.length || 0) + 1;

    setNewItem({
      id: `item_s${targetSessionNum}_i${nextItemNumber}_${Date.now()}`,
      itemNumber: nextItemNumber,
      sessionNumber: targetSessionNum,
      hcTotal: defaultHc,
      hints: initialHints,
      createdAt: new Date().toISOString()
    });
    setIsAddItemModalOpen(true);
  };

  const handleSaveNewItem = async (alsoSynthesize: boolean = false) => {
    if (!newItem || !activePackage) return;
    const hasEmptyText = newItem.hints.some(h => !h.text.trim());
    if (hasEmptyText) {
      alert('Vui lòng điền nội dung gợi ý (text) cho tất cả các hint.');
      return;
    }

    try {
      const updatedPkg = await addOrUpdateImprovItem(activePackage.id, newItem.sessionNumber, newItem);
      if (updatedPkg) {
        setPackages(prev => prev.map(p => p.id === updatedPkg.id ? updatedPkg : p));
      }
      const createdItem = newItem;
      setIsAddItemModalOpen(false);
      setNewItem(null);

      if (alsoSynthesize) {
        handleSynthesizeSingleItem(createdItem, 'both');
      } else {
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
      }
    } catch (err: any) {
      alert(`Lỗi khi thêm câu mới: ${err?.message || 'Không thể lưu câu'}`);
    }
  };

  const handleConfirmDeleteItem = async () => {
    if (!itemToDelete || !activePackage) return;
    try {
      const updatedPkg = await deleteImprovItem(activePackage.id, itemToDelete.sessionNumber, itemToDelete.itemId);
      if (updatedPkg) {
        setPackages(prev => prev.map(p => p.id === updatedPkg.id ? updatedPkg : p));
      }
      setItemToDelete(null);
    } catch (err: any) {
      alert(`Lỗi khi xóa câu: ${err?.message || 'Không thể xóa câu'}`);
    }
  };

  const handleSaveEditedItem = async (alsoSynthesize: boolean = false) => {
    if (!editingItem || !activePackage) return;
    const hasEmptyText = editingItem.hints.some(h => !h.text.trim());
    if (hasEmptyText) {
      alert('Vui lòng không để trống nội dung hint.');
      return;
    }

    try {
      const updatedPkg = await addOrUpdateImprovItem(activePackage.id, editingItem.sessionNumber, editingItem);
      if (updatedPkg) {
        setPackages(prev => prev.map(p => p.id === updatedPkg.id ? updatedPkg : p));
      }
      const itemToSynthesize = editingItem;
      setEditingItem(null);

      if (alsoSynthesize) {
        handleSynthesizeSingleItem(itemToSynthesize, 'both');
      } else {
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
      }
    } catch (err: any) {
      alert(`Lỗi khi lưu câu đã sửa: ${err?.message || 'Không thể lưu'}`);
    }
  };

  // --------------------------------------------------------------------------
  // Bulk Selection Operations (Thao tác hàng loạt)
  // --------------------------------------------------------------------------
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isBulkOperating, setIsBulkOperating] = useState<boolean>(false);

  // Toggle selection for a single item
  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Select / Deselect all currently filtered items
  const handleToggleSelectAllFiltered = () => {
    const visibleIds = filteredItems.map(it => it.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedItemIds.includes(id));
    if (allSelected) {
      setSelectedItemIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      const set = new Set([...selectedItemIds, ...visibleIds]);
      setSelectedItemIds(Array.from(set));
    }
  };

  // Bulk synthesize audio
  const handleBulkSynthesize = async (target: 'en' | 'vi' | 'both') => {
    if (selectedItemIds.length === 0 || !activePackage) return;
    setIsBulkOperating(true);
    try {
      const itemsToProcess = filteredItems.filter(it => selectedItemIds.includes(it.id));
      for (const item of itemsToProcess) {
        setSynthesizingItemIds(prev => ({ ...prev, [item.id]: true }));
        try {
          if (target === 'en' || target === 'both') {
            await synthesizeItemCombinedAudio(item, currentVoiceEn, currentVoiceVi, 'EN_ONLY', true);
          }
          if (target === 'vi' || target === 'both') {
            await synthesizeItemCombinedAudio(item, currentVoiceEn, currentVoiceVi, 'VI_ONLY', true);
          }
        } finally {
          setSynthesizingItemIds(prev => ({ ...prev, [item.id]: false }));
        }
      }
      confetti({ particleCount: 50, spread: 60 });
    } catch (err: any) {
      alert(`Lỗi khi tạo audio hàng loạt: ${err?.message || 'Không thể tạo âm thanh'}`);
    } finally {
      setIsBulkOperating(false);
    }
  };

  // Bulk delete items
  const handleBulkDelete = async () => {
    if (selectedItemIds.length === 0 || !activePackage) return;
    const confirmMsg = `Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedItemIds.length} câu đã chọn khỏi Package không?`;
    if (!window.confirm(confirmMsg)) return;

    setIsBulkOperating(true);
    try {
      const selectedSet = new Set(selectedItemIds);
      const updatedSessions = activePackage.sessions.map(s => {
        const remaining = s.items.filter(it => !selectedSet.has(it.id));
        return {
          ...s,
          items: remaining.map((it, idx) => ({ ...it, itemNumber: idx + 1 }))
        };
      }).filter(s => s.items.length > 0);

      const totalItems = updatedSessions.reduce((acc, s) => acc + s.items.length, 0);
      const updatedPkg: ImprovPackage = {
        ...activePackage,
        sessions: updatedSessions,
        sessionsCount: updatedSessions.length,
        totalItems,
        updatedAt: new Date().toISOString()
      };

      await saveImprovPackage(updatedPkg);
      setPackages(prev => prev.map(p => p.id === updatedPkg.id ? updatedPkg : p));
      setSelectedItemIds([]);
      confetti({ particleCount: 40, spread: 50 });
    } catch (err: any) {
      alert(`Lỗi khi xóa hàng loạt: ${err?.message || 'Không thể xóa các câu đã chọn'}`);
    } finally {
      setIsBulkOperating(false);
    }
  };

  // --------------------------------------------------------------------------
  // 4. Package-Wide Batch Audio Generator (EN, VI, or BOTH)
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

    addLog(`Khởi động bộ tổng hợp âm thanh (${batchWorkersCount} workers, Target: ${batchTargetLang.toUpperCase()}, EN: ${batchVoiceEn}, VI: ${batchVoiceVi})...`);

    try {
      const langModeToUse = batchTargetLang === 'vi' ? 'VI_ONLY' : batchTargetLang === 'both' ? 'EN_THEN_VI' : 'EN_ONLY';
      await improvTts.preparePackageAudio(
        activePackage,
        {
          voiceEn: batchVoiceEn,
          voiceVi: batchVoiceVi,
          langMode: langModeToUse,
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

      // Mark audio as prepared in the package items or package metadata:
      const updatedSessions = activePackage.sessions.map(s => ({
        ...s,
        items: s.items.map(it => ({
          ...it,
          audioUrl: it.audioUrl || 'cached'
        }))
      }));
      const updatedPkg: ImprovPackage = { 
        ...activePackage, 
        sessions: updatedSessions, 
        updatedAt: new Date().toISOString() 
      };
      await saveImprovPackage(updatedPkg);
      setActivePackageId(updatedPkg.id);
      setPackages(prev => prev.map(p => p.id === updatedPkg.id ? updatedPkg : p));

      addLog('Đã hoàn tất tạo toàn bộ âm thanh cho package!');
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });

      addLog('Đang đồng bộ audio lên Cloud Storage bucket gs://chunks-voicecloning-genshai.firebasestorage.app...');
      try {
        const syncRes = await syncImprovPackageCachedAudioToCloud(updatedPkg, {
          voiceEn: batchVoiceEn,
          voiceVi: batchVoiceVi,
          onProgress: (_c, _t, status) => addLog(`[Cloud Sync] ${status}`)
        });
        addLog(`Đồng bộ Cloud Storage thành công: ${syncRes.uploadedItemsEn} items EN, ${syncRes.uploadedItemsVi} items VI, ${syncRes.uploadedHints} hints.`);
        // Refresh packages state
        const latestPackages = await getAllImprovPackages();
        setPackages(latestPackages);
      } catch (syncErr: any) {
        addLog(`Lưu ý: Không thể tự động đồng bộ lên Cloud Storage: ${syncErr?.message || syncErr}`);
      }
    } catch (err: any) {
      addLog(`Lỗi batch audio: ${err?.message || 'Không xác định'}`);
    } finally {
      setIsBatchRunning(false);
    }
  };

  const handleSyncActivePackageToCloud = async () => {
    if (!activePackage) return;
    setIsSyncingToCloud(true);
    setCloudSyncProgress('Đang chuẩn bị đồng bộ...');
    try {
      const res = await syncImprovPackageCachedAudioToCloud(activePackage, {
        voiceEn: currentVoiceEn,
        voiceVi: currentVoiceVi,
        onProgress: (cur, tot, status) => {
          setCloudSyncProgress(`[${cur}/${tot}] ${status}`);
        }
      });
      // Reload packages
      const updatedPackages = await getAllImprovPackages();
      setPackages(updatedPackages);
      const refreshed = updatedPackages.find(p => p.id === activePackage.id);
      if (refreshed) setActivePackageId(refreshed.id);
      confetti({ particleCount: 50, spread: 60 });
      alert(`🎉 Đã đồng bộ thành công lên Cloud Storage bucket gs://chunks-voicecloning-genshai.firebasestorage.app!\n- Items EN: ${res.uploadedItemsEn}\n- Items VI: ${res.uploadedItemsVi}\n- Hints: ${res.uploadedHints}`);
    } catch (err: any) {
      console.error('Improv cloud sync failed:', err);
      alert('Lỗi đồng bộ lên Cloud Storage: ' + (err?.message || String(err)));
    } finally {
      setIsSyncingToCloud(false);
      setCloudSyncProgress(null);
    }
  };

  // --------------------------------------------------------------------------
  // 5. AI Package Generator Trigger & LLM Integration
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
      setGenProgress({ percent: 25, current: 10, total: genTotalItems, message: `Đang gửi yêu cầu tới ${genProvider === 'DEEPSEEK' ? 'DeepSeek Official API' : genProvider === 'GOOGLE_GENAI' ? 'Google Gemini (GenAI)' : 'LLM Engine'}...` });

      // Compile master prompt variables
      const compiledPrompt = genMasterPrompt
        .replace(/\{\{difficulty\}\}/g, genDifficulty)
        .replace(/\{\{relevance\}\}/g, genRelevance)
        .replace(/\{\{vocabList\}\}/g, seedVocabs.slice(0, 30).map(v => `${v.english} (${v.vietnamese})`).join(', '))
        .replace(/\{\{itemCount\}\}/g, String(genTotalItems));

      const providerLabel = genProvider === 'DEEPSEEK' 
        ? 'DeepSeek Official API' 
        : genProvider === 'GOOGLE_GENAI' 
          ? 'Google Gemini API' 
          : 'Custom Endpoint';

      addGenLog('info', `Gửi yêu cầu tới ${providerLabel} (Model: ${genModel})...`);

      let rawJsonContent = '';

      try {
        rawJsonContent = await executeLlmGeneration(
          {
            provider: genProvider,
            endpoint: genEndpoint,
            apiKey: genApiKey,
            model: genModel,
            masterPrompt: compiledPrompt,
            temperature: 0.7,
            maxTokens: 4000
          },
          compiledPrompt,
          `Generate an Improv Package with Title "${genTitle}", Total Items: ${genTotalItems}, Sessions: ${JSON.stringify(genSessionConfigs)}, Seed Vocabularies: ${JSON.stringify(seedVocabs.slice(0, 25))}. Output ONLY JSON.`,
          abortController.signal
        );
        addGenLog('success', 'Nhận phản hồi thành công từ LLM! Đang bóc tách cú pháp JSON...');
      } catch (fetchErr: any) {
        if (abortController.signal.aborted) {
          addGenLog('warning', 'Quá trình sinh dữ liệu đã bị người dùng hủy.');
          return;
        }
        addGenLog('warning', `Không kết nối được LLM (${fetchErr?.message}). Đang kích hoạt bộ sinh dữ liệu ngoại tuyến chuẩn xác...`);
        
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
      setViewMode('table');

      setGenProgress({ percent: 100, current: totalItemsCount, total: totalItemsCount, message: 'Hoàn tất sinh Package thành công!' });
      addGenLog('success', `Đã lưu Package "${createdPkg.title}" với ${totalItemsCount} items!`);

      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });

      setTimeout(() => {
        setIsGeneratorOpen(false);
      }, 600);


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
  // 6. Excel Import & Export Operations
  // --------------------------------------------------------------------------

  const handleFileDrop = async (file: File) => {
    setImportFile(file);
    setIsParsingImport(true);
    try {
      const fileNameLower = file.name.toLowerCase();
      if (fileNameLower.endsWith('.json')) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!parsed || !Array.isArray(parsed.sessions)) {
          throw new Error('File JSON không hợp lệ. Phải chứa cấu trúc ImprovPackage với trường "sessions" là mảng.');
        }
        const now = new Date().toISOString();
        const improvPkg: ImprovPackage = {
          id: parsed.id || `pkg_improv_${Date.now()}`,
          title: parsed.title || file.name.replace(/\.[^/.]+$/, ""),
          description: parsed.description || 'Imported Improv JSON Package',
          sessionsCount: parsed.sessions.length,
          totalItems: parsed.totalItems || parsed.sessions.reduce((acc: number, s: any) => acc + (s.items?.length || 0), 0),
          sessions: parsed.sessions,
          sourceCourseLevel: parsed.sourceCourseLevel,
          sourceLessonIds: parsed.sourceLessonIds,
          createdAt: parsed.createdAt || now,
          updatedAt: now
        };
        setImportParsedPackage(improvPkg);
      } else {
        const parsed = await parseImprovExcelFile(file);
        setImportParsedPackage(parsed);
      }
    } catch (err: any) {
      alert(`Lỗi đọc file: ${err?.message || 'Không thể xử lý file này'}`);
      setImportFile(null);
      setImportParsedPackage(null);
    } finally {
      setIsParsingImport(false);
    }
  };

  const handleQuickLoadDefaultPresets = async () => {
    try {
      await saveImprovPackage(IMPROV_SET_01);
      await saveImprovPackage(IMPROV_SET_02);
      setPackages(prev => {
        const remaining = prev.filter(p => p.id !== IMPROV_SET_01.id && p.id !== IMPROV_SET_02.id);
        return [IMPROV_SET_01, IMPROV_SET_02, ...remaining];
      });
      setActivePackageId(IMPROV_SET_01.id);
      setIsImportModalOpen(false);
      setImportFile(null);
      setImportParsedPackage(null);
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      alert(`Lỗi khi nạp presets: ${err?.message || 'Không thể lưu Set 01 & Set 02'}`);
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
    try {
      const deletedIdsStr = typeof window !== 'undefined' ? localStorage.getItem('chunks_improv_deleted_package_ids') : null;
      const deletedIds: string[] = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];
      if (!deletedIds.includes(activePackage.id)) {
        deletedIds.push(activePackage.id);
        localStorage.setItem('chunks_improv_deleted_package_ids', JSON.stringify(deletedIds));
      }

      await deleteImprovPackage(activePackage.id);
      const remaining = packages.filter(p => p.id !== activePackage.id);
      setPackages(remaining);

      if (remaining.length > 0) {
        setActivePackageId(remaining[0].id);
      } else {
        const defaultSeeds = createDefaultSeedPackages().filter(d => !deletedIds.includes(d.id));
        if (defaultSeeds.length > 0) {
          setPackages(defaultSeeds);
          setActivePackageId(defaultSeeds[0].id);
          await saveImprovPackage(defaultSeeds[0]);
        } else {
          const newPkg: ImprovPackage = {
            id: `pkg_custom_${Date.now()}`,
            title: 'Custom Improv Cohort',
            description: 'Bộ luyện tập phản xạ tùy chỉnh mới',
            sourceCourseLevel: 'LEVEL_B_ERES',
            sourceLessonIds: ['level_b_eres_day_1'],
            sessionsCount: 1,
            totalItems: 0,
            sessions: [
              {
                sessionNumber: 1,
                title: 'Session 1 (2 Hints)',
                hcTotal: 2,
                hintTypes: ['Keyword', 'Ending'],
                items: []
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setPackages([newPkg]);
          setActivePackageId(newPkg.id);
          await saveImprovPackage(newPkg);
        }
      }
      setIsDeleteModalOpen(false);
      setDeleteSuccessToast("Đã xóa package thành công!");
      setTimeout(() => {
        setDeleteSuccessToast(null);
      }, 3000);
    } catch (err: any) {
      console.error('Lỗi khi xóa package:', err);
    }
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
    <div className={`flex flex-col h-full bg-[#FAFAFA] text-[#0A0A0A] font-sans antialiased overflow-y-auto ${isDarkMode ? 'dark' : ''}`}>
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
                    <option key={p.id} value={p.id} className="bg-white text-zinc-900">
                      {p.title} ({p.sessionsCount} Sessions - {p.totalItems} Items)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right: Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl border border-[#E8E8EC] bg-white text-zinc-600 hover:text-zinc-900 transition-all cursor-pointer shadow-2xs"
              title={isFullscreen ? 'Thoát toàn màn hình' : 'Bật toàn màn hình (Fullscreen)'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Dark Mode Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl border border-[#E8E8EC] bg-white text-zinc-600 hover:text-zinc-900 transition-all cursor-pointer shadow-2xs"
              title={isDarkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>

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
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E8E8EC] hover:border-zinc-300 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 bg-white active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-500" />
              <span>Import Excel</span>
            </button>

            {/* Export Excel */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E8E8EC] hover:border-zinc-300 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 bg-white active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span>Export Excel</span>
            </button>

            {/* Delete Package */}
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-2 rounded-xl border border-[#E8E8EC] hover:border-red-200 hover:bg-red-50 text-zinc-400 hover:text-red-600 bg-white active:scale-95 transition-all cursor-pointer shadow-2xs"
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
            {/* Session Dropdown Selector */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-[#DC2626]" />
                <span className="text-[11px] font-mono uppercase font-bold text-zinc-400">Session:</span>
                <select
                  value={activeSessionTab}
                  onChange={(e) => {
                    const val = e.target.value;
                    setActiveSessionTab(val === 'all' ? 'all' : Number(val));
                  }}
                  className="bg-transparent text-xs font-bold text-zinc-900 border-0 focus:ring-0 cursor-pointer pr-4"
                >
                  <option value="all" className="bg-white text-zinc-900">
                    Tất Cả Sessions ({activePackage?.totalItems || 0} Items)
                  </option>
                  {(activePackage?.sessions || []).map(s => (
                    <option key={s.sessionNumber} value={s.sessionNumber} className="bg-white text-zinc-900">
                      Session {s.sessionNumber} ({s.hcTotal} Hints - {s.items.length} Items)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Controls: View Switcher, Add Item, Subtitle Toggle & Batch Audio Trigger */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* View Mode Toggle */}
              <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-[#DC2626] shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                  title="Chế độ xem bảng danh sách chi tiết"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Dạng Bảng</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-white text-[#DC2626] shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                  title="Chế độ xem dạng thẻ dòng chảy"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Dạng Thẻ</span>
                </button>
              </div>

              {/* Add Item Button */}
              <button
                onClick={() => handleOpenAddItemModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#DC2626] border border-red-200 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                title="Thêm câu hỏi/bài tập mới vào session"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm Câu</span>
              </button>

              {/* Subtitle Toggle */}
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

              {/* Sync Cache to Cloud Storage Bucket */}
              <button
                type="button"
                disabled={isSyncingToCloud || isBatchRunning || !activePackage}
                onClick={handleSyncActivePackageToCloud}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                title="Tải toàn bộ audio Improv đã có trong cache trình duyệt lên Cloud Storage bucket gs://chunks-voicecloning-genshai.firebasestorage.app để dùng vĩnh viễn"
              >
                <CloudUpload className={`w-3.5 h-3.5 ${isSyncingToCloud ? 'animate-bounce' : ''}`} />
                <span>{isSyncingToCloud ? (cloudSyncProgress || 'Đang sync lên Cloud...') : 'Sync Cache ➔ Cloud Bucket'}</span>
              </button>

              {/* Batch Audio Trigger */}
              <button
                onClick={() => setIsBatchAudioModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Tạo Batch Audio Package</span>
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
        {/* BULK ACTIONS BAR (Thanh thao tác hàng loạt khi có mục được chọn) */}
        {/* ================================================================== */}
        {selectedItemIds.length > 0 && (
          <div className="sticky top-20 z-20 bg-zinc-900 text-white rounded-2xl p-4 shadow-xl border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
              <span className="text-xs font-mono font-bold">
                Đã chọn <span className="text-amber-300 font-black">{selectedItemIds.length}</span> / {filteredItems.length} items
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleBulkSynthesize('en')}
                disabled={isBulkOperating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl border border-zinc-700 transition-all cursor-pointer disabled:opacity-50"
                title="Tạo lại âm thanh tiếng Anh cho các câu đã chọn"
              >
                <Play className="w-3 h-3 text-[#DC2626] fill-current" />
                <span>Tạo lại Audio EN</span>
              </button>

              <button
                onClick={() => handleBulkSynthesize('vi')}
                disabled={isBulkOperating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl border border-zinc-700 transition-all cursor-pointer disabled:opacity-50"
                title="Tạo lại âm thanh tiếng Việt cho các câu đã chọn"
              >
                <Play className="w-3 h-3 text-blue-400 fill-current" />
                <span>Tạo lại Audio VI</span>
              </button>

              <button
                onClick={() => handleBulkSynthesize('both')}
                disabled={isBulkOperating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                title="Tạo lại cả âm thanh tiếng Anh và tiếng Việt"
              >
                {isBulkOperating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
                <span>Tạo lại Cả Hai</span>
              </button>

              <button
                type="button"
                disabled={isSyncingToCloud || isBulkOperating || !activePackage}
                onClick={handleSyncActivePackageToCloud}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                title="Tải toàn bộ audio Improv đã có trong cache trình duyệt lên Cloud Storage bucket gs://chunks-voicecloning-genshai.firebasestorage.app để dùng vĩnh viễn"
              >
                <CloudUpload className={`w-3.5 h-3.5 ${isSyncingToCloud ? 'animate-bounce' : ''}`} />
                <span>{isSyncingToCloud ? 'Đang sync...' : 'Sync Cloud Bucket'}</span>
              </button>

              <button
                onClick={handleBulkDelete}
                disabled={isBulkOperating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-red-950/80 hover:text-red-400 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-700 hover:border-red-800 transition-all cursor-pointer disabled:opacity-50"
                title="Xóa các câu đã chọn"
              >
                <Trash2 className="w-3 h-3" />
                <span>Xóa các câu đã chọn</span>
              </button>

              <button
                onClick={() => setSelectedItemIds([])}
                className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* 3. ITEMS REVIEW & AUDITION (TABLE MODE VS CARDS MODE) */}
        {/* ================================================================== */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8E8EC] p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-zinc-700">Không tìm thấy Item nào</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Không có gợi ý nào khớp với bộ lọc tìm kiếm. Hãy thử đổi từ khóa hoặc chọn Session khác.
            </p>
            <button
              onClick={() => handleOpenAddItemModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#DC2626] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#B91C1C] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm Câu Mới Vào Session</span>
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* ================================================================ */
          /* TABLE VIEW MODE (Condensed, High-Density, Clear Columns) */
          /* ================================================================ */
          <div className="bg-white rounded-2xl border border-[#E8E8EC] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-100/80 text-zinc-600 font-mono text-[10px] uppercase border-b border-zinc-200">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredItems.length > 0 && filteredItems.every(it => selectedItemIds.includes(it.id))}
                        onChange={handleToggleSelectAllFiltered}
                        className="rounded text-[#DC2626] focus:ring-[#DC2626] cursor-pointer"
                        title="Chọn tất cả / Bỏ chọn tất cả"
                      />
                    </th>
                    <th className="p-3.5 w-16 text-center">STT</th>
                    <th className="p-3.5 w-28">Session</th>
                    <th className="p-3.5 min-w-[320px]">Các Gợi Ý & Từ Loại (Clues Stream)</th>
                    <th className="p-3.5 w-40 text-center">Trạng Thái Audio</th>
                    <th className="p-3.5 w-64 text-right">Thao Tác Quản Lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredItems.map((item) => {
                    const isPlayingThis = playingItemId === item.id;
                    const isSynthesizing = synthesizingItemIds[item.id] || false;
                    const isSelected = selectedItemIds.includes(item.id);
                    const isAudioEnReady = Boolean(
                      (item.audioUrl && (item.audioUrl.startsWith('http') || item.audioUrl === 'cached')) ||
                      audioPlayer.getCachedAudio(`improv_item_${item.id}_${currentVoiceEn}_${currentVoiceVi}_EN_ONLY`, currentVoiceEn) ||
                      audioPlayer.getCachedAudio(`improv_item_${item.id}_${currentVoiceEn}_${currentVoiceVi}_EN_THEN_VI`, currentVoiceEn) ||
                      (item.hints && item.hints.length > 0 && item.hints.every(h => {
                        const t = h.text?.trim();
                        return !t || Boolean((h.audioUrl && h.audioUrl.startsWith('http')) || audioPlayer.getCachedAudio(t, currentVoiceEn) || audioPlayer.isChunkCached(t, currentVoiceEn));
                      }))
                    );
                    const isAudioViReady = Boolean(
                      (item.audioUrlVi && item.audioUrlVi.startsWith('http')) ||
                      item.audioUrl === 'cached' ||
                      audioPlayer.getCachedAudio(`improv_item_${item.id}_${currentVoiceEn}_${currentVoiceVi}_VI_ONLY`, currentVoiceVi) ||
                      audioPlayer.getCachedAudio(`improv_item_${item.id}_${currentVoiceEn}_${currentVoiceVi}_EN_THEN_VI`, currentVoiceVi) ||
                      (item.hints && item.hints.length > 0 && item.hints.every(h => {
                        const t = (h.translation || '').trim();
                        return !t || Boolean((h.audioUrlVi && h.audioUrlVi.startsWith('http')) || audioPlayer.getCachedAudio(t, currentVoiceVi) || audioPlayer.isChunkCached(t, currentVoiceVi));
                      }))
                    );

                    return (
                      <React.Fragment key={item.id}>
                        <tr 
                          className={`hover:bg-zinc-50/80 transition-colors ${
                            isPlayingThis ? 'bg-red-50/40' : isSelected ? 'bg-red-50/20' : ''
                          }`}
                        >
                          {/* Checkbox Column */}
                          <td className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectItem(item.id)}
                              className="rounded text-[#DC2626] focus:ring-[#DC2626] cursor-pointer"
                            />
                          </td>

                          {/* STT Column */}
                          <td className="p-3.5 text-center font-mono font-bold text-zinc-700">
                            <span className="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-zinc-100 border border-zinc-200 text-xs">
                              #{item.itemNumber}
                            </span>
                          </td>

                          {/* Session Badge */}
                          <td className="p-3.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-zinc-900">
                                Session {item.sessionNumber}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-400">
                                {item.hints.length} hints
                              </span>
                            </div>
                          </td>

                          {/* Hints Stream Column */}
                          <td className="p-3.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {item.hints.map((hint, hIdx) => {
                                const badge = getHintTypeBadgeClasses(hint.typeFunction);
                                const isHintActive = isPlayingThis && playingHintIndex === hint.itemIndex;
                                const isHintEnLoading = synthesizingHintIds[`${hint.id}_en`];
                                const isHintViLoading = synthesizingHintIds[`${hint.id}_vi`];
                                const hasHintEnGcs = Boolean(hint.audioUrl && hint.audioUrl.startsWith('http'));
                                const hasHintViGcs = Boolean(hint.audioUrlVi && hint.audioUrlVi.startsWith('http'));

                                return (
                                  <React.Fragment key={hint.id || hIdx}>
                                    <div
                                      className={`p-2 rounded-xl border transition-all ${
                                        isHintActive
                                          ? 'bg-red-50 border-[#DC2626] ring-2 ring-red-500/20'
                                          : 'bg-zinc-50/80 border-zinc-200/80'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1 mb-1">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${badge.bg} ${badge.text} ${badge.border}`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                          <span>{badge.label}</span>
                                        </span>
                                      </div>
                                      <div className="font-bold text-zinc-900 text-xs leading-snug">
                                        {hint.text}
                                      </div>
                                      {showVietnamese && hint.translation && (
                                        <div className="text-[11px] text-zinc-700 font-medium mt-1 leading-tight">
                                          {hint.translation}
                                        </div>
                                      )}

                                      {/* Single Hint Audio Controls */}
                                      <div className="flex items-center gap-1 mt-1.5 pt-1 border-t border-zinc-200/60">
                                        <button
                                          type="button"
                                          disabled={isHintEnLoading}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSynthesizeSingleHint(item, hint, 'en');
                                          }}
                                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-0.5 ${
                                            hasHintEnGcs
                                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                              : 'bg-zinc-200/80 text-zinc-700 hover:bg-red-100 hover:text-red-700'
                                          }`}
                                          title={`Tạo audio EN cho gợi ý này (${hasHintEnGcs ? 'Đã có Cloud GCS' : 'Chưa có'})`}
                                        >
                                          {isHintEnLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Zap className="w-2.5 h-2.5" />}
                                          <span>EN{hasHintEnGcs ? ' ✓' : ''}</span>
                                        </button>

                                        <button
                                          type="button"
                                          disabled={isHintViLoading}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSynthesizeSingleHint(item, hint, 'vi');
                                          }}
                                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-0.5 ${
                                            hasHintViGcs
                                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                              : 'bg-zinc-200/80 text-zinc-700 hover:bg-blue-100 hover:text-blue-700'
                                          }`}
                                          title={`Tạo audio VI cho gợi ý này (${hasHintViGcs ? 'Đã có Cloud GCS' : 'Chưa có'})`}
                                        >
                                          {isHintViLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Zap className="w-2.5 h-2.5" />}
                                          <span>VI{hasHintViGcs ? ' ✓' : ''}</span>
                                        </button>
                                      </div>
                                    </div>

                                    {hIdx < item.hints.length - 1 && (
                                      <span className="text-[#DC2626] font-black text-xs mx-1 select-none">➔</span>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </td>

                          {/* Audio Status Column */}
                          <td className="p-3.5 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                isAudioEnReady
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isAudioEnReady ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                                <span>EN {isAudioEnReady ? (item.audioUrl && item.audioUrl.startsWith('http') ? 'GCS' : '✓') : '—'}</span>
                              </span>

                              <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                isAudioViReady
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isAudioViReady ? 'bg-blue-500' : 'bg-zinc-400'}`} />
                                <span>VI {isAudioViReady ? (item.audioUrlVi && item.audioUrlVi.startsWith('http') ? 'GCS' : '✓') : '—'}</span>
                              </span>
                            </div>
                          </td>

                          {/* Actions Column */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Nghe EN */}
                              <button
                                onClick={() => handlePlayItemWithPause(item, 'en')}
                                className={`p-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                  isPlayingThis && playingLang === 'en'
                                    ? 'bg-zinc-900 text-white border-zinc-900'
                                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                                }`}
                                title="Nghe tiếng Anh kèm khoảng nghỉ 1s"
                              >
                                <Play className="w-3 h-3 text-[#DC2626] fill-current" />
                                <span>EN</span>
                              </button>

                              {/* Nghe VI */}
                              <button
                                onClick={() => handlePlayItemWithPause(item, 'vi')}
                                className={`p-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                  isPlayingThis && playingLang === 'vi'
                                    ? 'bg-zinc-900 text-white border-zinc-900'
                                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                                }`}
                                title="Nghe tiếng Việt chuẩn Google TTS kèm khoảng nghỉ 1s"
                              >
                                <Play className="w-3 h-3 text-blue-600 fill-current" />
                                <span>VI</span>
                              </button>

                              {/* Tạo EN */}
                              <button
                                onClick={() => handleSynthesizeSingleItem(item, 'en')}
                                disabled={isSynthesizing}
                                className="p-1.5 px-2 rounded-lg bg-red-50 hover:bg-red-100 text-[#DC2626] border border-red-200 text-xs font-bold cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1"
                                title="Tạo âm thanh EN cho câu này (GCS Cloud)"
                              >
                                {isSynthesizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                <span>Tạo EN</span>
                              </button>

                              {/* Tạo VI */}
                              <button
                                onClick={() => handleSynthesizeSingleItem(item, 'vi')}
                                disabled={isSynthesizing}
                                className="p-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1"
                                title="Tạo âm thanh VI cho câu này (GCS Cloud)"
                              >
                                {isSynthesizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                <span>Tạo VI</span>
                              </button>

                              {/* Tạo Cả 2 */}
                              <button
                                onClick={() => handleSynthesizeSingleItem(item, 'both')}
                                disabled={isSynthesizing}
                                className="p-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1"
                                title="Tạo cả âm thanh EN và VI cho item này (GCS Cloud)"
                              >
                                {isSynthesizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                <span>Cả 2</span>
                              </button>

                              {/* Voice Model Selector Toggle */}
                              <button
                                type="button"
                                onClick={() => setExpandedItemVoiceConfig(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                className={`p-1.5 px-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                                  expandedItemVoiceConfig[item.id]
                                    ? 'bg-red-50 border-red-300 text-[#DC2626]'
                                    : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700'
                                }`}
                                title="Chọn Voice Model riêng cho câu này"
                              >
                                <Sliders className="w-3 h-3" />
                                <ChevronDown className={`w-3 h-3 transition-transform ${expandedItemVoiceConfig[item.id] ? 'rotate-180' : ''}`} />
                              </button>

                              {/* Sửa Text */}
                              <button
                                onClick={() => setEditingItem(JSON.parse(JSON.stringify(item)))}
                                className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 cursor-pointer transition-all"
                                title="Chỉnh sửa câu"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Xóa Câu */}
                              <button
                                onClick={() => setItemToDelete({
                                  sessionNumber: item.sessionNumber,
                                  itemId: item.id,
                                  itemNumber: item.itemNumber
                                })}
                                className="p-1.5 rounded-lg border border-zinc-200 hover:bg-red-50 text-zinc-400 hover:text-[#DC2626] hover:border-red-200 cursor-pointer transition-all"
                                title="Xóa câu này khỏi session"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Model & Language Selector Sub-row */}
                        {expandedItemVoiceConfig[item.id] && (
                          <tr className="bg-zinc-50/90 border-b border-zinc-200">
                            <td colSpan={6} className="p-3.5">
                              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-zinc-200/90 shadow-2xs">
                                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                                  {/* EN Voice Select */}
                                  <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase font-mono shrink-0">Model EN:</span>
                                    <select
                                      value={itemVoiceEn[item.id] || currentVoiceEn}
                                      onChange={(e) => setItemVoiceEn(prev => ({ ...prev, [item.id]: e.target.value }))}
                                      className="w-full text-xs font-semibold bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-[#DC2626] cursor-pointer"
                                    >
                                      <optgroup label="Deepgram Aura">
                                        {enVoiceOptions.filter(v => v.provider === 'DEEPGRAM_AURA').map(v => (
                                          <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                      </optgroup>
                                      <optgroup label="Google Cloud TTS (en-US)">
                                        {enVoiceOptions.filter(v => v.provider !== 'DEEPGRAM_AURA').map(v => (
                                          <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                      </optgroup>
                                    </select>
                                  </div>

                                  {/* VI Voice Select */}
                                  <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase font-mono shrink-0">Model VI:</span>
                                    <select
                                      value={itemVoiceVi[item.id] || currentVoiceVi}
                                      onChange={(e) => setItemVoiceVi(prev => ({ ...prev, [item.id]: e.target.value }))}
                                      className="w-full text-xs font-semibold bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                                    >
                                      <optgroup label="Google Neural2 & WaveNet (vi-VN)">
                                        {viVoiceOptions.filter(v => !v.id.includes('Chirp')).map(v => (
                                          <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                      </optgroup>
                                      <optgroup label="Google Chirp3-HD (vi-VN)">
                                        {viVoiceOptions.filter(v => v.id.includes('Chirp')).map(v => (
                                          <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                      </optgroup>
                                    </select>
                                  </div>
                                </div>

                                {/* Quick Generation Action Buttons */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    disabled={isSynthesizing}
                                    onClick={() => handleSynthesizeSingleItem(item, 'en')}
                                    className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                                  >
                                    {isSynthesizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                                    <span>Tạo EN</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isSynthesizing}
                                    onClick={() => handleSynthesizeSingleItem(item, 'vi')}
                                    className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                                  >
                                    {isSynthesizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                                    <span>Tạo VI</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isSynthesizing}
                                    onClick={() => handleSynthesizeSingleItem(item, 'both')}
                                    className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                                  >
                                    {isSynthesizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                    <span>Tạo Cả 2</span>
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ================================================================ */
          /* CARDS VIEW MODE (Stream Cards Preview) */
          /* ================================================================ */
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const isPlayingThis = playingItemId === item.id;
              const isSynthesizing = synthesizingItemIds[item.id] || false;
              const isSelected = selectedItemIds.includes(item.id);
              const isAudioEnReady = Boolean(
                (item.audioUrl && (item.audioUrl.startsWith('http') || item.audioUrl === 'cached')) ||
                audioPlayer.getCachedAudio(`improv_item_${item.id}_${currentVoiceEn}_${currentVoiceVi}_EN_ONLY`, currentVoiceEn) ||
                audioPlayer.getCachedAudio(`improv_item_${item.id}_${currentVoiceEn}_${currentVoiceVi}_EN_THEN_VI`, currentVoiceEn) ||
                (item.hints && item.hints.length > 0 && item.hints.every(h => {
                  const t = h.text?.trim();
                  return !t || Boolean((h.audioUrl && h.audioUrl.startsWith('http')) || audioPlayer.getCachedAudio(t, currentVoiceEn) || audioPlayer.isChunkCached(t, currentVoiceEn));
                }))
              );
              const isAudioViReady = Boolean(
                (item.audioUrlVi && item.audioUrlVi.startsWith('http')) ||
                item.audioUrl === 'cached' ||
                audioPlayer.getCachedAudio(`improv_item_${item.id}_${currentVoiceEn}_${currentVoiceVi}_VI_ONLY`, currentVoiceVi) ||
                audioPlayer.getCachedAudio(`improv_item_${item.id}_${currentVoiceEn}_${currentVoiceVi}_EN_THEN_VI`, currentVoiceVi) ||
                (item.hints && item.hints.length > 0 && item.hints.every(h => {
                  const t = (h.translation || '').trim();
                  return !t || Boolean((h.audioUrlVi && h.audioUrlVi.startsWith('http')) || audioPlayer.getCachedAudio(t, currentVoiceVi) || audioPlayer.isChunkCached(t, currentVoiceVi));
                }))
              );

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 p-4.5 shadow-2xs hover:shadow-xs ${
                    isPlayingThis 
                      ? 'border-[#DC2626] ring-2 ring-red-500/10' 
                      : isSelected
                      ? 'border-[#DC2626] bg-red-50/15'
                      : 'border-[#E8E8EC] hover:border-zinc-300'
                  }`}
                >
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    {/* Left Index, Checkbox & Session Badge */}
                    <div className="flex items-center gap-3 shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectItem(item.id)}
                        className="rounded text-[#DC2626] focus:ring-[#DC2626] cursor-pointer"
                      />

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
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-mono font-semibold ${isAudioEnReady ? 'text-emerald-600' : 'text-zinc-400'}`}>
                            EN {isAudioEnReady ? (item.audioUrl && item.audioUrl.startsWith('http') ? 'GCS' : '✓') : '—'}
                          </span>
                          <span className="text-zinc-300">•</span>
                          <span className={`text-[10px] font-mono font-semibold ${isAudioViReady ? 'text-blue-600' : 'text-zinc-400'}`}>
                            VI {isAudioViReady ? (item.audioUrlVi && item.audioUrlVi.startsWith('http') ? 'GCS' : '✓') : '—'}
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
                          const isHintEnLoading = synthesizingHintIds[`${hint.id}_en`];
                          const isHintViLoading = synthesizingHintIds[`${hint.id}_vi`];
                          const hasHintEnGcs = Boolean(hint.audioUrl && hint.audioUrl.startsWith('http'));
                          const hasHintViGcs = Boolean(hint.audioUrlVi && hint.audioUrlVi.startsWith('http'));

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
                                <div className="text-[11px] text-zinc-700 font-medium line-clamp-2 mt-auto pt-1 border-t border-zinc-200/80">
                                  {hint.translation}
                                </div>
                              )}

                              {/* Single Hint Audio Controls */}
                              <div className="flex items-center justify-between gap-1.5 mt-2 pt-1.5 border-t border-zinc-200/60">
                                <span className="text-[9px] font-mono text-zinc-400 font-semibold">Audio Hint:</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={isHintEnLoading}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSynthesizeSingleHint(item, hint, 'en');
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                                      hasHintEnGcs 
                                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                        : 'bg-zinc-200/80 text-zinc-700 hover:bg-red-100 hover:text-red-700'
                                    }`}
                                    title={`Tạo audio EN cho gợi ý này (${hasHintEnGcs ? 'Đã có Cloud GCS' : 'Chưa có'})`}
                                  >
                                    {isHintEnLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Zap className="w-2.5 h-2.5" />}
                                    <span>EN{hasHintEnGcs ? ' ✓' : ''}</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isHintViLoading}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSynthesizeSingleHint(item, hint, 'vi');
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                                      hasHintViGcs 
                                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                                        : 'bg-zinc-200/80 text-zinc-700 hover:bg-blue-100 hover:text-blue-700'
                                    }`}
                                    title={`Tạo audio VI cho gợi ý này (${hasHintViGcs ? 'Đã có Cloud GCS' : 'Chưa có'})`}
                                  >
                                    {isHintViLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Zap className="w-2.5 h-2.5" />}
                                    <span>VI{hasHintViGcs ? ' ✓' : ''}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end xl:self-center flex-wrap">
                      {/* Play EN */}
                      <button
                        onClick={() => handlePlayItemWithPause(item, 'en')}
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                          isPlayingThis && playingLang === 'en'
                            ? 'bg-zinc-900 text-white'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                        }`}
                        title="Nghe tiếng Anh kèm khoảng nghỉ 1s"
                      >
                        <Play className="w-3.5 h-3.5 text-[#DC2626] fill-current" />
                        <span>Nghe EN</span>
                      </button>

                      {/* Play VI */}
                      <button
                        onClick={() => handlePlayItemWithPause(item, 'vi')}
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                          isPlayingThis && playingLang === 'vi'
                            ? 'bg-zinc-900 text-white'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                        }`}
                        title="Nghe tiếng Việt kèm khoảng nghỉ 1s"
                      >
                        <Play className="w-3.5 h-3.5 text-blue-600 fill-current" />
                        <span>Nghe VI</span>
                      </button>

                      {/* Synthesize EN */}
                      <button
                        onClick={() => handleSynthesizeSingleItem(item, 'en')}
                        disabled={isSynthesizing}
                        className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-[#DC2626] border border-red-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        title="Tạo audio EN cho item này (GCS Cloud)"
                      >
                        {isSynthesizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                        <span>Tạo EN</span>
                      </button>

                      {/* Synthesize VI */}
                      <button
                        onClick={() => handleSynthesizeSingleItem(item, 'vi')}
                        disabled={isSynthesizing}
                        className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        title="Tạo audio VI cho item này (GCS Cloud)"
                      >
                        {isSynthesizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                        <span>Tạo VI</span>
                      </button>

                      {/* Synthesize Both */}
                      <button
                        onClick={() => handleSynthesizeSingleItem(item, 'both')}
                        disabled={isSynthesizing}
                        className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        title="Tạo cả âm thanh EN & VI mới cho item này (GCS Cloud)"
                      >
                        {isSynthesizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        <span>Cả 2</span>
                      </button>

                      {/* Voice Model Selector Toggle */}
                      <button
                        type="button"
                        onClick={() => setExpandedItemVoiceConfig(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                        className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                          expandedItemVoiceConfig[item.id]
                            ? 'bg-red-50 border-red-300 text-[#DC2626]'
                            : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100 text-zinc-700'
                        }`}
                        title="Chọn Voice Model riêng cho câu này"
                      >
                        <Sliders className="w-4 h-4" />
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedItemVoiceConfig[item.id] ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Edit Item */}
                      <button
                        onClick={() => setEditingItem(JSON.parse(JSON.stringify(item)))}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E8EC] hover:border-zinc-300 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 cursor-pointer active:scale-95 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Sửa Text</span>
                      </button>

                      {/* Delete Item */}
                      <button
                        onClick={() => setItemToDelete({
                          sessionNumber: item.sessionNumber,
                          itemId: item.id,
                          itemNumber: item.itemNumber
                        })}
                        className="p-2 rounded-xl border border-zinc-200 hover:bg-red-50 text-zinc-400 hover:text-[#DC2626] hover:border-red-200 cursor-pointer transition-all"
                        title="Xóa câu này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Model & Language Selector for Card */}
                  {expandedItemVoiceConfig[item.id] && (
                    <div className="mt-3 pt-3 border-t border-zinc-200/80 bg-zinc-50/90 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-fade-in shadow-2xs">
                      <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                        {/* EN Voice Select */}
                        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase font-mono shrink-0">Model EN:</span>
                          <select
                            value={itemVoiceEn[item.id] || currentVoiceEn}
                            onChange={(e) => setItemVoiceEn(prev => ({ ...prev, [item.id]: e.target.value }))}
                            className="w-full text-xs font-semibold bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-[#DC2626] cursor-pointer"
                          >
                            <optgroup label="Deepgram Aura">
                              {enVoiceOptions.filter(v => v.provider === 'DEEPGRAM_AURA').map(v => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                              ))}
                            </optgroup>
                            <optgroup label="Google Cloud TTS (en-US)">
                              {enVoiceOptions.filter(v => v.provider !== 'DEEPGRAM_AURA').map(v => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                              ))}
                            </optgroup>
                          </select>
                        </div>

                        {/* VI Voice Select */}
                        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase font-mono shrink-0">Model VI:</span>
                          <select
                            value={itemVoiceVi[item.id] || currentVoiceVi}
                            onChange={(e) => setItemVoiceVi(prev => ({ ...prev, [item.id]: e.target.value }))}
                            className="w-full text-xs font-semibold bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                          >
                            <optgroup label="Google Neural2 & WaveNet (vi-VN)">
                              {viVoiceOptions.filter(v => !v.id.includes('Chirp')).map(v => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                              ))}
                            </optgroup>
                            <optgroup label="Google Chirp3-HD (vi-VN)">
                              {viVoiceOptions.filter(v => v.id.includes('Chirp')).map(v => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                      </div>

                      {/* Quick Generation Action Buttons inside panel */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={isSynthesizing}
                          onClick={() => handleSynthesizeSingleItem(item, 'en')}
                          className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          {isSynthesizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                          <span>Tạo EN</span>
                        </button>
                        <button
                          type="button"
                          disabled={isSynthesizing}
                          onClick={() => handleSynthesizeSingleItem(item, 'vi')}
                          className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          {isSynthesizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                          <span>Tạo VI</span>
                        </button>
                        <button
                          type="button"
                          disabled={isSynthesizing}
                          onClick={() => handleSynthesizeSingleItem(item, 'both')}
                          className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          {isSynthesizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          <span>Tạo Cả 2</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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

              {/* 4. Source Vocab & Pedagogy Matrix (3-Layer Filter) */}
              <div className="space-y-4 p-4.5 bg-zinc-50/90 rounded-2xl border border-zinc-200/80">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-zinc-800 uppercase font-mono tracking-wider text-[10px] flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-[#DC2626]" />
                    <span>Nguồn Từ Vựng Giáo Trình (3-Layer Curriculum Filter)</span>
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Đã chọn <strong className="text-[#DC2626]">{genSelectedVocabIds.length}</strong> / {allAvailableSeedChunks.length} từ vựng hạt giống
                  </span>
                </div>

                {/* Layer 1: Khóa học (Course Level) & Pedagogy */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Layer 1: Khóa học */}
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1 uppercase font-mono tracking-wider text-[10px]">
                      Layer 1: Khóa Học (Course Level)
                    </label>
                    <select
                      value={genSourceLevel}
                      onChange={(e) => setGenSourceLevel(e.target.value as any)}
                      className="w-full p-2 bg-white border border-zinc-200 rounded-xl font-medium focus:ring-2 focus:ring-[#DC2626]/20 text-xs"
                    >
                      <option value="LEVEL_A">Level A - Foundation (Days 1..15)</option>
                      <option value="LEVEL_B_EREL">Level B - EREL Listening (Days 1..15)</option>
                      <option value="LEVEL_B_ERES">Level B - ERES Speaking (Days 1..15)</option>
                      <option value="ALL">Tất Cả Giáo Trình (All Levels)</option>
                    </select>
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
                  </div>
                </div>

                {/* Layer 2: Lesson Days Multi-Select */}
                <div className="space-y-1.5 pt-2 border-t border-zinc-200/60">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-zinc-600 uppercase">Layer 2: Chọn Bài Học Cụ Thể (Lesson Days)</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setGenSelectedLessonIds(genAvailableLessons.map(l => l.id))}
                        className="text-[#DC2626] hover:underline cursor-pointer font-bold"
                      >
                        Chọn Tất Cả Bài ({genAvailableLessons.length})
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setGenSelectedLessonIds([])}
                        className="text-zinc-500 hover:underline cursor-pointer"
                      >
                        Bỏ Chọn Hết
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white rounded-xl border border-zinc-200">
                    {genAvailableLessons.map(lesson => {
                      const isSelected = genSelectedLessonIds.includes(lesson.id);
                      const label = lesson.day_number === 0 
                        ? 'Word List' 
                        : lesson.day_number !== undefined 
                          ? `Day ${lesson.day_number}` 
                          : String(lesson.lesson_title || lesson.title || 'Day').replace(/Lesson\s*/i, 'Day ');

                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => {
                            setGenSelectedLessonIds(prev => 
                              isSelected ? prev.filter(id => id !== lesson.id) : [...prev, lesson.id]
                            );
                          }}
                          className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                              : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Layer 3: Category Filter & Vocab Selection List */}
                <div className="space-y-2 pt-2 border-t border-zinc-200/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-bold text-zinc-600 uppercase text-[10px] font-mono">
                      Layer 3: Chọn Từ Vựng Làm Gợi Ý Hạt Giống (Hint 1)
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Category Dropdown */}
                      <select
                        value={genCategoryFilter}
                        onChange={(e) => setGenCategoryFilter(e.target.value)}
                        className="p-1 px-2 bg-white border border-zinc-200 rounded-lg text-[11px] font-bold text-zinc-700"
                      >
                        <option value="all">Tất Cả Thể Loại ({allAvailableSeedChunks.length})</option>
                        {availableCategories.map(cat => (
                          <option key={cat} value={cat}>
                            {cat.toUpperCase()} ({allAvailableSeedChunks.filter(c => c.category === cat).length})
                          </option>
                        ))}
                      </select>

                      {/* Quick Select / Deselect All Filtered Words */}
                      <button
                        type="button"
                        onClick={() => {
                          const currentFilteredIds = filteredSeedChunks.map(c => c.id);
                          setGenSelectedVocabIds(prev => Array.from(new Set([...prev, ...currentFilteredIds])));
                        }}
                        className="p-1 px-2 rounded-lg bg-red-50 text-[#DC2626] border border-red-200 text-[10px] font-bold hover:bg-red-100 cursor-pointer"
                      >
                        Chọn Tất Cả ({filteredSeedChunks.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const currentFilteredIds = new Set(filteredSeedChunks.map(c => c.id));
                          setGenSelectedVocabIds(prev => prev.filter(id => !currentFilteredIds.has(id)));
                        }}
                        className="p-1 px-2 rounded-lg bg-zinc-100 text-zinc-600 border border-zinc-200 text-[10px] font-bold hover:bg-zinc-200 cursor-pointer"
                      >
                        Bỏ Chọn
                      </button>
                    </div>
                  </div>

                  {/* Vocab Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm từ vựng hoặc nghĩa tiếng Việt để chọn..."
                      value={genVocabSearch}
                      onChange={(e) => setGenVocabSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20"
                    />
                  </div>

                  {/* Words Chips Grid */}
                  <div className="space-y-1.5">
                    {filteredSeedChunks.length > 80 && (
                      <div className="text-[11px] font-mono text-zinc-600 bg-amber-50/90 border border-amber-200/80 px-3 py-1.5 rounded-xl flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            Hiển thị <strong>80</strong> / <strong>{filteredSeedChunks.length}</strong> từ vựng (dùng thanh tìm kiếm để lọc nhanh)
                          </span>
                        </span>
                        <span className="text-[10px] font-bold text-amber-800">
                          {genSelectedVocabIds.length} từ đã chọn làm seed
                        </span>
                      </div>
                    )}

                    <div className="p-2 bg-white rounded-xl border border-zinc-200 max-h-44 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                      {filteredSeedChunks.length === 0 ? (
                        <div className="col-span-full p-4 text-center text-xs text-zinc-400">
                          Không có từ vựng nào khớp với bộ lọc.
                        </div>
                      ) : (
                        visibleSeedChunks.map(chunk => {
                          const isSelected = selectedVocabSet.has(chunk.id);
                          return (
                            <div
                              key={chunk.id}
                              onClick={() => {
                                setGenSelectedVocabIds(prev => 
                                  isSelected ? prev.filter(id => id !== chunk.id) : [...prev, chunk.id]
                                );
                              }}
                              className={`p-1.5 px-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                                isSelected
                                  ? 'bg-red-50/80 border-[#DC2626] text-zinc-900 shadow-2xs'
                                  : 'bg-zinc-50/60 border-zinc-200 text-zinc-400 hover:bg-zinc-100/80'
                              }`}
                            >
                              <div className="truncate flex-1">
                                <div className="font-bold text-xs truncate text-zinc-900">
                                  {chunk.english}
                                </div>
                                <div className="text-[10px] text-zinc-500 italic truncate">
                                  {chunk.vietnamese}
                                </div>
                              </div>

                              <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-[#DC2626] border-[#DC2626] text-white' : 'border-zinc-300 bg-white'
                              }`}>
                                {isSelected && <Check className="w-2.5 h-2.5" />}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
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
                    <span className="font-bold text-zinc-800 text-xs">Cấu Hình AI Provider & Prompt Nâng Cao</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {genProvider === 'DEEPSEEK' ? 'DeepSeek Official' : genProvider === 'GOOGLE_GENAI' ? 'Google Gemini' : 'Custom'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      {genModel}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isLlmAccordionOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLlmAccordionOpen && (
                  <div className="p-4 border-t border-zinc-100 space-y-4 bg-zinc-50/50">
                    {/* Provider Tabs */}
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1.5 text-xs font-mono">
                        Chọn AI Engine / Provider
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleProviderChange('DEEPSEEK')}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-1 cursor-pointer ${
                            genProvider === 'DEEPSEEK'
                              ? 'bg-blue-50/90 border-blue-500 text-blue-900 shadow-2xs ring-2 ring-blue-500/20'
                              : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              DeepSeek Official
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-mono">Trực Tiếp</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-normal truncate">api.deepseek.com (Khuyên dùng)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleProviderChange('GOOGLE_GENAI')}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-1 cursor-pointer ${
                            genProvider === 'GOOGLE_GENAI'
                              ? 'bg-purple-50/90 border-purple-500 text-purple-900 shadow-2xs ring-2 ring-purple-500/20'
                              : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-purple-500" />
                              Google Gemini
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-mono">Google GenAI</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-normal truncate">Gemini 2.5 Flash / 2.0 Flash</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleProviderChange('CUSTOM_OPENAI')}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-1 cursor-pointer ${
                            genProvider === 'CUSTOM_OPENAI'
                              ? 'bg-zinc-900 border-zinc-900 text-white shadow-2xs'
                              : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold">Tùy Chỉnh</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700 font-mono">Custom</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-normal truncate">OpenAI-compatible URL</span>
                        </button>
                      </div>
                    </div>

                    {/* Model & Config Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold text-zinc-600 block mb-1 font-mono text-[10px]">
                          Mô hình ({genProvider === 'DEEPSEEK' ? 'DeepSeek' : genProvider === 'GOOGLE_GENAI' ? 'Google Gemini' : 'Model'})
                        </label>
                        {genProvider === 'DEEPSEEK' ? (
                          <select
                            value={genModel}
                            onChange={(e) => {
                              setGenModel(e.target.value);
                              setTestResult(null);
                            }}
                            className="w-full p-2 bg-white border border-zinc-200 rounded-lg font-mono text-xs font-bold text-zinc-800 focus:outline-none focus:border-blue-500"
                          >
                            <option value="deepseek-chat">deepseek-chat (DeepSeek-V3 • Khuyên Dùng)</option>
                            <option value="deepseek-reasoner">deepseek-reasoner (DeepSeek-R1 • Suy Luận Sâu)</option>
                          </select>
                        ) : genProvider === 'GOOGLE_GENAI' ? (
                          <select
                            value={genModel}
                            onChange={(e) => {
                              setGenModel(e.target.value);
                              setTestResult(null);
                            }}
                            className="w-full p-2 bg-white border border-zinc-200 rounded-lg font-mono text-xs font-bold text-zinc-800 focus:outline-none focus:border-purple-500"
                          >
                            <option value="gemini-2.5-flash">gemini-2.5-flash (Gemini 2.5 Flash • Cực Nhanh & Mới Nhất)</option>
                            <option value="gemini-2.0-flash">gemini-2.0-flash (Gemini 2.0 Flash • Low Latency)</option>
                            <option value="gemini-1.5-flash">gemini-1.5-flash (Gemini 1.5 Flash • Hạn Mức Lớn)</option>
                            <option value="gemini-1.5-pro">gemini-1.5-pro (Gemini 1.5 Pro • Chuyên Sâu)</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={genModel}
                            onChange={(e) => {
                              setGenModel(e.target.value);
                              setTestResult(null);
                            }}
                            placeholder="e.g. gpt-4o-mini"
                            className="w-full p-2 bg-white border border-zinc-200 rounded-lg font-mono text-xs font-bold text-zinc-800"
                          />
                        )}
                      </div>

                      <div>
                        <label className="font-bold text-zinc-600 block mb-1 font-mono text-[10px]">
                          {genProvider === 'DEEPSEEK' 
                            ? 'DeepSeek API Key (Đã Cấu Hình)' 
                            : genProvider === 'GOOGLE_GENAI' 
                              ? 'Google Gemini API Key (AIzaSy...)' 
                              : 'API Key'}
                        </label>
                        <div className="relative">
                          <input
                            type={genShowApiKey ? 'text' : 'password'}
                            value={genApiKey}
                            onChange={(e) => {
                              setGenApiKey(e.target.value);
                              setTestResult(null);
                              if (genProvider === 'GOOGLE_GENAI') {
                                localStorage.setItem('chunks_gemini_api_key', e.target.value);
                              }
                            }}
                            placeholder={genProvider === 'GOOGLE_GENAI' ? 'Dán Google AI Studio API Key...' : 'Nhập API Key...'}
                            className="w-full p-2 bg-white border border-zinc-200 rounded-lg font-mono text-xs pr-8"
                          />
                          <button
                            type="button"
                            onClick={() => setGenShowApiKey(!genShowApiKey)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                          >
                            {genShowApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-zinc-600 block mb-1 font-mono text-[10px]">Endpoint URL</label>
                        <input
                          type="text"
                          value={genEndpoint}
                          onChange={(e) => {
                            setGenEndpoint(e.target.value);
                            setTestResult(null);
                          }}
                          disabled={genProvider !== 'CUSTOM_OPENAI'}
                          className={`w-full p-2 rounded-lg font-mono text-xs border ${
                            genProvider !== 'CUSTOM_OPENAI' ? 'bg-zinc-100 text-zinc-500 border-zinc-200' : 'bg-white border-zinc-200 text-zinc-800'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Model Connection Test Button & High-Contrast Result Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-zinc-200/60">
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          disabled={isTestingConnection || isGenerating}
                          onClick={handleTestConnection}
                          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            isTestingConnection
                              ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                              : 'bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-300 hover:border-zinc-400 shadow-2xs active:scale-95'
                          }`}
                        >
                          {isTestingConnection ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#DC2626]" />
                          ) : (
                            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          )}
                          <span>{isTestingConnection ? 'Đang Kiểm Tra Kết Nối...' : '⚡ Kiểm Tra Kết Nối (Test Model)'}</span>
                        </button>

                        {/* Result Badge */}
                        {testResult && (
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border shadow-2xs animate-in fade-in duration-200 ${
                            testResult.success
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-red-50 text-red-800 border-red-300'
                          }`}>
                            <span>{testResult.success ? '🟢' : '🔴'}</span>
                            <span>
                              {testResult.success
                                ? `Kết nối thành công (${testResult.latencyMs}ms) - Model: ${testResult.model || genModel}`
                                : `Lỗi: ${testResult.message}`}
                            </span>
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] text-zinc-400 font-mono">
                        Provider: <strong>{genProvider}</strong> • Model: <strong>{genModel}</strong>
                      </span>
                    </div>


                    {/* Master System Prompt Editor */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-zinc-600 font-mono text-[10px]">Master System Prompt</label>
                        <button
                          type="button"
                          onClick={() => setGenMasterPrompt(DEFAULT_IMPROV_MASTER_PROMPT)}
                          className="text-[10px] text-[#DC2626] hover:underline font-mono"
                        >
                          Khôi phục mặc định
                        </button>
                      </div>
                      <textarea
                        value={genMasterPrompt}
                        onChange={(e) => setGenMasterPrompt(e.target.value)}
                        rows={6}
                        className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl font-mono text-[11px] leading-relaxed text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Progress & Live Logs (when generating) */}
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
      {/* 5. MODAL: + THÊM CÂU HỎI MỚI (ADD ITEM MODAL) */}
      {/* ==================================================================== */}
      {isAddItemModalOpen && newItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E8E8EC] shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#E8E8EC] flex items-center justify-between bg-zinc-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-50 text-[#DC2626] border border-red-100">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-zinc-900">
                    Thêm Câu Hỏi / Bài Tập Mới (Add Item)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Tùy chỉnh số lượng gợi ý và vai trò ngữ nghĩa cho câu trong Session.
                  </p>
                </div>
              </div>

              <button
                onClick={() => { setIsAddItemModalOpen(false); setNewItem(null); }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Configuration Strip: Select Session & Add/Remove Hints */}
            <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <label className="font-bold text-zinc-700 font-mono text-[10px] uppercase">
                  Session Đích:
                </label>
                <select
                  value={newItem.sessionNumber}
                  onChange={(e) => {
                    const sNum = parseInt(e.target.value) || 1;
                    handleOpenAddItemModal(sNum);
                  }}
                  className="p-1.5 px-3 bg-white border border-zinc-200 rounded-xl font-bold font-mono text-zinc-800"
                >
                  {activePackage?.sessions.map(s => (
                    <option key={s.sessionNumber} value={s.sessionNumber}>
                      Session {s.sessionNumber} ({s.hcTotal} Hints)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewItem(prev => {
                      if (!prev || prev.hints.length <= 1) return prev;
                      const nextHints = prev.hints.slice(0, -1);
                      return { ...prev, hints: nextHints, hcTotal: nextHints.length };
                    });
                  }}
                  disabled={newItem.hints.length <= 1}
                  className="p-1.5 px-3 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-600 disabled:opacity-40 cursor-pointer font-bold flex items-center gap-1"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Bớt Gợi Ý</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewItem(prev => {
                      if (!prev || prev.hints.length >= 8) return prev;
                      const nextIdx = prev.hints.length + 1;
                      const newHint: ImprovHint = {
                        id: `h_new_${Date.now()}_${nextIdx}`,
                        text: '',
                        translation: '',
                        typeFunction: 'Động từ · Ending',
                        itemIndex: nextIdx
                      };
                      return { ...prev, hints: [...prev.hints, newHint], hcTotal: nextIdx };
                    });
                  }}
                  disabled={newItem.hints.length >= 8}
                  className="p-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-black text-white cursor-pointer font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Gợi Ý</span>
                </button>
              </div>
            </div>

            {/* Editable Hint Cards */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {newItem.hints.map((hint, idx) => (
                <div key={hint.id || idx} className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-zinc-600">
                      GỢI Ý #{hint.itemIndex} {idx === 0 ? '(Keyword / Từ vựng cốt lõi)' : idx === newItem.hints.length - 1 ? '(Ending / Vị ngữ kết thúc)' : '(Logic Connector / Ẩn dụ)'}
                    </span>

                    <select
                      value={hint.typeFunction}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setNewItem(prev => {
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
                      English Hint Text (1-2 từ hoặc cụm ngắn)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: loose change / in other words / wrap up..."
                      value={hint.text}
                      onChange={(e) => {
                        const newText = e.target.value;
                        setNewItem(prev => {
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
                      placeholder="Ví dụ: tiền lẻ / nói cách khác / chốt lại..."
                      value={hint.translation}
                      onChange={(e) => {
                        const newVi = e.target.value;
                        setNewItem(prev => {
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
                onClick={() => { setIsAddItemModalOpen(false); setNewItem(null); }}
                className="px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 transition-all cursor-pointer"
              >
                Hủy Bỏ
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveNewItem(false)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-xs font-bold text-zinc-800 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Câu Mới</span>
                </button>

                <button
                  onClick={() => handleSaveNewItem(true)}
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
      {/* 6. MODAL: PACKAGE BATCH AUDIO GENERATOR */}
      {/* ==================================================================== */}
      {isBatchAudioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
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
                    Tùy chọn mô hình giọng đọc và tạo âm thanh chất lượng cao cho toàn bộ {stats.totalItems} items.
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
              {/* Target Language Selection: EN, VI, or BOTH */}
              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/60 space-y-2">
                <div className="font-bold text-zinc-800 text-xs">Mục Tiêu Ngôn Ngữ Audio (Audio Target)</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={isBatchRunning}
                    onClick={() => setBatchTargetLang('en')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      batchTargetLang === 'en'
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <span>Tiếng Anh (EN)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isBatchRunning}
                    onClick={() => setBatchTargetLang('vi')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      batchTargetLang === 'vi'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <span>Tiếng Việt (VI)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isBatchRunning}
                    onClick={() => setBatchTargetLang('both')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      batchTargetLang === 'both'
                        ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-xs'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <span>Cả 2 (EN & VI)</span>
                  </button>
                </div>
              </div>

              {/* Custom Voice Model Selection: EN & VI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/60">
                {/* English Voice Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-800">
                    Giọng Đọc Tiếng Anh (English Voice)
                  </label>
                  <select
                    value={batchVoiceEn}
                    disabled={isBatchRunning}
                    onChange={(e) => setBatchVoiceEn(e.target.value)}
                    className="w-full text-xs font-medium p-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:ring-2 focus:ring-[#DC2626]/30 cursor-pointer"
                  >
                    {enVoiceOptions.map(v => (
                      <option key={v.id} value={v.id} className="bg-white text-zinc-900">
                        {v.name} ({v.gender}) {v.provider ? `[${v.provider}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vietnamese Voice Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-800">
                    Giọng Đọc Tiếng Việt (Vietnamese Voice)
                  </label>
                  <select
                    value={batchVoiceVi}
                    disabled={isBatchRunning}
                    onChange={(e) => setBatchVoiceVi(e.target.value)}
                    className="w-full text-xs font-medium p-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:ring-2 focus:ring-[#DC2626]/30 cursor-pointer"
                  >
                    {viVoiceOptions.map(v => (
                      <option key={v.id} value={v.id} className="bg-white text-zinc-900">
                        {v.name} ({v.gender})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
      {/* 7. MODAL: IMPORT EXCEL SPREADSHEET */}
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
                    Import Package từ Excel (.xlsx / .csv) & JSON (.json)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Tải lên file bảng tính (.xlsx, .csv) hoặc file JSON xuất chuẩn CHUNKS Improv.
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
              {/* Quick Preset Loader Banner */}
              <div className="p-3.5 bg-gradient-to-r from-red-50 to-amber-50 rounded-2xl border border-red-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white rounded-xl shadow-2xs text-[#DC2626] border border-red-100 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900">
                      Nạp nhanh 2 bộ bài tập chuẩn (Default Presets)
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Bao gồm Set 01 (Wandering Souls) & Set 02 (Tell Me About Yourself) - 120 items chuẩn ngữ âm.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickLoadDefaultPresets}
                  className="px-3.5 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Nạp nhanh Set 01 & Set 02</span>
                </button>
              </div>

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
                  input.accept = '.xlsx, .xls, .csv, .json';
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
                    {importFile ? importFile.name : 'Kéo thả file Excel (.xlsx, .csv) hoặc JSON (.json) vào đây'}
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">
                    Hỗ trợ định dạng .xlsx, .xls, .csv, .json theo tiêu chuẩn CHUNKS Improv.
                  </div>
                </div>

                {isParsingImport && (
                  <div className="flex items-center gap-2 text-xs text-[#DC2626] font-mono">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang đọc và phân tích file...</span>
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
      {/* 8. MODAL: DELETE ITEM CONFIRMATION */}
      {/* ==================================================================== */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E8E8EC] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#DC2626] border border-red-100 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-display font-bold text-base text-zinc-900">
                Xác Nhận Xóa Câu #{itemToDelete.itemNumber}?
              </h3>
              <p className="text-xs text-zinc-500">
                Bạn có chắc chắn muốn xóa câu này khỏi Session {itemToDelete.sessionNumber}? Các câu sau sẽ tự động được đánh số lại.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 transition-all cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleConfirmDeleteItem}
                className="py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 9. MODAL: DELETE PACKAGE CONFIRMATION */}
      {/* ==================================================================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
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

      {/* ==================================================================== */}
      {/* 10. TOAST: DELETE SUCCESS NOTIFICATION */}
      {/* ==================================================================== */}
      {deleteSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-2xl font-bold text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
          <span>{deleteSuccessToast}</span>
        </div>
      )}
    </div>
  );
};

export default ImprovManagerView;

