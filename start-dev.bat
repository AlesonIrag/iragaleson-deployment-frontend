@echo off
echo ========================================
echo   Library Management System - Dev Setup
echo ========================================
echo.

echo [1/4] Checking project structure...
if not exist "backend-api" (
    echo Error: backend-api folder not found!
    echo Please ensure the backend-api folder exists in the project root.
    pause
    exit /b 1
)

if not exist "backend-api\package.json" (
    echo Error: backend-api\package.json not found!
    echo Please ensure the backend is properly set up.
    pause
    exit /b 1
)

echo [2/4] Installing dependencies...
echo Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install frontend dependencies
    pause
    exit /b 1
)

echo Installing backend dependencies...
cd backend-api
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo [3/4] Starting backend server...
start "Backend Server" cmd /k "cd /d %~dp0backend-api && echo Starting backend server... && npm start"

echo.
echo [4/4] Starting frontend server...
echo Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak > nul
start "Frontend Server" cmd /k "cd /d %~dp0 && echo Starting frontend server... && npm start"

echo.
echo ========================================
echo   Development servers are starting...
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:4200
echo.
echo Both servers are starting in separate windows.
echo Close this window when you're done developing.
echo.
echo Press any key to close this window...
pause > nul
