# 🔧 Arduino No Se Lee - Solución Paso a Paso

## ⚡ Solución Rápida (5 minutos)

### Paso 1: Verificar que Arduino esté conectado

```
Windows: Control Panel → Device Manager → Ports (COM & LPT)
Deberías ver algo como: "COM3 - USB Serial Device"

Si NO aparece:
- ❌ Arduino no conectado por USB
- ❌ Cable USB defectuoso
- ❌ Drivers no instalados

Solución:
1. Descarga drivers: https://www.arduino.cc/en/Guide/Windows
2. Reconecta Arduino
3. Reinicia terminal
```

### Paso 2: Verificar que Backend está corriendo

```bash
# Terminal 1️⃣
cd ecg_monitoring_interface_backend
npm install
npm start

# Deberías ver:
# ✓ Server running on http://localhost:3001
# ✓ Socket.io listening
```

**Si falla:**
```
Error: Cannot find module 'serialport'
→ npm install (de nuevo)

Error: EADDRINUSE: port 3001 already in use
→ Cerra otra terminal con backend corriendo
```

### Paso 3: Verificar que Frontend está corriendo

```bash
# Terminal 2️⃣
cd ecg_monitoring_interface/frontend
python -m http.server 3000 --directory public
# O: npx http-server public -p 3000
```

**Abre en navegador:**
```
http://localhost:3000
```

Deberías ver la interfaz ECG.

### Paso 4: Verificar conectividad Arduino

**En navegador (http://localhost:3000):**

1. Presiona **F12** para abrir DevTools
2. Ve a tab **Console**
3. Deberías ver logs:
   ```
   📡 Backend: http://localhost:3001
   ✅ Socket.io cargado
   ```

4. En la interfaz, deberías ver un **dropdown con puertos**
5. **Selecciona tu puerto COM** (ej: COM3)
6. Haz click en **"Conectar"**

---

## 🔍 Si Todo Falla - Diagnóstico Completo

```powershell
# Ejecuta script que detecta el problema
.\arduino-fix.ps1
```

Este script verifica:
- ✓ Puertos COM disponibles
- ✓ Backend corriendo
- ✓ Frontend accesible
- ✓ Conectividad backend-frontend

---

## ❌ Errores Comunes y Soluciones

### Error 1: "Puertos disponibles: 0"

**Significa:** Arduino no conectado o no detectado

**Soluciones:**
1. Verifica que Arduino esté conectado por USB
2. Mira Device Manager (Windows) - ¿Aparece COM port?
3. Instala drivers: https://www.arduino.cc/en/Guide/Windows
4. Reconecta Arduino
5. Reinicia todo

### Error 2: "Error cargando puertos: Failed to fetch"

**Significa:** Backend no responde

**Soluciones:**
1. Verifica que backend está corriendo: `npm start`
2. Verifica que está en puerto 3001: `http://localhost:3001/api/status`
3. Comprueba que no hay otro proceso usando puerto 3001:
   ```powershell
   netstat -ano | findstr :3001
   ```

### Error 3: "Conexión fallida"

**Significa:** Backend conectó pero puerto serial está ocupado

**Soluciones:**
1. Cierra Arduino IDE
2. Cierra otras aplicaciones que usen puerto serial
3. Reinicia backend: `npm start`
4. Intenta conectar de nuevo

### Error 4: "Arduino conectado pero sin datos"

**Significa:** Arduino no envía datos por serial

**Soluciones:**
1. Verifica que Arduino tiene código que envía serial:
   ```cpp
   void setup() {
     Serial.begin(9600);  // ← IMPORTANTE: 9600 baud
   }
   
   void loop() {
     Serial.println(analogRead(A0));  // ← Envía datos
     delay(50);
   }
   ```

2. Carga el código en Arduino IDE
3. Abre Serial Monitor en Arduino IDE y verifica que ves números
4. Si ves números en Serial Monitor, el Arduino está OK
5. Reconecta y prueba frontend de nuevo

---

## 📋 Checklist Completo

- [ ] Arduino conectado por USB
- [ ] Puerto COM aparece en Device Manager
- [ ] Backend corriendo (`npm start`)
- [ ] Backend responde: `curl http://localhost:3001/api/status`
- [ ] Frontend corriendo (`python -m http.server 3000`)
- [ ] Frontend accesible: `http://localhost:3000`
- [ ] DevTools Console muestra logs OK
- [ ] Arduino IDE Serial Monitor muestra datos
- [ ] Dropdown en frontend muestra puerto COM
- [ ] Botón "Conectar" clickeable
- [ ] ✅ Datos mostrando en gráfica

---

## 🚀 Orden Correcto para Iniciar

```
SIEMPRE EN ESTE ORDEN:

1. Terminal 1: Backend
   cd ecg_monitoring_interface_backend
   npm start
   (Espera hasta que diga "Server running")

2. Terminal 2: Frontend
   cd ecg_monitoring_interface/frontend
   python -m http.server 3000 --directory public
   (Espera hasta que diga "Serving")

3. Abre navegador: http://localhost:3000

4. Arduino conectado y dropdowndebería mostrar puertos
```

---

## 💡 Pro Tips

✓ Mantén ambas terminales abiertas (Backend + Frontend)  
✓ Revisa más en ARDUINO_TROUBLESHOOTING.md  
✓ Usa `./arduino-fix.ps1` para diagnóstico automático  
✓ Logs en DevTools (F12 → Console) muy útiles  
✓ Si no ves el dropdown, backend no está corriendo  

---

## 🆘 Ayuda Extra

- **Guía completa:** Ver `ARDUINO_TROUBLESHOOTING.md`
- **Setup local:** Ver `LOCAL_SETUP.md`
- **Deploy backend:** Ver `DEPLOY_BACKEND_RENDER.md`
- **Monorepo:** Ver `MONOREPO_GUIDE.md`

**Ejecuta para más debug:**
```powershell
.\arduino-fix.ps1
```

---

**¿Sigue sin funcionar? Ejecuta `arduino-fix.ps1` y copia el output 🔧**
