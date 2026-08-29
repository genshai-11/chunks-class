export interface AudioPlayOptions {
  text: string;
  lang?: 'en-US' | 'vi-VN';
  rate?: number; // 0.75 to 1.5
  pitch?: number;
  voiceName?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

class SpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isAvailable: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.isAvailable = true;
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public speak(options: AudioPlayOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth || !this.isAvailable) {
        options.onStart?.();
        setTimeout(() => {
          options.onEnd?.();
          resolve();
        }, 1500);
        return;
      }

      this.stop();

      const utterance = new SpeechSynthesisUtterance(options.text);
      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.lang = options.lang || 'en-US';

      // Pick matching voice if available
      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        if (options.voiceName) {
          const match = voices.find(v => v.name.includes(options.voiceName!));
          if (match) utterance.voice = match;
        } else {
          // Find standard language match
          const langMatch = voices.find(v => v.lang.startsWith(utterance.lang) || v.lang.replace('_', '-').startsWith(utterance.lang));
          if (langMatch) utterance.voice = langMatch;
        }
      }

      utterance.onstart = () => {
        options.onStart?.();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        options.onEnd?.();
        resolve();
      };

      utterance.onerror = (e) => {
        this.currentUtterance = null;
        options.onError?.(e);
        options.onEnd?.();
        resolve(); // resolve gracefully so automated sequence doesn't freeze
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  public async playSequence(
    enText: string,
    viText: string,
    mode: 'EN_ONLY' | 'VI_ONLY' | 'EN_THEN_VI' | 'VI_THEN_EN',
    speed: number = 1.0,
    repeatCount: number = 1,
    onStepChange?: (step: 'en' | 'vi' | 'idle', loopIndex: number) => void
  ) {
    this.stop();

    for (let loop = 1; loop <= repeatCount; loop++) {
      if (mode === 'EN_ONLY') {
        onStepChange?.('en', loop);
        await this.speak({ text: enText, lang: 'en-US', rate: speed });
      } else if (mode === 'VI_ONLY') {
        onStepChange?.('vi', loop);
        await this.speak({ text: viText, lang: 'vi-VN', rate: speed });
      } else if (mode === 'EN_THEN_VI') {
        onStepChange?.('en', loop);
        await this.speak({ text: enText, lang: 'en-US', rate: speed });
        await new Promise(r => setTimeout(r, 400));
        onStepChange?.('vi', loop);
        await this.speak({ text: viText, lang: 'vi-VN', rate: speed });
      } else if (mode === 'VI_THEN_EN') {
        onStepChange?.('vi', loop);
        await this.speak({ text: viText, lang: 'vi-VN', rate: speed });
        await new Promise(r => setTimeout(r, 400));
        onStepChange?.('en', loop);
        await this.speak({ text: enText, lang: 'en-US', rate: speed });
      }

      if (loop < repeatCount) {
        await new Promise(r => setTimeout(r, 600));
      }
    }

    onStepChange?.('idle', 0);
  }
}

export const speechService = new SpeechEngine();
