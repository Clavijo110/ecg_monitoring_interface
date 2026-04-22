const { useState, useEffect, useRef } = React;

const getBackendURL = () => {
  return "http://localhost:3001";
};

function App() {
  const [ports, setPorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState("");
  const [connected, setConnected] = useState(false);
  const [portName, setPortName] = useState("");
  const [statusMessage, setStatusMessage] = useState("Cargando estado...");
  const [derivada, setDerivada] = useState("---");
  const [bpm, setBpm] = useState("---");
  const [logs, setLogs] = useState([]);
  const [lastEvent, setLastEvent] = useState("Sin eventos recientes");
  const [mode, setMode] = useState("manual");
  const [showECG, setShowECG] = useState(true);
  const [hasRealData, setHasRealData] = useState(false);

  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const chartNeedsUpdate = useRef(false);
  const lastDataTime = useRef(0);

  // Si el ESP32 manda DATA cada 2 muestras y toma a 250 Hz,
  // al frontend llegan aprox 125 muestras/seg
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

  const DERIVADA_PP = {
    I: 0.25,
    II: 2.0,
    III: 0.6,
    aVR: 0.9,
    aVL: 0.95,
    aVF: 1.15,
    AVR: 0.9,
    AVL: 0.95,
    AVF: 1.15
  };

  const ADC_MAX_VOLT = 3.3;

  const adcToMilliVolts = (ecgValue) => {
    const raw = Number(ecgValue);
    if (Number.isNaN(raw)) return 0;

    const volts = (raw / 4095) * ADC_MAX_VOLT;
    const centered = volts - ADC_MAX_VOLT / 2.0;
    return centered * 1000.0;
  };

  const setChartYRangeFromDerivada = (deriv) => {
    if (!chartInstance.current) return;

    const pp = (DERIVADA_PP[deriv] || 2.0) * 1000.0;
    const half = pp / 2.0;
    const margin = 120;

    chartInstance.current.options.scales.y.min = -half - margin;
    chartInstance.current.options.scales.y.max = half + margin;
    chartNeedsUpdate.current = true;
  };

  const pushECGPoint = (ecgValue) => {
    if (!chartInstance.current || !showECG) return;

    const point = adcToMilliVolts(ecgValue);
    const data = chartInstance.current.data.datasets[0].data;

    data.push(point);
    if (data.length > BUFFER_SIZE) {
      data.shift();
    }

    chartNeedsUpdate.current = true;
  };

  const clearChart = () => {
    if (!chartInstance.current) return;

    chartInstance.current.data.datasets[0].data = Array.from(
      { length: BUFFER_SIZE },
      () => 0
    );
    chartNeedsUpdate.current = true;
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
        setSelectedPort(data.ports[0].path);
      }

      addLog(`Puertos disponibles: ${data.ports.length}`);
    } catch (error) {
      setStatus("Error cargando puertos");
      addLog(`Error cargando puertos: ${error.message}`, "error");
    }
  };

  const connectPort = async () => {
    if (!selectedPort) {
      addLog("Seleccione un puerto primero", "warn");
      return;
    }

    try {
      setStatus(`Conectando a ${selectedPort}...`);
      const backendUrl = getBackendURL();
      const res = await fetch(`${backendUrl}/api/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portPath: selectedPort })
      });
      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Error al conectar");
      }

      setConnected(true);
      setPortName(selectedPort);
      setStatus(data.message);
      addLog(data.message, "info");
    } catch (error) {
      setConnected(false);
      setStatus("Conexión fallida");
      addLog(`Error de conexión: ${error.message}`, "error");
    }
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
      return;
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
        clearChart();
      }
    } catch (error) {
      addLog(`Error comando ${label}: ${error.message}`, "error");
      setStatus("Error enviando comando");
    }
  };

  const toggleShowECG = () => {
    setShowECG((prev) => !prev);
  };

  // Crear gráfica
  useEffect(() => {
    if (!chartRef.current) return;

    if (typeof Chart === "undefined") {
      addLog("Chart.js no está cargado en index.html", "error");
      setStatus("Falta Chart.js");
      return;
    }

    const ctx = chartRef.current.getContext("2d");

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: Array.from({ length: BUFFER_SIZE }, () => ""),
        datasets: [
          {
            label: "ECG en vivo",
            data: Array.from({ length: BUFFER_SIZE }, () => 0),
            borderColor: "#00ff88",
            backgroundColor: "rgba(0, 255, 136, 0.05)",
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
        normalized: true,
        parsing: false,
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
            min: -1200,
            max: 1200,
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

  // Refresco visual desacoplado de la llegada serial
  useEffect(() => {
    const repaint = setInterval(() => {
      if (chartInstance.current && chartNeedsUpdate.current) {
        chartInstance.current.update("none");
        chartNeedsUpdate.current = false;
      }
    }, 40);

    return () => clearInterval(repaint);
  }, []);

  // Carga inicial y sockets
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
      addLog("Socket.io no está cargado en index.html", "error");
      setStatus("Falta Socket.io");
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

        // No loguear cada DATA para no congelar la interfaz
        socket.on("serial_raw", (data) => {
          if (typeof data.raw === "string" && !data.raw.startsWith("DATA,")) {
            addLog(`RX raw -> ${data.raw}`);
          }
        });

        socket.on("serial_data", (data) => {
          if (data.tipo === "DATA" || data.tipo === "REAL_DATA") {
            const deriv = data.derivada || "---";

            setDerivada(deriv);
            setBpm(Number(data.bpm).toFixed(1));
            setLastEvent("Datos actualizados");
            setHasRealData(true);
            lastDataTime.current = Date.now();

            setChartYRangeFromDerivada(deriv);
            pushECGPoint(data.ecg);
          }

          if (data.tipo === "ACK_DERIVADA") {
            setDerivada(data.derivada || "---");
            setLastEvent("Derivada actualizada");
            addLog(`Derivada -> ${data.derivada || "---"}`);
          }

          if (data.tipo === "AUTO_DERIVADA") {
            setDerivada(data.derivada || "---");
            setMode("auto");
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

  // Si se pierde la señal real, limpiar estado
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
        connected ? `Conectado a ${portName}` : "Desconectado"
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
            { className: "button-row" },
            React.createElement("button", { className: "btn btn-secondary", onClick: loadPorts }, "Actualizar puertos"),
            React.createElement("button", { className: "btn btn-primary", onClick: connectPort }, "Conectar"),
            React.createElement("button", { className: "btn btn-soft", onClick: checkStatus }, "Ver estado")
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
            React.createElement("p", { className: "metric-highlight" }, statusMessage)
          ),
          React.createElement(
            "div",
            { className: "metric-card" },
            React.createElement("h3", null, "Derivada activa"),
            React.createElement("p", null, derivada)
          ),
          React.createElement(
            "div",
            { className: "metric-card" },
            React.createElement("h3", null, "Ritmo cardiaco"),
            React.createElement("p", null, bpm)
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
          React.createElement("p", null, "Acciones directas para tu ECG.")
        ),
        React.createElement(
          "div",
          { className: "controls" },
          React.createElement(
            "div",
            { className: "button-row" },
            React.createElement("button", { className: "btn btn-primary", onClick: () => sendCommand("e", "Iniciar ECG"), disabled: !connected }, "Iniciar ECG"),
            React.createElement("button", { className: "btn btn-danger", onClick: () => sendCommand("s", "Detener ECG"), disabled: !connected }, "Detener ECG"),
            React.createElement("button", { className: "btn btn-accent", onClick: () => sendCommand("a", "Modo Auto"), disabled: !connected }, "Modo Auto")
          ),
          React.createElement(
            "div",
            { className: "button-row" },
            React.createElement("button", { className: "btn btn-secondary", onClick: () => sendCommand("m", "Modo Manual"), disabled: !connected }, "Modo Manual"),
            React.createElement("button", { className: "btn btn-soft", onClick: () => sendCommand("1", "Derivada 1"), disabled: !connected }, "Derivada 1"),
            React.createElement("button", { className: "btn btn-soft", onClick: () => sendCommand("2", "Derivada 2"), disabled: !connected }, "Derivada 2")
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
          { className: "chart-controls" },
          React.createElement(
            "button",
            {
              className: "btn btn-signal " + (showECG ? "signal-active" : "signal-inactive"),
              onClick: toggleShowECG
            },
            showECG ? "[ON] ECG" : "ECG"
          )
        ),
        React.createElement("canvas", { ref: chartRef, width: 800, height: 260 })
      )
    ),

    React.createElement(
      "div",
      { className: "grid-surface" },
      React.createElement(
        "div",
        { className: "card log-panel" },
        React.createElement(
          "div",
          { className: "section-title" },
          React.createElement("h2", null, "Actividad del sistema"),
          React.createElement("p", null, "Registro de eventos recientes.")
        ),
        React.createElement(
          "div",
          { className: "log-box" },
          logs.length === 0
            ? React.createElement("div", { className: "log-line" }, "Esperando eventos...")
            : logs.map((line, index) =>
                React.createElement("div", { key: index, className: "log-line" }, line)
              )
        )
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(App)
);