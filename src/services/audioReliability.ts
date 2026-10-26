import type { ChunkItem } from '../types';

export type AudioLanguage = 'en' | 'vi';
export type AudioUrlState = 'ready' | 'missing' | 'unknown';
type AudioTarget = 'ENGLISH' | 'VIETNAMESE' | 'BOTH';

const VIETNAMESE_DIACRITICS = /[\u00C0-\u1EF9\u0102\u0103\u0110\u0111\u0128\u0129\u0168\u0169\u01A0\u01A1\u01AF\u01B0]/;
const CANONICAL_AUDIO_HOST = 'storage.googleapis.com';
const CANONICAL_AUDIO_PATH_PREFIX = '/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/';

export function resolveAudioLanguage(
  text: string,
  voiceName?: string | null,
  registeredLanguage?: string | null,
): AudioLanguage {
  const registered = registeredLanguage?.toLowerCase().trim();
  if (registered?.startsWith('vi')) return 'vi';
  if (registered?.startsWith('en')) return 'en';

  const voice = voiceName?.toLowerCase().trim() || '';
  if (voice.startsWith('vi-') || /(?:^|[-_])vi(?:[-_]|$)/.test(voice)) return 'vi';
  if (voice.startsWith('en-') || /(?:^|[-_])en(?:[-_]|$)/.test(voice)) return 'en';

  return VIETNAMESE_DIACRITICS.test(text || '') ? 'vi' : 'en';
}

export function isCanonicalAudioUrl(url?: string | null): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url.trim());
    const allowedCacheBuster = parsed.search === '' || /^\?v=[\w.-]+$/.test(parsed.search);
    return parsed.protocol === 'https:'
      && parsed.hostname === CANONICAL_AUDIO_HOST
      && parsed.port === ''
      && parsed.username === ''
      && parsed.password === ''
      && allowedCacheBuster
      && parsed.hash === ''
      && parsed.pathname.startsWith(CANONICAL_AUDIO_PATH_PREFIX)
      && parsed.pathname.length > CANONICAL_AUDIO_PATH_PREFIX.length
      && !parsed.pathname.toLowerCase().includes('placeholder');
  } catch {
    return false;
  }
}

export function getAudioUrlCandidates(chunk: ChunkItem, language: AudioLanguage): string[] {
  const human = language === 'vi' ? chunk.audio_url_human_vi : chunk.audio_url_human;
  const tts = language === 'vi' ? chunk.audio_url_tts_vi : chunk.audio_url_tts;
  const legacy = language === 'vi' ? chunk.audio_url_vi : chunk.audio_url;
  const candidates = chunk.audio_source_preferred === 'tts'
    ? [tts, human, legacy]
    : [human, tts, legacy];

  return [...new Set(candidates.filter(isCanonicalAudioUrl))];
}

export function getPreferredAudioUrl(
  chunk: ChunkItem,
  language: AudioLanguage,
  verifiedStatuses?: ReadonlyMap<string, AudioUrlState>,
): string | null {
  const candidates = getAudioUrlCandidates(chunk, language);
  if (!verifiedStatuses) return candidates[0] || null;
  return candidates.find(url => verifiedStatuses.get(url) === 'ready') || null;
}

/**
 * Readiness display keeps a canonical declared URL usable until verification
 * proves a candidate missing. This avoids showing 0% readiness on a fresh
 * browser while still excluding URLs that returned 404/410.
 */
export function hasUsableAudioUrl(
  chunk: ChunkItem,
  language: AudioLanguage,
  statuses: ReadonlyMap<string, AudioUrlState> = new Map(),
): boolean {
  const candidates = getAudioUrlCandidates(chunk, language);
  if (candidates.length === 0) return false;
  if (candidates.some(url => statuses.get(url) === 'ready')) return true;
  // A URL proven missing must not keep readiness green just because another
  // tier is still unverified.
  return !candidates.some(url => statuses.get(url) === 'missing');
}

export function getAudioAvailability(
  chunk: ChunkItem,
  language: AudioLanguage,
  statuses: ReadonlyMap<string, AudioUrlState>,
): AudioUrlState {
  const candidates = getAudioUrlCandidates(chunk, language);
  if (candidates.length === 0) return 'missing';
  if (candidates.some(url => statuses.get(url) === 'ready')) return 'ready';
  if (candidates.every(url => statuses.get(url) === 'missing')) return 'missing';
  return 'unknown';
}

