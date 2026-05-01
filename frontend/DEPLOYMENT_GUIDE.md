# 🚀 Guía Completa de Despliegue

Esta guía explica cómo desplegar la aplicación completa de ECG Monitoring en producción.

## 📋 Estructura del Proyecto

### Frontend (este repositorio)
- **Repositorio**: https://github.com/Clavijo110/ecg_monitoring_interface.git
- **Desplegar en**: Vercel
- **Tipo**: Sitio estático (HTML + CSS + JS desde CDN)

### Backend (repositorio separado)
- **Repositorio**: https://github.com/Clavijo110/ecg_monitoring_interface_backend.git
- **Desplegar en**: Render.com (o Railway/Fly.io)
- **Tipo**: Node.js + Express + Socket.io + SerialPort

---

## 🎯 Orden de Despliegue

**IMPORTANTE**: Desplegar Backend PRIMERO, luego Frontend.

### Paso 1️⃣: Desplegar Backend en Render.com

#### 1.1 Preparar Backend
```bash
# En el repositorio backend
cd ecg_monitoring_interface_backend
git add .
git commit -m "Preparar para Render"
git push origin main
```

#### 1.2 Desplegar en Render
1. Ve a https://render.com
2. Click "New +" → "Web Service"
3. Conecta el repositorio: `ecg_monitoring_interface_backend`
4. Configura:
   ```
   Name:                ecg-monitoring-backend
   Environment:         Node
   Build Command:       npm install
   Start Command:       node server.js
   Plan:                Free (o Starter para producción)
   ```
5. Click "Create Web Service"
6. **Espera 2-3 minutos a que termine**

#### 1.3 Copiar URL del Backend
Una vez desplegado, Render te mostrará una URL como:
```
https://ecg-monitoring-backend.onrender.com
```

📌 **ANOTA ESTA URL** - La necesitarás para el siguiente paso

---

### Paso 2️⃣: Actualizar Frontend con URL del Backend

#### 2.1 Editar `Public/app.js`
1. Abre `Public/app.js` en tu editor
2. Busca la línea ~229 (función `getBackendURL()`):

```javascript
return window.location.origin.includes('vercel.app') 
  ? 'https://ecg-monitoring-backend.onrender.com'
  : window.location.origin;
```

3. Reemplaza `https://ecg-monitoring-backend.onrender.com` con **tu URL real de Render**

**Ejemplo:**
```javascript
return window.location.origin.includes('vercel.app') 
  ? 'https://ecg-monitoring-backend-abc123.onrender.com'
  : window.location.origin;
```

#### 2.2 Commit y Push
```bash
# En el repositorio frontend
cd ecg_monitoring_interface
git add Public/app.js
git commit -m "Update backend URL to Render deployment"
git push origin main
```

---

### Paso 3️⃣: Desplegar Frontend en Vercel

#### 3.1 Conectar a Vercel
1. Ve a https://vercel.com
2. Click "New Project"
3. Importa el repositorio: `ecg_monitoring_interface`

#### 3.2 Configurar Despliegue
```
Framework:           Other (None)
Output Directory:    Public
Install Command:     npm install --no-save
Build Command:       (dejar vacío)
Environment:         (dejar por defecto)
```

**Nota**: Vercel servará automáticamente los archivos estáticos de la carpeta `Public/`

#### 3.3 Deploy
Click "Deploy" y espera a que termine (~2 minutos)

**Vercel te dará una URL:**
```
https://ecg-monitoring-interface.vercel.app
```

---

## ✅ Verificar que Funciona

1. **Abre la URL de Vercel** en tu navegador:
   ```
   https://ecg-monitoring-interface.vercel.app
   ```

2. **Deberías ver**:
   - ✅ Interfaz completa cargada (no solo un color)
   - ✅ Status "Socket conectado" en los logs
   - ✅ Gráfico renderizado
   - ✅ Botones de controles funcionales

3. **Si la página está en blanco o solo muestra un color**:
   - Abre F12 → Console
   - Verifica que no hay errores de 404
   - El script: `/socket.io/socket.io.js` debe cargarse desde el backend en Render
   - Revisa que la URL del backend sea correcta en `Public/index.html`

4. **Si algo no funciona**:
   - Abre la consola (F12)
   - Busca mensajes de error
   - Verifica que la URL del backend sea correcta en `Public/index.html`
   - Verifica que el backend en Render está corriendo sin errores

