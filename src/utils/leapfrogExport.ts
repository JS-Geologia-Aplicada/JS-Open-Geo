import {
  EXPORT_REQUIREMENTS,
  type Area,
  type CollarData,
  type DataType,
  type ExportValidation,
  type GeologyData,
  type InterpData,
  type LeapfrogExportData,
  type NAData,
  type NSPTData,
  type PageTextData,
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

export const generateInterpData = (
  documentData: PageTextData[],
  areas: Area[]
) => {
  const typeToAreaName = createTypeToAreaNameMap(areas);
  const interpData: InterpData[] = [];

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
    const entryInterp = getMultipleValuesFromEntry(
      entry,
      typeToAreaName,
      "interp"
    );
    const entryInterpData: InterpData[] = [];
    for (let i = depthNumbers.length - 2; i >= 0; i--) {
      entryInterpData.push({
        "HOLE ID": holeId,
        from: depthNumbers[i],
        to: depthNumbers[i + 1],
        "interp. geol": entryInterp[i + i] || "",
      });
    }
    entryInterpData.reverse();
    interpData.push(...entryInterpData);
  });

  return interpData;
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
): LeapfrogExportData | undefined => {
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
    case "interp":
      return {
        data: generateInterpData(extractedTexts, areas),
        headers: ["HOLE ID", "from", "to", "interp. geol"],
        filename: "interp.csv",
      };
    default:
      return undefined;
  }
};

export const validateExportRequirements = (
  areas: Area[],
  exportType: string
): ExportValidation => {
  const requirements = EXPORT_REQUIREMENTS[exportType];

  if (!requirements) {
    return {
      isValid: false,
      missingFields: [],
      errorMessage: `Tipo de exportação '${exportType}' não reconhecido`,
    };
  }

  const missingFields: DataType[] = [];
  const availableTypes = areas
    .filter((area) => area.dataType && area.coordinates) // só áreas configuradas e selecionadas
    .map((area) => area.dataType!);

  requirements.forEach((requiredType) => {
    if (!availableTypes.includes(requiredType as DataType)) {
      missingFields.push(requiredType as DataType);
    }
  });

  // Validação para tipos que precisam de depth OU depth_from_to
  if (exportType === "nspt" || exportType === "collar" || exportType === "na") {
    const hasDepth = availableTypes.includes("depth");
    const hasDepthFromTo = availableTypes.includes("depth_from_to");

    if (!hasDepth && !hasDepthFromTo) {
      missingFields.unshift("depth");
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    errorMessage:
      missingFields.length > 0
        ? `Campos obrigatórios ausentes: ${missingFields.join(", ")}`
        : undefined,
  };
};
