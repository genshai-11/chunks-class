import type { ChunkCategory, ChunkItem } from '../types';

export interface ChunkEditorValues {
  category: ChunkCategory;
  english: string;
  vietnamese: string;
  beatProsody: string;
  ipa: string;
  speaker: string;
  notes: string;
}

export function buildChunkSavePayload(
  initialChunk: ChunkItem | null | undefined,
  values: ChunkEditorValues,
): ChunkItem {
  const english = values.english.trim();
  const vietnamese = values.vietnamese.trim();
  const chunk: ChunkItem = {
    ...(initialChunk || {}),
    chunk_id: initialChunk?.chunk_id || `chunk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    item_number: initialChunk?.item_number || 999,
    category: values.category,
    english,
    vietnamese,
    beat_prosody: values.beatProsody.trim() || null,
    ipa: values.ipa.trim() || null,
    speaker: values.speaker.trim() || null,
    notes: values.notes.trim() || null,
  };

  if (initialChunk && english !== initialChunk.english) {
    chunk.audio_url = null;
    chunk.audio_url_tts = null;
    chunk.audio_url_human = null;
  }

  if (initialChunk && vietnamese !== initialChunk.vietnamese) {
    chunk.audio_url_vi = null;
    chunk.audio_url_tts_vi = null;
    chunk.audio_url_human_vi = null;
  }

  return chunk;
}
