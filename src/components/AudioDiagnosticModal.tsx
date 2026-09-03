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
  Zap,
  Sparkles,
  Layers
} from 'lucide-react';
import { 
  audioPlayer, 
  AudioSourceType,
  GoogleApiKeyConfig,
  SingleKeyTestResult,
  maskApiKey,
  detectGoogleKeyType
} from '../services/googleTtsService';

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
    activeKey?: string;
    type?: 'GOOGLE_CLOUD_TTS' | 'GEMINI_AI_STUDIO';
  } | null>(null);

  const [customKeysInput, setCustomKeysInput] = useState<string>('');
  const [savedKeySuccess, setSavedKeySuccess] = useState<boolean>(false);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentSource, setCurrentSource] = useState<AudioSourceType>(audioPlayer.getLastSource());
  const [isPlayingSample, setIsPlayingSample] = useState<boolean>(false);
  const [deepgramTestResult, setDeepgramTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingDeepgram, setTestingDeepgram] = useState<boolean>(false);

  const [keyPool, setKeyPool] = useState<GoogleApiKeyConfig[]>([]);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [singleKeyResults, setSingleKeyResults] = useState<Record<string, SingleKeyTestResult>>({});

  const refreshKeyPool = () => {
    setKeyPool([...audioPlayer.getApiKeyPool()]);
  };

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
      setCustomKeysInput(audioPlayer.getCustomApiKeys().join('\n'));
      refreshKeyPool();
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
      refreshKeyPool();
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

  const handleSaveCustomKeys = () => {
    const rawKeys = customKeysInput
      .split(/[\n,;]+/)
      .map(k => k.trim())
      .filter(Boolean);
    audioPlayer.setCustomApiKeys(rawKeys);
    refreshKeyPool();
    setSavedKeySuccess(true);
    setTimeout(() => setSavedKeySuccess(false), 3000);
    runTest();
  };

  const handleTestSingleKey = async (key: string) => {
    setTestingKey(key);
    try {
      const res = await audioPlayer.testSingleKey(key);
      setSingleKeyResults(prev => ({ ...prev, [key]: res }));
      refreshKeyPool();
    } catch (e: any) {
      setSingleKeyResults(prev => ({
        ...prev,
        [key]: {
          success: false,
          statusCode: 0,
          message: e?.message || 'Connection error',
          type: detectGoogleKeyType(key),
          isBlocked: false
        }
      }));
    } finally {
      setTestingKey(null);
    }
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
          {/* 1. Deepgram Aura Test Card (Primary Engine) */}
          <div className="p-4 rounded-xl border bg-purple-50/40 border-purple-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-purple-600 fill-purple-500" />
                1. Deepgram Aura TTS AI Engine (Khuyên dùng - Đang hoạt động)
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
                <div className="space-y-0.5">
                  <div className="font-bold text-xs">
                    {deepgramTestResult.success ? 'ĐÃ KẾT NỐI THÀNH CÔNG (Deepgram Aura Ready)' : 'Lỗi kết nối Deepgram'}
                  </div>
                  <p className="text-[11px] opacity-90">
                    {deepgramTestResult.message}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 2. Google Cloud TTS & Gemini AI Studio Multi-Key Pool Card */}
          <div className="p-4 rounded-xl border bg-zinc-50/50 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-blue-600" />
                2. Google Cloud & Gemini TTS Pool (Tự động Failover)
              </span>
              <button
                onClick={() => runTest()}
                disabled={testing}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-zinc-300 text-zinc-700 font-semibold hover:bg-zinc-100 transition-colors cursor-pointer disabled:opacity-50 text-xs shadow-2xs"
              >
                <RefreshCw className={`w-3 h-3 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Testing...' : 'Test Toàn Bộ Pool'}</span>
              </button>
            </div>

            {/* Informational Banner */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/90 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-purple-600 text-white shrink-0 mt-0.5 shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                  <span>Hệ thống Tự động Chuyển đổi Multi-Key Pool</span>
                  <span className="px-1.5 py-0.2 rounded-md text-[9px] font-extrabold bg-purple-200 text-purple-800">FAILOVER</span>
                </div>
                <p className="text-[11px] text-purple-900 leading-relaxed font-medium">
                  Hệ thống tự động chuyển đổi (Failover) khi Google Cloud TTS gặp lỗi 429 (Rate limit / Quota). Key AQ... được điều phối qua Google Gemini Flash TTS (AI Studio), đảm bảo bài giảng không bao giờ bị gián đoạn hay rơi vào giọng máy robot!
                </p>
              </div>
            </div>

            {/* Key Pool Status Summary Counters */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-white border border-zinc-200 text-center shadow-2xs">
                <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Tổng số Key</div>
                <div className="text-base font-bold text-zinc-900 mt-0.5">{keyPool.length}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center shadow-2xs">
                <div className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">Sẵn Sàng (Ready)</div>
                <div className="text-base font-bold text-emerald-700 mt-0.5">
                  {keyPool.filter(k => (!k.rateLimitedUntil || k.rateLimitedUntil <= Date.now()) && k.status !== 'ERROR').length}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-center shadow-2xs">
                <div className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider">Tạm Khóa (429 Cooldown)</div>
                <div className="text-base font-bold text-amber-700 mt-0.5">
                  {keyPool.filter(k => (k.rateLimitedUntil && k.rateLimitedUntil > Date.now()) || k.status === 'RATE_LIMITED').length}
                </div>
              </div>
            </div>

            {/* Render Each Key in Pool */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold text-zinc-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-500" />
                  Danh sách Keys trong Pool:
                </span>
                <span className="text-[10px] font-normal text-zinc-400">Luân chuyển tự động theo thứ tự ưu tiên</span>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {keyPool.map((k, idx) => {
                  const isAQ = k.type === 'GEMINI_AI_STUDIO';
                  const isRateLimited = (k.rateLimitedUntil && k.rateLimitedUntil > Date.now()) || k.status === 'RATE_LIMITED';
                  const isErr = k.status === 'ERROR';
                  const res = singleKeyResults[k.key];
                  const isTestingThis = testingKey === k.key;

                  return (
                    <div 
                      key={k.key + idx}
                      className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 transition-colors space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-xs text-zinc-800 tracking-tight bg-zinc-100 px-2 py-0.5 rounded-md">
                            {maskApiKey(k.key)}
                          </span>

                          {/* Type badge */}
                          {isAQ ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                              <Sparkles className="w-3 h-3 text-purple-600" />
                              Gemini Flash TTS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                              <Cloud className="w-3 h-3 text-blue-600" />
                              Google Cloud TTS
                            </span>
                          )}

                          {/* Status badge */}
                          {isRateLimited ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Cooldown / 429
                            </span>
                          ) : isErr ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Error
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Ready
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleTestSingleKey(k.key)}
                          disabled={isTestingThis}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-semibold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-2.5 h-2.5 ${isTestingThis ? 'animate-spin' : ''}`} />
                          <span>{isTestingThis ? 'Testing...' : 'Test Key'}</span>
                        </button>
                      </div>

                      {res && (
                        <div className={`p-1.5 px-2 rounded-lg text-[10px] flex items-center gap-1.5 ${
                          res.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {res.success ? <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" /> : <XCircle className="w-3 h-3 text-rose-600 shrink-0" />}
                          <span className="truncate">{res.message}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Overall Pool Test Result */}
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
                      ? `KẾT NỐI POOL THÀNH CÔNG (${testResult.type === 'GEMINI_AI_STUDIO' ? 'Google Gemini Flash TTS' : 'Google Cloud Journey AI'} Online)`
                      : testResult.isBlocked 
                        ? 'Google Cloud API Key bị giới hạn dịch vụ TTS (403)'
                        : `Lỗi kết nối Pool (Mã: ${testResult.statusCode})`
                    }
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {testResult.isBlocked 
                      ? 'Key mặc định bị giới hạn dịch vụ Text-to-Speech (403). Hệ thống sẽ tự động failover sang key Gemini Flash AI Studio (AQ...) hoặc bạn có thể nhập key tùy chỉnh bên dưới.'
                      : testResult.message
                    }
                  </p>
                  {testResult.activeKey && (
                    <div className="text-[10px] font-mono text-zinc-500 pt-0.5">
                      Key hoạt động: {maskApiKey(testResult.activeKey)} ({testResult.type})
                    </div>
                  )}
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

          {/* 3. Custom Google Cloud & Gemini AI Studio API Keys Configuration */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="font-bold text-zinc-800 text-xs flex items-center gap-1.5">
                <Key className="w-4 h-4 text-[#DC2626]" />
                Tuỳ chỉnh Multi-Key Pool (Google Cloud AIza... & Gemini AI Studio AQ...):
              </label>
              {savedKeySuccess && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 font-mono">
                  <Check className="w-3 h-3" /> Đã lưu Key Pool!
                </span>
              )}
            </div>

            <textarea
              value={customKeysInput}
              onChange={(e) => setCustomKeysInput(e.target.value)}
              rows={3}
              placeholder="Nhập các API Keys bổ sung (mỗi key một dòng hoặc cách nhau bởi dấu phẩy).&#10;Hỗ trợ cả Google Cloud (AIza...) và Gemini AI Studio (AQ...)..."
              className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626] leading-relaxed"
            />

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-[10px] text-zinc-400 leading-tight">
                Key được lưu an toàn trên trình duyệt cục bộ của bạn và tự động đưa vào hàng đợi Failover.
              </p>
              <button
                onClick={handleSaveCustomKeys}
                className="px-4 py-2 rounded-xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition-colors cursor-pointer text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                Lưu & Kích hoạt Pool
              </button>
            </div>
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
