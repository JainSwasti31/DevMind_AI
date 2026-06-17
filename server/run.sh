#!/bin/bash
# Development startup script for DevMind AI Python backend

echo "Starting DevMind AI Python Backend..."
echo "======================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "Error: pip3 is not installed."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your API keys"
fi

# Initialize database
echo "Initializing database..."
python -c "from app.database import init_db; init_db(); print('✓ Database initialized')"

# Start the server
echo ""
echo "Starting FastAPI server..."
echo "🚀 Server running at http://localhost:5000"
echo "📚 API docs at http://localhost:5000/docs"
echo ""

python -m uvicorn app.main:app --reload --port 5000
