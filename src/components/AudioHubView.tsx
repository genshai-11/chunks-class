import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CohortAudioSettings, LanguageMode, CourseLevel, LessonDoc } from '../types';
import { 
  audioPlayer, 
  AudioSourceType, 
  AudioProvider, 
  AudioBatchTarget,
  sanitizeSpeechText,
  GOOGLE_TTS_VOICES,
  exportAllAudioBlobs,
  importAudioBlobs,
  getStoredAudioBlobsCount,
  AudioCacheExportData
} from '../services/googleTtsService';
import { DEEPGRAM_AURA_VOICES } from '../services/deepgramTtsService';
import { getAllLessons } from '../services/firestoreService';
import { curriculumRegistry } from '../services/curriculumRegistry';
import { AudioDiagnosticModal } from './AudioDiagnosticModal';
import { 
  Volume2, 
  Sparkles, 
  Play, 
  Headphones,
  SlidersHorizontal,
  Cloud,
  Layers,
  CheckCircle2,
  Radio,
  FileAudio,
  Activity,
  Zap,
  Key,
  Save,
  RotateCcw,
  Loader2,
  Check,
  AlertCircle,
  Search,
  Download,
  Upload,
  Database
} from 'lucide-react';

interface AudioHubViewProps {
  settings?: CohortAudioSettings;
  onUpdateSettings: (settings: CohortAudioSettings) => void;
}

const DEFAULT_AUDIO_SETTINGS: CohortAudioSettings = {
  voice_profile_en: 'aura-asteria-en',
  voice_profile_vi: 'vi-VN-Neural2-A',
  language_mode: 'EN_THEN_VI',
  auto_advance_delay_sec: 0,
  default_speed: 1.0,
  repeat_count: 1
};

