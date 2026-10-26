import { describe, expect, it, mock } from 'bun:test';
import type { LessonDoc } from '../src/types';
import {
  persistLessonPayload,
  sanitizeLessonPayload,
} from '../src/services/firestoreLessonPersistence';

const lessonFixture = (): LessonDoc => ({
  id: 'level_a_day_test',
  course_id: 'course_level_a',
  level_code: 'LEVEL_A',
  day_number: 1,
  lesson_title: 'Boundary test lesson',
  lesson_type: 'standard',
  total_chunks: 1,
  categories: ['phrase'],
  chunks: [
    {
      chunk_id: 'chunk_test_1',
      item_number: 1,
      category: 'phrase',
      english: 'Keep this',
      vietnamese: 'Giữ nội dung này',
      speaker: null,
      notes: undefined,
      nested: {
        keepNull: null,
        removeUndefined: undefined,
        values: ['first', undefined, null, { keep: true, remove: undefined }],
      },
    },
  ],
  optionalMetadata: undefined,
});

describe('Firestore lesson persistence boundary', () => {
  it('recursively removes undefined while preserving null values and arrays', () => {
    const sanitized = sanitizeLessonPayload(lessonFixture());

    expect(sanitized).toEqual({
      id: 'level_a_day_test',
      course_id: 'course_level_a',
      level_code: 'LEVEL_A',
      day_number: 1,
      lesson_title: 'Boundary test lesson',
      lesson_type: 'standard',
      total_chunks: 1,
      categories: ['phrase'],
      chunks: [
        {
          chunk_id: 'chunk_test_1',
          item_number: 1,
          category: 'phrase',
          english: 'Keep this',
          vietnamese: 'Giữ nội dung này',
          speaker: null,
          nested: {
            keepNull: null,
            values: ['first', null, { keep: true }],
          },
        },
      ],
    });
    expect(Array.isArray(sanitized.chunks)).toBe(true);
  });

  it('propagates persistence errors without publishing an optimistic lesson update', async () => {
    const persistenceError = new Error('Firestore unavailable');
    const write = mock(async () => {
      throw persistenceError;
    });
    const publishPersistedLesson = mock(() => {});

    await expect(
      persistLessonPayload(lessonFixture(), write, publishPersistedLesson),
    ).rejects.toBe(persistenceError);

    expect(publishPersistedLesson).not.toHaveBeenCalled();
  });
});
