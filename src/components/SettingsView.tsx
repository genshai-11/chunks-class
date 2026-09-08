import React, { useState, useEffect, useRef } from 'react';
import { 
  Cohort, 
  CourseLevel, 
  LanguageMode, 
  CohortAudioSettings,
  ClickerAction,
  PresentationShortcutConfig,
  ShortcutModeBehavior
} from '../types';
import { calculateSessions } from '../utils/scheduler';
import { curriculumRegistry } from '../services/curriculumRegistry';
import { 
  shortcutConfigService, 
  SHORTCUT_PRESETS, 
  ShortcutPresetType 
} from '../services/shortcutConfigService';
import { 
  modelRegistryService, 
  RegisteredModel, 
  ProviderApiKey, 
  TtsProviderType, 
  ActiveTtsProviderType,
  PROVIDERS_META,
  DEFAULT_REGISTERED_MODELS,
  getMinimalName,
  AiGenerationConfig,
  DEFAULT_AI_GENERATION_CONFIG
} from '../services/modelRegistryService';
import { 
  Calendar, 
  RotateCcw, 
  Check, 
  Sliders, 
  Server, 
  Layers, 
  Save, 
  User, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Volume2, 
  Play, 
  Square, 
  Key, 
  Trash2, 
  Plus, 
  Download, 
  Upload, 
  Search, 
  Eye, 
  EyeOff, 
  Copy, 
  Zap, 
  ShieldCheck, 
  Clock, 
  RefreshCw, 
  ExternalLink, 
  Info, 
  CheckSquare, 
  Cloud, 
  SlidersHorizontal, 
  Filter,
  Keyboard
} from 'lucide-react';

type SubTabId = 'cohort' | 'main-models' | 'providers' | 'ai-generator' | 'import-audition' | 'visibility-matrix' | 'shortcuts';

interface SettingsViewProps {
  cohort: Cohort;
  onUpdateCohort: (cohort: Cohort) => void;
  onResetToDefault: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  cohort,
  onUpdateCohort,
  onResetToDefault
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>('cohort');
  const [formData, setFormData] = useState<Cohort>({ ...cohort });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [recalcSuccess, setRecalcSuccess] = useState<boolean>(false);

  // Model & Key Registry State
  const [models, setModels] = useState<RegisteredModel[]>(() => modelRegistryService.getAllModels());
  const [keys, setKeys] = useState<ProviderApiKey[]>(() => modelRegistryService.getAllKeys());
  const [mainEn, setMainEn] = useState<string>(() => modelRegistryService.getMainModelEn());
  const [mainVi, setMainVi] = useState<string>(() => modelRegistryService.getMainModelVi());
  const [now, setNow] = useState<number>(Date.now());

  // Cloud Sync State
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(() => modelRegistryService.isSyncing());
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(() => modelRegistryService.getLastSyncedAt());
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Provider Tab State
  const [selectedProvider, setSelectedProvider] = useState<ActiveTtsProviderType>('GOOGLE_TTS');
  const [newKeyInput, setNewKeyInput] = useState<string>('');
  const [newKeyLabel, setNewKeyLabel] = useState<string>('');
  const [customEndpointInput, setCustomEndpointInput] = useState<string>(() => modelRegistryService.getCustomEndpoint());
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  // Audio Preview State
  const [previewingModelId, setPreviewingModelId] = useState<string | null>(null);
  const [auditionSearch, setAuditionSearch] = useState<string>('');
  const [auditionLangFilter, setAuditionLangFilter] = useState<'all' | 'en' | 'vi'>('all');
  const [auditionProviderFilter, setAuditionProviderFilter] = useState<'all' | ActiveTtsProviderType>('all');

  // Matrix Tab State
  const [matrixSearch, setMatrixSearch] = useState<string>('');
  const [matrixLangFilter, setMatrixLangFilter] = useState<'all' | 'en' | 'vi'>('all');
  const [matrixProviderFilter, setMatrixProviderFilter] = useState<'all' | ActiveTtsProviderType>('all');
  const [matrixGenderFilter, setMatrixGenderFilter] = useState<'all' | 'FEMALE' | 'MALE'>('all');
  const [matrixStatusFilter, setMatrixStatusFilter] = useState<'all' | 'improv' | 'focus' | 'disabled'>('all');
  const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(new Set());
  const [isMinimalNameMode, setIsMinimalNameMode] = useState<boolean>(true);

  // Modals
  const [isAddCustomModalOpen, setIsAddCustomModalOpen] = useState<boolean>(false);
  const [customModelForm, setCustomModelForm] = useState<{
    id: string;
    name: string;
    language: 'en' | 'vi' | 'other';
    gender: 'FEMALE' | 'MALE' | 'NEUTRAL';
    provider: ActiveTtsProviderType;
    description: string;
  }>({
    id: '',
    name: '',
    language: 'en',
    gender: 'FEMALE',
    provider: 'CUSTOM_TTS',
    description: ''
  });

  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // AI Generator Config State
  const [aiConfig, setAiConfig] = useState<AiGenerationConfig>(() => modelRegistryService.getAiConfig());
  const [aiShowApiKey, setAiShowApiKey] = useState<boolean>(false);
  const [isTestingAi, setIsTestingAi] = useState<boolean>(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; latencyMs: number; message: string; model: string } | null>(null);
  const [isCustomAiModel, setIsCustomAiModel] = useState<boolean>(() => {
    const cfg = modelRegistryService.getAiConfig();
    return !['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'].includes(cfg.model);
  });
  const [copiedClientId, setCopiedClientId] = useState<boolean>(false);

  // Sync Registry State
  useEffect(() => {
    const unsub = modelRegistryService.subscribe(() => {
      setModels(modelRegistryService.getAllModels());
      setKeys(modelRegistryService.getAllKeys());
      setMainEn(modelRegistryService.getMainModelEn());
      setMainVi(modelRegistryService.getMainModelVi());
      setCustomEndpointInput(modelRegistryService.getCustomEndpoint());
      setAiConfig(modelRegistryService.getAiConfig());
      setIsSyncingCloud(modelRegistryService.isSyncing());
      setLastSyncedAt(modelRegistryService.getLastSyncedAt());
    });
    return unsub;
  }, []);

  // Shortcut & Remote Clicker State
  const [shortcutConfig, setShortcutConfig] = useState<PresentationShortcutConfig>(() => shortcutConfigService.getConfig());
  const [recordingAction, setRecordingAction] = useState<ClickerAction | null>(null);
  const [recorderMode, setRecorderMode] = useState<'auto' | 'force2x'>('auto');
  const [recordingPendingKey, setRecordingPendingKey] = useState<{ code: string; name: string } | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLiveKeyPressRef = useRef<{ code: string; time: number } | null>(null);

