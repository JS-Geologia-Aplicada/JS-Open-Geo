import type { ReactNode } from "react";
import { ToolsProvider } from "./ToolsContext";

// AppProviders.tsx
export const AppProviders = ({ children }: { children: ReactNode }) => {
  return <ToolsProvider>{children}</ToolsProvider>;
};
