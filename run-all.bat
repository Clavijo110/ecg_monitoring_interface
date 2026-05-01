@echo off
REM 🚀 Iniciar Sistema Completo ECG - Windows

echo.
echo ================================
echo   🏥 ECG SYSTEM LAUNCHER
echo ================================
echo.

REM Iniciar Backend en nueva ventana
echo [1/1] Iniciando Backend...
echo Matando procesos anteriores en puerto 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do taskkill /PID %%a /F 2>nul
start "ECG Backend Server" cmd /k "cd ecg_web_node_backend\ecg_web_node_backend\ecg_web_node_backend && "C:\Program Files\nodejs\npm.cmd" install && "C:\Program Files\nodejs\node.exe" server.js"

cls

echo.
echo SISTEMA INICIADO
echo.
echo INSTRUCCIONES:
echo.
echo 1  ABRIR EN NAVEGADOR:
echo    http://localhost:3001
echo.
echo 2  Conectar ESP32
echo.
pause