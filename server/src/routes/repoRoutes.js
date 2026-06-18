import { Router } from 'express';
import { uploadRepository, listRepositories, getRepository, deleteRepository, importFromGitHub } from '../controllers/repoController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { uploadMiddleware } from '../services/repoParser.js';

const router = Router();

router.post('/upload', requireAuth, uploadMiddleware.single('archive'), uploadRepository);
router.post('/import', requireAuth, importFromGitHub);
router.get('/', requireAuth, listRepositories);
router.get('/:id', requireAuth, getRepository);
router.delete('/:id', requireAuth, deleteRepository);

export default router;
