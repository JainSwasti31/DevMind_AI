# Python Backend - DevMind AI

This is the converted Python backend for DevMind AI, originally built with Node.js/Express and MongoDB. It now uses **FastAPI** with **SQLAlchemy** and supports both SQLite (development) and PostgreSQL (production).

## What Changed

### Stack Migration

| Component | Node.js | Python |
|-----------|---------|--------|
| Framework | Express.js | FastAPI |
| Database | MongoDB + Mongoose | SQLAlchemy + SQLite/PostgreSQL |
| Authentication | bcryptjs + JWT | passlib + PyJWT |
| File Upload | Multer | FastAPI multipart |
| Streaming | Express SSE | FastAPI StreamingResponse |
| Config | dotenv + custom | pydantic-settings |

### Key Improvements

1. **Type Safety**: Pydantic schemas for request/response validation
2. **Async-First**: FastAPI built on async/await, naturally streaming-ready
3. **Better Performance**: Single executable, easier deployment
4. **Database Flexibility**: SQLite for dev, PostgreSQL for production
5. **Auto Documentation**: Swagger UI at `/docs` (built-in)

## Prerequisites

- Python 3.8+
- pip (Python package manager)
- (Optional) PostgreSQL for production

## Installation & Setup

### 1. Install Dependencies

```bash
cd server
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and update:

```bash
cp .env.example .env
```

Edit `.env` with your MongoDB Atlas connection string:

```env
PORT=5000

# MongoDB Atlas (Cloud - recommended)
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/devmindai

JWT_SECRET=your_strong_secret_here
JWT_REFRESH_SECRET=your_strong_refresh_secret_here
GEMINI_API_KEY=AIzaSy...
GITHUB_TOKEN=ghp_...
```

**Get your MongoDB Atlas connection string**:
1. Create account at https://www.mongodb.com/cloud/atlas (free tier)
2. Create a cluster
3. Click "Connect" → "Drivers"
4. Copy the connection string
5. Replace `username`, `password`, and cluster name

### 3. Running the Server

The backend automatically initializes MongoDB connection on startup.

**Development Mode** (with auto-reload):

```bash
python -m uvicorn app.main:app --reload --port 5000
```

Or using npm script:

```bash
npm run dev
```

**Production Mode**:

```bash
python -m uvicorn app.main:app --port 5000
```

The API will be available at `http://localhost:5000`

## API Documentation

Once running, visit:

- **Swagger UI**: http://localhost:5000/docs
- **ReDoc**: http://localhost:5000/redoc

All endpoints match the original Node.js API — no frontend changes needed!

## Project Structure

```
server/
├── app/
│   ├── main.py                 # FastAPI app + CORS setup
│   ├── config.py               # Pydantic settings
│   ├── database.py             # SQLAlchemy session + init
│   ├── models.py               # SQLAlchemy ORM models
│   ├── controllers/
│   │   ├── auth.py             # Authentication logic
│   │   ├── repo.py             # Repository management
│   │   └── ai.py               # AI features (chat, explain, etc.)
│   ├── middleware/
│   │   └── auth.py             # JWT verification, password hashing
│   ├── routes/
│   │   ├── auth.py             # /api/auth routes
│   │   ├── repo.py             # /api/repos routes
│   │   └── ai.py               # /api/ai routes
│   ├── services/
│   │   ├── github_fetcher.py   # GitHub API client
│   │   ├── repo_parser.py      # ZIP/file parsing
│   │   └── context_builder.py  # AI context selection
│   └── schemas/
│       └── models.py           # Pydantic request/response schemas
├── requirements.txt            # Python dependencies
├── .env.example                # Environment template
└── package.json                # NPM-compatible scripts
```

## Key API Endpoints

### Authentication
- `POST /api/auth/register` – Create account
- `POST /api/auth/login` – Login
- `POST /api/auth/refresh` – Refresh access token
- `POST /api/auth/logout` – Logout

### Repositories
- `POST /api/repos/upload` – Upload ZIP or source file
- `POST /api/repos/import` – Import from GitHub
- `GET /api/repos` – List user's repositories
- `GET /api/repos/{id}` – Get repository details
- `DELETE /api/repos/{id}` – Delete repository

