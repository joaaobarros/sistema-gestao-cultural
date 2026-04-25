import { useState, useEffect } from "react";
import { API_URL } from "./config/env";

// DEBUG (pode remover depois)
console.log("API_URL:", API_URL);

// ============================================================
// AUTH
// ============================================================

const Auth = {
  getToken: () => localStorage.getItem("token"),
  setToken: (t) => localStorage.setItem("token", t),
  clear: () => localStorage.removeItem("token")
};

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

  if (!res.ok) {
    return { ok: false, msg: `HTTP_${res.status}` };
  }

  const text = await res.text();

  if (!text) return { ok: false, msg: "RESPOSTA_VAZIA" };

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
// API
// ============================================================

const API = {
  criarTenant: (nome) =>
    callAPI("criarTenant", { nome }, false),

  login: (email, sheet_id) =>
    callAPI("login", { email, sheet_id }, false),

  listarReservas: () =>
    callAPI("listarReservas"),

  criarReserva: (dados) =>
    callAPI("criarReserva", dados)
};

// ============================================================
// BOOTSTRAP
// ============================================================

async function bootstrap() {
  const existingToken = Auth.getToken();

  if (existingToken) return true;

  const tenant = await API.criarTenant("Tenant Front");

  if (!tenant.ok || !tenant.data) return false;

  const login = await API.login("dev@test.com", tenant.data.sheet_id);

  if (!login.ok || !login.data) return false;

  Auth.setToken(login.data.token);

  return true;
}

// ============================================================
// UI
// ============================================================

function Loader() {
  return <div style={{ padding: 20 }}>Carregando...</div>;
}

function Sidebar({ setView }) {
  return (
    <div style={{ width: 220, background: "#0F1729", color: "#fff", padding: 20 }}>
      <div onClick={() => setView("Dashboard")} style={{ margin: 12, cursor: "pointer" }}>Dashboard</div>
      <div onClick={() => setView("Reservas")} style={{ margin: 12, cursor: "pointer" }}>Reservas</div>
    </div>
  );
}

function Topbar() {
  return (
    <div style={{ background: "#fff", padding: 15, borderBottom: "1px solid #E2E5EF" }}>
      Sistema Cultural
    </div>
  );
}

function Reservas() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await API.listarReservas();

    if (res.ok) setData(res.data || []);

    setLoading(false);
  }

  useEffect(() => {
    const run = async () => {
      await load();
    };

  run();
}, []);

  return (
    <div>
      <h2>Reservas</h2>
      {loading ? <Loader /> : data.map(r => (
        <div key={r.id}>{r.titulo}</div>
      ))}
    </div>
  );
}

function Dashboard() {
  return <h2>Dashboard</h2>;
}

// ============================================================
// APP
// ============================================================

export default function App() {
  const [view, setView] = useState("Dashboard");
  const [ready, setReady] = useState(false);

  async function init() {
    const ok = await bootstrap();
    setReady(ok);
  }

  useEffect(() => {
    const run = async () => {
      await init();
    };

    run();
  }, []);

  if (!ready) return <Loader />;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar setView={setView} />

      <div style={{ flex: 1 }}>
        <Topbar />

        <div style={{ padding: 20 }}>
          {view === "Reservas" ? <Reservas /> : <Dashboard />}
        </div>
      </div>
    </div>
  );
}