@echo off
echo ========================================
echo Library Management System - Production
echo ========================================

echo.
echo [1/4] Building frontend for production...
call npm run build:prod
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)

echo.
echo [2/4] Checking backend dependencies...
cd backend-api
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)

echo.
echo [3/4] Starting backend server...
start "Backend Server - Port 3000" cmd /k "npm start"

echo.
echo [4/4] Starting frontend server (serving built files)...
cd ..
start "Frontend Server - Port 4200" cmd /k "npx http-server dist/Library-Management-System-AI/browser -p 4200 -c-1 --cors -a 0.0.0.0"

echo.
echo ========================================
echo Production servers started successfully!
echo ========================================
echo Frontend: http://localhost:4200
echo Frontend (external): http://benedictocollege-library.org:4200
echo Backend: http://localhost:3000
echo Backend (external): http://benedictocollege-library.org:3000
echo.
echo Note: Make sure your firewall allows connections on ports 3000 and 4200
echo.
echo Press any key to stop all servers...
pause

echo.
echo Stopping servers...
taskkill /f /im node.exe 2>nul
taskkill /f /im "http-server" 2>nul
echo Servers stopped.
