/**
 * Google Drive Audio Integration Service
 * 
 * Provides parsing, folder scanning, multipart upload, and intelligent
 * auto-mapping of Google Drive and local audio files directly to 30 Topics mini-lessons.
 */

import { GrammarMiniLesson } from '../types';

// --------------------------------------------------------------------------
// Domain Interfaces
// --------------------------------------------------------------------------

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  webViewLink?: string;
  webContentLink?: string;
  directStreamUrl: string;
  previewUrl: string;
}

export interface DriveFolderScanResult {
  totalFiles: number;
  audioFiles: DriveFileItem[];
  folderId: string;
  folderName?: string;
}

export interface AutoMapResult<T = any> {
  matchedCount: number;
  unmatchedCount: number;
  updatedTopics: T[];
  logs: string[];
}

export interface AutoMapOptions {
  targetTopicNumber?: number;
  targetDayNumber?: number;
  overwriteExisting?: boolean;
}

export interface FilenameParsedIndices {
  topicNumber: number | null;
  dayNumber: number | null;
  itemNumber: number | null;
}

export interface TopicResourceData {
  topic_number: number;
  day_number: number;
  lesson_id?: string;
  lesson_title?: string;
  source_type?: string;
  total_audio_files?: number;
  status?: 'active' | 'pending_audio';
  thematic_module?: string;
  sentence_structures?: string[];
  verb_forms?: string[];
  tense?: string[];
  notes?: string;
  mini_lessons: GrammarMiniLesson[];
  [key: string]: any;
}

// --------------------------------------------------------------------------
// URL & ID Parsers
// --------------------------------------------------------------------------

/**
 * Parses a Google Drive URL or raw ID into its component type and ID.
 * Supports:
 * - https://drive.google.com/file/d/{FILE_ID}/view...
 * - https://drive.google.com/drive/folders/{FOLDER_ID}...
 * - https://drive.google.com/drive/u/0/folders/{FOLDER_ID}...
 * - https://drive.google.com/open?id={ID}
 * - https://drive.google.com/uc?id={ID}...
 * - https://docs.google.com/uc?export=download&id={ID}
 * - Raw alphanumeric ID (25-50 characters)
 */
export function parseGoogleDriveUrl(
  urlOrId: string,
  defaultType: 'file' | 'folder' | 'unknown' = 'unknown'
): { type: 'file' | 'folder' | 'unknown'; id: string | null } {
  if (!urlOrId || typeof urlOrId !== 'string') {
    return { type: 'unknown', id: null };
  }

  const trimmed = urlOrId.trim();
  if (!trimmed) {
    return { type: 'unknown', id: null };
  }

  // 1. Folder URLs: e.g. /folders/{FOLDER_ID}
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/i);
  if (folderMatch) {
    return { type: 'folder', id: folderMatch[1] };
  }

  // 2. File /d/ URLs: e.g. /file/d/{FILE_ID}
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (fileMatch) {
    return { type: 'file', id: fileMatch[1] };
  }

  // 3. Query param id=... (open?id=, uc?id=, etc.)
  const queryIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (queryIdMatch) {
    const isFolder = /folder/i.test(trimmed);
    return { type: isFolder ? 'folder' : 'file', id: queryIdMatch[1] };
  }

  // 4. Raw alphanumeric ID (standard Google Drive IDs are 25-50 chars base64url)
  if (/^[a-zA-Z0-9_-]{25,50}$/.test(trimmed)) {
    return { type: defaultType, id: trimmed };
  }

  return { type: 'unknown', id: null };
}

/**
 * Returns direct audio streaming / download URL for a Google Drive file.
 */
export function getGoogleDriveStreamUrl(fileId: string): string {
  const cleanId = (fileId || '').trim();
  return `https://docs.google.com/uc?export=download&id=${cleanId}`;
}

/**
 * Returns web preview URL for a Google Drive file.
 */