export function getMissingAudioNeeds(
  chunk: ChunkItem,
  target: AudioTarget,
  verifiedStatuses: ReadonlyMap<string, AudioUrlState>,
  enCached: boolean,
  viCached: boolean,
): { en: boolean; vi: boolean } {
  const checkEn = target === 'ENGLISH' || target === 'BOTH';
  const checkVi = target === 'VIETNAMESE' || target === 'BOTH';
  const enAvailability = getAudioAvailability(chunk, 'en', verifiedStatuses);
  const viAvailability = getAudioAvailability(chunk, 'vi', verifiedStatuses);

  return {
    // Only a definitive 404/410 (all candidates) makes audio missing. Transport
    // failures and timeouts stay 'unknown' and never trigger billable synthesis.
    en: checkEn && !enCached && enAvailability === 'missing',
    vi: checkVi && Boolean(chunk.vietnamese) && !viCached && viAvailability === 'missing',
  };
}

export function getMissingOnlyUrlsToVerify(chunks: ChunkItem[], target: AudioTarget): string[] {
  const urls: string[] = [];
  for (const chunk of chunks) {
    if (target === 'ENGLISH' || target === 'BOTH') {
      const preferredEn = getPreferredAudioUrl(chunk, 'en');
      if (preferredEn) urls.push(preferredEn);
    }
    if (target === 'VIETNAMESE' || target === 'BOTH') {
      const preferredVi = getPreferredAudioUrl(chunk, 'vi');
      if (preferredVi) urls.push(preferredVi);
    }
  }
  return [...new Set(urls)];
}

/**
 * Second verification pass: when every preferred URL failed, check sibling
 * tiers before declaring a chunk missing, so a valid fallback recording is not
 * overwritten with billable synthesis.
 */
export function getFallbackUrlsToVerify(
  chunks: ChunkItem[],
  target: AudioTarget,
  statuses: ReadonlyMap<string, AudioUrlState>,
): string[] {
  const urls: string[] = [];
  const languages: AudioLanguage[] = [];
  if (target === 'ENGLISH' || target === 'BOTH') languages.push('en');
  if (target === 'VIETNAMESE' || target === 'BOTH') languages.push('vi');

  for (const chunk of chunks) {
    for (const language of languages) {
      const candidates = getAudioUrlCandidates(chunk, language);
      if (candidates.length === 0) continue;
      if (candidates.some(url => statuses.get(url) === 'ready')) continue;
      if (statuses.get(candidates[0]) !== 'missing') continue;
      for (const url of candidates) {
        if (!statuses.has(url)) urls.push(url);
      }
    }
  }
  return [...new Set(urls)];
}

export function createProviderPlaybackChunk(
  chunk: ChunkItem,
  provider: 'GOOGLE_TTS' | 'DEEPGRAM_AURA',
): ChunkItem {
  if (provider !== 'DEEPGRAM_AURA') return chunk;
  return {
    ...chunk,
    audio_url: null,
    audio_url_human: null,
    audio_url_tts: null,
  };
}

interface CachedUrlStatus {
  state: AudioUrlState;
  expiresAt: number;
}

export interface AudioUrlVerifierOptions {
  concurrency?: number;
  positiveTtlMs?: number;
  negativeTtlMs?: number;
  unknownTtlMs?: number;
  timeoutMs?: number;
  fetcher?: typeof fetch;
  now?: () => number;
}

export class AudioUrlVerifier {
  private readonly cache = new Map<string, CachedUrlStatus>();
  private readonly inFlight = new Map<string, Promise<AudioUrlState>>();
  private readonly concurrency: number;
  private readonly positiveTtlMs: number;
  private readonly negativeTtlMs: number;
  private readonly unknownTtlMs: number;
  private readonly timeoutMs: number;
  private readonly fetcher: typeof fetch;
  private readonly now: () => number;
  private activeRequests = 0;
  private readonly requestQueue: Array<() => void> = [];

