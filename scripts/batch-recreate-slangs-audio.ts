import * as fs from 'fs';
import * as path from 'path';

// Load manifest
const manifestPath = path.resolve(__dirname, 'extracted-level-b-slangs-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

console.log(`Loaded ${manifest.length} items from manifest.`);

const GOOGLE_API_KEYS = [
  "AIzaSyBrH0sAU__R4k1IBrSYIF73fFdASeSpdE4",
  "AIzaSyCfqeoe2A1wslwWONlbEVgW9XK9IrDAk3Q",
  "AIzaSyA6GlWoI1ATkBdU5LROJE5PQYdlmd3X2D4",
  "AIzaSyD6j9s-rG4OXgDLmyeCM0KVOj0ErLD-3gQ"
];
let keyIndex = 0;
function getNextKey(): string {
  const key = GOOGLE_API_KEYS[keyIndex % GOOGLE_API_KEYS.length];
  keyIndex++;
  return key;
}
const TEMP_BASE_DIR = path.resolve(__dirname, '../temp_slangs_audio/level_b');

// Frame header: 0xFF, 0xF3, 0x44, 0xC4
// Side information (9 bytes): 0x00
// Ancillary data (83 bytes): 0x55 (standard zero-audio filler bits)
const silenceFrame = Buffer.alloc(96, 0x55);
silenceFrame[0] = 0xff;
silenceFrame[1] = 0xf3;
silenceFrame[2] = 0x44;
silenceFrame[3] = 0xc4;
for (let i = 4; i < 13; i++) {
  silenceFrame[i] = 0x00;
}

const SILENCE_START = Buffer.concat(Array(10).fill(silenceFrame)); // 10 frames = 240ms = 960 bytes
const SILENCE_END = Buffer.concat(Array(12).fill(silenceFrame));   // 12 frames = 288ms = 1152 bytes

/**
 * Format speech text for optimal prosody:
 * - Ensure comma after introductory transition phrases if missing
 * - Ensure proper terminal punctuation (. ? !)
 */
export function formatSpeechText(text: string): string {
  let s = text.trim();

  // Comma after introductory transition words if followed directly by text without comma
  if (/^Plus\s+(?!,)/i.test(s)) {
    s = s.replace(/^Plus\s+/i, 'Plus, ');
  }
  if (/^Come on\s+(?!,)/i.test(s)) {
    s = s.replace(/^Come on\s+/i, 'Come on, ');
  }

  // Ensure terminal punctuation (. ? !)
  if (!/[.!?]$/.test(s)) {
    s = s + '.';
  }

  return s;
}

async function synthesizeWithRetry(text: string, retries = 5): Promise<Buffer> {
  let attempt = 0;
  while (attempt < retries) {
    const key = getNextKey();
    const ttsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`;
    try {
      const res = await fetch(ttsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: 'en-US', name: 'en-US-Journey-D' },
          audioConfig: { audioEncoding: 'MP3', speakingRate: 1 }
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Google TTS API HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      if (!data.audioContent) {
        throw new Error(`Google TTS API returned no audio content: ${JSON.stringify(data)}`);
      }

      const audioBuf = Buffer.from(data.audioContent, 'base64');
      return audioBuf;
    } catch (err) {
      attempt++;
      if (attempt >= retries) throw err;
      const backoffMs = attempt * 1500;
      console.warn(`[Retry ${attempt}/${retries}] after ${backoffMs}ms due to: ${err}`);
      const { promise, resolve } = Promise.withResolvers<void>();
      setTimeout(resolve, backoffMs);
      await promise;
    }
  }
  throw new Error(`Failed to synthesize after ${retries} attempts.`);
}

async function main() {
  console.log("======================================================================");
  console.log("BATCH SYNTHESIS: 150 LEVEL B - ERE SLANG EXAMPLE SENTENCES");
  console.log("Voice: en-US-Journey-D | Padding: +240ms start / +288ms end");
  console.log("======================================================================");

  let successCount = 0;
  const CONCURRENCY = 6;
  let index = 0;

  async function worker(workerId: number) {
    while (index < manifest.length) {
      const currentIdx = index++;
      const item = manifest[currentIdx];
      const dayFolder = `level_b_day_${item.day_number}`;
      const outDir = path.join(TEMP_BASE_DIR, dayFolder);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      const fileName = `${item.chunk_id}_en.mp3`;
      const outPath = path.join(outDir, fileName);

      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 2112) {
        successCount++;
        console.log(`[Worker ${workerId}] (${successCount}/150) [CACHE HIT] Already exists: ${dayFolder}/${fileName}`);
        continue;
      }

      const formattedText = formatSpeechText(item.english);

      try {
        const rawAudio = await synthesizeWithRetry(formattedText);
        // Prepend 240ms silence (10 frames) and append 288ms silence (12 frames)
        const paddedAudio = Buffer.concat([SILENCE_START, rawAudio, SILENCE_END]);
        fs.writeFileSync(outPath, paddedAudio);

        successCount++;
        console.log(`[Worker ${workerId}] (${successCount}/150) Synthesized: ${dayFolder}/${fileName} [${item.english} -> "${formattedText}"] (${paddedAudio.length} bytes)`);
      } catch (err) {
        console.error(`❌ [Worker ${workerId}] Failed on ${item.chunk_id}:`, err);
        throw err;
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  console.log("======================================================================");
  console.log(`All ${successCount}/150 audio files synthesized successfully!`);
  console.log("======================================================================");
}

main().catch(err => {
  console.error("FATAL ERROR in audio synthesis:", err);
  process.exit(1);
});
