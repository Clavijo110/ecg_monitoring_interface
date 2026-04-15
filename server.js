const express = require("express");
const path = require("path");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3001;

let serialPort = null;
let parser = null;
let serialPortName = null;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Ruta principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// -------- API: listar puertos --------
app.get("/api/ports", async (req, res) => {
  try {
    const ports = await SerialPort.list();

    const formatted = ports.map((p) => ({
      path: p.path,
      manufacturer: p.manufacturer || "",
      friendlyName: p.friendlyName || "",
      serialNumber: p.serialNumber || ""
    }));

    res.json({
      ok: true,
      ports: formatted
    });
  } catch (error) {
    console.error("[SERIAL] Error listando puertos:", error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// -------- API: conectar a puerto --------
app.post("/api/connect", async (req, res) => {
  try {
    const { portPath } = req.body;

    if (!portPath) {
      return res.status(400).json({
        ok: false,
        error: "Falta portPath"
      });
    }

    if (serialPort && serialPort.isOpen) {
      await new Promise((resolve, reject) => {
        serialPort.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    serialPort = new SerialPort({
      path: portPath,
      baudRate: 115200,
      autoOpen: false
    });

    await new Promise((resolve, reject) => {
      serialPort.open((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    parser = serialPort.pipe(
      new ReadlineParser({ delimiter: "\n" })
    );

    parser.on("data", (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      console.log("[RX]", trimmed);

      io.emit("serial_raw", {
        raw: trimmed
      });

      const parsed = parseSerialLine(trimmed);
      if (parsed) {
        io.emit("serial_data", parsed);
      }
    });

    serialPort.on("error", (err) => {
      console.error("[SERIAL] Error:", err.message);
      io.emit("serial_status", {
        connected: false,
        port: serialPortName,
        error: err.message
      });
    });

    serialPortName = portPath;

    console.log(`[SERIAL] Conectado a ${portPath} @ 230400`);

    io.emit("serial_status", {
      connected: true,
      port: serialPortName
    });

    res.json({
      ok: true,
      message: `Conectado a ${portPath}`
    });
  } catch (error) {
    console.error("[SERIAL] Error conectando:", error);

    io.emit("serial_status", {
      connected: false,
      port: null,
      error: error.message
    });

    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// -------- API: estado serial --------
app.get("/api/status", (req, res) => {
  res.json({
    ok: true,
    connected: !!(serialPort && serialPort.isOpen),
    port: serialPortName
  });
});

// -------- API: enviar comando al ESP32 --------
app.post("/api/cmd", async (req, res) => {
  try {
    const { cmd } = req.body;

    if (!cmd) {
      return res.status(400).json({
        ok: false,
        error: "Falta cmd"
      });
    }

    if (!serialPort || !serialPort.isOpen) {
      return res.status(400).json({
        ok: false,
        error: "Puerto serial no conectado"
      });
    }

    serialPort.write(String(cmd), (err) => {
      if (err) {
        console.error("[TX] Error enviando comando:", err.message);
        return res.status(500).json({
          ok: false,
          error: err.message
        });
      }

      console.log("[TX]", cmd);

      io.emit("serial_tx", {
        cmd: String(cmd)
      });

      res.json({
        ok: true,
        message: `Comando enviado: ${cmd}`
      });
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// -------- Parse de líneas del ESP32 --------
function parseSerialLine(line) {
  if (line.startsWith("DATA,")) {
    const parts = line.split(",");
    if (parts.length >= 5) {
      return {
        tipo: "DATA",
        ecg: Number(parts[1]),
        derivada: parts[2],
        bpm: Number(parts[3]),
        mp: Number(parts[4]),
        raw: line
      };
    }
  }

  if (line.startsWith("ACK,DERIVADA,")) {
    const parts = line.split(",");
    return {
      tipo: "ACK_DERIVADA",
      derivada: parts[2] || "---",
      raw: line
    };
  }

  if (line.startsWith("AUTO,DERIVADA,")) {
    const parts = line.split(",");
    return {
      tipo: "AUTO_DERIVADA",
      derivada: parts[2] || "---",
      raw: line
    };
  }

  if (line === "ACK,AUTO_ON") {
    return { tipo: "ACK_AUTO_ON", raw: line };
  }

  if (line === "ACK,MANUAL_ON") {
    return { tipo: "ACK_MANUAL_ON", raw: line };
  }

  if (line === "ACK,ECG_ON") {
    return { tipo: "ACK_ECG_ON", raw: line };
  }

  if (line === "ACK,ECG_OFF") {
    return { tipo: "ACK_ECG_OFF", raw: line };
  }

  if (line === "EVENT,MP") {
    return { tipo: "EVENT_MP", raw: line };
  }

  if (line === "READY") {
    return { tipo: "READY", raw: line };
  }

  return {
    tipo: "OTRO",
    raw: line
  };
}

// -------- WebSocket --------
io.on("connection", (socket) => {
  console.log("[WEB] Cliente conectado:", socket.id);

  socket.emit("mensaje", {
    tipo: "INFO",
    texto: "Conexión WebSocket OK"
  });

  socket.emit("serial_status", {
    connected: !!(serialPort && serialPort.isOpen),
    port: serialPortName
  });

  socket.on("disconnect", () => {
    console.log("[WEB] Cliente desconectado:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`[APP] Servidor corriendo en http://localhost:${PORT}`);
});