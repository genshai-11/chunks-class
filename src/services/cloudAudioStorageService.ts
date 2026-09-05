import { storage } from './firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { ChunkItem, LessonDoc } from '../types';
import { updateLessonChunks } from './firestoreService';
import { audioPlayer } from './googleTtsService';

export const CLOUD_STORAGE_BUCKET_NAME = 'chunks-voicecloning-genshai.firebasestorage.app';

export function buildPublicGcsAudioUrl(levelCode: string, lessonId: string, chunkId: string, lang: 'en' | 'vi' = 'en'): string {
  const cleanLevel = (levelCode || 'custom').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const cleanLesson = (lessonId || 'lesson').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const cleanChunk = (chunkId || 'chunk').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `https://storage.googleapis.com/${CLOUD_STORAGE_BUCKET_NAME}/chunks-audio/${cleanLevel}/${cleanLesson}/${cleanChunk}_${lang}.mp3`;
}

export async function uploadBase64AudioToGcs(params: {
  base64Audio: string;
  levelCode: string;
  lessonId: string;
  chunkId: string;
  lang: 'en' | 'vi';
}): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized');
  }

  const { base64Audio, levelCode, lessonId, chunkId, lang } = params;
  const cleanBase64 = base64Audio.replace(/^data:audio\/[^;]+;base64,/, '').trim();
  if (!cleanBase64) {
    throw new Error('Base64 audio payload is empty');
  }

  const cleanLevel = (levelCode || 'custom').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const cleanLesson = (lessonId || 'lesson').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const cleanChunk = (chunkId || 'chunk').replace(/[^a-zA-Z0-9_-]/g, '_');
  const storagePath = `chunks-audio/${cleanLevel}/${cleanLesson}/${cleanChunk}_${lang}.mp3`;

  const storageRef = ref(storage, storagePath);
  await uploadString(storageRef, cleanBase64, 'base64', {
    contentType: 'audio/mpeg',
    customMetadata: {
      levelCode,
      lessonId,
      chunkId,
      language: lang,
      uploadedAt: new Date().toISOString()
    }
  });

  return `https://storage.googleapis.com/${CLOUD_STORAGE_BUCKET_NAME}/${storagePath}`;
}

export async function syncLessonCachedAudioToCloud(
  lesson: LessonDoc,
  options?: {
    voiceEn?: string;
    voiceVi?: string;
    onProgress?: (current: number, total: number, status: string) => void;
  }
): Promise<{ uploadedEn: number; uploadedVi: number; skipped: number; total: number }> {
  if (!lesson.chunks || lesson.chunks.length === 0) {
    return { uploadedEn: 0, uploadedVi: 0, skipped: 0, total: 0 };
  }

  const total = lesson.chunks.length;
  let uploadedEn = 0;
  let uploadedVi = 0;
  let skipped = 0;
  let hasModifications = false;

  const updatedChunks: ChunkItem[] = [...lesson.chunks];

  for (let i = 0; i < updatedChunks.length; i++) {
    const chunk = { ...updatedChunks[i] };
    options?.onProgress?.(i + 1, total, `Đang kiểm tra chunk #${chunk.item_number || i + 1}...`);

    // 1. Sync English if chunk lacks permanent audio_url but has cached audio
    const needsEn = !chunk.audio_url || !chunk.audio_url.startsWith('http') || chunk.audio_url.includes('placeholder');
    if (needsEn && chunk.english) {
      const cachedEn = await audioPlayer.getCachedAudioAsync(chunk.english, options?.voiceEn);
      if (cachedEn) {
        try {
          const gcsUrl = await uploadBase64AudioToGcs({
            base64Audio: cachedEn,
            levelCode: lesson.level_code,
            lessonId: lesson.id,
            chunkId: chunk.chunk_id,
            lang: 'en'
          });
          chunk.audio_url = gcsUrl;
          hasModifications = true;
          uploadedEn++;
        } catch (err) {
          console.warn(`[GCS Sync] Failed to upload EN audio for chunk ${chunk.chunk_id}:`, err);
        }
      }
    }

    // 2. Sync Vietnamese if chunk has vietnamese text and cached audio
    const needsVi = !chunk.audio_url_vi || !chunk.audio_url_vi.startsWith('http');
    if (needsVi && chunk.vietnamese) {
      const cachedVi = await audioPlayer.getCachedAudioAsync(chunk.vietnamese, options?.voiceVi || 'vi-VN-Neural2-A');
      if (cachedVi) {
        try {
          const gcsUrlVi = await uploadBase64AudioToGcs({
            base64Audio: cachedVi,
            levelCode: lesson.level_code,
            lessonId: lesson.id,
            chunkId: chunk.chunk_id,
            lang: 'vi'
          });
          chunk.audio_url_vi = gcsUrlVi;
          hasModifications = true;
          uploadedVi++;
        } catch (err) {
          console.warn(`[GCS Sync] Failed to upload VI audio for chunk ${chunk.chunk_id}:`, err);
        }
      }
    }

    if (!hasModifications) {
      skipped++;
    }

    updatedChunks[i] = chunk;
  }

  if (hasModifications) {
    await updateLessonChunks(lesson.id, updatedChunks);
  }

  return { uploadedEn, uploadedVi, skipped, total };
}
