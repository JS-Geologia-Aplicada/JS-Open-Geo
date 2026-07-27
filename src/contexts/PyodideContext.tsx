import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface PyodideContextType {
  pyodide: any | null;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  loadPythonModule: (modulePath: string) => Promise<void>;
  runPythonCode: (code: string, moduleName: string) => Promise<void>;
}

const PyodideContext = createContext<PyodideContextType | null>(null);

export const PyodideProvider = ({ children }: { children: ReactNode }) => {
  const [pyodide, setPyodide] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedModules, setLoadedModules] = useState<Set<String>>(new Set());

  const initPromiseRef = useRef<Promise<void> | null>(null);
  const pyodideRef = useRef<any | null>(null);

  const initialize = useCallback(async () => {
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    if (pyodideRef.current) {
      return Promise.resolve();
    }

    const promise = (async () => {
      setIsLoading(true);
      setError(null);

      try {
        // @ts-ignore - loadPyodide vem do CDN
        const pyodideInstance = await loadPyodide();

        // Instalar micropip e ezdxf
        await pyodideInstance.loadPackage("micropip");
        const micropip = pyodideInstance.pyimport("micropip");
        await micropip.install("ezdxf");

        pyodideRef.current = pyodideInstance;
        setPyodide(pyodideInstance);
        setIsReady(true);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido";
        console.error("Erro ao inicializar Pyodide:", errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
        initPromiseRef.current = null;
      }
    })();

    initPromiseRef.current = promise;
    return promise;
  }, [pyodide, isLoading, isReady]);

  const loadPythonModule = useCallback(
    async (modulePath: string) => {
      if (initPromiseRef.current) {
        await initPromiseRef.current;
      }

      if (!pyodideRef.current) {
        throw new Error(
          "Pyodide não está pronto. Chame initialize() primeiro.",
        );
      }

      if (loadedModules.has(modulePath)) {
        return;
      }

      try {
        const module = await import(`${modulePath}?raw`);
        const pythonCode = module.default;

        await pyodideRef.current.runPythonAsync(pythonCode);

        setLoadedModules((prev) => new Set(prev).add(modulePath));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido";
        console.error(`Erro ao carregar módulo ${modulePath}:`, errorMessage);
        throw err;
      }
    },

    [pyodide, isReady, loadedModules],
  );

  const runPythonCode = useCallback(
    async (code: string, modulePath: string) => {
      if (initPromiseRef.current) {
        await initPromiseRef.current;
      }

      if (!pyodideRef.current) {
        throw new Error("Pyodide não foi inicializado");
      }

      if (loadedModules.has(modulePath)) {
        return;
      }

      try {
        const pyodide = pyodideRef.current;

        // Parse do caminho
        const parts = modulePath.split("/");
        const dirPath = parts.slice(0, -1).join("/");

        // Criar diretórios recursivamente
        if (dirPath) {
          let currentPath = "";
          for (const dir of parts.slice(0, -1)) {
            currentPath += (currentPath ? "/" : "") + dir;

            try {
              pyodide.FS.lookupPath(`/${currentPath}`);
            } catch {
              pyodide.FS.mkdir(`/${currentPath}`);
              pyodide.FS.writeFile(`/${currentPath}/__init__.py`, "");
            }
          }
        }

        // Escrever arquivo
        const fullPath = `/${modulePath}.py`;
        pyodide.FS.writeFile(fullPath, code);

        // ← FIX: Adicionar root ao sys.path
        const rootDir = `/${parts[0]}`;
        await pyodide.runPythonAsync(`
import sys
root_path = '${rootDir}'
if root_path not in sys.path:
    sys.path.insert(0, root_path)
    print(f"✅ Adicionado {root_path} ao sys.path")
      `);

        setLoadedModules((prev) => new Set(prev).add(modulePath));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido";
        console.error(`❌ Erro ao criar módulo ${modulePath}:`, errorMessage);
        throw err;
      }
    },
    [loadedModules],
  );

  return (
    <PyodideContext.Provider
      value={{
        pyodide,
        isLoading,
        isReady,
        error,
        initialize,
        loadPythonModule,
        runPythonCode,
      }}
    >
      {children}
    </PyodideContext.Provider>
  );
};

export const usePyodide = () => {
  const context = useContext(PyodideContext);
  if (!context) {
    throw new Error("usePyodide deve ser usado dentro de PyodideProvider");
  }
  return context;
};
