import type {
  Area,
  ExtractionProgress,
  ExtractionType,
  PageTextData,
  PalitoData,
} from "@/types";
import { createContext, useContext, useState, type ReactNode } from "react";

interface ExtractionState {
  areas: Area[];
  selectedFile: File | null;
  extractedTexts: PageTextData[];
  palitoData: PalitoData[];
  isExtracting: boolean;
  extractionProgress: ExtractionProgress | null;
  extractionMode: ExtractionType;
  isSelectionActive: boolean;
  activeAreaId: string | null;
  excludedPages: Set<number>;
}

const ExtractionContext = createContext<ExtractionContextType | undefined>(
  undefined
);

const initialState: ExtractionState = {
  areas: [],
  selectedFile: null,
  extractedTexts: [],
  palitoData: [],
  isExtracting: false,
  extractionProgress: null,
  extractionMode: "text",
  isSelectionActive: false,
  activeAreaId: null,
  excludedPages: new Set<number>(),
};

interface ExtractionContextType {
  extractionState: ExtractionState;
  updateExtractionState: (updates: Partial<ExtractionState>) => void;
  resetExtractionState: () => void;
  updateArea: (areaId: string, updates: Partial<Area>) => void;
  handleFileChange: (file: File) => void;
}

export const ExtractionProvider = ({ children }: { children: ReactNode }) => {
  const [extractionState, setExtractionState] =
    useState<ExtractionState>(initialState);

  const updateExtractionState = (updates: Partial<ExtractionState>) => {
    setExtractionState((prev) => ({ ...prev, ...updates }));
  };

  const resetExtractionState = () => {
    setExtractionState(initialState);
  };

  const updateArea = (areaId: string, updates: Partial<Area>) => {
    setExtractionState((prev) => ({
      ...prev,
      areas: prev.areas.map((area) =>
        area.id === areaId ? { ...area, ...updates } : area
      ),
    }));
  };

  const handleFileChange = (file: File) => {
    updateExtractionState({
      selectedFile: file,
      excludedPages: new Set<number>(), // 👈 Limpa ao trocar
    });
  };

  return (
    <ExtractionContext.Provider
      value={{
        extractionState,
        updateExtractionState,
        resetExtractionState,
        updateArea,
        handleFileChange,
      }}
    >
      {children}
    </ExtractionContext.Provider>
  );
};

export const useExtractionContext = () => {
  const context = useContext(ExtractionContext);
  if (!context) {
    throw new Error(
      "useExtractionContext deve ser utilizado com ExtractionProvider"
    );
  }
  return context;
};
