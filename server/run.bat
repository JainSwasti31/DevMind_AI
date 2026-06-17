@echo off
REM Development startup script for DevMind AI Python backend (Windows)

echo Starting DevMind AI Python Backend...
echo =======================================

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH.
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Create .env if it doesn't exist
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
    echo WARNING: Please edit .env with your API keys
)

REM Initialize database
echo Initializing database...
python -c "from app.database import init_db; init_db(); print('OK: Database initialized')"

REM Start the server
echo.
echo Starting FastAPI server...
echo Server running at http://localhost:5000
echo API docs at http://localhost:5000/docs
echo.

python -m uvicorn app.main:app --reload --port 5000

pause
