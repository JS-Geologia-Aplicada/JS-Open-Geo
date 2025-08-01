import type { TextItem } from "react-pdf";
import type {
  Area,
  HorizontalLine,
  PageTextData,
  SelectionArea,
} from "../types";

const SELECTION_THRESHOLD = 3;

// Converte as coordenadas na página para o pdf
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

// Filtra os objetos de texto, retornando apenas aqueles em uma área dada
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

// Função para tratar especificamente NSPT
export const nsptToString = (items: TextItem[]) => {
  const validNspts = items.filter((item) => {
    const trimmed = item.str.trim();
    return isNumber(trimmed) || trimmed === "-";
  });

  if (validNspts.length === 0) {
    return [];
  }

  const numberItems = validNspts.filter((item) => isNumber(item.str.trim()));

  // Se tem poucos números pra calcular threshold, retorna tudo simples
  if (numberItems.length < 2) {
    return validNspts.map((item) => item.str.trim());
  }

  const distances = [];
  for (let i = 0; i + 1 < numberItems.length; i++) {
    distances.push(
      Math.abs(numberItems[i].transform[5] - numberItems[i + 1].transform[5])
    );
  }
  distances.sort((a, b) => a - b);
  const nsptThreshold =
    numberItems.length < 4
      ? numberItems[0].height * 1.2 // Usa altura da linha quando são 2 ou 3 itens
      : distances[distances.length - 1] - distances[0] <= distances[0] * 1.2
      ? 0
      : distances[0] * 1.1; // Usa menor distância quando há pelo menos 4 itens

  const nsptArr: string[] = [];
  const incompleteNspt: string[] = [];

  validNspts.forEach((item, index) => {
    // se tiver iniciado uma fração, completar e retornar
    if (incompleteNspt.length > 0) {
      incompleteNspt.push(item.str.trim());
      nsptArr.push(incompleteNspt.join("/"));
      incompleteNspt.length = 0;
      return;
    }

    // se for hífen, só adicionar
    if (item.str.trim() === "-") {
      nsptArr.push(item.str.trim());
      return;
    }

    // se não for o último item da lista e a distância para o próximo for curta, adicionar aos incompletos e retornar
    if (
      index + 1 < validNspts.length &&
      Math.abs(item.transform[5] - validNspts[index + 1].transform[5]) <=
        nsptThreshold
    ) {
      incompleteNspt.push(item.str.trim());
      return;
    }
    nsptArr.push(item.str.trim());
  });

  // Processar qualquer NSPT incompleto restante
  if (incompleteNspt.length > 0) {
    nsptArr.push(incompleteNspt.join("/"));
  }

  return nsptArr;
};

// Função que recebe uma array de TextItem e retorna como array de textos, considerando particularidades como textos multilinha e a formatação de NSPT
export const textItemToString = (
  items: TextItem[],
  horizontalLines: HorizontalLine[]
) => {
  const incompleteTexts = Array<string>();
  const textArr = Array<string>();
  let startedNspt = false;

  // Loop para organizar os textos na array
  items.forEach((item, index) => {
    if (item.str.trim() == "") return;

    const lineThreshold = item.height * 1.5;

    if (startedNspt) {
      incompleteTexts.push(item.str.trim());
      const joinedTexts = incompleteTexts.join("/");
      textArr.push(joinedTexts);
      incompleteTexts.length = 0;
      startedNspt = false;
      return;
    }
    // Série de verificações realizadas apenas para itens que não sejam o último da área selecionada
    if (index < items.length - 1) {
      // Cria um retângulo imaginário entre o texto atul e o próximo, ocupando os 60% centrais da linha para não colidir com elementos na beirada
      const areaToNextItem: SelectionArea = {
        x: item.transform[4] + item.width / 5,
        y: item.transform[5] - item.height / 2,
        width: item.width * (3 / 5),
        height: Math.min(
          Math.abs(item.transform[5] - items[index + 1].transform[5]),
          item.height / 2
        ),
      };
      // Cria um retângulo imaginário abaixo do texto, de altura limitada, ocupando os 60% centrais de sua largura

      const areaBelowItem: SelectionArea = {
        x: item.transform[4] + item.width / 5, // 20% margem esquerda
        width: item.width * (3 / 5), // 60% largura central
        y: item.transform[5] - item.height, // começa no meio do texto
        height: item.height, // metade da altura do texto
      };

      // Se a próxima linha está a uma distância menor que o limite de 1,5 * altura da linha e não há uma linha horizontal antes da próxima linha, o texto atual será adicionado a uma array de textos imcompletos
      if (
        Math.abs(item.transform[5] - items[index + 1].transform[5]) <=
          lineThreshold &&
        !areaHasHorizontalLines(areaToNextItem, horizontalLines)
      ) {
        incompleteTexts.push(item.str.trim());
      } else if (
        // Verificando caso específico de NSPT
        areaHasHorizontalLines(areaBelowItem, horizontalLines, true) &&
        isNumber(item.str.trim()) &&
        isNextValidStringNumber(items, index) &&
        Math.abs(item.transform[5] - items[index + 1].transform[5]) <=
          lineThreshold &&
        incompleteTexts.length < 1
      ) {
        incompleteTexts.push(item.str.trim());
        startedNspt = true;
      } else if (incompleteTexts.length > 0) {
        // Se a próxima linha está distante ou existe uma linha horizontal, verifica se existem textos incompletos, e, se existirem, agrupa com o atual e junta na array de textos
        incompleteTexts.push(item.str.trim());
        const joinedTexts = incompleteTexts.join(" ");
        textArr.push(joinedTexts);
        incompleteTexts.length = 0;
      } else {
        textArr.push(item.str.trim());
      }
    } else {
      // Caso seja o último item, junta na array de textos incompletos e junta tudo na array de textos
      incompleteTexts.push(item.str.trim());
      const joinedTexts = incompleteTexts.join(" ");
      textArr.push(joinedTexts);
      incompleteTexts.length = 0;
    }
  });
  // se o loop terminar e tiverem itens na array de textos incompletos, eles são adicionados à array de textos
  if (incompleteTexts.length > 0) {
    textArr.push(incompleteTexts.join(" "));
  }
  return textArr;
};

