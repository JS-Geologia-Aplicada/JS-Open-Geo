import { useState } from "react";
import { Button } from "react-bootstrap";
import { ToolLayout } from "@/components/Tools/ToolLayout";
import { ToolControlSection } from "@/components/Tools/ToolControlSection";
import type { PyodideInterface } from "@/types/pyodide";
import { error } from "pdf-lib";

import pythonInitPy from "@/python/__init__.py?raw";
import sondagensPy from "@/python/dxf_generators/sondagens.py?raw";

const SONDAGENS_TESTE: {
  layer: string;
  color?: 2 | 3 | 4 | 5 | 6;
  boreholes: { id: string; x: number; y: number }[];
}[] = [
  {
    layer: "Corte",
    color: 3,
    boreholes: [
      { id: "SPC-01", x: 10, y: 50 },
      { id: "SPC-02", x: 30, y: 60 },
    ],
  },
  {
    layer: "Bueiro",
    boreholes: [{ id: "SPB-01", x: 50, y: 100 }],
  },
];

const PyodidePlayground = () => {
  const [status, setStatus] = useState<string>("Não inicializado");
  const [loading, setLoading] = useState(false);
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [ezdxfInstalled, setEzdxfInstalled] = useState(false);
  const [testResult, setTestResult] = useState<string>("");
  const [modulesLoaded, setModulesLoaded] = useState(false);

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

  const handleLoadModules = async () => {
    if (!pyodide || !ezdxfInstalled) return;

    setLoading(true);
    setStatus("Carregando módulos Python...");

    try {
      // Criar estrutura de diretórios
      pyodide.FS.mkdir("/python");
      pyodide.FS.mkdir("/python/dxf_generators");

      // Escrever arquivos Python no filesystem virtual
      pyodide.FS.writeFile("/python/__init__.py", pythonInitPy);
      pyodide.FS.writeFile("/python/dxf_generators/sondagens.py", sondagensPy);

      // Adicionar /python ao sys.path
      await pyodide.runPythonAsync(`
      import sys
      if '/python' not in sys.path:
          sys.path.insert(0, '/python')
    `);

      setModulesLoaded(true);
      setStatus("Módulos Python carregados com sucesso!");
    } catch (error) {
      setStatus(`Erro ao carregar módulos: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInstallEzdxf = async () => {
    if (!pyodide) return;

    setLoading(true);
    setStatus("Instalando ezdxf...");

    try {
      await pyodide.loadPackage("micropip");
      await pyodide.runPythonAsync(`
        import micropip
        await micropip.install("ezdxf")
      `);

      setEzdxfInstalled(true);
      setStatus("ezdxf instalado com sucesso!");
    } catch (error) {
      setStatus(`Erro ao instalar ezdxf: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestEzdxf = async () => {
    if (!pyodide || !ezdxfInstalled || !modulesLoaded) return;

    setLoading(true);
    setStatus("Testando módulos...");

    try {
      const result = await pyodide.runPythonAsync(`
        import ezdxf
        from dxf_generators.simple_shapes import generate_line_dxf
        
        f"ezdxf versão: {ezdxf.version}\\nMódulos importados com sucesso!"
      `);

      setTestResult(result);
      setStatus("Teste concluído!");
    } catch (error) {
      setStatus(`Erro no teste: ${error}`);
      setTestResult("");
    } finally {
      setLoading(false);
    }
  };

  const handleReloadModules = async () => {
    if (!pyodide || !ezdxfInstalled) return;

    setLoading(true);
    setStatus("Recarregando módulos Python...");

    try {
      // Remover módulo do cache Python
      await pyodide.runPythonAsync(`
      import sys
      if 'dxf_generators.sondagens' in sys.modules:
          del sys.modules['dxf_generators.sondagens']
      if 'dxf_generators' in sys.modules:
          del sys.modules['dxf_generators']
    `);

      // Sobrescrever arquivos
      pyodide.FS.writeFile("/python/dxf_generators/sondagens.py", sondagensPy);

      setStatus("Módulos recarregados com sucesso!");
    } catch (error) {
      setStatus(`Erro ao recarregar módulos: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Handler
  const handleGenerateTest = async () => {
    if (!pyodide || !ezdxfInstalled || !modulesLoaded) return;

    setLoading(true);
    setStatus("Gerando dxf com arquivo teste...");

    try {
      const dxfString = await pyodide.runPythonAsync(`
import json
from dxf_generators.sondagens import generate_boreholes_dxf
data = json.loads('''${JSON.stringify(SONDAGENS_TESTE)}''')
generate_boreholes_dxf(data)
`);

      const blob = new Blob([dxfString], { type: "application/dxf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "teste.dxf";
      link.click();
      URL.revokeObjectURL(url);

      setStatus("Teste de alvos gerado com sucesso!");
    } catch (error) {
      setStatus(`Erro ao gerar teste: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolLayout
      title="Playground Pyodide"
      controls={
        <>
          <ToolControlSection title="Configuração Pyodide">
            <div className="d-flex flex-column gap-2">
              <Button
                variant="primary"
                onClick={handleInitPyodide}
                disabled={loading || !!pyodide}
              >
                {pyodide ? "✓ Pyodide Carregado" : "1. Inicializar Pyodide"}
              </Button>

              <Button
                variant="primary"
                onClick={handleInstallEzdxf}
                disabled={loading || !pyodide || ezdxfInstalled}
              >
                {ezdxfInstalled ? "✓ ezdxf Instalado" : "2. Instalar ezdxf"}
              </Button>

              <Button
                variant="primary"
                onClick={handleLoadModules}
                disabled={loading || !ezdxfInstalled || modulesLoaded}
              >
                {modulesLoaded
                  ? "✓ Módulos Carregados"
                  : "3. Carregar Módulos Python"}
              </Button>

              <Button
                variant="warning"
                onClick={handleReloadModules}
                disabled={loading || !modulesLoaded}
              >
                Recarregar Móduloss
              </Button>

              <Button
                variant="secondary"
                onClick={handleTestEzdxf}
                disabled={loading || !modulesLoaded}
              >
                Testar Importação
              </Button>

              <div className="alert alert-info mb-0">
                <strong>Status:</strong> {status}
              </div>

              {testResult && (
                <div className="alert alert-success mb-0">
                  <strong>Resultado do Teste:</strong>
                  <pre className="mb-0 mt-2">{testResult}</pre>
                </div>
              )}
            </div>
          </ToolControlSection>

          <ToolControlSection title="Gerar DXF">
            <div className="d-flex flex-column gap-2">
              <Button
                variant="success"
                onClick={handleGenerateTest}
                disabled={loading || !modulesLoaded}
              >
                Gerar Teste
              </Button>
            </div>
          </ToolControlSection>

          <div className="mt-3 text-start small">
            <strong>Status:</strong> {status}
          </div>
        </>
      }
      panel={
        <div className="p-3">
          {testResult && (
            <div className="alert alert-success">
              <strong>Resultado do teste:</strong>
              <pre className="mb-0 mt-2">{testResult}</pre>
            </div>
          )}
        </div>
      }
    />
  );
};

export default PyodidePlayground;
