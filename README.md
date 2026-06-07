# DevMind AI

> AI-powered code intelligence platform — chat with your codebase, generate docs, and catch bugs.

![Tech Stack](https://img.shields.io/badge/stack-React%20%7C%20Node.js%20%7C%20MongoDB%20%7C%20Gemini-0ea5e9?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-22d3ee?style=flat-square)

---

## What it does

DevMind AI lets you import any GitHub repository, then use AI to understand and improve it:

| Feature | Description |
|---|---|
| 🐙 **GitHub Import** | Paste a public repo URL — all source files are fetched and indexed automatically |
| 💬 **Chat with code** | Ask anything about your codebase; relevant chunks are selected and answers stream in real time |
| 🔍 **Code explainer** | Get a detailed breakdown of any file — purpose, inputs, outputs, and edge cases |
| 📄 **README generator** | One-click generation of a full README.md from your source files |
| 🐛 **Bug finder** | AI reviews code for bugs, security issues, and improvements with severity ratings |
| 🔐 **Auth** | JWT access + refresh tokens, bcrypt password hashing, protected routes |

---

## Tech Stack

**Frontend**
- React 19 + Vite
- Tailwind CSS
- React Router v6

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT (access + refresh tokens), bcrypt
- Multer (ZIP upload), unzipper, axios

**AI**
- Google Gemini 2.5 Flash (`@google/generative-ai`)
- Streaming via SSE (Server-Sent Events)
- Custom context chunking — keyword-ranked file chunks fit into a token budget

---

## Project Structure

```
DevMindAI/
├── client/                  # React frontend (Vite + Tailwind)
│   └── src/
│       ├── components/      # Sidebar, Navbar, ChatPanel, AIToolsPanel, ...
│       ├── context/         # AuthContext (JWT + localStorage)
│       ├── pages/           # Home, Auth, Dashboard, Upload, RepositoryDetail
│       └── utils/           # api.js (with token refresh interceptor), auth.js
│
└── server/                  # Express backend
    └── src/
        ├── controllers/     # authController, repoController, aiController
        ├── middleware/       # authMiddleware (JWT verification)
        ├── models/          # User, Repository, ChatHistory
        ├── routes/          # authRoutes, repoRoutes, aiRoutes
        └── services/        # githubFetcher, repoParser, contextBuilder
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- [Gemini API key](https://aistudio.google.com/app/apikey) (free tier)
- (Optional) [GitHub Personal Access Token](https://github.com/settings/tokens) for private repos / higher rate limits

### 1. Clone the repo

```bash
git clone https://github.com/JainSwasti31/DevMind_AI.git
cd DevMindAI
```

### 2. Set up the server

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/devmindai
JWT_SECRET=your_strong_secret
JWT_REFRESH_SECRET=your_strong_refresh_secret
GEMINI_API_KEY=AIzaSy...
GITHUB_TOKEN=               # optional — leave blank for public repos
```

Start the server:

```bash
npm run dev
```

### 3. Set up the client

```bash
cd client
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default `5000`) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh tokens |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GITHUB_TOKEN` | No | GitHub PAT — raises rate limit from 60 to 5000 req/hr |

---

## API Overview

### Auth — `/api/auth`

| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create account |
| POST | `/login` | Login, returns access + refresh tokens |
| POST | `/refresh` | Rotate access token using refresh token |
| POST | `/logout` | Invalidate refresh token |

### Repositories — `/api/repos`

| Method | Path | Description |
|---|---|---|
| POST | `/import` | Import from GitHub URL |
| POST | `/upload` | Upload ZIP or source file |
| GET | `/` | List user's repositories |
| GET | `/:id` | Get single repository |
| DELETE | `/:id` | Delete repository + chat history |

### AI — `/api/ai/:repoId`

| Method | Path | Description |
|---|---|---|
| POST | `/chat` | Streaming SSE chat with codebase |
| POST | `/explain` | Explain a file or code snippet |
| POST | `/readme` | Generate README.md |
| POST | `/bugs` | Bug and improvement suggestions |
| GET | `/history` | Load chat history |
| DELETE | `/history` | Clear chat history |

---

## How the AI Context Works

Large repos can't fit in a single prompt. DevMind uses a custom chunking pipeline:

1. Every file is split into 60-line chunks
2. Each chunk is scored against the user's query using keyword overlap + file path boosting
3. Top-ranked chunks are selected up to a token budget (≈2000 tokens for chat)
4. The selected context is injected into the Gemini prompt
5. On 503/429 errors, the system retries with exponential backoff and falls back to `gemini-2.0-flash`

---

## Deployment

### Frontend → Vercel

```bash
cd client
npm run build
# Deploy the dist/ folder or connect the repo to Vercel
```

Update `client/src/utils/api.js`:
```js
export const API_BASE_URL = 'https://your-backend.onrender.com/api';
```

### Backend → Render / Railway

- Set all environment variables in the platform dashboard
- Start command: `node src/index.js`
- Root directory: `server`

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT © 2025 DevMind AI
