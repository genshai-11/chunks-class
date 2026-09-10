import { storage } from './firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { ChunkItem, LessonDoc, ImprovPackage, ImprovHint, ImprovItem } from '../types';
import { updateLessonChunks } from './firestoreService';
import { audioPlayer } from './googleTtsService';
import { sanitizeSpeechText } from './deepgramTtsService';
import { curriculumRegistry } from './curriculumRegistry';
import { saveImprovPackage, getAllImprovPackages } from './improvService';
import { improvTts, getHintTextByLanguage } from './improvTtsService';

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

  return `https://storage.googleapis.com/${CLOUD_STORAGE_BUCKET_NAME}/${storagePath}?v=${Date.now()}`;
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

  return `https://storage.googleapis.com/${CLOUD_STORAGE_BUCKET_NAME}/${storagePath}?v=${Date.now()}`;
}

export async function syncLessonCachedAudioToCloud(
  lesson: LessonDoc,
  options?: {
    voiceEn?: string;
    voiceVi?: string;
    target?: 'ENGLISH' | 'VIETNAMESE' | 'BOTH';
    onProgress?: (current: number, total: number, status: string) => void;
    forceOverwrite?: boolean;
    chunkIds?: string[];
  }
): Promise<{
  uploadedEn: number;
  uploadedVi: number;
  skipped: number;
  total: number;
  failedUploads: { chunkId: string; lang: 'en' | 'vi'; error: string }[];
  updatedChunks: ChunkItem[];
}> {
  if (!lesson.chunks || lesson.chunks.length === 0) {
    return { uploadedEn: 0, uploadedVi: 0, skipped: 0, total: 0, failedUploads: [], updatedChunks: [] };
  }

  const target = options?.target || 'BOTH';
  const shouldSyncEn = target === 'ENGLISH' || target === 'BOTH';
  const shouldSyncVi = target === 'VIETNAMESE' || target === 'BOTH';
  const forceOverwrite = Boolean(options?.forceOverwrite);
  const allowedChunkIds = options?.chunkIds && options.chunkIds.length > 0 ? new Set(options.chunkIds) : null;

  const total = lesson.chunks.length;
  let uploadedEn = 0;
  let uploadedVi = 0;
  let skipped = 0;
  let hasModifications = false;
  const failedUploads: { chunkId: string; lang: 'en' | 'vi'; error: string }[] = [];

  const updatedChunks: ChunkItem[] = [...lesson.chunks];

  const enVoiceCandidates = [
    'flux-cliff-en',
    'aura-asteria-en',
    'aura-luna-en',
    'aura-stella-en',
    'aura-athena-en',
    'aura-hera-en',
    'aura-orpheus-en',
    'en-US-Journey-F',
    'en-US-Journey-D',
    'en-US-Studio-O',
    'en-US-Neural2-A'
  ];

  const viVoiceCandidates = [
    'vi-VN-Neural2-A',
    'vi-VN-Neural2-D',
    'vi-VN-Wavenet-A',
    'vi-VN-Standard-A'
  ];

  const allCachedKeys = Array.from(await audioPlayer.getAllCachedKeys());

  for (let i = 0; i < updatedChunks.length; i++) {
    const chunk = { ...updatedChunks[i] };
    if (allowedChunkIds && !allowedChunkIds.has(chunk.chunk_id)) {
      skipped++;
      continue;
    }

    options?.onProgress?.(i + 1, total, `Đang kiểm tra chunk #${chunk.item_number || i + 1}...`);

    let chunkModified = false;

    // 1. Sync English if requested and (chunk lacks permanent audio_url or forceOverwrite is true)
    if (shouldSyncEn && chunk.english) {
      const needsEn = forceOverwrite || !chunk.audio_url || !chunk.audio_url.startsWith('http') || chunk.audio_url.includes('placeholder');
      if (needsEn) {
        let cachedEn = await audioPlayer.getCachedAudioAsync(chunk.english, options?.voiceEn);
        if (!cachedEn) {
          const cleanEn = sanitizeSpeechText(chunk.english);
          cachedEn = await audioPlayer.getCachedAudioAsync(cleanEn, options?.voiceEn);
        }
        if (!cachedEn) {
          const rawNoComma = chunk.english.trim().replace(/,\s*$/, '').trim();
          cachedEn = await audioPlayer.getCachedAudioAsync(rawNoComma, options?.voiceEn);
        }
        if (!cachedEn) {
          const { keys: enCandKeys } = audioPlayer.getLookupCandidateKeys(chunk.english, options?.voiceEn);
          for (const candKey of enCandKeys) {
            cachedEn = await audioPlayer.getCachedAudioByExactKey(candKey);
            if (cachedEn) break;
          }
        }
        if (!cachedEn) {
          for (const cand of enVoiceCandidates) {
            if (cand === options?.voiceEn) continue;
            cachedEn = await audioPlayer.getCachedAudioAsync(chunk.english, cand);
            if (!cachedEn) {
              cachedEn = await audioPlayer.getCachedAudioAsync(sanitizeSpeechText(chunk.english), cand);
            }
            if (cachedEn) break;
          }
        }

        // Resilient lookup across ANY voice in cached keys
        if (!cachedEn) {
          const cleanEn = sanitizeSpeechText(chunk.english).toLowerCase().trim();
          const rawEn = chunk.english.toLowerCase().trim();
          for (const key of allCachedKeys) {
            const lowerKey = key.toLowerCase();
            const textPart = lowerKey.includes('::') ? lowerKey.substring(lowerKey.lastIndexOf('::') + 2).trim() : lowerKey;
            if (
              textPart === cleanEn ||
              textPart === rawEn ||
              lowerKey.endsWith(`::${cleanEn}`) || 
              lowerKey.endsWith(`::${rawEn}`) ||
              lowerKey === cleanEn ||
              lowerKey === rawEn
            ) {
              cachedEn = await audioPlayer.getCachedAudioByExactKey(key);
              if (cachedEn) break;
            }
          }
        }

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
            chunkModified = true;
            hasModifications = true;
            uploadedEn++;
          } catch (err: any) {
            console.warn(`[GCS Sync] Failed to upload EN audio for chunk ${chunk.chunk_id}:`, err);
            failedUploads.push({
              chunkId: chunk.chunk_id,
              lang: 'en',
              error: err?.message || String(err)
            });
          }
        }
      }
    }

    // 2. Sync Vietnamese if requested and (chunk has vietnamese text and lacks permanent audio_url_vi or forceOverwrite is true)
    if (shouldSyncVi && chunk.vietnamese) {
      const needsVi = forceOverwrite || !chunk.audio_url_vi || !chunk.audio_url_vi.startsWith('http');
      if (needsVi) {
        let cachedVi = await audioPlayer.getCachedAudioAsync(chunk.vietnamese, options?.voiceVi || 'vi-VN-Neural2-A');
        if (!cachedVi) {
          const cleanVi = sanitizeSpeechText(chunk.vietnamese);
          cachedVi = await audioPlayer.getCachedAudioAsync(cleanVi, options?.voiceVi || 'vi-VN-Neural2-A');
        }
        if (!cachedVi) {
          const { keys: viCandKeys } = audioPlayer.getLookupCandidateKeys(chunk.vietnamese, options?.voiceVi || 'vi-VN-Neural2-A');
          for (const candKey of viCandKeys) {
            cachedVi = await audioPlayer.getCachedAudioByExactKey(candKey);
            if (cachedVi) break;
          }
        }
        if (!cachedVi) {
          for (const cand of viVoiceCandidates) {
            if (cand === (options?.voiceVi || 'vi-VN-Neural2-A')) continue;
            cachedVi = await audioPlayer.getCachedAudioAsync(chunk.vietnamese, cand) ||
                       await audioPlayer.getCachedAudioAsync(sanitizeSpeechText(chunk.vietnamese), cand);
            if (cachedVi) break;
          }
        }

        // Resilient lookup across ANY voice in cached keys
        if (!cachedVi) {
          const cleanVi = sanitizeSpeechText(chunk.vietnamese).toLowerCase().trim();
          const rawVi = chunk.vietnamese.toLowerCase().trim();
          for (const key of allCachedKeys) {
            const lowerKey = key.toLowerCase();
            const textPart = lowerKey.includes('::') ? lowerKey.substring(lowerKey.lastIndexOf('::') + 2).trim() : lowerKey;
            if (
              textPart === cleanVi ||
              textPart === rawVi ||
              lowerKey.endsWith(`::${cleanVi}`) || 
              lowerKey.endsWith(`::${rawVi}`) ||
              lowerKey === cleanVi ||
              lowerKey === rawVi
            ) {
              cachedVi = await audioPlayer.getCachedAudioByExactKey(key);
              if (cachedVi) break;
            }
          }
        }

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
            chunkModified = true;
            hasModifications = true;
            uploadedVi++;
          } catch (err: any) {
            console.warn(`[GCS Sync] Failed to upload VI audio for chunk ${chunk.chunk_id}:`, err);
            failedUploads.push({
              chunkId: chunk.chunk_id,
              lang: 'vi',
              error: err?.message || String(err)
            });
          }
        }
      }
    }

    if (!chunkModified) {
      skipped++;
    }

    updatedChunks[i] = chunk;
  }

  if (hasModifications) {
    await updateLessonChunks(lesson.id, updatedChunks);
    curriculumRegistry.updateLesson({
      ...lesson,
      chunks: updatedChunks,
      total_chunks: updatedChunks.length
    });
  }

  return { uploadedEn, uploadedVi, skipped, total, failedUploads, updatedChunks };
}

