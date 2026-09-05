import { storage } from './firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { ChunkItem, LessonDoc, ImprovPackage, ImprovHint, ImprovItem } from '../types';
import { updateLessonChunks } from './firestoreService';
import { audioPlayer } from './googleTtsService';
import { saveImprovPackage, getAllImprovPackages } from './improvService';
import { improvTts } from './improvTtsService';

export const CLOUD_STORAGE_BUCKET_NAME = 'chunks-voicecloning-genshai.firebasestorage.app';

export function buildPublicGcsAudioUrl(levelCode: string, lessonId: string, chunkId: string, lang: 'en' | 'vi' = 'en'): string {
  const cleanLevel = (levelCode || 'custom').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const cleanLesson = (lessonId || 'lesson').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const cleanChunk = (chunkId || 'chunk').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `https://storage.googleapis.com/${CLOUD_STORAGE_BUCKET_NAME}/chunks-audio/${cleanLevel}/${cleanLesson}/${cleanChunk}_${lang}.mp3`;
}

export function buildPublicGcsImprovUrl(pkgId: string, id: string, lang: 'en' | 'vi' = 'en', isHint: boolean = false): string {
  const cleanPkg = (pkgId || 'default').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const cleanId = (id || 'audio').replace(/[^a-zA-Z0-9_-]/g, '_');
  const subfolder = isHint ? 'hints' : 'items';
  return `https://storage.googleapis.com/${CLOUD_STORAGE_BUCKET_NAME}/chunks-audio/improv/${cleanPkg}/${subfolder}/${cleanId}_${lang}.mp3`;
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

export async function uploadImprovBase64AudioToGcs(params: {
  base64Audio: string;
  pkgId: string;
  id: string;
  lang: 'en' | 'vi';
  isHint?: boolean;
}): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized');
  }
  const { base64Audio, pkgId, id, lang, isHint } = params;
  const cleanBase64 = base64Audio.replace(/^data:audio\/[^;]+;base64,/, '').trim();
  if (!cleanBase64) {
    throw new Error('Base64 audio payload is empty');
  }

  const cleanPkg = (pkgId || 'default').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const cleanId = (id || 'audio').replace(/[^a-zA-Z0-9_-]/g, '_');
  const subfolder = isHint ? 'hints' : 'items';
  const storagePath = `chunks-audio/improv/${cleanPkg}/${subfolder}/${cleanId}_${lang}.mp3`;

  const storageRef = ref(storage, storagePath);
  await uploadString(storageRef, cleanBase64, 'base64', {
    contentType: 'audio/mpeg',
    customMetadata: {
      packageId: pkgId,
      targetId: id,
      type: isHint ? 'hint' : 'item',
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
    forceOverwrite?: boolean;
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

    // 1. Sync English if chunk lacks permanent audio_url but has cached audio (or forceOverwrite is true)
    const needsEn = Boolean(options?.forceOverwrite) || !chunk.audio_url || !chunk.audio_url.startsWith('http') || chunk.audio_url.includes('placeholder');
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

    // 2. Sync Vietnamese if chunk has vietnamese text and cached audio (or forceOverwrite is true)
    const needsVi = Boolean(options?.forceOverwrite) || !chunk.audio_url_vi || !chunk.audio_url_vi.startsWith('http');
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

export async function syncImprovPackageCachedAudioToCloud(
  pkg: ImprovPackage,
  options?: {
    voiceEn?: string;
    voiceVi?: string;
    onProgress?: (current: number, total: number, status: string) => void;
    forceOverwrite?: boolean;
  }
): Promise<{ uploadedItemsEn: number; uploadedItemsVi: number; uploadedHints: number; total: number }> {
  if (!pkg.sessions || pkg.sessions.length === 0) {
    return { uploadedItemsEn: 0, uploadedItemsVi: 0, uploadedHints: 0, total: 0 };
  }

  const voiceEn = (options?.voiceEn === 'aura-theia-en' || !options?.voiceEn) ? 'aura-asteria-en' : options.voiceEn;
  const voiceVi = options?.voiceVi || 'vi-VN-Neural2-A';

  let uploadedItemsEn = 0;
  let uploadedItemsVi = 0;
  let uploadedHints = 0;
  let hasModifications = false;

  const allItems = pkg.sessions.flatMap(s => s.items);
  const total = allItems.length;

  const updatedSessions = pkg.sessions.map(session => {
    const updatedItems = session.items.map((item) => {
      const updatedItem = {
        ...item,
        hints: item.hints ? item.hints.map(h => ({ ...h })) : []
      };
      return updatedItem;
    });
    return { ...session, items: updatedItems };
  });

  // Now iterate properly with async/await
  let processedItemsCount = 0;
  for (let sIdx = 0; sIdx < updatedSessions.length; sIdx++) {
    const session = updatedSessions[sIdx];
    for (let iIdx = 0; iIdx < session.items.length; iIdx++) {
      const item = session.items[iIdx];
      processedItemsCount++;
      options?.onProgress?.(processedItemsCount, total, `Kiểm tra Session ${session.sessionNumber} - Item #${item.itemNumber}...`);

      // 1. Sync individual hints FIRST so item combined synthesis has ready access
      if (item.hints && item.hints.length > 0) {
        for (let hIdx = 0; hIdx < item.hints.length; hIdx++) {
          const hint = item.hints[hIdx];

          // EN Hint
          if (options?.forceOverwrite || !hint.audioUrl || !hint.audioUrl.startsWith('http')) {
            const hKeysEn = [
              `improv_hint_${hint.id}_${voiceEn}_en`,
              `improv_hint_${hint.id}_aura-asteria-en_en`,
              `improv_hint_${hint.id}_aura-athena-en_en`,
              `improv_hint_${hint.id}_en-US-Journey-F_en`,
              `improv_hint_${hint.id}_en-US-Neural2-A_en`
            ];
            let hCached: string | null = null;
            for (const k of hKeysEn) {
              hCached = await audioPlayer.getCachedAudioAsync(k);
              if (hCached) break;
            }
            if (!hCached && hint.text) {
              hCached = (await audioPlayer.getCachedAudioAsync(hint.text, voiceEn)) || (await audioPlayer.getCachedAudioAsync(hint.text));
            }

            if (hCached) {
              try {
                const gcsHintUrl = await uploadImprovBase64AudioToGcs({
                  base64Audio: hCached,
                  pkgId: pkg.id,
                  id: hint.id,
                  lang: 'en',
                  isHint: true
                });
                hint.audioUrl = gcsHintUrl;
                hasModifications = true;
                uploadedHints++;
              } catch (err) {
                console.warn(`[GCS Improv Sync] Failed hint EN ${hint.id}:`, err);
              }
            }
          }

          // VI Hint
          if (options?.forceOverwrite || !hint.audioUrlVi || !hint.audioUrlVi.startsWith('http')) {
            const hKeysVi = [
              `improv_hint_${hint.id}_${voiceVi}_vi`,
              `improv_hint_${hint.id}_vi-VN-Neural2-A_vi`,
              `improv_hint_${hint.id}_vi-VN-Standard-A_vi`,
              `improv_hint_${hint.id}_vi-VN-WaveNet-A_vi`
            ];
            let hCachedVi: string | null = null;
            for (const k of hKeysVi) {
              hCachedVi = await audioPlayer.getCachedAudioAsync(k);
              if (hCachedVi) break;
            }
            const viText = hint.translation || hint.text;
            if (!hCachedVi && viText) {
              hCachedVi = (await audioPlayer.getCachedAudioAsync(viText, voiceVi)) || (await audioPlayer.getCachedAudioAsync(viText));
            }

            if (hCachedVi) {
              try {
                const gcsHintUrlVi = await uploadImprovBase64AudioToGcs({
                  base64Audio: hCachedVi,
                  pkgId: pkg.id,
                  id: hint.id,
                  lang: 'vi',
                  isHint: true
                });
                hint.audioUrlVi = gcsHintUrlVi;
                hasModifications = true;
                uploadedHints++;
              } catch (err) {
                console.warn(`[GCS Improv Sync] Failed hint VI ${hint.id}:`, err);
              }
            }
          }
        }
      }

      // 2. Sync item EN combined audio if needed
      if (options?.forceOverwrite || !item.audioUrl || !item.audioUrl.startsWith('http') || item.audioUrl === 'cached') {
        const itemEnKeys = [
          `improv_item_${item.id}_${voiceEn}_${voiceVi}_EN_ONLY`,
          `improv_item_${item.id}_aura-asteria-en_vi-VN-Neural2-A_EN_ONLY`,
          `improv_item_${item.id}_aura-athena-en_vi-VN-Neural2-A_EN_ONLY`,
          `improv_item_${item.id}_en-US-Journey-F_vi-VN-Neural2-A_EN_ONLY`
        ];
        let itemBase64: string | null = null;
        for (const k of itemEnKeys) {
          itemBase64 = await audioPlayer.getCachedAudioAsync(k);
          if (itemBase64) break;
        }

        // IF NOT IN CACHE, BUT hints are present: dynamically synthesize item audio on-the-fly!
        if (!itemBase64 && item.hints && item.hints.length > 0) {
          try {
            itemBase64 = await improvTts.synthesizeItemCombinedAudio(item, voiceEn, voiceVi, 'EN_ONLY');
          } catch (synthErr) {
            console.warn(`[GCS Improv Sync] Dynamic synthesis of item EN ${item.id} skipped/failed:`, synthErr);
          }
        }

        if (itemBase64) {
          try {
            const gcsUrl = await uploadImprovBase64AudioToGcs({
              base64Audio: itemBase64,
              pkgId: pkg.id,
              id: item.id,
              lang: 'en',
              isHint: false
            });
            item.audioUrl = gcsUrl;
            hasModifications = true;
            uploadedItemsEn++;
          } catch (err) {
            console.warn(`[GCS Improv Sync] Failed item EN ${item.id}:`, err);
          }
        }
      }

      // 3. Sync item VI combined audio if needed
      if (options?.forceOverwrite || !item.audioUrlVi || !item.audioUrlVi.startsWith('http')) {
        const itemViKeys = [
          `improv_item_${item.id}_${voiceEn}_${voiceVi}_VI_ONLY`,
          `improv_item_${item.id}_aura-asteria-en_vi-VN-Neural2-A_VI_ONLY`,
          `improv_item_${item.id}_aura-athena-en_vi-VN-Neural2-A_VI_ONLY`,
          `improv_item_${item.id}_en-US-Journey-F_vi-VN-Neural2-A_VI_ONLY`
        ];
        let itemBase64Vi: string | null = null;
        for (const k of itemViKeys) {
          itemBase64Vi = await audioPlayer.getCachedAudioAsync(k);
          if (itemBase64Vi) break;
        }

        if (!itemBase64Vi && item.hints && item.hints.length > 0) {
          const hasVi = item.hints.some(h => (h.translation && h.translation.trim()) || /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(h.text));
          if (hasVi) {
            try {
              itemBase64Vi = await improvTts.synthesizeItemCombinedAudio(item, voiceEn, voiceVi, 'VI_ONLY');
            } catch (synthErr) {
              console.warn(`[GCS Improv Sync] Dynamic synthesis of item VI ${item.id} skipped/failed:`, synthErr);
            }
          }
        }

        if (itemBase64Vi) {
          try {
            const gcsUrlVi = await uploadImprovBase64AudioToGcs({
              base64Audio: itemBase64Vi,
              pkgId: pkg.id,
              id: item.id,
              lang: 'vi',
              isHint: false
            });
            item.audioUrlVi = gcsUrlVi;
            hasModifications = true;
            uploadedItemsVi++;
          } catch (err) {
            console.warn(`[GCS Improv Sync] Failed item VI ${item.id}:`, err);
          }
        }
      }
    }
  }

  if (hasModifications) {
    const updatedPkg: ImprovPackage = {
      ...pkg,
      sessions: updatedSessions,
      updatedAt: new Date().toISOString()
    };
    await saveImprovPackage(updatedPkg);
  }

  return { uploadedItemsEn, uploadedItemsVi, uploadedHints, total };
}

export async function syncAllImprovPackagesCachedAudioToCloud(
  options?: {
    voiceEn?: string;
    voiceVi?: string;
    onProgress?: (pkgIndex: number, pkgTotal: number, status: string) => void;
    forceOverwrite?: boolean;
  }
): Promise<{ totalPackages: number; totalItemsSynced: number; totalHintsSynced: number }> {
  const packages = await getAllImprovPackages();
  let totalItemsSynced = 0;
  let totalHintsSynced = 0;

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];
    options?.onProgress?.(i + 1, packages.length, `Đang sync Package "${pkg.title}" (${i + 1}/${packages.length})...`);
    const res = await syncImprovPackageCachedAudioToCloud(pkg, options);
    totalItemsSynced += (res.uploadedItemsEn + res.uploadedItemsVi);
    totalHintsSynced += res.uploadedHints;
  }

  return {
    totalPackages: packages.length,
    totalItemsSynced,
    totalHintsSynced
  };
}
