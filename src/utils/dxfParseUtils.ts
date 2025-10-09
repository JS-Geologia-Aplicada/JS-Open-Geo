import DxfParser from "dxf-parser";
import type { DxfData } from "../types";

export interface CodedDxf {
  code: string;
  value: string;
}

export interface CodedDxfSection {
  index: number;
  codedDxf: CodedDxf[];
}

export interface DxfAttribute {
  tag: string;
  value: string;
  valueIndex: number;
}

export interface DxfInsert {
  x: number;
  y: number;
  blockName: string;
  layer: string;
  id?: string;
  idIndex?: number;
  attributes?: DxfAttribute[];
}

export type CardinalDirection = "N-S" | "O-E" | "S-N" | "E-O";

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

export const parseBlockSection = (
  parsedDxf: CodedDxf[],
  section: string,
  baseNumber: number = 0
) => {
  const attributeSections: CodedDxfSection[] = [];
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
    const attribData = {
      index: attribStart + baseNumber,
      codedDxf: parsedDxf.slice(attribStart, attribEnd),
    };

    attributeSections.push(attribData);
  });

  const attributes: DxfAttribute[] = [];
  attributeSections.forEach((section) => {
    const tag = section.codedDxf.find((a) => a.code === "2")?.value;
    const value = section.codedDxf.find((a) => a.code === "1")?.value;
    const valueIndex =
      section.codedDxf.findIndex((a) => a.code === "1") + section.index;
    if (tag && value) {
      attributes.push({
        tag: tag,
        value: value,
        valueIndex: valueIndex,
      });
    }
  });

  return attributes;
};

export const getAttributedBlocks = (parsed: CodedDxf[]) => {
  const blockStartIndexes: number[] = [];
  parsed.forEach((entry, index) => {
    if (entry.value.trim().startsWith("*U")) {
      blockStartIndexes.push(index);
    }
  });

  const blocks: {
    blockName: string;
    attributes: DxfAttribute[];
  }[] = [];
  for (let i = 0; i < blockStartIndexes.length; i++) {
    const startIndex = blockStartIndexes[i];
    const endIndex = blockStartIndexes[i + 1]
      ? blockStartIndexes[i + 1]
      : parsed.length;

    const parsedBlocks = parsed.slice(startIndex, endIndex);

    const attributes = parseBlockSection(parsedBlocks, "ATTRIB", startIndex);
    if (attributes.length > 0) {
      const blockObj = {
        blockName: parsed[startIndex].value.trim(),
        attributes: attributes,
      };
      blocks.push(blockObj);
    }
  }
  return blocks;
};

export const extractMultileaders = (parsed: CodedDxf[]) => {
  const multileaders: Array<{
    x: number;
    y: number;
    layer: string;
    text: string;
    textIndex: number;
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
    const textIndex =
      startIndex + mlData.findIndex((item) => item.code === "304");

    if (x && y && text) {
      multileaders.push({ x, y, layer, text, textIndex });
    }
  });

  return multileaders;
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

export const reconstructDxf = (parsed: CodedDxf[]): string => {
  return parsed.map((item) => `${item.code}\n${item.value}`).join("\n");
};

export const sortByDirection = (
  data: DxfInsert[],
  direction: CardinalDirection
): DxfInsert[] => {
  return data.sort((a, b) => {
    switch (direction) {
      case "N-S":
        return b.y - a.y; // Maior Y primeiro (norte para sul)
      case "S-N":
        return a.y - b.y; // Menor Y primeiro (sul para norte)
      case "O-E":
        return a.x - b.x; // Menor X primeiro (oeste para leste)
      case "E-O":
        return b.x - a.x; // Maior X primeiro (leste para oeste)
    }
  });
};

export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const group = String(item[key]);
    if (!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {} as Record<string, T[]>);
};
