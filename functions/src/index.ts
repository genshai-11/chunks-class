import { onRequest } from 'firebase-functions/v2/https';
import {
  getAllPackages,
  getPackageById,
  savePackage,
  deletePackage
} from './services/firestoreAdmin';
import {
  generatePackage,
  generateSingleSession
} from './services/improvServerEngine';
import {
  exportToExcel,
  parseFromExcel,
  sanitizePackageLanguage
} from './services/excelServer';
import { ImprovGenerateRequest, ImprovPackage, ImprovSessionConfig } from './types';

export const improvApiEndpoint = onRequest(
  {
    cors: true,
    region: 'us-central1',
    timeoutSeconds: 300,
    memory: '512MiB',
    maxInstances: 10
  },
  async (req, res) => {
    // Handle CORS preflight explicitly if needed
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(204).send('');
      return;
    }

    res.set('Access-Control-Allow-Origin', '*');

    // Normalize path to handle direct function URLs and Firebase Hosting rewrites (/api/v1/improv/*)
    let path = req.path || '/';
    path = path.replace(/^\/api\/v1\/improv/, '');
    path = path.replace(/^\/improvApiEndpoint/, '');
    if (!path || path === '') path = '/';
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    const method = req.method.toUpperCase();

    try {
      // 1. GET / or GET /health -> Health check
      if (method === 'GET' && (path === '/' || path === '/health')) {
        res.status(200).json({
          status: 'ok',
          service: 'CHUNKS Improv Serverless API v2',
          region: 'us-central1',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // 2. POST /generate -> Generate ImprovPackage
      if (method === 'POST' && path === '/generate') {
        const generateReq: ImprovGenerateRequest = req.body;
        if (!generateReq || !generateReq.packageTitle) {
          res.status(400).json({
            success: false,
            error: 'Missing required field: packageTitle.'
          });
          return;
        }

        const shouldSave = req.query.save === 'true' || (req.body && req.body.save === true);
        const pkg = await generatePackage(generateReq);

        if (shouldSave) {
          await savePackage(pkg);
        }

        res.status(200).json({
          success: true,
          data: pkg
        });
        return;
      }

      // 3. POST /session -> Generate single session
      if (method === 'POST' && path === '/session') {
        const { sessionConfig, options } = req.body || {};
        if (!sessionConfig) {
          res.status(400).json({
            success: false,
            error: 'Missing required body: sessionConfig.'
          });
          return;
        }

        const session = await generateSingleSession(sessionConfig as ImprovSessionConfig, options || {});
        res.status(200).json({
          success: true,
          data: session
        });
        return;
      }

      // 4. GET /packages -> List all packages
      if (method === 'GET' && path === '/packages') {
        const packages = await getAllPackages();
        res.status(200).json({
          success: true,
          count: packages.length,
          data: packages
        });
        return;
      }

      // 5. GET /packages/:id -> Get package by ID
      if (method === 'GET' && path.startsWith('/packages/')) {
        const packageId = path.replace('/packages/', '').trim();
        if (!packageId) {
          res.status(400).json({ success: false, error: 'Package ID required.' });
          return;
        }

        const pkg = await getPackageById(packageId);
        if (!pkg) {
          res.status(404).json({
            success: false,
            error: `Package with ID "${packageId}" not found.`
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: pkg
        });
        return;
      }

      // 6. POST /save -> Save package
      if (method === 'POST' && path === '/save') {
        const pkg: ImprovPackage = req.body;
        if (!pkg || !pkg.id || !pkg.title) {
          res.status(400).json({
            success: false,
            error: 'Invalid package payload. "id" and "title" are required.'
          });
          return;
        }

        await savePackage(pkg);
        res.status(200).json({
          success: true,
          id: pkg.id
        });
        return;
      }

      // 7. DELETE /packages/:id -> Delete package
      if (method === 'DELETE' && path.startsWith('/packages/')) {
        const packageId = path.replace('/packages/', '').trim();
        if (!packageId) {
          res.status(400).json({ success: false, error: 'Package ID required.' });
          return;
        }

        await deletePackage(packageId);
        res.status(200).json({
          success: true,
          message: `Package ${packageId} deleted successfully.`
        });
        return;
      }

      // 8. POST /export-excel -> Export Excel binary
      if (method === 'POST' && path === '/export-excel') {
        let pkg: ImprovPackage | null = null;

        // Check if query id is provided
        const queryId = req.query.id as string;
        if (queryId) {
          pkg = await getPackageById(queryId);
        } else if (req.body) {
          pkg = req.body.pkg || req.body;
        }

        if (!pkg || !pkg.title || !pkg.sessions) {
          res.status(400).json({
            success: false,
            error: 'Valid package object or query param ?id=<packageId> is required.'
          });
          return;
        }

        const excelBuffer = exportToExcel(pkg);
        const safeTitle = (pkg.title || 'Improv_Package').replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${safeTitle}_Improv.xlsx`;

        res.set({
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': excelBuffer.length.toString()
        });

        res.status(200).send(excelBuffer);
        return;
      }

      // 9. POST /parse-excel -> Parse Excel binary or base64
      if (method === 'POST' && path === '/parse-excel') {
        let buffer: Buffer | null = null;
        let packageTitle: string | undefined = undefined;

        if (Buffer.isBuffer(req.body)) {
          buffer = req.body;
          packageTitle = req.query.title as string;
        } else if (req.body && typeof req.body === 'object') {
          packageTitle = req.body.packageTitle || req.body.title;
          if (req.body.fileBase64) {
            const base64Str = req.body.fileBase64.replace(/^data:.*?;base64,/, '');
            buffer = Buffer.from(base64Str, 'base64');
          } else if (req.body.buffer && Array.isArray(req.body.buffer)) {
            buffer = Buffer.from(req.body.buffer);
          }
        }

        if (!buffer || buffer.length === 0) {
          res.status(400).json({
            success: false,
            error: 'No Excel file data received. Provide raw binary or JSON with fileBase64.'
          });
          return;
        }

        const parsedPkg = parseFromExcel(buffer, packageTitle);
        res.status(200).json({
          success: true,
          data: parsedPkg
        });
        return;
      }

      // 10. POST /sanitize -> Sanitize package language
      if (method === 'POST' && path === '/sanitize') {
        const pkg: ImprovPackage = req.body;
        if (!pkg || !pkg.sessions) {
          res.status(400).json({
            success: false,
            error: 'Valid package object required.'
          });
          return;
        }

        const { package: sanitizedPkg, fixedCount, issues } = sanitizePackageLanguage(pkg);
        res.status(200).json({
          success: true,
          fixedCount,
          data: sanitizedPkg,
          issues
        });
        return;
      }

      // Route Not Found
      res.status(404).json({
        success: false,
        error: `Endpoint not found: ${method} ${path}`
      });
    } catch (err: any) {
      console.error(`[improvApiEndpoint] Error handling ${method} ${path}:`, err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Internal Server Error'
      });
    }
  }
);
