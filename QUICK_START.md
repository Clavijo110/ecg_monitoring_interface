# 🚀 QUICK START - ECG desde CERO

## Paso 1: Backend ejecutando

```bash
cd c:\Users\Alejandro\Downloads\ecg_web_node_backend
npm start
```

✅ Deberías ver: `[APP] Servidor corriendo en puerto 3001`

---

## Paso 2: Arduino (Opción A - SIMULADOR)

**Si NO tienes Arduino físico:**

1. Descarga Arduino IDE: https://www.arduino.cc/en/software
2. Abre Arduino IDE
3. `File → Open` → Selecciona: `arduino_ecg_simulator.ino`
4. `Tools → Board` → Arduino Mega 2560 (o tu modelo)
5. `Tools → Port` → COM3 (o el que aparezca)
6. Click **Upload** ➡️
7. Espera: "Done uploading"
8. Abre **Serial Monitor** (Tools → Serial Monitor)
9. Velocidad: **115200** ⚠️
10. Deberías ver: `READY` y datos ECG

---

## Paso 3: Arduino (Opción B - ARDUINO REAL)

**Si TIENES Arduino real:**

1. Conecta Arduino por USB
2. Arduino IDE: Upload el código del tu Arduino
3. O copia el protocolo con tu código existente

---

## Paso 4: Frontend

Terminal Nueva:

```bash
cd c:\Users\Alejandro\Downloads\ecg_web_node\frontend
python -m http.server 3000 --directory public
```

Abre navegador:
```
http://localhost:3000
```

---

## Paso 5: Conectar Todo

En la app (http://localhost:3000):

1. **Click: "Actualizar puertos"**
   - Deberías ver tu COM (ej: COM3, COM4)

2. **Selecciona el puerto**
   - Elige COM que corresponda a Arduino

3. **Click: "Conectar"**
   - Deberías ver: "Conectado a COM3"

4. **¡Prueba botones!**
   - ✅ Derivada 1-6
   - ✅ Modo Auto
   - ✅ Modo Manual
   - ✅ Iniciar ECG
   - ✅ Detener ECG
   - ✅ Gráfica en vivo

---

## ✅ Verificación Rápida

| Elemento | Verificación | Status |
|----------|--------------|--------|
| Backend | `[APP] Servidor...` | ✅ |
| Arduino | Serial Monitor ve `READY` | ✅ |
| Frontend | Página carga en localhost:3000 | ✅ |
| Puertos | Aparecen en dropdown | ✅ |
| Conexión | "Conectado a COM3" | ✅ |
| ECG | Gráfica se actualiza | ✅ |
| Derivadas | Cada botón cambia forma | ✅ |
| BPM | Número cambia | ✅ |
| Marcapasos | Ocasionalmente = "Si" | ✅ |

---

## 🎓 Entender el Flujo

```
Arduino (Serial)
     ↓ Datos: "DATA,45,I,72,0"
Backend Node (Puerto 3001)
     ↓ WebSocket
Frontend React (localhost:3000)
     ↓ Gráfica + Controles
     ↓ Comando: "e" (Iniciar ECG)
Backend Node
     ↓ Serial: "e"
Arduino (Responde: "ACK,ECG_ON")
```

---

## 📋 Protocolo Arduino

**Arduino ENVÍA:**
```
READY                           # Inicio
DATA,ecg_value,derivada,bpm,mp # Cada 40ms
```

**Arduino RECIBE:**
```
e = Iniciar ECG        → ACK,ECG_ON
s = Detener ECG        → ACK,ECG_OFF
a = Modo Auto          → ACK,AUTO_ON
m = Modo Manual        → ACK,MANUAL_ON
1-6 = Derivada 1-6     → ACK,DERIVADA,I
```

---

## 🆘 Si Algo No Funciona

### "No veo puertos en dropdown"

```bash
# Verifica que backend está corriendo
# Terminal: http://localhost:3001
# Deberías ver JSON response

# En console del navegador (F12):
# Busca errores de conexión
```

### "Backend no se ejecuta"

```bash
# Reinstala dependencias
cd c:\Users\Alejandro\Downloads\ecg_web_node_backend
npm install
npm start
```

### "Arduino no envía datos"

```bash
# En Arduino IDE → Serial Monitor (115200 baud)
# Si ves BASURA: velocidad incorrecta
# Si ves nada: código no cargó o puerto incorrecto
```

### "Gráfica no se actualiza"

```bash
# F12 Console en navegador
# Busca errores relacionados a:
# - Backend URL
# - WebSocket conexión
# - Puerto serial
```

---

## 🎯 Próximos Pasos

1. ✅ Verifica todo funciona con simulador
2. ✅ Prueba todos los botones
3. ✅ Captura screenshots de gráficas
4. ✅ Cuando todo OK, reemplaza con Arduino real
5. ✅ Same protocol = mismo resultado

---

**¿Preguntas? Revisa los documentos detallados:**
- ARDUINO_SIMULATOR_GUIDE.md (instrucciones Arduino)
- SETUP_ARDUINO_VERCEL.md (arquitectura general)
- ARDUINO_DEPLOYED.md (cómo funciona todo)

**¡Empezamos! 🚀**
