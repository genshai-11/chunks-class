export type TtsProviderType = 
  | 'GOOGLE_TTS' 
  | 'GEMINI_AI_STUDIO' 
  | 'DEEPGRAM' 
  | 'OPENAI_TTS' 
  | 'CUSTOM_TTS';

export type KeyStatus = 'READY' | 'RATE_LIMITED' | 'ERROR';

export interface ProviderApiKey {
  id: string;
  provider: TtsProviderType;
  key: string;
  label?: string;
  status: KeyStatus;
  rateLimitedUntil?: number; // timestamp in ms
  lastUsedAt?: number;
  lastError?: string;
}

export interface RegisteredModel {
  id: string;
  name: string;
  language: 'en' | 'vi' | 'other';
  gender: 'FEMALE' | 'MALE' | 'NEUTRAL';
  provider: TtsProviderType;
  description?: string;
  isCustom?: boolean;
  improvEnabled: boolean; // default true for all models ("mặc định Improv - hiện tất cả all")
  focusEnabled: boolean;  // default true for primary classroom voices
}

export interface ProviderMeta {
  id: TtsProviderType;
  name: string;
  shortName: string;
  description: string;
  color: string;
  docUrl?: string;
}

export interface SingleKeyTestResult {
  success: boolean;
  statusCode: number;
  message: string;
  isBlocked?: boolean;
}

export const PROVIDERS_META: Record<TtsProviderType, ProviderMeta> = {
  GOOGLE_TTS: {
    id: 'GOOGLE_TTS',
    name: 'Google Cloud Text-to-Speech',
    shortName: 'Google Cloud',
    description: 'Giọng đọc chuẩn phòng thu Chirp3-HD, Neural2, WaveNet và Journey của Google Cloud.',
    color: '#4285F4',
    docUrl: 'https://cloud.google.com/text-to-speech'
  },
  GEMINI_AI_STUDIO: {
    id: 'GEMINI_AI_STUDIO',
    name: 'Google Gemini AI Studio (TTS Preview)',
    shortName: 'Gemini Flash',
    description: 'Giọng đọc AI thế hệ mới từ Gemini 3.1 Flash TTS Preview thông qua Google AI Studio API.',
    color: '#8E24AA',
    docUrl: 'https://aistudio.google.com'
  },
  DEEPGRAM: {
    id: 'DEEPGRAM',
    name: 'Deepgram Aura & Flux TTS',
    shortName: 'Deepgram Aura/Flux',
    description: 'Giọng hội thoại tiếng Anh siêu tốc độ thấp và tự nhiên nhất thế giới (Flux Cliff, Asteria, Luna, Orion...).',
    color: '#10B981',
    docUrl: 'https://deepgram.com'
  },
  OPENAI_TTS: {
    id: 'OPENAI_TTS',
    name: 'OpenAI TTS (tts-1 / tts-1-hd)',
    shortName: 'OpenAI Audio',
    description: 'Hệ thống giọng đọc AI của OpenAI qua endpoint /v1/audio/speech (Alloy, Echo, Nova, Shimmer...).',
    color: '#10A37F',
    docUrl: 'https://platform.openai.com/docs/guides/text-to-speech'
  },
  CUSTOM_TTS: {
    id: 'CUSTOM_TTS',
    name: 'Custom TTS (OpenAI-compatible Endpoint)',
    shortName: 'Custom Endpoint',
    description: 'Kết nối máy chủ phát âm tùy chỉnh hoặc self-hosted TTS tuân thủ giao thức OpenAI.',
    color: '#F59E0B'
  }
};

/**
 * Built-in default models list
 * Rule: improvEnabled is TRUE for ALL models ("mặc định Improv - hiện tất cả all").
 * focusEnabled is TRUE for primary classroom voices.
 */
