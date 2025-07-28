// Objeto de seleção de área retangular
export interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Area {
  id: string;
  name: string;
  order: number;
  color: string;
  coordinates: SelectionArea | null;
  isSelected?: boolean;
  isMandatory: boolean;
  dataType?: DataType;
  repeatInPages?: boolean;
}

export interface AreaPreset {
  name: string;
  areas: Area[];
}

export interface PageTextData {
  pageNumber: number[];
  [areaName: string]: string[] | number | number[];
}

export interface HorizontalLine {
  x1: number;
  x2: number;
  y: number;
}

export const DATA_TYPES = [
  "default",
  "hole_id",
  "x",
  "y",
  "z",
  "depth",
  "date",
  "depth_from_to",
  "water_level",
  "geology",
  "nspt",
  "generic_info",
] as const;

export type DataType = (typeof DATA_TYPES)[number];

export const DATA_TYPE_LABELS: Record<DataType, string> = {
  default: "Padrão",
  hole_id: "ID da Sondagem",
  x: "Coordenada X",
  y: "Coordenada Y",
  z: "Cota",
  depth: "Profundidade Total",
  date: "Data",
  depth_from_to: "Profundidades",
  water_level: "Nível d'Água",
  geology: "Descrição Geológica",
  nspt: "NSPT",
  generic_info: "Outras Informações",
};

export const REPEATING_TYPES: DataType[] = [
  "hole_id",
  "x",
  "y",
  "z",
  "depth",
  "date",
  "water_level",
];
export const MANDATORY_TYPES: DataType[] = ["hole_id", "depth_from_to"];
