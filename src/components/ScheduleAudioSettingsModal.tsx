import React, { useState, useEffect } from 'react';
import { CohortAudioSettings, LanguageMode } from '../types';
import { modelRegistryService, RegisteredModel, getMinimalName } from '../services/modelRegistryService';
import { audioPlayer, AudioProvider } from '../services/googleTtsService';
import { 
  Volume2, 
  Play, 
  Square, 
  Check, 
  X, 
  Sparkles, 
  Settings, 
  SlidersHorizontal, 
  Radio, 
  Info, 
  Clock, 
  Repeat,
  Loader2
} from 'lucide-react';

interface ScheduleAudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioSettings?: CohortAudioSettings;
  onSave: (settings: CohortAudioSettings) => void;
}

const DEFAULT_AUDIO_SETTINGS: CohortAudioSettings = {
  voice_profile_en: 'flux-cliff-en',
  voice_profile_vi: 'vi-VN-Neural2-A',
  voice_profile_primary: 'flux-cliff-en',
  voice_profile_secondary: 'vi-VN-Neural2-A',
  language_mode: 'EN_THEN_VI',
  auto_advance_delay_sec: 0,
  default_speed: 1.0,
  repeat_count: 1,
  provider_primary: 'DEEPGRAM_AURA'
};

const SPEED_OPTIONS = [0.8, 0.9, 1.0, 1.1, 1.2];
const REPEAT_OPTIONS = [1, 2, 3];
const DELAY_OPTIONS = [
  { value: 0, label: '0s (Thủ công / Bấm clicker)' },
  { value: 1, label: '1s (Nhanh)' },
  { value: 2, label: '2s (Chuẩn)' },
  { value: 3, label: '3s (Khoan thai)' },
  { value: 5, label: '5s (Luyện sâu)' }
];

