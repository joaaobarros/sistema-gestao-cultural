import { useState } from "react";
import { API } from "../services/api";
import { Auth } from "../services/auth.js";

// ============================================================
// COMPONENT: LOGIN SCREEN
// ============================================================

export function LoginScreen() {
  const [form, setForm] = useState({
    email: "",
    sheetId: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================================
  // HANDLERS
  // ============================================================

  function handleChange(field, value) {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const res = await API.login(form.email, form.sheetId);

      if (!res.ok || !res.data) {
        setError(res.msg || "Erro no login");
        return;
      }

      Auth.setToken(res.data.token);

      // comunica mudança global de auth
      window.dispatchEvent(new Event("auth-change"));

    } catch (err) {
      console.error("Erro no login:", err);
      setError("ERRO_CONEXAO");
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login</h2>

        <input
          style={styles.input}
          placeholder="Email"
          value={form.email}
          onChange={e => handleChange("email", e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Sheet ID"
          value={form.sheetId}
          onChange={e => handleChange("sheetId", e.target.value)}
        />

        <button
          style={styles.button}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

// ============================================================
// STYLES (ISOLADO)
// ============================================================

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#F7F8FA"
  },
  card: {
    background: "#fff",
    padding: 24,
    borderRadius: 8,
    width: 320,
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },
  title: {
    marginBottom: 16
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 12,
    border: "1px solid #E2E5EF",
    borderRadius: 4
  },
  button: {
    width: "100%",
    padding: 10,
    background: "#1A1D2E",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer"
  },
  error: {
    color: "red",
    marginTop: 10
  }
};