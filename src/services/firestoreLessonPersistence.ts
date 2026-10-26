import type { LessonDoc } from '../types';

type LessonWriter = (lesson: LessonDoc) => Promise<unknown>;
type PersistedLessonPublisher = (lesson: LessonDoc) => void;

function removeUndefinedRecursively(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map(removeUndefinedRecursively);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, nestedValue]) => nestedValue !== undefined)
      .map(([key, nestedValue]) => [key, removeUndefinedRecursively(nestedValue)]),
  );
}

/** Creates a Firestore-safe lesson payload without changing null or array values. */
export function sanitizeLessonPayload(lesson: LessonDoc): LessonDoc {
  return removeUndefinedRecursively(lesson) as LessonDoc;
}

/**
 * Persists before publishing local state, so failed writes cannot leave the
 * curriculum registry or read cache ahead of Firestore.
 */
export async function persistLessonPayload(
  lesson: LessonDoc,
  write: LessonWriter,
  publishPersistedLesson: PersistedLessonPublisher,
): Promise<LessonDoc> {
  const sanitizedLesson = sanitizeLessonPayload(lesson);
  await write(sanitizedLesson);
  publishPersistedLesson(sanitizedLesson);
  return sanitizedLesson;
}
