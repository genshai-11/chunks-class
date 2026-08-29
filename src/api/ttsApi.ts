import { deepgramTts, DEEPGRAM_AURA_VOICES } from '../services/deepgramTtsService';
import { audioPlayer, GOOGLE_TTS_VOICES, AudioProvider } from '../services/googleTtsService';

export interface SynthesizeRequest {
  text: string;
  provider?: AudioProvider;
  voiceName?: string;
  speed?: number;
}

export interface SynthesizeResponse {
  success: boolean;
  audioBase64?: string;
  provider: AudioProvider;
  voiceName: string;
  error?: string;
}

/**
 * Unified Modular TTS API Endpoint Handler
 * Can be reused across client, Edge Functions, or Cloud Run APIs
 */
export async function handleTtsSynthesis(req: SynthesizeRequest): Promise<SynthesizeResponse> {
  const { text, provider = 'DEEPGRAM_AURA', voiceName, speed = 1.0 } = req;
  const isVi = voiceName?.startsWith('vi') || /[\u00C0-\u1EF9]/.test(text);

  try {
    if (isVi) {
      const viVoice = voiceName?.startsWith('vi') ? voiceName : 'vi-VN-Neural2-A';
      // Synthesize via Google Neural2
      await audioPlayer.playChunk(text, null, viVoice, speed, true);
      return {
        success: true,
        provider: 'GOOGLE_TTS',
        voiceName: viVoice
      };
    }

    if (provider === 'DEEPGRAM_AURA' || voiceName?.startsWith('aura-')) {
      const dgVoice = voiceName?.startsWith('aura-') ? voiceName : 'aura-asteria-en';
      const base64 = await deepgramTts.synthesizeText(text, dgVoice);
      return {
        success: true,
        audioBase64: base64,
        provider: 'DEEPGRAM_AURA',
        voiceName: dgVoice
      };
    }

    const gVoice = voiceName || 'en-US-Journey-F';
    await audioPlayer.playChunk(text, null, gVoice, speed, true);
    return {
      success: true,
      provider: 'GOOGLE_TTS',
      voiceName: gVoice
    };
  } catch (err: any) {
    return {
      success: false,
      provider,
      voiceName: voiceName || 'default',
      error: err?.message || 'Synthesis failed'
    };
  }
}
