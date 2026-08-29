import React, { useState, useEffect } from 'react';
import { CohortAudioSettings, LanguageMode } from '../types';
import { audioPlayer, GOOGLE_TTS_VOICES, AudioSourceType } from '../services/googleTtsService';
import { AudioDiagnosticModal } from './AudioDiagnosticModal';
import { 
  Volume2, 
  Sparkles, 
  Music, 
  Play, 
  Headphones,
  SlidersHorizontal,
  Cloud,
  Layers,
  CheckCircle2,
  Radio,
  FileAudio,
  Activity,
  AlertTriangle,
  Laptop
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
  
  const [prosodyInput, setProsodyInput] = useState<string>(
    "Consistent chunking practice unlocks natural conversational rhythm and intonation."
  );
  const [generatedProsody, setGeneratedProsody] = useState<string>(
    "Con-SIS-tent CHUNK-ing PRAC-tice | un-LOCKS NA-tur-al RHYTHM | and in-to-NA-tion"
  );
  const [isGeneratingProsody, setIsGeneratingProsody] = useState<boolean>(false);

  useEffect(() => {
    const unsub = audioPlayer.onSourceChange((source) => {
      setActiveAudioSource(source);
    });
    return unsub;
  }, []);

  const [activeVoiceEngine, setActiveVoiceEngine] = useState<'GOOGLE' | 'DEEPGRAM'>('DEEPGRAM');
  const [deepgramKeyInput, setDeepgramKeyInput] = useState<string>(
    localStorage.getItem('chunks_deepgram_api_key') || '51d7d8b230bf742178e681e7836a3dc1571b1c11'
  );
  const [deepgramSaved, setDeepgramSaved] = useState<boolean>(false);

  const voiceProfilesEn = [
    { id: 'en-US-Journey-F', name: 'Google Journey Female (en-US-Journey-F)', desc: 'Warm, natural American English prosody with conversational cadence', tag: 'RECOMMENDED', sample: "Good morning class! Let's practice our daily chunks together." },
    { id: 'en-US-Journey-M', name: 'Google Journey Male (en-US-Journey-M)', desc: 'Deep, crisp male conversational articulation for classroom projection', tag: 'MALE VOICE', sample: "Mastering chunks is the fastest way to natural spoken English." },
    { id: 'en-US-Studio-O', name: 'Google Studio Narrator (en-US-Studio-O)', desc: 'High-clarity studio master for phonetic pronunciation drills', tag: 'STUDIO MASTER', sample: "Focus closely on the stress and syllable rhythm of each phrase." },
    { id: 'en-US-Neural2-F', name: 'Google Neural2 Studio (en-US-Neural2-F)', desc: 'Broadcast-grade studio clarity with balanced intonation', tag: 'STUDIO', sample: "Repeat after me with confidence and correct cadence." },
    { id: 'en-US-Neural2-D', name: 'Google Neural2 Deep (en-US-Neural2-D)', desc: 'Deep male studio tone with precise pronunciation markers', tag: 'DEEP MALE', sample: "Hit the ground running with today's spoken phrases." }
  ];

  const voiceProfilesDeepgram = [
    { id: 'aura-asteria-en', name: 'Deepgram Asteria (Female)', desc: 'Crisp, natural, and expressive American English conversational voice.', tag: 'AURA AI', sample: "Mastering chunks is the fastest way to natural spoken English fluency." },
    { id: 'aura-luna-en', name: 'Deepgram Luna (Female)', desc: 'Warm, approachable, and engaging tone for daily conversation practice.', tag: 'WARM', sample: "Let's practice these daily spoken chunks together." },
    { id: 'aura-stella-en', name: 'Deepgram Stella (Female)', desc: 'Clear, articulate, and professional female voice for pronunciation drills.', tag: 'POLISHED', sample: "Focus closely on the stress and natural rhythm of each phrase." },
    { id: 'aura-orion-en', name: 'Deepgram Orion (Male)', desc: 'Deep, resonant, and natural American male voice for spoken dialogues.', tag: 'MALE VOICE', sample: "Consistent daily chunk practice unlocks effortless conversation." },
    { id: 'aura-arcas-en', name: 'Deepgram Arcas (Male)', desc: 'Friendly, energetic, and engaging American male voice.', tag: 'DYNAMIC', sample: "Hit the ground running with today's spoken masterclass." },
    { id: 'aura-helios-en', name: 'Deepgram Helios (Male)', desc: 'Polished British male voice for international English drills.', tag: 'BRITISH', sample: "Speaking English with proper chunk cadence makes all the difference." }
  ];

  const voiceProfilesVi = [
    { id: 'vi-VN-Neural2-A', name: 'Google Vietnamese Neural2 (vi-VN-Neural2-A)', desc: 'Smooth, natural Vietnamese conversational tone' },
    { id: 'vi-VN-Standard-A', name: 'Google Vietnamese Standard (vi-VN-Standard-A)', desc: 'Standard Northern Vietnamese pronunciation' }
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

  const handlePreviewVoice = async (voiceId: string, sampleText: string) => {
    setPlayingVoiceId(voiceId);
    try {
      await audioPlayer.playChunk(
        sampleText,
        null,
        voiceId,
        currentSettings.default_speed,
        true // force cloud TTS test
      );
      setActiveAudioSource(audioPlayer.getLastSource());
    } catch (err) {
      console.error(err);
    } finally {
      setPlayingVoiceId(null);
    }
  };

  const handleGenerateProsody = () => {
    if (!prosodyInput.trim()) return;
    setIsGeneratingProsody(true);

    setTimeout(() => {
      const words = prosodyInput.trim().split(/\s+/);
      const rhythmic = words.map((w, idx) => {
        const clean = w.replace(/[^a-zA-Z]/g, '');
        if (clean.length > 5 && idx % 2 === 0) {
          return w.toUpperCase();
        }
        if (idx === 2 || idx === 6 || idx === 10) {
          return `${w.toUpperCase()} |`;
        }
        return w;
      }).join(' ');

      setGeneratedProsody(rhythmic);
      setIsGeneratingProsody(false);
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 font-sans">
      {/* 1. Header Banner & Live Connection Bar */}
      <div className="bg-white rounded-xl border border-[#E8E8EC] p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#DC2626]/10 text-[#DC2626] uppercase">
                Google Cloud TTS & GCS Audio Hub
              </span>
              <span className="text-xs text-[#16A34A] font-medium flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span> 4,000,000 chars/month Free Tier ($0/mo)
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl text-[#0A0A0A] tracking-tight">
              Voice Engine & Audio Management Hub
            </h1>
            <p className="text-sm text-[#6B6B6B] mt-1">
              Quản lý và kiểm thử giọng nói AI Journey, phòng thu GCS Audio và bộ giải mã ngữ điệu bài học.
            </p>
          </div>

          <button
            onClick={() => setIsDiagnosticOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white font-bold text-xs hover:bg-zinc-800 transition-all cursor-pointer shadow-xs shrink-0 self-start md:self-auto"
          >
            <Activity className="w-4 h-4 text-[#DC2626]" />
            <span>Kiểm tra kết nối Voice & GCS</span>
          </button>
        </div>

        {/* Live Audio Source Indicator Ribbon */}
        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-700">Nguồn âm thanh đang xử lý:</span>
            {activeAudioSource === 'GCS_MASTER' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-600" /> GCS Master MP3 (Phòng thu)
              </span>
            ) : activeAudioSource === 'GOOGLE_CLOUD_AI' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono font-bold flex items-center gap-1">
                <Cloud className="w-3 h-3 text-blue-600" /> Google Cloud AI TTS (Journey/Studio)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono font-bold flex items-center gap-1" title="Đang chạy qua Web Speech API trên máy do API Key bị hạn chế TTS">
                <Laptop className="w-3 h-3 text-amber-600" /> Model Máy (Browser Synthesis Fallback)
              </span>
            )}
          </div>

          <button
            onClick={() => setIsDiagnosticOpen(true)}
            className="text-[11px] font-mono text-[#DC2626] font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            Xem chẩn đoán chi tiết & nhập Custom Key ➔
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 2. Voice Profiles Configuration */}
        <div className="bg-white rounded-xl border border-[#E8E8EC] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E8EC]">
            <div className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-[#DC2626]" />
              <h2 className="font-display font-bold text-base text-[#0A0A0A]">
                1. English Voice Engine & Profiles
              </h2>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">Bấm ▶ để nghe thử</span>
          </div>

          {/* Engine Selector Tabs */}
          <div className="flex items-center p-1 bg-zinc-100 rounded-xl gap-1">
            <button
              onClick={() => setActiveVoiceEngine('GOOGLE')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                activeVoiceEngine === 'GOOGLE'
                  ? 'bg-white text-[#DC2626] shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Google Cloud TTS
            </button>
            <button
              onClick={() => setActiveVoiceEngine('DEEPGRAM')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                activeVoiceEngine === 'DEEPGRAM'
                  ? 'bg-white text-[#DC2626] shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Deepgram Aura AI
            </button>
          </div>

          {/* Deepgram API Key Config Panel (if in Deepgram Tab) */}
          {activeVoiceEngine === 'DEEPGRAM' && (
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">Deepgram API Key:</span>
                {deepgramSaved && <span className="text-[11px] font-mono text-emerald-600 font-bold">✓ Saved</span>}
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={deepgramKeyInput}
                  onChange={(e) => setDeepgramKeyInput(e.target.value)}
                  placeholder="51d7d8b230bf..."
                  className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-amber-300 text-xs font-mono"
                />
                <button
                  onClick={() => {
                    localStorage.setItem('chunks_deepgram_api_key', deepgramKeyInput.trim());
                    setDeepgramSaved(true);
                    setTimeout(() => setDeepgramSaved(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            {(activeVoiceEngine === 'GOOGLE' ? voiceProfilesEn : voiceProfilesDeepgram).map((v) => {
              const isSelected = currentSettings.voice_profile_en === v.id;
              const isPlayingThis = playingVoiceId === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => onUpdateSettings({ ...currentSettings, voice_profile_en: v.id })}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#DC2626] bg-[#DC2626]/[0.04] ring-1 ring-[#DC2626]/20'
                      : 'border-[#E8E8EC] hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#0A0A0A]">{v.name}</span>
                      {v.tag && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#DC2626] text-white">
                          {v.tag}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewVoice(v.id, v.sample);
                      }}
                      disabled={isPlayingThis}
                      className="p-1.5 rounded-lg bg-zinc-100 hover:bg-[#DC2626] hover:text-white text-zinc-700 transition-colors cursor-pointer shrink-0"
                      title={`Nghe thử ${v.name}`}
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${isPlayingThis ? 'animate-bounce text-[#DC2626]' : ''}`} />
                    </button>
                  </div>
                  <p className="text-[11px] text-[#6B6B6B] mt-1">{v.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#E8E8EC]">
            <h3 className="font-display font-bold text-xs text-[#0A0A0A] mb-2">
              Vietnamese Subtitle Audio Voice
            </h3>
            <div className="space-y-2">
              {voiceProfilesVi.map((v) => {
                const isSelected = currentSettings.voice_profile_vi === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => onUpdateSettings({ ...currentSettings, voice_profile_vi: v.id })}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'border-[#DC2626] bg-[#DC2626]/[0.04] font-semibold text-[#0A0A0A]'
                        : 'border-[#E8E8EC] text-[#6B6B6B]'
                    }`}
                  >
                    {v.name}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Drill Sequence & Flow Parameters */}
        <div className="bg-white rounded-xl border border-[#E8E8EC] p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E8E8EC]">
            <SlidersHorizontal className="w-5 h-5 text-[#DC2626]" />
            <h2 className="font-display font-bold text-base text-[#0A0A0A]">
              2. Classroom Presentation Parameters
            </h2>
          </div>

          {/* Language Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#0A0A0A] block">
              Default Audio Flow (Language Sequence):
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'EN_THEN_VI', label: '1. EN ➔ VI' },
                { id: 'EN_ONLY', label: '2. EN Only' },
                { id: 'VI_THEN_EN', label: '3. VI ➔ EN (Shadowing)' },
                { id: 'VI_ONLY', label: '4. VI Only' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => onUpdateSettings({ ...currentSettings, language_mode: m.id as LanguageMode })}
                  className={`p-2.5 rounded-lg border text-xs font-mono font-semibold transition-all cursor-pointer ${
                    currentSettings.language_mode === m.id
                      ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Speed Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0A0A0A]">Playback Speed:</span>
              <span className="font-mono font-bold text-[#DC2626]">{currentSettings.default_speed}x</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0.75, 0.9, 1.0, 1.2].map((s) => (
                <button
                  key={s}
                  onClick={() => onUpdateSettings({ ...currentSettings, default_speed: s })}
                  className={`py-2 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                    currentSettings.default_speed === s
                      ? 'bg-[#DC2626] text-white border-[#DC2626]'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Repeat Loops */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0A0A0A]">Loop Repetitions per Chunk:</span>
              <span className="font-mono font-bold text-[#DC2626]">{currentSettings.repeat_count} time(s)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((r) => (
                <button
                  key={r}
                  onClick={() => onUpdateSettings({ ...currentSettings, repeat_count: r })}
                  className={`py-2 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                    currentSettings.repeat_count === r
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  Loop {r}x
                </button>
              ))}
            </div>
          </div>

          {/* Auto Advance */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#0A0A0A] block">
              Auto-Advance Delay:
            </label>
            <select
              value={currentSettings.auto_advance_delay_sec}
              onChange={(e) => onUpdateSettings({ ...currentSettings, auto_advance_delay_sec: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#E8E8EC] rounded-lg text-xs font-mono font-semibold"
            >
              <option value={0}>Manual Stepping (Recommended — Wireless Clicker Control)</option>
              <option value={2}>2 seconds after speech ends</option>
              <option value={3}>3 seconds after speech ends</option>
              <option value={5}>5 seconds after speech ends</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. GCS Storage Spec Card */}
      <div className="bg-white rounded-xl border border-[#E8E8EC] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E8E8EC]">
          <Cloud className="w-5 h-5 text-[#DC2626]" />
          <h2 className="font-display font-bold text-base text-[#0A0A0A]">
            3. Google Cloud Storage (GCS) Standard Structure
          </h2>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900 text-zinc-100 font-mono text-xs space-y-2">
          <div className="text-[#DC2626] font-bold">// GCS Path Scheme:</div>
          <div>gs://chunks-mirror-audio-284566312743/audio/{'{level}'}/day_{'{day}'}/{'{chunk_id}'}.mp3</div>
          <div className="text-zinc-400 text-[11px] pt-1">
            Format: MP3 44.1kHz 128kbps stereo • Ưu tiên phát trực tiếp khi chunk có link audio_url
          </div>
        </div>
      </div>

      {/* 5. Live Audio Test Simulator */}
      <div className="bg-white rounded-xl border border-[#E8E8EC] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#DC2626]" />
            <h2 className="font-display font-bold text-base text-[#0A0A0A]">
              4. Live Audio Test Simulator
            </h2>
          </div>

          <button
            onClick={handleTestPlay}
            disabled={isPlayingTest}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isPlayingTest ? 'Playing...' : 'Test Play Sequence'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#0A0A0A] block mb-1">
              English Test Chunk:
            </label>
            <textarea
              rows={3}
              value={testEnglishText}
              onChange={(e) => setTestEnglishText(e.target.value)}
              className="w-full p-3 bg-[#FAFAFA] border border-[#E8E8EC] rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#DC2626]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#0A0A0A] block mb-1">
              Vietnamese Translation Chunk:
            </label>
            <textarea
              rows={3}
              value={testVietnameseText}
              onChange={(e) => setTestVietnameseText(e.target.value)}
              className="w-full p-3 bg-[#FAFAFA] border border-[#E8E8EC] rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-[#DC2626]"
            />
          </div>
        </div>
      </div>

      {/* 6. Beat Prosody & AI Stress Analyzer */}
      <div className="bg-gradient-to-r from-red-50/50 via-white to-amber-50/30 rounded-xl border border-[#DC2626]/20 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-[#DC2626]" />
            <h2 className="font-display font-bold text-base text-[#0A0A0A]">
              5. Beat Prosody Stress & Boundary Analyzer
            </h2>
          </div>

          <button
            onClick={handleGenerateProsody}
            disabled={isGeneratingProsody}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isGeneratingProsody ? 'Analyzing...' : 'Generate Beat Prosody'}</span>
          </button>
        </div>

        <p className="text-xs text-[#6B6B6B]">
          Analyzes spoken syllable stress, breath cadence markers (|), and rhythmic emphasis to assist classroom vocal drills.
        </p>

        <div>
          <input
            type="text"
            value={prosodyInput}
            onChange={(e) => setProsodyInput(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-[#E8E8EC] rounded-lg text-xs font-medium focus:outline-none focus:border-[#DC2626]"
            placeholder="Type or paste an English sentence to analyze..."
          />
        </div>

        {generatedProsody && (
          <div className="p-4 rounded-xl bg-white border-2 border-dashed border-[#DC2626]/30">
            <div className="text-[11px] font-mono font-bold text-[#DC2626] uppercase mb-1">
              Beat Prosody Stress Output:
            </div>
            <div className="text-sm md:text-base font-mono font-bold text-[#0A0A0A] tracking-wide">
              {generatedProsody}
            </div>
          </div>
        )}
      </div>

      {/* 7. Diagnostic Modal */}
      <AudioDiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
      />
    </div>
  );
};

