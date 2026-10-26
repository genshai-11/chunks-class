import { describe, expect, it } from 'bun:test';
import type { ChunkItem } from '../src/types';
import {
  AudioUrlVerifier,
  createProviderPlaybackChunk,
  getAudioAvailability,
  getAudioUrlCandidates,
  getFallbackUrlsToVerify,
  getMissingAudioNeeds,
  getMissingOnlyUrlsToVerify,
  getPreferredAudioUrl,
  hasUsableAudioUrl,
  resolveAudioLanguage,
} from '../src/services/audioReliability';

const chunk = (overrides: Partial<ChunkItem> = {}): ChunkItem => ({
  chunk_id: 'chunk-1',
  item_number: 1,
  category: 'sentence',
  english: 'I met Tèo in Cần Thơ.',
  vietnamese: 'Tôi gặp Tèo ở Cần Thơ.',
  speaker: null,
  ...overrides,
});

describe('resolveAudioLanguage', () => {
  it('keeps English text containing Vietnamese names on an explicit English voice', () => {
    expect(resolveAudioLanguage('I met Tèo in Cần Thơ.', 'flux-cliff-en')).toBe('en');
  });

  it('uses a registered Vietnamese language before inspecting text', () => {
    expect(resolveAudioLanguage('Hello Tèo', 'custom-voice', 'vi')).toBe('vi');
  });

  it('uses an explicit Vietnamese voice before inspecting English text', () => {
    expect(resolveAudioLanguage('Hello from Can Tho', 'vi-VN-Neural2-A')).toBe('vi');
  });
});

describe('canonical audio URL policy', () => {
  it('preserves and prefers Vietnamese human audio over TTS and legacy URLs', () => {
    const value = chunk({
      audio_url_human_vi: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/human-vi.mp3',
      audio_url_tts_vi: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/tts-vi.mp3',
      audio_url_vi: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/legacy-vi.mp3',
    });

    expect(getPreferredAudioUrl(value, 'vi')).toBe(value.audio_url_human_vi);
  });

  it('does not accept placeholder or retired mirror URLs', () => {
    expect(getPreferredAudioUrl(chunk({
      audio_url_human_vi: 'https://example.com/placeholder.mp3',
      audio_url_vi: 'https://chunks-mirror-audio-284566312743/x.mp3',
    }), 'vi')).toBeNull();
  });

  it('accepts only the canonical HTTPS chunks-audio bucket prefix', () => {
    expect(getPreferredAudioUrl(chunk({
      audio_url: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/en/a.mp3',
    }), 'en')).toContain('/chunks-audio/');

    for (const rejected of [
      'http://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/a.mp3',
      'https://user:pass@storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/a.mp3',
      'https://storage.googleapis.com:444/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/a.mp3',
      'https://127.0.0.1/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/a.mp3',
      'https://storage.googleapis.com/other-bucket/chunks-audio/a.mp3',
      'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/private/a.mp3',
    ]) {
      expect(getPreferredAudioUrl(chunk({ audio_url: rejected }), 'en')).toBeNull();
    }
  });

  it('accepts the canonical bucket with a version cache-buster', () => {
    const value = chunk({
      audio_url: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/a.mp3?v=1792246682714',
    });

    expect(getPreferredAudioUrl(value, 'en')).toContain('?v=1792246682714');
    expect(getPreferredAudioUrl(chunk({
      audio_url: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/a.mp3?redirect=https://evil.example',
    }), 'en')).toBeNull();
  });

  it('honors a TTS source preference before human and legacy URLs', () => {
    const value = chunk({
      audio_source_preferred: 'tts',
      audio_url_human_vi: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/human-vi.mp3',
      audio_url_tts_vi: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/tts-vi.mp3',
      audio_url_vi: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/legacy-vi.mp3',
    });

    expect(getAudioUrlCandidates(value, 'vi')).toEqual([
      value.audio_url_tts_vi,
      value.audio_url_human_vi,
      value.audio_url_vi,
    ]);
  });

  it('honors a human source preference before TTS and legacy URLs', () => {
    const value = chunk({
      audio_source_preferred: 'human',
      audio_url_human: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/human-en.mp3',
      audio_url_tts: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/tts-en.mp3',
      audio_url: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/legacy-en.mp3',
    });

    expect(getAudioUrlCandidates(value, 'en')).toEqual([
      value.audio_url_human,
      value.audio_url_tts,
      value.audio_url,
    ]);
  });
});

