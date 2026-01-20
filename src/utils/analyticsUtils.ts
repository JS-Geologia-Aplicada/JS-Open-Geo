import { initializeApp } from "firebase/app";
import { getDatabase, ref, runTransaction } from "firebase/database";
import type {
  AnalyticsCounters,
  AnalyticsEvent,
} from "../types/analyticsTypes";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

class AnalyticsService {
  private readonly STORAGE_KEY = "opengeo_analytics";
  private db;
  private environment: "localhost" | "vercel" | "gh-pages";
  private readonly DEBOUNCE_MS = 2000;
  private flushTimeout: NodeJS.Timeout | null = null;

  constructor() {
    console.log("🔧 ENV Variables:", {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    });
    // Detecta ambiente
    this.environment = this.getEnvironment();

    // Inicializa Firebase apenas se config estiver preenchida
    if (firebaseConfig.apiKey && firebaseConfig.databaseURL) {
      try {
        const app = initializeApp(firebaseConfig);
        this.db = getDatabase(app);
      } catch (error) {
        console.error("❌ Erro ao inicializar Firebase:", error);
      }
    } else {
      console.warn("⚠️ Firebase não configurado");
    }
  }

  /**
   * Inicializa contadores vazios
   */
  private getEmptyCounters(): AnalyticsCounters {
    return {
      pageview: 0,
      extract_preview: 0,
      export_json: 0,
      export_excel: 0,
      export_csv: 0,
      export_leapfrog_zip: 0,
      export_leapfrog_collar: 0,
      export_leapfrog_nspt: 0,
      export_leapfrog_na: 0,
      export_leapfrog_geology: 0,
      export_leapfrog_interp: 0,
      export_ags: 0,
      generate_dxf_count: 0,
      generate_dxf_sondagens: 0,
      dxf_tools: 0,
      distance_tool: 0,
      kml_to_xlsx: 0,
      xlsx_to_dxf_profile: 0,
      xlsx_to_kml: 0,
    };
  }

  /**
   * Lê contadores do localStorage
   */
  private getCounters(): AnalyticsCounters {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return this.getEmptyCounters();

      const parsed = JSON.parse(stored);
      // Merge com empty para garantir que todos os campos existam
      return { ...this.getEmptyCounters(), ...parsed };
    } catch (error) {
      console.error("Erro ao ler analytics do localStorage:", error);
      return this.getEmptyCounters();
    }
  }

  /**
   * Salva contadores no localStorage
   */
  private saveCounters(counters: AnalyticsCounters): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(counters));
    } catch (error) {
      console.error("Erro ao salvar analytics no localStorage:", error);
    }
  }

  /**
   * Verifica se há dados pendentes de envio
   */
  public getPendingData(): AnalyticsCounters | null {
    const counters = this.getCounters();
    const hasData = Object.values(counters).some((value) => value > 0);
    return hasData ? counters : null;
  }

  /**
   * Incrementa um contador específico
   */
  public track(event: AnalyticsEvent, value: number = 1): void {
    const counters = this.getCounters();
    counters[event] += value;
    this.saveCounters(counters);
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    this.flushTimeout = setTimeout(() => {
      this.flush();
      this.flushTimeout = null;
    }, this.DEBOUNCE_MS);
  }
  /**
   * Envia dados para o Firebase e limpa localStorage
   */
  public async flush(): Promise<void> {
    const counters = this.getPendingData();
    if (!counters || !this.db) return;

    try {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const dailyRef = ref(
        this.db,
        `analytics/${this.environment}/daily/${today}`,
      );

      // Incrementa todos os contadores numa transação atômica
      await runTransaction(dailyRef, (current) => {
        const updated = current || {};

        Object.entries(counters).forEach(([key, value]) => {
          updated[key] = (updated[key] || 0) + value;
        });

        return updated;
      });

      // Limpa localStorage apenas se enviou com sucesso
      localStorage.removeItem(this.STORAGE_KEY);

      console.log("Analytics enviado com sucesso:", counters);
    } catch (error) {
      console.error("Erro ao enviar analytics:", error);
      // Mantém dados no localStorage para tentar depois
    }
  }

  /**
   * Detecta o ambiente atual
   */
  private getEnvironment(): "localhost" | "vercel" | "gh-pages" {
    const hostname = window.location.hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "localhost";
    }

    if (hostname.includes("vercel.app")) {
      return "vercel";
    }

    // GitHub Pages: pode ser username.github.io ou custom domain
    if (
      hostname.includes("github.io") ||
      hostname === "SEU_DOMINIO_CUSTOMIZADO"
    ) {
      return "gh-pages";
    }

    // Fallback padrão
    return "gh-pages";
  }

  /**
   * Versão síncrona do flush para usar no beforeunload
   * Usa sendBeacon como fallback se Firebase falhar
   */
  public flushSync(): void {
    const counters = this.getPendingData();
    if (!counters) return;

    try {
      // Tenta flush normal (async)
      this.flush();

      // Fallback: sendBeacon se tiver endpoint configurado
      // (você pode adicionar um Cloud Function endpoint depois)
      const fallbackEndpoint = ""; // Adicionar se quiser
      if (fallbackEndpoint) {
        const payload = JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          counters: counters,
        });
        navigator.sendBeacon(fallbackEndpoint, payload);
      }
    } catch (error) {
      console.error("Erro no flushSync:", error);
    }
  }
}

// Exporta instância única
export const analytics = new AnalyticsService();
