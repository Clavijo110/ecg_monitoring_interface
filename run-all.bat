@echo off
REM ECG Monitoring System Launcher - Windows
REM Inicia el sistema completo ECG (Backend + Frontend)

echo.
echo ================================
echo     ECG MONITORING SYSTEM
echo ================================
echo.

REM Obtener el directorio del script
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

REM Verificar si estamos en el directorio correcto
if not exist "%SCRIPT_DIR%\ecg_web_node_backend" (
    echo ERROR: No se encuentra la carpeta ecg_web_node_backend
    echo Asegúrate de ejecutar este script desde la raíz del proyecto
    pause
    exit /b 1
)

echo Directorio del proyecto: %SCRIPT_DIR%
echo.

echo Verificando Node.js...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js no está instalado o no está en el PATH
    echo Instala Node.js desde: https://nodejs.org
    echo O agrega Node.js al PATH de Windows
    pause
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: npm no está instalado o no está en el PATH
    echo Instala Node.js desde: https://nodejs.org
    pause
    exit /b 1
)

echo Node.js encontrado
echo.

REM Matar procesos anteriores en puerto 3001
echo Matando procesos anteriores en puerto 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING 2^>nul') do (
    echo Matando proceso PID %%a
    taskkill /PID %%a /F >nul 2>nul
)
timeout /t 2 /nobreak >nul

REM Navegar al directorio del backend
echo Navegando al directorio del backend...
cd /d "%SCRIPT_DIR%\ecg_web_node_backend"

REM Verificar e instalar dependencias
echo Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ❌ ERROR: Falló la instalación de dependencias
        pause
        exit /b 1
    )
) else (
    echo Dependencias ya instaladas
)

echo.
echo Todo listo. Iniciando servidor...
echo.

REM Iniciar el servidor en nueva ventana
start "ECG Backend Server" cmd /k "cd /d %SCRIPT_DIR%\ecg_web_node_backend && npm start"

REM Esperar un momento para que el servidor inicie
timeout /t 3 /nobreak >nul

cls
echo.
echo ================================
echo     SISTEMA ECG INICIADO
echo ================================
echo.
echo SERVIDOR DISPONIBLE EN:
echo    http://localhost:3001
echo.
echo INSTRUCCIONES:
echo.
echo 1. ABRIR EN NAVEGADOR:
echo    http://localhost:3001
echo.
echo 2. Conectar dispositivo ESP32
echo.
echo 3. El servidor se ejecuta en segundo plano
echo.
echo Presiona cualquier tecla para cerrar esta ventana
echo.
pause >nul