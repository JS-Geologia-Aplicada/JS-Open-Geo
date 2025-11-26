export interface FileTemplate {
  id: string;
  name: string;
  description: string;
  fileName: string;
  fileUrl: string; // URL do arquivo no /public
  imageUrl?: string; // Screenshot opcional
}

export interface TemplateCategory {
  id: string;
  label: string;
  templates: FileTemplate[];
}

const getPublicUrl = (path: string) => {
  const base = import.meta.env.BASE_URL || "/";
  // Remove / do início de path se existir
  const cleanPath = path.replace(/^\/+/, "");
  // Remove / do final de base se existir
  const cleanBase = base.replace(/\/+$/, "");
  return `${cleanBase}/${cleanPath}`;
};

export const FILE_TEMPLATES: TemplateCategory[] = [
  {
    id: "dxfTools",
    label: "Ferramentas DXF",
    templates: [
      {
        id: "dxfTools",
        name: "DXF exemplo",
        description: "Arquivo DXF contendo pontos em bloco ou multileader",
        fileName: "Modelo_JSOpenGeo_sem_numeracao.dxf",
        fileUrl: getPublicUrl("/templates/Modelo_JSOpenGeo_sem_numeracao.dxf"),
      },
    ],
  },
  {
    id: "distanceTool",
    label: "Calcular Distâncias DXF",
    templates: [
      {
        id: "distanceTools",
        name: "DXF exemplo",
        description:
          "Arquivo DXF contendo pontos em bloco ou multileader e uma camada com polylines (uma única ou um conjunto)",
        fileName: "Modelo_JSOpenGeo_medida_eixo.dxf",
        fileUrl: getPublicUrl("/templates/Modelo_JSOpenGeo_medida_eixo.dxf"),
      },
    ],
  },
  {
    id: "xlsxToKml",
    label: "XLSX → KML/KMZ",
    templates: [
      {
        id: "xlsxToKml",
        name: "XLSX exemplo",
        description:
          "Planilha com colunas: Nome, X, Y e colunas adicionais de propriedades (opcionais)",
        fileName: "Modelo_JSOpenGeo.xlsx",
        fileUrl: getPublicUrl("/templates/Modelo_JSOpenGeo.xlsx"),
      },
    ],
  },
  {
    id: "xlsxToDxfProfile",
    label: "XLSX → Perfil DXF",
    templates: [
      {
        id: "xlsxToDxf",
        name: "XLSX exemplo",
        description: "Planilha com colunas: Nome, Distância e Cota (opcional)",
        fileName: "DXF_EixoX.xlsx",
        fileUrl: getPublicUrl("/templates/DXF_EixoX.xlsx"),
      },
    ],
  },
  {
    id: "kmlToXlsx",
    label: "KML/KMZ → XLSX",
    templates: [
      {
        id: "kmlToXlsx",
        name: "KML exemplo 1",
        description: "Arquivo KML contendo pontos",
        fileName: "Modelo_JSOpenGeo.kml",
        fileUrl: getPublicUrl("/templates/SondagensExemploJSOpenGeo.kml"),
      },
      {
        id: "kmlToXlsx2",
        name: "KML exemplo 2",
        description: "Arquivo KML contendo pontos",
        fileName: "Modelo_JSOpenGeo_2.kml",
        fileUrl: getPublicUrl("/templates/Modelo_JSOpenGeo_2.kml"),
      },
      {
        id: "kmzToXlsx",
        name: "KMZ exemplo",
        description: "Arquivo KMZ contendo pontos",
        fileName: "Modelo_JSOpenGeo.kmz",
        fileUrl: getPublicUrl("/templates/SondagensExemploJSOpenGeo.kmz"),
      },
    ],
  },
];