export const DEFAULT_REGISTERED_MODELS: RegisteredModel[] = [
  // ================= DEEPGRAM (Aura & Flux) =================
  {
    id: 'flux-cliff-en',
    name: 'Deepgram Flux Cliff (Nam Mỹ Chuẩn - Mặc định)',
    language: 'en',
    gender: 'MALE',
    provider: 'DEEPGRAM',
    description: 'Deepgram Flux thế hệ mới nhất: Giọng nam đàm thoại tự nhiên, nhịp điệu hoàn hảo cho luyện phản xạ.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'aura-asteria-en',
    name: 'Deepgram Aura Asteria (Nữ Mỹ - Rõ Ràng & Tự Nhiên)',
    language: 'en',
    gender: 'FEMALE',
    provider: 'DEEPGRAM',
    description: 'Giọng nữ Mỹ chuẩn, ngữ điệu rõ nét và sinh động.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'aura-luna-en',
    name: 'Deepgram Aura Luna (Nữ Mỹ - Ấm Áp & Thân Thiện)',
    language: 'en',
    gender: 'FEMALE',
    provider: 'DEEPGRAM',
    description: 'Giọng nữ ấm áp, truyền cảm, thích hợp cho giao tiếp đời thường.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'aura-stella-en',
    name: 'Deepgram Aura Stella (Nữ Mỹ - Phát Âm Chuẩn)',
    language: 'en',
    gender: 'FEMALE',
    provider: 'DEEPGRAM',
    description: 'Giọng nữ mạch lạc, phát âm từng phụ âm chuẩn xác cho shadowing.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'aura-athena-en',
    name: 'Deepgram Aura Athena (Nữ Anh - Điềm Tĩnh)',
    language: 'en',
    gender: 'FEMALE',
    provider: 'DEEPGRAM',
    description: 'Giọng nữ Anh-Anh điềm tĩnh, phong cách học thuật.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'aura-orion-en',
    name: 'Deepgram Aura Orion (Nam Mỹ - Trầm Ấm Thuyết Trình)',
    language: 'en',
    gender: 'MALE',
    provider: 'DEEPGRAM',
    description: 'Giọng nam trầm vang, thích hợp cho thuyết trình và hội thoại trang trọng.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'aura-arcas-en',
    name: 'Deepgram Aura Arcas (Nam Mỹ - Năng Động)',
    language: 'en',
    gender: 'MALE',
    provider: 'DEEPGRAM',
    description: 'Giọng nam năng động, tự nhiên.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'aura-perseus-en',
    name: 'Deepgram Aura Perseus (Nam Mỹ - Đĩnh Đạc)',
    language: 'en',
    gender: 'MALE',
    provider: 'DEEPGRAM',
    description: 'Giọng nam đĩnh đạc, ấm áp.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'aura-helios-en',
    name: 'Deepgram Aura Helios (Nam Anh - Chuẩn UK)',
    language: 'en',
    gender: 'MALE',
    provider: 'DEEPGRAM',
    description: 'Giọng nam Anh-Anh lịch thiệp, phục vụ các bài tập giọng Anh quốc tế.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'aura-angus-en',
    name: 'Deepgram Aura Angus (Nam Mỹ - Gần Gũi)',
    language: 'en',
    gender: 'MALE',
    provider: 'DEEPGRAM',
    description: 'Giọng nam thân thiện, đàm thoại tự nhiên.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'aura-hera-en',
    name: 'Deepgram Aura Hera (Nữ Mỹ - Tự Tin)',
    language: 'en',
    gender: 'FEMALE',
    provider: 'DEEPGRAM',
    description: 'Giọng nữ tự tin, dứt khoát.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'aura-orpheus-en',
    name: 'Deepgram Aura Orpheus (Nam Mỹ - Kể Chuyện)',
    language: 'en',
    gender: 'MALE',
    provider: 'DEEPGRAM',
    description: 'Giọng nam truyền cảm, mượt mà.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'aura-zeus-en',
    name: 'Deepgram Aura Zeus (Nam Mỹ - Quyền Uy)',
    language: 'en',
    gender: 'MALE',
    provider: 'DEEPGRAM',
    description: 'Giọng nam mạnh mẽ, uy quyền cho phát biểu.',
    improvEnabled: true,
    focusEnabled: false
  },

  // ================= GOOGLE CLOUD EN =================
  {
    id: 'en-US-Journey-F',
    name: 'Google Journey Female (Nữ Mỹ Siêu Thực)',
    language: 'en',
    gender: 'FEMALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nữ Mỹ công nghệ cao cấp nhất của Google với cảm xúc biểu đạt tự nhiên.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'en-US-Journey-M',
    name: 'Google Journey Male (Nam Mỹ Siêu Thực)',
    language: 'en',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam Mỹ biểu cảm cao cấp của Google.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'en-US-Studio-O',
    name: 'Google Studio-O (Nữ Mỹ Chuẩn Phòng Thu)',
    language: 'en',
    gender: 'FEMALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng phòng thu độ sắc nét tối đa, tối ưu cho bài giảng ngữ âm chuyên sâu.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'en-US-Studio-Q',
    name: 'Google Studio-Q (Nam Mỹ Chuẩn Phòng Thu)',
    language: 'en',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam phòng thu cao cấp cho giảng dạy tiếng Anh chuẩn xác.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'en-US-Neural2-F',
    name: 'Google Neural2-F (Nữ Mỹ Tự Nhiên)',
    language: 'en',
    gender: 'FEMALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nữ Neural2 tự nhiên, chuẩn mực phát thanh.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'en-US-Neural2-D',
    name: 'Google Neural2-D (Nam Mỹ Điềm Đạm)',
    language: 'en',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam Neural2 trầm ấm, rõ ràng.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'en-US-Casual-K',
    name: 'Google Casual-K (Nam Mỹ Hội Thoại)',
    language: 'en',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam thư giãn, hội thoại đời sống.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'en-US-Journey-D',
    name: 'Google Journey-D (Nam Mỹ Biểu Cảm)',
    language: 'en',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam ngữ điệu linh hoạt.',
    improvEnabled: true,
    focusEnabled: false
  },

  // ================= GOOGLE CLOUD VI (Neural2, Chirp3-HD, WaveNet, Standard) =================
  {
    id: 'vi-VN-Neural2-A',
    name: 'Google Neural2-A (Nữ Chuẩn Bắc - Mặc định lớp)',
    language: 'vi',
    gender: 'FEMALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng đọc nữ tiếng Việt chuẩn Bắc tự nhiên, trong sáng và thanh lịch nhất của Google.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'vi-VN-Neural2-D',
    name: 'Google Neural2-D (Nam Chuẩn Nam)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng đọc nam tiếng Việt giọng miền Nam rõ ràng, ấm áp và đĩnh đạc.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'vi-VN-Wavenet-A',
    name: 'Google WaveNet-A (Nữ Miền Bắc)',
    language: 'vi',
    gender: 'FEMALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nữ WaveNet Bắc truyền cảm.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'vi-VN-Wavenet-B',
    name: 'Google WaveNet-B (Nam Miền Bắc)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam WaveNet Bắc trầm ấm.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'vi-VN-Wavenet-C',
    name: 'Google WaveNet-C (Nữ Miền Nam)',
    language: 'vi',
    gender: 'FEMALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nữ WaveNet Nam Bộ nhẹ nhàng.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Wavenet-D',
    name: 'Google WaveNet-D (Nam Miền Nam)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam WaveNet Nam Bộ truyền cảm.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Standard-A',
    name: 'Google Standard-A (Nữ Bắc Cơ Bản)',
    language: 'vi',
    gender: 'FEMALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nữ Standard Bắc.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'vi-VN-Standard-B',
    name: 'Google Standard-B (Nam Bắc Cơ Bản)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam Standard Bắc.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'vi-VN-Standard-C',
    name: 'Google Standard-C (Nữ Nam Cơ Bản)',
    language: 'vi',
    gender: 'FEMALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nữ Standard Nam Bộ.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Standard-D',
    name: 'Google Standard-D (Nam Nam Cơ Bản)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam Standard Nam Bộ.',
    improvEnabled: true,
    focusEnabled: false
  },

  // --- Google Chirp3-HD Studio Vietnamese Models ---
  {
    id: 'vi-VN-Chirp3-HD-Achernar',
    name: 'Google Chirp3-HD Achernar (Nữ Studio HD)',
    language: 'vi',
    gender: 'FEMALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nữ Chirp3-HD Studio siêu nét.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'vi-VN-Chirp3-HD-Aoede',
    name: 'Google Chirp3-HD Aoede (Nữ Studio HD)',
    language: 'vi',
    gender: 'FEMALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nữ Chirp3-HD mượt mà.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'vi-VN-Chirp3-HD-Autonoe',
    name: 'Google Chirp3-HD Autonoe (Nữ Studio HD)',
    language: 'vi',
    gender: 'FEMALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nữ Chirp3-HD trong trẻo.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Callirrhoe',
    name: 'Google Chirp3-HD Callirrhoe (Nữ Studio HD)',
    language: 'vi',
    gender: 'FEMALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nữ Chirp3-HD diễn cảm.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Despina',
    name: 'Google Chirp3-HD Despina (Nữ Studio HD)',
    language: 'vi',
    gender: 'FEMALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nữ Chirp3-HD thanh tao.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Erinome',
    name: 'Google Chirp3-HD Erinome (Nữ Studio HD)',
    language: 'vi',
    gender: 'FEMALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nữ Chirp3-HD nhẹ nhàng.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Gacrux',
    name: 'Google Chirp3-HD Gacrux (Nữ Studio HD)',
    language: 'vi',
    gender: 'FEMALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nữ Chirp3-HD sâu lắng.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Kore',
    name: 'Google Chirp3-HD Kore (Nữ Studio HD)',
    language: 'vi',
    gender: 'FEMALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nữ Chirp3-HD tự nhiên.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'vi-VN-Chirp3-HD-Laomedeia',
    name: 'Google Chirp3-HD Laomedeia (Nữ Studio HD)',
    language: 'vi',
    gender: 'FEMALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nữ Chirp3-HD thanh khiết.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Leda',
    name: 'Google Chirp3-HD Leda (Nữ Studio HD)',
    language: 'vi',
    gender: 'FEMALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nữ Chirp3-HD êm tai.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Pulcherrima',
    name: 'Google Chirp3-HD Pulcherrima (Nữ Studio HD)',
    language: 'vi',
    gender: 'FEMALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nữ Chirp3-HD tinh tế.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Vindemiatrix',
    name: 'Google Chirp3-HD Vindemiatrix (Nữ Studio HD)',
    language: 'vi',
    gender: 'FEMALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nữ Chirp3-HD rõ nét.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Zephyr',
    name: 'Google Chirp3-HD Zephyr (Nữ Studio HD)',
    language: 'vi',
    gender: 'FEMALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nữ Chirp3-HD trong sáng.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Fenrir',
    name: 'Google Chirp3-HD Fenrir (Nữ Studio HD)',
    language: 'vi',
    gender: 'FEMALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nữ Chirp3-HD truyền cảm.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Alcor',
    name: 'Google Chirp3-HD Alcor (Nam Studio HD)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam Chirp3-HD ấm áp, đĩnh đạc.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'vi-VN-Chirp3-HD-Algedi',
    name: 'Google Chirp3-HD Algedi (Nam Studio HD)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam Chirp3-HD rõ âm chuẩn.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'vi-VN-Chirp3-HD-Alrakis',
    name: 'Google Chirp3-HD Alrakis (Nam Studio HD)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam Chirp3-HD trầm vừa.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Ankaa',
    name: 'Google Chirp3-HD Ankaa (Nam Studio HD)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam Chirp3-HD trang trọng.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Charon',
    name: 'Google Chirp3-HD Charon (Nam Studio HD)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam Chirp3-HD sâu lắng.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Enceladus',
    name: 'Google Chirp3-HD Enceladus (Nam Studio HD)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam Chirp3-HD tự nhiên.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Iapetus',
    name: 'Google Chirp3-HD Iapetus (Nam Studio HD)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam Chirp3-HD trầm vang.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Kalyke',
    name: 'Google Chirp3-HD Kalyke (Nam Studio HD)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam Chirp3-HD rõ tiếng.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Naiad',
    name: 'Google Chirp3-HD Naiad (Nam Studio HD)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam Chirp3-HD đàm thoại.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Oberon',
    name: 'Google Chirp3-HD Oberon (Nam Studio HD)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam Chirp3-HD mạnh mẽ.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Orus',
    name: 'Google Chirp3-HD Orus (Nam Studio HD)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam Chirp3-HD mạch lạc.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Puck',
    name: 'Google Chirp3-HD Puck (Nam Studio HD)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam Chirp3-HD trẻ trung.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'vi-VN-Chirp3-HD-Rasalgethi',
    name: 'Google Chirp3-HD Rasalgethi (Nam Studio HD)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam Chirp3-HD truyền cảm.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Sadachbia',
    name: 'Google Chirp3-HD Sadachbia (Nam Studio HD)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam Chirp3-HD chắc nịch.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Sadaltager',
    name: 'Google Chirp3-HD Sadaltager (Nam Studio HD)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam Chirp3-HD đĩnh đạc.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Schedar',
    name: 'Google Chirp3-HD Schedar (Nam Studio HD)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam Chirp3-HD lịch thiệp.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Umbriel',
    name: 'Google Chirp3-HD Umbriel (Nam Studio HD)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam Chirp3-HD thanh nhã.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'vi-VN-Chirp3-HD-Zubenelgenubi',
    name: 'Google Chirp3-HD Zubenelgenubi (Nam Studio HD)',
    language: 'vi',
    gender: 'MALE',
    provider: 'GOOGLE_TTS',
    description: 'Giọng nam Chirp3-HD phong thái đĩnh đạc.',
    improvEnabled: true,
    focusEnabled: false
  },

  // ================= OPENAI VOICES =================
  {
    id: 'openai-alloy',
    name: 'OpenAI Alloy (Trung Tính - Đa Năng)',
    language: 'en',
    gender: 'NEUTRAL',
    provider: 'OPENAI_TTS',
    description: 'Giọng đọc cân bằng, linh hoạt cho nhiều ngữ cảnh giao tiếp.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'openai-echo',
    name: 'OpenAI Echo (Nam Mỹ - Trầm Ấm)',
    language: 'en',
    gender: 'MALE',
    provider: 'OPENAI_TTS',
    description: 'Giọng nam tròn vành rõ chữ, tự nhiên.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'openai-fable',
    name: 'OpenAI Fable (Nam Anh - Biểu Cảm Kể Chuyện)',
    language: 'en',
    gender: 'MALE',
    provider: 'OPENAI_TTS',
    description: 'Giọng nam ngữ điệu phong phú, thích hợp cho kịch bản ngữ cảnh.',
    improvEnabled: true,
    focusEnabled: false
  },
  {
    id: 'openai-onyx',
    name: 'OpenAI Onyx (Nam Mỹ - Trầm Vang Uy Lực)',
    language: 'en',
    gender: 'MALE',
    provider: 'OPENAI_TTS',
    description: 'Giọng nam trầm, chắc khỏe cho thuyết trình.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'openai-nova',
    name: 'OpenAI Nova (Nữ Mỹ - Trẻ Trung & Sinh Động)',
    language: 'en',
    gender: 'FEMALE',
    provider: 'OPENAI_TTS',
    description: 'Giọng nữ tràn đầy năng lượng, thân thiện và tươi sáng.',
    improvEnabled: true,
    focusEnabled: true
  },
  {
    id: 'openai-shimmer',
    name: 'OpenAI Shimmer (Nữ Mỹ - Êm Dịu & Rõ Âm)',
    language: 'en',
    gender: 'FEMALE',
    provider: 'OPENAI_TTS',
    description: 'Giọng nữ êm dịu, rõ ràng từng âm tiết.',
    improvEnabled: true,
    focusEnabled: true
  }
];