export function getGoogleDrivePreviewUrl(fileId: string): string {
  const cleanId = (fileId || '').trim();
  return `https://drive.google.com/file/d/${cleanId}/preview`;
}

// --------------------------------------------------------------------------
// Audio Filename & Prosody Parser
// --------------------------------------------------------------------------

/**
 * Extracts Topic/Day and Item numbers from audio filenames:
 * - "Topic 1 - 01.mp3", "Topic 01 - 02.mp3", "Topic 1/01.mp3", "Topic01_02.mp3"
 * - "Day 1 - 01.mp3", "Day 15 - 03.mp3", "Day01_02.mp3"
 * - "T01_01.mp3", "T1-01.mp3", "T02_03.mp3"
 * - "01.mp3", "02.mp3", "item 1.mp3" (item-only)
 */
export function extractTopicAndItemNumber(filename: string): FilenameParsedIndices {
  if (!filename || typeof filename !== 'string') {
    return { topicNumber: null, dayNumber: null, itemNumber: null };
  }

  // Strip extension
  const nameWithoutExt = filename.replace(/\.[a-zA-Z0-9]+$/, '').trim();

  // 1. Topic pattern: Topic\s*0?(\d+)[^0-9]+0?(\d+)
  const topicMatch = nameWithoutExt.match(/Topic\s*0?(\d+)[^0-9]+0?(\d+)/i);
  if (topicMatch) {
    const topicNum = parseInt(topicMatch[1], 10);
    const itemNum = parseInt(topicMatch[2], 10);
    return {
      topicNumber: topicNum,
      dayNumber: topicNum,
      itemNumber: itemNum,
    };
  }

  // 2. Day pattern: Day\s*0?(\d+)[^0-9]+0?(\d+)
  const dayMatch = nameWithoutExt.match(/Day\s*0?(\d+)[^0-9]+0?(\d+)/i);
  if (dayMatch) {
    const dayNum = parseInt(dayMatch[1], 10);
    const itemNum = parseInt(dayMatch[2], 10);
    return {
      topicNumber: dayNum,
      dayNumber: dayNum,
      itemNumber: itemNum,
    };
  }

  // 3. T-prefix: T0?(\d+)[_-]0?(\d+)
  const tMatch = nameWithoutExt.match(/\bT0?(\d+)[_\-\s]+0?(\d+)\b/i);
  if (tMatch) {
    const tNum = parseInt(tMatch[1], 10);
    const itemNum = parseInt(tMatch[2], 10);
    return {
      topicNumber: tNum,
      dayNumber: tNum,
      itemNumber: itemNum,
    };
  }

  // 4. Standalone item number: "01", "02", "item 1", "1"
  const itemOnlyMatch = nameWithoutExt.match(/^(?:item\s*)?0?(\d+)$/i);
  if (itemOnlyMatch) {
    return {
      topicNumber: null,
      dayNumber: null,
      itemNumber: parseInt(itemOnlyMatch[1], 10),
    };
  }

  return {
    topicNumber: null,
    dayNumber: null,
    itemNumber: null,
  };
}

// --------------------------------------------------------------------------
// API Operations
// --------------------------------------------------------------------------

/**
 * Scans a Google Drive folder and returns metadata and audio stream URLs.
 * Uses Google Drive REST API v3 with apiKey (for public folders) or accessToken.
 */
