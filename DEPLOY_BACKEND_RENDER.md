# 🚀 Desplegar Backend en Render.com

## 📋 Requisitos

- Cuenta en https://render.com (gratis)
- Repositorio backend en GitHub: https://github.com/Clavijo110/ecg_monitoring_interface_backend.git
- Usuario debe tener push access al repo

---

## 🎯 Pasos para Despliegue

### 1️⃣ Preparar Backend (Local)

```bash
# Clone (si no u tienes)
git clone https://github.com/Clavijo110/ecg_monitoring_interface_backend.git
cd ecg_monitoring_interface_backend

# Verifica que tiene:
# - package.json (con "start": "node server.js")
# - server.js (archivo principal)
# - Código que corre en puerto 3001
```

**Checklist:**
- ✓ `npm install` funciona sin errores
- ✓ `npm start` inicia en puerto 3001
- ✓ Endpoints responden: GET `/api/status`

### 2️⃣ Crear Web Service en Render

1. Ve a https://render.com
2. Click en **"New +"** → **"Web Service"**
3. Click **"Connect repository"** → selecciona `ecg_monitoring_interface_backend`
4. Autoriza Render a acceder a tu GitHub

### 3️⃣ Configurar Deployment

**Llena los campos:**

| Campo | Valor |
|-------|-------|
| **Name** | `ecg-monitoring-backend` |
| **Environment** | `Node` |
| **Region** | `Singapore` (cercano a ti) o `Frankfurt` |
| **Branch** | `main` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` o `node server.js` |
| **Plan** | `Free` (o `Standard` si quieres mejor uptime) |

### 4️⃣ Variables de Entorno (si necesita)

Si el backend usa `.env`:

1. Scroll down a **"Environment Variables"**
2. Agrega cada variable:
   ```
   NODE_ENV = production
   PORT = 3001
   ```

### 5️⃣ Deploy

Click **"Create Web Service"**

⏳ Render va a:
1. Clonar el repo
2. Correr `npm install`
3. Correr `npm start`
4. Generar una URL automáticamente (ej: `https://ecg-monitoring-backend.onrender.com`)

**⌛ Espera 2-5 minutos** a que termine

---

## ✅ Verificar Deploy

Una vez tenga la URL:

```bash
# Test 1: Verificar que backend responde
curl https://ecg-monitoring-backend.onrender.com/api/status

# Test 2: Obtener puertos
curl https://ecg-monitoring-backend.onrender.com/api/ports

# Test 3: Ver logs en Render
# Ve a Render → tu Web Service → Logs
```

---

## 🔗 Actualizar Frontend con URL del Backend

Una vez tengas la URL de Render (ej: `https://ecg-monitoring-backend.onrender.com`):

### Opción A: Automático

Si usas la URL por defecto (`ecg-monitoring-backend.onrender.com`), **no necesitas cambiar nada**. El frontend ya tiene esa URL hardcodeada.

### Opción B: Manual

Si tienes URL diferente, edita `frontend/public/app.js`:

```javascript
const getBackendURL = () => {
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:3001';
  }
  return 'https://tu-url-aqui.onrender.com';  // 👈 Cambiar aquí
};
```

Luego commit y push:
```bash
cd frontend
git add public/app.js
git commit -m "Update backend URL to Render deployment"
git push origin main
# Vercel auto-redeploy
```

---

## 🛠️ Troubleshooting

### Build Falla
```
Error: Cannot find module 'serialport'
```
**Solución**: En `package.json`, `serialport` debe estar en `dependencies`, no en `devDependencies`

### Port binding issue
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Solución**: Render asigna automáticamente puerto. El backend debe usar:
```javascript
const PORT = process.env.PORT || 3001;
```

### Backend no responde
1. Verifica logs en Render dashboard
2. Comprueba que endpoint existe: `/api/status`
3. Verifica headers CORS:
```javascript
const cors = require('cors');
app.use(cors());
```

### Render sleep issue (Free Plan)
En el plan Free, Render apaga el servidor después de 30min sin uso.

**Soluciones:**
- Upgrade a plan pagado
- Usa https://uptimerobot.com para hacer ping cada 5 minutos

---

## 📊 Checklist Final

- [ ] Backend repo en GitHub
- [ ] Render Web Service creado
- [ ] Build exitoso
- [ ] Backend URL generada (ej: `https://ecg-monitoring-backend.onrender.com`)
- [ ] `/api/status` responde ✓
- [ ] Frontend actualizado con backend URL
- [ ] Frontend redeployed en Vercel
- [ ] Todo conectado y funcionando ✓

---

## 🔗 Links Útiles

- **Render Docs**: https://render.com/docs
- **Node.js on Render**: https://render.com/docs/deploy-node-express-app
- **Backend Repo**: https://github.com/Clavijo110/ecg_monitoring_interface_backend
- **Socket.io Guide**: https://socket.io/docs/v4/

---

## 💡 Pro Tips

✓ Usa la URL automática de Render en el frontend (`ecg-monitoring-backend.onrender.com`)  
✓ Guarda la URL en `.env` o variables de Render  
✓ Revisa logs regularmente: Render Dashboard → Logs  
✓ Para desarrollo local: `npm start` en el backend  
✓ Para producción: Render maneja todo automáticamente  

---

**¡Backend en Render en 5 minutos! 🚀**