  constructor(options: AudioUrlVerifierOptions = {}) {
    this.concurrency = Math.max(1, Math.min(8, Math.floor(options.concurrency ?? 4)));
    this.positiveTtlMs = options.positiveTtlMs ?? 15 * 60_000;
    this.negativeTtlMs = options.negativeTtlMs ?? 30_000;
    this.unknownTtlMs = options.unknownTtlMs ?? 30_000;
    this.timeoutMs = options.timeoutMs ?? 8_000;
    this.fetcher = options.fetcher ?? fetch;
    this.now = options.now ?? Date.now;
  }

  /** Convenience boolean view; only a definitively reachable URL is true. */
  async verify(url: string): Promise<boolean> {
    return (await this.verifyState(url)) === 'ready';
  }

  async verifyState(url: string): Promise<AudioUrlState> {
    if (!isCanonicalAudioUrl(url)) return 'missing';

    const cached = this.cache.get(url);
    if (cached && cached.expiresAt > this.now()) return cached.state;
    if (cached) this.cache.delete(url);

    const pending = this.inFlight.get(url);
    if (pending) return pending;

    const request = this.withPermit(() => this.fetchStatus(url)).finally(() => this.inFlight.delete(url));
    this.inFlight.set(url, request);
    return request;
  }

  getCachedState(url: string): AudioUrlState | undefined {
    const cached = this.cache.get(url);
    if (!cached || cached.expiresAt <= this.now()) {
      if (cached) this.cache.delete(url);
      return undefined;
    }
    return cached.state;
  }

  /** Boolean compatibility view used by readiness/playback callers. */
  getCachedStatus(url: string): boolean | undefined {
    const state = this.getCachedState(url);
    return state === undefined ? undefined : state === 'ready';
  }

  getCachedStates(urls: Iterable<string>): Map<string, AudioUrlState> {
    const states = new Map<string, AudioUrlState>();
    for (const url of urls) {
      const state = this.getCachedState(url);
      if (state !== undefined) states.set(url, state);
    }
    return states;
  }

  async verifyMany(urls: Iterable<string>): Promise<Map<string, AudioUrlState>> {
    const uniqueUrls = [...new Set([...urls].filter(isCanonicalAudioUrl))];
    const statuses = new Map<string, AudioUrlState>();
    let cursor = 0;
    const worker = async () => {
      while (cursor < uniqueUrls.length) {
        const url = uniqueUrls[cursor++];
        statuses.set(url, await this.verifyState(url));
      }
    };
    await Promise.all(Array.from(
      { length: Math.min(this.concurrency, uniqueUrls.length) },
      worker,
    ));
    return statuses;
  }

  private async fetchStatus(url: string): Promise<AudioUrlState> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    let state: AudioUrlState = 'unknown';
    try {
      let response = await this.fetcher(url, { method: 'HEAD', redirect: 'error', signal: controller.signal });
      if (response.status === 405 || response.status === 501) {
        response = await this.fetcher(url, {
          method: 'GET',
          headers: { Range: 'bytes=0-0' },
          redirect: 'error',
          signal: controller.signal,
        });
      }
      if (response.ok) {
        state = 'ready';
      } else if (response.status === 404 || response.status === 410) {
        state = 'missing';
      }
      // 401/403/5xx/opaque responses are unknown, not missing: never re-synthesize
      // (and bill the teacher) because of a transient or permission problem.
    } catch {
      state = 'unknown';
    } finally {
      clearTimeout(timeout);
    }

    const ttl = state === 'ready'
      ? this.positiveTtlMs
      : state === 'missing' ? this.negativeTtlMs : this.unknownTtlMs;
    this.cache.set(url, { state, expiresAt: this.now() + ttl });
    return state;
  }

  private async withPermit<T>(operation: () => Promise<T>): Promise<T> {
    await new Promise<void>(resolve => {
      if (this.activeRequests < this.concurrency) {
        this.activeRequests++;
        resolve();
        return;
      }
      this.requestQueue.push(() => {
        this.activeRequests++;
        resolve();
      });
    });

    try {
      return await operation();
    } finally {
      this.activeRequests--;
      this.requestQueue.shift()?.();
    }
  }
}

export const audioUrlVerifier = new AudioUrlVerifier();
