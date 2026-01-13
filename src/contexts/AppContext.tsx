import type { ReactNode } from "react";
import { ToolsProvider } from "./ToolsContext";
import { ExtractionProvider } from "./ExtractionContext";

// AppProviders.tsx
export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ToolsProvider>
      <ExtractionProvider>{children}</ExtractionProvider>
    </ToolsProvider>
  );
};