---

## 🔄 Actualizar Código en Producción

### Si cambias el Frontend:
```bash
# Hacer cambios en Public/
git add .
git commit -m "Descripción del cambio"
git push origin main
# Vercel redeploy automáticamente (~1-2 min)
```

### Si cambias el Backend:
```bash
# En repositorio backend/
git add .
git commit -m "Descripción del cambio"
git push origin main
# Render redeploy automáticamente (~2-3 min)
```

---

## 📊 Diagrama de Arquitectura

```
┌────────────────────────────────────┐
│   Tu Navegador                     │
│   https://...........................|────────────┐
│                                    │            │
│   ┌──────────────────────────────┐ │            │
│   │ Frontend (Vercel)            │ │            │
│   │ ├─ index.html                │ │            │
│   │ ├─ app.js (React)            │ │            │
│   │ └─ style.css                 │ │            │
│   └──────────────────────────────┘ │            │
└────────────────────────────────────┘            │
               │                                  │
               │ WebSocket (Socket.io)            │
               │                                  │
               └──────────────────────────────────┤
                                                 │
            ┌────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────┐
│   Backend (Render)                 │
│   https://ecg-monitoring-backend.. │
│                                    │
│   ┌──────────────────────────────┐ │
│   │ Node.js + Express            │ │
│   │ ├─ Socket.io (WebSocket)     │ │
│   │ ├─ REST API (/api/*)         │ │
│   │ └─ SerialPort                │ │
│   └──────────────────────────────┘ │
│             │                       │
│             ▼                       │
│   Dispositivo ECG (USB)           │
└────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### "Connection refused" / Backend no conecta
**Causa**: URL del backend en `app.js` es incorrecta

**Solución**:
1. Verifica la URL en Render.com
2. Edita `Public/app.js` con la URL correcta
3. Push a GitHub
4. Espera a que Vercel redeploy (1-2 min)

### "Socket timeout" / Backend en hibernación
**Causa**: Render free tier se duerme después de 15 min sin actividad

**Solución**:
- Accede a la app cada 15 minutos (clic en URL)
- O upgrade a plan de pago en Render

### Gráfico no actualiza
**Causa**: Socket.io no conecta con el backend

**Solución**:
1. Abre F12 → Console
2. Busca mensaje "Socket conectado"
3. Si no aparece, verifica:
   - URL del backend en `app.js`
   - Backend está corriendo en Render
   - No hay CORS errors

### "404 NOT_FOUND" en Vercel
**Causa**: Output directory configurado incorrectamente

**Solución**:
1. Ve a Vercel → Settings → Build & Deployment
2. Verifica "Output Directory" = `public` (minúscula)
3. Redeploy

---

## 📱 Alternativas de Despliegue

### Backend Alternativas (en lugar de Render):
- **Railway.app** - Interface moderna
- **Fly.io** - Más robusto, mejor rendimiento
- **Heroku** - Clásico, pero de pago ahora

### Frontend Alternativas (en lugar de Vercel):
- **Netlify** - Similar a Vercel
- **GitHub Pages** - Para estático puro (sin Socket.io)

---

## 🔗 URLs Importantes

| Servicio | URL |
|----------|-----|
| Frontend (Vercel) | https://ecg-monitoring-interface.vercel.app |
| Backend (Render) | https://ecg-monitoring-backend.onrender.com |
| Repo Frontend | https://github.com/Clavijo110/ecg_monitoring_interface |
| Repo Backend | https://github.com/Clavijo110/ecg_monitoring_interface_backend |

---

## 💡 Tips

1. **Mantén ambos repositorios sincronizados**: Siempre haz push a ambos
2. **Verifica los logs**: 
   - Vercel: Settings → Logs
   - Render: Logs tab
3. **CORS**: Ya está configurado en el backend para aceptar solicitudes de cualquier origen
4. **WebSocket**: Usa Socket.io cliente que viene con el servidor

---

## 📞 Soporte

Si algo no funciona:
1. Verifica los pasos en orden
2. Lee los logs en Vercel y Render
3. Abre la consola (F12) y busca errores
4. Verifica que ambos repositorios estén al día

---

**¡Listo! Tu aplicación ECG está en producción.** 🎉
