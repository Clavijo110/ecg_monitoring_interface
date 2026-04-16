#!/usr/bin/env powershell

# 🔍 Arduino Detection Diagnostic Script

Write-Host "`n" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🔍 ARDUINO DETECTION DIAGNOSTIC" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check 1: Arduino physically connected?
Write-Host "1️⃣  VERIFICAR CONEXIÓN FÍSICA" -ForegroundColor Yellow
Write-Host "   ├─ ¿Arduino conectado por USB?" -ForegroundColor Gray
Write-Host "   ├─ ¿Luz indicadora en Arduino encendida?" -ForegroundColor Gray
Write-Host "   └─ ¿Puerto USB funcionando?`n" -ForegroundColor Gray

# Check 2: Device Manager - list COM ports
Write-Host "2️⃣  PUERTO COM EN WINDOWS" -ForegroundColor Yellow
Write-Host "   Buscando puertos seriales...`n" -ForegroundColor Gray

$ports = Get-CimInstance -ClassName Win32_SerialPort 2>$null
if ($ports.Count -eq 0 -and $ports -ne $null) {
    $ports = @($ports)
}

if ($ports -and $ports.Count -gt 0) {
    Write-Host "   ✅ ENCONTRADOS:" -ForegroundColor Green
    $ports | ForEach-Object {
        Write-Host "      • $($_.Name) - $($_.Description)" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ NO SE ENCONTRÓ PUERTO SERIAL" -ForegroundColor Red
    Write-Host "   ⚠️  POSIBLES CAUSAS:" -ForegroundColor Yellow
    Write-Host "      - Arduino no conectado por USB" -ForegroundColor Gray
    Write-Host "      - Cable USB defectuoso" -ForegroundColor Gray
    Write-Host "      - Driver no instalado" -ForegroundColor Gray
    Write-Host "   📥 SOLUCIÓN:" -ForegroundColor Cyan
    Write-Host "      1. Descarga drivers: https://www.arduino.cc/en/Guide/Windows" -ForegroundColor Green
    Write-Host "      2. Reconecta Arduino" -ForegroundColor Green
    Write-Host "      3. Reinicia terminal" -ForegroundColor Green
}
Write-Host ""

# Check 3: Backend running?
Write-Host "3️⃣  BACKEND NODE.JS" -ForegroundColor Yellow
Write-Host "   Verificando si backend está corriendo en puerto 3001...`n" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/status" -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "   ✅ BACKEND CONECTADO" -ForegroundColor Green
    Write-Host "      http://localhost:3001 - Respondiendo`n" -ForegroundColor Green
    
    # Try to get ports from backend
    Write-Host "4️⃣  PUERTOS DETECTADOS POR BACKEND" -ForegroundColor Yellow
    $portsResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/ports" -TimeoutSec 2 -ErrorAction SilentlyContinue
    $portData = $portsResponse.Content | ConvertFrom-Json
    
    if ($portData.ports.Count -gt 0) {
        Write-Host "   ✅ ENCONTRADOS:" -ForegroundColor Green
        $portData.ports | ForEach-Object {
            Write-Host "      • $($_.path) - $($_.manufacturer)" -ForegroundColor Green
        }
    } else {
        Write-Host "   ❌ Backend no detecta puertos" -ForegroundColor Red
        Write-Host "   ⚠️  El Arduino sigue sin conectarse`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ BACKEND NO RESPONDE" -ForegroundColor Red
    Write-Host "   ⚠️  Backend no está corriendo en http://localhost:3001`n" -ForegroundColor Yellow
    
    Write-Host "   📋 SOLUCIÓN:" -ForegroundColor Cyan
    Write-Host "      Terminal 1 - Corre backend:" -ForegroundColor Green
    Write-Host "         cd ecg_monitoring_interface_backend" -ForegroundColor Cyan
    Write-Host "         npm install" -ForegroundColor Cyan
    Write-Host "         npm start" -ForegroundColor Cyan
    Write-Host "`n      Luego verifica de nuevo este script`n" -ForegroundColor Green
}

# Check 4: Arduino IDE Serial Monitor test
Write-Host "5️⃣  TEST CON ARDUINO IDE SERIAL MONITOR" -ForegroundColor Yellow
Write-Host "   1. Abre Arduino IDE" -ForegroundColor Green
Write-Host "   2. Tools → Port → Selecciona tu puerto (ej: COM3)" -ForegroundColor Green
Write-Host "   3. Tools → Serial Monitor" -ForegroundColor Green
Write-Host "   4. Baud Rate: 9600" -ForegroundColor Green
Write-Host "   5. Deberías ver números del sensor`n" -ForegroundColor Green

# Check 5: Frontend connectivity
Write-Host "6️⃣  FRONTEND CONNECTIVITY" -ForegroundColor Yellow
Write-Host "   1. Abre http://localhost:3000 en navegador" -ForegroundColor Green
Write-Host "   2. Presiona F12 (DevTools)" -ForegroundColor Green
Write-Host "   3. Abre tab 'Console'" -ForegroundColor Green
Write-Host "   4. Deberías ver logs como:" -ForegroundColor Gray
Write-Host "      📡 Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "      ✅ Socket.io cargado" -ForegroundColor Cyan
Write-Host "`n   ❌ Si ves 'Failed to fetch':" -ForegroundColor Red
Write-Host "      → Backend no está corriendo`n" -ForegroundColor Yellow

# Summary
Write-Host "7️⃣  RESUMEN Y PASOS SIGUIENTES" -ForegroundColor Yellow
Write-Host "`n   ORDEN CORRECTO PARA INICIAR:" -ForegroundColor Green
Write-Host "   ┌─ Terminal 1: Backend" -ForegroundColor Cyan
Write-Host "   │  $ cd ecg_monitoring_interface_backend" -ForegroundColor Gray
Write-Host "   │  $ npm start" -ForegroundColor Gray
Write-Host "   │  (Espera 'Server running on port 3001')" -ForegroundColor Gray
Write-Host "   │" -ForegroundColor Cyan
Write-Host "   ├─ Terminal 2: Frontend" -ForegroundColor Cyan
Write-Host "   │  $ cd ecg_monitoring_interface/frontend" -ForegroundColor Gray
Write-Host "   │  $ python -m http.server 3000 --directory public" -ForegroundColor Gray
Write-Host "   │  (O usa: npx http-server public -p 3000)" -ForegroundColor Gray
Write-Host "   │" -ForegroundColor Cyan
Write-Host "   ├─ Navegador: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   │  (Deberías ver interfaz ECG)" -ForegroundColor Gray
Write-Host "   │" -ForegroundColor Cyan
Write-Host "   └─ Arduino conectado por USB" -ForegroundColor Cyan
Write-Host "      (Si no aparece, revisa Device Manager)`n" -ForegroundColor Gray

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Para más help, lee: ARDUINO_TROUBLESHOOTING.md" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan
