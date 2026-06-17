# Quick Start - Python Backend

## 60-Second Setup

### On Windows:
```bash
cd server
run.bat
```

### On Mac/Linux:
```bash
cd server
chmod +x run.sh
./run.sh
```

The script will:
1. ✅ Create a Python virtual environment
2. ✅ Install all dependencies
3. ✅ Create a `.env` file (edit it with your API keys)
4. ✅ Initialize the database
5. ✅ Start the server on http://localhost:5000

## Manual Setup (if scripts don't work)

```bash
cd server

# Create virtual environment
python3 -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your API keys

# Start server
python -m uvicorn app.main:app --reload --port 5000
```

## Get Your API Keys

1. **MongoDB Atlas Database** (Free tier available):
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up and create a free cluster
   - Click "Connect" and copy your connection string
   - Format: `mongodb+srv://username:password@cluster0.mongodb.net/devmindai`
   - Copy to `.env`: `MONGODB_URI=mongodb+srv://...`

2. **Gemini API** (Free tier available):
   - Go to https://aistudio.google.com/app/apikey
   - Create a new API key
   - Copy to `.env`: `GEMINI_API_KEY=AIzaSy...`

3. **GitHub Token** (Optional, for higher rate limits):
   - Go to https://github.com/settings/tokens
   - Create a new personal access token
   - Copy to `.env`: `GITHUB_TOKEN=ghp_...`

## Test It Works

1. Open http://localhost:5000/docs in your browser
2. Click "Try it out" on any endpoint
3. Execute a request to see it work

## Connect Frontend

The frontend is already configured to connect to `http://localhost:5000`. Just make sure:
- Frontend runs on `http://localhost:5173`
- Backend runs on `http://localhost:5000`
- Both are running simultaneously

## What's Different from Node.js?

**Nothing!** Same API, same responses. The conversion is seamless.

## Troubleshooting

### Python not found
```bash
python3 --version  # Use python3 instead of python
```

### Module not found
```bash
pip install -r requirements.txt  # Install dependencies
```

### Port already in use
```bash
python -m uvicorn app.main:app --port 5001  # Use different port
```

### Database locked (SQLite)
Use PostgreSQL instead in `.env`:
```
DATABASE_URL=postgresql://user:password@localhost/devmindai
```

## Next: Deploy

Ready to go live? See [PYTHON_BACKEND_README.md](./server/PYTHON_BACKEND_README.md) for deployment instructions to Render, Railway, or Docker.

---

**Questions?** Check the full documentation: [PYTHON_BACKEND_README.md](./server/PYTHON_BACKEND_README.md)
