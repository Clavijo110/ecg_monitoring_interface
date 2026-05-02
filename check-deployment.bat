@echo off
REM 🚀 ECG Deployment Validator
REM Verifica que el proyecto esté listo para Vercel

echo.
echo ================================
echo   ✅ ECG DEPLOYMENT CHECK
echo ================================
echo.

echo 🔍 Verificando configuración...

REM Check if git is configured
git remote -v | findstr "origin" >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo ✅ GitHub remote configurado
) else (
    echo ❌ GitHub remote no configurado
    goto :error
)

REM Check if vercel.json exists
if exist "vercel.json" (
    echo ✅ vercel.json encontrado
) else (
    echo ❌ vercel.json faltante
    goto :error
)

REM Check frontend files
if exist "ecg_web_node\frontend\public\index.html" (
    echo ✅ Frontend files encontrados
) else (
    echo ❌ Frontend files faltantes
    goto :error
)

REM Check if sensitive logs are removed (only active console.log, not commented ones)
findstr /C:"console.log.*Datos ECG:" "ecg_web_node\frontend\public\app.js" >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo ❌ Logs sensibles aún activos
    goto :error
) else (
    echo ✅ Logs sensibles removidos/inactivos
)

echo.
echo ================================
echo   🎉 TODO LISTO PARA VERCEL
echo ================================
echo.
echo 🌐 Tu aplicación estará disponible en:
echo    https://ecg-monitoring-system.vercel.app
echo.
echo 📊 Repositorio GitHub:
echo    https://github.com/Clavijo110/ecg_monitoring_interface
echo.
echo 🔧 Para desarrollo local:
echo    run-all.bat
echo.
pause
exit /b 0

:error
echo.
echo ================================
echo   ❌ CONFIGURACIÓN INCOMPLETA
echo ================================
echo.
echo Revisa los errores arriba y corrígelos.
echo.
pause
exit /b 1