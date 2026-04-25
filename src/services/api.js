// ============================================================
// API SERVICE
// ============================================================

import { API_URL } from "../config/env";
import { Auth } from "./auth.js";

// ============================================================
// HTTP CLIENT
// ============================================================

async function httpPost(body) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  // erro HTTP
  if (!res.ok) {
    return {
      ok: false,
      msg: `HTTP_${res.status}`
    };
  }

  // leitura segura
  const text = await res.text();

  if (!text) {
    return { ok: false, msg: "RESPOSTA_VAZIA" };
  }

  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, msg: "JSON_INVALIDO" };
  }
}

// ============================================================
// CORE API
// ============================================================

async function callAPI(action, payload = {}, useAuth = true) {
  const body = { action, payload };

  if (useAuth) {
    const token = Auth.getToken();

    if (!token) {
      return { ok: false, msg: "NAO_AUTENTICADO" };
    }

    body.token = token;
  }

  try {
    return await httpPost(body);
  } catch (err) {
    console.error("Erro de conexão:", err);
    return { ok: false, msg: "ERRO_CONEXAO" };
  }
}

// ============================================================
// API (NEGÓCIO)
// ============================================================

export const API = {
  criarTenant(nome) {
    return callAPI("criarTenant", { nome }, false);
  },

  login(email, sheet_id) {
    return callAPI("login", { email, sheet_id }, false);
  },

  listarReservas() {
    return callAPI("listarReservas");
  },

  criarReserva(dados) {
    return callAPI("criarReserva", dados);
  },

  salvarItem(dados) {
    return callAPI("salvarItem", dados);
  }
};