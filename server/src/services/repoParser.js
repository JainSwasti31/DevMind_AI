import unzipper from 'unzipper';
import path from 'path';
import multer from 'multer';

const extensionLanguageMap = {
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.json': 'JSON',
  '.py': 'Python',
  '.java': 'Java',
  '.cs': 'C#',
  '.go': 'Go',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.html': 'HTML',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.md': 'Markdown',
};

const supportedExtensions = new Set(Object.keys(extensionLanguageMap).concat(['.yaml', '.yml']));

const getLanguage = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (extensionLanguageMap[ext]) return extensionLanguageMap[ext];
  if (ext === '.yaml' || ext === '.yml') return 'YAML';
  return 'Text';
};

const normalizeEntryPath = (entryPath) => entryPath.replace(/\\/g, '/');

// Folders to skip entirely
const SKIP_PATTERN = /^(node_modules|\.git|dist|build|\.next|\.nuxt|coverage|\.cache|__MACOSX)\//;

const MAX_FILE_BYTES = 200 * 1024; // 200 KB per file — keeps MongoDB document small

/**
 * Parse a ZIP buffer into an array of file objects.
 * Uses unzipper for robust handling of all ZIP formats.
 */
export const parseZipBuffer = async (buffer) => {
  const files = [];

  try {
    const directory = await unzipper.Open.buffer(buffer);

    for (const entry of directory.files) {
      const filePath = normalizeEntryPath(entry.path);

      // Skip directories, hidden system folders, and unsupported extensions
      if (entry.type === 'Directory') continue;
      if (SKIP_PATTERN.test(filePath)) continue;

      const ext = path.extname(filePath).toLowerCase();
      if (!supportedExtensions.has(ext)) continue;

      try {
        const chunks = [];
        let totalSize = 0;
        const stream = entry.stream();

        await new Promise((resolve, reject) => {
          stream.on('data', (chunk) => {
            totalSize += chunk.length;
            if (totalSize <= MAX_FILE_BYTES) {
              chunks.push(chunk);
            }
          });
          stream.on('error', reject);
          stream.on('finish', resolve);
        });

        const content = Buffer.concat(chunks).toString('utf8');
        const lineCount = content.split(/\r?\n/).length;
        const size = Buffer.byteLength(content, 'utf8');

        files.push({
          path: filePath,
          language: getLanguage(filePath),
          lineCount,
          size,
          content: totalSize > MAX_FILE_BYTES
            ? content + '\n\n// [truncated — file exceeds 200 KB]'
            : content,
        });
      } catch (err) {
        console.warn(`Skipping "${filePath}": ${err.message}`);
      }
    }
  } catch (err) {
    console.error('ZIP parse error:', err.message);
  }

  return files;
};

export const parseSingleFile = (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!supportedExtensions.has(ext)) return null;
  const content = file.buffer.toString('utf8');
  const lineCount = content.split(/\r?\n/).length;
  const size = Buffer.byteLength(content, 'utf8');
  return {
    path: file.originalname,
    language: getLanguage(file.originalname),
    lineCount,
    size,
    content,
  };
};

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});
