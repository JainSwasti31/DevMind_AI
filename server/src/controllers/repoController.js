import Repository from '../models/Repository.js';
import ChatHistory from '../models/ChatHistory.js';
import { parseZipBuffer, parseSingleFile } from '../services/repoParser.js';
import { fetchGitHubRepo, parseGitHubUrl } from '../services/githubFetcher.js';

export const uploadRepository = async (req, res) => {
  const userId = req.userId;
  const repoName = req.body.name || (req.file && req.file.originalname) || 'repository';
  if (!userId) return res.status(401).json({ message: 'Authorization required.' });
  if (!req.file) return res.status(400).json({ message: 'Please provide a ZIP archive or source file.' });
  try {
    let files = [];
    if (req.file.originalname.toLowerCase().endsWith('.zip')) {
      files = await parseZipBuffer(req.file.buffer);
    } else {
      const singleFile = parseSingleFile(req.file);
      if (singleFile) files = [singleFile];
    }

    if (files.length === 0) {
      return res.status(400).json({ message: 'No supported source files were found in the upload.' });
    }

    // Cap total files to keep the MongoDB document well under 16MB
    const MAX_FILES = 300;
    const sanitized = files.slice(0, MAX_FILES);

    const repository = new Repository({
      name: repoName.replace(/\.zip$/i, ''),
      user: userId,
      files: sanitized,
    });

    await repository.save();
    res.status(201).json({ repository });
  } catch (error) {
    console.error('Upload error:', error);
    const message = error?.message || '';
    if (message.includes('document too large') || message.includes('BSONError')) {
      return res.status(400).json({ message: 'Repository is too large to store. Try uploading a smaller subset of files.' });
    }
    res.status(500).json({ message: 'Failed to parse and save repository.' });
  }
};

export const listRepositories = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: 'Authorization required.' });
  const repos = await Repository.find({ user: userId }).sort({ createdAt: -1 }).select('name files createdAt updatedAt');
  res.json({ repositories: repos });
};

export const getRepository = async (req, res) => {
  const userId = req.userId;
  const repoId = req.params.id;
  if (!userId) return res.status(401).json({ message: 'Authorization required.' });
  const repository = await Repository.findOne({ _id: repoId, user: userId });
  if (!repository) return res.status(404).json({ message: 'Repository not found.' });
  res.json({ repository });
};

export const deleteRepository = async (req, res) => {
  const userId = req.userId;
  const repoId = req.params.id;
  if (!userId) return res.status(401).json({ message: 'Authorization required.' });
  const repository = await Repository.findOneAndDelete({ _id: repoId, user: userId });
  if (!repository) return res.status(404).json({ message: 'Repository not found.' });
  // Clean up associated chat history
  await ChatHistory.deleteOne({ user: userId, repository: repoId });
  res.json({ message: 'Repository deleted.' });
};

export const importFromGitHub = async (req, res) => {
  const userId = req.userId;
  const { githubUrl } = req.body;

  if (!userId) return res.status(401).json({ message: 'Authorization required.' });
  if (!githubUrl) return res.status(400).json({ message: 'githubUrl is required.' });

  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed) {
    return res.status(400).json({ message: 'Invalid GitHub URL. Expected https://github.com/owner/repo' });
  }

  // Check for duplicate
  const existing = await Repository.findOne({
    user: userId,
    'meta.url': `https://github.com/${parsed.owner}/${parsed.repo}`,
  });
  if (existing) {
    return res.status(409).json({ message: `You have already imported "${existing.name}". Delete it first to re-import.` });
  }

  try {
    const { repoName, files, meta } = await fetchGitHubRepo(githubUrl);

    if (files.length === 0) {
      return res.status(400).json({ message: 'No supported source files were found in this repository.' });
    }

    const repository = new Repository({
      name: repoName,
      user: userId,
      description: meta.description || '',
      files,
      meta,
    });

    await repository.save();
    res.status(201).json({ repository });
  } catch (error) {
    console.error('GitHub import error:', error.message);
    const msg = error.message || 'Failed to import repository from GitHub.';
    res.status(500).json({ message: msg });
  }
};
