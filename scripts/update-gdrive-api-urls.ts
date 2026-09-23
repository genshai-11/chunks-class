import * as fs from 'node:fs';
import * as path from 'node:path';

const API_KEY = 'AIzaSyBQlHgIjzrnC9ZaQL8rSzb3OQEU7fhz5D4';

export function updateGdriveApiUrls(): {
  topicsCount: number;
  totalMiniLessons: number;
  updatedAudioCount: number;
} {
  const srcPath = path.resolve('src/data/grammarBoostCatalog.json');
  const scriptsPath = path.resolve('scripts/grammar-boost-catalog.json');

  if (!fs.existsSync(srcPath)) {
    throw new Error(`Catalog not found at ${srcPath}`);
  }

  const raw = fs.readFileSync(srcPath, 'utf8');
  const catalog = JSON.parse(raw);
  const topics: any[] = catalog.topics || [];

  let totalMiniLessons = 0;
  let updatedAudioCount = 0;

  for (const topic of topics) {
    const miniLessons: any[] = topic.mini_lessons || [];
    for (const ml of miniLessons) {
      totalMiniLessons++;

      // If missing gdrive_file_id but has audio_url with file ID, extract it
      if (!ml.gdrive_file_id && ml.audio_url) {
        const match = ml.audio_url.match(/(?:docs\.google\.com\/uc\?export=download&id=|drive\.google\.com\/uc\?id=|drive\.google\.com\/file\/d\/|drive\/v3\/files\/)([a-zA-Z0-9_-]+)/i);
        if (match && match[1]) {
          ml.gdrive_file_id = match[1];
        }
      }

      if (ml.gdrive_file_id) {
        ml.audio_url = `https://www.googleapis.com/drive/v3/files/${ml.gdrive_file_id}?alt=media&key=${API_KEY}`;
        ml.audio_source = 'google_drive';
        updatedAudioCount++;
      }
    }
  }

  if (catalog.metadata) {
    catalog.metadata.last_drive_api_sync = new Date().toISOString();
    catalog.metadata.audio_source = 'google_drive';
    catalog.metadata.cloud_audio_ready_count = updatedAudioCount;
  }

  const outputJson = JSON.stringify(catalog, null, 2);

  fs.writeFileSync(srcPath, outputJson, 'utf8');
  console.log(`[OK] Updated ${srcPath}`);

  fs.writeFileSync(scriptsPath, outputJson, 'utf8');
  console.log(`[OK] Updated ${scriptsPath}`);

  console.log(`\nResults:`);
  console.log(`- Total Topics: ${topics.length}`);
  console.log(`- Total Mini-Lessons: ${totalMiniLessons}`);
  console.log(`- Updated Audio URLs to Google Drive API v3: ${updatedAudioCount}/${totalMiniLessons}`);

  return {
    topicsCount: topics.length,
    totalMiniLessons,
    updatedAudioCount,
  };
}

if (import.meta.main) {
  try {
    updateGdriveApiUrls();
  } catch (e) {
    console.error('Failed to update Google Drive API URLs:', e);
    process.exit(1);
  }
}
