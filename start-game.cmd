@echo off
cd /d "%~dp0"
if not exist node_modules call npm install
start "" /b cmd /c "timeout /t 3 >nul & start http://localhost:3000"
npm run dev
