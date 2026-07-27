import type { ReactNode } from "react";
import { ToolsProvider } from "./ToolsContext";
import { ExtractionProvider } from "./ExtractionContext";
import { PyodideProvider } from "./PyodideContext";

// AppProviders.tsx
export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ToolsProvider>
      <ExtractionProvider>
        <PyodideProvider>{children}</PyodideProvider>
      </ExtractionProvider>
    </ToolsProvider>
  );
};
