import type { TextItem } from "react-pdf";
import type { Area, DataType, HorizontalLine, PageTextData } from "../types";
import {
  convertCoordinates,
  filterTextContent,
  nsptToString,
  parseNumber,
  textItemToString,
} from "./helpers";

export const extractText = async (
  areas: Area[],
  pdfDocument: any
): Promise<PageTextData[]> => {
  const extractedTexts: PageTextData[] = [];
  const mandatoryAreas = areas.filter(
    (area) => area.isMandatory && area.coordinates
  );
  const numPages = pdfDocument.numPages;
  const holeIdArea = areas.find((area) => area.dataType === "hole_id");
  const nonRepeatDataAreas = areas.filter(
    (area) => !area.repeatInPages && area.dataType !== "hole_id"
  );

  const hasRequiredData = async (pageNum: number) => {
    if (mandatoryAreas.length === 0) return true; // Se não tem obrigatórios, todas as páginas servem

    const page = await pdfDocument.getPage(pageNum);
    const pageTexts = await page.getTextContent();
    const originalViewport = page.getViewport({ scale: 1 });

    for (const area of mandatoryAreas) {
      const pageCoordinates = convertCoordinates(
        area.coordinates!,
        1,
        1,
        originalViewport
      );
      const filteredItems = filterTextContent(pageTexts, pageCoordinates);
      const textContent = textItemToString(filteredItems, []).join(" ").trim();

      if (!textContent) {
        return false;
      }
    }
    return true;
  };

  const validPages: number[] = [];
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (await hasRequiredData(pageNum)) {
      validPages.push(pageNum);
    }
  }

  // Extração específica para quando há hole_id
  if (holeIdArea && holeIdArea.coordinates) {
    const holeIdName = holeIdArea.name;
    const holeIdsPerPage: { page: number; holeId: string }[] = [];
    const pagesWithoutId: number[] = [];
    const uniqueHoleIds: string[] = [];

    // Extraindo os hole_id e identificando as páginas nos quais se repetem
    for (const pageNum of validPages) {
      const page = await pdfDocument.getPage(pageNum);
      const pageTexts = await page.getTextContent();
      const originalViewport = page.getViewport({ scale: 1 });

      const pageCoordinates = convertCoordinates(
        holeIdArea.coordinates,
        1,
        1,
        originalViewport
      );
      const filteredItems = filterTextContent(pageTexts, pageCoordinates);
      filteredItems.sort(
        (a: { transform: number[] }, b: { transform: number[] }) =>
          b.transform[5] - a.transform[5]
      );
      const holeIdText = textItemToString(filteredItems, []).join(" ").trim();
      holeIdsPerPage.push({ page: pageNum, holeId: holeIdText });

      if (holeIdText) {
        const existingEntry = extractedTexts.find(
          (textItem) =>
            textItem[holeIdName] &&
            Array.isArray(textItem[holeIdName]) &&
            textItem[holeIdName][0] === holeIdText
        );

        if (existingEntry) {
          existingEntry.pageNumber.push(pageNum);
        } else {
          uniqueHoleIds.push(holeIdText);
          extractedTexts.push({
            pageNumber: [pageNum],
            [holeIdName]: [holeIdText],
          });
        }
      } else {
        pagesWithoutId.push(pageNum);
      }
    }

    const repeatDataAreas = areas.filter((area) => area.repeatInPages);

    // Adicionando textos que repetem entre páginas
    if (repeatDataAreas.length > 0) {
      // Loop para localizar textos em cada primeira página de sondagem
      for (const entry of extractedTexts) {
        const firstPage = entry.pageNumber[0];
        const page = await pdfDocument.getPage(firstPage);
        const operatorList = await page.getOperatorList();
        const pageTexts = await page.getTextContent();
        const originalViewport = page.getViewport({ scale: 1 });
        const pageHorizontalLines = findHorizontalLines(operatorList);

        repeatDataAreas.forEach((area) => {
          if (area.coordinates) {
            const pageCoordinates = convertCoordinates(
              area.coordinates,
              1,
              1,
              originalViewport
            );
            const filteredTexts = filterTextContent(pageTexts, pageCoordinates);
            filteredTexts.sort(
              (a: TextItem, b: TextItem) => b.transform[5] - a.transform[5]
            );

            const textArr =
              area.dataType === "nspt"
                ? nsptToString(filteredTexts)
                : textItemToString(filteredTexts, pageHorizontalLines);
            entry[area.name] = formatDataByType(textArr, area.dataType);
          }
        });
      }
    }
  } else {
    for (const pageNum of validPages) {
      extractedTexts.push({
        pageNumber: [pageNum],
      });
    }
  }

  // Processando dados que não repetem em páginas diferentes da mesma sondagem
  // A mesma lógica é aplicada para quando não há hole_id
  if (nonRepeatDataAreas.length > 0) {
    for (const textEntry of extractedTexts) {
      for (const entryPage of textEntry.pageNumber) {
        const page = await pdfDocument.getPage(entryPage);
        const operatorList = await page.getOperatorList();
        const pageTexts = await page.getTextContent();
        const originalViewport = page.getViewport({ scale: 1 });
        const pageHorizontalLines = findHorizontalLines(operatorList);

        nonRepeatDataAreas.forEach((area) => {
          if (area.coordinates) {
            const pageCoordinates = convertCoordinates(
              area.coordinates,
              1,
              1,
              originalViewport
            );
            const filteredTexts = filterTextContent(pageTexts, pageCoordinates);
            filteredTexts.sort(
              (a: TextItem, b: TextItem) => b.transform[5] - a.transform[5]
            );

            const textArr =
              area.dataType === "nspt"
                ? nsptToString(filteredTexts)
                : textItemToString(filteredTexts, pageHorizontalLines);

            const formattedData = formatDataByType(textArr, area.dataType);

            if (!textEntry[area.name]) {
              textEntry[area.name] = [];
            }
            const currentTexts = textEntry[area.name] as string[];
            // Para tipos únicos, substitui o valor existente
            if (isUniqueValueType(area.dataType)) {
              if (formattedData.length > 0) {
                textEntry[area.name] = formattedData; // substitui
              }
            } else {
              // Para tipos array, adiciona evitando duplicações
              const newTexts = [...formattedData];
              if (currentTexts.length > 0 && newTexts.length > 0) {
                const lastExisting = currentTexts[currentTexts.length - 1]
                  .trim()
                  .toLowerCase()
                  .replace(/\s+/g, " ");
                const firstNew = newTexts[0]
                  .trim()
                  .toLowerCase()
                  .replace(/\s+/g, " ");

                if (lastExisting === firstNew) {
                  newTexts.shift();
                }
              }

              currentTexts.push(...newTexts);
            }
          }
        });
      }
    }
  }

  return extractedTexts;
};

