declare global {
  interface Window {
    loadPyodide: (config?: { indexURL?: string }) => Promise<PyodideInterface>;
  }
}

export interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<any>;
  runPython: (code: string) => any;
  loadPackage: (packages: string | string[]) => Promise<void>;
  FS: any;
  globals: any;
}

export {};
