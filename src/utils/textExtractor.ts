import type { Area, HorizontalLine, PageTextData } from "../types";
import {
  convertCoordinates,
  filterTextContent,
  textItemToString,
} from "./pdfHelpers";

export const extractText = async (
  areas: Area[],
  pdfDocument: any
): Promise<PageTextData[]> => {
  const extractedTexts: PageTextData[] = [];
  const numPages = pdfDocument.numPages;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const operatorList = await page.getOperatorList();
    const pageTexts = await page.getTextContent();
    const originalViewport = page.getViewport({ scale: 1 });
    const pageHorizontalLines = findHorizontalLines(operatorList);
    let skipPage = false;

    const pageData: PageTextData = { page: pageNum };

    areas.forEach((area) => {
      if (skipPage) return;
      if (area.coordinates) {
        const pageCoordinates = convertCoordinates(
          area.coordinates,
          1,
          1,
          originalViewport
        );

        const textArr = textItemToString(
          filterTextContent(pageTexts, pageCoordinates),
          pageHorizontalLines
        );
        pageData[area.name] = textArr;
      } else {
        pageData[area.name] = [];
      }
    });

    const shouldSkipPage = areas.some((area) => {
      if (!area.isMandatory) return false;
      const areaData = pageData[area.name] as string[];
      return !areaData || areaData.length === 0;
    });

    if (!shouldSkipPage) {
      extractedTexts.push(pageData);
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
