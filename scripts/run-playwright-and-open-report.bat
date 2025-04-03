@echo off

REM Kill any existing http-server processes
echo Cleaning up old servers...
FOR /F "tokens=5" %%P IN ('netstat -a -n -o ^| findstr :3005') DO TaskKill /PID %%P /F /T 2>nul

REM Start the server
echo Starting web server...
start "HTTP Server" cmd /c npx http-server -p 3005 -c-1

REM Wait a moment for the server to start
timeout /t 2 /nobreak

REM Run Playwright tests
echo Running Playwright tests...
npx playwright test

REM Kill the server
echo Cleaning up...
FOR /F "tokens=5" %%P IN ('netstat -a -n -o ^| findstr :3005') DO TaskKill /PID %%P /F /T 2>nul

REM Check if tests ran successfully (optional, based on errorlevel)
REM For simplicity, we'll just try to open the report regardless.

REM Open the HTML report in the default browser
echo Opening report...
start "" "playwright-report\index.html"

echo Script finished.
