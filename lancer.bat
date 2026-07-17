@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "CONFIG_FILE=app.config.json"
if not exist "%CONFIG_FILE%" (
  echo [ERREUR] Le fichier %CONFIG_FILE% est introuvable.
  echo Lancez d'abord setup.bat ou recreez le fichier de configuration JSON.
  pause
  exit /b 1
)

where powershell >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] PowerShell est requis pour lire la configuration JSON.
  pause
  exit /b 1
)

for /f "usebackq delims=" %%A in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$c=Get-Content -Raw '%CONFIG_FILE%' | ConvertFrom-Json; if($c.app.host){$c.app.host}else{'127.0.0.1'}"`) do set "APP_HOST=%%A"
for /f "usebackq delims=" %%A in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$c=Get-Content -Raw '%CONFIG_FILE%' | ConvertFrom-Json; if($c.app.port){$c.app.port}else{3000}"`) do set "APP_PORT=%%A"
for /f "usebackq delims=" %%A in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$c=Get-Content -Raw '%CONFIG_FILE%' | ConvertFrom-Json; if($c.app.mode){$c.app.mode}else{'dev'}"`) do set "APP_MODE=%%A"
for /f "usebackq delims=" %%A in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$c=Get-Content -Raw '%CONFIG_FILE%' | ConvertFrom-Json; if($null -ne $c.app.openBrowser){$c.app.openBrowser}else{$true}"`) do set "OPEN_BROWSER=%%A"
for /f "usebackq delims=" %%A in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$c=Get-Content -Raw '%CONFIG_FILE%' | ConvertFrom-Json; if($c.database.url){$c.database.url}else{'postgresql://postgres:postgres@127.0.0.1:5432/app_db'}"`) do set "DATABASE_URL=%%A"

if not exist "node_modules" (
  echo [INFO] Les dependances ne sont pas installees.
  echo Lancez setup.bat une premiere fois, puis relancez lancer.bat.
  pause
  exit /b 1
)

set "APP_URL=http://%APP_HOST%:%APP_PORT%"
echo.
echo =============================================
echo   HC-Manager - Demarrage Windows mode JSON
echo =============================================
echo Configuration : %CONFIG_FILE%
echo Adresse       : %APP_URL%
echo Mode          : %APP_MODE%
echo Base donnees  : %DATABASE_URL%
echo.

if /I "%OPEN_BROWSER%"=="True" (
  start "HC-Manager navigateur" /MIN powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 5; Start-Process '%APP_URL%'"
)

if /I "%APP_MODE%"=="prod" (
  if not exist ".next" (
    echo [INFO] Build production absent, compilation en cours...
    call npm run build
    if errorlevel 1 (
      echo [ERREUR] La compilation a echoue.
      pause
      exit /b 1
    )
  )
  call npm run start -- --hostname %APP_HOST% -p %APP_PORT%
) else (
  call npm run dev -- --hostname %APP_HOST% -p %APP_PORT%
)

if errorlevel 1 (
  echo.
  echo [ERREUR] Le serveur s'est arrete avec une erreur.
  echo Verifiez que PostgreSQL est lance et que DATABASE_URL est correcte dans %CONFIG_FILE%.
  pause
  exit /b 1
)

endlocal
