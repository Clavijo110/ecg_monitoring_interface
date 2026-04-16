# ECG Monitoring Interface - Frontend

Interfaz moderna y responsiva para monitoreo de ECG en tiempo real. Construida con React 18 y Chart.js.

## 🎯 Características

- 🎨 Diseño glassmorphism moderno
- 📊 Visualización dual de señales (ECG + Marcapasos)
- 🎯 Toggle independiente para cada señal (mínimo una siempre activa)
- 📱 Responsive design (desktop, tablet, mobile)
- ⚡ Comunicación en tiempo real vía WebSocket (Socket.io)
- 📝 Log en vivo de eventos del sistema
- 🎛️ Controles intuitivos para el dispositivo

## 🏗️ Tecnologías

- **React 18** - Framework UI (CDN unpkg)
- **Chart.js** - Visualización de datos en tiempo real
- **Socket.io** - Comunicación bidireccional WebSocket
- **CSS Moderno** - Glassmorphism, CSS variables, grid responsivo

## 📁 Estructura

```
.
├── Public/
│   ├── index.html        # Entrada HTML con CDN imports
│   ├── app.js           # Aplicación React completa (~1000 líneas)
│   └── style.css        # Estilos glassmorphism (~600 líneas)
├── package.json         # Dependencias
└── README.md
```

## 🚀 Uso Local

### Requisitos
- Backend corriendo en http://localhost:3001
- Navegador moderno (Chrome, Firefox, Safari, Edge)

### Pasos

1. **Clonar y acceder**
```bash
git clone https://github.com/Clavijo110/ecg_monitoring_interface.git
cd ecg_monitoring_interface
```

2. **Iniciar backend** (en otra terminal)
```bash
# Ver: https://github.com/Clavijo110/ecg_monitoring_interface_backend
# Clonar, instalar, y ejecutar:
npm install
node server.js
```

3. **Abrir en navegador**
```
http://localhost:3001
```

## 🌐 Despliegue en Vercel

### Paso 1: Conectar a Vercel
```
1. Ve a https://vercel.com
2. Click "New Project"
3. Importa este repositorio (ecg_monitoring_interface)
4. Configura:
   - Framework: Other (None)
   - Output Directory: public
   - Install Command: npm install --no-save
5. Click "Deploy"
```

### Paso 2: Actualizar URL del Backend

Edita `Public/app.js` línea ~229:

```javascript
// Busca:
return window.location.origin.includes('vercel.app') 
  ? 'https://ecg-monitoring-backend.onrender.com'
  : window.location.origin;

// Reemplaza con tu URL real del backend en Render:
return window.location.origin.includes('vercel.app') 
  ? 'https://tu-backend-real.onrender.com'
  : window.location.origin;
```

### Paso 3: Push a GitHub
```bash
git add Public/app.js
git commit -m "Update backend URL to Render"
git push origin main
```

Vercel desplegará automáticamente.

## 🔗 Componentes React

### App (Componente Principal)
**Estados:**
- `ports`, `selectedPort`, `connected`, `portName`, `statusMessage`
- `derivada`, `bpm`, `mp`, `logs`, `lastEvent`
- `mode` (manual/auto), `showECG`, `showMP`

**Funciones Clave:**
- `loadPorts()` - Cargar puertos seriales disponibles
- `connectPort()` - Conectar a un puerto
- `sendCommand(cmd, label)` - Enviar comando al dispositivo
- `toggleShowECG()`, `toggleShowMP()` - Toggle de señales (validado)
- `refreshChart(point, mpPoint)` - Actualizar gráfico
- `buildWavePoint(value)` - Generar puntos ECG
- `buildMPPoint(active)` - Generar puntos marcapasos

### Chart.js Setup
- **Datasets**: 2 (ECG púrpura #8b5cf6, Marcapasos cyan #06b6d4)
- **Puntos**: 42-point sliding window
- **Updates**: Sin animación (mejor rendimiento)
- **Rango Y**: 0.3 a 2.4

## 🔌 API del Backend

**Endpoints REST:**
```
GET  /api/ports              → Listar puertos seriales
POST /api/connect            → Conectar a puerto
GET  /api/status             → Estado de conexión
POST /api/cmd                → Enviar comando
```

**WebSocket Events:**
```
← serial_status    → {connected: bool, port: string}
← serial_data      → {tipo, derivada, bpm, mp, ...}
← serial_tx        → {cmd: string}
← serial_raw       → {raw: string}
```

## 🎨 Personalización

### Cambiar colores
Edita `Public/style.css` variables CSS:
```css
--surface: #0f172a;     /* Fondo */
--accent: #7c3aed;      /* Color principal púrpura */
--success: #22c55e;     /* Verde */
--danger: #ef4444;      /* Rojo */
```

### Cambiar colores de gráfico
En `Public/app.js`, busca la configuración de Chart.js:
```javascript
borderColor: "#8b5cf6",     // ECG
borderColor: "#06b6d4",     // Marcapasos
```

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| "Cannot connect to backend" | Verifica URL en `app.js`, backend corriendo |
| "404 NOT_FOUND en Vercel" | Asegúrate Output Dir = `public` |
| "Gráfico no actualiza" | Abre F12 → Console, verifica Socket.io |
| "Puerto serial no aparece" | Conecta dispositivo USB, click "Actualizar" |
| "CommandError: No device found" | Dispositivo USB desconectado o sin permisos |

## 📊 Despliegue Completo

### Flujo Recomendado:

```
1. Push Backend a GitHub
   ↓
2. Deploy Backend en Render.com
   ↓ (copiar URL)
3. Actualizar Frontend con URL del Backend
   ↓
4. Push Frontend a GitHub
   ↓
5. Deploy Frontend en Vercel (auto)
```

**Resultado Final:**
```
┌─────────────────────────────────────┐
│ https://tu-app.vercel.app           │ ← Frontend
│ (React + Chart.js)                  │
└──────────────┬──────────────────────┘
               │ WebSocket
               ↓
┌──────────────────────────────────────┐
│ https://tu-backend.onrender.com      │ ← Backend
│ (Node.js + Socket.io + SerialPort)   │
└──────────────────────────────────────┘
```

## 📦 Repositorios Relacionados

- **Frontend (este)**: https://github.com/Clavijo110/ecg_monitoring_interface.git
- **Backend**: https://github.com/Clavijo110/ecg_monitoring_interface_backend.git

## 📝 Licencia

MIT

## 👤 Autor

Alejandro Clavijo