describe('AudioUrlVerifier', () => {
  it('marks a 404 URL as not ready', async () => {
    const verifier = new AudioUrlVerifier({
      fetcher: async () => new Response(null, { status: 404 }),
    });

    expect(await verifier.verify('https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/missing.mp3')).toBe(false);
  });

  it('distinguishes network failures from a definitive 404', async () => {
    const url = 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/flaky.mp3';
    const offline = new AudioUrlVerifier({
      fetcher: async () => { throw new TypeError('Failed to fetch'); },
    });
    const http500 = new AudioUrlVerifier({
      fetcher: async () => new Response(null, { status: 500 }),
    });
    const gone = new AudioUrlVerifier({
      fetcher: async () => new Response(null, { status: 404 }),
    });

    expect(await offline.verifyState(url)).toBe('unknown');
    expect(await http500.verifyState(url)).toBe('unknown');
    expect(await gone.verifyState(url)).toBe('missing');
    expect(await offline.verify(url)).toBe(false);
  });

  it('expires negative cache entries so a repaired URL can become ready', async () => {
    let now = 1_000;
    let calls = 0;
    const verifier = new AudioUrlVerifier({
      negativeTtlMs: 50,
      now: () => now,
      fetcher: async () => new Response(null, { status: ++calls === 1 ? 404 : 200 }),
    });
    const url = 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/repaired.mp3';

    expect(await verifier.verify(url)).toBe(false);
    expect(await verifier.verify(url)).toBe(false);
    now += 51;
    expect(await verifier.verify(url)).toBe(true);
    expect(calls).toBe(2);
  });

  it('bounds concurrent URL verification to the configured worker count', async () => {
    let active = 0;
    let maximum = 0;
    const verifier = new AudioUrlVerifier({
      concurrency: 2,
      fetcher: async () => {
        active++;
        maximum = Math.max(maximum, active);
        await new Promise(resolve => setTimeout(resolve, 5));
        active--;
        return new Response(null, { status: 200 });
      },
    });

    await verifier.verifyMany(Array.from({ length: 6 }, (_, i) => `https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/${i}.mp3`));
    expect(maximum).toBe(2);
  });

  it('disables redirects during URL verification', async () => {
    let redirect: RequestRedirect | undefined;
    const verifier = new AudioUrlVerifier({
      fetcher: async (_url, init) => {
        redirect = init?.redirect;
        return new Response(null, { status: 200 });
      },
    });

    await verifier.verify('https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/a.mp3');
    expect(redirect).toBe('error');
  });

  it('shares the concurrency limit across simultaneous verify and verifyMany calls', async () => {
    let active = 0;
    let maximum = 0;
    const verifier = new AudioUrlVerifier({
      concurrency: 2,
      fetcher: async () => {
        active++;
        maximum = Math.max(maximum, active);
        await new Promise(resolve => setTimeout(resolve, 5));
        active--;
        return new Response(null, { status: 200 });
      },
    });
    const canonical = (name: string) => `https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/${name}.mp3`;

    await Promise.all([
      verifier.verifyMany([canonical('a'), canonical('b'), canonical('c')]),
      verifier.verify(canonical('d')),
      verifier.verifyMany([canonical('e'), canonical('f')]),
    ]);
    expect(maximum).toBe(2);
  });
});

