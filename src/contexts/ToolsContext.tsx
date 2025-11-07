import type { CardinalOrdinalDirection } from "@/utils/distanceUtils";
import type {
  CardinalDirection,
  CodedDxf,
  DxfInsert,
  DxfPolyline,
} from "@/utils/dxfParseUtils";
import type { DatumType, ZoneType } from "@/utils/mapUtils";
import type { XlsxRow } from "@/utils/xlsxUtils";
import { createContext, useContext, useState, type ReactNode } from "react";

// Estado de cada ferramenta
interface KmlToXlsxState {
  selectedFile: File | null;
  convertCoordinates: boolean;
  selectedDatum?: DatumType | undefined;
  selectedZone?: ZoneType | undefined;
  sondagens: any[];
}

interface XlsxToDxfProfileState {
  selectedFile: File | null;
  hasHeader: boolean;
  nameColumnIndex: number;
  distanceColumnIndex: number;
  zColumnIndex: number;
  textRotation: "horizontal" | "vertical";
  fontSize: number;
  rawData: XlsxRow[];
  headers: string[];
}

interface ExtractDxfToolState {
  selectedFile: File | null;
  fileText: string;
  selectedDatum?: DatumType;
  selectedZone?: ZoneType;
  selectedIdField?: string;
  useNewName: boolean;
  renamingConfigs: {
    direction: CardinalDirection;
    layerConfigs: Record<
      string,
      {
        prefix: string;
        numberLength: number;
        startNumber: number;
      }
    >;
  };
  dxfData: DxfInsert[];
  dxfType?: "block" | "multileader";
  codedDxf?: CodedDxf[];
  renamedFileText?: string;
  fileLayers?: Set<string>;
}

interface DistanceToolState {
  selectedFile: File | null;
  fileText: string;
  inserts: DxfInsert[];
  polylines: DxfPolyline[];
  dxfData: DxfInsert[];
  dxfType?: "block" | "multileader";
  attributeColumns: string[];
  insertLayers: string[];
  polylineLayers: string[];
  selectedInsertLayers: string[];
  selectedPolylineLayer: string;
  selectedDirection?: CardinalOrdinalDirection;
  selectedIdField?: string;
  distanceResults: any[];
}

interface XlsxToKmlState {
  selectedFile: File | null;
  rawData: XlsxRow[];
  headers: string[];
  hasHeader: boolean;
  nameColumnIndex: number;
  xColumnIndex: number;
  yColumnIndex: number;
  selectedDatum?: DatumType;
  selectedZone?: ZoneType;
}

// Estado global
export interface ToolsState {
  kmlToXlsx: KmlToXlsxState;
  xlsxToDxfProfile: XlsxToDxfProfileState;
  extractDxfTool: ExtractDxfToolState;
  distanceTool: DistanceToolState;
  xlsxToKml: XlsxToKmlState;
}

interface ToolsContextType {
  state: ToolsState;
  updateToolState: <K extends keyof ToolsState>(
    tool: K,
    updates: Partial<ToolsState[K]>
  ) => void;
  resetToolState: <K extends keyof ToolsState>(tool: K) => void;
  resetAllStates: () => void;
}

const ToolsContext = createContext<ToolsContextType | undefined>(undefined);

// Estados iniciais
const initialKmlToXlsx: KmlToXlsxState = {
  selectedFile: null,
  convertCoordinates: false,
  selectedDatum: undefined,
  selectedZone: undefined,
  sondagens: [],
};

const initialXlsxToDxfProfile: XlsxToDxfProfileState = {
  selectedFile: null,
  hasHeader: false,
  nameColumnIndex: 0,
  distanceColumnIndex: 1,
  zColumnIndex: 2,
  textRotation: "horizontal",
  fontSize: 10,
  rawData: [],
  headers: [],
};

const initialExtractDxfTool: ExtractDxfToolState = {
  selectedFile: null,
  fileText: "",
  selectedDatum: undefined,
  selectedZone: undefined,
  selectedIdField: undefined,
  useNewName: false,
  renamingConfigs: {
    direction: "N-S",
    layerConfigs: {},
  },
  dxfData: [],
};

const initialDistanceTool: DistanceToolState = {
  selectedFile: null,
  fileText: "",
  inserts: [],
  polylines: [],
  dxfData: [],
  attributeColumns: [],
  insertLayers: [],
  polylineLayers: [],
  selectedPolylineLayer: "",
  selectedInsertLayers: [],
  distanceResults: [],
};

const initialXlsxToKml: XlsxToKmlState = {
  selectedFile: null,
  rawData: [],
  headers: [],
  hasHeader: false,
  nameColumnIndex: 1,
  xColumnIndex: 2,
  yColumnIndex: 3,
};

const initialState: ToolsState = {
  kmlToXlsx: initialKmlToXlsx,
  xlsxToDxfProfile: initialXlsxToDxfProfile,
  extractDxfTool: initialExtractDxfTool,
  distanceTool: initialDistanceTool,
  xlsxToKml: initialXlsxToKml,
};

export const ToolsProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ToolsState>(initialState);

  const updateToolState = <K extends keyof ToolsState>(
    tool: K,
    updates: Partial<ToolsState[K]>
  ) => {
    setState((prev) => ({
      ...prev,
      [tool]: {
        ...prev[tool],
        ...updates,
      },
    }));
  };

  const resetToolState = <K extends keyof ToolsState>(tool: K) => {
    setState((prev) => ({
      ...prev,
      [tool]: initialState[tool],
    }));
  };

  const resetAllStates = () => {
    setState(initialState);
  };

  return (
    <ToolsContext.Provider
      value={{ state, updateToolState, resetToolState, resetAllStates }}
    >
      {children}
    </ToolsContext.Provider>
  );
};

export const useToolsContext = () => {
  const context = useContext(ToolsContext);
  if (!context) {
    throw new Error("useToolsContext must be used within ToolsProvider");
  }
  return context;
};
