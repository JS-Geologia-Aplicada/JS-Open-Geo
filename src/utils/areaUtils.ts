import {
  DATA_TYPE_LABELS,
  MANDATORY_TYPES,
  REPEATING_TYPES,
  type Area,
  type DataType,
  type SelectionArea,
} from "../types";

export const addNewArea = (
  areas: Area[],
  ocr: boolean,
  type?: DataType
): Area[] => {
  const newId = `area-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;
  const newArea: Area = {
    id: newId,
    name: type
      ? getUniqueName(DATA_TYPE_LABELS[type], areas)
      : getUniqueName("Nova Área", areas),
    order: areas.length + 1,
    color: getUnusedDefaultColor(areas),
    coordinates: null,
    isMandatory: type ? MANDATORY_TYPES.includes(type) : false,
    repeatInPages: type ? REPEATING_TYPES.includes(type) : false,
    dataType: type,
    ocr: ocr,
  };
  return [...areas, newArea];
};

export const deleteArea = (areas: Area[], areaId: string): Area[] => {
  return areas
    .filter((area) => area.id !== areaId)
    .map((area, index) => ({
      ...area,
      order: index + 1,
    }));
};

export const renameArea = (
  areas: Area[],
  areaId: string,
  newName: string
): Area[] => {
  if (newName.trim().toLowerCase() === "pagenumber") {
    alert('Nome "pageNumber" é reservado. Use outro nome.');
    return areas;
  }
  const newUniqueName = getUniqueName(newName, areas);
  return areas.map((area) =>
    area.id === areaId ? { ...area, name: newUniqueName } : area
  );
};

export const clearArea = (areas: Area[], areaId: string): Area[] => {
  return areas.map((area) =>
    area.id === areaId ? { ...area, coordinates: null } : area
  );
};

export const shouldRename = (name: string) => {
  return (
    Object.values(DATA_TYPE_LABELS).includes(name) ||
    /^Nova Área( \(\d+\))?$/.test(name)
  );
};

export const updateAreaCoordinates = (
  areas: Area[],
  areaId: string,
  newCoords: SelectionArea
): Area[] => {
  return areas.map((area) =>
    area.id === areaId ? { ...area, coordinates: newCoords } : area
  );
};

export const getUniqueName = (baseName: string, areas: Area[]) => {
  let counter = 2;
  let testName = baseName;

  while (areas.some((area) => area.name === testName)) {
    testName = `${baseName} (${counter})`;
    counter++;
  }

  return testName;
};

export const DEFAULT_COLORS = [
  "#3B82F6", // azul
  "#EF4444", // vermelho
  "#10B981", // verde
  "#F59E0B", // amarelo
  "#8B5CF6", // roxo
  "#EC4899", // rosa
  "#06B6D4", // ciano
  "#F97316", // laranja
  "#84CC16", // lima
  "#6B7280", // cinza
  "#DC2626", // vermelho escuro
  "#059669", // verde escuro
  "#7C3AED", // violeta
  "#BE123C", // carmim
  "#0369A1", // azul escuro
];

const getUnusedDefaultColor = (areas: Area[]): string => {
  const usedColors = areas.map((area) => area.color);

  return (
    DEFAULT_COLORS.find((color) => !usedColors.includes(color)) ?? "#000000"
  );
};

export const generateAreasFingerprint = (
  areas: Area[],
  file: File | null,
  excludedPages: Set<number>
): string => {
  const areasData = areas.map((area) => ({
    id: area.id,
    name: area.name,
    dataType: area.dataType,
    coordinates: area.coordinates,
    isMandatory: area.isMandatory,
    repeatInPages: area.repeatInPages,
    ocr: area.ocr,
  }));

  const fileData = file
    ? {
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        type: file.type,
      }
    : null;

  const excludedPagesArr = Array.from(excludedPages);

  return JSON.stringify({
    areas: areasData,
    file: fileData,
    excludedPages: excludedPagesArr,
  });
};
