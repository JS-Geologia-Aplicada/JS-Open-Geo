import type { TextItem } from "react-pdf";
import type { Area, HorizontalLine, PageTextData } from "../types";
import {
  convertCoordinates,
  filterTextContent,
  nsptToString,
  textItemToString,
} from "./helpers";
import { generateNAData } from "./leapfrogExport";

export const extractText = async (
  areas: Area[],
  pdfDocument: any
): Promise<PageTextData[]> => {
  const extractedTexts: PageTextData[] = [];
  const numPages = pdfDocument.numPages;
  const holeIdArea = areas.find((area) => area.dataType === "hole_id");
  const nonRepeatDataAreas = areas.filter(
    (area) => !area.repeatInPages && area.dataType !== "hole_id"
  );

  // Extração específica para quando há hole_id
  if (holeIdArea && holeIdArea.coordinates) {
    const holeIdName = holeIdArea.name;
    const holeIdsPerPage: { page: number; holeId: string }[] = [];
    const pagesWithoutId: number[] = [];
    const uniqueHoleIds: string[] = [];

    // Extraindo os hole_id e identificando as páginas nos quais se repetem
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
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
            entry[area.name] = textArr;
          }
        });
      }
    }
  } else {
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
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

            if (!textEntry[area.name]) {
              textEntry[area.name] = [];
            }
            (textEntry[area.name] as string[]).push(...textArr);
          }
        });
      }
    }
  }

  console.log(generateNAData(extractedTexts, areas));

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
