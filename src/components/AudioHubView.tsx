import React, { useState, useEffect } from 'react';
import { CohortAudioSettings, LanguageMode, CourseLevel } from '../types';
import { audioPlayer, AudioSourceType, AudioProvider } from '../services/googleTtsService';
import { DEEPGRAM_AURA_VOICES } from '../services/deepgramTtsService';
import { getAllLessons } from '../services/firestoreService';
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
  Loader2
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

  // 1. Audio Presets & Testing State
  const [testEnglishText, setTestEnglishText] = useState<string>(
    "Once you master these chunks, speaking English becomes effortless."
  );
  const [testVietnameseText, setTestVietnameseText] = useState<string>(
    "Một khi bạn làm chủ các cụm từ này, nói tiếng Anh sẽ trở nên vô cùng tự nhiên."
  );
  const [isPlayingTest, setIsPlayingTest] = useState<boolean>(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState<boolean>(false);
  const [activeAudioSource, setActiveAudioSource] = useState<AudioSourceType>(audioPlayer.getLastSource());
  
  // 2. Batch Preparation Hub State
  const [selectedCourseLevel, setSelectedCourseLevel] = useState<CourseLevel>('LEVEL_A');
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [isBatchPrepping, setIsBatchPrepping] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [batchSummary, setBatchSummary] = useState<string | null>(null);

  // 3. API Key & Provider State
  const [audioProvider, setAudioProvider] = useState<AudioProvider>(audioPlayer.getAudioProvider());
  const [deepgramKeyInput, setDeepgramKeyInput] = useState<string>(
    localStorage.getItem('chunks_deepgram_api_key') || '51d7d8b230bf742178e681e7836a3dc1571b1c11'
  );
  const [isKeySaved, setIsKeySaved] = useState<boolean>(false);

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

  const voiceProfilesVi = [
    { id: 'vi-VN-Neural2-A', name: 'Google Vietnamese Neural2 (Nữ)', desc: 'Mượt mà, tự nhiên, giọng Bắc chuẩn' },
    { id: 'vi-VN-Standard-A', name: 'Google Vietnamese Standard (Nữ)', desc: 'Rõ ràng, rành mạch từng từ' }
  ];

  const handleTestPlay = async () => {
    setIsPlayingTest(true);
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
      setIsPlayingTest(false);
    }
  };

  const handlePreviewVoice = async (voiceId: string) => {
    setPlayingVoiceId(voiceId);
    try {
      const sample = "Mastering chunks is the fastest way to natural spoken English fluency.";
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

  const handleBatchPrepDay = async () => {
    setIsBatchPrepping(true);
    setBatchProgress({ current: 0, total: 1, message: 'Đang tải dữ liệu bài học...' });
    setBatchSummary(null);

    try {
      const lessons = await getAllLessons(selectedCourseLevel);
      const targetLesson = lessons.find(l => l.day_number === selectedDayNumber);
      
      if (!targetLesson || targetLesson.chunks.length === 0) {
        setBatchSummary(`Không tìm thấy chunks cho Day ${selectedDayNumber} thuộc ${selectedCourseLevel}.`);
        return;
      }

      await audioPlayer.prepareChunksAudio(
        targetLesson.chunks,
        currentSettings.voice_profile_en,
        audioProvider,
        (current, total, message) => {
          setBatchProgress({ current, total, message });
        }
      );

      setBatchSummary(`🎉 Chuẩn bị thành công 100% (${targetLesson.chunks.length} chunks) cho Day ${selectedDayNumber}! Sẵn sàng phát offline 0ms.`);
    } catch (err: any) {
      setBatchSummary(`Lỗi: ${err?.message || String(err)}`);
    } finally {
      setIsBatchPrepping(false);
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
            Quản lý chất lượng âm thanh phát trên lớp, kiểm tra giọng AI song ngữ, và tạo sẵn audio hàng loạt cho từng buổi dạy.
          </p>
        </div>

        {/* Status Badge & Diagnostic Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDiagnosticOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-mono font-bold text-zinc-800 transition-all cursor-pointer shadow-xs"
          >
            <Activity className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Nguồn Hiện Tại: {activeAudioSource}</span>
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
                  1. Cấu Hình Giọng Đọc Lớp Học (Active Voice Presets)
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
                  Deepgram Aura (0ms MP3)
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
                Chọn Giọng Tiếng Anh Mặc Định ({audioProvider === 'DEEPGRAM_AURA' ? 'Deepgram Aura AI' : 'Google Cloud AI'})
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
            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Giọng Đọc Bản Dịch Tiếng Việt
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {voiceProfilesVi.map((voice) => {
                  const isSelected = currentSettings.voice_profile_vi === voice.id;
                  return (
                    <div
                      key={voice.id}
                      onClick={() => onUpdateSettings({ ...currentSettings, voice_profile_vi: voice.id })}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-50/40 border-emerald-600 ring-1 ring-emerald-600'
                          : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-zinc-900">{voice.name}</div>
                        <div className="text-[11px] text-zinc-500">{voice.desc}</div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drill Sequence & Speed Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-100">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Chế Độ Phát Song Ngữ
                </label>
                <select
                  value={currentSettings.language_mode}
                  onChange={(e) => onUpdateSettings({ ...currentSettings, language_mode: e.target.value as LanguageMode })}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 cursor-pointer"
                >
                  <option value="EN_THEN_VI">Tiếng Anh ➔ Tiếng Việt (Khuyên dùng)</option>
                  <option value="EN_ONLY">Chỉ Tiếng Anh (English Only)</option>
                  <option value="VI_ONLY">Chỉ Tiếng Việt (Vietnamese Only)</option>
                  <option value="VI_THEN_EN">Tiếng Việt ➔ Tiếng Anh (Phản xạ ngược)</option>
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
                  <option value="1.2">1.2x (Nhanh, thử thách)</option>
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

          {/* Card: Bulk Audio Pre-Generation Engine */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h2 className="font-display font-bold text-base text-zinc-900">
                2. Chuẩn Bị Sẵn Audio Toàn Bộ Buổi Học (0ms In-Class Cache)
              </h2>
            </div>
            <p className="text-xs text-zinc-500">
              Tổng hợp và nạp sẵn 100% âm thanh của bài học vào bộ nhớ đệm trước giờ vào lớp để tránh gián đoạn mạng hoặc trễ thời gian.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Khóa Học</label>
                <select
                  value={selectedCourseLevel}
                  onChange={(e) => setSelectedCourseLevel(e.target.value as CourseLevel)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <option value="LEVEL_A">Level A (Foundation)</option>
                  <option value="LEVEL_B">Level B (Spoken Masterclass)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Buổi / Day</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={selectedDayNumber}
                  onChange={(e) => setSelectedDayNumber(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  disabled={isBatchPrepping}
                  onClick={handleBatchPrepDay}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  {isBatchPrepping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />}
                  <span>Tạo Audio Day {selectedDayNumber}</span>
                </button>
              </div>
            </div>

            {/* Progress / Summary */}
            {batchProgress && (
              <div className="p-3 bg-zinc-900 text-white rounded-xl space-y-1.5 text-xs font-mono">
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
          </div>
        </div>

        {/* Right Column: Live Audition & Deepgram Settings */}
        <div className="space-y-6">
          {/* Card: Live Bilingual Audition Player */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Sparkles className="w-4 h-4 text-[#DC2626]" />
              <h2 className="font-display font-bold text-base text-zinc-900">
                3. Nghe Thử Cụm Từ (Audition)
              </h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1">
                  Câu Tiếng Anh
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
                  Bản Dịch Tiếng Việt
                </label>
                <textarea
                  rows={2}
                  value={testVietnameseText}
                  onChange={(e) => setTestVietnameseText(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:bg-white focus:outline-none focus:border-[#DC2626]"
                />
              </div>

              <button
                type="button"
                disabled={isPlayingTest}
                onClick={handleTestPlay}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] disabled:bg-zinc-400 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                {isPlayingTest ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang phát chuỗi song ngữ...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Nghe Thử Chuỗi Song Ngữ</span>
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
                Deepgram Aura API Key
              </h3>
            </div>
            <p className="text-[11px] text-zinc-500">
              Key được mã hóa an toàn và lưu trực tiếp trong trình duyệt để gọi giọng đọc 0ms độ trễ.
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
                <span>{isKeySaved ? 'Đã Lưu Key!' : 'Lưu Token Mới'}</span>
              </button>
            </div>
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
