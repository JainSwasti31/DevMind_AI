import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  chat,
  explain,
  generateReadme,
  suggestBugs,
  getChatHistory,
  clearChatHistory,
} from '../controllers/aiController.js';

const router = Router();

// All AI routes require authentication
router.use(requireAuth);

// Chat with codebase — streaming SSE
router.post('/:repoId/chat', chat);

// Explain a function / class
router.post('/:repoId/explain', explain);

// Generate README + summary
router.post('/:repoId/readme', generateReadme);

// Bug & improvement suggestions
router.post('/:repoId/bugs', suggestBugs);

// Chat history
router.get('/:repoId/history', getChatHistory);
router.delete('/:repoId/history', clearChatHistory);

export default router;
