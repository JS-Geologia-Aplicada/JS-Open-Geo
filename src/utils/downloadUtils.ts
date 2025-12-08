import {
  DATA_TYPE_CONFIGS,
  LEAPFROG_TYPES,
  type Area,
  type PageTextData,
  type PalitoData,
} from "../types";
import {
  createTypeToAreaNameMap,
  getMaxDepth,
  getMultipleValuesFromEntry,
  getSingleValueFromEntry,
  parseNumber,
} from "./helpers";
import * as XLSX from "xlsx";
import {
  generateCSVString,
  getLeapfrogData,
  validateExportRequirements,
} from "./leapfrogExport";
import JSZip from "jszip";

export const exportJSON = (areas: Area[], extractedTexts: PageTextData[]) => {
  const structuredData = convertToPalitoData(areas, extractedTexts);

  // Download
  const dataStr = JSON.stringify(structuredData, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "dados-estruturados.json";
  link.click();

  URL.revokeObjectURL(url);
};

export const convertToPalitoData = (
  areas: Area[],
  extractedTexts: PageTextData[]
): PalitoData[] => {
  const typeToAreaName = createTypeToAreaNameMap(areas);
  const structuredData: PalitoData[] = [];

  extractedTexts.forEach((entry) => {
    const palitoEntry: PalitoData = {
      hole_id: getSingleValueFromEntry(entry, typeToAreaName, "hole_id"),
      nspt: {
        start_depth: 1,
        interval: 1,
        values: [],
      },
      depths: [],
      geology: [],
    };

    // Max depth (opcional)
    const maxDepth = getMaxDepth(entry, typeToAreaName);
    if (maxDepth > 0) {
      palitoEntry.max_depth = maxDepth;
    }

    // Z (cota)
    const z = parseNumber(getSingleValueFromEntry(entry, typeToAreaName, "z"));
    if (z !== -1) {
      palitoEntry.z = z;
    }

    // X (coordenada Leste)
    const x = parseNumber(getSingleValueFromEntry(entry, typeToAreaName, "x"));
    if (x !== -1) {
      palitoEntry.x = x;
    }

    // Y (coordenada Norte)
    const y = parseNumber(getSingleValueFromEntry(entry, typeToAreaName, "y"));
    if (y !== -1) {
      palitoEntry.y = y;
    }

    // Water level (opcional)
    const waterLevel = getSingleValueFromEntry(
      entry,
      typeToAreaName,
      "water_level"
    );
    if (waterLevel) {
      const naNumber = parseNumber(waterLevel, -1);
      if (naNumber >= 0) {
        palitoEntry.water_level = naNumber;
      }
    }

    // Depths (profundidades from/to)
    const depths = getMultipleValuesFromEntry(
      entry,
      typeToAreaName,
      "depth_from_to"
    )
      .map((d) => parseNumber(d))
      .filter((d) => d !== -1)
      .sort((a, b) => a - b);
    if (depths.length > 0 && !depths.includes(0)) {
      depths.unshift(0);
    }
    if (depths.length > 0) {
      palitoEntry.depths = depths;
    }

    // Geology (descrições)
    const geology = getMultipleValuesFromEntry(
      entry,
      typeToAreaName,
      "geology"
    );
    if (geology.length > 0) {
      palitoEntry.geology = geology;
    }

    // Interpretação (opcional)
    const interp = getMultipleValuesFromEntry(entry, typeToAreaName, "interp");
    if (interp.length > 0) {
      palitoEntry.interp = interp;
    }

    // NSPT
    const nsptValues = getMultipleValuesFromEntry(
      entry,
      typeToAreaName,
      "nspt"
    );
    if (nsptValues.length > 0) {
      palitoEntry.nspt = {
        start_depth: 1,
        interval: 1,
        values: nsptValues,
      };
    }

    // Outros tipos de dados não mapeados
    structuredData.push(palitoEntry);
  });

  return structuredData;
};

export const exportCSV = (
  areas: Area[],
  extractedTexts: PageTextData[],
  commaAsSeparator: boolean = true
) => {
  const headers = ["Página", ...areas.map((area) => area.name)];

  const rows = extractedTexts.map((pageData) => {
    const row: (string | number)[] = [pageData.pageNumber.join(", ")];
    areas.forEach((area) => {
      const areaData = pageData[area.name];
      const config = DATA_TYPE_CONFIGS[area.dataType || "default"];

      if (!areaData) {
        row.push("");
        return;
      }

      const formattedValue = getFormattedValue(areaData, config.valueType);
      row.push(
        commaAsSeparator && typeof formattedValue === "number"
          ? formattedValue.toString().replace(".", ",")
          : formattedValue
      );
    });
    return row;
  });

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(";")) // aspas + vírgulas
    .join("\n");

  // Download
  const BOM = "\uFEFF";
  const csvWithBOM = BOM + csvContent;
  const blob = new Blob([csvWithBOM], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "dados-extraidos.csv";
  link.click();
  URL.revokeObjectURL(url);
};

export const exportExcel = (areas: Area[], extractedTexts: PageTextData[]) => {
  const xlsData = extractedTexts.map((pageData) => {
    const row: any = { Página: pageData.pageNumber };

    areas.forEach((area) => {
      const areaData = pageData[area.name];
      const config = DATA_TYPE_CONFIGS[area.dataType || "default"];

      if (!areaData) {
        row[area.name] = "";
        return;
      }

      // Insere o dado de acordo com o tipo
      row[area.name] = getFormattedValue(areaData, config.valueType);
    });
    return row;
  });

  // Normaliza número de casas decimais
  var ws = XLSX.utils.json_to_sheet(xlsData);
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1:A1");
  for (let row = range.s.r; row <= range.e.r; row++) {
    areas.forEach((area, areaIndex) => {
      const config = DATA_TYPE_CONFIGS[area.dataType || "default"];

      if (config.excelFormat) {
        const cellAdress = XLSX.utils.encode_cell({ r: row, c: areaIndex + 1 }); // +1 pois coluna 1 é a página
        const cell = ws[cellAdress];

        if (cell && typeof cell.v === "number") {
          cell.z = config.excelFormat;
        }
      }
    });
  }

  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dados extraídos");
  XLSX.writeFile(wb, "dados-pdf.xlsx");
};

export const downloadSingleCSV = (
  areas: Area[],
  extractedTexts: PageTextData[],
  type: string,
  commaAsSeparator: boolean = true
) => {
  const leapfrogData = getLeapfrogData(extractedTexts, areas, type);
  if (!leapfrogData) {
    alert("Não existem todas as áreas necessárias para gerar esse arquivo");
    return;
  }
  const BOM = "\uFEFF";
  const csvString =
    BOM +
    generateCSVString(
      leapfrogData.data,
      leapfrogData.headers,
      commaAsSeparator
    );

  // Download
  const blob = new Blob([csvString], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = leapfrogData.filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadZip = async (
  areas: Area[],
  extractedTexts: PageTextData[],
  advancedDownload?: boolean,
  commaAsSeparator: boolean = true
) => {
  const zip = new JSZip();
  const BOM = "\uFEFF";

  const leapfrogTypes = ["collar", "nspt", "na", "geology", "interp"];

  // Loop através de todos os tipos
  leapfrogTypes.forEach((type) => {
    if (validateExportRequirements(areas, type).isValid || advancedDownload) {
      const data = getLeapfrogData(extractedTexts, areas, type);

      if (data) {
        const csvString =
          BOM + generateCSVString(data.data, data.headers, commaAsSeparator);
        zip.file(data.filename, csvString);
      }
    }
  });

  // Gerar ZIP e baixar
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "leapfrog-data.zip";
  link.click();
  URL.revokeObjectURL(url);
};

export const getDropdownItemClass = (
  areas: Area[],
  type: string,
  advancedDownload?: boolean
) =>
  `dropdown-item${
    validateExportRequirements(areas, type).isValid || advancedDownload
      ? ""
      : " disabled"
  }`;

export const downloadAllValidation = (areas: Area[]) => {
  const validExports = LEAPFROG_TYPES.filter(
    (type) => validateExportRequirements(areas, type).isValid
  );
  return {
    validExports: validExports,
    nonValidExports: LEAPFROG_TYPES.filter(
      (type) => !validExports.includes(type)
    ),
    someValid: validExports.length > 0,
    allValid: validExports.length === LEAPFROG_TYPES.length,
  };
};

const getFormattedValue = (areaData: any, valueType: string) => {
  let value: string | number;
  switch (valueType) {
    case "number":
      const numValue = Array.isArray(areaData) ? areaData[0] : areaData;
      value = parseNumber(numValue as string);
      break;
    case "array_number":
      if (Array.isArray(areaData)) {
        const numbers = areaData.map((val) => parseNumber(val as string));
        value = numbers.join("; ");
      } else {
        value = parseNumber(areaData as string);
      }
      break;
    case "string":
      value = Array.isArray(areaData) ? areaData[0] || "" : areaData || "";
      break;
    case "array_string":
      value = Array.isArray(areaData) ? areaData.join("; ") : areaData || "";
      break;
    default:
      value = Array.isArray(areaData) ? areaData.join("; ") : areaData || "";
  }
  return value;
};