// Combinação das funções Math.max e Math.min
export const clamp = (value: number, min: number, max: number) => {
  return Math.max(Math.min(value, max), min);
};

// Verifica a existência de linhas horizontais em uma área
export const areaHasHorizontalLines = (
  area: SelectionArea,
  horizontalLines: HorizontalLine[],
  onlyShortLine: boolean = false
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
      line.y <= areaYMax &&
      (Math.abs(line.x2 - line.x1) <= 15 || !onlyShortLine)
  );
};

// Verifica se uma string representa um número
const isNumber = (str: string): boolean => {
  return /^\d+(\.\d+)?$/.test(str.trim());
};

// Checando se o próximo texto não vazio é número
const isNextValidStringNumber = (
  items: TextItem[],
  currentIndex: number
): boolean => {
  for (let i = currentIndex + 1; i < items.length; i++) {
    const text = items[i].str.trim();

    if (!text.trim()) {
      continue; // pula strings vazias
    }

    // Primeira string não-vazia encontrada
    return isNumber(text);
  }

  return false; // não achou nenhuma string não-vazia
};

export const parseNumber = (str: string, fallback: number = 0): number => {
  if (!str) return 0;
  const cleanStr = str.trim().replaceAll(".", "").replace(",", ".");
  return parseFloat(cleanStr) || fallback;
};

export const createTypeToAreaNameMap = (areas: Area[]): Map<string, string> => {
  const typeToAreaName = new Map<string, string>();
  areas.forEach((area) => {
    if (area.dataType) {
      typeToAreaName.set(area.dataType, area.name);
    }
  });
  return typeToAreaName;
};

export const getSingleValueFromEntry = (
  entry: PageTextData,
  typeToAreaName: Map<string, string>,
  dataType: string
): string => {
  const areaName = typeToAreaName.get(dataType);
  if (!areaName || !entry[areaName]) return dataType === "z" ? "0" : "";
  return entry[areaName][0] as string;
};

export const getMultipleValuesFromEntry = (
  entry: PageTextData,
  typeToAreaName: Map<string, string>,
  dataType: string
): string[] => {
  const areaName = typeToAreaName.get(dataType);
  if (!areaName || !entry[areaName]) return [];
  return entry[areaName] as string[];
};

export const getMaxDepth = (
  entry: PageTextData,
  typeToAreaName: Map<string, string>
): number => {
  // Tentar pegar depth específico primeiro
  const depthAreaName = typeToAreaName.get("depth");
  if (depthAreaName && entry[depthAreaName]) {
    return parseNumber(entry[depthAreaName][0] as string);
  }

  // Fallback: calcular do depth_from_to
  const depthFromToAreaName = typeToAreaName.get("depth_from_to");
  if (depthFromToAreaName && entry[depthFromToAreaName]) {
    const depths = entry[depthFromToAreaName] as string[];
    return Math.max(...depths.map((d) => parseNumber(d)));
  }

  return 0;
};
