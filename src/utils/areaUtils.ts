import type { Area, SelectionArea } from "../types";

export const addNewArea = (areas: Area[]): Area[] => {
  const newId = `area-${Date.now()}`;
  const newArea: Area = {
    id: newId,
    name: getUniqueName("Nova Área", areas),
    order: areas.length + 1,
    color: getUnusedDefaultColor(areas),
    coordinates: null,
    isMandatory: false,
    type: undefined,
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
];

const getUnusedDefaultColor = (areas: Area[]): string => {
  const usedColors = areas.map((area) => area.color);

  return (
    DEFAULT_COLORS.find((color) => !usedColors.includes(color)) ?? "#000000"
  );
};
