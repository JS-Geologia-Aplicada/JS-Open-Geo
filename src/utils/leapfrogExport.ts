import type {
  Area,
  CollarData,
  GeologyData,
  NAData,
  NSPTData,
  PageTextData,
} from "../types";
import {
  createTypeToAreaNameMap,
  getMaxDepth,
  getMultipleValuesFromEntry,
  getSingleValueFromEntry,
  parseNumber,
} from "./helpers";

export const generateCollarFile = (
  documentData: PageTextData[],
  areas: Area[]
) => {
  // Relacionando tipo da área com o nome que foi dado
  const typeToAreaName = createTypeToAreaNameMap(areas);
  const collarData: CollarData[] = [];

  documentData.forEach((entry) => {
    // Valores opcionais
    const date = getSingleValueFromEntry(entry, typeToAreaName, "date");
    const campaign = getSingleValueFromEntry(entry, typeToAreaName, "campaign");
    // Adiciona uma linha por entry
    collarData.push({
      "HOLE ID": getSingleValueFromEntry(entry, typeToAreaName, "hole_id"),
      X: parseNumber(getSingleValueFromEntry(entry, typeToAreaName, "x")),
      Y: parseNumber(getSingleValueFromEntry(entry, typeToAreaName, "y")),
      Z: parseNumber(getSingleValueFromEntry(entry, typeToAreaName, "z")),
      DEPTH: getMaxDepth(entry, typeToAreaName),
      ...(date && { DATA: date }),
      ...(campaign && { CAMPANHA: campaign }),
    });
  });

  return collarData;
};

export const generateNSPTData = (
  documentData: PageTextData[],
  areas: Area[]
) => {
  const typeToAreaName = createTypeToAreaNameMap(areas);
  const nsptData: NSPTData[] = [];

  documentData.forEach((entry) => {
    const holeId = getSingleValueFromEntry(entry, typeToAreaName, "hole_id");
    const nsptValues = getMultipleValuesFromEntry(
      entry,
      typeToAreaName,
      "nspt"
    );
    const maxDepth = getMaxDepth(entry, typeToAreaName);
    const firstTo = Math.ceil(maxDepth) - nsptValues.length + 1;

    let currentFrom = 0;
    nsptValues.forEach((value, index) => {
      const currentTo =
        index === 0
          ? firstTo
          : index === nsptValues.length - 1
          ? maxDepth
          : currentFrom + 1;

      nsptData.push({
        "HOLE ID": holeId,
        from: currentFrom,
        to: currentTo,
        NSPT: value,
      });
      currentFrom = currentTo;
    });
  });

  return nsptData;
};

export const generateNAData = (documentData: PageTextData[], areas: Area[]) => {
  const typeToAreaName = createTypeToAreaNameMap(areas);
  const naData: NAData[] = [];
  documentData.forEach((entry) => {
    const holeId = getSingleValueFromEntry(entry, typeToAreaName, "hole_id");
    const maxDepth = getMaxDepth(entry, typeToAreaName);
    const na = getSingleValueFromEntry(entry, typeToAreaName, "water_level");
    const naNumber = parseNumber(na, -1);

    const hasWater = naNumber && naNumber >= 0;

    if (!hasWater) {
      naData.push({
        "HOLE ID": holeId,
        from: 0,
        to: maxDepth,
        cond: "SECO",
      });
    } else if (naNumber !== 0) {
      naData.push(
        { "HOLE ID": holeId, from: 0, to: naNumber, cond: "SECO" },
        { "HOLE ID": holeId, from: naNumber, to: maxDepth, cond: "ÁGUA" }
      );
    } else {
      naData.push({ "HOLE ID": holeId, from: 0, to: maxDepth, cond: "ÁGUA" });
    }
  });

  return naData;
};

export const generateGeologyData = (
  documentData: PageTextData[],
  areas: Area[]
) => {
  const typeToAreaName = createTypeToAreaNameMap(areas);
  const geologyData: GeologyData[] = [];

  documentData.forEach((entry) => {
    const holeId = getSingleValueFromEntry(entry, typeToAreaName, "hole_id");
    const depths = getMultipleValuesFromEntry(
      entry,
      typeToAreaName,
      "depth_from_to"
    );
    const depthNumbers = depths
      .map((value) => parseNumber(value))
      .sort((a, b) => a - b);
    if (depthNumbers[0] !== 0) depthNumbers.unshift(0);
    const entryGeology = getMultipleValuesFromEntry(
      entry,
      typeToAreaName,
      "geology"
    );
    for (let i = 0; i < depthNumbers.length - 1; i++) {
      console.log(
        "NÚMERO DE DESCRIÇÕES CORRETO? ",
        geologyData.length === depthNumbers.length
      );
      geologyData.push({
        "HOLE ID": holeId,
        from: depthNumbers[i],
        to: depthNumbers[i + 1],
        Descrição: entryGeology[i] || "",
      });
    }
  });

  return geologyData;
};

// Função que converte dados pra CSV string
export const generateCSVString = (data: any[], headers: string[]): string => {
  const csvRows = [
    headers.join(";"),
    ...data.map((row) =>
      headers.map((header) => `"${row[header] ?? ""}"`).join(";")
    ),
  ];
  return csvRows.join("\n");
};

// Função que decide qual dados usar
export const getLeapfrogData = (
  extractedTexts: PageTextData[],
  areas: Area[],
  type: string
) => {
  switch (type) {
    case "collar":
      const collarHeaders = ["HOLE ID", "X", "Y", "Z", "DEPTH"];
      if (areas.find((area) => area.dataType === "date"))
        collarHeaders.push("DATA");
      if (areas.find((area) => area.dataType === "campaign"))
        collarHeaders.push("CAMPANHA");
      return {
        data: generateCollarFile(extractedTexts, areas),
        headers: collarHeaders,
        filename: "collar.csv",
      };
    case "nspt":
      return {
        data: generateNSPTData(extractedTexts, areas),
        headers: ["HOLE ID", "from", "to", "NSPT"],
        filename: "nspt.csv",
      };
    case "na":
      return {
        data: generateNAData(extractedTexts, areas),
        headers: ["HOLE ID", "from", "to", "cond"],
        filename: "na.csv",
      };
    case "geology":
      return {
        data: generateGeologyData(extractedTexts, areas),
        headers: ["HOLE ID", "from", "to", "Descrição"],
        filename: "geology.csv",
      };
    default:
      return {
        data: [],
        headers: [],
        filename: "unknown.csv",
      };
  }
};
