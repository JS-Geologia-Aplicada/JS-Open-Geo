// utils/thumbnailGenerator.ts

import { pdfjs } from "react-pdf";
import { pdfPageToCanvas } from "./ocrExtractor";

export interface ThumbnailData {
  pageNumber: number;
  dataUrl: string;
}

export const generateAllThumbnails = async (
  file: File,
  width: number = 100,
  onProgress?: (current: number, total: number) => void
): Promise<ThumbnailData[]> => {
  const thumbnails: ThumbnailData[] = [];

  // Carregar PDF uma vez só
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument(arrayBuffer).promise;
  const totalPages = pdf.numPages;

  // Gerar thumbnails sequencialmente
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);

    // Calcular scale
    const viewport = page.getViewport({ scale: 1 });
    const scale = width / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    // Gerar canvas
    const canvas = await pdfPageToCanvas(page, scaledViewport);
    const dataUrl = canvas.toDataURL("image/png");

    thumbnails.push({ pageNumber: pageNum, dataUrl });

    // Callback de progresso
    onProgress?.(pageNum, totalPages);
  }

  return thumbnails;
};