export const AudioHubView: React.FC<AudioHubViewProps> = ({
  settings,
  onUpdateSettings
}) => {
  const currentSettings: CohortAudioSettings = {
    ...DEFAULT_AUDIO_SETTINGS,
    ...(settings || {})
  };

  // 1. Audio Presets & Audition State
  const [testEnglishText, setTestEnglishText] = useState<string>(
    "Once you master these chunks, // speaking English becomes effortless."
  );
  const [testVietnameseText, setTestVietnameseText] = useState<string>(
    "Một khi bạn làm chủ các cụm từ này, // nói tiếng Anh sẽ trở nên vô cùng tự nhiên."
  );
  const [isPlayingEn, setIsPlayingEn] = useState<boolean>(false);
  const [isPlayingVi, setIsPlayingVi] = useState<boolean>(false);
  const [isPlayingSequence, setIsPlayingSequence] = useState<boolean>(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState<boolean>(false);
  const [activeAudioSource, setActiveAudioSource] = useState<AudioSourceType>(audioPlayer.getLastSource());
  
  // 2. Batch Preparation Hub State
  const [selectedCourseLevel, setSelectedCourseLevel] = useState<CourseLevel>('LEVEL_B_ERES');
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [batchTarget, setBatchTarget] = useState<AudioBatchTarget>('BOTH');
  const [isBatchPrepping, setIsBatchPrepping] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [batchSummary, setBatchSummary] = useState<string | null>(null);

  // 3. Lessons & Cache Readiness Matrix
  const [courseLessons, setCourseLessons] = useState<LessonDoc[]>([]);
  const [cacheStatusMap, setCacheStatusMap] = useState<Record<string, { en: number; vi: number; total: number }>>({});

  // 4. Audio Cache Migration & Backup State
  const [cacheEntriesCount, setCacheEntriesCount] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshCacheCount = useCallback(async () => {
    try {
      const count = await getStoredAudioBlobsCount();
      setCacheEntriesCount(count);
    } catch (e) {
      console.error('Failed to get cache count:', e);
    }
  }, []);

  // 5. API Key & Provider State
  const [audioProvider, setAudioProvider] = useState<AudioProvider>(audioPlayer.getAudioProvider());
  const [deepgramKeyInput, setDeepgramKeyInput] = useState<string>(
    localStorage.getItem('chunks_deepgram_api_key') || '51d7d8b230bf742178e681e7836a3dc1571b1c11'
  );
  const [isKeySaved, setIsKeySaved] = useState<boolean>(false);

  const loadLessonsAndCacheStatus = useCallback(async () => {
    try {
      const lessons = await getAllLessons(selectedCourseLevel);
      setCourseLessons(lessons);

      const statusMap: Record<string, { en: number; vi: number; total: number }> = {};
      for (const l of lessons) {
        const status = audioPlayer.getLessonAudioStatus(
          l.chunks,
          currentSettings.voice_profile_en,
          currentSettings.voice_profile_vi
        );
        statusMap[l.id] = { en: status.enCached, vi: status.viCached, total: status.total };
      }
      setCacheStatusMap(statusMap);
      await refreshCacheCount();
    } catch (e) {
      console.error(e);
    }
  }, [selectedCourseLevel, currentSettings.voice_profile_en, currentSettings.voice_profile_vi, refreshCacheCount]);

  useEffect(() => {
    loadLessonsAndCacheStatus();
    refreshCacheCount();
  }, [loadLessonsAndCacheStatus, refreshCacheCount]);

  useEffect(() => {
    const unsub = audioPlayer.onSourceChange((source) => {
      setActiveAudioSource(source);
    });
    return unsub;
  }, []);

  const voiceProfilesDeepgram = [
    { id: 'aura-asteria-en', name: 'Deepgram Asteria (Nữ Mỹ)', desc: 'Tự nhiên, sắc nét, truyền cảm — Chuẩn phát âm phản xạ lớp học', tag: 'KHUYÊN DÙNG' },
    { id: 'aura-luna-en', name: 'Deepgram Luna (Nữ Mỹ)', desc: 'Ấm áp, gần gũi, ngữ điệu giao tiếp đời thường', tag: 'GIAO TIẾP' },
    { id: 'aura-stella-en', name: 'Deepgram Stella (Nữ Mỹ)', desc: 'Rõ ràng, chuyên nghiệp cho các bài phát âm chính xác', tag: 'CHUẨN MỰC' },
    { id: 'aura-orion-en', name: 'Deepgram Orion (Nam Mỹ)', desc: 'Trầm ấm, nội lực, phù hợp luyện ngữ điệu nam giới', tag: 'NAM MỸ' },
    { id: 'aura-arcas-en', name: 'Deepgram Arcas (Nam Mỹ)', desc: 'Năng động, nhanh nhẹn, ngữ điệu thanh niên Mỹ', tag: 'NĂNG ĐỘNG' },
    { id: 'aura-helios-en', name: 'Deepgram Helios (Nam Anh)', desc: 'Giọng Anh - Anh chuẩn mực, rõ trọng âm từng âm tiết', tag: 'BRITISH' }
  ];

  const voiceProfilesGoogle = [
    { id: 'en-US-Journey-F', name: 'Google Journey Female', desc: 'Ngữ điệu tự nhiên cao cấp với biến thiên âm điệu linh hoạt', tag: 'JOURNEY AI' },
    { id: 'en-US-Journey-M', name: 'Google Journey Male', desc: 'Giọng nam trầm ấm, phát âm rõ ràng', tag: 'JOURNEY AI' },
    { id: 'en-US-Studio-O', name: 'Google Studio Narrator', desc: 'Giọng đọc chuẩn phòng thu cho tài liệu học thuật', tag: 'STUDIO' }
  ];

  // Vietnamese Voice Category Filter & Dynamic List
  const [viCategoryFilter, setViCategoryFilter] = useState<'ALL' | 'CHIRP3_HD' | 'NEURAL2' | 'WAVENET' | 'STANDARD'>('ALL');
  const [viGenderFilter, setViGenderFilter] = useState<'ALL' | 'FEMALE' | 'MALE'>('ALL');
  const [viSearchQuery, setViSearchQuery] = useState<string>('');

  const allViVoices = useMemo(() => {
    return GOOGLE_TTS_VOICES.filter(v => v.languageCode === 'vi-VN');
  }, []);

  const filteredViVoices = useMemo(() => {
    return allViVoices.filter(voice => {
      if (viCategoryFilter === 'CHIRP3_HD' && !voice.id.includes('Chirp3-HD')) return false;
      if (viCategoryFilter === 'NEURAL2' && !voice.id.includes('Neural2')) return false;
      if (viCategoryFilter === 'WAVENET' && !voice.id.includes('Wavenet')) return false;
      if (viCategoryFilter === 'STANDARD' && !voice.id.includes('Standard')) return false;

      if (viGenderFilter === 'FEMALE' && voice.gender !== 'FEMALE') return false;
      if (viGenderFilter === 'MALE' && voice.gender !== 'MALE') return false;

      if (viSearchQuery.trim()) {
        const q = viSearchQuery.toLowerCase().trim();
        const matchesName = voice.name.toLowerCase().includes(q);
        const matchesId = voice.id.toLowerCase().includes(q);
        const matchesDesc = voice.description.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesDesc) return false;
      }

      return true;
    });
  }, [allViVoices, viCategoryFilter, viGenderFilter, viSearchQuery]);

  const handleTestPlaySequence = async () => {
    setIsPlayingSequence(true);
    try {
      await audioPlayer.playBilingualSequence(
        testEnglishText,
        testVietnameseText,
        currentSettings.language_mode,
        null,
        currentSettings.voice_profile_en,
        currentSettings.voice_profile_vi,
        currentSettings.default_speed,
        currentSettings.repeat_count
      );
      setActiveAudioSource(audioPlayer.getLastSource());
    } catch (e) {
      console.error(e);
    } finally {
      setIsPlayingSequence(false);
    }
  };

  const handleTestPlayEn = async () => {
    setIsPlayingEn(true);
    try {
      await audioPlayer.playChunk(testEnglishText, null, currentSettings.voice_profile_en, currentSettings.default_speed);
      setActiveAudioSource(audioPlayer.getLastSource());
    } catch (e) {
      console.error(e);
    } finally {
      setIsPlayingEn(false);
    }
  };

  const handleTestPlayVi = async () => {
    setIsPlayingVi(true);
    try {
      await audioPlayer.playChunk(testVietnameseText, null, currentSettings.voice_profile_vi, currentSettings.default_speed);
      setActiveAudioSource(audioPlayer.getLastSource());
    } catch (e) {
      console.error(e);
    } finally {
      setIsPlayingVi(false);
    }
  };

  const handlePreviewVoice = async (voiceId: string) => {
    setPlayingVoiceId(voiceId);
    try {
      const isVi = voiceId.startsWith('vi');
      const sample = isVi 
        ? "Chào mừng bạn đến với khóa học luyện phản xạ cụm câu tiếng Anh."
        : "Mastering chunks is the fastest way to natural spoken English fluency.";
      await audioPlayer.playChunk(sample, null, voiceId, 1.0);
    } catch (e) {
      console.error(e);
    } finally {
      setPlayingVoiceId(null);
    }
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('chunks_deepgram_api_key', deepgramKeyInput.trim());
    setIsKeySaved(true);
    setTimeout(() => setIsKeySaved(false), 2000);
  };

  const handleBatchPrepDay = async (targetDay: number = selectedDayNumber) => {
    setIsBatchPrepping(true);
    setBatchProgress({ current: 0, total: 1, message: `Đang nạp dữ liệu Day ${targetDay}...` });
    setBatchSummary(null);

    try {
      const lessons = await getAllLessons(selectedCourseLevel);
      const targetLesson = lessons.find(l => l.day_number === targetDay);
      
      if (!targetLesson || targetLesson.chunks.length === 0) {
        setBatchSummary(`Không tìm thấy chunks cho Day ${targetDay} thuộc ${selectedCourseLevel}.`);
        return;
      }

      const res = await audioPlayer.prepareChunksAudio(
        targetLesson.chunks,
        {
          voiceEn: currentSettings.voice_profile_en,
          voiceVi: currentSettings.voice_profile_vi,
          provider: audioProvider,
          target: batchTarget,
          onProgress: (current, total, message) => {
            setBatchProgress({ current, total, message });
          }
        }
      );

      setBatchSummary(`🎉 Hoàn tất chuẩn bị audio cho Day ${targetDay}: ${res.prepared} thành công, ${res.failed} lỗi.`);
      await loadLessonsAndCacheStatus();
    } catch (err: any) {
      setBatchSummary(`Lỗi: ${err?.message || String(err)}`);
    } finally {
      setIsBatchPrepping(false);
    }
  };

  const handleExportCache = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllAudioBlobs();
      if (!data.entries || data.entries.length === 0) {
        alert("Bộ nhớ đệm IndexedDB hiện chưa có audio nào để xuất. Vui lòng tạo hoặc nạp audio trước!");
        return;
      }
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `chunks-audio-cache-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export cache error:', err);
      alert('Có lỗi khi xuất file cache: ' + (err?.message || String(err)));
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      let data: AudioCacheExportData;
      try {
        data = JSON.parse(text);
      } catch {
        alert("File tải lên không phải là định dạng JSON hợp lệ.");
        return;
      }

      if (!data || !Array.isArray(data.entries)) {
        alert("Định dạng file không đúng. Cần file backup JSON chứa danh sách entries audio.");
        return;
      }

      const count = await importAudioBlobs(data);
      alert(`🎉 Đã nạp thành công ${count} audio chunks vào trình duyệt!`);
      await loadLessonsAndCacheStatus();
      await refreshCacheCount();
    } catch (err: any) {
      console.error('Import cache error:', err);
      alert('Lỗi khi nạp file cache: ' + (err?.message || String(err)));
    } finally {
      setIsImporting(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans animate-fade-in">
      {/* 1. Header & Live Status */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#DC2626]/10 text-[#DC2626]">
              <Headphones className="w-5 h-5" />
            </span>
            <h1 className="font-display font-bold text-2xl text-zinc-900 tracking-tight">
              Audio Engine & Voice Studio Hub
            </h1>
          </div>
          <p className="text-xs text-zinc-500">
            Cấu hình cặp giọng đọc chuẩn, thử giọng song ngữ EN/VI, và tạo sẵn bộ nhớ đệm audio cho từng buổi dạy.
          </p>
        </div>

        {/* Status Badge & Diagnostic Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDiagnosticOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-mono font-bold text-zinc-800 transition-all cursor-pointer shadow-xs"
          >
            <Activity className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Audio Source: {activeAudioSource}</span>
          </button>
        </div>
      </div>

      {/* 2. Core Grid: Voice Configuration & Live Audition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Preset Voice Profiles (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Engine Selection & English Voices */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#DC2626]" />
                <h2 className="font-display font-bold text-base text-zinc-900">
                  1. Cấu Hình Cặp Giọng Đọc Lớp Học
                </h2>
              </div>

              {/* Audio Engine Selector */}
              <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200">
                <button
                  onClick={() => {
                    setAudioProvider('DEEPGRAM_AURA');
                    audioPlayer.setAudioProvider('DEEPGRAM_AURA');
                    onUpdateSettings({ ...currentSettings, voice_profile_en: 'aura-asteria-en' });
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    audioProvider === 'DEEPGRAM_AURA' ? 'bg-white text-[#DC2626] shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Deepgram Aura (0ms)
                </button>
                <button
                  onClick={() => {
                    setAudioProvider('GOOGLE_TTS');
                    audioPlayer.setAudioProvider('GOOGLE_TTS');
                    onUpdateSettings({ ...currentSettings, voice_profile_en: 'en-US-Journey-F' });
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    audioProvider === 'GOOGLE_TTS' ? 'bg-white text-[#DC2626] shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Google Cloud AI
                </button>
              </div>
            </div>

            {/* Voice Profile List */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Giọng Tiếng Anh ({audioProvider === 'DEEPGRAM_AURA' ? 'Deepgram Aura AI' : 'Google Cloud AI'})
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(audioProvider === 'DEEPGRAM_AURA' ? voiceProfilesDeepgram : voiceProfilesGoogle).map((voice) => {
                  const isSelected = currentSettings.voice_profile_en === voice.id;
                  return (
                    <div
                      key={voice.id}
                      onClick={() => onUpdateSettings({ ...currentSettings, voice_profile_en: voice.id })}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#DC2626]/[0.03] border-[#DC2626] shadow-xs ring-1 ring-[#DC2626]'
                          : 'bg-zinc-50/60 border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-zinc-900">{voice.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700">
                              {voice.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                            {voice.desc}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-zinc-200/60">
                        <span className="text-[10px] font-mono text-zinc-400">{voice.id}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewVoice(voice.id);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#DC2626] hover:underline"
                        >
                          {playingVoiceId === voice.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
                          <span>Nghe thử</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vietnamese Translation Voice */}
            <div className="space-y-3 pt-3 border-t border-zinc-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                      Giọng Đọc Tiếng Việt (Google Cloud - 40 Mẫu Giọng)
                    </label>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {filteredViVoices.length} / {allViVoices.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Đang chọn: <span className="font-semibold text-emerald-700">{currentSettings.voice_profile_vi}</span>
                  </p>
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-52">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={viSearchQuery}
                    onChange={(e) => setViSearchQuery(e.target.value)}
                    placeholder="Tìm tên / ID giọng..."
                    className="w-full pl-8 pr-7 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-600"
                  />
                  {viSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setViSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 hover:text-zinc-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Tabs & Gender Pills */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                {/* Category Tabs */}
                <div className="flex flex-wrap items-center gap-1 bg-zinc-100/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setViCategoryFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viCategoryFilter === 'ALL'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Tất cả ({allViVoices.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setViCategoryFilter('CHIRP3_HD')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viCategoryFilter === 'CHIRP3_HD'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Chirp3-HD Studio ({allViVoices.filter(v => v.id.includes('Chirp3-HD')).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setViCategoryFilter('NEURAL2')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viCategoryFilter === 'NEURAL2'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Neural2 ({allViVoices.filter(v => v.id.includes('Neural2')).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setViCategoryFilter('WAVENET')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viCategoryFilter === 'WAVENET'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    WaveNet ({allViVoices.filter(v => v.id.includes('Wavenet')).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setViCategoryFilter('STANDARD')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viCategoryFilter === 'STANDARD'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Standard ({allViVoices.filter(v => v.id.includes('Standard')).length})
                  </button>
                </div>

                {/* Gender Toggle Pills */}
                <div className="flex items-center gap-1 bg-zinc-100/80 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setViGenderFilter('ALL')}
                    className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                      viGenderFilter === 'ALL'
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setViGenderFilter('FEMALE')}
                    className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                      viGenderFilter === 'FEMALE'
                        ? 'bg-pink-100 text-pink-700 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    Nữ
                  </button>
                  <button
                    type="button"
                    onClick={() => setViGenderFilter('MALE')}
                    className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                      viGenderFilter === 'MALE'
                        ? 'bg-blue-100 text-blue-700 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    Nam
                  </button>
                </div>
              </div>

              {/* Filtered Voices Grid */}
              {filteredViVoices.length === 0 ? (
                <div className="p-8 text-center bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                  <p className="text-xs text-zinc-500">Không tìm thấy giọng đọc phù hợp với bộ lọc hiện tại.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setViCategoryFilter('ALL');
                      setViGenderFilter('ALL');
                      setViSearchQuery('');
                    }}
                    className="mt-2 text-xs text-emerald-600 font-bold hover:underline"
                  >
                    Đặt lại bộ lọc
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {filteredViVoices.map((voice) => {
                    const isSelected = currentSettings.voice_profile_vi === voice.id;
                    const isChirp = voice.id.includes('Chirp3-HD');
                    const isNeural = voice.id.includes('Neural2');
                    const isWavenet = voice.id.includes('Wavenet');
                    const categoryTag = isChirp ? 'CHIRP3-HD' : isNeural ? 'NEURAL2' : isWavenet ? 'WAVENET' : 'STANDARD';

                    return (
                      <div
                        key={voice.id}
                        onClick={() => onUpdateSettings({ ...currentSettings, voice_profile_vi: voice.id })}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-50/50 border-emerald-600 ring-1 ring-emerald-600 shadow-xs'
                            : 'bg-zinc-50/70 border-zinc-200 hover:bg-zinc-100/80'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1.5 mb-1">
                            <div className="font-bold text-xs text-zinc-900 leading-tight">
                              {voice.name}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                isChirp 
                                  ? 'bg-purple-100 text-purple-700'
                                  : isNeural 
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : isWavenet
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-zinc-200 text-zinc-700'
                              }`}>
                                {categoryTag}
                              </span>
                              <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                                voice.gender === 'FEMALE' ? 'bg-pink-100 text-pink-700' : 'bg-cyan-100 text-cyan-700'
                              }`}>
                                {voice.gender === 'FEMALE' ? 'Nữ' : 'Nam'}
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-zinc-500 line-clamp-1 leading-normal">
                            {voice.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-zinc-200/50">
                          <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[170px]" title={voice.id}>
                            {voice.id}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewVoice(voice.id);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline p-1 cursor-pointer"
                              title="Nghe thử giọng mẫu"
                            >
                              {playingVoiceId === voice.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
                              <span className="text-[11px]">Nghe thử</span>
                            </button>
                            {isSelected && (
                              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drill Sequence & Speed Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-100">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Chế Độ Phát Mặc Định
                </label>
                <select
                  value={currentSettings.language_mode}
                  onChange={(e) => onUpdateSettings({ ...currentSettings, language_mode: e.target.value as LanguageMode })}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 cursor-pointer"
                >
                  <option value="EN_THEN_VI">Tiếng Anh ➔ Tiếng Việt (EN ➔ VI)</option>
                  <option value="EN_ONLY">Chỉ Tiếng Anh (EN Only)</option>
                  <option value="VI_ONLY">Chỉ Tiếng Việt (VI Only)</option>
                  <option value="VI_THEN_EN">Tiếng Việt ➔ Tiếng Anh (VI ➔ EN)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Tốc Độ Phát Mặc Định
                </label>
                <select
                  value={currentSettings.default_speed}
                  onChange={(e) => onUpdateSettings({ ...currentSettings, default_speed: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 cursor-pointer"
                >
                  <option value="0.8">0.8x (Chậm, rõ âm)</option>
                  <option value="0.9">0.9x (Vừa phải)</option>
                  <option value="1.0">1.0x (Tốc độ tự nhiên chuẩn)</option>
                  <option value="1.2">1.2x (Nhanh)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Số Lần Lặp Mặc Định
                </label>
                <select
                  value={currentSettings.repeat_count}
                  onChange={(e) => onUpdateSettings({ ...currentSettings, repeat_count: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 cursor-pointer"
                >
                  <option value="1">1 lần</option>
                  <option value="2">2 lần (Lặp lại)</option>
                  <option value="3">3 lần (Ghi nhớ sâu)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card: Bulk Audio Pre-Generation Engine & Readiness Matrix */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h2 className="font-display font-bold text-base text-zinc-900">
                  2. Chuẩn Bị Sẵn Audio Buổi Học (0ms In-Class Cache)
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Khóa Học</label>
                <select
                  value={selectedCourseLevel}
                  onChange={(e) => setSelectedCourseLevel(e.target.value as CourseLevel)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {curriculumRegistry.getAllCourses().map(c => (
                    <option key={c.id} value={c.level_code}>
                      {c.title} ({c.total_days} Days)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Mục Tiêu Tạo Audio</label>
                <select
                  value={batchTarget}
                  onChange={(e) => setBatchTarget(e.target.value as AudioBatchTarget)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <option value="BOTH">Cả Tiếng Anh & Tiếng Việt (Both)</option>
                  <option value="ENGLISH">Chỉ Tiếng Anh (English Only)</option>
                  <option value="VIETNAMESE">Chỉ Tiếng Việt (Vietnamese Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Buổi Học / Day</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={selectedDayNumber}
                    onChange={(e) => setSelectedDayNumber(parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold"
                  />
                  <button
                    type="button"
                    disabled={isBatchPrepping}
                    onClick={() => handleBatchPrepDay(selectedDayNumber)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    {isBatchPrepping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />}
                    <span>Tạo Day {selectedDayNumber}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Notification */}
            {batchProgress && (
              <div className="p-3.5 bg-zinc-900 text-white rounded-xl space-y-1.5 text-xs font-mono animate-fade-in">
                <div className="flex justify-between">
                  <span>{batchProgress.message}</span>
                  <span className="text-[#DC2626] font-bold">
                    {Math.round((batchProgress.current / batchProgress.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#DC2626] h-full transition-all"
                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {batchSummary && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">
                {batchSummary}
              </div>
            )}

            {/* Cache Readiness Matrix Table */}
            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-800">
                  Bảng Trạng Thái Audio Sẵn Sàng ({courseLessons.length} Days)
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  Xanh: Sẵn sàng 0ms • Xám: Chưa nạp
                </span>
              </div>

              <div className="border border-zinc-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-100 text-zinc-700 font-bold sticky top-0">
                    <tr>
                      <th className="p-2 w-16 text-center">Buổi</th>
                      <th className="p-2">Tiêu Đề Bài Học</th>
                      <th className="p-2 w-24 text-center">Tiếng Anh</th>
                      <th className="p-2 w-24 text-center">Tiếng Việt</th>
                      <th className="p-2 w-28 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {courseLessons.map((lesson) => {
                      const stat = cacheStatusMap[lesson.id] || { en: 0, vi: 0, total: lesson.chunks.length };
                      const isEnReady = stat.en >= lesson.chunks.length && lesson.chunks.length > 0;
                      const isViReady = stat.vi >= lesson.chunks.length && lesson.chunks.length > 0;

                      return (
                        <tr key={lesson.id} className="hover:bg-zinc-50/80">
                          <td className="p-2 text-center font-mono font-bold text-zinc-900">
                            Day {lesson.day_number}
                          </td>
                          <td className="p-2 truncate max-w-xs font-medium text-zinc-800">
                            {lesson.lesson_title}
                          </td>
                          <td className="p-2 text-center">
                            <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                              isEnReady ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-500'
                            }`}>
                              {stat.en}/{lesson.chunks.length} {isEnReady && '✓'}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                              isViReady ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-500'
                            }`}>
                              {stat.vi}/{lesson.chunks.length} {isViReady && '✓'}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              disabled={isBatchPrepping}
                              onClick={() => {
                                setSelectedDayNumber(lesson.day_number);
                                handleBatchPrepDay(lesson.day_number);
                              }}
                              className="px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-bold cursor-pointer"
                            >
                              Nạp Audio
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
        </div>

        {/* Right Column: Live Audition & Deepgram Settings */}
        <div className="space-y-6">
          {/* Card: Live Bilingual Audition Player */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Sparkles className="w-4 h-4 text-[#DC2626]" />
              <h2 className="font-display font-bold text-base text-zinc-900">
                3. Phòng Thử Giọng Trực Tiếp (Audition)
              </h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1">
                  Câu Tiếng Anh (Ngắt nhịp bằng dấu //)
                </label>
                <textarea
                  rows={3}
                  value={testEnglishText}
                  onChange={(e) => setTestEnglishText(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:bg-white focus:outline-none focus:border-[#DC2626]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1">
                  Bản Dịch Tiếng Việt (Ngắt nhịp bằng dấu //)
                </label>
                <textarea
                  rows={2}
                  value={testVietnameseText}
                  onChange={(e) => setTestVietnameseText(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:bg-white focus:outline-none focus:border-[#DC2626]"
                />
              </div>

              {/* Multi-Button Audition Action Row */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={isPlayingEn}
                  onClick={handleTestPlayEn}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold transition-all cursor-pointer"
                >
                  {isPlayingEn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5 text-[#DC2626]" />}
                  <span>Nghe Tiếng Anh</span>
                </button>

                <button
                  type="button"
                  disabled={isPlayingVi}
                  onClick={handleTestPlayVi}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-all cursor-pointer"
                >
                  {isPlayingVi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600" />}
                  <span>Nghe Tiếng Việt</span>
                </button>
              </div>

              <button
                type="button"
                disabled={isPlayingSequence}
                onClick={handleTestPlaySequence}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] disabled:bg-zinc-400 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                {isPlayingSequence ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang phát chuỗi song ngữ...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Nghe Chuỗi Song Ngữ (EN ➔ VI)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card: Deepgram Key Management */}
          <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200 space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-zinc-600" />
              <h3 className="font-bold text-xs text-zinc-900">
                Deepgram Aura API Token
              </h3>
            </div>
            <p className="text-[11px] text-zinc-500">
              Lưu trực tiếp trong trình duyệt để gọi giọng đọc 0ms không cần phụ thuộc backend.
            </p>

            <div className="space-y-2">
              <input
                type="password"
                value={deepgramKeyInput}
                onChange={(e) => setDeepgramKeyInput(e.target.value)}
                placeholder="Nhập token Deepgram..."
                className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-mono focus:outline-none focus:border-[#DC2626]"
              />

              <button
                type="button"
                onClick={handleSaveApiKey}
                className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {isKeySaved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isKeySaved ? 'Đã Lưu Token!' : 'Lưu Token Mới'}</span>
              </button>
            </div>
          </div>

          {/* Card: Audio Cache Migration & Backup (Cross-Domain Sync) */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xs text-zinc-900">
                    Audio Cache Migration / Backup
                  </h3>
                  <span className="text-[10px] text-zinc-400">Đồng bộ Cache giữa các Domain</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                {cacheEntriesCount} chunks
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Dễ dàng xuất toàn bộ audio đã tạo từ localhost sang file JSON và nạp vào bất kỳ domain nào (Preview channel, production) trong 2 giây mà không cần tốn quota API hay chờ nạp lại!
            </p>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 font-medium">Trạng thái bộ nhớ đệm:</span>
                <span className="font-mono font-bold text-zinc-900">
                  {cacheEntriesCount > 0 ? (
                    <span className="text-emerald-600">● {cacheEntriesCount} audio sẵn sàng</span>
                  ) : (
                    <span className="text-zinc-400">○ Chưa có dữ liệu</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-200/50">
                <span>Storage: IndexedDB</span>
                <span className="font-mono">chunks_audio_db</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={isExporting || cacheEntriesCount === 0}
                onClick={handleExportCache}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Tải về file backup JSON chứa tất cả audio chunks"
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>{isExporting ? 'Đang xuất...' : 'Xuất File Cache (.json)'}</span>
              </button>

              <button
                type="button"
                disabled={isImporting}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Nạp file backup JSON vào trình duyệt"
              >
                {isImporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-white" />
                )}
                <span>{isImporting ? 'Đang nạp...' : 'Nhập File Cache (.json)'}</span>
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Diagnostic Modal */}
      <AudioDiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
      />
    </div>
  );
};
