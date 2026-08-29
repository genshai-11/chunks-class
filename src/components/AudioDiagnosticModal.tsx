import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Radio, 
  Headphones, 
  Key, 
  RefreshCw, 
  Volume2, 
  ExternalLink,
  Laptop,
  Cloud,
  Check,
  Zap
} from 'lucide-react';
import { audioPlayer, AudioSourceType } from '../services/googleTtsService';

interface AudioDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioDiagnosticModal: React.FC<AudioDiagnosticModalProps> = ({
  isOpen,
  onClose
}) => {
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    statusCode: number;
    message: string;
    isBlocked: boolean;
  } | null>(null);

  const [customKey, setCustomKey] = useState<string>('');
  const [savedKeySuccess, setSavedKeySuccess] = useState<boolean>(false);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentSource, setCurrentSource] = useState<AudioSourceType>(audioPlayer.getLastSource());
  const [isPlayingSample, setIsPlayingSample] = useState<boolean>(false);
  const [deepgramTestResult, setDeepgramTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingDeepgram, setTestingDeepgram] = useState<boolean>(false);

  const runDeepgramTest = async () => {
    setTestingDeepgram(true);
    try {
      const res = await audioPlayer.testDeepgramConnection();
      setDeepgramTestResult(res);
    } catch (e: any) {
      setDeepgramTestResult({ success: false, message: e?.message || 'Connection error' });
    } finally {
      setTestingDeepgram(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCustomKey(audioPlayer.getCustomApiKey());
      const voices = audioPlayer.getBrowserVoices();
      setBrowserVoices(voices);
      setCurrentSource(audioPlayer.getLastSource());
      runTest();
      runDeepgramTest();
    }
  }, [isOpen]);

  const runTest = async (keyToTest?: string) => {
    setTesting(true);
    try {
      const result = await audioPlayer.testCloudTtsConnection(keyToTest);
      setTestResult(result);
    } catch (e: any) {
      setTestResult({
        success: false,
        statusCode: 0,
        message: e?.message || 'Connection error',
        isBlocked: false
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveCustomKey = () => {
    audioPlayer.setCustomApiKey(customKey);
    setSavedKeySuccess(true);
    setTimeout(() => setSavedKeySuccess(false), 3000);
    runTest(customKey);
  };

  const handleTestAudioSample = async (voice: string) => {
    setIsPlayingSample(true);
    try {
      await audioPlayer.playChunk(
        "Natural chunking rhythm practice test.",
        null,
        voice,
        1.0
      );
      setCurrentSource(audioPlayer.getLastSource());
    } finally {
      setIsPlayingSample(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#DC2626]/10 text-[#DC2626]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-zinc-900">
                Audio Engine & Voice Connection Diagnostics
              </h2>
              <p className="text-xs text-zinc-500">
                Kiểm tra kết nối Google Cloud TTS, GCS Master Audio & Bộ tổng hợp âm thanh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* 1. Live Connection Status Card */}
          <div className="p-4 rounded-xl border bg-zinc-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-blue-600" />
                Google Cloud TTS API Endpoint
              </span>
              <button
                onClick={() => runTest()}
                disabled={testing}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-zinc-300 text-zinc-700 font-semibold hover:bg-zinc-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>

            {testResult && (
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                testResult.success 
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : testResult.isBlocked
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : testResult.isBlocked ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold text-xs">
                    {testResult.success 
                      ? 'ĐÃ KẾT NỐI THÀNH CÔNG (Google Cloud Journey AI Ready)'
                      : testResult.isBlocked 
                        ? 'PHÁT HIỆN: Đang phát bằng "Model Máy" (Browser Synthesis Fallback)'
                        : `Lỗi kết nối (Mã: ${testResult.statusCode})`
                    }
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {testResult.message}
                  </p>
                </div>
              </div>
            )}
          </div>

            {/* Deepgram Aura Test Card */}
            <div className="p-4 rounded-xl border bg-purple-50/40 border-purple-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-purple-600 fill-purple-500" />
                  Deepgram Aura TTS AI Engine
                </span>
                <button
                  onClick={() => runDeepgramTest()}
                  disabled={testingDeepgram}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-purple-300 text-purple-800 font-semibold hover:bg-purple-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${testingDeepgram ? 'animate-spin' : ''}`} />
                  <span>{testingDeepgram ? 'Testing...' : 'Test Deepgram'}</span>
                </button>
              </div>

              {deepgramTestResult && (
                <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                  deepgramTestResult.success
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}>
                  {deepgramTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="font-bold text-xs">
                    {deepgramTestResult.message}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Audio Source Indicator & Why sound didn't change */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-3">
            <h3 className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-[#DC2626]" />
              Nguồn âm thanh đang phát hiện tại:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className={`p-3 rounded-lg border flex flex-col justify-between ${
                currentSource === 'GCS_MASTER'
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-500'
              }`}>
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <Radio className="w-3.5 h-3.5 text-emerald-600" />
                  1. GCS Master Audio
                </div>
                <p className="text-[10px] mt-1 text-zinc-500">File MP3 phòng thu đã render sẵn</p>
              </div>

              <div className={`p-3 rounded-lg border flex flex-col justify-between ${
                currentSource === 'DEEPGRAM_AURA'
                  ? 'bg-purple-50/80 border-purple-300 text-purple-900 ring-1 ring-purple-400'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-500'
              }`}>
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <Zap className="w-3.5 h-3.5 text-purple-600 fill-purple-500" />
                  2. Deepgram Aura AI
                </div>
                <p className="text-[10px] mt-1 text-zinc-500">Giọng Asteria/Luna sinh trực tiếp</p>
              </div>

              <div className={`p-3 rounded-lg border flex flex-col justify-between ${
                currentSource === 'GOOGLE_CLOUD_AI'
                  ? 'bg-blue-50/80 border-blue-300 text-blue-900 ring-1 ring-blue-400'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-500'
              }`}>
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <Cloud className="w-3.5 h-3.5 text-blue-600" />
                  3. Google Cloud TTS
                </div>
                <p className="text-[10px] mt-1 text-zinc-500">Giọng Journey/Studio sinh qua Google API</p>
              </div>

              <div className={`p-3 rounded-lg border flex flex-col justify-between ${
                currentSource === 'BROWSER_LOCAL'
                  ? 'bg-amber-50/80 border-amber-300 text-amber-900 ring-1 ring-amber-400'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-500'
              }`}>
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <Laptop className="w-3.5 h-3.5 text-amber-600" />
                  4. Model Máy (Browser)
                </div>
                <p className="text-[10px] mt-1 text-zinc-500">Giọng Web Speech máy tính fallback khi offline</p>
              </div>
            </div>

            {/* Explanatory note */}
            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600 leading-relaxed">
              <span className="font-bold text-zinc-800">💡 Vì sao khi chọn giọng Journey-M hay Studio-O mà âm thanh vẫn như cũ?</span>
              <ul className="list-disc ml-4 mt-1 space-y-1">
                <li>Khi Google Cloud API key bị chặn dịch vụ TTS (403), app tự động chuyển sang <strong>Model Máy (Web Speech)</strong> để bài học không bị ngắt quãng.</li>
                <li>Trình duyệt máy tính chỉ có các giọng mặc định của OS (như Microsoft David/Zira hoặc Apple Samantha), không có sẵn model Journey AI của Google nên âm thanh nghe giống nhau.</li>
                <li>App đã được bổ sung thuật toán tự động đổi <strong>Pitch (Cao độ Nam/Nữ)</strong> và chọn giọng tương ứng trên máy tính của bạn khi ở chế độ Model Máy.</li>
              </ul>
            </div>
          </div>

          {/* 3. Custom Google Cloud API Key Configuration */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-zinc-800 text-xs flex items-center gap-1.5">
                <Key className="w-4 h-4 text-[#DC2626]" />
                Tuỳ chỉnh Google Cloud TTS API Key (Tự do kích hoạt Journey AI):
              </label>
              {savedKeySuccess && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 font-mono">
                  <Check className="w-3 h-3" /> Đã lưu Key!
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="Nhập Google Cloud API Key có bật Text-to-Speech API..."
                className="flex-1 px-3 py-2 rounded-xl border border-zinc-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
              />
              <button
                onClick={handleSaveCustomKey}
                className="px-4 py-2 rounded-xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Lưu & Test
              </button>
            </div>
            <p className="text-[10px] text-zinc-400">
              Key được lưu an toàn trong trình duyệt cục bộ của bạn để kiểm thử trực tiếp các model Journey / Studio.
            </p>
          </div>

          {/* 4. Quick Sample Playback Test */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="font-bold text-zinc-800 text-xs">Test thử nghiệm giọng phát trực tiếp:</div>
              <div className="text-[11px] text-zinc-500">Thử nghiệm model Nữ (Journey-F) vs model Nam (Journey-M)</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTestAudioSample('en-US-Journey-F')}
                disabled={isPlayingSample}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-zinc-300 text-zinc-800 font-bold hover:bg-zinc-100 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Test Giọng Nữ (Journey-F)</span>
              </button>
              <button
                onClick={() => handleTestAudioSample('en-US-Journey-M')}
                disabled={isPlayingSample}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-zinc-300 text-zinc-800 font-bold hover:bg-zinc-100 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Test Giọng Nam (Journey-M)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 font-mono">
            Trình duyệt phát hiện: {browserVoices.length} giọng hệ thống nội bộ
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition-colors cursor-pointer text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
