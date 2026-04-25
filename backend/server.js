/* eslint-env node */

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();

// ============================================================
// CONFIG
// ============================================================

const PORT = process.env.PORT || 3001;
const GAS_URL = process.env.GAS_URL;

// ============================================================
// CORS (CONTROLADO E SEGURO)
// ============================================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://sistema-cultural-psi.vercel.app",
  "https://sistema-cultural-kclsj13o5-gestao-cultural.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(express.json());

// ============================================================
// HEALTHCHECK
// ============================================================

app.get("/", (req, res) => {
  return res.json({
    ok: true,
    service: "backend",
    status: "online",
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// CORE API (PROXY PARA GOOGLE APPS SCRIPT)
// ============================================================

app.post("/core", async (req, res) => {
  try {
    if (!GAS_URL) {
      return res.status(500).json({
        ok: false,
        error: "GAS_URL_NOT_CONFIGURED"
      });
    }

    const response = await fetch(GAS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      return res.json(data);
    } catch {
      return res.status(500).json({
        ok: false,
        error: "INVALID_JSON_FROM_GAS",
        raw: text
      });
    }

  } catch (err) {
    console.error("🔥 API ERROR:", err);

    return res.status(500).json({
      ok: false,
      error: "INTERNAL_ERROR"
    });
  }
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});