/**
 * contextBuilder.js
 *
 * Responsible for selecting the most relevant file chunks from a repository
 * to fit within a token budget before sending to the AI.
 *
 * Strategy:
 *  1. Split every file into fixed-size chunks (~80 lines each).
 *  2. Score each chunk against the query using simple TF-style keyword overlap.
 *  3. Take the top-N chunks up to a token budget.
 *  4. Return formatted context string.
 */

const CHUNK_LINES = 60;
// Keep context small to stay within Gemini free-tier token limits.
// Free tier: ~32K tokens/min shared across all requests.
const CHAT_TOKEN_BUDGET = 2000;   // for per-query chat context
const FULL_TOKEN_BUDGET  = 3000;  // for README / bug scan (whole repo)
const AVG_CHARS_PER_TOKEN = 4;

/**
 * Split a file's content into line-bounded chunks.
 * Each chunk carries its file path and start line for reference.
 */
function chunkFile(file) {
  const lines = file.content.split(/\r?\n/);
  const chunks = [];
  for (let i = 0; i < lines.length; i += CHUNK_LINES) {
    chunks.push({
      path: file.path,
      language: file.language,
      startLine: i + 1,
      text: lines.slice(i, i + CHUNK_LINES).join('\n'),
    });
  }
  return chunks;
}

/**
 * Tokenize a string into lowercase words (simple whitespace + punct split).
 */
function tokenize(str) {
  return str
    .toLowerCase()
    .split(/[\s\W]+/)
    .filter(Boolean);
}

/**
 * Score a chunk against query terms using term-frequency overlap.
 * Files that are source code (not JSON/YAML/Markdown) get a small bonus.
 */
function scoreChunk(chunk, queryTerms) {
  const chunkWords = tokenize(chunk.text + ' ' + chunk.path);
  const wordSet = new Set(chunkWords);
  let score = 0;
  for (const term of queryTerms) {
    if (wordSet.has(term)) score += 1;
    // Boost if the term appears in the file path
    if (chunk.path.toLowerCase().includes(term)) score += 2;
  }
  // Penalise very large lock files / generated files
  if (chunk.path.includes('package-lock') || chunk.path.includes('yarn.lock')) score -= 10;
  return score;
}

/**
 * Build a context string from the repository files, ranked by relevance to the query.
 *
 * @param {Array} files - Repository files array from MongoDB.
 * @param {string} query - The user's query / question.
 * @returns {string} Formatted context block ready to embed in a prompt.
 */
export function buildContext(files, query) {
  const queryTerms = tokenize(query);
  const allChunks = files.flatMap(chunkFile);

  const scored = allChunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, queryTerms) }))
    .sort((a, b) => b.score - a.score);

  const selected = [];
  let usedChars = 0;
  const budget = CHAT_TOKEN_BUDGET * AVG_CHARS_PER_TOKEN;

  for (const { chunk } of scored) {
    const chunkChars = chunk.text.length + chunk.path.length + 60;
    if (usedChars + chunkChars > budget) continue;
    selected.push(chunk);
    usedChars += chunkChars;
    if (usedChars >= budget) break;
  }

  if (selected.length === 0) return '(No relevant source files found.)';

  selected.sort((a, b) => a.path.localeCompare(b.path) || a.startLine - b.startLine);

  return selected
    .map(
      (c) =>
        `### ${c.path} (lines ${c.startLine}–${c.startLine + CHUNK_LINES - 1}) [${c.language}]\n\`\`\`\n${c.text}\n\`\`\``
    )
    .join('\n\n');
}

/**
 * Build context using ALL file content (for README generation / full-repo summaries).
 * Truncates at the same token budget.
 */
export function buildFullContext(files) {
  let context = '';
  let usedChars = 0;
  const budget = FULL_TOKEN_BUDGET * AVG_CHARS_PER_TOKEN;

  for (const file of files) {
    const block = `### ${file.path} [${file.language}]\n\`\`\`\n${file.content}\n\`\`\`\n\n`;
    if (usedChars + block.length > budget) {
      const remaining = budget - usedChars;
      if (remaining > 200) {
        context += `### ${file.path} [${file.language}] (truncated)\n\`\`\`\n${file.content.slice(0, remaining)}\n\`\`\`\n\n`;
      }
      break;
    }
    context += block;
    usedChars += block.length;
  }

  return context || '(No source files available.)';
}
