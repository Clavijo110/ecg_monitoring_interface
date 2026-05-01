const { useState, useEffect, useRef } = React;

// Backend local para Arduino
const getBackendURL = () => {
  return "http://localhost:3001";
};

function App() {
  const [ports, setPorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState("");
  const [connected, setConnected] = useState(false);
  const [portName, setPortName] = useState("");
  const [statusMessage, setStatusMessage] = useState("ECG iniciado");
  const [derivada, setDerivada] = useState("I");
  const [bpm, setBpm] = useState("---");
  const [logs, setLogs] = useState([]);
  const [lastEvent, setLastEvent] = useState("Sin eventos recientes");
  const [mode, setMode] = useState("auto");
  const [ecgRunning, setEcgRunning] = useState(true);
  const [hasRealData, setHasRealData] = useState(false);
  const [currentDerivada, setCurrentDerivada] = useState("I");
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
    console[variant] ? console[variant](message) : console.log(message);
  };

  const setStatus = (message) => {
    setStatusMessage(message);
    addLog(message);
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
      setStatus("Solicitando puertos seriales...");
      const backendUrl = getBackendURL();
      const res = await fetch(`${backendUrl}/api/ports`);
      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "No se obtuvo respuesta correcta");
      }

      setPorts(data.ports);
      if (data.ports.length > 0) {
        const firstPort = data.ports[0].path;
        setSelectedPort(firstPort);
        connectToPort(firstPort);
      }

      addLog(`Puertos disponibles: ${data.ports.length}`);
    } catch (error) {
      setStatus("Error cargando puertos");
      addLog(`Error cargando puertos: ${error.message}`, "error");
    }
  };

  const connectToPort = async (portPath) => {
    if (!portPath) {
      addLog("No se encontró un puerto para conectar", "warn");
      return;
    }

    try {
      setStatus(`Conectando a ESP32...`);
      const backendUrl = getBackendURL();
      const res = await fetch(`${backendUrl}/api/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portPath })
      });
      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Error al conectar");
      }

      setConnected(true);
      setPortName("ESP32");
      setStatus(data.message);
      addLog(data.message, "info");
    } catch (error) {
      setConnected(false);
      setStatus("Conexión fallida");
      addLog(`Error de conexión: ${error.message}`, "error");
    }
  };

  const connectPort = async () => {
    await connectToPort(selectedPort);
  };

  const checkStatus = async () => {
    try {
      const backendUrl = getBackendURL();
      const res = await fetch(`${backendUrl}/api/status`);
      const data = await res.json();

      if (data.connected) {
        setConnected(true);
        setPortName(data.port || "Desconocido");
        setStatus(`Conectado a ${data.port}`);
      } else {
        setConnected(false);
        setStatus("No conectado");
      }
    } catch (error) {
      setConnected(false);
      setStatus("Error consultando estado");
      addLog(`Error de estado: ${error.message}`, "error");
    }
  };

  const sendCommand = async (cmd, label) => {
    if (!connected) {
      addLog("Necesita conectar antes de enviar comandos", "warn");
      return false;
    }

    try {
      setStatus(`Enviando comando ${label}...`);
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

      addLog(`Comando enviado: ${label}`);
      setLastEvent(label);

      if (cmd === "e") {
        setEcgRunning(true);
        clearChart();
      }

      if (cmd === "s") {
        setEcgRunning(false);
      }

      return true;
    } catch (error) {
      addLog(`Error comando ${label}: ${error.message}`, "error");
      setStatus("Error enviando comando");
      return false;
    }
  };

  const sendDerivadaCommand = async (derivadaLabel, index) => {
    const derivadaCmd = String(index + 1);

    if (mode === "auto") {
      // El ESP32 actual ignora el cambio directo de derivada en modo automático,
      // así que pasamos brevemente a manual, cambiamos derivada y volvemos a auto.
      const movedToManual = await sendCommand("m", "Modo Manual");
      if (!movedToManual) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 80));
      const changed = await sendCommand(derivadaCmd, `Derivada ${derivadaLabel}`);
      if (!changed) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 80));
      const backToAuto = await sendCommand("a", "Modo Auto");
      if (!backToAuto) {
        return;
      }

      setMode("auto");
    } else {
      await sendCommand(derivadaCmd, `Derivada ${derivadaLabel}`);
    }

    setCurrentDerivada(derivadaLabel);
    setDerivada(derivadaLabel);
  };

  const toggleShowECG = () => {
    setShowECG((prev) => !prev);
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
            borderColor: "#8b5cf6",
            backgroundColor: "rgba(124, 58, 237, 0.08)",
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
    loadPorts();
    checkStatus();

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
          setStatus("✅ Socket conectado");
          addLog("Socket.io conectado");
        });

        socket.on("connect_error", (error) => {
          addLog(`Error al conectar Socket.io: ${error.message}`, "error");
          setStatus("Error conectando a backend");
        });

        socket.on("mensaje", (data) => {
          addLog(`WS: ${JSON.stringify(data)}`);
        });

        socket.on("serial_status", (data) => {
          setConnected(data.connected);
          setPortName(data.port || "N/A");
          setStatus(data.connected ? `Conectado a ${data.port}` : "No conectado");
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
            const deriv = data.derivada || "---";

            setDerivada(deriv);
            setCurrentDerivada(deriv);
            setBpm(Number(data.bpm).toFixed(1));
            setLastEvent("Datos actualizados");
            setHasRealData(true);
            lastDataTime.current = Date.now();

            setChartYRangeFromDerivada(deriv);
            pushECGPoint(data.ecg, deriv);
          }

          if (data.tipo === "ACK_DERIVADA") {
            setDerivada(data.derivada || "---");
            setCurrentDerivada(data.derivada || "---");
            setChartYRangeFromDerivada(data.derivada || "---");
            setLastEvent("Derivada actualizada");
            addLog(`Derivada -> ${data.derivada || "---"}`);
          }

          if (data.tipo === "AUTO_DERIVADA") {
            setDerivada(data.derivada || "---");
            setCurrentDerivada(data.derivada || "---");
            setChartYRangeFromDerivada(data.derivada || "---");
            setMode("auto");
            setLastEvent("Modo auto activado");
            addLog(`Auto derivada -> ${data.derivada || "---"}`);
          }

          if (data.tipo === "ACK_ECG_ON") {
            setStatus("ECG iniciado");
            setLastEvent("ECG activado");
            setEcgRunning(true);
            addLog("ACK_ECG_ON");
          }

          if (data.tipo === "ACK_ECG_OFF") {
            setStatus("ECG detenido");
            setLastEvent("ECG detenido");
            setEcgRunning(false);
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
        { className: "status-pill" + (connected ? "" : " disconnected") },
        React.createElement("span", { className: "dot" }),
        connected ? "ESP32" : "Desconectado"
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
          React.createElement("h2", null, "Conexión serial"),
          React.createElement("p", null, "Selecciona y controla el puerto ECG.")
        ),
        React.createElement(
          "div",
          { className: "control-group" },
          React.createElement(
            "div",
            { className: "form-row" },
            React.createElement("label", { htmlFor: "ports" }, "Puerto serial"),
            React.createElement(
              "select",
              {
                id: "ports",
                value: selectedPort,
                onChange: (event) => setSelectedPort(event.target.value)
              },
              ports.map((port) =>
                React.createElement(
                  "option",
                  { key: port.path, value: port.path },
                  `${port.path}${port.friendlyName ? ` -- ${port.friendlyName}` : ""}`
                )
              )
            )
          ),
          React.createElement(
            "div",
            { className: "button-row" }
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
            React.createElement("p", { className: "metric-highlight" }, connected ? "ESP32 listo" : "ECG desconectado"),
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
            React.createElement("p", { className: "metric-value metric-value--small" }, derivada),
            React.createElement("div", { className: "metric-caption" }, "Línea de ECG seleccionada")
          ),
          React.createElement(
            "div",
            { className: "metric-card" },
            React.createElement("h3", null, "Ritmo cardiaco"),
            React.createElement("p", { className: "metric-value metric-value--small" }, bpm),
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
            React.createElement("p", null, "Acciones directas para tu ECG y modos de operación.")
          ),
          React.createElement(
            "div",
            { className: "controls controls--split" },
            // Sección 1: Control del ECG
            React.createElement(
              "div",
              { className: "control-section" },
              React.createElement("h4", null, "Control del ECG"),
              React.createElement(
                "div",
                { className: "button-row" },
                React.createElement(
                  "button",
                  { className: `btn btn-lg ${ecgRunning ? 'btn-primary' : 'btn-soft'}`, onClick: () => sendCommand("e", "Iniciar ECG"), disabled: !connected },
                  "Iniciar ECG"
                ),
                React.createElement(
                  "button",
                  { className: `btn btn-lg ${ecgRunning ? 'btn-soft' : 'btn-danger'}`, onClick: () => sendCommand("s", "Detener ECG"), disabled: !connected },
                  "Detener ECG"
                )
              )
            ),
            // Sección 2: Modo de operación
            React.createElement(
              "div",
              { className: "control-section" },
              React.createElement("h4", null, "Modo de operación"),
              React.createElement(
                "div",
                { className: "button-row" },
                React.createElement(
                  "button",
                  { className: `btn ${mode === "auto" ? "btn-auto" : "btn-soft"}`, onClick: () => { sendCommand("a", "Modo Auto"); setMode("auto"); }, disabled: !connected },
                  "Auto"
                ),
                React.createElement(
                  "button",
                  { className: `btn ${mode === "manual" ? "btn-manual" : "btn-soft"}`, onClick: () => { sendCommand("m", "Modo Manual"); setMode("manual"); }, disabled: !connected },
                  "Manual"
                )
              )
            ),
            // Sección 3: Selección de derivada
            React.createElement(
              "div",
              { className: "control-section" },
              React.createElement("h4", null, "Selección de derivada"),
              React.createElement(
                "div",
                { className: "derivadas-grid" },
                // Mapear derivadas visibles con colores y estado activo
                ["I", "II", "III", "aVR", "aVL", "aVF"].map((d, idx) =>
                  React.createElement(
                    "button",
                    {
                      key: d,
                      className: `btn derivada-btn ${currentDerivada === d ? 'active' : ''}`,
                      onClick: () => sendDerivadaCommand(d, idx),
                      disabled: !connected
                    },
                    d
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
    ),
    
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(App)
);