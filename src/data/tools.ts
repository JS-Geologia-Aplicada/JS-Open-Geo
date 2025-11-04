import KmlToXlsx from "@/components/Tools/KmlToXlsx";
import TransformPage from "@/components/Tools/ExtractDxfTool";
import type { ComponentType } from "react";
import XlsxToKml from "@/components/Tools/XlsxToKml";
import XlsxToDxfProfile from "@/components/Tools/XlsxToDxfProfile";
import DistanceTool from "@/components/Tools/DistanceTool";

export interface Tool {
  id: string;
  name: string;
  description: string;
  component: ComponentType;
  icon: string;
}

export const TOOLS: Tool[] = [
  {
    id: "extract-dxf",
    name: "Ferramentas DXF",
    description:
      "Permite renomear sondagens de arquivos DXF e exportar como XLSX, KML e KMZ",
    component: TransformPage,
    icon: new URL("@/assets/icons/DxfTools.png", import.meta.url).href,
  },
  {
    id: "xlsx-to-kmz",
    name: "XLSX → KMZ/KML",
    description: "Converter planilha com sondagens para KMZ/KML",
    component: XlsxToKml,
    icon: new URL("@/assets/icons/XlsxToKml.png", import.meta.url).href,
  },
  {
    id: "kml-to-xlsx",
    name: "KMZ/KML → XLSX",
    description: "Extrair dados de KMZ para planilha",
    component: KmlToXlsx,
    icon: new URL("@/assets/icons/KmlToXlsx.png", import.meta.url).href,
  },
  {
    id: "xlsx-to-dxf-profile",
    name: "XLSX → Perfil DXF",
    description: "Criar perfil DXF a partir de planilha",
    component: XlsxToDxfProfile,
    icon: new URL("@/assets/icons/XlsxToDxf.png", import.meta.url).href,
  },
  {
    id: "distance-tool",
    name: "Medir Distâncias DXF",
    description: "Calcular distâncias entre sondagens e linha de referência",
    component: DistanceTool,
    icon: new URL("@/assets/icons/Distances.png", import.meta.url).href,
  },
];

export type ToolsType = (typeof TOOLS)[number];
