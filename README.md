# 🏥 ECG Monitoring Interface

**Interfaz de monitoreo ECG en tiempo real** - Dashboard médico futurista con conexión ESP32

## ✨ Características

- 🎨 **UI Futurista**: Dashboard médico profesional con estética dark y glassmorphism
- 📊 **ECG en Tiempo Real**: Visualización de señal ECG desde ESP32
- 🔄 **Modos Automático/Manual**: Control inteligente de derivadas
- 🌐 **WebSocket**: Comunicación en tiempo real
- 📱 **Responsive**: Funciona en desktop y móvil
- 🔧 **Auto-conexión**: Detecta automáticamente puertos seriales

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** 16+
- **ESP32** con firmware ECG
- **Arduino IDE** (para subir código al ESP32)

### Instalación

1. **Clona el repositorio**
   ```bash
   git clone <tu-repositorio>
   cd ecg_workspace
   ```

2. **Instala dependencias del backend**
   ```bash
   cd ecg_web_node_backend
   npm install
   ```

3. **Instala dependencias del frontend** (opcional, para desarrollo)
   ```bash
   cd ../frontend
   npm install
   ```

### Ejecución

#### 🚀 **Opción 1: Inicio Automático (Recomendado)**

**Windows:**
```bash
# Desde la raíz del proyecto
run-all.bat
```
Este script automáticamente:
- Verifica que Node.js esté instalado
- Instala dependencias si es necesario
- Inicia el backend en una nueva ventana
- Mata procesos anteriores en el puerto 3001

**Linux/Mac:**
```bash
# Desde la raíz del proyecto
./start-backend.sh
```

#### 🔧 **Opción 2: Inicio Manual**

1. **Sube el código al ESP32**
   - Abre `esp32_ecg_real.ino` en Arduino IDE
   - Selecciona la placa ESP32 correcta
   - Sube el código

2. **Inicia el backend**
   ```bash
   cd ecg_web_node_backend
   npm start
   ```
   El backend estará disponible en `http://localhost:3001`

3. **Abre el frontend**
   - Abre `ecg_web_node/frontend/public/index.html` en tu navegador
   - O usa un servidor local si prefieres

#### 📜 **Scripts Disponibles**

- `run-all.bat` - Windows: Inicia todo automáticamente
- `start-backend.bat` - Windows: Solo backend
- `start-backend.sh` - Linux/Mac: Solo backend
- `validate.bat` - Windows: Valida que el proyecto esté correctamente configurado

## 📁 Estructura del Proyecto

```
ecg_workspace/
├── ecg_web_node/              # Proyecto principal
│   ├── frontend/
│   │   ├── public/           # Archivos estáticos del frontend
│   │   │   ├── index.html
│   │   │   ├── app.js
│   │   │   └── style.css
│   │   └── package.json
│   └── README.md
├── ecg_web_node_backend/      # Backend Node.js
│   ├── server.js             # Servidor principal
│   ├── esp32_ecg_real.ino    # Código ESP32
│   ├── package.json
│   └── upload-final.ps1      # Script para subir código
└── run-all.bat              # Script para ejecutar todo
```

## 🔧 Configuración

### Variables de Entorno (Opcional)

Crea un archivo `.env` en la carpeta del backend:

```env
PORT=3001
SERIAL_RAW_LOG=0
SERIAL_RAW_INTERVAL_MS=200
```

### Puertos Seriales

El backend detecta automáticamente los puertos seriales disponibles. Si tienes múltiples dispositivos, puedes especificar cuál usar modificando el código de auto-conexión.

## 🎯 Uso

1. **Conexión**: El sistema se conecta automáticamente al ESP32
2. **Modo**: Selecciona entre Automático (cambia derivadas solo) o Manual
3. **ECG**: Presiona "Iniciar ECG" para comenzar la monitorización
4. **Derivadas**: Selecciona I, II, III, aVR, aVL, aVF
5. **Monitor**: Visualiza la señal ECG en tiempo real

## 🔍 Solución de Problemas

### Script `run-all.bat` no funciona
- **Node.js no encontrado**: Asegúrate de que Node.js esté instalado y en el PATH
- **Directorio incorrecto**: Ejecuta el script desde la raíz del proyecto (`ecg_workspace/`)
- **Puertos ocupados**: El script intenta matar procesos en el puerto 3001 automáticamente

### El ESP32 no se conecta
- Verifica que el ESP32 esté conectado y tenga el firmware correcto
- Revisa la consola del navegador para mensajes de error
- Verifica que no haya otros programas usando el puerto serial

### La interfaz no carga
- Asegúrate de que el backend esté ejecutándose en el puerto 3001
- Verifica que los archivos del frontend estén en la ruta correcta
- Revisa la consola del navegador para errores de JavaScript

### Problemas de permisos
- En Windows: Ejecuta el backend como administrador si hay problemas con puertos seriales
- En Linux/Mac: Asegúrate de tener permisos para acceder a dispositivos USB

## � Despliegue en Vercel

### Configuración del Repositorio

1. **El código ya está subido a GitHub:**
   ```bash
   # Repositorio: https://github.com/Clavijo110/ecg_monitoring_interface
   # Ya configurado y listo para despliegue
   ```

2. **Despliegue automático en Vercel:**
   - El repositorio ya está conectado a Vercel
   - Los cambios se despliegan automáticamente
   - URL de producción: [https://ecg-monitoring-system.vercel.app](https://ecg-monitoring-system.vercel.app)

3. **Accede a tu aplicación:**
   - ✅ **Frontend público**: Interfaz web disponible 24/7
   - ✅ **Backend local**: Ejecuta `run-all.bat` para comunicación ESP32
   - ✅ **Datos seguros**: Sin logs sensibles en consola

### Notas del Despliegue

- ✅ **Frontend estático**: Solo se despliega la interfaz web
- ✅ **Backend local**: El backend Node.js debe ejecutarse localmente para la comunicación con ESP32
- ✅ **WebSocket**: La comunicación en tiempo real requiere el backend local
- ✅ **Datos seguros**: Los datos sensibles no se muestran en consola

### Arquitectura del Despliegue

```
🌐 Vercel (Frontend Estático)
    ↓
🏠 Local Backend (Node.js + WebSocket)
    ↓
🔌 ESP32 (Datos ECG)
```

## 👨‍💻 Autor

**Alejandro Clavijo**