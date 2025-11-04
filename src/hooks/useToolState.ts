import { useToolsContext, type ToolsState } from "@/contexts/ToolsContext";

export const useToolState = <T extends keyof ToolsState>(toolName: T) => {
  const { state, updateToolState, resetToolState } = useToolsContext();

  const toolState = state[toolName];

  const update = (updates: Partial<typeof toolState>) => {
    updateToolState(toolName, updates);
  };

  const reset = () => {
    resetToolState(toolName);
  };

  return { state: toolState, update, reset };
};
