@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "CONFIG_FILE=app.config.json"

echo.
echo =============================================
echo   HC-Manager - Installation Windows
echo =============================================
echo.

where powershell >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] PowerShell est requis pour lire/ecrire la configuration JSON.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js n'est pas installe ou n'est pas dans le PATH.
  echo Installez la version LTS depuis https://nodejs.org/ puis relancez setup.bat.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] npm n'est pas installe ou n'est pas dans le PATH.
  pause
  exit /b 1
)

if not exist "%CONFIG_FILE%" (
  echo [INFO] Creation de %CONFIG_FILE%...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$json=[ordered]@{app=[ordered]@{name='HC-Manager';host='127.0.0.1';port=3000;mode='dev';openBrowser=$true};database=[ordered]@{url='postgresql://postgres:postgres@127.0.0.1:5432/app_db'};setup=[ordered]@{installDependencies=$true;createEnvFile=$false;syncDrizzleConfig=$true;pushDatabaseSchema=$true}} | ConvertTo-Json -Depth 10; Set-Content -Encoding UTF8 '%CONFIG_FILE%' $json"
)

for /f "usebackq delims=" %%A in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$c=Get-Content -Raw '%CONFIG_FILE%' | ConvertFrom-Json; if($c.database.url){$c.database.url}else{'postgresql://postgres:postgres@127.0.0.1:5432/app_db'}"`) do set "DATABASE_URL=%%A"
for /f "usebackq delims=" %%A in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$c=Get-Content -Raw '%CONFIG_FILE%' | ConvertFrom-Json; if($null -ne $c.setup.installDependencies){$c.setup.installDependencies}else{$true}"`) do set "INSTALL_DEPS=%%A"
for /f "usebackq delims=" %%A in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$c=Get-Content -Raw '%CONFIG_FILE%' | ConvertFrom-Json; if($null -ne $c.setup.createEnvFile){$c.setup.createEnvFile}else{$true}"`) do set "CREATE_ENV=%%A"
for /f "usebackq delims=" %%A in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$c=Get-Content -Raw '%CONFIG_FILE%' | ConvertFrom-Json; if($null -ne $c.setup.syncDrizzleConfig){$c.setup.syncDrizzleConfig}else{$true}"`) do set "SYNC_DRIZZLE=%%A"
for /f "usebackq delims=" %%A in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$c=Get-Content -Raw '%CONFIG_FILE%' | ConvertFrom-Json; if($null -ne $c.setup.pushDatabaseSchema){$c.setup.pushDatabaseSchema}else{$true}"`) do set "PUSH_SCHEMA=%%A"

echo Configuration JSON : %CONFIG_FILE%
echo DATABASE_URL       : %DATABASE_URL%
echo.

if /I "%CREATE_ENV%"=="True" (
  echo [1/4] Creation de .env.local...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Set-Content -Encoding UTF8 '.env.local' ('DATABASE_URL=' + $env:DATABASE_URL)"
  if errorlevel 1 (
    echo [ERREUR] Impossible de creer .env.local.
    pause
    exit /b 1
  )
) else (
  echo [1/4] Creation de .env.local ignoree par la configuration.
)

if /I "%SYNC_DRIZZLE%"=="True" (
  echo [2/4] Synchronisation de drizzle.config.json avec app.config.json...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$path='drizzle.config.json'; if(Test-Path $path){$d=Get-Content -Raw $path | ConvertFrom-Json}else{$d=[pscustomobject]@{dialect='postgresql';schema='./src/db/schema.ts';dbCredentials=[pscustomobject]@{url=''}}}; if(-not $d.dbCredentials){$d | Add-Member -MemberType NoteProperty -Name dbCredentials -Value ([pscustomobject]@{url=''})}; $d.dialect='postgresql'; $d.schema='./src/db/schema.ts'; $d.dbCredentials.url=$env:DATABASE_URL; $d | ConvertTo-Json -Depth 10 | Set-Content -Encoding UTF8 $path"
  if errorlevel 1 (
    echo [ERREUR] Impossible de mettre a jour drizzle.config.json.
    pause
    exit /b 1
  )
) else (
  echo [2/4] Synchronisation Drizzle ignoree par la configuration.
)

if /I "%INSTALL_DEPS%"=="True" (
  echo [3/4] Installation des dependances npm...
  call npm install
  if errorlevel 1 (
    echo [ERREUR] npm install a echoue.
    pause
    exit /b 1
  )
) else (
  echo [3/4] Installation npm ignoree par la configuration.
)

if /I "%PUSH_SCHEMA%"=="True" (
  echo.
  echo [4/4] Schema PostgreSQL
  echo Assurez-vous que PostgreSQL est lance et que la base existe.
  echo Exemple attendu par defaut : postgres / postgres / app_db sur 127.0.0.1:5432
  choice /C ON /N /M "Appliquer le schema maintenant avec Drizzle ? [O/N] "
  if errorlevel 2 (
    echo Schema non applique. Commande pour plus tard : npx drizzle-kit push --config=drizzle.config.json
  ) else (
    call npx drizzle-kit push --config=drizzle.config.json
    if errorlevel 1 (
      echo.
      echo [ATTENTION] Le schema n'a pas pu etre applique.
      echo Verifiez PostgreSQL, la base app_db et DATABASE_URL dans %CONFIG_FILE%.
      echo Vous pourrez relancer plus tard : npx drizzle-kit push --config=drizzle.config.json
    )
  )
) else (
  echo [4/4] Push schema ignore par la configuration.
)

echo.
echo =============================================
echo Installation terminee.
echo Pour demarrer l'application : double-cliquez sur lancer.bat
echo URL par defaut : http://127.0.0.1:3000
echo =============================================
echo.
pause
endlocal
