import * as fs from 'node:fs';
import * as path from 'node:path';

const PORT = Number(process.env.PORT) || 3333;
const AUDIO_BASE_DIR = process.env.AUDIO_DIR || 'C:\\Users\\gensh\\Downloads\\chunks-grammar\\Grammar Boost\\Grammar Boost';
const ROOT_DIR = path.resolve('.');
const HTML_FILE = path.join(ROOT_DIR, 'review-grammar-boost.html');
const CATALOG_JSON = path.join(ROOT_DIR, 'scripts', 'grammar-boost-catalog.json');
const GROUPED_JSON = path.join(ROOT_DIR, 'scripts', 'grammar-grouped-catalog.json');

console.log('--------------------------------------------------');
console.log('  CHUNKS Grammar Boost Review Server Initializing ');
console.log('--------------------------------------------------');
console.log(`📁 Project Root : ${ROOT_DIR}`);
console.log(`📄 HTML File    : ${HTML_FILE} (${fs.existsSync(HTML_FILE) ? 'Found' : 'Not generated yet'})`);
console.log(`🎧 Audio Dir    : ${AUDIO_BASE_DIR} (${fs.existsSync(AUDIO_BASE_DIR) ? 'Accessible' : 'Not found'})`);

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const rawPathname = url.pathname;
    let pathname: string;
    try {
      pathname = decodeURIComponent(rawPathname);
    } catch {
      pathname = rawPathname;
    }

    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    // 1. Root & HTML Document
    if (pathname === '/' || pathname === '/index.html' || pathname === '/review-grammar-boost.html') {
      if (!fs.existsSync(HTML_FILE)) {
        return new Response(
          '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;">' +
          '<h2>review-grammar-boost.html not found</h2>' +
          '<p>Please run: <code>bun run scripts/build-grammar-review-html.ts</code> to generate the HTML review page.</p>' +
          '</body></html>',
          {
            status: 404,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          }
        );
      }
      const file = Bun.file(HTML_FILE);
      return new Response(file, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 2. Audio Streaming: /audio/Topic 1/1en_Gr_01_1.mp3
    if (pathname.startsWith('/audio/')) {
      const relativeAudioPath = pathname.slice('/audio/'.length);
      // Clean up path and prevent directory traversal
      const normalizedSub = path.normalize(relativeAudioPath).replace(/^(\.\.[\/\\])+/, '');
      const fullAudioPath = path.join(AUDIO_BASE_DIR, normalizedSub);

      const file = Bun.file(fullAudioPath);
      if (await file.exists()) {
        return new Response(file, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=86400',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Case-insensitive / normalized fallback if folder has different casing
      if (normalizedSub.includes('/') || normalizedSub.includes('\\')) {
        const parts = normalizedSub.split(/[/\\]/);
        const folderPart = parts[0];
        const filePart = parts.slice(1).join('/');

        // If folderPart is "Topic 1" or "topic 1" or "Topic1"
        const topicMatch = folderPart.match(/topic\s*(\d+)/i);
        if (topicMatch) {
          const canonicalFolder = `Topic ${topicMatch[1]}`;
          const fallbackPath = path.join(AUDIO_BASE_DIR, canonicalFolder, filePart);
          const fallbackFile = Bun.file(fallbackPath);
          if (await fallbackFile.exists()) {
            return new Response(fallbackFile, {
              headers: {
                'Content-Type': 'audio/mpeg',
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*',
              },
            });
          }
        }
      }

      return new Response(`Audio file not found: ${normalizedSub}`, {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 3. API Health & Status
    if (pathname === '/api/health') {
      const audioDirExists = fs.existsSync(AUDIO_BASE_DIR);
      let audioFileCount = 0;
      if (audioDirExists) {
        try {
          const dirs = fs.readdirSync(AUDIO_BASE_DIR);
          for (const d of dirs) {
            const p = path.join(AUDIO_BASE_DIR, d);
            if (fs.statSync(p).isDirectory()) {
              audioFileCount += fs.readdirSync(p).filter(f => f.endsWith('.mp3')).length;
            }
          }
        } catch {
          // ignore
        }
      }

      return Response.json({
        status: 'ok',
        server: 'CHUNKS Grammar Boost Reviewer',
        port: PORT,
        html_exists: fs.existsSync(HTML_FILE),
        audio_dir: AUDIO_BASE_DIR,
        audio_dir_accessible: audioDirExists,
        audio_files_found: audioFileCount,
        timestamp: new Date().toISOString(),
      }, {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 4. API Catalog
    if (pathname === '/api/catalog') {
      const file = Bun.file(CATALOG_JSON);
      if (await file.exists()) {
        return new Response(file, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
      return new Response('Catalog JSON not found', { status: 404 });
    }

    if (pathname === '/api/grouped-catalog') {
      const file = Bun.file(GROUPED_JSON);
      if (await file.exists()) {
        return new Response(file, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
      return new Response('Grouped catalog JSON not found', { status: 404 });
    }

    return new Response('404 Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  },
});

console.log('');
console.log('╔═════════════════════════════════════════════════════════════════════════════╗');
console.log(`║  🚀 Grammar Boost Reviewer is live at http://localhost:${PORT}                 ║`);
console.log('║                                                                             ║');
console.log('║  🎧 Streaming 253 teacher recordings from:                                  ║');
console.log(`║     ${AUDIO_BASE_DIR.padEnd(72).slice(0, 72)} ║`);
console.log('║                                                                             ║');
console.log('║  ⌨️  Shortcuts:                                                              ║');
console.log('║     • J / K or Up/Down: Navigate mini-lessons                               ║');
console.log('║     • [ / ]           : Previous / Next topic                               ║');
console.log('║     • /               : Quick search focus                                  ║');
console.log('║     • Space           : Toggle audio play/pause                             ║');
console.log('╚═════════════════════════════════════════════════════════════════════════════╝');
console.log('');
