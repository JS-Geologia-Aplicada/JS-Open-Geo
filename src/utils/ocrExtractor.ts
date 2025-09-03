import Tesseract, { createWorker } from "tesseract.js";
import type { Area, DataType, PageTextData, SelectionArea } from "../types";
import { convertCoordinates, formatDataByType } from "./helpers";

//Função antiga para extrair só OCR, está sendo transferida para o textExtractor
export const extractTextOCR = async (
  areas: Area[],
  pdfDocument: any
): Promise<PageTextData[]> => {
  const extractedTexts: PageTextData[] = [];
  const numPages = pdfDocument.numPages;
  const worker = await createWorker("por");

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
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

        // const rectangle = {
        //   left: imageCoords.x,
        //   top: viewport.height - imageCoords.y - imageCoords.height,
        //   width: imageCoords.width,
        //   height: imageCoords.height,
        // };

        // Faz OCR da área recortada
        const ocrResults = await ocrFromCanvas(croppedCanvas, worker);

        // Aplica formatação por tipo (mesmo sistema atual)

        const textArr =
          area.dataType === "geology"
            ? joinMultilineTexts(ocrResults)
            : ocrResults.map((result) => result.text.trim());

        pageData[area.name] = formatDataByType(textArr, area.dataType);
      }

      extractedTexts.push(pageData);
    } catch (error) {
      console.error(`Erro ao processar página ${pageNum}:`, error);
    }
  }
  await worker.terminate();
  return extractedTexts;
};

export const pdfPageToCanvas = async (page: any, viewport: any) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: context, viewport }).promise;
  return canvas;
};

export const cropCanvas = (canvas: HTMLCanvasElement, area: SelectionArea) => {
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

export const ocrFromCanvas = async (
  canvas: HTMLCanvasElement,
  worker: Tesseract.Worker
): Promise<Tesseract.Line[]> => {
  const { data } = await worker.recognize(
    canvas,
    {},
    {
      blocks: true,
      text: true,
    }
  );
  const lines =
    data.blocks?.flatMap((b) => b.paragraphs)?.flatMap((p) => p.lines) ?? [];

  return lines;
};

const joinMultilineTexts = (lines: Tesseract.Line[]) => {
  const rowHeightMultiplier = 1.3;
  const textBlocks: string[] = [];
  const currentBlock: string[] = [];
  lines.forEach((line, index) => {
    const currentRowHeight = (line.rowAttributes as any).rowHeight || 20;
    const nextLine = lines[index + 1];
    currentBlock.push(line.text.trim());

    const shouldBreak =
      index === lines.length - 1 ||
      line.baseline.y0 + currentRowHeight * rowHeightMultiplier <=
        nextLine?.baseline.y0;

    if (shouldBreak) {
      textBlocks.push(currentBlock.join(" "));
      currentBlock.length = 0;
    }
  });
  return textBlocks;
};

export const processOCRLines = (
  lines: Tesseract.Line[],
  dataType?: DataType
) => {
  // Usar o dataType para implementar processamentos de acordo com o tipo de dado
  let texts: string[] = [];
  if (dataType === "geology") {
    texts = joinMultilineTexts(lines);
  } else {
    lines.forEach((line) => {
      texts.push(line.text.trim());
    });
  }
  return texts;
};

export const ocrExtractLines = async (
  areaCoordinates: SelectionArea,
  page: any,
  worker: Tesseract.Worker,
  pageCanvas?: HTMLCanvasElement
): Promise<Tesseract.Line[]> => {
  const viewport = page.getViewport({ scale: 2 });
  const canvas = pageCanvas || (await pdfPageToCanvas(page, viewport));
  const imageCoords = convertCoordinates(
    areaCoordinates,
    1, // renderedScale
    2, // zoomScale (mesmo do viewport)
    viewport
  );
  const croppedCanvas = cropCanvas(canvas, {
    x: imageCoords.x,
    y: viewport.height - imageCoords.y - imageCoords.height, // Inverte Y para canvas
    width: imageCoords.width,
    height: imageCoords.height,
  });

  const dataLines = await ocrFromCanvas(croppedCanvas, worker);
  return dataLines;
};