export async function fetchDriveFolderFiles(
  folderId: string,
  apiKey?: string,
  accessToken?: string
): Promise<DriveFolderScanResult> {
  const parsed = parseGoogleDriveUrl(folderId, 'folder');
  const cleanFolderId = parsed.id || folderId.trim();

  if (!cleanFolderId) {
    throw new Error('Invalid Google Drive folder ID or URL.');
  }

  const effectiveApiKey = apiKey || (typeof localStorage !== 'undefined' ? localStorage.getItem('chunks_gdrive_api_key') || undefined : undefined);
  const effectiveAccessToken = accessToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('chunks_gdrive_access_token') || undefined : undefined);

  if (!effectiveApiKey && !effectiveAccessToken) {
    throw new Error('Google Drive API key or access token is required to fetch files.');
  }

  const endpoint = 'https://www.googleapis.com/drive/v3/files';
  const query = `'${cleanFolderId}' in parents and trashed = false`;
  const fields = 'files(id,name,mimeType,size,webContentLink,webViewLink)';

  const url = new URL(endpoint);
  url.searchParams.set('q', query);
  url.searchParams.set('fields', fields);
  url.searchParams.set('pageSize', '1000');

  if (effectiveApiKey && !effectiveAccessToken) {
    url.searchParams.set('key', effectiveApiKey);
  }

  const headers: Record<string, string> = {};
  if (effectiveAccessToken) {
    headers['Authorization'] = `Bearer ${effectiveAccessToken}`;
  }

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Google Drive API error (${response.status}): ${errText || response.statusText}`);
  }

  const data = await response.json();
  const rawFiles: any[] = data.files || [];

  const audioExtensions = /\.(mp3|wav|m4a|ogg|aac|flac|wma)$/i;
  const audioFiles: DriveFileItem[] = rawFiles
    .filter((file: any) => {
      const mime = (file.mimeType || '').toLowerCase();
      const name = file.name || '';
      return mime.startsWith('audio/') || audioExtensions.test(name);
    })
    .map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType || 'audio/mpeg',
      size: file.size ? Number(file.size) : undefined,
      webViewLink: file.webViewLink,
      webContentLink: file.webContentLink,
      directStreamUrl: getGoogleDriveStreamUrl(file.id),
      previewUrl: getGoogleDrivePreviewUrl(file.id),
    }));

  return {
    totalFiles: rawFiles.length,
    audioFiles,
    folderId: cleanFolderId,
  };
}

/**
 * Uploads a local audio file directly to Google Drive via multipart REST API.
 */
export async function uploadFileToDrive(
  file: File,
  folderId?: string,
  accessToken?: string
): Promise<DriveFileItem> {
  const effectiveAccessToken = accessToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('chunks_gdrive_access_token') || undefined : undefined);

  if (!effectiveAccessToken) {
    throw new Error('Access token is required to upload files to Google Drive.');
  }

  let cleanFolderId: string | undefined;
  if (folderId) {
    cleanFolderId = parseGoogleDriveUrl(folderId, 'folder').id || folderId.trim();
  }

  const metadata = {
    name: file.name,
    ...(cleanFolderId ? { parents: [cleanFolderId] } : {}),
  };

  const boundary = '-------chunks_gdrive_boundary_' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata);

  const filePartHeader =
    delimiter +
    `Content-Type: ${file.type || 'audio/mpeg'}\r\n\r\n`;

  const multipartBlob = new Blob([
    metadataPart,
    filePartHeader,
    file,
    closeDelimiter,
  ], { type: `multipart/related; boundary=${boundary}` });

  const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webContentLink,webViewLink';

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${effectiveAccessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBlob,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Failed to upload file to Google Drive (${response.status}): ${errText || response.statusText}`);
  }

  const createdFile = await response.json();
  return {
    id: createdFile.id,
    name: createdFile.name || file.name,
    mimeType: createdFile.mimeType || file.type || 'audio/mpeg',
    size: createdFile.size ? Number(createdFile.size) : file.size,
    webViewLink: createdFile.webViewLink,
    webContentLink: createdFile.webContentLink,
    directStreamUrl: getGoogleDriveStreamUrl(createdFile.id),
    previewUrl: getGoogleDrivePreviewUrl(createdFile.id),
  };
}

// --------------------------------------------------------------------------
// Intelligent Auto-Mapping
// --------------------------------------------------------------------------

