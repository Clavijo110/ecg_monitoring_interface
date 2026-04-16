# 🚀 Arduino + Despliegue Remoto = Funciona

## 🎯 Arquitectura Correcta

```
LOCAL PC:
  Arduino (COM3) 
    ↓ USB Serial
  Backend Node.js (node server.js)
    Puerto 3001
    ↓ WebSocket

REMOTO (Vercel):
  Frontend React
    http://localhost:3001 ← Conecta aquí
    ↓
Navegador del Usuario
```

## ⚡ Cómo Funciona

1. **Backend SIEMPRE en tu PC local** (`npm start`)
2. **Frontend puede estar:**
   - ✅ En tu PC local (http://localhost:3000)
   - ✅ O Desplegado en Vercel (https://tu-app.vercel.app)
3. **Ambos conectan al backend local** (http://localhost:3001)

## 🚀 Setup para Arduino + Despliegue

### Opción A: Frontend Local + Backend Local (Desarrollo)

**Terminal 1 - Backend:**
```bash
cd ecg_monitoring_interface_backend
npm start
# Puerto 3001
```

**Terminal 2 - Frontend:**
```bash
cd ecg_monitoring_interface/frontend
python -m http.server 3000 --directory public
# O: npx http-server public -p 3000
# Puerto 3000
```

**Navegador:**
```
http://localhost:3000
↓
Conecta a http://localhost:3001 ✅
```

---

### Opción B: Frontend Desplegado en Vercel + Backend Local

**Step 1: Deploy Frontend a Vercel**
```bash
cd ecg_monitoring_interface
# Vercel auto-despliega desde GitHub
# URL: https://tu-app.vercel.app
```

**Step 2: Backend Local (siempre)**
```bash
cd ecg_monitoring_interface_backend
npm start
# Puerto 3001 - Escucha conexiones
```

**Step 3: Abrir en Navegador**
```
https://tu-app.vercel.app
↓
Frontend en Vercel
↓
Conecta a http://localhost:3001 ✅
```

**⚠️ IMPORTANTE:**
- Backend debe estar corriendo en tu PC
- Frontend en Vercel accede al backend local via `http://localhost:3001`
- Esto funciona porque el navegador permite acceder a localhost desde cualquier dominio

---

## 📋 Checklist - Arduino + Despliegue

- [ ] Backend corriendo: `npm start`
- [ ] Backend responde: `curl http://localhost:3001/api/status`
- [ ] Arduino conectado por USB
- [ ] Frontend accesible (local o remoto)
- [ ] Frontend carga `app.js` correctamente
- [ ] DevTools Console no muestra errores
- [ ] Dropdown muestra puerto COM
- [ ] Botón "Conectar" funciona
- [ ] Datos mostrando en tiempo real

---

## 🔧 Configuración Automática

El `app.js` está configurado para:
```javascript
const getBackendURL = () => {
  return 'http://localhost:3001';  // SIEMPRE aquí
};
```

Esto significa:
- ✅ Frontend local → localhost:3001
- ✅ Frontend Vercel → localhost:3001 (del usuario)
- ✅ Frontend en IP local → localhost:3001

## ⚙️ Instalación Rápida

```bash
# 1. Terminal 1: Backend
cd ecg_monitoring_interface_backend
npm install
npm start

# 2. Terminal 2: Frontend
cd ecg_monitoring_interface/frontend

# Para local:
python -m http.server 3000 --directory public

# O para Vercel (deploy):
vercel --prod

# 3. Navegador
# Local: http://localhost:3000
# Vercel: https://tu-app.vercel.app
```

## 🆘 Si Algo Falla

### Error: "Failed to fetch" (localhost:3001)
- Backend NO está corriendo
- Abre nueva terminal: `cd ecg_monitoring_interface_backend && npm start`

### Error: No aparece dropdown
- Backend no responde
- Verifica: `curl http://localhost:3001/api/status`

### Arduino no conecta
- Puerto COM no aparece
- Driver no instalado: https://www.arduino.cc/en/Guide/Windows

### Frontend en Vercel pero no ve datos
- Backend local NO está corriendo
- Abre terminal: `cd ecg_monitoring_interface_backend && npm start`
- Luego recarga https://tu-app.vercel.app

---

## 🎯 Resumen

**La clave:** Backend SIEMPRE en tu PC, donde está Arduino

```
Arduino → Backend Local → Frontend (Local o Vercel)
```

Frontend no necesita estar en PC para funcionar, pero Backend SÍ.

---

## 📚 Más Info

- **Setup local:** Ver `LOCAL_SETUP.md`
- **Arduino help:** Ver `ARDUINO_FIX.md`
- **Deploy backend:** Ver `DEPLOY_BACKEND_RENDER.md`
- **Monorepo:** Ver `MONOREPO_GUIDE.md`

---

**✅ Arduino funciona igual en local o Vercel - Solo asegúrate que Backend esté corriendo en tu PC!**
