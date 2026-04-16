# 📋 Configuración Correcta - Arduino + Vercel

## 🎯 La Única Configuración que Funciona

```
┌─────────────────────────────────────┐
│         TU PC LOCAL                 │
│  ┌───────────────────────────────┐  │
│  │ Arduino (USB COM3)            │  │
│  └──────────┬────────────────────┘  │
│             │ USB Serial             │
│  ┌──────────▼────────────────────┐  │
│  │ Backend Node.js               │  │
│  │ npm start (Puerto 3001)       │  │
│  │ ⚠️ DEBE estar SIEMPRE activo  │  │
│  └──────────┬────────────────────┘  │
│             │ WebSocket              │
└─────────────┼─────────────────────────┘
              │
         ┌────▼───────┐
         │  Internet   │
         └────┬────────┘
              │
    ┌─────────▼─────────┐
    │   VERCEL (Remote) │
    │ Frontend React    │
    │ https://tu-app    │
    └───────────────────┘
              │
              ▼
    Navegador del Usuario
```

---

## 📝 Setup Definitivo

### 1️⃣ Backend - TU PC

```bash
# Carpeta: ecg_monitoring_interface_backend
cd ecg_monitoring_interface_backend

# Instalar
npm install

# CORRER SIEMPRE (mientras uses Arduino)
npm start

# Output esperado:
# ✓ Server running on http://localhost:3001
# ✓ Socket.io listening on port 3001
```

**IMPORTANTE:**
- ⚠️ Mantener esta terminal abierta SIEMPRE
- ⚠️ Si cierras terminal = Arduino NO funciona
- ⚠️ Backend SIEMPRE en `http://localhost:3001`

---

### 2️⃣ Frontend - VERCEL (Automático)

```bash
# Solo hacer UNA VEZ:
cd ecg_monitoring_interface

# Push a GitHub (si no está ya):
git add .
git commit -m "Deploy to Vercel"
git push origin main

# Vercel AUTOMÁTICAMENTE:
# 1. Detecta cambios en GitHub
# 2. Build proyecto
# 3. Deploy en ~60 segundos
# 4. URL: https://tu-app.vercel.app
```

**Verificar deploy:**
- Abre: https://tu-app.vercel.app
- DevTools (F12) → Console
- Deberías ver: `📡 Backend esperado: http://localhost:3001`

---

### 3️⃣ Arduino - TU PC

```bash
# Arduino IDE → Sketch
void setup() {
  Serial.begin(9600);  // ← IMPORTANTE: 9600
}

void loop() {
  Serial.println(analogRead(A0));
  delay(50);
}

# Upload a Arduino
# ✓ LED en Arduino parpadea (uploading)
# ✓ Conecta Arduino por USB
# ✓ Aparecerá en Device Manager como COM3, COM4, etc.
```

---

## 🚀 Usar la App

### Opción A: Desde tu PC

```
1. Backend: npm start (corriendo)
2. Navegador: http://localhost:3000
   (O: python -m http.server 3000 --directory frontend/public)
3. Selecciona puerto COM
4. Click "Conectar"
5. ✅ Datos mostrando
```

### Opción B: Desde ANY PC (via Vercel)

```
1. Backend: npm start (en TU PC)
2. Cualquier PC/Teléfono/Tablet: https://tu-app.vercel.app
3. Selecciona puerto COM (si está en ese PC)
4. O si Arduino está en otro PC, también funciona
5. ✅ Datos mostrando
```

---

## 🔧 Cambiar Backend URL (Si es necesario)

### Si quieres usar Render para backend:

⚠️ **Arduino NO va a funcionar. Ver:** [ARDUINO_RENDER_ISSUE.md](ARDUINO_RENDER_ISSUE.md)

1. Edita: `frontend/public/app.js`

```javascript
const getBackendURL = () => {
  return 'https://tu-backend.onrender.com';  // ← Arduino NO funciona aquí
};
```

2. Revertir cuando necesites Arduino:

```javascript
const getBackendURL = () => {
  return 'http://localhost:3001';  // ← Arduino funciona
};
```

---

## ✅ Checklist Final

- [ ] Backend clonado: `ecg_monitoring_interface_backend`
- [ ] Backend corriendo: `npm start`
- [ ] Backend en puerto 3001: `http://localhost:3001/api/status`
- [ ] Frontend pushed a GitHub
- [ ] Frontend deployado en Vercel
- [ ] Vercel URL funciona: `https://tu-app.vercel.app`
- [ ] Arduino conectado por USB
- [ ] Puerto COM aparece en dropdown
- [ ] Botón "Conectar" funciona
- [ ] Datos en tiempo real ✅

---

## 🆘 Troubleshooting

### "Frontend está en Vercel pero no conecta"

```
1. Verifica que backend está corriendo: npm start
2. Abre Vercel → DevTools (F12) → Console
3. Si ves error: "Failed to connect http://localhost:3001"
   → Backend NO está corriendo en tu PC
4. Solución: npm start en nueva terminal
```

### "Arduino conectado pero sin datos"

```
1. Backend corriendo? npm start
2. Arduino IDE → Serial Monitor → Ves números?
   - SI: Arduino OK, problema en backend
   - NO: Arduino no envía datos, revisa código
3. Verifica puerto COM es correcto
4. Revisa permiso puerto serial
```

### "App funciona en local pero no en Vercel"

```
1. Verifica frontend/public/app.js:
   getBackendURL() DEBE retornar 'http://localhost:3001'
2. Si está en Render: Arduino NO funcionará (esperado)
3. Para usar Render: Ver ARDUINO_RENDER_ISSUE.md
```

---

## 📚 Documentación Relacionada

- **ARDUINO_DEPLOYED.md** - Explicación general
- **ARDUINO_RENDER_ISSUE.md** - Por qué Render no funciona
- **ARDUINO_FIX.md** - Problemas y soluciones
- **LOCAL_SETUP.md** - Setup local detallado

---

## 🎯 Resumen

| Componente | Ubicación | URL | Estado |
|-----------|-----------|-----|--------|
| Arduino | Tu PC | COM3/COM4 | ✅ USB |
| Backend | Tu PC | localhost:3001 | ✅ npm start |
| Frontend (dev) | Tu PC | localhost:3000 | ✅ python -m http.server |
| Frontend (prod) | Vercel | https://tu-app | ✅ Auto-deploy |

**CLAVE:** Backend SIEMPRE en tu PC. Todo lo demás puede estar remoto.

---

**¡Setup listo! Backend siempre corriendo = Arduino funciona desde cualquier lugar! 🚀**
