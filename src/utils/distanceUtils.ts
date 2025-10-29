import * as math from "mathjs";
import type { DxfPolyline } from "./dxfParseUtils";
import type { Side } from "@/types/geometryTypes";
import type {
  LineString,
  NearestPointResult,
  Point,
  SegmentInfo,
} from "@/types/geometryTypes";

export const subdivideArc = (
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  bulge: number,
  maxError: number,
  result: { x: number; y: number }[] = []
) => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const chord = Math.sqrt(dx * dx + dy * dy);
  const sagitta = Math.abs((bulge * chord) / 2);

  if (sagitta < maxError) {
    result.push(p1);
    return result;
  }
  const arcMidpoint = {
    // midpoint da corda + vetor unitário perpendicular * sagitta (deduzido)
    x: (p1.x + p2.x) / 2 + (dy * bulge) / 2,
    y: (p1.y + p2.y) / 2 - (dx * bulge) / 2,
  };

  const newBulge = bulge / (1 + Math.sqrt(1 + bulge * bulge));

  subdivideArc(p1, arcMidpoint, newBulge, maxError, result);
  subdivideArc(arcMidpoint, p2, newBulge, maxError, result);
  return result;
};

/**
 * Converte DxfPolyline em LineString
 * @param polylines array de polylines do DXF
 * @param maxError erro máximo ao converter arcos em segmentos de reta
 */
export const plToLineString = (
  polylines: DxfPolyline[],
  maxError: number = 1
): LineString[] => {
  const polylinesAsCoordinates: LineString[] = [];
  polylines.forEach((pl) => {
    const points: Point[] = [];
    pl.vertices.forEach((vertex, i) => {
      if (!vertex.bulge || i === pl.vertices.length - 1)
        points.push({ x: vertex.x, y: vertex.y });
      else {
        const nextVertex = pl.vertices[i + 1];
        const dividedVertices = subdivideArc(
          vertex,
          nextVertex,
          vertex.bulge,
          maxError
        );
        dividedVertices.forEach((v) => points.push({ x: v.x, y: v.y }));
      }
    });
    polylinesAsCoordinates.push({ points });
  });

  return polylinesAsCoordinates;
};

/**
 * Tenta unir LineStrings conectadas em sequências contínuas
 */
export const mergeConnectedLineStrings = (
  lineStrings: LineString[]
): LineString[] => {
  if (lineStrings.length === 0) return [];
  if (lineStrings.length === 1) return lineStrings;

  const merged: LineString[] = [];
  const used = new Set<number>(); // Índices já processados

  for (let i = 0; i < lineStrings.length; i++) {
    if (used.has(i)) continue;

    // Começar uma nova cadeia
    let currentCoords = [...lineStrings[i].points];
    used.add(i);

    let foundConnection = true;

    // Continuar procurando conexões
    while (foundConnection) {
      foundConnection = false;

      for (let j = 0; j < lineStrings.length; j++) {
        if (used.has(j)) continue;

        const candidateCoords = lineStrings[j].points;
        const currentStart = currentCoords[0];
        const currentEnd = currentCoords[currentCoords.length - 1];
        const candidateStart = candidateCoords[0];
        const candidateEnd = candidateCoords[candidateCoords.length - 1];

        const tolerance = 0.01; // Tolerância para considerar pontos iguais

        // Caso 1: Fim da atual conecta com início da candidata
        if (pointsEqual(currentEnd, candidateStart, tolerance)) {
          currentCoords = [...currentCoords, ...candidateCoords.slice(1)];
          used.add(j);
          foundConnection = true;
          break;
        }

        // Caso 2: Fim da atual conecta com fim da candidata (invertida)
        if (pointsEqual(currentEnd, candidateEnd, tolerance)) {
          currentCoords = [
            ...currentCoords,
            ...candidateCoords.slice(0, -1).reverse(),
          ];
          used.add(j);
          foundConnection = true;
          break;
        }

        // Caso 3: Início da atual conecta com fim da candidata
        if (pointsEqual(currentStart, candidateEnd, tolerance)) {
          currentCoords = [...candidateCoords, ...currentCoords.slice(1)];
          used.add(j);
          foundConnection = true;
          break;
        }

        // Caso 4: Início da atual conecta com início da candidata (invertida)
        if (pointsEqual(currentStart, candidateStart, tolerance)) {
          currentCoords = [
            ...candidateCoords.slice(0, -1).reverse(),
            ...currentCoords,
          ];
          used.add(j);
          foundConnection = true;
          break;
        }
      }
    }

    // Adicionar cadeia finalizada
    merged.push({ points: currentCoords });
  }

  return merged;
};