export const ScheduleAudioSettingsModal: React.FC<ScheduleAudioSettingsModalProps> = ({
  isOpen,
  onClose,
  audioSettings,
  onSave
}) => {
  const [provider, setProvider] = useState<AudioProvider>(
    (audioSettings?.provider_primary as AudioProvider) || 
    (audioSettings?.voice_profile_en?.startsWith('aura-') || audioSettings?.voice_profile_en?.startsWith('flux-') 
      ? 'DEEPGRAM_AURA' 
      : 'GOOGLE_TTS')
  );

  const [voiceEn, setVoiceEn] = useState<string>(
    audioSettings?.voice_profile_en || 
    audioSettings?.voice_profile_primary || 
    modelRegistryService.getMainModelEn() || 
    'flux-cliff-en'
  );

  const [voiceVi, setVoiceVi] = useState<string>(
    audioSettings?.voice_profile_vi || 
    audioSettings?.voice_profile_secondary || 
    modelRegistryService.getMainModelVi() || 
    'vi-VN-Neural2-A'
  );

  const [languageMode, setLanguageMode] = useState<LanguageMode>(
    audioSettings?.language_mode || 'EN_THEN_VI'
  );

  const [speed, setSpeed] = useState<number>(
    audioSettings?.default_speed ?? 1.0
  );

  const [repeatCount, setRepeatCount] = useState<number>(
    audioSettings?.repeat_count ?? 1
  );

  const [autoAdvanceDelay, setAutoAdvanceDelay] = useState<number>(
    audioSettings?.auto_advance_delay_sec ?? 0
  );

  const [allModels, setAllModels] = useState<RegisteredModel[]>(() => modelRegistryService.getAllModels());
  const [auditioningLang, setAuditioningLang] = useState<'en' | 'vi' | null>(null);

  useEffect(() => {
    return modelRegistryService.subscribe(() => {
      setAllModels(modelRegistryService.getAllModels());
    });
  }, []);

  // Sync state when audioSettings changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const en = audioSettings?.voice_profile_en || audioSettings?.voice_profile_primary || modelRegistryService.getMainModelEn();
      const vi = audioSettings?.voice_profile_vi || audioSettings?.voice_profile_secondary || modelRegistryService.getMainModelVi();
      const prov = (audioSettings?.provider_primary as AudioProvider) || 
        (en?.startsWith('aura-') || en?.startsWith('flux-') ? 'DEEPGRAM_AURA' : 'GOOGLE_TTS');

      setProvider(prov);
      setVoiceEn(en);
      setVoiceVi(vi);
      setLanguageMode(audioSettings?.language_mode || 'EN_THEN_VI');
      setSpeed(audioSettings?.default_speed ?? 1.0);
      setRepeatCount(audioSettings?.repeat_count ?? 1);
      setAutoAdvanceDelay(audioSettings?.auto_advance_delay_sec ?? 0);
    }
  }, [isOpen, audioSettings]);

  // English models: all focusEnabled English models
  const englishModels = allModels.filter(m => m.language === 'en' && m.focusEnabled);

  // Vietnamese models: all focusEnabled Vietnamese models (excluding Deepgram since Deepgram does not support VI)
  const vietnameseModels = allModels.filter(m => m.language === 'vi' && m.focusEnabled && m.provider !== 'DEEPGRAM');

  // When switching provider toggle, select appropriate default model if current voice is mismatched
  const handleToggleProvider = (newProvider: AudioProvider) => {
    setProvider(newProvider);
    if (newProvider === 'DEEPGRAM_AURA') {
      if (!voiceEn.startsWith('aura-') && !voiceEn.startsWith('flux-')) {
        const firstDg = englishModels.find(m => m.provider === 'DEEPGRAM');
        if (firstDg) setVoiceEn(firstDg.id);
      }
    } else {
      if (voiceEn.startsWith('aura-') || voiceEn.startsWith('flux-')) {
        const firstGoogle = englishModels.find(m => m.provider === 'GOOGLE_TTS');
        if (firstGoogle) setVoiceEn(firstGoogle.id);
      }
    }
  };

  // When selecting an English model, automatically update provider if appropriate
  const handleSelectVoiceEn = (modelId: string) => {
    setVoiceEn(modelId);
    if (modelId.startsWith('aura-') || modelId.startsWith('flux-')) {
      setProvider('DEEPGRAM_AURA');
    } else if (modelId.startsWith('en-US-') || modelId.startsWith('google-')) {
      setProvider('GOOGLE_TTS');
    }
  };

  // Audition voice playback
  const handleAudition = async (lang: 'en' | 'vi') => {
    if (auditioningLang) {
      audioPlayer.stop();
      setAuditioningLang(null);
      return;
    }

    setAuditioningLang(lang);
    try {
      const selectedVoice = lang === 'en' ? voiceEn : voiceVi;
      const testText = lang === 'en'
        ? "Welcome to CHUNKS classroom. Let's practice English reflexes together."
        : "Chào mừng bạn đến với lớp học CHUNKS. Hãy cùng luyện tập phản xạ tiếng Anh.";

      await audioPlayer.playChunk(testText, null, selectedVoice, speed);
    } catch (err) {
      console.warn('[Audition] Playback error:', err);
    } finally {
      setAuditioningLang(null);
    }
  };

  const handleSave = () => {
    const updatedSettings: CohortAudioSettings = {
      ...(audioSettings || DEFAULT_AUDIO_SETTINGS),
      voice_profile_en: voiceEn,
      voice_profile_vi: voiceVi,
      voice_profile_primary: voiceEn,
      voice_profile_secondary: voiceVi,
      provider_primary: provider,
      language_mode: languageMode,
      default_speed: speed,
      repeat_count: repeatCount,
      auto_advance_delay_sec: autoAdvanceDelay
    };

    onSave(updatedSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-[#E8E8EC] shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#E8E8EC] flex items-center justify-between bg-[#FAFAFA] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center font-bold shadow-xs">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#0A0A0A] tracking-tight flex items-center gap-2">
                <span>Cấu Hình Âm Thanh & Giọng Đọc</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  Classroom Mode
                </span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Thiết lập giọng phát âm tiếng Anh, phụ đề tiếng Việt & tốc độ luyện phản xạ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* 1. Provider Selection Toggle */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Nhà Cung Cấp Phát Âm Chính (TTS Provider)</span>
              <span className="text-[10px] text-zinc-400 normal-case font-normal">Ưu tiên cho Tiếng Anh</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleToggleProvider('DEEPGRAM_AURA')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                  provider === 'DEEPGRAM_AURA'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                  provider === 'DEEPGRAM_AURA' ? 'border-emerald-600 bg-emerald-600' : 'border-zinc-400'
                }`}>
                  {provider === 'DEEPGRAM_AURA' && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <div>
                  <div className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                    <span>Deepgram Aura / Flux</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 font-bold">
                      Khuyên Dùng
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                    Tốc độ phản hồi cực nhanh, ngữ điệu tự nhiên như người bản xứ.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleToggleProvider('GOOGLE_TTS')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                  provider === 'GOOGLE_TTS'
                    ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                  provider === 'GOOGLE_TTS' ? 'border-blue-600 bg-blue-600' : 'border-zinc-400'
                }`}>
                  {provider === 'GOOGLE_TTS' && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <div>
                  <div className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                    <span>Google Cloud AI TTS</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-bold">
                      Chirp3-HD
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                    Chuẩn phòng thu Journey & Studio, phát âm từ vựng chuẩn xác 100%.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. English Model Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>Giọng Đọc Tiếng Anh (English Model)</span>
                <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => handleAudition('en')}
                className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  auditioningLang === 'en'
                    ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}
              >
                {auditioningLang === 'en' ? (
                  <>
                    <Square className="w-3 h-3 fill-current" />
                    <span>Dừng</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current text-zinc-600" />
                    <span>Nghe thử EN</span>
                  </>
                )}
              </button>
            </div>
            <select
              value={voiceEn}
              onChange={(e) => handleSelectVoiceEn(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E8EC] text-xs font-medium text-zinc-900 bg-white focus:outline-hidden focus:border-[#DC2626] cursor-pointer shadow-2xs"
            >
              <optgroup label="Deepgram Aura & Flux (Tự nhiên & Tốc độ cao)">
                {englishModels
                  .filter(m => m.provider === 'DEEPGRAM')
                  .map(m => (
                    <option key={m.id} value={m.id}>
                      {getMinimalName(m)} ({m.gender === 'FEMALE' ? 'Nữ' : 'Nam'})
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Google Cloud Text-to-Speech (Journey & Studio)">
                {englishModels
                  .filter(m => m.provider === 'GOOGLE_TTS' || m.provider === 'GEMINI_AI_STUDIO')
                  .map(m => (
                    <option key={m.id} value={m.id}>
                      {getMinimalName(m)} ({m.gender === 'FEMALE' ? 'Nữ' : 'Nam'})
                    </option>
                  ))}
              </optgroup>
              {englishModels.some(m => m.provider === 'OPENAI_TTS' || m.provider === 'CUSTOM_TTS') && (
                <optgroup label="Khác (Custom / OpenAI)">
                  {englishModels
                    .filter(m => m.provider !== 'DEEPGRAM' && m.provider !== 'GOOGLE_TTS' && m.provider !== 'GEMINI_AI_STUDIO')
                    .map(m => (
                      <option key={m.id} value={m.id}>
                        {getMinimalName(m)}
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* 3. Vietnamese Model Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>Giọng Đọc Tiếng Việt (Vietnamese Model)</span>
              </label>
              <button
                type="button"
                onClick={() => handleAudition('vi')}
                className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  auditioningLang === 'vi'
                    ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}
              >
                {auditioningLang === 'vi' ? (
                  <>
                    <Square className="w-3 h-3 fill-current" />
                    <span>Dừng</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current text-zinc-600" />
                    <span>Nghe thử VI</span>
                  </>
                )}
              </button>
            </div>
            <select
              value={voiceVi}
              onChange={(e) => setVoiceVi(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E8EC] text-xs font-medium text-zinc-900 bg-white focus:outline-hidden focus:border-[#DC2626] cursor-pointer shadow-2xs"
            >
              {vietnameseModels.map(m => (
                <option key={m.id} value={m.id}>
                  {getMinimalName(m)} ({m.gender === 'FEMALE' ? 'Nữ' : 'Nam'})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-400 mt-1">
              Phát âm chuẩn tiếng Việt từ Google Cloud Neural2 và Chirp3-HD Ultra Studio.
            </p>
          </div>

          {/* 4. Language Drill Mode */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5">
              Trình Tự Phát Âm (Language Mode)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'EN_THEN_VI', label: 'Tiếng Anh → Tiếng Việt', desc: 'Luyện nghe phản xạ chuẩn' },
                { id: 'EN_ONLY', label: 'Chỉ Tiếng Anh (EN)', desc: 'Tập trung 100% tiếng Anh' },
                { id: 'VI_THEN_EN', label: 'Tiếng Việt → Tiếng Anh', desc: 'Dịch phản xạ xuôi' },
                { id: 'VI_ONLY', label: 'Chỉ Tiếng Việt (VI)', desc: 'Ôn tập nghĩa từ vựng' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLanguageMode(opt.id as LanguageMode)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    languageMode === opt.id
                      ? 'border-[#DC2626] bg-red-50/50 text-[#DC2626] font-bold shadow-2xs'
                      : 'border-zinc-200 hover:border-zinc-300 text-zinc-700 bg-white'
                  }`}
                >
                  <div className="text-xs">{opt.label}</div>
                  <div className="text-[10px] text-zinc-400 font-normal mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Playback Settings: Speed, Repeat & Delay */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-zinc-100">
            {/* Speed */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5">
                Tốc Độ (Speed)
              </label>
              <div className="flex items-center gap-1">
                {SPEED_OPTIONS.map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSpeed(val)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      speed === val
                        ? 'bg-[#DC2626] text-white shadow-xs'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    {val}x
                  </button>
                ))}
              </div>
            </div>

            {/* Repeat Count */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5">
                Lặp Lại (Repeat)
              </label>
              <div className="flex items-center gap-1">
                {REPEAT_OPTIONS.map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRepeatCount(val)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      repeatCount === val
                        ? 'bg-[#DC2626] text-white shadow-xs'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    {val}x
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Advance Delay */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5">
                Tự Chuyển Câu
              </label>
              <select
                value={autoAdvanceDelay}
                onChange={(e) => setAutoAdvanceDelay(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-900 bg-white focus:outline-hidden focus:border-[#DC2626] cursor-pointer shadow-2xs"
              >
                {DELAY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-[#E8E8EC] flex items-center justify-end gap-2.5 bg-[#FAFAFA] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E8E8EC] text-xs font-bold text-zinc-600 hover:bg-zinc-200/60 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#DC2626] text-white text-xs font-bold hover:bg-[#B91C1C] shadow-sm transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Lưu Cấu Hình Audio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
