@echo off
REM 🔧 Vercel Troubleshooting Script
REM Soluciona problemas comunes de despliegue en Vercel

echo.
echo ================================
echo   🔧 VERCEL TROUBLESHOOTING
echo ================================
echo.

echo 🔍 Verificando configuración local...

REM Check if vercel.json exists and is valid
if exist "vercel.json" (
    echo ✅ vercel.json encontrado
    REM Check if it's valid JSON
    powershell -Command "try { Get-Content 'vercel.json' | ConvertFrom-Json | Out-Null; Write-Host '✅ vercel.json es JSON válido' } catch { Write-Host '❌ vercel.json tiene errores de sintaxis' }" 2>nul
) else (
    echo ❌ vercel.json no encontrado
    goto :error
)

REM Check if output directory exists
if exist "ecg_web_node\frontend\public" (
    echo ✅ Directorio de salida encontrado
    REM Count files in output directory
    for /f %%A in ('dir /b "ecg_web_node\frontend\public" 2^>nul ^| find /c /v ""') do set FILE_COUNT=%%A
    echo    📁 Archivos encontrados: !FILE_COUNT!
) else (
    echo ❌ Directorio de salida no encontrado
    goto :error
)

REM Check git status
echo.
echo 🔄 Verificando estado de Git...
git status --porcelain >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo ✅ Git está funcionando
    REM Check if there are uncommitted changes
    for /f %%i in ('git status --porcelain 2^>nul ^| find /c /v ""') do set CHANGES=%%i
    if !CHANGES! gtr 0 (
        echo ⚠️  Hay cambios sin commitear: !CHANGES!
        echo    Ejecuta: git add . && git commit -m "Update"
    ) else (
        echo ✅ No hay cambios pendientes
    )
) else (
    echo ❌ Git no está configurado correctamente
)

echo.
echo ================================
echo   🚀 SOLUCIONES PARA VERCEL
echo ================================
echo.

echo 1️⃣  FORZAR REDEPLOY EN VERCEL:
echo    • Ve a https://vercel.com/dashboard
echo    • Selecciona tu proyecto 'ecg-monitoring-system'
echo    • Ve a la pestaña 'Deployments'
echo    • Haz clic en 'Redeploy' en el último deployment
echo.

echo 2️⃣  VERIFICAR LOGS DE BUILD:
echo    • En Vercel, ve a Deployments
echo    • Haz clic en el deployment actual
echo    • Revisa la pestaña 'Functions' o 'Build Logs'
echo.

echo 3️⃣  VERIFICAR CONFIGURACIÓN:
echo    • Asegúrate de que el root directory en Vercel esté vacío (no configurado)
echo    • El vercel.json debe estar en la raíz del repositorio
echo.

echo 4️⃣  LIMPIAR CACHE Y REDEPLOY:
echo    • En Vercel: Settings → Git → Delete Cache
echo    • Luego haz un nuevo commit para forzar redeploy
echo.

echo 5️⃣  VERIFICAR URL:
echo    • URL esperada: https://ecg-monitoring-system.vercel.app
echo    • Si es diferente, actualiza el README
echo.

echo.
echo 💡 CONSEJO: Si nada funciona, desconecta y reconecta el repositorio en Vercel
echo.

pause
exit /b 0

:error
echo.
echo ================================
echo   ❌ PROBLEMAS ENCONTRADOS
echo ================================
echo.
echo Revisa los errores arriba antes de intentar redeploy.
echo.
pause
exit /b 1