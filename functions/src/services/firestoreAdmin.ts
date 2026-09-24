import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { ImprovPackage, ChunkItem } from '../types';

if (!getApps().length) {
  initializeApp();
}

export const adminDb = getFirestore();
const IMPROV_COLLECTION = 'improv_packages';
const LESSONS_COLLECTION = 'lessons';

/**
 * Retrieves all ImprovPackages from Firestore, ordered by updatedAt descending.
 */
export async function getAllPackages(): Promise<ImprovPackage[]> {
  try {
    const snapshot = await adminDb.collection(IMPROV_COLLECTION).get();
    if (snapshot.empty) {
      return [];
    }
    const packages: ImprovPackage[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      } as ImprovPackage;
    });

    return packages.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  } catch (err: any) {
    console.error('[firestoreAdmin] Error in getAllPackages:', err);
    throw err;
  }
}

/**
 * Retrieves a single ImprovPackage by ID.
 */
export async function getPackageById(id: string): Promise<ImprovPackage | null> {
  if (!id) return null;
  try {
    const docRef = adminDb.collection(IMPROV_COLLECTION).doc(id);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return null;
    }
    return {
      id: snapshot.id,
      ...snapshot.data()
    } as ImprovPackage;
  } catch (err: any) {
    console.error(`[firestoreAdmin] Error in getPackageById for ${id}:`, err);
    throw err;
  }
}

/**
 * Persists an ImprovPackage directly to Firestore with merge: true.
 */
export async function savePackage(pkg: ImprovPackage): Promise<void> {
  if (!pkg || !pkg.id) {
    throw new Error('Cannot save ImprovPackage without a valid package ID.');
  }
  try {
    const cleanPkg: ImprovPackage = {
      ...pkg,
      updatedAt: new Date().toISOString()
    };
    await adminDb.collection(IMPROV_COLLECTION).doc(cleanPkg.id).set(cleanPkg, { merge: true });
  } catch (err: any) {
    console.error(`[firestoreAdmin] Error in savePackage for ${pkg.id}:`, err);
    throw err;
  }
}

/**
 * Deletes an ImprovPackage from Firestore by ID.
 */
export async function deletePackage(id: string): Promise<void> {
  if (!id) return;
  try {
    await adminDb.collection(IMPROV_COLLECTION).doc(id).delete();
  } catch (err: any) {
    console.error(`[firestoreAdmin] Error in deletePackage for ${id}:`, err);
    throw err;
  }
}

/**
 * Optional helper to fetch Lesson chunks from Firestore to enrich seed vocabulary.
 */
export async function getLessonById(id: string): Promise<{ id: string; chunks?: ChunkItem[] } | null> {
  if (!id) return null;
  try {
    const snapshot = await adminDb.collection(LESSONS_COLLECTION).doc(id).get();
    if (!snapshot.exists) {
      return null;
    }
    return { id: snapshot.id, ...snapshot.data() } as any;
  } catch (err) {
    console.warn(`[firestoreAdmin] getLessonById notice for ${id}:`, err);
    return null;
  }
}

/**
 * Optional helper to fetch Lessons by level from Firestore.
 */
export async function getLessonsByLevel(level: string): Promise<{ id: string; chunks?: ChunkItem[] }[]> {
  try {
    const snapshot = await adminDb.collection(LESSONS_COLLECTION)
      .where('course_id', '==', level)
      .get();
    if (snapshot.empty) {
      // Fallback query matching level field
      const snapshot2 = await adminDb.collection(LESSONS_COLLECTION)
        .where('level', '==', level)
        .get();
      return snapshot2.docs.map(d => ({ id: d.id, ...d.data() } as any));
    }
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
  } catch (err) {
    console.warn(`[firestoreAdmin] getLessonsByLevel notice for ${level}:`, err);
    return [];
  }
}