const findHorizontalLines = (operatorList: any): HorizontalLine[] => {
  const horizontalLines: HorizontalLine[] = [];

  for (let i = 0; i < operatorList.fnArray.length; i++) {
    if (operatorList.fnArray[i] === 91) {
      const pathData = operatorList.argsArray[i][1][0];

      for (let j = 0; j < pathData.length; j++) {
        if (pathData[j] === 1 && j >= 2) {
          const x1 = pathData[j - 2];
          const y1 = pathData[j - 1];
          const x2 = pathData[j + 1];
          const y2 = pathData[j + 2];

          if (Math.abs(y1 - y2) < 2) {
            // É linha horizontal
            horizontalLines.push({
              x1: Math.min(x1, x2),
              x2: Math.max(x1, x2),
              y: y1,
            });
          }
        }
      }
    }
  }

  return horizontalLines;
};

const formatDataByType = (texts: string[], dataType?: DataType): string[] => {
  // Se não há textos, retorna array vazia
  if (!texts || texts.length === 0) {
    return [];
  }

  // Remove strings vazias
  const cleanTexts = texts.filter((text) => text.trim() !== "");

  if (cleanTexts.length === 0) {
    return [];
  }

  // Tipos que devem retornar valor único (mas como array de 1 item)
  if (isUniqueValueType(dataType)) {
    const joinedText = cleanTexts.join(" ").trim();

    // Tratamento especial para water_level
    if (dataType === "water_level") {
      const numericValue = parseNumber(joinedText, -1);
      return [numericValue === -1 ? "Seco" : numericValue.toString()];
    }

    // Para outros tipos numéricos, aplica parseNumber e retorna como array de 1 item
    if (isNumericType(dataType)) {
      const numericValue = parseNumber(joinedText);
      return [numericValue.toString()];
    }

    return [joinedText];
  }

  // Tipos que devem retornar array completa
  return cleanTexts;
};

const isUniqueValueType = (dataType?: DataType): boolean => {
  const uniqueValueTypes: DataType[] = [
    "hole_id",
    "x",
    "y",
    "z",
    "depth",
    "date",
    "campaign",
    "water_level",
  ];

  return dataType ? uniqueValueTypes.includes(dataType) : false;
};

const isNumericType = (dataType?: DataType): boolean => {
  const numericTypes: DataType[] = ["x", "y", "z", "depth"];

  return dataType ? numericTypes.includes(dataType) : false;
};
