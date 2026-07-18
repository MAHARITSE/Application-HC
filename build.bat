@echo off
title Build Application-HC
cls

echo ===================================================
echo   COMPILATION ET PREPARATION DU DEPLOIEMENT
echo ===================================================
echo.

:: 1. Se positionne automatiquement dans le dossier du script
cd /d "%~dp0"

:: 2. Nettoyage de l'ancien build
if exist dist (
    echo [1/4] Nettoyage du dossier 'dist' existant...
    rmdir /s /q dist
)

:: 3. Verification des dependances
echo [2/4] Verification des dependances (npm install)...
call npm install

:: 4. Compilation de l'application
echo [3/4] Production du build de l'application (npm run build)...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERREUR] La compilation a echoue. Verifiez les erreurs ci-dessus.
    pause
    exit /b %ERRORLEVEL%
)

:: 5. Finalisation
echo.
echo ===================================================
echo [SUCCES] Compilation terminee !
echo Le contenu du dossier 'dist' est pret a etre deploye.
echo ===================================================
echo.

pause