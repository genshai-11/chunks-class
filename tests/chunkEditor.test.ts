import { describe, expect, it } from 'bun:test';
import type { ChunkItem } from '../src/types';
import { buildChunkSavePayload } from '../src/utils/chunkEditor';

const existingChunk = (): ChunkItem => ({
  chunk_id: 'chunk_test_1',
  item_number: 1,
  category: 'phrase',
  english: 'Take a train',
  vietnamese: 'Đi tàu',
  speaker: null,
  notes: 'Old note',
  audio_url: 'en-primary.mp3',
  audio_url_tts: 'en-tts.mp3',
  audio_url_human: 'en-human.mp3',
  audio_url_vi: 'vi-primary.mp3',
  audio_url_tts_vi: 'vi-tts.mp3',
  audio_url_human_vi: 'vi-human.mp3',
});

describe('buildChunkSavePayload', () => {
  it('writes null explicitly when teacher notes are cleared', () => {
    const result = buildChunkSavePayload(existingChunk(), {
      category: 'phrase',
      english: 'Take a train',
      vietnamese: 'Đi tàu',
      beatProsody: '',
      ipa: '',
      speaker: '',
      notes: '   ',
    });

    expect(result.notes).toBeNull();
    expect(Object.hasOwn(result, 'notes')).toBe(true);
  });

  it('invalidates only English audio references when English content changes', () => {
    const result = buildChunkSavePayload(existingChunk(), {
      category: 'phrase',
      english: 'Take a plane',
      vietnamese: 'Đi tàu',
      beatProsody: '',
      ipa: '',
      speaker: '',
      notes: 'Old note',
    });

    expect(result.audio_url).toBeNull();
    expect(result.audio_url_tts).toBeNull();
    expect(result.audio_url_human).toBeNull();
    expect(result.audio_url_vi).toBe('vi-primary.mp3');
    expect(result.audio_url_tts_vi).toBe('vi-tts.mp3');
    expect(result.audio_url_human_vi).toBe('vi-human.mp3');
  });

  it('invalidates only Vietnamese audio references when Vietnamese content changes', () => {
    const result = buildChunkSavePayload(existingChunk(), {
      category: 'phrase',
      english: 'Take a train',
      vietnamese: 'Đi máy bay',
      beatProsody: '',
      ipa: '',
      speaker: '',
      notes: 'Old note',
    });

    expect(result.audio_url).toBe('en-primary.mp3');
    expect(result.audio_url_tts).toBe('en-tts.mp3');
    expect(result.audio_url_human).toBe('en-human.mp3');
    expect(result.audio_url_vi).toBeNull();
    expect(result.audio_url_tts_vi).toBeNull();
    expect(result.audio_url_human_vi).toBeNull();
  });
});
