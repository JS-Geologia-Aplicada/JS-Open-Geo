import type { SelectionArea } from "../types";

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
  return textContent.items.filter(
    (item: {
      str: string;
      height: number;
      width: number;
      transform: any[];
    }) => {
      const textMinX = item.transform[4];
      const textMinY = item.transform[5];
      const textMaxX = item.transform[4] + item.width;
      const textMaxY = item.transform[5] + item.height;
      return (
        textMinX >= pdfCoords.x &&
        textMaxX <= pdfCoords.x + pdfCoords.width &&
        textMinY >= pdfCoords.y &&
        textMaxY <= pdfCoords.y + pdfCoords.height
      );
    }
  );
};

export const clamp = (value: number, min: number, max: number) => {
  return Math.max(Math.min(value, max), min);
};