/**
 * Automatically maps scanned Google Drive audio files directly into topics mini-lessons:
 * 1. Matches via filename patterns (Topic X - Y, Day X - Y, TX_Y)
 * 2. Fallback: single topic or specified target topic with item-only filenames (01.mp3, 02.mp3)
 * 3. Exact match with ml.file
 * 
 * For each matched mini-lesson, updates:
 * - ml.audio_url = file.directStreamUrl
 * - ml.gdrive_file_id = file.id
 * - ml.file = file.name
 * - ml.audio_source = 'google_drive'
 */
export function autoMapDriveFilesToTopics<T = any>(
  driveFiles: DriveFileItem[],
  topics: T[],
  options?: AutoMapOptions
): AutoMapResult<T> {
  const logs: string[] = [];

  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    return {
      matchedCount: 0,
      unmatchedCount: driveFiles ? driveFiles.length : 0,
      updatedTopics: [],
      logs: ['[ERROR] No topics provided for auto-mapping.'],
    };
  }

  if (!driveFiles || !Array.isArray(driveFiles) || driveFiles.length === 0) {
    return {
      matchedCount: 0,
      unmatchedCount: 0,
      updatedTopics: topics,
      logs: ['[INFO] No audio files provided for auto-mapping.'],
    };
  }

  // Deep clone topics array to prevent unwanted state mutations
  const updatedTopics: any[] = JSON.parse(JSON.stringify(topics));
  const overwriteExisting = options?.overwriteExisting !== false;

  let matchedCount = 0;
  let unmatchedCount = 0;

  for (const file of driveFiles) {
    const parsed = extractTopicAndItemNumber(file.name);
    let matched = false;

    // Resolve target topic number
    let targetTopicNum: number | null = null;
    if (parsed.topicNumber !== null) {
      targetTopicNum = parsed.topicNumber;
    } else if (parsed.dayNumber !== null) {
      targetTopicNum = parsed.dayNumber;
    } else if (options?.targetTopicNumber !== undefined) {
      targetTopicNum = options.targetTopicNumber;
    } else if (options?.targetDayNumber !== undefined) {
      targetTopicNum = options.targetDayNumber;
    } else if (updatedTopics.length === 1) {
      const singleTopic = updatedTopics[0];
      targetTopicNum = singleTopic.topic_number || singleTopic.day_number || 1;
    }

    // Attempt 1: Match by resolved topic number + item index or file pattern
    if (targetTopicNum !== null) {
      const topic = updatedTopics.find(
        (t: any) =>
          t.topic_number === targetTopicNum ||
          t.day_number === targetTopicNum ||
          t.lesson_id === `level_b_day_${targetTopicNum}`
      );

      if (topic && Array.isArray(topic.mini_lessons) && topic.mini_lessons.length > 0) {
        let targetMl: GrammarMiniLesson | null = null;
        let matchedIndex = -1;

        // 1a. If itemNumber is known, match by 1-based index
        if (parsed.itemNumber !== null) {
          const itemIdx = parsed.itemNumber - 1;
          if (itemIdx >= 0 && itemIdx < topic.mini_lessons.length) {
            targetMl = topic.mini_lessons[itemIdx];
            matchedIndex = itemIdx;
          }
        }

        // 1b. If not matched by index, check if ml.file matches
        if (!targetMl) {
          const exactIdx = topic.mini_lessons.findIndex(
            (m: GrammarMiniLesson) => m.file && m.file.trim().toLowerCase() === file.name.trim().toLowerCase()
          );
          if (exactIdx >= 0) {
            targetMl = topic.mini_lessons[exactIdx];
            matchedIndex = exactIdx;
          }
        }

        if (targetMl) {
          if (!overwriteExisting && targetMl.audio_url) {
            logs.push(`[SKIPPED] Skipped "${file.name}" because Topic ${targetTopicNum} Item #${matchedIndex + 1} already has audio.`);
          } else {
            targetMl.audio_url = file.directStreamUrl;
            targetMl.gdrive_file_id = file.id;
            targetMl.file = file.name;
            targetMl.audio_source = 'google_drive';
            matchedCount++;
            matched = true;
            logs.push(
              `[MATCH] Mapped "${file.name}" to Topic ${targetTopicNum} - Item #${matchedIndex + 1} (${targetMl.primary_structure || targetMl.topic || 'Item ' + (matchedIndex + 1)})`
            );
          }
          if (matched) continue;
        }
      }
    }

    // Attempt 2: Exact match on ml.file across all topics
    if (!matched) {
      const lowerName = file.name.trim().toLowerCase();
      let foundInAnyTopic = false;

      for (const t of updatedTopics) {
        if (!Array.isArray(t.mini_lessons)) continue;
        const mlIndex = t.mini_lessons.findIndex(
          (m: GrammarMiniLesson) => m.file && m.file.trim().toLowerCase() === lowerName
        );

        if (mlIndex >= 0) {
          const targetMl = t.mini_lessons[mlIndex];
          if (!overwriteExisting && targetMl.audio_url) {
            logs.push(`[SKIPPED] Skipped "${file.name}" because Topic ${t.topic_number || t.day_number} already has audio.`);
          } else {
            targetMl.audio_url = file.directStreamUrl;
            targetMl.gdrive_file_id = file.id;
            targetMl.file = file.name;
            targetMl.audio_source = 'google_drive';
            matchedCount++;
            foundInAnyTopic = true;
            logs.push(
              `[EXACT MATCH] Mapped "${file.name}" to Topic ${t.topic_number || t.day_number} - Item #${mlIndex + 1} (${targetMl.primary_structure || targetMl.topic || 'Item ' + (mlIndex + 1)})`
            );
          }
          break;
        }
      }

      if (foundInAnyTopic) continue;
    }

    // If still unmatched
    unmatchedCount++;
    logs.push(`[UNMATCHED] No matching topic or mini-lesson found for "${file.name}"`);
  }

  logs.push(`[SUMMARY] Auto-mapping complete: ${matchedCount} matched, ${unmatchedCount} unmatched.`);

  return {
    matchedCount,
    unmatchedCount,
    updatedTopics: updatedTopics as T[],
    logs,
  };
}