class ModelRegistryService {
  private keys: ProviderApiKey[] = [];
  private models: RegisteredModel[] = [];
  private mainModelEn: string = 'flux-cliff-en';
  private mainModelVi: string = 'vi-VN-Neural2-A';
  private listeners: Set<() => void> = new Set();
  private customEndpoint: string = '';

  constructor() {
    this.initFromStorage();
  }

  private initFromStorage(): void {
    if (typeof window === 'undefined') {
      this.models = [...DEFAULT_REGISTERED_MODELS];
      return;
    }

    try {
      // 1. Load Keys
      const rawKeys = localStorage.getItem('chunks_provider_keys_v2');
      if (rawKeys) {
        const parsed = JSON.parse(rawKeys);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.keys = parsed;
        } else {
          this.seedInitialKeys();
        }
      } else {
        this.seedInitialKeys();
      }

      // 2. Load Models
      const rawModels = localStorage.getItem('chunks_registered_models_v2');
      if (rawModels) {
        const parsed = JSON.parse(rawModels);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge to ensure newly added default models always exist
          const existingIds = new Set(parsed.map((m: any) => m.id));
          const missingDefaults = DEFAULT_REGISTERED_MODELS.filter(d => !existingIds.has(d.id));
          this.models = [...parsed, ...missingDefaults];
        } else {
          this.models = [...DEFAULT_REGISTERED_MODELS];
        }
      } else {
        this.models = [...DEFAULT_REGISTERED_MODELS];
      }

