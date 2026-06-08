/**
 * aiController.js
 *
 * All AI features powered by Google Gemini (gemini-2.5-flash):
 *   POST /api/ai/:repoId/chat          – streaming chat with the codebase (SSE)
 *   POST /api/ai/:repoId/explain       – explain a function / class
 *   POST /api/ai/:repoId/readme        – generate README + summary
 *   POST /api/ai/:repoId/bugs          – suggest bugs & improvements
 *   GET  /api/ai/:repoId/history       – load chat history
 *   DELETE /api/ai/:repoId/history     – clear chat history
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import Repository from '../models/Repository.js';
import ChatHistory from '../models/ChatHistory.js';
import { buildContext, buildFullContext } from '../services/contextBuilder.js';
import { GEMINI_API_KEY } from '../config.js';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Get a GenerativeAI client — uses the user's own key if sent via header,
 * otherwise falls back to the server default.
 */
function getGenAI(req) {
  const userKey = req.headers['x-user-api-key'];
  if (userKey && userKey.trim()) {
    return new GoogleGenerativeAI(userKey.trim());
  }
  return genAI;
}

const MODEL_PRIMARY  = 'gemini-2.5-flash';
const MODEL_FALLBACK = 'gemini-2.0-flash';

/** Extract retry-after seconds from a Gemini 429 error, if present. */
function getRetryDelay(err) {
  try {
    const retryInfo = err.errorDetails?.find(
      (d) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
    );
    if (retryInfo?.retryDelay) {
      const secs = parseInt(retryInfo.retryDelay);
      if (!isNaN(secs)) return secs;
    }
  } catch { /* ignore */ }
  return null;
}

function geminiErrorMessage(err) {
  if (err.status === 429) {
    const delay = getRetryDelay(err);
    return delay
      ? `AI quota exceeded. Please wait ${delay} seconds and try again.`
      : 'AI quota exceeded. Please wait a minute and try again.';
  }
  if (err.status === 503) return 'Gemini is temporarily overloaded. Please try again in a few seconds.';
  return err.message || 'AI request failed.';
}
async function withRetry(fn, fallbackModel = null) {
  const delays = [1500, 3000];
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      return await fn(attempt > 0 && fallbackModel ? fallbackModel : MODEL_PRIMARY);
    } catch (err) {
      const isRetryable = err.status === 503 || err.status === 429;
      if (isRetryable && attempt < delays.length) {
        await new Promise((r) => setTimeout(r, delays[attempt]));
        continue;
      }
      throw err;
    }
  }
}

const SYSTEM_BASE = `You are DevMind AI, an expert software engineer assistant.
You answer questions about a user's code repository clearly and precisely.
When showing code, always use fenced code blocks with the language tag.
Be concise but thorough. If you are unsure, say so rather than guessing.`;

// ─── helpers ────────────────────────────────────────────────────────────────

async function getRepo(repoId, userId) {
  return Repository.findOne({ _id: repoId, user: userId });
}

function sendSSEEvent(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Convert our [{role, content}] history array to Gemini's format.
 * Gemini uses 'user' and 'model' roles, and parts: [{ text }].
 */
function toGeminiHistory(messages) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

// ─── Chat (streaming SSE) ────────────────────────────────────────────────────

export const chat = async (req, res) => {
  const { repoId } = req.params;
  const userId = req.userId;
  const { message } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ message: 'message is required.' });
  }

  const repo = await getRepo(repoId, userId);
  if (!repo) return res.status(404).json({ message: 'Repository not found.' });

  let history = await ChatHistory.findOne({ user: userId, repository: repoId });
  if (!history) {
    history = new ChatHistory({ user: userId, repository: repoId, messages: [] });
  }

  const codeContext = buildContext(repo.files, message);

  const systemInstruction = `${SYSTEM_BASE}

## Repository: ${repo.name}
The following source files are the most relevant to the user's question:

${codeContext}`;

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let fullResponse = '';

  try {
    const result = await withRetry(async (model) => {
      const geminiModel = getGenAI(req).getGenerativeModel({ model, systemInstruction });
      const geminiHistory = toGeminiHistory(history.messages.slice(-6));
      const chatSession = geminiModel.startChat({ history: geminiHistory });
      return chatSession.sendMessageStream(message);
    }, MODEL_FALLBACK);

    for await (const chunk of result.stream) {
      const delta = chunk.text();
      if (delta) {
        fullResponse += delta;
        sendSSEEvent(res, { type: 'delta', content: delta });
      }
    }

    // Persist messages
    history.messages.push({ role: 'user', content: message });
    history.messages.push({ role: 'assistant', content: fullResponse });
    if (history.messages.length > 100) {
      history.messages = history.messages.slice(-100);
    }
    await history.save();

    sendSSEEvent(res, { type: 'done' });
  } catch (err) {
    console.error('Gemini stream error:', err);
    sendSSEEvent(res, { type: 'error', message: geminiErrorMessage(err) });
  } finally {
    res.end();
  }
};

// ─── Explain function / class ────────────────────────────────────────────────

