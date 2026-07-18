@echo off
title Build Application-HC
cls
setlocal

echo ===================================================
echo   COMPILATION DE L'APPLICATION
echo ===================================================
echo.

:: Se positionne automatiquement dans le dossier du script
cd /d "%~dp0"

:: Next.js utilise .next pour son build (pas dist)
if exist .next (
    echo [1/3] Nettoyage de l'ancien build '.next'...
    rmdir /s /q .next
)

:: Installation des dependances
echo [2/3] Installation des dependances (npm install)...
call npm install
if errorlevel 1 (
    echo.
    echo [ERREUR] L'installation des dependances a echoue.
    pause
    exit /b 1
)

:: Compilation de l'application
echo [3/3] Production du build Next.js (npm run build)...
call npm run build
if errorlevel 1 (
    echo.
    echo [ERREUR] La compilation a echoue. Verifiez les erreurs ci-dessus.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo [SUCCES] Compilation terminee !
echo Le build se trouve dans '.next' (et non dans 'dist').
echo Netlify le gere automatiquement via netlify.toml.
echo Pour deployer : npx netlify deploy --prod
echo ===================================================
echo.

pause
endlocal