/**
 * Verifica se dois pontos são iguais dentro de uma tolerância
 */
const pointsEqual = (p1: Point, p2: Point, tolerance: number): boolean => {
  return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance;
};

export type CardinalOrdinalDirection =
  | "N→S"
  | "S→N"
  | "E→O"
  | "O→E"
  | "NE→SO"
  | "SO→NE"
  | "NO→SE"
  | "SE→NO";

/**
 * Calcula a direção cardinal baseada no ângulo entre dois pontos
 * Usa arcos de 40° para cardeais principais e 50° para intermediárias
 */
export const getCardinalDirection = (
  start: Point,
  end: Point
): CardinalOrdinalDirection => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  // Ângulo em graus (0° = Leste, 90° = Norte, sentido anti-horário)
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  // Normalizar para 0-360
  if (angle < 0) angle += 360;

  if (angle >= 10 && angle < 80) {
    return "SO→NE";
  } else if (angle < 100) {
    return "S→N";
  } else if (angle < 170) {
    return "SE→NO";
  } else if (angle < 190) {
    return "E→O";
  } else if (angle < 260) {
    return "NE→SO";
  } else if (angle < 280) {
    return "N→S";
  } else if (angle < 350) {
    return "NO→SE";
  } else {
    return "O→E";
  }
};

/**
 * Inverte uma direção cardinal
 */
export const invertDirection = (
  dir: CardinalOrdinalDirection
): CardinalOrdinalDirection => {
  const map: Record<CardinalOrdinalDirection, CardinalOrdinalDirection> = {
    "N→S": "S→N",
    "S→N": "N→S",
    "E→O": "O→E",
    "O→E": "E→O",
    "NE→SO": "SO→NE",
    "SO→NE": "NE→SO",
    "NO→SE": "SE→NO",
    "SE→NO": "NO→SE",
  };
  return map[dir];
};

export const getPointSideFromLine = (
  segment: SegmentInfo,
  point: Point
): Side => {
  const matrix = [
    [1, segment.start.x, segment.start.y],
    [1, segment.end.x, segment.end.y],
    [1, point.x, point.y],
  ];
  const determinant = math.det(matrix);

  return determinant === 0 ? "On" : determinant > 0 ? "Left" : "Right";
};

export const pointsDistance = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const getLineSegments = (line: LineString): SegmentInfo[] => {
  const segments: SegmentInfo[] = [];
  const points = line.points;

  for (let i = 0; i < points.length - 1; i++) {
    const seg = {
      start: points[i],
      end: points[i + 1],
    };
    segments.push(seg);
  }
  return segments;
};

export const getLineLength = (line: LineString): number => {
  const segments = getLineSegments(line);
  let totalLength = 0;
  segments.forEach((seg) => {
    totalLength += pointsDistance(seg.start, seg.end);
  });
  return totalLength;
};

/**
 * Encontra o ponto mais próximo em uma LineString
 */
export const nearestPointOnLine = (
  line: LineString,
  point: Point
): NearestPointResult => {
  let minDistance = Infinity;
  let nearestPoint: Point = line.points[0];
  const segments = getLineSegments(line);
  let nearestSegment = segments[0];

  // Para cada segmento
  for (let i = 0; i < segments.length; i++) {
    const closestOnSegment = closestPointOnSegment(point, segments[i]);
    const distance = pointsDistance(point, closestOnSegment);

    if (distance < minDistance) {
      minDistance = distance;
      nearestPoint = closestOnSegment;
      nearestSegment = segments[i];
    }
  }

  return {
    point: nearestPoint,
    distance: minDistance,
    segment: nearestSegment,
  };
};

/**
 * Encontra o ponto mais próximo em um segmento
 */
const closestPointOnSegment = (point: Point, segment: SegmentInfo): Point => {
  const dx = segment.end.x - segment.start.x;
  const dy = segment.end.y - segment.start.y;
  const px = point.x - segment.start.x;
  const py = point.y - segment.start.y;

  // Se segmento é um ponto
  if (dx === 0 && dy === 0) {
    return segment.start;
  }

  // Parâmetro t [0, 1] - posição no segmento
  const t = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy)));

  // Ponto no segmento
  return {
    x: segment.start.x + t * dx,
    y: segment.start.y + t * dy,
  };
};

export const reverseLineString = (line: LineString): LineString => {
  return {
    points: [...line.points].reverse(),
  };
};