### AI Features
- `POST /api/ai/{repoId}/chat` – Chat with codebase (SSE streaming)
- `POST /api/ai/{repoId}/explain` – Explain code snippet
- `POST /api/ai/{repoId}/readme` – Generate README
- `POST /api/ai/{repoId}/bugs` – Find bugs & improvements
- `GET /api/ai/{repoId}/history` – Get chat history
- `DELETE /api/ai/{repoId}/history` – Clear chat history

## Database Models

### MongoDB Atlas Collections

All data is stored in MongoDB Atlas cloud database:

```
devmindai (database)
├── users (collection)
├── repositories (collection)
└── chat_histories (collection)
```

## Migration from Node.js

No breaking changes! All endpoints return the same response format:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": "...",
    "name": "...",
    "email": "..."
  }
}
```

The frontend React code works without modification.

## Deployment

### Using Render (recommended)
1. Create a new Web Service
2. Connect your GitHub repo
3. Set environment variables in Render dashboard
4. Render will auto-detect `python` and install from `requirements.txt`
5. Start command: `uvicorn app.main:app --port $PORT`

### Using Railway
1. Connect GitHub repo
2. Add PostgreSQL database plugin
3. Copy the `DATABASE_URL` to environment variables
4. Set start command: `python -m uvicorn app.main:app --port $PORT`

### Using Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000"]
```

```bash
docker build -t devmind-ai .
docker run -p 5000:5000 -e DATABASE_URL=... devmind-ai
```

## Common Issues

### `ModuleNotFoundError: No module named 'app'`
Make sure you're running from the `server/` directory:
```bash
cd server
python -m uvicorn app.main:app --reload
```

### Database locked (SQLite only)
SQLite has write-locking limitations. For production, use PostgreSQL:
```bash
DATABASE_URL=postgresql://user:password@localhost/devmindai python -m uvicorn app.main:app
```

### CORS errors
Update `app/main.py` with your frontend URL:
```python
allowed_origins = [
    'https://your-frontend-domain.com',
    'http://localhost:3000',
]
```

## MongoDB Atlas Setup

### 1. Create Free Cluster

1. Visit https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create a cluster (free shared cluster)
4. Wait for deployment (~5-10 minutes)

### 2. Get Connection String

1. Click "Connect"
2. Select "Drivers" → "Python" → "PyMongo"
3. Copy the connection string
4. Paste into `.env` as `MONGODB_URI`

### 3. Create Database User

1. In Atlas → Database Access
2. Create a user with username & password
3. Update `.env`: `MONGODB_URI=mongodb+srv://username:password@...`

### 4. Whitelist IP (Optional)

- In Atlas → Network Access
- Add your IP address (or 0.0.0.0 for development)

---

Your MongoDB Atlas database is now ready! The backend will automatically create collections on first connection.

## Testing

```bash
pytest
```

## Performance Notes

- **Async handling**: FastAPI processes requests concurrently
- **Streaming**: SSE responses stream directly to the client
- **Database**: SQLAlchemy connection pooling enabled by default
- **AI context**: Context builder uses efficient chunking and ranking

## Troubleshooting

### API returns 500 errors
Check the console output for the full error traceback.

### Gemini API rate limit
The service respects the Gemini free tier. Add a `GEMINI_API_KEY` for higher limits or use a personal API key via `x-user-api-key` header.

### File upload fails
Maximum file size is controlled in `repo_parser.py`. Increase `MAX_FILES` or `MAX_FILE_BYTES` if needed.

## Next Steps

1. **Update Frontend**: Ensure frontend points to `http://localhost:5000` (already configured)
2. **Add Tests**: Create `tests/` directory with pytest fixtures
3. **Custom Middleware**: Add logging, request timing, etc. in `app/main.py`
4. **Caching**: Add Redis for chat history caching
5. **Monitoring**: Integrate Sentry or similar for error tracking

---

For questions or issues, check the original Node.js backend code in `src/` for reference.
