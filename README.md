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

## Despliegue en Vercel

### Opción 1: Deploy directo desde GitHub

1. Conecta tu repositorio a Vercel
2. Vercel detectará automáticamente la configuración de `vercel.json`
3. El despliegue se realizará automáticamente

### Opción 2: Deploy con CLI de Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel

# Deploy en producción
vercel --prod
```

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
