const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Google Apps Script URL
const GAS_URL = process.env.GAS_URL || "https://script.google.com/macros/s/AKfycbzwGn1IHVleKx40uOSUB-sYF4Cpf9YKmeJ0Q9YLcV7ZiPYA155MiClqdxeEgqhf3Lra8w/exec";

// State
let db = {
  tenants: {},
  users: {},
  reservas: []
};

// POST /api
app.post('/api', async (req, res) => {
  try {
    const { action, payload, token } = req.body;

    if (!action) {
      return res.json({ ok: false, msg: "action obrigatória" });
    }

    // Route to handler
    const result = await handleAction(action, payload, token);
    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Erro no servidor" });
  }
});

async function handleAction(action, payload, token) {
  try {
    switch (action) {
      case "criarTenant":
        return criarTenant(payload);
      
      case "login":
        return login(payload);
      
      case "listarReservas":
        return listarReservas(payload, token);
      
      case "criarReserva":
        return criarReserva(payload, token);
      
      default:
        // Fallback: try GAS
        return await callGAS(action, payload, token);
    }
  } catch (err) {
    console.error(err);
    return { ok: false, msg: "Erro ao processar" };
  }
}

function criarTenant(payload) {
  const { nome } = payload;
  const id = "sheet_" + Date.now();
  
  db.tenants[id] = { nome, id };
  
  return { ok: true, data: { sheet_id: id, nome } };
}

function login(payload) {
  const { email, sheet_id } = payload;
  const token = "token_" + Date.now() + "_" + Math.random().toString(36).slice(2);
  
  db.users[token] = { email, sheet_id, token };
  
  return { ok: true, data: { token, email } };
}

function listarReservas(payload, token) {
  if (!token || !db.users[token]) {
    return { ok: false, msg: "Não autenticado" };
  }
  
  const user = db.users[token];
  const reservas = db.reservas.filter(r => r.sheet_id === user.sheet_id);
  
  return { ok: true, data: reservas };
}

function criarReserva(payload, token) {
  if (!token || !db.users[token]) {
    return { ok: false, msg: "Não autenticado" };
  }
  
  const user = db.users[token];
  const { titulo, data_inicio, data_fim } = payload;
  
  const reserva = {
    id: "res_" + Date.now(),
    titulo,
    data_inicio,
    data_fim,
    status: "confirmada",
    sheet_id: user.sheet_id
  };
  
  db.reservas.push(reserva);
  
  return { ok: true, data: reserva };
}

async function callGAS(action, payload, token) {
  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `data=${encodeURIComponent(JSON.stringify({
        action,
        payload,
        token
      }))}`
    });

    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    return { ok: false, msg: "Erro ao chamar GAS" };
  }
}

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
