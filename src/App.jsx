import React, { useState, useEffect } from "react";

// ============================================================
// CONFIG
// ============================================================

const API_URL = "https://sistema-gestao-cultural.onrender.com/api";


// ============================================================
// AUTH
// ============================================================

const Auth = {
  getToken: () => localStorage.getItem("token"),
  setToken: (t) => localStorage.setItem("token", t),
  clear: () => localStorage.removeItem("token")
};


// ============================================================
// CORE API
// ============================================================

async function callAPI(action, payload = {}, useAuth = true) {
  try {
    const body = { action, payload };

    if (useAuth) {
      const token = Auth.getToken();
      if (!token) return { ok: false, msg: "NAO_AUTENTICADO" };
      body.token = token;
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    // 🔒 proteção contra resposta inválida
    let data;
    try {
      data = await res.json();
    } catch {
      return { ok: false, msg: "RESPOSTA_INVALIDA" };
    }

    return data;

  } catch (err) {
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
    callAPI("criarReserva", dados),

  salvarItem: (dados) =>
    callAPI("salvarItem", dados)
};


// ============================================================
// BOOTSTRAP
// ============================================================

async function bootstrap() {

  // 🔒 evita criar tenant toda vez
  if (Auth.getToken()) return true;

  const tenant = await API.criarTenant("Tenant Front");

  if (!tenant.ok) return false;

  const login = await API.login("dev@test.com", tenant.data.sheet_id);

  if (!login.ok) return false;

  Auth.setToken(login.data.token);

  return true;
}


// ============================================================
// UI COMPONENTS
// ============================================================

function Toast({ msg }) {
  if (!msg) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 20,
      right: 20,
      background: "#1A1D2E",
      color: "#fff",
      padding: "10px 14px",
      borderRadius: 6,
      fontSize: 14
    }}>
      {msg}
    </div>
  );
}

function Loader() {
  return <div style={{ padding: 20 }}>Carregando...</div>;
}


// ============================================================
// LAYOUT
// ============================================================

function Sidebar({ setView }) {
  const items = ["Dashboard", "Reservas"];

  return (
    <div style={{
      width: 220,
      background: "#0F1729",
      color: "#fff",
      padding: 20
    }}>
      {items.map(i => (
        <div
          key={i}
          style={{ margin: 12, cursor: "pointer" }}
          onClick={() => setView(i)}
        >
          {i}
        </div>
      ))}
    </div>
  );
}

function Topbar() {
  return (
    <div style={{
      background: "#fff",
      padding: 15,
      borderBottom: "1px solid #E2E5EF"
    }}>
      Sistema Cultural
    </div>
  );
}


// ============================================================
// TABLE
// ============================================================

function DataTable({ data }) {

  if (!data.length) {
    return <div style={{ padding: 20 }}>Nenhuma reserva encontrada</div>;
  }

  return (
    <table style={{ width: "100%", background: "#fff" }}>
      <tbody>
        {data.map(r => (
          <tr key={r.id}>
            <td style={{ padding: 10 }}>{r.titulo}</td>
            <td>{r.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}


// ============================================================
// MODAL
// ============================================================

function Modal({ open, onClose, onSave }) {

  const [titulo, setTitulo] = useState("");

  if (!open) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.3)"
    }}>
      <div style={{
        background: "#fff",
        padding: 20,
        margin: "10% auto",
        width: 320
      }}>
        <h3>Nova Reserva</h3>

        <input
          placeholder="Título"
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />

        <br /><br />

        <button onClick={() => onSave({ titulo })}>
          Salvar
        </button>

        <button onClick={onClose} style={{ marginLeft: 10 }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}


// ============================================================
// RESERVAS
// ============================================================

function Reservas() {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    const res = await API.listarReservas();

    if (res.ok && Array.isArray(res.data)) {
      setData(res.data);
    } else {
      setMsg(res.msg || res.error || "Erro ao carregar");
    }

    setLoading(false);
  }

  async function criar(dados) {

    const res = await API.criarReserva({
      ...dados,
      data_inicio: new Date().toISOString(),
      data_fim: new Date(Date.now() + 3600000).toISOString()
    });

    if (!res.ok) {
      setMsg(res.msg || res.error);
    } else {
      setMsg("Reserva criada");
      setModal(false);
      load();
    }

    setTimeout(() => setMsg(null), 2000);
  }

  return (
    <div>
      <h2>Reservas</h2>

      <button onClick={() => setModal(true)}>Nova</button>

      {loading ? <Loader /> : <DataTable data={data} />}

      <Modal open={modal} onClose={() => setModal(false)} onSave={criar} />

      <Toast msg={msg} />
    </div>
  );
}


// ============================================================
// DASHBOARD
// ============================================================

function Dashboard() {
  return <h2>Dashboard</h2>;
}


// ============================================================
// APP
// ============================================================

export default function App() {

  const [view, setView] = useState("Dashboard");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const ok = await bootstrap();
    setReady(ok);
  }

  if (!ready) {
    return <Loader />;
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      <Sidebar setView={setView} />

      <div style={{ flex: 1, background: "#F7F8FA" }}>
        <Topbar />

        <div style={{ padding: 20 }}>
          {view === "Reservas" ? <Reservas /> : <Dashboard />}
        </div>
      </div>
    </div>
  );
}