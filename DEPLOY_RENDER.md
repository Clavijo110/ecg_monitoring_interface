# Guía Completa: Desplegar Frontend + Backend Funcional

Esta es la forma más simple de desplegar tu app para que **todo funcione exactamente igual** que en tu máquina local.

## ⚡ Resumen rápido

| Componente | Dónde | URL |
|-----------|-------|-----|
| **Frontend** (Interfaz) | Vercel | `https://tu-app.vercel.app` |
| **Backend** (Servidor) | Render | `https://tu-backend.onrender.com` |
| **Comunicación** | WebSocket Socket.io | Automática |

---

## 📋 Paso 1: Desplegar Backend en Render.com (PRIMERO)

### 1.1 Crear cuenta en Render
1. Ve a [render.com](https://render.com)
2. Click en "Get Started"
3. Registrate con GitHub (esto es importante)

### 1.2 Crear el servicio del backend
1. Click en "New +" → "Web Service"
2. Conecta tu repositorio GitHub `ecg_monitoring_interface`
3. Rellena los datos:

```
Name:                  ecg-monitoring-backend
Environment:           Node
Build Command:         npm install
Start Command:         node server.js
Plan:                  Free (suficiente)
```

4. Click "Create Web Service"

### 1.3 Copiar la URL del Backend
Una vez deployado (espera ~2-3 minutos), Render te mostrará una URL como:
```
https://ecg-monitoring-backend.onrender.com
```

**COPIA ESTA URL, LA NECESITARÁS EN EL SIGUIENTE PASO** ✅

---

## 🎨 Paso 2: Actualizar Frontend con la URL del Backend

En tu repositorio local, edita `Public/app.js` y busca esta línea (~227):

```javascript
return window.location.origin.includes('vercel.app') 
  ? 'https://ecg-monitoring-backend.onrender.com'
  : window.location.origin;
```

Reemplaza `https://ecg-monitoring-backend.onrender.com` con **tu URL real de Render** del Paso 1.

**Ejemplo:**
```javascript
return window.location.origin.includes('vercel.app') 
  ? 'https://tu-backend-12345.onrender.com'
  : window.location.origin;
```

Luego haz commit y push:
```bash
git add Public/app.js
git commit -m "Update backend URL to Render deployment"
git push origin main
```

---

## 🚀 Paso 3: Desplegar Frontend en Vercel

### 3.1 Conectar Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Click "New Project" 
3. Importa tu repositorio `ecg_monitoring_interface`

### 3.2 Configurar el despliegue
```
Framework:           Other (None)
Build Command:       (dejar vacío o: npm install)
Output Directory:    public
Install Command:     npm install --no-save
```

4. Click "Deploy"

**¡Listo!** Vercel debería decirte la URL en ~1-2 minutos:
```
https://tu-app.vercel.app
```

---

## ✅ Verificar que funciona

1. Abre tu URL de Vercel: `https://tu-app.vercel.app`
2. Debería verse exactamente igual que en tu máquina
3. Los botones deben funcionar
4. El gráfico debe actualizarse en tiempo real
5. Los logs deben mostrar eventos

Si algo no funciona, mira la **sección de troubleshooting** abajo.

---

## 🔄 Flujo de comunicación

```
┌─────────────────────────────────────────┐
│  Tu navegador                           │
│  https://tu-app.vercel.app              │
│  (Frontend: HTML, CSS, React)           │
└──────────────┬──────────────────────────┘
               │
               │ WebSocket Socket.io
               │
┌──────────────▼──────────────────────────┐
│  Servidor en Render                     │
│  https://tu-backend.onrender.com        │
│  (Backend: Node.js + Express + SerialPort)
│                                          │
│  – Gestiona puertos seriales             │
│  – Comunica con dispositivo ECG          │
│  – Envía datos en tiempo real            │
└──────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### "Connection refused" o "Cannot connect to backend"
**Causa**: La URL del backend en `app.js` es incorrecta.

**Solución**:
1. Verifica que copiaste bien la URL de Render
2. Edita `Public/app.js` y actualiza la URL
3. Push a GitHub: `git push origin main`
4. Espera a que Vercel redeploy automáticamente (~1 min)

### "404 NOT_FOUND" en Vercel
**Causa**: Probablemente falta el HTML principal.

**Solución**:
1. Verifica que `Public/index.html` existe
2. En settings de Vercel, asegúrate que "Output Directory" sea `public` (minúscula)

### Backend en Render se pone lento o "en hibernación"
**Causa**: El plan gratuito de Render duerme después de 15 min sin actividad.

**Solución**: 
- Upgrade a plan de pago (opcional)
- O accede a tu app cada 15 minutos para mantenerlo activo

### El dispositivo ECG no responde
**Causa**: SerialPort solo funciona con dispositivos USB reales conectados.

**Solución**:
- Si no tienes dispositivo USB: Edita `server.js` para usar datos simulados
- Los datos del gráfico en tiempo real seguirán funcionando igual

---

## 📝 Resumen de URLs para copiar/pegar

Una vez desplegado, estas serán tus URLs:

**Frontend (Vercel):**
```
https://tu-app.vercel.app
```

**Backend (Render):**
```
https://tu-backend-12345.onrender.com
```

La comunicación es automática. El frontend automáticamente va a conectar con el backend en Render cuando abras la app.

---

## 🎯 Para actualizar en el futuro

Si haces cambios en tu código:

**Para cambios en el frontend:**
```bash
git add .
git commit -m "Cambio en el frontend"
git push origin main
# Vercel redeploy automáticamente
```

**Para cambios en el backend:**
```bash
git add .
git commit -m "Cambio en el backend"
git push origin main
# Render redeploy automáticamente
```

---

## Preguntas frecuentes

**P: ¿Puedo usar otro servicio en lugar de Render?**
A: Sí, Railway.app, Fly.io, o Heroku también funcionan. El proceso es muy similar.

**P: ¿Puedo desplegar todo en un solo lugar?**
A: No, Vercel es solo para sitios estáticos. Necesitas dos servicios separados.

**P: ¿Se ve diferente en producción?**
A: No, debe verse y funcionar exactamente igual que en `localhost:3001`.

**P: ¿Cómo vuelvo a cambiar el backend si cambio de servidor?**
A: Solo edita la URL en `Public/app.js`, push a GitHub, y Vercel redeploy automáticamente.