  const [lastTestedKey, setLastTestedKey] = useState<{
    code: string;
    name: string;
    action: ClickerAction | null;
    timestamp: number;
    isDouble?: boolean;
    isCombo?: boolean;
    isChord?: boolean;
  } | null>(null);
  const [shortcutToast, setShortcutToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showShortcutNotice = (msg: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setShortcutToast({ message: msg, type });
    setTimeout(() => {
      setShortcutToast(null);
    }, 2800);
  };

  useEffect(() => {
    const unsub = shortcutConfigService.subscribe(() => {
      setShortcutConfig(shortcutConfigService.getConfig());
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (activeSubTab !== 'shortcuts') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in a text input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
        return;
      }

      // If in recording mode for an action
      if (recordingAction) {
        e.preventDefault();
        e.stopPropagation();

        if (e.code === 'Escape') {
          if (recordingTimerRef.current) {
            clearTimeout(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
          setRecordingPendingKey(null);
          setRecordingAction(null);
          showShortcutNotice('Đã hủy gán phím', 'info');
          return;
        }

        const isModifierOnly = ['ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight'].includes(e.code);
        if (isModifierOnly) {
          return;
        }

        const mods: string[] = [];
        if (e.ctrlKey) mods.push('Ctrl');
        if (e.altKey) mods.push('Alt');
        if (e.shiftKey) mods.push('Shift');
        if (e.metaKey) mods.push('Meta');

        const currentAction = recordingAction;
        const actionLabel = shortcutConfigService.getActionLabel(currentAction).title;

        // 1. Modifier combination (e.g. Ctrl+KeyR)
        if (mods.length > 0) {
          if (recordingTimerRef.current) {
            clearTimeout(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
          setRecordingPendingKey(null);

          const comboCode = `${mods.join('+')}+${e.code}`;
          shortcutConfigService.addKeyToAction(currentAction, comboCode);
          const keyName = shortcutConfigService.getKeyFriendlyName(comboCode);
          showShortcutNotice(`Đã gán tổ hợp "${keyName}" (${comboCode}) cho "${actionLabel}"!`);
          setRecordingAction(null);
          return;
        }

        // 2. Force 2x mode
        if (recorderMode === 'force2x') {
          if (recordingTimerRef.current) {
            clearTimeout(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
          setRecordingPendingKey(null);

          const doubleCode = `2x:${e.code}`;
          shortcutConfigService.addKeyToAction(currentAction, doubleCode);
          const keyName = shortcutConfigService.getKeyFriendlyName(doubleCode);
          showShortcutNotice(`Đã gán cử chỉ "${keyName}" cho "${actionLabel}"!`);
          setRecordingAction(null);
          return;
        }

        // 3. Auto mode: 1x vs 2x vs 2-Key Chord (650ms debounce)
        if (recordingTimerRef.current && recordingPendingKey) {
          clearTimeout(recordingTimerRef.current);
          recordingTimerRef.current = null;
          const firstKey = recordingPendingKey;
          setRecordingPendingKey(null);

          if (firstKey.code === e.code) {
            // Second press of same key within 650ms -> Double Press (2x)!
            const doubleCode = `2x:${e.code}`;
            shortcutConfigService.addKeyToAction(currentAction, doubleCode);
            const keyName = shortcutConfigService.getKeyFriendlyName(doubleCode);
            showShortcutNotice(`Đã nhận diện bấm đúp! Gán "${keyName}" cho "${actionLabel}"!`, 'success');
            setRecordingAction(null);
            return;
          } else {
            // Second press is a different key within 650ms -> 2-Key Chord (e.g. ArrowRight+ArrowLeft)!
            const chordCode = `${firstKey.code}+${e.code}`;
            shortcutConfigService.addKeyToAction(currentAction, chordCode);
            const keyName1 = firstKey.name;
            const keyName2 = shortcutConfigService.getKeyFriendlyName(e.code);
            showShortcutNotice(`Đã nhận diện tổ hợp 2 phím! Gán "🤝 ${keyName1} + ${keyName2}" cho "${actionLabel}"!`, 'success');
            setRecordingAction(null);
            return;
          }
        }

        // First press of this key
        if (recordingTimerRef.current) {
          clearTimeout(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }

        const friendlyName = shortcutConfigService.getKeyFriendlyName(e.code);
        setRecordingPendingKey({ code: e.code, name: friendlyName });

        recordingTimerRef.current = setTimeout(() => {
          recordingTimerRef.current = null;
          setRecordingPendingKey(null);
          shortcutConfigService.addKeyToAction(currentAction, e.code);
          showShortcutNotice(`Đã gán phím đơn "${friendlyName}" (${e.code}) cho "${actionLabel}"!`, 'success');
          setRecordingAction(null);
        }, 650);

        return;
      }

      // Live Key Tester
      const isModifierOnly = ['ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight'].includes(e.code);
      if (isModifierOnly) return;

      const mods: string[] = [];
      if (e.ctrlKey) mods.push('Ctrl');
      if (e.altKey) mods.push('Alt');
      if (e.shiftKey) mods.push('Shift');
      if (e.metaKey) mods.push('Meta');

      if (mods.length > 0) {
        const comboCode = `${mods.join('+')}+${e.code}`;
        const act = shortcutConfigService.findActionForKey(comboCode);
        const friendlyName = shortcutConfigService.getKeyFriendlyName(comboCode);
        setLastTestedKey({
          code: comboCode,
          name: friendlyName,
          action: act,
          timestamp: Date.now(),
          isCombo: true
        });
        lastLiveKeyPressRef.current = null;
        return;
      }

      const now = Date.now();
      if (lastLiveKeyPressRef.current && now - lastLiveKeyPressRef.current.time <= 500) {
        const prevCode = lastLiveKeyPressRef.current.code;
        lastLiveKeyPressRef.current = null;

        if (prevCode === e.code) {
          // Double press
          const doubleCode = `2x:${e.code}`;
          const act = shortcutConfigService.findActionForKey(e.code, true) || shortcutConfigService.findActionForKey(doubleCode);
          const friendlyName = shortcutConfigService.getKeyFriendlyName(doubleCode);
          setLastTestedKey({
            code: doubleCode,
            name: friendlyName,
            action: act,
            timestamp: now,
            isDouble: true
          });
          return;
        } else {
          // 2-Key Chord sequence (e.g. ArrowRight + ArrowLeft)
          const chordCode = `${prevCode}+${e.code}`;
          const act = shortcutConfigService.findActionForChord(prevCode, e.code) || shortcutConfigService.findActionForKey(chordCode);
          const friendlyName = shortcutConfigService.getKeyFriendlyName(chordCode);
          setLastTestedKey({
            code: chordCode,
            name: friendlyName,
            action: act,
            timestamp: now,
            isChord: true
          });
          return;
        }
      }

      // Single key press
      lastLiveKeyPressRef.current = { code: e.code, time: now };
      const act = shortcutConfigService.findActionForKey(e.code);
      const friendlyName = shortcutConfigService.getKeyFriendlyName(e.code);
      setLastTestedKey({
        code: e.code,
        name: friendlyName,
        action: act,
        timestamp: now
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };
  }, [activeSubTab, recordingAction, recorderMode, recordingPendingKey]);

  const handleUpdateAiConfig = (updates: Partial<AiGenerationConfig>) => {
    const next = { ...aiConfig, ...updates };
    setAiConfig(next);
    modelRegistryService.setAiConfig(updates);
    setAiTestResult(null);
  };

  const handleTestAiConnection = async () => {
    setIsTestingAi(true);
    setAiTestResult(null);
    try {
      const res = await modelRegistryService.testAiConnection(aiConfig);
      setAiTestResult(res);
    } catch (err: any) {
      setAiTestResult({
        success: false,
        latencyMs: 0,
        message: err?.message || 'Lỗi kiểm tra kết nối Gemini AI',
        model: aiConfig.model || 'gemini-2.5-flash'
      });
    } finally {
      setIsTestingAi(false);
    }
  };

  const handleCopyClientId = () => {
    const clientId = aiConfig.webClientId || DEFAULT_AI_GENERATION_CONFIG.webClientId || '918426218910-3o6ed7m94u6clst7ae0d19s2rrasrekf.apps.googleusercontent.com';
    navigator.clipboard.writeText(clientId);
    setCopiedClientId(true);
    setTimeout(() => setCopiedClientId(false), 2500);
  };

  // Sync Cohort Props
  useEffect(() => {
    setFormData({ ...cohort });
  }, [cohort]);

  // Cooldown countdown ticker
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cohort Form Handlers
  const handleFieldChange = (field: keyof Cohort, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAudioSettingChange = (field: keyof CohortAudioSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      audio_settings: {
        ...prev.audio_settings,
        [field]: value
      }
    }));
  };

  const handleDayOfWeekToggle = (day: string) => {
    const currentDays = formData.schedule_pattern?.days_of_week || ['Mon', 'Wed', 'Fri'];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    setFormData(prev => ({
      ...prev,
      schedule_pattern: {
        ...prev.schedule_pattern,
        days_of_week: newDays
      }
    }));
  };

  const handleRecalculateSchedule = async () => {
    const days = formData.schedule_pattern?.days_of_week || ['Mon', 'Wed', 'Fri'];
    const startDate = formData.start_date || new Date().toISOString().split('T')[0];
    const totalSessions = formData.total_sessions || 15;

    const newSessions = await calculateSessions({
      courseIdOrLevel: formData.course_id || formData.level_code,
      startDateStr: startDate,
      daysOfWeek: days,
      totalSessions: totalSessions,
      startTime: formData.schedule_pattern?.start_time || '19:30',
      endTime: formData.schedule_pattern?.end_time || '21:00'
    });

    setFormData(prev => ({
      ...prev,
      sessions: newSessions
    }));

    setRecalcSuccess(true);
    setTimeout(() => setRecalcSuccess(false), 2500);
  };

  const handleSaveCohort = () => {
    onUpdateCohort(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Cloud Firestore Persistence Handlers
  const handleSaveToFirestore = async () => {
    setIsSyncingCloud(true);
    try {
      const ok = await modelRegistryService.syncToFirestore();
      if (ok) {
        setLastSyncedAt(modelRegistryService.getLastSyncedAt());
        setSyncToast({ message: 'Đã lưu toàn bộ cấu hình lên Cloud Firestore thành công!', type: 'success' });
      } else {
        setSyncToast({ message: 'Không thể lưu lên Cloud Firestore. Vui lòng kiểm tra kết nối mạng.', type: 'error' });
      }
    } catch (e: any) {
      setSyncToast({ message: `Lỗi lưu database: ${e?.message || 'Không xác định'}`, type: 'error' });
    } finally {
      setIsSyncingCloud(false);
      setTimeout(() => setSyncToast(null), 3500);
    }
  };

  const handleLoadFromFirestore = async () => {
    setIsSyncingCloud(true);
    try {
      const ok = await modelRegistryService.loadFromFirestore();
      if (ok) {
        setModels(modelRegistryService.getAllModels());
        setKeys(modelRegistryService.getAllKeys());
        setMainEn(modelRegistryService.getMainModelEn());
        setMainVi(modelRegistryService.getMainModelVi());
        setLastSyncedAt(modelRegistryService.getLastSyncedAt());
        setSyncToast({ message: 'Đã tải cấu hình mới nhất từ Cloud Firestore!', type: 'success' });
      } else {
        setSyncToast({ message: 'Không tìm thấy dữ liệu trên Cloud Firestore hoặc kết nối thất bại.', type: 'error' });
      }
    } catch (e: any) {
      setSyncToast({ message: `Lỗi tải database: ${e?.message || 'Không xác định'}`, type: 'error' });
    } finally {
      setIsSyncingCloud(false);
      setTimeout(() => setSyncToast(null), 3500);
    }
  };

  // Main Model Switchers
  const handleChangeMainEn = (modelId: string) => {
    modelRegistryService.setMainModelEn(modelId);
    setMainEn(modelId);
    handleAudioSettingChange('voice_profile_en', modelId);
    onUpdateCohort({
      ...formData,
      audio_settings: {
        ...(formData.audio_settings || {}),
        voice_profile_en: modelId
      }
    });
  };

  const handleChangeMainVi = (modelId: string) => {
    modelRegistryService.setMainModelVi(modelId);
    setMainVi(modelId);
    handleAudioSettingChange('voice_profile_vi', modelId);
    onUpdateCohort({
      ...formData,
      audio_settings: {
        ...(formData.audio_settings || {}),
        voice_profile_vi: modelId
      }
    });
  };

  // Audio Preview
  const handlePreviewModel = async (modelId: string) => {
    if (previewingModelId === modelId) {
      setPreviewingModelId(null);
      return;
    }
    setPreviewingModelId(modelId);
    try {
      await modelRegistryService.previewModelAudio(modelId);
    } catch (e: any) {
      console.warn('Preview audio failed:', e);
      alert(`Không thể phát thử âm thanh model ${modelId}: ${e?.message || 'Lỗi không xác định'}`);
    } finally {
      setPreviewingModelId(null);
    }
  };

  // Key Actions
  const handleAddKey = () => {
    if (!newKeyInput.trim()) return;
    try {
      modelRegistryService.addKey(selectedProvider, newKeyInput.trim(), newKeyLabel.trim() || undefined);
      setNewKeyInput('');
      setNewKeyLabel('');
    } catch (e: any) {
      alert(e?.message || 'Lỗi khi thêm key');
    }
  };

  const handleDeleteKey = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa API Key này khỏi pool?')) {
      modelRegistryService.deleteKey(id);
    }
  };

  const handleTestKey = async (k: ProviderApiKey) => {
    setTestingKeyId(k.id);
    try {
      const res = await modelRegistryService.testKey(k);
      setTestResults(prev => ({
        ...prev,
        [k.id]: { success: res.success, message: res.message }
      }));
    } finally {
      setTestingKeyId(null);
    }
  };

  // Custom Model Actions
  const handleCreateCustomModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customModelForm.id.trim() || !customModelForm.name.trim()) {
      alert('Vui lòng nhập đầy đủ Model ID và Tên hiển thị.');
      return;
    }
    modelRegistryService.addCustomModel({
      id: customModelForm.id.trim(),
      name: customModelForm.name.trim(),
      language: customModelForm.language,
      gender: customModelForm.gender,
      provider: customModelForm.provider,
      description: customModelForm.description.trim() || 'Custom registered model',
      improvEnabled: true,
      focusEnabled: true
    });
    setIsAddCustomModalOpen(false);
    setCustomModelForm({
      id: '',
      name: '',
      language: 'en',
      gender: 'FEMALE',
      provider: 'CUSTOM_TTS',
      description: ''
    });
  };

  // Import JSON Actions
  const handleImportJson = () => {
    try {
      const res = modelRegistryService.importModelsFromJson(importJsonText);
      setImportNotice(`Nhập thành công! ${res.imported} model mới, ${res.updated} model cập nhật.`);
      setTimeout(() => {
        setImportNotice(null);
        setIsImportModalOpen(false);
        setImportJsonText('');
      }, 2000);
    } catch (e: any) {
      alert(`Lỗi import JSON: ${e?.message}`);
    }
  };

  const handleExportJson = () => {
    const jsonStr = modelRegistryService.exportModelsToJson();
    navigator.clipboard.writeText(jsonStr);
    alert('Đã sao chép cấu hình Models JSON vào clipboard!');
  };

  const allWeekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const subNavItems: { id: SubTabId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'cohort', label: '1. Lớp Học (Cohort Admin)', icon: <Calendar className="w-4 h-4" /> },
    { id: 'main-models', label: '2. Cấu Hình Model Chính', icon: <Sliders className="w-4 h-4" /> },
    { id: 'providers', label: '3. Nhà Cung Cấp & Multi-Key Pool', icon: <Server className="w-4 h-4" />, badge: '429 FAILOVER' },
    { id: 'ai-generator', label: '4. Cấu Hình AI Generator (Gemini)', icon: <Sparkles className="w-4 h-4 text-purple-600" />, badge: 'GEMINI LLM' },
    { id: 'import-audition', label: '5. Import & Nghe Thử Model', icon: <Volume2 className="w-4 h-4" /> },
    { id: 'visibility-matrix', label: '6. Ma Trận Hiển Thị (Improv & Focus)', icon: <Layers className="w-4 h-4" />, badge: 'MATRIX' },
    { id: 'shortcuts', label: '7. Phím Tắt & Remote Clicker', icon: <Keyboard className="w-4 h-4 text-blue-600" />, badge: 'REMOTE' }
  ];

  // Filtering for Audition Tab
  const filteredAuditionModels = models.filter(m => {
    const matchSearch = auditionSearch === '' || 
      m.name.toLowerCase().includes(auditionSearch.toLowerCase()) || 
      m.id.toLowerCase().includes(auditionSearch.toLowerCase());
    const matchLang = auditionLangFilter === 'all' || m.language === auditionLangFilter;
    const matchProvider = auditionProviderFilter === 'all' || m.provider === auditionProviderFilter;
    return matchSearch && matchLang && matchProvider;
  });

  // Filtering for Matrix Tab (Multi-Filters & Search)
  const filteredMatrixModels = models.filter(m => {
    const minimalName = modelRegistryService.getMinimalName(m);
    const matchSearch = matrixSearch === '' || 
      m.name.toLowerCase().includes(matrixSearch.toLowerCase()) || 
      m.id.toLowerCase().includes(matrixSearch.toLowerCase()) ||
      minimalName.toLowerCase().includes(matrixSearch.toLowerCase());
    const matchLang = matrixLangFilter === 'all' || m.language === matrixLangFilter;
    const matchProvider = matrixProviderFilter === 'all' || m.provider === matrixProviderFilter;
    const matchGender = matrixGenderFilter === 'all' || m.gender === matrixGenderFilter;
    const matchStatus = 
      matrixStatusFilter === 'all' ? true :
      matrixStatusFilter === 'improv' ? m.improvEnabled :
      matrixStatusFilter === 'focus' ? m.focusEnabled :
      (!m.improvEnabled && !m.focusEnabled);
    return matchSearch && matchLang && matchProvider && matchGender && matchStatus;
  });

  const allFilteredSelected = filteredMatrixModels.length > 0 && filteredMatrixModels.every(m => selectedModelIds.has(m.id));
  const someFilteredSelected = filteredMatrixModels.some(m => selectedModelIds.has(m.id)) && !allFilteredSelected;

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedModelIds(prev => {
        const next = new Set(prev);
        filteredMatrixModels.forEach(m => next.delete(m.id));
        return next;
      });
    } else {
      setSelectedModelIds(prev => {
        const next = new Set(prev);
        filteredMatrixModels.forEach(m => next.add(m.id));
        return next;
      });
    }
  };

  const handleToggleSelectRow = (modelId: string) => {
    setSelectedModelIds(prev => {
      const next = new Set(prev);
      if (next.has(modelId)) {
        next.delete(modelId);
      } else {
        next.add(modelId);
      }
      return next;
    });
  };

  const handleBulkSetVisibility = (target: 'improv' | 'focus', enabled: boolean) => {
    selectedModelIds.forEach(id => {
      modelRegistryService.setModelVisibility(id, target, enabled);
    });
  };

  const handleClearSelection = () => {
    setSelectedModelIds(new Set());
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans animate-fade-in text-zinc-900">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#DC2626]/10 text-[#DC2626] uppercase">
              Central Modules Settings Hub
            </span>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Multi-Key & Matrix Sync
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl text-zinc-900 tracking-tight">
            Cấu Hình Modules Chung & Quản Lý Nhà Cung Cấp
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Trung tâm kiểm soát thông tin lớp học, mô hình giọng đọc chính, hệ thống xoay vòng key chống lỗi 429 và ma trận hiển thị cho Improv & Focus.
          </p>
        </div>

        {/* Global Save Indicator */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveCohort}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            {saveSuccess ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Đã Lưu Thành Công!' : 'Lưu Thay Đổi (Save)'}</span>
          </button>
        </div>
      </div>

      {/* Cloud Firestore Persistence & Sync Control Bar */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white rounded-2xl p-4 border border-zinc-700/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/10 text-emerald-400">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Cloud Firestore Sync
              </span>
              {/* Status Badge */}
              {isSyncingCloud ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Đang đồng bộ...</span>
                </span>
              ) : lastSyncedAt ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Đã đồng bộ ({new Date(lastSyncedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-700 text-zinc-300">
                  <Info className="w-3 h-3" />
                  <span>Lưu trên máy (Local)</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Cấu hình models, multi-key rotator pool và ma trận hiển thị được lưu trữ tập trung trên Cloud Firestore.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handleLoadFromFirestore}
            disabled={isSyncingCloud}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            title="Tải cấu hình mới nhất từ Cloud Firestore"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Tải Từ Database</span>
          </button>
          <button
            type="button"
            onClick={handleSaveToFirestore}
            disabled={isSyncingCloud}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Ghi đè cấu hình hiện tại lên Cloud Firestore"
          >
            <Upload className="w-3.5 h-3.5 text-white" />
            <span>Lưu Lên Database (Cloud Firestore)</span>
          </button>
        </div>
      </div>

      {/* Sync Toast Notification */}
      {syncToast && (
        <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
          syncToast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {syncToast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
          <span>{syncToast.message}</span>
        </div>
      )}

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-2xl overflow-x-auto border border-zinc-200">
        {subNavItems.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-[#DC2626]/10 text-[#DC2626]' : 'bg-zinc-200 text-zinc-600'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: COHORT ADMIN */}
      {/* ===================================================================== */}
      {activeSubTab === 'cohort' && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#DC2626]" />
              <h2 className="font-display font-bold text-base text-zinc-900">
                Thông Tin Lớp Học & Giảng Viên
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-400">ID: {formData.id}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1.5 uppercase tracking-wider">
                Tên Lớp Học (Cohort Title)
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:bg-white focus:outline-none focus:border-[#DC2626]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1.5 uppercase tracking-wider">
                Khóa Học / Cấp Độ (Level)
              </label>
              <select
                value={formData.level_code}
                onChange={(e) => {
                  const newLevel = e.target.value as CourseLevel;
                  const course = curriculumRegistry.getCourse(newLevel);
                  setFormData(prev => ({
                    ...prev,
                    level_code: newLevel,
                    course_id: course?.id || prev.course_id
                  }));
                }}
                className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:bg-white focus:outline-none focus:border-[#DC2626] cursor-pointer"
              >
                {curriculumRegistry.getAllCourses().map(c => (
                  <option key={c.id} value={c.level_code}>
                    {c.title} ({c.total_days} Buổi)
                  </option>
                ))}
                <option value="CUSTOM">Khóa Học Tùy Chỉnh (Custom)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1.5 uppercase tracking-wider">
                Mã Giảng Viên (Teacher ID)
              </label>
              <input
                type="text"
                value={formData.teacher_id || ''}
                onChange={(e) => handleFieldChange('teacher_id', e.target.value)}
                placeholder="VD: teacher_genshai"
                className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900 focus:bg-white focus:outline-none focus:border-[#DC2626]"
              />
            </div>
          </div>

          {/* Schedule & Timing Setup */}
          <div className="pt-4 border-t border-zinc-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#DC2626]" />
                <span className="font-bold text-xs text-zinc-900 uppercase tracking-wider">
                  Lịch Học Tuần & Ngày Khai Giảng
                </span>
              </div>

              <button
                type="button"
                onClick={handleRecalculateSchedule}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-bold text-zinc-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>{recalcSuccess ? 'Đã Tính Lại Lịch!' : 'Tự Động Tính Lại Ngày Học'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-600 block mb-1">
                  Ngày Bắt Đầu (Start Date)
                </label>
                <input
                  type="date"
                  value={formData.start_date || ''}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      start_date: e.target.value
                    }));
                  }}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900 focus:bg-white focus:outline-none focus:border-[#DC2626]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-600 block mb-1">
                  Khung Giờ Học
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={formData.schedule_pattern?.start_time || '19:30'}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        schedule_pattern: { ...(prev.schedule_pattern || { days_of_week: ['Mon', 'Wed', 'Fri'], end_time: '21:00' }), start_time: e.target.value }
                      }));
                    }}
                    className="w-full px-2 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900"
                  />
                  <span className="text-zinc-400 font-mono">-</span>
                  <input
                    type="time"
                    value={formData.schedule_pattern?.end_time || '21:00'}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        schedule_pattern: { ...(prev.schedule_pattern || { days_of_week: ['Mon', 'Wed', 'Fri'], start_time: '19:30' }), end_time: e.target.value }
                      }));
                    }}
                    className="w-full px-2 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-600 block mb-1">
                  Số Buổi Học Tổng (Sessions)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.total_sessions || 15}
                  onChange={(e) => handleFieldChange('total_sessions', parseInt(e.target.value) || 15)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900"
                />
              </div>
            </div>

            {/* Weekday Selector Pills */}
            <div>
              <label className="text-xs font-bold text-zinc-600 block mb-2">
                Các Ngày Học Trong Tuần (Days of Week)
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {allWeekdays.map((day) => {
                  const isSelected = formData.schedule_pattern?.days_of_week?.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayOfWeekToggle(day)}
                      className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold font-mono transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-xs'
                          : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reset To Factory Cohorts */}
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-bold text-xs text-zinc-900">
                Khôi Phục Danh Sách Lớp Mặc Định
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Đặt lại dữ liệu về 3 lớp học mẫu Level B ERES K24, Level B EREL K18 và Level A K12 tiêu chuẩn.
              </p>
            </div>

            <button
              type="button"
              onClick={onResetToDefault}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi Phục Lớp Mặc Định</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: MAIN & CUSTOM MODELS CONFIGURATION */}
      {/* ===================================================================== */}
      {activeSubTab === 'main-models' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#DC2626]" />
                <h2 className="font-display font-bold text-base text-zinc-900">
                  Cấu Hình Giọng Đọc Mặc Định Cho Lớp (Primary Cohort Voices)
                </h2>
              </div>
              <span className="text-xs text-zinc-500">Áp dụng đồng bộ cho Focus Mode & Improv</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Main English Voice */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Giọng Tiếng Anh Chính (Main EN Model)
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePreviewModel(mainEn)}
                    disabled={previewingModelId === mainEn}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-zinc-200 hover:border-zinc-300 text-xs font-bold text-zinc-700 rounded-lg cursor-pointer transition-all shadow-2xs"
                  >
                    {previewingModelId === mainEn ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-[#DC2626]" />
                    ) : (
                      <Play className="w-3 h-3 fill-current text-[#DC2626]" />
                    )}
                    <span>{previewingModelId === mainEn ? 'Đang phát...' : 'Phát Thử Giọng'}</span>
                  </button>
                </div>

                <select
                  value={mainEn}
                  onChange={(e) => handleChangeMainEn(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-[#DC2626] cursor-pointer"
                >
                  {models.filter(m => m.language === 'en' || m.id.startsWith('aura-') || m.id.startsWith('flux-') || m.id.startsWith('en-US-')).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} [{PROVIDERS_META[m.provider]?.shortName || m.provider}]
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-500">
                  Model này sẽ được ưu tiên phát âm cho các cụm Chunk tiếng Anh trong lớp học.
                </p>
              </div>

              {/* Main Vietnamese Voice */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Giọng Tiếng Việt Chính (Main VI Model)
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePreviewModel(mainVi)}
                    disabled={previewingModelId === mainVi}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-zinc-200 hover:border-zinc-300 text-xs font-bold text-zinc-700 rounded-lg cursor-pointer transition-all shadow-2xs"
                  >
                    {previewingModelId === mainVi ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
                    ) : (
                      <Play className="w-3 h-3 fill-current text-emerald-600" />
                    )}
                    <span>{previewingModelId === mainVi ? 'Đang phát...' : 'Phát Thử Giọng'}</span>
                  </button>
                </div>

                <select
                  value={mainVi}
                  onChange={(e) => handleChangeMainVi(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  {models.filter(m => m.language === 'vi' || m.id.startsWith('vi-')).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} [{PROVIDERS_META[m.provider]?.shortName || m.provider}]
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-500">
                  Model này đọc nghĩa tiếng Việt và phản xạ song ngữ tự nhiên chuẩn bản xứ.
                </p>
              </div>
            </div>

            {/* Language Mode & Speed Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-100">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5 uppercase tracking-wider">
                  Chế Độ Phát Song Ngữ Mặc Định
                </label>
                <select
                  value={formData.audio_settings?.language_mode || 'EN_THEN_VI'}
                  onChange={(e) => handleAudioSettingChange('language_mode', e.target.value as LanguageMode)}
                  className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <option value="EN_THEN_VI">Tiếng Anh ➔ Tiếng Việt (EN ➔ VI)</option>
                  <option value="EN_ONLY">Chỉ Tiếng Anh (EN Only)</option>
                  <option value="VI_ONLY">Chỉ Tiếng Việt (VI Only)</option>
                  <option value="VI_THEN_EN">Tiếng Việt ➔ Tiếng Anh (VI ➔ EN)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5 uppercase tracking-wider">
                  Tốc Độ Phát Mặc Định (Playback Speed)
                </label>
                <select
                  value={formData.audio_settings?.default_speed || 1.0}
                  onChange={(e) => handleAudioSettingChange('default_speed', parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <option value="0.8">0.8x (Chậm, rõ âm - Luyện khẩu hình)</option>
                  <option value="0.9">0.9x (Vừa phải, tự nhiên)</option>
                  <option value="1.0">1.0x (Tốc độ đàm thoại thực tế - Khuyên dùng)</option>
                  <option value="1.2">1.2x (Nhanh - Luyện phản xạ tốc độ cao)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Custom Models Section */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-zinc-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-sm text-zinc-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Mô Hình Tùy Chỉnh (Custom Registered Models)</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Đăng ký ID giọng đọc tùy chỉnh từ Google Cloud, Deepgram hoặc Custom Server.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddCustomModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Model Tùy Chỉnh</span>
              </button>
            </div>

            {models.filter(m => m.isCustom).length === 0 ? (
              <div className="p-8 text-center bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                <p className="text-xs text-zinc-500 font-medium">Chưa có model tùy chỉnh nào được tạo.</p>
                <button
                  type="button"
                  onClick={() => setIsAddCustomModalOpen(true)}
                  className="mt-2 text-xs font-bold text-[#DC2626] hover:underline cursor-pointer"
                >
                  + Nhấn vào đây để thêm model tùy chỉnh đầu tiên
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {models.filter(m => m.isCustom).map(m => (
                  <div key={m.id} className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-zinc-900">{m.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                          CUSTOM
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                        ID: {m.id} | {m.language.toUpperCase()} | {PROVIDERS_META[m.provider]?.shortName || m.provider}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePreviewModel(m.id)}
                        disabled={previewingModelId === m.id}
                        className="p-2 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 cursor-pointer"
                        title="Phát thử âm thanh"
                      >
                        {previewingModelId === m.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#DC2626]" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current text-[#DC2626]" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Xóa model tùy chỉnh "${m.name}"?`)) {
                            modelRegistryService.deleteCustomModel(m.id);
                          }
                        }}
                        className="p-2 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Xóa model"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: PROVIDERS & MULTI-KEY ROTATOR POOL (429 FAILOVER) */}
      {/* ===================================================================== */}
      {activeSubTab === 'providers' && (
        <div className="space-y-6">
          {/* Explanation Banner */}
          <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 text-white rounded-2xl p-5 shadow-sm space-y-2 border border-zinc-700">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-display font-bold text-sm text-emerald-300">
                Hệ Thống Xoay Vòng Key Đa Tầng Chống Lỗi 429 (Multi-Key Pool & 429 Failover Rotator)
              </h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Khi API của Google Cloud, Gemini Flash, Deepgram hoặc Custom Endpoint trả về mã phản hồi <span className="font-mono text-amber-300 font-bold">HTTP 429 (Too Many Requests / Quota Exceeded)</span>, hệ thống sẽ tự động gán nhãn <span className="font-mono text-amber-300 font-bold">RATE_LIMITED</span> cho key đó trong 60 giây và ngay lập tức kích hoạt key kế tiếp trong Pool để bài giảng và phát âm của học sinh diễn ra liên tục, không bao giờ bị nghẽn gián đoạn.
            </p>
          </div>

          {/* Provider Cards Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(['GOOGLE_TTS', 'GEMINI_AI_STUDIO', 'DEEPGRAM', 'CUSTOM_TTS'] as ActiveTtsProviderType[]).map((provKey) => {
              const meta = PROVIDERS_META[provKey];
              const provKeys = keys.filter(k => k.provider === provKey);
              const readyCount = provKeys.filter(k => k.status === 'READY' && (!k.rateLimitedUntil || k.rateLimitedUntil <= now)).length;
              const rateLimitedCount = provKeys.filter(k => k.rateLimitedUntil && k.rateLimitedUntil > now).length;
              const isSelected = selectedProvider === provKey;

              return (
                <div
                  key={provKey}
                  onClick={() => setSelectedProvider(provKey)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-[#DC2626] shadow-sm ring-2 ring-[#DC2626]/10'
                      : 'bg-white border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">
                        {provKeys.length} Keys
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-zinc-900">{meta.shortName}</h4>
                    <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">
                      {meta.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-emerald-600 font-bold">{readyCount} Ready</span>
                    {rateLimitedCount > 0 && (
                      <span className="text-amber-600 font-bold">{rateLimitedCount} 429 Cooldown</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key Management for Selected Provider */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-[#DC2626]" />
                <h3 className="font-display font-bold text-sm text-zinc-900">
                  Quản Lý Pool API Key: {PROVIDERS_META[selectedProvider]?.name}
                </h3>
              </div>
              {PROVIDERS_META[selectedProvider]?.docUrl && (
                <a
                  href={PROVIDERS_META[selectedProvider].docUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#DC2626] hover:underline font-medium"
                >
                  <span>Tài liệu API</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Custom Endpoint Input (For Custom TTS) */}
            {selectedProvider === 'CUSTOM_TTS' && (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                <label className="text-xs font-bold text-amber-900 block uppercase tracking-wider">
                  Endpoint URL Máy Chủ Custom (OpenAI Compatible)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={customEndpointInput}
                    onChange={(e) => setCustomEndpointInput(e.target.value)}
                    placeholder="VD: http://localhost:8000/v1/audio/speech hoặc https://my-tts.ai/v1/audio/speech"
                    className="flex-1 px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:border-[#DC2626]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      modelRegistryService.setCustomEndpoint(customEndpointInput);
                      alert('Đã lưu Custom Endpoint!');
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Lưu Endpoint
                  </button>
                </div>
              </div>
            )}

            {/* Add New Key Form */}
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 block">
                Thêm API Key Mới Vào Pool ({PROVIDERS_META[selectedProvider]?.shortName})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <input
                    type="password"
                    value={newKeyInput}
                    onChange={(e) => setNewKeyInput(e.target.value)}
                    placeholder={
                      selectedProvider === 'DEEPGRAM' ? 'Nhập Deepgram API Key...' :
                      selectedProvider === 'GEMINI_AI_STUDIO' ? 'AQ.Ab8...' :
                      selectedProvider === 'CUSTOM_TTS' ? 'Nhập Bearer Token (Tùy chọn)...' :
                      'AIzaSy...'
                    }
                    className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:border-[#DC2626]"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newKeyLabel}
                    onChange={(e) => setNewKeyLabel(e.target.value)}
                    placeholder="Ghi chú (Tùy chọn, VD: Backup Key 2)"
                    className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-[#DC2626]"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddKey}
                  disabled={!newKeyInput.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl cursor-pointer transition-all disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Key Vào Pool</span>
                </button>
              </div>
            </div>

            {/* Keys Table */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 block">
                Danh Sách API Keys Hiện Tại ({keys.filter(k => k.provider === selectedProvider).length} Keys)
              </span>

              {keys.filter(k => k.provider === selectedProvider).length === 0 ? (
                <div className="p-6 text-center bg-zinc-50 rounded-xl border border-dashed border-zinc-200 text-xs text-zinc-500">
                  Chưa có API Key nào được cấu hình cho nhà cung cấp này.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 text-[10px] uppercase font-mono text-zinc-500">
                        <th className="py-2.5 px-3">Ghi Chú</th>
                        <th className="py-2.5 px-3">API Key (Masked)</th>
                        <th className="py-2.5 px-3">Trạng Thái (Status)</th>
                        <th className="py-2.5 px-3 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {keys.filter(k => k.provider === selectedProvider).map((k) => {
                        const isRateLimited = Boolean(k.rateLimitedUntil && k.rateLimitedUntil > now);
                        const remainingSec = isRateLimited ? Math.max(0, Math.ceil((k.rateLimitedUntil! - now) / 1000)) : 0;
                        const testOutcome = testResults[k.id];

                        return (
                          <tr key={k.id} className="hover:bg-zinc-50/70 transition-colors">
                            <td className="py-3 px-3 font-bold text-zinc-900">
                              {k.label || 'API Key'}
                            </td>
                            <td className="py-3 px-3 font-mono text-zinc-600">
                              {modelRegistryService.maskKey(k.key)}
                            </td>
                            <td className="py-3 px-3">
                              {isRateLimited ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 animate-pulse">
                                  <Clock className="w-3 h-3" />
                                  <span>429 Rate Limited ({remainingSec}s còn lại)</span>
                                </span>
                              ) : k.status === 'ERROR' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-800" title={k.lastError}>
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Lỗi Kết Nối</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                  <span>READY (Sẵn Sàng)</span>
                                </span>
                              )}

                              {testOutcome && (
                                <div className={`text-[10px] mt-1 font-mono ${testOutcome.success ? 'text-emerald-600 font-bold' : 'text-red-600'}`}>
                                  {testOutcome.message}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleTestKey(k)}
                                  disabled={testingKeyId === k.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-[11px] font-bold text-zinc-700 cursor-pointer disabled:opacity-50"
                                >
                                  {testingKeyId === k.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin text-[#DC2626]" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  )}
                                  <span>{testingKeyId === k.id ? 'Đang Test...' : 'Kiểm Tra Key'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteKey(k.id)}
                                  className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                                  title="Xóa Key"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: AI GENERATOR CONFIG (GOOGLE GEMINI & LLM) */}
      {/* ===================================================================== */}
      {activeSubTab === 'ai-generator' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-purple-950 via-zinc-900 to-zinc-900 text-white rounded-2xl p-6 shadow-sm space-y-2 border border-purple-800/40">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-purple-200">
                    Cấu Hình AI Sinh Bài Học (Google Gemini & LLM)
                  </h3>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    Tùy chỉnh Model AI và API Key sử dụng cho tính năng "Tạo Package AI" trong Improv Studio và sinh giáo trình tự động.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-purple-900/60 text-purple-300 border border-purple-700/50">
                  Google GenAI REST
                </span>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                  Live Test 200 OK
                </span>
              </div>
            </div>
          </div>

          {/* Configuration Card */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-600" />
                <h3 className="font-display font-bold text-sm text-zinc-900">
                  AI Engine & Nhà Cung Cấp Mô Hình
                </h3>
              </div>
              <a
                href="https://aistudio.google.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-purple-600 hover:underline font-medium"
              >
                <span>Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Provider Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block font-mono">
                1. AI Engine / Giao Thức Kết Nối
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleUpdateAiConfig({ provider: 'GOOGLE_GENAI' })}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    aiConfig.provider === 'GOOGLE_GENAI'
                      ? 'bg-purple-50/80 border-purple-500 shadow-sm ring-2 ring-purple-500/20'
                      : 'bg-zinc-50/70 border-zinc-200 hover:bg-white hover:border-zinc-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                        Google Gemini (Google GenAI API)
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                        Khuyên Dùng
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Giao thức chính thức qua <code>generativelanguage.googleapis.com</code>. Tốc độ cao, tối ưu kịch bản sư phạm, $0 Always Free.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateAiConfig({ provider: 'CUSTOM_OPENAI' })}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    aiConfig.provider === 'CUSTOM_OPENAI'
                      ? 'bg-zinc-900 border-zinc-900 text-white shadow-sm ring-2 ring-zinc-900/20'
                      : 'bg-zinc-50/70 border-zinc-200 hover:bg-white hover:border-zinc-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`font-bold text-xs flex items-center gap-1.5 ${aiConfig.provider === 'CUSTOM_OPENAI' ? 'text-white' : 'text-zinc-900'}`}>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        Custom Endpoint (OpenAI Compatible)
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${aiConfig.provider === 'CUSTOM_OPENAI' ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-700'}`}>
                        Tùy Chỉnh
                      </span>
                    </div>
                    <p className={`text-[11px] ${aiConfig.provider === 'CUSTOM_OPENAI' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      Kết nối máy chủ LLM tùy chọn qua giao thức chuẩn <code>/chat/completions</code>.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Custom Endpoint Input (when CUSTOM_OPENAI is active) */}
            {aiConfig.provider === 'CUSTOM_OPENAI' && (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                <label className="text-xs font-bold text-amber-900 uppercase tracking-wider block font-mono">
                  Endpoint URL Máy Chủ Custom LLM
                </label>
                <input
                  type="url"
                  value={aiConfig.endpoint || ''}
                  onChange={(e) => handleUpdateAiConfig({ endpoint: e.target.value })}
                  placeholder="https://api.openai.com/v1 hoặc http://localhost:11434/v1"
                  className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:border-purple-600"
                />
              </div>
            )}

            {/* Model Selector */}
            <div className="space-y-3 pt-2 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block font-mono">
                  2. Chọn Mô Hình AI (Model Selector)
                </label>
                <span className="text-[11px] font-mono text-purple-700 font-bold">
                  Hiện tại: {aiConfig.model}
                </span>
              </div>

              {aiConfig.provider === 'GOOGLE_GENAI' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Preset 1: Gemini 2.5 Flash */}
                  <div
                    onClick={() => {
                      setIsCustomAiModel(false);
                      handleUpdateAiConfig({ model: 'gemini-2.5-flash' });
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      aiConfig.model === 'gemini-2.5-flash' && !isCustomAiModel
                        ? 'bg-purple-50/90 border-purple-500 shadow-2xs ring-2 ring-purple-500/20'
                        : 'bg-zinc-50/60 border-zinc-200 hover:bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-zinc-900 font-mono">gemini-2.5-flash</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                          Khuyên dùng
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-600">
                        Nhanh, chuẩn xác, tiết kiệm quota và xử lý cấu trúc bài học cực kỳ mượt mà.
                      </p>
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-purple-600 font-bold">
                      ~1.0s latency • Khuyên dùng
                    </div>
                  </div>

                  {/* Preset 2: Gemini 2.5 Pro */}
                  <div
                    onClick={() => {
                      setIsCustomAiModel(false);
                      handleUpdateAiConfig({ model: 'gemini-2.5-pro' });
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      aiConfig.model === 'gemini-2.5-pro' && !isCustomAiModel
                        ? 'bg-purple-50/90 border-purple-500 shadow-2xs ring-2 ring-purple-500/20'
                        : 'bg-zinc-50/60 border-zinc-200 hover:bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-zinc-900 font-mono">gemini-2.5-pro</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          Chất lượng cao
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-600">
                        Suy luận kịch bản sâu, ngữ cảnh phức tạp và độ gắn kết câu chuyện cao cấp.
                      </p>
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-blue-600 font-bold">
                      Reasoning Depth • Pro Grade
                    </div>
                  </div>

                  {/* Preset 3: Gemini 2.0 Flash */}
                  <div
                    onClick={() => {
                      setIsCustomAiModel(false);
                      handleUpdateAiConfig({ model: 'gemini-2.0-flash' });
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      aiConfig.model === 'gemini-2.0-flash' && !isCustomAiModel
                        ? 'bg-purple-50/90 border-purple-500 shadow-2xs ring-2 ring-purple-500/20'
                        : 'bg-zinc-50/60 border-zinc-200 hover:bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-zinc-900 font-mono">gemini-2.0-flash</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Độ trễ thấp
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-600">
                        Phản hồi siêu tốc độ, giảm thiểu thời gian chờ đợi khi tạo dữ liệu mẫu.
                      </p>
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-emerald-600 font-bold">
                      Ultra Fast • Low Latency
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Model Toggle / Input */}
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Nhập Tên Model Khác (Custom Model ID)</span>
                  </span>
                  {!isCustomAiModel && (
                    <button
                      type="button"
                      onClick={() => setIsCustomAiModel(true)}
                      className="text-xs text-purple-600 hover:underline font-bold cursor-pointer"
                    >
                      + Nhập model tùy biến
                    </button>
                  )}
                </div>

                {isCustomAiModel && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={aiConfig.model}
                      onChange={(e) => handleUpdateAiConfig({ model: e.target.value.trim() })}
                      placeholder="VD: gemini-2.5-flash-thinking hoặc gpt-4o-mini"
                      className="flex-1 px-3.5 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:border-purple-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomAiModel(false);
                        handleUpdateAiConfig({ model: 'gemini-2.5-flash' });
                      }}
                      className="px-3 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Dùng mặc định
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* API Key Input */}
            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block font-mono">
                3. Google AI Studio API Key (Authentication)
              </label>
              <div className="relative">
                <input
                  type={aiShowApiKey ? 'text' : 'password'}
                  value={aiConfig.apiKey}
                  onChange={(e) => handleUpdateAiConfig({ apiKey: e.target.value.trim() })}
                  placeholder="Dán Google AI Studio API Key (AQ... hoặc AIzaSy...)"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900 focus:bg-white focus:outline-none focus:border-purple-600"
                />
                <button
                  type="button"
                  onClick={() => setAiShowApiKey(!aiShowApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  title={aiShowApiKey ? 'Ẩn API Key' : 'Hiện API Key'}
                >
                  {aiShowApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-zinc-500">
                <p className="flex items-center gap-1">
                  <Info className="w-3 h-3 text-purple-600 shrink-0" />
                  <span>Hỗ trợ cả Google AI Studio Key (bắt đầu bằng <code>AQ...</code>) và Google Cloud API Key (bắt đầu bằng <code>AIzaSy...</code>).</span>
                </p>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-600 hover:underline font-bold inline-flex items-center gap-1"
                >
                  <span>Lấy API Key Miễn Phí Tại AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Google Web Client ID Reference */}
            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block font-mono">
                4. Google Web Client ID (OAuth / Web Client Reference)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={aiConfig.webClientId || DEFAULT_AI_GENERATION_CONFIG.webClientId || ''}
                  onChange={(e) => handleUpdateAiConfig({ webClientId: e.target.value.trim() })}
                  placeholder="918426218910-3o6ed7m94u6clst7ae0d19s2rrasrekf.apps.googleusercontent.com"
                  className="flex-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-medium text-zinc-700 focus:bg-white focus:outline-none focus:border-purple-600"
                />
                <button
                  type="button"
                  onClick={handleCopyClientId}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold cursor-pointer transition-all shadow-2xs shrink-0"
                  title="Sao chép Web Client ID vào bộ nhớ tạm"
                >
                  {copiedClientId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedClientId ? 'Đã sao chép!' : 'Sao chép ID'}</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-400">
                Google Web Client ID tiêu chuẩn dùng cho xác thực client-side và ủy quyền dịch vụ Google Cloud/GenAI.
              </p>
            </div>

            {/* Live Test Connection Section */}
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Kiểm Tra Trạng Thái Kết Nối Thời Gian Thực (Live 200 OK Test)</span>
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Gửi gói tin kiểm tra trực tiếp tới Google GenAI API endpoint để xác thực tính hợp lệ của API Key và Model.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTestAiConnection}
                  disabled={isTestingAi}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {isTestingAi ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  )}
                  <span>{isTestingAi ? 'Đang Kiểm Tra...' : 'Test Kết Nối Gemini AI (Live Test 200 OK)'}</span>
                </button>
              </div>

              {/* Live Test Result Badge */}
              {aiTestResult && (
                <div
                  className={`p-4 rounded-xl border text-xs flex items-start gap-3 animate-fade-in ${
                    aiTestResult.success
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      : 'bg-red-50 text-red-900 border-red-300'
                  }`}
                >
                  {aiTestResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="font-bold flex items-center gap-2">
                      <span>{aiTestResult.success ? 'KẾT NỐI THÀNH CÔNG (200 OK)' : 'KẾT NỐI THẤT BẠI'}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/60 border border-current/20">
                        {aiTestResult.latencyMs}ms
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/60 border border-current/20">
                        Model: {aiTestResult.model}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {aiTestResult.message}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Cloud Auto-Sync Notice */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50/50 border border-purple-200/60 text-xs text-purple-900">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  Mọi thay đổi cấu hình Model & Key được lưu tự động trên trình duyệt và tự động lên lịch đồng bộ lên <strong>Cloud Firestore</strong> (<code>system_settings/model_registry</code>).
                </span>
              </div>
              <button
                type="button"
                onClick={handleSaveToFirestore}
                disabled={isSyncingCloud}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold cursor-pointer transition-all shrink-0"
              >
                <Upload className="w-3 h-3" />
                <span>Lưu Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: IMPORT & AUDIO AUDITION */}
      {/* ===================================================================== */}
      {activeSubTab === 'import-audition' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-zinc-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-sm text-zinc-900 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#DC2626]" />
                  <span>Danh Mục Model & Thính Phòng Nghe Thử (Audio Audition)</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Nghe thử âm thanh trực tiếp từng giọng đọc với câu mẫu tự nhiên và import catalog từ provider.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Model Từ Provider</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-bold rounded-xl cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất JSON</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  value={auditionSearch}
                  onChange={(e) => setAuditionSearch(e.target.value)}
                  placeholder="Tìm kiếm model theo tên hoặc ID..."
                  className="w-full pl-9 pr-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:border-[#DC2626]"
                />
              </div>

              <div>
                <select
                  value={auditionProviderFilter}
                  onChange={(e) => setAuditionProviderFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <option value="all">Tất Cả Nhà Cung Cấp (Providers)</option>
                  {(Object.keys(PROVIDERS_META) as TtsProviderType[]).map(p => (
                    <option key={p} value={p}>{PROVIDERS_META[p].name}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={auditionLangFilter}
                  onChange={(e) => setAuditionLangFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <option value="all">Tất Cả Ngôn Ngữ (All Languages)</option>
                  <option value="en">Chỉ Tiếng Anh (English)</option>
                  <option value="vi">Chỉ Tiếng Việt (Vietnamese)</option>
                </select>
              </div>
            </div>

            {/* Models Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {filteredAuditionModels.map((m) => {
                const isPlaying = previewingModelId === m.id;
                const isMain = mainEn === m.id || mainVi === m.id;

                return (
                  <div
                    key={m.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      isPlaying
                        ? 'bg-red-50/50 border-[#DC2626] shadow-sm ring-1 ring-[#DC2626]/20'
                        : 'bg-zinc-50/70 border-zinc-200 hover:bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span
                          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded text-white"
                          style={{ backgroundColor: PROVIDERS_META[m.provider]?.color || '#666' }}
                        >
                          {PROVIDERS_META[m.provider]?.shortName || m.provider}
                        </span>

                        <div className="flex items-center gap-1">
                          {isMain && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono">
                              MAIN
                            </span>
                          )}
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700">
                            {m.language.toUpperCase()} • {m.gender === 'FEMALE' ? 'Nữ' : m.gender === 'MALE' ? 'Nam' : 'Trung'}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-bold text-xs text-zinc-900 line-clamp-1">{m.name}</h4>
                      <p className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">{m.id}</p>
                      <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">{m.description}</p>
                    </div>

                    <div className="mt-4 pt-2 border-t border-zinc-200/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handlePreviewModel(m.id)}
                        disabled={isPlaying}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                          isPlaying
                            ? 'bg-[#DC2626] text-white'
                            : 'bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-100'
                        }`}
                      >
                        {isPlaying ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current text-[#DC2626]" />
                        )}
                        <span>{isPlaying ? 'Đang Phát...' : 'Phát Thử (Preview)'}</span>
                      </button>

                      <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
                        {m.improvEnabled && <span title="Bật Improv">⚡Imp</span>}
                        {m.focusEnabled && <span title="Bật Focus">🎯Foc</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: DISPLAY MATRIX (IMPROV & FOCUS VISIBILITY) */}
      {/* ===================================================================== */}
      {activeSubTab === 'visibility-matrix' && (
        <div className="space-y-6">
          {/* Header Info & Bulk Controls */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-zinc-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-sm text-zinc-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#DC2626]" />
                  <span>Ma Trận Hiển Thị Model (Display Visibility Matrix)</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Tùy chỉnh model nào được phép hiển thị trong menu chọn giọng của module <span className="font-bold text-zinc-700">Improv</span> và module <span className="font-bold text-zinc-700">Focus Mode</span>.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Minimalist Name Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsMinimalNameMode(prev => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all shadow-2xs ${
                    isMinimalNameMode
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                  }`}
                  title="Chuyển đổi giữa Tên tối giản và Tên chi tiết"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{isMinimalNameMode ? 'Tên Tối Giản: BẬT' : 'Tên Chi Tiết: BẬT'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => modelRegistryService.setAllVisibility('improv', true)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-bold text-zinc-700 cursor-pointer shadow-2xs"
                >
                  Bật Tất Cả Improv
                </button>
                <button
                  type="button"
                  onClick={() => modelRegistryService.setAllVisibility('focus', true)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-bold text-zinc-700 cursor-pointer shadow-2xs"
                >
                  Bật Tất Cả Focus
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Khôi phục ma trận hiển thị về mặc định ban đầu? (Improv: Bật tất cả; Focus: Giọng tiêu chuẩn)')) {
                      modelRegistryService.resetModelsToDefault();
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-bold text-red-700 cursor-pointer shadow-2xs"
                >
                  Khôi Phục Mặc Định
                </button>
              </div>
            </div>

            {/* Dynamic Multi-Filters Bar */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Language Filter */}
                <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMatrixLangFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      matrixLangFilter === 'all' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Tất Cả ({models.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatrixLangFilter('en')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      matrixLangFilter === 'en' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    English ({models.filter(m => m.language === 'en').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatrixLangFilter('vi')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      matrixLangFilter === 'vi' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Tiếng Việt ({models.filter(m => m.language === 'vi').length})
                  </button>
                </div>

                {/* Provider Filter */}
                <select
                  value={matrixProviderFilter}
                  onChange={(e) => setMatrixProviderFilter(e.target.value as any)}
                  className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 cursor-pointer focus:bg-white focus:outline-none focus:border-[#DC2626]"
                >
                  <option value="all">Tất Cả Nhà Cung Cấp</option>
                  {(['GOOGLE_TTS', 'GEMINI_AI_STUDIO', 'DEEPGRAM', 'CUSTOM_TTS'] as ActiveTtsProviderType[]).map(p => (
                    <option key={p} value={p}>{PROVIDERS_META[p]?.shortName || p}</option>
                  ))}
                </select>

                {/* Gender Filter */}
                <select
                  value={matrixGenderFilter}
                  onChange={(e) => setMatrixGenderFilter(e.target.value as any)}
                  className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 cursor-pointer focus:bg-white focus:outline-none focus:border-[#DC2626]"
                >
                  <option value="all">Tất Cả Giới Tính</option>
                  <option value="FEMALE">Giọng Nữ</option>
                  <option value="MALE">Giọng Nam</option>
                </select>

                {/* Status Filter */}
                <select
                  value={matrixStatusFilter}
                  onChange={(e) => setMatrixStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 cursor-pointer focus:bg-white focus:outline-none focus:border-[#DC2626]"
                >
                  <option value="all">Tất Cả Trạng Thái</option>
                  <option value="improv">Đang Bật Improv</option>
                  <option value="focus">Đang Bật Focus</option>
                  <option value="disabled">Đang Tắt Hoàn Toàn</option>
                </select>

                {/* Search Input */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-2 text-zinc-400" />
                  <input
                    type="text"
                    value={matrixSearch}
                    onChange={(e) => setMatrixSearch(e.target.value)}
                    placeholder="Tìm model (tên, ID hoặc định dạng gọn)..."
                    className="w-full pl-9 pr-3.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:border-[#DC2626]"
                  />
                </div>
              </div>
            </div>

            {/* Bulk Selection & Actions Bar */}
            {selectedModelIds.size > 0 && (
              <div className="p-3 bg-zinc-900 text-white rounded-xl flex items-center justify-between flex-wrap gap-3 shadow-md animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold font-mono">
                    Đã chọn <span className="text-amber-300 font-bold">{selectedModelIds.size}</span> / {filteredMatrixModels.length} models
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleBulkSetVisibility('improv', true)}
                    className="px-3 py-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-2xs"
                  >
                    Bật Improv ({selectedModelIds.size})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkSetVisibility('improv', false)}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-bold rounded-lg cursor-pointer transition-all"
                  >
                    Tắt Improv ({selectedModelIds.size})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkSetVisibility('focus', true)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-2xs"
                  >
                    Bật Focus ({selectedModelIds.size})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkSetVisibility('focus', false)}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-bold rounded-lg cursor-pointer transition-all"
                  >
                    Tắt Focus ({selectedModelIds.size})
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>
            )}

            {/* Matrix Table */}
            <div className="overflow-x-auto border border-zinc-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-200 text-[10px] uppercase font-mono text-zinc-600">
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        ref={el => {
                          if (el) el.indeterminate = someFilteredSelected;
                        }}
                        onChange={handleToggleSelectAll}
                        className="rounded border-zinc-300 text-[#DC2626] focus:ring-[#DC2626] cursor-pointer w-4 h-4"
                        title="Chọn / Bỏ chọn tất cả model hiển thị"
                      />
                    </th>
                    <th className="py-3 px-3">Mô Hình Giọng Đọc (Model)</th>
                    <th className="py-3 px-3">Nhà Cung Cấp</th>
                    <th className="py-3 px-3">Ngôn Ngữ / Giới Tính</th>
                    <th className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-[#DC2626] font-bold">Improv Module</span>
                        <span className="text-[9px] font-normal text-zinc-400 lowercase">(mặc định: tất cả)</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-zinc-900 font-bold">Focus Mode</span>
                        <span className="text-[9px] font-normal text-zinc-400 lowercase">(tiêu chuẩn lớp học)</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 text-right">Phát Thử</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredMatrixModels.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-400 text-xs font-medium">
                        Không tìm thấy giọng đọc nào khớp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredMatrixModels.map((m) => {
                      const isMain = mainEn === m.id || mainVi === m.id;
                      const isPlaying = previewingModelId === m.id;
                      const isSelected = selectedModelIds.has(m.id);

                      return (
                        <tr key={m.id} className={`transition-colors ${isSelected ? 'bg-red-50/30' : 'hover:bg-zinc-50/70'}`}>
                          <td className="py-2.5 px-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectRow(m.id)}
                              className="rounded border-zinc-300 text-[#DC2626] focus:ring-[#DC2626] cursor-pointer w-4 h-4"
                            />
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-xs text-zinc-900">
                                    {isMinimalNameMode ? modelRegistryService.getMinimalName(m) : m.name}
                                  </span>
                                  {isMinimalNameMode && (
                                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                                      {m.gender === 'FEMALE' ? 'Nữ' : m.gender === 'MALE' ? 'Nam' : 'Trung'}
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-[10px] text-zinc-400 block mt-0.5">{m.id}</span>
                              </div>
                              {isMain && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                  CHÍNH
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-2.5 px-3">
                            <span
                              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded text-white inline-block"
                              style={{ backgroundColor: PROVIDERS_META[m.provider]?.color || '#666' }}
                            >
                              {PROVIDERS_META[m.provider]?.shortName || m.provider}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-600">
                            {m.language.toUpperCase()} • {m.gender === 'FEMALE' ? 'Nữ' : m.gender === 'MALE' ? 'Nam' : 'Trung Tính'}
                          </td>

                          {/* Improv Toggle Switch */}
                          <td className="py-2.5 px-3 text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={m.improvEnabled}
                                onChange={(e) => modelRegistryService.setModelVisibility(m.id, 'improv', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#DC2626]"></div>
                            </label>
                          </td>

                          {/* Focus Toggle Switch */}
                          <td className="py-2.5 px-3 text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={m.focusEnabled}
                                onChange={(e) => modelRegistryService.setModelVisibility(m.id, 'focus', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                            </label>
                          </td>

                          {/* Quick Audition Button */}
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handlePreviewModel(m.id)}
                              disabled={isPlaying}
                              className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 cursor-pointer shadow-2xs"
                              title="Nghe thử giọng"
                            >
                              {isPlaying ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#DC2626]" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current text-[#DC2626]" />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 7: PRESENTATION SHORTCUTS & REMOTE CLICKER */}
      {/* ===================================================================== */}
      {activeSubTab === 'shortcuts' && (
        <div className="space-y-6">
          {/* Toast / Notification */}
          {shortcutToast && (
            <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border animate-fade-in text-xs font-bold ${
              shortcutToast.type === 'success' 
                ? 'bg-emerald-600 text-white border-emerald-500' 
                : shortcutToast.type === 'warning'
                ? 'bg-amber-500 text-white border-amber-400'
                : 'bg-zinc-800 text-white border-zinc-700'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
              <span>{shortcutToast.message}</span>
            </div>
          )}

          {/* 1. Header Bar with Title, Description, Quick Actions & Presets */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Keyboard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-base text-zinc-900 flex items-center gap-2">
                    <span>Cấu Hình Phím Tắt Trình Chiếu & Remote Clicker</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      v{shortcutConfig.version}
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Tùy biến phím bấm cho bút trình chiếu không dây (Logitech, Baseus, Ugreen...) và bàn phím máy tính cho cả Focus Mode và Improv Mode.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions & Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  shortcutConfigService.swapNextPrev();
                  showShortcutNotice('Đã đảo chiều phím Tiến ⇄ Lùi thành công!');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Đảo chiều phím Tiến (Next) và Lùi (Prev)"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Đảo Chiều Tiến ⇄ Lùi</span>
              </button>

              <div className="h-6 w-px bg-zinc-200 mx-1 hidden sm:block" />

              {/* Presets */}
              <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200">
                <button
                  type="button"
                  onClick={() => {
                    shortcutConfigService.applyPreset('PRESENTER_REMOTE');
                    showShortcutNotice('Đã áp dụng cấu hình: Bút Trình Chiếu Chuẩn (PageDown / PageUp)');
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg hover:bg-white hover:text-zinc-900 text-zinc-600 transition-all cursor-pointer"
                  title="PageDown = Next, PageUp = Prev"
                >
                  Bút Trình Chiếu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    shortcutConfigService.applyPreset('KEYBOARD_STANDARD');
                    showShortcutNotice('Đã áp dụng cấu hình: Bàn Phím Chuẩn (Mũi tên / Enter / Phím cách)');
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg hover:bg-white hover:text-zinc-900 text-zinc-600 transition-all cursor-pointer"
                  title="Mũi tên phải/Space/Enter = Next, Mũi tên trái/Backspace = Prev"
                >
                  Bàn Phím Chuẩn
                </button>
                <button
                  type="button"
                  onClick={() => {
                    shortcutConfigService.applyPreset('INVERTED_CLICKER');
                    showShortcutNotice('Đã áp dụng cấu hình: Bút Trình Chiếu Đảo Ngược');
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg hover:bg-white hover:text-zinc-900 text-zinc-600 transition-all cursor-pointer"
                  title="PageUp = Next, PageDown = Prev"
                >
                  Đảo Ngược
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Bạn có chắc chắn muốn khôi phục toàn bộ phím tắt và hành vi về mặc định gốc?')) {
                    shortcutConfigService.resetToDefault();
                    showShortcutNotice('Đã khôi phục toàn bộ cài đặt về mặc định xuất xưởng!');
                  }
                }}
                className="p-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 hover:text-red-600 transition-all cursor-pointer"
                title="Khôi phục mặc định"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Interactive Live Key Tester Box */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white rounded-2xl p-5 shadow-md border border-zinc-700/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-700/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Khu Vực Bấm Thử Bút Trình Chiếu & Bàn Phím (Live Key Tester)
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 font-sans">
                Bấm bất kỳ nút nào trên bút clicker hoặc bàn phím để nhận diện ngay
              </span>
            </div>

            <div className="min-h-[72px] flex items-center justify-between flex-wrap gap-4 bg-zinc-950/60 rounded-xl p-4 border border-zinc-800">
              {lastTestedKey ? (
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Mã phím:</span>
                    <span className="px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-lg font-mono font-bold text-sm text-amber-300 tracking-wide shadow-xs flex items-center gap-2">
                      {lastTestedKey.isDouble && (
                        <span className="text-[10px] bg-amber-400 text-zinc-950 px-1.5 py-0.5 rounded font-bold font-sans tracking-tight">
                          ⚡ 2X BẤM ĐÚP
                        </span>
                      )}
                      {lastTestedKey.isChord && (
                        <span className="text-[10px] bg-emerald-400 text-zinc-950 px-1.5 py-0.5 rounded font-bold font-sans tracking-tight">
                          🤝 TỔ HỢP 2 PHÍM
                        </span>
                      )}
                      {lastTestedKey.isCombo && (
                        <span className="text-[10px] bg-blue-400 text-zinc-950 px-1.5 py-0.5 rounded font-bold font-sans tracking-tight">
                          ⌨ TỔ HỢP
                        </span>
                      )}
                      <span>{lastTestedKey.code}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Tên nhận diện:</span>
                    <span className="px-2.5 py-1 bg-zinc-800/80 rounded-lg text-xs font-semibold text-zinc-100">
                      {lastTestedKey.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Hành động kích hoạt:</span>
                    {lastTestedKey.action ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 animate-pulse">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {shortcutConfigService.getActionLabel(lastTestedKey.action).title}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        Chưa gán vào hành động nào
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-zinc-400 text-xs py-1">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <Keyboard className="w-4 h-4" />
                  </div>
                  <span>Chưa nhận tín hiệu. Bấm phím đơn, bấm đúp 2 lần (2x), hoặc tổ hợp phím trên bút clicker / bàn phím...</span>
                </div>
              )}

              {lastTestedKey && (
                <button
                  type="button"
                  onClick={() => setLastTestedKey(null)}
                  className="text-[11px] text-zinc-400 hover:text-white px-2 py-1 rounded-md hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  Xóa kết quả
                </button>
              )}
            </div>
          </div>

          {/* 3. Key Mapping Table */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-sm text-zinc-900 flex items-center gap-2">
                  <span>Danh Sách Phím Tắt Đã Gán (Key Bindings)</span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Mỗi hành động có thể gán phím đơn, cử chỉ bấm đúp 2 lần (2x), hoặc tổ hợp phím (Ctrl/Alt/Shift).
                </p>
              </div>

              {!recordingAction && (
                <div className="flex items-center gap-2 text-xs text-zinc-500 flex-wrap">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                    ⚡ 2x = Bấm đúp
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    🤝 Chord = Tổ hợp 2 phím (Right + Left)
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                    ⌨ Combo = Phím máy tính
                  </span>
                </div>
              )}
            </div>

            {/* Overhauled Recording Overlay Banner */}
            {recordingAction && (
              <div className="p-4 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/10 border-b border-amber-200/80 animate-fade-in space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                    <div>
                      <div className="text-xs font-bold text-zinc-900 flex items-center gap-2 flex-wrap">
                        <span>Đang lắng nghe phím bấm cho:</span>
                        <span className="text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-lg font-bold">
                          {shortcutConfigService.getActionLabel(recordingAction).title}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-600 mt-0.5">
                        Nhấn nút trên bút clicker hoặc bàn phím. Hệ thống sẽ tự động phân tích phím đơn, bấm đúp (2x) hoặc tổ hợp 2 phím (Right + Left).
                      </div>
                    </div>
                  </div>

                  {/* Mode selection pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setRecorderMode('auto')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        recorderMode === 'auto'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50'
                      }`}
                      title="Bấm 1 lần = phím đơn, bấm 2 nút khác nhau = tổ hợp 2 phím, bấm 2 lần cùng nút = gán đúp 2x"
                    >
                      ⚡ Tự động (Auto 1x / 2x / Chord)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecorderMode('force2x')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        recorderMode === 'force2x'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50'
                      }`}
                      title="Bấm bất kỳ phím nào sẽ gán ngay thành cử chỉ Bấm đúp 2 lần (2x)"
                    >
                      ⚡⚡ Chế độ 2x (Bấm đúp)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (recordingTimerRef.current) {
                          clearTimeout(recordingTimerRef.current);
                          recordingTimerRef.current = null;
                        }
                        setRecordingPendingKey(null);
                        setRecordingAction(null);
                        showShortcutNotice('Đã hủy gán phím', 'info');
                      }}
                      className="px-3 py-1 rounded-xl text-xs font-bold bg-white text-red-600 border border-red-200 hover:bg-red-50 transition-all cursor-pointer"
                    >
                      ✕ Hủy (ESC)
                    </button>
                  </div>
                </div>

                {/* Detection Guide & Status */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-white/80 border border-zinc-200/80 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">1x</span>
                    <span><strong>Bấm 1 lần:</strong> Phím đơn (chờ 0.6s)</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/80 border border-emerald-200 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">🤝</span>
                    <span><strong>Bấm 2 nút (Right + Left):</strong> Tổ hợp 2 phím</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/80 border border-amber-200 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-[10px]">2x</span>
                    <span><strong>Bấm 2 lần cùng nút:</strong> Bấm Đúp (2x)</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/80 border border-purple-200 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px]">⌥</span>
                    <span><strong>Giữ Ctrl/Alt/Shift:</strong> Phím Máy Tính</span>
                  </div>
                </div>

                {/* Pending Key Feedback */}
                {recordingPendingKey && (
                  <div className="p-3 bg-amber-100/90 border border-amber-300 rounded-xl flex items-center justify-between gap-2 text-xs font-bold text-amber-950 animate-pulse">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>⚡ Đã nhận phím 1:</span>
                      <span className="px-2 py-0.5 rounded bg-amber-200 font-mono text-amber-900 font-bold">
                        {recordingPendingKey.name} ({recordingPendingKey.code})
                      </span>
                      <span>Hãy bấm tiếp phím thứ 2 (ví dụ [Phím Trái] để tạo tổ hợp Right + Left), hoặc bấm lại để tạo Bấm Đúp 2x, hoặc đợi 0.6s để lưu phím đơn...</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-800 bg-white/80 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                      Đang chờ phím 2 (0.6s)...
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50/75 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 w-[28%]">Hành Động (Action)</th>
                    <th className="py-3 px-4 w-[48%]">Các Phím Đang Gán (Assigned Keys)</th>
                    <th className="py-3 px-4 w-[24%] text-right">Thao Tác Gán Phím</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {(['next', 'prev', 'replay', 'blackout', 'subtitle', 'drawer', 'fullscreen'] as ClickerAction[]).map((action) => {
                    const label = shortcutConfigService.getActionLabel(action);
                    const keys = shortcutConfig.keyBindings[action] || [];
                    const isRecording = recordingAction === action;

                    return (
                      <tr key={action} className={`hover:bg-zinc-50/60 transition-colors ${isRecording ? 'bg-amber-50/50' : ''}`}>
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-bold text-zinc-900 text-xs">{label.title}</div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">{label.description}</div>
                        </td>

                        <td className="py-3.5 px-4 align-middle">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {keys.length > 0 ? (
                              keys.map((k) => {
                                const isDouble = k.startsWith('2x:');
                                const isPlus = k.includes('+');
                                const parts = isPlus ? k.split('+') : [];
                                const hasModifier = parts.some(p => ['ctrl', 'control', 'alt', 'shift', 'meta', 'cmd'].includes(p.toLowerCase()));
                                const isChord = isPlus && !hasModifier;
                                const isCombo = isPlus && hasModifier;

                                const badgeClass = isDouble
                                  ? 'bg-amber-50 hover:bg-amber-100/80 border-amber-300 text-amber-900'
                                  : isChord
                                  ? 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-300 text-emerald-900'
                                  : isCombo
                                  ? 'bg-blue-50 hover:bg-blue-100/80 border-blue-300 text-blue-900'
                                  : 'bg-zinc-100 hover:bg-zinc-200/80 border-zinc-200 text-zinc-800';

                                const friendlyName = shortcutConfigService.getKeyFriendlyName(k);

                                return (
                                  <span
                                    key={k}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold shadow-2xs transition-all ${badgeClass}`}
                                  >
                                    {isDouble && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-mono">
                                        ⚡ 2X
                                      </span>
                                    )}
                                    {isChord && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 font-mono">
                                        🤝 CHORD
                                      </span>
                                    )}
                                    {isCombo && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-200 text-blue-900 font-mono">
                                        ⌨ COMBO
                                      </span>
                                    )}
                                    <span>{friendlyName}</span>
                                    <span className="text-[10px] opacity-60 font-mono">({k})</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        shortcutConfigService.removeKeyFromAction(action, k);
                                        showShortcutNotice(`Đã xóa phím "${k}" khỏi "${label.title}"`);
                                      }}
                                      className="ml-1 text-zinc-400 hover:text-red-600 cursor-pointer font-bold"
                                      title="Xóa phím này"
                                    >
                                      ✕
                                    </button>
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-zinc-400 italic text-xs">Chưa gán phím nào</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isRecording ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (recordingTimerRef.current) {
                                    clearTimeout(recordingTimerRef.current);
                                    recordingTimerRef.current = null;
                                  }
                                  setRecordingPendingKey(null);
                                  setRecordingAction(null);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs cursor-pointer animate-pulse"
                              >
                                Đang bấm... (Hủy)
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (recordingTimerRef.current) {
                                    clearTimeout(recordingTimerRef.current);
                                    recordingTimerRef.current = null;
                                  }
                                  setRecordingPendingKey(null);
                                  setRecordingAction(action);
                                  showShortcutNotice(`Nhấn phím trên clicker hoặc bàn phím để gán cho "${label.title}" (bấm 2 lần để gán đúp 2x)`, 'info');
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-white text-zinc-700 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:border-zinc-300"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Gán Phím</span>
                              </button>
                            )}

                            {/* Quick Add Dropdown with 2x, Chords, and Combos */}
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  shortcutConfigService.addKeyToAction(action, e.target.value);
                                  showShortcutNotice(`Đã gán "${shortcutConfigService.getKeyFriendlyName(e.target.value)}" vào "${label.title}"`);
                                  e.target.value = '';
                                }
                              }}
                              className="px-2 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-[11px] font-semibold text-zinc-600 hover:bg-white cursor-pointer max-w-[160px]"
                            >
                              <option value="">+ Thêm nhanh phím</option>
                              <optgroup label="🤝 Tổ hợp 2 Phím Clicker (Chord / Sequence)">
                                <option value="ArrowRight+ArrowLeft">🤝 Tổ hợp: → (Phải) + ← (Trái)</option>
                                <option value="PageDown+PageUp">🤝 Tổ hợp: Page Down + Page Up</option>
                                <option value="ArrowLeft+ArrowRight">🤝 Tổ hợp: ← (Trái) + → (Phải)</option>
                                <option value="PageUp+PageDown">🤝 Tổ hợp: Page Up + Page Down</option>
                              </optgroup>
                              <optgroup label="⚡ Cử chỉ Bấm Đúp 2 Lần (Double-Press)">
                                <option value="2x:ArrowLeft">⚡ Bấm đúp 2x: ← (Mũi tên Trái)</option>
                                <option value="2x:PageUp">⚡ Bấm đúp 2x: Page Up</option>
                                <option value="2x:ArrowRight">⚡ Bấm đúp 2x: → (Mũi tên Phải)</option>
                                <option value="2x:PageDown">⚡ Bấm đúp 2x: Page Down</option>
                                <option value="2x:Space">⚡ Bấm đúp 2x: Phím Cách (Space)</option>
                              </optgroup>
                              <optgroup label="Bút Clicker & Di Chuyển (Phím đơn)">
                                <option value="PageDown">PageDown</option>
                                <option value="PageUp">PageUp</option>
                                <option value="ArrowRight">ArrowRight (→)</option>
                                <option value="ArrowLeft">ArrowLeft (←)</option>
                                <option value="ArrowUp">ArrowUp (↑)</option>
                                <option value="ArrowDown">ArrowDown (↓)</option>
                                <option value="Space">Space (Phím cách)</option>
                                <option value="Enter">Enter (↵)</option>
                                <option value="Backspace">Backspace</option>
                              </optgroup>
                              <optgroup label="Phím Chữ & Ký Tự">
                                <option value="KeyR">Key R (Replay)</option>
                                <option value="KeyB">Key B (Blackout)</option>
                                <option value="Period">Period (.)</option>
                                <option value="KeyV">Key V (Vietsub)</option>
                                <option value="KeyP">Key P (Parts)</option>
                                <option value="KeyL">Key L (List)</option>
                                <option value="KeyF">Key F (Fullscreen)</option>
                                <option value="F5">F5</option>
                                <option value="F11">F11</option>
                              </optgroup>
                              <optgroup label="Tổ hợp Phím Thường Dùng (Combine)">
                                <option value="Ctrl+KeyR">Ctrl + Phím R (Replay)</option>
                                <option value="Shift+KeyR">Shift + Phím R</option>
                                <option value="Ctrl+KeyB">Ctrl + Phím B (Blackout)</option>
                                <option value="Alt+KeyB">Alt + Phím B</option>
                                <option value="Ctrl+Space">Ctrl + Phím Cách</option>
                              </optgroup>
                              <optgroup label="Phím Số (Lặp & Ngôn ngữ)">
                                <option value="Digit1">Phím 1</option>
                                <option value="Digit2">Phím 2</option>
                                <option value="Digit3">Phím 3</option>
                              </optgroup>
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Navigation & Audio Behaviors Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card Focus Mode */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                    F
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-zinc-900">
                      Hành Vi Chế Độ Focus (Classroom Presentation)
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Cài đặt điều phối âm thanh khi dùng Remote Clicker trong lớp học chính khóa
                    </p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  FOCUS
                </span>
              </div>

              <div className="space-y-4 text-xs">
                {/* Toggle 1: Play Audio on Prev */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                  <div>
                    <div className="font-bold text-zinc-900">Tự động phát âm thanh khi lùi câu (Play audio on Prev)</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      {shortcutConfig.focusMode.playAudioOnPrev 
                        ? 'Đang BẬT: Khi bấm lùi về câu trước, hệ thống sẽ phát âm thanh câu đó.' 
                        : 'Đang TẮT: Khi bấm lùi, chỉ chuyển slide và ngắt âm thanh để không làm ồn lớp học.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !shortcutConfig.focusMode.playAudioOnPrev;
                      shortcutConfigService.updateModeBehavior('focusMode', { playAudioOnPrev: nextVal });
                      showShortcutNotice(`Focus Mode: Tự động phát âm khi lùi đã ${nextVal ? 'BẬT' : 'TẮT'}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      shortcutConfig.focusMode.playAudioOnPrev 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-zinc-200 text-zinc-600'
                    }`}
                  >
                    {shortcutConfig.focusMode.playAudioOnPrev ? 'BẬT' : 'TẮT'}
                  </button>
                </div>

                {/* Toggle 2: Double Press Prev to Replay */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                  <div>
                    <div className="font-bold text-zinc-900">Bấm đúp phím Lùi để Replay (Double-press Prev to Replay)</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      {shortcutConfig.focusMode.enableDoublePressReplay 
                        ? 'Đang BẬT: Bấm 2 lần nhanh phím Lùi sẽ phát lại âm thanh của câu hiện tại.' 
                        : 'Đang TẮT: Bấm phím Lùi sẽ thực thi ngay lập tức không có độ trễ nhận diện đúp.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !shortcutConfig.focusMode.enableDoublePressReplay;
                      shortcutConfigService.updateModeBehavior('focusMode', { enableDoublePressReplay: nextVal });
                      showShortcutNotice(`Focus Mode: Bấm đúp để Replay đã ${nextVal ? 'BẬT' : 'TẮT'}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      shortcutConfig.focusMode.enableDoublePressReplay 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-zinc-200 text-zinc-600'
                    }`}
                  >
                    {shortcutConfig.focusMode.enableDoublePressReplay ? 'BẬT' : 'TẮT'}
                  </button>
                </div>

                {/* Slider: Double press timeout */}
                {shortcutConfig.focusMode.enableDoublePressReplay && (
                  <div className="p-3 rounded-xl bg-blue-50/40 border border-blue-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-800">Thời gian nhận diện bấm đúp (Timeout)</span>
                      <span className="font-mono font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded text-[11px]">
                        {shortcutConfig.focusMode.doublePressTimeoutMs} ms
                      </span>
                    </div>
                    <input
                      type="range"
                      min={250}
                      max={700}
                      step={10}
                      value={shortcutConfig.focusMode.doublePressTimeoutMs}
                      onChange={(e) => {
                        const ms = parseInt(e.target.value, 10);
                        shortcutConfigService.updateModeBehavior('focusMode', { doublePressTimeoutMs: ms });
                      }}
                      className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                      <span>Nhanh (250ms)</span>
                      <span>Mặc định (420ms)</span>
                      <span>Chậm (700ms)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card Improv Mode */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
                    I
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-zinc-900">
                      Hành Vi Chế Độ Improv (Luyện Phản Xạ Improv)
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Cài đặt điều phối âm thanh khi trình chiếu gợi ý & phản xạ nhanh
                    </p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                  IMPROV
                </span>
              </div>

              <div className="space-y-4 text-xs">
                {/* Toggle 1: Play Audio on Prev */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                  <div>
                    <div className="font-bold text-zinc-900">Tự động phát âm thanh khi lùi gợi ý (Play audio on Prev)</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      {shortcutConfig.improvMode.playAudioOnPrev 
                        ? 'Đang BẬT: Khi lùi gợi ý, tự động đọc lại các hint tương ứng.' 
                        : 'Đang TẮT (Khuyên dùng): Lùi gợi ý trong im lặng để học viên tự nhớ lại.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !shortcutConfig.improvMode.playAudioOnPrev;
                      shortcutConfigService.updateModeBehavior('improvMode', { playAudioOnPrev: nextVal });
                      showShortcutNotice(`Improv Mode: Tự động phát âm khi lùi đã ${nextVal ? 'BẬT' : 'TẮT'}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      shortcutConfig.improvMode.playAudioOnPrev 
                        ? 'bg-purple-600 text-white shadow-xs' 
                        : 'bg-zinc-200 text-zinc-600'
                    }`}
                  >
                    {shortcutConfig.improvMode.playAudioOnPrev ? 'BẬT' : 'TẮT'}
                  </button>
                </div>

                {/* Toggle 2: Double Press Prev to Replay */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                  <div>
                    <div className="font-bold text-zinc-900">Bấm đúp phím Lùi để Replay (Double-press Prev to Replay)</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      {shortcutConfig.improvMode.enableDoublePressReplay 
                        ? 'Đang BẬT: Bấm 2 lần nhanh phím Lùi sẽ phát lại các gợi ý đã mở kèm khoảng nghỉ.' 
                        : 'Đang TẮT: Bấm phím Lùi sẽ thực thi lùi ngay lập tức.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !shortcutConfig.improvMode.enableDoublePressReplay;
                      shortcutConfigService.updateModeBehavior('improvMode', { enableDoublePressReplay: nextVal });
                      showShortcutNotice(`Improv Mode: Bấm đúp để Replay đã ${nextVal ? 'BẬT' : 'TẮT'}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      shortcutConfig.improvMode.enableDoublePressReplay 
                        ? 'bg-purple-600 text-white shadow-xs' 
                        : 'bg-zinc-200 text-zinc-600'
                    }`}
                  >
                    {shortcutConfig.improvMode.enableDoublePressReplay ? 'BẬT' : 'TẮT'}
                  </button>
                </div>

                {/* Slider: Double press timeout */}
                {shortcutConfig.improvMode.enableDoublePressReplay && (
                  <div className="p-3 rounded-xl bg-purple-50/40 border border-purple-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-800">Thời gian nhận diện bấm đúp (Timeout)</span>
                      <span className="font-mono font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded text-[11px]">
                        {shortcutConfig.improvMode.doublePressTimeoutMs} ms
                      </span>
                    </div>
                    <input
                      type="range"
                      min={250}
                      max={700}
                      step={10}
                      value={shortcutConfig.improvMode.doublePressTimeoutMs}
                      onChange={(e) => {
                        const ms = parseInt(e.target.value, 10);
                        shortcutConfigService.updateModeBehavior('improvMode', { doublePressTimeoutMs: ms });
                      }}
                      className="w-full h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                      <span>Nhanh (250ms)</span>
                      <span>Mặc định (420ms)</span>
                      <span>Chậm (700ms)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Persistent Auto-save notice */}
          <div className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Tất cả thay đổi phím tắt & hành vi âm thanh được tự động lưu vào bộ nhớ cục bộ (localStorage).</span>
            </div>
            <span className="font-mono text-[11px] text-zinc-400">chunks_presentation_shortcuts_v1</span>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADD CUSTOM MODEL */}
      {/* ===================================================================== */}
      {isAddCustomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-lg w-full p-6 shadow-xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-display font-bold text-base text-zinc-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Thêm Model Giọng Đọc Mới (Custom Model)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddCustomModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomModel} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">
                  Mã Model (Model ID) *
                </label>
                <input
                  type="text"
                  required
                  value={customModelForm.id}
                  onChange={(e) => setCustomModelForm(prev => ({ ...prev, id: e.target.value }))}
                  placeholder="VD: custom-voice-sarah hoặc tts-1-custom"
                  className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900 focus:bg-white focus:outline-none focus:border-[#DC2626]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">
                  Tên Hiển Thị (Display Name) *
                </label>
                <input
                  type="text"
                  required
                  value={customModelForm.name}
                  onChange={(e) => setCustomModelForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: Sarah (Nữ Mỹ Truyền Cảm)"
                  className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:bg-white focus:outline-none focus:border-[#DC2626]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">
                    Ngôn Ngữ (Language)
                  </label>
                  <select
                    value={customModelForm.language}
                    onChange={(e) => setCustomModelForm(prev => ({ ...prev, language: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <option value="en">Tiếng Anh (en)</option>
                    <option value="vi">Tiếng Việt (vi)</option>
                    <option value="other">Khác (other)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">
                    Giới Tính (Gender)
                  </label>
                  <select
                    value={customModelForm.gender}
                    onChange={(e) => setCustomModelForm(prev => ({ ...prev, gender: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <option value="FEMALE">Nữ (Female)</option>
                    <option value="MALE">Nam (Male)</option>
                    <option value="NEUTRAL">Trung Tính (Neutral)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">
                  Nhà Cung Cấp (Provider)
                </label>
                <select
                  value={customModelForm.provider}
                  onChange={(e) => setCustomModelForm(prev => ({ ...prev, provider: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {(Object.keys(PROVIDERS_META) as TtsProviderType[]).map(p => (
                    <option key={p} value={p}>{PROVIDERS_META[p].name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">
                  Mô Tả Giọng Đọc
                </label>
                <textarea
                  rows={2}
                  value={customModelForm.description}
                  onChange={(e) => setCustomModelForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ghi chú về ngữ điệu, mục đích sử dụng..."
                  className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:bg-white focus:outline-none focus:border-[#DC2626]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAddCustomModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Đăng Ký Model
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: IMPORT MODELS FROM PROVIDER / JSON */}
      {/* ===================================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-xl w-full p-6 shadow-xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-display font-bold text-base text-zinc-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#DC2626]" />
                <span>Import Catalog Model Từ Provider Hoặc JSON</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Quick 1-Click Presets */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                1-Click Cài Đặt Catalog Mẫu Chuẩn
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    modelRegistryService.resetModelsToDefault();
                    alert('Đã khôi phục toàn bộ model chuẩn của Google Cloud, Deepgram và Gemini!');
                    setIsImportModalOpen(false);
                  }}
                  className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-left cursor-pointer transition-all"
                >
                  <span className="font-bold text-xs text-zinc-900 block">Tất Cả Mặc Định</span>
                  <span className="text-[10px] text-zinc-500">Google + Deepgram + Gemini</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const deepgramVoices = DEFAULT_REGISTERED_MODELS.filter(m => m.provider === 'DEEPGRAM');
                    modelRegistryService.importModelsFromJson(JSON.stringify(deepgramVoices));
                    alert('Đã cập nhật toàn bộ 13 giọng Deepgram Aura/Flux!');
                    setIsImportModalOpen(false);
                  }}
                  className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-left cursor-pointer transition-all"
                >
                  <span className="font-bold text-xs text-emerald-900 block">Deepgram Catalog</span>
                  <span className="text-[10px] text-emerald-700">Flux Cliff + 12 Aura Voices</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const googleVoices = DEFAULT_REGISTERED_MODELS.filter(m => m.provider === 'GOOGLE_TTS');
                    modelRegistryService.importModelsFromJson(JSON.stringify(googleVoices));
                    alert('Đã cập nhật toàn bộ 48 giọng Google Cloud TTS (Journey, Chirp3-HD, Neural2)!');
                    setIsImportModalOpen(false);
                  }}
                  className="p-3 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-left cursor-pointer transition-all"
                >
                  <span className="font-bold text-xs text-blue-900 block">Google Cloud</span>
                  <span className="text-[10px] text-blue-700">Journey + 30 Chirp3-HD</span>
                </button>
              </div>
            </div>

            {/* JSON Input Section */}
            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                Nhập Dữ Liệu Tùy Biến Định Dạng JSON
              </span>
              <textarea
                rows={6}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='[ { "id": "my-voice", "name": "Giọng đọc mới", "language": "en", "gender": "FEMALE", "provider": "CUSTOM_TTS" } ]'
                className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:bg-white focus:outline-none focus:border-[#DC2626]"
              />
              {importNotice && (
                <div className="p-2.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl">
                  {importNotice}
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleImportJson}
                disabled={!importJsonText.trim()}
                className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
              >
                Nhập JSON Ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
