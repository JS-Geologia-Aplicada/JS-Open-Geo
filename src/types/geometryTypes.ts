export interface Point {
  x: number;
  y: number;
}

export interface LineString {
  points: Point[];
}

export interface SegmentInfo {
  start: Point;
  end: Point;
}

export interface NearestPointResult {
  point: Point;
  distance: number;
  segment: SegmentInfo;
}

export type Side = "Right" | "Left" | "On";

export interface DistanceResult {
  name: string;
  x: number;
  y: number;
  layer: string;
  distance: number;
  side: Side;
}
