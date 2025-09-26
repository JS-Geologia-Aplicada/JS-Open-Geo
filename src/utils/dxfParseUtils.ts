import DxfParser from "dxf-parser";
import type { DxfData } from "../types";

export interface CodedDxf {
  code: string;
  value: string;
}

export interface DxfInsert {
  x: string;
  y: string;
  blockName: string;
  layer: string;
  attributes?: { tag: string | undefined; value: string | undefined }[];
}

export const parseDxf = (blockLines: string[]) => {
  const parsedDxf: CodedDxf[] = [];
  for (let i = 0; i < blockLines.length - 1; i += 2) {
    const code = blockLines[i].trim();
    const value = blockLines[i + 1].trim();
    parsedDxf.push({
      code: code,
      value: value,
    });
  }
  return parsedDxf;
};

export const parseBlockSection = (parsedDxf: CodedDxf[], section: string) => {
  const attributes: CodedDxf[][] = [];
  const entitiesIndexes = parsedDxf
    .map((item, index) => (item.code === "0" ? index : -1))
    .filter((index) => index !== -1);

  // Encontrar especificamente os ATTRIBs
  const attribIndexes = parsedDxf
    .map((item, index) =>
      item.code === "0" && item.value === section ? index : -1
    )
    .filter((index) => index !== -1);

  attribIndexes.forEach((attribStart) => {
    const nextEntityIndex = entitiesIndexes.find((idx) => idx > attribStart);
    const attribEnd = nextEntityIndex || parsedDxf.length;
    const attribData = parsedDxf.slice(attribStart, attribEnd);

    attributes.push(attribData);
  });

  return attributes;
};

export const getAttributedBlocks = (fileText: string) => {
  // 1. Dividir o texto em linhas
  const lines = fileText.split("\n");

  // 2. Encontrar índices das linhas que contêm *U
  const blockStartIndexes: number[] = [];
  lines.forEach((line, index) => {
    if (line.trim().startsWith("*U")) {
      blockStartIndexes.push(index - 1);
    }
  });

  // 3. Criar blocos: de cada *U até o próximo *U (ou final do arquivo)
  const blocks: {
    blockName: string;
    attributes: CodedDxf[][];
  }[] = [];
  for (let i = 0; i < blockStartIndexes.length; i++) {
    const startIndex = blockStartIndexes[i];
    const endIndex = blockStartIndexes[i + 1]
      ? blockStartIndexes[i + 1] - 1
      : lines.length;

    const blockLines = lines.slice(startIndex, endIndex);
    const parsedDxf = parseDxf(blockLines);

    const attributes = parseBlockSection(parsedDxf, "ATTRIB");
    if (attributes.length > 0) {
      const blockObj = {
        blockName: lines[startIndex + 1].trim(),
        attributes: attributes,
      };
      blocks.push(blockObj);
    }
  }
  return blocks;
};

export const getInsertsFromDxf = (fileText: string): DxfInsert[] => {
  const parser = new DxfParser();
  const sondagens: DxfInsert[] = [];

  try {
    const dxf = parser.parse(fileText) as DxfData;

    const inserts = dxf.entities;

    inserts.forEach((insert) => {
      const sondagem = {
        x: insert.position.x,
        y: insert.position.y,
        blockName: insert.name,
        layer: insert.layer,
      };
      sondagens.push(sondagem);
    });
    return sondagens;
  } catch (err) {
    console.error("Erro ao parsear DXF:", err);
    return sondagens;
  }
};
