import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { JWT_REFRESH_SECRET, JWT_SECRET } from '../config.js';

const createToken = (userId, secret, expiresIn) => jwt.sign({ userId }, secret, { expiresIn });

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(409).json({ message: 'Email already in use.' });
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashedPassword });
  await user.save();
  const accessToken = createToken(user.id, JWT_SECRET, '15m');
  const refreshToken = createToken(user.id, JWT_REFRESH_SECRET, '7d');
  user.refreshToken = refreshToken;
  await user.save();
  res.status(201).json({ accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email } });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials.' });
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(401).json({ message: 'Invalid credentials.' });
  const accessToken = createToken(user.id, JWT_SECRET, '15m');
  const refreshToken = createToken(user.id, JWT_REFRESH_SECRET, '7d');
  user.refreshToken = refreshToken;
  await user.save();
  res.json({ accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email } });
};

export const logout = async (req, res) => {
  const { token } = req.body;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_REFRESH_SECRET);
      const user = await User.findById(payload.userId);
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    } catch {
      // Token already invalid — that's fine
    }
  }
  res.json({ message: 'Logged out.' });
};

export const refreshToken = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Refresh token is required.' });
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET);
    const user = await User.findById(payload.userId);
    if (!user || user.refreshToken !== token)
      return res.status(401).json({ message: 'Invalid refresh token.' });
    const accessToken = createToken(user.id, JWT_SECRET, '15m');
    const refresh = createToken(user.id, JWT_REFRESH_SECRET, '7d');
    user.refreshToken = refresh;
    await user.save();
    res.json({ accessToken, refreshToken: refresh });
  } catch (error) {
    return res.status(401).json({ message: 'Could not refresh token.' });
  }
};
