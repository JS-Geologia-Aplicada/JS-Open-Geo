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
  [areaName: string]: string[] | number[];
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
  "campaign",
  "interp",
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
  campaign: "Campanha",
  interp: "Interpretação Geológica",
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
  "campaign",
];
export const MANDATORY_TYPES: DataType[] = ["hole_id"];

export const UNIQUE_TYPES: DataType[] = ["hole_id", "x", "y", "z", "depth"];

export const EASY_ADD_TYPES: DataType[] = [
  "hole_id",
  "x",
  "y",
  "z",
  "depth",
  "depth_from_to",
  "geology",
  "nspt",
  "water_level",
  "interp",
];

// Interface base para todos os dados do Leapfrog
export interface BaseLeapfrogData {
  "HOLE ID": string;
  [key: string]: string | number | undefined;
}

export interface CollarData extends BaseLeapfrogData {
  X: number;
  Y: number;
  Z: number;
  DEPTH: number;
  DATA?: string;
  CAMPANHA?: string;
}

// Interfaces para dados com intervalos (from/to)
export interface IntervalLeapfrogData extends BaseLeapfrogData {
  from: number;
  to: number;
}

export interface NSPTData extends IntervalLeapfrogData {
  NSPT: string;
}

export interface NAData extends IntervalLeapfrogData {
  cond: "SECO" | "ÁGUA";
}

export interface GeologyData extends IntervalLeapfrogData {
  [description: string]: string | number;
}

export interface InterpData extends IntervalLeapfrogData {
  "interp. geol": string;
}

export type LeapfrogDataTypes =
  | CollarData
  | NSPTData
  | NAData
  | GeologyData
  | InterpData;

export interface LeapfrogExportData {
  data: LeapfrogDataTypes[];
  headers: string[];
  filename: string;
}

export interface ExportValidation {
  isValid: boolean;
  missingFields: DataType[];
  errorMessage?: string;
}

export const LEAPFROG_TYPES = ["collar", "nspt", "na", "geology", "interp"];

export type LeapfrogType = (typeof LEAPFROG_TYPES)[number];

export const LEAPFROG_LABELS: Record<LeapfrogType, string> = {
  collar: "Collar",
  nspt: "NSPT",
  na: "NA",
  geology: "Geologia",
  interp: "Interpretação",
};

export const EXPORT_REQUIREMENTS: Record<LeapfrogType, string[]> = {
  collar: ["hole_id", "x", "y"],
  nspt: ["hole_id", "nspt"],
  na: ["hole_id", "water_level"],
  geology: ["hole_id", "geology", "depth_from_to"],
  interp: ["hole_id", "interp", "depth_from_to"],
};

export interface PalitoData {
  hole_id: string;
  max_depth?: number;
  z?: number;
  water_level?: number;
  depths: number[];
  geology: string[];
  interp?: string[];
  nspt: {
    start_depth: number;
    interval: number;
    values: string[];
  };
}
