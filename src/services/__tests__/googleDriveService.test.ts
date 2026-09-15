import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import {
  parseGoogleDriveUrl,
  getGoogleDriveStreamUrl,
  getGoogleDrivePreviewUrl,
  extractTopicAndItemNumber,
  autoMapDriveFilesToTopics,
  autoMapLocalFilesToTopics,
  fetchDriveFolderFiles,
  uploadFileToDrive,
  DriveFileItem,
  TopicResourceData,
} from '../googleDriveService';

describe('googleDriveService', () => {
  // --------------------------------------------------------------------------
  // URL & ID Parsers
  // --------------------------------------------------------------------------
  describe('parseGoogleDriveUrl', () => {
    it('parses standard file /d/ URLs', () => {
      const url1 = 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view?usp=sharing';
      expect(parseGoogleDriveUrl(url1)).toEqual({
        type: 'file',
        id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      });

      const url2 = 'https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/preview';
      expect(parseGoogleDriveUrl(url2)).toEqual({
        type: 'file',
        id: '1a2b3c4d5e6f7g8h9i0j',
      });
    });

    it('parses folder URLs with and without user index prefix', () => {
      const folderUrl1 = 'https://drive.google.com/drive/folders/1a2B3c4D5e6F7g8H9i0JkLmNoPqRsTuVw';
      expect(parseGoogleDriveUrl(folderUrl1)).toEqual({
        type: 'folder',
        id: '1a2B3c4D5e6F7g8H9i0JkLmNoPqRsTuVw',
      });

      const folderUrl2 = 'https://drive.google.com/drive/u/0/folders/1XYZ9876543210ABCDEFGHIJKLMN?usp=drive_link';
      expect(parseGoogleDriveUrl(folderUrl2)).toEqual({
        type: 'folder',
        id: '1XYZ9876543210ABCDEFGHIJKLMN',
      });

      const folderUrl3 = 'https://drive.google.com/drive/u/2/folders/FolderID_1234567890abcdefghij';
      expect(parseGoogleDriveUrl(folderUrl3)).toEqual({
        type: 'folder',
        id: 'FolderID_1234567890abcdefghij',
      });
    });

    it('parses open?id and uc?id query parameter URLs', () => {
      const openUrl = 'https://drive.google.com/open?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
      expect(parseGoogleDriveUrl(openUrl)).toEqual({
        type: 'file',
        id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      });

      const ucUrl = 'https://docs.google.com/uc?export=download&id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
      expect(parseGoogleDriveUrl(ucUrl)).toEqual({
        type: 'file',
        id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      });
    });

    it('parses raw alphanumeric Google Drive IDs', () => {
      const rawId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
      expect(parseGoogleDriveUrl(rawId)).toEqual({
        type: 'unknown',
        id: rawId,
      });

      // With defaultType specified
      expect(parseGoogleDriveUrl(rawId, 'folder')).toEqual({
        type: 'folder',
        id: rawId,
      });
    });

    it('returns unknown with null id for invalid or empty inputs', () => {
      expect(parseGoogleDriveUrl('')).toEqual({ type: 'unknown', id: null });
      expect(parseGoogleDriveUrl('   ')).toEqual({ type: 'unknown', id: null });
      expect(parseGoogleDriveUrl('invalid-short-string')).toEqual({ type: 'unknown', id: null });
      expect(parseGoogleDriveUrl(null as any)).toEqual({ type: 'unknown', id: null });
    });
  });

  // --------------------------------------------------------------------------
  // Stream & Preview URLs
  // --------------------------------------------------------------------------
  describe('getGoogleDriveStreamUrl & getGoogleDrivePreviewUrl', () => {
    it('constructs direct streaming URL', () => {
      const fileId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
      expect(getGoogleDriveStreamUrl(fileId)).toBe(
        'https://docs.google.com/uc?export=download&id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
      );
    });

    it('constructs web preview URL', () => {
      const fileId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
      expect(getGoogleDrivePreviewUrl(fileId)).toBe(
        'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview'
      );
    });
  });

  // --------------------------------------------------------------------------
  // Filename Parsing
  // --------------------------------------------------------------------------
  describe('extractTopicAndItemNumber', () => {
    it('extracts topic and item from Topic X - Y patterns', () => {
      expect(extractTopicAndItemNumber('Topic 1 - 01.mp3')).toEqual({
        topicNumber: 1,
        dayNumber: 1,
        itemNumber: 1,
      });

      expect(extractTopicAndItemNumber('Topic 01 - 02.mp3')).toEqual({
        topicNumber: 1,
        dayNumber: 1,
        itemNumber: 2,
      });

      expect(extractTopicAndItemNumber('Topic 1/01.mp3')).toEqual({
        topicNumber: 1,
        dayNumber: 1,
        itemNumber: 1,
      });

      expect(extractTopicAndItemNumber('Topic02_03.mp3')).toEqual({
        topicNumber: 2,
        dayNumber: 2,
        itemNumber: 3,
      });
    });

    it('extracts topic and item from Day X - Y patterns', () => {
      expect(extractTopicAndItemNumber('Day 1 - 01.mp3')).toEqual({
        topicNumber: 1,
        dayNumber: 1,
        itemNumber: 1,
      });

      expect(extractTopicAndItemNumber('Day 15 - 03.mp3')).toEqual({
        topicNumber: 15,
        dayNumber: 15,
        itemNumber: 3,
      });

      expect(extractTopicAndItemNumber('Day05_02.mp3')).toEqual({
        topicNumber: 5,
        dayNumber: 5,
        itemNumber: 2,
      });
    });

    it('extracts topic and item from TX_Y patterns', () => {
      expect(extractTopicAndItemNumber('T01_01.mp3')).toEqual({
        topicNumber: 1,
        dayNumber: 1,
        itemNumber: 1,
      });

      expect(extractTopicAndItemNumber('T1-01.mp3')).toEqual({
        topicNumber: 1,
        dayNumber: 1,
        itemNumber: 1,
      });

      expect(extractTopicAndItemNumber('T02_03.mp3')).toEqual({
        topicNumber: 2,
        dayNumber: 2,
        itemNumber: 3,
      });
    });

    it('extracts item-only patterns', () => {
      expect(extractTopicAndItemNumber('01.mp3')).toEqual({
        topicNumber: null,
        dayNumber: null,
        itemNumber: 1,
      });

      expect(extractTopicAndItemNumber('02.wav')).toEqual({
        topicNumber: null,
        dayNumber: null,
        itemNumber: 2,
      });

      expect(extractTopicAndItemNumber('item 3.m4a')).toEqual({
        topicNumber: null,
        dayNumber: null,
        itemNumber: 3,
      });
    });

    it('returns nulls for unrelated names', () => {
      expect(extractTopicAndItemNumber('1en_Gr_01_1.mp3')).toEqual({
        topicNumber: 1,
        dayNumber: 1,
        itemNumber: 1,
      });

      expect(extractTopicAndItemNumber('1en_Gr_10_2.mp3')).toEqual({
        topicNumber: 10,
        dayNumber: 10,
        itemNumber: 2,
      });

      expect(extractTopicAndItemNumber('1en_Gr_30_9.mp3')).toEqual({
        topicNumber: 30,
        dayNumber: 30,
        itemNumber: 9,
      });

      expect(extractTopicAndItemNumber('background_music.mp3')).toEqual({
        topicNumber: null,
        dayNumber: null,
        itemNumber: null,
      });
    });
  });

  // --------------------------------------------------------------------------
  // Intelligent Auto-Mapping: autoMapDriveFilesToTopics
  // --------------------------------------------------------------------------
  describe('autoMapDriveFilesToTopics', () => {
    const mockTopics: TopicResourceData[] = [
      {
        topic_number: 1,
        day_number: 1,
        lesson_id: 'level_b_day_1',
        lesson_title: 'Office Orientation',
        mini_lessons: [
          { file: '01.mp3', primary_structure: 'Used to' },
          { file: '02.mp3', primary_structure: 'Be used to' },
        ],
      },
      {
        topic_number: 2,
        day_number: 2,
        lesson_id: 'level_b_day_2',
        lesson_title: 'Team Dynamics',
        mini_lessons: [
          { file: '01.mp3', primary_structure: 'Present Perfect' },
          { file: '02.mp3', primary_structure: 'Past Simple' },
          { file: '03.mp3', primary_structure: 'Passive Voice' },
        ],
      },
      {
        topic_number: 3,
        day_number: 3,
        lesson_id: 'level_b_day_3',
        lesson_title: 'Meeting Etiquette',
        mini_lessons: [
          { file: 'custom_special_intro.mp3', primary_structure: 'Modal Verbs' },
        ],
      },
    ];

    it('maps files with Topic X - Y naming directly to the correct mini-lessons', () => {
      const driveFiles: DriveFileItem[] = [
        {
          id: 'file_id_t1_1',
          name: 'Topic 1 - 01.mp3',
          mimeType: 'audio/mpeg',
          directStreamUrl: getGoogleDriveStreamUrl('file_id_t1_1'),
          previewUrl: getGoogleDrivePreviewUrl('file_id_t1_1'),
        },
        {
          id: 'file_id_t1_2',
          name: 'Topic 1 - 02.mp3',
          mimeType: 'audio/mpeg',
          directStreamUrl: getGoogleDriveStreamUrl('file_id_t1_2'),
          previewUrl: getGoogleDrivePreviewUrl('file_id_t1_2'),
        },
      ];

      const result = autoMapDriveFilesToTopics(driveFiles, mockTopics);

      expect(result.matchedCount).toBe(2);
      expect(result.unmatchedCount).toBe(0);

      const topic1 = result.updatedTopics.find((t) => t.topic_number === 1);
      expect(topic1).toBeDefined();
      expect(topic1!.mini_lessons[0].audio_url).toBe(driveFiles[0].directStreamUrl);
      expect(topic1!.mini_lessons[0].gdrive_file_id).toBe('file_id_t1_1');
      expect(topic1!.mini_lessons[0].file).toBe('Topic 1 - 01.mp3');
      expect(topic1!.mini_lessons[0].audio_source).toBe('google_drive');

      expect(topic1!.mini_lessons[1].audio_url).toBe(driveFiles[1].directStreamUrl);
      expect(topic1!.mini_lessons[1].gdrive_file_id).toBe('file_id_t1_2');
    });

    it('maps Day X - Y and T prefix filenames correctly', () => {
      const driveFiles: DriveFileItem[] = [
        {
          id: 'file_id_day2_3',
          name: 'Day 2 - 03.mp3',
          mimeType: 'audio/mpeg',
          directStreamUrl: getGoogleDriveStreamUrl('file_id_day2_3'),
          previewUrl: getGoogleDrivePreviewUrl('file_id_day2_3'),
        },
        {
          id: 'file_id_t2_1',
          name: 'T02_01.mp3',
          mimeType: 'audio/mpeg',
          directStreamUrl: getGoogleDriveStreamUrl('file_id_t2_1'),
          previewUrl: getGoogleDrivePreviewUrl('file_id_t2_1'),
        },
      ];

      const result = autoMapDriveFilesToTopics(driveFiles, mockTopics);

      expect(result.matchedCount).toBe(2);
      expect(result.unmatchedCount).toBe(0);

      const topic2 = result.updatedTopics.find((t) => t.topic_number === 2);
      expect(topic2!.mini_lessons[2].audio_url).toBe(driveFiles[0].directStreamUrl);
      expect(topic2!.mini_lessons[0].audio_url).toBe(driveFiles[1].directStreamUrl);
    });

    it('matches exact filenames when pattern does not contain topic numbers', () => {
      const driveFiles: DriveFileItem[] = [
        {
          id: 'file_id_custom',
          name: 'custom_special_intro.mp3',
          mimeType: 'audio/mpeg',
          directStreamUrl: getGoogleDriveStreamUrl('file_id_custom'),
          previewUrl: getGoogleDrivePreviewUrl('file_id_custom'),
        },
      ];

      const result = autoMapDriveFilesToTopics(driveFiles, mockTopics);

      expect(result.matchedCount).toBe(1);
      const topic3 = result.updatedTopics.find((t) => t.topic_number === 3);
      expect(topic3!.mini_lessons[0].audio_url).toBe(driveFiles[0].directStreamUrl);
      expect(topic3!.mini_lessons[0].gdrive_file_id).toBe('file_id_custom');
    });

    it('matches 1en_Gr_XX_Y naming and maps directly to matching ml.file or topic/item indices', () => {
      const driveFiles: DriveFileItem[] = [
        {
          id: 'file_id_engr_1',
          name: '1en_Gr_01_1.mp3',
          mimeType: 'audio/mpeg',
          directStreamUrl: getGoogleDriveStreamUrl('file_id_engr_1'),
          previewUrl: getGoogleDrivePreviewUrl('file_id_engr_1'),
        },
      ];

      const result = autoMapDriveFilesToTopics(driveFiles, mockTopics);
      expect(result.matchedCount).toBe(1);
      const topic1 = result.updatedTopics.find((t) => t.topic_number === 1);
      expect(topic1!.mini_lessons[0].audio_url).toBe(driveFiles[0].directStreamUrl);
      expect(topic1!.mini_lessons[0].gdrive_file_id).toBe('file_id_engr_1');
    });

    it('falls back to targetTopicNumber for item-only files (01.mp3, 02.mp3)', () => {
      const driveFiles: DriveFileItem[] = [
        {
          id: 'file_01',
          name: '01.mp3',
          mimeType: 'audio/mpeg',
          directStreamUrl: getGoogleDriveStreamUrl('file_01'),
          previewUrl: getGoogleDrivePreviewUrl('file_01'),
        },
        {
          id: 'file_02',
          name: '02.mp3',
          mimeType: 'audio/mpeg',
          directStreamUrl: getGoogleDriveStreamUrl('file_02'),
          previewUrl: getGoogleDrivePreviewUrl('file_02'),
        },
      ];

      const result = autoMapDriveFilesToTopics(driveFiles, mockTopics, { targetTopicNumber: 2 });

      expect(result.matchedCount).toBe(2);
      const topic2 = result.updatedTopics.find((t) => t.topic_number === 2);
      expect(topic2!.mini_lessons[0].audio_url).toBe(driveFiles[0].directStreamUrl);
      expect(topic2!.mini_lessons[1].audio_url).toBe(driveFiles[1].directStreamUrl);
    });

    it('handles unmatched files gracefully and reports in logs', () => {
      const driveFiles: DriveFileItem[] = [
        {
          id: 'file_random',
          name: 'random_podcast_interview.mp3',
          mimeType: 'audio/mpeg',
          directStreamUrl: getGoogleDriveStreamUrl('file_random'),
          previewUrl: getGoogleDrivePreviewUrl('file_random'),
        },
      ];

      const result = autoMapDriveFilesToTopics(driveFiles, mockTopics);

      expect(result.matchedCount).toBe(0);
      expect(result.unmatchedCount).toBe(1);
      expect(result.logs.some((l) => l.includes('[UNMATCHED]'))).toBe(true);
    });

    it('does not mutate the original topics array (pure function)', () => {
      const driveFiles: DriveFileItem[] = [
        {
          id: 'file_t1_1',
          name: 'Topic 1 - 01.mp3',
          mimeType: 'audio/mpeg',
          directStreamUrl: getGoogleDriveStreamUrl('file_t1_1'),
          previewUrl: getGoogleDrivePreviewUrl('file_t1_1'),
        },
      ];

      autoMapDriveFilesToTopics(driveFiles, mockTopics);

      // Original mockTopics should NOT have audio_url
      expect(mockTopics[0].mini_lessons[0].audio_url).toBeUndefined();
    });
  });

  // --------------------------------------------------------------------------
  // Local File Mapping: autoMapLocalFilesToTopics
  // --------------------------------------------------------------------------
  describe('autoMapLocalFilesToTopics', () => {
    const mockTopics: TopicResourceData[] = [
      {
        topic_number: 1,
        day_number: 1,
        mini_lessons: [
          { file: '01.mp3', primary_structure: 'Used to' },
        ],
      },
    ];

    it('maps local files with local_blob source and blob URL', () => {
      const localFile = new File(['fake audio content'], 'Topic 1 - 01.mp3', { type: 'audio/mpeg' });

      const result = autoMapLocalFilesToTopics([localFile], mockTopics);

      expect(result.matchedCount).toBe(1);
      const ml = result.updatedTopics[0].mini_lessons[0];
      expect(ml.audio_source).toBe('local_blob');
      expect(ml.audio_url).toBeDefined();
      expect(ml.audio_url!.startsWith('blob:')).toBe(true);
      expect(ml.gdrive_file_id).toBeUndefined();
    });
  });

  // --------------------------------------------------------------------------
  // API Operations: fetchDriveFolderFiles & uploadFileToDrive
  // --------------------------------------------------------------------------
  describe('fetchDriveFolderFiles', () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('fetches folder files and filters for audio files', async () => {
      const mockApiResponse = {
        files: [
          { id: 'f1', name: 'Topic 1 - 01.mp3', mimeType: 'audio/mpeg', size: 1024 },
          { id: 'f2', name: 'Notes.pdf', mimeType: 'application/pdf', size: 2048 },
          { id: 'f3', name: 'Topic 1 - 02.wav', mimeType: 'audio/wav', size: 4096 },
        ],
      };

      globalThis.fetch = mock(async (url: string | URL | Request) => {
        const urlStr = url.toString();
        expect(urlStr).toContain('googleapis.com/drive/v3/files');
        expect(urlStr).toContain('my_folder_id');
        expect(urlStr).toContain('key=test_api_key');
        return new Response(JSON.stringify(mockApiResponse), { status: 200 });
      }) as any;

      const result = await fetchDriveFolderFiles('my_folder_id', 'test_api_key');

      expect(result.totalFiles).toBe(3);
      expect(result.audioFiles.length).toBe(2);
      expect(result.audioFiles[0].id).toBe('f1');
      expect(result.audioFiles[0].directStreamUrl).toContain('docs.google.com/uc?export=download&id=f1');
      expect(result.audioFiles[1].id).toBe('f3');
    });

    it('throws when neither apiKey nor accessToken is provided', async () => {
      // Clear localStorage if exists
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }

      await expect(fetchDriveFolderFiles('folder_123')).rejects.toThrow(
        'Google Drive API key or access token is required'
      );
    });
  });

  describe('uploadFileToDrive', () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('uploads file via multipart request and returns DriveFileItem', async () => {
      const mockCreatedFile = {
        id: 'new_drive_file_id',
        name: 'test_audio.mp3',
        mimeType: 'audio/mpeg',
        size: 512,
        webViewLink: 'https://drive.google.com/view/new_drive_file_id',
      };

      globalThis.fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
        expect(url.toString()).toContain('upload/drive/v3/files?uploadType=multipart');
        expect(init?.headers).toBeDefined();
        const headers = init!.headers as Record<string, string>;
        expect(headers['Authorization']).toBe('Bearer test_token');
        expect(headers['Content-Type']).toContain('multipart/related');
        return new Response(JSON.stringify(mockCreatedFile), { status: 200 });
      }) as any;

      const file = new File(['dummy audio'], 'test_audio.mp3', { type: 'audio/mpeg' });
      const result = await uploadFileToDrive(file, 'target_folder_id', 'test_token');

      expect(result.id).toBe('new_drive_file_id');
      expect(result.name).toBe('test_audio.mp3');
      expect(result.directStreamUrl).toBe(
        'https://docs.google.com/uc?export=download&id=new_drive_file_id'
      );
    });

    it('throws when accessToken is missing', async () => {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }

      const file = new File(['dummy'], 'test.mp3', { type: 'audio/mpeg' });
      await expect(uploadFileToDrive(file, 'folder_123')).rejects.toThrow(
        'Access token is required'
      );
    });
  });
});
