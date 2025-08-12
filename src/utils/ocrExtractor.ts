import Tesseract from "tesseract.js";
import type { Area, PageTextData, SelectionArea } from "../types";
import { convertCoordinates, formatDataByType } from "./helpers";

export const extractTextOCR = async (
  areas: Area[],
  pdfDocument: any
): Promise<PageTextData[]> => {
  console.log("chamou a função de extrair OCR");
  const extractedTexts: PageTextData[] = [];
  const numPages = pdfDocument.numPages;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    console.log(`Processando página ${pageNum}/${numPages}...`);
    const startTime = performance.now();
    try {
      const page = await pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2 }); // Scale 2 para melhor qualidade OCR

      // Converte página para canvas
      const canvas = await pdfPageToCanvas(page, viewport);

      // Objeto para armazenar dados da página
      const pageData: PageTextData = {
        pageNumber: [pageNum],
      };

      // Processa cada área com coordenadas
      for (const area of areas) {
        if (!area.coordinates) continue;

        // Converte coordenadas para o contexto da imagem
        const imageCoords = convertCoordinates(
          area.coordinates,
          1, // renderedScale
          2, // zoomScale (mesmo do viewport)
          viewport
        );

        // Recorta a área específica
        const croppedCanvas = cropCanvas(canvas, {
          x: imageCoords.x,
          y: viewport.height - imageCoords.y - imageCoords.height, // Inverte Y para canvas
          width: imageCoords.width,
          height: imageCoords.height,
        });

        // Faz OCR da área recortada
        const ocrResults = await ocrFromCanvas(croppedCanvas);

        // Aplica formatação por tipo (mesmo sistema atual)
        pageData[area.name] = formatDataByType(ocrResults, area.dataType);
      }

      extractedTexts.push(pageData);

      const endTime = performance.now();
      console.log(
        `  ✅ Página ${pageNum} processada em ${(
          (endTime - startTime) /
          1000
        ).toFixed(1)}s`
      );
      console.log("Dados da página: ", pageData);
    } catch (error) {
      console.error(`Erro ao processar página ${pageNum}:`, error);
    }
  }
  return extractedTexts;
};

const pdfPageToCanvas = async (page: any, viewport: any) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: context, viewport }).promise;
  return canvas;
};

const cropCanvas = (canvas: HTMLCanvasElement, area: SelectionArea) => {
  const croppedCanvas = document.createElement("canvas");
  const ctx = croppedCanvas.getContext("2d")!;

  croppedCanvas.width = area.width;
  croppedCanvas.height = area.height;

  ctx.drawImage(
    canvas,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    area.width,
    area.height
  );
  return croppedCanvas;
};

const ocrFromCanvas = async (canvas: HTMLCanvasElement): Promise<string[]> => {
  const {
    data: { text },
  } = await Tesseract.recognize(canvas, "por");
  return text.split("\n").filter((line) => line.trim() !== "");
};
