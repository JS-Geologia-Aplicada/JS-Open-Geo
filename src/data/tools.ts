import KmlToXlsx from "@/components/Tools/KmlToXlsx";
import TransformPage from "@/components/Tools/ExtractDxfTool";
import type { ComponentType } from "react";

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
    component: KmlToXlsx,
  },
  //   {
  //     id: "kmz-to-xlsx",
  //     name: "KMZ → XLSX",
  //     description: "Extrair dados de KMZ para planilha",
  //   },
  //   {
  //     id: "xlsx-profile-to-dxf",
  //     name: "XLSX Perfil → DXF",
  //     description: "Criar perfil DXF a partir de planilha",
  //   },
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
