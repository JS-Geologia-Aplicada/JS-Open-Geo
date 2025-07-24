import type { TextItem } from "react-pdf";
import type { HorizontalLine, SelectionArea } from "../types";

const SELECTION_THRESHOLD = 5;

export const convertCoordinates = (
  selectionArea: SelectionArea,
  renderedScale: number,
  zoomScale: number,
  originalViewport: any
) => {
  return {
    x: (selectionArea.x * zoomScale) / renderedScale,
    width: (selectionArea.width * zoomScale) / renderedScale,
    y:
      originalViewport.height -
      (selectionArea.y * zoomScale) / renderedScale -
      (selectionArea.height * zoomScale) / renderedScale,
    height: (selectionArea.height * zoomScale) / renderedScale,
  };
};

export const filterTextContent = (
  textContent: any,
  pdfCoords: SelectionArea
) => {
  return textContent.items.filter((item: TextItem) => {
    const textMinX = item.transform[4];
    const textMinY = item.transform[5];
    const textMaxX = item.transform[4] + item.width;
    const textMaxY = item.transform[5] + item.height;
    return (
      textMinX >= pdfCoords.x - SELECTION_THRESHOLD &&
      textMaxX <= pdfCoords.x + pdfCoords.width + SELECTION_THRESHOLD &&
      textMinY >= pdfCoords.y - SELECTION_THRESHOLD &&
      textMaxY <= pdfCoords.y + pdfCoords.height + SELECTION_THRESHOLD
    );
  });
};

export const textItemToString = (
  items: TextItem[],
  horizontalLines: HorizontalLine[]
) => {
  const incompleteTexts = Array<string>();
  const textArr = Array<string>();

  items.forEach((item, index) => {
    if (item.str.trim() == "") return;

    const lineThreshold = item.height * 1.5;
    if (index < items.length - 1) {
      const areaToNextItem: SelectionArea = {
        x: item.transform[4] + item.width / 5,
        y: item.transform[5] - item.height / 2,
        width: item.width * (3 / 5),
        height: Math.min(
          Math.abs(item.transform[5] - items[index + 1].transform[5]),
          item.height / 2
        ),
      };
      if (
        Math.abs(item.transform[5] - items[index + 1].transform[5]) <=
          lineThreshold &&
        !areaHasHorizontalLines(areaToNextItem, horizontalLines)
      ) {
        incompleteTexts.push(item.str.trim());
      } else if (incompleteTexts.length > 0) {
        incompleteTexts.push(item.str.trim());
        const joinedTexts = incompleteTexts.join(" ");
        textArr.push(joinedTexts);
        incompleteTexts.length = 0;
      } else {
        textArr.push(item.str.trim());
      }
    } else {
      incompleteTexts.push(item.str.trim());
      const joinedTexts = incompleteTexts.join(" ");
      textArr.push(joinedTexts);
      incompleteTexts.length = 0;
    }
  });
  if (incompleteTexts.length > 0) {
    textArr.push(incompleteTexts.join(" "));
  }
  return textArr;
};

export const clamp = (value: number, min: number, max: number) => {
  return Math.max(Math.min(value, max), min);
};

export const areaHasHorizontalLines = (
  area: SelectionArea,
  horizontalLines: HorizontalLine[]
) => {
  const areaXMin = area.x;
  const areaXMax = area.x + area.width;
  const areaYMin = area.y;
  const areaYMax = area.y + area.height;

  return horizontalLines.some(
    (line) =>
      line.x1 <= areaXMax &&
      line.x2 >= areaXMin &&
      line.y >= areaYMin &&
      line.y <= areaYMax
  );
};
