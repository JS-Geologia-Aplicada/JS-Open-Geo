import { useState } from "react";
import { Button } from "react-bootstrap";
import { ToolLayout } from "@/components/Tools/ToolLayout";
import { ToolControlSection } from "@/components/Tools/ToolControlSection";
import type { PyodideInterface } from "@/types/pyodide";
import { error } from "pdf-lib";

const PyodidePlayground = () => {
  const [status, setStatus] = useState<string>("Não inicializado");
  const [loading, setLoading] = useState(false);
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [ezdxfInstalled, setEzdxfInstalled] = useState(false);

  const handleInitPyodide = async () => {
    setLoading(true);
    setStatus("Carregando Pyodide...");

    try {
      const pyodideInstance = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
      });

      setPyodide(pyodideInstance);
      setStatus("Pyodide carregado");
    } catch (e) {
      setStatus(`Erro: ${error}`);
      console.error(e);
    }

    setLoading(false);
  };

  const handleInstallEzdxf = async () => {
    if (!pyodide) return;

    setLoading(true);
    setStatus("Instalando micropip...");

    try {
      // 1. Carregar micropip
      await pyodide.loadPackage("micropip");
      setStatus("Instalando ezdxf...");

      // 2. Instalar ezdxf
      await pyodide.runPythonAsync(`
        import micropip
        await micropip.install("ezdxf")
      `);

      setEzdxfInstalled(true);
      setStatus("✅ ezdxf instalado com sucesso!");
    } catch (error) {
      setStatus(`❌ Erro ao instalar: ${error}`);
      console.error(error);
    }

    setLoading(false);
  };

  return (
    <ToolLayout
      title="Playground Pyodide"
      controls={
        <>
          <ToolControlSection title="Inicialização">
            <Button
              onClick={handleInitPyodide}
              disabled={loading}
              className="w-100"
            >
              {loading ? "Carregando..." : "Inicializar Pyodide"}
            </Button>
            <div className="mt-3 text-start small">
              <strong>Status:</strong> {status}
            </div>
          </ToolControlSection>
          <ToolControlSection title="Instalar ezdxf">
            <Button
              onClick={handleInstallEzdxf}
              disabled={loading || !pyodide || ezdxfInstalled}
              className="w-100"
            >
              {loading ? "Instalando..." : "Instalar ezdxf"}
            </Button>
          </ToolControlSection>
        </>
      }
      panel={
        <div className="p-3">
          <p>Área de testes e logs</p>
        </div>
      }
    />
  );
};

export default PyodidePlayground;