/**
 * Helper to safely create browser Object URLs across both browser and test environments.
 */
function createSafeObjectUrl(file: File): string {
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    try {
      return URL.createObjectURL(file);
    } catch {
      // Fallback for mock environments
    }
  }
  return `blob:chunks-local/${encodeURIComponent(file.name)}`;
}

/**
 * Automatically maps local audio files (from FileList or File[]) directly into topics mini-lessons.
 * Generates browser Blob URLs for instant zero-latency classroom playback without waiting for uploads.
 */
export function autoMapLocalFilesToTopics<T = any>(
  files: FileList | File[],
  topics: T[],
  options?: AutoMapOptions
): AutoMapResult<T> {
  const fileArray = Array.from(files);

  const mockDriveItems: DriveFileItem[] = fileArray.map((file, idx) => {
    const blobUrl = createSafeObjectUrl(file);
    return {
      id: `local_audio_${Date.now()}_${idx}_${file.name}`,
      name: file.name,
      mimeType: file.type || 'audio/mpeg',
      size: file.size,
      directStreamUrl: blobUrl,
      previewUrl: blobUrl,
    };
  });

  const res = autoMapDriveFilesToTopics(mockDriveItems, topics, options);

  // In the updatedTopics, designate source as 'local_blob' and clear gdrive_file_id
  for (const topic of res.updatedTopics as any[]) {
    if (!Array.isArray(topic.mini_lessons)) continue;
    for (const ml of topic.mini_lessons) {
      if (ml.audio_url && ml.audio_url.startsWith('blob:')) {
        ml.audio_source = 'local_blob';
        delete ml.gdrive_file_id;
      }
    }
  }

  return res;
}
