# 🏗️ Monorepo Structure - Complete Guide

## 📋 Overview

Este repositorio ahora está **organizado como un monorepo** con carpetas separadas para Frontend y Backend. Esto elimina conflictos de despliegue y mantiene el código limpio.

### ✅ Beneficios

- ✓ **Separación clara** - Frontend y Backend en carpetas distintas
- ✓ **Sin mezcla de dependencias** - Cada parte tiene sus propios package.json
- ✓ **Despliegue seguro** - Vercel y Render saben dónde buscar archivos
- ✓ **Fácil onboarding** - Nuevos desarrolladores entienden la estructura
- ✓ **Mantenimiento simplificado** - Cambios aislados por componente

---

## 📁 Estructura Completa

```
ecg_monitoring_interface/
│
├── 📄 vercel.json                  # Config Vercel PRINCIPAL (apunta a frontend/public)
├── 📄 README.md                    # Docs generales del proyecto
├── 📄 .gitignore                   # Ignores globales
│
├── 📂 frontend/                    # 🌐 FRONTEND (React + Chart.js)
│   ├── 📂 public/                  # Archivos estáticos
│   │   ├── index.html              # Página HTML
│   │   ├── app.js                  # App React (~800 líneas)
│   │   ├── style.css               # Estilos CSS
│   │   └── debug.html              # Página debug
│   │
│   ├── 📄 package.json             # Dependencias frontend
│   ├── 📄 package-lock.json        # Lock de dependencias
│   ├── 📄 vercel.json              # Config Vercel LOCAL (copia)
│   ├── 📄 .gitignore               # Ignores frontend
│   ├── 📄 README.md                # Docs frontend
│   └── 📄 DEPLOYMENT_GUIDE.md      # Guía despliegue
│
├── 📂 backend/                     # 🔧 BACKEND (Node.js + Express)
│   ├── 📄 README.md                # Instrucciones backend
│   └── 📄 .gitkeep                 # Marca carpeta en git
│
└── 📂 .git/                        # Git history
```

---

## 🚀 Quick Start

### 1️⃣ Frontend - Desarrollo Local

```bash
# Navigate
cd frontend

# Install dependencies
npm install

# Run local server
python -m http.server 3000 --directory public

# Open browser
# http://localhost:3000
```

### 2️⃣ Backend - Desarrollo Local

```bash
# Navigate (desde otra terminal)
cd ../ecg_monitoring_interface_backend

# Install
npm install

# Start
npm start

# Backend runs on http://localhost:3001
```

### 3️⃣ Verify Connection

1. Open Frontend in browser: `http://localhost:3000`
2. Check DevTools Console (F12)
3. Should see: `📡 Backend: http://localhost:3001`

---

## 📦 Despliegue

### Opción A: Vercel (Recommended for Frontend)

**Automático:**
```bash
cd frontend
vercel --prod
```

**Manual:**
1. Ve a https://vercel.com
2. Importa repo: `ecg_monitoring_interface`
3. Vercel va a detectar automáticamente `vercel.json` en la raíz
4. Done! ✅

### Opción B: Manual Deploy

```bash
cd frontend
npm run build
# Deploy 'public/' folder manualmente
```

---

## 🔄 Git Workflow

### Cambios en Frontend

```bash
cd frontend
# Make changes
git add .
git commit -m "Add feature: ..."
git push origin main
```

### Cambios en Backend

```bash
cd ../ecg_monitoring_interface_backend
# Make changes
git add .
git commit -m "Add feature: ..."
git push origin main
```

### IMPORTANTE
- **No mezcles cambios** de ambas carpetas en un commit
- Cada repo tiene su propio flujo

---

## ⚙️ Configuración

### Frontend - vercel.json (Raíz)

```json
{
  "buildCommand": "echo 'Frontend static files'",
  "outputDirectory": "frontend/public",  // ⚠️ Importante!
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"      // Para SPA
    }
  ]
}
```

### Backend - Server Address

En `frontend/public/app.js`:
```javascript
const getBackendURL = () => {
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:3001';
  }
  return 'https://ecg-monitoring-backend.onrender.com';
};
```

---

## 📚 Documentación

| Documento | Contenido | Ubicación |
|-----------|-----------|-----------|
| Frontend Docs | Guía completa frontend | `frontend/README.md` |
| Deployment | Instrucciones deploy | `frontend/DEPLOYMENT_GUIDE.md` |
| Backend Setup | Cómo hacer deploy backend | `backend/README.md` |
| This File | Estructura monorepo | `MONOREPO_GUIDE.md` |

---

## 🆘 Troubleshooting

### Frontend no conecta a Backend
```bash
# Verifica que backend está corriendo en puerto 3001
curl http://localhost:3001/api/status

# Abre DevTools (F12) y revisa console
# Deberías ver logs de conexión
```

### Cambios en Frontend no se ven
```bash
# Restart servidor
cd frontend
python -m http.server 3000 --directory public

# Refresh navegador: Ctrl+Shift+R (hard refresh)
```

### Git confusion entre frontend y backend
```bash
# Sempre verifica dónde estás
pwd

# Y asegúrate de hacer commit en el repo correcto
git status
```

---

## 🎯 Mejores Prácticas

### ✅ DO

- ✓ Mantén frontend y backend en sus carpetas
- ✓ Instala dependencias en las carpetas correctas
- ✓ Hace commits separados por componente
- ✓ Documenta cambios en el README correspondiente
- ✓ Lee el DEPLOYMENT_GUIDE antes de hacer deploy

### ❌ DON'T

- ✗ No mezcles archivos de frontend en carpeta raíz
- ✗ No llames `npm install` en la raíz (a menos que tengas workspace)
- ✗ No copies archivos entre frontend/backend
- ✗ No changes vercel.json en la raíz sin entender qué hace
- ✗ No hagas force push sin estar seguro

---

## 📞 Support

Si hay problemas:

1. Verifica que estás en la carpeta correcta: `pwd`
2. Lee el README correspondiente (frontend/ o backend/)
3. Revisa documentación: `DEPLOYMENT_GUIDE.md`
4. Checkea logs en DevTools o terminal

---

## 🔗 Links Importantes

- **Frontend Repo**: https://github.com/Clavijo110/ecg_monitoring_interface
- **Backend Repo**: https://github.com/Clavijo110/ecg_monitoring_interface_backend
- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs

---

**🎉 Estructura lista para crecer sin conflictos**
