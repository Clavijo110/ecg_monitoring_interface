const { useState, useEffect, useRef } = React;

// Helper: Detectar URL del backend
// ⚠️ IMPORTANTE: ARDUINO SOLO FUNCIONA CON BACKEND LOCAL
// Backend DEBE estar en http://localhost:3001 para que Arduino funcione
// Si cambias a backend remoto (Render), Arduino NO funcionará
const getBackendURL = () => {
  // Arduino requiere backend en localhost
  // NUNCA cambies esto a un servidor remoto (Render, Heroku, etc)
  // Si necesitas backend remoto, ver ARDUINO_DEPLOYED.md
  return 'http://localhost:3001';
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
  const waveIndex = useRef(0);
  const lastDataTime = useRef(0);

  const timestamp = () => new Date().toLocaleTimeString("es-ES", { hour12: false });

  const addLog = (message, variant = "info") => {
    const line = `[${timestamp()}] ${message}`;
    // Limitar logs a máximo 50 líneas en vez de 100 para economizar memoria
    setLogs((current) => [...current.slice(-49), line]);
    // Solo log importante a consola, no todo
    if (variant === "error" || variant === "warn") {
      console[variant](message);
    }
  };

  const setStatus = (message) => {
    setStatusMessage(message);
    addLog(message);
  };

  const buildWavePoint = (ecgValue, bpmValue) => {
    // Si tenemos valor ECG real del ESP32, usarlo directamente
    if (ecgValue !== undefined && ecgValue !== null) {
      // Normalizar valor ADC (0-4095) a rango de gráfica (0-2)
      return (ecgValue / 4095) * 2.0;
    }

    // Si no hay datos reales, generar señal simulada basada en BPM
    const normalized = Math.min(Math.max(Number(bpmValue) || 72, 20), 180);
    const phase = waveIndex.current * 0.45;
    waveIndex.current += 1;
    return 1.1 + Math.sin(phase) * 0.55 + (normalized / 180) * 0.35 + (Math.random() - 0.5) * 0.08;
  };

  const refreshChart = (point) => {
    if (!chartInstance.current) return;
    const chart = chartInstance.current;
    if (showECG) {
      // Si no hay datos reales, mostrar línea plana
      const valueToAdd = hasRealData ? point : 1.0;
      chart.data.datasets[0].data.push(valueToAdd);
      chart.data.datasets[0].data.shift();
    }
    chart.update("none");
  };

  const loadPorts = async () => {
    try {
      setStatus("Solicitando puertos seriales...");
      const backendUrl = getBackendURL(); // Siempre localhost:3001 para Arduino
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
      const backendUrl = getBackendURL(); // Siempre localhost:3001 para Arduino
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
      setStatus("Conexi�n fallida");
      addLog(`Error de conexi�n: ${error.message}`, "error");
    }
  };

  const checkStatus = async () => {
    try {
      const backendUrl = getBackendURL(); // Siempre localhost:3001 para Arduino
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
      const backendUrl = getBackendURL(); // Siempre localhost:3001 para Arduino
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
    } catch (error) {
      addLog(`Error comando ${label}: ${error.message}`, "error");
      setStatus("Error enviando comando");
    }
  };

  const toggleShowECG = () => {
    setShowECG(!showECG);
  };

  useEffect(() => {
    if (!chartRef.current) return;
    const ctx = chartRef.current.getContext("2d");
    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: Array.from({ length: 42 }, () => ""),
        datasets: [
          {
            label: "ECG en vivo",
            data: Array.from({ length: 42 }, () => 1),
            borderColor: "#8b5cf6",
            backgroundColor: "rgba(124, 58, 237, 0.18)",
            borderWidth: 2.5,
            tension: 0.4,
            pointRadius: 0,
            fill: true
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
          x: { display: false },
          y: {
            display: true,
            min: 0.3,
            max: 2.4,
            ticks: { display: false },
            grid: { color: "rgba(148,163,184,0.12)" }
          }
        }
      }
    });
  }, []);

  useEffect(() => {
    loadPorts();
    checkStatus();

    // Usar configuración de Socket.io desde index.html o crear con valores por defecto
    const socketConfig = window.socketConfig || {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      transports: ['websocket', 'polling']
    };

    const socket = io(getBackendURL(), socketConfig);

    socket.on("connect", () => {
      setStatus("✅ Socket conectado");
      console.log("✅ Socket.io conectado exitosamente");
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Error al conectar Socket.io:", error);
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
      // Solo log de comandos significativos (no de datos), para evitar sobrecargar
      if (data.cmd && data.cmd.length < 2) {
        // Log solo de comandos cortos (a, m, e, s, etc.)
        // Sin logs para datos continuos
      }
    });

    socket.on("serial_raw", (data) => {
      // Deshabilitado: causaba sobrecarga con ~250 líneas/segundo
      // Para debugging, usar DevTools y revisar network tab
    });

    socket.on("serial_data", (data) => {
      if (data.tipo === "DATA" || data.tipo === "REAL_DATA") {
        setDerivada(data.derivada || "---");
        setBpm(Number(data.bpm).toFixed(1));
        setLastEvent(`Datos actualizados`);
        setHasRealData(true);
        lastDataTime.current = Date.now();
        refreshChart(buildWavePoint(data.ecg, data.bpm));
      }

      if (data.tipo === "ACK_DERIVADA") {
        setDerivada(data.derivada || "---");
        setLastEvent(`Derivada actualizada`);
      }

      if (data.tipo === "AUTO_DERIVADA") {
        setDerivada(data.derivada || "---");
        setMode("auto");
        setLastEvent("Modo auto activado");
      }

      if (data.tipo === "ACK_ECG_ON") {
        setStatus("ECG iniciado");
        setLastEvent("ECG activado");
      }

      if (data.tipo === "ACK_ECG_OFF") {
        setStatus("ECG detenido");
        setLastEvent("ECG detenido");
      }

      if (data.tipo === "ACK_AUTO_ON") {
        setMode("auto");
        setStatus("Modo automatico");
        setLastEvent("Auto encendido");
      }

      if (data.tipo === "ACK_MANUAL_ON") {
        setMode("manual");
        setStatus("Modo manual");
        setLastEvent("Manual activado");
      }

      if (data.tipo === "READY") {
        setStatus("ESP32 listo");
        setLastEvent("Dispositivo listo");
      }
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setStatus("Socket desconectado");
      addLog("Socket desconectado", "warn");
    });

    return () => socket.disconnect();
  }, []);

  // Limpiar datos antiguos cuando no llegan por más de 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (hasRealData && now - lastDataTime.current > 5000) {
        setHasRealData(false);
        setDerivada("---");
        setBpm("---");
        setLastEvent("Sin señal - ESP32 desconectado");
        addLog("Señal perdida - ESP32 desconectado", "warn");
      } else if (!hasRealData && showECG) {
        // Generar punto plano cuando no hay señal
        refreshChart(1.0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [hasRealData, showECG]);

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
          React.createElement("p", { className: "subtitle" }, "Control intuitivo, feedback en tiempo real y una experiencia de usuario diseñada para profesionales y proyectos avanzados.")
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
          React.createElement("h2", null, "Conexion serial"),
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
                React.createElement("option", { key: port.path, value: port.path }, `${port.path} ${port.friendlyName ? ` -- ${port.friendlyName}` : ""}`)
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
          React.createElement("p", null, "Resumen rapido del estado del ECG.")
        ),
        React.createElement(
          "div",
          { className: "metric-grid" },
          React.createElement(
            "div",
            { className: "metric-card" },
            React.createElement("h3", null, "Estado"),
            React.createElement("p", { className: "metric-highlight" }, statusMessage),
            React.createElement("div", { className: "metric-caption" }, connected ? "Comunicacion estable" : "No hay conexion activa")
          ),
          React.createElement(
            "div",
            { className: "metric-card" },
            React.createElement("h3", null, "Derivada activa"),
            React.createElement("p", null, derivada),
            React.createElement("div", { className: "metric-caption" }, "Linea de ECG seleccionada")
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
          React.createElement("h2", null, "Controles rapidos"),
          React.createElement("p", null, "Acciones directas para tu ECG y modos de operacion.")
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
          ),
          React.createElement(
            "div",
            { className: "button-row" },
            React.createElement("button", { className: "btn btn-soft", onClick: () => sendCommand("3", "Derivada 3"), disabled: !connected }, "Derivada 3"),
            React.createElement("button", { className: "btn btn-soft", onClick: () => sendCommand("4", "Derivada 4"), disabled: !connected }, "Derivada 4"),
            React.createElement("button", { className: "btn btn-soft", onClick: () => sendCommand("5", "Derivada 5"), disabled: !connected }, "Derivada 5")
          ),
          React.createElement(
            "div",
            { className: "button-row" },
            React.createElement("button", { className: "btn btn-soft", onClick: () => sendCommand("6", "Derivada 6"), disabled: !connected }, "Derivada 6"),
            React.createElement("button", { className: "btn btn-secondary", onClick: () => setStatus(`Ultimo evento: ${lastEvent}`) }, "Actualizar panel"),
            React.createElement("button", { className: "btn btn-secondary", disabled: true }, mode === "auto" ? "Activo: automatico" : "Activo: manual")
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
            React.createElement("h2", null, "Pulso en tiempo real"),
            React.createElement("p", null, "Visualiza ECG en tiempo real.")
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
        React.createElement("canvas", { ref: chartRef, height: 260 })
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
          React.createElement("p", null, "Registro de eventos recientes y respuestas del dispositivo.")
        ),
        React.createElement(
          "div",
          { className: "log-box" },
          logs.length === 0
            ? React.createElement("div", { className: "log-line" }, "Esperando eventos...")
            : logs.map((line, index) => React.createElement("div", { key: index, className: "log-line" }, line))
        )
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
