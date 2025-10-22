import KmlToXlsx from "@/components/Tools/KmlToXlsx";
import TransformPage from "@/components/Tools/ExtractDxfTool";
import type { ComponentType } from "react";
import XlsxToKmz from "@/components/Tools/XlsxToKmz";
import XlsxToDxfProfile from "@/components/Tools/XlsxToDxfProfile";

export interface Tool {
  id: string;
  name: string;
  description: string;
  component: ComponentType;
  icon?: string;
}

export const TOOLS: Tool[] = [
  {
    id: "extract-dxf",
    name: "Ferramentas DXF",
    description:
      "Permite renomear sondagens de arquivos DXF e exportar como XLSX, KML e KMZ",
    component: TransformPage,
  },
  {
    id: "xlsx-to-kmz",
    name: "XLSX → KMZ/KML",
    description: "Converter planilha com sondagens para KMZ/KML",
    component: XlsxToKmz,
  },
  {
    id: "kml-to-xlsx",
    name: "KMZ/KML → XLSX",
    description: "Extrair dados de KMZ para planilha",
    component: KmlToXlsx,
  },
  {
    id: "xlsx-to-dxf-profile",
    name: "XLSX → Perfil DXF",
    description: "Criar perfil DXF a partir de planilha",
    component: XlsxToDxfProfile,
  },
  //   {
  //     id: "dxf-to-table",
  //     name: "DXF → Tabela DXF",
  //     description: "Criar tabela DXF com dados das sondagens",
  //   },
  //   {
  //     id: "dxf-distances",
  //     name: "Medir Distâncias DXF",
  //     description: "Calcular distâncias entre sondagens e linha de referência",
  //   },
];

export type ToolsType = (typeof TOOLS)[number];