export const explain = async (req, res) => {
  const { repoId } = req.params;
  const userId = req.userId;
  const { filePath, code, symbol } = req.body;

  if (!code) return res.status(400).json({ message: 'code is required.' });

  const repo = await getRepo(repoId, userId);
  if (!repo) return res.status(404).json({ message: 'Repository not found.' });

  // Truncate to ~6 KB to stay within free-tier token limits
  const MAX_CODE_CHARS = 6000;
  const truncated = code.length > MAX_CODE_CHARS
    ? code.slice(0, MAX_CODE_CHARS) + '\n// ... [truncated]'
    : code;

  const prompt = symbol
    ? `Explain the ${symbol} in the following code from \`${filePath || 'unknown'}\`. Include: purpose, parameters/return values, side-effects, and any edge cases.`
    : `Explain what the following code does. Include: purpose, how it works step by step, inputs/outputs, and any notable patterns or concerns.`;

  try {
    const result = await withRetry(async (modelName) => {
      const model = getGenAI(req).getGenerativeModel({ model: modelName, systemInstruction: SYSTEM_BASE });
      return model.generateContent(
        `${prompt}\n\nFile: ${filePath || 'unknown'}\n\`\`\`\n${truncated}\n\`\`\``
      );
    }, MODEL_FALLBACK);

    let explanation = '';
    try { explanation = result.response.text(); } catch { /* blocked */ }

    if (!explanation) {
      const blockReason = result.response?.promptFeedback?.blockReason;
      return res.status(200).json({
        explanation: blockReason
          ? `Response blocked by safety filter: ${blockReason}. Try selecting a smaller portion of the file.`
          : 'Gemini returned an empty response. The file may be too large or contain content that triggered a safety filter.',
      });
    }

    res.json({ explanation });
  } catch (err) {
    console.error('Explain error:', err);
    res.status(err.status === 429 || err.status === 503 ? err.status : 500).json({ message: geminiErrorMessage(err) });
  }
};

// ─── README / summary generator ─────────────────────────────────────────────

export const generateReadme = async (req, res) => {
  const { repoId } = req.params;
  const userId = req.userId;

  const repo = await getRepo(repoId, userId);
  if (!repo) return res.status(404).json({ message: 'Repository not found.' });

  const codeContext = buildFullContext(repo.files);

  const prompt = `Generate a comprehensive README.md for the repository named "${repo.name}".

The README should include:
1. Project title and one-sentence description
2. Features list (inferred from the code)
3. Tech stack (languages and frameworks detected)
4. Project structure overview
5. Getting started (installation + running instructions — infer from package.json / config files)
6. API overview (if it's a backend project)
7. Environment variables (if any config files are present)
8. Contributing notes

Here are the source files:

${codeContext}`;

  try {
    const result = await withRetry(async (modelName) => {
      const model = getGenAI(req).getGenerativeModel({ model: modelName, systemInstruction: SYSTEM_BASE });
      return model.generateContent(prompt);
    }, MODEL_FALLBACK);
    let readme = '';
    try { readme = result.response.text(); } catch { /* blocked */ }
    if (!readme) return res.status(200).json({ readme: 'Gemini returned an empty response. Try again in a moment.' });
    res.json({ readme });
  } catch (err) {
    console.error('README generation error:', err);
    res.status(err.status === 429 || err.status === 503 ? err.status : 500).json({ message: geminiErrorMessage(err) });
  }
};

// ─── Bug & improvement suggestions ──────────────────────────────────────────

export const suggestBugs = async (req, res) => {
  const { repoId } = req.params;
  const userId = req.userId;
  const { filePath, code } = req.body;

  const repo = await getRepo(repoId, userId);
  if (!repo) return res.status(404).json({ message: 'Repository not found.' });

  const contextCode = code || buildFullContext(repo.files);
  const targetDesc = filePath ? `file \`${filePath}\`` : 'the repository';

  const prompt = `Review ${targetDesc} for bugs, security vulnerabilities, and improvement opportunities.

For each issue found, provide:
- **Severity**: Critical / High / Medium / Low
- **Location**: File path and approximate line number
- **Issue**: Clear description of the problem
- **Suggestion**: How to fix or improve it

Also add a brief "Overall Assessment" section at the end.

Code to review:

${contextCode}`;

  try {
    const result = await withRetry(async (modelName) => {
      const model = getGenAI(req).getGenerativeModel({ model: modelName, systemInstruction: SYSTEM_BASE });
      return model.generateContent(prompt);
    }, MODEL_FALLBACK);
    let suggestions = '';
    try { suggestions = result.response.text(); } catch { /* blocked */ }
    if (!suggestions) return res.status(200).json({ suggestions: 'Gemini returned an empty response. Try again in a moment.' });
    res.json({ suggestions });
  } catch (err) {
    console.error('Bug suggestions error:', err);
    res.status(err.status === 429 || err.status === 503 ? err.status : 500).json({ message: geminiErrorMessage(err) });
  }
};

// ─── Chat history ────────────────────────────────────────────────────────────

export const getChatHistory = async (req, res) => {
  const { repoId } = req.params;
  const userId = req.userId;

  const repo = await getRepo(repoId, userId);
  if (!repo) return res.status(404).json({ message: 'Repository not found.' });

  const history = await ChatHistory.findOne({ user: userId, repository: repoId });
  res.json({ messages: history ? history.messages : [] });
};

export const clearChatHistory = async (req, res) => {
  const { repoId } = req.params;
  const userId = req.userId;

  const repo = await getRepo(repoId, userId);
  if (!repo) return res.status(404).json({ message: 'Repository not found.' });

  await ChatHistory.deleteOne({ user: userId, repository: repoId });
  res.json({ message: 'Chat history cleared.' });
};
