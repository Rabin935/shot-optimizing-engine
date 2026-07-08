export type CourtPoint = {
  x: number;
  y: number;
};

export type CourtSize = {
  width: number;
  height: number;
};

export type CourtPixels = {
  x: number;
  y: number;
};

export const COURT_WIDTH_FT = 50;
export const COURT_LENGTH_FT = 47;
export const BASKET_LOCATION: CourtPoint = { x: 25, y: 5.25 };

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function calculateDistance(a: CourtPoint, b: CourtPoint) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return Math.sqrt(dx * dx + dy * dy);
}

export function clampPointToCourt(point: CourtPoint): CourtPoint {
  return {
    x: clamp(point.x, 0, COURT_WIDTH_FT),
    y: clamp(point.y, 0, COURT_LENGTH_FT),
  };
}

export function pointToPixels(point: CourtPoint, size: CourtSize): CourtPixels {
  return {
    x: (point.x / COURT_WIDTH_FT) * size.width,
    y: (point.y / COURT_LENGTH_FT) * size.height,
  };
}

export function pixelsToPoint(pixel: CourtPixels, size: CourtSize): CourtPoint {
  return clampPointToCourt({
    x: (pixel.x / size.width) * COURT_WIDTH_FT,
    y: (pixel.y / size.height) * COURT_LENGTH_FT,
  });
}

export function getFeetToPixelsScale(size: CourtSize) {
  const x = size.width / COURT_WIDTH_FT;
  const y = size.height / COURT_LENGTH_FT;

  return {
    average: (x + y) / 2,
    x,
    y,
  };
}

export function getMarkerBounds(size: CourtSize, markerSize: number) {
  return {
    bottom: Math.max(0, size.height - markerSize),
    left: 0,
    right: Math.max(0, size.width - markerSize),
    top: 0,
  };
}

export function clampMarkerPosition(
  position: CourtPixels,
  size: CourtSize,
  markerSize: number,
): CourtPixels {
  const bounds = getMarkerBounds(size, markerSize);

  return {
    x: clamp(position.x, bounds.left, bounds.right),
    y: clamp(position.y, bounds.top, bounds.bottom),
  };
}

export function pointToMarkerPosition(
  point: CourtPoint,
  size: CourtSize,
  markerSize: number,
): CourtPixels {
  const center = pointToPixels(clampPointToCourt(point), size);

  return clampMarkerPosition(
    {
      x: center.x - markerSize / 2,
      y: center.y - markerSize / 2,
    },
    size,
    markerSize,
  );
}

export function markerPositionToPoint(
  position: CourtPixels,
  size: CourtSize,
  markerSize: number,
): CourtPoint {
  const clampedPosition = clampMarkerPosition(position, size, markerSize);

  return pixelsToPoint(
    {
      x: clampedPosition.x + markerSize / 2,
      y: clampedPosition.y + markerSize / 2,
    },
    size,
  );
}
