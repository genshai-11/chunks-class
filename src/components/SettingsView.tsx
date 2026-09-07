import React, { useState, useEffect } from 'react';
import { Cohort, CourseLevel, LanguageMode, CohortAudioSettings } from '../types';
import { calculateSessions } from '../utils/scheduler';
import { curriculumRegistry } from '../services/curriculumRegistry';
import { 
  modelRegistryService, 
  RegisteredModel, 
  ProviderApiKey, 
  TtsProviderType, 
  PROVIDERS_META,
  DEFAULT_REGISTERED_MODELS
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
  ShieldCheck, 
  Clock, 
  RefreshCw,
  ExternalLink,
  Info,
  CheckSquare
} from 'lucide-react';

type SubTabId = 'cohort' | 'main-models' | 'providers' | 'import-audition' | 'visibility-matrix';

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

  // Provider Tab State
  const [selectedProvider, setSelectedProvider] = useState<TtsProviderType>('GOOGLE_TTS');
  const [newKeyInput, setNewKeyInput] = useState<string>('');
  const [newKeyLabel, setNewKeyLabel] = useState<string>('');
  const [customEndpointInput, setCustomEndpointInput] = useState<string>(() => modelRegistryService.getCustomEndpoint());
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  // Audio Preview State
  const [previewingModelId, setPreviewingModelId] = useState<string | null>(null);
  const [auditionSearch, setAuditionSearch] = useState<string>('');
  const [auditionLangFilter, setAuditionLangFilter] = useState<'all' | 'en' | 'vi'>('all');
  const [auditionProviderFilter, setAuditionProviderFilter] = useState<'all' | TtsProviderType>('all');

  // Matrix Tab State
  const [matrixSearch, setMatrixSearch] = useState<string>('');
  const [matrixLangFilter, setMatrixLangFilter] = useState<'all' | 'en' | 'vi'>('all');

  // Modals
  const [isAddCustomModalOpen, setIsAddCustomModalOpen] = useState<boolean>(false);
  const [customModelForm, setCustomModelForm] = useState<{
    id: string;
    name: string;
    language: 'en' | 'vi' | 'other';
    gender: 'FEMALE' | 'MALE' | 'NEUTRAL';
    provider: TtsProviderType;
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

  // Sync Registry State
  useEffect(() => {
    const unsub = modelRegistryService.subscribe(() => {
      setModels(modelRegistryService.getAllModels());
      setKeys(modelRegistryService.getAllKeys());
      setMainEn(modelRegistryService.getMainModelEn());
      setMainVi(modelRegistryService.getMainModelVi());
      setCustomEndpointInput(modelRegistryService.getCustomEndpoint());
    });
    return unsub;
  }, []);

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
    { id: 'import-audition', label: '4. Import & Nghe Thử Model', icon: <Volume2 className="w-4 h-4" /> },
    { id: 'visibility-matrix', label: '5. Ma Trận Hiển Thị (Improv & Focus)', icon: <Layers className="w-4 h-4" />, badge: 'MATRIX' }
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

  // Filtering for Matrix Tab
  const filteredMatrixModels = models.filter(m => {
    const matchSearch = matrixSearch === '' || 
      m.name.toLowerCase().includes(matrixSearch.toLowerCase()) || 
      m.id.toLowerCase().includes(matrixSearch.toLowerCase());
    const matchLang = matrixLangFilter === 'all' || m.language === matrixLangFilter;
    return matchSearch && matchLang;
  });

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
                  Đăng ký ID giọng đọc tùy chỉnh từ OpenAI, Custom Server hoặc Google Cloud.
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
              Khi API của Google Cloud, Gemini Flash, Deepgram hoặc OpenAI trả về mã phản hồi <span className="font-mono text-amber-300 font-bold">HTTP 429 (Too Many Requests / Quota Exceeded)</span>, hệ thống sẽ tự động gán nhãn <span className="font-mono text-amber-300 font-bold">RATE_LIMITED</span> cho key đó trong 60 giây và ngay lập tức kích hoạt key kế tiếp trong Pool để bài giảng và phát âm của học sinh diễn ra liên tục, không bao giờ bị nghẽn gián đoạn.
            </p>
          </div>

          {/* Provider Cards Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {(Object.keys(PROVIDERS_META) as TtsProviderType[]).map((provKey) => {
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
                      selectedProvider === 'OPENAI_TTS' ? 'sk-proj-...' :
                      selectedProvider === 'GEMINI_AI_STUDIO' ? 'AQ.Ab8...' :
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
      {/* TAB 4: IMPORT & AUDIO AUDITION */}
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

            {/* Filter & Search */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMatrixLangFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    matrixLangFilter === 'all' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600'
                  }`}
                >
                  Tất Cả ({models.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMatrixLangFilter('en')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    matrixLangFilter === 'en' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600'
                  }`}
                >
                  English ({models.filter(m => m.language === 'en').length})
                </button>
                <button
                  type="button"
                  onClick={() => setMatrixLangFilter('vi')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    matrixLangFilter === 'vi' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600'
                  }`}
                >
                  Tiếng Việt ({models.filter(m => m.language === 'vi').length})
                </button>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  placeholder="Lọc ma trận theo tên model..."
                  className="w-full pl-9 pr-3.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:border-[#DC2626]"
                />
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto border border-zinc-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-200 text-[10px] uppercase font-mono text-zinc-600">
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
                  {filteredMatrixModels.map((m) => {
                    const isMain = mainEn === m.id || mainVi === m.id;
                    const isPlaying = previewingModelId === m.id;

                    return (
                      <tr key={m.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div>
                              <span className="font-bold text-xs text-zinc-900 block">{m.name}</span>
                              <span className="font-mono text-[10px] text-zinc-400">{m.id}</span>
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
                  })}
                </tbody>
              </table>
            </div>
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
                    alert('Đã khôi phục toàn bộ 50+ model chuẩn của Google Cloud, Deepgram và OpenAI!');
                    setIsImportModalOpen(false);
                  }}
                  className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-left cursor-pointer transition-all"
                >
                  <span className="font-bold text-xs text-zinc-900 block">Tất Cả Mặc Định</span>
                  <span className="text-[10px] text-zinc-500">Google + Deepgram + OpenAI</span>
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
                placeholder='[ { "id": "my-voice", "name": "Giọng đọc mới", "language": "en", "gender": "FEMALE", "provider": "OPENAI_TTS" } ]'
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
