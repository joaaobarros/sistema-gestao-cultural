import { useEffect, useState } from "react";
import { Auth } from "../services/auth.js";
import { API } from "../services/api.js";

// ============================================================
// HOOK: APP INIT
// ============================================================

export function useAppInit() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        // Se já tem token, apenas usa
        const existingToken = Auth.getToken();
        if (existingToken) {
          console.log("✅ Token já existe");
          setAuthenticated(true);
          setReady(true);
          return;
        }

        // Criar tenant
        console.log("🔄 Criando tenant...");
        const tenant = await API.criarTenant("Tenant Front");
        if (!tenant.ok) {
          console.error("❌ Erro ao criar tenant:", tenant);
          setReady(true);
          return;
        }

        // Login
        console.log("🔄 Fazendo login...");
        const login = await API.login("dev@test.com", tenant.data.sheet_id);
        if (!login.ok) {
          console.error("❌ Erro ao fazer login:", login);
          setReady(true);
          return;
        }

        // Salvar token
        Auth.setToken(login.data.token);
        console.log("✅ Bootstrap completo");
        setAuthenticated(true);
        setReady(true);
      } catch (err) {
        console.error("❌ Erro no bootstrap:", err);
        setReady(true);
      }
    }

    bootstrap();
  }, []);

  return {
    ready,
    authenticated
  };
}