describe('missing-only audio selection', () => {
  it('skips synthesis when verified human Vietnamese audio exists', () => {
    const value = chunk({ audio_url_human_vi: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/human-vi.mp3' });
    const needs = getMissingAudioNeeds(value, 'VIETNAMESE', new Map([[value.audio_url_human_vi!, 'ready']]), false, false);

    expect(needs).toEqual({ en: false, vi: false });
  });

  it('requires synthesis when the only Vietnamese URL returned 404', () => {
    const value = chunk({ audio_url_tts_vi: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/missing.mp3' });
    const needs = getMissingAudioNeeds(value, 'VIETNAMESE', new Map([[value.audio_url_tts_vi!, 'missing']]), false, false);

    expect(needs).toEqual({ en: false, vi: true });
  });

  it('keeps declared canonical human Vietnamese audio declared but not verified', () => {
    const value = chunk({
      audio_url_human_vi: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/human-vi.mp3',
    });

    expect(getMissingAudioNeeds(value, 'VIETNAMESE', new Map(), false, false)).toEqual({ en: false, vi: false });
  });

  it('repairs a Vietnamese human URL only after verifying it is missing', () => {
    const value = chunk({
      audio_url_human_vi: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/human-vi.mp3',
    });

    expect(getMissingAudioNeeds(
      value,
      'VIETNAMESE',
      new Map([[value.audio_url_human_vi!, 'missing']]),
      false,
      false,
    )).toEqual({ en: false, vi: true });
  });

  it('verifies one preferred URL tier and then sibling tiers before repair', () => {
    const value = chunk({
      audio_source_preferred: 'tts',
      audio_url_human_vi: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/human-vi.mp3',
      audio_url_tts_vi: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/tts-vi.mp3',
      audio_url_human: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/human-en.mp3',
      audio_url_tts: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/tts-en.mp3',
    });

    expect(getMissingOnlyUrlsToVerify([value], 'BOTH')).toEqual([value.audio_url_tts, value.audio_url_tts_vi]);
    expect(getFallbackUrlsToVerify(
      [value],
      'BOTH',
      new Map([[value.audio_url_tts!, 'missing'], [value.audio_url_tts_vi!, 'missing']]),
    )).toEqual([value.audio_url_human, value.audio_url_human_vi]);
    // Empty map means "not verified yet", not "missing": never synthesize on unknown.
    expect(getMissingAudioNeeds(value, 'BOTH', new Map(), false, false)).toEqual({ en: false, vi: false });
    expect(getMissingAudioNeeds(
      value,
      'BOTH',
      new Map([
        [value.audio_url_tts!, 'missing'],
        [value.audio_url_human!, 'missing'],
      ]),
      false,
      false,
    )).toEqual({ en: true, vi: false });
  });

  it('does not repair when a verified sibling tier is ready', () => {
    const value = chunk({
      audio_url_tts: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/tts-en.mp3',
      audio_url_human: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/human-en.mp3',
    });
    const states = new Map([
      [value.audio_url_tts!, 'missing' as const],
      [value.audio_url_human!, 'ready' as const],
    ]);

    expect(getAudioAvailability(value, 'en', states)).toBe('ready');
    expect(getMissingAudioNeeds(value, 'ENGLISH', states, false, false)).toEqual({ en: false, vi: false });
    expect(getFallbackUrlsToVerify([value], 'ENGLISH', states)).toEqual([]);
  });

  it('treats transport errors as unknown and does not re-synthesize', () => {
    const value = chunk({
      audio_url_tts: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/flaky-en.mp3',
    });
    const states = new Map([[value.audio_url_tts!, 'unknown' as const]]);

    expect(getAudioAvailability(value, 'en', states)).toBe('unknown');
    expect(getMissingAudioNeeds(value, 'ENGLISH', states, false, false)).toEqual({ en: false, vi: false });
  });

  it('keeps a declared canonical URL usable until verification marks it missing', () => {
    const value = chunk({
      audio_url_tts: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/declared-en.mp3',
    });

    expect(hasUsableAudioUrl(value, 'en')).toBe(true);
    expect(hasUsableAudioUrl(value, 'en', new Map([[value.audio_url_tts!, 'missing']]))).toBe(false);
  });
});

describe('provider-specific audition chunk', () => {
  it('removes every English URL for Deepgram while preserving Vietnamese human audio', () => {
    const value = chunk({
      audio_url: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/en.mp3',
      audio_url_human: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/human-en.mp3',
      audio_url_tts: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/tts-en.mp3',
      audio_url_human_vi: 'https://storage.googleapis.com/chunks-voicecloning-genshai.firebasestorage.app/chunks-audio/human-vi.mp3',
    });

    const playback = createProviderPlaybackChunk(value, 'DEEPGRAM_AURA');
    expect(playback).not.toBe(value);
    expect(playback.audio_url).toBeNull();
    expect(playback.audio_url_human).toBeNull();
    expect(playback.audio_url_tts).toBeNull();
    expect(playback.audio_url_human_vi).toBe(value.audio_url_human_vi);
  });
});
