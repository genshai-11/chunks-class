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
  CohortAudioSettings,
  Course,
  ImprovBatchGenerationStatus,
  ImprovGenerateProgressDetail
} from '../types';
import { 
  getAllImprovPackages, 
  getLocalCachedImprovPackages,
  saveImprovPackage, 
  deleteImprovPackage, 
  updateImprovPackageMetadata,
  addOrUpdateImprovItem, 
  deleteImprovItem, 
  parseImprovExcelFile, 
  exportImprovPackageToExcel, 
  loadDefaultPresets, 
  DEFAULT_IMPROV_MASTER_PROMPT, 
  DEFAULT_IMPROV_LLM_CONFIG, 
  GOOGLE_GENAI_DEFAULT_CONFIG, 
  generateImprovPackage,
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
  getHintTextByLanguage,
  getHintLanguagePair,
  prepareSessionAudio,
  preparePackageAudio,
  prepareCustomItemsAudio,
  ImprovBatchError,
  ImprovBatchProgress
} from '../services/improvTtsService';
import { audioPlayer, sanitizeSpeechText, ALL_VOICES, GOOGLE_TTS_VOICES } from '../services/googleTtsService';
import { modelRegistryService, DEFAULT_AI_GENERATION_CONFIG } from '../services/modelRegistryService';
import { curriculumRegistry } from '../services/curriculumRegistry';
import { getCourses, getLessonsByLevel } from '../services/firestoreService';
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
  ChevronLeft,
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
  const rawVoiceEn = audioSettings?.voice_profile_en;
  const currentVoiceEn = (rawVoiceEn && rawVoiceEn !== 'aura-theia-en') ? rawVoiceEn : 'flux-cliff-en';
  const currentVoiceVi = audioSettings?.voice_profile_vi || 'vi-VN-Neural2-A';
  // --------------------------------------------------------------------------
  // A. Packages & Active Selection State
  // --------------------------------------------------------------------------
  const [packages, setPackages] = useState<ImprovPackage[]>(() => getLocalCachedImprovPackages());
  const [activePackageId, setActivePackageId] = useState<string>(() => {
    if (defaultPackageId) return defaultPackageId;
    const initial = getLocalCachedImprovPackages();
    return initial.length > 0 ? initial[0].id : '';
  });
  const [isLoadingPackages, setIsLoadingPackages] = useState<boolean>(false);
  const [activeSessionTab, setActiveSessionTab] = useState<number | 'all'>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [audioFilter, setAudioFilter] = useState<'all' | 'ready' | 'missing'>('all');
  const [showVietnamese, setShowVietnamese] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Pagination & Chunked Display State (15 - 20 items per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(20);

  // Reset pagination to page 1 whenever active package, session tab, search query, audio filter, or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activePackageId, activeSessionTab, searchQuery, audioFilter, pageSize]);

  // --------------------------------------------------------------------------
  // B. Modal Visibility & Item CRUD States
  // --------------------------------------------------------------------------
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const [renameTitle, setRenameTitle] = useState<string>('');
  const [renameDescription, setRenameDescription] = useState<string>('');
  const [isSavingRename, setIsSavingRename] = useState<boolean>(false);
  const [renameSuccessToast, setRenameSuccessToast] = useState<string | null>(null);
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
  const [batchVoiceEn, setBatchVoiceEn] = useState<string>(() => {
    return (currentVoiceEn && currentVoiceEn !== 'aura-theia-en') ? currentVoiceEn : 'flux-cliff-en';
  });
  const [batchVoiceVi, setBatchVoiceVi] = useState<string>(currentVoiceVi || 'vi-VN-Neural2-A');
  const [forceOverwrite, setForceOverwrite] = useState<boolean>(true);
  const [isResettingAudio, setIsResettingAudio] = useState<boolean>(false);
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

  // Retry Failed State
  const [lastFailedErrors, setLastFailedErrors] = useState<ImprovBatchError[]>([]);

  // Batch Audio Scope & Detailed Diagnostics
  const [batchScope, setBatchScope] = useState<'package' | 'session' | 'missing' | 'failed'>('package');
  const [batchSessionNum, setBatchSessionNum] = useState<number>(1);
  const [batchErrors, setBatchErrors] = useState<ImprovBatchError[]>([]);
  const [isErrorPanelExpanded, setIsErrorPanelExpanded] = useState<boolean>(true);
  const [batchCompleted, setBatchCompleted] = useState<boolean>(false);
  const [cloudSyncSummary, setCloudSyncSummary] = useState<{
    uploadedItemsEn: number;
    uploadedItemsVi: number;
    uploadedHints: number;
    error?: string;
  } | null>(null);
  const [isRetryingErrors, setIsRetryingErrors] = useState<boolean>(false);

  // Keep batch voice in sync if prop changes
  useEffect(() => {
    if (currentVoiceEn) {
      setBatchVoiceEn(currentVoiceEn === 'aura-theia-en' ? 'flux-cliff-en' : currentVoiceEn);
    }
  }, [currentVoiceEn]);

  useEffect(() => {
    if (currentVoiceVi) setBatchVoiceVi(currentVoiceVi);
  }, [currentVoiceVi]);

  // Voice options for Improv Studio (strictly obeys Improv display matrix)
  const [improvRegistryRev, setImprovRegistryRev] = useState<number>(0);
  useEffect(() => {
    return modelRegistryService.subscribe(() => {
      setImprovRegistryRev(r => r + 1);
    });
  }, []);

  const enVoiceOptions = useMemo(() => {
    return modelRegistryService.getImprovModels('en');
  }, [improvRegistryRev]);

  const viVoiceOptions = useMemo(() => {
    return modelRegistryService.getImprovModels('vi');
  }, [improvRegistryRev]);

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
  // D. AI Generator Form State (3-Layer Filter) - Dynamic Courses & Live Gemini
  // --------------------------------------------------------------------------
  const [availableCourses, setAvailableCourses] = useState<Course[]>(() => curriculumRegistry.getAllCourses());
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(false);

  // Fetch dynamic courses from Firestore on mount
  useEffect(() => {
    let isMounted = true;
    async function loadLiveCourses() {
      setIsLoadingCourses(true);
      try {
        const liveCourses = await getCourses();
        if (isMounted && liveCourses && liveCourses.length > 0) {
          setAvailableCourses(liveCourses);
        }
      } catch (err) {
        console.warn('[ImprovManagerView] Error loading courses from Firestore:', err);
      } finally {
        if (isMounted) setIsLoadingCourses(false);
      }
    }
    loadLiveCourses();
    return () => { isMounted = false; };
  }, []);

  const [genTitle, setGenTitle] = useState<string>('CHUNKS Improv - Level B ERES Speaking (Day 1)');
  const [genDescription, setGenDescription] = useState<string>(
    'Bộ bài tập phản xạ ngẫu hứng CHUNKS gồm 4 sessions (50 câu) dựa trên từ vựng cốt lõi Level B ERES Speaking - Day 1.'
  );
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

  // Dynamic Title & Description generator helper
  const computeDynamicTitleAndDescription = useCallback((
    courseLevel: string,
    selectedLessonIds: string[],
    lessonsList: LessonDoc[],
    coursesList: Course[],
    sessionsCount: number,
    totalItems: number
  ) => {
    let courseTitle = 'Level B ERES Speaking';
    if (courseLevel === 'ALL') {
      courseTitle = 'Tất Cả Giáo Trình CHUNKS';
    } else {
      const matched = coursesList.find(c => c.level_code === courseLevel || c.id === courseLevel);
      if (matched) {
        courseTitle = matched.title;
      } else {
        courseTitle = courseLevel.replace(/^LEVEL_/, 'Level ').replace(/_/g, ' ');
      }
    }

    let lessonsSummary = '';
    if (selectedLessonIds.length === 0) {
      lessonsSummary = 'Chưa chọn bài';
    } else if (selectedLessonIds.length === lessonsList.length && lessonsList.length > 0) {
      lessonsSummary = `Toàn bộ ${lessonsList.length} bài`;
    } else {
      const selectedDocs = lessonsList.filter(l => selectedLessonIds.includes(l.id));
      selectedDocs.sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0));

      if (selectedDocs.length === 1) {
        const d = selectedDocs[0];
        lessonsSummary = d.day_number === 0 ? 'Word List' : `Day ${d.day_number ?? 1}`;
      } else if (selectedDocs.length > 1) {
        const dayNums = selectedDocs.map(d => d.day_number ?? 0);
        const isContiguous = dayNums.every((val, idx) => idx === 0 || val === dayNums[idx - 1] + 1);
        if (isContiguous) {
          const first = dayNums[0] === 0 ? 'Word List' : `Day ${dayNums[0]}`;
          const last = `Day ${dayNums[dayNums.length - 1]}`;
          lessonsSummary = `${first} - ${last}`;
        } else {
          const labels = dayNums.slice(0, 3).map(n => n === 0 ? 'Word List' : `Day ${n}`);
          lessonsSummary = labels.join(', ') + (dayNums.length > 3 ? ` (+${dayNums.length - 3})` : '');
        }
      }
    }

    const title = `CHUNKS Improv - ${courseTitle} (${lessonsSummary})`;
    const description = `Bộ bài tập phản xạ ngẫu hứng CHUNKS gồm ${sessionsCount} sessions (${totalItems} câu) dựa trên từ vựng cốt lõi ${courseTitle} - ${lessonsSummary}.`;

    return { title, description };
  }, []);

  const handleRegenerateDynamicTitle = () => {
    const { title, description } = computeDynamicTitleAndDescription(
      genSourceLevel,
      genSelectedLessonIds,
      genAvailableLessons,
      availableCourses,
      genSessionsCount,
      genTotalItems
    );
    setGenTitle(title);
    setGenDescription(description);
  };

  // LLM Config - Initialized from modelRegistryService
  const initialAiConfig = modelRegistryService.getAiConfig();
  const [genProvider, setGenProvider] = useState<ImprovLlmProvider>(
    initialAiConfig.provider === 'CUSTOM_OPENAI' ? 'CUSTOM_OPENAI' : 'GOOGLE_GENAI'
  );
  const [isLlmAccordionOpen, setIsLlmAccordionOpen] = useState<boolean>(true);
  const [genEndpoint, setGenEndpoint] = useState<string>(initialAiConfig.endpoint || GOOGLE_GENAI_DEFAULT_CONFIG.endpoint);
  const [genApiKey, setGenApiKey] = useState<string>(initialAiConfig.apiKey || GOOGLE_GENAI_DEFAULT_CONFIG.apiKey);
  const [genShowApiKey, setGenShowApiKey] = useState<boolean>(false);
  const [genModel, setGenModel] = useState<string>(initialAiConfig.model || 'gemini-2.5-flash');
  const [genMasterPrompt, setGenMasterPrompt] = useState<string>(DEFAULT_IMPROV_MASTER_PROMPT);

  // Sync with modelRegistryService so settings configured in SettingsView apply immediately
  useEffect(() => {
    const unsub = modelRegistryService.subscribe(() => {
      const cfg = modelRegistryService.getAiConfig();
      setGenProvider(cfg.provider === 'CUSTOM_OPENAI' ? 'CUSTOM_OPENAI' : 'GOOGLE_GENAI');
      if (cfg.apiKey) setGenApiKey(cfg.apiKey);
      if (cfg.model) setGenModel(cfg.model);
      if (cfg.endpoint) setGenEndpoint(cfg.endpoint);
    });
    return unsub;
  }, []);

  const handleProviderChange = (newProvider: ImprovLlmProvider) => {
    setGenProvider(newProvider);
    setTestResult(null);
    if (newProvider === 'GOOGLE_GENAI') {
      const currentConfig = modelRegistryService.getAiConfig();
      const ep = GOOGLE_GENAI_DEFAULT_CONFIG.endpoint;
      const key = currentConfig.apiKey || GOOGLE_GENAI_DEFAULT_CONFIG.apiKey;
      const mdl = currentConfig.model || 'gemini-2.5-flash';
      setGenEndpoint(ep);
      setGenApiKey(key);
      setGenModel(mdl);
      modelRegistryService.setAiConfig({ provider: 'GOOGLE_GENAI', endpoint: ep, apiKey: key, model: mdl });
    } else {
      const ep = 'https://api.openai.com/v1';
      const mdl = 'gpt-4o-mini';
      setGenEndpoint(ep);
      setGenModel(mdl);
      modelRegistryService.setAiConfig({ provider: 'CUSTOM_OPENAI', endpoint: ep, model: mdl });
    }
  };

  const handleAiModelChange = (model: string) => {
    setGenModel(model);
    setTestResult(null);
    modelRegistryService.setAiConfig({ model });
  };

  const handleAiApiKeyChange = (apiKey: string) => {
    setGenApiKey(apiKey);
    setTestResult(null);
    modelRegistryService.setAiConfig({ apiKey });
  };

  const handleAiEndpointChange = (endpoint: string) => {
    setGenEndpoint(endpoint);
    setTestResult(null);
    modelRegistryService.setAiConfig({ endpoint });
  };

  // Connection test state
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; message: string; model?: string } | null>(null);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    try {
      const res = await modelRegistryService.testAiConnection({
        provider: genProvider,
        endpoint: genEndpoint,
        apiKey: genApiKey,
        model: genModel
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        message: err?.message || 'Lỗi kết nối tới mô hình AI',
        model: genModel
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
  const [genError, setGenError] = useState<string | null>(null);
  const [genBatchesStatus, setGenBatchesStatus] = useState<ImprovBatchGenerationStatus[]>([]);
  const [genCompletionSummary, setGenCompletionSummary] = useState<{
    title: string;
    totalItems: number;
    sessionsCount: number;
    level: string;
    difficulty: string;
    relevance: string;
    successBatches: number;
    failedBatches: number;
  } | null>(null);
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
  // 1. Initial Load of Packages & Registry (Non-blocking background sync)
  // --------------------------------------------------------------------------
  useEffect(() => {
    async function loadData() {
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
          // Non-blocking auto-persistence: run in background with Promise.allSettled
          Promise.allSettled(
            filteredDefaultSeeds.map(s => saveImprovPackage(s))
          ).catch(err => {
            console.warn('[ImprovManagerView] Background auto-persistence notice:', err);
          });
        }

        setPackages(loaded);
        if (loaded.length > 0) {
          setActivePackageId(prev => {
            if (defaultPackageId && loaded.some(p => p.id === defaultPackageId)) return defaultPackageId;
            if (prev && loaded.some(p => p.id === prev)) return prev;
            return loaded[0].id;
          });
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
          setActivePackageId(prev => (prev && seeds.some(p => p.id === prev) ? prev : seeds[0].id));
          Promise.allSettled(seeds.map(s => saveImprovPackage(s))).catch(() => {});
        }
      } finally {
        setIsLoadingPackages(false);
      }
    }
    loadData();
  }, [defaultPackageId]);

  // Lazy-load available lessons for Vocab selector: ONLY when AI Generator modal is opened!
  useEffect(() => {
    if (!isGeneratorOpen) return;

    let isMounted = true;
    async function fetchLessons() {
      const targetLevel = genSourceLevel === 'ALL' ? 'LEVEL_B_ERES' : genSourceLevel;
      // 1. Instant in-memory curriculumRegistry lookup (0ms latency, zero network)
      let lessons: LessonDoc[] = curriculumRegistry.getLessons(targetLevel);

      // 2. Network fallback only if registry is empty
      if (!lessons || lessons.length === 0) {
        try {
          lessons = await getLessonsByLevel(targetLevel);
        } catch (err) {
          console.warn('[ImprovManagerView] Error loading lessons:', err);
          lessons = curriculumRegistry.getLessons(targetLevel);
        }
      }

      if (!isMounted) return;

      if (!lessons || lessons.length === 0) {
        lessons = curriculumRegistry.getLessons(targetLevel);
      }

      setGenAvailableLessons(lessons);

      // Default genSelectedLessonIds: select Day 1 by default (or first lesson)
      const initialSelectedIds = lessons.length > 0 ? [lessons[0].id] : [];
      setGenSelectedLessonIds(initialSelectedIds);

      // Auto update dynamic title and description
      const { title, description } = computeDynamicTitleAndDescription(
        genSourceLevel,
        initialSelectedIds,
        lessons,
        availableCourses,
        genSessionsCount,
        genTotalItems
      );
      setGenTitle(title);
      setGenDescription(description);
    }

    fetchLessons();
    return () => { isMounted = false; };
  }, [isGeneratorOpen, genSourceLevel, availableCourses, computeDynamicTitleAndDescription, genSessionsCount, genTotalItems]);

  const handleToggleLessonSelection = (lessonId: string) => {
    setGenSelectedLessonIds(prev => {
      const next = prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId];

      const { title, description } = computeDynamicTitleAndDescription(
        genSourceLevel,
        next,
        genAvailableLessons,
        availableCourses,
        genSessionsCount,
        genTotalItems
      );
      setGenTitle(title);
      setGenDescription(description);
      return next;
    });
  };

  const handleSelectAllLessons = () => {
    const allIds = genAvailableLessons.map(l => l.id);
    setGenSelectedLessonIds(allIds);
    const { title, description } = computeDynamicTitleAndDescription(
      genSourceLevel,
      allIds,
      genAvailableLessons,
      availableCourses,
      genSessionsCount,
      genTotalItems
    );
    setGenTitle(title);
    setGenDescription(description);
  };

  const handleDeselectAllLessons = () => {
    setGenSelectedLessonIds([]);
    const { title, description } = computeDynamicTitleAndDescription(
      genSourceLevel,
      [],
      genAvailableLessons,
      availableCourses,
      genSessionsCount,
      genTotalItems
    );
    setGenTitle(title);
    setGenDescription(description);
  };

  // Layer 3: Extract all seed chunks from selected lessons
  const allAvailableSeedChunks: ChunkItem[] = useMemo(() => {
    const chunks: ChunkItem[] = [];
    genSelectedLessonIds.forEach(lId => {
      const lesson = genAvailableLessons.find(l => l.id === lId) || curriculumRegistry.getLessonById(lId);
      if (lesson && lesson.chunks) {
        chunks.push(...lesson.chunks);
      }
    });
    return chunks;
  }, [genSelectedLessonIds, genAvailableLessons]);

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

  // Helper: check readiness of an ImprovItem (EN, VI, and overall ready)
  const checkItemReadiness = useCallback((item: ImprovItem): { en: boolean; vi: boolean; ready: boolean } => {
    const isEn = Boolean(
      (item.audioUrl && item.audioUrl !== 'cached' && (item.audioUrl.startsWith('http') || item.audioUrl.startsWith('data:'))) ||
      audioPlayer.getCachedAudio(`improv_item_${item.id}_${currentVoiceEn}_${currentVoiceVi}_EN_ONLY`, currentVoiceEn) ||
      audioPlayer.getCachedAudio(`improv_item_${item.id}_${currentVoiceEn}_${currentVoiceVi}_EN_THEN_VI`, currentVoiceEn) ||
      (item.hints && item.hints.length > 0 && item.hints.every(h => {
        const t = h.text?.trim();
        const hKey = `improv_hint_${h.id}_${currentVoiceEn}_en`;
        return !t || Boolean((h.audioUrl && h.audioUrl !== 'cached' && (h.audioUrl.startsWith('http') || h.audioUrl.startsWith('data:'))) || audioPlayer.getCachedAudio(hKey, currentVoiceEn) || (t && (audioPlayer.getCachedAudio(t, currentVoiceEn) || audioPlayer.isChunkCached(t, currentVoiceEn))));
      }))
    );
    const isVi = Boolean(
      (item.audioUrlVi && item.audioUrlVi !== 'cached' && (item.audioUrlVi.startsWith('http') || item.audioUrlVi.startsWith('data:'))) ||
      audioPlayer.getCachedAudio(`improv_item_${item.id}_${currentVoiceEn}_${currentVoiceVi}_VI_ONLY`, currentVoiceVi) ||
      audioPlayer.getCachedAudio(`improv_item_${item.id}_${currentVoiceEn}_${currentVoiceVi}_EN_THEN_VI`, currentVoiceVi) ||
      (item.hints && item.hints.length > 0 && item.hints.every(h => {
        const t = (h.translation || '').trim();
        const hKey = `improv_hint_${h.id}_${currentVoiceVi}_vi`;
        return !t || Boolean((h.audioUrlVi && h.audioUrlVi !== 'cached' && (h.audioUrlVi.startsWith('http') || h.audioUrlVi.startsWith('data:'))) || audioPlayer.getCachedAudio(hKey, currentVoiceVi) || (t && (audioPlayer.getCachedAudio(t, currentVoiceVi) || audioPlayer.isChunkCached(t, currentVoiceVi))));
      }))
    );
    // Item is ready if both EN and VI are ready (or if in EN_ONLY, isEn, but generally both for dual syllabus)
    return { en: isEn, vi: isVi, ready: isEn && isVi };
  }, [currentVoiceEn, currentVoiceVi]);

  // All items within active session / package scope (before search and audioFilter)
  const sessionScopeItems = useMemo(() => {
    if (!activePackage) return [];
    if (activeSessionTab === 'all') {
      const items: ImprovItem[] = [];
      activePackage.sessions.forEach(s => items.push(...s.items));
      return items;
    }
    const session = activePackage.sessions.find(s => s.sessionNumber === activeSessionTab);
    return session ? session.items : [];
  }, [activePackage, activeSessionTab]);

  // Readiness counts within current session / package scope
  const audioCounts = useMemo(() => {
    const allCount = sessionScopeItems.length;
    let readyCount = 0;
    let missingCount = 0;
    for (const item of sessionScopeItems) {
      if (checkItemReadiness(item).ready) {
        readyCount++;
      } else {
        missingCount++;
      }
    }
    return { allCount, readyCount, missingCount };
  }, [sessionScopeItems, checkItemReadiness, synthesizingItemIds, batchCompleted]);

  // Missing items formatted for prepareCustomItemsAudio
  const missingItemsToProcess = useMemo(() => {
    if (!activePackage) return [];
    const missing: { item: ImprovItem; sessionNum: number }[] = [];
    if (activeSessionTab === 'all') {
      activePackage.sessions.forEach(s => {
        s.items.forEach(it => {
          if (!checkItemReadiness(it).ready) {
            missing.push({ item: it, sessionNum: s.sessionNumber });
          }
        });
      });
    } else {
      const session = activePackage.sessions.find(s => s.sessionNumber === activeSessionTab);
      if (session) {
        session.items.forEach(it => {
          if (!checkItemReadiness(it).ready) {
            missing.push({ item: it, sessionNum: session.sessionNumber });
          }
        });
      }
    }
    return missing;
  }, [activePackage, activeSessionTab, checkItemReadiness, synthesizingItemIds, batchCompleted]);

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

    if (audioFilter === 'ready') {
      items = items.filter(it => checkItemReadiness(it).ready);
    } else if (audioFilter === 'missing') {
      items = items.filter(it => !checkItemReadiness(it).ready);
    }

    return items;
  }, [activePackage, activeSessionTab, searchQuery, audioFilter, checkItemReadiness, synthesizingItemIds, batchCompleted]);

  // --------------------------------------------------------------------------
  // Pagination & Chunked Display Calculations (15 - 20 items per page)
  // --------------------------------------------------------------------------
  const totalFilteredCount = filteredItems.length;
  const effectivePageSize = pageSize === 'all' ? (totalFilteredCount || 1) : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / effectivePageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedItems = useMemo(() => {
    if (pageSize === 'all') return filteredItems;
    const start = (safeCurrentPage - 1) * effectivePageSize;
    return filteredItems.slice(start, start + effectivePageSize);
  }, [filteredItems, pageSize, safeCurrentPage, effectivePageSize]);

  const startDisplayIdx = totalFilteredCount === 0 ? 0 : (safeCurrentPage - 1) * effectivePageSize + 1;
  const endDisplayIdx = pageSize === 'all' ? totalFilteredCount : Math.min(safeCurrentPage * effectivePageSize, totalFilteredCount);

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
        const readiness = checkItemReadiness(it);
        if (readiness.en || readiness.vi) {
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
  }, [activePackage, synthesizingItemIds, checkItemReadiness, batchCompleted]);

  // --------------------------------------------------------------------------
  // 2. Audio Playback with 1-Second Pause Sequence (EN / VI)
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
    const rawVoiceEn = voiceEnOverride || itemVoiceEn[item.id] || currentVoiceEn;
    const effectiveVoiceEn = (rawVoiceEn && rawVoiceEn !== 'aura-theia-en') ? rawVoiceEn : 'flux-cliff-en';
    const effectiveVoiceVi = voiceViOverride || itemVoiceVi[item.id] || currentVoiceVi;
    setSynthesizingItemIds(prev => ({ ...prev, [item.id]: true }));
    try {
      let base64En = '';
      let base64Vi = '';
      if (target === 'en' || target === 'both') {
        base64En = await synthesizeItemCombinedAudio(item, effectiveVoiceEn, effectiveVoiceVi, 'EN_ONLY', true);
      }
      if (target === 'vi' || target === 'both') {
        base64Vi = await synthesizeItemCombinedAudio(item, effectiveVoiceEn, effectiveVoiceVi, 'VI_ONLY', true);
      }

      // Check if base64 audio exists and upload to Cloud Storage
      if (activePackage) {
        let hasCloudUpdates = false;
        const updatedItem: ImprovItem = {
          ...item,
          hints: item.hints ? item.hints.map(h => ({ ...h })) : []
        };

        // 1. Upload EN combined audio and hint audios to Cloud Storage
        if (target === 'en' || target === 'both') {
          const kEn = `improv_item_${item.id}_${effectiveVoiceEn}_${effectiveVoiceVi}_EN_ONLY`;
          const base64ToUploadEn = base64En || await audioPlayer.getCachedAudioAsync(kEn);
          if (base64ToUploadEn) {
            try {
              const gcsUrl = await uploadImprovBase64AudioToGcs({
                base64Audio: base64ToUploadEn,
                pkgId: activePackage.id,
                id: item.id,
                lang: 'en',
                isHint: false
              });
              item.audioUrl = gcsUrl;
              updatedItem.audioUrl = gcsUrl;
              hasCloudUpdates = true;
              await saveImprovPackage(activePackage);
            } catch (uploadErr) {
              console.warn('[ImprovManagerView] Upload synthesized item to GCS failed:', uploadErr);
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
                  const matchingHint = item.hints?.find(mh => mh.id === h.id);
                  if (matchingHint) matchingHint.audioUrl = gcsHintUrlEn;
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
          const base64ToUploadVi = base64Vi || await audioPlayer.getCachedAudioAsync(kVi);
          if (base64ToUploadVi) {
            try {
              const gcsUrlVi = await uploadImprovBase64AudioToGcs({
                base64Audio: base64ToUploadVi,
                pkgId: activePackage.id,
                id: item.id,
                lang: 'vi',
                isHint: false
              });
              item.audioUrlVi = gcsUrlVi;
              updatedItem.audioUrlVi = gcsUrlVi;
              hasCloudUpdates = true;
              await saveImprovPackage(activePackage);
            } catch (uploadErr) {
              console.warn('[ImprovManagerView] Upload synthesized item VI to GCS failed:', uploadErr);
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
                  const matchingHint = item.hints?.find(mh => mh.id === h.id);
                  if (matchingHint) matchingHint.audioUrlVi = gcsHintUrlVi;
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
      const rawVoice = voiceOverride || (lang === 'vi' ? (itemVoiceVi[item.id] || currentVoiceVi) : (itemVoiceEn[item.id] || currentVoiceEn));
      const effectiveVoice = (rawVoice && rawVoice !== 'aura-theia-en') ? rawVoice : (lang === 'vi' ? 'vi-VN-Neural2-A' : 'flux-cliff-en');
      const base64 = await synthesizeSingleHintAudio(hint, lang, effectiveVoice, true);

      let gcsUrl = '';
      try {
        gcsUrl = await uploadImprovBase64AudioToGcs({
          base64Audio: base64,
          pkgId: activePackage.id,
          id: hint.id,
          lang: lang === 'vi' ? 'vi' : 'en',
          isHint: true
        });
        if (lang === 'vi') {
          hint.audioUrlVi = gcsUrl;
        } else {
          hint.audioUrl = gcsUrl;
        }
        await saveImprovPackage(activePackage);
      } catch (uploadErr) {
        console.warn('[ImprovManagerView] Upload regenerated hint to GCS failed:', uploadErr);
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

  // Named aliases matching specification requirements
  const handleRegenerateSingleHint = handleSynthesizeSingleHint;
  const handleSynthesizeSingleItemAudio = handleSynthesizeSingleItem;

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

  // Toggle selection for all items on current page
  const handleToggleSelectPage = () => {
    const pageIds = paginatedItems.map(it => it.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedItemIds.includes(id));
    if (allPageSelected) {
      setSelectedItemIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedItemIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // Number of selected items on current page
  const selectedOnPageCount = useMemo(() => {
    return paginatedItems.filter(it => selectedItemIds.includes(it.id)).length;
  }, [paginatedItems, selectedItemIds]);

  // Select all items in the entire filtered list
  const handleSelectAllFiltered = () => {
    setSelectedItemIds(filteredItems.map(it => it.id));
  };

  // Select all items that are missing audio in current filtered view (or scope)
  const handleSelectAllMissing = () => {
    const missingInFiltered = filteredItems.filter(it => !checkItemReadiness(it).ready);
    const missingIds = missingInFiltered.map(it => it.id);
    if (missingIds.length === 0) return;
    const allMissingSelected = missingIds.every(id => selectedItemIds.includes(id));
    if (allMissingSelected) {
      setSelectedItemIds(prev => prev.filter(id => !missingIds.includes(id)));
    } else {
      setSelectedItemIds(Array.from(new Set([...selectedItemIds, ...missingIds])));
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

  // Reset / Clear Audio URLs from package / session
  const handleResetPackageAudioUrls = async (targetSessionNum?: number) => {
    if (!activePackage) return;
    const isSessionSpecific = typeof targetSessionNum === 'number';
    const scopeLabel = isSessionSpecific ? `Session ${targetSessionNum}` : `toàn bộ Package "${activePackage.title}"`;
    const confirmMsg = `Bạn có chắc chắn muốn xóa toàn bộ liên kết audio Cloud Storage của ${scopeLabel} không?\n\nToàn bộ liên kết audioUrl và audioUrlVi của các câu (items) và gợi ý (hints) sẽ được đặt lại về null để bạn tạo lại từ đầu.`;
    if (!window.confirm(confirmMsg)) return;

    setIsResettingAudio(true);
    try {
      const updatedSessions = activePackage.sessions.map(s => {
        if (isSessionSpecific && s.sessionNumber !== targetSessionNum) {
          return s;
        }
        return {
          ...s,
          items: s.items.map(it => ({
            ...it,
            audioUrl: null as any,
            audioUrlVi: null as any,
            hints: (it.hints || []).map(h => ({
              ...h,
              audioUrl: null as any,
              audioUrlVi: null as any
            }))
          }))
        };
      });

      const updatedPkg: ImprovPackage = {
        ...activePackage,
        sessions: updatedSessions,
        updatedAt: new Date().toISOString()
      };

      await saveImprovPackage(updatedPkg);
      setPackages(prev => prev.map(p => p.id === updatedPkg.id ? updatedPkg : p));
      setActivePackageId(updatedPkg.id);
      alert(`Đã xóa sạch link audio cho ${scopeLabel}!`);
    } catch (err: any) {
      console.error('Reset improv audio error:', err);
      alert(`Lỗi khi xóa link audio: ${err?.message || err}`);
    } finally {
      setIsResettingAudio(false);
    }
  };

  // --------------------------------------------------------------------------
  // 4. Batch Audio Generator (Package or Session Scope, EN, VI, or BOTH)
  // --------------------------------------------------------------------------

  const handleStartBatchAudioGeneration = async (overrideScope?: 'package' | 'session' | 'missing' | 'failed') => {
    if (!activePackage) return;
    const currentScope = overrideScope || batchScope;
    setIsBatchRunning(true);
    setBatchCompleted(false);
    setCloudSyncSummary(null);
    cancelBatchAudioRef.current = false;
    setBatchLogs([]);
    setBatchErrors([]);

    const addLog = (msg: string) => {
      const time = new Date().toLocaleTimeString('vi-VN');
      setBatchLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 100)]);
    };

    const targetSession = currentScope === 'session'
      ? activePackage.sessions.find(s => s.sessionNumber === batchSessionNum)
      : null;

    let scopeLabel = `Toàn bộ Package (${stats.totalItems} câu)`;
    if (currentScope === 'session' && targetSession) {
      scopeLabel = `Session ${batchSessionNum} (${targetSession.items.length} câu)`;
    } else if (currentScope === 'missing') {
      scopeLabel = `Các câu còn thiếu Audio (${missingItemsToProcess.length} câu)`;
    } else if (currentScope === 'failed') {
      const errorsSource = lastFailedErrors.length > 0 ? lastFailedErrors : batchErrors;
      scopeLabel = `Các câu vừa bị lỗi (${errorsSource.length} câu)`;
    }

    const effectiveForceOverwrite = currentScope === 'failed' ? true : forceOverwrite;

    addLog(`Khởi động bộ tổng hợp âm thanh cho ${scopeLabel} (${batchWorkersCount} workers, Target: ${batchTargetLang.toUpperCase()}, EN: ${batchVoiceEn}, VI: ${batchVoiceVi}, Overwrite: ${effectiveForceOverwrite})...`);

    try {
      const langModeToUse = batchTargetLang === 'vi' ? 'VI_ONLY' : batchTargetLang === 'both' ? 'EN_THEN_VI' : 'EN_ONLY';
      const batchOptions = {
        voiceEn: batchVoiceEn,
        voiceVi: batchVoiceVi,
        target: batchTargetLang === 'en' ? ('ENGLISH' as const) : batchTargetLang === 'vi' ? ('VIETNAMESE' as const) : ('BOTH' as const),
        langMode: langModeToUse,
        concurrency: batchWorkersCount,
        forceRegenerate: effectiveForceOverwrite
      };

      const handleProgress = (progress: ImprovBatchProgress) => {
        setBatchProgress({
          current: progress.current,
          total: progress.total,
          prepared: progress.prepared,
          skipped: progress.skipped,
          failed: progress.failed,
          statusText: progress.statusText
        });
        if (progress.errors) {
          setBatchErrors(progress.errors);
        }
        addLog(progress.statusText);
      };

      let finalErrors: ImprovBatchError[] = [];

      if (currentScope === 'session' && targetSession) {
        const res = await prepareSessionAudio(targetSession, batchOptions, handleProgress);
        finalErrors = res.errors;
        setBatchErrors(res.errors);
      } else if (currentScope === 'missing') {
        const res = await prepareCustomItemsAudio(missingItemsToProcess, batchOptions, handleProgress);
        finalErrors = res.errors;
        setBatchErrors(res.errors);
      } else if (currentScope === 'failed') {
        const errorsSource = lastFailedErrors.length > 0 ? lastFailedErrors : batchErrors;
        const failedItemIds = new Set(errorsSource.map(e => e.itemId));
        const failedItems: { item: ImprovItem; sessionNum: number }[] = [];
        activePackage.sessions.forEach(s => {
          s.items.forEach(it => {
            if (failedItemIds.has(it.id)) {
              failedItems.push({ item: it, sessionNum: s.sessionNumber });
            }
          });
        });
        const res = await prepareCustomItemsAudio(failedItems, { ...batchOptions, forceRegenerate: true }, handleProgress);
        finalErrors = res.errors;
        setBatchErrors(res.errors);
      } else {
        const res = await preparePackageAudio(activePackage, batchOptions, handleProgress);
        finalErrors = res.errors;
        setBatchErrors(res.errors);
      }

      if (finalErrors.length > 0) {
        setLastFailedErrors(finalErrors);
      } else if (currentScope === 'failed') {
        setLastFailedErrors([]);
      }

      addLog(`Hoàn tất xử lý âm thanh cho ${scopeLabel} (${finalErrors.length === 0 ? 'Thành công 100%' : `${finalErrors.length} lỗi`})!`);

      if (finalErrors.length === 0) {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      }

      addLog('Đang đồng bộ audio lên Cloud Storage bucket gs://chunks-voicecloning-genshai.firebasestorage.app...');
      try {
        const syncRes = await syncImprovPackageCachedAudioToCloud(activePackage, {
          voiceEn: batchVoiceEn,
          voiceVi: batchVoiceVi,
          targetLang: batchTargetLang,
          forceOverwrite: forceOverwrite,
          onProgress: (_c, _t, status) => addLog(`[Cloud Sync] ${status}`)
        });
        setCloudSyncSummary({
          uploadedItemsEn: syncRes.uploadedItemsEn,
          uploadedItemsVi: syncRes.uploadedItemsVi,
          uploadedHints: syncRes.uploadedHints
        });
        addLog(`Đồng bộ Cloud Storage thành công: ${syncRes.uploadedItemsEn} items EN, ${syncRes.uploadedItemsVi} items VI, ${syncRes.uploadedHints} hints.`);
        // Refresh packages state
        const latestPackages = await getAllImprovPackages();
        setPackages(latestPackages);
      } catch (syncErr: any) {
        const errMsg = syncErr?.message || String(syncErr);
        setCloudSyncSummary({
          uploadedItemsEn: 0,
          uploadedItemsVi: 0,
          uploadedHints: 0,
          error: errMsg
        });
        addLog(`Lưu ý: Không thể tự động đồng bộ lên Cloud Storage: ${errMsg}`);
      }
    } catch (err: any) {
      addLog(`Lỗi batch audio: ${err?.message || 'Không xác định'}`);
    } finally {
      setIsBatchRunning(false);
      setBatchCompleted(true);
    }
  };

  const handleRetryFailedAudio = async () => {
    setBatchScope('failed');
    await handleStartBatchAudioGeneration('failed');
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

    setGenError(null);
    setIsGenerating(true);
    setGenLogs([]);
    setGenBatchesStatus([]);
    setGenCompletionSummary(null);
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
      const createdPkg = await generateImprovPackage(
        {
          packageTitle: genTitle,
          packageDescription: genDescription,
          difficulty: genDifficulty,
          relevance: genRelevance,
          totalItems: genTotalItems,
          sessionsCount: genSessionsCount,
          sessionsConfig: genSessionConfigs,
          sourceLevel: genSourceLevel,
          sourceLessonIds: genSelectedLessonIds,
          selectedVocabIds: genSelectedVocabIds,
          llmConfig: {
            provider: genProvider,
            endpoint: genEndpoint,
            apiKey: genApiKey,
            model: genModel,
            masterPrompt: genMasterPrompt,
            temperature: 0.7,
            maxTokens: 16384
          }
        },
        (percent, total, message, detail) => {
          setGenProgress({
            percent,
            current: Math.round((percent / 100) * genTotalItems),
            total: genTotalItems,
            message
          });
          if (detail?.batches) {
            setGenBatchesStatus(detail.batches);
          }
          addGenLog('info', message);
        },
        abortController.signal
      );

      setPackages(prev => [createdPkg, ...prev.filter(p => p.id !== createdPkg.id)]);
      setActivePackageId(createdPkg.id);
      setActiveSessionTab('all');
      setViewMode('table');
      setGenProgress({ percent: 100, current: createdPkg.totalItems, total: createdPkg.totalItems, message: 'Hoàn tất sinh Package thành công!' });
      addGenLog('success', `Đã lưu Package "${createdPkg.title}" với ${createdPkg.totalItems} items!`);
      setGenError(null);

      // Record completion summary
      setGenCompletionSummary(prev => ({
        title: createdPkg.title,
        totalItems: createdPkg.totalItems,
        sessionsCount: createdPkg.sessionsCount,
        level: String(genSourceLevel),
        difficulty: genDifficulty,
        relevance: genRelevance,
        successBatches: prev?.successBatches || createdPkg.sessionsCount,
        failedBatches: prev?.failedBatches || 0
      }));

      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
    } catch (err: any) {
      if (abortController.signal.aborted) {
        addGenLog('warning', 'Quá trình sinh dữ liệu đã bị người dùng hủy.');
        return;
      }
      const errMsg = err?.message || 'Lỗi không xác định trong quá trình sinh AI';
      setGenError(errMsg);
      addGenLog('error', `Thất bại: ${errMsg}`);
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
  // 6b. Rename Package
  // --------------------------------------------------------------------------
  const handleOpenRenameModal = () => {
    if (!activePackage) return;
    setRenameTitle(activePackage.title || '');
    setRenameDescription(activePackage.description || '');
    setIsRenameModalOpen(true);
  };

  const handleSaveRename = async () => {
    if (!activePackage) return;
    const trimmedTitle = renameTitle.trim();
    if (!trimmedTitle) {
      alert('Vui lòng nhập tên gói bài tập (Package Title)');
      return;
    }

    setIsSavingRename(true);
    try {
      await updateImprovPackageMetadata(activePackage.id, {
        title: trimmedTitle,
        description: renameDescription.trim()
      });

      // Update in-memory state
      setPackages(prev => prev.map(p => {
        if (p.id === activePackage.id) {
          return {
            ...p,
            title: trimmedTitle,
            description: renameDescription.trim(),
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      }));

      setIsRenameModalOpen(false);
      setRenameSuccessToast(`Đã đổi tên package thành "${trimmedTitle}"`);
      setTimeout(() => {
        setRenameSuccessToast(null);
      }, 4000);
    } catch (err: any) {
      console.error('[handleSaveRename] Error updating package metadata:', err);
      alert(`Lỗi khi lưu đổi tên gói bài tập: ${err?.message || 'Không xác định'}`);
    } finally {
      setIsSavingRename(false);
    }
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

  const targetSessionNumForBtn = activeSessionTab !== 'all' ? activeSessionTab : (batchSessionNum || 1);
  const targetSessionObjForBtn = activePackage?.sessions.find(s => s.sessionNumber === targetSessionNumForBtn);
  const sessionCountForBtn = targetSessionObjForBtn?.items.length || 0;
  const failedCountForBtn = (lastFailedErrors.length > 0 ? lastFailedErrors : batchErrors).length;

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
              <div className="relative mt-1 flex items-center gap-1.5">
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
                <button
                  type="button"
                  onClick={handleOpenRenameModal}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer shrink-0"
                  title="Đổi tên & mô tả gói bài tập này"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Primary Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
            {/* Quick View Controls: Fullscreen & Theme */}
            <div className="flex items-center p-0.5 bg-zinc-100 rounded-xl border border-zinc-200">
              <button onClick={toggleFullscreen} className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-white transition-all cursor-pointer" title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}>
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button onClick={toggleDarkMode} className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-white transition-all cursor-pointer" title={isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'}>
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
              </button>
            </div>

            {/* Create New Package AI */}
            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
              title="Tạo Package Mới với AI Generator"
            >
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Tạo Package AI</span>
            </button>

            {/* Rename Package */}
            <button
              onClick={handleOpenRenameModal}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-[#E8E8EC] hover:border-zinc-300 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 bg-white active:scale-95 transition-all cursor-pointer shadow-2xs"
              title="Đổi tên & mô tả Package hiện tại"
            >
              <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">Đổi Tên</span>
            </button>

            {/* Import / Export Excel */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-[#E8E8EC] hover:border-zinc-300 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 bg-white active:scale-95 transition-all cursor-pointer shadow-2xs"
                title="Import danh sách từ Excel"
              >
                <Upload className="w-3.5 h-3.5 text-zinc-500" />
                <span className="hidden sm:inline">Import</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-[#E8E8EC] hover:border-zinc-300 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 bg-white active:scale-95 transition-all cursor-pointer shadow-2xs"
                title="Export danh sách ra file Excel"
              >
                <Download className="w-3.5 h-3.5 text-zinc-500" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>

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
              onClick={() => {
                if (activeSessionTab !== 'all') {
                  setBatchScope('session');
                  setBatchSessionNum(activeSessionTab);
                } else {
                  setBatchScope('package');
                }
                setBatchCompleted(false);
                setBatchErrors([]);
                setCloudSyncSummary(null);
                setIsBatchAudioModalOpen(true);
              }}
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
            {/* Session Dropdown Selector & Segmented Audio Filter */}
            <div className="flex items-center gap-2.5 flex-wrap">
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

              {/* Segmented Audio Readiness Filter */}
              <div className="flex items-center p-0.5 bg-zinc-100 rounded-xl border border-zinc-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAudioFilter('all')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    audioFilter === 'all'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                  title="Hiển thị tất cả câu"
                >
                  <span>🔘 Tất Cả ({audioCounts.allCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAudioFilter('ready')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    audioFilter === 'ready'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-zinc-600 hover:text-emerald-700'
                  }`}
                  title="Chỉ hiển thị các câu đã có đủ audio EN & VI"
                >
                  <span>🟢 Đã Có Audio ({audioCounts.readyCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAudioFilter('missing')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    audioFilter === 'missing'
                      ? 'bg-white text-red-600 shadow-xs'
                      : 'text-zinc-600 hover:text-red-600'
                  }`}
                  title="Chỉ hiển thị các câu chưa có hoặc thiếu audio"
                >
                  <span>🔴 Chưa Có Audio ({audioCounts.missingCount})</span>
                </button>
              </div>
            </div>

            {/* Quick Controls: View Switcher, Add Item, Subtitle Toggle & Batch Audio Trigger */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* View Mode Toggle */}
              <div className="flex items-center p-0.5 bg-zinc-100 rounded-xl border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-[#DC2626] shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                  title="Chế độ xem bảng danh sách chi tiết"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Bảng</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'cards' ? 'bg-white text-[#DC2626] shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                  title="Chế độ xem dạng thẻ dòng chảy"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Thẻ</span>
                </button>
              </div>

              {/* Subtitle Toggle */}
              <button
                type="button"
                onClick={() => setShowVietnamese(!showVietnamese)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  showVietnamese ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                }`}
                title="Bật/Tắt hiển thị nghĩa tiếng Việt"
              >
                {showVietnamese ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">{showVietnamese ? 'Hiện VI' : 'Ẩn VI'}</span>
              </button>

              {/* Cloud Sync */}
              <button
                type="button"
                disabled={isSyncingToCloud || isBatchRunning || !activePackage}
                onClick={handleSyncActivePackageToCloud}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                title="Tải toàn bộ audio Improv đã có trong cache trình duyệt lên Cloud Storage bucket gs://chunks-voicecloning-genshai.firebasestorage.app để dùng vĩnh viễn"
              >
                <CloudUpload className={`w-3.5 h-3.5 ${isSyncingToCloud ? 'animate-bounce' : ''}`} />
                <span>{isSyncingToCloud ? (cloudSyncProgress || 'Đang sync...') : 'Sync Cloud'}</span>
              </button>

              {/* Quick Session Audio Generator */}
              {activeSessionTab !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    setBatchScope('session');
                    setBatchSessionNum(activeSessionTab);
                    setBatchCompleted(false);
                    setBatchErrors([]);
                    setCloudSyncSummary(null);
                    setIsBatchAudioModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold shadow-2xs cursor-pointer transition-all"
                  title={`Tạo âm thanh hàng loạt cho riêng Session ${activeSessionTab}`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tạo Audio Session {activeSessionTab}</span>
                </button>
              )}

              {/* Batch TTS */}
              <button
                type="button"
                onClick={() => {
                  if (activeSessionTab !== 'all') {
                    setBatchScope('session');
                    setBatchSessionNum(activeSessionTab);
                  } else {
                    setBatchScope('package');
                  }
                  setBatchCompleted(false);
                  setBatchErrors([]);
                  setCloudSyncSummary(null);
                  setIsBatchAudioModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                title="Tạo âm thanh hàng loạt cho Session / Package"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Batch TTS</span>
              </button>

              {/* Reset Audio URLs */}
              <button
                type="button"
                disabled={isBatchRunning || isResettingAudio || !activePackage}
                onClick={() => handleResetPackageAudioUrls(activeSessionTab === 'all' ? undefined : activeSessionTab)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold shadow-2xs cursor-pointer transition-all disabled:opacity-50"
                title="Xóa link audio đã có để tạo lại từ đầu"
              >
                {isResettingAudio ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-600" /> : <Trash2 className="w-3.5 h-3.5 text-red-600" />}
                <span>Xóa link audio</span>
              </button>

              {/* Add Item Button */}
              <button
                type="button"
                onClick={() => handleOpenAddItemModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                title="Thêm câu hỏi mới vào session"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm Câu</span>
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

            <div className="flex items-center gap-3 flex-wrap justify-between sm:justify-end shrink-0">
              {/* Range & Total Count */}
              <span className="text-xs text-zinc-600 font-medium">
                Hiển thị <span className="font-bold text-zinc-900 font-mono">{startDisplayIdx} - {endDisplayIdx}</span> trên <span className="font-bold text-zinc-900 font-mono">{totalFilteredCount}</span> items
              </span>

              {/* Page size toggle buttons: 15 | 20 | 50 | Tất cả */}
              <div className="flex items-center p-0.5 bg-zinc-100 rounded-xl border border-zinc-200 text-xs font-semibold">
                <span className="px-2 text-[10px] uppercase font-mono text-zinc-500 font-bold hidden md:inline">Mỗi trang:</span>
                {([15, 20, 50, 'all'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setPageSize(sz)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      pageSize === sz 
                        ? 'bg-[#DC2626] text-white shadow-xs' 
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {sz === 'all' ? 'Tất cả' : `${sz}`}
                  </button>
                ))}
              </div>
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

        {/* Missing Audio Filter Banner */}
        {audioFilter === 'missing' && audioCounts.missingCount > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-red-50 border-2 border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5 text-amber-950 font-bold text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                ⚠️ Đang lọc <span className="text-[#DC2626] font-black">{audioCounts.missingCount}</span> câu chưa có âm thanh.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setBatchScope('missing');
                setBatchCompleted(false);
                setBatchErrors([]);
                setCloudSyncSummary(null);
                setIsBatchAudioModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>⚡ Tạo Audio Cho {audioCounts.missingCount} Câu Này</span>
            </button>
          </div>
        )}

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
          <div className="space-y-2">
            {/* Quick Actions Bar Above Table (Near Select-All) */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllMissing}
                  disabled={audioCounts.missingCount === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-bold text-red-700 transition-all cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Chọn tất cả các câu chưa có audio trong danh sách hiện tại"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  <span>Chọn tất cả câu thiếu audio</span>
                </button>
                {selectedItemIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedItemIds([])}
                    className="text-xs text-zinc-500 hover:text-zinc-800 underline cursor-pointer"
                  >
                    Bỏ chọn ({selectedItemIds.length})
                  </button>
                )}
                {selectedOnPageCount > 0 && selectedItemIds.length < filteredItems.length && (
                  <span className="text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 inline-flex items-center gap-1.5">
                    <span>Đã chọn <strong>{selectedOnPageCount}</strong> câu trên trang này.</span>
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="text-xs font-bold text-[#DC2626] hover:underline cursor-pointer"
                    >
                      [Chọn tất cả {filteredItems.length} câu trong danh sách]
                    </button>
                  </span>
                )}
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                {selectedItemIds.length > 0 ? `Đã chọn ${selectedItemIds.length} / ${filteredItems.length} items` : ''}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8E8EC] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-100/80 text-zinc-600 font-mono text-[10px] uppercase border-b border-zinc-200">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={paginatedItems.length > 0 && paginatedItems.every(it => selectedItemIds.includes(it.id))}
                        onChange={handleToggleSelectPage}
                        className="rounded text-[#DC2626] focus:ring-[#DC2626] cursor-pointer"
                        title="Chọn / Bỏ chọn tất cả các câu trên trang này"
                      />
                    </th>
                    <th className="p-3.5 w-14 text-center">STT</th>
                    <th className="p-3.5 w-24 text-center">Session</th>
                    <th className="p-3.5 min-w-[280px]">Các Gợi Ý (EN & VI) & Từ Loại (Clues Stream)</th>
                    <th className="p-3.5 w-[300px] text-center">Studio Âm Thanh (Audio Studio)</th>
                    <th className="p-3.5 w-24 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paginatedItems.map((item) => {
                    const isPlayingThis = playingItemId === item.id;
                    const isSynthesizing = synthesizingItemIds[item.id] || false;
                    const isSelected = selectedItemIds.includes(item.id);
                    const isAudioEnReady = Boolean(
                      (item.audioUrl && item.audioUrl !== 'cached' && (item.audioUrl.startsWith('http') || item.audioUrl.startsWith('data:'))) ||
                      audioPlayer.getCachedAudio(`improv_item_${item.id}_${currentVoiceEn}_${currentVoiceVi}_EN_ONLY`, currentVoiceEn) ||
                      audioPlayer.getCachedAudio(`improv_item_${item.id}_${currentVoiceEn}_${currentVoiceVi}_EN_THEN_VI`, currentVoiceEn) ||
                      (item.hints && item.hints.length > 0 && item.hints.every(h => {
                        const t = h.text?.trim();
                        const hKey = `improv_hint_${h.id}_${currentVoiceEn}_en`;
                        return !t || Boolean((h.audioUrl && h.audioUrl !== 'cached' && (h.audioUrl.startsWith('http') || h.audioUrl.startsWith('data:'))) || audioPlayer.getCachedAudio(hKey, currentVoiceEn) || audioPlayer.getCachedAudio(t, currentVoiceEn) || audioPlayer.isChunkCached(t, currentVoiceEn));
                      }))
                    );
                    const isAudioViReady = Boolean(
                      (item.audioUrlVi && item.audioUrlVi !== 'cached' && (item.audioUrlVi.startsWith('http') || item.audioUrlVi.startsWith('data:'))) ||
                      audioPlayer.getCachedAudio(`improv_item_${item.id}_${currentVoiceEn}_${currentVoiceVi}_VI_ONLY`, currentVoiceVi) ||
                      audioPlayer.getCachedAudio(`improv_item_${item.id}_${currentVoiceEn}_${currentVoiceVi}_EN_THEN_VI`, currentVoiceVi) ||
                      (item.hints && item.hints.length > 0 && item.hints.every(h => {
                        const t = (h.translation || '').trim();
                        const hKey = `improv_hint_${h.id}_${currentVoiceVi}_vi`;
                        return !t || Boolean((h.audioUrlVi && h.audioUrlVi !== 'cached' && (h.audioUrlVi.startsWith('http') || h.audioUrlVi.startsWith('data:'))) || audioPlayer.getCachedAudio(hKey, currentVoiceVi) || audioPlayer.getCachedAudio(t, currentVoiceVi) || audioPlayer.isChunkCached(t, currentVoiceVi));
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
                          <td className="p-3.5 text-center">
                            <div className="flex flex-col items-center gap-0.5">
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
                                const { en: hintEn, vi: hintVi } = getHintLanguagePair(hint);

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
                                      <div className="font-bold text-zinc-900 text-xs leading-snug flex items-start gap-1">
                                        <span className="text-[9px] font-mono font-extrabold text-zinc-400 bg-zinc-100 px-1 py-0.2 rounded shrink-0 mt-0.5">EN</span>
                                        <span className="text-zinc-900 font-bold">{hintEn || hint.text}</span>
                                      </div>
                                      {showVietnamese && (hintVi || hint.translation) && (
                                        <div className="text-[11px] text-zinc-700 font-medium mt-1 leading-tight flex items-start gap-1">
                                          <span className="text-[9px] font-mono font-extrabold text-blue-700 bg-blue-50 px-1 py-0.2 rounded shrink-0 mt-0.5">VI</span>
                                          <span className="text-zinc-700">{hintVi || hint.translation}</span>
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

                          {/* Studio Âm Thanh Column */}
                          <td className="p-3.5">
                            <div className="flex flex-col gap-1.5">
                              {/* Row 1: English Audio Controls */}
                              <div className="flex items-center justify-between gap-1.5 p-1 px-2 rounded-lg bg-zinc-50 border border-zinc-200/80">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${isAudioEnReady ? 'bg-emerald-500 shadow-xs' : 'bg-zinc-300'}`} />
                                  <span className="text-[11px] font-bold font-mono text-zinc-700">EN</span>
                                  <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold ${
                                    item.audioUrl && item.audioUrl.startsWith('http')
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : isAudioEnReady
                                      ? 'bg-zinc-200 text-zinc-700'
                                      : 'text-zinc-400'
                                  }`}>
                                    {item.audioUrl && item.audioUrl.startsWith('http') ? 'GCS' : isAudioEnReady ? 'Cache' : 'Chưa có'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handlePlayItemWithPause(item, 'en')}
                                    className={`px-2 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                      isPlayingThis && playingLang === 'en'
                                        ? 'bg-zinc-900 text-white border-zinc-900'
                                        : 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-200 shadow-2xs'
                                    }`}
                                    title="Nghe tiếng Anh kèm khoảng nghỉ 1s"
                                  >
                                    <Play className="w-3 h-3 text-[#DC2626] fill-current" />
                                    <span>Nghe</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSynthesizeSingleItem(item, 'en')}
                                    disabled={isSynthesizing}
                                    className="px-2 py-1 rounded-md bg-red-50 hover:bg-red-100 text-[#DC2626] border border-red-200 text-[11px] font-bold cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1 shadow-2xs"
                                    title="Tạo / tạo lại audio EN (GCS Cloud)"
                                  >
                                    {isSynthesizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                    <span>Tạo</span>
                                  </button>
                                </div>
                              </div>

                              {/* Row 2: Vietnamese Audio Controls + Both Button */}
                              <div className="flex items-center justify-between gap-1.5 p-1 px-2 rounded-lg bg-zinc-50 border border-zinc-200/80">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${isAudioViReady ? 'bg-blue-500 shadow-xs' : 'bg-zinc-300'}`} />
                                  <span className="text-[11px] font-bold font-mono text-zinc-700">VI</span>
                                  <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold ${
                                    item.audioUrlVi && item.audioUrlVi.startsWith('http')
                                      ? 'bg-blue-100 text-blue-800'
                                      : isAudioViReady
                                      ? 'bg-zinc-200 text-zinc-700'
                                      : 'text-zinc-400'
                                  }`}>
                                    {item.audioUrlVi && item.audioUrlVi.startsWith('http') ? 'GCS' : isAudioViReady ? 'Cache' : 'Chưa có'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handlePlayItemWithPause(item, 'vi')}
                                    className={`px-2 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                      isPlayingThis && playingLang === 'vi'
                                        ? 'bg-zinc-900 text-white border-zinc-900'
                                        : 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-200 shadow-2xs'
                                    }`}
                                    title="Nghe tiếng Việt chuẩn Google TTS kèm khoảng nghỉ 1s"
                                  >
                                    <Play className="w-3 h-3 text-blue-600 fill-current" />
                                    <span>Nghe</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSynthesizeSingleItem(item, 'vi')}
                                    disabled={isSynthesizing}
                                    className="px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1 shadow-2xs"
                                    title="Tạo / tạo lại audio VI (GCS Cloud)"
                                  >
                                    {isSynthesizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                    <span>Tạo</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSynthesizeSingleItem(item, 'both')}
                                    disabled={isSynthesizing}
                                    className="px-2 py-1 rounded-md bg-zinc-900 hover:bg-black text-white text-[11px] font-bold cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1 shadow-2xs"
                                    title="Tạo cả 2 ngôn ngữ EN & VI"
                                  >
                                    <RefreshCw className="w-2.5 h-2.5" />
                                    <span>Cả 2</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Thao Tác Column */}
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Voice Model Selector Toggle */}
                              <button
                                type="button"
                                onClick={() => setExpandedItemVoiceConfig(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                                  expandedItemVoiceConfig[item.id]
                                    ? 'bg-red-50 border-red-300 text-[#DC2626]'
                                    : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-600'
                                }`}
                                title="Chọn Voice Model riêng cho câu này"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </button>

                              {/* Sửa Text */}
                              <button
                                type="button"
                                onClick={() => setEditingItem(JSON.parse(JSON.stringify(item)))}
                                className="p-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 cursor-pointer transition-all shadow-2xs"
                                title="Chỉnh sửa câu"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Xóa Câu */}
                              <button
                                type="button"
                                onClick={() => setItemToDelete({
                                  sessionNumber: item.sessionNumber,
                                  itemId: item.id,
                                  itemNumber: item.itemNumber
                                })}
                                className="p-2 rounded-lg border border-zinc-200 bg-white hover:bg-red-50 text-zinc-400 hover:text-[#DC2626] hover:border-red-200 cursor-pointer transition-all shadow-2xs"
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
                                       <optgroup label="Deepgram Aura & Flux">
                                         {enVoiceOptions.filter(v => v.provider === 'DEEPGRAM' || (v.provider as any) === 'DEEPGRAM_AURA').map(v => (
                                           <option key={v.id} value={v.id}>{v.name}</option>
                                         ))}
                                       </optgroup>
                                       <optgroup label="Google Cloud, OpenAI & Custom">
                                         {enVoiceOptions.filter(v => v.provider !== 'DEEPGRAM' && (v.provider as any) !== 'DEEPGRAM_AURA').map(v => (
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
        </div>
        ) : (
          /* ================================================================ */
          /* CARDS VIEW MODE (Stream Cards Preview) */
          /* ================================================================ */
          <div className="space-y-3">
            {paginatedItems.map((item) => {
              const isPlayingThis = playingItemId === item.id;
              const isSynthesizing = synthesizingItemIds[item.id] || false;
              const isSelected = selectedItemIds.includes(item.id);
              const isAudioEnReady = Boolean(
                (item.audioUrl && item.audioUrl !== 'cached' && (item.audioUrl.startsWith('http') || item.audioUrl.startsWith('data:'))) ||
                audioPlayer.getCachedAudio(`improv_item_${item.id}_${currentVoiceEn}_${currentVoiceVi}_EN_ONLY`, currentVoiceEn) ||
                audioPlayer.getCachedAudio(`improv_item_${item.id}_${currentVoiceEn}_${currentVoiceVi}_EN_THEN_VI`, currentVoiceEn) ||
                (item.hints && item.hints.length > 0 && item.hints.every(h => {
                  const t = h.text?.trim();
                  const hKey = `improv_hint_${h.id}_${currentVoiceEn}_en`;
                  return !t || Boolean((h.audioUrl && h.audioUrl !== 'cached' && (h.audioUrl.startsWith('http') || h.audioUrl.startsWith('data:'))) || audioPlayer.getCachedAudio(hKey, currentVoiceEn) || audioPlayer.getCachedAudio(t, currentVoiceEn) || audioPlayer.isChunkCached(t, currentVoiceEn));
                }))
              );
              const isAudioViReady = Boolean(
                (item.audioUrlVi && item.audioUrlVi !== 'cached' && (item.audioUrlVi.startsWith('http') || item.audioUrlVi.startsWith('data:'))) ||
                audioPlayer.getCachedAudio(`improv_item_${item.id}_${currentVoiceEn}_${currentVoiceVi}_VI_ONLY`, currentVoiceVi) ||
                audioPlayer.getCachedAudio(`improv_item_${item.id}_${currentVoiceEn}_${currentVoiceVi}_EN_THEN_VI`, currentVoiceVi) ||
                (item.hints && item.hints.length > 0 && item.hints.every(h => {
                  const t = (h.translation || '').trim();
                  const hKey = `improv_hint_${h.id}_${currentVoiceVi}_vi`;
                  return !t || Boolean((h.audioUrlVi && h.audioUrlVi !== 'cached' && (h.audioUrlVi.startsWith('http') || h.audioUrlVi.startsWith('data:'))) || audioPlayer.getCachedAudio(hKey, currentVoiceVi) || audioPlayer.getCachedAudio(t, currentVoiceVi) || audioPlayer.isChunkCached(t, currentVoiceVi));
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
                          const { en: hintEn, vi: hintVi } = getHintLanguagePair(hint);

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
                              <div className="text-xs font-bold text-zinc-900 leading-snug line-clamp-3 mb-1 flex items-start gap-1">
                                <span className="text-[9px] font-mono font-extrabold text-zinc-400 bg-zinc-100 px-1 py-0.2 rounded shrink-0 mt-0.5">EN</span>
                                <span>{hintEn || hint.text}</span>
                              </div>

                              {/* Clue Vietnamese Meaning */}
                              {showVietnamese && (hintVi || hint.translation) && (
                                <div className="text-[11px] text-zinc-700 font-medium line-clamp-2 mt-auto pt-1 border-t border-zinc-200/80 flex items-start gap-1">
                                  <span className="text-[9px] font-mono font-extrabold text-blue-700 bg-blue-50 px-1 py-0.2 rounded shrink-0 mt-0.5">VI</span>
                                  <span>{hintVi || hint.translation}</span>
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
                    <div className="flex flex-col sm:flex-row xl:flex-col items-end gap-1.5 shrink-0 self-end xl:self-center">
                      {/* Audio Controls Group */}
                      <div className="flex items-center gap-1.5 flex-wrap justify-end p-1 rounded-xl bg-zinc-50 border border-zinc-200/80">
                        {/* EN Controls */}
                        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-zinc-200/80 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handlePlayItemWithPause(item, 'en')}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                              isPlayingThis && playingLang === 'en'
                                ? 'bg-zinc-900 text-white'
                                : 'hover:bg-zinc-100 text-zinc-800'
                            }`}
                            title="Nghe tiếng Anh kèm khoảng nghỉ 1s"
                          >
                            <Play className="w-3 h-3 text-[#DC2626] fill-current" />
                            <span>EN</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSynthesizeSingleItem(item, 'en')}
                            disabled={isSynthesizing}
                            className="p-1 px-1.5 rounded-md bg-red-50 hover:bg-red-100 text-[#DC2626] border border-red-200 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                            title="Tạo audio EN (GCS Cloud)"
                          >
                            {isSynthesizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                          </button>
                        </div>

                        {/* VI Controls */}
                        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-zinc-200/80 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handlePlayItemWithPause(item, 'vi')}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                              isPlayingThis && playingLang === 'vi'
                                ? 'bg-zinc-900 text-white'
                                : 'hover:bg-zinc-100 text-zinc-800'
                            }`}
                            title="Nghe tiếng Việt kèm khoảng nghỉ 1s"
                          >
                            <Play className="w-3 h-3 text-blue-600 fill-current" />
                            <span>VI</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSynthesizeSingleItem(item, 'vi')}
                            disabled={isSynthesizing}
                            className="p-1 px-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                            title="Tạo audio VI (GCS Cloud)"
                          >
                            {isSynthesizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                          </button>
                        </div>

                        {/* Synthesize Both */}
                        <button
                          type="button"
                          onClick={() => handleSynthesizeSingleItem(item, 'both')}
                          disabled={isSynthesizing}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                          title="Tạo cả âm thanh EN & VI mới (GCS Cloud)"
                        >
                          {isSynthesizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-2.5 h-2.5" />}
                          <span>Cả 2</span>
                        </button>
                      </div>

                      {/* Item Actions Group */}
                      <div className="flex items-center gap-1.5 justify-end">
                        {/* Voice Model Selector Toggle */}
                        <button
                          type="button"
                          onClick={() => setExpandedItemVoiceConfig(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                          className={`p-1.5 px-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 shadow-2xs ${
                            expandedItemVoiceConfig[item.id]
                              ? 'bg-red-50 border-red-300 text-[#DC2626]'
                              : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                          }`}
                          title="Chọn Voice Model riêng cho câu này"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <ChevronDown className={`w-3 h-3 transition-transform ${expandedItemVoiceConfig[item.id] ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Edit Item */}
                        <button
                          type="button"
                          onClick={() => setEditingItem(JSON.parse(JSON.stringify(item)))}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 cursor-pointer active:scale-95 transition-all shadow-2xs"
                          title="Chỉnh sửa câu"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Sửa</span>
                        </button>

                        {/* Delete Item */}
                        <button
                          type="button"
                          onClick={() => setItemToDelete({
                            sessionNumber: item.sessionNumber,
                            itemId: item.id,
                            itemNumber: item.itemNumber
                          })}
                          className="p-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-red-50 text-zinc-400 hover:text-[#DC2626] hover:border-red-200 cursor-pointer transition-all shadow-2xs"
                          title="Xóa câu này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
                            <optgroup label="Deepgram Aura & Flux">
                              {enVoiceOptions.filter(v => v.provider === 'DEEPGRAM' || (v.provider as any) === 'DEEPGRAM_AURA').map(v => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                              ))}
                            </optgroup>
                            <optgroup label="Google Cloud, OpenAI & Custom">
                              {enVoiceOptions.filter(v => v.provider !== 'DEEPGRAM' && (v.provider as any) !== 'DEEPGRAM_AURA').map(v => (
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

        {/* ================================================================== */}
        {/* PAGINATION BAR (Thanh phân trang hiệu năng cao 15-20 items) */}
        {/* ================================================================== */}
        {pageSize !== 'all' && totalPages > 1 && (
          <div className="mt-4 bg-white rounded-2xl border border-[#E8E8EC] p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Range & Page Info */}
            <div className="text-xs text-zinc-500 font-medium">
              Trang <span className="font-bold text-zinc-900 font-mono">{safeCurrentPage}</span> / <span className="font-bold text-zinc-900 font-mono">{totalPages}</span>
              <span className="mx-2 text-zinc-300">•</span>
              Hiển thị <span className="font-bold text-zinc-900 font-mono">{startDisplayIdx} - {endDisplayIdx}</span> trong tổng số <span className="font-bold text-zinc-900 font-mono">{totalFilteredCount}</span> câu
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {/* Previous Button */}
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition-all cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>

              {/* Page Number Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  if (totalPages <= 7) return true;
                  if (page === 1 || page === totalPages) return true;
                  return Math.abs(page - safeCurrentPage) <= 1;
                })
                .reduce<(number | string)[]>((acc, page, idx, arr) => {
                  if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                    acc.push(`dots-${page}`);
                  }
                  acc.push(page);
                  return acc;
                }, [])
                .map((item) => {
                  if (typeof item === 'string') {
                    return (
                      <span key={item} className="px-2 text-xs text-zinc-400 font-mono">
                        ...
                      </span>
                    );
                  }
                  const isActive = item === safeCurrentPage;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCurrentPage(item)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#DC2626] text-white shadow-xs'
                          : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 shadow-2xs'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}

              {/* Next Button */}
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition-all cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Tiếp</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-zinc-700 uppercase font-mono tracking-wider text-[10px]">
                      Tiêu Đề Package
                    </label>
                    <button
                      type="button"
                      onClick={handleRegenerateDynamicTitle}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-lg transition-all cursor-pointer shadow-2xs"
                      title="Tự động tạo lại tiêu đề và mô tả dựa trên Khóa học và Bài học đã chọn"
                    >
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      <span>Tạo lại tiêu đề tự động</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={genTitle}
                    onChange={(e) => setGenTitle(e.target.value)}
                    placeholder="VD: CHUNKS Improv - Level B ERES Speaking (Day 1)"
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
                    placeholder="VD: Bộ bài tập phản xạ ngẫu hứng CHUNKS gồm 4 sessions (50 câu) dựa trên từ vựng cốt lõi..."
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-zinc-700 uppercase font-mono tracking-wider text-[10px]">
                        Layer 1: Khóa Học (Course Level)
                      </label>
                      {isLoadingCourses && (
                        <span className="text-[10px] text-zinc-400 font-mono animate-pulse">Đang tải...</span>
                      )}
                    </div>
                    <select
                      value={genSourceLevel}
                      onChange={(e) => setGenSourceLevel(e.target.value as any)}
                      className="w-full p-2 bg-white border border-zinc-200 rounded-xl font-medium focus:ring-2 focus:ring-[#DC2626]/20 text-xs"
                    >
                      {availableCourses.length > 0 ? (
                        availableCourses.map(c => (
                          <option key={c.id || c.level_code} value={c.level_code || c.id}>
                            {c.title} ({c.level_code})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="LEVEL_A">Level A - Foundation (Days 1..15)</option>
                          <option value="LEVEL_B_EREL">Level B - EREL Listening (Days 1..15)</option>
                          <option value="LEVEL_B_ERES">Level B - ERES Speaking (Days 1..15)</option>
                        </>
                      )}
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
                        onClick={handleSelectAllLessons}
                        className="text-[#DC2626] hover:underline cursor-pointer font-bold"
                      >
                        Chọn Tất Cả Bài ({genAvailableLessons.length})
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={handleDeselectAllLessons}
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
                          onClick={() => handleToggleLessonSelection(lesson.id)}
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
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      {genProvider === 'GOOGLE_GENAI' ? 'Google Gemini' : 'Custom'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
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
                      <div className="grid grid-cols-2 gap-2">
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
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-mono">Google GenAI (Khuyên dùng)</span>
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
                          Mô hình ({genProvider === 'GOOGLE_GENAI' ? 'Google Gemini' : 'Model'})
                        </label>
                        {genProvider === 'GOOGLE_GENAI' ? (
                          <select
                            value={genModel}
                            onChange={(e) => handleAiModelChange(e.target.value)}
                            className="w-full p-2 bg-white border border-zinc-200 rounded-lg font-mono text-xs font-bold text-zinc-800 focus:outline-none focus:border-purple-500"
                          >
                            <option value="gemini-2.5-flash">gemini-2.5-flash (Khuyên dùng - Nhanh, chuẩn xác, tiết kiệm quota)</option>
                            <option value="gemini-2.5-pro">gemini-2.5-pro (Chất lượng cao - Suy luận kịch bản sâu)</option>
                            <option value="gemini-2.0-flash">gemini-2.0-flash (Độ trễ thấp - Phản hồi siêu tốc)</option>
                            <option value="gemini-1.5-flash">gemini-1.5-flash (Gemini 1.5 Flash • Hạn Mức Lớn)</option>
                            <option value="gemini-1.5-pro">gemini-1.5-pro (Gemini 1.5 Pro • Chuyên Sâu)</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={genModel}
                            onChange={(e) => handleAiModelChange(e.target.value)}
                            placeholder="e.g. gpt-4o-mini"
                            className="w-full p-2 bg-white border border-zinc-200 rounded-lg font-mono text-xs font-bold text-zinc-800"
                          />
                        )}
                      </div>

                      <div>
                        <label className="font-bold text-zinc-600 block mb-1 font-mono text-[10px]">
                          {genProvider === 'GOOGLE_GENAI' 
                            ? 'Google Gemini API Key (AIzaSy... / AQ...)' 
                            : 'API Key'}
                        </label>
                        <div className="relative">
                          <input
                            type={genShowApiKey ? 'text' : 'password'}
                            value={genApiKey}
                            onChange={(e) => handleAiApiKeyChange(e.target.value)}
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
                          onChange={(e) => handleAiEndpointChange(e.target.value)}
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

              {/* Error Banner */}
              {genError && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-red-100">Không thể hoàn tất sinh dữ liệu AI:</div>
                    <div className="font-mono text-[11px] text-red-300 break-words leading-relaxed">{genError}</div>
                  </div>
                </div>
              )}

              {/* Progress, Micro-Batches & Live Logs (when generating, error, or completed) */}
              {(isGenerating || genError || genLogs.length > 0 || genBatchesStatus.length > 0 || genCompletionSummary) && (
                <div className="p-4 bg-zinc-900 text-zinc-100 rounded-2xl border border-zinc-800 space-y-3 font-mono">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#DC2626]" />
                      ) : genError ? (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      <span className="font-bold">{genError ? 'Đã dừng do lỗi' : (genProgress.message || 'Đang sinh dữ liệu AI...')}</span>
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

                  {/* Live Micro-Batch Progress & Diagnostics Grid */}
                  {genBatchesStatus.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-zinc-800">
                      <div className="flex items-center justify-between text-[11px] text-zinc-300 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-zinc-400" />
                          Tiến Độ Từng Đợt Sinh (Micro-Batches ({genBatchesStatus.length}))
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {genBatchesStatus.filter(b => b.status === 'success').length}/{genBatchesStatus.length} Hoàn tất
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                        {genBatchesStatus.map((batch, bIdx) => {
                          const isSuccess = batch.status === 'success';
                          const isFailed = batch.status === 'failed';
                          const isBatchGen = batch.status === 'generating';
                          const isPending = batch.status === 'pending';

                          return (
                            <div
                              key={batch.batchId || `batch_${batch.sessionNumber}_${bIdx}`}
                              className={`p-2.5 rounded-xl border text-xs transition-all ${
                                isSuccess
                                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                                  : isFailed
                                  ? 'bg-red-950/40 border-red-800/60 text-red-200'
                                  : isBatchGen
                                  ? 'bg-amber-950/40 border-amber-600/70 text-amber-200 ring-1 ring-amber-500/50'
                                  : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 font-bold truncate">
                                  {isBatchGen && <Loader2 className="w-3 h-3 animate-spin text-amber-400 shrink-0" />}
                                  {isSuccess && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                                  {isFailed && <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />}
                                  {isPending && <span className="w-2 h-2 rounded-full bg-zinc-500 shrink-0 inline-block" />}
                                  <span className="truncate">
                                    S{batch.sessionNumber}: {batch.itemsRange || (batch.itemRange ? `Câu ${batch.itemRange[0]}-${batch.itemRange[1]}` : `Đợt ${bIdx + 1}`)}
                                  </span>
                                </div>
                                <div className="text-[10px] font-mono shrink-0">
                                  {batch.durationMs ? `${(batch.durationMs / 1000).toFixed(1)}s` : ''}
                                </div>
                              </div>

                              <div className="mt-1 flex items-center justify-between text-[10px] opacity-80">
                                <span>
                                  {isPending && '⚪ Chờ xử lý...'}
                                  {isBatchGen && '🟡 Đang sinh AI...'}
                                  {isSuccess && `🟢 Đã tạo ${batch.itemsCount ?? batch.count ?? 0} câu`}
                                  {isFailed && '🔴 Lỗi (Dùng Fallback)'}
                                </span>
                                {batch.modelName && (
                                  <span className="font-mono text-[9px] truncate max-w-[120px] text-zinc-400">
                                    {batch.modelName}
                                  </span>
                                )}
                              </div>

                              {batch.error && (
                                <div className="mt-1 text-[9px] text-red-300 font-mono line-clamp-2 bg-red-900/30 p-1 rounded border border-red-800/40">
                                  {batch.error}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Completion Summary Box */}
                  {genCompletionSummary && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-600/60 text-emerald-100 space-y-2 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-xs text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Sinh Dữ Liệu Package Thành Công!</span>
                        </div>
                        <span className="text-[10px] bg-emerald-800/60 px-2 py-0.5 rounded-full font-mono text-emerald-200">
                          {genCompletionSummary.totalItems} Items • {genCompletionSummary.sessionsCount} Sessions
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-300 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 font-mono">
                        <div>Tiêu đề: <span className="text-white font-bold">{genCompletionSummary.title}</span></div>
                        <div>Level: <span className="text-emerald-300 font-semibold">{genCompletionSummary.level}</span></div>
                        <div>Độ khó: <span className="text-zinc-200">{genCompletionSummary.difficulty}</span></div>
                        <div>Liên kết: <span className="text-zinc-200">{genCompletionSummary.relevance}</span></div>
                        <div className="sm:col-span-2">Kết quả micro-batches: <span className="text-emerald-400 font-bold">{genCompletionSummary.successBatches} Thành công</span> {genCompletionSummary.failedBatches > 0 && <span className="text-amber-300 font-bold">({genCompletionSummary.failedBatches} dùng fallback)</span>}</div>
                      </div>
                    </div>
                  )}

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
                    {genCompletionSummary ? (
                      <button
                        onClick={() => {
                          setIsGeneratorOpen(false);
                          setGenCompletionSummary(null);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Mở Xem Package Ngay</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleStartAiGeneration}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Bắt Đầu Sinh Dữ Liệu AI</span>
                      </button>
                    )}
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
                      Gợi ý Tiếng Anh (English Clue)
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
                      Bản dịch Tiếng Việt (Vietnamese Translation)
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
                      Gợi ý Tiếng Anh (English Clue)
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
                      Bản dịch Tiếng Việt (Vietnamese Translation)
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
      {/* 6. MODAL: BATCH AUDIO GENERATOR (PACKAGE OR SESSION SCOPE) */}
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
                    {batchScope === 'session' 
                      ? `Tổng Hợp Âm Thanh Cho Session ${batchSessionNum}` 
                      : batchScope === 'missing'
                      ? `Tổng Hợp Âm Thanh Cho ${missingItemsToProcess.length} Câu Thiếu Audio`
                      : batchScope === 'failed'
                      ? `Thử Lại Âm Thanh Cho ${(lastFailedErrors.length > 0 ? lastFailedErrors : batchErrors).length} Câu Bị Lỗi`
                      : 'Bộ Tổng Hợp Âm Thanh Toàn Diện Package'}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {batchScope === 'session'
                      ? `Tạo âm thanh chuẩn phòng học cho ${activePackage?.sessions.find(s => s.sessionNumber === batchSessionNum)?.items.length || 0} câu của Session ${batchSessionNum}.`
                      : batchScope === 'missing'
                      ? `Chỉ tập trung tạo âm thanh cho ${missingItemsToProcess.length} câu còn thiếu Audio EN & VI.`
                      : batchScope === 'failed'
                      ? `Chạy lại chế độ ép tạo mới cho ${(lastFailedErrors.length > 0 ? lastFailedErrors : batchErrors).length} câu gặp lỗi vừa qua.`
                      : `Tùy chọn mô hình giọng đọc và tạo âm thanh chất lượng cao cho toàn bộ ${stats.totalItems} câu.`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => !isBatchRunning && setIsBatchAudioModalOpen(false)}
                disabled={isBatchRunning}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* COMPLETION SUMMARY SCREEN */}
              {batchCompleted && !isBatchRunning ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                    batchErrors.length === 0
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50/80 border-amber-200 text-amber-950'
                  }`}>
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      batchErrors.length === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {batchErrors.length === 0 ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">
                          {batchErrors.length === 0 ? 'Tổng Hợp Âm Thanh Hoàn Tất 100%' : 'Hoàn Tất Với Một Số Cảnh Báo'}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                          batchErrors.length === 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                        }`}>
                          {batchErrors.length === 0 ? 'Sẵn Sàng' : `${batchErrors.length} Lỗi`}
                        </span>
                      </div>
                      <p className="text-xs mt-1 text-zinc-600 leading-relaxed">
                        {batchErrors.length === 0
                          ? `Tất cả âm thanh cho ${batchScope === 'session' ? `Session ${batchSessionNum}` : batchScope === 'missing' ? 'các câu thiếu audio' : batchScope === 'failed' ? 'các câu sửa lỗi' : 'Package'} đã sẵn sàng trong cache và Improv Stage.`
                          : `Đã hoàn thành phần lớn câu hỏi, nhưng có ${batchErrors.length} mục gặp lỗi. Bạn có thể xem chi tiết hoặc bấm thử lại bên dưới.`}
                      </p>
                    </div>
                  </div>

                  {/* Metrics Breakdown Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 text-center">
                      <div className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Đã Tạo Mới</div>
                      <div className="text-lg font-black text-emerald-600 mt-0.5">{batchProgress.prepared}</div>
                    </div>
                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 text-center">
                      <div className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Có Sẵn / Bỏ Qua</div>
                      <div className="text-lg font-black text-blue-600 mt-0.5">{batchProgress.skipped}</div>
                    </div>
                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 text-center">
                      <div className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Thất Bại</div>
                      <div className={`text-lg font-black mt-0.5 ${batchProgress.failed > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
                        {batchProgress.failed}
                      </div>
                    </div>
                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 text-center">
                      <div className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Tổng Số Câu</div>
                      <div className="text-lg font-black text-zinc-800 mt-0.5">{batchProgress.total}</div>
                    </div>
                  </div>

                  {/* Cloud Sync Status */}
                  <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/70 flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg border border-zinc-200 text-emerald-600 shrink-0">
                      <CloudUpload className="w-4 h-4" />
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-zinc-800">Đồng Bộ Cloud Storage:</div>
                      {cloudSyncSummary ? (
                        cloudSyncSummary.error ? (
                          <div className="text-red-600 text-[11px]">
                            Lưu ý: {cloudSyncSummary.error} (Audio vẫn được bảo lưu an toàn trong IndexedDB của trình duyệt).
                          </div>
                        ) : (
                          <div className="text-emerald-700 text-[11px]">
                            Đã tải lên Cloud: {cloudSyncSummary.uploadedItemsEn} items EN, {cloudSyncSummary.uploadedItemsVi} items VI, {cloudSyncSummary.uploadedHints} hints.
                          </div>
                        )
                      ) : (
                        <div className="text-zinc-500 text-[11px]">
                          Audio đã được lưu an toàn trong IndexedDB của trình duyệt.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prominent Retry Failed Action Banner */}
                  {batchProgress.failed > 0 && (
                    <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5 text-red-950 font-bold text-xs sm:text-sm">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                        <span>Có <span className="font-black text-red-700">{batchProgress.failed}</span> câu gặp lỗi trong quá trình tổng hợp.</span>
                      </div>
                      <button
                        type="button"
                        disabled={isBatchRunning}
                        onClick={() => {
                          setBatchScope('failed');
                          handleStartBatchAudioGeneration('failed');
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
                      >
                        <RefreshCw className="w-4 h-4 text-white" />
                        <span>🔁 Thử Lại Ngay {batchProgress.failed} Câu Bị Lỗi (Retry Failed)</span>
                      </button>
                    </div>
                  )}

                  {/* Error Breakdown Panel (if errors occurred) */}
                  {batchErrors.length > 0 && (
                    <div className="p-3.5 bg-red-50/70 rounded-2xl border border-red-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span>Chi tiết {batchErrors.length} mục lỗi ({batchErrors[0]?.lang?.toUpperCase() || ''}):</span>
                        </span>
                        <button
                          type="button"
                          disabled={isRetryingErrors || isBatchRunning}
                          onClick={handleRetryFailedAudio}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all disabled:opacity-50"
                        >
                          {isRetryingErrors ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          <span>Thử lại các mục lỗi</span>
                        </button>
                      </div>

                      <div className="max-h-36 overflow-y-auto space-y-1 text-[11px] font-mono text-red-800 bg-white/80 p-2.5 rounded-xl border border-red-100">
                        {batchErrors.map((err, errIdx) => (
                          <div key={errIdx} className="flex items-start gap-1.5 leading-snug">
                            <span className="text-red-500 font-bold shrink-0">•</span>
                            <span>
                              <strong>Session {err.sessionNum} - Item #{err.itemNumber}</strong> [{err.lang}]: {err.error}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Launch Improv Stage CTA */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsBatchAudioModalOpen(false);
                        onLaunchPresentation?.(
                          activePackage.id,
                          batchScope === 'session' ? batchSessionNum : (activeSessionTab !== 'all' ? activeSessionTab : undefined)
                        );
                      }}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg active:scale-98 transition-all cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Mở Improv Stage Kiểm Tra Ngay (Launch Stage)</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* CONFIGURATION AND IN-PROGRESS SCREEN */
                <>
                  {/* Scope Selection: 4 Scope Options */}
                  <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-zinc-800 text-xs">Phạm Vi Tạo Audio (Audio Scope)</div>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {batchScope === 'session'
                          ? `Session ${batchSessionNum} (${activePackage?.sessions.find(s => s.sessionNumber === batchSessionNum)?.items.length || 0} câu)`
                          : batchScope === 'missing'
                          ? `Thiếu Audio (${missingItemsToProcess.length} câu)`
                          : batchScope === 'failed'
                          ? `Lỗi vừa qua (${failedCountForBtn} câu)`
                          : `Toàn bộ ${stats.totalItems} câu (${stats.totalSessions} sessions)`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* 1. Toàn bộ Package */}
                      <button
                        type="button"
                        disabled={isBatchRunning}
                        onClick={() => setBatchScope('package')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          batchScope === 'package'
                            ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>🌐 Toàn bộ Package ({stats.totalItems} câu)</span>
                      </button>

                      {/* 2. Chỉ Session */}
                      <button
                        type="button"
                        disabled={isBatchRunning}
                        onClick={() => {
                          setBatchScope('session');
                          setBatchSessionNum(targetSessionNumForBtn);
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          batchScope === 'session'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        <Filter className="w-3.5 h-3.5" />
                        <span>📑 Chỉ Session {targetSessionNumForBtn} ({sessionCountForBtn} câu)</span>
                      </button>

                      {/* 3. Chỉ các câu còn thiếu Audio */}
                      <button
                        type="button"
                        disabled={isBatchRunning}
                        onClick={() => setBatchScope('missing')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          failedCountForBtn === 0 ? 'sm:col-span-2' : ''
                        } ${
                          batchScope === 'missing'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-50'
                        }`}
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>⚠️ Chỉ các câu còn thiếu Audio ({audioCounts.missingCount} câu)</span>
                      </button>

                      {/* 4. Chỉ các câu vừa bị lỗi (Retry Failed) */}
                      {failedCountForBtn > 0 && (
                        <button
                          type="button"
                          disabled={isBatchRunning}
                          onClick={() => setBatchScope('failed')}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            batchScope === 'failed'
                              ? 'bg-red-600 text-white border-red-600 shadow-xs'
                              : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                          }`}
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-red-600" />
                          <span>🔁 Chỉ các câu vừa bị lỗi (Retry Failed: {failedCountForBtn} câu)</span>
                        </button>
                      )}
                    </div>

                    {batchScope === 'session' && (
                      <div className="pt-2 flex items-center gap-2">
                        <span className="text-xs text-zinc-600 font-semibold shrink-0">Chọn Session:</span>
                        <select
                          value={batchSessionNum}
                          disabled={isBatchRunning}
                          onChange={(e) => setBatchSessionNum(Number(e.target.value))}
                          className="w-full text-xs font-bold p-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 cursor-pointer"
                        >
                          {(activePackage?.sessions || []).map(s => (
                            <option key={s.sessionNumber} value={s.sessionNumber}>
                              Session {s.sessionNumber} ({s.items.length} câu - {s.hcTotal} hints)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

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

                  {/* Force Overwrite Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/60">
                    <div>
                      <div className="font-bold text-zinc-800 text-xs">Ghi đè audio đã có (Force Overwrite)</div>
                      <div className="text-[11px] text-zinc-400">Tạo mới và ghi đè toàn bộ file âm thanh hiện có</div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={forceOverwrite}
                        disabled={isBatchRunning}
                        onChange={(e) => setForceOverwrite(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#DC2626]"></div>
                    </label>
                  </div>

                  {/* Progress Bar & Live Status */}
                  {isBatchRunning && (
                    <div className="p-4 bg-zinc-900 text-zinc-100 rounded-2xl border border-zinc-800 space-y-3 font-mono">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                          <span>{batchProgress.statusText || 'Đang xử lý batch audio...'}</span>
                        </span>
                        <span className="text-amber-400 font-bold">
                          {batchProgress.current} / {batchProgress.total}
                        </span>
                      </div>

                      <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full transition-all duration-300 rounded-full"
                          style={{ width: `${(batchProgress.current / (batchProgress.total || 1)) * 100}%` }}
                        />
                      </div>

                      {/* Metrics Strip */}
                      <div className="grid grid-cols-3 gap-2 text-center text-[11px] py-1 border-y border-zinc-800">
                        <div>
                          <span className="text-zinc-400">Đã tạo: </span>
                          <span className="text-emerald-400 font-bold">{batchProgress.prepared}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400">Có sẵn: </span>
                          <span className="text-blue-400 font-bold">{batchProgress.skipped}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400">Lỗi: </span>
                          <span className={`font-bold ${batchProgress.failed > 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                            {batchProgress.failed}
                          </span>
                        </div>
                      </div>

                      {/* Live Error List (if any errors during run) */}
                      {batchErrors.length > 0 && (
                        <div className="p-2.5 bg-red-950/60 rounded-xl border border-red-800 text-[10px] space-y-1">
                          <div className="text-red-300 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                            <span>Phát hiện {batchErrors.length} mục lỗi:</span>
                          </div>
                          <div className="max-h-20 overflow-y-auto space-y-0.5 text-red-200">
                            {batchErrors.slice(-4).map((e, idx) => (
                              <div key={idx}>• [Session {e.sessionNum} - Item #{e.itemNumber}]: {e.error}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Logs Drawer */}
                      <div className="bg-black/60 rounded-xl p-3 max-h-28 overflow-y-auto space-y-1 text-[10px] text-zinc-300">
                        {batchLogs.map((log, lIdx) => (
                          <div key={lIdx}>{log}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#E8E8EC] bg-zinc-50/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBatchAudioModalOpen(false)}
                  disabled={isBatchRunning}
                  className="px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 transition-all cursor-pointer disabled:opacity-50"
                >
                  Đóng
                </button>

                {!batchCompleted && (
                  <button
                    type="button"
                    disabled={isBatchRunning || isResettingAudio}
                    onClick={() => handleResetPackageAudioUrls(batchScope === 'session' ? batchSessionNum : undefined)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-bold text-red-700 transition-all cursor-pointer disabled:opacity-50"
                    title="Xóa toàn bộ liên kết audio cũ để tạo lại từ đầu"
                  >
                    {isResettingAudio ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-red-600" />}
                    <span>Xóa link audio đã có</span>
                  </button>
                )}
              </div>

              {batchCompleted && !isBatchRunning ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBatchCompleted(false)}
                    className="px-4 py-2.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    Cấu Hình & Chạy Lại
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBatchAudioModalOpen(false);
                      onLaunchPresentation?.(
                        activePackage.id,
                        batchScope === 'session' ? batchSessionNum : (activeSessionTab !== 'all' ? activeSessionTab : undefined)
                      );
                    }}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Mở Stage Ngay</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleStartBatchAudioGeneration()}
                  disabled={isBatchRunning || (batchScope === 'missing' && missingItemsToProcess.length === 0) || (batchScope === 'failed' && failedCountForBtn === 0)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>
                    {batchScope === 'session'
                      ? `Tạo Audio Session ${batchSessionNum} (${activePackage?.sessions.find(s => s.sessionNumber === batchSessionNum)?.items.length || 0} câu)`
                      : batchScope === 'missing'
                      ? `Tạo Audio Cho ${missingItemsToProcess.length} Câu Thiếu`
                      : batchScope === 'failed'
                      ? `Thử Lại ${failedCountForBtn} Câu Lỗi`
                      : `Tạo Toàn Bộ Package (${stats.totalItems} câu)`}
                  </span>
                </button>
              )}
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

      {/* ==================================================================== */}
      {/* 11. MODAL: RENAME PACKAGE */}
      {/* ==================================================================== */}
      {isRenameModalOpen && activePackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E8E8EC] shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-50 text-[#DC2626] border border-red-100">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-zinc-900">
                    Đổi Tên & Mô Tả Gói Bài Tập
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    ID: {activePackage.id} ({activePackage.sessionsCount} Sessions, {activePackage.totalItems} Items)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRenameModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Tên Gói Bài Tập (Package Title) <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  placeholder="Ví dụ: CHUNKS Improv - Level B ERES Speaking (Day 1)..."
                  className="w-full p-3 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Mô Tả Chi Tiết (Description)
                </label>
                <textarea
                  value={renameDescription}
                  onChange={(e) => setRenameDescription(e.target.value)}
                  rows={3}
                  placeholder="Nhập mô tả ngữ cảnh, mục tiêu bài tập phản xạ..."
                  className="w-full p-3 rounded-xl border border-zinc-200 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626] leading-relaxed"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setIsRenameModalOpen(false)}
                disabled={isSavingRename}
                className="py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 transition-all cursor-pointer disabled:opacity-50"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleSaveRename}
                disabled={isSavingRename || !renameTitle.trim()}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingRename ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang Lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu Thay Đổi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 12. TOAST: RENAME SUCCESS NOTIFICATION */}
      {/* ==================================================================== */}
      {renameSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-2xl font-bold text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
          <span>{renameSuccessToast}</span>
        </div>
      )}
    </div>
  );
};

export default ImprovManagerView;

