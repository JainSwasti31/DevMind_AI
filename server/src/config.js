import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/devmindai';
export const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-me-refresh';
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const GITHUB_TOKEN   = process.env.GITHUB_TOKEN   || '';
