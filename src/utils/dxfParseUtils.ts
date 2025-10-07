import DxfParser from "dxf-parser";
import type { DxfData } from "../types";

export interface CodedDxf {
  code: string;
  value: string;
}

export interface DxfInsert {
  x: number;
  y: number;
  blockName: string;
  layer: string;
  id?: string;
  attributes?: { tag: string | undefined; value: string | undefined }[];
}

export const detectDxfType = (fileText: string): "block" | "multileader" => {
  return fileText.includes("ATTRIB") ? "block" : "multileader";
};

export const parseDxf = (input: string | string[]) => {
  const blockLines = Array.isArray(input) ? input : input.split("\n");
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

export const extractMultileaders = (fileText: string) => {
  const parsed = parseDxf(fileText);
  const multileaders: Array<{
    x: number;
    y: number;
    layer: string;
    text: string;
  }> = [];

  // Encontrar índices onde começa MULTILEADER
  const mlIndexes = parsed
    .map((item, index) =>
      item.code === "0" && item.value === "MULTILEADER" ? index : -1
    )
    .filter((index) => index !== -1);

  mlIndexes.forEach((startIndex) => {
    // Procurar próxima entidade para delimitar
    const nextEntityIndex = parsed.findIndex(
      (item, idx) => idx > startIndex && item.code === "0"
    );
    const endIndex = nextEntityIndex !== -1 ? nextEntityIndex : parsed.length;

    // Extrair dados deste multileader
    const mlData = parsed.slice(startIndex, endIndex);
    const layer = mlData.find((item) => item.code === "8")?.value || "";
    const leaderLineStartIndex = mlData.findIndex((item) =>
      item.value.includes("LEADER_LINE")
    );
    const xItem =
      mlData.find(
        (item, index) => index > leaderLineStartIndex && item.code === "10"
      )?.value || "0";
    const yItem =
      mlData.find(
        (item, index) => index > leaderLineStartIndex && item.code === "20"
      )?.value || "0";
    const x = parseFloat(xItem);
    const y = parseFloat(yItem);
    const text = mlData.find((item) => item.code === "304")?.value || "";

    if (x && y && text) {
      multileaders.push({ x, y, layer, text });
    }
  });

  return multileaders;
};

export const getInsertsFromDxf = (fileText: string): DxfInsert[] => {
  const parser = new DxfParser();
  const sondagens: DxfInsert[] = [];

  try {
    const dxf = parser.parse(fileText) as DxfData;
    console.log("dxf: ", dxf);

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

export const getLayerColorsFromDxf = (fileText: string) => {
  const parser = new DxfParser();
  try {
    const dxf = parser.parse(fileText) as DxfData;
    const layersObj = dxf.tables.layer.layers;
    const layersArray = Object.values(layersObj);
    const styles = layersArray.map((l: any) => {
      return { layerName: l.name, color: l.color };
    });
    return styles;
  } catch (err) {
    console.error("Erro ao parsear DXF:", err);
  }
};
