# ECG Monitoring Interface

Interfaz web moderna y profesional para monitoreo de ECG en tiempo real con control serial y visualización dual de señales (ECG y Marcapasos).

## Características

- 🎨 **Interfaz Modern**: Diseño glassmorphism oscuro con gradientes suaves
- 📊 **Gráficas en Tiempo Real**: Visualización de dos señales simultáneamente (ECG y Marcapasos)
- 🔌 **Control Serial**: Conexión y comunicación con puertos seriales
- 🎮 **Controles Intuitivos**: Toggle de señales, selección de derivadas, modos manual/automático
- 📱 **Responsive**: Adaptable a cualquier dispositivo
- 🔄 **Socket.io**: Comunicación bidireccional en tiempo real
- 📋 **Registro de Eventos**: Panel de actividad del sistema

## Requisitos

- Node.js >= 14
- npm o yarn
- Puerto serie USB (para dispositivo ECG real)

## Instalación

```bash
# Clonar repositorio
git clone https://github.com/Clavijo110/ecg_monitoring_interface.git
cd ecg_web_node

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm start
# O ejecutar directamente
node server.js
```

La aplicación estará disponible en `http://localhost:3001`

## Despliegue en Vercel + Render

**IMPORTANTE:** Vercel es solo para el frontend (sitio estático). El backend con acceso a puertos seriales no puede ejecutarse en Vercel. Necesitas desplegar el backend en un servicio que soporte Node.js persistente.

### Opción A: Frontend en Vercel + Backend en Render (RECOMENDADO)

#### 1. Desplegar Frontend en Vercel

1. Conecta tu repositorio de GitHub a Vercel
2. En configuración de Vercel:
   - **Framework**: None
   - **Build Command**: (dejar vacío)
   - **Output Directory**: `public`
3. Deploy automático

```bash
# O desplegar manualmente
vercel --prod
```

#### 2. Desplegar Backend en Render

1. Ve a [render.com](https://render.com)
2. Crea nuevo servicio "New Web Service"
3. Conecta tu repositorio GitHub
4. Configura:
   - **Name**: ecg-monitoring-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free tier está bien para pruebas
5. Agregar variables de entorno si es necesario
6. Deploy

#### 3. Actualizar URL del Backend

En `public/app.js`, reemplaza:
```javascript
const socket = io();
```

Con:
```javascript
const backendURL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : 'https://tu-backend-en-render.onrender.com';
const socket = io(backendURL);
```

### Opción B: Deploy Local + Exposición con Ngrok

Si prefieres mantenerlo todo en tu máquina:

```bash
# Terminal 1: Ejecutar backend localmente
node server.js

# Terminal 2: Exponer con ngrok
ngrok http 3001

# Copiar URL de ngrok (ej: https://xxxx-xxxx-xxx.ngrok.io)
# Usar esa URL en app.js para el backend
```

### Opción C: Despliegue completo en otro servicio (Railway/Heroku)

Para un flujo completo (frontend + backend juntos), considera:
- [Railway.app](https://railway.app)
- [Render.com](https://render.com)

Estos servicios soportan aplicaciones Node.js+Express completas.

## Estructura del Proyecto

```
ecg_web_node/
├── server.js              # Backend Express con Socket.io
├── package.json           # Dependencias
├── vercel.json           # Configuración de Vercel
├── .vercelignore         # Archivos a ignorar en Vercel
└── Public/
    ├── index.html        # HTML principal
    ├── app.js            # Interfaz React
    └── style.css         # Estilos modernos
```

## Tecnologías

- **Backend**: Express.js, Socket.io, SerialPort
- **Frontend**: React (CDN), Chart.js
- **Hosting**: Vercel
- **Estilos**: CSS vanilla con variables CSS

## API Endpoints

- `GET /api/ports` - Lista puertos seriales disponibles
- `POST /api/connect` - Conectar a un puerto serial
- `GET /api/status` - Obtener estado de conexión
- `POST /api/cmd` - Enviar comando al ESP32

## Eventos WebSocket

- `serial_status` - Estado de conexión serial
- `serial_data` - Datos del ECG en tiempo real
- `serial_tx` - Comando transmitido
- `serial_raw` - Datos crudos recibidos

## Configuración de Puertos

El servidor escucha en el puerto especificado por la variable de entorno `PORT`, o puerto `3001` por defecto.

En Vercel, el puerto se asigna automáticamente y se almacena en `process.env.PORT`.

## Licencia

MIT

## Autor

Alejandro Clavijo
