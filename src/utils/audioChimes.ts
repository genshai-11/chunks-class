/**
 * Native Web Audio API Sound Cues
 * 0ms Latency, Zero External Assets, 100% Offline
 * Designed for Topic transitions and Lesson completions in CHUNKS classroom and Improv presentations.
 */

let sharedAudioCtx: AudioContext | null = null;

/**
 * Get or initialize the singleton AudioContext.
 * Automatically handles browser vendor prefixes and resumes suspended audio context.
 */
export const getWebAudioContext = (): AudioContext | null => {
  try {
    if (typeof window === 'undefined') return null;
    if (!sharedAudioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        sharedAudioCtx = new AudioContextClass();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
};

/**
 * Play gentle arpeggio 4-note chime for Topic 1 -> Topic 2 transition:
 * C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz) -> C6 (1046.50Hz)
 * Soft sine waves, smooth attack & exponential decay, duration ~0.55s.
 * Returns Promise<void> that resolves when chime finishes completely.
 */
export const playTopicTransitionChime = (): Promise<void> => {
  return new Promise<void>((resolve) => {
    const ctx = getWebAudioContext();
    if (!ctx) {
      resolve();
      return;
    }

    const notes = [523.25, 659.25, 783.99, 1046.50];
    const now = ctx.currentTime;
    const noteDuration = 0.11;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * noteDuration);

      const startTime = now + idx * noteDuration;
      const noteEnd = startTime + 0.22;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(noteEnd);
    });

    // Notes: last note starts at 3 * 0.11 = 0.33s and ends at 0.33 + 0.22 = 0.55s
    setTimeout(() => {
      resolve();
    }, 550);
  });
};
/**
 * Play graceful 3-note harmonic chime for Part transitions:
 * E5 (659.25Hz) -> G#5 (830.61Hz) -> B5 (987.77Hz) (or soft E major triad)
 * Soft sine waves with gentle attack and smooth exponential decay, lasting ~0.35s.
 * Resolves Promise<void> when chime completes.
 */
export const playPartTransitionChime = (): Promise<void> => {
  return new Promise<void>((resolve) => {
    const ctx = getWebAudioContext();
    if (!ctx) {
      resolve();
      return;
    }

  const notes = [
    { freq: 659.25, start: 0.00, dur: 0.18 }, // E5
    { freq: 830.61, start: 0.07, dur: 0.19 }, // G#5
    { freq: 987.77, start: 0.14, dur: 0.21 }  // B5
  ];
  const now = ctx.currentTime;

  notes.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + start);

    const startTime = now + start;
    const endTime = startTime + dur;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.16, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(endTime);
  });

    setTimeout(resolve, 350);
  });
};


/**
 * Play victory celebration fanfare for package or lesson completion:
 * C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz) -> C6 (1046.50Hz) -> E6 (1318.51Hz)
 * Triumphant harmonics with triangle waves, lasting ~0.85s.
 * Returns Promise<void> that resolves when fanfare completes.
 */
export const playLessonCompletionFanfare = (): Promise<void> => {
  return new Promise<void>((resolve) => {
    const ctx = getWebAudioContext();
    if (!ctx) {
      resolve();
      return;
    }

    const notes = [
      { freq: 523.25, start: 0.00, dur: 0.14 },
      { freq: 659.25, start: 0.12, dur: 0.14 },
      { freq: 783.99, start: 0.24, dur: 0.14 },
      { freq: 1046.50, start: 0.38, dur: 0.20 },
      { freq: 1318.51, start: 0.54, dur: 0.38 }
    ];
    const now = ctx.currentTime;

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + start);

      const startTime = now + start;
      const endTime = startTime + dur;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.22, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(endTime);
    });

    // Final note ends at 0.54 + 0.38 = 0.92s
    setTimeout(() => {
      resolve();
    }, 850);
  });
};

// Aliases for Improv compatibility
export const playSessionTransitionChime = playTopicTransitionChime;
export const playPackageCompletionFanfare = playLessonCompletionFanfare;