      // 3. Load Main Models
      const savedMainEn = localStorage.getItem('chunks_main_model_en');
      if (savedMainEn) this.mainModelEn = savedMainEn;

      const savedMainVi = localStorage.getItem('chunks_main_model_vi');
      if (savedMainVi) this.mainModelVi = savedMainVi;

      // 4. Custom Endpoint
      const savedEndpoint = localStorage.getItem('chunks_custom_tts_endpoint');
      if (savedEndpoint) this.customEndpoint = savedEndpoint;

      this.saveKeys();
      this.saveModels();
    } catch (e) {
      console.warn('[ModelRegistry] Init error:', e);
      this.models = [...DEFAULT_REGISTERED_MODELS];
      this.seedInitialKeys();
    }
  }

  private seedInitialKeys(): void {
    const keys: ProviderApiKey[] = [];

    // Seed Google Cloud TTS Key
    keys.push({
      id: 'key_google_default',
      provider: 'GOOGLE_TTS',
      key: 'AIzaSyBrH0sAU__R4k1IBrSYIF73fFdASeSpdE4',
      label: 'Google Cloud TTS Built-in Primary',
      status: 'READY'
    });

    // Seed Gemini Flash TTS Keys
    try {
      const geminiKey1 = typeof atob !== 'undefined' 
        ? atob('QVEuQWI4Uk42Smd3UVhxWVFTSTkxRXdYc1BVWlpEaWhBLWJrR0ZEcWxoUy1kOUJXSU5Gc0E=') 
        : '';
      if (geminiKey1) {
        keys.push({
          id: 'key_gemini_1',
          provider: 'GEMINI_AI_STUDIO',
          key: geminiKey1,
          label: 'Gemini Flash AI Studio #1',
          status: 'READY'
        });
      }

      const envGemini = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || (
        typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42SmU3d2NZQTZLLWs0YmlnOUprZDRrd3RfOUJlbE1WT3VzU2J5a3ZFWnRkYVE=') : ''
      );
      if (envGemini && envGemini !== geminiKey1) {
        keys.push({
          id: 'key_gemini_2',
          provider: 'GEMINI_AI_STUDIO',
          key: envGemini,
          label: 'Gemini Flash AI Studio #2',
          status: 'READY'
        });
      }
    } catch {}

    // Seed Deepgram Key
    const envDeepgram = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEEPGRAM_API_KEY) || '92def6215618aeda77c43f4446ba84ef7152091c';
    const legacyDg = typeof localStorage !== 'undefined' ? localStorage.getItem('chunks_deepgram_api_key') : null;
    const effectiveDgKey = (legacyDg && legacyDg.trim() && legacyDg !== '51d7d8b230bf742178e681e7836a3dc1571b1c11') 
      ? legacyDg.trim() 
      : envDeepgram;

    keys.push({
      id: 'key_deepgram_default',
      provider: 'DEEPGRAM',
      key: effectiveDgKey,
      label: 'Deepgram Aura/Flux Production Key',
      status: 'READY'
    });

    // Seed OpenAI Key if present
    const envOpenAi = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_OPENAI_API_KEY : '';
    if (envOpenAi && envOpenAi.trim()) {
      keys.push({
        id: 'key_openai_default',
        provider: 'OPENAI_TTS',
        key: envOpenAi.trim(),
        label: 'OpenAI TTS Key (Env)',
        status: 'READY'
      });
    }

    // Migrate any legacy custom keys
    if (typeof localStorage !== 'undefined') {
      try {
        const legacyCustomRaw = localStorage.getItem('chunks_custom_tts_api_keys');
        if (legacyCustomRaw) {
          const parsed = JSON.parse(legacyCustomRaw);
          if (Array.isArray(parsed)) {
            parsed.forEach((k: string, idx: number) => {
              const trimmed = String(k).trim();
              if (trimmed && !keys.some(x => x.key === trimmed)) {
                const isGemini = trimmed.startsWith('AQ.');
                keys.push({
                  id: `key_migrated_${idx}_${Date.now()}`,
                  provider: isGemini ? 'GEMINI_AI_STUDIO' : 'GOOGLE_TTS',
                  key: trimmed,
                  label: `Migrated Custom Key #${idx + 1}`,
                  status: 'READY'
                });
              }
            });
          }
        }
      } catch {}
    }

    this.keys = keys;
  }

  private saveKeys(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('chunks_provider_keys_v2', JSON.stringify(this.keys));
      } catch {}
    }
    this.notify();
  }

  private saveModels(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('chunks_registered_models_v2', JSON.stringify(this.models));
      } catch {}
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(fn => {
      try { fn(); } catch {}
    });
  }

  // =========================================================================
  // KEY MANAGEMENT & 429 FAILOVER ROTATION
  // =========================================================================

  public getAllKeys(): ProviderApiKey[] {
    this.cleanExpiredCooldowns();
    return [...this.keys];
  }

  public getKeysByProvider(provider: TtsProviderType): ProviderApiKey[] {
    this.cleanExpiredCooldowns();
    return this.keys.filter(k => k.provider === provider);
  }

  public getNextActiveKey(provider: TtsProviderType): string | null {
    this.cleanExpiredCooldowns();
    const providerKeys = this.keys.filter(k => k.provider === provider);
    if (providerKeys.length === 0) return null;

    const now = Date.now();
    // 1. Ready keys with no active cooldown
    const readyKeys = providerKeys.filter(k => 
      k.status === 'READY' && (!k.rateLimitedUntil || k.rateLimitedUntil <= now)
    );
    if (readyKeys.length > 0) {
      return readyKeys[0].key;
    }

    // 2. Cooldown keys if all are limited, pick the one closest to expiry
    const nonErrorKeys = providerKeys.filter(k => k.status !== 'ERROR');
    if (nonErrorKeys.length > 0) {
      nonErrorKeys.sort((a, b) => (a.rateLimitedUntil || 0) - (b.rateLimitedUntil || 0));
      return nonErrorKeys[0].key;
    }

    // 3. Fallback to any key
    return providerKeys[0].key;
  }

  /**
   * Automatic 429 Rate Limit Handler & Failover:
   * Marks key as RATE_LIMITED for 60 seconds, switches to next READY key in pool,
   * and dispatches change notification.
   */
  public rotateKeyOn429(provider: TtsProviderType, currentKey: string): string | null {
    const keyItem = this.keys.find(k => k.provider === provider && k.key.trim() === currentKey.trim());
    const cooldownMs = 60000; // 60 seconds cooldown

    if (keyItem) {
      keyItem.status = 'RATE_LIMITED';
      keyItem.rateLimitedUntil = Date.now() + cooldownMs;
      keyItem.lastError = 'HTTP 429: Quota / Rate Limit Exceeded';
      console.warn(`[ModelRegistry] Provider ${provider} key (${this.maskKey(keyItem.key)}) hit 429. Cooldown set for 60s.`);
    }

    this.saveKeys();
    const nextKey = this.getNextActiveKey(provider);
    return nextKey;
  }

  public addKey(provider: TtsProviderType, rawKey: string, label?: string): ProviderApiKey {
    const trimmed = rawKey.trim();
    if (!trimmed) throw new Error('API Key cannot be empty');

    // Prevent exact duplicates
    const existing = this.keys.find(k => k.provider === provider && k.key === trimmed);
    if (existing) {
      if (label && label !== existing.label) {
        existing.label = label;
        this.saveKeys();
      }
      return existing;
    }

    const newKey: ProviderApiKey = {
      id: `key_${provider.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      provider,
      key: trimmed,
      label: label?.trim() || `${PROVIDERS_META[provider]?.shortName || provider} Key`,
      status: 'READY'
    };

    this.keys.push(newKey);
    this.saveKeys();
    return newKey;
  }

  public deleteKey(id: string): void {
    this.keys = this.keys.filter(k => k.id !== id);
    this.saveKeys();
  }

  public updateKey(id: string, updates: Partial<ProviderApiKey>): void {
    const item = this.keys.find(k => k.id === id);
    if (!item) return;
    Object.assign(item, updates);
    this.saveKeys();
  }

  public cleanExpiredCooldowns(): void {
    const now = Date.now();
    let changed = false;
    for (const k of this.keys) {
      if (k.rateLimitedUntil && k.rateLimitedUntil <= now) {
        k.rateLimitedUntil = undefined;
        if (k.status === 'RATE_LIMITED') {
          k.status = 'READY';
          k.lastError = undefined;
          changed = true;
        }
      }
    }
    if (changed) {
      this.saveKeys();
    }
  }

  /**
   * Live Test API Key Connectivity for each provider
   */
  public async testKey(keyOrId: string | ProviderApiKey): Promise<SingleKeyTestResult> {
    const item = typeof keyOrId === 'string' 
      ? this.keys.find(k => k.id === keyOrId || k.key === keyOrId)
      : keyOrId;

    if (!item) {
      return { success: false, statusCode: 0, message: 'Key not found' };
    }

    const trimmed = item.key.trim();
    if (!trimmed) {
      return { success: false, statusCode: 0, message: 'API key is empty' };
    }

    item.lastUsedAt = Date.now();

    try {
      if (item.provider === 'GOOGLE_TTS') {
        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${trimmed}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: "Connection test" },
            voice: { languageCode: 'en-US', name: 'en-US-Journey-F' },
            audioConfig: { audioEncoding: 'MP3' }
          })
        });

        if (resp.ok) {
          item.status = 'READY';
          item.lastError = undefined;
          item.rateLimitedUntil = undefined;
          this.saveKeys();
          return { success: true, statusCode: resp.status, message: 'Google Cloud TTS: Kết nối thành công (200 OK)' };
        } else {
          const errText = await resp.text();
          if (resp.status === 429) {
            item.status = 'RATE_LIMITED';
            item.rateLimitedUntil = Date.now() + 60000;
            item.lastError = '429 Rate Limit Exceeded';
          } else {
            item.status = 'ERROR';
            item.lastError = `HTTP ${resp.status}: ${errText.slice(0, 80)}`;
          }
          this.saveKeys();
          return {
            success: false,
            statusCode: resp.status,
            message: `Lỗi kết nối (${resp.status}): ${errText.slice(0, 100)}`,
            isBlocked: resp.status === 403
          };
        }
      }

      if (item.provider === 'GEMINI_AI_STUDIO') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${trimmed}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Gemini connection test" }] }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
              }
            }
          })
        });

        if (resp.ok) {
          item.status = 'READY';
          item.lastError = undefined;
          item.rateLimitedUntil = undefined;
          this.saveKeys();
          return { success: true, statusCode: resp.status, message: 'Gemini AI Studio TTS: Kết nối thành công (200 OK)' };
        } else {
          const errText = await resp.text();
          if (resp.status === 429) {
            item.status = 'RATE_LIMITED';
            item.rateLimitedUntil = Date.now() + 60000;
            item.lastError = '429 Rate Limit Exceeded';
          } else {
            item.status = 'ERROR';
            item.lastError = `HTTP ${resp.status}: ${errText.slice(0, 80)}`;
          }
          this.saveKeys();
          return {
            success: false,
            statusCode: resp.status,
            message: `Lỗi kết nối (${resp.status}): ${errText.slice(0, 100)}`,
            isBlocked: resp.status === 403
          };
        }
      }

      if (item.provider === 'DEEPGRAM') {
        const url = 'https://api.deepgram.com/v1/speak?model=aura-asteria-en&encoding=mp3';
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${trimmed}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: "Deepgram connection verification" })
        });

        if (resp.ok) {
          item.status = 'READY';
          item.lastError = undefined;
          item.rateLimitedUntil = undefined;
          this.saveKeys();
          return { success: true, statusCode: resp.status, message: 'Deepgram Aura/Flux: Kết nối thành công (200 OK)' };
        } else {
          const errText = await resp.text();
          if (resp.status === 429) {
            item.status = 'RATE_LIMITED';
            item.rateLimitedUntil = Date.now() + 60000;
            item.lastError = '429 Rate Limit Exceeded';
          } else {
            item.status = 'ERROR';
            item.lastError = `HTTP ${resp.status}: ${errText.slice(0, 80)}`;
          }
          this.saveKeys();
          return {
            success: false,
            statusCode: resp.status,
            message: `Lỗi Deepgram (${resp.status}): ${errText.slice(0, 100)}`,
            isBlocked: resp.status === 401 || resp.status === 403
          };
        }
      }

      if (item.provider === 'OPENAI_TTS') {
        const url = 'https://api.openai.com/v1/audio/speech';
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${trimmed}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'tts-1',
            voice: 'alloy',
            input: 'OpenAI TTS connection test'
          })
        });

        if (resp.ok) {
          item.status = 'READY';
          item.lastError = undefined;
          item.rateLimitedUntil = undefined;
          this.saveKeys();
          return { success: true, statusCode: resp.status, message: 'OpenAI TTS: Kết nối thành công (200 OK)' };
        } else {
          const errText = await resp.text();
          if (resp.status === 429) {
            item.status = 'RATE_LIMITED';
            item.rateLimitedUntil = Date.now() + 60000;
            item.lastError = '429 Rate Limit Exceeded';
          } else {
            item.status = 'ERROR';
            item.lastError = `HTTP ${resp.status}: ${errText.slice(0, 80)}`;
          }
          this.saveKeys();
          return {
            success: false,
            statusCode: resp.status,
            message: `Lỗi OpenAI (${resp.status}): ${errText.slice(0, 100)}`,
            isBlocked: resp.status === 401 || resp.status === 403
          };
        }
      }

      if (item.provider === 'CUSTOM_TTS') {
        const endpoint = this.customEndpoint || 'http://localhost:8000/v1/audio/speech';
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${trimmed}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'tts-1',
            voice: 'default',
            input: 'Custom TTS test'
          })
        });

        if (resp.ok) {
          item.status = 'READY';
          item.lastError = undefined;
          item.rateLimitedUntil = undefined;
          this.saveKeys();
          return { success: true, statusCode: resp.status, message: 'Custom TTS: Kết nối thành công (200 OK)' };
        } else {
          item.status = 'ERROR';
          item.lastError = `HTTP ${resp.status}`;
          this.saveKeys();
          return { success: false, statusCode: resp.status, message: `Custom TTS status: ${resp.status}` };
        }
      }

      return { success: false, statusCode: 0, message: 'Unsupported provider' };
    } catch (e: any) {
      item.status = 'ERROR';
      item.lastError = e?.message || 'Network error';
      this.saveKeys();
      return { success: false, statusCode: 0, message: `Lỗi kết nối mạng: ${e?.message || 'Không thể kết nối'}` };
    }
  }

  // =========================================================================
  // MODEL CATALOG & VISIBILITY MATRIX (IMPROV & FOCUS)
  // =========================================================================

  public getAllModels(): RegisteredModel[] {
    return [...this.models];
  }

  public getModelById(id: string): RegisteredModel | undefined {
    return this.models.find(m => m.id === id);
  }

  /**
   * Get all models enabled for Improv Module (Default: ALL)
   */
  public getImprovModels(lang?: 'en' | 'vi'): RegisteredModel[] {
    return this.models.filter(m => {
      const matchLang = !lang || m.language === lang;
      return matchLang && m.improvEnabled;
    });
  }

  /**
   * Get all models enabled for Focus Mode
   */
  public getFocusModels(lang?: 'en' | 'vi'): RegisteredModel[] {
    return this.models.filter(m => {
      const matchLang = !lang || m.language === lang;
      return matchLang && m.focusEnabled;
    });
  }

  /**
   * Set model visibility for Improv or Focus
   */
  public setModelVisibility(modelId: string, target: 'improv' | 'focus', enabled: boolean): void {
    const model = this.models.find(m => m.id === modelId);
    if (!model) return;
    if (target === 'improv') {
      model.improvEnabled = enabled;
    } else {
      model.focusEnabled = enabled;
    }
    this.saveModels();
  }

  /**
   * Toggle visibility for all models in a target module
   */
  public setAllVisibility(target: 'improv' | 'focus', enabled: boolean): void {
    for (const m of this.models) {
      if (target === 'improv') {
        m.improvEnabled = enabled;
      } else {
        m.focusEnabled = enabled;
      }
    }
    this.saveModels();
  }

  /**
   * Reset all models back to factory defaults
   */
  public resetModelsToDefault(): void {
    const customModels = this.models.filter(m => m.isCustom);
    this.models = [
      ...DEFAULT_REGISTERED_MODELS.map(m => ({ ...m })),
      ...customModels
    ];
    this.saveModels();
  }

  public addCustomModel(model: Omit<RegisteredModel, 'isCustom'>): RegisteredModel {
    const cleanId = model.id.trim();
    if (!cleanId) throw new Error('Model ID is required');

    const existing = this.models.find(m => m.id === cleanId);
    if (existing) {
      Object.assign(existing, model, { isCustom: true });
      this.saveModels();
      return existing;
    }

    const newModel: RegisteredModel = {
      ...model,
      id: cleanId,
      isCustom: true,
      improvEnabled: model.improvEnabled ?? true,
      focusEnabled: model.focusEnabled ?? true
    };

    this.models.push(newModel);
    this.saveModels();
    return newModel;
  }

  public deleteCustomModel(modelId: string): void {
    this.models = this.models.filter(m => !(m.id === modelId && m.isCustom));
    this.saveModels();
  }

  public importModelsFromJson(jsonString: string): { imported: number; updated: number } {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) throw new Error('Dữ liệu JSON không đúng định dạng danh sách (Array)');

    let imported = 0;
    let updated = 0;

    for (const item of parsed) {
      if (!item.id || !item.name) continue;
      const existing = this.models.find(m => m.id === item.id);
      if (existing) {
        Object.assign(existing, item);
        updated++;
      } else {
        this.models.push({
          id: String(item.id).trim(),
          name: String(item.name).trim(),
          language: item.language || 'en',
          gender: item.gender || 'FEMALE',
          provider: item.provider || 'CUSTOM_TTS',
          description: item.description || '',
          isCustom: item.isCustom ?? true,
          improvEnabled: item.improvEnabled ?? true,
          focusEnabled: item.focusEnabled ?? false
        });
        imported++;
      }
    }

    this.saveModels();
    return { imported, updated };
  }

  public exportModelsToJson(): string {
    return JSON.stringify(this.models, null, 2);
  }

  // =========================================================================
  // MAIN MODELS CONFIGURATION
  // =========================================================================

  public getMainModelEn(): string {
    return this.mainModelEn;
  }

  public getMainModelVi(): string {
    return this.mainModelVi;
  }

  public setMainModelEn(modelId: string): void {
    this.mainModelEn = modelId;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('chunks_main_model_en', modelId);
      } catch {}
    }
    this.notify();
  }

  public setMainModelVi(modelId: string): void {
    this.mainModelVi = modelId;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('chunks_main_model_vi', modelId);
      } catch {}
    }
    this.notify();
  }

  public getCustomEndpoint(): string {
    return this.customEndpoint;
  }

  public setCustomEndpoint(endpoint: string): void {
    this.customEndpoint = endpoint.trim();
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('chunks_custom_tts_endpoint', this.customEndpoint);
      } catch {}
    }
    this.notify();
  }

  // =========================================================================
  // AUDIO AUDITION & PREVIEW HELPER
  // =========================================================================

  /**
   * Preview/Audition a model with natural test sentences
   */
  public async previewModelAudio(
    modelId: string, 
    sampleText?: string, 
    options?: { speed?: number }
  ): Promise<void> {
    const { audioPlayer } = await import('./googleTtsService');
    const model = this.getModelById(modelId);
    const isVi = model?.language === 'vi' || modelId.startsWith('vi-');
    
    const textToSpeak = sampleText?.trim() || (isVi 
      ? "Chào mừng bạn đến với lớp học CHUNKS. Luyện phản xạ tiếng Anh tự nhiên."
      : "Welcome to CHUNKS classroom. Speaking English becomes effortless.");

    await audioPlayer.playChunk(
      textToSpeak,
      null,
      modelId,
      options?.speed || 1.0,
      true
    );
  }

  public maskKey(key: string): string {
    if (!key) return '****';
    const trimmed = key.trim();
    if (trimmed.length <= 12) return '****';
    return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
  }
}

export const modelRegistryService = new ModelRegistryService();
