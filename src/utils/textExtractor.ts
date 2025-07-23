import type { Area, PageTextData } from "../types";
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
    extractedTexts.push({ page: pageNum });
    const page = await pdfDocument.getPage(pageNum);
    const pageTexts = await page.getTextContent();
    const originalViewport = page.getViewport({ scale: 1 });

    areas.forEach((area) => {
      if (area.coordinates) {
        const pageCoordinates = convertCoordinates(
          area.coordinates,
          1,
          1,
          originalViewport
        );
        const textArr = textItemToString(
          filterTextContent(pageTexts, pageCoordinates)
        );
        extractedTexts[pageNum - 1][area.name] = textArr;
      } else {
        extractedTexts[pageNum - 1][area.name] = [];
      }
    });
  }
  return extractedTexts;
};
