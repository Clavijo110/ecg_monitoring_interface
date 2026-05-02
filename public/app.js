const { useState, useEffect, useRef } = React;

// Backend local para Arduino
const getBackendURL = () => {
  return "http://localhost:3001";
};

function App() {
  // console.log("🔄 Inicializando ECG App...");
  const [ports, setPorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState("");
  const [connected, setConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState("ESP32 listo");
  const [derivada, setDerivada] = useState("I");
  const [bpm, setBpm] = useState("---");
  const [logs, setLogs] = useState([]);
  const [lastEvent, setLastEvent] = useState("Sin eventos recientes");
  const [mode, setMode] = useState("auto");
  const [hasRealData, setHasRealData] = useState(false);
  const [currentDerivada, setCurrentDerivada] = useState("I");
  const [isEcgOn, setIsEcgOn] = useState(true);
  const [deviceName, setDeviceName] = useState("ESP32");
  const autoConnectAttempted = useRef(false);
  const derivadaDataBuffer = useRef({}); // Buffer de datos por derivada para calcular rangos
  const BUFFER_SIZE_PER_DERIVADA = 100; // Mantener 100 puntos por derivada para calcular rango

  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const chartNeedsUpdate = useRef(false);
  const lastDataTime = useRef(0);

  // ESP32 manda DATA cada 2 muestras; si internamente toma a 250 Hz,
  // al frontend llegan ~125 muestras/seg.
  const DISPLAY_FS = 125;
  const WINDOW_SECONDS = 5;
  const BUFFER_SIZE = DISPLAY_FS * WINDOW_SECONDS;

  const timestamp = () =>
    new Date().toLocaleTimeString("es-ES", { hour12: false });

  const addLog = (message, variant = "info") => {
    const line = `[${timestamp()}] ${message}`;
    setLogs((current) => [...current.slice(-119), line]);
  };

  const setStatus = (message) => {
    if (message === "ESP32 listo") {
      setStatusMessage(message);
    }
    addLog(message);
  };

  const mapDerivadaToIndex = (label) => {
    const normalized = String(label || "").trim().toUpperCase();
    const map = {
      "I": "I",
      "II": "II",
      "III": "III",
      "AVR": "aVR",
      "AVL": "aVL",
      "AVF": "aVF",
      "1": "I",
      "2": "II",
      "3": "III",
      "4": "aVR",
      "5": "aVL",
      "6": "aVF"
    };
    return map[normalized] || currentDerivada || "I";
  };

  const derivadaMap = {
    "I": "1",
    "II": "2",
    "III": "3",
    "aVR": "4",
    "aVL": "5",
    "aVF": "6"
  };

  const getButtonClass = (base, active) => {
    return `btn ${base} ${active ? "active" : ""}`.trim();
  };

  const DERIVADA_RANGES = {
    I: { min: -1200, max: -300 },
    II: { min: -1400, max: -200 },
    III: { min: -1000, max: -400 },
    aVR: { min: -1200, max: -300 },
    aVL: { min: -1300, max: -250 },
    aVF: { min: -1350, max: -200 },
    AVR: { min: -1200, max: -300 },
    AVL: { min: -1300, max: -250 },
    AVF: { min: -1350, max: -200 }
  };

  const ADC_MAX_VOLT = 3.3;

  const adcToMilliVolts = (ecgValue) => {
    const raw = Number(ecgValue);
    if (Number.isNaN(raw)) return 0;

    const volts = (raw / 4095) * ADC_MAX_VOLT;
    const centered = volts - ADC_MAX_VOLT / 2.0;
    return centered * 1000.0;
  };

  const calculateDynamicRange = (derivada) => {
    // Escala estática: ±2.5V = ±2500mV
    return {
      min: -2500,
      max: 2500
    };
  };

  const setChartYRangeFromDerivada = (deriv) => {
    if (!chartInstance.current) return;

    // Escala estática: ±2.5V
    chartInstance.current.options.scales.y.min = -2500;
    chartInstance.current.options.scales.y.max = 2500;
    chartNeedsUpdate.current = true;

    // Actualizar inmediatamente
    if (chartInstance.current) {
      chartInstance.current.update();
      chartNeedsUpdate.current = false;
    }
  };

  const pushECGPoint = (ecgValue, derivada) => {
    if (!chartInstance.current) {
      return;
    }

    const point = adcToMilliVolts(ecgValue);

    // Almacenar dato en buffer por derivada
    if (!derivadaDataBuffer.current[derivada]) {
      derivadaDataBuffer.current[derivada] = [];
    }
    derivadaDataBuffer.current[derivada].push(point);
    if (derivadaDataBuffer.current[derivada].length > BUFFER_SIZE_PER_DERIVADA) {
      derivadaDataBuffer.current[derivada].shift();
    }

    const data = chartInstance.current.data.datasets[0].data;

    data.push(point);
    if (data.length > BUFFER_SIZE) {
      data.shift();
    }

    chartNeedsUpdate.current = true;

    // Actualizar inmediatamente
    if (chartInstance.current) {
      chartInstance.current.update();
      chartNeedsUpdate.current = false;
    }
  };

  const clearChart = () => {
    if (!chartInstance.current) return;

    chartInstance.current.data.datasets[0].data = Array.from(
      { length: BUFFER_SIZE },
      () => 0
    );
    chartNeedsUpdate.current = true;

    // Limpiar buffers de datos por derivada
    derivadaDataBuffer.current = {};
  };

  const loadPorts = async () => {
    try {
      setStatus("Buscando ESP32...");
      const backendUrl = getBackendURL();
      const res = await fetch(`${backendUrl}/api/ports`);
      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "No se obtuvo respuesta correcta");
      }

      setPorts(data.ports);
      if (data.ports.length > 0) {
        setSelectedPort(data.ports[0].path);
      }

      addLog(`Puertos disponibles: ${data.ports.length}`);
      return data.ports;
    } catch (error) {
      setStatus("No se encontró ESP32");
      addLog(`Error cargando puertos: ${error.message}`, "error");
      return [];
    }
  };

  const connectPort = async (portPath) => {
    const portToUse = portPath || selectedPort;
    console.log("🔌 Intentando conectar a puerto:", portToUse);
    if (!portToUse) {
      console.warn("⚠️ No se encontró puerto serial");
      addLog("No se encontró puerto serial", "warn");
      setStatus("Buscando ESP32...");
      return false;
    }

    try {
      setStatus(`Conectando a ESP32...`);
      const backendUrl = getBackendURL();
      const res = await fetch(`${backendUrl}/api/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portPath: portToUse })
      });
      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Error al conectar");
      }

      setConnected(true);
      setDeviceName("ESP32");
      setStatus("ESP32 listo");
      addLog(data.message, "info");
      return true;
    } catch (error) {
      setConnected(false);
      setStatus("ESP32 sin conexión");
      addLog(`Error de conexión: ${error.message}`, "error");
      return false;
    }
  };

  const checkStatus = async () => {
    try {
      const backendUrl = getBackendURL();
      const res = await fetch(`${backendUrl}/api/status`);
      const data = await res.json();

      if (data.connected) {
        setConnected(true);
        setDeviceName("ESP32");
        setStatus("ESP32 listo");
      } else {
        setConnected(false);
        setStatus("Buscando ESP32");
      }
    } catch (error) {
      setConnected(false);
      setStatus("Error consultando estado");
      addLog(`Error de estado: ${error.message}`, "error");
    }
  };

  const sendCommand = async (cmd, label, isAutoMaintain = false) => {
    console.log(`📤 Enviando comando: ${cmd} (${label})`, isAutoMaintain ? "[AUTO]" : "");
    if (!connected) {
      console.warn("⚠️ Comando rechazado: ESP32 no conectado");
      addLog("Necesita conectar antes de enviar comandos", "warn");
      setStatus("Esperando conexión ESP32");
      return;
    }

    try {
      setStatus(`${label}...`);
      const backendUrl = getBackendURL();
      const res = await fetch(`${backendUrl}/api/cmd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cmd })
      });
      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Fallo al enviar comando");
      }

      console.log(`✅ Comando enviado exitosamente: ${cmd}`);
      addLog(`Comando enviado: ${label}`);

      if (cmd === "e") {
        console.log("🫀 ECG INICIADO - Limpiando gráfica");
        clearChart();
        setIsEcgOn(true);
        setStatus("ECG iniciado");
      }

      if (cmd === "s") {
        console.log("⏹️ ECG DETENIDO");
        setIsEcgOn(false);
        setStatus("ECG detenido");
      }

      if (cmd === "a" && !isAutoMaintain) {
        console.log("🤖 MODO AUTOMÁTICO activado");
        setMode("auto");
        setStatus("Modo automático");
      }

      if (cmd === "m") {
        console.log("👤 MODO MANUAL activado");
        setMode("manual");
        setStatus("Modo manual");
      }

      // Mapeo de comandos numéricos a derivadas
      const derivadaNumToName = { "1": "I", "2": "II", "3": "III", "4": "aVR", "5": "aVL", "6": "aVF" };
      
      if (["1", "2", "3", "4", "5", "6"].includes(cmd)) {
        const derivadaName = derivadaNumToName[cmd];
        console.log(`📊 Cambiando a derivada: ${derivadaName} (cmd: ${cmd})`);
        setDerivada(derivadaName);
        setCurrentDerivada(derivadaName);
        
        // Si estamos en modo automático, después de cambiar derivada, 
        // enviar comando de modo automático para mantenerlo
        if (mode === "auto") {
          console.log("🔄 Manteniendo modo automático después de cambio de derivada");
          setStatus(`Auto derivada ${derivadaName}`);
          // Enviar comando de modo automático después de un pequeño delay
          setTimeout(() => {
            sendCommand("a", "Mantener modo automático", true);
          }, 100);
        } else {
          setStatus(`Derivada ${derivadaName}`);
        }
      }
    } catch (error) {
      addLog(`Error comando ${label}: ${error.message}`, "error");
      setStatus("Error enviando comando");
    }
  };

  // Crear gráfica
  useEffect(() => {
    const ctx = chartRef.current.getContext("2d");

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: Array.from({ length: BUFFER_SIZE }, (_, i) => i.toString()),
        datasets: [
          {
            label: "ECG en vivo",
            data: Array.from({ length: BUFFER_SIZE }, () => 0),
            borderColor: "#8B5CF6",
            backgroundColor: "rgba(139, 92, 246, 0.08)",
            borderWidth: 2,
            tension: 0,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: {
            display: false
          },
          y: {
            display: true,
            min: -2000,
            max: 500,
            ticks: {
              display: true,
              callback: (v) => `${v} mV`
            },
            grid: {
              color: "rgba(148,163,184,0.12)"
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, []);

  // Refresco visual como respaldo (solo si falla la actualización inmediata)
  useEffect(() => {
    const repaint = setInterval(() => {
      if (chartInstance.current && chartNeedsUpdate.current) {
        chartInstance.current.update();
        chartNeedsUpdate.current = false;
      }
    }, 1000);

    return () => clearInterval(repaint);
  }, []);

  // Actualización periódica del rango dinámico
  useEffect(() => {
    const rangeUpdateInterval = setInterval(() => {
      if (currentDerivada && derivadaDataBuffer.current[currentDerivada]?.length >= 10) {
        setChartYRangeFromDerivada(currentDerivada);
      }
    }, 2000); // Actualizar rango cada 2 segundos

    return () => clearInterval(rangeUpdateInterval);
  }, [currentDerivada]);
  useEffect(() => {
    const init = async () => {
      console.log("🚀 Iniciando aplicación ECG...");
      const ports = await loadPorts();
      console.log(`🔍 Puertos encontrados: ${ports.length}`, ports);
      await checkStatus();

      if (ports.length > 0 && !autoConnectAttempted.current) {
        console.log("🔄 Intentando conexión automática al primer puerto disponible");
        autoConnectAttempted.current = true;
        await connectPort(ports[0].path);
      } else if (ports.length === 0) {
        console.log("⚠️ No se encontraron puertos seriales");
      }
    };

    init();

    const socketConfig = window.socketConfig || {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      transports: ["websocket", "polling"]
    };

    let socket = null;

    if (typeof io === "undefined") {
      addLog(
        "Cliente Socket.io no está disponible en la página. No se podrá recibir datos en tiempo real.",
        "warn"
      );
      setStatus("Socket cliente no disponible");
    } else {
      try {
        socket = io(getBackendURL(), socketConfig);

        socket.on("connect", () => {
          console.log("🔗 Socket.io CONECTADO al backend");
          setStatus("✅ Socket conectado");
          addLog("Socket.io conectado");
        });

        socket.on("connect_error", (error) => {
          console.error("❌ Error de conexión Socket.io:", error.message);
          addLog(`Error al conectar Socket.io: ${error.message}`, "error");
          setStatus("Error conectando a backend");
        });

        socket.on("mensaje", (data) => {
          console.log("💬 Mensaje WS recibido:", data);
          addLog(`WS: ${JSON.stringify(data)}`);
        });

        socket.on("serial_status", (data) => {
          console.log("📡 Estado serial:", data.connected ? "CONECTADO" : "DESCONECTADO");
          const connectedState = !!data.connected;
          setConnected(connectedState);
          setDeviceName("ESP32");
          setStatus(connectedState ? "ESP32 listo" : "Buscando ESP32");
        });

        socket.on("serial_tx", (data) => {
          addLog(`TX -> ${data.cmd}`);
        });

        // No loguear cada raw porque atrasa la UI.
        socket.on("serial_raw", (data) => {
          if (
            typeof data.raw === "string" &&
            !data.raw.startsWith("DATA,")
          ) {
            addLog(`RX raw -> ${data.raw}`);
          }
        });

        socket.on("serial_data", (data) => {
          if (data.tipo === "DATA" || data.tipo === "REAL_DATA") {
            // Log reducido: datos sensibles no se muestran en consola
            // console.log(`📊 Datos ECG: ${data.ecg}mV | Derivada: ${data.derivada} | BPM: ${data.bpm}`);
            const derivIndex = mapDerivadaToIndex(data.derivada);

            setDerivada(derivIndex);
            setCurrentDerivada(derivIndex);
            setBpm(Number(data.bpm).toFixed(1));
            setLastEvent("Datos actualizados");
            setHasRealData(true);
            lastDataTime.current = Date.now();

            setChartYRangeFromDerivada(derivIndex);
            pushECGPoint(data.ecg, derivIndex);
          }

          if (data.tipo === "ACK_DERIVADA") {
            const derivIndex = mapDerivadaToIndex(data.derivada);
            setDerivada(derivIndex);
            setCurrentDerivada(derivIndex);
            setChartYRangeFromDerivada(derivIndex);
            setLastEvent("Derivada actualizada");
            addLog(`Derivada -> ${data.derivada || "---"}`);
          }

          if (data.tipo === "AUTO_DERIVADA") {
            const derivIndex = mapDerivadaToIndex(data.derivada);
            setDerivada(derivIndex);
            setCurrentDerivada(derivIndex);
            setChartYRangeFromDerivada(derivIndex);
            setMode("auto");
            setStatus(`Modo automático - derivada ${derivIndex}`);
            setLastEvent("Modo auto activado");
            addLog(`Auto derivada -> ${data.derivada || "---"}`);
          }

          if (data.tipo === "ACK_ECG_ON") {
            setStatus("ECG iniciado");
            setLastEvent("ECG activado");
            addLog("ACK_ECG_ON");
          }

          if (data.tipo === "ACK_ECG_OFF") {
            setStatus("ECG detenido");
            setLastEvent("ECG detenido");
            addLog("ACK_ECG_OFF");
          }

          if (data.tipo === "ACK_AUTO_ON") {
            setMode("auto");
            setStatus("Modo automático");
            setLastEvent("Auto encendido");
            addLog("ACK_AUTO_ON");
          }

          if (data.tipo === "ACK_MANUAL_ON") {
            setMode("manual");
            setStatus("Modo manual");
            setLastEvent("Manual activado");
            addLog("ACK_MANUAL_ON");
          }

          if (data.tipo === "READY") {
            setStatus("ESP32 listo");
            setLastEvent("Dispositivo listo");
            addLog("READY");
          }
        });

        socket.on("disconnect", () => {
          console.log("🔌 Socket.io DESCONECTADO del backend");
          setConnected(false);
          setStatus("Socket desconectado");
          addLog("Socket desconectado", "warn");
        });
      } catch (err) {
        addLog(`Error inicializando Socket.io: ${err.message}`, "error");
        setStatus("Error inicializando socket");
      }
    }

    return () => {
      if (socket && typeof socket.disconnect === "function") {
        socket.disconnect();
      }
    };
  }, []);

  // Si se pierde la señal real, limpiar estado pero NO meter señal falsa
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      if (hasRealData && now - lastDataTime.current > 5000) {
        setHasRealData(false);
        setDerivada("---");
        setBpm("---");
        setLastEvent("Sin señal - ESP32 desconectado");
        addLog("Señal perdida - ESP32 desconectado", "warn");
      }
    }, 500);

    return () => clearInterval(interval);
  }, [hasRealData]);

  return React.createElement(
    "div",
    { className: "app-shell" },
    React.createElement(
      "div",
      { className: "topbar" },
      React.createElement(
        "div",
        { className: "brand" },
        React.createElement("span", null, "ECG Control Center"),
        React.createElement(
          "div",
          null,
          React.createElement("h1", null, "Interfaz de monitoreo ECG"),
          React.createElement(
            "p",
            { className: "subtitle" },
            "Visualización de ECG real desde ESP32 en tiempo real."
          )
        )
      ),
      React.createElement(
        "div",
        { className: "status-pill" },
        React.createElement("span", { className: "dot" }),
        "ESP32 listo"
      )
    ),
    React.createElement(
      "div",
      { className: "grid-surface" },
      React.createElement(
        "div",
        { className: "card" },
        React.createElement(
          "div",
          { className: "section-title" },
          React.createElement("h2", null, "Dispositivo ESP32"),
          React.createElement("p", null, "Conexión automática y estado en tiempo real.")
        ),
        React.createElement(
          "div",
          { className: "device-panel" },
          React.createElement("span", { className: "device-label" }, deviceName),
          React.createElement(
            "p",
            { className: "device-status" },
            connected ? "Conectado automáticamente" : "Buscando ESP32"
          )
        )
      ),
      React.createElement(
        "div",
        { className: "card" },
        React.createElement(
          "div",
          { className: "section-title" },
          React.createElement("h2", null, "Indicadores clave"),
          React.createElement("p", null, "Resumen rápido del estado del ECG.")
        ),
        React.createElement(
          "div",
          { className: "metric-grid" },
          React.createElement(
            "div",
            { className: "metric-card" },
            React.createElement("h3", null, "Estado"),
            React.createElement("p", { className: "metric-highlight" }, statusMessage),
            React.createElement(
              "div",
              { className: "metric-caption" },
              connected ? "Comunicación estable" : "No hay conexión activa"
            )
          ),
          React.createElement(
            "div",
            { className: "metric-card" },
            React.createElement("h3", null, "Derivada activa"),
            React.createElement("p", null, derivada),
            React.createElement("div", { className: "metric-caption" }, "Línea de ECG seleccionada")
          ),
          React.createElement(
            "div",
            { className: "metric-card" },
            React.createElement("h3", null, "Ritmo cardiaco"),
            React.createElement("p", null, bpm),
            React.createElement("div", { className: "metric-caption" }, "BPM en tiempo real")
          )
        )
      )
    ),
    React.createElement(
      "div",
      { className: "grid-surface" },
      React.createElement(
        "div",
        { className: "card" },
        React.createElement(
          "div",
          { className: "section-title" },
          React.createElement("h2", null, "Controles rápidos"),
          React.createElement("p", null, "Acciones directas para tu ECG, modo y derivada.")
        ),
        React.createElement(
          "div",
          { className: "controls-grid" },
          React.createElement(
            "div",
            { className: "control-panel" },
            React.createElement("h3", null, "Control del ECG"),
            React.createElement(
              "div",
              { className: "button-row" },
              React.createElement(
                "button",
                {
                  className: getButtonClass("btn-primary", isEcgOn),
                  onClick: () => sendCommand("e", "Iniciar ECG"),
                  disabled: !connected
                },
                "Iniciar ECG"
              ),
              React.createElement(
                "button",
                {
                  className: getButtonClass("btn-danger", !isEcgOn),
                  onClick: () => sendCommand("s", "Detener ECG"),
                  disabled: !connected
                },
                "Detener ECG"
              )
            )
          ),
          React.createElement(
            "div",
            { className: "control-panel" },
            React.createElement("h3", null, "Modo de operación"),
            React.createElement(
              "div",
              { className: "button-row" },
              React.createElement(
                "button",
                {
                  className: getButtonClass("btn-mode", mode === "auto"),
                  onClick: () => sendCommand("a", "Modo Auto"),
                  disabled: !connected
                },
                "Modo Auto"
              ),
              React.createElement(
                "button",
                {
                  className: getButtonClass("btn-mode", mode === "manual"),
                  onClick: () => sendCommand("m", "Modo Manual"),
                  disabled: !connected
                },
                "Modo Manual"
              )
            )
          ),
          React.createElement(
            "div",
            { className: "control-panel" },
            React.createElement("h3", null, "Selección de derivada"),
            React.createElement(
              "div",
              { className: "derivada-row" },
              ["I", "II", "III"].map((item) =>
                React.createElement(
                  "button",
                  {
                    key: item,
                    className: getButtonClass("btn-deriv", currentDerivada === item),
                    onClick: () => sendCommand(derivadaMap[item], `Derivada ${item}`),
                    disabled: !connected
                  },
                  `${item}`
                )
              )
            ),
            React.createElement(
              "div",
              { className: "derivada-row" },
              ["aVR", "aVL", "aVF"].map((item) =>
                React.createElement(
                  "button",
                  {
                    key: item,
                    className: getButtonClass("btn-deriv", currentDerivada === item),
                    onClick: () => sendCommand(derivadaMap[item], `Derivada ${item}`),
                    disabled: !connected
                  },
                  `${item}`
                )
              )
            )
          )
        )
      ),
      React.createElement(
        "div",
        { className: "card chart-card" },
        React.createElement(
          "div",
          { className: "section-title" },
          React.createElement(
            "div",
            null,
            React.createElement("h2", null, "ECG en tiempo real"),
            React.createElement("p", null, "Señal real proveniente del ESP32.")
          ),
          React.createElement(
            "div",
            { className: "tag " + (connected ? "connected" : "disconnected") },
            connected ? "Conectado" : "Desconectado"
          )
        ),
        React.createElement(
          "div",
          { className: "chart-controls" }
        ),
        React.createElement("canvas", { ref: chartRef, width: 800, height: 260 })
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(App)
);