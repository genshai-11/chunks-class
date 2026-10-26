import { describe, expect, it } from 'bun:test';
import { CURRICULUM_CATALOG_LEVEL_A } from '../src/data/levelAData';

describe('Level A corrected content/audio invariant', () => {
  it.each(['chunk_la_d4_0148', 'chunk_la_d6_0148'])(
    '%s uses plane text without stale English audio references',
    (chunkId) => {
      const chunk = CURRICULUM_CATALOG_LEVEL_A
        .flatMap((lesson) => lesson.chunks)
        .find((candidate) => candidate.chunk_id === chunkId);

      expect(chunk).toBeDefined();
      expect(chunk?.english).toBe('I think we should take a plane to go to the church');
      expect(chunk?.audio_url).toBeNull();
      expect(chunk?.audio_url_tts).toBeNull();
      expect(chunk?.audio_url_human).toBeNull();
      expect(chunk?.audio_url_vi).toContain('chunk_la_d4_0148_vi.mp3');
      expect(chunk?.audio_url_tts_vi).toContain('chunk_la_d4_0148_vi.mp3');
      expect(chunk?.audio_url_human_vi).toContain('chunk_la_d4_0148_vi.mp3');
    },
  );
});