export async function syncImprovPackageCachedAudioToCloud(
  pkg: ImprovPackage,
  options?: {
    voiceEn?: string;
    voiceVi?: string;
    targetLang?: 'en' | 'vi' | 'both';
    onProgress?: (current: number, total: number, status: string) => void;
    forceOverwrite?: boolean;
  }
): Promise<{ uploadedItemsEn: number; uploadedItemsVi: number; uploadedHints: number; total: number }> {
  if (!pkg.sessions || pkg.sessions.length === 0) {
    return { uploadedItemsEn: 0, uploadedItemsVi: 0, uploadedHints: 0, total: 0 };
  }

  const targetLang = options?.targetLang || 'both';
  const shouldSyncEn = targetLang === 'en' || targetLang === 'both';
  const shouldSyncVi = targetLang === 'vi' || targetLang === 'both';
  const forceOverwrite = Boolean(options?.forceOverwrite);

  const voiceEn = (options?.voiceEn === 'aura-theia-en' || !options?.voiceEn) ? 'flux-cliff-en' : options.voiceEn;
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

          // EN Hint (ONLY when shouldSyncEn is true)
          if (shouldSyncEn && (forceOverwrite || !hint.audioUrl || !hint.audioUrl.startsWith('http'))) {
            const hKeyEn = `improv_hint_${hint.id}_${voiceEn}_en`;
            let hCached: string | null = await audioPlayer.getCachedAudioAsync(hKeyEn, voiceEn);
            const enText = getHintTextByLanguage(hint, 'en');
            if (!hCached && enText) {
              hCached = await audioPlayer.getCachedAudioAsync(enText, voiceEn);
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

          // VI Hint (ONLY when shouldSyncVi is true)
          if (shouldSyncVi && (forceOverwrite || !hint.audioUrlVi || !hint.audioUrlVi.startsWith('http'))) {
            const hKeyVi = `improv_hint_${hint.id}_${voiceVi}_vi`;
            let hCachedVi: string | null = await audioPlayer.getCachedAudioAsync(hKeyVi, voiceVi);
            const viText = getHintTextByLanguage(hint, 'vi');
            if (!hCachedVi && viText) {
              hCachedVi = await audioPlayer.getCachedAudioAsync(viText, voiceVi);
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

      // 2. Sync item EN combined audio if needed (ONLY when shouldSyncEn is true)
      if (shouldSyncEn && (forceOverwrite || !item.audioUrl || !item.audioUrl.startsWith('http') || item.audioUrl === 'cached')) {
        const itemEnKey = `improv_item_${item.id}_${voiceEn}_${voiceVi}_EN_ONLY`;
        let itemBase64: string | null = await audioPlayer.getCachedAudioAsync(itemEnKey, voiceEn);

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

      // 3. Sync item VI combined audio if needed (ONLY when shouldSyncVi is true)
      if (shouldSyncVi && (forceOverwrite || !item.audioUrlVi || !item.audioUrlVi.startsWith('http'))) {
        const itemViKey = `improv_item_${item.id}_${voiceEn}_${voiceVi}_VI_ONLY`;
        let itemBase64Vi: string | null = await audioPlayer.getCachedAudioAsync(itemViKey, voiceVi);

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
    targetLang?: 'en' | 'vi' | 'both';
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
