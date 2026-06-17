# MongoDB & Gemini-Only Backend Update

## Changes Made

Successfully converted the Python backend to use **MongoDB** with **MongoEngine** and removed all OpenAI references. The database is now fully compatible with the original Node.js/MongoDB setup.

### 🔄 Database Migration

#### Before (SQLAlchemy)
- **ORM**: SQLAlchemy with SQL databases
- **Support**: SQLite (dev) or PostgreSQL (prod)
- **Session Management**: Dependency injection with `get_db()`
- **Schema**: Relational tables with foreign keys

#### After (MongoEngine)
- **ORM**: MongoEngine (MongoDB's Python Mongoose equivalent)
- **Support**: MongoDB (local or MongoDB Atlas)
- **Session Management**: Automatic with MongoEngine
- **Schema**: Document-based with embedded documents

### 📝 Key File Changes

#### `requirements.txt`
```diff
- sqlalchemy==2.0.23
- psycopg2-binary==2.9.9
+ mongoengine==0.27.0
+ pymongo==4.6.0

- OPENAI_API_KEY
```

#### `app/config.py`
```python
# Before
DATABASE_URL: str = "sqlite:///./test.db"
OPENAI_API_KEY: str = ""

# After
MONGODB_URI: str = "mongodb://localhost:27017/devmindai"
```

#### `app/database.py`
```python
# Before: SQLAlchemy session management
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# After: MongoEngine connection
connect(db='devmindai', host=settings.MONGODB_URI)
```

#### `app/models.py`
All models converted from SQLAlchemy to MongoEngine:

```python
# Before: SQLAlchemy
class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True)
    email = Column(String(255), unique=True)

# After: MongoEngine
class User(Document):
    id = StringField(primary_key=True, default=lambda: uuid.uuid4().hex)
    email = EmailField(required=True, unique=True)
    
    meta = {
        'collection': 'users',
        'indexes': ['email']
    }
```

#### Message & ChatHistory Structure
- **Before**: Separate `Message` table with foreign key to `ChatHistory`
- **After**: `Message` as embedded document within `ChatHistory` (MongoEngine style)

```python
# Before: Separate tables
class Message(Base):
    __tablename__ = "messages"
    chat_history_id = Column(ForeignKey("chat_histories.id"))

# After: Embedded document
class Message(EmbeddedDocument):
    role = StringField(required=True, choices=['user', 'assistant'])
    content = StringField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)

class ChatHistory(Document):
    messages = ListField(EmbeddedDocumentField(Message), default=list)
```

### 🔌 Controller Updates

#### Removed Database Dependencies
```python
# Before: SQLAlchemy queries
db.query(User).filter(User.email == email).first()
db.add(user)
db.commit()

# After: MongoEngine queries
User.objects(email=email).first()
user.save()
```

#### All Controllers Updated
- ✅ `app/controllers/auth.py` - MongoEngine queries
- ✅ `app/controllers/repo.py` - MongoEngine queries
- ✅ `app/controllers/ai.py` - MongoEngine queries
- ✅ All routes - Removed `db` dependency injection

### 📦 Configuration

#### `.env.example`
```env
# Before
DATABASE_URL=sqlite:///./devmindai.db
OPENAI_API_KEY=sk-...

# After
MONGODB_URI=mongodb://localhost:27017/devmindai
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/devmindai
```

### ✨ Features

#### What Works the Same
- ✅ All 15 API endpoints
- ✅ JWT authentication
- ✅ Bcrypt password hashing
- ✅ Streaming chat responses
- ✅ File upload and parsing
- ✅ GitHub repository import
- ✅ Code explanation, README generation, bug detection
- ✅ Chat history persistence

#### What Changed
- ❌ OpenAI (removed - Gemini only)
- 🔄 Database from SQL → MongoDB
- 🔄 Session management simplified

### 🚀 Running the Backend

#### Prerequisites
- Python 3.8+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cloud)

#### Installation

```bash
cd server

# Install dependencies
pip install -r requirements.txt

# Create .env
cp .env.example .env

# Edit .env with your settings
# MONGODB_URI=mongodb://localhost:27017/devmindai
# GEMINI_API_KEY=AIzaSy...
```

#### Start MongoDB (if local)

**Using MongoDB Community**:
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Windows (MongoDB Compass or installer)
# Runs as service automatically

# Linux
sudo systemctl start mongod
```

**Or use MongoDB Atlas** (cloud):
- Create account at https://www.mongodb.com/cloud/atlas
- Get connection string
- Set in `.env`: `MONGODB_URI=mongodb+srv://...`

#### Start the Server

```bash
# Development with auto-reload
python -m uvicorn app.main:app --reload --port 5000

# Or using startup script
# Windows: run.bat
# Mac/Linux: ./run.sh
```

### 📊 Data Structure Comparison

| Data | SQLAlchemy | MongoEngine |
|------|-----------|-----------|
| User | Table | Collection |
| Repository | Table | Document |
| ChatHistory | Table | Document |
| Message | Separate table | Embedded in ChatHistory |
| Files | JSON column | Array of objects |
| Metadata | JSON column | Nested document |

### 🔍 Query Examples

**Before (SQLAlchemy)**:
```python
user = db.query(User).filter(User.email == email).first()
repos = db.query(Repository).filter(
    Repository.user_id == user_id
).order_by(Repository.created_at.desc()).all()
db.add(user)
db.commit()
```

**After (MongoEngine)**:
```python
user = User.objects(email=email).first()
repos = Repository.objects(user_id=user_id).order_by('-created_at')
user.save()
```

### 🌐 MongoDB vs SQL Benefits

**MongoDB (chosen for this project)**:
- ✅ Document-oriented (matches JSON API responses)
- ✅ Flexible schema (files can have varying properties)
- ✅ Embedded documents (no join queries needed)
- ✅ Same as original Node.js backend
- ✅ Better for storing large arrays of files

### 🧪 Testing the API

```bash
# Start the server
python -m uvicorn app.main:app --reload

# Open Swagger UI
# http://localhost:5000/docs

# Test an endpoint
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'
```

### 📋 Checklist

- ✅ Removed all OpenAI references
- ✅ Converted SQLAlchemy models to MongoEngine
- ✅ Updated all controllers for MongoEngine
- ✅ Removed database dependency injection
- ✅ Updated `.env.example` for MongoDB
- ✅ Updated `requirements.txt`
- ✅ Maintains 100% API compatibility
- ✅ No frontend changes needed

### 🎯 Next Steps

1. **Set up MongoDB**:
   - Local: Install MongoDB Community
   - Cloud: MongoDB Atlas (free tier available)

2. **Configure .env**:
   ```bash
   MONGODB_URI=mongodb://localhost:27017/devmindai
   GEMINI_API_KEY=AIzaSy...
   JWT_SECRET=your_secret_here
   JWT_REFRESH_SECRET=your_refresh_secret
   ```

3. **Start the server**:
   ```bash
   pip install -r requirements.txt
   python -m uvicorn app.main:app --reload --port 5000
   ```

4. **Test the API**:
   - Visit http://localhost:5000/docs
   - Try registering and logging in

### 📚 Resources

- **MongoEngine Docs**: https://docs.mongoengine.org/
- **MongoDB Docs**: https://docs.mongodb.com/
- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas

---

**Status**: ✅ Complete - Backend now uses MongoDB with MongoEngine and Gemini-only AI
