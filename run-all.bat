@echo off
REM 🚀 Iniciar Sistema Completo ECG - Windows

echo.
echo ================================
echo   🏥 ECG SYSTEM LAUNCHER
echo ================================
echo.

REM Detectar si está en el directorio correcto
if not exist "ecg_monitoring_interface_backend" (
    echo ❌ Error: Debes estar en la carpeta con ambos repos
    echo.
    echo Estructura requerida:
    echo   workspace/
    echo   ├── ecg_monitoring_interface_backend/
    echo   └── ecg_monitoring_interface/
    echo.
    pause
    exit /b 1
)

cls

echo 🚀 Iniciando componentes...
echo.

REM Iniciar Backend en nueva ventana
echo [1/2] Iniciando Backend en puerto 3001...
start "ECG Backend Server" cmd /k "cd ecg_monitoring_interface_backend && npm start"

REM Dar tiempo a que se inicie
timeout /t 3 /nobreak

REM Iniciar Frontend en nueva ventana
echo [2/2] Iniciando Frontend en puerto 3000...
start "ECG Frontend Server" cmd /k "cd ecg_monitoring_interface\frontend && python -m http.server 3000 --directory public || npx http-server public -p 3000"

cls

echo.
echo ✅ SISTEMA INICIADO
echo.
echo 📋 INSTRUCCIONES:
echo.
echo 1️⃣  ABRIR EN NAVEGADOR:
echo    http://localhost:3000
echo.
echo 2️⃣  CONECTAR ARDUINO:
echo    • Selecciona puerto COM del dropdown
echo    • Haz click "Conectar"
echo    • Verás datos en tiempo real
echo.
echo 3️⃣  DOS TERMINALES ESTÁN CORRIENDO:
echo    • Terminal 1: Backend (puerto 3001)
echo    • Terminal 2: Frontend (puerto 3000)
echo    NO CIERRES estas terminales mientras uses la app
echo.
echo ⚠️  IMPORTANTE PARA DESPLIEGUE:
echo    • Frontend:  Vercel (automático)
echo    • Backend:   Debe estar SIEMPRE corriendo localmente
echo    • Arduino:   Conectado por USB a tu PC
echo.
echo 📖 Documentación: Ver README.md o ARDUINO_DEPLOYED.md
echo.
echo ❌ CERRAR SISTEMA:
echo    Cierra ambas terminales (Backend y Frontend)
echo.
pause
